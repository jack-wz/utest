import requests
import unittest
import os
import time
import json
from pathlib import Path

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://11b5d20f-d4ca-47d6-b84e-9550a6852d1d.preview.emergentagent.com"
API_URL = f"{BACKEND_URL}/api"

class UnstructuredWorkflowAPITest(unittest.TestCase):
    """Test suite for the Unstructured Workflow API with enhanced metadata extraction and visualization"""
    
    def setUp(self):
        """Set up test environment"""
        self.workflow_id = None
        self.execution_id = None
        self.document_id = None
        
        # Create a test file for upload
        self.test_file_path = Path("/tmp/test_document.txt")
        with open(self.test_file_path, "w") as f:
            f.write("This is a test document for the Unstructured Workflow API.\n" * 10)
            f.write("# Section 1\n\nThis is the first section of the document.\n\n")
            f.write("# Section 2\n\nThis is the second section with some tabular data:\n\n")
            f.write("| Column 1 | Column 2 | Column 3 |\n")
            f.write("|----------|----------|----------|\n")
            f.write("| Data 1   | Data 2   | Data 3   |\n")
            f.write("| Data 4   | Data 5   | Data 6   |\n\n")
            f.write("# Section 3\n\nThis is the third section with a list:\n\n")
            f.write("* Item 1\n* Item 2\n* Item 3\n\n")
    
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
        self.assertEqual(data["message"], "Unstructured Enterprise Workflow API")
        self.assertEqual(data["status"], "running")
        print("✅ API root endpoint test passed")
    
    def test_02_document_processing(self):
        """Test document processing with enhanced metadata extraction"""
        print("\n🔍 Testing document processing with metadata extraction...")
        
        with open(self.test_file_path, "rb") as f:
            files = {"file": (self.test_file_path.name, f)}
            response = requests.post(
                f"{API_URL}/documents/process",
                files=files,
                data={
                    "strategy": "auto",
                    "extract_metadata": "true"
                }
            )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify document structure
        self.assertIn("document", data)
        self.assertIn("visualization", data)
        
        # Save document ID for later tests
        self.document_id = data["document"]["id"]
        
        # Verify document fields
        document = data["document"]
        self.assertIn("id", document)
        self.assertIn("filename", document)
        self.assertIn("elements", document)
        self.assertIn("metadata", document)
        
        # Verify elements have metadata
        self.assertTrue(len(document["elements"]) > 0)
        for element in document["elements"]:
            self.assertIn("id", element)
            self.assertIn("type", element)
            self.assertIn("text", element)
            self.assertIn("metadata", element)
            self.assertIn("coordinates", element)
            self.assertIn("confidence", element)
        
        # Verify visualization data
        visualization = data["visualization"]
        self.assertEqual(visualization["document_id"], document["id"])
        self.assertIn("original_layout", visualization)
        self.assertIn("processed_layout", visualization)
        self.assertIn("element_mapping", visualization)
        
        print(f"✅ Document processing test passed. Document ID: {self.document_id}")
        print(f"  Elements extracted: {len(document['elements'])}")
        print(f"  Document type: {document['metadata'].get('processing_strategy', 'auto')}")
    
    def test_03_get_document(self):
        """Test getting a processed document by ID"""
        if not self.document_id:
            self.skipTest("No document ID available")
        
        print(f"\n🔍 Testing get document with ID: {self.document_id}...")
        response = requests.get(f"{API_URL}/documents/{self.document_id}")
        
        self.assertEqual(response.status_code, 200)
        document = response.json()
        
        self.assertEqual(document["id"], self.document_id)
        self.assertIn("elements", document)
        self.assertIn("metadata", document)
        
        print("✅ Get document test passed")
    
    def test_04_get_document_visualization(self):
        """Test getting document visualization data"""
        if not self.document_id:
            self.skipTest("No document ID available")
        
        print(f"\n🔍 Testing document visualization for ID: {self.document_id}...")
        response = requests.get(f"{API_URL}/documents/{self.document_id}/visualization")
        
        self.assertEqual(response.status_code, 200)
        visualization = response.json()
        
        self.assertEqual(visualization["document_id"], self.document_id)
        self.assertIn("original_layout", visualization)
        self.assertIn("processed_layout", visualization)
        self.assertIn("element_mapping", visualization)
        
        # Verify layout structure
        self.assertIn("pages", visualization["original_layout"])
        self.assertTrue(len(visualization["original_layout"]["pages"]) > 0)
        
        print("✅ Document visualization test passed")
        print(f"  Pages in visualization: {len(visualization['original_layout']['pages'])}")
    
    def test_05_document_comparison(self):
        """Test document comparison functionality"""
        if not self.document_id:
            self.skipTest("No document ID available")
        
        print(f"\n🔍 Testing document comparison for ID: {self.document_id}...")
        response = requests.get(f"{API_URL}/documents/{self.document_id}/compare")
        
        self.assertEqual(response.status_code, 200)
        comparison = response.json()
        
        self.assertEqual(comparison["document_id"], self.document_id)
        self.assertIn("before_elements", comparison)
        self.assertIn("after_elements", comparison)
        self.assertIn("changes", comparison)
        self.assertIn("visualization", comparison)
        
        print("✅ Document comparison test passed")
        print(f"  Changes detected: {len(comparison['changes'])}")
    
    def test_06_create_document_chunks(self):
        """Test creating intelligent chunks from document elements"""
        if not self.document_id:
            self.skipTest("No document ID available")
        
        print(f"\n🔍 Testing intelligent chunking for document ID: {self.document_id}...")
        
        # Test different chunking strategies
        strategies = ["by_title", "by_page"]
        
        for strategy in strategies:
            print(f"  Testing chunking strategy: {strategy}")
            response = requests.post(
                f"{API_URL}/documents/{self.document_id}/chunks",
                json={
                    "chunk_strategy": strategy,
                    "chunk_size": 1000,
                    "context_merge": True
                }
            )
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            
            self.assertEqual(data["document_id"], self.document_id)
            self.assertIn("chunks", data)
            self.assertIn("total_chunks", data)
            self.assertEqual(data["strategy"], strategy)
            
            # Verify chunks structure
            self.assertTrue(len(data["chunks"]) > 0)
            for chunk in data["chunks"]:
                self.assertIn("id", chunk)
                self.assertIn("text", chunk)
                self.assertIn("metadata", chunk)
                self.assertIn("source_elements", chunk)
                self.assertIn("chunk_index", chunk)
                self.assertIn("tokens", chunk)
            
            print(f"  ✅ Chunking with strategy '{strategy}' created {data['total_chunks']} chunks")
    
    def test_07_get_document_chunks(self):
        """Test getting all chunks for a document"""
        if not self.document_id:
            self.skipTest("No document ID available")
        
        print(f"\n🔍 Testing get chunks for document ID: {self.document_id}...")
        response = requests.get(f"{API_URL}/documents/{self.document_id}/chunks")
        
        self.assertEqual(response.status_code, 200)
        chunks = response.json()
        
        self.assertTrue(isinstance(chunks, list))
        if len(chunks) > 0:
            for chunk in chunks:
                self.assertIn("id", chunk)
                self.assertIn("text", chunk)
                self.assertIn("metadata", chunk)
        
        print(f"✅ Get chunks test passed. Found {len(chunks)} chunks")
    
    def test_08_edit_chunk(self):
        """Test editing a document chunk"""
        if not self.document_id:
            self.skipTest("No document ID available")
        
        # First get chunks to find one to edit
        print(f"\n🔍 Testing chunk editing functionality...")
        response = requests.get(f"{API_URL}/documents/{self.document_id}/chunks")
        
        if response.status_code != 200 or len(response.json()) == 0:
            self.skipTest("No chunks available to edit")
        
        chunks = response.json()
        chunk_to_edit = chunks[0]
        chunk_id = chunk_to_edit["id"]
        original_text = chunk_to_edit["text"]
        
        # Edit the chunk
        new_text = f"{original_text} [EDITED BY TEST]"
        edit_data = {
            "chunk_id": chunk_id,
            "new_text": new_text,
            "edit_reason": "Automated test edit"
        }
        
        edit_response = requests.put(f"{API_URL}/chunks/{chunk_id}/edit", json=edit_data)
        
        self.assertEqual(edit_response.status_code, 200)
        updated_chunk = edit_response.json()
        
        self.assertEqual(updated_chunk["id"], chunk_id)
        self.assertEqual(updated_chunk["text"], new_text)
        self.assertTrue(updated_chunk["is_edited"])
        self.assertTrue(len(updated_chunk["edit_history"]) > 0)
        
        print(f"✅ Chunk editing test passed. Chunk ID: {chunk_id}")
        print(f"  Edit history entries: {len(updated_chunk['edit_history'])}")
    
    def test_09_export_document(self):
        """Test document export functionality"""
        if not self.document_id:
            self.skipTest("No document ID available")
        
        print(f"\n🔍 Testing document export functionality...")
        
        # Test JSON export
        json_response = requests.post(f"{API_URL}/documents/{self.document_id}/export?format=json")
        self.assertEqual(json_response.status_code, 200)
        self.assertEqual(json_response.headers["Content-Type"], "application/json")
        
        # Test ZIP export
        zip_response = requests.post(f"{API_URL}/documents/{self.document_id}/export?format=zip")
        self.assertEqual(zip_response.status_code, 200)
        self.assertEqual(zip_response.headers["Content-Type"], "application/zip")
        
        print("✅ Document export test passed")
    
    def test_10_create_workflow(self):
        """Test workflow creation with document processing nodes"""
        print("\n🔍 Testing workflow creation...")
        
        # Create a workflow with document processing nodes
        workflow_data = {
            "name": "Document Processing Workflow",
            "description": "A workflow for testing document processing and visualization",
            "nodes": [
                {
                    "id": "1",
                    "type": "datasource",
                    "position": {"x": 100, "y": 150},
                    "data": {
                        "source_type": "upload",
                        "processing_strategy": "auto",
                        "filename": self.test_file_path.name,
                        "file_path": str(self.test_file_path)
                    }
                },
                {
                    "id": "2",
                    "type": "chunking",
                    "position": {"x": 400, "y": 150},
                    "data": {
                        "chunk_strategy": "by_title",
                        "chunk_size": 1000,
                        "context_merge": True
                    }
                },
                {
                    "id": "3",
                    "type": "embedding",
                    "position": {"x": 700, "y": 150},
                    "data": {
                        "embedding_provider": "openai",
                        "embedding_model": "text-embedding-ada-002",
                        "dimensions": 1536
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
    
    def test_11_execute_workflow(self):
        """Test workflow execution"""
        if not self.workflow_id:
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
    
    def test_12_get_execution_status(self):
        """Test getting execution status"""
        if not self.execution_id:
            self.skipTest("No execution ID available")
        
        print(f"\n🔍 Testing execution status for ID: {self.execution_id}...")
        
        # Poll for status a few times
        max_attempts = 10
        for attempt in range(max_attempts):
            try:
                response = requests.get(f"{API_URL}/executions/{self.execution_id}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"  Status: {data['status']}, Progress: {data.get('progress', 0)}%")
                    
                    if data["status"] in ["completed", "failed"]:
                        if data["status"] == "completed":
                            print("✅ Workflow execution completed successfully")
                            if "results" in data:
                                print(f"  Pipeline stages: {len(data['results'].get('pipeline_stages', []))}")
                                print(f"  Processing details: {json.dumps(data['results'].get('processing_details', {}), indent=2)}")
                        else:
                            print(f"❌ Workflow execution failed: {data.get('error_message', 'Unknown error')}")
                        break
                else:
                    print(f"⚠️ Got status code {response.status_code} when checking execution status")
                    
                # Wait before polling again
                time.sleep(2)
                
            except Exception as e:
                print(f"⚠️ Error checking execution status: {str(e)}")
                time.sleep(2)
            
            if attempt == max_attempts - 1:
                print("⚠️ Execution status polling timed out")

def run_tests():
    """Run all tests sequentially in a single test instance"""
    test_instance = UnstructuredWorkflowAPITest()
    test_instance.setUp()
    
    try:
        print("\n===== STARTING UNSTRUCTURED ENTERPRISE API TESTS =====")
        test_instance.test_01_api_root()
        test_instance.test_02_document_processing()
        test_instance.test_03_get_document()
        test_instance.test_04_get_document_visualization()
        test_instance.test_05_document_comparison()
        test_instance.test_06_create_document_chunks()
        test_instance.test_07_get_document_chunks()
        test_instance.test_08_edit_chunk()
        test_instance.test_09_export_document()
        test_instance.test_10_create_workflow()
        test_instance.test_11_execute_workflow()
        test_instance.test_12_get_execution_status()
        print("\n===== ALL UNSTRUCTURED ENTERPRISE API TESTS COMPLETED =====")
    finally:
        test_instance.tearDown()

if __name__ == "__main__":
    run_tests()