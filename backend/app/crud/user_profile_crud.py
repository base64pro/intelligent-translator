from sqlalchemy.orm import Session
from app.db import models
from app.schemas import user_profile as user_profile_schema

def get_user_profile(db: Session, user_id: int = 1) -> models.UserProfile:
    """
    Retrieves the user profile. Since it's a personal app, we default to user_id=1.
    """
    return db.query(models.UserProfile).filter(models.UserProfile.id == user_id).first()

def upsert_user_profile(db: Session, profile_data: user_profile_schema.UserProfileUpdate, user_id: int = 1) -> models.UserProfile:
    """
    Updates the user profile if it exists, or creates it if it does not.
    This is an "upsert" operation.
    """
    db_profile = get_user_profile(db, user_id)
    
    # Get the data from the Pydantic model, excluding any values that were not set
    update_data = profile_data.model_dump(exclude_unset=True)

    if db_profile:
        # If profile exists, update its data field by field
        for key, value in update_data.items():
            setattr(db_profile, key, value)
    else:
        # If profile does not exist, create a new one with the provided data
        db_profile = models.UserProfile(**update_data, id=user_id)
        db.add(db_profile)
    
    db.commit()
    db.refresh(db_profile)
    return db_profile