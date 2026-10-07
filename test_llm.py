from llm import send_prompt
from prompts import SYSTEM_PROMPT

response = send_prompt(
    "I want a quick breakfast idea.",
    system_prompt=SYSTEM_PROMPT
)
print("Response:", response)