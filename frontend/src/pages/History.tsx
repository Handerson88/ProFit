import React, { useEffect, useState } from 'react';
import { Calendar, ChevronRight, Utensils, Clock, Trash2, Edit3, X, AlertCircle } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { CalendarModal } from '../components/CalendarModal';

const HistoryItem = ({ id, title, time, calories, imageUrl, ingredients, observation, onDelete }: any) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const imageSource = (imageUrl && typeof imageUrl === 'string') 
    ? (imageUrl.startsWith('http') || imageUrl.startsWith('data:') ? imageUrl : imageUrl)
    : null;

  const parsedIngredients = ingredients ? (typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients) : [];

  return (
    <div className="py-5 bg-white last:border-none border-b border-gray-50/50 group relative overflow-hidden">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
            {imageSource ? (
              <img 
                src={imageSource} 
                alt={title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '🥗';
                }}
              />
            ) : (
              <span className="text-2xl">🥗</span>
            )}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-base leading-tight">{title}</p>
            <div className="flex items-center space-x-1 mt-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{time}</p>
            </div>
          </div>
        </div>
        <div className="text-right flex items-center space-x-3">
          <div className="flex flex-col items-end mr-2">
            <span className="font-black text-[#56AB2F] text-base">+{calories}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">kcal</span>
          </div>
          <button 
            onClick={() => setIsDeleting(true)}
            className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Details (Ingredients & Observation) */}
      <div className="pl-[72px] space-y-2">
        {parsedIngredients.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {parsedIngredients.map((ing: any, i: number) => (
              <span key={i} className="px-2 py-0.5 bg-gray-50 text-gray-500 text-[9px] font-bold rounded-md uppercase tracking-wide border border-gray-100">
                {typeof ing === 'string' ? ing : ing.name}
              </span>
            ))}
          </div>
        )}
        {(observation) && (
          <p className="text-[11px] text-[#718096] italic leading-relaxed border-l-2 border-[#EAF5D5] pl-3 py-1">
            "{observation}"
          </p>
        )}
      </div>

      {/* Delete Confirmation Overlay */}
      <AnimatePresence>
        {isDeleting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex items-center justify-center px-6"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-500">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-gray-900">Excluir esta refeição?</p>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setIsDeleting(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 font-bold text-xs uppercase"
                >
                  Não
                </button>
                <button 
                  onClick={() => {
                    onDelete(id);
                    setIsDeleting(false);
                  }}
                  className="px-4 py-2 bg-rose-500 text-white rounded-xl font-bold text-xs uppercase shadow-lg shadow-rose-500/20"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const History = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
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

  useEffect(() => {
    fetchHistory();
  }, [selectedDate]);

  const handleDelete = async (id: string) => {
    try {
      await api.meals.delete(id);
      setHistory(prev => prev.filter((item: any) => item.id !== id));
    } catch (err) {
      console.error("Failed to delete meal", err);
      alert("Erro ao excluir refeição.");
    }
  };

  return (
    <div className="main-wrapper bg-[#F6F7F9]">
      <div className="app-container pb-32 bg-transparent shadow-none border-none">
      
      {/* Sticky Header */}
      <div className="px-6 pt-12 pb-6 flex justify-between items-center sticky top-0 z-40 bg-[#F6F7F9]/90 backdrop-blur-sm">
        <h1 className="text-[32px] font-black text-gray-900 tracking-tight">História</h1>
        <div className="relative">
          <button 
            onClick={() => setIsCalendarOpen(true)}
            className="h-12 px-5 bg-white shadow-sm rounded-full flex items-center space-x-2 active:scale-95 transition-all outline-none"
          >
            <Calendar className="w-4 h-4 text-[#56AB2F]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#4A4B51]">
              {new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' }).format(selectedDate).toUpperCase()}
            </span>
          </button>
        </div>
      </div>

      <div className="px-6">
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">Registros Diários de Refeições</h2>
            <span className="text-[10px] font-black text-[#56AB2F] bg-[#A8E063]/10 px-2 py-1 rounded-md uppercase">
              {isLoading ? '...' : history.length} ativo
            </span>
          </div>

          <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-6 py-2 border border-gray-50/50 min-h-[400px]">
            {isLoading ? (
              <div className="py-20 flex justify-center items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#56AB2F]"></div>
              </div>
            ) : (
              <>
                 {history.map((item: any, j: number) => (
                   <HistoryItem 
                     key={item.id || j} 
                     id={item.id}
                     title={item.food_name} 
                     time={new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                     calories={item.calories}
                     imageUrl={item.image_url}
                     ingredients={item.ingredients}
                     observation={item.nutrition_observation}
                     onDelete={handleDelete}
                   />
                 ))}
                {history.length === 0 && (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-[#F6F7F9] rounded-full flex items-center justify-center mx-auto mb-4 grayscale opacity-50">
                      <Utensils className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-[#A2A2A8] font-bold mb-1 italic">Nenhuma refeição encontrada</p>
                    <p className="text-[10px] font-black text-[#A2A2A8] uppercase tracking-widest opacity-60">As suas refeições registadas para esta data aparecerão aqui.</p>
                  </div>
                )}
              </>
            )}
          </div>
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

      <BottomNav />
      </div>
    </div>
  );
};
