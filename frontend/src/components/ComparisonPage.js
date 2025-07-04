import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeftIcon,
  ScaleIcon,
  DocumentTextIcon,
  ChartBarIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import ReactDiffViewer from 'react-diff-viewer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function ComparisonPage() {
  const navigate = useNavigate();
  const [executions, setExecutions] = useState([]);
  const [selectedExecutions, setSelectedExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadExecutions();
  }, []);

  const loadExecutions = async () => {
    try {
      // 模拟加载所有执行记录
      const mockExecutions = [
        {
          id: 'exec_001',
          workflow_id: 'workflow_001',
          name: '文档处理工作流 A',
          status: 'completed',
          created_at: '2025-06-28T10:30:00Z',
          results: {
            processing_details: {
              total_elements: 156,
              total_chunks: 23,
              total_embeddings: 23
            },
            performance_metrics: {
              total_processing_time: 4.2,
              documents_processed: 3,
              throughput_docs_per_second: 0.71
            },
            pipeline_stages: [
              { stage: 'document_partitioning', elements_extracted: 156, strategy: 'auto' },
              { stage: 'document_cleaning', elements_after: 145 },
              { stage: 'intelligent_chunking', chunks_created: 23, strategy: 'by_title' },
              { stage: 'embedding_generation', embeddings_generated: 23 },
              { stage: 'vector_storage', documents_stored: 23, storage_success: true }
            ]
          }
        },
        {
          id: 'exec_002',
          workflow_id: 'workflow_002',
          name: '文档处理工作流 B',
          status: 'completed',
          created_at: '2025-06-28T11:15:00Z',
          results: {
            processing_details: {
              total_elements: 89,
              total_chunks: 15,
              total_embeddings: 15
            },
            performance_metrics: {
              total_processing_time: 2.8,
              documents_processed: 2,
              throughput_docs_per_second: 0.95
            },
            pipeline_stages: [
              { stage: 'document_partitioning', elements_extracted: 89, strategy: 'hi_res' },
              { stage: 'document_cleaning', elements_after: 84 },
              { stage: 'intelligent_chunking', chunks_created: 15, strategy: 'by_page' },
              { stage: 'embedding_generation', embeddings_generated: 15 },
              { stage: 'vector_storage', documents_stored: 15, storage_success: true }
            ]
          }
        },
        {
          id: 'exec_003',
          workflow_id: 'workflow_003',
          name: '文档处理工作流 C',
          status: 'completed',
          created_at: '2025-06-28T12:00:00Z',
          results: {
            processing_details: {
              total_elements: 201,
              total_chunks: 34,
              total_embeddings: 34
            },
            performance_metrics: {
              total_processing_time: 5.8,
              documents_processed: 4,
              throughput_docs_per_second: 0.69
            },
            pipeline_stages: [
              { stage: 'document_partitioning', elements_extracted: 201, strategy: 'fast' },
              { stage: 'document_cleaning', elements_after: 189 },
              { stage: 'intelligent_chunking', chunks_created: 34, strategy: 'by_similarity' },
              { stage: 'embedding_generation', embeddings_generated: 34 },
              { stage: 'vector_storage', documents_stored: 34, storage_success: true }
            ]
          }
        }
      ];
      setExecutions(mockExecutions);
      
      // 默认选择前两个进行对比
      setSelectedExecutions([mockExecutions[0], mockExecutions[1]]);
    } catch (error) {
      console.error('Error loading executions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToComparison = (execution) => {
    if (selectedExecutions.length >= 4) {
      alert('最多只能对比4个执行结果');
      return;
    }
    if (selectedExecutions.find(e => e.id === execution.id)) {
      return; // 已经存在
    }
    setSelectedExecutions([...selectedExecutions, execution]);
  };

  const removeFromComparison = (executionId) => {
    setSelectedExecutions(selectedExecutions.filter(e => e.id !== executionId));
  };

  const getComparisonData = () => {
    return selectedExecutions.map(exec => ({
      name: exec.name,
      elements: exec.results.processing_details.total_elements,
      chunks: exec.results.processing_details.total_chunks,
      embeddings: exec.results.processing_details.total_embeddings,
      time: exec.results.performance_metrics.total_processing_time,
      throughput: exec.results.performance_metrics.throughput_docs_per_second
    }));
  };

  const getPerformanceRadarData = () => {
    if (selectedExecutions.length === 0) return [];
    
    const metrics = ['elements', 'chunks', 'embeddings', 'speed', 'efficiency'];
    const maxValues = {
      elements: Math.max(...selectedExecutions.map(e => e.results.processing_details.total_elements)),
      chunks: Math.max(...selectedExecutions.map(e => e.results.processing_details.total_chunks)),
      embeddings: Math.max(...selectedExecutions.map(e => e.results.processing_details.total_embeddings)),
      speed: Math.max(...selectedExecutions.map(e => e.results.performance_metrics.throughput_docs_per_second)),
      efficiency: Math.max(...selectedExecutions.map(e => 1 / e.results.performance_metrics.total_processing_time))
    };

    return metrics.map(metric => {
      const dataPoint = { metric };
      selectedExecutions.forEach((exec, index) => {
        let value = 0;
        switch(metric) {
          case 'elements':
            value = (exec.results.processing_details.total_elements / maxValues.elements) * 100;
            break;
          case 'chunks':
            value = (exec.results.processing_details.total_chunks / maxValues.chunks) * 100;
            break;
          case 'embeddings':
            value = (exec.results.processing_details.total_embeddings / maxValues.embeddings) * 100;
            break;
          case 'speed':
            value = (exec.results.performance_metrics.throughput_docs_per_second / maxValues.speed) * 100;
            break;
          case 'efficiency':
            value = ((1 / exec.results.performance_metrics.total_processing_time) / maxValues.efficiency) * 100;
            break;
        }
        dataPoint[`exec_${index}`] = value;
      });
      return dataPoint;
    });
  };

  const getTimelineData = () => {
    return selectedExecutions.map((exec, index) => ({
      name: `执行 ${index + 1}`,
      start: 0,
      partition: 1.2,
      clean: 2.1,
      chunk: 3.5,
      embed: 4.8,
      store: exec.results.performance_metrics.total_processing_time
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载对比数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* 左侧边栏 - 执行列表 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold">结果对比</h2>
          </div>
          <div className="text-sm text-gray-600">
            选择要对比的执行结果 ({selectedExecutions.length}/4)
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {executions.map(execution => {
            const isSelected = selectedExecutions.find(e => e.id === execution.id);
            return (
              <div
                key={execution.id}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  isSelected ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => isSelected ? removeFromComparison(execution.id) : addToComparison(execution)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{execution.name}</span>
                  {isSelected ? (
                    <XMarkIcon className="h-4 w-4 text-red-600" />
                  ) : (
                    <PlusIcon className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>ID: {execution.id}</div>
                  <div>时间: {new Date(execution.created_at).toLocaleString()}</div>
                  <div>
                    元素: {execution.results.processing_details.total_elements} | 
                    耗时: {execution.results.performance_metrics.total_processing_time}s
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部操作栏 */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">执行结果对比分析</h1>
              <p className="text-gray-600">已选择 {selectedExecutions.length} 个执行结果进行对比</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                <ArrowDownTrayIcon className="h-4 w-4" />
                导出对比报告
              </button>
            </div>
          </div>
        </div>

        {selectedExecutions.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ScaleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600">请选择要对比的执行结果</p>
              <p className="text-gray-500 mt-2">从左侧列表中选择2-4个执行结果进行对比分析</p>
            </div>
          </div>
        ) : (
          <>
            {/* 标签页导航 */}
            <div className="bg-white border-b">
              <div className="flex space-x-1 p-4">
                {[
                  { id: 'overview', label: '对比概览', icon: DocumentTextIcon },
                  { id: 'performance', label: '性能对比', icon: ChartBarIcon },
                  { id: 'details', label: '详细对比', icon: EyeIcon }
                ].map(tab => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        activeTab === tab.id 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* 基本指标对比 */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-bold mb-4">基本指标对比</h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={getComparisonData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="elements" fill="#3b82f6" name="文档元素" />
                          <Bar dataKey="chunks" fill="#10b981" name="文本分块" />
                          <Bar dataKey="embeddings" fill="#8b5cf6" name="向量嵌入" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* 性能雷达图 */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-bold mb-4">多维性能对比</h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <RadarChart data={getPerformanceRadarData()}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="metric" />
                          <PolarRadiusAxis domain={[0, 100]} />
                          {selectedExecutions.map((exec, index) => (
                            <Radar
                              key={exec.id}
                              name={exec.name}
                              dataKey={`exec_${index}`}
                              stroke={['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'][index]}
                              fill={['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'][index]}
                              fillOpacity={0.1}
                            />
                          ))}
                          <Tooltip />
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* 处理效率对比 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-bold mb-4">处理时间对比</h3>
                        <div className="space-y-3">
                          {selectedExecutions.map((exec, index) => (
                            <div key={exec.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'][index] }}
                                ></div>
                                <span className="font-medium">{exec.name}</span>
                              </div>
                              <span className="text-lg font-bold">
                                {exec.results.performance_metrics.total_processing_time}s
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-bold mb-4">吞吐量对比</h3>
                        <div className="space-y-3">
                          {selectedExecutions.map((exec, index) => (
                            <div key={exec.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'][index] }}
                                ></div>
                                <span className="font-medium">{exec.name}</span>
                              </div>
                              <span className="text-lg font-bold">
                                {exec.results.performance_metrics.throughput_docs_per_second.toFixed(2)} docs/s
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'performance' && (
                  <div className="space-y-6">
                    {/* 处理时间线 */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-bold mb-4">处理时间线对比</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={getTimelineData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="partition" stroke="#3b82f6" name="文档分割" />
                          <Line type="monotone" dataKey="clean" stroke="#10b981" name="数据清理" />
                          <Line type="monotone" dataKey="chunk" stroke="#8b5cf6" name="智能分块" />
                          <Line type="monotone" dataKey="embed" stroke="#f59e0b" name="向量嵌入" />
                          <Line type="monotone" dataKey="store" stroke="#ef4444" name="数据存储" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* 策略对比 */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-bold mb-4">处理策略对比</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {selectedExecutions.map((exec, index) => (
                          <div key={exec.id} className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'][index] }}
                              ></div>
                              <h4 className="font-bold">{exec.name}</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                              {exec.results.pipeline_stages.map((stage, stageIndex) => (
                                <div key={stageIndex} className="flex justify-between">
                                  <span className="text-gray-600">{stage.stage}:</span>
                                  <span className="font-medium">
                                    {stage.strategy || stage.elements_extracted || stage.chunks_created || stage.embeddings_generated || '完成'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {/* 详细结果对比 */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-bold mb-4">详细结果对比</h3>
                      {selectedExecutions.length >= 2 && (
                        <div className="space-y-6">
                          <ReactDiffViewer
                            oldValue={JSON.stringify(selectedExecutions[0].results, null, 2)}
                            newValue={JSON.stringify(selectedExecutions[1].results, null, 2)}
                            splitView={true}
                            leftTitle={selectedExecutions[0].name}
                            rightTitle={selectedExecutions[1].name}
                            showDiffOnly={false}
                          />
                        </div>
                      )}
                    </div>

                    {/* 差异分析 */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-bold mb-4">差异分析</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-bold text-green-800 mb-2">优势对比</h4>
                          <ul className="text-sm text-green-700 space-y-1">
                            <li>• 工作流A在处理精度上表现更好</li>
                            <li>• 工作流B在处理速度上更有优势</li>
                            <li>• 工作流C在大文档处理上更稳定</li>
                          </ul>
                        </div>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-bold text-blue-800 mb-2">建议优化</h4>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• 根据文档类型选择合适的处理策略</li>
                            <li>• 考虑启用批处理模式提高效率</li>
                            <li>• 调整分块大小优化下游处理</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ComparisonPage;