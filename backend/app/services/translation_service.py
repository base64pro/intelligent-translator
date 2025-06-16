from openai import AsyncOpenAI
from typing import Optional, List
from sqlalchemy.orm import Session # <-- NEW IMPORT
from app.db import models
from app.crud import dictionary_crud # <-- NEW IMPORT

def _build_dictionary_prompt_segment(db: Session) -> str:
    """
    Helper function to build the dictionary part of the system prompt.
    """
    entries = dictionary_crud.get_dictionary_entries(db)
    if not entries:
        return ""

    rules = "\n\n--- STRICT TRANSLATION RULES ---\nYou MUST translate the following terms exactly as specified, without any deviation:\n"
    for entry in entries:
        rules += f"- '{entry.source_text}' MUST BE TRANSLATED AS '{entry.target_text}'\n"
    rules += "--- END OF STRICT RULES ---\n"
    return rules

async def get_ai_translation(
    db: Session, # <-- NEW: Pass the db session
    text: str, 
    target_language: str, 
    api_key: str, 
    past_messages: List[models.Message], 
    custom_prompt: Optional[str] = None,
    model_name: str = "gpt-4o-mini"
) -> str:
    """
    Calls the OpenAI API to perform a translation, using a specific model and custom dictionary.
    """
    if not api_key:
        return "Error: OpenAI API key was not provided to the service."

    client = AsyncOpenAI(api_key=api_key)
    
    # Build the dictionary rules segment
    dictionary_rules = _build_dictionary_prompt_segment(db)

    default_system_prompt = f"""
You are an expert, professional translator. Your task is to translate the user's text into {target_language}.
Analyze the user's input, which may be in colloquial, fast, or even grammatically weak language.
Your primary goal is to understand the core *meaning and intent* of the text, not just the literal words.
Then, provide a translation that is not only accurate but also well-phrased, professional, and grammatically perfect in the target language.
Do not add any commentary or explanations. Your response must only be the final, polished translation.{dictionary_rules}
"""

    system_prompt = custom_prompt if custom_prompt else default_system_prompt
    
    messages_for_ai = [{"role": "system", "content": system_prompt}]
    
    for msg in past_messages:
        messages_for_ai.append({"role": "user", "content": msg.original_text})
        messages_for_ai.append({"role": "assistant", "content": msg.translated_text})
        
    messages_for_ai.append({"role": "user", "content": text})

    try:
        response = await client.chat.completions.create(
            model=model_name,
            messages=messages_for_ai,
            temperature=0.2,
            max_tokens=2000,
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"An error occurred while calling the OpenAI API: {e}")
        return f"Error: Could not get translation from AI. Details: {e}"