# 🤖 Аварийный диспетчер МКД — Бот для MAX

Чат-бот для мессенджера MAX, который автоматически обрабатывает обращения жителей о проблемах в доме.

## 🚀 Быстрый запуск

### 1. Установите зависимости

```bash
cd bot
npm install
```

### 2. Создайте файл `.env`

```bash
cp .env.example .env
```

Откройте `.env` и вставьте ваш токен:

```env
MAX_BOT_TOKEN=ваш_токен_от_MasterBot
```

### 3. Запустите бота

```bash
npm run dev
```

Вы увидите:
```
🤖 Аварийный диспетчер МКД запускается...
📡 Режим: Long Polling

✅ Бот запущен и готов принимать сообщения!
   Нажмите Ctrl+C для остановки
```

### 4. Проверьте в MAX

Найдите вашего бота в MAX и отправьте:
- `В подвале течёт труба`
- `Не работает свет на лестнице`
- `Во дворе упало дерево`

## 📋 Команды бота

- `/start` — начать заново
- `/help` — помощь
- `/status` — статус ваших заявок
- `/categories` — список категорий

## 🧪 Примеры сценариев

### Сценарий 1: Протечка (текст)
```
Вы: В подвале течёт труба, уже вся вода на полу
Бот: ⏳ Анализирую ваше обращение...
Бот: Вода продолжает поступать прямо сейчас?
Вы: Да, вода идёт
Бот: ✅ Мы поняли проблему так:
     📋 Категория: Водоснабжение
     📍 Подкатегория: Протечка трубы
     ⚡ Срочность: Высокий
     🎯 Уверенность AI: 87%
     👷 Исполнитель: Сантехник
     
     Напишите "подтвердить" чтобы отправить заявку.
Вы: подтвердить
Бот: ✅ Заявка #INC-001 создана!
```

### Сценарий 2: Нерелевантный контент
```
Вы: [фото кота]
Бот: 🔍 На изображении не удалось обнаружить проблему...
```

### Сценарий 3: Неизвестная проблема
```
Вы: Что-то странное с трубой
Бот: 🔍 Похоже, проблема связана с домом, но её тип не удалось определить.
     Пожалуйста, опишите подробнее, что произошло?
```

## 🏗 Архитектура

```
bot/
├── src/
│   ├── index.ts          # Главный файл бота
│   ├── ai/
│   │   └── classifier.ts # AI-классификация (rule-based)
│   ├── data/
│   │   └── taxonomy.ts   # Категории и подкатегории
│   └── store/
│       └── incidents.ts  # Хранилище заявок
├── .env                  # Токен (создать вручную)
├── .env.example          # Шаблон
├── package.json
└── tsconfig.json
```

## 🔧 Как это работает

1. **Пользователь отправляет сообщение** (текст или фото)
2. **Бот получает событие** через Long Polling
3. **AI-классификатор анализирует** текст/фото:
   - Определяет категорию (водоснабжение, электричество и т.д.)
   - Определяет подкатегорию (протечка, нет света и т.д.)
   - Оценивает срочность (LOW/MEDIUM/HIGH/CRITICAL)
   - Вычисляет уверенность (0-100%)
4. **Если нужны уточнения** — бот задаёт вопросы
5. **Показывает карточку заявки** пользователю
6. **Пользователь подтверждает** — заявка создаётся
7. **Заявка доступна мастерам** (в реальном проекте — через мини-приложение)

## 🎯 Что дальше?

### Заменить rule-based на реальные AI-модели

В `src/ai/classifier.ts` замените функцию `analyzeInput` на вызов YandexGPT:

```typescript
import { analyzeWithYandexGPT } from './yandex-gpt.js';

export async function analyzeInput(input: AnalysisInput): Promise<AnalysisResult> {
  // Используйте YandexGPT для классификации
  return await analyzeWithYandexGPT(input);
}
```

Пример промпта для YandexGPT:
```
Ты — классификатор обращений жителей МКД.
Проанализируй текст и верни JSON:
{
  "classificationResult": "KNOWN_INCIDENT" | "OTHER_INCIDENT" | "NOT_INCIDENT",
  "category": string | null,
  "subcategory": string | null,
  "confidence": number (0-1),
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
}

Категории: WATER_SUPPLY, ELECTRICITY, CLEANING, YARD, DOOR, ELEVATOR
```

### Подключить базу данных

Замените `IncidentStore` на PostgreSQL:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export class IncidentStore {
  async create(incident: Incident): Promise<void> {
    await pool.query(
      'INSERT INTO incidents (id, user_id, category, ...) VALUES ($1, $2, $3, ...)',
      [incident.id, incident.userId, incident.category, ...]
    );
  }
}
```

### Добавить мини-приложение для мастеров

1. Создайте React-приложение (используйте наш прототип из `src/components/MasterDashboard.tsx`)
2. Разместите на HTTPS-хостинге
3. В кабинете бота укажите URL мини-приложения
4. Добавьте кнопку в бот:

```typescript
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
```

## 🔗 Полезные ссылки

- [Документация MAX](https://dev.max.ru/)
- [SDK для TypeScript](https://github.com/max-messenger/max-bot-api-client-ts)
- [Примеры ботов](https://dev.max.ru/docs/chatbots/bots-coding/examples)
- [API ботов](https://dev.max.ru/docs-api)

## 📝 Лицензия

MIT

---

**Для хакатона:** Этот бот демонстрирует полный сценарий обработки обращений жителей МКД через MAX с автоматической классификацией и маршрутизацией.
