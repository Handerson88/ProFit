import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, Star, Utensils, Zap, Target, Crown, 
  ArrowLeft, Lock, CheckCircle2, Trophy 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const iconMap: any = {
  Star,
  Utensils,
  Zap,
  Target,
  Crown
};

export const Achievements = () => {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [userEarned, setUserEarned] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [all, mine] = await Promise.all([
          api.achievements.getAll(),
          api.achievements.getMy()
        ]);
        setAchievements(all);
        setUserEarned(mine);
      } catch (err) {
        console.error("Failed to load achievements", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const isEarned = (id: string) => userEarned.some(ua => ua.id === id || ua.achievement_id === id);
  const getEarnedDate = (id: string) => {
    const earned = userEarned.find(ua => ua.id === id || ua.achievement_id === id);
    return earned ? new Date(earned.earned_at).toLocaleDateString('pt-BR') : null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)]">
        <div className="w-12 h-12 border-4 border-[var(--border-main)] border-t-[#56AB2F] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="main-wrapper bg-[#F8FAFC]">
      <div className="app-container min-h-screen pb-24">
        {/* Header */}
        <div className="px-6 pt-12 pb-8 flex items-center justify-between sticky top-0 z-40 bg-[#F8FAFC]/80 backdrop-blur-md">
          <button 
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-[var(--bg-card)] rounded-2xl flex items-center justify-center shadow-sm active:scale-90 transition-all text-[var(--text-main)] border border-[var(--border-main)]"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Conquistas</h1>
            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{userEarned.length} de {achievements.length} desbloqueados</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-yellow-500/20">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        <div className="px-6 space-y-8">
          {/* Summary Card */}
          <div className="bg-[var(--bg-card)] rounded-[40px] p-8 shadow-xl shadow-gray-200/50 border border-[var(--border-main)] flex items-center space-x-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#56AB2F]/10 to-[#A8E063]/10 flex items-center justify-center relative">
              <Award className="w-10 h-10 text-[#56AB2F]" />
              <div className="absolute -top-2 -right-2 bg-[#56AB2F] text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-4 border-white">
                {Math.round((userEarned.length / achievements.length) * 100)}%
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black text-[var(--text-main)] mb-1">Seu Progresso</h2>
              <p className="text-sm font-bold text-[var(--text-muted)]">Continue focado nas suas metas para desbloquear novos emblemas exclusivos.</p>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 gap-6">
            {achievements.map((ach, idx) => {
              const earned = isEarned(ach.id);
              const date = getEarnedDate(ach.id);
              const Icon = iconMap[ach.icon_name] || Star;

              return (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative overflow-hidden bg-[var(--bg-card)] rounded-[32px] p-6 border-2 transition-all duration-300 ${
                    earned ? 'border-[#56AB2F]/20' : 'border-[var(--border-main)]'
                  }`}
                >
                  {!earned && <div className="absolute inset-0 bg-[var(--bg-card)]/40 backdrop-blur-[1px] z-10" />}
                  
                  <div className="flex items-center space-x-6 relative z-20">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg transition-transform duration-500 ${
                      earned 
                        ? 'bg-gradient-to-br from-[#56AB2F] to-[#A8E063] text-white scale-100 rotate-0' 
                        : 'bg-gray-100 text-gray-300 scale-90 -rotate-6'
                    }`}>
                      {earned ? <Icon className="w-10 h-10" /> : <Lock className="w-8 h-8" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-lg font-black ${earned ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                          {ach.name}
                        </h3>
                        {earned && <CheckCircle2 className="w-5 h-5 text-[#56AB2F]" />}
                      </div>
                      <p className={`text-sm ${earned ? 'text-[var(--text-muted)]' : 'text-gray-300'} font-medium`}>
                        {ach.description}
                      </p>
                      {earned && (
                        <div className="mt-3 flex items-center space-x-2">
                           <span className="text-[10px] font-black text-[#56AB2F] uppercase tracking-widest bg-[#56AB2F]/5 px-3 py-1 rounded-full">
                             Conquistado em {date}
                           </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
