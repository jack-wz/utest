import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { 
  DocumentTextIcon, 
  CloudArrowUpIcon, 
  CogIcon, 
  PlayIcon,
  EyeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Custom Node Components
const DataSourceNode = ({ data, id }) => (
  <div className="px-4 py-2 shadow-lg rounded-lg bg-blue-50 border-2 border-blue-200 min-w-48">
    <div className="flex items-center gap-2 mb-2">
      <CloudArrowUpIcon className="h-5 w-5 text-blue-600" />
      <div className="font-bold text-blue-900">数据源</div>
    </div>
    <div className="text-sm text-gray-600">
      <div>类型: {data.source_type || '文件上传'}</div>
      {data.filename && <div>文件: {data.filename}</div>}
    </div>
    <div className="mt-2">
      <input
        type="file"
        onChange={(e) => data.onFileUpload && data.onFileUpload(e, id)}
        className="text-xs w-full"
        accept=".pdf,.docx,.txt,.md"
      />
    </div>
  </div>
);

const ProcessorNode = ({ data }) => (
  <div className="px-4 py-2 shadow-lg rounded-lg bg-green-50 border-2 border-green-200 min-w-48">
    <div className="flex items-center gap-2 mb-2">
      <CogIcon className="h-5 w-5 text-green-600" />
      <div className="font-bold text-green-900">处理器</div>
    </div>
    <div className="text-sm text-gray-600">
      <div>类型: {data.processor_type || 'Unstructured解析'}</div>
      <div>操作: 文档分割、清理、OCR</div>
    </div>
  </div>
);

const ModelNode = ({ data }) => (
  <div className="px-4 py-2 shadow-lg rounded-lg bg-purple-50 border-2 border-purple-200 min-w-48">
    <div className="flex items-center gap-2 mb-2">
      <DocumentTextIcon className="h-5 w-5 text-purple-600" />
      <div className="font-bold text-purple-900">模型</div>
    </div>
    <div className="text-sm text-gray-600">
      <div>类型: {data.model_type || '嵌入模型'}</div>
      <div>模型: {data.model_name || 'SentenceTransformer'}</div>
    </div>
  </div>
);

const ExportNode = ({ data }) => (
  <div className="px-4 py-2 shadow-lg rounded-lg bg-orange-50 border-2 border-orange-200 min-w-48">
    <div className="flex items-center gap-2 mb-2">
      <EyeIcon className="h-5 w-5 text-orange-600" />
      <div className="font-bold text-orange-900">导出</div>
    </div>
    <div className="text-sm text-gray-600">
      <div>目标: {data.export_type || '向量数据库'}</div>
      <div>格式: {data.export_format || 'Qdrant'}</div>
    </div>
  </div>
);

const nodeTypes = {
  datasource: DataSourceNode,
  processor: ProcessorNode,
  model: ModelNode,
  export: ExportNode,
};

// Initial nodes
const initialNodes = [
  {
    id: '1',
    type: 'datasource',
    position: { x: 100, y: 100 },
    data: { 
      label: '文件上传', 
      source_type: 'upload',
      onFileUpload: null
    },
  },
  {
    id: '2',
    type: 'processor',
    position: { x: 400, y: 100 },
    data: { 
      label: 'Unstructured处理',
      processor_type: 'unstructured'
    },
  },
  {
    id: '3',
    type: 'model',
    position: { x: 700, y: 100 },
    data: { 
      label: '嵌入生成',
      model_type: 'embedding',
      model_name: 'SentenceTransformer'
    },
  },
  {
    id: '4',
    type: 'export',
    position: { x: 1000, y: 100 },
    data: { 
      label: '向量存储',
      export_type: 'vector_db',
      export_format: 'qdrant'
    },
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' },
];

function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [workflows, setWorkflows] = useState([]);
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [executionStatus, setExecutionStatus] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // File upload handler
  const handleFileUpload = useCallback(async (event, nodeId) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      toast.info('正在上传文件...');
      const response = await axios.post(`${API}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update node with file info
      setNodes(nds => nds.map(node => 
        node.id === nodeId 
          ? { 
              ...node, 
              data: { 
                ...node.data, 
                filename: file.name,
                file_path: response.data.file_path,
                file_id: response.data.file_id
              }
            }
          : node
      ));

      toast.success(`文件 "${file.name}" 上传成功！`);
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('文件上传失败');
    }
  }, []);

  // Initialize file upload handler for nodes
  useEffect(() => {
    setNodes(nds => nds.map(node => ({
      ...node,
      data: {
        ...node.data,
        onFileUpload: node.type === 'datasource' ? handleFileUpload : node.data.onFileUpload
      }
    })));
  }, [handleFileUpload]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({ ...connection, id: uuidv4() }, eds)),
    [setEdges]
  );

  // Save workflow
  const saveWorkflow = async () => {
    try {
      const workflowData = {
        name: `工作流 ${new Date().toLocaleString()}`,
        description: '可视化文档处理工作流',
        nodes: nodes,
        edges: edges
      };

      const response = await axios.post(`${API}/workflows`, workflowData);
      setCurrentWorkflow(response.data);
      toast.success('工作流保存成功！');
      loadWorkflows();
    } catch (error) {
      console.error('Save workflow error:', error);
      toast.error('保存工作流失败');
    }
  };

  // Load workflows
  const loadWorkflows = async () => {
    try {
      const response = await axios.get(`${API}/workflows`);
      setWorkflows(response.data);
    } catch (error) {
      console.error('Load workflows error:', error);
    }
  };

  // Execute workflow
  const executeWorkflow = async () => {
    if (!currentWorkflow) {
      toast.error('请先保存工作流');
      return;
    }

    try {
      setIsExecuting(true);
      toast.info('开始执行工作流...');

      const response = await axios.post(`${API}/workflows/${currentWorkflow.id}/execute`);
      const executionId = response.data.execution_id;

      // Poll for execution status
      const pollStatus = async () => {
        try {
          const statusResponse = await axios.get(`${API}/executions/${executionId}`);
          setExecutionStatus(statusResponse.data);

          if (statusResponse.data.status === 'completed') {
            setIsExecuting(false);
            toast.success('工作流执行完成！');
            return;
          } else if (statusResponse.data.status === 'failed') {
            setIsExecuting(false);
            toast.error(`工作流执行失败: ${statusResponse.data.error_message}`);
            return;
          }

          // Continue polling if still running
          setTimeout(pollStatus, 2000);
        } catch (error) {
          console.error('Status poll error:', error);
          setIsExecuting(false);
          toast.error('获取执行状态失败');
        }
      };

      setTimeout(pollStatus, 1000);
    } catch (error) {
      console.error('Execute workflow error:', error);
      setIsExecuting(false);
      toast.error('执行工作流失败');
    }
  };

  // Add new node
  const addNode = (type) => {
    const newNode = {
      id: uuidv4(),
      type: type,
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 150 },
      data: { 
        label: `新 ${type}`,
        onFileUpload: type === 'datasource' ? handleFileUpload : undefined
      },
    };
    setNodes(nds => [...nds, newNode]);
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Unstructured 工作流平台</h1>
            <p className="text-gray-600">可视化文档处理与AI集成</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => addNode('datasource')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              数据源
            </button>
            <button
              onClick={() => addNode('processor')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              处理器
            </button>
            <button
              onClick={saveWorkflow}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              保存工作流
            </button>
            <button
              onClick={executeWorkflow}
              disabled={isExecuting}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              <PlayIcon className="h-4 w-4" />
              {isExecuting ? '执行中...' : '执行工作流'}
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      {executionStatus && (
        <div className="bg-blue-50 border-b border-blue-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-medium">执行状态:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                executionStatus.status === 'completed' ? 'bg-green-100 text-green-800' :
                executionStatus.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {executionStatus.status}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${executionStatus.progress || 0}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{executionStatus.progress || 0}%</span>
              </div>
            </div>
            {executionStatus.results && (
              <div className="text-sm text-gray-600">
                处理了 {executionStatus.results.texts_processed} 个文本块
              </div>
            )}
          </div>
        </div>
      )}

      {/* Workflow Editor */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          className="bg-gray-50"
        >
          <Background color="#e5e7eb" gap={20} />
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              switch (node.type) {
                case 'datasource': return '#3b82f6';
                case 'processor': return '#10b981';
                case 'model': return '#8b5cf6';
                case 'export': return '#f59e0b';
                default: return '#6b7280';
              }
            }}
          />
        </ReactFlow>
      </div>

      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default App;