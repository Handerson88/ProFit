import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Moon, Sun, Monitor, CheckCircle2, Globe, Languages } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { BottomNav } from '../components/BottomNav';
import { api } from '../services/api';

export const Preferences = () => {
  const navigate = useNavigate();
  const { preference, setPreference } = useTheme();
  const { user, refreshUser } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Preferência salva com sucesso');

  const handleThemeChange = (pref: 'light' | 'dark' | 'system') => {
    setPreference(pref);
    setToastMessage('Tema atualizado com sucesso');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAILanguageChange = async (lang: 'auto' | 'pt' | 'en') => {
    try {
      await api.user.update({ ai_language: lang });
      await refreshUser();
      setToastMessage('Idioma da IA atualizado');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Failed to update AI language', err);
    }
  };

  const themes = [
    { id: 'light', name: 'Claro', icon: Sun, description: 'Interface limpa e brilhante' },
    { id: 'dark', name: 'Escuro', icon: Moon, description: 'Fácil para os olhos no escuro' },
    { id: 'system', name: 'Automático', icon: Monitor, description: 'Segue o sistema do dispositivo' }
  ];

  const languages = [
    { id: 'auto', name: 'Automático', icon: Monitor, description: 'Detecta seu idioma na conversa' },
    { id: 'pt', name: 'Português', icon: Globe, description: 'Sempre responde em Português' },
    { id: 'en', name: 'English', icon: Languages, description: 'Always respond in English' }
  ];

  return (
    <div className="main-wrapper bg-[var(--bg-app)] min-h-screen transition-colors duration-300">
      <div className="app-container pb-32 bg-transparent shadow-none border-none">
        {/* Header */}
        <div className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 z-40 bg-[var(--bg-app)]/90 backdrop-blur-sm">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-[var(--bg-card)] dark:bg-slate-800 rounded-full flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.03)] active:scale-95 transition-all text-[var(--text-main)] dark:text-gray-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[20px] font-black text-[var(--text-main)] dark:text-white tracking-tight">Preferências</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        <div className="px-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-[24px] font-black text-[var(--text-main)] dark:text-white leading-tight">Aparência</h2>
              <p className="text-[14px] text-[var(--text-muted)] dark:text-[var(--text-muted)] mt-1 font-medium">Personalize como o ProFit aparece para você</p>
            </div>

            <div className="bg-[var(--bg-card)] dark:bg-slate-800 rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-[var(--border-main)]/50 dark:border-slate-700/50">
              <h3 className="text-[16px] font-bold text-[var(--text-main)] dark:text-white mb-6">Tema do Aplicativo</h3>
              
              <div className="space-y-3">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id as any)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${
                      preference === theme.id 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'bg-gray-50 dark:bg-slate-900/50 border-transparent hover:border-[var(--border-main)] dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        preference === theme.id ? 'bg-primary text-white' : 'bg-[var(--bg-card)] dark:bg-slate-800 text-[var(--text-muted)] dark:text-[var(--text-muted)]'
                      }`}>
                        <theme.icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className={`font-bold text-[15px] ${preference === theme.id ? 'text-primary' : 'text-[var(--text-main)] dark:text-white'}`}>
                          {theme.name}
                        </p>
                        <p className="text-[12px] text-[var(--text-muted)] dark:text-[var(--text-muted)] font-medium">
                          {theme.description}
                        </p>
                      </div>
                    </div>
                    {preference === theme.id && (
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

            {/* AI Language Section */}
            <div className="bg-[var(--bg-card)] dark:bg-slate-800 rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-[var(--border-main)]/50 dark:border-slate-700/50">
              <h3 className="text-[16px] font-bold text-[var(--text-main)] dark:text-white mb-6">Idioma da IA</h3>
              
              <div className="space-y-3">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => handleAILanguageChange(lang.id as any)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${
                      (user?.ai_language || 'auto') === lang.id 
                        ? 'border-[#56AB2F] bg-[#56AB2F]/5 shadow-sm' 
                        : 'bg-gray-50 dark:bg-slate-900/50 border-transparent hover:border-[var(--border-main)] dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        (user?.ai_language || 'auto') === lang.id ? 'bg-[#56AB2F] text-white' : 'bg-[var(--bg-card)] dark:bg-slate-800 text-[var(--text-muted)] dark:text-[var(--text-muted)]'
                      }`}>
                        <lang.icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className={`font-bold text-[15px] ${ (user?.ai_language || 'auto') === lang.id ? 'text-[#56AB2F]' : 'text-[var(--text-main)] dark:text-white'}`}>
                          {lang.name}
                        </p>
                        <p className="text-[12px] text-[var(--text-muted)] dark:text-[var(--text-muted)] font-medium">
                          {lang.description}
                        </p>
                      </div>
                    </div>
                    {(user?.ai_language || 'auto') === lang.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 bg-[#56AB2F] rounded-full flex items-center justify-center text-white"
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
              <CheckCircle2 className="w-4 h-4 text-[#56AB2F]" />
              <span className="text-xs font-bold uppercase tracking-widest">{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <BottomNav />
      </div>
    </div>
  );
};
