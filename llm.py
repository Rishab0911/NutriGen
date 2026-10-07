import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

MODEL = "gemini-3.5-flash-lite"

def get_client():
    api_key = os.getenv("GEMINI_API_KEY")
    return genai.Client(api_key=api_key)

def send_prompt(prompt_text, system_prompt=None):
    client = get_client()
    config = {"system_instruction": system_prompt} if system_prompt else {}
    response = client.models.generate_content(
        model=MODEL,
        contents=prompt_text,
        config=config
    )
    return response.text