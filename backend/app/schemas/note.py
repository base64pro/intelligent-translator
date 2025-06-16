from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NoteBase(BaseModel):
    content: str

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    content: str

class Note(NoteBase):
    id: int
    conversation_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True