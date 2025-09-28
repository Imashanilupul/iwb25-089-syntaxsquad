import google.generativeai as genai
from config import GEMINI_API_KEY

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

def get_embedding(text: str):
    model = "models/embedding-001"
    result = genai.embed_content(model=model, content=text)
    return result["embedding"]
