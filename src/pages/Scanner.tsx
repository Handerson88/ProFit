import React from 'react';
import { Camera, X, Zap, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const FoodScanner = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Camera Viewport Mock */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-60"></div>
      
      {/* Scanning Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="w-72 h-72 border-2 border-primary/50 relative">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary -translate-x-1 -translate-y-1"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary translate-x-1 -translate-y-1"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary -translate-x-1 translate-y-1"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary translate-x-1 translate-y-1"></div>
          
          <motion.div 
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 w-full h-[2px] bg-primary shadow-[0_0_15px_#A8E063]"
          />
        </div>
        <p className="text-white font-black uppercase tracking-widest text-xs mt-10 drop-shadow-lg">Align food within the frame</p>
      </div>

      {/* Top Controls */}
      <div className="relative z-10 flex justify-between items-center p-8">
        <button onClick={() => navigate(-1)} className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white">
          <X className="w-6 h-6" />
        </button>
        <div className="flex space-x-4">
          <button className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white"><Zap className="w-6 h-6" /></button>
          <button className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white"><RotateCcw className="w-6 h-6" /></button>
        </div>
      </div>

      {/* Bottom Info Card (Mock detection result) */}
      <div className="absolute bottom-10 left-0 right-0 p-8">
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="bg-white/90 backdrop-blur-xl rounded-[32px] p-6 shadow-2xl flex justify-between items-center"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl">🥗</div>
            <div>
              <h3 className="font-black text-text-primary">Salad Detected</h3>
              <p className="text-xs font-bold text-text-secondary opacity-60">High accuracy (98%)</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/log-meal', { state: { food: { name: 'Fresh Salad', kcal: 120, unit: '100g' } } })}
            className="bg-primary text-white p-4 rounded-2xl shadow-lg active:scale-95 transition-all"
          >
            <Camera className="w-6 h-6" />
          </button>
        </motion.div>
      </div>
    </div>
  );
};
