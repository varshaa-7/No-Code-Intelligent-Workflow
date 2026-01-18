from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv

from services.document_processor import DocumentProcessor
from services.embedding_service import EmbeddingService
from services.vector_store import VectorStore
from services.workflow_executor import WorkflowExecutor
from services.llm_service import LLMService
from database import get_supabase_client

load_dotenv()

app = FastAPI(title="GenAI Stack API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

document_processor = DocumentProcessor()
embedding_service = EmbeddingService()
vector_store = VectorStore()
llm_service = LLMService()
workflow_executor = WorkflowExecutor(
    document_processor=document_processor,
    embedding_service=embedding_service,
    vector_store=vector_store,
    llm_service=llm_service,
)

supabase = get_supabase_client()


class DocumentUploadResponse(BaseModel):
    id: str
    filename: str
    message: str


class EmbeddingRequest(BaseModel):
    document_id: str
    api_key: str


class WorkflowExecuteRequest(BaseModel):
    stack_id: str
    query: str
    session_id: Optional[str] = None


class WorkflowExecuteResponse(BaseModel):
    execution_id: str
    response: str
    status: str
    error_message: Optional[str] = None


@app.get("/")
async def root():
    return {"message": "GenAI Stack API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/documents/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    stack_id: str = File(...),
):
    try:
        content = await file.read()

        text_content = document_processor.extract_text(content, file.filename)

        result = supabase.table("documents").insert({
            "stack_id": stack_id,
            "filename": file.filename,
            "file_path": f"uploads/{stack_id}/{file.filename}",
            "content": text_content,
            "metadata": {
                "size": len(content),
                "content_type": file.content_type,
            }
        }).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save document")

        document_id = result.data[0]["id"]

        return DocumentUploadResponse(
            id=document_id,
            filename=file.filename,
            message="Document uploaded successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/embeddings/generate")
async def generate_embeddings(request: EmbeddingRequest):
    try:
        result = supabase.table("documents").select("*").eq("id", request.document_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Document not found")

        document = result.data[0]
        text_content = document["content"]

        chunks = document_processor.chunk_text(text_content)

        embeddings = embedding_service.generate_embeddings(chunks, request.api_key)

        embedding_records = []
        for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            embedding_records.append({
                "document_id": request.document_id,
                "chunk_text": chunk,
                "chunk_index": idx,
                "embedding": embedding,
            })

        supabase.table("embeddings").insert(embedding_records).execute()

        vector_store.add_documents(
            document_id=request.document_id,
            chunks=chunks,
            embeddings=embeddings
        )

        return {
            "message": "Embeddings generated successfully",
            "chunks_processed": len(chunks)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/workflow/execute", response_model=WorkflowExecuteResponse)
async def execute_workflow(request: WorkflowExecuteRequest):
    try:
        result = supabase.table("stacks").select("*").eq("id", request.stack_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Stack not found")

        stack = result.data[0]
        workflow_data = stack["workflow_data"]

        execution_result = await workflow_executor.execute(
            workflow_data=workflow_data,
            query=request.query,
            stack_id=request.stack_id,
            session_id=request.session_id,
        )

        execution_record = supabase.table("workflow_executions").insert({
            "stack_id": request.stack_id,
            "session_id": request.session_id,
            "query": request.query,
            "response": execution_result["response"],
            "execution_data": execution_result["execution_data"],
            "status": execution_result["status"],
            "error_message": execution_result.get("error_message"),
        }).execute()

        execution_id = execution_record.data[0]["id"] if execution_record.data else None

        return WorkflowExecuteResponse(
            execution_id=execution_id,
            response=execution_result["response"],
            status=execution_result["status"],
            error_message=execution_result.get("error_message")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/documents/{stack_id}")
async def get_documents(stack_id: str):
    try:
        result = supabase.table("documents").select("id, filename, created_at").eq("stack_id", stack_id).execute()
        return {"documents": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    try:
        supabase.table("embeddings").delete().eq("document_id", document_id).execute()

        supabase.table("documents").delete().eq("id", document_id).execute()

        vector_store.delete_document(document_id)

        return {"message": "Document deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
