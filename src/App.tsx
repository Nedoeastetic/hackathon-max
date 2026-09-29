import { useState } from 'react';
import { Home, MessageCircle, Wrench, Layout, FlaskConical, Plug, ArrowLeft } from 'lucide-react';
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
    { key: 'overview' as Tab, label: 'Главная', icon: Home },
    { key: 'resident' as Tab, label: 'Житель', icon: MessageCircle },
    { key: 'master' as Tab, label: 'Мастер', icon: Wrench },
    { key: 'architecture' as Tab, label: 'Архитектура', icon: Layout },
    { key: 'tests' as Tab, label: 'Тесты', icon: FlaskConical },
    { key: 'integration' as Tab, label: 'MAX API', icon: Plug }
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--max-surface)' }}>
      {/* MAX-style Header */}
      <header 
        className="shrink-0 border-b"
        style={{ 
          background: 'var(--max-background)', 
          borderColor: 'var(--max-border)',
          boxShadow: 'var(--max-shadow-sm)'
        }}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center h-14">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'var(--max-primary)' }}
              >
                <span className="text-white text-sm font-bold">АД</span>
              </div>
              <div className="hidden sm:block">
                <h1 
                  className="text-base font-semibold leading-tight"
                  style={{ color: 'var(--max-text-primary)' }}
                >
                  Аварийный диспетчер
                </h1>
                <p 
                  className="text-xs leading-tight"
                  style={{ color: 'var(--max-text-secondary)' }}
                >
                  MAX • Умный город
                </p>
              </div>
            </div>
            
            {/* Desktop tabs */}
            <nav className="hidden lg:flex items-center gap-1 ml-6">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                  style={{
                    background: activeTab === tab.key ? 'var(--max-primary-light)' : 'transparent',
                    color: activeTab === tab.key ? 'var(--max-primary)' : 'var(--max-text-secondary)',
                  }}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden xl:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
            
            {/* Status */}
            <div className="hidden lg:flex items-center gap-2 ml-auto">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: '#E6F9E6' }}>
                <span 
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: 'var(--max-success)' }}
                />
                <span className="text-xs font-medium" style={{ color: 'var(--max-success)' }}>
                  Онлайн
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-5xl mx-auto">
          {activeTab === 'overview' && <OverviewPage />}
          {activeTab === 'resident' && (
            <div className="h-full flex">
              <div className="flex-1 max-w-md mx-auto w-full">
                <ResidentChat store={store} />
              </div>
            </div>
          )}
          {activeTab === 'master' && (
            <div className="h-full flex">
              <div className="flex-1 max-w-xl mx-auto w-full">
                <MasterDashboard store={store} />
              </div>
            </div>
          )}
          {activeTab === 'architecture' && <ArchitectureView />}
          {activeTab === 'tests' && <TestScenarios />}
          {activeTab === 'integration' && <IntegrationGuide />}
        </div>
      </main>
      
      {/* Mobile bottom nav - MAX style */}
      <nav 
        className="lg:hidden shrink-0 border-t flex"
        style={{ 
          background: 'var(--max-background)', 
          borderColor: 'var(--max-border)' 
        }}
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors"
              style={{ color: isActive ? 'var(--max-primary)' : 'var(--max-text-secondary)' }}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default App;
