import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  ConnectionMode,
  Handle,
  Position,
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
  PlusIcon,
  StopIcon,
  ChartBarIcon,
  TableCellsIcon,
  PhotoIcon,
  LanguageIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Enhanced Custom Node Components with more details
const DataSourceNode = ({ data, id }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-blue-50 border-2 border-blue-200 min-w-56">
    <Handle type="source" position={Position.Right} className="w-3 h-3" />
    <div className="flex items-center gap-2 mb-2">
      <CloudArrowUpIcon className="h-5 w-5 text-blue-600" />
      <div className="font-bold text-blue-900">数据源</div>
    </div>
    <div className="text-sm text-gray-600 space-y-1">
      <div><strong>类型:</strong> {data.source_type || '文件上传'}</div>
      <div><strong>格式:</strong> PDF, DOCX, HTML, EML, PPTX, TXT, MD</div>
      {data.filename && <div><strong>文件:</strong> {data.filename}</div>}
      {data.processing_strategy && <div><strong>策略:</strong> {data.processing_strategy}</div>}
    </div>
    <div className="mt-3">
      <input
        type="file"
        onChange={(e) => data.onFileUpload && data.onFileUpload(e, id)}
        className="text-xs w-full p-1 border rounded"
        accept=".pdf,.docx,.txt,.md,.html,.eml,.pptx"
      />
    </div>
    <div className="mt-2">
      <select 
        className="text-xs w-full p-1 border rounded"
        onChange={(e) => data.onStrategyChange && data.onStrategyChange(e.target.value, id)}
        defaultValue={data.processing_strategy || 'auto'}
      >
        <option value="auto">AUTO - 智能检测</option>
        <option value="hi_res">HI_RES - 高精度布局</option>
        <option value="fast">FAST - 快速提取</option>
        <option value="ocr_only">OCR_ONLY - 纯OCR</option>
      </select>
    </div>
  </div>
);

const PartitionNode = ({ data }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-green-50 border-2 border-green-200 min-w-56">
    <Handle type="target" position={Position.Left} className="w-3 h-3" />
    <Handle type="source" position={Position.Right} className="w-3 h-3" />
    <div className="flex items-center gap-2 mb-2">
      <DocumentDuplicateIcon className="h-5 w-5 text-green-600" />
      <div className="font-bold text-green-900">文档分割</div>
    </div>
    <div className="text-sm text-gray-600 space-y-1">
      <div><strong>功能:</strong> 智能语义分割</div>
      <div><strong>元素类型:</strong></div>
      <div className="grid grid-cols-2 gap-1 text-xs">
        <span className="bg-green-100 px-1 rounded">Title</span>
        <span className="bg-green-100 px-1 rounded">Text</span>
        <span className="bg-green-100 px-1 rounded">Table</span>
        <span className="bg-green-100 px-1 rounded">List</span>
        <span className="bg-green-100 px-1 rounded">Image</span>
        <span className="bg-green-100 px-1 rounded">Header</span>
      </div>
      <div><strong>语言检测:</strong> 自动识别</div>
      <div><strong>表格提取:</strong> 结构化处理</div>
    </div>
  </div>
);

const CleaningNode = ({ data }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-yellow-50 border-2 border-yellow-200 min-w-56">
    <Handle type="target" position={Position.Left} className="w-3 h-3" />
    <Handle type="source" position={Position.Right} className="w-3 h-3" />
    <div className="flex items-center gap-2 mb-2">
      <ArrowPathIcon className="h-5 w-5 text-yellow-600" />
      <div className="font-bold text-yellow-900">数据清理</div>
    </div>
    <div className="text-sm text-gray-600 space-y-1">
      <div><strong>清理功能:</strong></div>
      <div className="text-xs space-y-1">
        <div>• 移除多余空白和换行</div>
        <div>• 标准化文本格式</div>
        <div>• 过滤无关字符</div>
        <div>• 统一编码格式</div>
      </div>
      <div><strong>质量提升:</strong> 为下游处理优化</div>
    </div>
  </div>
);

