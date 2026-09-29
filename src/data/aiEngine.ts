// AI-движок для веб-прототипа (симуляция ML API v2.1)
// Использует ту же fusion-логику, что и реальный бот

import { categories, getSubcategoryById } from './categories';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ClassificationResult = 'KNOWN_INCIDENT' | 'NEEDS_CLARIFICATION' | 'NOT_INCIDENT';
export type InputMode = 'TEXT_ONLY' | 'IMAGE_ONLY' | 'TEXT_AND_IMAGE';

export interface TextTop3Item {
  subcategory: string;
  category: string;
  confidence: number;
}

export interface VisionTop3Item {
  class: string;
  category: string | null;
  confidence: number;
}

export interface TextAnalysisResult {
  category: string | null;
  subcategory: string | null;
  confidence: number;
  top3: TextTop3Item[];
  modelVersion: string;
}

export interface VisionAnalysisResult {
  classificationResult: ClassificationResult;
  category: string | null;
  subcategory: string | null;
  detectedObjects: string[];
  visualSeverity: Severity | null;
  confidence: number;
  top3: VisionTop3Item[];
  modelVersion: string;
}

export interface ClarificationQuestion {
  id: string;
  text: string;
  field: string;
  options?: string[];
  required: boolean;
}

export interface FusionResult {
  incidentDetected: boolean;
  classificationResult: ClassificationResult;
  category: string | null;
  subcategory: string | null;
  severity: Severity;
  confidence: number;
  missingInformation: string[];
  conflictingInformation: string[];
  recommendedQuestions: ClarificationQuestion[];
  recommendedWorkerType: string;
  textConfidence: number;
  visionConfidence: number;
  fusionConfidence: number;
  fusionLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  fusionReason?: string;
  needsReview?: boolean;
}

// ====== Реальный ML API (относительные пути) ======

export async function analyzeImageReal(file: File): Promise<VisionAnalysisResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/vision/analyze', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Real vision analysis failed:', error);
    throw error;
  }
}

export async function analyzeTextReal(text: string): Promise<TextAnalysisResult> {
  try {
    const response = await fetch('/api/text/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`Text API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Real text analysis failed:', error);
    throw error;
  }
}

export async function checkMLHealth(): Promise<boolean> {
  try {
    const response = await fetch('/api/health');
    return response.ok;
  } catch {
    return false;
  }
}

// ====== Симуляция Text Analysis ======

const CATEGORY_KEYWORDS: Record<string, { words: string[]; subcategory: string }[]> = {
  WATER_SUPPLY: [
    { words: ['теч', 'протечк', 'труб', 'вода на полу', 'луж', 'затопл', 'капает', 'мокр'], subcategory: 'PIPE_LEAK' },
    { words: ['нет воды', 'вода не идёт', 'перекрыли воду', 'водоснабж'], subcategory: 'NO_WATER' },
    { words: ['грязная вода', 'ржавая вода', 'мутная вода'], subcategory: 'DIRTY_WATER' },
    { words: ['давлен', 'слабый напор'], subcategory: 'LOW_PRESSURE' }
  ],
  ELECTRICITY: [
    { words: ['нет света', 'не горит', 'не работа.*свет', 'свет.*не работа', 'свет не работа', 'лампочк', 'освещен', 'темно', 'электричеств'], subcategory: 'NO_LIGHT_STAIRWELL' },
    { words: ['провод', 'оголён', 'обнаж', 'искр'], subcategory: 'EXPOSED_WIRES' },
    { words: ['щиток', 'автомат', 'пробк'], subcategory: 'ELECTRICAL_PANEL' },
    { words: ['газ', 'пахнет газ'], subcategory: 'EXPOSED_WIRES' } // Газ — критическая ситуация
  ],
  HEATING: [
    { words: ['нет отоплен', 'холодн.*батаре', 'не греет', 'батареи холодн'], subcategory: 'NO_HEATING' },
    { words: ['батарея теч', 'радиатор'], subcategory: 'RADIATOR_LEAK' },
    { words: ['холодно в квартир', 'не топят'], subcategory: 'LOW_TEMPERATURE' }
  ],
  CLEANING: [
    { words: ['грязн.*подъезд', 'грязно', 'не мыли', 'уборк'], subcategory: 'DIRTY_STAIRWELL' },
    { words: ['грязь у вход', 'не убран'], subcategory: 'DIRTY_ENTRANCE' },
    { words: ['мусор', 'переполн', 'контейнер', 'воняет'], subcategory: 'TRASH_OVERFLOW' }
  ],
  YARD: [
    { words: ['упавш.*дерев', 'дерево упал', 'повален.*дерев'], subcategory: 'FALLEN_TREE' },
    { words: ['сломан.*лавочк', 'скамейк'], subcategory: 'DAMAGED_BENCH' },
    { words: ['площадк.*детск', 'горк.*сломан'], subcategory: 'DAMAGED_PLAYGROUND' },
    { words: ['яма.*дорог', 'асфальт', 'тротуар'], subcategory: 'ROAD_DAMAGE' }
  ],
  DOOR: [
    { words: ['дверь.*сломан', 'дверь.*не закрыв', 'входная дверь'], subcategory: 'BROKEN_ENTRY_DOOR' },
    { words: ['замок.*сломан', 'замок.*не работа'], subcategory: 'BROKEN_LOCK' },
    { words: ['домофон', 'не работа.*домофон'], subcategory: 'BROKEN_INTERCOM' }
  ],
  ELEVATOR: [
    { words: ['лифт.*не работа', 'лифт.*сломал', 'лифт не едет'], subcategory: 'ELEVATOR_NOT_WORKING' },
    { words: ['лифт.*шум', 'лифт.*стуч'], subcategory: 'ELEVATOR_NOISE' }
  ],
  ROOF: [
    { words: ['крыш.*теч', 'потолок.*мокр', 'капает с потолка'], subcategory: 'ROOF_LEAK' },
    { words: ['крыш.*поврежд', 'кровл'], subcategory: 'DAMAGED_ROOF' }
  ]
};

