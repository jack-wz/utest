import requests
import unittest
import os
import time
import json
from pathlib import Path

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://11b5d20f-d4ca-47d6-b84e-9550a6852d1d.preview.emergentagent.com"
API_URL = f"{BACKEND_URL}/api"

# Test constants
TEST_TIMEOUT = 30  # seconds to wait for workflow execution

# Enterprise feature test data
FEISHU_CONFIG = {
    "source_type": "feishu",
    "feishu_app_id": "cli_test123456",
    "feishu_app_secret": "test_secret_key",
    "feishu_scope": "all"
}

WECHAT_WORK_CONFIG = {
    "source_type": "wechat_work",
    "corp_id": "ww1234567890abcdef",
    "corp_secret": "test_corp_secret"
}

LLM_CONFIG = {
    "llm_provider": "openai",
    "model_name": "gpt-4",
    "api_key": "sk-test12345",
    "max_tokens": 4000,
    "temperature": 0.7,
    "task_type": "summarize"
}

VISION_CONFIG = {
    "vision_provider": "openai",
    "ocr_enabled": True,
    "layout_detection": True,
    "table_extraction": True,
    "image_description": True,
    "image_quality": "high",
    "ocr_language": "auto"
}

CHUNKING_CONFIG = {
    "chunk_strategy": "by_title",
    "chunk_size": 1000,
    "chunk_overlap": 200,
    "context_merge": True,
    "preserve_structure": True,
    "smart_boundary": True
}

EMBEDDING_CONFIG = {
    "embedding_provider": "openai",
    "embedding_model": "text-embedding-ada-002",
    "dimensions": 1536,
    "batch_size": 32
}

CONNECTOR_CONFIG = {
    "connector_type": "qdrant",
    "connection_url": "http://localhost:6333",
    "api_key": "test_api_key",
    "collection_name": "test_documents",
    "batch_size": 100,
    "auto_create_index": True
}

