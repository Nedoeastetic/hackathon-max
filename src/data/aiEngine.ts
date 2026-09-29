import { 
  TextAnalysisResult, 
  VisionAnalysisResult, 
  FusionResult, 
  ClarificationQuestion,
  Severity,
  ClassificationResult,
  InputMode
} from '../types';
import { categories, getSubcategoryById } from './categories';

// Safety signals that indicate critical situations
const SAFETY_SIGNALS = [
  'газ', 'пожар', 'дым', 'огонь', 'обрушение', 'угроза',
  'провод', 'электричество', 'искра', 'взрыв', 'ток'
];

// Keywords for text classification
const CATEGORY_KEYWORDS: Record<string, { words: string[]; subcategory: string }[]> = {
  WATER_SUPPLY: [
    { words: ['теч', 'протечк', 'труб', 'вода на полу', 'луж', 'затопл', 'капает', 'капают', 'мокр'], subcategory: 'PIPE_LEAK' },
    { words: ['нет воды', 'вода не идёт', 'перекрыли воду', 'водоснабж', 'отключили воду'], subcategory: 'NO_WATER' },
    { words: ['грязная вода', 'ржавая вода', 'мутная вода', 'плохая вода', 'вода с запахом'], subcategory: 'DIRTY_WATER' },
    { words: ['давлен', 'слабый напор', 'тонкая струя'], subcategory: 'LOW_PRESSURE' }
  ],
  ELECTRICITY: [
    { words: ['нет света', 'не горит', 'лампочк', 'освещен', 'темно', 'свет не работа', 'электричеств'], subcategory: 'NO_LIGHT_STAIRWELL' },
    { words: ['провод', 'оголён', 'обнаж', 'искр', 'короткое замыкание', 'бьёт током'], subcategory: 'EXPOSED_WIRES' },
    { words: ['щиток', 'автомат', 'пробк', 'электрощит'], subcategory: 'ELECTRICAL_PANEL' }
  ],
  HEATING: [
    { words: ['нет отоплен', 'холодн.*батаре', 'не греет', 'отоплен.*не работа', 'батареи холодн'], subcategory: 'NO_HEATING' },
    { words: ['батарея теч', 'радиатор', 'протечк.*батаре'], subcategory: 'RADIATOR_LEAK' },
    { words: ['холодно в квартир', 'низк.*температур', 'не топят'], subcategory: 'LOW_TEMPERATURE' }
  ],
  CLEANING: [
    { words: ['грязн.*подъезд', 'грязно', 'не мыли', 'уборк', 'мусор в подъезд', 'помойк'], subcategory: 'DIRTY_STAIRWELL' },
    { words: ['грязь у вход', 'грязный вход', 'не убран'], subcategory: 'DIRTY_ENTRANCE' },
    { words: ['мусор', 'переполн', 'контейнер', 'бак.*мусор', 'отход', 'воняет'], subcategory: 'TRASH_OVERFLOW' }
  ],
  YARD: [
    { words: ['упавш.*дерев', 'дерево упал', 'повален.*дерев', 'ветк.*дорог', 'дерево на машин'], subcategory: 'FALLEN_TREE' },
    { words: ['сломан.*лавочк', 'поврежд.*лавк', 'скамейк'], subcategory: 'DAMAGED_BENCH' },
    { words: ['площадк.*детск', 'горк.*сломан', 'качел'], subcategory: 'DAMAGED_PLAYGROUND' },
    { words: ['яма.*дорог', 'асфальт', 'покрыти.*поврежд', 'тротуар', 'дырка в дорог'], subcategory: 'ROAD_DAMAGE' }
  ],
  DOOR: [
    { words: ['дверь.*сломан', 'дверь.*не закрыв', 'входная дверь', 'дверь подъезд', 'дверь не работа'], subcategory: 'BROKEN_ENTRY_DOOR' },
    { words: ['замок.*сломан', 'замок.*не работа', 'ключ', 'не открыв.*двер'], subcategory: 'BROKEN_LOCK' },
    { words: ['домофон', 'не работа.*домофон', 'код не набирает'], subcategory: 'BROKEN_INTERCOM' }
  ],
  ELEVATOR: [
    { words: ['лифт.*не работа', 'лифт.*сломал', 'лифт.*стои', 'лифт не едет'], subcategory: 'ELEVATOR_NOT_WORKING' },
    { words: ['лифт.*шум', 'лифт.*стуч', 'лифт.*грохоч'], subcategory: 'ELEVATOR_NOISE' }
  ],
  ROOF: [
    { words: ['крыш.*теч', 'потолок.*мокр', 'протечк.*сверху', 'потолок.*теч', 'капает с потолка'], subcategory: 'ROOF_LEAK' },
    { words: ['крыш.*поврежд', 'кровл', 'чердак'], subcategory: 'DAMAGED_ROOF' }
  ]
};

