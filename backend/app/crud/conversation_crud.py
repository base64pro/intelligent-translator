from sqlalchemy.orm import Session
from sqlalchemy.sql import func # **إضافة**: لاستخدام دالة func.now()
from app.db import models
from app.schemas import conversation as conversation_schemas
from typing import List, Optional

from . import settings_crud
from . import prompt_crud

# --- **دالة مساعدة جديدة** ---
def touch_conversation(db: Session, conversation_id: int):
    """
    Explicitly updates the 'updated_at' timestamp for a conversation.
    This is useful when a related object (like a message) is changed.
    """
    db_conversation = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if db_conversation:
        db_conversation.updated_at = func.now()
        db.commit()
    return db_conversation

# --- Conversation CRUD ---
def get_conversations(db: Session, skip: int = 0, limit: int = 100) -> List[models.Conversation]:
    """
    UPDATED: Now sorts by the most recently updated conversations.
    """
    return db.query(models.Conversation)\
             .filter(models.Conversation.is_archived == False)\
             .order_by(models.Conversation.updated_at.desc()).offset(skip).limit(limit).all()

def get_archived_conversations(db: Session, skip: int = 0, limit: int = 100) -> List[models.Conversation]:
    """
    UPDATED: Now sorts by the most recently updated conversations.
    """
    return db.query(models.Conversation)\
             .filter(models.Conversation.is_archived == True)\
             .order_by(models.Conversation.updated_at.desc()).offset(skip).limit(limit).all()

def get_conversation(db: Session, conversation_id: int) -> Optional[models.Conversation]:
    return db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()

def create_conversation(db: Session, conversation: conversation_schemas.ConversationCreate) -> models.Conversation:
    default_prompt_content = None
    default_prompt_id_setting = settings_crud.get_setting(db, "default_prompt_id")
    if default_prompt_id_setting and default_prompt_id_setting.value:
        try:
            prompt_id = int(default_prompt_id_setting.value)
            default_prompt = prompt_crud.get_prompt(db, prompt_id)
            if default_prompt:
                default_prompt_content = default_prompt.content
        except (ValueError, TypeError):
            pass

    db_conversation = models.Conversation(
        title=conversation.title,
        use_context=True,
        custom_prompt=default_prompt_content
    )
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    return db_conversation

def archive_conversation(db: Session, conversation_id: int, archive_status: bool = True) -> Optional[models.Conversation]:
    db_conversation = get_conversation(db, conversation_id)
    if db_conversation:
        db_conversation.is_archived = archive_status
        db.commit()
        db.refresh(db_conversation)
    return db_conversation

def update_conversation_settings(db: Session, conversation_id: int, settings: conversation_schemas.ConversationSettingsUpdate) -> Optional[models.Conversation]:
    db_conversation = get_conversation(db, conversation_id)
    if not db_conversation:
        return None
    
    if settings.use_context is not None:
        db_conversation.use_context = settings.use_context
    if settings.custom_prompt is not None:
        db_conversation.custom_prompt = settings.custom_prompt
        
    db.commit()
    db.refresh(db_conversation)
    return db_conversation

def rename_conversation(db: Session, conversation_id: int, title: str) -> Optional[models.Conversation]:
    db_conversation = get_conversation(db, conversation_id)
    if db_conversation:
        db_conversation.title = title
        db.commit()
        db.refresh(db_conversation)
    return db_conversation

def delete_conversation(db: Session, conversation_id: int) -> Optional[models.Conversation]:
    db_conversation = get_conversation(db, conversation_id)
    if db_conversation:
        db.delete(db_conversation)
        db.commit()
    return db_conversation


# --- Message CRUD ---
def get_message(db: Session, message_id: int) -> Optional[models.Message]:
    return db.query(models.Message).filter(models.Message.id == message_id).first()

def get_last_messages(db: Session, conversation_id: int, limit: int = 4) -> List[models.Message]:
    return db.query(models.Message)\
             .filter(models.Message.conversation_id == conversation_id)\
             .order_by(models.Message.created_at.desc())\
             .limit(limit)\
             .all()[::-1]

def create_conversation_message(db: Session, message: conversation_schemas.MessageCreate, conversation_id: int) -> models.Message:
    db_message = models.Message(**message.model_dump(), conversation_id=conversation_id)
    db.add(db_message)
    # **التعديل**: تحديث المحادثة الأم بعد إضافة رسالة
    touch_conversation(db, conversation_id)
    db.refresh(db_message)
    return db_message

def update_message(db: Session, message_id: int, original_text: str, translated_text: str) -> Optional[models.Message]:
    db_message = get_message(db, message_id)
    if db_message:
        db_message.original_text = original_text
        db_message.translated_text = translated_text
        # **التعديل**: تحديث المحادثة الأم بعد تعديل رسالة
        touch_conversation(db, db_message.conversation_id)
        db.refresh(db_message)
    return db_message

def delete_message(db: Session, message_id: int) -> Optional[models.Message]:
    db_message = get_message(db, message_id)
    if db_message:
        conversation_id = db_message.conversation_id
        db.delete(db_message)
        # **التعديل**: تحديث المحادثة الأم بعد حذف رسالة
        touch_conversation(db, conversation_id)
    return db_message