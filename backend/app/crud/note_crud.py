from sqlalchemy.orm import Session
from app.db import models
from app.schemas import note as note_schemas
from typing import List, Optional

def get_note(db: Session, note_id: int) -> Optional[models.Note]:
    """
    Retrieves a single note by its ID.
    """
    return db.query(models.Note).filter(models.Note.id == note_id).first()

def get_notes_for_conversation(db: Session, conversation_id: int) -> List[models.Note]:
    """
    Retrieves all notes for a specific conversation, ordered by creation date.
    """
    return db.query(models.Note).filter(models.Note.conversation_id == conversation_id).order_by(models.Note.created_at).all()

def create_note(db: Session, note: note_schemas.NoteCreate, conversation_id: int) -> models.Note:
    """
    Creates a new note for a given conversation.
    """
    db_note = models.Note(**note.model_dump(), conversation_id=conversation_id)
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

def update_note(db: Session, note_id: int, note_update: note_schemas.NoteUpdate) -> Optional[models.Note]:
    """
    Updates an existing note.
    """
    db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if db_note:
        db_note.content = note_update.content
        db.commit()
        db.refresh(db_note)
    return db_note

def delete_note(db: Session, note_id: int) -> Optional[models.Note]:
    """
    Deletes a note by its ID.
    """
    db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if db_note:
        db.delete(db_note)
        db.commit()
    return db_note