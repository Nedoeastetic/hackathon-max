// HTTP-клиент для ML API
const BASE_URL = process.env.ML_API_URL || 'http://193.108.113.153:8000';

export interface VisionAnalysisResult {
  classificationResult: 'KNOWN_INCIDENT' | 'OTHER_INCIDENT' | 'NOT_INCIDENT';
  category: string | null;
  subcategory: string | null;
  detectedObjects: string[];
  visualSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
  confidence: number;
  modelVersion: string;
}

export interface TextAnalysisResult {
  category: string | null;
  subcategory: string | null;
  confidence: number;
  top: [string, number][];
  modelVersion: string;
}

export interface HealthStatus {
  status: string;
  models: {
    cv: string;
    text: string;
  };
}

// Проверка здоровья сервиса
export async function checkHealth(): Promise<HealthStatus> {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ ML API health check failed:', error);
    throw error;
  }
}

// Анализ изображения
export async function analyzeImage(imageBuffer: Buffer, filename: string): Promise<VisionAnalysisResult> {
  try {
    // Создаём FormData для multipart/form-data
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('file', blob, filename);

    const response = await fetch(`${BASE_URL}/api/vision/analyze`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Vision API failed: ${response.status}`);
    }

    const result = await response.json();
    console.log(`📷 Vision API: ${result.classificationResult} (${result.category || 'N/A'}) [${result.modelVersion}]`);
    
    return result;
  } catch (error) {
    console.error('❌ Vision API error:', error);
    throw error;
  }
}

// Анализ текста
export async function analyzeText(text: string): Promise<TextAnalysisResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/text/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`Text API failed: ${response.status}`);
    }

    const result = await response.json();
    console.log(`📝 Text API: ${result.category || 'N/A'}/${result.subcategory || 'N/A'} (${result.confidence}) [${result.modelVersion}]`);
    
    return result;
  } catch (error) {
    console.error('❌ Text API error:', error);
    throw error;
  }
}
