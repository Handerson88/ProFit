import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { quizService } from '../services/quizService';
import { trackingService } from '../services/trackingService';
import { ArrowLeft, ArrowRight, CheckCircle2, Calendar, Scale, Ruler, Target, Activity, User } from 'lucide-react';

export const Quiz = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const totalSteps = 8;
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    height: '',
    current_weight: '',
    goal: '',
    activity_level: '',
    target_weight: '',
    daily_calorie_target: '2000'
  });

  const fieldMap = ['age', 'gender', 'height', 'current_weight', 'goal', 'activity_level', 'target_weight', 'daily_calorie_target'];

  React.useEffect(() => {
    const loadProgress = async () => {
      setIsLoading(true);
      try {
        const data = await quizService.getResponses();
        if (data && data.responses && data.responses.length > 0) {
          const updatedFormData = { ...formData };
          data.responses.forEach((r: any) => {
            if (r.question && r.answer && updatedFormData.hasOwnProperty(r.question)) {
              updatedFormData[r.question as keyof typeof formData] = r.answer;
            }
          });
          setFormData(updatedFormData);
          
          if (data.progress && data.progress.current_step) {
            const stepNum = Number(data.progress.current_step);
            if (!data.progress.is_complete && stepNum >= 1 && stepNum <= totalSteps) {
              setStep(stepNum);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load progress", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProgress();
  }, []); // eslint-disable-line

  const nextStep = () => {
    if (step < totalSteps) {
      const questionName = fieldMap[step - 1];
      const answer = formData[questionName as keyof typeof formData];
      quizService.saveAnswer(questionName, answer, String(step + 1), false).catch(console.error);
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      const questionName = fieldMap[step - 2];
      const answer = formData[questionName as keyof typeof formData];
      // Salva a etapa anterior ao retroceder
      quizService.saveAnswer(questionName, answer, String(step - 1), false).catch(console.error);
      setStep(step - 1);
    }
  };

  const handleSelect = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    const newStep = step < totalSteps ? step + 1 : step;
    quizService.saveAnswer(field, value, String(newStep), false).catch(console.error);
    setTimeout(nextStep, 350); // Auto-advance with slight delay for animation
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitQuiz = async () => {
    setIsLoading(true);
    try {
      const payload = {
        age: Number(formData.age),
        gender: formData.gender,
        height: Number(formData.height),
        current_weight: Number(formData.current_weight),
        goal: formData.goal,
        activity_level: formData.activity_level,
        target_weight: Number(formData.target_weight),
        daily_calorie_target: Number(formData.daily_calorie_target)
      };
      
      console.log("Iniciando gravação de perfil...", payload);
      
      // Salva a última resposta (Calorias diárias) como completo
      const finalQuestionName = fieldMap[7];
      await quizService.saveAnswer(finalQuestionName, payload.daily_calorie_target, String(totalSteps), true);

      await api.user.submitQuiz(payload);
      
      console.log("Perfil salvo! Atualizando usuário no contexto local...");
      await trackingService.logEvent('quiz_completed', payload);
      await refreshUser(); // Garante que a sessão local reconheça que o onboarding acabou
      
      console.log("Redirecionando para a Home...");
      navigate('/home');
    } catch (err: any) {
      console.error('Erro:', err);
      alert(err.message || 'Ocorreu um erro ao salvar seu perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95
    })
  };

  const stepMeta = [
    { id: 1, title: 'INFORMAÇÕES PESSOAIS', question: 'Qual a sua idade?', helper: 'Isso ajuda a calcular suas necessidades diárias.', icon: Calendar },
    { id: 2, title: 'IDENTIDADE', question: 'Qual é o seu gênero?', helper: 'As fórmulas metabólicas diferem ligeiramente.', icon: User },
    { id: 3, title: 'MÉTRICAS CORPORAIS', question: 'Qual a sua altura?', helper: 'Necessário para calcular sua Taxa Metabólica.', icon: Ruler },
    { id: 4, title: 'MÉTRICAS CORPORAIS', question: 'Peso atual?', helper: 'Este é o seu ponto de partida.', icon: Scale },
    { id: 5, title: 'SEU OBJETIVO', question: 'Qual é a sua meta?', helper: 'Ajustaremos as calorias para corresponder ao objetivo.', icon: Target },
    { id: 6, title: 'ESTILO DE VIDA', question: 'Quão ativo você é?', helper: 'Isso determina seu gasto energético diário.', icon: Activity },
    { id: 7, title: 'SEU OBJETIVO', question: 'Peso alvo?', helper: 'Estabeleça uma meta realista e saudável.', icon: Target },
    { id: 8, title: 'META NUTRICIONAL', question: 'Quantas calorias você deseja consumir por dia?', helper: 'Escolha sua meta diária de calorias para acompanhar sua alimentação.', icon: Target },
  ];

  const currentMeta = stepMeta[step - 1];
  const IconComponent = currentMeta.icon;

  const getGoalConfig = (goalKey: string) => {
    switch (goalKey) {
      case 'Emagrecer':
        return {
          min: 1200,
          max: 1800,
          default: 1500,
          message: 'Faixa recomendada para perda de peso.',
          options: [1200, 1400, 1500, 1600, 1700, 1800]
        };
      case 'Ganhar massa':
        return {
          min: 2500,
          max: 3500,
          default: 2700,
          message: 'Faixa recomendada para ganho de massa.',
          options: [2500, 2700, 3000, 3200, 3500]
        };
      case 'Manter peso':
      default:
        return {
          min: 1800,
          max: 2500,
          default: 2000,
          message: 'Faixa recomendada para manter o peso.',
          options: [1800, 2000, 2200, 2300, 2500]
        };
    }
  };

  const renderInput = (name: string, value: string, placeholder: string, unit?: string) => (
    <div className="relative flex justify-center items-center mt-4">
      <input 
        type="number" 
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className={`w-full text-center text-3xl sm:text-4xl font-black text-gray-800 bg-gray-50 border border-gray-100 rounded-2xl py-4 ${unit ? 'pl-4 pr-16' : 'px-4'} shadow-sm focus:bg-white focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-[20px] placeholder:font-bold placeholder:text-gray-300`}
        autoFocus
      />
      {unit && <span className="absolute right-6 text-lg font-bold text-gray-400 pointer-events-none">{unit}</span>}
    </div>
  );

  const renderSelectableCard = (field: string, option: string, icon?: React.ReactNode, description?: string) => {
    const isSelected = formData[field as keyof typeof formData] === option;
    return (
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => handleSelect(field, option)}
        className={`w-full p-3 sm:p-4 rounded-2xl transition-all border-2 flex items-center shadow-sm text-left ${
          isSelected 
            ? 'border-primary bg-primary/5 shadow-primary/10' 
            : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
        }`}
      >
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mr-3 sm:mr-4 shrink-0 ${isSelected ? 'bg-primary text-white' : 'bg-gray-50 text-gray-500'}`}>
          {icon || <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-base sm:text-lg truncate ${isSelected ? 'text-primary' : 'text-gray-800'}`}>
            {option}
          </p>
          {description && <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5 leading-tight">{description}</p>}
        </div>
        {isSelected && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="shrink-0 ml-2">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </motion.div>
        )}
      </motion.button>
    );
  };

  const renderContent = () => {
    switch (step) {
      case 1:
        return renderInput('age', formData.age, 'Sua idade', 'anos');
      case 2:
        return (
          <div className="space-y-4 mt-6">
            {renderSelectableCard('gender', 'Masculino', <User className="w-6 h-6" />)}
            {renderSelectableCard('gender', 'Feminino', <User className="w-6 h-6" />)}
            {renderSelectableCard('gender', 'Outro')}
          </div>
        );
      case 3:
        return renderInput('height', formData.height, 'Sua altura', 'cm');
      case 4:
        return renderInput('current_weight', formData.current_weight, 'Seu peso', 'kg');
      case 5:
        return (
          <div className="space-y-3 mt-4">
            {renderSelectableCard('goal', 'Emagrecer', <Target className="w-5 h-5" />)}
            {renderSelectableCard('goal', 'Manter peso', <Scale className="w-5 h-5" />)}
            {renderSelectableCard('goal', 'Ganhar massa', <Activity className="w-5 h-5" />)}
          </div>
        );
      case 6:
        return (
          <div className="space-y-2.5 mt-4">
            {renderSelectableCard('activity_level', 'Sedentário', null, 'Pouco/nenhum exercício')}
            {renderSelectableCard('activity_level', 'Levemente ativo', null, 'Exercício leve 1-3 dias/sem')}
            {renderSelectableCard('activity_level', 'Moderadamente ativo', null, 'Exercício 3-5 dias/sem')}
            {renderSelectableCard('activity_level', 'Muito ativo', null, 'Exercício intenso 6-7 dias/sem')}
          </div>
        );
      case 7:
        return renderInput('target_weight', formData.target_weight, 'Meta de peso', 'kg');
      case 8: {
        const config = getGoalConfig(formData.goal);
        
        // Ensure current state is within bounds when rendering
        let currentTarget = Number(formData.daily_calorie_target);
        if (!currentTarget || currentTarget < config.min || currentTarget > config.max) {
           currentTarget = config.default;
           // We update passively behind the scenes if out of bounds to avoid render loops
           setTimeout(() => {
             if (Number(formData.daily_calorie_target) !== config.default) {
                setFormData(prev => ({ ...prev, daily_calorie_target: String(config.default) }));
             }
           }, 0);
        }

        return (
          <>
            <div className="flex flex-col items-center mt-4 space-y-4">
              
              <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50 mb-2 w-full text-center">
                <p className="text-sm font-bold text-blue-600/80">{config.message}</p>
              </div>

              <div className="flex items-center justify-center space-x-3">
                <button 
                  onClick={() => {
                    const current = Number(formData.daily_calorie_target) || config.default;
                    if (current > config.min) handleSelect('daily_calorie_target', String(current - 100));
                  }}
                  disabled={Number(formData.daily_calorie_target) <= config.min}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
                >
                  <span className="text-xl font-black block mt-[-2px]">-</span>
                </button>
                <div className="relative w-32 text-center">
                   <input 
                     type="number"
                     name="daily_calorie_target"
                     value={formData.daily_calorie_target}
                     onChange={(e) => {
                       const val = e.target.value;
                       setFormData(prev => ({ ...prev, daily_calorie_target: val }));
                     }}
                     onBlur={(e) => {
                       let val = Number(e.target.value);
                       if (val < config.min) val = config.min;
                       if (val > config.max) val = config.max;
                       setFormData(prev => ({ ...prev, daily_calorie_target: String(val) }));
                     }}
                     className="w-full text-center text-3xl font-black text-gray-800 bg-transparent outline-none p-0 hide-arrows"
                   />
                </div>
                <button 
                  onClick={() => {
                    const current = Number(formData.daily_calorie_target) || config.default;
                    if (current < config.max) handleSelect('daily_calorie_target', String(current + 100));
                  }}
                  disabled={Number(formData.daily_calorie_target) >= config.max}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
                >
                  <span className="text-xl font-black block mt-[-2px]">+</span>
                </button>
              </div>
              <span className="text-lg font-bold text-gray-400">kcal</span>
              
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 w-full pt-3 border-t border-gray-100">
                {config.options.map(val => (
                  <button
                    key={val}
                    onClick={() => handleSelect('daily_calorie_target', String(val))}
                    className={`p-2 rounded-xl font-bold text-xs transition-all border-2 ${
                      formData.daily_calorie_target === String(val) 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-gray-50 bg-gray-50 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    {val} kcal
                  </button>
                ))}
              </div>
            </div>
          </>
        );
      }
      default:
        return null;
    }
  };

  const isCurrentStepValid = () => {
    switch (step) {
      case 1: return !!formData.age;
      case 2: return !!formData.gender;
      case 3: return !!formData.height;
      case 4: return !!formData.current_weight;
      case 5: return !!formData.goal;
      case 6: return !!formData.activity_level;
      case 7: return !!formData.target_weight;
      case 8: {
        const config = getGoalConfig(formData.goal);
        return !!formData.daily_calorie_target && 
               Number(formData.daily_calorie_target) >= config.min && 
               Number(formData.daily_calorie_target) <= config.max;
      }
      default: return false;
    }
  };

  return (
    <div className="main-wrapper">
      <div className="app-container overflow-y-auto flex flex-col">
        
        {/* Top Header & Progress Indicator */}
        <div className="pt-6 px-4 pb-2 z-10 sticky top-0 bg-white">
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={prevStep}
              className={`p-2 rounded-full bg-white shadow-sm border border-gray-100 transition-opacity active:scale-95 ${step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </button>
  
            {/* Modern Step Pill */}
            <div className="bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-100">
              <span className="text-xs font-black text-gray-800 tracking-wide">
                Etapa <span className="text-primary">{step}</span> de {totalSteps}
              </span>
            </div>
  
            <div className="w-8"></div>
          </div>
          
          {/* Animated Progress Bar */}
          <div className="w-full h-2 bg-gray-200/60 rounded-full overflow-hidden shadow-inner max-w-sm mx-auto">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#A8E063] to-[#56AB2F]"
              initial={{ width: 0 }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
  
        <div className="flex-1 relative flex flex-col items-center justify-start p-4 pb-32 w-full">
          <AnimatePresence mode="wait" custom={1}>
            <motion.div
              key={step}
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-sm my-auto"
            >
              <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col">
                
                {/* Question Header */}
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 text-primary">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {currentMeta.title}
                  </h3>
                  <h2 className="text-xl sm:text-2xl leading-tight font-black text-gray-800 mb-1.5">
                    {currentMeta.question}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium leading-snug">
                    {currentMeta.helper}
                  </p>
                </div>
  
                {/* Dynamic Inputs */}
                {renderContent()}
  
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
  
        {/* Bottom Floating Navigation */}
        <div className="fixed bottom-0 left-0 right-0 w-full flex justify-center p-4 bg-gradient-to-t from-[#F6F7F9] via-[#F6F7F9]/90 to-transparent pb-6 pointer-events-none z-20">
          <div className="w-full max-w-[430px] px-4 pointer-events-auto">
            {step < totalSteps ? (
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                disabled={!isCurrentStepValid()}
                className="w-full bg-gradient-to-r from-[#A8E063] to-[#56AB2F] text-white font-bold text-base py-3.5 rounded-2xl shadow-[0_8px_20px_-5px_rgba(86,171,47,0.4)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center space-x-2 transition-all"
              >
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={submitQuiz}
                disabled={!isCurrentStepValid() || isLoading}
                className="w-full bg-gradient-to-r from-[#A8E063] to-[#56AB2F] text-white font-bold text-base py-3.5 rounded-2xl shadow-[0_8px_20px_-5px_rgba(86,171,47,0.4)] flex items-center justify-center space-x-2 disabled:opacity-50 transition-all"
              >
                <span>{isLoading ? 'Processando...' : 'Completar Perfil'}</span>
                {!isLoading && <CheckCircle2 className="w-5 h-5" />}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
