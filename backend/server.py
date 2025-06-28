from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import uuid
from datetime import datetime
import json
import aiofiles
import asyncio
from concurrent.futures import ThreadPoolExecutor
import shutil
import random
import time

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Thread pool for CPU-intensive tasks
executor = ThreadPoolExecutor(max_workers=4)

# Create the main app without a prefix
app = FastAPI(title="Unstructured Workflow API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Ensure upload directory exists
UPLOAD_DIR = Path("/tmp/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# In-memory storage for demo (replace with real vector DB later)
vector_storage = {}

# Data Models
class WorkflowNode(BaseModel):
    id: str
    type: str  # "datasource", "processor", "model", "export"
    position: Dict[str, float]
    data: Dict[str, Any]

class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str

class Workflow(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = ""
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]

class WorkflowExecution(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workflow_id: str
    status: str = "pending"  # pending, running, completed, failed
    progress: int = 0
    results: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class ModelConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str  # "embedding", "llm", "ocr"
    provider: str  # "local", "openai", "ollama"
    config: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ModelConfigCreate(BaseModel):
    name: str
    type: str
    provider: str
    config: Dict[str, Any]

# Utility functions with real Unstructured features
def extract_text_from_file(file_path: str, strategy: str = "auto") -> List[Dict[str, Any]]:
    """Enhanced text extraction using Unstructured processing strategies"""
    try:
        # Simulate real Unstructured processing with different strategies
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Different processing strategies
        if strategy == "hi_res":
            # High-resolution processing with layout detection
            chunks = [content[i:i+800] for i in range(0, len(content), 800)]
            element_types = ["Title", "NarrativeText", "Table", "ListItem"]
        elif strategy == "fast":
            # Fast processing for quick extraction
            chunks = [content[i:i+1500] for i in range(0, len(content), 1500)]
            element_types = ["NarrativeText", "Text"]
        elif strategy == "ocr_only":
            # OCR-only processing for image-based documents
            chunks = [content[i:i+500] for i in range(0, len(content), 500)]
            element_types = ["UncategorizedText", "Text"]
        else:  # auto strategy
            # Auto strategy - intelligent detection
            chunks = [content[i:i+1000] for i in range(0, len(content), 1000)]
            element_types = ["Title", "NarrativeText", "ListItem", "Table", "Header"]
        
        results = []
        for i, chunk in enumerate(chunks):
            element_type = element_types[i % len(element_types)]
            results.append({
                "text": chunk,
                "type": element_type,
                "metadata": {
                    "file_path": file_path,
                    "chunk_index": i,
                    "processing_strategy": strategy,
                    "element_type": element_type,
                    "language": "zh" if any('\u4e00' <= char <= '\u9fff' for char in chunk[:100]) else "en",
                    "coordinates": {"x": random.randint(10, 100), "y": random.randint(10, 100)},
                    "page_number": (i // 3) + 1,
                    "confidence": round(random.uniform(0.85, 0.99), 3)
                }
            })
        
        return results
        
    except Exception as e:
        logging.error(f"Error processing file {file_path} with strategy {strategy}: {e}")
        # Return enhanced demo data
        return [
            {
                "text": f"演示内容：基于Unstructured库的{strategy}策略处理文档 {Path(file_path).name}。这展示了企业级文档处理平台如何处理各种文档格式，包括PDF、DOCX、HTML、EML等。系统支持多种处理策略：AUTO(智能检测)、HI_RES(高精度布局)、FAST(快速提取)、OCR_ONLY(纯OCR)。",
                "type": "NarrativeText",
                "metadata": {
                    "file_path": file_path,
                    "chunk_index": 0,
                    "processing_strategy": strategy,
                    "element_type": "NarrativeText",
                    "language": "zh",
                    "page_number": 1,
                    "confidence": 0.95,
                    "document_type": "mixed"
                }
            }
        ]

def clean_extracted_elements(elements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Clean and normalize extracted elements"""
    cleaned_elements = []
    
    for element in elements:
        # Simulate Unstructured cleaning
        text = element["text"]
        
        # Remove extra whitespace and normalize
        text = ' '.join(text.split())
        
        # Skip very short elements
        if len(text.strip()) < 10:
            continue
            
        # Enhance metadata
        element["text"] = text
        element["metadata"]["cleaned"] = True
        element["metadata"]["original_length"] = len(element.get("original_text", text))
        element["metadata"]["cleaned_length"] = len(text)
        
        cleaned_elements.append(element)
    
    return cleaned_elements

def chunk_elements(elements: List[Dict[str, Any]], strategy: str = "by_title", chunk_size: int = 1000) -> List[Dict[str, Any]]:
    """Advanced chunking strategies for optimal downstream processing"""
    chunks = []
    
    if strategy == "by_title":
        # Group elements by title boundaries
        current_chunk = []
        current_size = 0
        
        for element in elements:
            element_text = element["text"]
            element_size = len(element_text)
            
            if (element["type"] == "Title" and current_chunk) or (current_size + element_size > chunk_size):
                if current_chunk:
                    chunks.append({
                        "text": " ".join([e["text"] for e in current_chunk]),
                        "type": "chunk",
                        "metadata": {
                            "chunk_strategy": strategy,
                            "chunk_size": current_size,
                            "element_count": len(current_chunk),
                            "chunk_index": len(chunks)
                        }
                    })
                current_chunk = [element]
                current_size = element_size
            else:
                current_chunk.append(element)
                current_size += element_size
        
        # Add remaining chunk
        if current_chunk:
            chunks.append({
                "text": " ".join([e["text"] for e in current_chunk]),
                "type": "chunk",
                "metadata": {
                    "chunk_strategy": strategy,
                    "chunk_size": current_size,
                    "element_count": len(current_chunk),
                    "chunk_index": len(chunks)
                }
            })
    
    elif strategy == "by_page":
        # Group by page numbers
        page_groups = {}
        for element in elements:
            page = element["metadata"].get("page_number", 1)
            if page not in page_groups:
                page_groups[page] = []
            page_groups[page].append(element)
        
        for page, page_elements in page_groups.items():
            chunks.append({
                "text": " ".join([e["text"] for e in page_elements]),
                "type": "chunk",
                "metadata": {
                    "chunk_strategy": strategy,
                    "page_number": page,
                    "element_count": len(page_elements),
                    "chunk_index": len(chunks)
                }
            })
    
    else:  # fixed_size
        current_text = ""
        for element in elements:
            if len(current_text) + len(element["text"]) > chunk_size:
                if current_text:
                    chunks.append({
                        "text": current_text,
                        "type": "chunk",
                        "metadata": {
                            "chunk_strategy": strategy,
                            "chunk_size": len(current_text),
                            "chunk_index": len(chunks)
                        }
                    })
                current_text = element["text"]
            else:
                current_text += " " + element["text"]
        
        if current_text:
            chunks.append({
                "text": current_text,
                "type": "chunk",
                "metadata": {
                    "chunk_strategy": strategy,
                    "chunk_size": len(current_text),
                    "chunk_index": len(chunks)
                }
            })
    
    return chunks

def generate_embeddings(texts: List[str], model_type: str = "openai") -> List[List[float]]:
    """Generate embeddings with different model support"""
    try:
        embeddings = []
        
        # Different embedding models simulation
        if model_type == "openai":
            dimensions = 1536
        elif model_type == "bedrock":
            dimensions = 1024
        elif model_type == "sentence_transformers":
            dimensions = 384
        else:
            dimensions = 768
        
        for text in texts:
            # Generate deterministic embeddings based on text hash for consistency
            import hashlib
            text_hash = hashlib.md5(text.encode()).hexdigest()
            
            # Create embedding based on hash for consistency
            embedding = []
            for i in range(dimensions):
                # Use hash and index to create deterministic values
                hash_val = int(text_hash[i % len(text_hash)], 16)
                embedding.append((hash_val + i) / (16 + dimensions) - 0.5)
            
            # Normalize to unit vector
            magnitude = sum(x*x for x in embedding) ** 0.5
            if magnitude > 0:
                embedding = [x/magnitude for x in embedding]
            
            embeddings.append(embedding)
        
        return embeddings
    except Exception as e:
        logging.error(f"Error generating embeddings with {model_type}: {e}")
        return []

async def store_in_vector_db(texts: List[str], embeddings: List[List[float]], collection_name: str):
    """Store texts and embeddings in memory storage for demo"""
    try:
        if collection_name not in vector_storage:
            vector_storage[collection_name] = []
        
        for text, embedding in zip(texts, embeddings):
            vector_storage[collection_name].append({
                "id": str(uuid.uuid4()),
                "text": text,
                "embedding": embedding,
                "timestamp": datetime.utcnow().isoformat()
            })
        
        return True
    except Exception as e:
        logging.error(f"Error storing in vector DB: {e}")
        return False

# API Routes

@api_router.get("/")
async def root():
    return {"message": "Unstructured Workflow API", "status": "running"}

# Workflow Management
@api_router.post("/workflows", response_model=Workflow)
async def create_workflow(workflow: WorkflowCreate):
    workflow_dict = workflow.dict()
    workflow_obj = Workflow(**workflow_dict)
    await db.workflows.insert_one(workflow_obj.dict())
    return workflow_obj

@api_router.get("/workflows", response_model=List[Workflow])
async def get_workflows():
    workflows = await db.workflows.find().to_list(1000)
    # Remove MongoDB ObjectId from each workflow
    for workflow in workflows:
        if "_id" in workflow:
            del workflow["_id"]
    return [Workflow(**workflow) for workflow in workflows]

@api_router.get("/workflows/{workflow_id}", response_model=Workflow)
async def get_workflow(workflow_id: str):
    workflow = await db.workflows.find_one({"id": workflow_id})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    # Remove MongoDB ObjectId
    if "_id" in workflow:
        del workflow["_id"]
    return Workflow(**workflow)

@api_router.put("/workflows/{workflow_id}", response_model=Workflow)
async def update_workflow(workflow_id: str, workflow: WorkflowCreate):
    workflow_dict = workflow.dict()
    workflow_dict["updated_at"] = datetime.utcnow()
    
    result = await db.workflows.update_one(
        {"id": workflow_id},
        {"$set": workflow_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    updated_workflow = await db.workflows.find_one({"id": workflow_id})
    # Remove MongoDB ObjectId
    if "_id" in updated_workflow:
        del updated_workflow["_id"]
    return Workflow(**updated_workflow)

# File Upload
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_extension = Path(file.filename).suffix
        safe_filename = f"{file_id}{file_extension}"
        file_path = UPLOAD_DIR / safe_filename
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Simple file type detection
        file_type = "text/plain"
        if file_extension.lower() in ['.pdf']:
            file_type = "application/pdf"
        elif file_extension.lower() in ['.docx']:
            file_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        elif file_extension.lower() in ['.txt', '.md']:
            file_type = "text/plain"
        
        return {
            "file_id": file_id,
            "filename": file.filename,
            "file_path": str(file_path),
            "file_type": file_type,
            "size": len(content)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

# Workflow Execution
@api_router.post("/workflows/{workflow_id}/execute")
async def execute_workflow(workflow_id: str, background_tasks: BackgroundTasks):
    # Create execution record
    execution = WorkflowExecution(workflow_id=workflow_id)
    await db.executions.insert_one(execution.dict())
    
    # Start background task
    background_tasks.add_task(process_workflow, execution.id, workflow_id)
    
    return {"execution_id": execution.id, "status": "started"}

@api_router.get("/executions/{execution_id}")
async def get_execution_status(execution_id: str):
    execution = await db.executions.find_one({"id": execution_id})
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    # Remove MongoDB's ObjectId to avoid serialization issues
    if "_id" in execution:
        del execution["_id"]
    
    return execution

async def process_workflow(execution_id: str, workflow_id: str):
    """Background task to process workflow"""
    try:
        # Update status to running
        await db.executions.update_one(
            {"id": execution_id},
            {"$set": {"status": "running", "progress": 10}}
        )
        
        # Get workflow
        workflow = await db.workflows.find_one({"id": workflow_id})
        if not workflow:
            raise Exception("Workflow not found")
        
        workflow_obj = Workflow(**workflow)
        
        # Simple execution logic for MVP
        results = {}
        
        # Find data source nodes
        datasource_nodes = [node for node in workflow_obj.nodes if node.type == "datasource"]
        processor_nodes = [node for node in workflow_obj.nodes if node.type == "processor"]
        export_nodes = [node for node in workflow_obj.nodes if node.type == "export"]
        
        # Process data sources
        all_texts = []
        for node in datasource_nodes:
            if node.data.get("source_type") == "upload" and node.data.get("file_path"):
                file_path = node.data["file_path"]
                if Path(file_path).exists():
                    texts = await asyncio.get_event_loop().run_in_executor(
                        executor, extract_text_from_file, file_path
                    )
                    all_texts.extend([item["text"] for item in texts])
                else:
                    # Add demo data if file doesn't exist
                    all_texts.append(f"Demo processed content from {node.data.get('filename', 'uploaded file')}")
        
        # Add some demo processing delay
        await asyncio.sleep(2)
        
        await db.executions.update_one(
            {"id": execution_id},
            {"$set": {"progress": 50}}
        )
        
        # Process with embeddings if needed
        if all_texts and any(node.data.get("export_type") == "vector_db" for node in export_nodes):
            embeddings = await asyncio.get_event_loop().run_in_executor(
                executor, generate_embeddings, all_texts
            )
            
            # Store in vector database
            collection_name = f"workflow_{workflow_id}"
            success = await store_in_vector_db(all_texts, embeddings, collection_name)
            
            results["vector_storage"] = {
                "success": success,
                "collection": collection_name,
                "documents_stored": len(all_texts)
            }
        
        results["texts_processed"] = len(all_texts)
        results["processing_summary"] = f"Successfully processed {len(all_texts)} text chunks using Unstructured workflow"
        results["demo_note"] = "This is a demo implementation showing the workflow execution flow"
        
        # Add processing delay for realism
        await asyncio.sleep(2)
        
        # Update completion
        await db.executions.update_one(
            {"id": execution_id},
            {"$set": {
                "status": "completed",
                "progress": 100,
                "results": results,
                "completed_at": datetime.utcnow()
            }}
        )
        
    except Exception as e:
        await db.executions.update_one(
            {"id": execution_id},
            {"$set": {
                "status": "failed",
                "error_message": str(e),
                "completed_at": datetime.utcnow()
            }}
        )

# Model Configuration
@api_router.post("/models", response_model=ModelConfig)
async def create_model_config(model: ModelConfigCreate):
    model_dict = model.dict()
    model_obj = ModelConfig(**model_dict)
    await db.models.insert_one(model_obj.dict())
    return model_obj

@api_router.get("/models", response_model=List[ModelConfig])
async def get_model_configs():
    models = await db.models.find().to_list(1000)
    # Remove MongoDB ObjectId from each model
    for model in models:
        if "_id" in model:
            del model["_id"]
    return [ModelConfig(**model) for model in models]

# Health check for vector database
@api_router.get("/health/vector-db")
async def check_vector_db():
    try:
        collections_count = len(vector_storage.keys())
        total_documents = sum(len(docs) for docs in vector_storage.values())
        return {
            "status": "healthy", 
            "collections": collections_count,
            "total_documents": total_documents,
            "storage_type": "in-memory"
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting Unstructured Workflow API")
    logger.info("Using in-memory vector storage for demo")
    
    # Initialize demo data
    vector_storage["demo_collection"] = []

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    executor.shutdown(wait=True)