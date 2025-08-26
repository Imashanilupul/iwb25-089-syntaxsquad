import google.generativeai as genai
import config

# Configure Gemini
genai.configure(api_key=config.GEMINI_API_KEY)

def get_embedding(text: str):
    model = "models/embedding-001"
    result = genai.embed_content(model=model, content=text)
    return result["embedding"]
