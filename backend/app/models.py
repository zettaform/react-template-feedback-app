from pydantic import BaseModel, EmailStr
from typing import Optional


# Shared properties
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    avatar: Optional[str] = None


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str


# Properties stored in DB (including hashed password)
class UserInDB(UserBase):
    hashed_password: str
    disabled: bool = False
    onboarding_completed: bool = False


# Properties to return to client (public)
class UserPublic(UserBase):
    disabled: bool = False
    onboarding_completed: bool = False


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# Feedback models
class FeedbackCreate(BaseModel):
    rating: int
    message: str


class FeedbackPublic(BaseModel):
    id: str
    username: str
    rating: int
    message: str
    timestamp: str
