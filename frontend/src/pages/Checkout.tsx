import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, CheckCircle2, ArrowRight, ShieldCheck, Zap, Star } from 'lucide-react';
import { api } from '../services/api';

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get('userId');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async (method: string) => {
    setStatus('processing');
    setError(null);
    try {
      // Chamada real para o backend usando o serviço correto
      await api.payments.create({
        amount: 349,
        method: method,
        phone: '840000000' // Placeholder
      });
      
      // Simulação de confirmação
      setTimeout(() => {
        setStatus('success');
      }, 3000);
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Falha ao processar pagamento.');
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-6 text-[var(--text-main)]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[var(--bg-card)] rounded-[24px] p-8 text-center border border-emerald-500/20 shadow-2xl shadow-emerald-500/10"
        >
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Plano ativado com sucesso 🎉</h1>
          <p className="text-[var(--text-muted)] mb-8 font-bold">Aproveite todos os recursos ilimitados do ProFit agora!</p>
          <button 
            onClick={() => {
              window.location.href = '/dashboard';
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-black transition-all flex items-center justify-center gap-2"
          >
            Começar Agora <ArrowRight size={20} />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] font-sans selection:bg-primary/30">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4"
          >
            <ShieldCheck size={14} /> Checkout Seguro
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Ative seu Plano Pro</h1>
          <p className="text-[var(--text-muted)] font-medium">Complete sua assinatura mensal e desbloqueie o poder total da IA.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Summary Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[var(--bg-card)] rounded-3xl p-8 border border-[var(--border-main)] shadow-xl"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Star size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Plano Pro</h3>
                  <p className="text-xs text-[var(--text-muted)] font-bold">Assinatura Mensal</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black">349 MZN</span>
                <p className="text-xs text-[var(--text-muted)] font-bold">/mês</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-sm font-bold text-[var(--text-muted)]">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500"><CheckCircle2 size={12} /></div>
                Acesso ILIMITADO
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-[var(--text-muted)]">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500"><CheckCircle2 size={12} /></div>
                Planos de Treino com IA
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-[var(--text-muted)]">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500"><CheckCircle2 size={12} /></div>
                Análise de Refeições IA
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center">
                {error}
              </div>
            )}

            <div className="pt-6 border-t border-[var(--border-main)] flex justify-between items-center font-black">
              <span>Total a pagar</span>
              <span className="text-xl">349 MZN</span>
            </div>
          </motion.div>

          {/* Payment Methods */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h4 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest pl-2 mb-2">Pagamento Móvel</h4>
            
            <button 
              onClick={() => handlePayment('mpesa')}
              disabled={status === 'processing'}
              className="w-full group bg-[var(--bg-accent-soft)] hover:bg-red-600 transition-all p-5 rounded-2xl border border-[var(--border-main)] hover:border-red-400 flex items-center justify-between disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--bg-card)] group-hover:bg-white/10 rounded-xl flex items-center justify-center text-red-500 group-hover:text-white transition-colors">
                  <Zap size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold">M-Pesa</p>
                  <p className="text-xs text-[var(--text-muted)] font-black group-hover:text-white/70">84xxxxxxx</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-[var(--text-muted)] group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>

            <button 
              onClick={() => handlePayment('emola')}
              disabled={status === 'processing'}
              className="w-full group bg-[var(--bg-accent-soft)] hover:bg-orange-600 transition-all p-5 rounded-2xl border border-[var(--border-main)] hover:border-orange-400 flex items-center justify-between disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--bg-card)] group-hover:bg-white/10 rounded-xl flex items-center justify-center text-orange-500 group-hover:text-white transition-colors">
                  <CreditCard size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold">e-Mola</p>
                  <p className="text-xs text-[var(--text-muted)] font-black group-hover:text-white/70">86xxxxxxx / 87xxxxxxx</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-[var(--text-muted)] group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>

            {status === 'processing' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-3 py-4 text-primary font-black uppercase text-xs tracking-widest"
              >
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Processando seu pagamento...
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
