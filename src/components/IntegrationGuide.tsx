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
    <div className="relative rounded-xl p-3 mt-2 group" style={{ background: '#1E293B' }}>
      <button
        onClick={() => copyCode(code, id)}
        className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'rgba(255,255,255,0.1)' }}
      >
        {copied === id ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
      </button>
      <pre className="text-xs text-green-300 overflow-x-auto font-mono whitespace-pre">{code}</pre>
    </div>
  );

  return (
    <div className="p-4 overflow-y-auto h-full space-y-3" style={{ background: 'var(--max-surface)' }}>
      <div className="max-card p-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--max-text-primary)' }}>Интеграция с MAX</h2>
        <p className="text-xs mt-1" style={{ color: 'var(--max-text-secondary)' }}>
          Пошаговое руководство по адаптации под реального бота
        </p>
      </div>

      {/* Step 1 */}
      <div className="max-card p-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm mb-3" style={{ color: 'var(--max-text-primary)' }}>
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--max-primary)', color: 'white' }}>1</span>
          <Bot className="w-4 h-4" style={{ color: 'var(--max-primary)' }} />
          Создать бота в MAX
        </h3>
        <div className="text-xs space-y-2" style={{ color: 'var(--max-text-secondary)' }}>
          <p><strong style={{ color: 'var(--max-text-primary)' }}>Вариант A — через Master Bot:</strong></p>
          <ol className="list-decimal list-inside ml-2 space-y-0.5">
            <li>Открыть в MAX диалог с <code className="px-1 rounded" style={{ background: 'var(--max-surface)' }}>@MasterBot</code></li>
            <li>Следовать инструкциям, создать бота</li>
            <li>Получить токен</li>
          </ol>
          <p className="mt-2"><strong style={{ color: 'var(--max-text-primary)' }}>Вариант B — через кабинет:</strong></p>
          <ol className="list-decimal list-inside ml-2 space-y-0.5">
            <li><a href="https://business.max.ru" target="_blank" className="underline" style={{ color: 'var(--max-primary)' }}>business.max.ru</a> → «Чат-боты» → «Создать»</li>
            <li>Заполнить карточку, пройти модерацию</li>
          </ol>
          <p className="mt-2 text-[11px]" style={{ color: 'var(--max-warning)' }}>⚠️ Нужен верифицированный профиль (юрлицо / ИП / самозанятый)</p>
        </div>
      </div>

      {/* Step 2 */}
      <div className="max-card p-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm mb-3" style={{ color: 'var(--max-text-primary)' }}>
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--max-primary)', color: 'white' }}>2</span>
          <Server className="w-4 h-4" style={{ color: 'var(--max-primary)' }} />
          Установить SDK
        </h3>
        <CodeBlock
          id="install"
          code={`npm install @maxhub/max-bot-api express`}
        />
        <p className="text-[11px] mt-2" style={{ color: 'var(--max-text-secondary)' }}>
          SDK:{' '}
          <a href="https://github.com/max-messenger/max-bot-api-client-ts" target="_blank" className="underline inline-flex items-center gap-0.5" style={{ color: 'var(--max-primary)' }}>
            @maxhub/max-bot-api <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </p>
      </div>

      {/* Step 3 */}
      <div className="max-card p-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm mb-3" style={{ color: 'var(--max-text-primary)' }}>
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--max-primary)', color: 'white' }}>3</span>
          <Code className="w-4 h-4" style={{ color: 'var(--max-primary)' }} />
          Базовый код бота
        </h3>
        <CodeBlock
          id="bot"
          code={`import { Bot } from '@maxhub/max-bot-api';

const bot = new Bot(process.env.MAX_BOT_TOKEN!);

bot.on('bot_started', async (ctx) => {
  await ctx.reply('🏠 Здравствуйте! Я — Аварийный диспетчер.');
});

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
      <div className="max-card p-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm mb-3" style={{ color: 'var(--max-text-primary)' }}>
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--max-primary)', color: 'white' }}>4</span>
          <Database className="w-4 h-4" style={{ color: 'var(--max-primary)' }} />
          Подключить AI
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          <div className="p-2.5 rounded-xl" style={{ background: '#F0E6FF', border: '1px solid #D4B8FF' }}>
            <p className="text-[11px] font-semibold" style={{ color: '#5B21B6' }}>📝 Текст → YandexGPT</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#6D28D9' }}>Промпт с таксономией → JSON</p>
          </div>
          <div className="p-2.5 rounded-xl" style={{ background: '#E6F9E6', border: '1px solid #B8E8B8' }}>
            <p className="text-[11px] font-semibold" style={{ color: '#166534' }}>📷 Фото → YOLO</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#15803D' }}>Class A/B/C + severity</p>
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
        'Authorization': \`Bearer \${TOKEN}\`,
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
      <div className="max-card p-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm mb-3" style={{ color: 'var(--max-text-primary)' }}>
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--max-primary)', color: 'white' }}>5</span>
          <Smartphone className="w-4 h-4" style={{ color: 'var(--max-primary)' }} />
          Мини-приложение для мастера
        </h3>
        <ol className="list-decimal list-inside text-xs space-y-1" style={{ color: 'var(--max-text-secondary)' }}>
          <li>Собрать React: <code className="px-1 rounded" style={{ background: 'var(--max-surface)' }}>npm run build</code></li>
          <li>Разместить на HTTPS-хостинге</li>
          <li>В кабинете бота указать URL</li>
          <li>Добавить кнопку «Заявки» в бот</li>
        </ol>
      </div>

      {/* Checklist */}
      <div className="max-card p-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm mb-3" style={{ color: 'var(--max-text-primary)' }}>
          <Shield className="w-4 h-4" style={{ color: 'var(--max-primary)' }} />
          Чек-лист для хакатона
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {[
            'Верифицированный профиль',
            'Бот создан, токен получен',
            'Webhook настроен',
            'Backend принимает сообщения',
            'Бот отвечает на текст',
            'Бот отвечает на фото',
            'AI-классификация работает',
            'Бот задаёт уточнения',
            'Карточка заявки',
            'Заявка в БД',
            'Мини-приложение открывается',
            'Мастер видит заявки',
            'Мастер берёт заявку',
            'Уведомление жителю'
          ].map((item, idx) => (
            <label key={idx} className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" className="rounded" style={{ accentColor: 'var(--max-primary)' }} />
              <span style={{ color: 'var(--max-text-secondary)' }}>{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="max-card p-4">
        <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--max-text-primary)' }}>🔗 Полезные ссылки</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {[
            { label: 'Документация MAX', url: 'https://dev.max.ru/' },
            { label: 'API ботов', url: 'https://dev.max.ru/docs-api' },
            { label: 'Создание бота', url: 'https://dev.max.ru/docs/chatbots/bots-create' },
            { label: 'SDK TypeScript', url: 'https://github.com/max-messenger/max-bot-api-client-ts' },
            { label: 'Примеры', url: 'https://dev.max.ru/docs/chatbots/bots-coding/examples' },
            { label: 'OpenAPI', url: 'https://github.com/max-messenger/api-schema' },
            { label: 'Без кода', url: 'https://dev.max.ru/docs/chatbots/bots-nocode' },
            { label: 'Master Bot', url: 'https://max.ru/masterbot' }
          ].map(link => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              className="flex items-center gap-2 p-2 rounded-xl transition-all"
              style={{ background: 'var(--max-surface)', border: '1px solid var(--max-border)' }}
            >
              <ExternalLink className="w-3 h-3 shrink-0" style={{ color: 'var(--max-primary)' }} />
              <span className="text-xs" style={{ color: 'var(--max-text-primary)' }}>{link.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
