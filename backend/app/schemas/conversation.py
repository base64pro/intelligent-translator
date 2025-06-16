from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class MessageBase(BaseModel):
    original_text: str
    translated_text: str

class MessageCreate(MessageBase):
    pass

class MessageUpdate(BaseModel):
    """
    NEW: Schema for updating the original_text of a message.
    """
    original_text: str

class Message(MessageBase):
    id: int
    created_at: datetime
    conversation_id: int

    class Config:
        from_attributes = True


class ConversationBase(BaseModel):
    title: str

class ConversationCreate(ConversationBase):
    pass

class ConversationSettingsUpdate(BaseModel):
    use_context: Optional[bool] = None
    custom_prompt: Optional[str] = None

class ConversationTitleUpdate(BaseModel):
    title: str

class Conversation(ConversationBase):
    id: int
    created_at: datetime
    use_context: bool
    custom_prompt: Optional[str] = None
    messages: List[Message] = []

    class Config:
        from_attributes = True