from fastapi import APIRouter, Request
from models.chat_models import ChatRequest, ChatResponse
from db import get_chroma_client
import google.generativeai as genai
import config
from sentence_transformers import SentenceTransformer
from typing import Dict, List

router = APIRouter()
client = get_chroma_client()
collection = client.get_or_create_collection(config.CHROMA_COLLECTION)

genai.configure(api_key=config.GEMINI_API_KEY)
embedding_model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")

# Simple in-memory short-term memory (session_id -> list of exchanges)
SHORT_TERM_MEMORY: Dict[str, List[str]] = {}
MEMORY_LIMIT = 5  # Number of exchanges to remember


def get_free_embedding(text: str):
    """Generate embeddings using free SentenceTransformers"""
    return embedding_model.encode(text).tolist()


@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest, request: Request):
    # Use client IP as session_id for demonstration (replace with real session/user ID in production)
    session_id = request.client.host

    # Get or initialize memory for this session
    memory = SHORT_TERM_MEMORY.get(session_id, [])

    # Add the latest user question to memory
    memory.append(f"User: {req.question}")
    if len(memory) > MEMORY_LIMIT:
        memory = memory[-MEMORY_LIMIT:]  # Keep only the last N exchanges

    # Retrieve relevant documents from Chroma
    query_embedding = get_free_embedding(req.question)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=req.top_k
    )
    docs = results['documents'][0] if results['documents'] else []

    # Prepare prompt for Gemini LLM
    context_text = "\n".join(docs)
    memory_text = "\n".join(memory)

    system_prompt = """You are an intelligent assistant for the Democratic Socialist Republic of Sri Lanka's blockchain-powered transparent governance platform. You help citizens understand governance processes, access information, and engage with democratic systems.

Your Role and Behavior:
- You are a helpful, knowledgeable, and friendly assistant that communicates naturally like a chatbot
- Keep answers short, clear, and professional
- If context lacks enough information, say so honestly
"""

    full_prompt = f"""{system_prompt}

Short-Term Memory:
{memory_text}

Context Information: {context_text}

User Question: {req.question}

Respond naturally as a helpful governance platform assistant would, using the context information and short-term memory to provide accurate and concise answers. Do not add any styles to text. Just raw text needed."""

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(
            full_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.2,
                max_output_tokens=500
            )
        )
        # Add assistant's answer to memory
        memory.append(f"Assistant: {response.text}")
        if len(memory) > MEMORY_LIMIT:
            memory = memory[-MEMORY_LIMIT:]
        SHORT_TERM_MEMORY[session_id] = memory

        return ChatResponse(answer=response.text)
    except Exception as e:
        error_message = f"Sorry, I encountered an error while processing your request: {str(e)}"
        return ChatResponse(answer=error_message)
