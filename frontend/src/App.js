import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
  FolderIcon,
  BeakerIcon,
  ArrowLeftIcon,
  DocumentChartBarIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ScaleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

// Import页面组件
import WorkflowEditor from './components/WorkflowEditor';
import ResultsPage from './components/ResultsPage';
import ComparisonPage from './components/ComparisonPage';
import DocumentVisualizationPage from './components/DocumentVisualizationPage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// 主导航组件
const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', label: '工作流编辑', icon: BoltIcon },
    { path: '/results', label: '结果分析', icon: DocumentChartBarIcon },
    { path: '/comparison', label: '结果对比', icon: ScaleIcon },
  ];

  return (
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
        
        <nav className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                  isActive 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <BrowserRouter>
        <Navigation />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<WorkflowEditor />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/results/:executionId" element={<ResultsPage />} />
            <Route path="/comparison" element={<ComparisonPage />} />
          </Routes>
        </div>
        <ToastContainer position="bottom-right" />
      </BrowserRouter>
    </div>
  );
}

export default App;