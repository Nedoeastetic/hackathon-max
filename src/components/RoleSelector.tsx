import { User, Wrench } from 'lucide-react';

interface Props {
  onSelectRole: (role: 'resident' | 'master') => void;
}

export function RoleSelector({ onSelectRole }: Props) {
  return (
    <div 
      className="h-full flex items-center justify-center p-6"
      style={{ background: 'var(--max-surface)' }}
    >
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--max-primary)' }}
          >
            <span className="text-white text-2xl font-bold">АД</span>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--max-text-primary)' }}>
            Аварийный диспетчер МКД
          </h1>
          <p className="text-sm" style={{ color: 'var(--max-text-secondary)' }}>
            Выберите вашу роль для демонстрации
          </p>
        </div>

        <div className="space-y-3">
          {/* Житель */}
          <button
            onClick={() => onSelectRole('resident')}
            className="w-full p-5 rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ 
              background: 'var(--max-background)',
              borderColor: 'var(--max-border)'
            }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'var(--max-primary-light)' }}
              >
                <User className="w-7 h-7" style={{ color: 'var(--max-primary)' }} />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--max-text-primary)' }}>
                  Житель
                </h3>
                <p className="text-xs" style={{ color: 'var(--max-text-secondary)' }}>
                  Отправить обращение о проблеме в доме
                </p>
              </div>
            </div>
          </button>

          {/* Мастер */}
          <button
            onClick={() => onSelectRole('master')}
            className="w-full p-5 rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ 
              background: 'var(--max-background)',
              borderColor: 'var(--max-border)'
            }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                style={{ background: '#FFF4E6' }}
              >
                <Wrench className="w-7 h-7" style={{ color: 'var(--max-warning)' }} />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--max-text-primary)' }}>
                  Мастер
                </h3>
                <p className="text-xs" style={{ color: 'var(--max-text-secondary)' }}>
                  Просмотр и выполнение заявок от жителей
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs" style={{ color: 'var(--max-text-tertiary)' }}>
            Демо-версия для хакатона «Умный город»
          </p>
        </div>
      </div>
    </div>
  );
}
