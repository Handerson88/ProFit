import React, { useState, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Flame, Activity, ArrowUpRight, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { motion } from 'framer-motion';
import { api } from '../services/api';

const formatDateLabel = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(today.getTime() - d.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  return `${diffDays} dias atrás`;
};

const WeeklyChart = ({ data, target }: { data: any[], target: number }) => {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const todayIndex = new Date().getDay(); // 0 for Sunday, 1 for Monday, etc.

  return (
    <div className="flex justify-between items-end h-56 mt-16 mb-6 relative px-2">
      {/* Target dashed line */}
      <div className="absolute top-[30%] left-0 w-full border-t-[1.5px] border-dashed border-gray-200 z-0"></div>

      {days.map((dayName, i) => {
        // Find the data for the current day, or default to 0 calories if not found
        const item = data.find(d => d.day.toLowerCase() === dayName.toLowerCase()) || { day: dayName, calories: 0 };
        const isActive = i === todayIndex;
        
        // Cap the visual height slightly above 100% so it doesn't break the container
        const boundedHeight = Math.min((Number(item.calories) / target) * 100, 110);
        const percent = Math.round((Number(item.calories) / target) * 100);
        
        return (
          <div key={i} className="flex flex-col items-center relative z-10 w-full">
            
            {/* Floating Label for Active Day */}
            {isActive && percent > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute -top-10 bg-[#1A1A1A] text-white text-[11px] font-black px-3 py-1.5 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.15)] z-20"
              >
                {percent}%
                {/* Small triangle pointer */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1A1A1A] rotate-45"></div>
              </motion.div>
            )}

            {/* Bar Track & Fill */}
            <div className={`flex flex-col items-center justify-end h-40 w-11 rounded-full overflow-hidden relative mb-4 ${isActive ? 'bg-transparent' : ''}`}>
              
              {/* Inactive Striped Background Pattern */}
              {!isActive && (
                <div className="absolute inset-0 opacity-20" 
                     style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, #cbd5e1 3px, #cbd5e1 6px)' }}>
                </div>
              )}
              
              {/* Inactive Solid Fill */}
              {!isActive && (
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${boundedHeight}%` }}
                  transition={{ duration: 1.2, delay: i * 0.1, ease: "easeOut" }}
                  className="w-full rounded-full bg-[#E5E9CA]/60 absolute bottom-0"
                />
              )}

              {/* Active Gradient Fill */}
              {isActive && (
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${boundedHeight}%` }}
                  transition={{ duration: 1.2, delay: i * 0.1, ease: "easeOut" }}
                  className="w-full rounded-full bg-gradient-to-t from-[#56AB2F] to-[#A8E063] shadow-[0_4px_15px_rgba(86,171,47,0.4)] absolute bottom-0 z-10"
                />
              )}
              
            </div>
            
            {/* Day Label */}
            <span translate="no" className={`text-[11px] font-bold uppercase tracking-wide ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
              {dayName}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const Statistics = () => {
  const navigate = useNavigate();
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [calorieHistory, setCalorieHistory] = useState<any[]>([]);
  const [targetCalories, setTargetCalories] = useState(2000);
  const [totalToday, setTotalToday] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profile, weekly, summary, history] = await Promise.all([
          api.user.getProfile(),
          api.meals.getWeeklyStats(),
          api.meals.getSummary(),
          api.meals.getCalorieHistory()
        ]);

        if (profile.daily_calorie_target) {
          setTargetCalories(profile.daily_calorie_target);
        }

        setWeeklyData(weekly);
        setCalorieHistory(history);
        const todayTotal = summary.summary.reduce((acc: number, item: any) => acc + Number(item.calories), 0);
        setTotalToday(todayTotal);
      } catch (err) {
        console.error("Failed to load statistics", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="main-wrapper bg-[#F6F7F9]">
      <div className="app-container pb-32 bg-transparent shadow-none border-none">
      
      {/* Top Header */}
      <div className="px-6 pt-12 pb-6 flex justify-between items-center sticky top-0 z-40 bg-[#F6F7F9]/90 backdrop-blur-sm">
        <button 
          onClick={() => navigate(-1)}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[22px] font-bold text-gray-900">Statistic</h1>
        <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all text-gray-700 hover:text-gray-900">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div className="px-6">
        <motion.div
           initial={{ opacity: 0, y: 15 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
        >
          {/* Calorie Statistics Card */}
          <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-4">
            <div className="flex justify-between items-start">
               <div className="flex items-center space-x-2">
                 <div className="text-gray-800">
                   <Flame className="w-6 h-6 fill-gray-800" />
                 </div>
                 <div className="flex items-baseline space-x-1 mt-1">
                    <span className="text-[28px] font-black text-gray-900 leading-none tracking-tight">
                      {isLoading ? '...' : totalToday}
                    </span>
                    <span className="text-sm font-bold text-gray-400">kcal</span>
                 </div>
               </div>
               <div className="text-right mt-1.5">
                 <p className="text-[13px] font-medium text-gray-400">Target: <span className="font-bold text-gray-800">{targetCalories}</span> kcal</p>
               </div>
            </div>

            {isLoading ? (
              <div className="h-56 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <WeeklyChart data={weeklyData} target={targetCalories} />
            )}
          </div>

          {/* Today's Calories Card (Replaces Heart Rate) */}
          <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-4 relative overflow-hidden group hover:shadow-lg transition-shadow">
             <div className="flex justify-between items-start mb-8">
               <div>
                 <h3 className="text-lg font-bold text-gray-900">Calorias de Hoje</h3>
                 <p className="text-sm font-medium text-gray-400">Total consumido hoje</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-[#F0F9EB] flex items-center justify-center text-[#56AB2F] group-hover:bg-[#E5E9CA] transition-colors">
                 <Flame className="w-5 h-5 fill-current" />
               </div>
             </div>
             
             <div className="flex justify-between items-end relative z-10">
               <div className="flex items-baseline space-x-1">
                 <span className="text-4xl font-black text-gray-900">{totalToday}</span>
                 <span className="text-sm font-bold text-gray-400">kcal</span>
               </div>
               
               <div className="w-1/2 h-14 translate-y-2 opacity-90">
                  <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
                    <motion.path 
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                      d="M0,35 L10,30 L20,32 L30,25 L40,28 L50,15 L60,20 L70,10 L80,15 L90,5 L100,8" 
                      fill="none" 
                      stroke="#56AB2F" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  </svg>
               </div>
             </div>
          </div>

          {/* Calorie History - Horizontal Scroll */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-6 pl-1">
              <h3 className="text-xl font-bold text-gray-900">Histórico de Calorias</h3>
              <button className="text-[13px] font-black text-[#56AB2F] bg-[#F0F9EB] px-4 py-1.5 rounded-full shadow-sm active:scale-95 transition-all">
                Ver tudo
              </button>
            </div>
            
            <div className="flex space-x-4 overflow-x-auto pb-8 scrollbar-hide px-1 -mx-1 snap-x">
              {calorieHistory
                .filter(h => formatDateLabel(h.date) !== 'Hoje')
                .slice(0, 7)
                .map((record, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-shrink-0 w-[170px] h-[120px] bg-white rounded-[28px] p-5 shadow-[0_8px_25px_rgba(0,0,0,0.03)] border border-gray-50/50 flex flex-col justify-between snap-start"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[14px] font-black text-gray-900 leading-tight">
                      {formatDateLabel(record.date)}
                    </span>
                    <div className="w-7 h-7 bg-[#F8F9FA] rounded-full flex items-center justify-center">
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="flex items-baseline space-x-1">
                    <span className="text-[26px] font-black text-gray-900 tracking-tight">
                      {record.calories}
                    </span>
                    <span className="text-[11px] font-bold text-gray-400">kcal</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <BottomNav />
      </div>
    </div>
  );
};
