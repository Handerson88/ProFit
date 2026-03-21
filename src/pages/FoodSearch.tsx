import React from 'react';
import { Search, Plus, ArrowLeft, Camera } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const mockFoods = [
  { id: 1, name: 'White Rice', kcal: 130, unit: '100g', emoji: '🍚' },
  { id: 2, name: 'Egg (Boiled)', kcal: 155, unit: '100g', emoji: '🥚' },
  { id: 3, name: 'Chicken Breast', kcal: 165, unit: '100g', emoji: '🍗' },
  { id: 4, name: 'Avocado', kcal: 160, unit: '100g', emoji: '🥑' },
  { id: 5, name: 'Whole Wheat Bread', kcal: 247, unit: '100g', emoji: '🍞' },
];

export const FoodSearch = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="flex items-center space-x-4 mb-10">
        <button onClick={() => navigate(-1)} className="p-3 bg-white shadow-soft rounded-2xl active:scale-90 transition-all">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-black">Search Food</h1>
      </div>

      <div className="flex items-center space-x-3 mb-10">
        <div className="relative flex-1 shadow-sm shadow-black/5 rounded-[24px]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary w-6 h-6" />
          <input 
            type="text" 
            placeholder="Search food..." 
            className="input-premium pl-14"
          />
        </div>
        <button 
          onClick={() => navigate('/scanner')}
          className="p-5 bg-primary/10 rounded-[24px] text-primary shadow-sm active:scale-95 transition-all outline-none"
        >
          <Camera className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4">
        {mockFoods.map((food, i) => (
          <motion.div
            key={food.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card-premium flex justify-between items-center py-5 pr-4 group"
          >
            <div className="flex items-center space-x-4">
               <div className="text-3xl p-2 bg-gray-50 rounded-2xl group-hover:bg-primary/5 transition-colors">{food.emoji}</div>
               <div>
                 <h3 className="font-bold text-text-primary text-base">{food.name}</h3>
                 <p className="text-xs text-text-secondary font-bold opacity-40">{food.kcal} kcal / {food.unit}</p>
               </div>
            </div>
            <button 
              onClick={() => navigate('/log-meal', { state: { food } })}
              className="w-12 h-12 rounded-[20px] bg-primary/10 flex items-center justify-center active:scale-90 transition-all"
            >
              <Plus className="w-6 h-6 text-primary" />
            </button>
          </motion.div>
        ))}
      </div>
    </AppLayout>
  );
};
