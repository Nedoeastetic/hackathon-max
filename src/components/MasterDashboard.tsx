import { useState } from 'react';
import { Clock, MapPin, AlertTriangle, CheckCircle, Wrench, ChevronRight } from 'lucide-react';
import { AppStore } from '../store/useStore';
import { getCategoryById, getSubcategoryById, getWorkerTypeName, getSeverityLabel, getSeverityColor } from '../data/categories';
import { Incident, IncidentStatus } from '../types';

interface Props {
  store: AppStore;
}

const statusLabels: Record<IncidentStatus, string> = {
  NEW: 'Новая',
  NEEDS_CLARIFICATION: 'Уточнение',
  READY: 'Готова',
  AVAILABLE: 'Доступна',
  ASSIGNED: 'Назначена',
  IN_PROGRESS: 'В работе',
  RESOLVED: 'Выполнена',
  CANCELLED: 'Отменена'
};

const statusColors: Record<IncidentStatus, string> = {
  NEW: 'max-badge max-badge-primary',
  NEEDS_CLARIFICATION: 'max-badge max-badge-warning',
  READY: 'max-badge max-badge-primary',
  AVAILABLE: 'max-badge max-badge-success',
  ASSIGNED: 'max-badge max-badge-primary',
  IN_PROGRESS: 'max-badge max-badge-warning',
  RESOLVED: 'max-badge max-badge-success',
  CANCELLED: 'max-badge max-badge-error'
};

