import { Brain, Eye, MessageSquare, GitMerge, Route, Database, Shield, Cpu, Layers, ArrowRight } from 'lucide-react';

export function ArchitectureView() {
  return (
    <div className="p-6 overflow-y-auto h-full bg-gray-50">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Архитектура системы</h2>
      <p className="text-sm text-gray-600 mb-6">ML Pipeline и обработка обращений</p>
      
      {/* ML Pipeline */}
      <div className="bg-white rounded-xl border p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-600" />
          ML Pipeline
        </h3>
        
        <div className="space-y-3">
          {/* Input */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs font-medium text-blue-800 min-w-[140px]">
              Input
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className="text-xs text-gray-600">Текст / Фото / Текст+Фото</div>
          </div>
          
          {/* Preprocessing */}
          <div className="flex items-center gap-3">
            <div className="bg-gray-50 border rounded-lg px-3 py-2 text-xs font-medium text-gray-700 min-w-[140px]">
              Preprocessing
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className="text-xs text-gray-600">Нормализация, аугментация</div>
          </div>
          
          {/* Parallel processing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold text-purple-800">Text Classifier</span>
              </div>
              <div className="text-xs text-purple-700 space-y-1">
                <p>• ~0.5B параметров</p>
                <p>• Category + Subcategory</p>
                <p>• Urgency signals</p>
                <p>• Confidence score</p>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-800">Vision (YOLO)</span>
              </div>
              <div className="text-xs text-green-700 space-y-1">
                <p>• Class A/B/C</p>
                <p>• Detected objects</p>
                <p>• Visual severity</p>
                <p>• Confidence score</p>
              </div>
            </div>
          </div>
          
          {/* Fusion */}
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs font-medium text-orange-800 min-w-[140px] flex items-center gap-2">
              <GitMerge className="w-4 h-4" />
              Fusion Engine
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className="text-xs text-gray-600">Объединение результатов, разрешение конфликтов</div>
          </div>
          
          {/* Post-processing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-red-600" />
                <span className="text-xs font-semibold text-red-800">Severity Engine</span>
              </div>
              <p className="text-xs text-red-700">LOW → MEDIUM → HIGH → CRITICAL</p>
            </div>
            
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-800">Clarification Engine</span>
              </div>
              <p className="text-xs text-indigo-700">Missing info → вопросы</p>
            </div>
          </div>
          
          {/* Output */}
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs font-medium text-emerald-800 min-w-[140px]">
              Structured Incident
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className="text-xs text-gray-600">Готовая заявка для маршрутизации</div>
          </div>
          
          {/* Routing */}
          <div className="flex items-center gap-3">
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg px-3 py-2 text-xs font-medium text-cyan-800 min-w-[140px] flex items-center gap-2">
              <Route className="w-4 h-4" />
              Routing Engine
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className="text-xs text-gray-600">→ Очередь подходящих мастеров</div>
          </div>
        </div>
      </div>
      
      {/* Taxonomy */}
      <div className="bg-white rounded-xl border p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-600" />
          Таксономия MVP (8 категорий)
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: '💧', name: 'Водоснабжение', subs: 4 },
            { icon: '⚡', name: 'Электроснабжение', subs: 3 },
            { icon: '🔥', name: 'Отопление', subs: 3 },
            { icon: '🧹', name: 'Уборка', subs: 3 },
            { icon: '🌳', name: 'Двор', subs: 4 },
            { icon: '🚪', name: 'Двери/замки', subs: 3 },
            { icon: '🛗', name: 'Лифт', subs: 2 },
            { icon: '🏠', name: 'Крыша', subs: 2 }
          ].map(cat => (
            <div key={cat.name} className="bg-gray-50 rounded-lg p-2 flex items-center gap-2">
              <span className="text-lg">{cat.icon}</span>
              <div>
                <p className="text-xs font-medium text-gray-800">{cat.name}</p>
                <p className="text-xs text-gray-500">{cat.subs} подкатегории</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Classification Results */}
      <div className="bg-white rounded-xl border p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Результаты классификации</h3>
        <div className="space-y-2">
          {[
            { result: 'KNOWN_INCIDENT', desc: 'Известная проблема — заявка создаётся', color: 'bg-green-50 border-green-200 text-green-800' },
            { result: 'OTHER_INCIDENT', desc: 'Проблема есть, но тип не определён', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
            { result: 'NOT_INCIDENT', desc: 'Не проблема — заявка не создаётся', color: 'bg-gray-50 border-gray-200 text-gray-800' },
            { result: 'NEEDS_CLARIFICATION', desc: 'Недостаточно данных — уточнение', color: 'bg-blue-50 border-blue-200 text-blue-800' },
            { result: 'CONFLICT', desc: 'Противоречие текст/фото', color: 'bg-orange-50 border-orange-200 text-orange-800' },
            { result: 'SYSTEM_ERROR', desc: 'Ошибка системы', color: 'bg-red-50 border-red-200 text-red-800' }
          ].map(item => (
            <div key={item.result} className={`rounded-lg border p-2 flex items-center justify-between ${item.color}`}>
              <span className="text-xs font-mono font-bold">{item.result}</span>
              <span className="text-xs">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* State Machine */}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-gray-900 mb-4">State Machine заявки</h3>
        <div className="flex flex-wrap items-center gap-1 text-xs">
          {['NEW', 'READY', 'AVAILABLE', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].map((status, idx) => (
            <div key={status} className="flex items-center gap-1">
              <span className="bg-blue-50 border border-blue-200 text-blue-800 px-2 py-1 rounded font-mono">{status}</span>
              {idx < 5 && <ArrowRight className="w-3 h-3 text-gray-400" />}
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-500">
          <p>• NEW → NEEDS_CLARIFICATION (если нужны уточнения)</p>
          <p>• Любой статус → CANCELLED (отмена)</p>
          <p>• Каждый переход фиксируется в StatusHistory</p>
        </div>
      </div>
    </div>
  );
}
