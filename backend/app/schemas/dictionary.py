from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DictionaryEntryBase(BaseModel):
    source_text: str
    target_text: str

class DictionaryEntryCreate(DictionaryEntryBase):
    pass

class DictionaryEntryUpdate(BaseModel):
    source_text: Optional[str] = None
    target_text: Optional[str] = None

class DictionaryEntry(DictionaryEntryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True