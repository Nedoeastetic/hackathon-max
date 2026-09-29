import 'dotenv/config';
import { Bot } from '@maxhub/max-bot-api';
import { analyzeInput, AnalysisResult } from './ai/classifier.js';
import { categories, getCategoryById, getSubcategoryById, getWorkerTypeName, getSeverityLabel } from './data/taxonomy.js';
import { IncidentStore, Incident } from './store/incidents.js';

const TOKEN = process.env.MAX_BOT_TOKEN;

if (!TOKEN) {
  console.error('❌ MAX_BOT_TOKEN не задан. Создайте файл .env на основе .env.example');
  process.exit(1);
}

const bot = new Bot(TOKEN);
const store = new IncidentStore();

// Сессии пользователей: храним состояние диалога
interface Session {
  step: 'idle' | 'awaiting_clarification' | 'awaiting_confirmation';
  pendingText?: string;
  pendingImageType?: string;
  analysis?: AnalysisResult;
  answers: Record<string, string>;
  questionIndex: number;
  incidentId?: string;
}

const sessions = new Map<string, Session>();

function getSession(userId: string): Session {
  if (!sessions.has(userId)) {
    sessions.set(userId, { step: 'idle', answers: {}, questionIndex: 0 });
  }
  return sessions.get(userId)!;
}

// ====== Обработчики событий ======

bot.on('bot_started', async (ctx) => {
  await ctx.reply(
    '🏠 Добро пожаловать в Аварийный диспетчер!\n\n' +
    'Я помогу вам сообщить о проблеме в доме.\n\n' +
    'Что можно сделать:\n' +
    '• Отправить фото проблемы\n' +
    '• Описать проблему текстом\n' +
    '• Отправить и то, и другое\n\n' +
    'Просто напишите или пришлите фото — я разберусь сам!'
  );
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    '📋 Команды:\n' +
    '/start — начать заново\n' +
    '/help — помощь\n' +
    '/status — статус моих заявок\n' +
    '/categories — список категорий\n\n' +
    'Или просто опишите проблему / пришлите фото.'
  );
});

bot.command('start', async (ctx) => {
  const userId = String(ctx.message.sender.user_id);
  sessions.delete(userId);
  await ctx.reply(
    '🔄 Начинаем заново!\n\n' +
    'Опишите проблему или пришлите фото.'
  );
});

bot.command('status', async (ctx) => {
  const userId = String(ctx.message.sender.user_id);
  const userIncidents = store.getByUser(userId);
  
  if (userIncidents.length === 0) {
    await ctx.reply('У вас пока нет заявок.');
    return;
  }
  
  const lines = userIncidents.map(inc => {
    const cat = inc.category ? getCategoryById(inc.category) : null;
    return `${cat?.icon || '📋'} #${inc.id} — ${statusLabel(inc.status)}\n   ${inc.description.slice(0, 50)}`;
  });
  
  await ctx.reply('📋 Ваши заявки:\n\n' + lines.join('\n\n'));
});

bot.command('categories', async (ctx) => {
  const lines = categories.map(c => 
    `${c.icon} ${c.name} (${c.subcategories.length} подкатегорий)`
  );
  await ctx.reply('📂 Доступные категории:\n\n' + lines.join('\n'));
});

// Обработка входящих сообщений
bot.on('message_created', async (ctx) => {
  const userId = String(ctx.message.sender.user_id);
  const session = getSession(userId);
  const message = ctx.message;
  
  // Извлекаем текст и фото
  const text = message.body?.text?.trim() || '';
  const hasImage = message.attachments?.some((a: any) => a.type === 'image') || false;
  
  // Если пользователь отвечает на уточняющий вопрос
  if (session.step === 'awaiting_clarification' && session.analysis) {
    await handleClarification(ctx, userId, session, text);
    return;
  }
  
  // Если пользователь подтверждает заявку (кнопка)
  if (session.step === 'awaiting_confirmation' && text.toLowerCase().includes('подтвер')) {
    await confirmIncident(ctx, userId, session);
    return;
  }
  
  // Если пользователь отменяет
  if (session.step === 'awaiting_confirmation' && text.toLowerCase().includes('отмен')) {
    sessions.delete(userId);
    await ctx.reply('❌ Заявка отменена. Опишите проблему иначе, если хотите попробовать снова.');
    return;
  }
  
  // Новый запрос
  if (!text && !hasImage) {
    await ctx.reply('Пожалуйста, отправьте текст или фото проблемы.');
    return;
  }
  
  // Показываем индикатор анализа
  await ctx.reply('⏳ Анализирую ваше обращение...');
  
  // Определяем режим ввода
  const mode = hasImage && text ? 'TEXT_AND_IMAGE' : hasImage ? 'IMAGE_ONLY' : 'TEXT_ONLY';
  
  // Запускаем анализ
  const result = await analyzeInput({
    text: text || undefined,
    imageDescription: hasImage ? 'изображение' : undefined,
    mode
  });
  
  // Обрабатываем результат
  await handleAnalysisResult(ctx, userId, session, result, text, hasImage);
});

// ====== Обработка результата анализа ======

