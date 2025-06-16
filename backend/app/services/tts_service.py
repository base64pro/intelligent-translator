from openai import AsyncOpenAI
from typing import Optional

async def generate_speech_from_text(
    text: str, 
    api_key: str,
    model_name: str = "tts-1", # Added model_name parameter
    voice_name: str = "alloy"  # Added voice_name parameter
):
    """
    Calls the OpenAI TTS API, using a specific model and voice.
    """
    if not api_key:
        print("Error: OpenAI API key was not provided to the TTS service.")
        return None

    client = AsyncOpenAI(api_key=api_key)

    try:
        response = await client.audio.speech.create(
            model=model_name,
            voice=voice_name,
            input=text,
            response_format="mp3"
        )
        return response.iter_bytes()

    except Exception as e:
        print(f"An error occurred while calling OpenAI TTS API: {e}")
        return None