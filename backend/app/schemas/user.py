from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None # Using EmailStr for email format validation
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str

class UserUpdatePassword(BaseModel):
    old_password: str
    new_password: str

class UserInDB(UserBase):
    hashed_password: str

    class Config:
        from_attributes = True

class User(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None