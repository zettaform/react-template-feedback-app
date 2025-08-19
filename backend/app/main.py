from fastapi import FastAPI, HTTPException, Depends, status, Request, Response
from starlette.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
from datetime import timedelta
from passlib.context import CryptContext
from .database import (
    create_user_row,
    get_user_by_username,
    get_user_by_email,
    update_hashed_password,
    update_avatar,
    list_all_users,
    allowed_avatars,
    mark_onboarding_completed,
    create_feedback,
    list_all_feedback,
)
from .models import UserCreate, UserPublic, FeedbackCreate, FeedbackPublic
from .auth import (
    get_password_hash,
    authenticate_user as auth_authenticate_user,
    create_access_token as auth_create_access_token,
    get_current_user as auth_get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES as AUTH_TOKEN_EXPIRE_MINUTES,
)

# Initialize FastAPI app
app = FastAPI(title="Authentication API")

# Configure CORS
"""
CORS configuration
Uses env var CORS_ORIGINS as a comma-separated list of allowed origins.
Examples:
  CORS_ORIGINS="https://your-site.netlify.app,https://www.your-site.com"
If unset, defaults to "*" for development.
"""
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "").strip()
_origins = [o.strip() for o in CORS_ORIGINS.split(",") if o.strip()]
ALLOWED_ORIGINS = _origins if _origins else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Handle preflight requests
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    response = await call_next(request)
    if request.method == "OPTIONS":
        # Mirror the configured CORS origins for preflight responses
        request_origin = request.headers.get("origin", "")
        if "*" in ALLOWED_ORIGINS:
            response.headers["Access-Control-Allow-Origin"] = "*"
        elif request_origin in ALLOWED_ORIGINS:
            response.headers["Access-Control-Allow-Origin"] = request_origin
        elif ALLOWED_ORIGINS:
            response.headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGINS[0]
        response.headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.status_code = 200
    return response

# Security configurations
SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-prod")  # In production, set via env var
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Pydantic response and request models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class AvatarUpdateRequest(BaseModel):
    avatar: str

# Helper functions
def get_user(username: str):
    # Delegate to database helper
    return get_user_by_username(username)

def create_user(username: str, email: str, password: str, full_name: Optional[str] = None, avatar: Optional[str] = None, disabled: bool = False):
    # Use centralized helpers for hashing and CSV writes
    try:
        hashed = get_password_hash(password)
        created = create_user_row(
            username=username,
            email=email,
            full_name=full_name,
            hashed_password=hashed,
            disabled=disabled,
            avatar=avatar,
        )
        # Return dict compatible with public schema
        return UserPublic(
            username=created.username,
            email=created.email,
            full_name=created.full_name,
            disabled=created.disabled,
            avatar=created.avatar,
            onboarding_completed=created.onboarding_completed,
        )
    except ValueError as e:
        # Duplicate username/email
        raise HTTPException(status_code=400, detail=str(e))

