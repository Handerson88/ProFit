import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Shield, Zap, Star, ArrowRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Upgrade = () => {
  const navigate = useNavigate();
  const { totalUsersCount } = useAuth();

  const benefits = [
    { icon: <Shield className="w-6 h-6 text-[#56AB2F]" />, title: 'Acesso ilimitado', desc: 'Use todas as ferramentas sem restrições.' },
    { icon: <Zap className="w-6 h-6 text-[#56AB2F]" />, title: 'Sem bloqueios', desc: 'Navegue livremente por todo o aplicativo.' },
    { icon: <Star className="w-6 h-6 text-[#56AB2F]" />, title: 'Recursos premium', desc: 'IA avançada e planos personalizados.' },
    { icon: <Rocket className="w-6 h-6 text-[#56AB2F]" />, title: 'Melhor performance', desc: 'Velocidade e prioridade no suporte.' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col items-center justify-center p-6 pb-24">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[var(--bg-card)] rounded-[40px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white text-center"
      >
        <div className="w-20 h-20 bg-[#56AB2F]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-[#56AB2F]" />
        </div>

        <h1 className="text-3xl font-black text-[var(--text-main)] mb-4">🚀 Desbloqueie o Pro</h1>
        
        <p className="text-[var(--text-muted)] font-medium mb-8 leading-relaxed">
          O ProFit atingiu o limite de <span className="text-[#56AB2F] font-bold">{totalUsersCount}</span> usuários ativos. 
          Para continuar aproveitando todas as funcionalidades, ative seu plano PRO agora.
        </p>

        <div className="space-y-4 mb-10 text-left">
          {benefits.map((benefit, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-start space-x-4 p-4 rounded-2xl bg-[var(--bg-app)]/50 border border-transparent hover:border-[#56AB2F]/10 transition-all"
            >
              <div className="mt-1">{benefit.icon}</div>
              <div>
                <h3 className="font-bold text-[var(--text-main)]">{benefit.title}</h3>
                <p className="text-sm text-[var(--text-muted)] font-medium">{benefit.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <button 
          onClick={() => navigate('/plans')}
          className="w-full bg-gradient-to-r from-[#A8E063] to-[#56AB2F] text-white font-black py-5 rounded-2xl shadow-xl shadow-[#56AB2F]/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
        >
          <span>Ativar Plano PRO Agora</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <button 
          onClick={() => navigate('/profile')}
          className="mt-6 text-[var(--text-muted)] font-bold hover:text-[var(--text-muted)] transition-all underline underline-offset-4"
        >
          Ver meu perfil
        </button>
      </motion.div>
      
      <p className="mt-8 text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">
        ProFit Premium Experience
      </p>
    </div>
  );
};
