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
}

const testCases: TestCase[] = [
  { id: 't1', name: 'Течёт труба', mode: 'TEXT_ONLY', text: 'В подвале течёт труба, уже вся вода на полу', expectedResult: 'KNOWN_INCIDENT', expectedCategory: 'WATER_SUPPLY' },
  { id: 't2', name: 'Грязный подъезд', mode: 'TEXT_ONLY', text: 'В подъезде очень грязно, давно не мыли', expectedResult: 'KNOWN_INCIDENT', expectedCategory: 'CLEANING' },
  { id: 't3', name: 'Упало дерево', mode: 'TEXT_ONLY', text: 'Во дворе упало дерево и перекрыло проход', expectedResult: 'KNOWN_INCIDENT', expectedCategory: 'YARD' },
  { id: 't4', name: 'Нет света', mode: 'TEXT_ONLY', text: 'Не работает свет на лестнице, 2 этаж', expectedResult: 'KNOWN_INCIDENT', expectedCategory: 'ELECTRICITY' },
  { id: 't5', name: 'Сломана дверь', mode: 'TEXT_ONLY', text: 'Дверь подъезда сломана, не закрывается', expectedResult: 'KNOWN_INCIDENT', expectedCategory: 'DOOR' },
  { id: 't6', name: 'Нерелевантный', mode: 'TEXT_ONLY', text: 'Привет, как дела?', expectedResult: 'NOT_INCIDENT' },
  { id: 't7', name: 'Пустой текст', mode: 'TEXT_ONLY', text: '', expectedResult: 'NOT_INCIDENT' },
  { id: 't8', name: 'Газ (критично)', mode: 'TEXT_ONLY', text: 'Пахнет газом в подъезде!', expectedResult: 'KNOWN_INCIDENT' },
  { id: 'i1', name: 'Фото протечки', mode: 'IMAGE_ONLY', imageType: 'протечка', expectedResult: 'KNOWN_INCIDENT', expectedCategory: 'WATER_SUPPLY' },
  { id: 'i2', name: 'Фото грязи', mode: 'IMAGE_ONLY', imageType: 'грязь', expectedResult: 'KNOWN_INCIDENT', expectedCategory: 'CLEANING' },
  { id: 'i3', name: 'Фото дерева', mode: 'IMAGE_ONLY', imageType: 'дерево упало', expectedResult: 'KNOWN_INCIDENT', expectedCategory: 'YARD' },
  { id: 'i4', name: 'Фото двери', mode: 'IMAGE_ONLY', imageType: 'дверь сломана', expectedResult: 'KNOWN_INCIDENT', expectedCategory: 'DOOR' },
  { id: 'i5', name: 'Фото кота', mode: 'IMAGE_ONLY', imageType: 'кот', expectedResult: 'NOT_INCIDENT' },
  { id: 'i6', name: 'Неизвестное', mode: 'IMAGE_ONLY', imageType: 'повреждение неизвестное', expectedResult: 'OTHER_INCIDENT' },
  { id: 'ti1', name: 'Текст + фото', mode: 'TEXT_AND_IMAGE', text: 'Течёт труба', imageType: 'протечка', expectedResult: 'KNOWN_INCIDENT', expectedCategory: 'WATER_SUPPLY' },
  { id: 'ti2', name: 'Противоречие', mode: 'TEXT_AND_IMAGE', text: 'Упало дерево', imageType: 'протечка', expectedResult: 'CONFLICT' },
  { id: 'ti3', name: 'Нерелевантное фото', mode: 'TEXT_AND_IMAGE', text: 'Течёт труба в подвале', imageType: 'кот', expectedResult: 'CONFLICT' },
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
    <div className="p-4 overflow-y-auto h-full space-y-3" style={{ background: 'var(--max-surface)' }}>
      <div className="max-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--max-text-primary)' }}>Тестовые сценарии</h2>
            <p className="text-xs" style={{ color: 'var(--max-text-secondary)' }}>Проверка AI-классификации</p>
          </div>
          <button
            onClick={runAll}
            disabled={running}
            className="max-btn max-btn-primary text-xs"
          >
            <Play className="w-3 h-3" />
            {running ? 'Выполняется...' : 'Запустить все'}
          </button>
        </div>
        
        {totalCount > 0 && (
          <div className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'var(--max-surface)' }}>
            <CheckCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--max-success)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--max-text-primary)' }}>
              {passedCount}/{totalCount}
            </span>
            <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--max-border)' }}>
              <div 
                className="h-1.5 rounded-full transition-all"
                style={{ 
                  width: `${(passedCount / totalCount) * 100}%`,
                  background: 'var(--max-success)' 
                }}
              />
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--max-text-secondary)' }}>
              {Math.round((passedCount / totalCount) * 100)}%
            </span>
          </div>
        )}
      </div>
      
      {/* Text only */}
      <div className="max-card p-3">
        <h3 className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--max-text-secondary)' }}>
          📝 TEXT ONLY
        </h3>
        <div className="space-y-1.5">
          {testCases.filter(t => t.mode === 'TEXT_ONLY').map(tc => (
            <TestRow key={tc.id} tc={tc} result={results[tc.id]} running={currentTest === tc.id} onRun={() => runTest(tc)} />
          ))}
        </div>
      </div>
      
      {/* Image only */}
      <div className="max-card p-3">
        <h3 className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--max-text-secondary)' }}>
          📷 IMAGE ONLY
        </h3>
        <div className="space-y-1.5">
          {testCases.filter(t => t.mode === 'IMAGE_ONLY').map(tc => (
            <TestRow key={tc.id} tc={tc} result={results[tc.id]} running={currentTest === tc.id} onRun={() => runTest(tc)} />
          ))}
        </div>
      </div>
      
      {/* Text + Image */}
      <div className="max-card p-3">
        <h3 className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--max-text-secondary)' }}>
          📝📷 TEXT + IMAGE
        </h3>
        <div className="space-y-1.5">
          {testCases.filter(t => t.mode === 'TEXT_AND_IMAGE').map(tc => (
            <TestRow key={tc.id} tc={tc} result={results[tc.id]} running={currentTest === tc.id} onRun={() => runTest(tc)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TestRow({ tc, result, running, onRun }: { tc: TestCase; result?: { result: FusionResult | null; passed: boolean }; running: boolean; onRun: () => void }) {
  return (
    <div 
      className="flex items-center gap-2 p-2 rounded-xl transition-all"
      style={{ background: 'var(--max-surface)' }}
    >
      <button
        onClick={onRun}
        disabled={running}
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all"
        style={{ 
          background: running ? 'var(--max-primary-light)' : 'var(--max-background)',
          border: `1px solid ${running ? 'var(--max-primary)' : 'var(--max-border)'}`
        }}
      >
        {running ? <Clock className="w-3 h-3 animate-spin" style={{ color: 'var(--max-primary)' }} /> : <Play className="w-3 h-3" style={{ color: 'var(--max-text-secondary)' }} />}
      </button>
      
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: 'var(--max-text-primary)' }}>{tc.name}</p>
        <p className="text-[10px] truncate" style={{ color: 'var(--max-text-tertiary)' }}>
          {tc.text && `«${tc.text}»`}
          {tc.imageType && `[${tc.imageType}]`}
        </p>
      </div>
      
      {result && (
        <div className="flex items-center gap-1.5 shrink-0">
          <span 
            className="text-[10px] font-mono px-1.5 py-0.5 rounded-lg"
            style={{ 
              background: result.result?.classificationResult === tc.expectedResult ? '#E6F9E6' : '#FFE6E6',
              color: result.result?.classificationResult === tc.expectedResult ? 'var(--max-success)' : 'var(--max-error)'
            }}
          >
            {result.result?.classificationResult || 'ERROR'}
          </span>
          {result.passed ? (
            <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--max-success)' }} />
          ) : (
            <XCircle className="w-3.5 h-3.5" style={{ color: 'var(--max-error)' }} />
          )}
        </div>
      )}
      
      {!result && !running && (
        <span className="text-[10px] shrink-0" style={{ color: 'var(--max-text-tertiary)' }}>—</span>
      )}
    </div>
  );
}
