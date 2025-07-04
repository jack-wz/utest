import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

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
              </select>
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

export default NodeConfigModal;