import { Brain, Eye, MessageSquare, GitMerge, Route, Shield, Cpu, Layers, ArrowRight } from 'lucide-react';

export function ArchitectureView() {
  return (
    <div className="p-4 overflow-y-auto h-full space-y-3" style={{ background: 'var(--max-surface)' }}>
      <div className="max-card p-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm mb-4" style={{ color: 'var(--max-text-primary)' }}>
          <Cpu className="w-4 h-4" style={{ color: 'var(--max-primary)' }} />
          ML Pipeline
        </h3>
        
        <div className="space-y-2">
          {/* Input */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl text-xs font-medium shrink-0" style={{ background: 'var(--max-primary-light)', color: 'var(--max-primary)' }}>
              Input
            </div>
            <ArrowRight className="w-3 h-3 shrink-0" style={{ color: 'var(--max-text-tertiary)' }} />
            <div className="text-xs" style={{ color: 'var(--max-text-secondary)' }}>Текст / Фото / Текст+Фото</div>
          </div>
          
          {/* Parallel */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl" style={{ background: '#F0E6FF', border: '1px solid #D4B8FF' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5" style={{ color: '#7C3AED' }} />
                <span className="text-xs font-semibold" style={{ color: '#5B21B6' }}>Text Classifier</span>
              </div>
              <div className="text-[11px] space-y-0.5" style={{ color: '#6D28D9' }}>
                <p>• ~0.5B параметров</p>
                <p>• Category + Subcategory</p>
                <p>• Confidence score</p>
              </div>
            </div>
            
            <div className="p-3 rounded-xl" style={{ background: '#E6F9E6', border: '1px solid #B8E8B8' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Eye className="w-3.5 h-3.5" style={{ color: 'var(--max-success)' }} />
                <span className="text-xs font-semibold" style={{ color: '#166534' }}>Vision (YOLO)</span>
              </div>
              <div className="text-[11px] space-y-0.5" style={{ color: '#15803D' }}>
                <p>• Class A/B/C</p>
                <p>• Detected objects</p>
                <p>• Visual severity</p>
              </div>
            </div>
          </div>
          
          {/* Fusion */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 flex items-center gap-1.5" style={{ background: '#FFF4E6', color: 'var(--max-warning)' }}>
              <GitMerge className="w-3 h-3" />
              Fusion Engine
            </div>
            <ArrowRight className="w-3 h-3 shrink-0" style={{ color: 'var(--max-text-tertiary)' }} />
            <div className="text-xs" style={{ color: 'var(--max-text-secondary)' }}>Объединение + разрешение конфликтов</div>
          </div>
          
          {/* Post-processing */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl" style={{ background: '#FFE6E6', border: '1px solid #FFB8B8' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Shield className="w-3 h-3" style={{ color: 'var(--max-error)' }} />
                <span className="text-[11px] font-semibold" style={{ color: '#991B1B' }}>Severity Engine</span>
              </div>
              <p className="text-[10px]" style={{ color: '#B91C1C' }}>LOW → MEDIUM → HIGH → CRITICAL</p>
            </div>
            
            <div className="p-2.5 rounded-xl" style={{ background: 'var(--max-primary-light)', border: '1px solid #B8D4FF' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Brain className="w-3 h-3" style={{ color: 'var(--max-primary)' }} />
                <span className="text-[11px] font-semibold" style={{ color: '#1E40AF' }}>Clarification</span>
              </div>
              <p className="text-[10px]" style={{ color: '#1D4ED8' }}>Missing info → вопросы</p>
            </div>
          </div>
          
          {/* Output */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl text-xs font-medium shrink-0" style={{ background: '#E6F9E6', color: 'var(--max-success)' }}>
              Structured Incident
            </div>
            <ArrowRight className="w-3 h-3 shrink-0" style={{ color: 'var(--max-text-tertiary)' }} />
            <div className="text-xs" style={{ color: 'var(--max-text-secondary)' }}>Готовая заявка</div>
          </div>
          
          {/* Routing */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 flex items-center gap-1.5" style={{ background: '#E6F2FF', color: 'var(--max-primary)' }}>
              <Route className="w-3 h-3" />
              Routing
            </div>
            <ArrowRight className="w-3 h-3 shrink-0" style={{ color: 'var(--max-text-tertiary)' }} />
            <div className="text-xs" style={{ color: 'var(--max-text-secondary)' }}>→ Очередь мастеров</div>
          </div>
        </div>
      </div>
      
      {/* Taxonomy */}
      <div className="max-card p-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm mb-3" style={{ color: 'var(--max-text-primary)' }}>
          <Layers className="w-4 h-4" style={{ color: 'var(--max-primary)' }} />
          Таксономия MVP
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
            <div key={cat.name} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: 'var(--max-surface)' }}>
              <span className="text-lg">{cat.icon}</span>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--max-text-primary)' }}>{cat.name}</p>
                <p className="text-[10px]" style={{ color: 'var(--max-text-tertiary)' }}>{cat.subs} подкатегории</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Classification Results */}
      <div className="max-card p-4">
        <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--max-text-primary)' }}>
          Результаты классификации
        </h3>
        <div className="space-y-1.5">
          {[
            { result: 'KNOWN_INCIDENT', desc: 'Известная проблема', color: '#E6F9E6', textColor: 'var(--max-success)' },
            { result: 'OTHER_INCIDENT', desc: 'Тип не определён', color: '#FFF4E6', textColor: 'var(--max-warning)' },
            { result: 'NOT_INCIDENT', desc: 'Не проблема', color: 'var(--max-surface)', textColor: 'var(--max-text-secondary)' },
            { result: 'NEEDS_CLARIFICATION', desc: 'Нужно уточнение', color: 'var(--max-primary-light)', textColor: 'var(--max-primary)' },
            { result: 'CONFLICT', desc: 'Противоречие', color: '#FFE6E6', textColor: 'var(--max-error)' }
          ].map(item => (
            <div key={item.result} className="flex items-center justify-between p-2 rounded-xl" style={{ background: item.color }}>
              <span className="text-[11px] font-mono font-bold" style={{ color: item.textColor }}>{item.result}</span>
              <span className="text-[11px]" style={{ color: 'var(--max-text-secondary)' }}>{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* State Machine */}
      <div className="max-card p-4">
        <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--max-text-primary)' }}>
          State Machine заявки
        </h3>
        <div className="flex flex-wrap items-center gap-1">
          {['NEW', 'READY', 'AVAILABLE', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].map((status, idx) => (
            <div key={status} className="flex items-center gap-1">
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium" style={{ background: 'var(--max-primary-light)', color: 'var(--max-primary)' }}>
                {status}
              </span>
              {idx < 5 && <ArrowRight className="w-2.5 h-2.5" style={{ color: 'var(--max-text-tertiary)' }} />}
            </div>
          ))}
        </div>
        <div className="mt-2 text-[11px] space-y-0.5" style={{ color: 'var(--max-text-secondary)' }}>
          <p>• NEW → NEEDS_CLARIFICATION (уточнения)</p>
          <p>• Любой → CANCELLED (отмена)</p>
          <p>• Каждый переход фиксируется</p>
        </div>
      </div>
    </div>
  );
}
