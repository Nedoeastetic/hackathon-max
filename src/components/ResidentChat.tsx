import { useState, useRef, useEffect } from 'react';
import { Send, Camera, Loader2, CheckCircle } from 'lucide-react';
import { AppStore } from '../store/useStore';
import { analyzeText, analyzeImage, fuseResults } from '../data/aiEngine';
import { getCategoryById, getSubcategoryById, getWorkerTypeName, getSeverityLabel } from '../data/categories';
import { Incident, FusionResult, InputMode } from '../types';
import { mockBuildings } from '../data/mockData';

// Track which incidents we've already notified about
const notifiedIncidents = new Set<string>();

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

  // Notify user when master takes their incident
  useEffect(() => {
    const userIncidents = store.incidents.filter(i => i.userId === 'resident-demo');
    for (const inc of userIncidents) {
      if (inc.status === 'ASSIGNED' && !notifiedIncidents.has(inc.id + '-assigned')) {
        notifiedIncidents.add(inc.id + '-assigned');
        store.addMessage({
          role: 'ai',
          content: `🔔 Мастер ${inc.assignedWorkerName} взял вашу заявку #${inc.id} в работу!\n\nКатегория: ${getCategoryById(inc.category || '')?.name || ''}\nОжидайте выполнения.`
        });
      }
      if (inc.status === 'IN_PROGRESS' && !notifiedIncidents.has(inc.id + '-progress')) {
        notifiedIncidents.add(inc.id + '-progress');
        store.addMessage({
          role: 'ai',
          content: `🔧 Мастер ${inc.assignedWorkerName} приступил к работе над заявкой #${inc.id}.`
        });
      }
      if (inc.status === 'RESOLVED' && !notifiedIncidents.has(inc.id + '-resolved')) {
        notifiedIncidents.add(inc.id + '-resolved');
        store.addMessage({
          role: 'ai',
          content: `✅ Заявка #${inc.id} выполнена!\n\nМастер ${inc.assignedWorkerName} устранил проблему.\n\nСпасибо за обращение!`
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
        content: '⏳ Анализирую ваше обращение...'
      });
      
      try {
        const textResult = text ? await analyzeText(text) : null;
        const visionResult = hasImage ? await analyzeImage(selectedImageType) : null;
        const fusion = fuseResults(textResult, visionResult, inputMode);
        
        store.setMessages(prev => prev.filter(m => m.content !== '⏳ Анализирую ваше обращение...'));
        
        if (fusion.classificationResult === 'NOT_INCIDENT') {
          store.addMessage({
            role: 'ai',
            content: '🔍 На фотографии не удалось обнаружить проблему, связанную с содержанием дома.\n\nПопробуйте отправить фотографию повреждения или кратко опишите проблему текстом.'
          });
          store.setIsProcessing(false);
          return;
        }
        
        if (fusion.classificationResult === 'OTHER_INCIDENT') {
          store.addMessage({
            role: 'ai',
            content: '🔍 Похоже, проблема связана с домом, но её тип пока не удалось определить с высокой уверенностью.\n\nПожалуйста, опишите подробнее, что произошло?'
          });
          store.setIsProcessing(false);
          return;
        }
        
        if (fusion.classificationResult === 'CONFLICT') {
          store.addMessage({
            role: 'ai',
            content: '⚠️ Мы заметили несоответствие между описанием и фотографией. Уточните, пожалуйста, что именно произошло?'
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
          content: '❌ Произошла ошибка при обработке. Попробуйте ещё раз.'
        });
      }
      
      store.setIsProcessing(false);
    }, 300);
  };

  const showConfirmationCard = (fusion: FusionResult, text: string, imageType: string) => {
    const category = fusion.category ? getCategoryById(fusion.category) : null;
    const subcategory = fusion.category && fusion.subcategory ? getSubcategoryById(fusion.category, fusion.subcategory) : null;
    
    const cardContent = `✅ Мы поняли проблему так:

📋 Категория: ${category?.name || 'Не определена'}
📍 Подкатегория: ${subcategory?.name || 'Не определена'}
⚡ Предварительная срочность: ${getSeverityLabel(fusion.severity)}
🎯 Уверенность AI: ${Math.round(fusion.confidence * 100)}%
👷 Рекомендуемый исполнитель: ${getWorkerTypeName(fusion.recommendedWorkerType)}
📝 Описание: "${text || 'По фотографии'}"

${fusion.severity === 'CRITICAL' ? '🚨 ВНИМАНИЕ: Обнаружены признаки критической ситуации!' : ''}

Подтвердите заявку для отправки исполнителю.`;
    
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
      userName: 'Вы (демо)',
      buildingId: store.selectedBuilding,
      address: building?.address || 'ул. Примерная, д. 1',
      category: fusion.category,
      subcategory: fusion.subcategory,
      description: incidentDraft.text || 'Описание по фотографии',
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
      content: `✅ Заявка #${incident.id} создана и отправлена исполнителям!\n\nОжидайте — свободный мастер возьмёт её в работу. Перейдите на вкладку «Мастер» чтобы увидеть заявку в очереди.`
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
    { text: 'Не работает свет на лестнице', icon: '⚡' },
    { text: 'В подъезде очень грязно', icon: '🧹' },
    { text: 'Сломана входная дверь', icon: '🚪' }
  ];

  const showClarificationInput = store.pendingFusion && 
    store.pendingFusion.recommendedQuestions[store.clarificationStep] && 
    !store.pendingFusion.recommendedQuestions[store.clarificationStep].options;

  const showConfirmButtons = store.pendingFusion && 
    store.pendingFusion.classificationResult === 'KNOWN_INCIDENT' && 
    store.pendingFusion.recommendedQuestions.length <= store.clarificationStep && 
    !store.currentIncident;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-lg">🏠</span>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Аварийный диспетчер</h2>
          <p className="text-xs text-gray-500">MAX • Онлайн</p>
        </div>
        <div className="ml-auto">
          <select
            value={store.selectedBuilding}
            onChange={e => store.setSelectedBuilding(e.target.value)}
            className="text-xs border rounded px-2 py-1 bg-white"
          >
            {mockBuildings.map(b => (
              <option key={b.id} value={b.id}>{b.address}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {store.messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : msg.content.includes('✅') 
                  ? 'bg-green-50 border border-green-200 text-gray-800' 
                  : msg.content.includes('🔍') || msg.content.includes('⚠️')
                    ? 'bg-yellow-50 border border-yellow-200 text-gray-800'
                    : msg.content.includes('❌')
                      ? 'bg-red-50 border border-red-200 text-gray-800'
                      : 'bg-white border border-gray-200 text-gray-800'
            }`}>
              <p className="text-sm whitespace-pre-line">{msg.content}</p>
              {msg.media && (
                <div className="mt-2 bg-gray-200 rounded-lg h-24 w-32 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        ))}
        
        {showConfirmButtons && (
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={handleConfirmIncident}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Подтвердить заявку
            </button>
            <button
              onClick={() => {
                store.setPendingFusion(null);
                store.addMessage({
                  role: 'ai',
                  content: 'Заявка отменена. Опишите проблему иначе, если хотите попробовать снова.'
                });
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Отменить
            </button>
          </div>
        )}
        
        {store.pendingFusion && store.pendingFusion.recommendedQuestions[store.clarificationStep]?.options && (
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {store.pendingFusion.recommendedQuestions[store.clarificationStep].options!.map(opt => (
              <button
                key={opt}
                onClick={() => handleClarificationAnswer(opt)}
                className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full text-sm transition-colors"
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
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-500 mb-2">Быстрые примеры:</p>
          <div className="flex flex-wrap gap-2">
            {quickExamples.map(ex => (
              <button
                key={ex.text}
                onClick={() => setInput(ex.text)}
                className="bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 px-3 py-1.5 rounded-full text-xs text-gray-700 transition-colors"
              >
                {ex.icon} {ex.text}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Image selector */}
      {showImageInput && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-500 mb-2">Выберите тип фото для демо:</p>
          <div className="flex flex-wrap gap-2">
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
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  selectedImageType === img.id 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                }`}
              >
                {img.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Input area */}
      <div className="bg-white border-t p-3">
        {showClarificationInput && (
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { handleClarificationAnswer(input); setInput(''); } }}
              placeholder="Введите ответ..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => { if (input.trim()) { handleClarificationAnswer(input); setInput(''); } }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {!showClarificationInput && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowImageInput(!showImageInput)}
              className={`rounded-full w-9 h-9 flex items-center justify-center transition-colors ${
                showImageInput ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Опишите проблему или отправьте фото..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSend}
              disabled={store.isProcessing || (!input.trim() && !showImageInput)}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors"
            >
              {store.isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
