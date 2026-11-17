import os
from dotenv import load_dotenv
from google import genai

print("Step 1: Loading key...")
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
print("Step 2: Key loaded:", api_key is not None)

print("Step 3: Creating client...")
client = genai.Client(api_key=api_key)
print("Step 4: Client created, sending request...")

response = client.models.generate_content(
   model="gemini-3.5-flash-lite",
   contents="Say hello in one short sentence."
)

print("Step 5: Got response!")
print(response.text)