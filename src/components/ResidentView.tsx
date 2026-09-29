import { useState } from 'react';
import { MessageCircle, History, ArrowLeft } from 'lucide-react';
import { AppStore } from '../store/useStore';
import { ResidentChat } from './ResidentChat';
import { getSeverityLabel, getSeverityColor, getCategoryById } from '../data/categories';

interface Props {
  store: AppStore;
  onBack: () => void;
}

export function ResidentView({ store, onBack }: Props) {
  const [view, setView] = useState<'chat' | 'history'>('chat');
  
  const userIncidents = store.incidents.filter(i => i.userId === 'resident-demo');

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--max-surface)' }}>
      {/* Header */}
      <div 
        className="shrink-0 border-b px-4 py-3 flex items-center gap-3"
        style={{ 
          background: 'var(--max-background)', 
          borderColor: 'var(--max-border)' 
        }}
      >
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--max-text-secondary)' }} />
        </button>
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--max-primary)' }}
        >
          <span className="text-white text-lg">👤</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold truncate" style={{ color: 'var(--max-text-primary)' }}>
            Житель
          </h2>
          <p className="text-xs truncate" style={{ color: 'var(--max-text-secondary)' }}>
            Отправка обращений
          </p>
        </div>
        
        {/* Переключатель */}
        <div className="flex gap-1 p-1 rounded-full" style={{ background: 'var(--max-surface)' }}>
          <button
            onClick={() => setView('chat')}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1"
            style={{
              background: view === 'chat' ? 'var(--max-primary)' : 'transparent',
              color: view === 'chat' ? 'white' : 'var(--max-text-secondary)'
            }}
          >
            <MessageCircle className="w-3 h-3" />
            Чат
          </button>
          <button
            onClick={() => setView('history')}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1"
            style={{
              background: view === 'history' ? 'var(--max-primary)' : 'transparent',
              color: view === 'history' ? 'white' : 'var(--max-text-secondary)'
            }}
          >
            <History className="w-3 h-3" />
            Заявки ({userIncidents.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'chat' ? (
          <ResidentChat store={store} />
        ) : (
          <div className="h-full overflow-y-auto p-4">
            {userIncidents.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--max-text-tertiary)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--max-text-secondary)' }}>
                  У вас пока нет заявок
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--max-text-tertiary)' }}>
                  Перейдите в чат чтобы создать обращение
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {userIncidents.map(incident => {
                  const category = incident.category ? getCategoryById(incident.category) : null;
                  
                  return (
                    <div 
                      key={incident.id}
                      className="rounded-2xl p-4"
                      style={{ 
                        background: 'var(--max-background)', 
                        border: '1px solid var(--max-border)' 
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{category?.icon || '📋'}</span>
                          <div>
                            <h3 className="text-sm font-semibold" style={{ color: 'var(--max-text-primary)' }}>
                              #{incident.id}
                            </h3>
                            <p className="text-xs" style={{ color: 'var(--max-text-secondary)' }}>
                              {category?.name || 'Не определено'}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(incident.status)}`}>
                          {getStatusText(incident.status)}
                        </span>
                      </div>
                      
                      <p className="text-sm mb-2" style={{ color: 'var(--max-text-primary)' }}>
                        {incident.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: 'var(--max-text-secondary)' }}>
                          {new Date(incident.createdAt).toLocaleString('ru-RU', { 
                            day: '2-digit', 
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full ${getSeverityColor(incident.severity)}`}>
                          {getSeverityLabel(incident.severity)}
                        </span>
                      </div>
                      
                      {incident.assignedWorkerName && (
                        <div 
                          className="mt-2 pt-2 flex items-center gap-2 text-xs"
                          style={{ borderTop: '1px solid var(--max-border)' }}
                        >
                          <span style={{ color: 'var(--max-text-secondary)' }}>Мастер:</span>
                          <span className="font-medium" style={{ color: 'var(--max-text-primary)' }}>
                            {incident.assignedWorkerName}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    AVAILABLE: 'Ожидает',
    ASSIGNED: 'Назначена',
    IN_PROGRESS: 'В работе',
    RESOLVED: 'Выполнена'
  };
  return texts[status] || status;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    AVAILABLE: 'max-badge max-badge-primary',
    ASSIGNED: 'max-badge max-badge-warning',
    IN_PROGRESS: 'max-badge max-badge-warning',
    RESOLVED: 'max-badge max-badge-success'
  };
  return colors[status] || 'max-badge';
}
