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
    # Embed the question
    query_embedding = get_embedding(req.question)

    # Retrieve relevant documents from Chroma
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=req.top_k
    )
    docs = results['documents'][0]  # List of retrieved docs

    # Prepare prompt for Gemini LLM
    context_text = "\n".join(docs)
    
    # System prompt template
    system_prompt = """You are an intelligent assistant for the Democratic Socialist Republic of Sri Lanka's blockchain-powered transparent governance platform. You help citizens understand governance processes, access information, and engage with democratic systems.

Your Role and Behavior:
- You are a helpful, knowledgeable, and friendly assistant that communicates naturally like a chatbot
- You should respond conversationally while being informative and professional

For greetings and general conversation:
- Respond warmly and naturally
- Introduce yourself as the assistant for Sri Lanka's transparent governance platform
- Ask how you can help with governance-related questions
- Be conversational and engaging

For specific questions:
- Use the provided context information as your primary source
- Give comprehensive, accurate answers based on available information
- If context doesn't contain enough information, acknowledge this honestly
- Always be helpful and guide users toward relevant information

Key Principles:
- Be Natural: Communicate like a friendly, knowledgeable person
- Be Clear: Use simple language accessible to all citizens
- Be Accurate: Only provide information supported by the context
- Be Helpful: Always try to assist users with their needs
- Stay Neutral: Maintain political neutrality while supporting democratic values
- Be Culturally Aware: Consider Sri Lankan context and sensitivities
- Encourage Participation: Promote civic engagement and transparency

Special Focus Areas:
- Governance processes and procedures
- Blockchain transparency features
- Civic rights and responsibilities
- Democratic participation opportunities
- Policy explanations and clarifications
- Legal and regulatory information

Remember: You're helping build a more transparent and accessible democracy. Every conversation should reflect values of openness, helpfulness, and civic engagement."""

    # Construct the full prompt
    full_prompt = f"""{system_prompt}

Context Information: {context_text}

User Question: {req.question}

Respond naturally as a helpful governance platform assistant would, using the context information to provide accurate and comprehensive answers."""

    # Generate answer using Gemini LLM
    try:
        # Instantiate the model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Generate content
        response = model.generate_content(
            full_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.2,
                max_output_tokens=500
            )
        )
        
        return ChatResponse(answer=response.text)
        
    except Exception as e:
        # Handle errors gracefully
        error_message = f"Sorry, I encountered an error while processing your request: {str(e)}"
        return ChatResponse(answer=error_message)
