import { useState, useRef, useEffect } from 'react';
import { Send, Camera, Loader2, CheckCircle, Paperclip } from 'lucide-react';
import { AppStore } from '../store/useStore';
import { analyzeText, analyzeImage, fuseResults } from '../data/aiEngine';
import { getCategoryById, getSubcategoryById, getWorkerTypeName, getSeverityLabel } from '../data/categories';
import { Incident, FusionResult, InputMode } from '../types';
import { mockBuildings } from '../data/mockData';

interface Props {
  store: AppStore;
}

export function ResidentChat({ store }: Props) {
  const [input, setInput] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [selectedImageType, setSelectedImageType] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [incidentDraft, setIncidentDraft] = useState<{
    text?: string;
    imageType?: string;
    fusion?: FusionResult;
    answers: Record<string, string>;
  }>({ answers: {} });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [store.messages]);

  // Уведомления о статусе
  const notifiedIncidents = useRef(new Set<string>());
  
  useEffect(() => {
    const userIncidents = store.incidents.filter(i => i.userId === 'resident-demo');
    for (const inc of userIncidents) {
      if (inc.status === 'ASSIGNED' && !notifiedIncidents.current.has(inc.id + '-assigned')) {
        notifiedIncidents.current.add(inc.id + '-assigned');
        store.addMessage({
          role: 'ai',
          content: `🔔 Мастер ${inc.assignedWorkerName} взял вашу заявку #${inc.id} в работу!`
        });
      }
      if (inc.status === 'IN_PROGRESS' && !notifiedIncidents.current.has(inc.id + '-progress')) {
        notifiedIncidents.current.add(inc.id + '-progress');
        store.addMessage({
          role: 'ai',
          content: `🔧 Мастер ${inc.assignedWorkerName} приступил к работе.`
        });
      }
      if (inc.status === 'RESOLVED' && !notifiedIncidents.current.has(inc.id + '-resolved')) {
        notifiedIncidents.current.add(inc.id + '-resolved');
        store.addMessage({
          role: 'ai',
          content: `✅ Заявка #${inc.id} выполнена! Спасибо за обращение.`
        });
      }
    }
  }, [store.incidents]);

  const handleSend = async () => {
    if (!input.trim() && !showImageInput) return;
    
    const text = input.trim();
    const hasImage = showImageInput && selectedImageType;
    const inputMode: InputMode = hasImage && text ? 'TEXT_AND_IMAGE' : hasImage ? 'IMAGE_ONLY' : 'TEXT_ONLY';
    
    store.addMessage({
      role: 'user',
      content: text || `[Фото: ${selectedImageType}]`,
      media: hasImage ? [{ id: 'img-1', type: 'image', url: '' }] : undefined
    });
    
    setInput('');
    setShowImageInput(false);
    store.setIsProcessing(true);
    
    setTimeout(async () => {
      store.addMessage({
        role: 'ai',
        content: '⏳ Анализирую...'
      });
      
      try {
        const textResult = text ? await analyzeText(text) : null;
        const visionResult = hasImage ? await analyzeImage(selectedImageType) : null;
        const fusion = fuseResults(textResult, visionResult, inputMode);
        
        store.setMessages(prev => prev.filter(m => m.content !== '⏳ Анализирую...'));
        
        if (fusion.classificationResult === 'NOT_INCIDENT') {
          store.addMessage({
            role: 'ai',
            content: '🔍 На фото не удалось обнаружить проблему, связанную с домом.\n\nПопробуйте отправить фото повреждения или опишите проблему.'
          });
          store.setIsProcessing(false);
          return;
        }
        
        if (fusion.classificationResult === 'OTHER_INCIDENT') {
          store.addMessage({
            role: 'ai',
            content: '🔍 Проблема связана с домом, но тип не удалось определить.\n\nОпишите подробнее, что произошло?'
          });
          store.setIsProcessing(false);
          return;
        }
        
        if (fusion.classificationResult === 'CONFLICT') {
          store.addMessage({
            role: 'ai',
            content: '⚠️ Несоответствие между описанием и фото. Уточните, что произошло?'
          });
          store.setIsProcessing(false);
          return;
        }
        
        setIncidentDraft(prev => ({ ...prev, text, imageType: selectedImageType, fusion }));
        
        if (fusion.recommendedQuestions.length > 0 && fusion.classificationResult !== 'KNOWN_INCIDENT') {
          const question = fusion.recommendedQuestions[0];
          store.addMessage({ role: 'ai', content: question.text });
          store.setClarificationStep(0);
          store.setPendingFusion(fusion);
        } else if (fusion.missingInformation.length > 0 && fusion.recommendedQuestions.length > 0) {
          const question = fusion.recommendedQuestions[0];
          store.addMessage({ role: 'ai', content: question.text });
          store.setPendingFusion(fusion);
        } else {
          showConfirmationCard(fusion, text, selectedImageType);
        }
      } catch {
        store.addMessage({
          role: 'ai',
          content: '❌ Ошибка обработки. Попробуйте ещё раз.'
        });
      }
      
      store.setIsProcessing(false);
    }, 300);
  };

  const showConfirmationCard = (fusion: FusionResult, text: string, imageType: string) => {
    const category = fusion.category ? getCategoryById(fusion.category) : null;
    const subcategory = fusion.category && fusion.subcategory ? getSubcategoryById(fusion.category, fusion.subcategory) : null;
    
    const cardContent = `✅ Мы поняли проблему так:

📋 ${category?.name || 'Не определена'}
📍 ${subcategory?.name || 'Не определена'}
⚡ ${getSeverityLabel(fusion.severity)}
🎯 ${Math.round(fusion.confidence * 100)}%
👷 ${getWorkerTypeName(fusion.recommendedWorkerType)}

${fusion.severity === 'CRITICAL' ? '🚨 Критическая ситуация!\n\n' : ''}Подтвердите заявку.`;
    
    store.addMessage({ role: 'ai', content: cardContent });
    store.setPendingFusion(fusion);
  };

  const handleConfirmIncident = () => {
    const fusion = store.pendingFusion;
    if (!fusion) return;
    
    const building = mockBuildings.find(b => b.id === store.selectedBuilding);
    
    const incident: Incident = {
      id: `INC-${String(store.incidents.length + 1).padStart(3, '0')}`,
      timestamp: Date.now(),
      userId: 'resident-demo',
      userName: 'Вы',
      buildingId: store.selectedBuilding,
      address: building?.address || 'ул. Примерная, д. 1',
      category: fusion.category,
      subcategory: fusion.subcategory,
      description: incidentDraft.text || 'По фотографии',
      media: incidentDraft.imageType ? [{ id: 'img-1', type: 'image', url: '' }] : [],
      severity: fusion.severity,
      confidence: fusion.confidence,
      location: incidentDraft.answers.location || 'Не указано',
      detectedSignals: [],
      missingInformation: fusion.missingInformation,
      status: 'AVAILABLE',
      assignedWorker: null,
      assignedWorkerName: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      inputMode: incidentDraft.imageType && incidentDraft.text ? 'TEXT_AND_IMAGE' : incidentDraft.imageType ? 'IMAGE_ONLY' : 'TEXT_ONLY',
      fusionResult: fusion,
      statusHistory: [
        { from: null, to: 'NEW', timestamp: Date.now(), by: 'system' },
        { from: 'NEW', to: 'READY', timestamp: Date.now() + 100, by: 'system' },
        { from: 'READY', to: 'AVAILABLE', timestamp: Date.now() + 200, by: 'system' }
      ]
    };
    
    store.createIncident(incident);
    store.setPendingFusion(null);
    setIncidentDraft({ answers: {} });
    
    store.addMessage({
      role: 'ai',
      content: `✅ Заявка #${incident.id} создана!\n\nОжидайте — мастер возьмёт её в работу.`
    });
  };

  const handleClarificationAnswer = (answer: string) => {
    const fusion = store.pendingFusion;
    if (!fusion) return;
    
    store.addMessage({ role: 'user', content: answer });
    
    const nextStep = store.clarificationStep + 1;
    setIncidentDraft(prev => ({
      ...prev,
      answers: { ...prev.answers, [fusion.recommendedQuestions[store.clarificationStep]?.field || '']: answer }
    }));
    
    if (nextStep < fusion.recommendedQuestions.length) {
      store.setClarificationStep(nextStep);
      setTimeout(() => {
        store.addMessage({ role: 'ai', content: fusion.recommendedQuestions[nextStep].text });
      }, 500);
    } else {
      setTimeout(() => {
        showConfirmationCard(fusion, incidentDraft.text || '', incidentDraft.imageType || '');
      }, 500);
    }
  };

  const quickExamples = [
    { text: 'В подвале течёт труба', icon: '💧' },
    { text: 'Во дворе упало дерево', icon: '🌳' },
    { text: 'Не работает свет', icon: '⚡' },
    { text: 'В подъезде грязно', icon: '🧹' },
    { text: 'Сломана дверь', icon: '🚪' }
  ];

  const showClarificationInput = store.pendingFusion && 
    store.pendingFusion.recommendedQuestions[store.clarificationStep] && 
    !store.pendingFusion.recommendedQuestions[store.clarificationStep].options;

  const showConfirmButtons = store.pendingFusion && 
    store.pendingFusion.classificationResult === 'KNOWN_INCIDENT' && 
    store.pendingFusion.recommendedQuestions.length <= store.clarificationStep && 
    !store.currentIncident;

  return (
    <div className="flex flex-col h-full">
      {/* MAX-style chat header */}
      <div 
        className="shrink-0 border-b px-4 py-3 flex items-center gap-3"
        style={{ 
          background: 'var(--max-background)', 
          borderColor: 'var(--max-border)' 
        }}
      >
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--max-primary)' }}
        >
          <span className="text-white text-lg">🏠</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold truncate" style={{ color: 'var(--max-text-primary)' }}>
            Аварийный диспетчер
          </h2>
          <p className="text-xs truncate" style={{ color: 'var(--max-text-secondary)' }}>
            бот • онлайн
          </p>
        </div>
        <select
          value={store.selectedBuilding}
          onChange={e => store.setSelectedBuilding(e.target.value)}
          className="text-xs rounded-full px-3 py-1.5 border"
          style={{ 
            background: 'var(--max-surface)', 
            borderColor: 'var(--max-border)',
            color: 'var(--max-text-primary)' 
          }}
        >
          {mockBuildings.map(b => (
            <option key={b.id} value={b.id}>{b.address}</option>
          ))}
        </select>
      </div>
      
      {/* Messages area - MAX style */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
        style={{ background: 'var(--max-surface)' }}
      >
        {store.messages.map((msg, idx) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'max-bubble max-bubble-outgoing' : 'max-bubble max-bubble-incoming'}`}>
              <p className="text-sm whitespace-pre-line" style={{ color: 'var(--max-bubble-text)' }}>
                {msg.content}
              </p>
              {msg.media && (
                <div 
                  className="mt-2 rounded-xl h-28 w-36 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.05)' }}
                >
                  <Camera className="w-8 h-8" style={{ color: 'var(--max-text-tertiary)' }} />
                </div>
              )}
              <p 
                className="text-[10px] mt-1 text-right"
                style={{ color: 'var(--max-text-tertiary)' }}
              >
                {new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {/* Confirm buttons */}
        {showConfirmButtons && (
          <div className="flex justify-center gap-2 pt-3 animate-fade-in">
            <button
              onClick={handleConfirmIncident}
              className="max-btn max-btn-primary"
            >
              <CheckCircle className="w-4 h-4" />
              Подтвердить
            </button>
            <button
              onClick={() => {
                store.setPendingFusion(null);
                store.addMessage({
                  role: 'ai',
                  content: 'Заявка отменена. Опишите проблему иначе.'
                });
              }}
              className="max-btn max-btn-secondary"
            >
              Отменить
            </button>
          </div>
        )}
        
        {/* Quick answers */}
        {store.pendingFusion && store.pendingFusion.recommendedQuestions[store.clarificationStep]?.options && (
          <div className="flex flex-wrap gap-2 justify-center pt-2 animate-fade-in">
            {store.pendingFusion.recommendedQuestions[store.clarificationStep].options!.map(opt => (
              <button
                key={opt}
                onClick={() => handleClarificationAnswer(opt)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={{ 
                  background: 'var(--max-background)', 
                  border: '1px solid var(--max-primary)',
                  color: 'var(--max-primary)' 
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Quick examples */}
      {store.messages.length === 1 && (
        <div className="px-4 py-2 shrink-0" style={{ background: 'var(--max-background)', borderTop: '1px solid var(--max-border)' }}>
          <p className="text-xs mb-2 font-medium" style={{ color: 'var(--max-text-secondary)' }}>
            Быстрые примеры
          </p>
          <div className="flex flex-wrap gap-1.5">
            {quickExamples.map(ex => (
              <button
                key={ex.text}
                onClick={() => setInput(ex.text)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{ 
                  background: 'var(--max-surface)', 
                  color: 'var(--max-text-primary)',
                  border: '1px solid var(--max-border)'
                }}
              >
                {ex.icon} {ex.text}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Image selector */}
      {showImageInput && (
        <div className="px-4 py-2 shrink-0" style={{ background: 'var(--max-background)', borderTop: '1px solid var(--max-border)' }}>
          <p className="text-xs mb-2 font-medium" style={{ color: 'var(--max-text-secondary)' }}>
            Выберите тип фото
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'протечка', label: '💧 Протечка' },
              { id: 'грязь', label: '🧹 Грязь' },
              { id: 'дерево упало', label: '🌳 Дерево' },
              { id: 'дверь сломана', label: '🚪 Дверь' },
              { id: 'кот', label: '🐱 Кот' },
              { id: 'повреждение неизвестное', label: '❓ Неизвестное' }
            ].map(img => (
              <button
                key={img.id}
                onClick={() => setSelectedImageType(img.id)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: selectedImageType === img.id ? 'var(--max-primary)' : 'var(--max-surface)',
                  color: selectedImageType === img.id ? 'white' : 'var(--max-text-primary)',
                  border: `1px solid ${selectedImageType === img.id ? 'var(--max-primary)' : 'var(--max-border)'}`
                }}
              >
                {img.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Input area - MAX style */}
      <div 
        className="shrink-0 border-t px-3 py-2"
        style={{ 
          background: 'var(--max-background)', 
          borderColor: 'var(--max-border)' 
        }}
      >
        {showClarificationInput ? (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { handleClarificationAnswer(input); setInput(''); } }}
              placeholder="Введите ответ..."
              className="flex-1 max-input"
            />
            <button
              onClick={() => { if (input.trim()) { handleClarificationAnswer(input); setInput(''); } }}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--max-primary)' }}
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setShowImageInput(!showImageInput)}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all"
              style={{ 
                background: showImageInput ? 'var(--max-primary)' : 'var(--max-surface)',
                color: showImageInput ? 'white' : 'var(--max-text-secondary)'
              }}
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Сообщение..."
              className="flex-1 max-input"
            />
            <button
              onClick={handleSend}
              disabled={store.isProcessing || (!input.trim() && !showImageInput)}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-40"
              style={{ background: 'var(--max-primary)' }}
            >
              {store.isProcessing 
                ? <Loader2 className="w-4 h-4 text-white animate-spin" /> 
                : <Send className="w-4 h-4 text-white" />
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
