// Устанавливаем переменную окружения ДО всех импортов для отключения SSL проверки
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import 'dotenv/config';
import { analyzeInput, AnalysisResult } from './ai/classifier.js';
import { checkHealth } from './ai/api-client.js';
import { categories, getCategoryById, getSubcategoryById, getWorkerTypeName, getSeverityLabel } from './data/taxonomy.js';
import { IncidentStore, Incident } from './store/incidents.js';

// Динамический импорт Bot после установки переменных окружения
const { Bot } = await import('@maxhub/max-bot-api');

const TOKEN = process.env.MAX_BOT_TOKEN;

if (!TOKEN) {
  console.error('❌ MAX_BOT_TOKEN не задан. Создайте файл .env на основе .env.example');
  process.exit(1);
}

// Проверка токена на кириллические символы
if (/[а-яА-Я]/.test(TOKEN)) {
  console.error('❌ Ошибка: токен содержит кириллические символы!');
  console.error('   Токен должен содержать только латинские буквы, цифры и специальные символы.');
  console.error('   Проверьте файл bot/.env и убедитесь, что токен вставлен правильно.');
  console.error('');
  console.error('   Пример правильного токена: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz');
  process.exit(1);
}

// Проверка на невидимые символы (пробелы, переносы строк)
if (TOKEN !== TOKEN.trim()) {
  console.error('❌ Ошибка: токен содержит лишние пробелы или переносы строк!');
  console.error('   Удалите пробелы в начале/конце токена в файле bot/.env');
  process.exit(1);
}

const bot = new Bot(TOKEN);
const store = new IncidentStore();

// Сессии пользователей
interface Session {
  step: 'idle' | 'awaiting_clarification' | 'awaiting_confirmation';
  pendingText?: string;
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

// Скачивание фото из MAX
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
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
  await ctx.reply('🔄 Начинаем заново!\n\nОпишите проблему или пришлите фото.');
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

bot.command('health', async (ctx) => {
  try {
    const health = await checkHealth();
    await ctx.reply(
      `✅ ML сервис работает!\n\n` +
      `CV модель: ${health.models.cv}\n` +
      `Text модель: ${health.models.text}`
    );
  } catch (error) {
    await ctx.reply('❌ ML сервис недоступен');
  }
});

// Обработка входящих сообщений
bot.on('message_created', async (ctx) => {
  const userId = String(ctx.message.sender.user_id);
  const session = getSession(userId);
  const message = ctx.message;
  
  // Извлекаем текст
  const text = message.body?.text?.trim() || '';
  
  // Проверяем наличие фото
  const imageAttachment = message.attachments?.find((a: any) => a.type === 'image' || a.type === 'photo');
  const hasImage = !!imageAttachment;
  
  // Если пользователь отвечает на уточняющий вопрос
  if (session.step === 'awaiting_clarification' && session.analysis) {
    await handleClarification(ctx, userId, session, text);
    return;
  }
  
  // Подтверждение заявки
  if (session.step === 'awaiting_confirmation') {
    if (text.toLowerCase().includes('подтвер') || text.toLowerCase() === 'да' || text.toLowerCase() === 'ок') {
      await confirmIncident(ctx, userId, session);
      return;
    }
    if (text.toLowerCase().includes('отмен') || text.toLowerCase() === 'нет') {
      sessions.delete(userId);
      await ctx.reply('❌ Заявка отменена. Опишите проблему иначе, если хотите попробовать снова.');
      return;
    }
  }
  
  // Новый запрос
  if (!text && !hasImage) {
    await ctx.reply('Пожалуйста, отправьте текст или фото проблемы.');
    return;
  }
  
  await ctx.reply('⏳ Анализирую ваше обращение...');
  
  // Определяем режим ввода
  const mode = hasImage && text ? 'TEXT_AND_IMAGE' : hasImage ? 'IMAGE_ONLY' : 'TEXT_ONLY';
  
  // Скачиваем фото если есть
  let imageBuffer: Buffer | undefined;
  let imageFilename = 'image.jpg';
  
  if (hasImage && imageAttachment) {
    try {
      // MAX API обычно возвращает URL в поле url или нужно получить через get_file
      const imageUrl = imageAttachment.url || imageAttachment.file?.url;
      if (imageUrl) {
        imageBuffer = await downloadImage(imageUrl);
        imageFilename = `image_${Date.now()}.jpg`;
        console.log(`📷 Скачано фото: ${imageBuffer.length} bytes`);
      }
    } catch (error) {
      console.error('❌ Не удалось скачать фото:', error);
      await ctx.reply('⚠️ Не удалось обработать фото. Попробуйте ещё раз или опишите проблему текстом.');
      return;
    }
  }
  
  // Запускаем анализ через ML API
  const result = await analyzeInput({
    text: text || undefined,
    imageBuffer,
    imageFilename,
    mode
  });
  
  // Обрабатываем результат
  await handleAnalysisResult(ctx, userId, session, result, text);
});

// ====== Обработка результата анализа ======

async function handleAnalysisResult(
  ctx: any,
  userId: string,
  session: Session,
  result: AnalysisResult,
  text: string
) {
  // NOT_INCIDENT
  if (result.classificationResult === 'NOT_INCIDENT') {
    await ctx.reply(
      '🔍 Не удалось обнаружить проблему, связанную с содержанием дома.\n\n' +
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
  
  if (result.recommendedQuestions.length > 0) {
    session.step = 'awaiting_clarification';
    session.questionIndex = 0;
    await ctx.reply(result.recommendedQuestions[0].text);
  } else {
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
    await ctx.reply(analysis.recommendedQuestions[session.questionIndex].text);
  } else {
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
    createdAt: Date.now(),
    fusionLevel: result.fusionLevel,
    fusionReason: result.fusionReason,
    needsReview: result.needsReview,
    modelVersions: result.modelVersions
  };
  
  store.create(incident);
  session.incidentId = incidentId;
  
  // Логируем fusion-информацию
  if (result.fusionLevel) {
    console.log(`🔗 Fusion [${result.fusionLevel}]: ${result.fusionReason}`);
    if (result.needsReview) {
      console.log(`⚠️ Заявка ${incidentId} требует ревью (fusion MEDIUM)`);
    }
  }
  
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

async function main() {
  console.log('🤖 Аварийный диспетчер МКД запускается...');
  
  // Проверяем ML API
  try {
    const health = await checkHealth();
    console.log('✅ ML сервис доступен');
    console.log(`   CV модель: ${health.models.cv}`);
    console.log(`   Text модель: ${health.models.text}`);
  } catch (error) {
    console.warn('⚠️ ML сервис недоступен, бот будет работать с fallback-логикой');
  }
  
  console.log('');
  console.log('📡 Режим: Long Polling');
  console.log('');
  
  await bot.start();
  console.log('✅ Бот запущен и готов принимать сообщения!');
  console.log('   Нажмите Ctrl+C для остановки');
}

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error('Ошибка в обработчике:', err);
});

main().catch(err => {
  console.error('❌ Критическая ошибка:', err);
  process.exit(1);
});
