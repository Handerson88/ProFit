import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dumbbell, 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  PlusCircle, 
  X,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface Exercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  rest: string;
  muscle_group?: string;
}

interface DayWorkout {
  day: string;
  muscles: string;
  exercises: Exercise[];
}

const DAYS = [
  'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 
  'Sexta-feira', 'Sábado', 'Domingo'
];

export const ManualWorkoutCreator: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(DAYS[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);

  // State for all days
  const [workoutData, setWorkoutData] = useState<Record<string, DayWorkout>>(
    DAYS.reduce((acc, day) => ({
      ...acc,
      [day]: { day, muscles: '', exercises: [] }
    }), {})
  );

  // Form state for modal
  const [exerciseForm, setExerciseForm] = useState<Omit<Exercise, 'id'>>({
    name: '',
    sets: '',
    reps: '',
    rest: ''
  });

  // Load draft from localStorage OR fetch current manual plan
  useEffect(() => {
    const draft = localStorage.getItem('manual_workout_draft');
    if (draft) {
      try {
        setWorkoutData(JSON.parse(draft));
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    } else {
      // If no draft, check if we have an active manual plan to edit
      const fetchCurrentPlan = async () => {
        try {
          const plan = await api.workouts.getActive();
          if (plan && plan.goal === 'Manual' && plan.structured_plan?.daily_workouts) {
            const data: Record<string, DayWorkout> = {};
            DAYS.forEach(day => {
              const dw = plan.structured_plan.daily_workouts.find((d: any) => d.day === day) || { day, muscles: '', exercises: [] };
              data[day] = dw;
            });
            setWorkoutData(data);
          }
        } catch (e) {
          console.error('Failed to fetch active plan for editing', e);
        }
      };
      fetchCurrentPlan();
    }
  }, []);

  // Save draft to localStorage
  useEffect(() => {
    localStorage.setItem('manual_workout_draft', JSON.stringify(workoutData));
  }, [workoutData]);

  const handleMusclesChange = (val: string) => {
    setWorkoutData(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], muscles: val }
    }));
  };

  const openAddModal = () => {
    setEditingExerciseId(null);
    setExerciseForm({ name: '', sets: '', reps: '', rest: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (exercise: Exercise) => {
    setEditingExerciseId(exercise.id);
    setExerciseForm({ 
      name: exercise.name, 
      sets: exercise.sets, 
      reps: exercise.reps, 
      rest: exercise.rest 
    });
    setIsModalOpen(true);
  };

  const handleDeleteExercise = (id: string) => {
    setWorkoutData(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        exercises: prev[activeTab].exercises.filter(ex => ex.id !== id)
      }
    }));
    toast.success('Exercício removido');
  };

  const handleSaveExercise = () => {
    if (!exerciseForm.name || !exerciseForm.sets || !exerciseForm.reps) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    if (editingExerciseId) {
      // Edit
      setWorkoutData(prev => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          exercises: prev[activeTab].exercises.map(ex => 
            ex.id === editingExerciseId ? { ...ex, ...exerciseForm } : ex
          )
        }
      }));
      toast.success('Exercício atualizado');
    } else {
      // Add
      const newEx: Exercise = {
        ...exerciseForm,
        id: Math.random().toString(36).substr(2, 9)
      };
      setWorkoutData(prev => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          exercises: [...prev[activeTab].exercises, newEx]
        }
      }));
      toast.success('Exercício adicionado');
    }

    setIsModalOpen(false);
  };

  const handleFinalSave = async () => {
    const daysWithExercises = Object.values(workoutData).filter(dw => dw.exercises.length > 0);
    
    if (daysWithExercises.length === 0) {
      toast.error('Adicione ao menos um exercício em algum dia');
      return;
    }

    setIsSaving(true);
    try {
      const structuredPlan = {
        title: 'Meu Plano Personalizado',
        message: '',
        daily_workouts: Object.values(workoutData)
      };

      await api.workouts.saveManual(structuredPlan);
      toast.success('Plano salvo com sucesso! 💪');
      localStorage.removeItem('manual_workout_draft');
      navigate('/workout');
    } catch (err: any) {
      toast.error(err.message || 'Falha ao salvar plano');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F14] text-white pb-24 font-sans">
      {/* Header Compacto e Centralizado */}
      <div className="sticky top-0 z-40 bg-[#0A0F14]/90 backdrop-blur-2xl border-b border-white/[0.03]">
        <div className="max-w-md mx-auto px-5 h-20 relative flex flex-col items-center justify-center text-center">
          {/* Botão de Voltar - Posicionado de forma profissional */}
          <button 
            onClick={() => navigate('/workout')}
            className="absolute left-5 top-1/2 -translate-y-1/2 p-2.5 bg-white/[0.03] rounded-xl hover:bg-white/[0.08] border border-white/[0.05] transition-all active:scale-90 z-20"
          >
            <ChevronLeft className="w-5 h-5 text-[#56AB2F]" />
          </button>
          
          <div className="relative z-10">
            <h1 className="text-[19px] font-semibold tracking-tight text-white">
              Criar Seu Plano
            </h1>
            <p className="text-[13px] font-medium text-slate-500 mt-0.5">
              Personalização Manual
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* Tabs - Ultra Compact */}
        <div className="relative group">
          <div className="px-5 py-5 overflow-x-auto whitespace-nowrap scrollbar-hide flex gap-2 no-scrollbar scroll-smooth">
            {DAYS.map((day) => {
              const shortDay = day.split('-')[0];
              const hasExercises = workoutData[day].exercises.length > 0;
              const isActive = activeTab === day;
              
              return (
                <button
                  key={day}
                  onClick={() => setActiveTab(day)}
                  className={`h-9 px-4 rounded-xl font-semibold text-[13px] transition-all duration-300 relative flex items-center gap-1.5 border ${
                    isActive 
                    ? 'bg-[#56AB2F] border-[#56AB2F] text-white shadow-lg shadow-[#56AB2F]/10' 
                    : 'bg-white/[0.03] border-white/[0.05] text-slate-500'
                  }`}
                >
                  <span>{shortDay}</span>
                  {hasExercises && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white/40' : 'bg-[#56AB2F]'}`} />
                  )}
                </button>
              );
            })}
          </div>
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#0A0F14] to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#0A0F14] to-transparent pointer-events-none z-10" />
        </div>

        {/* Content Section - Compact Spacing */}
        <div className="px-5 space-y-6 pb-20">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 flex flex-col items-center w-full"
          >
            {/* Focus of the Day Input */}
            <div className="w-full bg-[#0D131A] p-5 rounded-[24px] border border-white/[0.03] flex flex-col items-center">
              <label className="text-[13px] font-medium text-[#56AB2F] uppercase tracking-wider mb-3 opacity-80">
                Foco do Dia
              </label>
              <div className="relative w-full max-w-[280px]">
                <input 
                  type="text" 
                  value={workoutData[activeTab].muscles}
                  onChange={(e) => handleMusclesChange(e.target.value)}
                  placeholder="Ex: Peito e Tríceps"
                  className="w-full h-11 bg-white/[0.03] px-4 rounded-xl text-[14px] font-medium border border-white/[0.05] focus:border-[#56AB2F]/40 outline-none text-center transition-all placeholder:text-slate-700"
                />
              </div>
            </div>

            {/* Exercises List */}
            <div className="w-full">
               <div className="flex flex-col items-center mb-5 text-center">
                 <h3 className="text-[16px] font-bold">Cronograma</h3>
                 <p className="text-[13px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Sessão de {activeTab.split('-')[0]}</p>
                 
                 <div className="mt-2 bg-[#56AB2F]/10 px-2 py-0.5 rounded-lg border border-[#56AB2F]/20">
                   <span className="text-[11px] font-bold text-[#56AB2F]">
                     {workoutData[activeTab].exercises.length} EXERCÍCIOS
                   </span>
                 </div>
               </div>

               <div className="space-y-3">
                 {workoutData[activeTab].exercises.length > 0 ? (
                   <AnimatePresence mode="popLayout">
                     {workoutData[activeTab].exercises.map((ex) => (
                       <motion.div 
                        key={ex.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-4 bg-white/[0.02] rounded-[20px] border border-white/[0.04] flex items-center justify-between group"
                       >
                         <div className="flex-1">
                           <h4 className="text-[15px] font-bold mb-2 group-hover:text-[#56AB2F] transition-colors">{ex.name}</h4>
                           <div className="flex gap-2">
                             <div className="flex items-center gap-1.5 bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/[0.05]">
                               <RotateCcw className="w-3 h-3 text-[#56AB2F]" />
                               <span className="text-[11px] font-medium text-slate-400">{ex.sets}s</span>
                             </div>
                             <div className="flex items-center gap-1.5 bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/[0.05]">
                               <Dumbbell className="w-3 h-3 text-[#56AB2F]" />
                               <span className="text-[11px] font-medium text-slate-400">{ex.reps}r</span>
                             </div>
                             {ex.rest && (
                               <div className="flex items-center gap-1.5 bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/[0.05]">
                                 <Clock className="w-3 h-3 text-[#56AB2F]" />
                                 <span className="text-[11px] font-medium text-slate-400">{ex.rest}</span>
                               </div>
                             )}
                           </div>
                         </div>
                         <div className="flex gap-2 ml-3">
                           <button onClick={() => openEditModal(ex)} className="p-2 bg-white/[0.03] rounded-lg text-slate-500"><Edit2 className="w-3.5 h-3.5" /></button>
                           <button onClick={() => handleDeleteExercise(ex.id)} className="p-2 bg-red-500/[0.02] rounded-lg text-slate-700 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                         </div>
                       </motion.div>
                     ))}
                   </AnimatePresence>
                 ) : (
                   <div className="py-10 text-center bg-white/[0.01] border border-dashed border-white/[0.05] rounded-[30px] flex flex-col items-center">
                     <p className="text-[13px] font-medium text-slate-600 mb-4 tracking-wide uppercase">Nenhum exercício para {activeTab.split('-')[0]}</p>
                     <button 
                      onClick={openAddModal}
                      className="px-6 py-3 bg-[#56AB2F]/10 text-[#56AB2F] rounded-xl font-bold text-[13px] border border-[#56AB2F]/20 active:scale-95"
                     >
                       Adicionar Primeiro
                     </button>
                   </div>
                 )}
               </div>

               <button 
                 onClick={openAddModal}
                 className="w-full mt-6 h-12 bg-white/[0.02] border border-dashed border-[#56AB2F]/30 rounded-xl text-[#56AB2F] font-bold text-[13px] flex items-center justify-center gap-2 hover:bg-[#56AB2F]/5 transition-all"
               >
                 <Plus className="w-4 h-4" />
                 ADICIONAR EXERCÍCIO
               </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating Save Button - Adjusted to 80% */}
      <div className="fixed bottom-0 left-0 right-0 p-5 z-50 flex justify-center">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F14] via-[#0A0F14]/90 to-transparent -z-10 h-[120%] -translate-y-1/2" />
        <button 
          onClick={handleFinalSave}
          disabled={isSaving}
          className={`h-12 w-[80%] max-w-[320px] rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 shadow-2xl transition-all ${
            isSaving 
            ? 'bg-slate-900 text-slate-700 border border-white/[0.05]' 
            : 'bg-[#56AB2F] text-white active:scale-95 shadow-[#56AB2F]/20'
          }`}
        >
          {isSaving ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isSaving ? 'SALVANDO...' : 'SALVAR PLANO'}
        </button>
      </div>

      {/* Compact Exercise Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center items-center justify-center p-5">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-[#04080C]/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#0D131A] w-full max-w-sm rounded-[32px] p-8 relative border border-white/5 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[18px] font-bold">{editingExerciseId ? 'Editar' : 'Novo'} Exercício</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/5 rounded-xl"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-[#56AB2F] ml-1">Nome</label>
                  <input type="text" value={exerciseForm.name} onChange={e => setExerciseForm({...exerciseForm, name: e.target.value})} placeholder="Supino Reto..." className="w-full h-11 bg-white/[0.03] px-4 rounded-xl text-[14px] font-medium border border-white/10 outline-none focus:border-[#56AB2F]/50" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-[#56AB2F] ml-1">Séries</label>
                    <input type="text" value={exerciseForm.sets} onChange={e => setExerciseForm({...exerciseForm, sets: e.target.value})} placeholder="4" className="w-full h-11 bg-white/[0.03] px-4 rounded-xl text-[14px] font-medium border border-white/10 outline-none text-center focus:border-[#56AB2F]/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-[#56AB2F] ml-1">Reps</label>
                    <input type="text" value={exerciseForm.reps} onChange={e => setExerciseForm({...exerciseForm, reps: e.target.value})} placeholder="12" className="w-full h-11 bg-white/[0.03] px-4 rounded-xl text-[14px] font-medium border border-white/10 outline-none text-center focus:border-[#56AB2F]/50" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-[#56AB2F] ml-1">Descanso</label>
                  <input type="text" value={exerciseForm.rest} onChange={e => setExerciseForm({...exerciseForm, rest: e.target.value})} placeholder="60s" className="w-full h-11 bg-white/[0.03] px-4 rounded-xl text-[14px] font-medium border border-white/10 outline-none focus:border-[#56AB2F]/50" />
                </div>

                <button onClick={handleSaveExercise} className="w-full h-12 bg-[#56AB2F] text-white rounded-xl font-bold text-[15px] shadow-lg shadow-[#56AB2F]/20 active:scale-95 transition-all mt-4">
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
