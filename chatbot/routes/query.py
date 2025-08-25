from fastapi import APIRouter
from pydantic import BaseModel
from db import get_chroma_client
from embeddings import get_embedding
import config

router = APIRouter()
client = get_chroma_client()
collection = client.get_or_create_collection(config.CHROMA_COLLECTION)

class Query(BaseModel):
    text: str
    top_k: int = 3

@router.post("/query")
def query_docs(query: Query):
    embedding = get_embedding(query.text)
    results = collection.query(
        query_embeddings=[embedding],
        n_results=query.top_k
    )
    return {"results": results}
