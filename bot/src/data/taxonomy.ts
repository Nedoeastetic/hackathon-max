// Таксономия проблем МКД

export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  workerType: string;
  defaultPriority: string;
}

export const categories: Category[] = [
  {
    id: 'WATER_SUPPLY',
    name: 'Водоснабжение',
    icon: '💧',
    subcategories: [
      { id: 'PIPE_LEAK', name: 'Протечка трубы', categoryId: 'WATER_SUPPLY', workerType: 'PLUMBER', defaultPriority: 'HIGH' },
      { id: 'NO_WATER', name: 'Отсутствие воды', categoryId: 'WATER_SUPPLY', workerType: 'PLUMBER', defaultPriority: 'MEDIUM' },
      { id: 'DIRTY_WATER', name: 'Грязная вода', categoryId: 'WATER_SUPPLY', workerType: 'PLUMBER', defaultPriority: 'MEDIUM' }
    ]
  },
  {
    id: 'ELECTRICITY',
    name: 'Электроснабжение',
    icon: '⚡',
    subcategories: [
      { id: 'NO_LIGHT', name: 'Нет света', categoryId: 'ELECTRICITY', workerType: 'ELECTRICIAN', defaultPriority: 'MEDIUM' },
      { id: 'EXPOSED_WIRES', name: 'Обнажённые провода', categoryId: 'ELECTRICITY', workerType: 'ELECTRICIAN', defaultPriority: 'CRITICAL' }
    ]
  },
  {
    id: 'CLEANING',
    name: 'Уборка',
    icon: '🧹',
    subcategories: [
      { id: 'DIRTY_AREA', name: 'Грязная территория', categoryId: 'CLEANING', workerType: 'CLEANER', defaultPriority: 'LOW' }
    ]
  },
  {
    id: 'YARD',
    name: 'Двор и территория',
    icon: '🌳',
    subcategories: [
      { id: 'FALLEN_TREE', name: 'Упавшее дерево', categoryId: 'YARD', workerType: 'LANDSCAPER', defaultPriority: 'HIGH' },
      { id: 'DAMAGED_BENCH', name: 'Повреждённая лавочка', categoryId: 'YARD', workerType: 'MAINTENANCE', defaultPriority: 'LOW' }
    ]
  },
  {
    id: 'DOOR',
    name: 'Двери и замки',
    icon: '🚪',
    subcategories: [
      { id: 'BROKEN_DOOR', name: 'Сломана дверь', categoryId: 'DOOR', workerType: 'LOCKSMITH', defaultPriority: 'MEDIUM' },
      { id: 'BROKEN_LOCK', name: 'Сломан замок', categoryId: 'DOOR', workerType: 'LOCKSMITH', defaultPriority: 'MEDIUM' }
    ]
  },
  {
    id: 'ELEVATOR',
    name: 'Лифт',
    icon: '🛗',
    subcategories: [
      { id: 'ELEVATOR_BROKEN', name: 'Лифт не работает', categoryId: 'ELEVATOR', workerType: 'UNIVERSAL', defaultPriority: 'HIGH' }
    ]
  }
];

export function getCategoryById(id: string): Category | undefined {
  return categories.find(c => c.id === id);
}

export function getSubcategoryById(categoryId: string, subcategoryId: string): Subcategory | undefined {
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
