# Authentication API Backend

This is a FastAPI-based backend for user authentication that stores user data in CSV files.

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

- `POST /signup` - Register a new user
- `POST /token` - Get access token (login)
- `GET /users/me/` - Get current user info (protected)

## Data Storage

User data is stored in `data/users.txt` in CSV format. The file is created automatically when the first user registers.
