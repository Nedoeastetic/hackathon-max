import { useState, useCallback } from 'react';
import { Incident, ChatMessage, Master, FusionResult, IncidentStatus } from '../types';
import { mockMasters, existingIncidents } from '../data/mockData';

// Simple state hook
export function useAppStore() {
  const [incidents, setIncidents] = useState<Incident[]>(existingIncidents);
  const [masters, setMasters] = useState<Master[]>(mockMasters);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: 'Здравствуйте! Я помогу вам сообщить о проблеме в доме. Отправьте фото или опишите, что случилось.',
      timestamp: Date.now()
    }
  ]);
  const [currentIncident, setCurrentIncident] = useState<Incident | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingFusion, setPendingFusion] = useState<FusionResult | null>(null);
  const [clarificationStep, setClarificationStep] = useState(0);
  const [selectedBuilding, setSelectedBuilding] = useState('building-1');

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newMsg]);
    return newMsg;
  }, []);

  const updateIncidentStatus = useCallback((incidentId: string, newStatus: IncidentStatus, by: string, reason?: string) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          status: newStatus,
          updatedAt: Date.now(),
          statusHistory: [
            ...inc.statusHistory,
            { from: inc.status, to: newStatus, timestamp: Date.now(), by, reason }
          ]
        };
      }
      return inc;
    }));
  }, []);

  const createIncident = useCallback((incident: Incident) => {
    setIncidents(prev => [...prev, incident]);
    setCurrentIncident(incident);
  }, []);

  const assignMaster = useCallback((incidentId: string, masterId: string) => {
    const master = masters.find(m => m.id === masterId);
    if (!master) return;
    
    setMasters(prev => prev.map(m => {
      if (m.id === masterId) {
        return { ...m, currentIncidents: [...m.currentIncidents, incidentId] };
      }
      return m;
    }));
    
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          assignedWorker: masterId,
          assignedWorkerName: master.name,
          status: 'ASSIGNED',
          updatedAt: Date.now(),
          statusHistory: [
            ...inc.statusHistory,
            { from: inc.status, to: 'ASSIGNED', timestamp: Date.now(), by: master.name }
          ]
        };
      }
      return inc;
    }));
  }, [masters]);

  const getAvailableMasters = useCallback((workerType: string) => {
    return masters.filter(m => 
      m.available && (m.workerType === workerType || m.workerType === 'UNIVERSAL')
    );
  }, [masters]);

  return {
    incidents,
    masters,
    messages,
    currentIncident,
    isProcessing,
    pendingFusion,
    clarificationStep,
    selectedBuilding,
    setMessages,
    setIsProcessing,
    setPendingFusion,
    setClarificationStep,
    setSelectedBuilding,
    setCurrentIncident,
    addMessage,
    updateIncidentStatus,
    createIncident,
    assignMaster,
    getAvailableMasters
  };
}

export type AppStore = ReturnType<typeof useAppStore>;
