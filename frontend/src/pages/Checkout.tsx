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
  const [plan, setPlan] = useState('premium');

  const handlePayment = async (method: string) => {
    setStatus('processing');
    // Simulate payment processing
    setTimeout(() => {
      setStatus('success');
      // In a real app, you would call api.billing.confirmPayment() here
    }, 2000);
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#1e293b] rounded-[24px] p-8 text-center border border-emerald-500/20 shadow-2xl shadow-emerald-500/10"
        >
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Pagamento Confirmado!</h1>
          <p className="text-slate-400 mb-8">Seu plano ProFit foi atualizado com sucesso. Aproveite todos os recursos agora!</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            Ir para o Dashboard <ArrowRight size={20} />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-emerald-500/30">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-wider mb-4"
          >
            <ShieldCheck size={14} /> Checkout Seguro
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-4">Escolha sua forma de pagamento</h1>
          <p className="text-slate-400">Complete sua atualização para o plano Premium e desbloqueie o poder total da IA.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Summary Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#1e293b] rounded-3xl p-8 border border-slate-800 shadow-xl"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                  <Star size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Plano Premium</h3>
                  <p className="text-xs text-slate-500">Assinatura Mensal</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-white">R$ 59,90</span>
                <p className="text-xs text-slate-500">/mês</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500"><CheckCircle2 size={12} /></div>
                Scans de IA ILIMITADOS
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500"><CheckCircle2 size={12} /></div>
                Planos de Treino Personalizados
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500"><CheckCircle2 size={12} /></div>
                Suporte Chatbot ProFit 24/7
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 flex justify-between items-center text-white font-bold">
              <span>Total a pagar</span>
              <span className="text-xl">R$ 59,90</span>
            </div>
          </motion.div>

          {/* Payment Methods */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-2 mb-2">Métodos Disponíveis</h4>
            
            <button 
              onClick={() => handlePayment('card')}
              disabled={status === 'processing'}
              className="w-full group bg-slate-800/50 hover:bg-emerald-500 transition-all p-5 rounded-2xl border border-slate-700 hover:border-emerald-400 flex items-center justify-between disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#1e293b] group-hover:bg-white/10 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                  <CreditCard size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-white">Cartão de Crédito</p>
                  <p className="text-xs text-slate-500 group-hover:text-white/70">Aprovação imediata</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>

            <button 
              onClick={() => handlePayment('mpesa')}
              disabled={status === 'processing'}
              className="w-full group bg-slate-800/50 hover:bg-red-600 transition-all p-5 rounded-2xl border border-slate-700 hover:border-red-400 flex items-center justify-between disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#1e293b] group-hover:bg-white/10 rounded-xl flex items-center justify-center text-red-500 group-hover:text-white transition-colors">
                  <Zap size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-white">M-Pesa</p>
                  <p className="text-xs text-slate-500 group-hover:text-white/70">Transferência rápida</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>

            {status === 'processing' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-3 py-4 text-emerald-500 font-bold"
              >
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
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
