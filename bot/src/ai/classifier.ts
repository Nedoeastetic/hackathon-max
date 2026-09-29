// AI-классификатор: rule-based + опциональная интеграция с LLM

export interface AnalysisInput {
  text?: string;
  imageDescription?: string;
  mode: 'TEXT_ONLY' | 'IMAGE_ONLY' | 'TEXT_AND_IMAGE';
}

export interface ClarificationQuestion {
  id: string;
  text: string;
  field: string;
  options?: string[];
}

export interface AnalysisResult {
  classificationResult: 'KNOWN_INCIDENT' | 'OTHER_INCIDENT' | 'NOT_INCIDENT' | 'NEEDS_CLARIFICATION' | 'CONFLICT';
  category: string | null;
  subcategory: string | null;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  recommendedWorkerType: string;
  recommendedQuestions: ClarificationQuestion[];
  urgencySignals: string[];
}

// Ключевые слова для классификации
const KEYWORDS: Record<string, { words: string[]; subcategory: string; worker: string; priority: string }[]> = {
  WATER_SUPPLY: [
    { words: ['течёт', 'течет', 'протечка', 'труба', 'лужа', 'затопл'], subcategory: 'PIPE_LEAK', worker: 'PLUMBER', priority: 'HIGH' },
    { words: ['нет воды', 'водоснабж'], subcategory: 'NO_WATER', worker: 'PLUMBER', priority: 'MEDIUM' },
    { words: ['грязная вода', 'ржавая'], subcategory: 'DIRTY_WATER', worker: 'PLUMBER', priority: 'MEDIUM' }
  ],
  ELECTRICITY: [
    { words: ['нет света', 'не горит', 'освещен', 'темно'], subcategory: 'NO_LIGHT', worker: 'ELECTRICIAN', priority: 'MEDIUM' },
    { words: ['провод', 'оголён', 'искр'], subcategory: 'EXPOSED_WIRES', worker: 'ELECTRICIAN', priority: 'CRITICAL' }
  ],
  CLEANING: [
    { words: ['грязн', 'уборк', 'мусор'], subcategory: 'DIRTY_AREA', worker: 'CLEANER', priority: 'LOW' }
  ],
  YARD: [
    { words: ['дерево упал', 'упавш'], subcategory: 'FALLEN_TREE', worker: 'LANDSCAPER', priority: 'HIGH' },
    { words: ['лавочк', 'скамейк'], subcategory: 'DAMAGED_BENCH', worker: 'MAINTENANCE', priority: 'LOW' }
  ],
  DOOR: [
    { words: ['дверь сломан', 'не закрыв'], subcategory: 'BROKEN_DOOR', worker: 'LOCKSMITH', priority: 'MEDIUM' },
    { words: ['замок'], subcategory: 'BROKEN_LOCK', worker: 'LOCKSMITH', priority: 'MEDIUM' }
  ],
  ELEVATOR: [
    { words: ['лифт не работа', 'лифт сломал'], subcategory: 'ELEVATOR_BROKEN', worker: 'UNIVERSAL', priority: 'HIGH' }
  ]
};

const NON_INCIDENT_KEYWORDS = ['кот', 'кошк', 'собак', 'арбуз', 'еда', 'селфи', 'привет', 'как дела'];

const SAFETY_SIGNALS = ['газ', 'пожар', 'дым', 'огонь', 'обрушен', 'угроз'];

export async function analyzeInput(input: AnalysisInput): Promise<AnalysisResult> {
  // Имитация задержки AI
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
  
  const text = (input.text || '').toLowerCase();
  
  // Проверка на нерелевантный контент
  if (NON_INCIDENT_KEYWORDS.some(kw => text.includes(kw))) {
    return {
      classificationResult: 'NOT_INCIDENT',
      category: null,
      subcategory: null,
      severity: 'LOW',
      confidence: 0.9,
      recommendedWorkerType: 'DISPATCHER',
      recommendedQuestions: [],
      urgencySignals: []
    };
  }
  
  // Проверка на пустой ввод
  if (!text && !input.imageDescription) {
    return {
      classificationResult: 'NOT_INCIDENT',
      category: null,
      subcategory: null,
      severity: 'LOW',
      confidence: 0.1,
      recommendedWorkerType: 'DISPATCHER',
      recommendedQuestions: [],
      urgencySignals: []
    };
  }
  
  // Поиск совпадений
  let bestCategory: string | null = null;
  let bestSubcategory: string | null = null;
  let bestWorker = 'DISPATCHER';
  let bestPriority = 'LOW';
  let bestConfidence = 0;
  const urgencySignals: string[] = [];
  
  for (const [categoryId, subs] of Object.entries(KEYWORDS)) {
    for (const sub of subs) {
      for (const word of sub.words) {
        if (text.includes(word)) {
          const score = 0.75 + Math.random() * 0.2;
          if (score > bestConfidence) {
            bestConfidence = score;
            bestCategory = categoryId;
            bestSubcategory = sub.subcategory;
            bestWorker = sub.worker;
            bestPriority = sub.priority;
          }
        }
      }
    }
  }
  
  // Проверка safety-сигналов
  for (const signal of SAFETY_SIGNALS) {
    if (text.includes(signal)) {
      urgencySignals.push(signal);
      bestPriority = 'CRITICAL';
    }
  }
  
  // Если ничего не найдено
  if (!bestCategory) {
    if (text.length > 10) {
      return {
        classificationResult: 'OTHER_INCIDENT',
        category: null,
        subcategory: null,
        severity: 'MEDIUM',
        confidence: 0.4,
        recommendedWorkerType: 'DISPATCHER',
        recommendedQuestions: [
          { id: 'q1', text: 'Опишите подробнее, что произошло?', field: 'description' }
        ],
        urgencySignals
      };
    }
    return {
      classificationResult: 'NOT_INCIDENT',
      category: null,
      subcategory: null,
      severity: 'LOW',
      confidence: 0.2,
      recommendedWorkerType: 'DISPATCHER',
      recommendedQuestions: [],
      urgencySignals
    };
  }
  
  // Формируем уточняющие вопросы
  const questions: ClarificationQuestion[] = [];
  
  if (!text.includes('подвал') && !text.includes('подъезд') && !text.includes('квартир') && !text.includes('двор') && !text.includes('лестниц')) {
    questions.push({
      id: 'q-location',
      text: 'Где именно находится проблема? (подъезд, этаж, место)',
      field: 'location'
    });
  }
  
  if (bestCategory === 'WATER_SUPPLY' && bestSubcategory === 'PIPE_LEAK') {
    questions.push({
      id: 'q-active',
      text: 'Вода продолжает поступать прямо сейчас?',
      field: 'isActive',
      options: ['Да, вода идёт', 'Нет, уже остановилась']
    });
  }
  
  return {
    classificationResult: questions.length > 0 ? 'NEEDS_CLARIFICATION' : 'KNOWN_INCIDENT',
    category: bestCategory,
    subcategory: bestSubcategory,
    severity: bestPriority as any,
    confidence: bestConfidence,
    recommendedWorkerType: bestWorker,
    recommendedQuestions: questions,
    urgencySignals
  };
}
