from fastapi import FastAPI
from routes import documents, query,chat

app = FastAPI(title="Gemini + Chroma Cloud RAG Backend")

app.include_router(documents.router, prefix="/docs", tags=["Documents"])
app.include_router(query.router, prefix="/query", tags=["Query"])
app.include_router(chat.router,  tags=["chat"])

@app.get("/")
def root():
    return {"message": "RAG Backend running with Gemini + Chroma Cloud ✅"}
