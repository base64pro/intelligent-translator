from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# Base schema with fields common to creating and reading
class PromptBase(BaseModel):
    title: str
    content: str

# Schema for creating a new prompt
class PromptCreate(PromptBase):
    pass

# Schema for updating an existing prompt - all fields are optional
class PromptUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

# Schema for reading a prompt from the database (will be returned from the API)
class Prompt(PromptBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True