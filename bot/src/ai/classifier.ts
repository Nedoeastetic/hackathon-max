// AI-классификатор: интеграция с реальным ML API
import { analyzeText, analyzeImage, VisionAnalysisResult, TextAnalysisResult } from './api-client.js';

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
  classificationResult: 'KNOWN_INCIDENT' | 'OTHER_INCIDENT' | 'NOT_INCIDENT' | 'NEEDS_CLARIFICATION' | 'CONFLICT';
  category: string | null;
  subcategory: string | null;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  recommendedWorkerType: string;
  recommendedQuestions: ClarificationQuestion[];
  urgencySignals: string[];
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

// Маппинг срочности
const SEVERITY_MAPPING: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

// Safety-сигналы для повышения приоритета
const SAFETY_SIGNALS = ['газ', 'пожар', 'дым', 'огонь', 'обрушен', 'угроз', 'провод', 'электрич'];

export async function analyzeInput(input: AnalysisInput): Promise<AnalysisResult> {
  try {
    let textResult: TextAnalysisResult | null = null;
    let visionResult: VisionAnalysisResult | null = null;

    // Анализ текста
    if (input.text && (input.mode === 'TEXT_ONLY' || input.mode === 'TEXT_AND_IMAGE')) {
      textResult = await analyzeText(input.text);
    }

    // Анализ изображения
    if (input.imageBuffer && input.imageFilename && (input.mode === 'IMAGE_ONLY' || input.mode === 'TEXT_AND_IMAGE')) {
      visionResult = await analyzeImage(input.imageBuffer, input.imageFilename);
    }

    // Fusion: объединение результатов
    return fuseResults(textResult, visionResult, input.text || '');
  } catch (error) {
    console.error('❌ Analysis error:', error);
    // Fallback: если API недоступен
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

// Fusion engine: объединение результатов text + vision
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

  // MODE 1: TEXT ONLY
  if (textResult && !visionResult) {
    if (!textResult.category || textResult.confidence < 0.3) {
      return {
        classificationResult: 'NOT_INCIDENT',
        category: null,
        subcategory: null,
        severity: 'LOW',
        confidence: textResult.confidence,
        recommendedWorkerType: 'DISPATCHER',
        recommendedQuestions: [],
        urgencySignals
      };
    }

    const severity = urgencySignals.length > 0 ? 'CRITICAL' : 'MEDIUM';
    
    // Добавляем вопросы для уточнения
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
      urgencySignals
    };
  }

  // MODE 2: IMAGE ONLY
  if (visionResult && !textResult) {
    if (visionResult.classificationResult === 'NOT_INCIDENT') {
      return {
        classificationResult: 'NOT_INCIDENT',
        category: null,
        subcategory: null,
        severity: 'LOW',
        confidence: visionResult.confidence,
        recommendedWorkerType: 'DISPATCHER',
        recommendedQuestions: [],
        urgencySignals
      };
    }

    if (visionResult.classificationResult === 'OTHER_INCIDENT') {
      return {
        classificationResult: 'OTHER_INCIDENT',
        category: null,
        subcategory: null,
        severity: visionResult.visualSeverity || 'MEDIUM',
        confidence: visionResult.confidence,
        recommendedWorkerType: 'DISPATCHER',
        recommendedQuestions: [
          { id: 'q-desc', text: 'Опишите подробнее, что произошло?', field: 'description' }
        ],
        urgencySignals
      };
    }

    // KNOWN_INCIDENT from vision
    const severity = visionResult.visualSeverity || 'MEDIUM';
    
    // Всегда нужны уточнения для image-only
    questions.push({
      id: 'q-desc',
      text: 'Опишите подробнее, что произошло?',
      field: 'description'
    });

    return {
      classificationResult: 'NEEDS_CLARIFICATION',
      category: visionResult.category,
      subcategory: visionResult.subcategory,
      severity,
      confidence: visionResult.confidence,
      recommendedWorkerType: visionResult.category ? (WORKER_MAPPING[visionResult.category] || 'DISPATCHER') : 'DISPATCHER',
      recommendedQuestions: questions,
      urgencySignals
    };
  }

  // MODE 3: TEXT + IMAGE
  if (textResult && visionResult) {
    // Проверка конфликта
    if (textResult.category && visionResult.category && textResult.category !== visionResult.category) {
      return {
        classificationResult: 'CONFLICT',
        category: null,
        subcategory: null,
        severity: 'MEDIUM',
        confidence: Math.min(textResult.confidence, visionResult.confidence) * 0.7,
        recommendedWorkerType: 'DISPATCHER',
        recommendedQuestions: [
          { id: 'q-clarify', text: 'Мы заметили несоответствие между описанием и фото. Уточните, что именно произошло?', field: 'clarification' }
        ],
        urgencySignals
      };
    }

    // Используем более уверенный результат
    const useText = textResult.confidence >= visionResult.confidence;
    const category = useText ? textResult.category : visionResult.category;
    const subcategory = useText ? textResult.subcategory : visionResult.subcategory;
    const confidence = (textResult.confidence + visionResult.confidence) / 2;
    const severity = urgencySignals.length > 0 ? 'CRITICAL' : 
                     (visionResult.visualSeverity || (useText ? 'MEDIUM' : 'MEDIUM'));

    // Добавляем вопросы
    if (!originalText.includes('подвал') && !originalText.includes('подъезд')) {
      questions.push({
        id: 'q-location',
        text: 'Где именно находится проблема?',
        field: 'location'
      });
    }

    return {
      classificationResult: questions.length > 0 ? 'NEEDS_CLARIFICATION' : 'KNOWN_INCIDENT',
      category,
      subcategory,
      severity,
      confidence,
      recommendedWorkerType: category ? (WORKER_MAPPING[category] || 'DISPATCHER') : 'DISPATCHER',
      recommendedQuestions: questions,
      urgencySignals
    };
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
