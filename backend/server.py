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
import magic
from unstructured.partition.auto import partition
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
import asyncio
from concurrent.futures import ThreadPoolExecutor
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize Qdrant client (memory mode for development)
qdrant_client = QdrantClient(":memory:")

# Initialize embedding model
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# Thread pool for CPU-intensive tasks
executor = ThreadPoolExecutor(max_workers=4)

# Create the main app without a prefix
app = FastAPI(title="Unstructured Workflow API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Ensure upload directory exists
UPLOAD_DIR = Path("/tmp/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

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

# Utility functions
def extract_text_from_file(file_path: str) -> List[Dict[str, Any]]:
    """Extract text and metadata from uploaded file using Unstructured"""
    try:
        elements = partition(filename=file_path)
        return [
            {
                "text": str(element),
                "type": element.category if hasattr(element, 'category') else "unknown",
                "metadata": element.metadata.to_dict() if hasattr(element, 'metadata') else {}
            }
            for element in elements
        ]
    except Exception as e:
        logging.error(f"Error processing file {file_path}: {e}")
        return []

def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for text chunks"""
    try:
        embeddings = embedding_model.encode(texts)
        return embeddings.tolist()
    except Exception as e:
        logging.error(f"Error generating embeddings: {e}")
        return []

async def store_in_vector_db(texts: List[str], embeddings: List[List[float]], collection_name: str):
    """Store texts and embeddings in Qdrant"""
    try:
        # Create collection if it doesn't exist
        try:
            qdrant_client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE)
            )
        except Exception:
            pass  # Collection might already exist
        
        # Prepare points
        points = [
            PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding,
                payload={"text": text}
            )
            for text, embedding in zip(texts, embeddings)
        ]
        
        # Insert points
        qdrant_client.upsert(collection_name=collection_name, points=points)
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
    return [Workflow(**workflow) for workflow in workflows]

@api_router.get("/workflows/{workflow_id}", response_model=Workflow)
async def get_workflow(workflow_id: str):
    workflow = await db.workflows.find_one({"id": workflow_id})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
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
        
        # Detect file type
        file_type = magic.from_file(str(file_path), mime=True)
        
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
            success = await asyncio.get_event_loop().run_in_executor(
                executor, store_in_vector_db, all_texts, embeddings, collection_name
            )
            
            results["vector_storage"] = {
                "success": success,
                "collection": collection_name,
                "documents_stored": len(all_texts)
            }
        
        results["texts_processed"] = len(all_texts)
        results["processing_summary"] = f"Processed {len(all_texts)} text chunks"
        
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
    return [ModelConfig(**model) for model in models]

# Health check for vector database
@api_router.get("/health/vector-db")
async def check_vector_db():
    try:
        collections = qdrant_client.get_collections()
        return {"status": "healthy", "collections": len(collections.collections)}
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
    
    # Initialize Qdrant collections if needed
    try:
        collections = qdrant_client.get_collections()
        logger.info(f"Vector database connected. Collections: {len(collections.collections)}")
    except Exception as e:
        logger.warning(f"Vector database connection failed: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    executor.shutdown(wait=True)