import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Moon, Sun, Monitor, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { BottomNav } from '../components/BottomNav';

export const Preferences = () => {
  const navigate = useNavigate();
  const { themeMode, setThemeMode } = useTheme();
  const [showToast, setShowToast] = useState(false);

  const handleThemeChange = (mode: 'light' | 'dark' | 'auto') => {
    setThemeMode(mode);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const themes = [
    { id: 'light', name: 'Claro', icon: Sun, description: 'Interface limpa e brilhante' },
    { id: 'dark', name: 'Escuro', icon: Moon, description: 'Fácil para os olhos no escuro' },
    { id: 'auto', name: 'Automático', icon: Monitor, description: 'Segue o sistema do dispositivo' }
  ];

  return (
    <div className="main-wrapper bg-[#F6F7F9] dark:bg-[#0F172A] min-h-screen transition-colors duration-300">
      <div className="app-container pb-32 bg-transparent shadow-none border-none">
        {/* Header */}
        <div className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 z-40 bg-[#F6F7F9]/90 dark:bg-[#0F172A]/90 backdrop-blur-sm">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.03)] active:scale-95 transition-all text-gray-700 dark:text-gray-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[20px] font-black text-gray-900 dark:text-white tracking-tight">Preferências</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        <div className="px-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-[24px] font-black text-gray-900 dark:text-white leading-tight">Aparência</h2>
              <p className="text-[14px] text-gray-500 dark:text-gray-400 mt-1 font-medium">Personalize como o ProFit aparece para você</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-gray-50/50 dark:border-slate-700/50">
              <h3 className="text-[16px] font-bold text-gray-900 dark:text-white mb-6">Tema do Aplicativo</h3>
              
              <div className="space-y-3">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id as any)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${
                      themeMode === theme.id 
                        ? 'bg-primary/5 border-primary shadow-sm' 
                        : 'bg-gray-50 dark:bg-slate-900/50 border-transparent hover:border-gray-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        themeMode === theme.id ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-gray-400 dark:text-gray-500'
                      }`}>
                        <theme.icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className={`font-bold text-[15px] ${themeMode === theme.id ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                          {theme.name}
                        </p>
                        <p className="text-[12px] text-gray-400 dark:text-gray-500 font-medium">
                          {theme.description}
                        </p>
                      </div>
                    </div>
                    {themeMode === theme.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Toast Notification */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-gray-900 dark:bg-slate-700 text-white rounded-full flex items-center space-x-3 shadow-2xl"
            >
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest">Preferência salva com sucesso</span>
            </motion.div>
          )}
        </AnimatePresence>

        <BottomNav />
      </div>
    </div>
  );
};
