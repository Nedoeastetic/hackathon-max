import { ExternalLink, Copy, CheckCircle, Code, Server, Bot, Smartphone, Database, Shield } from 'lucide-react';
import { useState } from 'react';

export function IntegrationGuide() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className="relative bg-gray-900 rounded-lg p-3 mt-2 group">
      <button
        onClick={() => copyCode(code, id)}
        className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-gray-300 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied === id ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
      </button>
      <pre className="text-xs text-green-300 overflow-x-auto font-mono whitespace-pre">{code}</pre>
    </div>
  );

  return (
    <div className="p-6 overflow-y-auto h-full bg-gray-50">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Интеграция с MAX</h2>
      <p className="text-sm text-gray-600 mb-6">Пошаговое руководство по адаптации прототипа под реального бота</p>

      {/* Step 1 */}
      <div className="bg-white rounded-xl border p-5 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
          <Bot className="w-5 h-5 text-blue-600" />
          Создать бота в MAX
        </h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>Вариант A — через Master Bot:</strong></p>
          <ol className="list-decimal list-inside text-xs space-y-1 ml-2">
            <li>Открыть в MAX диалог с <code className="bg-gray-100 px-1 rounded">@MasterBot</code></li>
            <li>Следовать инструкциям, создать бота</li>
            <li>Получить токен</li>
          </ol>
          <p className="mt-2"><strong>Вариант B — через кабинет:</strong></p>
          <ol className="list-decimal list-inside text-xs space-y-1 ml-2">
            <li><a href="https://business.max.ru" target="_blank" className="text-blue-600 underline">business.max.ru</a> → «Чат-боты» → «Создать»</li>
            <li>Заполнить карточку, пройти модерацию</li>
            <li>Получить токен</li>
          </ol>
          <p className="text-xs text-orange-600 mt-2">⚠️ Нужен верифицированный профиль (юрлицо / ИП / самозанятый)</p>
        </div>
      </div>

      {/* Step 2 */}
      <div className="bg-white rounded-xl border p-5 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
          <Server className="w-5 h-5 text-purple-600" />
          Установить SDK и создать сервер
        </h3>
        <CodeBlock
          id="install"
          code={`npm init -y
npm install @maxhub/max-bot-api express
npm install -D typescript @types/node tsx`}
        />
        <p className="text-xs text-gray-500 mt-2">
          Официальный SDK: <a href="https://github.com/max-messenger/max-bot-api-client-ts" target="_blank" className="text-blue-600 underline flex items-center gap-1 inline-flex">
            @maxhub/max-bot-api <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </div>

      {/* Step 3 */}
      <div className="bg-white rounded-xl border p-5 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</span>
          <Code className="w-5 h-5 text-green-600" />
          Базовый код бота
        </h3>
        <CodeBlock
          id="bot"
          code={`import { Bot } from '@maxhub/max-bot-api';

const bot = new Bot(process.env.MAX_BOT_TOKEN!);

// Приветствие
bot.on('bot_started', async (ctx) => {
  await ctx.reply(
    '🏠 Здравствуйте! Я — Аварийный диспетчер.\\n\\n' +
    'Отправьте фото или опишите проблему в доме.'
  );
});

// Обработка сообщений
bot.on('message_created', async (ctx) => {
  const msg = ctx.message;
  
  if (msg.attachments?.some(a => a.type === 'image')) {
    await handleImage(ctx);
  } else if (msg.body?.text) {
    await handleText(ctx, msg.body.text);
  }
});

bot.start();`}
        />
      </div>

      {/* Step 4 */}
      <div className="bg-white rounded-xl border p-5 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">4</span>
          <Database className="w-5 h-5 text-orange-600" />
          Подключить AI-классификацию
        </h3>
        <p className="text-xs text-gray-600 mb-2">Вместо симуляции — реальные модели:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-purple-800 mb-1">📝 Текст → YandexGPT / GigaChat</p>
            <p className="text-xs text-purple-700">Промпт с таксономией → JSON-ответ с категорией и confidence</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-green-800 mb-1">📷 Фото → Yandex Vision / YOLO</p>
            <p className="text-xs text-green-700">Классификация изображений → Class A/B/C</p>
          </div>
        </div>
        <CodeBlock
          id="ai"
          code={`// Пример с YandexGPT
async function classifyText(text: string) {
  const res = await fetch(
    'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
    {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${YANDEX_TOKEN}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        modelUri: \`gpt://\${FOLDER_ID}/yandexgpt-lite\`,
        messages: [
          { role: 'system', text: CLASSIFICATION_PROMPT },
          { role: 'user', text }
        ]
      })
    }
  );
  return parseResult(await res.json());
}`}
        />
      </div>

      {/* Step 5 */}
      <div className="bg-white rounded-xl border p-5 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">5</span>
          <Smartphone className="w-5 h-5 text-indigo-600" />
          Мини-приложение для мастера
        </h3>
        <p className="text-xs text-gray-600 mb-2">
          Наш React-интерфейс мастера разворачивается как мини-приложение:
        </p>
        <ol className="list-decimal list-inside text-xs text-gray-700 space-y-1">
          <li>Собрать React-приложение: <code className="bg-gray-100 px-1 rounded">npm run build</code></li>
          <li>Разместить на HTTPS-хостинге (Vercel, Netlify, свой сервер)</li>
          <li>В кабинете бота указать URL мини-приложения</li>
          <li>Добавить кнопку «Заявки» в бот → открывает мини-приложение</li>
        </ol>
        <CodeBlock
          id="miniapp"
          code={`// Кнопка в боте для открытия мини-приложения
bot.command('master', async (ctx) => {
  await ctx.reply('Откройте интерфейс мастера:', {
    keyboard: {
      inline_keyboard: [[{
        text: '📋 Открыть заявки',
        callback_data: 'open_master_app'
      }]]
    }
  });
});

// При нажатии — отправить ссылку на мини-приложение
bot.on('callback', async (ctx) => {
  if (ctx.callbackData === 'open_master_app') {
    await ctx.reply('Откройте мини-приложение:', {
      keyboard: {
        inline_keyboard: [[{
          text: 'Открыть',
          type: 'callback',
          callback_data: 'open_app'
        }]]
      }
    });
  }
});`}
        />
      </div>

      {/* Step 6 */}
      <div className="bg-white rounded-xl border p-5 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">6</span>
          <Shield className="w-5 h-5 text-red-600" />
          Что адаптировать из прототипа
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-gray-500">Компонент</th>
                <th className="text-left py-2 text-gray-500">Статус</th>
                <th className="text-left py-2 text-gray-500">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr><td className="py-2">Типы данных</td><td className="py-2"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">✅</span></td><td className="py-2">Использовать как есть</td></tr>
              <tr><td className="py-2">Таксономия</td><td className="py-2"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">✅</span></td><td className="py-2">Использовать как есть</td></tr>
              <tr><td className="py-2">AI-движок</td><td className="py-2"><span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">⚠️</span></td><td className="py-2">Заменить на реальные модели</td></tr>
              <tr><td className="py-2">Mock-данные</td><td className="py-2"><span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">⚠️</span></td><td className="py-2">Подключить PostgreSQL</td></tr>
              <tr><td className="py-2">Чат жителя</td><td className="py-2"><span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded">🔄</span></td><td className="py-2">→ Обработчики бота</td></tr>
              <tr><td className="py-2">Интерфейс мастера</td><td className="py-2"><span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded">🔄</span></td><td className="py-2">→ Мини-приложение</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-xl border p-5 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3">✅ Чек-лист для хакатона</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            'Верифицированный профиль в MAX',
            'Бот создан, токен получен',
            'Webhook настроен',
            'Backend принимает сообщения',
            'Бот отвечает на текст',
            'Бот отвечает на фото',
            'AI-классификация работает',
            'Бот задаёт уточняющие вопросы',
            'Бот показывает карточку заявки',
            'Заявка создаётся в БД',
            'Мини-приложение открывается',
            'Мастер видит заявки',
            'Мастер берёт заявку',
            'Житель получает уведомление'
          ].map((item, idx) => (
            <label key={idx} className="flex items-center gap-2 text-xs text-gray-700">
              <input type="checkbox" className="rounded border-gray-300" />
              {item}
            </label>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">🔗 Полезные ссылки</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {[
            { label: 'Документация MAX', url: 'https://dev.max.ru/' },
            { label: 'API ботов', url: 'https://dev.max.ru/docs-api' },
            { label: 'Создание бота', url: 'https://dev.max.ru/docs/chatbots/bots-create' },
            { label: 'SDK TypeScript', url: 'https://github.com/max-messenger/max-bot-api-client-ts' },
            { label: 'Примеры ботов', url: 'https://dev.max.ru/docs/chatbots/bots-coding/examples' },
            { label: 'OpenAPI схема', url: 'https://github.com/max-messenger/api-schema' },
            { label: 'Конструктор без кода', url: 'https://dev.max.ru/docs/chatbots/bots-nocode' },
            { label: 'Master Bot', url: 'https://max.ru/masterbot' }
          ].map(link => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              className="flex items-center gap-2 bg-white rounded-lg p-2 hover:shadow-sm transition-shadow border"
            >
              <ExternalLink className="w-3 h-3 text-blue-600 shrink-0" />
              <span className="text-gray-700">{link.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
