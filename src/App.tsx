import { useState } from 'react';
import { Home, MessageCircle, Wrench, Layout, FlaskConical, Plug } from 'lucide-react';
import { useAppStore } from './store/useStore';
import { ResidentChat } from './components/ResidentChat';
import { MasterDashboard } from './components/MasterDashboard';
import { ArchitectureView } from './components/ArchitectureView';
import { OverviewPage } from './components/OverviewPage';
import { TestScenarios } from './components/TestScenarios';
import { IntegrationGuide } from './components/IntegrationGuide';

type Tab = 'overview' | 'resident' | 'master' | 'architecture' | 'tests' | 'integration';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const store = useAppStore();

  const tabs = [
    { key: 'overview' as Tab, label: 'Обзор', icon: Home },
    { key: 'resident' as Tab, label: 'Житель', icon: MessageCircle },
    { key: 'master' as Tab, label: 'Мастер', icon: Wrench },
    { key: 'architecture' as Tab, label: 'Архитектура', icon: Layout },
    { key: 'tests' as Tab, label: 'Тесты', icon: FlaskConical },
    { key: 'integration' as Tab, label: 'MAX', icon: Plug }
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Top navigation */}
      <header className="bg-white border-b shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">АД</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-gray-900">Аварийный диспетчер МКД</h1>
                <p className="text-xs text-gray-500">MAX • Хакатон «Умный город»</p>
              </div>
            </div>
            
            {/* Desktop tabs */}
            <nav className="hidden lg:flex items-center gap-1">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.key 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
            
            {/* Status */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                MVP Demo
              </span>
            </div>
          </div>
          
          {/* Tablet tabs */}
          <nav className="lg:hidden flex items-center gap-1 overflow-x-auto pb-2 -mx-4 px-4">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.key 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto">
          {activeTab === 'overview' && <OverviewPage />}
          {activeTab === 'resident' && (
            <div className="h-full flex">
              <div className="flex-1 max-w-lg mx-auto w-full border-x bg-white">
                <ResidentChat store={store} />
              </div>
            </div>
          )}
          {activeTab === 'master' && (
            <div className="h-full flex">
              <div className="flex-1 max-w-2xl mx-auto w-full border-x bg-white">
                <MasterDashboard store={store} />
              </div>
            </div>
          )}
          {activeTab === 'architecture' && <ArchitectureView />}
          {activeTab === 'tests' && <TestScenarios />}
          {activeTab === 'integration' && <IntegrationGuide />}
        </div>
      </main>
      
      {/* Mobile bottom nav */}
      <nav className="lg:hidden bg-white border-t flex shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
              activeTab === tab.key ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px]">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
