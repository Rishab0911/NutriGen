from llm import get_client, MODEL

client = get_client()
print("Client bana:", client is not None)

response = client.models.generate_content(
    model=MODEL,
    contents="Say hello in one short sentence."
)

print("Response:", response.text)