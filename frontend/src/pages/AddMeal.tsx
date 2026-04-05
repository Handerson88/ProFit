import React, { useState } from 'react';
import { ArrowLeft, Minus, Plus, Scale, Flame, Check } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';

export const AddMeal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const food = location.state?.food || { 
    name: 'Unknown Food', 
    calories: 0, 
    protein: 0, 
    carbs: 0, 
    fat: 0 
  };
  
  const [quantity, setQuantity] = useState(100);

  const factor = quantity / 100;
  const totalKcal = Math.round(food.calories * factor);
  const totalProtein = Math.round(food.protein * factor * 10) / 10;
  const totalCarbs = Math.round(food.carbs * factor * 10) / 10;
  const totalFat = Math.round(food.fat * factor * 10) / 10;

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.meals.add({
        food_name: food.name,
        calories: totalKcal,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
        quantity,
        meal_type: 'Snack'
      });
      navigate('/home');
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  const MacroIndicator = ({ label, value, color, icon: Icon }: { label: string, value: number, color: string, icon: any }) => (
    <div className="flex flex-col items-center flex-1">
      <div className={`w-12 h-12 rounded-2xl ${color} bg-opacity-10 flex items-center justify-center mb-2`}>
        <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
      </div>
      <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">{label}</span>
      <span className="text-lg font-black text-[var(--text-main)]">{value}g</span>
    </div>
  );

  return (
    <div className="main-wrapper bg-[var(--bg-app)]">
      <div className="app-container pb-32 bg-transparent shadow-none border-none">
      {/* Sticky Header */}
      <div className="px-6 pt-12 pb-6 flex items-center sticky top-0 z-40 bg-[var(--bg-app)]/90 backdrop-blur-sm">
        <button 
          onClick={() => navigate(-1)}
          className="w-12 h-12 bg-[var(--bg-card)] rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all text-[var(--text-main)]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-[var(--text-main)] ml-4">Adicionar Refeição</h1>
      </div>

      <div className="px-6">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
        >
          {/* Food Info Card */}
          <div className="bg-[var(--bg-card)] rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-6 text-center">
            <div className="w-20 h-20 bg-[var(--bg-app)] rounded-[24px] flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
               🍱
            </div>
            <h2 className="text-3xl font-black text-[var(--text-main)] mb-2 leading-tight">{food.name}</h2>
            <p className="text-sm font-medium text-[var(--text-muted)] mb-8 px-4">Based on your selection, we've calculated the nutrients below.</p>

            <div className="flex justify-between items-center w-full px-2">
              <MacroIndicator label="Protein" value={totalProtein} color="bg-orange-500" icon={Scale} />
              <div className="w-px h-10 bg-gray-100"></div>
              <MacroIndicator label="Carbs" value={totalCarbs} color="bg-blue-500" icon={Scale} />
              <div className="w-px h-10 bg-gray-100"></div>
              <MacroIndicator label="Fat" value={totalFat} color="bg-purple-500" icon={Scale} />
            </div>
          </div>

          {/* Quantity Selector Card */}
          <div className="bg-[var(--bg-card)] rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-6">
            <div className="flex justify-between items-center mb-8">
               <span className="text-sm font-bold text-[var(--text-main)] uppercase tracking-widest">Quantity</span>
               <div className="flex items-center space-x-4">
                 <button 
                   onClick={() => setQuantity(q => Math.max(10, q - 10))}
                   className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center active:scale-95 transition-all text-[var(--text-main)] hover:bg-gray-100"
                 >
                   <Minus className="w-5 h-5" />
                 </button>
                 <div className="text-center min-w-[100px]">
                    <span className="text-4xl font-black text-[var(--text-main)] leading-none">{quantity}</span>
                    <span className="text-lg font-bold text-[var(--text-muted)] ml-1">g</span>
                 </div>
                 <button 
                   onClick={() => setQuantity(q => q + 10)}
                   className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center active:scale-95 transition-all text-[var(--text-main)] hover:bg-gray-100"
                 >
                   <Plus className="w-5 h-5" />
                 </button>
               </div>
            </div>

            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
               <motion.div 
                 className="h-full bg-gradient-to-r from-[#A8E063] to-[#56AB2F]"
                 animate={{ width: `${Math.min((quantity/500)*100, 100)}%` }}
               />
            </div>
          </div>
        </motion.div>
      </div>

      </div>
      {/* Floating Action Dock */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-6 bg-gradient-to-t from-[#F6F7F9] via-[#F6F7F9]/90 to-transparent z-50">
        <div className="bg-[var(--bg-card)] rounded-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border border-[var(--border-main)]/50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Total Calories</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-black text-[#56AB2F]">{totalKcal}</span>
              <span className="text-sm font-bold text-[var(--text-muted)]">kcal</span>
            </div>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-[#A8E063] to-[#56AB2F] shadow-lg shadow-primary/30 text-white font-black px-8 py-4 rounded-2xl active:scale-95 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Salvar Refeição</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
