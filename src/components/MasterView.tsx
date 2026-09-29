import { useState } from 'react';
import { Wrench, ArrowLeft, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { AppStore } from '../store/useStore';
import { getSeverityLabel, getSeverityColor, getCategoryById, getSubcategoryById, getWorkerTypeName } from '../data/categories';
import { mockMasters } from '../data/mockData';

interface Props {
  store: AppStore;
  onBack: () => void;
}

export function MasterView({ store, onBack }: Props) {
  const [selectedMaster] = useState(mockMasters[0]); // Первый мастер для демо
  const [filter, setFilter] = useState<'available' | 'my' | 'all'>('available');

  const myIncidents = store.incidents.filter(i => i.assignedWorker === selectedMaster.id);
  const availableIncidents = store.incidents.filter(i => i.status === 'AVAILABLE');
  
  const filteredIncidents = filter === 'available' 
    ? availableIncidents 
    : filter === 'my' 
      ? myIncidents 
      : store.incidents;

  const handleTakeIncident = (incidentId: string) => {
    store.assignMaster(incidentId, selectedMaster.id);
  };

  const handleStartWork = (incidentId: string) => {
    store.updateIncidentStatus(incidentId, 'IN_PROGRESS', selectedMaster.name);
  };

  const handleResolve = (incidentId: string) => {
    store.updateIncidentStatus(incidentId, 'RESOLVED', selectedMaster.name, 'Проблема устранена');
  };

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--max-surface)' }}>
      {/* Header */}
      <div 
        className="shrink-0 border-b px-4 py-3"
        style={{ 
          background: 'var(--max-background)', 
          borderColor: 'var(--max-border)' 
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--max-text-secondary)' }} />
          </button>
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--max-warning)' }}
          >
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold truncate" style={{ color: 'var(--max-text-primary)' }}>
              {selectedMaster.name}
            </h2>
            <p className="text-xs truncate" style={{ color: 'var(--max-text-secondary)' }}>
              {getWorkerTypeName(selectedMaster.workerType)} • Рейтинг: {selectedMaster.rating}⭐
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: '#E6F9E6' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--max-success)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--max-success)' }}>Онлайн</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setFilter('available')}
            className="flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: filter === 'available' ? 'var(--max-primary)' : 'var(--max-surface)',
              color: filter === 'available' ? 'white' : 'var(--max-text-secondary)',
              border: `1px solid ${filter === 'available' ? 'var(--max-primary)' : 'var(--max-border)'}`
            }}
          >
            Доступные ({availableIncidents.length})
          </button>
          <button
            onClick={() => setFilter('my')}
            className="flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: filter === 'my' ? 'var(--max-primary)' : 'var(--max-surface)',
              color: filter === 'my' ? 'white' : 'var(--max-text-secondary)',
              border: `1px solid ${filter === 'my' ? 'var(--max-primary)' : 'var(--max-border)'}`
            }}
          >
            Мои ({myIncidents.length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className="flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: filter === 'all' ? 'var(--max-primary)' : 'var(--max-surface)',
              color: filter === 'all' ? 'white' : 'var(--max-text-secondary)',
              border: `1px solid ${filter === 'all' ? 'var(--max-primary)' : 'var(--max-border)'}`
            }}
          >
            Все ({store.incidents.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredIncidents.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--max-text-tertiary)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--max-text-secondary)' }}>
              Нет заявок
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--max-text-tertiary)' }}>
              {filter === 'available' ? 'Доступных заявок пока нет' : 'У вас пока нет заявок'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIncidents.map(incident => {
              const category = incident.category ? getCategoryById(incident.category) : null;
              const subcategory = incident.category && incident.subcategory 
                ? getSubcategoryById(incident.category, incident.subcategory) 
                : null;

              return (
                <div 
                  key={incident.id}
                  className="rounded-2xl p-4"
                  style={{ 
                    background: 'var(--max-background)', 
                    border: '1px solid var(--max-border)',
                    boxShadow: 'var(--max-shadow-sm)'
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{category?.icon || '📋'}</span>
                      <div>
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--max-text-primary)' }}>
                          {category?.name || 'Не определено'}
                        </h3>
                        <p className="text-xs" style={{ color: 'var(--max-text-secondary)' }}>
                          {subcategory?.name || 'Уточняется'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(incident.status)}`}>
                      {getStatusText(incident.status)}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm mb-3" style={{ color: 'var(--max-text-primary)' }}>
                    {incident.description}
                  </p>

                  {/* Info */}
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="p-2 rounded-lg" style={{ background: 'var(--max-surface)' }}>
                      <p style={{ color: 'var(--max-text-tertiary)' }}>Адрес</p>
                      <p className="font-medium" style={{ color: 'var(--max-text-primary)' }}>
                        {incident.address}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg" style={{ background: 'var(--max-surface)' }}>
                      <p style={{ color: 'var(--max-text-tertiary)' }}>Срочность</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full ${getSeverityColor(incident.severity)}`}>
                        {getSeverityLabel(incident.severity)}
                      </span>
                    </div>
                  </div>

                  {/* AI Confidence */}
                  <div className="flex items-center gap-2 mb-3 text-xs">
                    <span style={{ color: 'var(--max-text-tertiary)' }}>AI уверенность:</span>
                    <span className="font-medium" style={{ color: 'var(--max-primary)' }}>
                      {Math.round(incident.confidence * 100)}%
                    </span>
                  </div>

                  {/* Critical warning */}
                  {incident.severity === 'CRITICAL' && (
                    <div 
                      className="flex items-center gap-2 p-2 rounded-lg mb-3"
                      style={{ background: '#FFE6E6', border: '1px solid var(--max-error)' }}
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: 'var(--max-error)' }} />
                      <p className="text-xs font-medium" style={{ color: 'var(--max-error)' }}>
                        Критическая ситуация — требуется немедленное реагирование
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid var(--max-border)' }}>
                    {incident.status === 'AVAILABLE' && (
                      <button
                        onClick={() => handleTakeIncident(incident.id)}
                        className="flex-1 max-btn max-btn-primary text-xs py-2"
                      >
                        Взять заявку
                      </button>
                    )}
                    {incident.status === 'ASSIGNED' && incident.assignedWorker === selectedMaster.id && (
                      <button
                        onClick={() => handleStartWork(incident.id)}
                        className="flex-1 max-btn max-btn-primary text-xs py-2"
                      >
                        Начать работу
                      </button>
                    )}
                    {incident.status === 'IN_PROGRESS' && incident.assignedWorker === selectedMaster.id && (
                      <button
                        onClick={() => handleResolve(incident.id)}
                        className="flex-1 max-btn text-xs py-2"
                        style={{ background: 'var(--max-success)', color: 'white' }}
                      >
                        ✓ Выполнено
                      </button>
                    )}
                    {incident.status === 'RESOLVED' && (
                      <div 
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs"
                        style={{ background: '#E6F9E6' }}
                      >
                        <CheckCircle className="w-4 h-4" style={{ color: 'var(--max-success)' }} />
                        <span className="font-medium" style={{ color: 'var(--max-success)' }}>
                          Выполнено
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    AVAILABLE: 'Доступна',
    ASSIGNED: 'Назначена',
    IN_PROGRESS: 'В работе',
    RESOLVED: 'Выполнена'
  };
  return texts[status] || status;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    AVAILABLE: 'max-badge max-badge-success',
    ASSIGNED: 'max-badge max-badge-warning',
    IN_PROGRESS: 'max-badge max-badge-warning',
    RESOLVED: 'max-badge max-badge-success'
  };
  return colors[status] || 'max-badge';
}
