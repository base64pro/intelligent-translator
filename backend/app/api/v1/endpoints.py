from fastapi import APIRouter, HTTPException, Depends, status, Body, UploadFile, File
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime, timedelta

# Import for authentication
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.core.security import create_access_token, verify_password, decode_access_token # type: ignore
from jose import JWTError # For token decoding errors

# Direct and Explicit Imports
from app.schemas import conversation as conversation_schemas
from app.schemas import translation as translation_schemas
from app.schemas import setting as setting_schemas
from app.schemas import tts as tts_schemas
from app.schemas import user_profile as user_profile_schemas
from app.schemas import prompt as prompt_schemas
from app.schemas import dictionary as dictionary_schemas
from app.schemas import note as note_schemas
from app.schemas import user as user_schemas # <-- NEW IMPORT

from app.crud import conversation_crud
from app.crud import settings_crud
from app.crud import user_profile_crud
from app.crud import prompt_crud
from app.crud import dictionary_crud
from app.crud import note_crud
from app.crud import user_crud # <-- NEW IMPORT

from app.services import translation_service
from app.services import tts_service
from app.services import transcription_service

from app.db.database import SessionLocal
from app.db import models # Needed for type hinting in get_current_user

# OAuth2PasswordBearer is used to extract the token from the request header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependency to get the current authenticated user
async def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = user_schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = user_crud.get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

router = APIRouter()

# --- Auth Endpoints ---
@router.post("/token", response_model=user_schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    user = user_crud.get_user_by_username(db, username=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=user_schemas.User, status_code=status.HTTP_201_CREATED)
def register_new_user(user: user_schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = user_crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="اسم المستخدم موجود بالفعل.")
    
    # Optional: Check if email already registered if email is provided
    if user.email:
        db_user_by_email = user_crud.get_user_by_email(db, email=user.email)
        if db_user_by_email:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="البريد الإلكتروني مسجل بالفعل.")

    return user_crud.create_user(db=db, user=user)

