from sqlalchemy.orm import Session
from typing import List, Optional

from app.db import models
from app.schemas import prompt as prompt_schemas

def get_prompt(db: Session, prompt_id: int) -> Optional[models.Prompt]:
    """
    Retrieves a single prompt by its ID.
    """
    return db.query(models.Prompt).filter(models.Prompt.id == prompt_id).first()

def get_prompts(db: Session, skip: int = 0, limit: int = 100) -> List[models.Prompt]:
    """
    Retrieves a list of all prompts, ordered by creation date.
    """
    return db.query(models.Prompt).order_by(models.Prompt.created_at.desc()).offset(skip).limit(limit).all()

def create_prompt(db: Session, prompt: prompt_schemas.PromptCreate) -> models.Prompt:
    """
    Creates a new prompt in the database.
    """
    db_prompt = models.Prompt(
        title=prompt.title,
        content=prompt.content
    )
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    return db_prompt

def update_prompt(db: Session, prompt_id: int, prompt_data: prompt_schemas.PromptUpdate) -> Optional[models.Prompt]:
    """
    Updates an existing prompt's title or content.
    """
    db_prompt = get_prompt(db, prompt_id)
    if not db_prompt:
        return None

    update_data = prompt_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_prompt, key, value)

    db.commit()
    db.refresh(db_prompt)
    return db_prompt

def delete_prompt(db: Session, prompt_id: int) -> Optional[models.Prompt]:
    """
    Deletes a prompt from the database.
    """
    db_prompt = get_prompt(db, prompt_id)
    if db_prompt:
        db.delete(db_prompt)
        db.commit()
    return db_prompt