export function MasterDashboard({ store }: Props) {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [filter, setFilter] = useState<'available' | 'my' | 'all'>('available');
  const [currentMaster] = useState(store.masters[0]);

  const filteredIncidents = store.incidents.filter(inc => {
    if (filter === 'available') return inc.status === 'AVAILABLE';
    if (filter === 'my') return inc.assignedWorker === currentMaster.id;
    return true;
  });

  const handleTakeIncident = (incident: Incident) => {
    store.assignMaster(incident.id, currentMaster.id);
    setSelectedIncident(null);
  };

  const handleStartWork = (incident: Incident) => {
    store.updateIncidentStatus(incident.id, 'IN_PROGRESS', currentMaster.name);
  };

  const handleResolve = (incident: Incident) => {
    store.updateIncidentStatus(incident.id, 'RESOLVED', currentMaster.name, 'Проблема устранена');
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч`;
    return new Date(ts).toLocaleDateString('ru-RU');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div 
        className="shrink-0 border-b px-4 py-3"
        style={{ background: 'var(--max-background)', borderColor: 'var(--max-border)' }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--max-warning)' }}
          >
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold truncate" style={{ color: 'var(--max-text-primary)' }}>
                {currentMaster.name}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#FFF4E6', color: '#FF8C00' }}>
                демо-данные
              </span>
            </div>
            <p className="text-xs truncate" style={{ color: 'var(--max-text-secondary)' }}>
              {getWorkerTypeName(currentMaster.workerType)} • {currentMaster.rating}⭐
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: '#E6F9E6' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--max-success)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--max-success)' }}>Онлайн</span>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex gap-1.5 mt-3">
          {[
            { key: 'available' as const, label: 'Доступные', count: store.incidents.filter(i => i.status === 'AVAILABLE').length },
            { key: 'my' as const, label: 'Мои', count: store.incidents.filter(i => i.assignedWorker === currentMaster.id).length },
            { key: 'all' as const, label: 'Все', count: store.incidents.length }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: filter === f.key ? 'var(--max-primary)' : 'var(--max-surface)',
                color: filter === f.key ? 'white' : 'var(--max-text-secondary)',
                border: `1px solid ${filter === f.key ? 'var(--max-primary)' : 'var(--max-border)'}`
              }}
            >
              {f.label} {f.count > 0 && `(${f.count})`}
            </button>
          ))}
        </div>
      </div>
      
      {/* Incident list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ background: 'var(--max-surface)' }}>
        {filteredIncidents.length === 0 && (
          <div className="text-center py-16">
            <Wrench className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--max-text-tertiary)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--max-text-secondary)' }}>Нет заявок</p>
            <p className="text-xs mt-1" style={{ color: 'var(--max-text-tertiary)' }}>Перейдите на вкладку «Житель» чтобы создать</p>
          </div>
        )}
        
        {filteredIncidents.map(incident => {
          const category = incident.category ? getCategoryById(incident.category) : null;
          const subcategory = incident.category && incident.subcategory ? getSubcategoryById(incident.category, incident.subcategory) : null;
          
          return (
            <div
              key={incident.id}
              onClick={() => setSelectedIncident(incident)}
              className="rounded-2xl p-3 cursor-pointer transition-all active:scale-[0.98]"
              style={{ 
                background: 'var(--max-background)', 
                border: '1px solid var(--max-border)',
                boxShadow: 'var(--max-shadow-sm)'
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl shrink-0">{category?.icon || '📋'}</span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--max-text-primary)' }}>
                      {category?.name || 'Не определено'}
                    </h3>
                    <p className="text-xs truncate" style={{ color: 'var(--max-text-secondary)' }}>
                      {subcategory?.name || 'Уточняется'}
                    </p>
                  </div>
                </div>
                <span className={statusColors[incident.status]}>
                  {statusLabels[incident.status]}
                </span>
              </div>
              
              <p className="text-sm mt-2 line-clamp-2" style={{ color: 'var(--max-text-primary)' }}>
                {incident.description}
              </p>
              
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--max-text-secondary)' }}>
                  <MapPin className="w-3 h-3" />
                  {incident.address}
                </span>
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--max-text-secondary)' }}>
                  <Clock className="w-3 h-3" />
                  {formatTime(incident.createdAt)}
                </span>
              </div>
              
              <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: '1px solid var(--max-border)' }}>
                <div className="flex items-center gap-2">
                  <span className={`max-badge ${
                    incident.severity === 'CRITICAL' ? 'max-badge-error' :
                    incident.severity === 'HIGH' ? 'max-badge-warning' :
                    incident.severity === 'MEDIUM' ? 'max-badge-primary' : 'max-badge-success'
                  }`}>
                    {getSeverityLabel(incident.severity)}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--max-text-tertiary)' }}>
                    AI: {Math.round(incident.confidence * 100)}%
                  </span>
                </div>
                
                {incident.status === 'AVAILABLE' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleTakeIncident(incident); }}
                    className="max-btn max-btn-primary text-xs py-1.5 px-3"
                  >
                    Взять
                  </button>
                )}
                
                {incident.status === 'ASSIGNED' && incident.assignedWorker === currentMaster.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStartWork(incident); }}
                    className="max-btn max-btn-primary text-xs py-1.5 px-3"
                  >
                    Начать
                  </button>
                )}
                
                {incident.status === 'IN_PROGRESS' && incident.assignedWorker === currentMaster.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleResolve(incident); }}
                    className="max-btn text-xs py-1.5 px-3"
                    style={{ background: 'var(--max-success)', color: 'white' }}
                  >
                    ✓ Готово
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Modal */}
      {selectedIncident && (
        <div 
          className="fixed inset-0 flex items-end sm:items-center justify-center z-50 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setSelectedIncident(null)}
        >
          <div 
            className="w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto animate-slide-up"
            style={{ background: 'var(--max-background)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--max-text-primary)' }}>
                  Заявка #{selectedIncident.id}
                </h3>
                <button 
                  onClick={() => setSelectedIncident(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--max-surface)' }}
                >
                  ✕
                </button>
              </div>
              
              {/* Status timeline */}
              <div className="mb-4 p-3 rounded-xl" style={{ background: 'var(--max-surface)' }}>
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--max-text-secondary)' }}>
                  История статусов
                </p>
                <div className="space-y-1.5">
                  {selectedIncident.statusHistory.map((change, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <div 
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ 
                          background: idx === selectedIncident.statusHistory.length - 1 
                            ? 'var(--max-success)' 
                            : 'var(--max-text-tertiary)' 
                        }}
                      />
                      <span style={{ color: 'var(--max-text-primary)' }}>{statusLabels[change.to]}</span>
                      <span style={{ color: 'var(--max-text-tertiary)' }}>• {change.by}</span>
                      <span className="ml-auto" style={{ color: 'var(--max-text-tertiary)' }}>
                        {formatTime(change.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{getCategoryById(selectedIncident.category || '')?.icon || '📋'}</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--max-text-primary)' }}>
                      {getCategoryById(selectedIncident.category || '')?.name || 'Не определено'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--max-text-secondary)' }}>
                      {getSubcategoryById(selectedIncident.category || '', selectedIncident.subcategory || '')?.name || ''}
                    </p>
                  </div>
                </div>
                
                <div className="p-3 rounded-xl" style={{ background: 'var(--max-surface)' }}>
                  <p className="text-sm" style={{ color: 'var(--max-text-primary)' }}>
                    {selectedIncident.description}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl" style={{ background: 'var(--max-surface)' }}>
                    <p className="text-xs" style={{ color: 'var(--max-text-secondary)' }}>Адрес</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--max-text-primary)' }}>
                      {selectedIncident.address}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl" style={{ background: 'var(--max-surface)' }}>
                    <p className="text-xs" style={{ color: 'var(--max-text-secondary)' }}>Место</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--max-text-primary)' }}>
                      {selectedIncident.location}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl" style={{ background: 'var(--max-surface)' }}>
                    <p className="text-xs" style={{ color: 'var(--max-text-secondary)' }}>Срочность</p>
                    <p className={`max-badge mt-1 ${
                      selectedIncident.severity === 'CRITICAL' ? 'max-badge-error' :
                      selectedIncident.severity === 'HIGH' ? 'max-badge-warning' :
                      selectedIncident.severity === 'MEDIUM' ? 'max-badge-primary' : 'max-badge-success'
                    }`}>
                      {getSeverityLabel(selectedIncident.severity)}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl" style={{ background: 'var(--max-surface)' }}>
                    <p className="text-xs" style={{ color: 'var(--max-text-secondary)' }}>AI</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--max-text-primary)' }}>
                      {Math.round(selectedIncident.confidence * 100)}%
                    </p>
                  </div>
                </div>
                
                {selectedIncident.severity === 'CRITICAL' && (
                  <div 
                    className="flex items-center gap-2 p-3 rounded-xl"
                    style={{ background: '#FFE6E6', border: '1px solid var(--max-error)' }}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: 'var(--max-error)' }} />
                    <p className="text-xs font-medium" style={{ color: 'var(--max-error)' }}>
                      Критическая ситуация — требуется немедленное реагирование
                    </p>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--max-border)' }}>
                {selectedIncident.status === 'AVAILABLE' && (
                  <button
                    onClick={() => handleTakeIncident(selectedIncident)}
                    className="flex-1 max-btn max-btn-primary py-3"
                  >
                    Взять заявку
                  </button>
                )}
                {selectedIncident.status === 'ASSIGNED' && selectedIncident.assignedWorker === currentMaster.id && (
                  <button
                    onClick={() => handleStartWork(selectedIncident)}
                    className="flex-1 max-btn max-btn-primary py-3"
                  >
                    Начать работу
                  </button>
                )}
                {selectedIncident.status === 'IN_PROGRESS' && selectedIncident.assignedWorker === currentMaster.id && (
                  <button
                    onClick={() => handleResolve(selectedIncident)}
                    className="flex-1 max-btn py-3"
                    style={{ background: 'var(--max-success)', color: 'white' }}
                  >
                    ✓ Выполнено
                  </button>
                )}
                {selectedIncident.status === 'RESOLVED' && (
                  <div 
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl"
                    style={{ background: '#E6F9E6' }}
                  >
                    <CheckCircle className="w-4 h-4" style={{ color: 'var(--max-success)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--max-success)' }}>
                      Выполнено
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
