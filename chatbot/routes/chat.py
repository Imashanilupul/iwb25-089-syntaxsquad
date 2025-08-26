from fastapi import APIRouter
from pydantic import BaseModel
from db import get_chroma_client
from embeddings import get_embedding
import google.generativeai as genai
import config

router = APIRouter()
client = get_chroma_client()
collection = client.get_or_create_collection(config.CHROMA_COLLECTION)

genai.configure(api_key=config.GEMINI_API_KEY)

class ChatRequest(BaseModel):
    question: str
    top_k: int = 3

class ChatResponse(BaseModel):
    answer: str

@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    # 1️⃣ Embed the question
    query_embedding = get_embedding(req.question)

    # 2️⃣ Retrieve relevant documents from Chroma
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=req.top_k
    )
    docs = results['documents'][0]  # List of retrieved docs

    # 3️⃣ Prepare prompt for Gemini LLM
    context_text = "\n".join(docs)
    prompt = f"Answer the question based on the following context:\n\n{context_text}\n\nQuestion: {req.question}\nAnswer:"

    # 4️⃣ Generate answer using Gemini LLM (Corrected Way)
    # Instantiate the model
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    # Generate content
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.2,
            max_output_tokens=500
        )
    )

    return ChatResponse(answer=response.text)
