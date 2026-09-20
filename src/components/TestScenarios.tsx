import { useState } from 'react';
import { Play, CheckCircle, XCircle, Clock } from 'lucide-react';
import { analyzeText, analyzeImage, fuseResults } from '../data/aiEngine';
import { InputMode, FusionResult } from '../types';

interface TestCase {
  id: string;
  name: string;
  mode: InputMode;
  text?: string;
  imageType?: string;
  expectedResult: string;
  expectedCategory?: string;
  expectedSeverity?: string;
}

const testCases: TestCase[] = [
  // Text only
  { id: 't1', name: 'Течёт труба в подвале', mode: 'TEXT_ONLY', text: 'В подвале течёт труба, уже вся вода на полу', expectedResult: 'KNOWN_INCIDENT', expectedCategory: 'WATER_SUPPLY', expectedSeverity: 'HIGH' },
  { id: 't2', name: 'Грязный подъезд', mode: 'TEXT_ONLY', text: 'В подъезде очень грязно, давно не мыли', expectedResult: 'KNOWN_INCIDENT', expectedCategory: 'CLEANING', expectedSeverity: 'LOW' },
  { id: 't3', name: 'Упало дерево', mode: 'TEXT_ONLY', text: 'Во дворе упало дерево и перекрыло проход', expectedResult: 'KNOWN_INCIDENT', expectedCategory: 'YARD', expectedSeverity: 'HIGH' },
  { id: 't4', name: 'Нет света', mode: 'TEXT_ONLY', text: 'Не работает свет на лестнице, 2 этаж', expectedResult: 'KNOWN_INCIDENT', expectedCategory: 'ELECTRICITY', expectedSeverity: 'MEDIUM' },
  { id: 't5', name: 'Сломана дверь', mode: 'TEXT_ONLY', text: 'Дверь подъезда сломана, не закрывается', expectedResult: 'KNOWN_INCIDENT', expectedCategory: 'DOOR', expectedSeverity: 'MEDIUM' },
  { id: 't6', name: 'Нерелевантный текст', mode: 'TEXT_ONLY', text: 'Привет, как дела?', expectedResult: 'NOT_INCIDENT' },
  { id: 't7', name: 'Пустой текст', mode: 'TEXT_ONLY', text: '', expectedResult: 'NOT_INCIDENT' },
  { id: 't8', name: 'Газ (критично)', mode: 'TEXT_ONLY', text: 'Пахнет газом в подъезде!', expectedResult: 'KNOWN_INCIDENT', expectedSeverity: 'CRITICAL' },
  
  // Image only
  { id: 'i1', name: 'Фото протечки', mode: 'IMAGE_ONLY', imageType: 'протечка', expectedResult: 'KNOWN_INCIDENT', expectedCategory: 'WATER_SUPPLY' },
  { id: 'i2', name: 'Фото грязи', mode: 'IMAGE_ONLY', imageType: 'грязь', expectedResult: 'KNOWN_INCIDENT', expectedCategory: 'CLEANING' },
  { id: 'i3', name: 'Фото дерева', mode: 'IMAGE_ONLY', imageType: 'дерево упало', expectedResult: 'KNOWN_INCIDENT', expectedCategory: 'YARD' },
  { id: 'i4', name: 'Фото двери', mode: 'IMAGE_ONLY', imageType: 'дверь сломана', expectedResult: 'KNOWN_INCIDENT', expectedCategory: 'DOOR' },
  { id: 'i5', name: 'Фото кота', mode: 'IMAGE_ONLY', imageType: 'кот', expectedResult: 'NOT_INCIDENT' },
  { id: 'i6', name: 'Неизвестное повреждение', mode: 'IMAGE_ONLY', imageType: 'повреждение неизвестное', expectedResult: 'OTHER_INCIDENT' },
  
  // Text + Image
  { id: 'ti1', name: 'Текст + фото согласуются', mode: 'TEXT_AND_IMAGE', text: 'Течёт труба', imageType: 'протечка', expectedResult: 'KNOWN_INCIDENT', expectedCategory: 'WATER_SUPPLY' },
  { id: 'ti2', name: 'Текст + фото противоречат', mode: 'TEXT_AND_IMAGE', text: 'Упало дерево', imageType: 'протечка', expectedResult: 'CONFLICT' },
  { id: 'ti3', name: 'Текст + нерелевантное фото', mode: 'TEXT_AND_IMAGE', text: 'Течёт труба в подвале', imageType: 'кот', expectedResult: 'CONFLICT' },
];

