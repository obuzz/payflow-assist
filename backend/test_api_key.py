"""
Quick test script to verify Anthropic API key
"""
import anthropic
from app.core.config import settings

def test_api_key():
    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        # Try different models (2025 latest models)
        models_to_try = [
            "claude-3-7-sonnet-20250219",  # Latest Sonnet 3.7
            "claude-3-5-sonnet-20241022",  # Sonnet 3.5
            "claude-3-5-sonnet-20240620",  # Earlier 3.5
            "claude-3-opus-20240229",  # Opus
        ]

        for model in models_to_try:
            try:
                print(f"Trying model: {model}...")
                message = client.messages.create(
                    model=model,
                    max_tokens=50,
                    messages=[
                        {"role": "user", "content": "Say 'API key is working!' in exactly those words."}
                    ]
                )

                response = message.content[0].text
                print(f"✓ API Key Test Successful with model {model}!")
                print(f"Response: {response}")
                return True
            except anthropic.NotFoundError:
                print(f"  Model {model} not available")
                continue

        print("✗ No working model found")
        return False

    except anthropic.AuthenticationError:
        print("✗ Authentication Error: Invalid API key")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    test_api_key()
