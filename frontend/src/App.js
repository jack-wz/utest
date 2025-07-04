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
  ClockIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  BoltIcon,
  GlobeAltIcon,
  ChatBubbleBottomCenterTextIcon,
  CpuChipIcon,
  ServerIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// 节点配置弹窗组件
const NodeConfigModal = ({ node, isOpen, onClose, onSave }) => {
  const [config, setConfig] = useState(node?.data || {});

  useEffect(() => {
    if (node) {
      setConfig(node.data);
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const handleSave = () => {
    onSave(node.id, config);
    onClose();
  };

  const renderConfigForm = () => {
    switch (node.type) {
      case 'datasource':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">数据源类型</label>
              <select 
                value={config.source_type || 'upload'}
                onChange={(e) => setConfig({...config, source_type: e.target.value})}
                className="w-full p-2 border rounded-lg"
              >
                <option value="upload">文件上传</option>
                <option value="feishu">飞书文档</option>
                <option value="wechat_work">企业微信</option>
                <option value="s3">S3/MinIO</option>
                <option value="api">API接口</option>
                <option value="database">数据库</option>
              </select>
            </div>

            {config.source_type === 'feishu' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">App ID</label>
                  <input 
                    type="text" 
                    value={config.feishu_app_id || ''}
                    onChange={(e) => setConfig({...config, feishu_app_id: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="cli_xxxxxxxxxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">App Secret</label>
                  <input 
                    type="password" 
                    value={config.feishu_app_secret || ''}
                    onChange={(e) => setConfig({...config, feishu_app_secret: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="应用密钥"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">文档范围</label>
                  <select 
                    value={config.feishu_scope || 'all'}
                    onChange={(e) => setConfig({...config, feishu_scope: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="all">所有文档</option>
                    <option value="folder">指定文件夹</option>
                    <option value="doc">单个文档</option>
                  </select>
                </div>
              </div>
            )}

            {config.source_type === 'wechat_work' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">企业ID</label>
                  <input 
                    type="text" 
                    value={config.corp_id || ''}
                    onChange={(e) => setConfig({...config, corp_id: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="wwxxxxxxxxxxxxxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">应用Secret</label>
                  <input 
                    type="password" 
                    value={config.corp_secret || ''}
                    onChange={(e) => setConfig({...config, corp_secret: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="应用密钥"
                  />
                </div>
              </div>
            )}

            {config.source_type === 'api' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">API端点</label>
                  <input 
                    type="url" 
                    value={config.api_endpoint || ''}
                    onChange={(e) => setConfig({...config, api_endpoint: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="https://api.example.com/documents"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">认证方式</label>
                  <select 
                    value={config.auth_type || 'none'}
                    onChange={(e) => setConfig({...config, auth_type: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="none">无认证</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="api_key">API Key</option>
                    <option value="basic">Basic Auth</option>
                  </select>
                </div>
                {config.auth_type !== 'none' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">认证凭据</label>
                    <input 
                      type="password" 
                      value={config.auth_credentials || ''}
                      onChange={(e) => setConfig({...config, auth_credentials: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                      placeholder="认证密钥或令牌"
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">处理策略</label>
              <select 
                value={config.processing_strategy || 'auto'}
                onChange={(e) => setConfig({...config, processing_strategy: e.target.value})}
                className="w-full p-2 border rounded-lg"
              >
                <option value="auto">AUTO - 智能检测</option>
                <option value="hi_res">HI_RES - 高精度布局</option>
                <option value="fast">FAST - 快速提取</option>
                <option value="ocr_only">OCR_ONLY - 纯OCR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">批量处理</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={config.batch_processing || false}
                    onChange={(e) => setConfig({...config, batch_processing: e.target.checked})}
                    className="mr-2"
                  />
                  启用批量处理
                </label>
                <input 
                  type="number" 
                  value={config.batch_size || 10}
                  onChange={(e) => setConfig({...config, batch_size: parseInt(e.target.value)})}
                  className="w-20 p-1 border rounded"
                  min="1"
                  max="100"
                />
                <span className="text-sm text-gray-600">个/批次</span>
              </div>
            </div>
          </div>
        );

      case 'llm':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">LLM提供商</label>
              <select 
                value={config.llm_provider || 'openai'}
                onChange={(e) => setConfig({...config, llm_provider: e.target.value})}
                className="w-full p-2 border rounded-lg"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="azure">Azure OpenAI</option>
                <option value="ollama">Ollama (本地)</option>
                <option value="qwen">通义千问</option>
                <option value="baidu">文心一言</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">模型名称</label>
              <select 
                value={config.model_name || 'gpt-4'}
                onChange={(e) => setConfig({...config, model_name: e.target.value})}
                className="w-full p-2 border rounded-lg"
              >
                {config.llm_provider === 'openai' && (
                  <>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </>
                )}
                {config.llm_provider === 'anthropic' && (
                  <>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                    <option value="claude-3-haiku">Claude 3 Haiku</option>
                  </>
                )}
                {config.llm_provider === 'ollama' && (
                  <>
                    <option value="llama2">Llama 2</option>
                    <option value="codellama">Code Llama</option>
                    <option value="mistral">Mistral</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">API密钥</label>
              <input 
                type="password" 
                value={config.api_key || ''}
                onChange={(e) => setConfig({...config, api_key: e.target.value})}
                className="w-full p-2 border rounded-lg"
                placeholder="sk-..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">最大Token数</label>
                <input 
                  type="number" 
                  value={config.max_tokens || 4000}
                  onChange={(e) => setConfig({...config, max_tokens: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded-lg"
                  min="100"
                  max="128000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">温度</label>
                <input 
                  type="number" 
                  value={config.temperature || 0.7}
                  onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})}
                  className="w-full p-2 border rounded-lg"
                  min="0"
                  max="2"
                  step="0.1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">处理任务</label>
              <select 
                value={config.task_type || 'summarize'}
                onChange={(e) => setConfig({...config, task_type: e.target.value})}
                className="w-full p-2 border rounded-lg"
              >
                <option value="summarize">文档总结</option>
                <option value="extract">信息提取</option>
                <option value="translate">内容翻译</option>
                <option value="classify">文档分类</option>
                <option value="qa">问答生成</option>
                <option value="custom">自定义任务</option>
              </select>
            </div>

            {config.task_type === 'custom' && (
              <div>
                <label className="block text-sm font-medium mb-2">自定义提示词</label>
                <textarea 
                  value={config.custom_prompt || ''}
                  onChange={(e) => setConfig({...config, custom_prompt: e.target.value})}
                  className="w-full p-2 border rounded-lg h-24"
                  placeholder="请输入自定义的处理提示词..."
                />
              </div>
            )}
          </div>
        );

      case 'vision':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">视觉模型提供商</label>
              <select 
                value={config.vision_provider || 'openai'}
                onChange={(e) => setConfig({...config, vision_provider: e.target.value})}
                className="w-full p-2 border rounded-lg"
              >
                <option value="openai">OpenAI GPT-4V</option>
                <option value="anthropic">Claude 3 Vision</option>
                <option value="google">Google Gemini Vision</option>
                <option value="azure">Azure Computer Vision</option>
                <option value="local">本地OCR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">处理类型</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={config.ocr_enabled || false}
                    onChange={(e) => setConfig({...config, ocr_enabled: e.target.checked})}
                    className="mr-2"
                  />
                  OCR文字识别
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={config.layout_detection || false}
                    onChange={(e) => setConfig({...config, layout_detection: e.target.checked})}
                    className="mr-2"
                  />
                  版面布局检测
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={config.table_extraction || false}
                    onChange={(e) => setConfig({...config, table_extraction: e.target.checked})}
                    className="mr-2"
                  />
                  表格结构提取
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={config.image_description || false}
                    onChange={(e) => setConfig({...config, image_description: e.target.checked})}
                    className="mr-2"
                  />
                  图像内容描述
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">支持的图像格式</label>
              <div className="flex flex-wrap gap-2">
                {['JPG', 'PNG', 'PDF', 'TIFF', 'BMP', 'WEBP'].map(format => (
                  <span key={format} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {format}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">图像质量</label>
                <select 
                  value={config.image_quality || 'high'}
                  onChange={(e) => setConfig({...config, image_quality: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="low">低质量(快速)</option>
                  <option value="medium">中等质量</option>
                  <option value="high">高质量(精确)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">语言</label>
                <select 
                  value={config.ocr_language || 'auto'}
                  onChange={(e) => setConfig({...config, ocr_language: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="auto">自动检测</option>
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'chunking':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">分块策略</label>
              <select 
                value={config.chunk_strategy || 'by_title'}
                onChange={(e) => setConfig({...config, chunk_strategy: e.target.value})}
                className="w-full p-2 border rounded-lg"
              >
                <option value="by_title">按标题分组</option>
                <option value="by_page">按页面分割</option>
                <option value="by_similarity">语义相似性</option>
                <option value="fixed_size">固定大小</option>
                <option value="recursive">递归分割</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">块大小</label>
                <input 
                  type="number" 
                  value={config.chunk_size || 1000}
                  onChange={(e) => setConfig({...config, chunk_size: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded-lg"
                  min="100"
                  max="8000"
                />
                <span className="text-xs text-gray-500">字符数</span>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">重叠大小</label>
                <input 
                  type="number" 
                  value={config.chunk_overlap || 200}
                  onChange={(e) => setConfig({...config, chunk_overlap: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded-lg"
                  min="0"
                  max="1000"
                />
                <span className="text-xs text-gray-500">字符数</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">上下文合并</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={config.context_merge || false}
                    onChange={(e) => setConfig({...config, context_merge: e.target.checked})}
                    className="mr-2"
                  />
                  启用上下文合并
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={config.preserve_structure || false}
                    onChange={(e) => setConfig({...config, preserve_structure: e.target.checked})}
                    className="mr-2"
                  />
                  保持文档结构
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={config.smart_boundary || false}
                    onChange={(e) => setConfig({...config, smart_boundary: e.target.checked})}
                    className="mr-2"
                  />
                  智能边界检测
                </label>
              </div>
            </div>

            {config.context_merge && (
              <div>
                <label className="block text-sm font-medium mb-2">合并窗口大小</label>
                <input 
                  type="number" 
                  value={config.merge_window || 3}
                  onChange={(e) => setConfig({...config, merge_window: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded-lg"
                  min="2"
                  max="10"
                />
                <span className="text-xs text-gray-500">相邻块数量</span>
              </div>
            )}
          </div>
        );

      case 'embedding':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">嵌入模型提供商</label>
              <select 
                value={config.embedding_provider || 'openai'}
                onChange={(e) => setConfig({...config, embedding_provider: e.target.value})}
                className="w-full p-2 border rounded-lg"
              >
                <option value="openai">OpenAI</option>
                <option value="azure">Azure OpenAI</option>
                <option value="cohere">Cohere</option>
                <option value="huggingface">Hugging Face</option>
                <option value="sentence_transformers">Sentence Transformers</option>
                <option value="local">本地模型</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">模型名称</label>
              <select 
                value={config.embedding_model || 'text-embedding-ada-002'}
                onChange={(e) => setConfig({...config, embedding_model: e.target.value})}
                className="w-full p-2 border rounded-lg"
              >
                {config.embedding_provider === 'openai' && (
                  <>
                    <option value="text-embedding-ada-002">text-embedding-ada-002</option>
                    <option value="text-embedding-3-small">text-embedding-3-small</option>
                    <option value="text-embedding-3-large">text-embedding-3-large</option>
                  </>
                )}
                {config.embedding_provider === 'sentence_transformers' && (
                  <>
                    <option value="all-MiniLM-L6-v2">all-MiniLM-L6-v2</option>
                    <option value="all-mpnet-base-v2">all-mpnet-base-v2</option>
                    <option value="paraphrase-MiniLM-L6-v2">paraphrase-MiniLM-L6-v2</option>
                  </>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">向量维度</label>
                <input 
                  type="number" 
                  value={config.dimensions || 1536}
                  onChange={(e) => setConfig({...config, dimensions: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded-lg"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">批处理大小</label>
                <input 
                  type="number" 
                  value={config.batch_size || 32}
                  onChange={(e) => setConfig({...config, batch_size: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded-lg"
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">文本预处理</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={config.normalize_text || false}
                    onChange={(e) => setConfig({...config, normalize_text: e.target.checked})}
                    className="mr-2"
                  />
                  文本标准化
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={config.remove_stopwords || false}
                    onChange={(e) => setConfig({...config, remove_stopwords: e.target.checked})}
                    className="mr-2"
                  />
                  移除停用词
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={config.lowercase || false}
                    onChange={(e) => setConfig({...config, lowercase: e.target.checked})}
                    className="mr-2"
                  />
                  转换小写
                </label>
              </div>
            </div>
          </div>
        );

      case 'connector':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">连接器类型</label>
              <select 
                value={config.connector_type || 'qdrant'}
                onChange={(e) => setConfig({...config, connector_type: e.target.value})}
                className="w-full p-2 border rounded-lg"
              >
                <option value="qdrant">Qdrant</option>
                <option value="pinecone">Pinecone</option>
                <option value="weaviate">Weaviate</option>
                <option value="chroma">Chroma</option>
                <option value="elasticsearch">Elasticsearch</option>
                <option value="mongodb">MongoDB</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">连接地址</label>
              <input 
                type="text" 
                value={config.connection_url || ''}
                onChange={(e) => setConfig({...config, connection_url: e.target.value})}
                className="w-full p-2 border rounded-lg"
                placeholder="https://your-instance.qdrant.io"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">API密钥</label>
              <input 
                type="password" 
                value={config.api_key || ''}
                onChange={(e) => setConfig({...config, api_key: e.target.value})}
                className="w-full p-2 border rounded-lg"
                placeholder="API密钥"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">集合名称</label>
                <input 
                  type="text" 
                  value={config.collection_name || ''}
                  onChange={(e) => setConfig({...config, collection_name: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="documents"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">批量大小</label>
                <input 
                  type="number" 
                  value={config.batch_size || 100}
                  onChange={(e) => setConfig({...config, batch_size: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded-lg"
                  min="1"
                  max="1000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">元数据字段</label>
              <textarea 
                value={config.metadata_fields || ''}
                onChange={(e) => setConfig({...config, metadata_fields: e.target.value})}
                className="w-full p-2 border rounded-lg h-20"
                placeholder="title, source, created_at, tags"
              />
              <span className="text-xs text-gray-500">逗号分隔的字段名</span>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">索引设置</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={config.auto_create_index || false}
                    onChange={(e) => setConfig({...config, auto_create_index: e.target.checked})}
                    className="mr-2"
                  />
                  自动创建索引
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={config.update_existing || false}
                    onChange={(e) => setConfig({...config, update_existing: e.target.checked})}
                    className="mr-2"
                  />
                  更新已存在文档
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return <div>暂无配置选项</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">节点配置 - {node.type}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {renderConfigForm()}
        
        <div className="flex justify-end space-x-2 mt-6">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};

// 自定义节点组件
const CustomNode = ({ data, id, type }) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);

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
          // 这里应该更新节点配置
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

function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [workflows, setWorkflows] = useState([]);
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [executionStatus, setExecutionStatus] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BoltIcon className="h-8 w-8 text-blue-600" />
                Unstructured 企业工作流平台
              </h1>
              <p className="text-gray-600">智能文档处理 | 多模态AI | 企业级连接器</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">LLM集成</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">视觉AI</span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">飞书企微</span>
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">向量数据库</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
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

      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default App;