import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, Copy, Share2, CheckCircle2, Loader2, Users } from 'lucide-react';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export const Invitations: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ count: 0, target: 10, is_eligible: false });
    const [profile, setProfile] = useState<any>(null);
    const [copying, setCopying] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const profileData = await api.user.getProfile();
                setProfile(profileData);
            } catch (e) {
                console.error("Profile fetch error", e);
            }
            
            try {
                const statsData = await api.user.getReferrals();
                setStats(statsData);
            } catch (e) {
                console.error("Referrals fetch error", e);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    let userId = profile?.id || '';
    if (!userId) {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                userId = JSON.parse(userStr)?.id || '';
            }
        } catch (e) {
            console.error("Error parsing user for invitations", e);
        }
    }
    const referralLink = `${window.location.origin}/register?ref=${userId}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopying(true);
        setTimeout(() => setCopying(false), 2000);
    };

    const handleWhatsApp = () => {
        const text = encodeURIComponent(`Vem treinar comigo no ProFit! Use meu link para ganhar benefícios: ${referralLink}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#56AB2F] animate-spin" />
            </div>
        );
    }

    const progress = Math.min((stats.count / stats.target) * 100, 100);

    return (
        <div className="min-h-screen bg-[var(--bg-app)] pb-20">
            {/* Header */}
            <div className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 z-40 bg-[var(--bg-app)]/90 backdrop-blur-sm">
                <div className="flex-1 flex justify-start">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 bg-[var(--bg-card)] rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5 text-[var(--text-main)]" />
                    </button>
                </div>
                <div className="flex-1 flex justify-center whitespace-nowrap">
                    <h1 className="text-xl font-black text-[var(--text-main)]">Convide e Ganhe</h1>
                </div>
                <div className="flex-1"></div>
            </div>

            <div className="px-6 space-y-6">
                {/* Hero Card */}
                <div className="bg-gradient-to-br from-[#56AB2F] to-[#A8E063] rounded-[32px] p-8 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <Gift className="w-12 h-12 mb-4 text-white/90" />
                        <h2 className="text-2xl font-black mb-2">Ganhe 50% de Desconto</h2>
                        <p className="text-white/80 font-medium leading-relaxed">
                            Convide 10 amigos que ativarem o plano e ganhe um desconto especial na sua próxima renovação!
                        </p>
                    </div>
                    <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-[var(--bg-card)]/10 rounded-full blur-3xl"></div>
                </div>

                {/* Progress Card */}
                <div className="bg-[var(--bg-card)] rounded-[32px] p-8 border border-[var(--border-main)] shadow-sm">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Seu Progresso</p>
                            <h3 className="text-3xl font-black text-[var(--text-main)]">{stats.count} <span className="text-gray-300 text-lg">/ {stats.target}</span></h3>
                        </div>
                        <div className="text-right">
                            <span className="text-[#56AB2F] font-black text-lg">{Math.round(progress)}%</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden mb-4">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-[#56AB2F] to-[#A8E063]"
                        />
                    </div>

                    <p className="text-center text-sm font-medium text-[var(--text-muted)]">
                      {stats.count < stats.target 
                        ? `Faltam ${stats.target - stats.count} convites ativos para o próximo prêmio!`
                        : "🎉 Você atingiu a meta! Seu desconto está disponível."}
                    </p>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                    <div className="bg-[var(--bg-card)] rounded-3xl p-6 border border-[var(--border-main)]">
                        <p className="text-sm font-bold text-[var(--text-muted)] mb-4 ml-1">Seu link de indicação</p>
                        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-[var(--border-main)]">
                            <input 
                                type="text" 
                                readOnly 
                                value={referralLink}
                                className="flex-grow bg-transparent border-none text-xs font-medium text-[var(--text-muted)] focus:ring-0 truncate pl-2"
                            />
                            <button 
                                onClick={handleCopy}
                                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all ${
                                    copying ? 'bg-emerald-500 text-white' : 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm active:scale-95'
                                }`}
                            >
                                {copying ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                                {copying ? 'Copiado!' : 'Copiar'}
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={handleWhatsApp}
                        className="w-full bg-[#25D366] text-white py-5 rounded-[28px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-green-500/20 active:scale-[0.98] transition-all"
                    >
                        <Share2 size={20} />
                        Compartilhar no WhatsApp
                    </button>
                </div>

                {/* Info Section */}
                <div className="bg-[#F0F9EB] rounded-3xl p-6 border border-[#E6F4E2]">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#56AB2F] flex items-center justify-center text-white shrink-0">
                      <Users size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-[var(--text-main)] text-sm mb-1 uppercase tracking-tight">O que são usuários ativos?</h4>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
                        Um amigo é considerado "ativo" depois que ele cria uma conta pelo seu link e realiza o pagamento de qualquer plano.
                      </p>
                    </div>
                  </div>
                </div>
            </div>
        </div>
    );
};