const ChunkingNode = ({ data }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-indigo-50 border-2 border-indigo-200 min-w-56">
    <Handle type="target" position={Position.Left} className="w-3 h-3" />
    <Handle type="source" position={Position.Right} className="w-3 h-3" />
    <div className="flex items-center gap-2 mb-2">
      <TableCellsIcon className="h-5 w-5 text-indigo-600" />
      <div className="font-bold text-indigo-900">智能分块</div>
    </div>
    <div className="text-sm text-gray-600 space-y-1">
      <div><strong>分块策略:</strong></div>
      <div className="text-xs space-y-1">
        <div>• by_title - 按标题分组</div>
        <div>• by_page - 按页面分割</div>
        <div>• by_similarity - 语义相似性</div>
        <div>• fixed_size - 固定大小</div>
      </div>
      <div><strong>优化目标:</strong> RAG系统性能</div>
      <div><strong>块大小:</strong> {data.chunk_size || '1000'} tokens</div>
    </div>
  </div>
);

const EmbeddingNode = ({ data }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-purple-50 border-2 border-purple-200 min-w-56">
    <Handle type="target" position={Position.Left} className="w-3 h-3" />
    <Handle type="source" position={Position.Right} className="w-3 h-3" />
    <div className="flex items-center gap-2 mb-2">
      <ChartBarIcon className="h-5 w-5 text-purple-600" />
      <div className="font-bold text-purple-900">向量嵌入</div>
    </div>
    <div className="text-sm text-gray-600 space-y-1">
      <div><strong>模型支持:</strong></div>
      <div className="text-xs space-y-1">
        <div>• OpenAI Embeddings</div>
        <div>• Bedrock Embeddings</div>
        <div>• Sentence Transformers</div>
        <div>• Hugging Face Models</div>
      </div>
      <div><strong>向量维度:</strong> {data.dimensions || '1536'}</div>
      <div><strong>批处理:</strong> 优化性能</div>
    </div>
  </div>
);

const ConnectorNode = ({ data }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-orange-50 border-2 border-orange-200 min-w-56">
    <Handle type="target" position={Position.Left} className="w-3 h-3" />
    <div className="flex items-center gap-2 mb-2">
      <EyeIcon className="h-5 w-5 text-orange-600" />
      <div className="font-bold text-orange-900">数据连接器</div>
    </div>
    <div className="text-sm text-gray-600 space-y-1">
      <div><strong>目标类型:</strong> {data.connector_type || '向量数据库'}</div>
      <div><strong>支持的连接器:</strong></div>
      <div className="text-xs space-y-1">
        <div>• Pinecone</div>
        <div>• Qdrant</div>
        <div>• Weaviate</div>
        <div>• Elasticsearch</div>
        <div>• MongoDB</div>
        <div>• Discord</div>
      </div>
      <div><strong>数据格式:</strong> {data.output_format || 'JSON'}</div>
    </div>
  </div>
);

const nodeTypes = {
  datasource: DataSourceNode,
  partition: PartitionNode,
  cleaning: CleaningNode,
  chunking: ChunkingNode,
  embedding: EmbeddingNode,
  connector: ConnectorNode,
};

