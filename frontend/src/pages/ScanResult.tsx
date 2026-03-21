import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Share2, 
  Flame, 
  Plus, 
  Minus, 
  Zap, 
  Droplets, 
  Beef,
  Loader2,
  AlertTriangle,
  Info,
  CheckCircle2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';

export const ScanResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [foodData, setFoodData] = useState({
    name: 'Analisando...',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    image: '',
    ingredients: [] as any[],
    calorieStatus: null as any,
    recommendation: '',
    nutrition_observation: ''
  });

  const [quantity, setQuantity] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmOptions, setConfirmOptions] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger' as 'danger' | 'warning' | 'info' | 'success',
    confirmText: 'OK',
    showCancel: false,
    onConfirm: async () => {}
  });

  const closeConfirm = () => setConfirmOptions(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    if (location.state?.food) {
       const fd = location.state.food;
       setFoodData(prev => ({
         ...prev,
         name: fd.dish_name || fd.name || fd.meal_name || fd.food_name || 'Prato Identificado',
         calories: Number(fd.calories || fd.meal_calories || 0),
         protein: Number(fd.protein || 0),
         carbs: Number(fd.carbs || 0),
         fats: Number(fd.fat || fd.fats || 0),
         image: location.state.localImage || (fd.image_url && typeof fd.image_url === 'string' && fd.image_url.startsWith('http') ? fd.image_url : (fd.image || '')),
         ingredients: fd.ingredients || [],
         calorieStatus: fd.calorie_status || fd.calorieStatus,
         recommendation: fd.recommendation,
         nutrition_observation: fd.nutrition_observation || fd.recommendation || ''
       }));
    } else {
      navigate('/scanner');
    }
  }, [location.state, navigate]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.meals.add({
        food_name: foodData.name,
        meal_name: foodData.name,
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFats,
        quantity: quantity,
        meal_type: 'Scanned',
        image_url: foodData.image.includes('uploads') ? foodData.image.split('http://localhost:5000')[1] || foodData.image : foodData.image,
        ingredients: foodData.ingredients,
        nutrition_observation: foodData.nutrition_observation
      });
      
      // Success feedback could be toast, but for now navigate
      navigate('/home');
    } catch (err) {
      console.error('Failed to save meal:', err);
      setConfirmOptions({
        isOpen: true,
        title: 'Erro',
        message: 'Ocorreu um erro ao salvar a refeição. Tente novamente.',
        type: 'danger',
        confirmText: 'Fechar',
        showCancel: false,
        onConfirm: async () => {}
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    const text = `Confira minha refeição no ProFit! 🥗\nPrato: ${foodData.name}\nCalorias: ${totalCalories} kcal\n${foodData.nutrition_observation}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meu Prato no ProFit',
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share failed', err);
      }
    } else {
      setConfirmOptions({
        isOpen: true,
        title: 'Sucesso!',
        message: 'Link copiado para a área de transferência!',
        type: 'success',
        confirmText: 'OK',
        showCancel: false,
        onConfirm: async () => {}
      });
      navigator.clipboard.writeText(text);
    }
  };

  const totalCalories = Math.round(foodData.calories * quantity);
  const totalProtein = Math.round(foodData.protein * quantity);
  const totalCarbs = Math.round(foodData.carbs * quantity);
  const totalFats = Math.round(foodData.fats * quantity);

  return (
    <div className="main-wrapper bg-[#F8F9FB] min-h-screen">
      <div className="app-container max-w-md mx-auto h-screen bg-[#F8F9FB] overflow-y-auto pb-32 scrollbar-hide relative">
        
        {/* Hero Section with Image */}
        <div className="relative w-full h-[40vh]">
          <img 
            src={foodData.image} 
            className="w-full h-full object-cover"
            alt="Food"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F8F9FB] via-transparent to-black/40"></div>
          
          <div className="absolute top-0 inset-x-0 px-6 pt-12 flex justify-between items-center z-20">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center text-white border border-white/20 active:scale-90 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={handleShare}
              className="w-10 h-10 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center text-white border border-white/20 active:scale-90 transition-all"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-6 -mt-10 relative z-10">
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 mb-6 flex flex-col items-center text-center">
            <div className="flex items-center bg-gray-50 px-4 py-2 rounded-full border border-gray-100 mb-6">
              <button 
                onClick={() => setQuantity(q => Math.max(0.5, q - 0.5))} 
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
              >
                <Minus className="w-4 h-4 text-gray-400" />
              </button>
              <span className="mx-6 text-base font-black text-gray-900">{quantity}x</span>
              <button 
                onClick={() => setQuantity(q => q + 0.5)} 
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight leading-tight">
              {foodData.name}
            </h1>
            
            <div className="flex items-center justify-center space-x-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{foodData.timestamp}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className="text-xs font-black text-[#56AB2F] uppercase tracking-widest">Sugestão IA</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-[#1A1A1A] rounded-[28px] p-6 flex flex-col justify-between h-40">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Calorias</p>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-black text-white">{totalCalories}</span>
                  <span className="text-xs font-bold text-white/40">kcal</span>
                </div>
              </div>
            </div>

            <div className={`rounded-[28px] p-6 flex flex-col justify-between h-40 border ${
              foodData.calorieStatus?.status === 'RED' ? 'bg-red-50 border-red-100' : 'bg-[#EBF7EE] border-[#D4EFDA]'
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                foodData.calorieStatus?.status === 'RED' ? 'bg-red-500/10' : 'bg-[#56AB2F]/10'
              }`}>
                {foodData.calorieStatus?.status === 'RED' ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 text-[#56AB2F]" />}
              </div>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                  foodData.calorieStatus?.status === 'RED' ? 'text-red-500/60' : 'text-[#56AB2F]'
                }`}>Meta Diária</p>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-black text-gray-900">{foodData.calorieStatus?.remaining || 0}</span>
                  <span className="text-xs font-bold text-gray-400">kcal restantes</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                <Beef className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Proteína</p>
              <div className="flex items-baseline space-x-0.5">
                <span className="text-xl font-black text-gray-900">{totalProtein}</span>
                <span className="text-[10px] font-bold text-gray-400">g</span>
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
                <Zap className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Carbos</p>
              <div className="flex items-baseline space-x-0.5">
                <span className="text-xl font-black text-gray-900">{totalCarbs}</span>
                <span className="text-[10px] font-bold text-gray-400">g</span>
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center mb-3">
                <Droplets className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Gorduras</p>
              <div className="flex items-baseline space-x-0.5">
                <span className="text-xl font-black text-gray-900">{totalFats}</span>
                <span className="text-[10px] font-bold text-gray-400">g</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="text-base font-black text-gray-900 mb-3 flex items-center space-x-2">
              <Info className="w-5 h-5 text-[#56AB2F]" />
              <span>Observação Nutricional</span>
            </h3>
            <p className="text-sm font-medium text-gray-600 leading-relaxed italic">
              "{foodData.nutrition_observation || foodData.recommendation || 'Não há observações para este prato.'}"
            </p>
          </div>

          <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 mb-8">
            <h3 className="text-base font-black text-gray-900 mb-5">Ingredientes Identificados</h3>
            <div className="grid grid-cols-2 gap-4">
              {foodData.ingredients && foodData.ingredients.length > 0 ? (
                foodData.ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <div className="w-2 h-2 bg-[#56AB2F] rounded-full"></div>
                    <span className="text-sm font-bold text-gray-700 capitalize">
                      {typeof ing === 'string' ? ing : ing.name}
                    </span>
                  </div>
                ))
              ) : (
                <p className="col-span-2 text-sm text-gray-400 font-medium italic">Nenhum ingrediente identificado.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 inset-x-0 px-6 py-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 flex space-x-4 z-50">
        <button 
          onClick={() => navigate('/scanner')}
          className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl text-[11px] uppercase tracking-widest active:scale-95 transition-all"
        >
          Refazer
        </button>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex-[2] py-4 bg-[#56AB2F] text-white font-black rounded-2xl text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/30 flex items-center justify-center"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SALVAR'}
        </button>
      </div>

      <ConfirmModal 
        isOpen={confirmOptions.isOpen}
        onClose={closeConfirm}
        title={confirmOptions.title}
        message={confirmOptions.message}
        type={confirmOptions.type}
        confirmText={confirmOptions.confirmText}
        showCancel={confirmOptions.showCancel}
        onConfirm={confirmOptions.onConfirm}
      />
    </div>
  );
};