const NON_INCIDENT_KEYWORDS = ['кот', 'кошк', 'собак', 'арбуз', 'еда', 'селфи', 'привет', 'как дела'];
const SAFETY_SIGNALS = ['газ', 'пожар', 'дым', 'огонь', 'обрушен', 'угроз'];

export async function analyzeText(text: string): Promise<TextAnalysisResult> {
  await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 300));
  
  const lowerText = text.toLowerCase();
  
  // Проверка на нерелевантный контент
  if (NON_INCIDENT_KEYWORDS.some(kw => lowerText.includes(kw)) && text.length < 30) {
    return {
      category: null,
      subcategory: null,
      confidence: 0.1,
      top3: [],
      modelVersion: 'text-v3-2026-09-29'
    };
  }
  
  if (text.trim().length < 3) {
    return {
      category: null,
      subcategory: null,
      confidence: 0.05,
      top3: [],
      modelVersion: 'text-v3-2026-09-29'
    };
  }
  
  // Поиск совпадений
  const matches: TextTop3Item[] = [];
  
  for (const [categoryId, subcategories] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const sub of subcategories) {
      for (const word of sub.words) {
        const searchWord = word.length > 3 ? word.slice(0, -1) : word;
        const regex = new RegExp(searchWord, 'i');
        if (regex.test(lowerText)) {
          const score = 0.7 + Math.random() * 0.25;
          matches.push({
            subcategory: sub.subcategory,
            category: categoryId,
            confidence: score
          });
        }
      }
    }
  }
  
  // Сортируем по уверенности
  matches.sort((a, b) => b.confidence - a.confidence);
  const top3 = matches.slice(0, 3);
  
  if (top3.length === 0) {
    return {
      category: null,
      subcategory: null,
      confidence: 0.2,
      top3: [],
      modelVersion: 'text-v3-2026-09-29'
    };
  }
  
  return {
    category: top3[0].category,
    subcategory: top3[0].subcategory,
    confidence: top3[0].confidence,
    top3,
    modelVersion: 'text-v3-2026-09-29'
  };
}

// ====== Симуляция Vision Analysis ======

