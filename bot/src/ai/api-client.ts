// HTTP-клиент для ML API v2.1
// Документация: http://193.108.113.153:8000/

const BASE_URL = process.env.ML_API_URL || 'https://v3258578.hosted-by-vdsina.ru';
const REQUEST_TIMEOUT = 15000; // 15 секунд (первый запрос грузит модель ~1-2с)

// ====== Типы ответов API ======

export interface HealthStatus {
  status: string;
  models: {
    cv: string;
    text: string;
  };
}

export interface VisionTop3Item {
  class: string;
  category: string | null;
  confidence: number;
}

export interface VisionAnalysisResult {
  classificationResult: 'KNOWN_INCIDENT' | 'NEEDS_CLARIFICATION' | 'NOT_INCIDENT';
  category: string | null;
  subcategory: string | null;
  detectedObjects: string[];
  visualSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  confidence: number;
  top3: VisionTop3Item[];
  modelVersion: string;
}

export interface TextTop3Item {
  subcategory: string;
  category: string;
  confidence: number;
}

export interface TextAnalysisResult {
  category: string | null;
  subcategory: string | null;
  confidence: number;
  top3: TextTop3Item[];
  modelVersion: string;
}

// ====== API-методы ======

export async function checkHealth(): Promise<HealthStatus> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${BASE_URL}/api/health`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('❌ ML API health check failed:', error);
    throw error;
  }
}

export async function analyzeImage(imageBuffer: Buffer, filename: string): Promise<VisionAnalysisResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('file', blob, filename);

    const response = await fetch(`${BASE_URL}/api/vision/analyze`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('Vision API: пустой запрос (нет файла)');
      }
      if (response.status === 500) {
        throw new Error('Vision API: внутренняя ошибка сервера');
      }
      throw new Error(`Vision API failed: ${response.status}`);
    }

    const result: VisionAnalysisResult = await response.json();
    console.log(
      `📷 Vision [${result.modelVersion}]: ${result.classificationResult} ` +
      `(${result.category || 'N/A'}) conf=${result.confidence.toFixed(3)} ` +
      `top3=[${result.top3?.map(t => `${t.class}:${t.confidence.toFixed(2)}`).join(', ') || 'N/A'}]`
    );
    
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('❌ Vision API error:', error);
    throw error;
  }
}

export async function analyzeText(text: string): Promise<TextAnalysisResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${BASE_URL}/api/text/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('Text API: пустой запрос (нет текста)');
      }
      if (response.status === 500) {
        throw new Error('Text API: внутренняя ошибка сервера');
      }
      throw new Error(`Text API failed: ${response.status}`);
    }

    const result: TextAnalysisResult = await response.json();
    console.log(
      `📝 Text [${result.modelVersion}]: ${result.category || 'N/A'}/${result.subcategory || 'N/A'} ` +
      `conf=${result.confidence.toFixed(3)} ` +
      `top3=[${result.top3?.map(t => `${t.subcategory}:${t.confidence.toFixed(2)}`).join(', ') || 'N/A'}]`
    );
    
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('❌ Text API error:', error);
    throw error;
  }
}
