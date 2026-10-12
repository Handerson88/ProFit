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
import { motion, AnimatePresence } from 'framer-motion';
import { api, getImagePath } from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';
import { formatMaputoTime, getMaputoNow } from '../utils/dateUtils';
import { useLanguage } from '../context/LanguageContext';

const normalizeIngredients = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw;
  if (!raw) return [];

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return normalizeIngredients(parsed);
    } catch {
      return raw.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  if (typeof raw === 'object') return Object.values(raw);

  return [];
};

export const ScanResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { langData } = useLanguage();
  
  const [foodData, setFoodData] = useState({
    name: langData.scan_analyzing,
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    timestamp: formatMaputoTime(getMaputoNow().toDate()),
    image: '',
    ingredients: [] as any[],
    calorieStatus: null as any,
    recommendation: '',
    nutrition_observation: '',
    base64Image: ''
  });

  const [quantity, setQuantity] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmOptions, setConfirmOptions] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger' as 'danger' | 'warning' | 'info' | 'success',
    confirmText: langData.ok,
    showCancel: false,
    onConfirm: async () => {}
  });

  const closeConfirm = () => setConfirmOptions(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    if (location.state?.food) {
        const fd = location.state.food;
        const resolvedImage = getImagePath(fd.image_url || fd.image);

       setFoodData(prev => ({
         ...prev,
         name: fd.dish_name || fd.name || fd.meal_name || fd.food_name || langData.scan_identified_dish,
         calories: Number(fd.calories || fd.meal_calories || 0),
         protein: Number(fd.protein || 0),
         carbs: Number(fd.carbs || 0),
         fats: Number(fd.fat || fd.fats || 0),
         image: location.state.localImage || resolvedImage,
         ingredients: normalizeIngredients(fd.ingredients),
         calorieStatus: fd.calorie_status || fd.calorieStatus,
         recommendation: fd.recommendation,
         nutrition_observation: fd.nutrition_observation || fd.recommendation || '',
         base64Image: location.state.base64Image || ''
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
        image_url: foodData.base64Image || foodData.image,
        ingredients: foodData.ingredients,
        nutrition_observation: foodData.nutrition_observation
      });
      
      // Success feedback could be toast, but for now navigate
      navigate('/home');
    } catch (err) {
      console.error('Failed to save meal:', err);
      setConfirmOptions({
        isOpen: true,
        title: langData.error,
        message: langData.scan_error_save,
        type: 'danger',
        confirmText: langData.close,
        showCancel: false,
        onConfirm: async () => {}
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    const text = langData.scan_share_text
      .replace('{name}', foodData.name)
      .replace('{calories}', totalCalories.toString())
      .replace('{obs}', foodData.nutrition_observation || '');

    if (navigator.share) {
      try {
        await navigator.share({
          title: langData.scan_share_title,
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share failed', err);
      }
    } else {
      setConfirmOptions({
        isOpen: true,
        title: langData.success,
        message: langData.scan_link_copied,
        type: 'success',
        confirmText: langData.ok,
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

  // Backend sends { goal, current_total, expected_total } instead of a ready-made `remaining`,
  // and expected_total is based on the original (1x) meal calories, so we recompute it using
  // the quantity-adjusted totalCalories whenever the multiplier changes.
  const remainingCalories = (() => {
    const status = foodData.calorieStatus;
    if (!status) return 0;
    const goal = Number(status.goal ?? 0);
    let consumedBeforeThisMeal = Number(status.current_total ?? 0);
    if (!consumedBeforeThisMeal && typeof status.expected_total === 'number') {
      consumedBeforeThisMeal = Math.max(0, Number(status.expected_total) - foodData.calories);
    }
    return Math.max(0, Math.round(goal - consumedBeforeThisMeal - totalCalories));
  })();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="main-wrapper bg-[var(--bg-app)] min-h-screen">
      <div className="app-container max-w-md mx-auto h-screen bg-[var(--bg-app)] overflow-y-auto pb-24 scrollbar-hide relative">
        
        {/* Hero Section with Image */}
        <div className="relative w-full h-[32vh] min-h-[220px]">
          <img
            src={foodData.image}
            className="w-full h-full object-cover"
            alt="Food"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-app)] via-transparent to-black/40"></div>

          <div className="absolute top-0 inset-x-0 px-5 pt-10 flex justify-between items-center z-20">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 bg-[var(--bg-card)]/20 backdrop-blur-lg rounded-full flex items-center justify-center text-white border border-white/20 active:scale-90 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleShare}
              className="w-9 h-9 bg-[var(--bg-card)]/20 backdrop-blur-lg rounded-full flex items-center justify-center text-white border border-white/20 active:scale-90 transition-all"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Section */}
        <motion.div
          className="px-4 -mt-7 relative z-10 max-w-sm mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={itemVariants}
            className="bg-[var(--bg-card)] backdrop-blur-xl rounded-[24px] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-[var(--border-main)] mb-4 flex flex-col items-center text-center overflow-hidden relative"
          >
            {/* Decorative background glow */}
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#56AB2F]/10 rounded-full blur-3xl"></div>

            <div className="flex items-center bg-[var(--bg-surface)] px-3 py-1.5 rounded-full border border-[var(--border-main)] mb-4 relative z-10">
              <button
                onClick={() => setQuantity(q => Math.max(0.5, q - 0.5))}
                className="w-6 h-6 flex items-center justify-center hover:bg-[var(--bg-surface-hover)] rounded-full transition-colors"
              >
                <Minus className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </button>
              <span className="mx-4 text-sm font-black text-[var(--text-main)] w-6">{quantity}x</span>
              <button
                onClick={() => setQuantity(q => q + 0.5)}
                className="w-6 h-6 flex items-center justify-center hover:bg-[var(--bg-surface-hover)] rounded-full transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </button>
            </div>

            <motion.h1
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="text-xl font-black text-[var(--text-main)] mb-2 tracking-tight leading-tight relative z-10"
            >
              {foodData.name}
            </motion.h1>

            <div className="flex items-center justify-center relative z-10">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">{foodData.timestamp}</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -3 }}
              className="bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D] dark:from-[#0F172A] dark:to-[#1E293B] rounded-[20px] p-4 flex flex-col justify-between border border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.2)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all duration-500"></div>

              <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center relative z-10 mb-2">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <div className="relative z-10">
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-0.5">{langData.dash_calories}</p>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-black text-white group-hover:scale-110 origin-left transition-transform duration-300">{totalCalories}</span>
                  <span className="text-[10px] font-bold text-white/40">kcal</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -3 }}
              className={`rounded-[20px] p-4 flex flex-col justify-between border shadow-sm relative overflow-hidden group ${
                foodData.calorieStatus?.status === 'RED'
                  ? 'bg-red-50 dark:bg-red-500/5 border-red-100 dark:border-red-500/20'
                  : 'bg-[#EBF7EE] dark:bg-[#56AB2F]/5 border-[#D4EFDA] dark:border-[#56AB2F]/20'
              }`}
            >
              <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 transition-all duration-500 ${
                foodData.calorieStatus?.status === 'RED' ? 'bg-red-500' : 'bg-[#56AB2F]'
              }`}></div>

              <div className={`w-8 h-8 rounded-lg flex items-center justify-center relative z-10 mb-2 ${
                foodData.calorieStatus?.status === 'RED' ? 'bg-red-500/10' : 'bg-[#56AB2F]/10'
              }`}>
                {foodData.calorieStatus?.status === 'RED' ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-[#56AB2F]" />}
              </div>
              <div className="relative z-10">
                <p className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 ${
                  foodData.calorieStatus?.status === 'RED' ? 'text-red-500/60' : 'text-[#56AB2F]'
                }`}>{langData.scan_daily_goal}</p>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-black text-[var(--text-main)] group-hover:scale-110 origin-left transition-transform duration-300">{remainingCalories}</span>
                  <span className="text-[10px] font-bold text-[var(--text-muted)]">{langData.scan_kcal_remaining}</span>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2.5 mb-4">
            <div className="bg-[var(--bg-card)] rounded-[18px] p-3 border border-[var(--border-main)] shadow-sm flex flex-col items-center text-center hover:bg-[var(--bg-surface)] transition-colors duration-300 group">
              <div className="w-8 h-8 bg-blue-500/5 dark:bg-blue-500/10 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Beef className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-0.5">{langData.dash_protein}</p>
              <div className="flex items-baseline space-x-0.5">
                <span className="text-base font-black text-[var(--text-main)]">{totalProtein}</span>
                <span className="text-[9px] font-bold text-[var(--text-muted)]">g</span>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] rounded-[18px] p-3 border border-[var(--border-main)] shadow-sm flex flex-col items-center text-center hover:bg-[var(--bg-surface)] transition-colors duration-300 group">
              <div className="w-8 h-8 bg-orange-500/5 dark:bg-orange-500/10 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Zap className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-0.5">{langData.dash_carbs}</p>
              <div className="flex items-baseline space-x-0.5">
                <span className="text-base font-black text-[var(--text-main)]">{totalCarbs}</span>
                <span className="text-[9px] font-bold text-[var(--text-muted)]">g</span>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] rounded-[18px] p-3 border border-[var(--border-main)] shadow-sm flex flex-col items-center text-center hover:bg-[var(--bg-surface)] transition-colors duration-300 group">
              <div className="w-8 h-8 bg-yellow-500/5 dark:bg-yellow-500/10 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Droplets className="w-4 h-4 text-yellow-500" />
              </div>
              <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-0.5">{langData.dash_fat}</p>
              <div className="flex items-baseline space-x-0.5">
                <span className="text-base font-black text-[var(--text-main)]">{totalFats}</span>
                <span className="text-[9px] font-bold text-[var(--text-muted)]">g</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-[var(--bg-card)] rounded-[20px] p-4 shadow-sm border border-[var(--border-main)] mb-3 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#56AB2F]/5 rounded-full blur-3xl"></div>
            <h3 className="text-sm font-black text-[var(--text-main)] mb-2 flex items-center space-x-2 relative z-10">
              <div className="w-7 h-7 bg-[#56AB2F]/10 rounded-lg flex items-center justify-center">
                <Info className="w-3.5 h-3.5 text-[#56AB2F]" />
              </div>
              <span>{langData.scan_nutrition_obs}</span>
            </h3>
            <p className="text-xs font-medium text-[var(--text-muted)] leading-relaxed italic relative z-10 px-1 border-l-2 border-[#56AB2F]/30 ml-1.5">
              "{foodData.nutrition_observation || foodData.recommendation || langData.scan_no_obs}"
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-[var(--bg-card)] rounded-[20px] p-4 shadow-sm border border-[var(--border-main)] mb-4"
          >
            <h3 className="text-sm font-black text-[var(--text-main)] mb-3">{langData.scan_ingredients_title}</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {foodData.ingredients && foodData.ingredients.length > 0 ? (
                foodData.ingredients.map((ing, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ x: 3 }}
                    className="flex items-center space-x-2 bg-[var(--bg-surface)] p-2.5 rounded-xl border border-[var(--border-main)] hover:border-[#56AB2F]/30 transition-all duration-300"
                  >
                    <div className="w-1.5 h-1.5 bg-[#56AB2F] rounded-full shadow-[0_0_8px_rgba(86,171,47,0.4)] flex-shrink-0"></div>
                    <span className="text-xs font-bold text-[var(--text-main)] capitalize truncate">
                      {typeof ing === 'string' ? ing : ing.name}
                    </span>
                  </motion.div>
                ))
              ) : (
                <p className="col-span-2 text-xs text-[var(--text-muted)] font-medium italic opacity-60">{langData.scan_no_ingredients}</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5, type: 'spring', damping: 20 }}
        className="fixed bottom-0 inset-x-0 px-4 py-4 bg-[var(--bg-card)]/80 backdrop-blur-xl border-t border-[var(--border-main)] flex space-x-3 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] max-w-md mx-auto md:max-w-xl"
      >
        <button
          onClick={() => navigate('/scanner')}
          className="flex-1 py-3.5 bg-[var(--bg-surface)] text-[var(--text-muted)] font-bold rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all"
        >
          {langData.scan_redo}
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-[2] py-3.5 bg-[#56AB2F] text-white font-black rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/30 flex items-center justify-center"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : langData.save}
        </button>
      </motion.div>

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