export async function analyzeImage(imageDescription: string): Promise<VisionAnalysisResult> {
  await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));
  
  const desc = imageDescription.toLowerCase();
  
  // NOT_INCIDENT
  if (desc.includes('кот') || desc.includes('кош') || desc.includes('собак') || desc.includes('арбуз') || desc.includes('еда') || desc.includes('селфи')) {
    return {
      classificationResult: 'NOT_INCIDENT',
      category: null,
      subcategory: null,
      detectedObjects: ['not_incident'],
      visualSeverity: null,
      confidence: 0.92,
      top3: [
        { class: 'not_incident', category: null, confidence: 0.92 },
        { class: 'cleaning', category: 'CLEANING', confidence: 0.05 },
        { class: 'yard', category: 'YARD', confidence: 0.03 }
      ],
      modelVersion: 'cv-v4-2026-09-29'
    };
  }
  
  // KNOWN_INCIDENT с высокой уверенностью
  if (desc.includes('протечк') || desc.includes('вода') || desc.includes('труба')) {
    return {
      classificationResult: 'KNOWN_INCIDENT',
      category: 'WATER_SUPPLY',
      subcategory: null,
      detectedObjects: ['water_supply'],
      visualSeverity: 'HIGH',
      confidence: 0.88,
      top3: [
        { class: 'water_supply', category: 'WATER_SUPPLY', confidence: 0.88 },
        { class: 'heating', category: 'HEATING', confidence: 0.08 },
        { class: 'roof', category: 'ROOF', confidence: 0.04 }
      ],
      modelVersion: 'cv-v4-2026-09-29'
    };
  }
  
  if (desc.includes('гряз') || desc.includes('мусор')) {
    return {
      classificationResult: 'KNOWN_INCIDENT',
      category: 'CLEANING',
      subcategory: null,
      detectedObjects: ['cleaning'],
      visualSeverity: 'LOW',
      confidence: 0.85,
      top3: [
        { class: 'cleaning', category: 'CLEANING', confidence: 0.85 },
        { class: 'yard', category: 'YARD', confidence: 0.10 },
        { class: 'not_incident', category: null, confidence: 0.05 }
      ],
      modelVersion: 'cv-v4-2026-09-29'
    };
  }
  
  if (desc.includes('дерево') || desc.includes('ветк')) {
    return {
      classificationResult: 'KNOWN_INCIDENT',
      category: 'YARD',
      subcategory: null,
      detectedObjects: ['yard'],
      visualSeverity: 'HIGH',
      confidence: 0.87,
      top3: [
        { class: 'yard', category: 'YARD', confidence: 0.87 },
        { class: 'cleaning', category: 'CLEANING', confidence: 0.08 },
        { class: 'not_incident', category: null, confidence: 0.05 }
      ],
      modelVersion: 'cv-v4-2026-09-29'
    };
  }
  
  if (desc.includes('дверь') || desc.includes('замок')) {
    return {
      classificationResult: 'KNOWN_INCIDENT',
      category: 'DOOR',
      subcategory: null,
      detectedObjects: ['door'],
      visualSeverity: 'MEDIUM',
      confidence: 0.82,
      top3: [
        { class: 'door', category: 'DOOR', confidence: 0.82 },
        { class: 'electricity', category: 'ELECTRICITY', confidence: 0.12 },
        { class: 'not_incident', category: null, confidence: 0.06 }
      ],
      modelVersion: 'cv-v4-2026-09-29'
    };
  }
  
  if (desc.includes('свет') || desc.includes('лампа') || desc.includes('провод')) {
    return {
      classificationResult: 'KNOWN_INCIDENT',
      category: 'ELECTRICITY',
      subcategory: null,
      detectedObjects: ['electricity'],
      visualSeverity: 'MEDIUM',
      confidence: 0.80,
      top3: [
        { class: 'electricity', category: 'ELECTRICITY', confidence: 0.80 },
        { class: 'water_supply', category: 'WATER_SUPPLY', confidence: 0.12 },
        { class: 'not_incident', category: null, confidence: 0.08 }
      ],
      modelVersion: 'cv-v4-2026-09-29'
    };
  }
  
  // NEEDS_CLARIFICATION — несколько кандидатов с близкой уверенностью
  if (desc.includes('поврежд') || desc.includes('сломан') || desc.includes('авари')) {
    return {
      classificationResult: 'NEEDS_CLARIFICATION',
      category: 'ELECTRICITY',
      subcategory: null,
      detectedObjects: ['electricity', 'water_supply'],
      visualSeverity: 'MEDIUM',
      confidence: 0.45,
      top3: [
        { class: 'electricity', category: 'ELECTRICITY', confidence: 0.45 },
        { class: 'water_supply', category: 'WATER_SUPPLY', confidence: 0.38 },
        { class: 'not_incident', category: null, confidence: 0.17 }
      ],
      modelVersion: 'cv-v4-2026-09-29'
    };
  }
  
  // Default: NOT_INCIDENT
  return {
    classificationResult: 'NOT_INCIDENT',
    category: null,
    subcategory: null,
    detectedObjects: ['not_incident'],
    visualSeverity: null,
    confidence: 0.75,
    top3: [
      { class: 'not_incident', category: null, confidence: 0.75 },
      { class: 'cleaning', category: 'CLEANING', confidence: 0.15 },
      { class: 'yard', category: 'YARD', confidence: 0.10 }
    ],
    modelVersion: 'cv-v4-2026-09-29'
  };
}

