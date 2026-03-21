import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Flame, Edit2, AlertCircle } from 'lucide-react';

interface EditMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: any) => Promise<void>;
  meal: any;
}

export const EditMealModal = ({ isOpen, onClose, onSave, meal }: EditMealModalProps) => {
  const [formData, setFormData] = useState({
    meal_name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    meal_type: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (meal) {
      setFormData({
        meal_name: meal.meal_name || meal.food_name || '',
        calories: meal.calories || 0,
        protein: meal.protein || 0,
        carbs: meal.carbs || 0,
        fat: meal.fat || 0,
        meal_type: meal.meal_type || 'Almoço'
      });
    }
  }, [meal]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(meal.id, formData);
      onClose();
    } catch (err) {
      console.error("Failed to save meal changes", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-6 right-6 top-1/2 -translate-y-1/2 bg-white rounded-[40px] shadow-2xl z-[101] overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Editar Refeição</h3>
                  <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Ajuste os valores nutricionais</p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 active:scale-90 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Meal Name */}
                <div className="bg-gray-50 rounded-3xl p-4 border border-gray-100 focus-within:border-[#56AB2F]/30 transition-all">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Nome da Refeição</p>
                  <input 
                    type="text"
                    value={formData.meal_name}
                    onChange={(e) => setFormData({ ...formData, meal_name: e.target.value })}
                    className="w-full bg-transparent text-lg font-bold text-gray-900 outline-none px-1"
                  />
                </div>

                {/* Main Macro: Calories */}
                <div className="bg-[#F0F9EB] rounded-3xl p-5 border border-[#E6F4E2]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-[#56AB2F] uppercase tracking-widest ml-1">Calorias Totais (kcal)</p>
                    <Flame className="w-4 h-4 text-[#56AB2F] fill-current" />
                  </div>
                  <input 
                    type="number"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: Number(e.target.value) })}
                    className="w-full bg-transparent text-3xl font-black text-gray-900 outline-none"
                  />
                </div>

                {/* Other Macros */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-rose-50 rounded-3xl p-4 border border-rose-100">
                    <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Prot. (g)</p>
                    <input 
                      type="number"
                      value={formData.protein}
                      onChange={(e) => setFormData({ ...formData, protein: Number(e.target.value) })}
                      className="w-full bg-transparent text-lg font-black text-gray-900 outline-none"
                    />
                  </div>
                  <div className="bg-orange-50 rounded-3xl p-4 border border-orange-100">
                    <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1">Carb. (g)</p>
                    <input 
                      type="number"
                      value={formData.carbs}
                      onChange={(e) => setFormData({ ...formData, carbs: Number(e.target.value) })}
                      className="w-full bg-transparent text-lg font-black text-gray-900 outline-none"
                    />
                  </div>
                  <div className="bg-blue-50 rounded-3xl p-4 border border-blue-100">
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Gord. (g)</p>
                    <input 
                      type="number"
                      value={formData.fat}
                      onChange={(e) => setFormData({ ...formData, fat: Number(e.target.value) })}
                      className="w-full bg-transparent text-lg font-black text-gray-900 outline-none"
                    />
                  </div>
                </div>

                {/* Meal Type Selection */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {['Café da Manhã', 'Almoço', 'Jantar', 'Lanche'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, meal_type: type })}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        formData.meal_type === type 
                          ? 'bg-[#1A1A1A] text-white border-transparent' 
                          : 'bg-white text-gray-400 border-gray-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-10 flex space-x-4">
                <button 
                  onClick={onClose}
                  className="flex-1 py-5 rounded-3xl font-black text-sm text-gray-400 uppercase tracking-widest active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-[2] bg-[#56AB2F] text-white py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-[#56AB2F]/30 active:scale-95 transition-all flex items-center justify-center space-x-2"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Salvar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
