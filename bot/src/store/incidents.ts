// Хранилище заявок (в памяти, для MVP)

export interface Incident {
  id: string;
  userId: string;
  userName: string;
  category: string | null;
  subcategory: string | null;
  description: string;
  severity: string;
  confidence: number;
  status: string;
  recommendedWorkerType: string;
  assignedWorker?: string;
  createdAt: number;
  updatedAt?: number;
  // Fusion metadata (API v2.1)
  fusionLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  fusionReason?: string;
  needsReview?: boolean;
  modelVersions?: { cv?: string; text?: string };
}

export class IncidentStore {
  private incidents: Map<string, Incident> = new Map();

  create(incident: Incident): void {
    this.incidents.set(incident.id, incident);
    console.log(`✅ Заявка создана: ${incident.id} (${incident.category})`);
  }

  getById(id: string): Incident | undefined {
    return this.incidents.get(id);
  }

  getByUser(userId: string): Incident[] {
    return Array.from(this.incidents.values())
      .filter(inc => inc.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getAvailable(): Incident[] {
    return Array.from(this.incidents.values())
      .filter(inc => inc.status === 'AVAILABLE')
      .sort((a, b) => {
        // Приоритет: CRITICAL > HIGH > MEDIUM > LOW
        const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return (priorityOrder[a.severity as keyof typeof priorityOrder] || 3) - 
               (priorityOrder[b.severity as keyof typeof priorityOrder] || 3);
      });
  }

  updateStatus(id: string, status: string, assignedWorker?: string): void {
    const incident = this.incidents.get(id);
    if (incident) {
      incident.status = status;
      incident.updatedAt = Date.now();
      if (assignedWorker) {
        incident.assignedWorker = assignedWorker;
      }
      console.log(`📝 Статус заявки ${id}: ${status}`);
    }
  }

  count(): number {
    return this.incidents.size;
  }

  getAll(): Incident[] {
    return Array.from(this.incidents.values());
  }
}
