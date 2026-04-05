import React, { useEffect, useState } from 'react';
import { Search, Plus, ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';

export const FoodSearch = () => {
  const navigate = useNavigate();
  const [foods, setFoods] = useState([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchFoods = async () => {
      setIsLoading(true);
      try {
        if (query.length > 2) {
          const results = await api.foods.search(query);
          setFoods(results.foods || []);
        } else if (query.length === 0) {
          const results = await api.foods.getAll();
          setFoods(results || []);
        } else {
           setFoods([]);
        }
      } catch (err) {
        console.error("Search failed");
      } finally {
        setIsLoading(false);
      }
    };
    
    const timeoutId = setTimeout(() => {
      fetchFoods();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="main-wrapper bg-[var(--bg-app)]">
      <div className="app-container pb-24 bg-transparent shadow-none border-none">
      
      {/* Sticky Header */}
      <div className="px-6 pt-12 pb-6 flex items-center sticky top-0 z-40 bg-[var(--bg-app)]/90 backdrop-blur-sm">
        <button 
          onClick={() => navigate(-1)}
          className="w-12 h-12 bg-[var(--bg-card)] rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all text-[var(--text-main)]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-[var(--text-main)] ml-4">Search Food</h1>
      </div>

      <div className="px-6">
        {/* Search Bar */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[#56AB2F] w-5 h-5 transition-colors" />
            <input 
              type="text" 
              placeholder="Search food or scan barcode..." 
              className="w-full bg-[var(--bg-card)] border-none rounded-[24px] py-5 pl-14 pr-6 text-[var(--text-main)] font-medium placeholder:text-gray-300 shadow-[0_4px_20px_rgb(0,0,0,0.03)] focus:ring-2 focus:ring-[#A8E063]/20 transition-all outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => navigate('/scanner')}
            className="w-[60px] h-[60px] bg-[var(--bg-card)] rounded-[24px] text-[#56AB2F] shadow-sm border border-white flex items-center justify-center active:scale-95 transition-all outline-none hover:bg-gray-50"
          >
            <Camera className="w-6 h-6" />
          </button>
        </div>

        {isLoading && (
          <div className="flex justify-center flex-col items-center py-20 opacity-50">
            <Loader2 className="w-8 h-8 animate-spin text-[#56AB2F] mb-3" />
            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none">Accessing Central Data</p>
          </div>
        )}

        {!isLoading && (
          <div className="space-y-4">
            {foods.map((food: any, i: number) => (
              <motion.div
                key={food.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.5) }}
                className="bg-[var(--bg-card)] rounded-[28px] p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white flex justify-between items-center group transition-all hover:shadow-md"
              >
                <div className="flex items-center space-x-4 flex-1 overflow-hidden">
                   <div className="w-14 h-14 bg-gray-50 rounded-[20px] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner">🥗</div>
                   <div className="flex-1 truncate">
                     <h3 className="font-bold text-[var(--text-main)] text-[15px] truncate pr-2 leading-tight">{food.name}</h3>
                     <div className="flex space-x-2 mt-1.5">
                       <span className="text-[10px] text-[#56AB2F] font-black uppercase tracking-wider bg-[#A8E063]/10 px-2.5 py-1 rounded-full">{food.calories} kcal / 100g</span>
                     </div>
                   </div>
                </div>
                <button 
                  onClick={() => navigate('/log-meal', { state: { food } })}
                  className="w-11 h-11 rounded-[18px] bg-gradient-to-tr from-[#56AB2F] to-[#A8E063] text-white flex shrink-0 items-center justify-center shadow-md active:scale-90 transition-all"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </button>
              </motion.div>
            ))}
            {!isLoading && foods.length === 0 && query.length > 2 && (
               <div className="text-center py-20">
                 <p className="text-gray-300 font-bold mb-1 italic text-lg opacity-60">No result found</p>
                 <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40">Try searching for simple food names</p>
               </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
