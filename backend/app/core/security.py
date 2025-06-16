from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError

# Password hashing configuration
# This is where we tell passlib what hashing algorithm to use.
# "bcrypt" is a strong and recommended hashing algorithm.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT (JSON Web Token) settings
# You should get these from environment variables in a real application
# For now, we'll hardcode them, but remember to secure them in production!
SECRET_KEY = "your-super-secret-key" # CHANGE THIS IN PRODUCTION!
ALGORITHM = "HS256" # HS256 is a common algorithm for JWT
ACCESS_TOKEN_EXPIRE_MINUTES = 30 # Token validity period

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain-text password against a hashed password.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hashes a plain-text password.
    """
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a new JWT access token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodes a JWT access token and returns its payload.
    Returns None if decoding fails (e.g., token expired or invalid).
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None