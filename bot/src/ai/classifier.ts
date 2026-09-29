// AI-классификатор v2.1: интеграция с ML API + fusion по top3
import { 
  analyzeText, 
  analyzeImage, 
  VisionAnalysisResult, 
  TextAnalysisResult 
} from './api-client.js';

export interface AnalysisInput {
  text?: string;
  imageBuffer?: Buffer;
  imageFilename?: string;
  mode: 'TEXT_ONLY' | 'IMAGE_ONLY' | 'TEXT_AND_IMAGE';
}

export interface ClarificationQuestion {
  id: string;
  text: string;
  field: string;
  options?: string[];
}

export interface AnalysisResult {
  classificationResult: 'KNOWN_INCIDENT' | 'NEEDS_CLARIFICATION' | 'NOT_INCIDENT';
  category: string | null;
  subcategory: string | null;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  recommendedWorkerType: string;
  recommendedQuestions: ClarificationQuestion[];
  urgencySignals: string[];
  fusionLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  fusionReason?: string;
  needsReview?: boolean;
  modelVersions?: { cv?: string; text?: string };
}

// Маппинг категорий на типы исполнителей
const WORKER_MAPPING: Record<string, string> = {
  WATER_SUPPLY: 'PLUMBER',
  ELECTRICITY: 'ELECTRICIAN',
  HEATING: 'PLUMBER',
  CLEANING: 'CLEANER',
  YARD: 'LANDSCAPER',
  DOOR: 'LOCKSMITH',
  ELEVATOR: 'UNIVERSAL',
  ROOF: 'MAINTENANCE'
};

// Safety-сигналы для повышения приоритета
const SAFETY_SIGNALS = ['газ', 'пожар', 'дым', 'огонь', 'обрушен', 'угроз', 'провод', 'электрич'];

// Маппинг CV-классов на категории
const CV_CLASS_TO_CATEGORY: Record<string, string> = {
  water_supply: 'WATER_SUPPLY',
  heating: 'HEATING',
  electricity: 'ELECTRICITY',
  cleaning: 'CLEANING',
  yard: 'YARD',
  door: 'DOOR',
  elevator: 'ELEVATOR',
  roof: 'ROOF',
  not_incident: 'NOT_INCIDENT'
};

// Локальная классификация на основе ключевых слов (fallback)
const LOCAL_KEYWORDS: Record<string, { words: string[]; subcategory: string; category: string }> = {
  WATER_SUPPLY: [
    { words: ['теч', 'протечк', 'труб', 'вода', 'луж', 'затопл', 'капает'], subcategory: 'PIPE_LEAK', category: 'WATER_SUPPLY' },
    { words: ['нет воды', 'вода не идёт'], subcategory: 'NO_WATER', category: 'WATER_SUPPLY' }
  ],
  ELECTRICITY: [
    { words: ['нет света', 'не горит', 'свет не работа', 'лампочк', 'электричеств'], subcategory: 'NO_LIGHT_STAIRWELL', category: 'ELECTRICITY' },
    { words: ['провод', 'оголён', 'искр'], subcategory: 'EXPOSED_WIRES', category: 'ELECTRICITY' }
  ],
  ELEVATOR: [
    { words: ['лифт не работа', 'лифт сломал', 'лифт не едет'], subcategory: 'ELEVATOR_NOT_WORKING', category: 'ELEVATOR' }
  ],
  CLEANING: [
    { words: ['грязно', 'уборк', 'мусор'], subcategory: 'DIRTY_STAIRWELL', category: 'CLEANING' }
  ],
  YARD: [
    { words: ['дерево упал', 'упавш дерев'], subcategory: 'FALLEN_TREE', category: 'YARD' }
  ],
  DOOR: [
    { words: ['дверь сломан', 'дверь не закрыв'], subcategory: 'BROKEN_ENTRY_DOOR', category: 'DOOR' }
  ]
};

