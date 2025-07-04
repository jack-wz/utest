import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeftIcon,
  EyeIcon,
  PencilIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DocumentVisualizationPage = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [visualization, setVisualization] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('visualization');
  const [hoveredElement, setHoveredElement] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [editingChunk, setEditingChunk] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (documentId) {
      loadDocumentData();
    }
  }, [documentId]);

  const loadDocumentData = async () => {
    try {
      setLoading(true);
      
      // Load document details
      const docResponse = await axios.get(`${API}/documents/${documentId}`);
      setDocument(docResponse.data);
      
      // Load visualization
      const vizResponse = await axios.get(`${API}/documents/${documentId}/visualization`);
      setVisualization(vizResponse.data);
      
      // Load comparison
      const compResponse = await axios.get(`${API}/documents/${documentId}/compare`);
      setComparison(compResponse.data);
      
      // Load chunks
      const chunksResponse = await axios.get(`${API}/documents/${documentId}/chunks`);
      setChunks(chunksResponse.data);
      
    } catch (error) {
      console.error('Error loading document data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleElementHover = useCallback((elementId) => {
    setHoveredElement(elementId);
  }, []);

  const handleElementClick = useCallback((element) => {
    setSelectedElement(element);
  }, []);

  const startEditingChunk = (chunk) => {
    setEditingChunk(chunk.id);
    setEditText(chunk.text);
  };

  const saveChunkEdit = async (chunkId) => {
    try {
      await axios.put(`${API}/chunks/${chunkId}/edit`, {
        chunk_id: chunkId,
        new_text: editText,
        edit_reason: "User manual edit"
      });
      
      // Reload chunks
      const chunksResponse = await axios.get(`${API}/documents/${documentId}/chunks`);
      setChunks(chunksResponse.data);
      
      setEditingChunk(null);
      setEditText('');
    } catch (error) {
      console.error('Error saving chunk edit:', error);
    }
  };

  const cancelEdit = () => {
    setEditingChunk(null);
    setEditText('');
  };

  const exportDocument = async (format) => {
    try {
      const response = await axios.post(`${API}/documents/${documentId}/export?format=${format}`, {}, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `processed_document_${documentId}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting document:', error);
    }
  };

  const renderElement = (element, isProcessed = false) => {
    const isHovered = hoveredElement === element.id;
    const isSelected = selectedElement?.id === element.id;
    
    const getElementColor = (type) => {
      const colors = {
        'Title': 'border-blue-500 bg-blue-50',
        'NarrativeText': 'border-gray-400 bg-gray-50',
        'Table': 'border-green-500 bg-green-50',
        'ListItem': 'border-purple-500 bg-purple-50',
        'Image': 'border-orange-500 bg-orange-50',
        'Header': 'border-indigo-500 bg-indigo-50',
        'Footer': 'border-yellow-500 bg-yellow-50'
      };
      return colors[type] || 'border-gray-400 bg-gray-50';
    };

    return (
      <div
        key={element.id}
        className={`absolute border-2 cursor-pointer transition-all duration-200 ${
          getElementColor(element.type)
        } ${isHovered ? 'border-red-500 bg-red-100 scale-105 z-10' : ''} ${
          isSelected ? 'border-blue-600 bg-blue-100 scale-105 z-20' : ''
        } ${isProcessed ? 'shadow-lg' : ''}`}
        style={{
          left: element.coordinates?.x || 0,
          top: element.coordinates?.y || 0,
          width: element.coordinates?.width || 100,
          height: element.coordinates?.height || 30,
          minHeight: '20px'
        }}
        onMouseEnter={() => handleElementHover(element.id)}
        onMouseLeave={() => handleElementHover(null)}
        onClick={() => handleElementClick(element)}
        title={`${element.type}: ${element.text?.substring(0, 100)}...`}
      >
        <div className="text-xs font-bold text-gray-700 mb-1">
          {element.type}
        </div>
        <div className="text-xs text-gray-600 overflow-hidden">
          {element.text?.substring(0, 50)}...
        </div>
        {element.confidence && (
          <div className="absolute top-0 right-0 bg-white text-xs px-1 rounded">
            {(element.confidence * 100).toFixed(0)}%
          </div>
        )}
      </div>
    );
  };

  const renderDocumentPage = (page, isProcessed = false) => (
    <div
      key={`page-${page.page_number}-${isProcessed ? 'processed' : 'original'}`}
      className="relative border border-gray-300 bg-white shadow-lg"
      style={{ width: page.width, height: page.height }}
    >
      <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
        页面 {page.page_number} {isProcessed ? '(处理后)' : '(原始)'}
      </div>
      {page.elements.map(element => renderElement(element, isProcessed))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载文档可视化数据...</p>
        </div>
      </div>
    );
  }

  if (!document || !visualization) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">文档数据加载失败</p>
          <button 
            onClick={() => navigate('/results')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回结果页面
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 顶部导航 */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/results')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">文档可视化分析</h1>
              <p className="text-gray-600">{document.filename}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveView('visualization')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'visualization' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <EyeIcon className="h-4 w-4 inline mr-2" />
                可视化对比
              </button>
              <button
                onClick={() => setActiveView('chunks')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'chunks' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <PencilIcon className="h-4 w-4 inline mr-2" />
                分块编辑
              </button>
            </div>
            
            <button
              onClick={() => exportDocument('json')}
              className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              导出JSON
            </button>
            
            <button
              onClick={() => exportDocument('zip')}
              className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              导出ZIP
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-auto">
        {activeView === 'visualization' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 原始文档 */}
              <div>
                <h3 className="text-lg font-bold mb-4 text-gray-800">原始文档</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {visualization.original_layout.pages.map(page => 
                    renderDocumentPage(page, false)
                  )}
                </div>
              </div>
              
              {/* 处理后文档 */}
              <div>
                <h3 className="text-lg font-bold mb-4 text-green-700">处理后文档</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {visualization.processed_layout.pages.map(page => 
                    renderDocumentPage(page, true)
                  )}
                </div>
              </div>
            </div>

            {/* 元素详情面板 */}
            {selectedElement && (
              <div className="mt-8 bg-white rounded-lg border p-6">
                <h3 className="text-lg font-bold mb-4">元素详情</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">基本信息</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>类型:</strong> {selectedElement.type}</div>
                      <div><strong>置信度:</strong> {selectedElement.confidence ? (selectedElement.confidence * 100).toFixed(1) + '%' : 'N/A'}</div>
                      <div><strong>坐标:</strong> ({selectedElement.coordinates?.x}, {selectedElement.coordinates?.y})</div>
                      <div><strong>尺寸:</strong> {selectedElement.coordinates?.width} × {selectedElement.coordinates?.height}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">元数据</h4>
                    <div className="space-y-2 text-sm">
                      {selectedElement.metadata && Object.entries(selectedElement.metadata).map(([key, value]) => (
                        <div key={key}>
                          <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="font-medium mb-2">文本内容</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm max-h-32 overflow-y-auto">
                    {selectedElement.text}
                  </div>
                </div>
              </div>
            )}

            {/* 处理变更 */}
            {comparison && comparison.changes.length > 0 && (
              <div className="mt-8 bg-white rounded-lg border p-6">
                <h3 className="text-lg font-bold mb-4">处理变更</h3>
                <div className="space-y-3">
                  {comparison.changes.map((change, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="font-medium text-sm">{change.type}</div>
                      <div className="text-sm text-gray-600">{change.reason}</div>
                      {change.before !== change.after && (
                        <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-red-600 font-medium">前:</span>
                            <div className="bg-red-50 p-2 rounded mt-1">{change.before}</div>
                          </div>
                          <div>
                            <span className="text-green-600 font-medium">后:</span>
                            <div className="bg-green-50 p-2 rounded mt-1">{change.after}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'chunks' && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2">智能分块编辑</h3>
              <p className="text-gray-600">点击编辑按钮可以修改分块内容，支持实时保存和历史记录。</p>
            </div>
            
            <div className="space-y-4">
              {chunks.map((chunk, index) => (
                <div key={chunk.id} className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                        分块 {index + 1}
                      </span>
                      <span className="text-sm text-gray-600">
                        {chunk.tokens} tokens | {chunk.source_elements.length} 源元素
                      </span>
                      {chunk.is_edited && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                          已编辑
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {editingChunk === chunk.id ? (
                        <>
                          <button
                            onClick={() => saveChunkEdit(chunk.id)}
                            className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startEditingChunk(chunk)}
                          className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {editingChunk === chunk.id ? (
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-3 border rounded-lg min-h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="编辑分块内容..."
                    />
                  ) : (
                    <div className="bg-gray-50 p-3 rounded text-sm leading-relaxed">
                      {chunk.text}
                    </div>
                  )}
                  
                  {/* 元数据信息 */}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                    <span>策略: {chunk.metadata.chunk_strategy}</span>
                    {chunk.metadata.pages && (
                      <span>页面: {chunk.metadata.pages.join(', ')}</span>
                    )}
                    {chunk.metadata.element_types && (
                      <span>元素类型: {chunk.metadata.element_types.join(', ')}</span>
                    )}
                  </div>
                  
                  {/* 编辑历史 */}
                  {chunk.edit_history && chunk.edit_history.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">编辑历史</h5>
                      <div className="space-y-2">
                        {chunk.edit_history.map((edit, editIndex) => (
                          <div key={editIndex} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            <div className="flex justify-between items-center">
                              <span>{edit.editor} - {new Date(edit.timestamp).toLocaleString()}</span>
                              {edit.edit_reason && <span className="italic">{edit.edit_reason}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentVisualizationPage;