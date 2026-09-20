import { Master, Incident } from '../types';

export const mockMasters: Master[] = [
  {
    id: 'master-1',
    name: 'Иванов А.С.',
    workerType: 'PLUMBER',
    available: true,
    currentIncidents: [],
    rating: 4.8
  },
  {
    id: 'master-2',
    name: 'Петров В.М.',
    workerType: 'ELECTRICIAN',
    available: true,
    currentIncidents: [],
    rating: 4.6
  },
  {
    id: 'master-3',
    name: 'Сидоров К.Н.',
    workerType: 'CLEANER',
    available: true,
    currentIncidents: [],
    rating: 4.9
  },
  {
    id: 'master-4',
    name: 'Козлов Д.А.',
    workerType: 'LOCKSMITH',
    available: true,
    currentIncidents: [],
    rating: 4.5
  },
  {
    id: 'master-5',
    name: 'Морозов И.П.',
    workerType: 'LANDSCAPER',
    available: true,
    currentIncidents: [],
    rating: 4.7
  },
  {
    id: 'master-6',
    name: 'Волков С.Г.',
    workerType: 'MAINTENANCE',
    available: true,
    currentIncidents: [],
    rating: 4.4
  },
  {
    id: 'master-7',
    name: 'Новиков Р.Т.',
    workerType: 'UNIVERSAL',
    available: true,
    currentIncidents: [],
    rating: 4.3
  }
];

export const mockBuildings = [
  {
    id: 'building-1',
    address: 'ул. Ленина, д. 42',
    floors: 9,
    apartments: 72
  },
  {
    id: 'building-2',
    address: 'пр. Мира, д. 15',
    floors: 5,
    apartments: 40
  },
  {
    id: 'building-3',
    address: 'ул. Садовая, д. 7',
    floors: 12,
    apartments: 96
  }
];

export const existingIncidents: Incident[] = [
  {
    id: 'INC-001',
    timestamp: Date.now() - 3600000,
    userId: 'user-demo-1',
    userName: 'Мария К.',
    buildingId: 'building-1',
    address: 'ул. Ленина, д. 42',
    category: 'ELECTRICITY',
    subcategory: 'NO_LIGHT_STAIRWELL',
    description: 'Не горит свет на 3 этаже, 2 подъезд',
    media: [],
    severity: 'MEDIUM',
    confidence: 0.92,
    location: 'Подъезд 2, этаж 3',
    detectedSignals: ['свет', 'лестница', 'не горит'],
    missingInformation: [],
    status: 'AVAILABLE',
    assignedWorker: null,
    assignedWorkerName: null,
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
    inputMode: 'TEXT_ONLY',
    statusHistory: [
      { from: null, to: 'NEW', timestamp: Date.now() - 3600000, by: 'system' },
      { from: 'NEW', to: 'READY', timestamp: Date.now() - 3500000, by: 'system' },
      { from: 'READY', to: 'AVAILABLE', timestamp: Date.now() - 3400000, by: 'system' }
    ]
  },
  {
    id: 'INC-002',
    timestamp: Date.now() - 7200000,
    userId: 'user-demo-2',
    userName: 'Алексей П.',
    buildingId: 'building-2',
    address: 'пр. Мира, д. 15',
    category: 'CLEANING',
    subcategory: 'DIRTY_STAIRWELL',
    description: 'В подъезде очень грязно, давно не мыли',
    media: [],
    severity: 'LOW',
    confidence: 0.88,
    location: 'Подъезд 1',
    detectedSignals: ['грязь', 'подъезд', 'уборка'],
    missingInformation: [],
    status: 'IN_PROGRESS',
    assignedWorker: 'master-3',
    assignedWorkerName: 'Сидоров К.Н.',
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 5400000,
    inputMode: 'TEXT_ONLY',
    statusHistory: [
      { from: null, to: 'NEW', timestamp: Date.now() - 7200000, by: 'system' },
      { from: 'NEW', to: 'READY', timestamp: Date.now() - 7100000, by: 'system' },
      { from: 'READY', to: 'AVAILABLE', timestamp: Date.now() - 7000000, by: 'system' },
      { from: 'AVAILABLE', to: 'ASSIGNED', timestamp: Date.now() - 6000000, by: 'Сидоров К.Н.' },
      { from: 'ASSIGNED', to: 'IN_PROGRESS', timestamp: Date.now() - 5400000, by: 'Сидоров К.Н.' }
    ]
  }
];
