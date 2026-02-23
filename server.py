
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import io
from typing import List, Optional

# Core RAG imports
try:
    from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
    from langchain_community.vectorstores import FAISS
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    from langchain_core.prompts import ChatPromptTemplate
    from pypdf import PdfReader
except ImportError:
    print("CRITICAL: Missing Python dependencies. Run: pip install fastapi uvicorn langchain langchain-google-genai faiss-cpu pypdf python-multipart")

app = FastAPI(title="EnergiIntel RAG Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Vector Store (In-memory for this instance, can be persisted to disk)
vector_store = None
indexed_chunks_count = 0

class QueryRequest(BaseModel):
    query: str
    session_id: Optional[str] = "default"

@app.get("/health")
async def health_check():
    return {
        "status": "online", 
        "vector_store_active": vector_store is not None,
        "chunks_indexed": indexed_chunks_count,
        "api_key_configured": os.environ.get("GOOGLE_API_KEY") is not None
    }

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    global vector_store, indexed_chunks_count
    try:
        content = ""
        filename = file.filename or "document"
        if not filename.lower().endswith((".pdf", ".txt")):
            raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported.")
        if filename.lower().endswith(".pdf"):
            raw = await file.read()
            pdf_reader = PdfReader(io.BytesIO(raw))
            for page in pdf_reader.pages:
                text = page.extract_text()
                content += (text or "") + "\n"
        else:
            raw_bytes = await file.read()
            content = raw_bytes.decode('utf-8')

        if not content.strip():
            raise HTTPException(status_code=400, detail="Document appears to be empty or unreadable.")

        # RAG Pipeline: Chunking (slightly smaller chunks for faster search)
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=120)
        chunks = text_splitter.split_text(content)
        
        # Metadata attachment
        metadata = [{"source": filename, "chunk": i} for i in range(len(chunks))]

        # RAG Pipeline: Embedding & Storage
        if not os.environ.get("GOOGLE_API_KEY"):
            # Note: We fallback to a descriptive error so the user knows to set the key in the terminal
            raise HTTPException(status_code=500, detail="Server-side GOOGLE_API_KEY is missing. Please export it in your terminal.")

        # Embedding model (some lib versions default to embedding-091 which returns 404)
        embedding_model = os.environ.get("GOOGLE_EMBEDDING_MODEL", "models/embedding-001")
        embeddings = GoogleGenerativeAIEmbeddings(model=embedding_model)
        
        if vector_store is None:
            vector_store = FAISS.from_texts(chunks, embeddings, metadatas=metadata)
        else:
            vector_store.add_texts(chunks, metadatas=metadata)
            
        indexed_chunks_count += len(chunks)
        
        return {
            "status": "success", 
            "filename": filename,
            "chunks_added": len(chunks),
            "total_chunks": indexed_chunks_count
        }
    except Exception as e:
        print(f"Upload Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
async def query_docs(request: QueryRequest):
    global vector_store
    if not vector_store:
        raise HTTPException(status_code=400, detail="Vector Store is empty. Please upload energy documents first.")
        
    try:
        # Standard RAG Retrieval: Similarity Search (fewer top documents for speed)
        docs = vector_store.similarity_search(request.query, k=3)
        context_text = "\n\n".join([f"[Source: {d.metadata['source']}]\n{d.page_content}" for d in docs])
        
        # Generation: Contextual Answer (use fast Flash model)
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")
        
        prompt = ChatPromptTemplate.from_template("""
        You are a senior Energy Sector Analyst. Answer the user question based ONLY on the provided technical context.
        
        TECHNICAL CONTEXT:
        {context}
        
        USER QUESTION:
        {question}
        
        INSTRUCTIONS:
        1. If the answer is not in the context, state: "The current technical documentation does not contain this information."
        2. Use bullet points for technical specifications.
        3. Maintain high professional standards.
        4. Refer to the sources provided in brackets [Source: ...].
        """)
        
        chain = prompt | llm
        response = chain.invoke({"context": context_text, "question": request.query})
        
        return {
            "answer": response.content,
            "sources": list(set([d.metadata.get("source", "Technical Archive") for d in docs]))
        }
    except Exception as e:
        print(f"Query Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"RAG Inference Failure: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Important: Run on port 8000
    print("Starting EnergiIntel Python RAG Server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
