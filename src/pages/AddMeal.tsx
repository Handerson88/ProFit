import React, { useState } from 'react';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export const AddMeal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const food = location.state?.food || { name: 'Boiled Egg', kcal: 155, unit: '100g' };
  
  const [quantity, setQuantity] = useState(150);

  const totalKcal = Math.round((food.kcal * quantity) / 100);

  return (
    <AppLayout>
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-3 bg-white shadow-soft rounded-2xl active:scale-90 transition-all">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-black">Add Meal</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-premium flex flex-col items-center py-16 mb-8 border-2 border-primary/5"
      >
        <div className="text-7xl mb-8 drop-shadow-lg">🥚</div>
        <h2 className="text-3xl font-black mb-2 text-text-primary tracking-tight">{food.name}</h2>
        <p className="text-text-secondary font-bold text-base opacity-60">
          <span className="text-primary">{food.kcal}</span> kcal per {food.unit}
        </p>
      </motion.div>

      <div className="card-premium mb-8 px-8">
        <div className="flex justify-between items-center mb-10 pb-8 border-b border-gray-50">
          <span className="font-black text-text-secondary text-sm uppercase tracking-wider">Quantity</span>
          <div className="flex items-center space-x-8">
            <button 
              onClick={() => setQuantity(q => Math.max(0, q - 10))}
              className="w-12 h-12 rounded-[20px] bg-gray-50 flex items-center justify-center active:scale-90 transition-all font-bold shadow-sm"
            >
              <Minus className="w-5 h-5 text-text-secondary" />
            </button>
            <span className="text-3xl font-black text-text-primary min-w-[70px] text-center">{quantity}<span className="text-sm opacity-40 ml-1">g</span></span>
            <button 
              onClick={() => setQuantity(q => q + 10)}
              className="w-12 h-12 rounded-[20px] bg-gray-50 flex items-center justify-center active:scale-90 transition-all font-bold shadow-sm"
            >
              <Plus className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-text-secondary uppercase mb-2 tracking-widest opacity-40">Total Energy</p>
            <p className="text-4xl font-black text-primary leading-none transition-all">{totalKcal} <span className="text-lg opacity-40">kcal</span></p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Save Meal
          </button>
        </div>
      </div>
    </AppLayout>
  );
};
