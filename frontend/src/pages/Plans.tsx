import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowLeft, Crown, Zap, ShieldCheck } from 'lucide-react';

export const Plans = () => {
  const navigate = useNavigate();

  return (
    <div className="main-wrapper bg-[#F6F7F9]">
      <div className="app-container min-h-screen pb-20">
        <div className="px-6 pt-12 pb-10 flex items-center justify-between sticky top-0 z-40 bg-[#F6F7F9]/80 backdrop-blur-md">
          <button 
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm active:scale-90 transition-all text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">ProFit Elite</h1>
          <div className="w-12" />
        </div>

        <div className="px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[40px] p-8 shadow-xl border-2 border-indigo-500 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Crown size={120} />
            </div>

            <div className="w-20 h-20 bg-indigo-50 rounded-[28px] flex items-center justify-center text-indigo-600 mb-8 shadow-inner">
               <Crown size={40} />
            </div>

            <h2 className="text-3xl font-black text-gray-900 mb-2">Acesso Total Elite</h2>
            <div className="flex items-baseline gap-2 mb-8">
               <span className="text-5xl font-black text-gray-900 tracking-tighter">599</span>
               <span className="text-xl font-bold text-gray-400">MZN / único</span>
            </div>

            <div className="space-y-5 mb-10">
               {[
                 "Scans de IA ilimitados para todas as refeições",
                 "Planos de treino personalizados de alta performance",
                 "Monitoramento completo de macros e calorias",
                 "Consultoria IA prioritária 24/7",
                 "Zero anúncios e distrações",
                 "Acesso antecipado a novas funcionalidades"
               ].map((feature, i) => (
                 <div key={i} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                       <Check size={14} className="text-indigo-600 font-bold" />
                    </div>
                    <span className="text-sm font-bold text-gray-600 leading-tight">{feature}</span>
                 </div>
               ))}
            </div>

            <div className="bg-indigo-50/50 rounded-3xl p-5 border border-indigo-100 mb-8 flex items-center gap-4">
               <ShieldCheck className="text-indigo-600" size={24} />
               <p className="text-[10px] text-indigo-700 font-bold leading-relaxed uppercase tracking-widest">
                  Pagamento único. Acesso vitalício à versão Elite.
               </p>
            </div>

            <button 
              onClick={() => navigate('/checkout')}
              className="w-full bg-indigo-600 text-white py-6 rounded-[28px] font-black text-lg shadow-xl shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              ATIVAR AGORA
              <Zap size={20} fill="currentColor" />
            </button>
          </motion.div>

          <p className="mt-10 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
             Garantia de satisfação ProFit
          </p>
        </div>
      </div>
    </div>
  );
};
