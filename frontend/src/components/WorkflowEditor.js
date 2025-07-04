import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import { 
  PlusIcon,
  PlayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  ChatBubbleBottomCenterTextIcon,
  CpuChipIcon,
  ServerIcon,
  FolderIcon,
  PhotoIcon,
  TableCellsIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

import NodeConfigModal from './NodeConfigModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// 自定义节点组件
const CustomNode = ({ data, id, type }) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const navigate = useNavigate();

  const nodeConfig = {
    datasource: {
      title: '数据源',
      icon: FolderIcon,
      color: 'blue',
      description: '文档数据输入'
    },
    llm: {
      title: 'LLM处理',
      icon: ChatBubbleBottomCenterTextIcon,
      color: 'purple',
      description: '大语言模型'
    },
    vision: {
      title: '视觉识别',
      icon: PhotoIcon,
      color: 'green',
      description: 'OCR与图像理解'
    },
    chunking: {
      title: '智能分块',
      icon: TableCellsIcon,
      color: 'indigo',
      description: '上下文合并分割'
    },
    embedding: {
      title: '向量嵌入',
      icon: CpuChipIcon,
      color: 'pink',
      description: '语义向量生成'
    },
    connector: {
      title: '数据连接器',
      icon: ServerIcon,
      color: 'orange',
      description: '向量数据库输出'
    }
  };

  const config = nodeConfig[type] || nodeConfig.datasource;
  const IconComponent = config.icon;

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-900',
      purple: 'bg-purple-50 border-purple-200 text-purple-900',
      green: 'bg-green-50 border-green-200 text-green-900',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-900',
      pink: 'bg-pink-50 border-pink-200 text-pink-900',
      orange: 'bg-orange-50 border-orange-200 text-orange-900'
    };
    return colors[color] || colors.blue;
  };

  return (
    <>
      <div className={`px-4 py-3 shadow-lg rounded-lg border-2 min-w-64 ${getColorClasses(config.color)} cursor-pointer transition-all hover:shadow-xl`}>
        {type !== 'datasource' && <Handle type="target" position={Position.Left} className="w-3 h-3" />}
        {type !== 'connector' && <Handle type="source" position={Position.Right} className="w-3 h-3" />}
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            <div className="font-bold">{config.title}</div>
          </div>
          <button 
            onClick={() => setIsConfigOpen(true)}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
          </button>
        </div>
        
        <div className="text-sm text-gray-600 mb-2">
          {config.description}
        </div>
        
        <div className="text-xs space-y-1">
          {type === 'datasource' && (
            <>
              <div><strong>类型:</strong> {data.source_type || '文件上传'}</div>
              <div><strong>策略:</strong> {data.processing_strategy || 'AUTO'}</div>
              {data.filename && <div><strong>文件:</strong> {data.filename}</div>}
              {data.elements_count && <div><strong>元素:</strong> {data.elements_count} 个</div>}
              {data.metadata_extracted && <div className="text-green-600"><strong>✓ 元数据已提取</strong></div>}
              {data.visualization_available && (
                <button 
                  onClick={() => navigate(`/document/${data.document_id}`)}
                  className="mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                >
                  查看可视化
                </button>
              )}
            </>
          )}
          
          {type === 'llm' && (
            <>
              <div><strong>提供商:</strong> {data.llm_provider || 'OpenAI'}</div>
              <div><strong>模型:</strong> {data.model_name || 'GPT-4'}</div>
              <div><strong>任务:</strong> {data.task_type || '文档总结'}</div>
            </>
          )}
          
          {type === 'vision' && (
            <>
              <div><strong>提供商:</strong> {data.vision_provider || 'OpenAI GPT-4V'}</div>
              <div><strong>OCR:</strong> {data.ocr_enabled ? '启用' : '禁用'}</div>
              <div><strong>语言:</strong> {data.ocr_language || '自动检测'}</div>
            </>
          )}
          
          {type === 'chunking' && (
            <>
              <div><strong>策略:</strong> {data.chunk_strategy || 'by_title'}</div>
              <div><strong>大小:</strong> {data.chunk_size || 1000} 字符</div>
              <div><strong>上下文合并:</strong> {data.context_merge ? '启用' : '禁用'}</div>
            </>
          )}
          
          {type === 'embedding' && (
            <>
              <div><strong>提供商:</strong> {data.embedding_provider || 'OpenAI'}</div>
              <div><strong>模型:</strong> {data.embedding_model || 'ada-002'}</div>
              <div><strong>维度:</strong> {data.dimensions || 1536}</div>
            </>
          )}
          
          {type === 'connector' && (
            <>
              <div><strong>类型:</strong> {data.connector_type || 'Qdrant'}</div>
              <div><strong>集合:</strong> {data.collection_name || 'documents'}</div>
              <div><strong>批量:</strong> {data.batch_size || 100}</div>
            </>
          )}
        </div>
      </div>
      
      <NodeConfigModal 
        node={{id, type, data}}
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSave={(nodeId, config) => {
          console.log('Saving config for node', nodeId, config);
        }}
      />
    </>
  );
};