// Non-incident keywords
const NON_INCIDENT_KEYWORDS = [
  'кот', 'кошка', 'щенок', 'собак', 'птиц', 'арбуз', 'еда', 'селфи',
  'погода', 'красив', 'привет', 'как дела', 'спасибо', 'пока',
  'реклам', 'акци', 'скидк', 'купить', 'продам'
];

// Urgency signals
const URGENCY_SIGNALS: Record<string, string[]> = {
  CRITICAL: ['газ', 'пожар', 'дым', 'огонь', 'обрушени', 'угроз.*люд', 'взрыв'],
  HIGH: ['течёт', 'протечк', 'затопл', 'вода.*пол', 'оголён.*провод', 'не работает лифт', 'упало дерево'],
  MEDIUM: ['сломан', 'повреждён', 'не работает', 'грязно', 'мусор'],
  LOW: ['небольш', 'мелк', 'чуть-чуть', 'немного']
};

// Simulate AI processing delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Text analysis function
export async function analyzeText(text: string): Promise<TextAnalysisResult> {
  await delay(800 + Math.random() * 400);
  
  const lowerText = text.toLowerCase();
  
  // Check for non-incident content
  const isNonIncident = NON_INCIDENT_KEYWORDS.some(keyword => lowerText.includes(keyword));
  if (isNonIncident && text.length < 30) {
    return {
      category: null,
      subcategory: null,
      urgencySignals: [],
      entities: [],
      confidence: 0.15,
      extractedFacts: {}
    };
  }
  
  // Check for empty/spam
  if (text.trim().length < 3) {
    return {
      category: null,
      subcategory: null,
      urgencySignals: [],
      entities: [],
      confidence: 0.05,
      extractedFacts: {}
    };
  }
  
  // Find matching category
  let bestCategory: string | null = null;
  let bestSubcategory: string | null = null;
  let bestConfidence = 0;
  const urgencySignals: string[] = [];
  const entities: string[] = [];
  const extractedFacts: Record<string, string> = {};
  
  for (const [categoryId, subcategories] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const sub of subcategories) {
      for (const word of sub.words) {
        // Используем частичное совпадение для учёта морфологии
        // Например, "труб" найдёт "труба", "трубы", "трубой"
        const searchWord = word.length > 3 ? word.slice(0, -1) : word;
        const regex = new RegExp(searchWord, 'i');
        if (regex.test(lowerText)) {
          const score = 0.75 + Math.random() * 0.2;
          if (score > bestConfidence) {
            bestConfidence = score;
            bestCategory = categoryId;
            bestSubcategory = sub.subcategory;
          }
        }
      }
    }
  }
  
  // Extract urgency signals
  for (const [level, signals] of Object.entries(URGENCY_SIGNALS)) {
    for (const signal of signals) {
      const regex = new RegExp(signal, 'i');
      if (regex.test(lowerText)) {
        urgencySignals.push(signal);
      }
    }
  }
  
  // Extract location entities
  const locationPatterns = [
    { pattern: /подвал/i, value: 'Подвал' },
    { pattern: /чердак/i, value: 'Чердак' },
    { pattern: /подъезд/i, value: 'Подъезд' },
    { pattern: /этаж/i, value: 'Этаж' },
    { pattern: /лестниц/i, value: 'Лестница' },
    { pattern: /крыш/i, value: 'Крыша' },
    { pattern: /двор/i, value: 'Двор' },
    { pattern: /квартир/i, value: 'Квартира' },
    { pattern: /вход/i, value: 'Вход' },
    { pattern: /коридор/i, value: 'Коридор' }
  ];
  
  for (const loc of locationPatterns) {
    const match = lowerText.match(loc.pattern);
    if (match) {
      entities.push(loc.value);
      extractedFacts[loc.value.toLowerCase()] = match[0];
    }
  }
  
  // Fallback: если текст достаточно длинный, но категория не определена,
  // возвращаем OTHER_INCIDENT вместо NOT_INCIDENT
  if (!bestCategory && text.length > 15) {
    return {
      category: null,
      subcategory: null,
      urgencySignals,
      entities,
      confidence: 0.5, // Средняя уверенность — нужно уточнение
      extractedFacts
    };
  }
  
  return {
    category: bestCategory,
    subcategory: bestSubcategory,
    urgencySignals,
    entities,
    confidence: bestConfidence,
    extractedFacts
  };
}

