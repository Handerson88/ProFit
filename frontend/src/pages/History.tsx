import React, { useEffect, useState } from 'react';
import { Calendar, Utensils, Clock, Trash2, AlertCircle, Quote } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { api, getImagePath } from '../services/api';
import { CalendarModal } from '../components/CalendarModal';
import { useAuth } from '../context/AuthContext';
import { Paywall } from '../components/Paywall';
import { formatMaputoTime, formatMaputoLongDate, getMaputoNow, isMaputoToday } from '../utils/dateUtils';

const HistoryItem = ({ id, title, time, calories, imageUrl, ingredients, observation, onDelete }: any) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const imageSource = imageUrl ? getImagePath(imageUrl) : null;

  const parsedIngredients = ingredients ? (typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients) : [];

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 relative overflow-hidden"
    >
      <div className="glass-card rounded-[24px] p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
        <div className="flex space-x-4">
          {/* Image Section */}
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-inner flex-shrink-0 bg-[var(--bg-app)] border border-[var(--border-main)]/30">
            {imageSource ? (
              <img 
                src={imageSource} 
                alt={title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-3xl">🥗</div>';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl opacity-60">🥗</div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1 flex flex-col justify-between py-0.5">
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-2">
                <h3 className="font-extrabold text-[var(--text-main)] text-lg leading-tight tracking-tight mb-1">{title}</h3>
                <div className="flex items-center space-x-1.5 opacity-60">
                  <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{time}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[#56AB2F] font-black text-lg leading-none">+{calories}</div>
                <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-0.5">KCAL</div>
              </div>
            </div>

            {/* Tags/Chips */}
            {parsedIngredients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {parsedIngredients.slice(0, 4).map((ing: any, i: number) => (
                  <span key={i} className="chip-premium bg-[var(--bg-app)]/50">
                    {typeof ing === 'string' ? ing : ing.name}
                  </span>
                ))}
                {parsedIngredients.length > 4 && (
                  <span className="text-[9px] font-bold text-[var(--text-muted)] mt-1 ml-0.5">+{parsedIngredients.length - 4}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Observation Quote */}
        {(observation || ingredients.length > 0) && (
          <div className="mt-4 pt-3 border-t border-[var(--border-main)]/30 space-y-3">
            {observation && (
              <div className="flex space-x-2">
                <Quote className="w-3 h-3 text-[#56AB2F] mt-0.5 opacity-40 shrink-0" />
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed italic pr-8">
                  {observation}
                </p>
              </div>
            )}
            
            {parsedIngredients.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {parsedIngredients.map((ing: any, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-[var(--bg-app)]/50 text-[var(--text-muted)] text-[9px] font-bold rounded-md uppercase tracking-wider border border-[var(--border-main)]/30">
                    {typeof ing === 'string' ? ing : ing.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Simple Delete Button Icon */}
        <button 
          onClick={() => setIsDeleting(true)}
          className="absolute top-4 right-4 p-2 text-rose-500/30 hover:text-rose-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Delete Confirmation Overlay */}
      <AnimatePresence>
        {isDeleting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 glass-card bg-rose-500/10 backdrop-blur-md z-20 flex items-center justify-center px-6 rounded-[24px]"
          >
            <div className="flex flex-col items-center space-y-4">
              <p className="text-sm font-bold text-[var(--text-main)]">Excluir esta refeição?</p>
              <div className="flex space-x-4">
                <button 
                  onClick={() => setIsDeleting(false)}
                  className="px-5 py-2 rounded-full border border-[var(--text-muted)]/20 text-[var(--text-muted)] font-bold text-xs uppercase transition-all hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    onDelete(id);
                    setIsDeleting(false);
                  }}
                  className="px-5 py-2 bg-rose-500 text-white rounded-full font-bold text-xs uppercase shadow-lg shadow-rose-500/30 active:scale-95 transition-all"
                >
                  Excluir
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const History = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(getMaputoNow().toDate());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const dateStr = [
        selectedDate.getFullYear(),
        String(selectedDate.getMonth() + 1).padStart(2, '0'),
        String(selectedDate.getDate()).padStart(2, '0')
      ].join('-');
      
      const data = await api.meals.getHistory(dateStr);
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history");
    } finally {
      setIsLoading(false);
    }
  };

  const { totalUsersCount } = useAuth();
  
  const getDaysSinceCreation = () => {
    if (!user?.created_at) return 0;
    const date = new Date(user.created_at);
    if (isNaN(date.getTime())) return 0;
    return (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  };

  const isServerActive = user?.subscription_status === 'ativo' || user?.subscription_status === 'active';
  const isUnderLimit = totalUsersCount > 0 ? totalUsersCount <= 20 : true;
  const isPromoActive = isServerActive || isUnderLimit || user?.role === 'admin' || user?.is_influencer || user?.is_early_adopter;

  useEffect(() => {
    fetchHistory();
  }, [selectedDate, user?.subscription_status]);

  if (!isPromoActive) {
    return <Paywall feature="Histórico Completo" />;
  }

  const handleDelete = async (id: string) => {
    try {
      await api.meals.delete(id);
      setHistory(prev => prev.filter((item: any) => item.id !== id));
    } catch (err) {
      console.error("Failed to delete meal", err);
    }
  };

  return (
    <div className="main-wrapper min-h-screen pb-32">
      <div className="app-container !border-none !shadow-none !bg-transparent md:!max-w-2xl">
        
        {/* Modern Sticky Header */}
        <header className="sticky top-0 z-40 bg-[var(--bg-app)]/80 backdrop-blur-xl px-6 pt-10 pb-6 border-b border-[var(--border-main)]/30">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-[36px] font-black text-[var(--text-main)] tracking-tight leading-none mb-1">Histórico</h1>
              <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-60">Suas refeições diárias</p>
            </div>
            
            <button 
              onClick={() => setIsCalendarOpen(true)}
              className="glass-card flex items-center space-x-2.5 px-5 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <Calendar className="w-5 h-5 text-[#56AB2F]" />
              <div className="text-left">
                <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none mb-0.5">Filtrar Data</div>
                <div className="text-xs font-bold text-[var(--text-main)] uppercase tracking-tight">
                  {formatMaputoLongDate(selectedDate)}
                </div>
              </div>
            </button>
          </div>
        </header>

        <main className="px-6 pt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-50">Registros Atuais</h2>
            <div className="chip-premium !bg-[#56AB2F]/10 !border-[#56AB2F]/20">
              {isLoading ? '...' : history.length} Refeições
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 flex flex-col justify-center items-center"
              >
                <div className="w-12 h-12 border-4 border-[#56AB2F] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-xs font-bold text-[var(--text-muted)] animate-pulse">CARREGANDO...</p>
              </motion.div>
            ) : (
              <div className="space-y-2 pb-10">
                {history.map((item: any, idx: number) => (
                  <HistoryItem 
                    key={item.id} 
                    id={item.id}
                    title={item.food_name} 
                    time={formatMaputoTime(item.created_at)} 
                    calories={item.calories}
                    imageUrl={item.image_url}
                    ingredients={item.ingredients}
                    observation={item.nutrition_observation}
                    onDelete={handleDelete}
                  />
                ))}

                {history.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-24 text-center glass-card rounded-[32px] border-dashed border-2 flex flex-col items-center justify-center p-8 bg-[var(--bg-app)]/30"
                  >
                    <div className="w-20 h-20 bg-gradient-to-tr from-[var(--bg-app)] to-[var(--bg-card)] rounded-full flex items-center justify-center shadow-inner mb-6">
                      <Utensils className="w-10 h-10 text-[var(--text-muted)] opacity-30" />
                    </div>
                    <p className="text-[var(--text-main)] font-black text-lg mb-2">Nada por aqui ainda!</p>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-[200px] mx-auto opacity-70">
                      Suas refeições registradas para {formatMaputoLongDate(selectedDate)} aparecerão aqui.
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </AnimatePresence>
        </main>

        <CalendarModal 
          isOpen={isCalendarOpen} 
          onClose={() => setIsCalendarOpen(false)} 
          selectedDate={selectedDate} 
          onSelectDate={(d) => {
            setSelectedDate(d);
            setIsCalendarOpen(false);
          }} 
        />

        <BottomNav />
      </div>
    </div>
  );
};
