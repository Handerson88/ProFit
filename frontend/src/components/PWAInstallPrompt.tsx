import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X, Download, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PWAInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect if already installed (standalone mode)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    setIsStandalone(isStandaloneMode);

    // Detect platform
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    // Check persistence
    const dismissedForever = localStorage.getItem('pwa_prompt_dismissed_forever');
    const dismissedUntil = localStorage.getItem('pwa_prompt_dismissed_until');
    const now = Date.now();

    if (isStandaloneMode || dismissedForever || (dismissedUntil && now < parseInt(dismissedUntil))) {
      return;
    }

    // Handle Chromium install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS and others without beforeinstallprompt, we show after delay
    if (!isStandaloneMode) {
      const timer = setTimeout(() => setShowPrompt(true), 4000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const dismissForever = () => {
    localStorage.setItem('pwa_prompt_dismissed_forever', 'true');
    setShowPrompt(false);
  };

  const dismissTemporary = () => {
    const until = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    localStorage.setItem('pwa_prompt_dismissed_until', until.toString());
    setShowPrompt(false);
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
      >
        <div className="bg-white dark:bg-[#1E293B] rounded-[32px] p-6 shadow-2xl border border-[#56AB2F]/20 relative overflow-hidden max-w-sm mx-auto">
          <button 
            onClick={dismissTemporary}
            className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            <X size={20} />
          </button>

          <div className="flex items-center space-x-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-[#A8E063] to-[#56AB2F] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 flex-shrink-0">
              <Smartphone className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[var(--text-main)] leading-tight">Instalar Profit</h3>
              <p className="text-[12px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Use como um app real</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed">
              Tenha acesso rápido, notificações em tempo real e uma experiência fluida instalando o Profit na sua tela de início.
            </p>

            {isIOS ? (
              <div className="bg-[var(--bg-app)] rounded-2xl p-4 space-y-3 border border-[var(--border-main)]">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                    <Share size={16} />
                  </div>
                  <span className="font-bold text-[var(--text-main)]">1. Clique em "Compartilhar"</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                    <PlusSquare size={16} />
                  </div>
                  <span className="font-bold text-[var(--text-main)]">2. "Adicionar à Tela de Início"</span>
                </div>
              </div>
            ) : !deferredPrompt ? (
               <div className="bg-[var(--bg-app)] rounded-2xl p-4 space-y-3 border border-[var(--border-main)]">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-8 h-8 bg-gray-500/10 rounded-lg flex items-center justify-center text-gray-400">
                    <span className="text-xl">⋮</span>
                  </div>
                  <span className="font-bold text-[var(--text-main)]">1. Clique nos 3 pontos</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                    <PlusSquare size={16} />
                  </div>
                  <span className="font-bold text-[var(--text-main)]">2. "Adicionar à tela inicial"</span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            {deferredPrompt && (
              <button 
                onClick={handleInstallClick}
                className="w-full btn-primary py-4 flex items-center justify-center space-x-2 rounded-2xl"
              >
                <Download size={20} />
                <span className="font-black">INSTALAR AGORA</span>
              </button>
            )}

            <button 
              onClick={dismissForever}
              className="w-full py-3 text-[var(--text-main)] font-bold text-sm bg-[var(--bg-app)] rounded-2xl border border-[var(--border-main)] hover:bg-[var(--bg-card)] transition-colors"
            >
              Já instalei
            </button>

            <button 
              onClick={dismissTemporary}
              className="w-full py-2 text-[var(--text-muted)] font-bold text-[12px] hover:text-[var(--text-main)] transition-colors"
            >
              Continuar no navegador
            </button>
          </div>
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#56AB2F]/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
