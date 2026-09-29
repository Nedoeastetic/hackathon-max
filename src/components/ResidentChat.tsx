import { useState, useRef, useEffect } from 'react';
import { Send, Camera, Loader2, CheckCircle, X, Edit } from 'lucide-react';
import { AppStore } from '../store/useStore';
import { analyzeText, analyzeImage, analyzeTextReal, analyzeImageReal, checkMLHealth, fuseResults, FusionResult } from '../data/aiEngine';
import { categories, getCategoryById, getSubcategoryById, getWorkerTypeName, getSeverityLabel } from '../data/categories';
import type { Incident, InputMode } from '../types';
import { mockBuildings } from '../data/mockData';

interface Props {
  store: AppStore;
}

export function ResidentChat({ store }: Props) {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showDemoMode, setShowDemoMode] = useState(false);
  const [selectedImageType, setSelectedImageType] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCategory, setEditCategory] = useState<string>('');
  const [editSubcategory, setEditSubcategory] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [mlApiAvailable, setMlApiAvailable] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [incidentDraft, setIncidentDraft] = useState<{
    text?: string;
    imageFile?: File;
    imageType?: string;
    fusion?: FusionResult;
    answers: Record<string, string>;
  }>({ answers: {} });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [store.messages]);

  // Проверка доступности ML API
  useEffect(() => {
    checkMLHealth().then(available => {
      setMlApiAvailable(available);
      console.log(available ? '✅ ML API доступен' : '⚠️ ML API недоступен, используется локальная симуляция');
    });
  }, []);

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const menu = document.getElementById('photo-menu');
      if (menu && !menu.contains(e.target as Node) && !(e.target as Element).closest('button')) {
        menu.style.display = 'none';
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  // Обработка выбора файла
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Создаём превью
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Удалить выбранное фото
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Открыть диалог выбора файла
  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Открыть модальное окно редактирования
  const handleOpenEditModal = () => {
    if (!store.pendingFusion) return;
    
    setEditCategory(store.pendingFusion.category || '');
    setEditSubcategory(store.pendingFusion.subcategory || '');
    setEditDescription(incidentDraft.text || '');
    setShowEditModal(true);
  };

  // Сохранить изменения из модального окна
  const handleSaveEdit = () => {
    if (!store.pendingFusion) return;
    
    const updatedFusion: FusionResult = {
      ...store.pendingFusion,
      category: editCategory || null,
      subcategory: editSubcategory || null,
    };
    
    // Определяем тип исполнителя на основе новой категории
    if (editCategory) {
      const category = getCategoryById(editCategory);
      if (category) {
        updatedFusion.recommendedWorkerType = category.defaultWorker;
      }
    }
    
    store.setPendingFusion(updatedFusion);
    setIncidentDraft(prev => ({ ...prev, text: editDescription }));
    setShowEditModal(false);
    
    // Показываем обновлённую карточку
    const category = editCategory ? getCategoryById(editCategory) : null;
    const subcategory = editCategory && editSubcategory ? getSubcategoryById(editCategory, editSubcategory) : null;
    
    store.addMessage({
      role: 'ai',
      content: `✏️ Заявка обновлена:\n\n📋 ${category?.name || 'Не определена'}\n📍 ${subcategory?.name || 'Не определена'}\n👷 ${getWorkerTypeName(updatedFusion.recommendedWorkerType)}\n\nПодтвердите заявку.`
    });
  };

  const handleSend = async () => {
    const text = input.trim();
    const hasFile = !!selectedFile;
    const hasDemoImage = showDemoMode && selectedImageType;
    
    if (!text && !hasFile && !hasDemoImage) return;
    
    const inputMode: InputMode = (hasFile || hasDemoImage) && text ? 'TEXT_AND_IMAGE' : (hasFile || hasDemoImage) ? 'IMAGE_ONLY' : 'TEXT_ONLY';
    
    // Добавляем сообщение пользователя
    const messageContent = text || (hasDemoImage ? `[Демо: ${selectedImageType}]` : '[Фото]');
    store.addMessage({
      role: 'user',
      content: messageContent,
      media: (hasFile || hasDemoImage) ? [{ id: 'img-1', type: 'image', url: imagePreview || '' }] : undefined
    });
    
    setInput('');
    setSelectedFile(null);
    setImagePreview(null);
    setShowDemoMode(false);
    setSelectedImageType('');
    store.setClarificationStep(0);
    setIncidentDraft({ answers: {} });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    store.setIsProcessing(true);
    
    setTimeout(async () => {
      store.addMessage({
        role: 'ai',
        content: '⏳ Анализирую...'
      });
      
      try {
        // Проверяем доступность прокси-сервера
        let proxyAvailable = false;
        try {
          proxyAvailable = await checkMLHealth();
        } catch {
          proxyAvailable = false;
        }
        
        let textResult = null;
        let visionResult = null;
        
        if (proxyAvailable) {
          // Используем реальный ML API через прокси
          console.log('✅ Используем ML API через прокси');
          if (text) {
            textResult = await analyzeTextReal(text);
          }
          
          if (hasFile && selectedFile) {
            visionResult = await analyzeImageReal(selectedFile);
          } else if (hasDemoImage) {
            // Для демо-режима используем симуляцию
            visionResult = await analyzeImage(selectedImageType);
          }
        } else {
          // Fallback на локальную симуляцию
          console.log('⚠️ ML API недоступен, используем локальную симуляцию');
          textResult = text ? await analyzeText(text) : null;
          
          // Если загружен реальный файл без текста — используем симуляцию
          if (hasFile && !text && !hasDemoImage) {
            // В режиме симуляции просим описать проблему
            store.setMessages(prev => prev.filter(m => m.content !== '⏳ Анализирую...'));
            store.addMessage({
              role: 'ai',
              content: '📷 Фото получено!\n\n💡 В режиме симуляции опишите проблему текстом для более точной классификации.\n\nИли выберите демо-режим для тестирования.'
            });
            store.setIsProcessing(false);
            return;
          }
          
          const imageDesc = hasDemoImage ? selectedImageType : undefined;
          visionResult = imageDesc ? await analyzeImage(imageDesc) : null;
        }
        
        const fusion = fuseResults(textResult, visionResult, inputMode);
        
        store.setMessages(prev => prev.filter(m => m.content !== '⏳ Анализирую...'));
        
        if (fusion.classificationResult === 'NOT_INCIDENT') {
          const message = inputMode === 'TEXT_ONLY'
            ? '🔍 Не удалось определить проблему по описанию.\n\nПопробуйте описать подробнее или отправить фото повреждения.'
            : inputMode === 'IMAGE_ONLY'
            ? '🔍 На фото не удалось обнаружить проблему, связанную с домом.\n\nПопробуйте отправить другое фото или опишите проблему текстом.'
            : '🔍 Не удалось определить проблему.\n\nПопробуйте описать подробнее или отправить другое фото.';
          
          store.addMessage({
            role: 'ai',
            content: message
          });
          store.setIsProcessing(false);
          return;
        }
        
        setIncidentDraft(prev => ({ 
          ...prev, 
          text, 
          imageFile: selectedFile || undefined,
          imageType: selectedImageType || undefined,
          fusion 
        }));
        
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
      media: (incidentDraft.imageFile || incidentDraft.imageType) ? [{ id: 'img-1', type: 'image', url: imagePreview || '' }] : [],
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
      inputMode: (incidentDraft.imageFile || incidentDraft.imageType) && incidentDraft.text ? 'TEXT_AND_IMAGE' : (incidentDraft.imageFile || incidentDraft.imageType) ? 'IMAGE_ONLY' : 'TEXT_ONLY',
      fusionResult: fusion,
      statusHistory: [
        { from: null, to: 'NEW', timestamp: Date.now(), by: 'system' },
        { from: 'NEW', to: 'READY', timestamp: Date.now() + 100, by: 'system' },
        { from: 'READY', to: 'AVAILABLE', timestamp: Date.now() + 200, by: 'system' }
      ]
    };
    
    store.createIncident(incident);
    store.setPendingFusion(null);
    store.setClarificationStep(0);
    setIncidentDraft({ answers: {} });
    
    store.addMessage({
      role: 'ai',
      content: `✅ Заявка #${incident.id} создана!\n\nОжидайте — мастер возьмёт её в работу.`
    });
  };

  const handleClarificationAnswer = async (answer: string) => {
    const fusion = store.pendingFusion;
    if (!fusion) return;
    
    store.addMessage({ role: 'user', content: answer });
    
    const nextStep = store.clarificationStep + 1;
    const currentQuestion = fusion.recommendedQuestions[store.clarificationStep];
    
    setIncidentDraft(prev => ({
      ...prev,
      answers: { ...prev.answers, [currentQuestion?.field || '']: answer }
    }));
    
    if (nextStep < fusion.recommendedQuestions.length) {
      store.setClarificationStep(nextStep);
      setTimeout(() => {
        store.addMessage({ role: 'ai', content: fusion.recommendedQuestions[nextStep].text });
      }, 500);
    } else {
      // Все вопросы заданы - обновляем clarificationStep
      store.setClarificationStep(nextStep);
      
      // Если был вопрос о описании, анализируем текст для определения подкатегории
      if (currentQuestion?.field === 'description' || currentQuestion?.field === 'clarification') {
        try {
          const textResult = await analyzeText(answer);
          if (textResult.category && textResult.subcategory) {
            // Обновляем fusion с новой подкатегорией
            const updatedFusion: FusionResult = {
              ...fusion,
              category: textResult.category || fusion.category,
              subcategory: textResult.subcategory || fusion.subcategory,
              classificationResult: 'KNOWN_INCIDENT'
            };
            
            // Обновляем тип исполнителя если категория изменилась
            if (textResult.category) {
              const category = categories.find(c => c.id === textResult.category);
              if (category) {
                updatedFusion.recommendedWorkerType = category.defaultWorker;
              }
            }
            
            store.setPendingFusion(updatedFusion);
            setIncidentDraft(prev => ({ ...prev, text: answer, fusion: updatedFusion }));
            
            setTimeout(() => {
              showConfirmationCard(updatedFusion, answer, incidentDraft.imageType || '');
            }, 500);
            return;
          }
        } catch (error) {
          console.error('Error analyzing clarification text:', error);
        }
      }
      
      // Если не удалось определить подкатегорию, показываем карточку с текущей информацией
      setTimeout(() => {
        showConfirmationCard(fusion, incidentDraft.text || answer, incidentDraft.imageType || '');
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
    store.pendingFusion.classificationResult !== 'NOT_INCIDENT' && 
    store.clarificationStep >= store.pendingFusion.recommendedQuestions.length;

  const hasAttachment = selectedFile || (showDemoMode && selectedImageType);

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
            {mlApiAvailable === true && ' • ML API ✓'}
            {mlApiAvailable === false && ' • Симуляция'}
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
      
      {/* Messages area */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
        style={{ background: 'var(--max-surface)' }}
      >
        {store.messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'max-bubble max-bubble-outgoing' : 'max-bubble max-bubble-incoming'}`}>
              <p className="text-sm whitespace-pre-line" style={{ color: 'var(--max-bubble-text)' }}>
                {msg.content}
              </p>
              {msg.media && msg.media[0]?.url && (
                <div 
                  className="mt-2 rounded-xl overflow-hidden"
                  style={{ background: 'rgba(0,0,0,0.05)' }}
                >
                  <img 
                    src={msg.media[0].url} 
                    alt="Прикреплённое фото" 
                    className="max-w-full h-auto max-h-48 object-cover"
                  />
                </div>
              )}
              {msg.media && !msg.media[0]?.url && (
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
              onClick={handleOpenEditModal}
              className="max-btn max-btn-secondary"
            >
              <Edit className="w-4 h-4" />
              Редактировать
            </button>
            <button
              onClick={() => {
                store.setPendingFusion(null);
                store.setClarificationStep(0);
                setIncidentDraft({ answers: {} });
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
      
      {/* File preview */}
      {(selectedFile || (showDemoMode && selectedImageType)) && (
        <div 
          className="px-4 py-2 shrink-0 flex items-center gap-2"
          style={{ background: 'var(--max-background)', borderTop: '1px solid var(--max-border)' }}
        >
          {imagePreview && (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Превью" 
                className="w-16 h-16 object-cover rounded-lg"
              />
              <button
                onClick={handleRemoveFile}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'var(--max-error)' }}
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          )}
          {showDemoMode && selectedImageType && !imagePreview && (
            <div className="relative">
              <div 
                className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl"
                style={{ background: 'var(--max-surface)' }}
              >
                {selectedImageType.includes('протечк') ? '💧' : 
                 selectedImageType.includes('гряз') ? '🧹' :
                 selectedImageType.includes('дерево') ? '🌳' :
                 selectedImageType.includes('двер') ? '🚪' :
                 selectedImageType.includes('кот') ? '🐱' : '❓'}
              </div>
              <button
                onClick={() => {
                  setShowDemoMode(false);
                  setSelectedImageType('');
                }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'var(--max-error)' }}
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          )}
          <div className="flex-1">
            <p className="text-xs font-medium" style={{ color: 'var(--max-text-primary)' }}>
              {selectedFile ? selectedFile.name : `Демо: ${selectedImageType}`}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--max-text-secondary)' }}>
              {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Тестовое изображение'}
            </p>
          </div>
        </div>
      )}
      
      {/* Demo mode selector */}
      {showDemoMode && !selectedImageType && (
        <div className="px-4 py-2 shrink-0" style={{ background: 'var(--max-background)', borderTop: '1px solid var(--max-border)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium" style={{ color: 'var(--max-text-secondary)' }}>
              Демо-режим: выберите тип фото
            </p>
            <button
              onClick={() => setShowDemoMode(false)}
              className="text-xs underline"
              style={{ color: 'var(--max-primary)' }}
            >
              Отмена
            </button>
          </div>
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
                  background: 'var(--max-surface)',
                  color: 'var(--max-text-primary)',
                  border: '1px solid var(--max-border)'
                }}
              >
                {img.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Input area */}
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
            {/* Camera button - открывает меню выбора */}
            <div className="relative group">
              <button
                onClick={() => {
                  const menu = document.getElementById('photo-menu');
                  if (menu) {
                    menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
                  }
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all"
                style={{ 
                  background: hasAttachment ? 'var(--max-primary)' : 'var(--max-surface)',
                  color: hasAttachment ? 'white' : 'var(--max-text-secondary)'
                }}
              >
                <Camera className="w-4 h-4" />
              </button>
              
              {/* Выпадающее меню */}
              <div
                id="photo-menu"
                className="absolute bottom-12 left-0 flex-col gap-1 p-1 rounded-xl shadow-lg z-10"
                style={{ 
                  background: 'var(--max-background)', 
                  border: '1px solid var(--max-border)',
                  display: 'none',
                  minWidth: '180px'
                }}
              >
                <button
                  onClick={() => {
                    handleOpenFilePicker();
                    document.getElementById('photo-menu')!.style.display = 'none';
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left w-full transition-all"
                  style={{ color: 'var(--max-text-primary)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--max-surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  📷 Загрузить фото
                </button>
                <button
                  onClick={() => {
                    setShowDemoMode(true);
                    document.getElementById('photo-menu')!.style.display = 'none';
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left w-full transition-all"
                  style={{ color: 'var(--max-text-primary)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--max-surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  🎭 Демо-режим
                </button>
              </div>
            </div>
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
              disabled={store.isProcessing || (!input.trim() && !hasAttachment)}
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

      {/* Edit Modal */}
      {showEditModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowEditModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--max-text-primary)' }}>
                  ✏️ Редактировать заявку
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                >
                  <X className="w-5 h-5" style={{ color: 'var(--max-text-secondary)' }} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--max-text-primary)' }}>
                    Категория
                  </label>
                  <select
                    value={editCategory}
                    onChange={e => {
                      setEditCategory(e.target.value);
                      setEditSubcategory('');
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    style={{ 
                      borderColor: 'var(--max-border)',
                      background: 'var(--max-background)',
                      color: 'var(--max-text-primary)'
                    }}
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subcategory */}
                {editCategory && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--max-text-primary)' }}>
                      Подкатегория
                    </label>
                    <select
                      value={editSubcategory}
                      onChange={e => setEditSubcategory(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      style={{ 
                        borderColor: 'var(--max-border)',
                        background: 'var(--max-background)',
                        color: 'var(--max-text-primary)'
                      }}
                    >
                      <option value="">Выберите подкатегорию</option>
                      {getCategoryById(editCategory)?.subcategories.map(sub => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--max-text-primary)' }}>
                    Описание
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                    style={{ 
                      borderColor: 'var(--max-border)',
                      background: 'var(--max-background)',
                      color: 'var(--max-text-primary)'
                    }}
                    placeholder="Опишите проблему подробнее..."
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 max-btn max-btn-secondary"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 max-btn max-btn-primary"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
