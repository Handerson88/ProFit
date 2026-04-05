import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowLeft, Crown, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const Plans = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPro = user?.plan_type === 'pro';

  React.useEffect(() => {
    if (user?.id && (user as any)?.funnel_step !== 'PAID') {
       api.user.updateFunnelStep('PLAN_VIEWED').catch(() => {});
    }
  }, [user?.id, (user as any)?.funnel_step]);

  return (
    <div className="main-wrapper bg-[var(--bg-app)]">
      <div className="app-container min-h-screen pb-20">
        <div className="px-6 pt-12 pb-10 flex items-center justify-between sticky top-0 z-40 bg-[var(--bg-app)]/80 backdrop-blur-md">
          <button 
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-[var(--bg-card)] rounded-2xl flex items-center justify-center shadow-sm active:scale-90 transition-all text-[var(--text-main)]"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Planos ProFit</h1>
          <div className="w-12" />
        </div>

        <div className="px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--bg-card)] rounded-[40px] p-8 shadow-xl border-2 border-primary relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Crown size={120} />
            </div>

            <div className="w-20 h-20 bg-primary/10 rounded-[28px] flex items-center justify-center text-primary mb-8 shadow-inner">
               <Crown size={40} />
            </div>

            <h2 className="text-3xl font-black text-[var(--text-main)] mb-2">Plano Pro</h2>
            <div className="flex items-baseline gap-2 mb-8">
               <span className="text-5xl font-black text-[var(--text-main)] tracking-tighter">299</span>
               <span className="text-xl font-bold text-[var(--text-muted)]">MZN / mês</span>
            </div>

            <div className="space-y-5 mb-10">
               {[
                 "Acesso ILIMITADO a todas as funções",
                 "Geração de treinos com IA Avançada",
                 "Análise de alimentação em tempo real",
                 "Histórico completo de evolução",
                 "Consultoria IA prioritária 24/7",
                 "Notificações e lembretes inteligentes",
                 "Atualizações frequentes e exclusivas"
               ].map((feature, i) => (
                 <div key={feature} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                       <Check size={14} className="text-primary font-bold" />
                    </div>
                    <span className="text-sm font-bold text-[var(--text-main)] leading-tight">{feature}</span>
                 </div>
               ))}
            </div>

            <div className="bg-primary/5 rounded-3xl p-5 border border-primary/10 mb-8 flex items-center gap-4">
               <Zap className="text-primary" size={24} />
               <p className="text-[10px] text-[var(--text-muted)] font-black leading-relaxed uppercase tracking-widest">
                  Acesso imediato após confirmação. Renovação mensal simples.
               </p>
            </div>

            <button 
              onClick={() => navigate('/checkout')}
              className="w-full btn-primary py-6 rounded-[28px] font-black text-lg shadow-xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {isPro ? 'RENOVAR MEU PLANO PRO' : 'ATIVAR PLANO PRO'}
              <Crown size={20} fill="currentColor" />
            </button>
          </motion.div>

          <p className="mt-10 text-center text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.2em]">
             Tecnologia de ponta por 11 MZN ao dia
          </p>
        </div>
      </div>
    </div>
  );
};
