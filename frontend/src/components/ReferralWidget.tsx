import React, { useState } from 'react';
import { Copy, Share2, Users, Gift, CheckCircle2, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ReferralWidgetProps {
    referralCode: string;
    totalReferrals: number;
    payingReferrals?: number;
    discountEarned: boolean;
    discountUsed: boolean;
}

const ReferralWidget: React.FC<ReferralWidgetProps> = ({ 
    referralCode, 
    totalReferrals, 
    payingReferrals = 0,
    discountEarned,
    discountUsed
}) => {
    const [copied, setCopied] = useState(false);
    const progress = Math.min((payingReferrals / 10) * 100, 100);
    const remaining = Math.max(10 - payingReferrals, 0);
    
    // Fallback if referralCode is not yet loaded
    const code = referralCode || '...';
    const inviteLink = `${window.location.origin}/register?ref=${code}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        toast.success('Link de convite copiado!');
        setTimeout(() => setCopied(false), 2000);
    };

    const shareWhatsApp = () => {
        const text = encodeURIComponent(`Ei! Estou usando o ProFit para organizar meus treinos e dieta. Use meu link para se cadastrar e ganhar bônus: ${inviteLink}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    return (
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--bg-card)]/10 rounded-full blur-2xl" />
            <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-indigo-400/10 rounded-full blur-3xl" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-[var(--bg-card)]/20 rounded-xl">
                            <Gift className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">Convide e Ganhe</h3>
                            <p className="text-white/70 text-xs italic">Ganhe 50% OFF no ProFit Pro</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-medium text-white/80 uppercase tracking-wider">Seu Progresso</span>
                            <span className="text-sm font-bold">{payingReferrals} / 10 Ativos</span>
                        </div>
                        
                        <div className="h-2.5 bg-black/30 rounded-full overflow-hidden mb-2">
                            <div 
                                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {discountEarned && !discountUsed ? (
                            <div className="flex items-center space-x-2 text-emerald-300 text-xs font-bold animate-pulse mt-3">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>PARABÉNS! VOCÊ GANHOU 50% DE DESCONTO!</span>
                            </div>
                        ) : remaining > 0 ? (
                            <p className="text-[10px] text-white/60">
                                Convide mais {remaining} amigos que ATIVAREM o plano.
                            </p>
                        ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={copyToClipboard}
                            className="flex items-center justify-center space-x-2 py-3 px-4 bg-[var(--bg-card)]/10 hover:bg-[var(--bg-card)]/20 rounded-xl border border-white/10 transition-all active:scale-95"
                        >
                            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            <span className="text-sm font-bold">{copied ? 'Copiado' : 'Link'}</span>
                        </button>

                        <button 
                            onClick={shareWhatsApp}
                            className="flex items-center justify-center space-x-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
                        >
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-sm font-bold">WhatsApp</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReferralWidget;
