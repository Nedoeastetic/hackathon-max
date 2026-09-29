import { AlertTriangle, Clock, Users, Zap, CheckCircle, Target, TrendingDown, ArrowRight } from 'lucide-react';

export function OverviewPage() {
  return (
    <div className="p-4 overflow-y-auto h-full space-y-3" style={{ background: 'var(--max-surface)' }}>
      {/* Hero card */}
      <div 
        className="rounded-2xl p-5 text-white"
        style={{ 
          background: 'linear-gradient(135deg, #0077FF 0%, #0055CC 100%)',
          boxShadow: 'var(--max-shadow-md)'
        }}
      >
        <h1 className="text-xl font-bold mb-1.5">Аварийный диспетчер МКД</h1>
        <p className="text-sm text-blue-100 mb-3">
          Автоматическая обработка обращений жителей через AI
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span className="bg-white/20 px-2.5 py-1 rounded-full font-medium">MAX</span>
          <span className="bg-white/20 px-2.5 py-1 rounded-full font-medium">Хакатон</span>
          <span className="bg-white/20 px-2.5 py-1 rounded-full font-medium">MVP</span>
        </div>
      </div>
      
      {/* Problem */}
      <div className="max-card p-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm mb-2" style={{ color: 'var(--max-text-primary)' }}>
          <AlertTriangle className="w-4 h-4" style={{ color: 'var(--max-error)' }} />
          Проблема
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--max-text-secondary)' }}>
          Житель МКД не знает, к какой категории отнести проблему, кому она адресована и насколько она срочна. 
          В результате — лишние ручные действия, уточнения и задержки между обнаружением проблемы и передачей исполнителю.
        </p>
      </div>
      
      {/* As Is → To Be */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="max-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="max-badge max-badge-error">As Is</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--max-text-primary)' }}>Текущий процесс</span>
          </div>
          <div className="space-y-1 text-xs" style={{ color: 'var(--max-text-secondary)' }}>
            <p>1. Житель обнаруживает проблему</p>
            <p>2. Не понимает — это авария?</p>
            <p>3. Не знает, кто отвечает</p>
            <p>4. Ищет телефон/чат УК</p>
            <p>5. Описывает своими словами</p>
            <p>6. Диспетчер задаёт вопросы</p>
            <p>7. Диспетчер классифицирует</p>
            <p>8. Диспетчер направляет</p>
            <p className="font-medium" style={{ color: 'var(--max-error)' }}>→ Много ручных действий</p>
          </div>
        </div>
        
        <div className="max-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="max-badge max-badge-success">To Be</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--max-text-primary)' }}>С решением</span>
          </div>
          <div className="space-y-1 text-xs" style={{ color: 'var(--max-text-secondary)' }}>
            <p>1. Житель отправляет фото/текст</p>
            <p>2. AI анализирует и классифицирует</p>
            <p>3. Система определяет категорию</p>
            <p>4. Уточняет только если нужно</p>
            <p>5. Формирует заявку</p>
            <p>6. Житель подтверждает</p>
            <p>7. Заявка попадает к мастерам</p>
            <p>8. Свободный мастер берёт</p>
            <p className="font-medium" style={{ color: 'var(--max-success)' }}>→ Автоматизация + минимум шагов</p>
          </div>
        </div>
      </div>
      
      {/* KPI */}
      <div className="max-card p-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm mb-3" style={{ color: 'var(--max-text-primary)' }}>
          <Target className="w-4 h-4" style={{ color: 'var(--max-primary)' }} />
          Основной KPI
        </h3>
        <div 
          className="p-3 rounded-xl text-sm"
          style={{ background: 'var(--max-primary-light)', color: 'var(--max-primary)' }}
        >
          «Время от отправки обращения до появления заявки у подходящего исполнителя»
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { icon: TrendingDown, label: 'Ручная обработка', value: '↓ Снижение', color: 'var(--max-success)' },
            { icon: Clock, label: 'Время маршрутизации', value: '↓ Сокращение', color: 'var(--max-primary)' },
            { icon: CheckCircle, label: 'Точность', value: '↑ Рост', color: 'var(--max-primary)' }
          ].map((item, idx) => (
            <div key={idx} className="text-center p-2 rounded-xl" style={{ background: 'var(--max-surface)' }}>
              <item.icon className="w-5 h-5 mx-auto mb-1" style={{ color: item.color }} />
              <p className="text-[10px]" style={{ color: 'var(--max-text-secondary)' }}>{item.label}</p>
              <p className="text-xs font-bold" style={{ color: 'var(--max-text-primary)' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Value */}
      <div className="max-card p-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm mb-3" style={{ color: 'var(--max-text-primary)' }}>
          <Zap className="w-4 h-4" style={{ color: 'var(--max-warning)' }} />
          Ценность
        </h3>
        <div className="space-y-2.5">
          {[
            { icon: '👤', title: 'Житель', desc: 'Не нужно знать, кто отвечает. Достаточно показать проблему.' },
            { icon: '🏢', title: 'УК', desc: 'Первичная обработка автоматизирована и структурирована.' },
            { icon: '🔧', title: 'Мастер', desc: 'Получает классифицированную задачу, а не сырое сообщение.' },
            { icon: '🌐', title: 'Система', desc: 'Сокращается путь от проблемы до исполнителя.' }
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="text-xl shrink-0">{item.icon}</span>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--max-text-primary)' }}>{item.title}</p>
                <p className="text-xs" style={{ color: 'var(--max-text-secondary)' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Demo scenarios */}
      <div className="max-card p-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm mb-3" style={{ color: 'var(--max-text-primary)' }}>
          <Users className="w-4 h-4" style={{ color: 'var(--max-primary)' }} />
          Демо-сценарии
        </h3>
        <div className="space-y-2">
          {[
            { color: '#E6F9E6', border: 'var(--max-success)', title: '✅ Протечка', desc: 'Текст + фото → AI → заявка → мастер' },
            { color: '#FFF4E6', border: 'var(--max-warning)', title: '🐱 Кот', desc: 'NOT_INCIDENT — заявка не создаётся' },
            { color: '#E6F2FF', border: 'var(--max-primary)', title: '❓ Неизвестное', desc: 'OTHER_INCIDENT — уточнение' }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className="p-2.5 rounded-xl"
              style={{ background: item.color, border: `1px solid ${item.border}` }}
            >
              <p className="text-xs font-semibold" style={{ color: 'var(--max-text-primary)' }}>{item.title}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--max-text-secondary)' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Limitations */}
      <div className="max-card p-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm mb-3" style={{ color: 'var(--max-text-primary)' }}>
          <AlertTriangle className="w-4 h-4" style={{ color: 'var(--max-warning)' }} />
          Ограничения MVP
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs" style={{ color: 'var(--max-text-secondary)' }}>
          {[
            'Ограниченный набор классов',
            'Тестовые данные',
            'Ограниченный пул мастеров',
            'Нет интеграции с УК/ГИС ЖКХ',
            'AI-priority предварительный',
            'Возможные ошибки CV',
            'Нужно подтверждение',
            'Необходимо расширение'
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <span style={{ color: 'var(--max-warning)' }}>•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
