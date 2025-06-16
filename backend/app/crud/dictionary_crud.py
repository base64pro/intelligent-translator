from sqlalchemy.orm import Session
from typing import List, Optional

from app.db import models
from app.schemas import dictionary as dictionary_schemas

def get_dictionary_entry(db: Session, entry_id: int) -> Optional[models.DictionaryEntry]:
    """
    Retrieves a single dictionary entry by its ID.
    """
    return db.query(models.DictionaryEntry).filter(models.DictionaryEntry.id == entry_id).first()

def get_dictionary_entries(db: Session, skip: int = 0, limit: int = 100) -> List[models.DictionaryEntry]:
    """
    Retrieves a list of all dictionary entries.
    """
    return db.query(models.DictionaryEntry).order_by(models.DictionaryEntry.source_text).offset(skip).limit(limit).all()

def create_dictionary_entry(db: Session, entry: dictionary_schemas.DictionaryEntryCreate) -> models.DictionaryEntry:
    """
    Creates a new dictionary entry.
    """
    db_entry = models.DictionaryEntry(
        source_text=entry.source_text,
        target_text=entry.target_text
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

def update_dictionary_entry(db: Session, entry_id: int, entry_data: dictionary_schemas.DictionaryEntryUpdate) -> Optional[models.DictionaryEntry]:
    """
    Updates an existing dictionary entry.
    """
    db_entry = get_dictionary_entry(db, entry_id)
    if not db_entry:
        return None

    update_data = entry_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_entry, key, value)

    db.commit()
    db.refresh(db_entry)
    return db_entry

def delete_dictionary_entry(db: Session, entry_id: int) -> Optional[models.DictionaryEntry]:
    """
    Deletes a dictionary entry.
    """
    db_entry = get_dictionary_entry(db, entry_id)
    if db_entry:
        db.delete(db_entry)
        db.commit()
    return db_entry