import { Category } from '../types';

export const categories: Category[] = [
  {
    id: 'WATER_SUPPLY',
    name: 'Водоснабжение',
    icon: '💧',
    defaultWorker: 'PLUMBER',
    defaultPriority: 'HIGH',
    subcategories: [
      {
        id: 'PIPE_LEAK',
        name: 'Протечка трубы',
        categoryId: 'WATER_SUPPLY',
        workerType: 'PLUMBER',
        defaultPriority: 'HIGH',
        safetySignals: ['вода', 'протечка', 'затопление', 'лужа']
      },
      {
        id: 'NO_WATER',
        name: 'Отсутствие воды',
        categoryId: 'WATER_SUPPLY',
        workerType: 'PLUMBER',
        defaultPriority: 'MEDIUM',
        safetySignals: []
      },
      {
        id: 'DIRTY_WATER',
        name: 'Грязная вода',
        categoryId: 'WATER_SUPPLY',
        workerType: 'PLUMBER',
        defaultPriority: 'MEDIUM',
        safetySignals: []
      },
      {
        id: 'LOW_PRESSURE',
        name: 'Низкое давление',
        categoryId: 'WATER_SUPPLY',
        workerType: 'PLUMBER',
        defaultPriority: 'LOW',
        safetySignals: []
      }
    ]
  },
  {
    id: 'ELECTRICITY',
    name: 'Электроснабжение',
    icon: '⚡',
    defaultWorker: 'ELECTRICIAN',
    defaultPriority: 'HIGH',
    subcategories: [
      {
        id: 'NO_LIGHT_STAIRWELL',
        name: 'Нет света на лестнице',
        categoryId: 'ELECTRICITY',
        workerType: 'ELECTRICIAN',
        defaultPriority: 'MEDIUM',
        safetySignals: []
      },
      {
        id: 'EXPOSED_WIRES',
        name: 'Обнажённые провода',
        categoryId: 'ELECTRICITY',
        workerType: 'ELECTRICIAN',
        defaultPriority: 'CRITICAL',
        safetySignals: ['провода', 'электричество', 'искра', 'опасность']
      },
      {
        id: 'ELECTRICAL_PANEL',
        name: 'Проблема с щитком',
        categoryId: 'ELECTRICITY',
        workerType: 'ELECTRICIAN',
        defaultPriority: 'HIGH',
        safetySignals: ['щиток', 'автомат', 'пробка']
      }
    ]
  },
  {
    id: 'HEATING',
    name: 'Отопление',
    icon: '🔥',
    defaultWorker: 'PLUMBER',
    defaultPriority: 'MEDIUM',
    subcategories: [
      {
        id: 'NO_HEATING',
        name: 'Нет отопления',
        categoryId: 'HEATING',
        workerType: 'PLUMBER',
        defaultPriority: 'HIGH',
        safetySignals: []
      },
      {
        id: 'RADIATOR_LEAK',
        name: 'Протечка батареи',
        categoryId: 'HEATING',
        workerType: 'PLUMBER',
        defaultPriority: 'HIGH',
        safetySignals: ['батарея', 'радиатор', 'горячая вода']
      },
      {
        id: 'LOW_TEMPERATURE',
        name: 'Низкая температура',
        categoryId: 'HEATING',
        workerType: 'PLUMBER',
        defaultPriority: 'MEDIUM',
        safetySignals: []
      }
    ]
  },
  {
    id: 'CLEANING',
    name: 'Уборка',
    icon: '🧹',
    defaultWorker: 'CLEANER',
    defaultPriority: 'LOW',
    subcategories: [
      {
        id: 'DIRTY_STAIRWELL',
        name: 'Грязный подъезд',
        categoryId: 'CLEANING',
        workerType: 'CLEANER',
        defaultPriority: 'LOW',
        safetySignals: []
      },
      {
        id: 'DIRTY_ENTRANCE',
        name: 'Грязь у входа',
        categoryId: 'CLEANING',
        workerType: 'CLEANER',
        defaultPriority: 'LOW',
        safetySignals: []
      },
      {
        id: 'TRASH_OVERFLOW',
        name: 'Переполненный мусор',
        categoryId: 'CLEANING',
        workerType: 'CLEANER',
        defaultPriority: 'MEDIUM',
        safetySignals: ['мусор', 'отходы', 'запах']
      }
    ]
  },
  {
    id: 'YARD',
    name: 'Двор и территория',
    icon: '🌳',
    defaultWorker: 'LANDSCAPER',
    defaultPriority: 'MEDIUM',
    subcategories: [
      {
        id: 'FALLEN_TREE',
        name: 'Упавшее дерево',
        categoryId: 'YARD',
        workerType: 'LANDSCAPER',
        defaultPriority: 'HIGH',
        safetySignals: ['дерево', 'препятствие', 'проход']
      },
      {
        id: 'DAMAGED_BENCH',
        name: 'Повреждённая лавочка',
        categoryId: 'YARD',
        workerType: 'MAINTENANCE',
        defaultPriority: 'LOW',
        safetySignals: []
      },
      {
        id: 'DAMAGED_PLAYGROUND',
        name: 'Повреждение детской площадки',
        categoryId: 'YARD',
        workerType: 'MAINTENANCE',
        defaultPriority: 'HIGH',
        safetySignals: ['площадка', 'дети', 'опасность']
      },
      {
        id: 'ROAD_DAMAGE',
        name: 'Повреждение покрытия',
        categoryId: 'YARD',
        workerType: 'MAINTENANCE',
        defaultPriority: 'MEDIUM',
        safetySignals: []
      }
    ]
  },
  {
    id: 'DOOR',
    name: 'Двери и замки',
    icon: '🚪',
    defaultWorker: 'LOCKSMITH',
    defaultPriority: 'MEDIUM',
    subcategories: [
      {
        id: 'BROKEN_ENTRY_DOOR',
        name: 'Сломана входная дверь',
        categoryId: 'DOOR',
        workerType: 'LOCKSMITH',
        defaultPriority: 'MEDIUM',
        safetySignals: ['дверь', 'замок', 'не закрывается']
      },
      {
        id: 'BROKEN_LOCK',
        name: 'Сломан замок',
        categoryId: 'DOOR',
        workerType: 'LOCKSMITH',
        defaultPriority: 'MEDIUM',
        safetySignals: ['замок', 'ключ', 'не открывается']
      },
      {
        id: 'BROKEN_INTERCOM',
        name: 'Не работает домофон',
        categoryId: 'DOOR',
        workerType: 'ELECTRICIAN',
        defaultPriority: 'LOW',
        safetySignals: []
      }
    ]
  },
  {
    id: 'ELEVATOR',
    name: 'Лифт',
    icon: '🛗',
    defaultWorker: 'UNIVERSAL',
    defaultPriority: 'HIGH',
    subcategories: [
      {
        id: 'ELEVATOR_NOT_WORKING',
        name: 'Лифт не работает',
        categoryId: 'ELEVATOR',
        workerType: 'UNIVERSAL',
        defaultPriority: 'HIGH',
        safetySignals: ['лифт', 'застрял', 'не едет']
      },
      {
        id: 'ELEVATOR_NOISE',
        name: 'Шум/стуки в лифте',
        categoryId: 'ELEVATOR',
        workerType: 'UNIVERSAL',
        defaultPriority: 'MEDIUM',
        safetySignals: []
      }
    ]
  },
  {
    id: 'ROOF',
    name: 'Крыша',
    icon: '🏠',
    defaultWorker: 'MAINTENANCE',
    defaultPriority: 'MEDIUM',
    subcategories: [
      {
        id: 'ROOF_LEAK',
        name: 'Протечка крыши',
        categoryId: 'ROOF',
        workerType: 'MAINTENANCE',
        defaultPriority: 'HIGH',
        safetySignals: ['крыша', 'потолок', 'протечка сверху']
      },
      {
        id: 'DAMAGED_ROOF',
        name: 'Повреждение кровли',
        categoryId: 'ROOF',
        workerType: 'MAINTENANCE',
        defaultPriority: 'MEDIUM',
        safetySignals: []
      }
    ]
  }
];

export function getCategoryById(id: string): Category | undefined {
  return categories.find(c => c.id === id);
}

export function getSubcategoryById(categoryId: string, subcategoryId: string) {
  const category = getCategoryById(categoryId);
  return category?.subcategories.find(s => s.id === subcategoryId);
}

export function getWorkerTypeName(type: string): string {
  const names: Record<string, string> = {
    PLUMBER: 'Сантехник',
    ELECTRICIAN: 'Электрик',
    CLEANER: 'Уборщик',
    MAINTENANCE: 'Специалист по обслуживанию',
    LOCKSMITH: 'Слесарь',
    LANDSCAPER: 'Специалист по благоустройству',
    UNIVERSAL: 'Универсальный мастер',
    DISPATCHER: 'Диспетчер'
  };
  return names[type] || type;
}

export function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    LOW: 'Низкий',
    MEDIUM: 'Средний',
    HIGH: 'Высокий',
    CRITICAL: 'Критический'
  };
  return labels[severity] || severity;
}

export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    LOW: 'bg-green-100 text-green-800 border-green-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
    CRITICAL: 'bg-red-100 text-red-800 border-red-200'
  };
  return colors[severity] || 'bg-gray-100 text-gray-800';
}
