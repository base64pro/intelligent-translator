from pydantic import BaseModel

class NewTranslationRequest(BaseModel):
    """
    Defines the structure for a new translation request within a conversation.
    """
    text_to_translate: str
    target_language: str = "English"

class TranslationResponse(BaseModel):
    """
    Defines the structure of the response we send back to the frontend.
    This remains the same for now.
    """
    original_text: str
    translated_text: str
    detected_language: str