function localClassify(text: string): { category: string; subcategory: string; confidence: number } | null {
  const lowerText = text.toLowerCase();
  
  for (const [categoryId, items] of Object.entries(LOCAL_KEYWORDS)) {
    for (const item of items) {
      for (const word of item.words) {
        if (lowerText.includes(word)) {
          return {
            category: item.category,
            subcategory: item.subcategory,
            confidence: 0.75
          };
        }
      }
    }
  }
  
  return null;
}

export async function analyzeInput(input: AnalysisInput): Promise<AnalysisResult> {
  try {
    let textResult: TextAnalysisResult | null = null;
    let visionResult: VisionAnalysisResult | null = null;

    // Анализ текста
    if (input.text && (input.mode === 'TEXT_ONLY' || input.mode === 'TEXT_AND_IMAGE')) {
      console.log(`📤 Отправляем в ML API: "${input.text}"`);
      textResult = await analyzeText(input.text);
      
      // Если ML API вернул NOT_INCIDENT с высокой уверенностью, но текст содержит ключевые слова
      // используем локальную классификацию как fallback
      if (textResult.confidence > 0.9 && !textResult.category) {
        const localResult = localClassify(input.text);
        if (localResult) {
          console.log(`🔄 ML API вернул NOT_INCIDENT, но локальная классификация нашла: ${localResult.category}/${localResult.subcategory}`);
          textResult = {
            category: localResult.category,
            subcategory: localResult.subcategory,
            confidence: localResult.confidence,
            top3: [{ category: localResult.category, subcategory: localResult.subcategory, confidence: localResult.confidence }],
            modelVersion: 'local-fallback'
          };
        }
      }
    }

    // Анализ изображения
    if (input.imageBuffer && input.imageFilename && (input.mode === 'IMAGE_ONLY' || input.mode === 'TEXT_AND_IMAGE')) {
      visionResult = await analyzeImage(input.imageBuffer, input.imageFilename);
    }

    // Fusion: объединение результатов
    return fuseResults(textResult, visionResult, input.text || '');
  } catch (error) {
    console.error('❌ Analysis error:', error);
    
    // Fallback на локальную классификацию если API недоступен
    if (input.text) {
      const localResult = localClassify(input.text);
      if (localResult) {
        console.log(`⚠️ API недоступен, используем локальную классификацию: ${localResult.category}/${localResult.subcategory}`);
        return {
          classificationResult: 'KNOWN_INCIDENT',
          category: localResult.category,
          subcategory: localResult.subcategory,
          severity: 'MEDIUM',
          confidence: localResult.confidence,
          recommendedWorkerType: WORKER_MAPPING[localResult.category] || 'DISPATCHER',
          recommendedQuestions: [],
          urgencySignals: [],
          fusionLevel: 'LOW',
          fusionReason: 'Локальная классификация (API недоступен)'
        };
      }
    }
    
    return {
      classificationResult: 'NOT_INCIDENT',
      category: null,
      subcategory: null,
      severity: 'LOW',
      confidence: 0,
      recommendedWorkerType: 'DISPATCHER',
      recommendedQuestions: [],
      urgencySignals: []
    };
  }
}

/**
 * Fusion engine по документации API v2.1
 * 
 * Правила (по убыванию уверенности):
 * HIGH:   category фото == category текста -> создаём заявку сразу
 * MEDIUM: category текста встречается в top3 фото (или наоборот) -> заявка + needs_review
 * LOW:    пересечений нет -> уточняющие вопросы жителю
 */
function fuseResults(
  textResult: TextAnalysisResult | null,
  visionResult: VisionAnalysisResult | null,
  originalText: string
): AnalysisResult {
  const urgencySignals: string[] = [];
  const questions: ClarificationQuestion[] = [];

  // Проверка safety-сигналов в тексте
  for (const signal of SAFETY_SIGNALS) {
    if (originalText.toLowerCase().includes(signal)) {
      urgencySignals.push(signal);
    }
  }

  // ===== MODE 1: TEXT ONLY =====
  if (textResult && !visionResult) {
    return handleTextOnly(textResult, originalText, urgencySignals);
  }

  // ===== MODE 2: IMAGE ONLY =====
  if (visionResult && !textResult) {
    return handleImageOnly(visionResult, urgencySignals);
  }

  // ===== MODE 3: TEXT + IMAGE =====
  if (textResult && visionResult) {
    return handleTextAndImage(textResult, visionResult, originalText, urgencySignals);
  }

  // Fallback: ничего не получено
  return {
    classificationResult: 'NOT_INCIDENT',
    category: null,
    subcategory: null,
    severity: 'LOW',
    confidence: 0,
    recommendedWorkerType: 'DISPATCHER',
    recommendedQuestions: [],
    urgencySignals
  };
}