// ====== Fusion Engine (по документации API v2.1) ======

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
  let recommendedWorkerType = 'DISPATCHER';
  let textConfidence = 0;
  let visionConfidence = 0;
  let fusionLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  let fusionReason = '';
  let needsReview = false;

  // ===== MODE 1: TEXT ONLY =====
  if (inputMode === 'TEXT_ONLY' && textResult) {
    textConfidence = textResult.confidence;
    confidence = textConfidence;
    
    if (!textResult.category || textResult.confidence < 0.3) {
      classificationResult = 'NOT_INCIDENT';
    } else {
      classificationResult = 'KNOWN_INCIDENT';
      category = textResult.category;
      subcategory = textResult.subcategory;
      fusionLevel = 'HIGH';
      fusionReason = 'Только текст, уверенность высокая';
      
      const sub = getSubcategoryById(category, subcategory || '');
      if (sub) {
        recommendedWorkerType = sub.workerType;
        severity = sub.defaultPriority as Severity;
      }
    }
  }
  
  // ===== MODE 2: IMAGE ONLY =====
  else if (inputMode === 'IMAGE_ONLY' && visionResult) {
    visionConfidence = visionResult.confidence;
    confidence = visionConfidence;
    
    if (visionResult.classificationResult === 'NOT_INCIDENT') {
      classificationResult = 'NOT_INCIDENT';
    } else if (visionResult.classificationResult === 'NEEDS_CLARIFICATION') {
      classificationResult = 'NEEDS_CLARIFICATION';
      category = visionResult.category;
      fusionLevel = 'LOW';
      fusionReason = 'Только фото, несколько кандидатов';
      missingInformation.push('description');
    } else {
      classificationResult = 'NEEDS_CLARIFICATION';
      category = visionResult.category;
      fusionLevel = 'MEDIUM';
      fusionReason = 'Только фото, нужна текстовая информация';
      missingInformation.push('description');
    }
    
    if (visionResult.visualSeverity) {
      severity = visionResult.visualSeverity;
    }
    
    if (category) {
      const cat = categories.find(c => c.id === category);
      if (cat) {
        recommendedWorkerType = cat.defaultWorker;
      }
    }
  }
  
  // ===== MODE 3: TEXT + IMAGE (Fusion по top3) =====
  else if (inputMode === 'TEXT_AND_IMAGE' && textResult && visionResult) {
    textConfidence = textResult.confidence;
    visionConfidence = visionResult.confidence;
    
    const cvCat = visionResult.category;
    const txCat = textResult.category;
    const cvCats = visionResult.top3?.map(x => x.category).filter(c => c !== null) || [];
    const txCats = textResult.top3?.map(x => x.category).filter(c => c !== null) || [];
    
    // Правило 1: HIGH — category фото == category текста
    if (cvCat && txCat && cvCat === txCat) {
      category = txCat;
      subcategory = textResult.subcategory;
      fusionLevel = 'HIGH';
      fusionReason = 'CV и текст согласны (top-1)';
      classificationResult = 'KNOWN_INCIDENT';
    }
    // Правило 2: MEDIUM — category текста в top3 фото
    else if (txCat && cvCats.includes(txCat)) {
      category = txCat;
      subcategory = textResult.subcategory;
      fusionLevel = 'MEDIUM';
      fusionReason = 'Категория текста в top3 фото';
      needsReview = true;
      classificationResult = 'KNOWN_INCIDENT';
    }
    // Правило 3: MEDIUM — category фото в top3 текста
    else if (cvCat && txCats.includes(cvCat)) {
      category = cvCat;
      subcategory = textResult.subcategory;
      fusionLevel = 'MEDIUM';
      fusionReason = 'Категория фото в top3 текста';
      needsReview = true;
      classificationResult = 'KNOWN_INCIDENT';
    }
    // Правило 4: LOW — нет пересечений
    else {
      fusionLevel = 'LOW';
      fusionReason = 'Нет пересечения, нужно уточнение';
      classificationResult = 'NEEDS_CLARIFICATION';
      conflictingInformation.push('text_vision_category');
    }
    
    confidence = (textConfidence + visionConfidence) / 2;
    
    if (category) {
      const sub = getSubcategoryById(category, subcategory || '');
      if (sub) {
        recommendedWorkerType = sub.workerType;
        severity = sub.defaultPriority as Severity;
      }
      
      if (visionResult.visualSeverity) {
        const severityOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        const currentIdx = severityOrder.indexOf(severity);
        const visualIdx = severityOrder.indexOf(visionResult.visualSeverity);
        severity = severityOrder[Math.max(currentIdx, visualIdx)] as Severity;
      }
    }
  }
  
  // Генерация уточняющих вопросов
  if (missingInformation.includes('description')) {
    recommendedQuestions.push({
      id: 'q-description',
      text: 'Пожалуйста, кратко опишите, что произошло',
      field: 'description',
      required: true
    });
  }
  
  if (conflictingInformation.length > 0) {
    recommendedQuestions.push({
      id: 'q-clarify',
      text: 'Мы заметили несоответствие между описанием и фото. Уточните, что именно произошло?',
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
    fusionConfidence: confidence,
    fusionLevel,
    fusionReason,
    needsReview
  };
}