class UnstructuredWorkflowAPITest(unittest.TestCase):
    """Test suite for the Unstructured Workflow API"""
    
    def setUp(self):
        """Set up test environment"""
        self.workflow_id = None
        self.execution_id = None
        
        # Create a test file for upload
        self.test_file_path = Path("/tmp/test_document.txt")
        with open(self.test_file_path, "w") as f:
            f.write("This is a test document for the Unstructured Workflow API.\n" * 10)
    
    def tearDown(self):
        """Clean up after tests"""
        if self.test_file_path.exists():
            self.test_file_path.unlink()
    
    def test_01_api_root(self):
        """Test API root endpoint"""
        print("\n🔍 Testing API root endpoint...")
        response = requests.get(f"{API_URL}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["message"], "Unstructured Workflow API")
        self.assertEqual(data["status"], "running")
        print("✅ API root endpoint test passed")
    
    def test_02_vector_db_health(self):
        """Test vector DB health endpoint"""
        print("\n🔍 Testing vector DB health endpoint...")
        response = requests.get(f"{API_URL}/health/vector-db")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["storage_type"], "in-memory")
        print("✅ Vector DB health test passed")
    
    def test_03_file_upload(self):
        """Test file upload endpoint"""
        print("\n🔍 Testing file upload...")
        with open(self.test_file_path, "rb") as f:
            files = {"file": (self.test_file_path.name, f)}
            response = requests.post(f"{API_URL}/upload", files=files)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("file_id", data)
        self.assertIn("file_path", data)
        self.assertEqual(data["filename"], self.test_file_path.name)
        self.assertEqual(data["file_type"], "text/plain")
        
        # Save file path for workflow execution
        self.file_path = data["file_path"]
        print(f"✅ File upload test passed. File ID: {data['file_id']}")
    
    def test_04_create_workflow(self):
        """Test workflow creation"""
        print("\n🔍 Testing workflow creation...")
        
        # Create a simple workflow with the uploaded file
        workflow_data = {
            "name": "Test Workflow",
            "description": "A test workflow for API testing",
            "nodes": [
                {
                    "id": "1",
                    "type": "datasource",
                    "position": {"x": 100, "y": 100},
                    "data": {
                        "source_type": "upload",
                        "filename": self.test_file_path.name,
                        "file_path": self.file_path if hasattr(self, 'file_path') else "/tmp/test_document.txt"
                    }
                },
                {
                    "id": "2",
                    "type": "processor",
                    "position": {"x": 400, "y": 100},
                    "data": {
                        "processor_type": "unstructured"
                    }
                },
                {
                    "id": "3",
                    "type": "export",
                    "position": {"x": 700, "y": 100},
                    "data": {
                        "export_type": "vector_db"
                    }
                }
            ],
            "edges": [
                {"id": "e1-2", "source": "1", "target": "2"},
                {"id": "e2-3", "source": "2", "target": "3"}
            ]
        }
        
        response = requests.post(f"{API_URL}/workflows", json=workflow_data)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("id", data)
        self.assertEqual(data["name"], workflow_data["name"])
        
        # Save workflow ID for later tests
        self.workflow_id = data["id"]
        print(f"✅ Workflow creation test passed. Workflow ID: {self.workflow_id}")
    
    def test_05_get_workflows(self):
        """Test getting all workflows"""
        print("\n🔍 Testing get all workflows...")
        response = requests.get(f"{API_URL}/workflows")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        print(f"✅ Get workflows test passed. Found {len(data)} workflows")
    
    def test_06_get_workflow(self):
        """Test getting a specific workflow"""
        if not hasattr(self, 'workflow_id'):
            self.skipTest("No workflow ID available")
        
        print(f"\n🔍 Testing get workflow with ID: {self.workflow_id}...")
        response = requests.get(f"{API_URL}/workflows/{self.workflow_id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.workflow_id)
        print("✅ Get workflow test passed")
    
    def test_07_execute_workflow(self):
        """Test workflow execution"""
        if not hasattr(self, 'workflow_id'):
            self.skipTest("No workflow ID available")
        
        print(f"\n🔍 Testing workflow execution for ID: {self.workflow_id}...")
        response = requests.post(f"{API_URL}/workflows/{self.workflow_id}/execute")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("execution_id", data)
        self.assertEqual(data["status"], "started")
        
        # Save execution ID for status check
        self.execution_id = data["execution_id"]
        print(f"✅ Workflow execution started. Execution ID: {self.execution_id}")
    
    def test_08_get_execution_status(self):
        """Test getting execution status"""
        if not hasattr(self, 'execution_id'):
            self.skipTest("No execution ID available")
        
        print(f"\n🔍 Testing execution status for ID: {self.execution_id}...")
        
        # Poll for status a few times
        max_attempts = 15
        for attempt in range(max_attempts):
            try:
                response = requests.get(f"{API_URL}/executions/{self.execution_id}")
                
                # Check if we got a successful response
                if response.status_code == 200:
                    data = response.json()
                    print(f"  Status: {data['status']}, Progress: {data.get('progress', 0)}%")
                    
                    if data["status"] in ["completed", "failed"]:
                        if data["status"] == "completed":
                            print("✅ Workflow execution completed successfully")
                            if "results" in data:
                                print(f"  Results: {json.dumps(data['results'], indent=2)}")
                        else:
                            print(f"❌ Workflow execution failed: {data.get('error_message', 'Unknown error')}")
                        break
                else:
                    print(f"⚠️ Got status code {response.status_code} when checking execution status")
                    print(f"  Response: {response.text}")
                    
                # Wait before polling again
                time.sleep(2)
                
            except Exception as e:
                print(f"⚠️ Error checking execution status: {str(e)}")
                time.sleep(2)
            
            if attempt == max_attempts - 1:
                print("⚠️ Execution status polling timed out")
    
    def test_09_nonexistent_workflow(self):
        """Test getting a non-existent workflow"""
        print("\n🔍 Testing get non-existent workflow...")
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = requests.get(f"{API_URL}/workflows/{fake_id}")
        self.assertEqual(response.status_code, 404)
        print("✅ Non-existent workflow test passed")
    
    def test_10_nonexistent_execution(self):
        """Test getting a non-existent execution"""
        print("\n🔍 Testing get non-existent execution...")
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = requests.get(f"{API_URL}/executions/{fake_id}")
        self.assertEqual(response.status_code, 404)
        print("✅ Non-existent execution test passed")
    
    def test_11_full_workflow_cycle(self):
        """Test a complete workflow cycle with proper error handling"""
        print("\n🔍 Testing complete workflow cycle with error handling...")
        
        # 1. Upload a file
        with open(self.test_file_path, "rb") as f:
            files = {"file": (self.test_file_path.name, f)}
            response = requests.post(f"{API_URL}/upload", files=files)
        
        self.assertEqual(response.status_code, 200)
        file_data = response.json()
        file_path = file_data["file_path"]
        
        # 2. Create a workflow
        workflow_data = {
            "name": "Complete Test Workflow",
            "description": "Testing full cycle with error handling",
            "nodes": [
                {
                    "id": "1",
                    "type": "datasource",
                    "position": {"x": 100, "y": 100},
                    "data": {
                        "source_type": "upload",
                        "filename": self.test_file_path.name,
                        "file_path": file_path
                    }
                },
                {
                    "id": "2",
                    "type": "processor",
                    "position": {"x": 400, "y": 100},
                    "data": {
                        "processor_type": "unstructured"
                    }
                },
                {
                    "id": "3",
                    "type": "model",
                    "position": {"x": 700, "y": 100},
                    "data": {
                        "model_type": "embedding",
                        "model_name": "SentenceTransformer"
                    }
                },
                {
                    "id": "4",
                    "type": "export",
                    "position": {"x": 1000, "y": 100},
                    "data": {
                        "export_type": "vector_db"
                    }
                }
            ],
            "edges": [
                {"id": "e1-2", "source": "1", "target": "2"},
                {"id": "e2-3", "source": "2", "target": "3"},
                {"id": "e3-4", "source": "3", "target": "4"}
            ]
        }
        
        response = requests.post(f"{API_URL}/workflows", json=workflow_data)
        self.assertEqual(response.status_code, 200)
        workflow = response.json()
        workflow_id = workflow["id"]
        
        # 3. Execute the workflow
        response = requests.post(f"{API_URL}/workflows/{workflow_id}/execute")
        self.assertEqual(response.status_code, 200)
        execution_data = response.json()
        execution_id = execution_data["execution_id"]
        
        # 4. Poll for completion
        start_time = time.time()
        completed = False
        
        while time.time() - start_time < TEST_TIMEOUT:
            response = requests.get(f"{API_URL}/executions/{execution_id}")
            
            if response.status_code != 200:
                print(f"⚠️ Error response: {response.status_code} - {response.text}")
                break
                
            status_data = response.json()
            status = status_data.get("status")
            progress = status_data.get("progress", 0)
            
            print(f"  Status: {status}, Progress: {progress}%")
            
            if status == "completed":
                completed = True
                print("✅ Full workflow cycle completed successfully")
                print(f"  Results: {json.dumps(status_data.get('results', {}), indent=2)}")
                break
            elif status == "failed":
                print(f"❌ Workflow execution failed: {status_data.get('error_message', 'Unknown error')}")
                break
                
            time.sleep(2)
            
        if not completed:
            print("⚠️ Workflow execution timed out")
            
        self.assertTrue(completed, "Workflow should complete within the timeout period")

def run_tests():
    """Run all tests sequentially in a single test instance"""
    test_instance = UnstructuredWorkflowAPITest()
    test_instance.setUp()
    
    try:
        print("\n===== STARTING API TESTS =====")
        test_instance.test_01_api_root()
        test_instance.test_02_vector_db_health()
        test_instance.test_03_file_upload()
        test_instance.test_04_create_workflow()
        test_instance.test_05_get_workflows()
        test_instance.test_06_get_workflow()
        test_instance.test_07_execute_workflow()
        test_instance.test_08_get_execution_status()
        test_instance.test_09_nonexistent_workflow()
        test_instance.test_10_nonexistent_execution()
        test_instance.test_11_full_workflow_cycle()
        print("\n===== ALL TESTS COMPLETED =====")
    finally:
        test_instance.tearDown()

if __name__ == "__main__":
    run_tests()