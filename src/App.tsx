import { useState } from 'react';
import { Home, Layout, FlaskConical, Plug } from 'lucide-react';
import { useAppStore } from './store/useStore';
import { RoleSelector } from './components/RoleSelector';
import { ResidentView } from './components/ResidentView';
import { MasterView } from './components/MasterView';
import { ArchitectureView } from './components/ArchitectureView';
import { OverviewPage } from './components/OverviewPage';
import { TestScenarios } from './components/TestScenarios';
import { IntegrationGuide } from './components/IntegrationGuide';

type AppView = 'role-select' | 'resident' | 'master' | 'overview' | 'architecture' | 'tests' | 'integration';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('role-select');
  const store = useAppStore();

  const handleSelectRole = (role: 'resident' | 'master') => {
    setCurrentView(role);
  };

  const handleBack = () => {
    setCurrentView('role-select');
  };

  // Если выбрана роль — показываем соответствующий интерфейс
  if (currentView === 'resident') {
    return <ResidentView store={store} onBack={handleBack} />;
  }

  if (currentView === 'master') {
    return <MasterView store={store} onBack={handleBack} />;
  }

  // Навигация для остальных вкладок
  const tabs = [
    { key: 'overview' as const, label: 'Главная', icon: Home },
    { key: 'architecture' as const, label: 'Архитектура', icon: Layout },
    { key: 'tests' as const, label: 'Тесты', icon: FlaskConical },
    { key: 'integration' as const, label: 'MAX API', icon: Plug }
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--max-surface)' }}>
      {/* Header */}
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
                  onClick={() => setCurrentView(tab.key)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                  style={{
                    background: currentView === tab.key ? 'var(--max-primary-light)' : 'transparent',
                    color: currentView === tab.key ? 'var(--max-primary)' : 'var(--max-text-secondary)',
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
          {currentView === 'role-select' && <RoleSelector onSelectRole={handleSelectRole} />}
          {currentView === 'overview' && <OverviewPage />}
          {currentView === 'architecture' && <ArchitectureView />}
          {currentView === 'tests' && <TestScenarios />}
          {currentView === 'integration' && <IntegrationGuide />}
        </div>
      </main>
      
      {/* Mobile bottom nav */}
      <nav className="lg:hidden bg-white border-t flex shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setCurrentView(tab.key)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
              currentView === tab.key ? 'text-blue-600' : 'text-gray-500'
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
