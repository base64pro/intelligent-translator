from pydantic import BaseModel

class TTSRequest(BaseModel):
    """
    Defines the structure for a Text-to-Speech request.
    """
    text: str
    # We can add more options later like voice, speed, etc.