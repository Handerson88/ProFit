import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

export const NotificationPrompt = () => {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<'prompt' | 'loading' | 'success' | 'denied'>('prompt');

  useEffect(() => {
    // Check if notifications are supported and if permission is already granted/denied
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return;
    }

    const permission = Notification.permission;
    if (permission === 'default') {
      // Delay to show the prompt after the user has explored a bit
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleEnable = async () => {
    console.log('--- NOTIFICATION ACTIVATE START ---');
    console.log('Current Permission:', Notification.permission);
    
    if (Notification.permission === 'denied') {
      console.warn('Notification permission was already denied by user/browser.');
      setStatus('denied');
      return;
    }

    setStatus('loading');
    try {
      console.log('Requesting permission...');
      const permission = await Notification.requestPermission();
      console.log('Permission Result:', permission);

      if (permission === 'granted') {
        console.log('Registering Service Worker...');
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('SW Registered:', !!registration);
        
        let subscription = await registration.pushManager.getSubscription();
        console.log('Existing Subscription:', !!subscription);

        if (!subscription) {
          console.log('Creating new subscription...');
          const publicVapidKey = 'BDZj5D4q4-h8VYjQC37AG3yW7Yw6y-oScxrsdwUajfaXXpSBoc_h3S9HwFpb8x0awJTBeEeAR_hwN6MyRPBi050';
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
          });
          console.log('New Subscription created');
        }

        console.log('Registering device with backend...');
        await api.notifications.registerDevice(subscription);
        console.log('Backend registration success');
        
        // Show immediate success notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('ProFit Calories 🔔', {
            body: 'Agora você passará a receber notificações do aplicativo ProFit para sua saúde e bem-estar.',
            icon: '/icon-192.png'
          });
        }

        setStatus('success');
        setTimeout(() => setShow(false), 3000);
      } else {
        setStatus('denied');
        setTimeout(() => setShow(false), 3000);
      }
    } catch (error: any) {
      console.error('CRITICAL Notification Setup Error:', error);
      console.error('Error Name:', error.name);
      console.error('Error Message:', error.message);
      setStatus('denied');
      // Keep visible a bit longer so user can see something happened
      setTimeout(() => setShow(false), 4000);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-10 pointer-events-none">
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 pointer-events-auto"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                status === 'success' ? 'bg-green-100 text-green-600' : 
                status === 'denied' ? 'bg-red-100 text-red-600' :
                'bg-gray-900 text-white'
              }`}>
                {status === 'success' ? <CheckCircle2 className="w-6 h-6" /> :
                 status === 'denied' ? <X className="w-6 h-6" /> :
                 <Bell className="w-6 h-6" />}
              </div>
              <button 
                onClick={() => setShow(false)}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 active:scale-90 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {status === 'prompt' || status === 'loading' ? (
              <>
                <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight">Ativar notificações?</h3>
                <p className="text-sm font-bold text-gray-500 mb-6 leading-relaxed">
                  Receba alertas inteligentes sobre sua meta de calorias e dicas exclusivas de alimentação.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span>Progresso da meta diária</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Lembretes de refeições healthy</span>
                  </div>
                </div>

                <button
                  onClick={handleEnable}
                  disabled={status === 'loading'}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-lg"
                >
                  {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>Ativar Agora</span>
                    </>
                  )}
                </button>
              </>
            ) : status === 'success' ? (
              <div className="text-center py-4">
                <h3 className="text-xl font-black text-gray-900 mb-2">Notificações Ativadas!</h3>
                <p className="text-sm font-bold text-gray-500">
                  Pronto! Agora você receberá alertas inteligentes para manter sua meta diária.
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <h3 className="text-xl font-black text-gray-900 mb-2 text-rose-600">Ops! Acesso Negado</h3>
                <p className="text-sm font-bold text-gray-500 mb-4">
                  Parece que as notificações estão bloqueadas no seu navegador ou dispositivo.
                </p>
                <div className="bg-rose-50 p-4 rounded-xl text-xs text-rose-700 font-medium leading-relaxed">
                  Para corrigir, clique no ícone de cadeado na barra de endereços e altere "Notificações" para "Permitir".
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
