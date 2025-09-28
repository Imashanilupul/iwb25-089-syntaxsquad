from fastapi import APIRouter
from models.chat_models import ChatRequest, ChatResponse
from db import get_chroma_client
import google.generativeai as genai
import config

# Hugging Face SentenceTransformer for free embeddings
from sentence_transformers import SentenceTransformer

router = APIRouter()
client = get_chroma_client()
collection = client.get_or_create_collection(config.CHROMA_COLLECTION)

genai.configure(api_key=config.GEMINI_API_KEY)


embedding_model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")


def get_free_embedding(text: str):
    """Generate embeddings using free SentenceTransformers"""
    return embedding_model.encode(text).tolist()


@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    query_embedding = get_free_embedding(req.question)

    # Retrieve relevant documents from Chroma
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=req.top_k
    )
    docs = results['documents'][0] if results['documents'] else []

    # Prepare prompt for Gemini LLM
    context_text = "\n".join(docs)
    
    # System prompt template
    system_prompt = """You are an intelligent assistant for the Democratic Socialist Republic of Sri Lanka's blockchain-powered transparent governance platform. You help citizens understand governance processes, access information, and engage with democratic systems.

Your Role and Behavior:
- You are a helpful, knowledgeable, and friendly assistant that communicates naturally like a chatbot
- Keep answers short, clear, and professional
- If context lacks enough information, say so honestly
"""

    # Construct the full prompt
    full_prompt = f"""{system_prompt}

Context Information: {context_text}

User Question: {req.question}

Respond naturally as a helpful governance platform assistant would, using the context information to provide accurate and concise answers. Do not add any styles to text. Just raw text needed."""

    # Generate answer using Gemini LLM
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(
            full_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.2,
                max_output_tokens=500
            )
        )
        return ChatResponse(answer=response.text)
    except Exception as e:
        error_message = f"Sorry, I encountered an error while processing your request: {str(e)}"
        return ChatResponse(answer=error_message)