// Vision analysis simulation
export async function analyzeImage(imageDescription: string): Promise<VisionAnalysisResult> {
  await delay(1000 + Math.random() * 500);
  
  // Simulate different image types
  const desc = imageDescription.toLowerCase();
  
  if (desc.includes('кот') || desc.includes('кош') || desc.includes('собак') || desc.includes('арбуз') || desc.includes('еда') || desc.includes('селфи')) {
    return {
      classificationResult: 'NOT_INCIDENT',
      category: null,
      subcategory: null,
      detectedObjects: ['животное'],
      visualSeverity: null,
      confidence: 0.95
    };
  }
  
  if (desc.includes('протечк') || desc.includes('вода') || desc.includes('труба')) {
    return {
      classificationResult: 'KNOWN_INCIDENT',
      category: 'WATER_SUPPLY',
      subcategory: 'PIPE_LEAK',
      detectedObjects: ['вода', 'труба', 'лужа'],
      visualSeverity: 'HIGH',
      confidence: 0.87 + Math.random() * 0.1
    };
  }
  
  if (desc.includes('гряз') || desc.includes('мусор')) {
    return {
      classificationResult: 'KNOWN_INCIDENT',
      category: 'CLEANING',
      subcategory: 'DIRTY_STAIRWELL',
      detectedObjects: ['грязь', 'загрязнение'],
      visualSeverity: 'LOW',
      confidence: 0.82 + Math.random() * 0.1
    };
  }
  
  if (desc.includes('дерево') || desc.includes('ветк')) {
    return {
      classificationResult: 'KNOWN_INCIDENT',
      category: 'YARD',
      subcategory: 'FALLEN_TREE',
      detectedObjects: ['дерево', 'препятствие'],
      visualSeverity: 'HIGH',
      confidence: 0.85 + Math.random() * 0.1
    };
  }
  
  if (desc.includes('дверь') || desc.includes('замок')) {
    return {
      classificationResult: 'KNOWN_INCIDENT',
      category: 'DOOR',
      subcategory: 'BROKEN_ENTRY_DOOR',
      detectedObjects: ['дверь', 'повреждение'],
      visualSeverity: 'MEDIUM',
      confidence: 0.80 + Math.random() * 0.1
    };
  }
  
  if (desc.includes('свет') || desc.includes('лампа') || desc.includes('провод')) {
    return {
      classificationResult: 'KNOWN_INCIDENT',
      category: 'ELECTRICITY',
      subcategory: 'NO_LIGHT_STAIRWELL',
      detectedObjects: ['освещение', 'повреждение'],
      visualSeverity: 'MEDIUM',
      confidence: 0.78 + Math.random() * 0.1
    };
  }
  
  // Unknown incident
  if (desc.includes('поврежд') || desc.includes('сломан') || desc.includes('авари')) {
    return {
      classificationResult: 'OTHER_INCIDENT',
      category: null,
      subcategory: null,
      detectedObjects: ['неизвестное повреждение'],
      visualSeverity: 'MEDIUM',
      confidence: 0.45 + Math.random() * 0.2
    };
  }
  
  // Default: not an incident
  return {
    classificationResult: 'NOT_INCIDENT',
    category: null,
    subcategory: null,
    detectedObjects: [],
    visualSeverity: null,
    confidence: 0.3 + Math.random() * 0.2
  };
}