export function TestScenarios() {
  const [results, setResults] = useState<Record<string, { result: FusionResult | null; passed: boolean }>>({});
  const [running, setRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  const runTest = async (tc: TestCase) => {
    setCurrentTest(tc.id);
    
    try {
      const textResult = tc.text !== undefined && tc.text !== '' ? await analyzeText(tc.text) : null;
      const visionResult = tc.imageType ? await analyzeImage(tc.imageType) : null;
      const fusion = fuseResults(textResult, visionResult, tc.mode);
      
      let passed = false;
      if (tc.expectedResult === 'KNOWN_INCIDENT') {
        passed = fusion.classificationResult === 'KNOWN_INCIDENT';
        if (tc.expectedCategory && fusion.category !== tc.expectedCategory) passed = false;
      } else if (tc.expectedResult === 'NOT_INCIDENT') {
        passed = fusion.classificationResult === 'NOT_INCIDENT';
      } else if (tc.expectedResult === 'OTHER_INCIDENT') {
        passed = fusion.classificationResult === 'OTHER_INCIDENT';
      } else if (tc.expectedResult === 'CONFLICT') {
        passed = fusion.classificationResult === 'CONFLICT' || fusion.conflictingInformation.length > 0;
      }
      
      setResults(prev => ({ ...prev, [tc.id]: { result: fusion, passed } }));
    } catch {
      setResults(prev => ({ ...prev, [tc.id]: { result: null, passed: false } }));
    }
    
    setCurrentTest(null);
  };

  const runAll = async () => {
    setRunning(true);
    for (const tc of testCases) {
      await runTest(tc);
    }
    setRunning(false);
  };

  const passedCount = Object.values(results).filter(r => r.passed).length;
  const totalCount = Object.keys(results).length;

  return (
    <div className="p-6 overflow-y-auto h-full bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Тестовые сценарии</h2>
          <p className="text-sm text-gray-600">Автоматическая проверка AI-классификации</p>
        </div>
        <button
          onClick={runAll}
          disabled={running}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Play className="w-4 h-4" />
          {running ? 'Выполняется...' : 'Запустить все'}
        </button>
      </div>
      
      {/* Summary */}
      {totalCount > 0 && (
        <div className="bg-white rounded-xl border p-4 mb-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium">Пройдено: {passedCount}/{totalCount}</span>
          </div>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${(passedCount / totalCount) * 100}%` }}
            />
          </div>
          <span className="text-sm text-gray-500">{Math.round((passedCount / totalCount) * 100)}%</span>
        </div>
      )}
      
      {/* Test groups */}
      <div className="space-y-6">
        {/* Text only */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">📝 TEXT ONLY</h3>
          <div className="space-y-2">
            {testCases.filter(t => t.mode === 'TEXT_ONLY').map(tc => (
              <TestRow key={tc.id} tc={tc} result={results[tc.id]} running={currentTest === tc.id} onRun={() => runTest(tc)} />
            ))}
          </div>
        </div>
        
        {/* Image only */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">📷 IMAGE ONLY</h3>
          <div className="space-y-2">
            {testCases.filter(t => t.mode === 'IMAGE_ONLY').map(tc => (
              <TestRow key={tc.id} tc={tc} result={results[tc.id]} running={currentTest === tc.id} onRun={() => runTest(tc)} />
            ))}
          </div>
        </div>
        
        {/* Text + Image */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">📝📷 TEXT + IMAGE</h3>
          <div className="space-y-2">
            {testCases.filter(t => t.mode === 'TEXT_AND_IMAGE').map(tc => (
              <TestRow key={tc.id} tc={tc} result={results[tc.id]} running={currentTest === tc.id} onRun={() => runTest(tc)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TestRow({ tc, result, running, onRun }: { tc: TestCase; result?: { result: FusionResult | null; passed: boolean }; running: boolean; onRun: () => void }) {
  return (
    <div className="bg-white rounded-lg border p-3 flex items-center gap-3">
      <button
        onClick={onRun}
        disabled={running}
        className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 rounded-full w-7 h-7 flex items-center justify-center transition-colors shrink-0"
      >
        {running ? <Clock className="w-3 h-3 text-blue-600 animate-spin" /> : <Play className="w-3 h-3 text-gray-600" />}
      </button>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{tc.name}</p>
        <p className="text-xs text-gray-500 truncate">
          {tc.text && `«${tc.text}»`}
          {tc.imageType && ` [${tc.imageType}]`}
        </p>
      </div>
      
      <div className="text-xs text-gray-500 shrink-0">
        Ожидание: <span className="font-mono font-medium">{tc.expectedResult}</span>
        {tc.expectedCategory && <span className="text-gray-400"> / {tc.expectedCategory}</span>}
      </div>
      
      {result && (
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-mono px-2 py-0.5 rounded ${
            result.result?.classificationResult === tc.expectedResult ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {result.result?.classificationResult || 'ERROR'}
          </span>
          {result.passed ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600" />
          )}
        </div>
      )}
      
      {!result && !running && (
        <span className="text-xs text-gray-400 shrink-0">Не запущен</span>
      )}
    </div>
  );
}
