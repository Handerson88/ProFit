import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, Loader2, Trophy, Dumbbell, Info, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { BottomNav } from '../components/BottomNav';

export const WorkoutSession = () => {
  const { day } = useParams();
  const navigate = useNavigate();
  const [activePlan, setActivePlan] = useState<any>(null);
  const [dayWorkout, setDayWorkout] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [exerciseProgress, setExerciseProgress] = useState<Record<string, { completed: boolean; sets: number[] }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [expandedTip, setExpandedTip] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const { langData } = useLanguage();

  useEffect(() => { fetchWorkoutData(); }, [day]);

  const fetchWorkoutData = async () => {
    try {
      setIsLoading(true);
      const rawPlan = await api.workouts.getActive();
      if (!rawPlan) { navigate('/workout'); return; }

      let plan = rawPlan;
      if (typeof plan.structured_plan === 'string') {
        try { plan.structured_plan = JSON.parse(plan.structured_plan); } catch (e) {}
      }
      setActivePlan(plan);

      const found = plan.structured_plan?.daily_workouts?.find((dw: any) => dw.day === day);
      if (!found) { navigate('/workout'); return; }
      setDayWorkout(found);
      setExercises(found.exercises || []);

      const progress = await api.workouts.getExerciseProgress(plan.id, day!);
      const progressMap: Record<string, { completed: boolean; sets: number[] }> = {};
      progress.forEach((p: any) => {
        progressMap[p.exercise_name] = { completed: p.completed, sets: p.completed_sets || [] };
      });
      setExerciseProgress(progressMap);
    } catch (err) {
      console.error('Failed to fetch workout data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSet = async (exercise: any, setIndex: number) => {
    const name = exercise.name;
    const cur = exerciseProgress[name] || { completed: false, sets: [] };
    const newSets = cur.sets.includes(setIndex)
      ? cur.sets.filter(s => s !== setIndex)
      : [...cur.sets, setIndex];

    if (!cur.sets.includes(setIndex) && 'vibrate' in navigator) navigator.vibrate(10);

    const isCompleted = newSets.length >= Number(exercise.sets);
    const newProg = { ...exerciseProgress, [name]: { completed: isCompleted, sets: newSets } };
    setExerciseProgress(newProg);

    try {
      setIsUpdating(name);
      await api.workouts.markExerciseComplete(activePlan.id, name, day!, isCompleted, newSets);
      if (Object.values(newProg).filter((p: any) => p.completed).length === exercises.length) {
        handleFullWorkoutComplete();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleMarkAllDone = async (exercise: any) => {
    const name = exercise.name;
    const setsCount = Number(exercise.sets) || 4;
    const allSets = Array.from({ length: setsCount }, (_, i) => i);
    const newProg = { ...exerciseProgress, [name]: { completed: true, sets: allSets } };
    setExerciseProgress(newProg);
    try {
      setIsUpdating(name);
      await api.workouts.markExerciseComplete(activePlan.id, name, day!, true, allSets);
      if (Object.values(newProg).filter((p: any) => p.completed).length === exercises.length) {
        handleFullWorkoutComplete();
      }
    } catch (e) { console.error(e); } finally { setIsUpdating(null); }
  };

  const handleFullWorkoutComplete = async () => {
    try {
      await api.workouts.markComplete(activePlan.id, day!);
      setShowSuccess(true);
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
    } catch (err) { console.error(err); }
  };

  const completedCount = Object.values(exerciseProgress).filter(p => p.completed).length;
  const totalExercises = exercises.length;
  const progressPct = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;
  const durationMinutes = Math.floor((Date.now() - startTime) / 60000) || 45;
  const caloriesBurned = exercises.length * 45;

  const grouped: Record<string, any[]> = exercises.reduce((acc: any, ex: any) => {
    const g = ex.muscle_group || langData.wk_general || 'Geral';
    if (!acc[g]) acc[g] = [];
    acc[g].push(ex);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="main-wrapper bg-[var(--bg-app)]">
        <div className="app-container flex flex-col items-center justify-center min-h-screen">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <Loader2 className="w-10 h-10 text-[#56AB2F]" />
          </motion.div>
          <p className="text-[var(--text-muted)] font-bold text-sm mt-4 italic">{langData.wk_preparing}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-wrapper bg-[var(--bg-app)]">
      <div className="app-container pb-32">

        {/* ── Sticky Header ── */}
        <div className="page-header pt-10">
          <button
            onClick={() => navigate('/workout')}
            className="btn-icon flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-[#56AB2F] uppercase tracking-[0.2em] leading-none mb-0.5">
              {langData.wk_ia_title}
            </p>
            <h1 className="text-[17px] font-black text-[var(--text-main)] leading-tight truncate">{day}</h1>
          </div>

          {progressPct > 0 && (
            <div className="flex-shrink-0 h-8 px-3 rounded-xl bg-[#56AB2F]/10 border border-[#56AB2F]/20 flex items-center">
              <span className="text-[11px] font-black text-[#56AB2F]">{Math.round(progressPct)}%</span>
            </div>
          )}
        </div>

        <div className="px-5 pt-5 space-y-4">

          {/* ── Muscle group + progress row ── */}
          <div className="card-premium flex items-center gap-4">
            <div className="w-12 h-12 bg-[#56AB2F]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Dumbbell className="w-6 h-6 text-[#56AB2F]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[var(--text-main)] font-black text-[15px] truncate">
                {dayWorkout?.muscles || day}
              </p>
              <p className="text-[var(--text-muted)] text-[11px] font-bold mt-0.5">
                {totalExercises} {langData.wk_exercises} · {langData.wk_est_kcal} ~{caloriesBurned} kcal
              </p>
            </div>
          </div>

          {/* ── Progress bar card ── */}
          <div className="card-premium space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                {langData.wk_total_progress}
              </p>
              <p className="text-[11px] font-black text-[#56AB2F]">
                {completedCount} {langData.wk_of} {totalExercises} {langData.wk_exercises}
              </p>
            </div>
            <div className="w-full h-2 bg-[var(--border-main)] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ type: 'spring', stiffness: 60 }}
                className="h-full bg-gradient-to-r from-[#A8E063] to-[#56AB2F] rounded-full"
              />
            </div>
          </div>

          {/* ── Coach Tip ── */}
          {dayWorkout?.coach_tip && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-premium flex items-start gap-4"
            >
              <div className="w-10 h-10 bg-[#56AB2F]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-[#56AB2F]" />
              </div>
              <div>
                <span className="text-[10px] font-black text-[#56AB2F] uppercase tracking-[0.2em] block mb-1">
                  {langData.wk_coach_tip}
                </span>
                <p className="text-[12px] font-medium text-[var(--text-muted)] leading-relaxed">
                  "{dayWorkout.coach_tip}"
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Exercise groups ── */}
          {Object.entries(grouped).map(([muscleGroup, groupExercises]: [string, any[]], groupIdx: number) => (
            <div key={muscleGroup} className="space-y-3">

              {/* Group label */}
              <div className="flex items-center gap-2 px-1 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#56AB2F] flex-shrink-0" />
                <span className="section-label">{muscleGroup}</span>
                <div className="flex-1 h-px bg-[var(--border-main)]" />
              </div>

              {groupExercises.map((ex: any, idx: number) => {
                const prog = exerciseProgress[ex.name] || { completed: false, sets: [] };
                const isDone = prog.completed;
                const setsCount = Number(ex.sets) || 4;
                const showTip = expandedTip === ex.name;

                return (
                  <motion.div
                    key={ex.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: groupIdx * 0.08 + idx * 0.05 }}
                    className={`card-premium relative overflow-hidden transition-all ${
                      isDone ? 'border-[#56AB2F]/20' : ''
                    }`}
                    style={isDone ? { borderColor: 'rgba(86,171,47,0.2)' } : {}}
                  >
                    {/* Saving overlay */}
                    {isUpdating === ex.name && (
                      <div className="absolute inset-0 bg-[var(--bg-card)]/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                        <Loader2 className="w-5 h-5 animate-spin text-[#56AB2F]" />
                      </div>
                    )}

                    {/* ── Exercise name row ── */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-[15px] font-black leading-snug ${
                          isDone ? 'text-[var(--text-muted)] line-through decoration-[#56AB2F]/40' : 'text-[var(--text-main)]'
                        }`}>
                          {ex.name}
                        </h3>
                        <p className="text-[11px] font-bold text-[var(--text-muted)] mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          {langData.wk_rest}: {ex.rest}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {ex.instructions && !isDone && (
                          <button
                            onClick={() => setExpandedTip(showTip ? null : ex.name)}
                            className={`btn-icon ${showTip ? 'border-[#56AB2F]/30 text-[#56AB2F]' : ''}`}
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isDone && (
                          <div className="w-8 h-8 rounded-xl bg-[#56AB2F]/10 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-[#56AB2F]" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Reps / Sets tiles ── */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="card-secondary">
                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">
                          {langData.wk_suggested_load}
                        </p>
                        <p className="text-[14px] font-black text-[var(--text-main)]">
                          {ex.reps}
                          <span className="text-[10px] font-bold text-[var(--text-muted)] ml-1">reps</span>
                        </p>
                      </div>
                      <div className="card-secondary">
                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">
                          {langData.wk_volume}
                        </p>
                        <p className="text-[14px] font-black text-[var(--text-main)]">
                          {ex.sets}
                          <span className="text-[10px] font-bold text-[var(--text-muted)] ml-1">{langData.wk_sets_series}</span>
                        </p>
                      </div>
                    </div>

                    {/* ── Instructions (collapsible) ── */}
                    <AnimatePresence>
                      {showTip && ex.instructions && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="card-secondary">
                            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed italic">
                              "{ex.instructions}"
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* ── Sets buttons ── */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                          {langData.wk_completed_sets}
                        </span>
                        <span className="text-[10px] font-black text-[#56AB2F]">
                          {prog.sets.length}/{setsCount}
                        </span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {Array.from({ length: setsCount }).map((_, i) => {
                          const done = prog.sets.includes(i);
                          return (
                            <button
                              key={i}
                              onClick={() => handleToggleSet(ex, i)}
                              className={`w-12 h-12 rounded-xl font-black text-sm flex items-center justify-center border transition-all active:scale-90 ${
                                done
                                  ? 'bg-[#56AB2F] border-[#56AB2F] text-white shadow-lg shadow-[#56AB2F]/20'
                                  : 'bg-transparent border-[var(--border-strong)] text-[var(--text-muted)] hover:border-[#56AB2F]/40'
                              }`}
                            >
                              {done ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── Mark all done ── */}
                    {!isDone && (
                      <button
                        onClick={() => handleMarkAllDone(ex)}
                        className="btn-secondary text-sm h-11"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#56AB2F]" />
                        <span>{langData.wk_mark_done}</span>
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}

          {/* ── Force finish button (partial progress) ── */}
          {completedCount > 0 && completedCount < totalExercises && (
            <button
              onClick={handleFullWorkoutComplete}
              className="w-full py-4 rounded-[var(--radius-xl)] border border-[var(--border-main)] text-[var(--text-muted)] font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Zap className="w-4 h-4" />
              {langData.wk_finish_workout}
            </button>
          )}

        </div>

        <BottomNav />
      </div>

      {/* ── Success Modal ── */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-md p-4 pb-8"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-[40px] p-8 text-center"
            >
              {/* Trophy icon */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-[#56AB2F]/15 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Trophy className="w-11 h-11 text-[#56AB2F]" />
                </div>
              </div>

              <h3 className="text-2xl font-black text-[var(--text-main)] mb-1">
                {langData.wk_workout_done}
              </h3>
              <p className="text-[var(--text-muted)] font-bold text-sm mb-7">
                "{langData.wk_excellent_work}"
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-7">
                <div className="card-secondary text-center py-4">
                  <p className="text-[9px] font-black text-[#56AB2F] uppercase tracking-widest mb-2">
                    {langData.wk_est_kcal}
                  </p>
                  <p className="text-2xl font-black text-[var(--text-main)]">~{caloriesBurned}</p>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold">kcal</p>
                </div>
                <div className="card-secondary text-center py-4">
                  <p className="text-[9px] font-black text-[#56AB2F] uppercase tracking-widest mb-2">
                    {langData.wk_time}
                  </p>
                  <p className="text-2xl font-black text-[var(--text-main)]">{durationMinutes}</p>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold">min</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/workout')}
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #56AB2F 0%, #A8E063 100%)' }}
              >
                {langData.wk_see_tomorrow}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
