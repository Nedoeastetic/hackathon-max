import { useState } from 'react';
import { Clock, MapPin, AlertTriangle, CheckCircle, Wrench } from 'lucide-react';
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
  NEW: 'bg-blue-100 text-blue-800',
  NEEDS_CLARIFICATION: 'bg-yellow-100 text-yellow-800',
  READY: 'bg-indigo-100 text-indigo-800',
  AVAILABLE: 'bg-green-100 text-green-800',
  ASSIGNED: 'bg-purple-100 text-purple-800',
  IN_PROGRESS: 'bg-orange-100 text-orange-800',
  RESOLVED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
};

export function MasterDashboard({ store }: Props) {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [filter, setFilter] = useState<'all' | 'available' | 'my'>('available');
  const [currentMaster] = useState(store.masters[0]); // Demo as first master

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
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
    return new Date(ts).toLocaleDateString('ru-RU');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{currentMaster.name}</h2>
            <p className="text-xs text-gray-500">{getWorkerTypeName(currentMaster.workerType)} • Рейтинг: {currentMaster.rating}⭐</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Онлайн</span>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex gap-2 mt-3">
          {[
            { key: 'available', label: 'Доступные', count: store.incidents.filter(i => i.status === 'AVAILABLE').length },
            { key: 'my', label: 'Мои заявки', count: store.incidents.filter(i => i.assignedWorker === currentMaster.id).length },
            { key: 'all', label: 'Все', count: store.incidents.length }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f.key ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>
      
      {/* Incident list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredIncidents.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Wrench className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Нет доступных заявок</p>
            <p className="text-xs mt-1">Перейдите на вкладку «Житель» чтобы создать заявку</p>
          </div>
        )}
        
        {filteredIncidents.map(incident => {
          const category = incident.category ? getCategoryById(incident.category) : null;
          const subcategory = incident.category && incident.subcategory ? getSubcategoryById(incident.category, incident.subcategory) : null;
          
          return (
            <div
              key={incident.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedIncident(incident)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category?.icon || '📋'}</span>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{category?.name || 'Не определено'}</h3>
                    <p className="text-xs text-gray-500">{subcategory?.name || 'Уточняется'}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[incident.status]}`}>
                  {statusLabels[incident.status]}
                </span>
              </div>
              
              <p className="text-sm text-gray-700 mt-2 line-clamp-2">{incident.description}</p>
              
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {incident.address}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(incident.createdAt)}
                </span>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getSeverityColor(incident.severity)}`}>
                    {getSeverityLabel(incident.severity)}
                  </span>
                  <span className="text-xs text-gray-400">
                    AI: {Math.round(incident.confidence * 100)}%
                  </span>
                </div>
                
                {incident.status === 'AVAILABLE' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleTakeIncident(incident); }}
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    Взять заявку
                  </button>
                )}
                
                {incident.status === 'ASSIGNED' && incident.assignedWorker === currentMaster.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStartWork(incident); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    Начать работу
                  </button>
                )}
                
                {incident.status === 'IN_PROGRESS' && incident.assignedWorker === currentMaster.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleResolve(incident); }}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    ✓ Выполнено
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Incident detail modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedIncident(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-900">Заявка #{selectedIncident.id}</h3>
                <button onClick={() => setSelectedIncident(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              
              {/* Status timeline */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">История статусов</h4>
                <div className="space-y-2">
                  {selectedIncident.statusHistory.map((change, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${idx === selectedIncident.statusHistory.length - 1 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-gray-600">{statusLabels[change.to]}</span>
                      <span className="text-gray-400">• {change.by}</span>
                      <span className="text-gray-400 ml-auto">{formatTime(change.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Details */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getCategoryById(selectedIncident.category || '')?.icon || '📋'}</span>
                  <div>
                    <p className="font-medium text-sm">{getCategoryById(selectedIncident.category || '')?.name || 'Не определено'}</p>
                    <p className="text-xs text-gray-500">{getSubcategoryById(selectedIncident.category || '', selectedIncident.subcategory || '')?.name || ''}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">{selectedIncident.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <span className="text-gray-500">Адрес</span>
                    <p className="font-medium text-gray-800">{selectedIncident.address}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <span className="text-gray-500">Место</span>
                    <p className="font-medium text-gray-800">{selectedIncident.location}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <span className="text-gray-500">Срочность</span>
                    <p className={`font-medium ${getSeverityColor(selectedIncident.severity)} px-2 py-0.5 rounded inline-block`}>
                      {getSeverityLabel(selectedIncident.severity)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <span className="text-gray-500">AI уверенность</span>
                    <p className="font-medium text-gray-800">{Math.round(selectedIncident.confidence * 100)}%</p>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  <p>Житель: {selectedIncident.userName}</p>
                  <p>Режим ввода: {selectedIncident.inputMode === 'TEXT_ONLY' ? 'Только текст' : selectedIncident.inputMode === 'IMAGE_ONLY' ? 'Только фото' : 'Текст + фото'}</p>
                  {selectedIncident.assignedWorkerName && <p>Исполнитель: {selectedIncident.assignedWorkerName}</p>}
                </div>
                
                {/* Safety warnings */}
                {selectedIncident.severity === 'CRITICAL' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <p className="text-xs text-red-700 font-medium">Критическая ситуация — требуется немедленное реагирование</p>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 mt-5 pt-4 border-t">
                {selectedIncident.status === 'AVAILABLE' && (
                  <button
                    onClick={() => handleTakeIncident(selectedIncident)}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
                  >
                    Взять заявку
                  </button>
                )}
                {selectedIncident.status === 'ASSIGNED' && selectedIncident.assignedWorker === currentMaster.id && (
                  <button
                    onClick={() => handleStartWork(selectedIncident)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
                  >
                    Начать работу
                  </button>
                )}
                {selectedIncident.status === 'IN_PROGRESS' && selectedIncident.assignedWorker === currentMaster.id && (
                  <button
                    onClick={() => handleResolve(selectedIncident)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
                  >
                    ✓ Выполнено
                  </button>
                )}
                {selectedIncident.status === 'RESOLVED' && (
                  <div className="flex-1 bg-green-50 text-green-700 py-2.5 rounded-lg font-medium text-sm text-center flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Заявка выполнена
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