// ====== Обработка TEXT ONLY ======
function handleTextOnly(
  textResult: TextAnalysisResult,
  originalText: string,
  urgencySignals: string[]
): AnalysisResult {
  const questions: ClarificationQuestion[] = [];

  // Если категория не определена (NOT_INCIDENT)
  if (!textResult.category || textResult.confidence < 0.3) {
    return {
      classificationResult: 'NOT_INCIDENT',
      category: null,
      subcategory: null,
      severity: 'LOW',
      confidence: textResult.confidence,
      recommendedWorkerType: 'DISPATCHER',
      recommendedQuestions: [],
      urgencySignals,
      modelVersions: { text: textResult.modelVersion }
    };
  }

  const severity = urgencySignals.length > 0 ? 'CRITICAL' : 'MEDIUM';
  
  // Добавляем вопросы для уточнения локации
  if (!originalText.includes('подвал') && !originalText.includes('подъезд') && !originalText.includes('квартир')) {
    questions.push({
      id: 'q-location',
      text: 'Где именно находится проблема? (подъезд, этаж, место)',
      field: 'location'
    });
  }

  return {
    classificationResult: questions.length > 0 ? 'NEEDS_CLARIFICATION' : 'KNOWN_INCIDENT',
    category: textResult.category,
    subcategory: textResult.subcategory,
    severity,
    confidence: textResult.confidence,
    recommendedWorkerType: WORKER_MAPPING[textResult.category] || 'DISPATCHER',
    recommendedQuestions: questions,
    urgencySignals,
    fusionLevel: 'HIGH',
    fusionReason: 'Только текст, уверенность высокая',
    modelVersions: { text: textResult.modelVersion }
  };
}

// ====== Обработка IMAGE ONLY ======
function handleImageOnly(
  visionResult: VisionAnalysisResult,
  urgencySignals: string[]
): AnalysisResult {
  const questions: ClarificationQuestion[] = [];

  // NOT_INCIDENT
  if (visionResult.classificationResult === 'NOT_INCIDENT') {
    return {
      classificationResult: 'NOT_INCIDENT',
      category: null,
      subcategory: null,
      severity: 'LOW',
      confidence: visionResult.confidence,
      recommendedWorkerType: 'DISPATCHER',
      recommendedQuestions: [],
      urgencySignals,
      modelVersions: { cv: visionResult.modelVersion }
    };
  }

  // NEEDS_CLARIFICATION (в top3 несколько кандидатов)
  if (visionResult.classificationResult === 'NEEDS_CLARIFICATION') {
    questions.push({
      id: 'q-desc',
      text: 'Опишите подробнее, что произошло?',
      field: 'description'
    });

    return {
      classificationResult: 'NEEDS_CLARIFICATION',
      category: visionResult.category,
      subcategory: null,
      severity: visionResult.visualSeverity || 'MEDIUM',
      confidence: visionResult.confidence,
      recommendedWorkerType: visionResult.category ? (WORKER_MAPPING[visionResult.category] || 'DISPATCHER') : 'DISPATCHER',
      recommendedQuestions: questions,
      urgencySignals,
      fusionLevel: 'LOW',
      fusionReason: 'Только фото, несколько кандидатов в top3',
      modelVersions: { cv: visionResult.modelVersion }
    };
  }

  // KNOWN_INCIDENT
  questions.push({
    id: 'q-desc',
    text: 'Опишите подробнее, что произошло?',
    field: 'description'
  });

  return {
    classificationResult: 'NEEDS_CLARIFICATION',
    category: visionResult.category,
    subcategory: null,
    severity: visionResult.visualSeverity || 'MEDIUM',
    confidence: visionResult.confidence,
    recommendedWorkerType: visionResult.category ? (WORKER_MAPPING[visionResult.category] || 'DISPATCHER') : 'DISPATCHER',
    recommendedQuestions: questions,
    urgencySignals,
    fusionLevel: 'MEDIUM',
    fusionReason: 'Только фото, нужна текстовая информация',
    modelVersions: { cv: visionResult.modelVersion }
  };
}