// Enhanced initial workflow with real Unstructured pipeline
const initialNodes = [
  {
    id: '1',
    type: 'datasource',
    position: { x: 50, y: 100 },
    data: { 
      label: '文档上传', 
      source_type: 'upload',
      processing_strategy: 'auto',
      onFileUpload: null,
      onStrategyChange: null
    },
  },
  {
    id: '2',
    type: 'partition',
    position: { x: 350, y: 100 },
    data: { 
      label: '智能分割',
      partition_strategy: 'auto'
    },
  },
  {
    id: '3',
    type: 'cleaning',
    position: { x: 650, y: 100 },
    data: { 
      label: '数据清理',
      cleaning_mode: 'standard'
    },
  },
  {
    id: '4',
    type: 'chunking',
    position: { x: 950, y: 100 },
    data: { 
      label: '智能分块',
      chunk_strategy: 'by_title',
      chunk_size: 1000
    },
  },
  {
    id: '5',
    type: 'embedding',
    position: { x: 650, y: 300 },
    data: { 
      label: '向量嵌入',
      model_type: 'openai',
      dimensions: 1536
    },
  },
  {
    id: '6',
    type: 'connector',
    position: { x: 950, y: 300 },
    data: { 
      label: '数据输出',
      connector_type: 'vector_db',
      output_format: 'json'
    },
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', type: 'default', animated: true },
  { id: 'e2-3', source: '2', target: '3', type: 'default', animated: true },
  { id: 'e3-4', source: '3', target: '4', type: 'default', animated: true },
  { id: 'e4-5', source: '4', target: '5', type: 'default', animated: true },
  { id: 'e5-6', source: '5', target: '6', type: 'default', animated: true },
];

function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [workflows, setWorkflows] = useState([]);
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [executionStatus, setExecutionStatus] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Enhanced file upload handler with strategy
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
                file_id: response.data.file_id,
                file_type: response.data.file_type
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

  // Strategy change handler
  const handleStrategyChange = useCallback((strategy, nodeId) => {
    setNodes(nds => nds.map(node => 
      node.id === nodeId 
        ? { 
            ...node, 
            data: { 
              ...node.data, 
              processing_strategy: strategy
            }
          }
        : node
    ));
  }, []);

  // Initialize handlers for nodes
  useEffect(() => {
    setNodes(nds => nds.map(node => ({
      ...node,
      data: {
        ...node.data,
        onFileUpload: node.type === 'datasource' ? handleFileUpload : node.data.onFileUpload,
        onStrategyChange: node.type === 'datasource' ? handleStrategyChange : node.data.onStrategyChange
      }
    })));
  }, [handleFileUpload, handleStrategyChange]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({ 
      ...connection, 
      id: uuidv4(),
      type: 'default',
      animated: true
    }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setShowDetails(true);
  }, []);

  // Enhanced workflow saving
  const saveWorkflow = async () => {
    try {
      const workflowData = {
        name: `Unstructured工作流 ${new Date().toLocaleString()}`,
        description: '基于Unstructured库的文档处理工作流',
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

  // Enhanced workflow execution with better tracking
  const executeWorkflow = async () => {
    if (!currentWorkflow) {
      toast.error('请先保存工作流');
      return;
    }

    try {
      setIsExecuting(true);
      setExecutionStatus(null);
      toast.info('开始执行Unstructured工作流...');

      const response = await axios.post(`${API}/workflows/${currentWorkflow.id}/execute`);
      const executionId = response.data.execution_id;

      // Enhanced polling with better error handling
      const pollStatus = async () => {
        try {
          const statusResponse = await axios.get(`${API}/executions/${executionId}`);
          setExecutionStatus(statusResponse.data);

          if (statusResponse.data.status === 'completed') {
            setIsExecuting(false);
            toast.success('🎉 Unstructured工作流执行完成！');
            return;
          } else if (statusResponse.data.status === 'failed') {
            setIsExecuting(false);
            toast.error(`❌ 工作流执行失败: ${statusResponse.data.error_message}`);
            return;
          }

          // Continue polling if still running
          setTimeout(pollStatus, 1500);
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

  // Enhanced add node function
  const addNode = (type) => {
    const nodeConfigs = {
      datasource: { label: '新数据源', source_type: 'upload' },
      partition: { label: '新分割器', partition_strategy: 'auto' },
      cleaning: { label: '新清理器', cleaning_mode: 'standard' },
      chunking: { label: '新分块器', chunk_strategy: 'by_title' },
      embedding: { label: '新嵌入器', model_type: 'openai' },
      connector: { label: '新连接器', connector_type: 'vector_db' }
    };

    const newNode = {
      id: uuidv4(),
      type: type,
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 150 },
      data: { 
        ...nodeConfigs[type],
        onFileUpload: type === 'datasource' ? handleFileUpload : undefined,
        onStrategyChange: type === 'datasource' ? handleStrategyChange : undefined
      },
    };
    setNodes(nds => [...nds, newNode]);
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                Unstructured 工作流平台
              </h1>
              <p className="text-gray-600">基于Unstructured库的企业级文档处理解决方案</p>
            </div>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              支持 PDF • DOCX • HTML • EML • PPTX • TXT
            </div>
          </div>
          <div className="flex gap-2">
            <div className="dropdown relative">
              <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <PlusIcon className="h-4 w-4" />
                添加节点
              </button>
              <div className="dropdown-content absolute top-full mt-1 bg-white border rounded-lg shadow-lg p-2 space-y-1 z-10 hidden">
                <button onClick={() => addNode('datasource')} className="block w-full text-left px-3 py-1 hover:bg-blue-50 rounded">数据源</button>
                <button onClick={() => addNode('partition')} className="block w-full text-left px-3 py-1 hover:bg-green-50 rounded">文档分割</button>
                <button onClick={() => addNode('cleaning')} className="block w-full text-left px-3 py-1 hover:bg-yellow-50 rounded">数据清理</button>
                <button onClick={() => addNode('chunking')} className="block w-full text-left px-3 py-1 hover:bg-indigo-50 rounded">智能分块</button>
                <button onClick={() => addNode('embedding')} className="block w-full text-left px-3 py-1 hover:bg-purple-50 rounded">向量嵌入</button>
                <button onClick={() => addNode('connector')} className="block w-full text-left px-3 py-1 hover:bg-orange-50 rounded">数据连接器</button>
              </div>
            </div>
            <button
              onClick={saveWorkflow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              保存工作流
            </button>
            <button
              onClick={executeWorkflow}
              disabled={isExecuting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  执行中...
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4" />
                  执行工作流
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Status Bar */}
      {executionStatus && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border-b border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="font-medium">执行状态:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                  executionStatus.status === 'completed' ? 'bg-green-100 text-green-800' :
                  executionStatus.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {executionStatus.status === 'completed' && <CheckCircleIcon className="h-4 w-4" />}
                  {executionStatus.status === 'failed' && <ExclamationTriangleIcon className="h-4 w-4" />}
                  {executionStatus.status === 'running' && <ClockIcon className="h-4 w-4" />}
                  {executionStatus.status === 'completed' ? '已完成' : 
                   executionStatus.status === 'failed' ? '执行失败' : '运行中'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">进度:</span>
                <div className="w-48 bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${executionStatus.progress || 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700">{executionStatus.progress || 0}%</span>
              </div>
            </div>
            {executionStatus.results && (
              <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-lg border">
                <strong>处理结果:</strong> {executionStatus.results.texts_processed} 个文本块 | 
                {executionStatus.results.vector_storage?.success && ' ✅ 向量存储成功'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Workflow Editor */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          className="bg-gray-50"
          defaultEdgeOptions={{
            type: 'default',
            animated: true,
            style: { strokeWidth: 2, stroke: '#6b7280' }
          }}
        >
          <Background color="#e5e7eb" gap={20} variant="dots" />
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              const colors = {
                'datasource': '#3b82f6',
                'partition': '#10b981',
                'cleaning': '#f59e0b',
                'chunking': '#6366f1',
                'embedding': '#8b5cf6',
                'connector': '#f97316'
              };
              return colors[node.type] || '#6b7280';
            }}
            maskColor="rgba(255, 255, 255, 0.8)"
          />
        </ReactFlow>

        {/* Node Details Panel */}
        {showDetails && selectedNode && (
          <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">节点详情</h3>
              <button 
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div><strong>类型:</strong> {selectedNode.type}</div>
              <div><strong>ID:</strong> {selectedNode.id}</div>
              <div><strong>位置:</strong> ({Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)})</div>
              {selectedNode.data.filename && <div><strong>文件:</strong> {selectedNode.data.filename}</div>}
              {selectedNode.data.processing_strategy && <div><strong>处理策略:</strong> {selectedNode.data.processing_strategy}</div>}
            </div>
          </div>
        )}

        {/* Workflow Info Panel */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border p-4 max-w-sm">
          <h3 className="font-bold text-lg mb-2">工作流信息</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div><strong>节点数量:</strong> {nodes.length}</div>
            <div><strong>连接数量:</strong> {edges.length}</div>
            <div><strong>当前工作流:</strong> {currentWorkflow?.name || '未保存'}</div>
            <div><strong>Unstructured版本:</strong> 0.15.13</div>
          </div>
        </div>
      </div>

      <ToastContainer position="bottom-right" />
      
      <style jsx>{`
        .dropdown:hover .dropdown-content {
          display: block;
        }
      `}</style>
    </div>
  );
}

export default App;