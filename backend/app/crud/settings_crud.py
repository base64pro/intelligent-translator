from sqlalchemy.orm import Session
from app.db import models

def get_setting(db: Session, key: str) -> models.Setting:
    """
    Retrieves a setting from the database by its key.
    """
    return db.query(models.Setting).filter(models.Setting.key == key).first()

def upsert_setting(db: Session, key: str, value: str) -> models.Setting:
    """
    Updates a setting if it exists, or creates it if it does not.
    This is known as an "upsert" operation.
    """
    db_setting = get_setting(db, key)
    if db_setting:
        # If setting exists, update its value
        db_setting.value = value
    else:
        # If setting does not exist, create a new one
        db_setting = models.Setting(key=key, value=value)
        db.add(db_setting)
    
    db.commit()
    db.refresh(db_setting)
    return db_setting