@router.get("/users/me/", response_model=user_schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.put("/users/me/password", response_model=user_schemas.User)
async def update_current_user_password(
    password_data: user_schemas.UserUpdatePassword,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="كلمة المرور القديمة غير صحيحة.")
    
    updated_user = user_crud.update_user_password(db, current_user, password_data.new_password)
    return updated_user

# --- Settings Endpoints ---
@router.post("/settings", response_model=setting_schemas.Setting)
# @router.post("/settings", response_model=setting_schemas.Setting, dependencies=[Depends(get_current_user)]) # Example of protecting an endpoint
def create_or_update_setting(setting: setting_schemas.SettingCreate, db: Session = Depends(get_db)):
    return settings_crud.upsert_setting(db=db, key=setting.key, value=setting.value)

@router.get("/settings/{key}", response_model=setting_schemas.Setting)
def read_setting(key: str, db: Session = Depends(get_db)):
    db_setting = settings_crud.get_setting(db, key=key)
    if db_setting is None:
        return setting_schemas.Setting(key=key, value=None)
    return db_setting

# --- User Profile Endpoints ---
@router.get("/profile", response_model=user_profile_schemas.UserProfile)
# @router.get("/profile", response_model=user_profile_schemas.UserProfile, dependencies=[Depends(get_current_user)])
def read_user_profile(db: Session = Depends(get_db)):
    profile = user_profile_crud.get_user_profile(db)
    if profile is None:
        return user_profile_crud.upsert_user_profile(db, user_profile_schemas.UserProfileUpdate())
    return profile

@router.post("/profile", response_model=user_profile_schemas.UserProfile)
# @router.post("/profile", response_model=user_profile_schemas.UserProfile, dependencies=[Depends(get_current_user)])
def update_user_profile(profile_data: user_profile_schemas.UserProfileUpdate, db: Session = Depends(get_db)):
    return user_profile_crud.upsert_user_profile(db, profile_data)

# --- Conversation Endpoints ---
@router.post("/conversations/", response_model=conversation_schemas.Conversation)
# @router.post("/conversations/", response_model=conversation_schemas.Conversation, dependencies=[Depends(get_current_user)])
def create_new_conversation(conversation: conversation_schemas.ConversationCreate, db: Session = Depends(get_db)):
    return conversation_crud.create_conversation(db=db, conversation=conversation)

@router.get("/conversations/", response_model=List[conversation_schemas.Conversation])
# @router.get("/conversations/", response_model=List[conversation_schemas.Conversation], dependencies=[Depends(get_current_user)])
def read_all_conversations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return conversation_crud.get_conversations(db, skip=skip, limit=limit)

@router.get("/conversations/archived", response_model=List[conversation_schemas.Conversation])
# @router.get("/conversations/archived", response_model=List[conversation_schemas.Conversation], dependencies=[Depends(get_current_user)])
def read_all_archived_conversations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return conversation_crud.get_archived_conversations(db, skip=skip, limit=limit)

@router.get("/conversations/{conversation_id}", response_model=conversation_schemas.Conversation)
# @router.get("/conversations/{conversation_id}", response_model=conversation_schemas.Conversation, dependencies=[Depends(get_current_user)])
def read_single_conversation(conversation_id: int, db: Session = Depends(get_db)):
    db_conversation = conversation_crud.get_conversation(db, conversation_id=conversation_id)
    if db_conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return db_conversation
    
@router.get("/conversations/{conversation_id}/export")
# @router.get("/conversations/{conversation_id}/export", dependencies=[Depends(get_current_user)])
def export_conversation(conversation_id: int, db: Session = Depends(get_db)):
    db_conversation = conversation_crud.get_conversation(db, conversation_id=conversation_id)
    if db_conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    export_content = f"Conversation Title: {db_conversation.title}\n"
    export_content += f"Exported on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
    export_content += "=" * 40 + "\n\n"

    for message in db_conversation.messages:
        export_content += f"[User]: {message.original_text}\n"
        export_content += f"[Assistant]: {message.translated_text}\n"
        export_content += "---\n"

    return Response(
        content=export_content,
        media_type="text/plain",
        headers={
            "Content-Disposition": f'attachment; filename="conversation_{db_conversation.id}.txt"'
        }
    )

@router.patch("/conversations/{conversation_id}/archive", response_model=conversation_schemas.Conversation)
# @router.patch("/conversations/{conversation_id}/archive", response_model=conversation_schemas.Conversation, dependencies=[Depends(get_current_user)])
def archive_conversation_endpoint(conversation_id: int, payload: dict = Body(...), db: Session = Depends(get_db)):
    is_archived_status = payload.get('is_archived')
    if is_archived_status is None or not isinstance(is_archived_status, bool):
        raise HTTPException(status_code=400, detail="Payload must include 'is_archived' key with a boolean value.")
        
    updated_conversation = conversation_crud.archive_conversation(db, conversation_id, archive_status=is_archived_status)
    if not updated_conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return updated_conversation

@router.patch("/conversations/{conversation_id}/settings", response_model=conversation_schemas.Conversation)
# @router.patch("/conversations/{conversation_id}/settings", response_model=conversation_schemas.Conversation, dependencies=[Depends(get_current_user)])
def update_settings_for_conversation(conversation_id: int, settings: conversation_schemas.ConversationSettingsUpdate, db: Session = Depends(get_db)):
    updated_conversation = conversation_crud.update_conversation_settings(db, conversation_id, settings)
    if not updated_conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return updated_conversation

@router.patch("/conversations/{conversation_id}/rename", response_model=conversation_schemas.Conversation)
# @router.patch("/conversations/{conversation_id}/rename", response_model=conversation_schemas.Conversation, dependencies=[Depends(get_current_user)])
def rename_conversation_endpoint(conversation_id: int, payload: conversation_schemas.ConversationTitleUpdate, db: Session = Depends(get_db)):
    updated_conversation = conversation_crud.rename_conversation(db, conversation_id, payload.title)
    if not updated_conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return updated_conversation

@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
# @router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_user)])
def delete_conversation_endpoint(conversation_id: int, db: Session = Depends(get_db)):
    deleted_conversation = conversation_crud.delete_conversation(db, conversation_id)
    if deleted_conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/conversations/{conversation_id}/translate", response_model=conversation_schemas.Message)
# @router.post("/conversations/{conversation_id}/translate", response_model=conversation_schemas.Message, dependencies=[Depends(get_current_user)])
async def add_new_message_to_conversation(conversation_id: int, request: translation_schemas.NewTranslationRequest, db: Session = Depends(get_db)):
    api_key_setting = settings_crud.get_setting(db, key="openai_api_key")
    if not api_key_setting or not api_key_setting.value:
        raise HTTPException(status_code=400, detail="OpenAI API key is not set in settings.")
    
    conversation = conversation_crud.get_conversation(db, conversation_id=conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    model_setting = settings_crud.get_setting(db, key="translation_model")
    model_name = model_setting.value if model_setting and model_setting.value else "gpt-4o-mini"
    
    past_messages = []
    if conversation.use_context:
        past_messages = conversation_crud.get_last_messages(db, conversation_id=conversation.id, limit=4)

    translated_text = await translation_service.get_ai_translation(
        db=db, # Pass db session to service
        text=request.text_to_translate,
        target_language=request.target_language,
        api_key=api_key_setting.value,
        past_messages=past_messages,
        custom_prompt=conversation.custom_prompt,
        model_name=model_name
    )

    if translated_text.startswith("Error:"):
        raise HTTPException(status_code=503, detail=translated_text)
    
    message_to_create = conversation_schemas.MessageCreate(original_text=request.text_to_translate, translated_text=translated_text)
    return conversation_crud.create_conversation_message(db=db, message=message_to_create, conversation_id=conversation_id)

# --- Message Endpoints ---
@router.patch("/messages/{message_id}", response_model=conversation_schemas.Message)
# @router.patch("/messages/{message_id}", response_model=conversation_schemas.Message, dependencies=[Depends(get_current_user)])
async def edit_message(message_id: int, payload: conversation_schemas.MessageUpdate, db: Session = Depends(get_db)):
    db_message = conversation_crud.get_message(db, message_id)
    if not db_message:
        raise HTTPException(status_code=404, detail="Message not found")

    api_key_setting = settings_crud.get_setting(db, key="openai_api_key")
    if not api_key_setting or not api_key_setting.value:
        raise HTTPException(status_code=400, detail="OpenAI API key is not set in settings.")

    translated_text = await translation_service.get_ai_translation(
        db=db, # Pass db session to service
        text=payload.original_text,
        target_language="English", # This should ideally be dynamic
        api_key=api_key_setting.value,
        past_messages=[],
        custom_prompt=None,
    )
    if translated_text.startswith("Error:"):
        raise HTTPException(status_code=503, detail=translated_text)
    
    updated_message = conversation_crud.update_message(db, message_id, payload.original_text, translated_text)
    return updated_message

@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
# @router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_user)])
def delete_message_endpoint(message_id: int, db: Session = Depends(get_db)):
    deleted_message = conversation_crud.delete_message(db, message_id)
    if deleted_message is None:
        raise HTTPException(status_code=404, detail="Message not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Text-to-Speech Endpoint ---
@router.post("/text-to-speech")
# @router.post("/text-to-speech", dependencies=[Depends(get_current_user)])
async def handle_text_to_speech(request: tts_schemas.TTSRequest, db: Session = Depends(get_db)):
    api_key_setting = settings_crud.get_setting(db, key="openai_api_key")
    if not api_key_setting or not api_key_setting.value:
        raise HTTPException(status_code=400, detail="OpenAI API key is not set in settings.")

    tts_model_setting = settings_crud.get_setting(db, key="tts_model")
    tts_voice_setting = settings_crud.get_setting(db, key="tts_voice")
    
    tts_model = tts_model_setting.value if tts_model_setting and tts_model_setting.value else "tts-1"
    tts_voice = tts_voice_setting.value if tts_voice_setting and tts_voice_setting.value else "alloy"

    audio_stream = await tts_service.generate_speech_from_text(
        text=request.text, 
        api_key=api_key_setting.value,
        model_name=tts_model,
        voice_name=tts_voice
    )
    
    if audio_stream is None:
        raise HTTPException(status_code=500, detail="Failed to generate audio.")

    return StreamingResponse(audio_stream, media_type="audio/mpeg")

# --- Transcription Endpoint ---
@router.post("/transcribe")
# @router.post("/transcribe", dependencies=[Depends(get_current_user)])
async def transcribe_audio_endpoint(
    db: Session = Depends(get_db),
    audio_file: UploadFile = File(...)
):
    api_key_setting = settings_crud.get_setting(db, key="openai_api_key")
    if not api_key_setting or not api_key_setting.value:
        raise HTTPException(status_code=400, detail="OpenAI API key is not set in settings.")

    lang_setting = settings_crud.get_setting(db, key="transcription_language")
    language = lang_setting.value if lang_setting else None
    
    transcribed_text = await transcription_service.transcribe_audio(
        api_key=api_key_setting.value,
        audio_file=audio_file,
        language=language
    )

    if transcribed_text.startswith("Error:"):
        raise HTTPException(status_code=503, detail=transcribed_text)
    
    return {"transcribed_text": transcribed_text}

# --- Prompt Endpoints ---

@router.post("/prompts/", response_model=prompt_schemas.Prompt, status_code=status.HTTP_201_CREATED)
# @router.post("/prompts/", response_model=prompt_schemas.Prompt, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_user)])
def create_new_prompt(prompt: prompt_schemas.PromptCreate, db: Session = Depends(get_db)):
    return prompt_crud.create_prompt(db=db, prompt=prompt)

@router.get("/prompts/", response_model=List[prompt_schemas.Prompt])
# @router.get("/prompts/", response_model=List[prompt_schemas.Prompt], dependencies=[Depends(get_current_user)])
def read_all_prompts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return prompt_crud.get_prompts(db, skip=skip, limit=limit)

@router.get("/prompts/{prompt_id}", response_model=prompt_schemas.Prompt)
# @router.get("/prompts/{prompt_id}", response_model=prompt_schemas.Prompt, dependencies=[Depends(get_current_user)])
def read_single_prompt(prompt_id: int, db: Session = Depends(get_db)):
    db_prompt = prompt_crud.get_prompt(db, prompt_id=prompt_id)
    if db_prompt is None:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return db_prompt

@router.put("/prompts/{prompt_id}", response_model=prompt_schemas.Prompt)
# @router.put("/prompts/{prompt_id}", response_model=prompt_schemas.Prompt, dependencies=[Depends(get_current_user)])
def update_existing_prompt(prompt_id: int, prompt: prompt_schemas.PromptUpdate, db: Session = Depends(get_db)):
    db_prompt = prompt_crud.update_prompt(db, prompt_id=prompt_id, prompt_data=prompt)
    if db_prompt is None:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return db_prompt

@router.delete("/prompts/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
# @router.delete("/prompts/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_user)])
def delete_existing_prompt(prompt_id: int, db: Session = Depends(get_db)):
    deleted_prompt = prompt_crud.delete_prompt(db, prompt_id=prompt_id)
    if deleted_prompt is None:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# --- NEW: Dictionary Endpoints ---

@router.post("/dictionary/", response_model=dictionary_schemas.DictionaryEntry, status_code=status.HTTP_201_CREATED)
# @router.post("/dictionary/", response_model=dictionary_schemas.DictionaryEntry, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_user)])
def create_new_dictionary_entry(entry: dictionary_schemas.DictionaryEntryCreate, db: Session = Depends(get_db)):
    try:
        return dictionary_crud.create_dictionary_entry(db=db, entry=entry)
    except IntegrityError:
        raise HTTPException(status_code=409, detail="Source text already exists in the dictionary.")

@router.get("/dictionary/", response_model=List[dictionary_schemas.DictionaryEntry])
# @router.get("/dictionary/", response_model=List[dictionary_schemas.DictionaryEntry], dependencies=[Depends(get_current_user)])
def read_all_dictionary_entries(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return dictionary_crud.get_dictionary_entries(db, skip=skip, limit=limit)

@router.put("/dictionary/{entry_id}", response_model=dictionary_schemas.DictionaryEntry)
# @router.put("/dictionary/{entry_id}", response_model=dictionary_schemas.DictionaryEntry, dependencies=[Depends(get_current_user)])
def update_existing_dictionary_entry(entry_id: int, entry: dictionary_schemas.DictionaryEntryUpdate, db: Session = Depends(get_db)):
    db_entry = dictionary_crud.update_dictionary_entry(db, entry_id=entry_id, entry_data=entry)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Dictionary entry not found")
    return db_entry

@router.delete("/dictionary/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
# @router.delete("/dictionary/{entry_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_user)])
def delete_existing_dictionary_entry(entry_id: int, db: Session = Depends(get_db)):
    deleted_entry = dictionary_crud.delete_dictionary_entry(db, entry_id=entry_id)
    if deleted_entry is None:
        raise HTTPException(status_code=404, detail="Dictionary entry not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# --- NEW: Notes Endpoints ---
@router.post("/conversations/{conversation_id}/notes/", response_model=note_schemas.Note, status_code=status.HTTP_201_CREATED)
# @router.post("/conversations/{conversation_id}/notes/", response_model=note_schemas.Note, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_user)])
def create_new_note_for_conversation(
    conversation_id: int, 
    note: note_schemas.NoteCreate, 
    db: Session = Depends(get_db)
):
    db_conversation = conversation_crud.get_conversation(db, conversation_id)
    if not db_conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return note_crud.create_note(db=db, note=note, conversation_id=conversation_id)

@router.get("/conversations/{conversation_id}/notes/", response_model=List[note_schemas.Note])
# @router.get("/conversations/{conversation_id}/notes/", response_model=List[note_schemas.Note], dependencies=[Depends(get_current_user)])
def read_notes_for_conversation(conversation_id: int, db: Session = Depends(get_db)):
    db_conversation = conversation_crud.get_conversation(db, conversation_id)
    if not db_conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return note_crud.get_notes_for_conversation(db, conversation_id=conversation_id)

@router.put("/notes/{note_id}", response_model=note_schemas.Note)
# @router.put("/notes/{note_id}", response_model=note_schemas.Note, dependencies=[Depends(get_current_user)])
def update_existing_note(note_id: int, note: note_schemas.NoteUpdate, db: Session = Depends(get_db)):
    db_note = note_crud.update_note(db, note_id=note_id, note_update=note)
    if db_note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return db_note

@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
# @router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_user)])
def delete_existing_note(note_id: int, db: Session = Depends(get_db)):
    deleted_note = note_crud.delete_note(db, note_id=note_id)
    if deleted_note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)