// Fusion engine
export function fuseResults(
  textResult: TextAnalysisResult | null,
  visionResult: VisionAnalysisResult | null,
  inputMode: InputMode
): FusionResult {
  const missingInformation: string[] = [];
  const conflictingInformation: string[] = [];
  const recommendedQuestions: ClarificationQuestion[] = [];
  
  let category: string | null = null;
  let subcategory: string | null = null;
  let severity: Severity = 'LOW';
  let confidence = 0;
  let classificationResult: ClassificationResult = 'NEEDS_CLARIFICATION';
  let recommendedWorkerType: WorkerType = 'DISPATCHER';
  let textConfidence = 0;
  let visionConfidence = 0;
  
  if (inputMode === 'TEXT_ONLY' && textResult) {
    textConfidence = textResult.confidence;
    confidence = textConfidence;
    
    if (textResult.confidence < 0.3) {
      classificationResult = 'NOT_INCIDENT';
    } else if (textResult.confidence < 0.6) {
      classificationResult = 'NEEDS_CLARIFICATION';
      missingInformation.push('category');
    } else {
      classificationResult = 'KNOWN_INCIDENT';
      category = textResult.category;
      subcategory = textResult.subcategory;
      
      if (category && subcategory) {
        const sub = getSubcategoryById(category, subcategory);
        if (sub) {
          recommendedWorkerType = sub.workerType;
          severity = sub.defaultPriority;
        }
      }
      
      // Boost severity based on urgency signals
      if (textResult.urgencySignals.length > 0) {
        const hasCritical = textResult.urgencySignals.some(s => 
          URGENCY_SIGNALS.CRITICAL.some(cs => s.includes(cs))
        );
        if (hasCritical) {
          severity = 'CRITICAL';
        } else if (severity !== 'CRITICAL') {
          severity = 'HIGH';
        }
      }
      
      // Check if we need clarification
      if (textResult.entities.length === 0) {
        missingInformation.push('location');
      }
    }
  } else if (inputMode === 'IMAGE_ONLY' && visionResult) {
    visionConfidence = visionResult.confidence;
    confidence = visionConfidence;
    
    if (visionResult.classificationResult === 'NOT_INCIDENT') {
      classificationResult = 'NOT_INCIDENT';
    } else if (visionResult.classificationResult === 'OTHER_INCIDENT') {
      classificationResult = 'OTHER_INCIDENT';
      missingInformation.push('description');
    } else {
      classificationResult = 'KNOWN_INCIDENT';
      category = visionResult.category;
      subcategory = visionResult.subcategory;
      
      if (visionResult.visualSeverity) {
        severity = visionResult.visualSeverity;
      }
      
      if (category && subcategory) {
        const sub = getSubcategoryById(category, subcategory);
        if (sub) {
          recommendedWorkerType = sub.workerType;
        }
      }
      
      // Always need some info for image-only
      missingInformation.push('description');
      missingInformation.push('location');
    }
  } else if (inputMode === 'TEXT_AND_IMAGE' && textResult && visionResult) {
    textConfidence = textResult.confidence;
    visionConfidence = visionResult.confidence;
    
    // Check for conflicts
    if (textResult.category && visionResult.category && textResult.category !== visionResult.category) {
      conflictingInformation.push('text_vision_category');
      confidence = Math.min(textConfidence, visionConfidence) * 0.7;
      classificationResult = 'CONFLICT';
    } else {
      // Use the higher confidence source
      if (textConfidence >= visionConfidence) {
        category = textResult.category || visionResult.category;
        subcategory = textResult.subcategory || visionResult.subcategory;
        confidence = textConfidence * 0.6 + visionConfidence * 0.4;
      } else {
        category = visionResult.category || textResult.category;
        subcategory = visionResult.subcategory || textResult.subcategory;
        confidence = visionConfidence * 0.6 + textConfidence * 0.4;
      }
      
      if (confidence > 0.6 && category) {
        classificationResult = 'KNOWN_INCIDENT';
        
        if (category && subcategory) {
          const sub = getSubcategoryById(category, subcategory);
          if (sub) {
            recommendedWorkerType = sub.workerType;
            severity = sub.defaultPriority;
          }
        }
        
        // Combine severity signals
        if (visionResult.visualSeverity) {
          const severityOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
          const textSevIdx = severityOrder.indexOf(severity);
          const visSevIdx = severityOrder.indexOf(visionResult.visualSeverity);
          severity = severityOrder[Math.max(textSevIdx, visSevIdx)] as Severity;
        }
        
        if (textResult.entities.length === 0) {
          missingInformation.push('location');
        }
      } else {
        classificationResult = 'NEEDS_CLARIFICATION';
        missingInformation.push('category');
      }
    }
  }
  
  // Generate recommended questions based on missing info
  if (missingInformation.includes('category')) {
    recommendedQuestions.push({
      id: 'q-category',
      text: 'Уточните, пожалуйста, к какой категории относится проблема? (водоснабжение, электричество, уборка, двор, двери, лифт)',
      field: 'category',
      required: true
    });
  }
  
  if (missingInformation.includes('location')) {
    recommendedQuestions.push({
      id: 'q-location',
      text: 'Где именно находится проблема? (подъезд, этаж, место)',
      field: 'location',
      required: true
    });
  }
  
  if (missingInformation.includes('description')) {
    recommendedQuestions.push({
      id: 'q-description',
      text: 'Пожалуйста, кратко опишите, что произошло',
      field: 'description',
      required: true
    });
  }
  
  if (category === 'WATER_SUPPLY' && subcategory === 'PIPE_LEAK') {
    recommendedQuestions.push({
      id: 'q-active',
      text: 'Вода продолжает поступать прямо сейчас?',
      field: 'isActive',
      options: ['Да, вода идёт', 'Нет, уже остановилась'],
      required: true
    });
  }
  
  if (category === 'ELECTRICITY' && subcategory === 'EXPOSED_WIRES') {
    recommendedQuestions.push({
      id: 'q-danger',
      text: 'Есть ли опасность для людей? Находятся ли провода в доступном месте?',
      field: 'dangerLevel',
      options: ['Да, опасно', 'Нет, в недоступном месте'],
      required: true
    });
  }
  
  if (conflictingInformation.length > 0) {
    recommendedQuestions.push({
      id: 'q-clarify',
      text: 'Мы заметили несоответствие между описанием и фото. Уточните, пожалуйста, что именно произошло?',
      field: 'clarification',
      required: true
    });
  }
  
  return {
    incidentDetected: classificationResult !== 'NOT_INCIDENT',
    classificationResult,
    category,
    subcategory,
    severity,
    confidence,
    missingInformation,
    conflictingInformation,
    recommendedQuestions,
    recommendedWorkerType,
    textConfidence,
    visionConfidence,
    fusionConfidence: confidence
  };
}

type WorkerType = 'PLUMBER' | 'ELECTRICIAN' | 'CLEANER' | 'MAINTENANCE' | 'LOCKSMITH' | 'LANDSCAPER' | 'UNIVERSAL' | 'DISPATCHER';
