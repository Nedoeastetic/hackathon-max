import { AlertTriangle, Clock, Users, Zap, CheckCircle, Target, TrendingDown } from 'lucide-react';

export function OverviewPage() {
  return (
    <div className="p-6 overflow-y-auto h-full bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white mb-6">
        <h1 className="text-2xl font-bold mb-2">Аварийный диспетчер МКД</h1>
        <p className="text-blue-100 text-sm mb-4">
          Цифровой сервис для обработки аварийных и эксплуатационных обращений жителей
        </p>
        <div className="flex items-center gap-2 text-xs text-blue-200">
          <span className="bg-white/20 px-2 py-1 rounded">MAX</span>
          <span className="bg-white/20 px-2 py-1 rounded">Хакатон «Умный город»</span>
          <span className="bg-white/20 px-2 py-1 rounded">MVP</span>
        </div>
      </div>
      
      {/* Problem */}
      <div className="bg-white rounded-xl border p-5 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          Проблема
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          Житель МКД, столкнувшись с аварийной или эксплуатационной проблемой, часто не знает, 
          к какой категории её отнести, кому она адресована, какие сведения необходимо предоставить 
          и насколько срочным является обращение. В результате между обнаружением проблемы и её 
          передачей исполнителю возникают лишние ручные действия, уточнения и задержки.
        </p>
      </div>
      
      {/* As Is → To Be */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl border p-4">
          <h4 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
            <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">As Is</span>
            Текущий процесс
          </h4>
          <div className="space-y-1.5 text-xs text-gray-600">
            <p>1. Житель обнаруживает проблему</p>
            <p>2. Не понимает — это авария?</p>
            <p>3. Не знает, кто отвечает</p>
            <p>4. Ищет телефон/чат УК</p>
            <p>5. Описывает своими словами</p>
            <p>6. Диспетчер задаёт вопросы</p>
            <p>7. Диспетчер классифицирует</p>
            <p>8. Диспетчер направляет</p>
            <p>9. Исполнитель получает задачу</p>
            <p className="text-red-600 font-medium">→ Много ручных действий и задержек</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border p-4">
          <h4 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">To Be</span>
            С решением
          </h4>
          <div className="space-y-1.5 text-xs text-gray-600">
            <p>1. Житель отправляет фото/текст</p>
            <p>2. AI анализирует и классифицирует</p>
            <p>3. Система определяет категорию</p>
            <p>4. Уточняет только если нужно</p>
            <p>5. Формирует структурированную заявку</p>
            <p>6. Житель подтверждает</p>
            <p>7. Заявка попадает к мастерам</p>
            <p>8. Свободный мастер берёт</p>
            <p>9. Житель получает результат</p>
            <p className="text-green-600 font-medium">→ Автоматизация + минимум шагов</p>
          </div>
        </div>
      </div>
      
      {/* Key metrics */}
      <div className="bg-white rounded-xl border p-5 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          Основной KPI
        </h3>
        <p className="text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
          «Время от отправки обращения жителем до появления корректно маршрутизированной заявки 
          у подходящего исполнителя»
        </p>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center">
            <TrendingDown className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Ручная обработка</p>
            <p className="text-sm font-bold text-gray-900">↓ Снижение</p>
          </div>
          <div className="text-center">
            <Clock className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Время маршрутизации</p>
            <p className="text-sm font-bold text-gray-900">↓ Сокращение</p>
          </div>
          <div className="text-center">
            <CheckCircle className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Точность маршрутизации</p>
            <p className="text-sm font-bold text-gray-900">↑ Рост</p>
          </div>
        </div>
      </div>
      
      {/* Value */}
      <div className="bg-white rounded-xl border p-5 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Ценность для каждого
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-xl">👤</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Житель</p>
              <p className="text-xs text-gray-600">Не нужно знать, кто отвечает и как правильно описать. Достаточно показать или описать проблему.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">🏢</span>
            <div>
              <p className="text-sm font-medium text-gray-900">УК</p>
              <p className="text-xs text-gray-600">Первичная обработка обращений становится структурированной и автоматизированной.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">🔧</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Мастер</p>
              <p className="text-xs text-gray-600">Получает уже классифицированную задачу, а не сырое сообщение из домового чата.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">🌐</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Система в целом</p>
              <p className="text-xs text-gray-600">Сокращается путь от обнаружения проблемы до исполнителя.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Limitations */}
      <div className="bg-white rounded-xl border p-5 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Ограничения MVP
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-start gap-2">
            <span className="text-orange-400 mt-0.5">•</span>
            <span>Ограниченный набор классов (8 категорий, 24 подкатегории)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-400 mt-0.5">•</span>
            <span>Тестовые данные — синтетические дома и мастера</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-400 mt-0.5">•</span>
            <span>Ограниченный пул мастеров (7 человек)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-400 mt-0.5">•</span>
            <span>Нет интеграции с УК/ГИС ЖКХ</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-400 mt-0.5">•</span>
            <span>AI-priority — предварительный, не нормативный</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-400 mt-0.5">•</span>
            <span>Возможные ошибки CV-модуля</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-400 mt-0.5">•</span>
            <span>Необходимость подтверждения пользователем</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-400 mt-0.5">•</span>
            <span>Необходимость расширения taxonomy</span>
          </div>
        </div>
      </div>
      
      {/* Roadmap */}
      <div className="bg-white rounded-xl border p-5 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          Roadmap масштабирования
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-blue-700">1</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Пилот: 1 УК + 3-5 домов</p>
              <p className="text-xs text-gray-500">Ограниченный набор категорий, ручная валидация AI</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-indigo-700">2</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Район: несколько УК</p>
              <p className="text-xs text-gray-500">Расширенная taxonomy, интеграция с диспетчерской</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-purple-700">3</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Муниципалитет / регион</p>
              <p className="text-xs text-gray-500">Региональные правила, интеграция с ГИС ЖКХ</p>
            </div>
          </div>
        </div>
        <div className="mt-4 bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
          <p className="font-medium text-gray-800 mb-1">Ядро (не меняется):</p>
          <p>Сценарий • AI pipeline • Taxonomy engine • Fusion • Routing • Интерфейс • Модель заявки • Статусы</p>
          <p className="font-medium text-gray-800 mb-1 mt-2">Переменная часть:</p>
          <p>Категории • Справочники • Данные домов • Исполнители • УК • Региональные правила • Интеграции</p>
        </div>
      </div>
      
      {/* Demo scenarios */}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          Демо-сценарии
        </h3>
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-green-800 mb-1">✅ Сценарий 1: Протечка</p>
            <p className="text-xs text-green-700">
              «В подвале течёт труба» → AI: протечка 94% → уточнение → заявка → мастер берёт → выполнено
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-yellow-800 mb-1">🐱 Сценарий 2: Кот</p>
            <p className="text-xs text-yellow-700">
              Фото кота → NOT_INCIDENT → «Не вижу проблему на фото» → заявка НЕ создаётся
            </p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-orange-800 mb-1">❓ Сценарий 3: Неизвестное</p>
            <p className="text-xs text-orange-700">
              Неизвестное повреждение → OTHER_INCIDENT → «Проблема есть, но тип не определён»
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
