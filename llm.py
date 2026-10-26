import json
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

def send_prompt_json(prompt_text, system_prompt=None):
    client = get_client()
    config = {"response_mime_type": "application/json"}
    if system_prompt:
        config["system_instruction"] = system_prompt
    response = client.models.generate_content(
        model=MODEL,
        contents=prompt_text,
        config=config
    )
    return json.loads(response.text)