from llm import send_prompt

response = send_prompt("Say hello in one short sentence.")
print("Response 1:", response)

response2 = send_prompt("What is 2 + 2? Answer with just the number.")
print("Response 2:", response2)