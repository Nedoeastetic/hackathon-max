export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus = 
  | 'NEW' 
  | 'NEEDS_CLARIFICATION' 
  | 'READY' 
  | 'AVAILABLE' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'RESOLVED' 
  | 'CANCELLED';

export type ClassificationResult = 
  | 'KNOWN_INCIDENT' 
  | 'NOT_INCIDENT' 
  | 'NEEDS_CLARIFICATION';

export type WorkerType = 
  | 'PLUMBER' 
  | 'ELECTRICIAN' 
  | 'CLEANER' 
  | 'MAINTENANCE' 
  | 'LOCKSMITH' 
  | 'LANDSCAPER' 
  | 'UNIVERSAL' 
  | 'DISPATCHER';

export type InputMode = 'TEXT_ONLY' | 'IMAGE_ONLY' | 'TEXT_AND_IMAGE';

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
  defaultWorker: WorkerType;
  defaultPriority: Severity;
  icon: string;
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  workerType: WorkerType;
  defaultPriority: Severity;
  safetySignals?: string[];
}

export interface TextAnalysisResult {
  category: string | null;
  subcategory: string | null;
  urgencySignals: string[];
  entities: string[];
  confidence: number;
  extractedFacts: Record<string, string>;
}

export interface VisionAnalysisResult {
  classificationResult: ClassificationResult;
  category: string | null;
  subcategory: string | null;
  detectedObjects: string[];
  visualSeverity: Severity | null;
  confidence: number;
}

// FusionResult импортируется из aiEngine.ts где используется

export interface ClarificationQuestion {
  id: string;
  text: string;
  field: string;
  options?: string[];
  required: boolean;
}

export interface Incident {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  buildingId: string;
  address: string;
  category: string | null;
  subcategory: string | null;
  description: string;
  media: MediaItem[];
  severity: Severity;
  confidence: number;
  location: string;
  detectedSignals: string[];
  missingInformation: string[];
  status: IncidentStatus;
  assignedWorker: string | null;
  assignedWorkerName: string | null;
  createdAt: number;
  updatedAt: number;
  inputMode: InputMode;
  fusionResult?: any; // FusionResult из aiEngine.ts
  statusHistory: StatusChange[];
}

export interface MediaItem {
  id: string;
  type: 'image';
  url: string;
  thumbnail?: string;
}

export interface StatusChange {
  from: IncidentStatus | null;
  to: IncidentStatus;
  timestamp: number;
  by: string;
  reason?: string;
}

export interface Master {
  id: string;
  name: string;
  workerType: WorkerType;
  available: boolean;
  currentIncidents: string[];
  rating: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'system' | 'ai';
  content: string;
  timestamp: number;
  media?: MediaItem[];
  incidentId?: string;
  clarificationField?: string;
}

export interface User {
  id: string;
  name: string;
  role: 'RESIDENT' | 'MASTER';
  buildingId?: string;
  address?: string;
}
