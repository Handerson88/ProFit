import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  Clock, 
  Zap, 
  ArrowRight,
  LogOut,
  MessageCircle,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RenovarPlano = () => {
    const navigate = useNavigate();
    const { logout, user, refreshUser } = useAuth();

    // Lógica de Redirecionamento Automático e Pooling
    useEffect(() => {
        const isExpired = user?.end_date && new Date(user.end_date) < new Date();
        const isActive = user?.subscription_status === 'ativo' && !isExpired;
        
        if (isActive) {
            navigate('/home', { replace: true });
        }

        const interval = setInterval(() => {
            refreshUser();
        }, 10000);

        return () => clearInterval(interval);
    }, [user, navigate, refreshUser]);

    const handleRenovar = () => {
        navigate(`/checkout?email=${encodeURIComponent(user?.email || '')}`);
    };

    const handleWhatsApp = () => {
        const message = encodeURIComponent(`Olá, quero renovar meu plano no ProFit. Meu e-mail: ${user?.email}`);
        window.open(`https://wa.me/258842152862?text=${message}`, '_blank');
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '--/--';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('pt-PT', { 
                day: '2-digit', 
                month: '2-digit',
                year: 'numeric' 
            });
        } catch (e) {
            return '--/--';
        }
    };

    const isExpired = user?.end_date && new Date(user.end_date) < new Date();
    const isActive = user?.subscription_status === 'ativo';
    const isWaiting = user?.subscription_status === 'pending' || user?.subscription_status === 'processing';
    
    const statusLabel = isActive ? 'Ativo' : (isExpired ? 'Expirado' : (isWaiting ? 'Aguardando renovação' : 'Expirado'));
    const statusColor = isActive ? 'text-[#22C55E]' : (isExpired ? 'text-rose-500' : 'text-amber-500');

    return (
        <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Gradient Orbs */}
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#22C55E]/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#22C55E]/5 rounded-full blur-[100px] pointer-events-none" />

            <AnimatePresence>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="max-w-[420px] w-full bg-[var(--bg-card)] border border-white/5 rounded-[32px] p-8 text-center shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative z-10"
                >
                    {/* Alerta Icon Moderno */}
                    <div className="relative mx-auto mb-10 w-24 h-24">
                        <div className="absolute inset-0 bg-[#22C55E]/20 rounded-[32px] blur-2xl animate-pulse" />
                        <div className="w-full h-full bg-white/5 border border-white/10 rounded-[32px] flex items-center justify-center relative shadow-inner">
                            <ShieldAlert size={48} className="text-[#22C55E] drop-shadow-[0_0_12px_rgba(34,197,94,0.4)]" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight leading-tight">
                        {isActive ? 'Plano Ativo' : 'Seu acesso expirou'}
                    </h1>
                    <p className="text-gray-400 font-bold text-[15px] mb-10 px-4">
                        {isActive ? 'Você tem acesso total ao ProFit.' : 'Renove seu plano para continuar evoluindo.'}
                    </p>

                    {/* Dashboard de Status (Compacto e Premium) */}
                    <div className="bg-black/20 rounded-3xl p-6 mb-10 border border-white/5 text-left shadow-inner">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-[#22C55E]/10 rounded-2xl flex items-center justify-center border border-[#22C55E]/20">
                                    <Zap size={22} className="text-[#22C55E]" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1.5">Status do Plano</p>
                                    <p className={`text-[15px] font-black uppercase tracking-tight ${statusColor}`}>
                                        {statusLabel}
                                    </p>
                                </div>
                            </div>
                            <CreditCard size={20} className="text-white/10" />
                        </div>
                        
                        <div className="h-[1px] bg-white/5 w-full mb-5" />
                        
                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <Clock size={18} className="text-gray-500" />
                                <span className="text-[13px] font-bold text-gray-400">
                                    {isExpired ? 'Expirou em:' : 'Expira em:'}
                                </span>
                             </div>
                             <span className="text-[15px] font-black text-white tracking-tight">
                                 {formatDate(user?.end_date)}
                             </span>
                        </div>
                    </div>

                    {/* Ações */}
                    <div className="space-y-4">
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleRenovar}
                            className="w-full bg-[#22C55E] text-white py-5 rounded-2xl font-black text-[15px] uppercase tracking-widest shadow-[0_20px_40px_-8px_rgba(34,197,94,0.3)] flex items-center justify-center gap-3 transition-all"
                        >
                            Renovar agora <ArrowRight size={20} />
                        </motion.button>

                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleWhatsApp}
                            className="w-full bg-transparent border border-white/10 text-white py-5 rounded-2xl font-black text-[15px] uppercase tracking-widest hover:bg-white/[0.02] flex items-center justify-center gap-3 transition-all"
                        >
                            Suporte no WhatsApp <MessageCircle size={20} className="text-[#25D366]" />
                        </motion.button>

                        <div className="pt-4">
                            <button 
                                onClick={logout}
                                className="inline-flex items-center gap-2 py-2 text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] hover:text-white transition-colors"
                            >
                                <LogOut size={14} /> Sair da conta
                            </button>
                        </div>
                    </div>

                    {/* Motivational Phrase */}
                    <div className="mt-12 group">
                         <div className="w-12 h-1 bg-[#22C55E]/20 mx-auto mb-6 rounded-full group-hover:w-20 transition-all duration-500" />
                         <p className="text-[11px] text-gray-500 font-bold italic px-6 leading-relaxed">
                            "A consistência é o que transforma esforço em resultado."
                         </p>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default RenovarPlano;