async function handleAnalysisResult(
  ctx: any,
  userId: string,
  session: Session,
  result: AnalysisResult,
  text: string,
  hasImage: boolean
) {
  // NOT_INCIDENT
  if (result.classificationResult === 'NOT_INCIDENT') {
    await ctx.reply(
      '🔍 На изображении / в тексте не удалось обнаружить проблему, связанную с содержанием дома.\n\n' +
      'Попробуйте отправить фотографию повреждения или кратко опишите проблему.'
    );
    return;
  }
  
  // OTHER_INCIDENT
  if (result.classificationResult === 'OTHER_INCIDENT') {
    await ctx.reply(
      '🔍 Похоже, проблема связана с домом, но её тип пока не удалось определить.\n\n' +
      'Пожалуйста, опишите подробнее, что произошло?'
    );
    session.step = 'awaiting_clarification';
    session.analysis = result;
    session.pendingText = text;
    session.pendingImageType = hasImage ? 'unknown' : undefined;
    return;
  }
  
  // CONFLICT
  if (result.classificationResult === 'CONFLICT') {
    await ctx.reply(
      '⚠️ Мы заметили несоответствие между описанием и фотографией.\n' +
      'Уточните, пожалуйста, что именно произошло?'
    );
    session.step = 'awaiting_clarification';
    session.analysis = result;
    session.pendingText = text;
    return;
  }
  
  // KNOWN_INCIDENT или NEEDS_CLARIFICATION
  session.analysis = result;
  session.pendingText = text;
  session.pendingImageType = hasImage ? 'image' : undefined;
  
  if (result.recommendedQuestions.length > 0) {
    // Задаём первый вопрос
    session.step = 'awaiting_clarification';
    session.questionIndex = 0;
    await ctx.reply(result.recommendedQuestions[0].text);
  } else {
    // Сразу показываем карточку
    await showIncidentCard(ctx, userId, session, result);
  }
}

// ====== Обработка уточнений ======

async function handleClarification(
  ctx: any,
  userId: string,
  session: Session,
  answer: string
) {
  const analysis = session.analysis!;
  session.answers[analysis.recommendedQuestions[session.questionIndex]?.field || ''] = answer;
  session.questionIndex++;
  
  if (session.questionIndex < analysis.recommendedQuestions.length) {
    // Задаём следующий вопрос
    await ctx.reply(analysis.recommendedQuestions[session.questionIndex].text);
  } else {
    // Все вопросы заданы — показываем карточку
    await showIncidentCard(ctx, userId, session, analysis);
  }
}

// ====== Показ карточки заявки ======

async function showIncidentCard(ctx: any, userId: string, session: Session, result: AnalysisResult) {
  const category = result.category ? getCategoryById(result.category) : null;
  const subcategory = result.category && result.subcategory 
    ? getSubcategoryById(result.category, result.subcategory) 
    : null;
  
  const card = 
    `✅ Мы поняли проблему так:\n\n` +
    `📋 Категория: ${category?.name || 'Не определена'}\n` +
    `📍 Подкатегория: ${subcategory?.name || 'Не определена'}\n` +
    `⚡ Срочность: ${getSeverityLabel(result.severity)}\n` +
    `🎯 Уверенность AI: ${Math.round(result.confidence * 100)}%\n` +
    `👷 Исполнитель: ${getWorkerTypeName(result.recommendedWorkerType)}\n` +
    `📝 Описание: "${session.pendingText || 'По фотографии'}"\n\n` +
    `${result.severity === 'CRITICAL' ? '🚨 ВНИМАНИЕ: Критическая ситуация!\n\n' : ''}` +
    `Напишите "подтвердить" чтобы отправить заявку, или "отменить".`;
  
  await ctx.reply(card);
  session.step = 'awaiting_confirmation';
}

// ====== Подтверждение и создание заявки ======

async function confirmIncident(ctx: any, userId: string, session: Session) {
  const result = session.analysis!;
  const incidentId = `INC-${String(store.count() + 1).padStart(3, '0')}`;
  
  const incident: Incident = {
    id: incidentId,
    userId,
    userName: ctx.message.sender.name || 'Житель',
    category: result.category,
    subcategory: result.subcategory,
    description: session.pendingText || 'Описание по фото',
    severity: result.severity,
    confidence: result.confidence,
    status: 'AVAILABLE',
    recommendedWorkerType: result.recommendedWorkerType,
    createdAt: Date.now()
  };
  
  store.create(incident);
  session.incidentId = incidentId;
  
  await ctx.reply(
    `✅ Заявка #${incidentId} создана и отправлена исполнителям!\n\n` +
    `Ожидайте — свободный мастер возьмёт её в работу.\n` +
    `Используйте /status чтобы проверить статус.`
  );
  
  // Сбрасываем сессию
  session.step = 'idle';
  session.analysis = undefined;
  session.answers = {};
  session.questionIndex = 0;
}

// ====== Утилиты ======

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    NEW: '🆕 Новая',
    AVAILABLE: '📢 Доступна',
    ASSIGNED: '👷 Назначена',
    IN_PROGRESS: '🔧 В работе',
    RESOLVED: '✅ Выполнена',
    CANCELLED: '❌ Отменена'
  };
  return labels[status] || status;
}

// ====== Запуск ======

console.log('🤖 Аварийный диспетчер МКД запускается...');
console.log('📡 Режим: Long Polling');
console.log('');

bot.start().then(() => {
  console.log('✅ Бот запущен и готов принимать сообщения!');
  console.log('   Нажмите Ctrl+C для остановки');
}).catch(err => {
  console.error('❌ Ошибка запуска бота:', err);
  process.exit(1);
});

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error('Ошибка в обработчике:', err);
});