const nodeTypes = {
  datasource: (props) => <CustomNode {...props} type="datasource" />,
  llm: (props) => <CustomNode {...props} type="llm" />,
  vision: (props) => <CustomNode {...props} type="vision" />,
  chunking: (props) => <CustomNode {...props} type="chunking" />,
  embedding: (props) => <CustomNode {...props} type="embedding" />,
  connector: (props) => <CustomNode {...props} type="connector" />,
};

// 初始工作流
const initialNodes = [
  {
    id: '1',
    type: 'datasource',
    position: { x: 50, y: 150 },
    data: { source_type: 'upload', processing_strategy: 'auto' },
  },
  {
    id: '2',
    type: 'vision',
    position: { x: 400, y: 50 },
    data: { vision_provider: 'openai', ocr_enabled: true },
  },
  {
    id: '3',
    type: 'llm',
    position: { x: 400, y: 250 },
    data: { llm_provider: 'openai', task_type: 'summarize' },
  },
  {
    id: '4',
    type: 'chunking',
    position: { x: 750, y: 150 },
    data: { chunk_strategy: 'by_title', context_merge: true },
  },
  {
    id: '5',
    type: 'embedding',
    position: { x: 1100, y: 150 },
    data: { embedding_provider: 'openai', dimensions: 1536 },
  },
  {
    id: '6',
    type: 'connector',
    position: { x: 1450, y: 150 },
    data: { connector_type: 'qdrant', collection_name: 'documents' },
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
  { id: 'e2-4', source: '2', target: '4', animated: true },
  { id: 'e3-4', source: '3', target: '4', animated: true },
  { id: 'e4-5', source: '4', target: '5', animated: true },
  { id: 'e5-6', source: '5', target: '6', animated: true },
];

function WorkflowEditor() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [workflows, setWorkflows] = useState([]);
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [executionStatus, setExecutionStatus] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const navigate = useNavigate();
  const handleFileUpload = useCallback(async (event, nodeId) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('strategy', 'auto');
      formData.append('extract_metadata', 'true');

      toast.info('正在处理文档，提取元数据...');
      
      // Use enhanced document processing API
      const response = await axios.post(`${API}/documents/process`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update node with enhanced file info
      setNodes(nds => nds.map(node => 
        node.id === nodeId 
          ? { 
              ...node, 
              data: { 
                ...node.data, 
                filename: file.name,
                document_id: response.data.document.id,
                file_path: response.data.document.file_path,
                processing_strategy: response.data.document.processing_strategy,
                elements_count: response.data.document.elements.length,
                metadata_extracted: true,
                visualization_available: true
              }
            }
          : node
      ));

      toast.success(`文档 "${file.name}" 处理成功！提取了 ${response.data.document.elements.length} 个元素`);
      
      // Show option to view visualization
      setTimeout(() => {
        if (window.confirm('文档处理完成！是否查看可视化分析？')) {
          navigate(`/document/${response.data.document.id}`);
        }
      }, 1000);
      
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('文档处理失败');
    }
  }, [navigate]);


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
      animated: true
    }, eds)),
    [setEdges]
  );

  const addNode = (type) => {
    const newNode = {
      id: uuidv4(),
      type: type,
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 150 },
      data: {},
    };
    setNodes(nds => [...nds, newNode]);
  };

  const saveWorkflow = async () => {
    try {
      const workflowData = {
        name: `企业工作流 ${new Date().toLocaleString()}`,
        description: '基于Unstructured的智能文档处理工作流',
        nodes: nodes,
        edges: edges
      };

      const response = await axios.post(`${API}/workflows`, workflowData);
      setCurrentWorkflow(response.data);
      toast.success('工作流保存成功！');
    } catch (error) {
      console.error('Save workflow error:', error);
      toast.error('保存工作流失败');
    }
  };

  const executeWorkflow = async () => {
    if (!currentWorkflow) {
      toast.error('请先保存工作流');
      return;
    }

    try {
      setIsExecuting(true);
      toast.info('开始执行企业级工作流...');

      const response = await axios.post(`${API}/workflows/${currentWorkflow.id}/execute`);
      const executionId = response.data.execution_id;

      const pollStatus = async () => {
        try {
          const statusResponse = await axios.get(`${API}/executions/${executionId}`);
          setExecutionStatus(statusResponse.data);

          if (statusResponse.data.status === 'completed') {
            setIsExecuting(false);
            toast.success('🎉 企业工作流执行完成！');
            // 导航到结果页面
            navigate(`/results/${executionId}`);
            return;
          } else if (statusResponse.data.status === 'failed') {
            setIsExecuting(false);
            toast.error(`❌ 工作流执行失败: ${statusResponse.data.error_message}`);
            return;
          }

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

  return (
    <div className="h-full flex flex-col">
      {/* 控制面板 */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                <PlusIcon className="h-4 w-4" />
                添加节点
              </button>
              <div className="absolute top-full mt-1 bg-white border rounded-lg shadow-lg p-2 space-y-1 z-10 hidden group-hover:block">
                <button onClick={() => addNode('datasource')} className="block w-full text-left px-3 py-2 hover:bg-blue-50 rounded flex items-center gap-2">
                  <FolderIcon className="h-4 w-4" /> 数据源
                </button>
                <button onClick={() => addNode('llm')} className="block w-full text-left px-3 py-2 hover:bg-purple-50 rounded flex items-center gap-2">
                  <ChatBubbleBottomCenterTextIcon className="h-4 w-4" /> LLM处理
                </button>
                <button onClick={() => addNode('vision')} className="block w-full text-left px-3 py-2 hover:bg-green-50 rounded flex items-center gap-2">
                  <PhotoIcon className="h-4 w-4" /> 视觉识别
                </button>
                <button onClick={() => addNode('chunking')} className="block w-full text-left px-3 py-2 hover:bg-indigo-50 rounded flex items-center gap-2">
                  <TableCellsIcon className="h-4 w-4" /> 智能分块
                </button>
                <button onClick={() => addNode('embedding')} className="block w-full text-left px-3 py-2 hover:bg-pink-50 rounded flex items-center gap-2">
                  <CpuChipIcon className="h-4 w-4" /> 向量嵌入
                </button>
                <button onClick={() => addNode('connector')} className="block w-full text-left px-3 py-2 hover:bg-orange-50 rounded flex items-center gap-2">
                  <ServerIcon className="h-4 w-4" /> 数据连接器
                </button>
              </div>
            </div>
            
            <button
              onClick={saveWorkflow}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              保存工作流
            </button>
            
            <button
              onClick={executeWorkflow}
              disabled={isExecuting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
          
          <div className="text-sm text-gray-600">
            <span className="mr-4">节点: {nodes.length}</span>
            <span>连接: {edges.length}</span>
          </div>
        </div>
      </div>

      {/* 状态栏 */}
      {executionStatus && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                executionStatus.status === 'completed' ? 'bg-green-100 text-green-800' :
                executionStatus.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {executionStatus.status === 'completed' ? '✅ 已完成' : 
                 executionStatus.status === 'failed' ? '❌ 失败' : '🔄 运行中'}
              </span>
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${executionStatus.progress || 0}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">{executionStatus.progress || 0}%</span>
            </div>
            {executionStatus.results && (
              <div className="text-sm text-gray-600">
                处理了 {executionStatus.results.processing_details?.total_elements} 个元素
              </div>
            )}
          </div>
        </div>
      )}

      {/* 工作流编辑器 */}
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
          <Background color="#e5e7eb" gap={20} variant="dots" />
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              const colors = {
                'datasource': '#3b82f6',
                'llm': '#8b5cf6',
                'vision': '#10b981',
                'chunking': '#6366f1',
                'embedding': '#ec4899',
                'connector': '#f97316'
              };
              return colors[node.type] || '#6b7280';
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export default WorkflowEditor;