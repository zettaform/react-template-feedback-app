import os
import csv
import uuid
from datetime import datetime
from typing import Optional, List
from .models import UserInDB, FeedbackPublic

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), 'data')
USERS_FILE = os.path.join(DATA_DIR, 'users.csv')
FEEDBACK_FILE = os.path.join(DATA_DIR, 'feedback.csv')

USER_FIELDS = ['username', 'email', 'full_name', 'hashed_password', 'disabled', 'avatar', 'onboarding_completed']
FEEDBACK_FIELDS = ['id', 'username', 'rating', 'message', 'timestamp']


def _ensure_data_file() -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(USERS_FILE) or os.path.getsize(USERS_FILE) == 0:
        with open(USERS_FILE, mode='w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=USER_FIELDS)
            writer.writeheader()


def _ensure_feedback_file() -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(FEEDBACK_FILE) or os.path.getsize(FEEDBACK_FILE) == 0:
        with open(FEEDBACK_FILE, mode='w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=FEEDBACK_FIELDS)
            writer.writeheader()


def get_user_by_username(username: str) -> Optional[UserInDB]:
    if not os.path.exists(USERS_FILE) or os.path.getsize(USERS_FILE) == 0:
        return None
    with open(USERS_FILE, mode='r', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('username') == username:
                return UserInDB(
                    username=row.get('username', ''),
                    email=row.get('email', ''),
                    full_name=row.get('full_name') or None,
                    hashed_password=row.get('hashed_password', ''),
                    disabled=(str(row.get('disabled', 'False')).lower() == 'true'),
                    avatar=row.get('avatar') or random_avatar(),
                    onboarding_completed=(str(row.get('onboarding_completed', 'False')).lower() == 'true'),
                )
    return None


def get_user_by_email(email: str) -> Optional[UserInDB]:
    if not os.path.exists(USERS_FILE) or os.path.getsize(USERS_FILE) == 0:
        return None
    with open(USERS_FILE, mode='r', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('email') == email:
                return UserInDB(
                    username=row.get('username', ''),
                    email=row.get('email', ''),
                    full_name=row.get('full_name') or None,
                    hashed_password=row.get('hashed_password', ''),
                    disabled=(str(row.get('disabled', 'False')).lower() == 'true'),
                    avatar=row.get('avatar') or random_avatar(),
                    onboarding_completed=(str(row.get('onboarding_completed', 'False')).lower() == 'true'),
                )
    return None


def random_avatar() -> str:
    """Return a random DBZ avatar filename (e.g., goku.png)."""
    # Hard-coded list keeps backend independent of assets path
    avatars = [
        'goku.png','vegeta.png','gohan.png','piccolo.png','trunks.png','goten.png','krillin.png','android18.png',
        'frieza.png','cell.png','majin_buu.png','beerus.png','whis.png','broly.png','tien.png','yamcha.png',
        'nappa.png','raditz.png','zarbon.png','dodoria.png','ginyu.png','recoome.png','burter.png','jeice.png',
        'hit.png','jiren.png','toppo.png','caulifla.png','kale.png','cabba.png','zamasu.png','goku_black.png'
    ]
    import random
    return random.choice(avatars)


def create_user_row(*, username: str, email: str, full_name: Optional[str], hashed_password: str, disabled: bool = False, avatar: Optional[str] = None, onboarding_completed: bool = False) -> UserInDB:
    _ensure_data_file()
    # Prevent duplicates by username or email
    if get_user_by_username(username) is not None:
        raise ValueError('Username already exists')
    if get_user_by_email(email) is not None:
        raise ValueError('Email already exists')

    row = {
        'username': username,
        'email': email,
        'full_name': full_name or '',
        'hashed_password': hashed_password,
        'disabled': 'True' if disabled else 'False',
        'avatar': avatar or random_avatar(),
        'onboarding_completed': 'True' if onboarding_completed else 'False',
    }
    with open(USERS_FILE, mode='a', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=USER_FIELDS)
        # If file is empty, DictWriter will not auto-write headers, so ensure file has them
        if os.path.getsize(USERS_FILE) == 0:
            writer.writeheader()
        writer.writerow(row)

    return UserInDB(
        username=username,
        email=email,
        full_name=full_name,
        hashed_password=hashed_password,
        disabled=disabled,
        avatar=row['avatar'],
        onboarding_completed=onboarding_completed,
    )


def update_hashed_password(username: str, new_hashed_password: str) -> bool:
    """Update a user's hashed password in the CSV. Returns True if updated, False if not found."""
    _ensure_data_file()
    if not os.path.exists(USERS_FILE) or os.path.getsize(USERS_FILE) == 0:
        return False

    updated = False
    rows = []
    with open(USERS_FILE, mode='r', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('username') == username:
                row['hashed_password'] = new_hashed_password
                updated = True
            rows.append(row)

    if updated:
        with open(USERS_FILE, mode='w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=USER_FIELDS)
            writer.writeheader()
            writer.writerows(rows)

    return updated


def update_avatar(username: str, new_avatar: str) -> bool:
    """Update user's avatar filename. Returns True on success."""
    _ensure_data_file()
    if not os.path.exists(USERS_FILE) or os.path.getsize(USERS_FILE) == 0:
        return False
    rows = []
    updated = False
    with open(USERS_FILE, mode='r', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('username') == username:
                row['avatar'] = new_avatar
                updated = True
            rows.append(row)
    if updated:
        with open(USERS_FILE, mode='w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=USER_FIELDS)
            writer.writeheader()
            writer.writerows(rows)
    return updated


def mark_onboarding_completed(username: str) -> bool:
    """Set onboarding_completed to True for given user."""
    _ensure_data_file()
    if not os.path.exists(USERS_FILE) or os.path.getsize(USERS_FILE) == 0:
        return False
    updated = False
    rows = []
    with open(USERS_FILE, mode='r', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('username') == username:
                row['onboarding_completed'] = 'True'
                updated = True
            rows.append(row)
    if updated:
        with open(USERS_FILE, mode='w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=USER_FIELDS)
            writer.writeheader()
            writer.writerows(rows)
    return updated


def list_all_users():
    """Return a list of all users as UserInDB objects."""
    _ensure_data_file()
    users = []
    if not os.path.exists(USERS_FILE) or os.path.getsize(USERS_FILE) == 0:
        return users
    with open(USERS_FILE, mode='r', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            users.append(
                UserInDB(
                    username=row.get('username', ''),
                    email=row.get('email', ''),
                    full_name=row.get('full_name') or None,
                    hashed_password=row.get('hashed_password', ''),
                    disabled=(str(row.get('disabled', 'False')).lower() == 'true'),
                    avatar=row.get('avatar') or random_avatar(),
                    onboarding_completed=(str(row.get('onboarding_completed', 'False')).lower() == 'true'),
                )
            )
    return users

def allowed_avatars() -> list:
    """Return the list of allowed DBZ avatar filenames."""
    avatar_dir = os.path.join(os.path.dirname(os.path.dirname(BASE_DIR)), 'public', 'dbz')
    if not os.path.exists(avatar_dir):
        return []
    
    avatars = [f for f in os.listdir(avatar_dir) if f.endswith('.png')]
    return sorted(avatars)


# Feedback functions
def create_feedback(username: str, rating: int, message: str) -> str:
    """Create a new feedback entry. Returns the feedback ID."""
    _ensure_feedback_file()
    
    feedback_id = str(uuid.uuid4())
    timestamp = datetime.now().isoformat()
    
    with open(FEEDBACK_FILE, mode='a', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=FEEDBACK_FIELDS)
        writer.writerow({
            'id': feedback_id,
            'username': username,
            'rating': rating,
            'message': message,
            'timestamp': timestamp
        })
    
    return feedback_id


def list_all_feedback() -> List[FeedbackPublic]:
    """Return a list of all feedback entries."""
    if not os.path.exists(FEEDBACK_FILE) or os.path.getsize(FEEDBACK_FILE) == 0:
        return []
    
    feedback_list = []
    with open(FEEDBACK_FILE, mode='r', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            feedback_list.append(FeedbackPublic(
                id=row.get('id', ''),
                username=row.get('username', ''),
                rating=int(row.get('rating', 0)),
                message=row.get('message', ''),
                timestamp=row.get('timestamp', '')
            ))
    
    # Return newest first
    return sorted(feedback_list, key=lambda x: x.timestamp, reverse=True)
