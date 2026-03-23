import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2, ShieldCheck, Loader2, BellOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService } from '../services/notificationService';

export const NotificationPrompt = () => {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<'prompt' | 'loading' | 'success' | 'denied'>('prompt');

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    const permission = Notification.permission;
    if (permission === 'default') {
      const timer = setTimeout(() => setShow(true), 3500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Auto-detect when user returns from settings after granting permission
  useEffect(() => {
    const handleFocus = () => {
      if (status === 'denied' && Notification.permission === 'granted') {
        console.log('[NotificationPrompt] Permission changed to granted, retrying...');
        handleEnable();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [status]);

  const handleEnable = async () => {
    setStatus('loading');
    try {
      const success = await notificationService.subscribe();
      setStatus(success ? 'success' : 'denied');
      if (success) {
        setTimeout(() => setShow(false), 3000);
      }
    } catch {
      setStatus('denied');
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notification_prompt_dismissed', 'true');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-8 pointer-events-none">
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-sm pointer-events-auto"
          >
            {/* Card */}
            <div className="relative bg-white rounded-[28px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-gray-100">
              
              {/* Gradient header strip */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#56AB2F] via-[#A8E063] to-[#56AB2F]" />
              
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-all active:scale-90"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="p-6">
                {status === 'success' ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center py-2"
                  >
                    <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-7 h-7 text-green-600" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-1">Notificações ativas!</h3>
                    <p className="text-sm text-gray-400 font-medium">Você receberá alertas inteligentes sobre suas metas.</p>
                  </motion.div>
                ) : status === 'denied' ? (
                  <div className="flex flex-col items-center text-center py-2">
                    <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mb-4">
                      <BellOff className="w-7 h-7 text-rose-500" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-2">Acesso bloqueado</h3>
                    <div className="bg-rose-50 rounded-xl p-3 text-xs text-rose-600 font-medium leading-relaxed text-left mb-4">
                      Para ativar, clique no ícone de cadeado 🔒 na barra de endereços do navegador e altere <strong>Notificações</strong> para <strong>Permitir</strong>.
                    </div>
                    <button
                      onClick={handleEnable}
                      className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verificar Novamente</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Icon Row */}
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#56AB2F] to-[#A8E063] rounded-[20px] flex items-center justify-center shadow-[0_8px_20px_rgba(86,171,47,0.3)]">
                        <Bell className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-[18px] font-black text-gray-900 leading-tight">Ativar notificações</h3>
                        <p className="text-[12px] text-gray-400 font-semibold mt-0.5">Alertas inteligentes para você</p>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-2.5 mb-6">
                      {[
                        { emoji: '📊', text: 'Progresso da sua meta diária de calorias' },
                        { emoji: '🍽️', text: 'Lembretes personalizados de refeições' },
                        { emoji: '💡', text: 'Dicas e atualizações exclusivas do app' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                          <span className="text-base">{item.emoji}</span>
                          <span className="text-[13px] text-gray-600 font-medium">{item.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={handleEnable}
                      disabled={status === 'loading'}
                      className="w-full py-4 bg-gradient-to-r from-[#56AB2F] to-[#A8E063] text-white rounded-[18px] font-black text-[14px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_8px_24px_rgba(86,171,47,0.35)] disabled:opacity-70"
                    >
                      {status === 'loading' ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /><span>Ativando...</span></>
                      ) : (
                        <><ShieldCheck className="w-4 h-4" /><span>Ativar Notificações</span></>
                      )}
                    </button>

                    {/* Skip link */}
                    <button
                      onClick={handleDismiss}
                      className="w-full mt-3 py-2 text-[12px] text-gray-400 font-semibold hover:text-gray-600 transition-colors"
                    >
                      Agora não
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
