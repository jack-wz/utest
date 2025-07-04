import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  ChartBarIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  ScaleIcon,
  BeakerIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';
import ReactJson from 'react-json-view';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function ResultsPage() {
  const { executionId } = useParams();
  const navigate = useNavigate();
  const [executions, setExecutions] = useState([]);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    loadExecutions();
    if (executionId) {
      loadExecutionDetails(executionId);
    }
  }, [executionId]);

  const loadExecutions = async () => {
    try {
      // 模拟加载所有执行记录
      const mockExecutions = [
        {
          id: 'exec_001',
          workflow_id: 'workflow_001',
          status: 'completed',
          progress: 100,
          created_at: '2025-06-28T10:30:00Z',
          completed_at: '2025-06-28T10:35:00Z',
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
            }
          }
        },
        {
          id: 'exec_002',
          workflow_id: 'workflow_002',
          status: 'completed',
          progress: 100,
          created_at: '2025-06-28T11:15:00Z',
          completed_at: '2025-06-28T11:22:00Z',
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
            }
          }
        }
      ];
      setExecutions(mockExecutions);
      
      if (!executionId && mockExecutions.length > 0) {
        setSelectedExecution(mockExecutions[0]);
      }
    } catch (error) {
      console.error('Error loading executions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExecutionDetails = async (execId) => {
    try {
      const response = await axios.get(`${API}/executions/${execId}`);
      setSelectedExecution(response.data);
    } catch (error) {
      console.error('Error loading execution details:', error);
    }
  };

  const exportToPDF = async () => {
    const element = document.getElementById('results-content');
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF();
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save(`workflow-results-${selectedExecution?.id}.pdf`);
  };

  const getProcessingStageChart = () => {
    if (!selectedExecution?.results?.pipeline_stages) return [];
    
    return selectedExecution.results.pipeline_stages.map(stage => ({
      name: stage.stage,
      elements: stage.elements_extracted || stage.chunks_created || stage.embeddings_generated || 0,
      time: Math.random() * 5 + 1 // 模拟处理时间
    }));
  };

  const getPerformanceData = () => {
    const results = selectedExecution?.results;
    if (!results) return [];
    
    return [
      { name: '文档处理', value: results.processing_details?.total_elements || 0, color: '#3b82f6' },
      { name: '文本分块', value: results.processing_details?.total_chunks || 0, color: '#10b981' },
      { name: '向量嵌入', value: results.processing_details?.total_embeddings || 0, color: '#8b5cf6' }
    ];
  };

  const getTrendData = () => {
    // 模拟历史趋势数据
    return [
      { date: '6/25', documents: 45, chunks: 156, embeddings: 156 },
      { date: '6/26', documents: 52, chunks: 189, embeddings: 189 },
      { date: '6/27', documents: 38, chunks: 142, embeddings: 142 },
      { date: '6/28', documents: selectedExecution?.results?.processing_details?.total_elements || 89, 
        chunks: selectedExecution?.results?.processing_details?.total_chunks || 23,
        embeddings: selectedExecution?.results?.processing_details?.total_embeddings || 23 }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载结果数据...</p>
        </div>
      </div>
    );
  }

  if (!selectedExecution) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">暂无执行结果</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回工作流编辑
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* 左侧边栏 - 执行历史 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold">执行历史</h2>
          </div>
          <div className="text-sm text-gray-600">
            共 {executions.length} 条执行记录
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {executions.map(execution => (
            <div
              key={execution.id}
              onClick={() => setSelectedExecution(execution)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                selectedExecution?.id === execution.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{execution.id}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  execution.status === 'completed' ? 'bg-green-100 text-green-800' :
                  execution.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {execution.status === 'completed' ? '已完成' :
                   execution.status === 'failed' ? '失败' : '运行中'}
                </span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>创建时间: {new Date(execution.created_at).toLocaleString()}</div>
                {execution.results && (
                  <div>
                    处理元素: {execution.results.processing_details?.total_elements || 0} 个
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部操作栏 */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">执行结果详情</h1>
              <p className="text-gray-600">执行ID: {selectedExecution.id}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/comparison')}
                className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
              >
                <ScaleIcon className="h-4 w-4" />
                对比分析
              </button>
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                导出PDF
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                <PencilIcon className="h-4 w-4" />
                重新编辑
              </button>
            </div>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="bg-white border-b">
          <div className="flex space-x-1 p-4">
            {[
              { id: 'summary', label: '执行摘要', icon: DocumentTextIcon },
              { id: 'charts', label: '数据可视化', icon: ChartBarIcon },
              { id: 'details', label: '详细结果', icon: EyeIcon },
              { id: 'performance', label: '性能指标', icon: BeakerIcon }
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
        <div className="flex-1 overflow-y-auto bg-gray-50" id="results-content">
          <div className="p-6">
            {activeTab === 'summary' && (
              <div className="space-y-6">
                {/* 执行状态卡片 */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-bold mb-4">执行状态</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        selectedExecution.status === 'completed' ? 'bg-green-100' :
                        selectedExecution.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
                      }`}>
                        {selectedExecution.status === 'completed' ? (
                          <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        ) : selectedExecution.status === 'failed' ? (
                          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                        ) : (
                          <ClockIcon className="h-6 w-6 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {selectedExecution.status === 'completed' ? '执行成功' :
                           selectedExecution.status === 'failed' ? '执行失败' : '执行中'}
                        </div>
                        <div className="text-sm text-gray-600">状态</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <ClockIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {selectedExecution.results?.performance_metrics?.total_processing_time || 'N/A'}s
                        </div>
                        <div className="text-sm text-gray-600">处理时间</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <DocumentTextIcon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {selectedExecution.results?.processing_details?.total_elements || 0}
                        </div>
                        <div className="text-sm text-gray-600">处理元素</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 处理统计 */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-bold mb-4">处理统计</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedExecution.results?.processing_details?.total_elements || 0}
                      </div>
                      <div className="text-sm text-gray-600">文档元素</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedExecution.results?.processing_details?.total_chunks || 0}
                      </div>
                      <div className="text-sm text-gray-600">文本分块</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedExecution.results?.processing_details?.total_embeddings || 0}
                      </div>
                      <div className="text-sm text-gray-600">向量嵌入</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedExecution.results?.performance_metrics?.documents_processed || 0}
                      </div>
                      <div className="text-sm text-gray-600">文档数量</div>
                    </div>
                  </div>
                </div>

                {/* 管道阶段 */}
                {selectedExecution.results?.pipeline_stages && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-bold mb-4">处理管道</h3>
                    <div className="space-y-3">
                      {selectedExecution.results.pipeline_stages.map((stage, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{stage.stage}</div>
                            <div className="text-sm text-gray-600">
                              {stage.strategy && `策略: ${stage.strategy}`}
                              {stage.elements_extracted && ` | 提取元素: ${stage.elements_extracted}`}
                              {stage.chunks_created && ` | 创建分块: ${stage.chunks_created}`}
                              {stage.embeddings_generated && ` | 生成嵌入: ${stage.embeddings_generated}`}
                            </div>
                          </div>
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'charts' && (
              <div className="space-y-6">
                {/* 处理阶段图表 */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-bold mb-4">处理阶段分析</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getProcessingStageChart()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="elements" fill="#3b82f6" name="处理元素数" />
                      <Bar dataKey="time" fill="#10b981" name="处理时间(s)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 性能分布图 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-bold mb-4">处理分布</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={getPerformanceData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getPerformanceData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-bold mb-4">处理趋势</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={getTrendData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="documents" stroke="#3b82f6" name="文档数" />
                        <Line type="monotone" dataKey="chunks" stroke="#10b981" name="分块数" />
                        <Line type="monotone" dataKey="embeddings" stroke="#8b5cf6" name="嵌入数" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-bold mb-4">详细结果数据</h3>
                  <ReactJson 
                    src={selectedExecution.results || {}}
                    theme="rjv-default"
                    collapsed={2}
                    displayDataTypes={false}
                    displayObjectSize={false}
                    enableClipboard={true}
                    name="execution_results"
                  />
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-6">
                {/* 性能指标 */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-bold mb-4">性能指标</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                      <div className="text-sm text-blue-600 font-medium">总处理时间</div>
                      <div className="text-2xl font-bold text-blue-800">
                        {selectedExecution.results?.performance_metrics?.total_processing_time || 0}s
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                      <div className="text-sm text-green-600 font-medium">处理吞吐量</div>
                      <div className="text-2xl font-bold text-green-800">
                        {selectedExecution.results?.performance_metrics?.throughput_docs_per_second?.toFixed(2) || 0} docs/s
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                      <div className="text-sm text-purple-600 font-medium">内存使用</div>
                      <div className="text-2xl font-bold text-purple-800">~256MB</div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                      <div className="text-sm text-orange-600 font-medium">CPU利用率</div>
                      <div className="text-2xl font-bold text-orange-800">~45%</div>
                    </div>
                  </div>
                </div>

                {/* 性能建议 */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-bold mb-4">性能建议</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="font-medium text-green-800">✅ 处理速度良好</div>
                      <div className="text-sm text-green-600">当前吞吐量表现优秀，建议保持现有配置</div>
                    </div>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="font-medium text-yellow-800">⚠️ 可优化项</div>
                      <div className="text-sm text-yellow-600">考虑启用批处理模式以提高大文档处理效率</div>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="font-medium text-blue-800">💡 扩展建议</div>
                      <div className="text-sm text-blue-600">可以考虑使用更高精度的处理策略来提升结果质量</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;