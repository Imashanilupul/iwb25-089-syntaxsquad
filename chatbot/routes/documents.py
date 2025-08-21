from fastapi import APIRouter
from pydantic import BaseModel
from db import get_chroma_client
from embeddings import get_embedding
import config
from typing import Optional, Dict

router = APIRouter()
client = get_chroma_client()
collection = client.get_or_create_collection(config.CHROMA_COLLECTION)

class Document(BaseModel):
    id: str
    text: str
    metadata: Optional[Dict] = {}  # optional metadata

@router.post("/add_document")
def add_document(doc: Document):
    embedding = get_embedding(doc.text)
    collection.add(
        documents=[doc.text],
        embeddings=[embedding],
        ids=[doc.id],
        metadatas=[doc.metadata]  # pass metadata here
    )
    return {"message": "Document with metadata added to Chroma Cloud ✅"}