// ====== Обработка TEXT + IMAGE (Fusion по top3) ======
function handleTextAndImage(
  textResult: TextAnalysisResult,
  visionResult: VisionAnalysisResult,
  originalText: string,
  urgencySignals: string[]
): AnalysisResult {
  const questions: ClarificationQuestion[] = [];

  // Извлекаем категории из top3
  const cvCat = visionResult.category;
  const txCat = textResult.category;
  const cvCats = visionResult.top3?.map(x => x.category).filter(c => c !== null) || [];
  const txCats = textResult.top3?.map(x => x.category).filter(c => c !== null) || [];

  let finalCategory: string | null = null;
  let fusionLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  let fusionReason = '';
  let needsReview = false;

  // Правило 1: HIGH — category фото == category текста
  if (cvCat && txCat && cvCat === txCat) {
    finalCategory = txCat;
    fusionLevel = 'HIGH';
    fusionReason = 'CV и текст согласны (top-1)';
  }
  // Правило 2: MEDIUM — category текста встречается в top3 фото
  else if (txCat && cvCats.includes(txCat)) {
    finalCategory = txCat;
    fusionLevel = 'MEDIUM';
    fusionReason = 'Категория текста в top3 фото';
    needsReview = true;
  }
  // Правило 3: MEDIUM — category фото встречается в top3 текста
  else if (cvCat && txCats.includes(cvCat)) {
    finalCategory = cvCat;
    fusionLevel = 'MEDIUM';
    fusionReason = 'Категория фото в top3 текста';
    needsReview = true;
  }
  // Правило 4: LOW — нет пересечений
  else {
    fusionLevel = 'LOW';
    fusionReason = 'Нет пересечения, нужно уточнение';
  }

  // Если категория не определена
  if (!finalCategory) {
    questions.push({
      id: 'q-clarify',
      text: 'Не удалось однозначно определить тип проблемы. Уточните, что именно произошло?',
      field: 'clarification'
    });

    return {
      classificationResult: 'NEEDS_CLARIFICATION',
      category: null,
      subcategory: null,
      severity: 'MEDIUM',
      confidence: Math.max(textResult.confidence, visionResult.confidence) * 0.7,
      recommendedWorkerType: 'DISPATCHER',
      recommendedQuestions: questions,
      urgencySignals,
      fusionLevel,
      fusionReason,
      needsReview,
      modelVersions: { cv: visionResult.modelVersion, text: textResult.modelVersion }
    };
  }

  // Определяем срочность
  const severity = urgencySignals.length > 0 ? 'CRITICAL' : 'MEDIUM';

  // Добавляем вопросы для уточнения локации
  if (!originalText.includes('подвал') && !originalText.includes('подъезд') && !originalText.includes('квартир')) {
    questions.push({
      id: 'q-location',
      text: 'Где именно находится проблема?',
      field: 'location'
    });
  }

  return {
    classificationResult: questions.length > 0 ? 'NEEDS_CLARIFICATION' : 'KNOWN_INCIDENT',
    category: finalCategory,
    subcategory: textResult.subcategory, // Используем подкатегорию из текста
    severity,
    confidence: (textResult.confidence + visionResult.confidence) / 2,
    recommendedWorkerType: WORKER_MAPPING[finalCategory] || 'DISPATCHER',
    recommendedQuestions: questions,
    urgencySignals,
    fusionLevel,
    fusionReason,
    needsReview,
    modelVersions: { cv: visionResult.modelVersion, text: textResult.modelVersion }
  };
}
