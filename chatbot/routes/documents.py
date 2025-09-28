from fastapi import APIRouter, UploadFile, File, HTTPException
from db import get_chroma_client
from embeddings import get_embedding
import config
from typing import Optional, List
import PyPDF2
import io
import uuid
from datetime import datetime

router = APIRouter()
client = get_chroma_client()
collection = client.get_or_create_collection(config.CHROMA_COLLECTION)

def extract_text_from_pdf(pdf_file: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_file))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract text from PDF: {str(e)}")

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """Split text into overlapping chunks"""
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        
        if end < len(text):
            # Try to break at sentence boundary
            sentence_end = text.rfind('. ', start, end)
            if sentence_end > start:
                end = sentence_end + 1
            else:
                # Break at word boundary
                word_end = text.rfind(' ', start, end)
                if word_end > start:
                    end = word_end
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        
        start = end - overlap
        if start >= len(text):
            break
    
    return chunks

# @router.post("/add_document")
# def add_document(doc: Document):
#     embedding = get_embedding(doc.text)
#     collection.add(
#         documents=[doc.text],
#         embeddings=[embedding],
#         ids=[doc.id],
#         metadatas=[doc.metadata]  # pass metadata here
#     )
#     return {"message": "Document with metadata added to Chroma Cloud ✅"}

@router.post("/upload_pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    title: Optional[str] = None,
    category: Optional[str] = None,
    source: Optional[str] = None
):
    """Upload PDF file, extract text, chunk it, embed all chunks, and store in Chroma Cloud"""
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        # Read and extract text from PDF
        pdf_content = await file.read()
        full_text = extract_text_from_pdf(pdf_content)
        
        if not full_text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from the PDF")
        
        # Create metadata for Chroma Cloud
        base_metadata = {
            "filename": file.filename,
            "file_type": "pdf",
            "upload_date": datetime.now().isoformat(),
            "title": title or file.filename,
            "category": category or "general",
            "source": source or "upload",
            "total_length": len(full_text)
        }
        
        # Split text into chunks
        text_chunks = chunk_text(full_text)
        
        # Generate unique base ID
        base_id = str(uuid.uuid4())
        
        # Prepare data for Chroma Cloud
        documents = []
        embeddings = []
        ids = []
        metadatas = []
        
        print(f"Processing {len(text_chunks)} chunks for Chroma Cloud upload...")
        
        for i, chunk in enumerate(text_chunks):
            try:
                # Generate embedding for each chunk
                embedding = get_embedding(chunk)
                
                # Create chunk-specific metadata
                chunk_metadata = base_metadata.copy()
                chunk_metadata.update({
                    "chunk_id": i,
                    "chunk_size": len(chunk),
                    "total_chunks": len(text_chunks),
                    "document_base_id": base_id
                })
                
                # Prepare for batch upload to Chroma Cloud
                documents.append(chunk)
                embeddings.append(embedding)
                ids.append(f"{base_id}_chunk_{i}")
                metadatas.append(chunk_metadata)
                
                print(f"Prepared chunk {i+1}/{len(text_chunks)} for Chroma Cloud")
                
            except Exception as e:
                print(f"Failed to process chunk {i}: {str(e)}")
                continue
        
        if not documents:
            raise HTTPException(status_code=500, detail="Failed to process any chunks from the PDF")
        
        # Upload all chunks to Chroma Cloud using collection.add()
        print(f"Uploading {len(documents)} chunks to Chroma Cloud...")
        
        collection.add(
            documents=documents,        # Text content of each chunk
            embeddings=embeddings,      # Vector embeddings for each chunk
            ids=ids,                   # Unique IDs for each chunk
            metadatas=metadatas        # Metadata for each chunk
        )
        
        print("✅ Successfully uploaded to Chroma Cloud!")
        
        return {
            "message": f"PDF processed and uploaded to Chroma Cloud successfully ✅",
            "filename": file.filename,
            "chunks_processed": len(documents),
            "total_text_length": len(full_text),
            "document_id": base_id,
            "chroma_collection": config.CHROMA_COLLECTION,
            "uploaded_to_cloud": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error uploading to Chroma Cloud: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload to Chroma Cloud: {str(e)}")