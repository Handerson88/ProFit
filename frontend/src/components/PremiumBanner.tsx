import React from 'react';
import { motion } from 'framer-motion';
import { Crown, ArrowRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumBannerProps {
  onUpgrade?: () => void;
}

export const PremiumBanner: React.FC<PremiumBannerProps> = ({ onUpgrade }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 shadow-xl shadow-indigo-200"
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Crown size={120} className="rotate-12 translate-x-10 -translate-y-10" />
      </div>
      <div className="absolute bottom-0 left-0 p-2 opacity-5">
        <Zap size={80} className="-rotate-12 -translate-x-5 translate-y-5" />
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-3 backdrop-blur-md">
            <Crown size={12} className="mr-1.5" />
            PLANO PRO
          </div>
          <h3 className="text-2xl font-black text-white mb-2 leading-tight">
            Acesso Total à IA
          </h3>
          <p className="text-indigo-100 text-sm font-medium opacity-90 max-w-xs mx-auto sm:mx-0">
            Digitalizações ilimitadas, treinos de alta performance e suporte prioritário.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onUpgrade || (() => navigate('/plans'))}
          className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-sm shadow-lg shadow-black/10 flex items-center gap-2 transition-colors hover:bg-indigo-50"
        >
          Ativar Agora
          <ArrowRight size={18} />
        </motion.button>
      </div>
    </motion.div>
  );
};
