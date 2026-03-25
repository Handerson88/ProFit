import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Check, 
  ArrowLeft, 
  Dumbbell, 
  Utensils, 
  History, 
  MessageSquare,
  Zap
} from 'lucide-react';

interface PaywallProps {
    onClose?: () => void;
    feature?: string;
}

export const Paywall: React.FC<PaywallProps> = ({ onClose, feature }) => {
    const navigate = useNavigate();

    const benefits = [
        { icon: Dumbbell, text: "Treinos Personalizados com IA", desc: "Planos de 30 dias adaptados ao seu corpo" },
        { icon: Utensils, text: "Análise Nutricional Completa", desc: "Scaneie suas refeições e entenda os macros" },
        { icon: History, text: "Histórico Ilimitado", desc: "Acompanhe sua evolução sem restrições" },
        { icon: MessageSquare, text: "Consultoria Fitness 24/7", desc: "Tire dúvidas com nossa Inteligência Artificial" }
    ];

    return (
        <div className="fixed inset-0 z-[100] bg-[var(--bg-app)] flex flex-col overflow-y-auto pb-10">
            {/* Header / Background Decoration */}
            <div className="relative h-[25vh] min-h-[200px] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-black">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#56AB2F] rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-[#A8E063] rounded-full blur-[100px]" />
                </div>
                
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="absolute top-12 left-6 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-95 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}

                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative z-10 w-20 h-20 bg-gradient-to-tr from-[#56AB2F] to-[#A8E063] rounded-3xl flex items-center justify-center shadow-2xl shadow-[#56AB2F]/40 rotate-12"
                >
                    <Sparkles className="w-10 h-10 text-white" />
                </motion.div>
            </div>

            {/* Content Container */}
            <div className="px-8 -mt-8 relative z-20">
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[var(--bg-container)] rounded-[40px] p-8 shadow-xl border border-[var(--border-main)]"
                >
                    <h1 className="text-2xl font-black text-[var(--text-main)] text-center mb-2 leading-tight">
                        Desbloqueie todo o <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#56AB2F] to-[#A8E063]">potencial do ProFit</span>
                    </h1>
                    <p className="text-[var(--text-muted)] text-center text-sm font-medium mb-10">
                        {feature 
                            ? `A funcionalidade ${feature} é exclusiva para membros Pro.` 
                            : "Junte-se à nossa comunidade premium e alcance seus objetivos mais rápido."}
                    </p>

                    <div className="space-y-6 mb-10">
                        {benefits.map((benefit, index) => (
                            <motion.div 
                                key={index}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                className="flex items-start gap-4"
                            >
                                <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] flex items-center justify-center text-[#56AB2F] flex-shrink-0">
                                    <benefit.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[var(--text-main)]">{benefit.text}</p>
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">{benefit.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Special Offer Box */}
                    <div className="bg-gradient-to-r from-[#56AB2F]/10 to-[#A8E063]/10 border border-[#56AB2F]/20 rounded-3xl p-5 mb-10 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-[#56AB2F] uppercase tracking-widest mb-1">Assinatura Mensal</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-[var(--text-main)]">R$ 29,90</span>
                                <span className="text-xs text-[var(--text-muted)] font-bold">/mês</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-[#56AB2F] text-white px-3 py-1.5 rounded-full">
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Acesso Total</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <button 
                            onClick={() => navigate('/checkout')}
                            className="w-full h-16 bg-gradient-to-r from-[#56AB2F] to-[#A8E063] text-white font-black text-base uppercase tracking-widest rounded-2xl shadow-lg shadow-[#56AB2F]/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            Ativar Plano Pro 🚀
                        </button>
                        
                        <button 
                            onClick={() => onClose ? onClose() : navigate(-1)}
                            className="w-full py-4 text-[var(--text-muted)] font-bold text-xs uppercase tracking-widest active:scale-95 transition-all text-center"
                        >
                            Talvez mais tarde
                        </button>
                    </div>
                </motion.div>

                {/* Social Proof / Security */}
                <div className="mt-8 flex flex-col items-center opacity-60">
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4 text-center">
                        🔒 Pagamento Seguro & Garantia ProFit
                    </p>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-[#56AB2F]" />
                            <span className="text-[9px] font-bold text-[var(--text-muted)]">Cancele quando quiser</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-[#56AB2F]" />
                            <span className="text-[9px] font-bold text-[var(--text-muted)]">Suporte Prioritário</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