def authenticate_user(username: str, password: str):
    # Delegate to auth module
    return auth_authenticate_user(username, password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    # Delegate to auth module
    return auth_create_access_token(data, expires_delta)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    # Delegate to auth module (keep same dependency signature)
    return await auth_get_current_user(token)

# Seed admin user on startup
@app.on_event("startup")
async def seed_admin_user():
    try:
        existing = get_user_by_username("admin")
        if not existing:
            # Create a default admin user
            create_user(
                username="admin",
                email="admin@example.com",
                password="admin",
                full_name="Administrator",
            )
    except Exception:
        # Avoid crashing app on startup if file system not ready; log in real app
        pass

# Routes
@app.post("/signup", response_model=UserPublic)
async def signup(user: UserCreate):
    user_data = create_user(
        username=user.username,
        email=user.email,
        password=user.password,
        full_name=user.full_name,
        avatar=user.avatar,
    )
    return user_data

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=AUTH_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me/", response_model=UserPublic)
async def read_users_me(current_user: UserPublic = Depends(get_current_user)):
    return current_user

# Mark onboarding complete for current user
@app.post("/users/me/onboarding-complete")
async def complete_onboarding(current_user: UserPublic = Depends(get_current_user)):
    ok = mark_onboarding_completed(current_user.username)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to mark onboarding complete")
    updated = get_user_by_username(current_user.username)
    return UserPublic(
        username=updated.username,
        email=updated.email,
        full_name=updated.full_name,
        disabled=updated.disabled,
        avatar=updated.avatar,
        onboarding_completed=updated.onboarding_completed,
    )

@app.post("/users/change-password")
async def change_password(payload: ChangePasswordRequest, current_user: UserPublic = Depends(get_current_user)):
    # Verify current password
    user_ok = authenticate_user(current_user.username, payload.current_password)
    if not user_ok:
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    # Hash and persist new password
    new_hashed = get_password_hash(payload.new_password)
    if not update_hashed_password(current_user.username, new_hashed):
        raise HTTPException(status_code=500, detail="Failed to update password")

    return {"message": "Password updated successfully"}

# Admin-only: list all users
@app.get("/admin/users", response_model=List[UserPublic])
async def admin_list_users(current_user: UserPublic = Depends(get_current_user)):
    if current_user.username != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    users_in_db = list_all_users()
    # Map to public schema (exclude hashed_password)
    return [
        UserPublic(
            username=u.username,
            email=u.email,
            full_name=u.full_name,
            disabled=u.disabled,
            avatar=u.avatar,
            onboarding_completed=u.onboarding_completed,
        )
        for u in users_in_db
    ]

# Admin-only: create a user
class AdminCreateUserRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    disabled: Optional[bool] = False
    avatar: Optional[str] = None

@app.post("/admin/users", response_model=UserPublic, status_code=201)
async def admin_create_user(payload: AdminCreateUserRequest, current_user: UserPublic = Depends(get_current_user)):
    if current_user.username != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    created = create_user(
        username=payload.username,
        email=payload.email,
        password=payload.password,
        full_name=payload.full_name,
        disabled=bool(payload.disabled) if payload.disabled is not None else False,
        avatar=payload.avatar,
    )
    return UserPublic(
        username=created.username,
        email=created.email,
        full_name=created.full_name,
        disabled=created.disabled,
        avatar=created.avatar,
        onboarding_completed=created.onboarding_completed,
    )

# Avatars: list allowed
@app.get("/avatars", response_model=List[str])
async def get_avatars():
    return allowed_avatars()

# Change current user's avatar
@app.put("/users/me/avatar", response_model=UserPublic)
async def update_my_avatar(payload: AvatarUpdateRequest, current_user: UserPublic = Depends(get_current_user)):
    if payload.avatar not in allowed_avatars():
        raise HTTPException(status_code=400, detail="Invalid avatar selection")
    ok = update_avatar(current_user.username, payload.avatar)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to update avatar")
    # Return updated user
    updated = get_user_by_username(current_user.username)
    return UserPublic(
        username=updated.username,
        email=updated.email,
        full_name=updated.full_name,
        disabled=updated.disabled,
        avatar=updated.avatar,
        onboarding_completed=updated.onboarding_completed,
    )

# Feedback endpoints
@app.post("/feedback", response_model=dict)
def submit_feedback(feedback: FeedbackCreate, current_user: UserPublic = Depends(get_current_user)):
    """Submit feedback from authenticated user."""
    if feedback.rating < 1 or feedback.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    if not feedback.message.strip():
        raise HTTPException(status_code=400, detail="Feedback message cannot be empty")
    
    feedback_id = create_feedback(
        username=current_user.username,
        rating=feedback.rating,
        message=feedback.message.strip()
    )
    
    return {"message": "Feedback submitted successfully", "feedback_id": feedback_id}


@app.get("/admin/feedback", response_model=List[FeedbackPublic])
def admin_list_feedback(current_user: UserPublic = Depends(get_current_user)):
    """Admin-only: List all feedback entries."""
    if current_user.username != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return list_all_feedback()

# Health check endpoint
@app.get("/")
def root():
    return {"message": "Authentication API is running"}

# Static files: serve avatar images from the repo's public/dbz directory
try:
    import os as _os
    BASE_DIR = _os.path.dirname(_os.path.abspath(__file__))
    AVATAR_DIR = _os.path.join(_os.path.dirname(_os.path.dirname(BASE_DIR)), 'public', 'dbz')
    if _os.path.isdir(AVATAR_DIR):
        app.mount("/dbz", StaticFiles(directory=AVATAR_DIR), name="dbz")
except Exception:
    # Don't crash if path not available; avatars list will be empty in that case
    pass

# Fallback: if static directory is not available in Render build, redirect avatar requests to DiceBear
@app.get("/dbz/{filename}")
def get_avatar(filename: str):
    # Strip extension to create a stable seed
    seed = filename.rsplit('.', 1)[0]
    dicebear_url = f"https://api.dicebear.com/7.x/adventurer/png?seed={seed}&size=128"
    return RedirectResponse(url=dicebear_url, status_code=302)
