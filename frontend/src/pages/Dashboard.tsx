import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Bell, MoreVertical, Droplets, Footprints, Camera, Target, Flame, Clock, Crown } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { BottomNav } from '../components/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { socketService } from '../services/socket';

import { CalendarModal } from '../components/CalendarModal';
import { EditMealModal } from '../components/EditMealModal';
import { InviteModal } from '../components/InviteModal';
import { PremiumBanner } from '../components/PremiumBanner';
import { MilestonePopUp } from '../components/MilestonePopUp';
import { appService } from '../services/appService';
import { useAuth } from '../context/AuthContext';
import { Trash2, Edit3, AlertCircle, X, UserPlus, Gift } from 'lucide-react';


const formatDateHeader = (date: Date) => {
  const today = new Date();
  if (date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
    return 'Hoje';
  }
  const formatter = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' });
  const formatted = formatter.format(date);
  // capitalize month
  return formatted.replace(/ de [a-z]/g, (match) => match.toUpperCase());
};

const CalendarSlider = ({ selectedDate, onSelectDate, onOpenCalendar }: { selectedDate: Date, onSelectDate: (d: Date) => void, onOpenCalendar: () => void }) => {
  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const [calendarDays, setCalendarDays] = useState<{date: Date, day: string, dayNum: number}[]>([]);

  useEffect(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const generated = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      generated.push({
        date: d,
        day: dayLabels[d.getDay()],
        dayNum: d.getDate()
      });
    }
    setCalendarDays(generated);
  }, []);

  return (
    <div className="bg-[#EAF5D5] rounded-[32px] p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <div 
          onClick={onOpenCalendar}
          className="flex items-center space-x-2 cursor-pointer active:scale-95 transition-transform bg-white/50 px-3 py-1.5 rounded-full shadow-sm"
        >
          <span className="font-bold text-lg text-gray-900">{formatDateHeader(selectedDate)}</span>
          <ChevronRight className="w-4 h-4 text-gray-700 rotate-90" />
        </div>
        <div className="flex space-x-2">
          <button className="w-8 h-8 flex justify-center items-center bg-white rounded-full shadow-sm active:scale-95 transition-all text-gray-700">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 flex justify-center items-center border-2 border-white/50 bg-white/50 rounded-full cursor-not-allowed">
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
      <div className="flex justify-between items-end">
        {calendarDays.map((item, i) => {
          const isSelected = selectedDate.getDate() === item.date.getDate() && selectedDate.getMonth() === item.date.getMonth() && selectedDate.getFullYear() === item.date.getFullYear();
          const isToday = i === 6;
          return (
            <div 
              key={i} 
              onClick={() => onSelectDate(item.date)}
              className="flex flex-col items-center group cursor-pointer active:scale-95 transition-all"
            >
              <span translate="no" className={`text-[11px] font-bold mb-3 ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>
                {item.day}
              </span>
              <div className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 relative ${
                isSelected 
                  ? 'bg-gradient-to-r from-[#A8E063] to-[#56AB2F] shadow-md shadow-primary/20 text-white' 
                  : 'bg-white text-gray-700 shadow-sm'
              }`}>
                <span className={`text-sm font-bold`}>{item.dayNum}</span>
                {isToday && !isSelected && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-[#56AB2F] rounded-full"></div>
                )}
                {isToday && isSelected && (
                  <div className="absolute top-1 right-1 w-2 border border-white h-2 bg-gradient-to-r from-[#A8E063] to-[#56AB2F] rounded-full"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};





const SummaryCard = ({ total, target, summary, meals, weeklyData, dailyTotals }: any) => {
  const safeTarget = target > 0 ? target : 2000;
  const percent = Math.min((total / safeTarget) * 100, 100);
  
  // 1. Use backend aggregate if available
  // 2. Fallback: Calculation from summary grouping
  // 3. Last resort: Sum the meals array directly (most robust)
  let protein = dailyTotals?.protein || (summary || []).reduce((acc: number, s: any) => acc + (Number(s.protein) || 0), 0);
  let carbs = dailyTotals?.carbs || (summary || []).reduce((acc: number, s: any) => acc + (Number(s.carbs) || 0), 0);
  let fat = dailyTotals?.fat || (summary || []).reduce((acc: number, s: any) => acc + (Number(s.fat) || 0), 0);
  
  // If we have meals but macros are still 0, it means the summary query might have mismatched dates
  // but the meals list matches (or vice versa). Let's sum from meals as a hard fallback.
  if (protein === 0 && carbs === 0 && fat === 0 && Array.isArray(meals) && meals.length > 0) {
    meals.forEach((m: any) => {
      protein += (Number(m.protein) || 0);
      carbs += (Number(m.carbs) || 0);
      fat += (Number(m.fat) || 0);
    });
  }

  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const todayIndex = new Date().getDay();

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] mb-8 border border-gray-50/50">
      {/* Header Info */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-[#F0F9EB] rounded-2xl flex items-center justify-center text-[#56AB2F]">
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-black text-gray-900 leading-none">{total}</span>
              <span className="text-sm font-bold text-gray-400">kcal</span>
            </div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Consumido hoje</p>
          </div>
        </div>
        <div className="text-right pt-1">
          <p className="text-[13px] font-medium text-gray-400">Meta: <span className="font-bold text-gray-900">{target}</span> kcal</p>
          <div className="mt-1 inline-flex items-center px-2 py-0.5 bg-[#F0F9EB] rounded-full">
            <span className="text-[10px] font-black text-[#56AB2F]">{Math.round(percent)}% da meta</span>
          </div>
        </div>
      </div>

      {/* Vertical Chart Section */}
      <div className="flex justify-between items-end h-32 mb-8 px-1 relative">
        {/* Target dashed line */}
        <div className="absolute top-[30%] left-0 w-full border-t border-dashed border-gray-100 z-0"></div>
        
        {days.map((day, i) => {
          const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
          const dayData = (weeklyData || []).find((d: any) => d?.day?.toLowerCase() === dayKeys[i]) || { calories: 0 };
          const isActive = i === todayIndex;
          const calories = Number(dayData?.calories) || 0;
          const safeTarget = target > 0 ? target : 2000;
          const barHeight = Math.min((calories / safeTarget) * 100, 100);
          const barPercent = Math.round(barHeight);

          return (
            <div key={i} className="flex flex-col items-center flex-1 h-full relative z-10">
              {isActive && barPercent > 0 && (
                <div className="absolute -top-7 bg-[#1A1A1A] text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg z-20">
                  {barPercent}%
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#1A1A1A] rotate-45"></div>
                </div>
              )}
              <div className="w-[18px] bg-gray-50 rounded-full flex-1 mb-2 relative overflow-hidden flex flex-col justify-end">
                <motion.div 
                   initial={{ height: 0 }}
                   animate={{ height: `${barHeight}%` }}
                   transition={{ duration: 1, ease: "easeOut", delay: i * 0.05 }}
                   className={`w-full rounded-full ${isActive ? 'bg-gradient-to-t from-[#56AB2F] to-[#A8E063]' : 'bg-[#E5E9CA]'}`}
                />
              </div>
              <span translate="no" className={`text-[9px] font-bold uppercase ${isActive ? 'text-gray-900' : 'text-gray-300'}`}>{day}</span>
            </div>
          );
        })}
      </div>

      {/* Macros Row */}
      <div className="grid grid-cols-3 gap-3 pt-6 border-t border-gray-50">
        <div className="bg-[#FFF8F1] rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold text-orange-400 uppercase mb-1">Proteína</p>
          <p className="text-base font-black text-gray-900">{Math.round(Number(protein) || 0)}g</p>
        </div>
        <div className="bg-[#F1F7FF] rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Carbos</p>
          <p className="text-base font-black text-gray-900">{Math.round(Number(carbs) || 0)}g</p>
        </div>
        <div className="bg-[#FFF1F1] rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Gordura</p>
          <p className="text-base font-black text-gray-900">{Math.round(Number(fat) || 0)}g</p>
        </div>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const { totalUsersCount } = useAuth();
  const [recentMeals, setRecentMeals] = useState<any[]>([]);
  const [userName, setUserName] = useState('Usuário');
  const [userGoal, setUserGoal] = useState('');
  const [meals, setMeals] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [steps, setSteps] = useState(0);
  const [water, setWater] = useState(0);
  const [totalToday, setTotalToday] = useState(0);
  const [targetCalories, setTargetCalories] = useState(2000);
  const [profile, setProfile] = useState<any>(null);
  const [calorieHistory, setCalorieHistory] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyCache, setDailyCache] = useState<Record<string, any>>({});
  const [dailyTotals, setDailyTotals] = useState<any>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [mealToDelete, setMealToDelete] = useState<string | null>(null);
  const [appStatus, setAppStatus] = useState({ totalUsers: 0, monetizationEnabled: false });
  const [showMilestone, setShowMilestone] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      const status = await appService.getStatus();
      setAppStatus(status);
      
      const milestoneSeen = localStorage.getItem('milestone_20_users_seen');
      if (status.monetizationEnabled && !milestoneSeen) {
        setShowMilestone(true);
      }
    };
    fetchStatus();
  }, []);

  const handleCloseMilestone = () => {
    localStorage.setItem('milestone_20_users_seen', 'true');
    setShowMilestone(false);
  };  useEffect(() => {
    const loadDashboardData = async () => {
      // Don't set loading if we have cache, unless it's today (to ensure fresh scan results)
      const dateStr = [
        selectedDate.getFullYear(),
        String(selectedDate.getMonth() + 1).padStart(2, '0'),
        String(selectedDate.getDate()).padStart(2, '0')
      ].join('-');
      const isToday = selectedDate.toDateString() === new Date().toDateString();

      if (!dailyCache[dateStr] || isToday) {
        setIsLoading(true);
      }

      try {
        const data = await api.user.getDashboardBootstrap(dateStr);
        
        // Populate all states from the single bootstrap response
        setProfile(data.profile);
        const fullName = data.profile?.name || data.profile?.first_name;
        if (fullName) {
          setUserName(fullName.split(' ')[0]);
        }
        setTargetCalories(Number(data.profile.daily_calorie_target) || 2000);
        setUserGoal(data.profile.goal || '');
        setUnreadNotifications(data.unreadNotificationsCount);
        setRecentMeals(data.recentMeals);
        setWeeklyData(data.weeklyStats);

        const ds = data.dailySummary;
        setSummary(ds.summary || []);
        setMeals(ds.meals || []);
        setSteps(ds.steps || 0);
        setWater(ds.water || 0);
        setDailyTotals(ds.totals || null);
        
        const total = ds.totals?.calories || (ds.summary || []).reduce((acc: number, item: any) => acc + (Number(item.calories) || 0), 0);
        setTotalToday(total);
        
        setDailyCache(prev => ({ ...prev, [dateStr]: ds }));

        // Only show prompt on initial mount (if needed)
        const promptDismissed = localStorage.getItem('notification_prompt_dismissed');
        if (data.profile && (data.profile.notifications_enabled === false || data.profile.notifications_enabled === null) && !promptDismissed) {
          setShowNotificationPrompt(true);
        }
      } catch (err) {
        console.error("Dashboard Bootstrap Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [selectedDate]);

  // Separate effect for one-time setup (sockets, events)
  useEffect(() => {
    
    socketService.connect();
    
    // Socket Integration
    try {
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined' && userStr !== 'null') {
        try {
          const user = JSON.parse(userStr);
          if (user && user.id) {
            socketService.connect();
            const socket = socketService.getSocket();
            
            socket?.emit('join_user', user.id);
  
            socket?.on('new_notification', (notif: any) => {
                setUnreadNotifications(prev => prev + 1);
                console.log('New notification received:', notif);
            });
  
            socket?.on('meal_added', (data: any) => {
                console.log('Real-time sync: Meal added, refreshing...', data);
                refreshData();
            });
          }
        } catch (parseError) {
          console.error("Failed to parse user from localStorage", parseError);
        }
      }
    } catch (e) {
      console.error("Socket connection failed", e);
    }

    // Refresh on focus / visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('App became visible, refreshing data...');
        refreshData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', refreshData);

    return () => {
        socketService.disconnect();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', refreshData);
    };
  }, []);

  const handleEnableNotifications = async () => {
    try {
      // Always update backend setting
      await api.user.updateNotificationSettings(true);
      
      if ('Notification' in window) {
        await Notification.requestPermission();
      }
      
      localStorage.setItem('notification_prompt_dismissed', 'true');
      setShowNotificationPrompt(false);
    } catch (err) {
      console.error("Failed to enable notifications", err);
      // Still dismiss if it fails to avoid loop
      setShowNotificationPrompt(false);
    }
  };

  const handleDismissNotifications = () => {
    localStorage.setItem('notification_prompt_dismissed', 'true');
    setShowNotificationPrompt(false);
  };


  const refreshData = async () => {
    const dateStr = [
      selectedDate.getFullYear(),
      String(selectedDate.getMonth() + 1).padStart(2, '0'),
      String(selectedDate.getDate()).padStart(2, '0')
    ].join('-');
    
    try {
      const data = await api.user.getDashboardBootstrap(dateStr);
      
      setProfile(data.profile);
      setRecentMeals(data.recentMeals);
      setWeeklyData(data.weeklyStats);
      
      const ds = data.dailySummary;
      setSummary(ds.summary || []);
      setMeals(ds.meals || []);
      setSteps(ds.steps || 0);
      setWater(ds.water || 0);
      setDailyTotals(ds.totals || null);
      
      const total = ds.totals?.calories || (ds.summary || []).reduce((acc: number, item: any) => acc + (Number(item.calories) || 0), 0);
      setTotalToday(total);
      setUnreadNotifications(data.unreadNotificationsCount);
      
      setDailyCache(prev => ({ ...prev, [dateStr]: ds }));
    } catch (err) {
      console.error("Failed to refresh data", err);
    }
  };

  const handleEditMeal = (meal: any) => {
    setSelectedMeal(meal);
    setIsEditModalOpen(true);
  };

  const handleSaveMeal = async (id: string, data: any) => {
    try {
      await api.meals.update(id, data);
      await refreshData();
    } catch (err) {
      console.error("Failed to update meal", err);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      await api.meals.delete(id);
      await refreshData();
      setMealToDelete(null);
    } catch (err) {
      console.error("Failed to delete meal", err);
    }
  };

  const getMealTotal = (type: string) => {
    if (!summary || !Array.isArray(summary)) return 0;
    const meal = summary.find(s => s && s.meal_type && s.meal_type.toLowerCase() === (type || '').toLowerCase());
    return meal ? Number(meal.calories) || 0 : 0;
  };

  const RecentMealCard = ({ meal }: { meal: any }) => {
    const formattedTime = meal.created_at ? new Date(meal.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
    const imageSource = (meal?.image_url && typeof meal.image_url === 'string') 
      ? (meal.image_url.startsWith('http') || meal.image_url.startsWith('data:') ? meal.image_url : meal.image_url)
      : null;
    
    return (
      <div className="bg-white rounded-[28px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] mb-4 border border-gray-50/50 hover:shadow-md transition-all group">
        <div className="flex items-center space-x-4 mb-4 relative">
          <div className="w-[85px] h-[85px] rounded-[22px] overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-50">
            {imageSource ? (
              <img 
                src={imageSource} 
                alt={meal.meal_name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-3xl">🥗</span>';
                }}
              />
            ) : (
              <span className="text-3xl">🥗</span>
            )}
          </div>
          <div className="flex-grow">
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-black text-gray-900 line-clamp-1 text-base tracking-tight">{meal.meal_name}</h4>
              <div className="flex items-center space-x-2 shrink-0 ml-2">
                <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full flex items-center uppercase tracking-widest">
                  <Clock className="w-3 h-3 mr-1" />
                  {formattedTime}
                </span>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEditMeal(meal)}
                    className="w-7 h-7 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center active:scale-90 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setMealToDelete(meal.id)}
                    className="w-7 h-7 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center active:scale-90 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 mb-3">
              <div className="flex items-center bg-orange-50 px-2 py-0.5 rounded-md">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-current mr-1" />
                <span className="text-sm font-black text-gray-900">{meal.calories}</span>
                <span className="text-[10px] font-bold text-gray-500 ml-0.5">kcal</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
               <div className="flex items-center space-x-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                 <span className="text-[11px] font-bold text-gray-700">{Math.round(meal.protein)}g proteína</span>
               </div>
               <div className="flex items-center space-x-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                 <span className="text-[11px] font-bold text-gray-700">{Math.round(meal.carbs)}g carbos</span>
               </div>
            </div>
          </div>

          <AnimatePresence>
            {mealToDelete === meal.id && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute inset-x-0 inset-y-[-20px] bg-white/95 backdrop-blur-sm z-20 flex items-center justify-between px-2"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-rose-500">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-gray-900">Excluir?</span>
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => setMealToDelete(null)} className="px-3 py-1.5 rounded-lg text-gray-400 font-bold text-[10px] uppercase">Não</button>
                  <button onClick={() => handleDeleteMeal(meal.id)} className="px-3 py-1.5 bg-rose-500 text-white rounded-lg font-bold text-[10px] uppercase shadow-md shadow-rose-500/20">Sim</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Ingredients & Observations */}
        <div className="space-y-3 pt-4 border-t border-gray-50">
          {(() => {
            try {
              const ingredients = typeof meal.ingredients === 'string' ? JSON.parse(meal.ingredients) : meal.ingredients;
              if (Array.isArray(ingredients) && ingredients.length > 0) {
                return (
                  <div className="flex flex-wrap gap-1.5">
                    {ingredients.map((ing: any, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-[#F6F7F9] text-[#718096] text-[10px] font-bold rounded-md uppercase tracking-wider border border-gray-100">
                        {typeof ing === 'string' ? ing : ing.name}
                      </span>
                    ))}
                  </div>
                );
              }
            } catch (e) {
              return null;
            }
            return null;
          })()}
          
          {(meal.nutrition_observation || meal.recommendation) && (
            <div className="bg-[#F0F9EB] p-3 rounded-2xl border border-[#E6F4E2]">
              <p className="text-[11px] text-[#56AB2F] font-medium leading-relaxed italic">
                "{meal.nutrition_observation || meal.recommendation}"
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const SkeletonLoader = () => (
    <div className="animate-pulse">
      <div className="mb-5 space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-[22px] p-[18px] border border-gray-50/50 h-[140px]">
            <div className="flex justify-between items-center mb-[10px]">
              <div className="h-6 w-32 bg-gray-200 rounded-lg"></div>
              <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
            </div>
            <div className="h-8 w-24 bg-gray-200 rounded-lg mb-[10px]"></div>
            <div className="h-[10px] w-full bg-gray-100 rounded-[20px] mb-[12px]"></div>
            <div className="h-4 w-20 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-[22px] p-4 border border-gray-50/50 h-[120px]">
             <div className="flex justify-between items-start mb-4">
               <div className="h-5 w-20 bg-gray-200 rounded-lg"></div>
               <div className="w-8 h-8 rounded-full bg-gray-200"></div>
             </div>
             <div className="h-8 w-16 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading) return <SkeletonLoader />;

  return (
    <div className="main-wrapper">
      <div className="app-container pb-28 min-h-screen bg-[#F6F7F9]">
      <div className="px-6 pt-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-sm text-gray-500 font-medium tracking-wide mb-1">
              {(() => {
                const hour = new Date().getHours();
                if (hour >= 5 && hour < 12) return 'Bom dia';
                if (hour >= 12 && hour < 18) return 'Boa tarde';
                return 'Boa noite';
              })()} 👋
            </p>
            <div className="flex items-center space-x-2">
              <h1 className="text-[28px] font-bold text-gray-900 leading-tight">{userName}</h1>
              {profile?.plan_type && profile.plan_type !== 'free' && (
                <span className="bg-[#1A1A1A] text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center mt-1">
                  PRO
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/notifications')}
              className="relative w-12 h-12 flex items-center justify-center bg-white shadow-sm rounded-full active:scale-95 transition-all"
            >
            <Bell className="w-6 h-6 text-gray-700" />
            {unreadNotifications > 0 && (
              <span className="absolute top-2.5 right-2.5 flex items-center justify-center w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[9px] font-bold text-white">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>
          </div>
        </div>

        {appStatus.monetizationEnabled && profile?.plan_type === 'free' && (
          <div className="mb-8">
            <PremiumBanner onUpgrade={() => navigate('/plans')} />
          </div>
        )}

        {profile?.plan_type === 'free' && totalUsersCount >= 15 && totalUsersCount <= 20 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 bg-gradient-to-r from-orange-500 to-rose-500 rounded-[32px] p-6 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden group cursor-pointer"
            onClick={() => navigate('/upgrade')}
          >
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg">Limite Próximo!</h3>
                  <p className="text-white/80 text-sm font-bold">Restam apenas {20 - totalUsersCount} vagas gratuitas.</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
            {/* Animated background element */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          </motion.div>
        )}



        {/* content sections animated up */}
        <motion.div
           initial={{ opacity: 0, y: 15 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           key={selectedDate.toISOString()} // Force re-animation when date changes
        >
          <CalendarSlider 
            selectedDate={selectedDate} 
            onSelectDate={setSelectedDate} 
            onOpenCalendar={() => setIsCalendarOpen(true)} 
          />

          {isLoading ? (
            <SkeletonLoader />
          ) : (
            <>
              <SummaryCard 
                total={totalToday} 
                target={targetCalories} 
                summary={summary} 
                meals={meals}
                goal={userGoal} 
                weeklyData={weeklyData}
                dailyTotals={dailyTotals}
              />

              <div className="mt-8 mb-8">
                <div className="flex justify-between items-center px-2 mb-4">
                  <h3 className="text-lg font-black text-gray-900">Refeições registradas</h3>
                  <button className="text-sm font-bold text-[#56AB2F]" onClick={() => navigate('/history')}>Ver tudo</button>
                </div>
                
                {recentMeals.length > 0 ? (
                  <div className="space-y-3">
                    {recentMeals.slice(0, 3).map((meal, idx) => (
                      <RecentMealCard key={meal.id || idx} meal={meal} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-[32px] p-8 border border-gray-50/50 text-center">
                    <p className="text-gray-400 text-sm font-bold">Nenhuma refeição registrada recentemente.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>

      <CalendarModal 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
        selectedDate={selectedDate} 
        onSelectDate={(d) => {
          setSelectedDate(d);
          setIsCalendarOpen(false);
        }} 
      />

      <EditMealModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveMeal}
        meal={selectedMeal}
      />

      <InviteModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />

      <MilestonePopUp 
        isOpen={showMilestone}
        onClose={handleCloseMilestone}
      />

      <BottomNav />
      </div>
    </div>
  );
};
