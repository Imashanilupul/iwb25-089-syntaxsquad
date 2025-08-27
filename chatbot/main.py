from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import documents, query,chat

app = FastAPI(title="Gemini + Chroma Cloud RAG Backend")

# Add CORS middleware to handle requests from Ballerina backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/docs", tags=["Documents"])
app.include_router(query.router, prefix="/query", tags=["Query"])
app.include_router(chat.router,  tags=["chat"])

@app.get("/")
def root():
    return {"message": "RAG Backend running with Gemini + Chroma Cloud ✅"}
