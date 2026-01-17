"""
Quick test script to verify OpenAI API key
"""
from openai import OpenAI
from app.core.config import settings

def test_openai_key():
    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        print(f"Testing OpenAI API key...")
        print(f"Using model: {settings.OPENAI_MODEL}")

        # Make a simple API call
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say 'API key is working!' in exactly those words."}
            ],
            max_tokens=50
        )

        result = response.choices[0].message.content
        print(f"✓ OpenAI API Key Test Successful!")
        print(f"Response: {result}")
        print(f"Model used: {response.model}")
        return True

    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    test_openai_key()
