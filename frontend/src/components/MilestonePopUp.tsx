import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, X, Crown, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MilestonePopUpProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MilestonePopUp: React.FC<MilestonePopUpProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl overflow-hidden"
          >
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -mr-10 -mt-10 rounded-full blur-2xl" />
            
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-gradient-to-tr from-[#A8E063] to-[#56AB2F] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20 rotate-6">
                <Rocket className="w-10 h-10 text-white -rotate-6" />
              </div>
              
              <h2 className="text-2xl font-black text-gray-900 mb-3 leading-tight">
                PROFIT AGORA É ELITE! 🚀
              </h2>
              
              <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                Atingimos a marca de 20 usuários e acabamos de lançar a versão **Elite**. Explore recursos exclusivos e leve seus resultados para o próximo nível!
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
                    <Zap size={16} />
                  </div>
                  <span className="text-xs font-bold text-gray-700 text-left">Digitalizações Ilimitadas</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
                    <Crown size={16} />
                  </div>
                  <span className="text-xs font-bold text-gray-700 text-left">Planos de Treino Avançados</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onClose();
                  navigate('/checkout');
                }}
                className="w-full bg-gray-900 text-white font-black py-5 rounded-2xl mt-8 shadow-xl active:scale-95 transition-all"
              >
                QUERO SER ELITE 🚀
              </motion.button>
              
              <button 
                onClick={onClose}
                className="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
