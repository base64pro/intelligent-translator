from openai import AsyncOpenAI
from typing import IO, Optional # <-- NEW: Import Optional
from fastapi import UploadFile

async def transcribe_audio(
    api_key: str, 
    audio_file: UploadFile,
    language: Optional[str] = None # <-- NEW: Accept an optional language parameter
) -> str:
    """
    Calls the OpenAI Whisper API to transcribe an audio file.
    UPDATED: Now accepts an optional language code to improve accuracy.
    """
    if not api_key:
        return "Error: OpenAI API key was not provided to the transcription service."

    client = AsyncOpenAI(api_key=api_key)

    try:
        audio_data_tuple = (audio_file.filename, audio_file.file, audio_file.content_type)
        
        # Prepare parameters for the API call
        transcription_params = {
            "model": "whisper-1",
            "file": audio_data_tuple
        }
        
        # If a language is specified (and it's not 'auto'), add it to the request
        if language and language != "auto":
            transcription_params["language"] = language
            
        transcription = await client.audio.transcriptions.create(**transcription_params)
        
        return transcription.text

    except Exception as e:
        print(f"An error occurred while calling the Whisper API: {e}")
        return f"Error: Could not transcribe audio. Details: {e}"