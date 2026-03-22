import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, Clock, Loader2, Trophy, Flame, ChevronRight, AlertCircle, PlayCircle, Info, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

export const WorkoutSession = () => {
  const { day } = useParams();
  const navigate = useNavigate();
  const [activePlan, setActivePlan] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [exerciseProgress, setExerciseProgress] = useState<Record<string, { completed: boolean, sets: number[] }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    fetchWorkoutData();
  }, [day]);

  const fetchWorkoutData = async () => {
    try {
      setIsLoading(true);
      const plan = await api.workouts.getActive();
      if (!plan) {
        navigate('/workout');
        return;
      }
      setActivePlan(plan);

      const dayWorkout = plan.structured_plan.daily_workouts.find((dw: any) => dw.day === day);
      if (!dayWorkout) {
        navigate('/workout');
        return;
      }
      setExercises(dayWorkout.exercises);

      // Fetch progress for this day
      const progress = await api.workouts.getExerciseProgress(plan.id, day!);
      const progressMap: Record<string, { completed: boolean, sets: number[] }> = {};
      progress.forEach((p: any) => {
        progressMap[p.exercise_name] = {
          completed: p.completed,
          sets: p.completed_sets || []
        };
      });
      setExerciseProgress(progressMap);

    } catch (err) {
      console.error('Failed to fetch workout data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSet = async (exercise: any, setIndex: number) => {
    const exerciseName = exercise.name;
    const currentProgress = exerciseProgress[exerciseName] || { completed: false, sets: [] };
    let newSets = [...currentProgress.sets];
    
    if (newSets.includes(setIndex)) {
      newSets = newSets.filter(s => s !== setIndex);
    } else {
      newSets.push(setIndex);
      // Haptic feedback
      if ('vibrate' in navigator) navigator.vibrate(10);
    }

    const totalSets = Number(exercise.sets);
    const isCompleted = newSets.length >= totalSets;

    const newProg = { ...exerciseProgress, [exerciseName]: { completed: isCompleted, sets: newSets } };
    setExerciseProgress(newProg);

    try {
      setIsUpdating(exerciseName);
      await api.workouts.markExerciseComplete(activePlan.id, exerciseName, day!, isCompleted, newSets);
      
      // Check if full workout is done
      const completedCount = Object.values(newProg).filter((p: any) => p.completed).length;
      if (completedCount === exercises.length) {
        handleFullWorkoutComplete();
      }
    } catch (err) {
      console.error('Failed to update set status', err);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleFullWorkoutComplete = async () => {
    try {
      await api.workouts.markComplete(activePlan.id, day!);
      setShowSuccess(true);
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
    } catch (err) {
      console.error('Failed to mark full workout as complete', err);
    }
  };

  const completedExercisesCount = Object.values(exerciseProgress).filter(p => p.completed).length;
  const totalExercises = exercises.length;
  const progressPercentage = totalExercises > 0 ? (completedExercisesCount / totalExercises) * 100 : 0;

  const durationMinutes = Math.floor((Date.now() - startTime) / 60000) || 45; // Simulated or real
  const caloriesBurned = exercises.length * 45; // Adjusted estimate for more exercises

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F6F7F9]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-[#56AB2F]" />
        </motion.div>
        <p className="text-gray-400 font-bold italic mt-4">Preparando seu treino de elite...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7F9] pb-32">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 flex justify-between items-center sticky top-0 z-40 bg-[#F6F7F9]/90 backdrop-blur-sm">
        <button onClick={() => navigate('/workout')} className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-black text-gray-900 leading-tight">Treino de {day}</h1>
          <p className="text-[10px] font-black text-[#56AB2F] uppercase tracking-widest flex items-center justify-center">
            <Flame className="w-3 h-3 mr-1 fill-current" />
            {activePlan?.structured_plan?.daily_workouts?.find((dw: any) => dw.day === day)?.muscles}
          </p>
        </div>
        <div className="w-12" />
      </div>

      <div className="px-6 space-y-6">
        {/* Coach Tip Header */}
        {activePlan?.structured_plan?.daily_workouts?.find((dw: any) => dw.day === day)?.coach_tip && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-[#1A1A1A] to-[#2D3436] rounded-[32px] p-6 text-white shadow-lg border border-white/5 relative overflow-hidden"
          >
            <div className="relative z-10 flex items-start space-x-4">
              <div className="w-10 h-10 bg-[#EAF5D5] rounded-xl flex items-center justify-center text-[#56AB2F] shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black text-[#A8E063] uppercase tracking-[0.2em] mb-1 block">Dica do Master Coach</span>
                <p className="text-sm font-bold leading-relaxed text-white/90">
                  "{activePlan.structured_plan.daily_workouts.find((dw: any) => dw.day === day).coach_tip}"
                </p>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#56AB2F]/10 rounded-full blur-2xl"></div>
          </motion.div>
        )}

        {/* Progress Card */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] p-6 shadow-xl shadow-gray-200/50 border border-gray-50 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy className="w-12 h-12 text-[#56AB2F]" />
          </div>
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Progresso Total</p>
              <h3 className="text-2xl font-black text-gray-900">{completedExercisesCount} de {totalExercises} <span className="text-sm text-gray-400 font-bold">exercícios</span></h3>
            </div>
            <span className="text-lg font-black text-[#56AB2F]">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full h-4 bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ type: "spring", stiffness: 50 }}
              className="h-full bg-gradient-to-r from-[#A8E063] to-[#56AB2F]"
            />
          </div>
        </motion.div>

        {/* Exercise List grouped by Muscle Group */}
        <div className="space-y-8">
          {Object.entries(
            exercises.reduce((acc: any, ex: any) => {
              const group = ex.muscle_group || 'geral';
              if (!acc[group]) acc[group] = [];
              acc[group].push(ex);
              return acc;
            }, {})
          ).map(([muscleGroup, groupExercises]: [any, any], groupIdx: number) => (
            <div key={muscleGroup} className="space-y-4">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center">
                <span className="w-2 h-2 bg-[#56AB2F] rounded-full mr-2"></span>
                {muscleGroup}
              </h4>
              
              <div className="space-y-4">
                {groupExercises.map((ex: any, idx: number) => {
                  const prog = exerciseProgress[ex.name] || { completed: false, sets: [] };
                  const isDone = prog.completed;
                  const setsCount = Number(ex.sets) || 4;

                  return (
                    <motion.div
                      key={ex.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (groupIdx * 0.2) + (idx * 0.1) }}
                      className={`bg-white rounded-[32px] shadow-sm border-2 transition-all p-6 relative overflow-hidden ${isDone ? 'border-[#56AB2F]/30 bg-[#F0F9EB]/20 shadow-none' : 'border-transparent shadow-gray-200/40'}`}
                    >
                      {isDone && (
                        <div className="absolute top-4 right-4">
                          <div className="bg-[#56AB2F] text-white p-1 rounded-full">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-start mb-4 pr-8">
                        <div>
                          <h3 className={`text-lg font-black leading-tight ${isDone ? 'text-gray-900/40' : 'text-gray-900'}`}>{ex.name}</h3>
                          <div className="flex gap-3 mt-2">
                             <div className="flex items-center text-[11px] font-bold text-gray-400">
                               <Clock className="w-3 h-3 mr-1" />
                               {ex.rest} descanso
                             </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100/50">
                          <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Carga sugerida</p>
                          <p className="text-sm font-black text-gray-900">{ex.reps} <span className="text-[10px] text-gray-400">reps</span></p>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100/50">
                          <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Volume</p>
                          <p className="text-sm font-black text-gray-900">{ex.sets} <span className="text-[10px] text-gray-400">séries</span></p>
                        </div>
                      </div>

                      {/* Technical Tip */}
                      <div className="flex gap-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-100/30 mb-6">
                        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] font-medium text-amber-900/70 italic leading-relaxed">"{ex.instructions}"</p>
                      </div>

                      {/* Sets Progression */}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Séries concluídas</span>
                          <span className="text-[10px] font-black text-[#56AB2F]">{prog.sets.length} / {setsCount}</span>
                        </div>
                        <div className="flex gap-2.5 flex-wrap">
                          {Array.from({ length: setsCount }).map((_, i) => {
                            const setCompleted = prog.sets.includes(i);
                            return (
                              <button
                                key={i}
                                onClick={() => handleToggleSet(ex, i)}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2 active:scale-90 ${
                                  setCompleted 
                                    ? 'bg-[#56AB2F] border-[#56AB2F] text-white shadow-lg shadow-[#56AB2F]/20' 
                                    : 'bg-white border-gray-100 text-gray-300 hover:border-[#56AB2F]/30 hover:text-[#56AB2F]'
                                }`}
                              >
                                {setCompleted ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                  <span className="text-xs font-black">{i + 1}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {isUpdating === ex.name && (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10 transition-opacity">
                          <Loader2 className="w-6 h-6 animate-spin text-[#56AB2F]" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[48px] p-10 text-center shadow-2xl relative z-10 max-w-sm w-full border border-gray-100"
            >
              <div className="w-24 h-24 bg-[#EAF5D5] rounded-full flex items-center justify-center mx-auto mb-8 relative">
                 <motion.div 
                    animate={{ scale: [1, 1.2, 1] }} 
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-[#56AB2F]/20 rounded-full"
                 />
                 <Trophy className="w-12 h-12 text-[#56AB2F] relative z-10" />
              </div>
              
              <h3 className="text-3xl font-black text-gray-900 mb-2">Treino Pago! 🔥</h3>
              <p className="text-gray-500 font-bold mb-8 italic">"Excelente trabalho hoje. O corpo responde ao esforço consistente!"</p>

              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="bg-[#FFF8F1] rounded-3xl p-4">
                  <p className="text-[10px] font-black text-orange-400 uppercase mb-1">Kcal Est.</p>
                  <p className="text-xl font-black text-gray-900">~{caloriesBurned}</p>
                </div>
                <div className="bg-[#F1F7FF] rounded-3xl p-4">
                  <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Tempo</p>
                  <p className="text-xl font-black text-gray-900">{durationMinutes}m</p>
                </div>
              </div>
              
              <button 
                onClick={() => navigate('/workout')}
                className="w-full py-5 bg-gradient-to-r from-[#A8E063] to-[#56AB2F] text-white rounded-[24px] font-black text-lg shadow-xl shadow-[#56AB2F]/30 active:scale-95 transition-all"
              >
                Até amanhã! 💪
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

