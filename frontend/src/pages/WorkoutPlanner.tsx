import React, { useState, useEffect } from 'react';
import { ArrowLeft, Dumbbell, Sparkles, Clock, ChevronRight, Loader2, Calendar, CheckCircle2, Trophy, Flame, AlertTriangle, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { ConfirmModal } from '../components/ConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

const formatDate = (dateString: string) => {
  if (!dateString) return '--/--/----';
  const d = new Date(dateString);
  if (d.getFullYear() <= 1970) {
    return '--/--/----';
  }
  return d.toLocaleDateString('pt-BR');
};

export const WorkoutPlanner = () => {
  const navigate = useNavigate();
  const [activePlan, setActivePlan] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [completedSessions, setCompletedSessions] = useState<string[]>([]);
  const [confirmOptions, setConfirmOptions] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger' as 'danger' | 'warning' | 'info',
    confirmText: 'Confirmar',
    onConfirm: async () => {}
  });

  const closeConfirm = () => setConfirmOptions(prev => ({ ...prev, isOpen: false }));

  const [formData, setFormData] = useState({
    goal: 'ganhar massa',
    level: 'iniciante',
    days_per_week: '5',
    location: 'academia',
    duration: '45 minutos'
  });

  useEffect(() => {
    fetchActivePlan();
  }, []);

  useEffect(() => {
    if (activePlan) {
      fetchProgress(activePlan.id);
    }
  }, [activePlan]);

  const fetchActivePlan = async () => {
    try {
      setIsLoading(true);
      const data = await api.workouts.getActive();
      setActivePlan(data);
    } catch (err) {
      console.error('Failed to fetch active plan', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProgress = async (planId: string) => {
    try {
      const sessions = await api.workouts.getProgress(planId);
      setCompletedSessions(sessions.map((s: any) => s.day_of_week));
    } catch (err) {
      console.error('Failed to fetch progress', err);
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const newPlan = await api.workouts.generate(formData);
      setActivePlan(newPlan);
      setIsModalOpen(false);
      setShowWarning(false);
    } catch (err: any) {
      console.error('Failed to generate plan', err);
      if (err.status === 403) {
        setConfirmOptions({
          isOpen: true,
          title: 'Plano Ativo',
          message: 'Você já possui um plano ativo para os próximos 30 dias. Termine o atual antes de gerar um novo.',
          type: 'warning',
          confirmText: 'Entendi',
          onConfirm: async () => {}
        });
      } else {
        setConfirmOptions({
          isOpen: true,
          title: 'Erro de Conexão',
          message: 'Não foi possível gerar seu plano inteligente no momento. Tente novamente mais tarde.',
          type: 'danger',
          confirmText: 'Fechar',
          onConfirm: async () => {}
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const WarningModal = () => (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-sm rounded-[40px] p-8 text-center shadow-2xl"
      >
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
        </div>
        <h3 className="text-2xl font-black text-gray-900 mb-4">Atenção ⚠️</h3>
        <p className="text-gray-500 font-bold mb-8 leading-relaxed">
          Você está prestes a gerar seu plano de treino do mês.
          Este plano será válido durante os próximos <span className="text-[#56AB2F]">30 dias</span> e não poderá ser alterado até o próximo ciclo.
        </p>
        <div className="space-y-3">
          <button 
            disabled={isGenerating}
            onClick={handleGenerate}
            className="w-full py-4 bg-[#56AB2F] text-white rounded-2xl font-black shadow-lg"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Gerar Plano'}
          </button>
          <button onClick={() => setShowWarning(false)} className="w-full py-4 text-gray-400 font-bold">Cancelar</button>
        </div>
      </motion.div>
    </motion.div>
  );

  const GeneratorModal = () => (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        className="bg-white w-full max-w-lg rounded-[40px] p-8 pb-12 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-gray-900">Novo Plano Mensal</h2>
          <button onClick={() => setIsModalOpen(false)} className="text-gray-400 font-bold">Fechar</button>
        </div>
        <div className="space-y-6">
          <div>
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Objetivo</label>
            <div className="grid grid-cols-2 gap-2">
              {['emagrecer', 'ganhar massa', 'definição', 'condicionamento'].map(opt => (
                <button 
                  key={opt}
                  onClick={() => setFormData({...formData, goal: opt})}
                  className={`p-3 rounded-2xl text-xs font-bold capitalize border-2 transition-all ${formData.goal === opt ? 'bg-[#F0F9EB] border-[#56AB2F] text-[#56AB2F]' : 'bg-gray-50 border-transparent text-gray-500'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Nível</label>
              <select value={formData.level} onChange={(e) => setFormData({...formData, level: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl text-sm font-bold border-none">
                <option value="iniciante">Iniciante</option>
                <option value="intermediário">Intermediário</option>
                <option value="avançado">Avançado</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Dias/Semana</label>
              <select value={formData.days_per_week} onChange={(e) => setFormData({...formData, days_per_week: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl text-sm font-bold border-none">
                {[3, 4, 5, 6, 7].map(d => <option key={d} value={`${d}`}>{d} dias</option>)}
              </select>
            </div>
          </div>
          <button 
            onClick={() => setShowWarning(true)}
            className="w-full py-5 bg-gradient-to-r from-[#A8E063] to-[#56AB2F] rounded-3xl text-white font-black text-lg shadow-xl mt-4"
          >
            Continuar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="main-wrapper bg-[#F6F7F9]">
      <div className="app-container pb-32 bg-transparent shadow-none border-none">
        <div className="px-6 pt-12 pb-6 flex justify-center items-center sticky top-0 z-40 bg-[#F6F7F9]/90 backdrop-blur-sm">
          <h1 className="text-[22px] font-bold text-gray-900">Treino Inteligente</h1>
        </div>

        <div className="px-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-[#56AB2F] mb-4" />
              <p className="text-gray-400 font-bold italic">Sincronizando seu plano...</p>
            </div>
          ) : activePlan ? (
            <div className="space-y-8">
              {/* Active Plan Info */}
              <div className="bg-white rounded-[40px] p-8 shadow-xl border border-gray-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 flex space-x-2">
                  <button 
                    onClick={() => {
                      setConfirmOptions({
                        isOpen: true,
                        title: 'Resetar Plano',
                        message: 'Deseja realmente apagar o plano atual e gerar um novo? Todo seu progresso nos 30 dias será perdido. Esta ação é irreversível.',
                        type: 'danger',
                        confirmText: 'Apagar Plano',
                        onConfirm: async () => {
                          try {
                            await api.workouts.reset();
                            setActivePlan(null);
                          } catch(e) {
                            setTimeout(() => {
                              setConfirmOptions({
                                isOpen: true,
                                title: 'Erro',
                                message: 'Ocorreu um erro ao resetar o plano. Tente novamente.',
                                type: 'danger',
                                confirmText: 'Fechar',
                                onConfirm: async () => {}
                              });
                            }, 300);
                          }
                        }
                      });
                    }}
                    className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-red-500 transition-colors"
                    title="Resetar Plano"
                  >
                    <Flame className="w-5 h-5" />
                  </button>
                  <Flame className="w-6 h-6 text-orange-500 opacity-20" />
                </div>
                <p className="text-[10px] font-black text-[#56AB2F] uppercase tracking-widest mb-1">Plano Ativo</p>
                <h2 className="text-2xl font-black text-gray-900 mb-1">{activePlan.title || 'Seu Plano Master'}</h2>
                <div className="flex flex-wrap gap-4 mt-6">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-xs font-bold text-gray-500">Início: {formatDate(activePlan.plan_start_date || activePlan.created_at)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-[#56AB2F]" />
                    <p className="text-xs font-bold text-gray-500">Renovação: {formatDate(activePlan.plan_renewal_date || activePlan.next_plan_available_at)}</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-[#F0F9EB] rounded-[32px] p-6 border border-[#56AB2F]/10">
                <div className="flex justify-between items-center mb-4">
                   <h4 className="text-base font-black text-gray-900">Seu Progresso</h4>
                   <Trophy className="w-6 h-6 text-[#56AB2F]" />
                </div>
                <div className="w-full h-3 bg-white rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedSessions.length / (activePlan.structured_plan?.daily_workouts?.length || 1)) * 100}%` }}
                    className="h-full bg-[#56AB2F]"
                  />
                </div>
              </div>

              {/* Weekly Cards */}
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2 px-1">
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Organização Semanal</h4>
                  <p className="text-[9px] font-black text-[#56AB2F] uppercase bg-[#56AB2F]/10 px-2 py-1 rounded-lg">
                    {activePlan.days_per_week} dias / semana
                  </p>
                </div>
                {activePlan.structured_plan?.daily_workouts?.map((dw: any, idx: number) => {
                  const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
                  const todayName = dayNames[new Date().getDay()];
                  const isDone = completedSessions.includes(dw.day);
                  const isToday = dw.day === todayName;
                  
                  // Sequential Unlock Logic:
                  // 1. First day is always unlocked (if not future, but user says "não chegaram")
                  // 2. Subsequent days are unlocked if the previous one is done
                  // 3. Or if it's today (we allow starting today's workout even if we missed yesterday, 
                  //    but the user said "Nunca permitir pular", so let's be strict:
                  //    Must finish previous to do next.)
                  
                  const previousDayDone = idx === 0 || completedSessions.includes(activePlan.structured_plan.daily_workouts[idx-1].day);
                  
                  // "Não chegaram" logic:
                  const dayIndices: Record<string, number> = {
                    'Segunda-feira': 1, 'Terça-feira': 2, 'Quarta-feira': 3, 'Quinta-feira': 4, 
                    'Sexta-feira': 5, 'Sábado': 6, 'Domingo': 7
                  };
                  const todayIdx = dayIndices[todayName] || 0;
                  const currentDayIdx = dayIndices[dw.day] || 0;
                  const hasArrived = currentDayIdx <= todayIdx;

                  const isLocked = !isDone && (!previousDayDone || !hasArrived) && !isToday;
                  const canAccess = (isToday || hasArrived) && (idx === 0 || previousDayDone);

                  return (
                    <motion.button
                      key={dw.day}
                      disabled={!canAccess && !isDone}
                      onClick={() => {
                        if (canAccess || isDone) {
                          navigate(`/workout/session/${dw.day}`);
                        }
                      }}
                      whileTap={(canAccess || isDone) ? { scale: 0.98 } : {}}
                      className={`w-full p-6 rounded-[32px] shadow-sm border-2 transition-all flex items-center justify-between group relative overflow-hidden
                        ${isDone 
                          ? 'bg-[#F0F9EB]/40 border-[#56AB2F]/20 opacity-100' 
                          : isToday 
                            ? 'bg-white border-[#56AB2F] shadow-lg shadow-[#56AB2F]/10' 
                            : canAccess
                              ? 'bg-white border-transparent'
                              : 'bg-gray-50/50 border-transparent opacity-40'}`}
                    >
                      <div className="flex items-center space-x-4 relative z-10">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500
                          ${isDone ? 'bg-[#56AB2F] text-white rotate-[360deg]' : 
                            isToday ? 'bg-[#56AB2F]/10 text-[#56AB2F]' : 
                            canAccess ? 'bg-gray-50 text-gray-400' : 'bg-gray-100/50 text-gray-300'}`}>
                          {isDone ? <CheckCircle2 className="w-7 h-7" /> : <Dumbbell className="w-6 h-6" />}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                             <p className={`text-base font-black ${isLocked ? 'text-gray-300' : 'text-gray-900'}`}>{dw.day}</p>
                             {isToday && !isDone && (
                               <span className="flex h-2 w-2 rounded-full bg-[#56AB2F] animate-ping" />
                             )}
                          </div>
                          <p className={`text-xs font-bold ${isDone ? 'text-[#56AB2F]' : isLocked ? 'text-gray-200' : 'text-gray-400'}`}>
                            {isDone ? 'Treino Finalizado! 🏆' : dw.muscles}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 relative z-10">
                        {isToday && !isDone && (
                          <span className="bg-[#56AB2F] text-white text-[9px] font-black uppercase px-2 py-1 rounded-md">Hoje</span>
                        )}
                        {(!canAccess && !isDone) ? (
                          <Lock className="w-5 h-5 text-gray-200" />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isToday ? 'bg-[#56AB2F] text-white' : 'bg-gray-50 text-gray-300'}`}>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Progress Sparkle for current day */}
                      {isToday && !isDone && (
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#56AB2F]/10 to-transparent rounded-full -mr-12 -mt-12 blur-2xl" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center shadow-sm mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-[#56AB2F]" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Sem Plano Ativo</h2>
              <p className="text-gray-400 font-bold mb-10 max-w-xs mx-auto">Gere agora seu plano de elite válido pelos próximos 30 dias.</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full py-5 bg-[#56AB2F] rounded-3xl text-white font-black text-lg shadow-xl active:scale-95 transition-all"
              >
                Gerar Plano Inteligente
              </button>
            </div>
          )}
        </div>

        <AnimatePresence>
          {isModalOpen && <GeneratorModal />}
          {showWarning && <WarningModal />}
        </AnimatePresence>

        <ConfirmModal 
          isOpen={confirmOptions.isOpen}
          onClose={closeConfirm}
          title={confirmOptions.title}
          message={confirmOptions.message}
          type={confirmOptions.type}
          confirmText={confirmOptions.confirmText}
          onConfirm={confirmOptions.onConfirm}
        />

        <BottomNav />
      </div>
    </div>
  );
};
