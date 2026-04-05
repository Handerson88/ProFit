import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { quizService } from '../services/quizService';
import { useAuth } from '../context/AuthContext';

export interface QuizFormData {
  gender: string;
  training_frequency: string;
  age: string;
  height: string;
  current_weight: string;
  goal: string;
  target_weight: string;
  emotional_state: string;
  understands_calories: boolean | undefined;
  daily_calorie_target: string;
  primary_objective: string;
  blockers: string[];
  activity_level?: string;
  goal_speed: string;
}

interface QuizContextType {
  formData: QuizFormData;
  step: number;
  isLoading: boolean;
  setStep: (step: number) => void;
  updateField: (field: string, value: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  isStepValid: (stepNum?: number) => boolean;
  resetQuiz: () => void;
  completeQuiz: () => Promise<void>;
}

const initialData: QuizFormData = {
  gender: '',
  training_frequency: '',
  age: '',
  height: '',
  current_weight: '',
  goal: '',
  target_weight: '',
  emotional_state: '',
  understands_calories: undefined,
  daily_calorie_target: '2000',
  primary_objective: '',
  blockers: [],
  goal_speed: '',
};

const QuizContext = createContext<QuizContextType | undefined>(undefined);

const STORAGE_KEY = 'quizData';

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, refreshUser } = useAuth();
  const [step, setStep] = useState<number>(() => {
    const saved = sessionStorage.getItem('quiz_current_step');
    return saved ? parseInt(saved) : 1;
  });

  const [formData, setFormData] = useState<QuizFormData>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved && saved !== 'undefined' && saved !== 'null') {
        return { ...initialData, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to parse quiz data', e);
    }
    return initialData;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Persistence
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    sessionStorage.setItem('quiz_current_step', step.toString());
  }, [step]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      // Se mudar para Manter peso, já iguala o peso alvo
      if (field === 'goal' && value === 'Manter peso') {
        next.target_weight = prev.current_weight;
      }
      // Se mudar o peso atual e estiver em manutenção, atualiza o alvo
      if (field === 'current_weight' && (next.goal === 'Manter peso')) {
        next.target_weight = value;
      }
      return next;
    });
  };

  const isStepValid = (stepNum = step) => {
    switch (stepNum) {
      case 1: return !!formData.gender;
      case 2: return !!formData.training_frequency;
      case 4: return !!formData.age;
      case 5: return !!formData.height;
      case 6: return !!formData.current_weight;
      case 7: return !!formData.goal;
      case 8: return formData.goal === 'Manter peso' || !!formData.target_weight;
      case 9: return !!formData.emotional_state;
      case 13: return !!formData.goal_speed;
      case 14: return formData.understands_calories !== undefined;
      case 15: return !!formData.daily_calorie_target;
      case 16: return !!formData.primary_objective;
      case 18: return formData.blockers.length > 0;
      default: return true;
    }
  };

  const nextStep = () => {
    if (isStepValid()) {
      // Logic for skipping steps
      if (step === 11 && formData.goal !== 'Ganhar massa') {
        setStep(13); // Pular a motivação exclusiva de ganho de massa
        return;
      }
      setStep(prev => Math.min(prev + 1, 22));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const resetQuiz = () => {
    setFormData(initialData);
    setStep(1);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem('quiz_current_step');
  };

  const completeQuiz = async () => {
    setIsLoading(true);
    try {
      await quizService.submitQuiz(formData);
      if (isAuthenticated) {
        await refreshUser();
      }
      resetQuiz();
    } catch (error) {
      console.error('Failed to submit quiz', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <QuizContext.Provider value={{ 
      formData, 
      step, 
      isLoading, 
      setStep, 
      updateField, 
      nextStep, 
      prevStep, 
      isStepValid, 
      resetQuiz,
      completeQuiz
    }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuizData = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuizData must be used within a QuizProvider');
  }
  return context;
};
