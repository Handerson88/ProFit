import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

const ActivateAccount: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    
    const [user, setUser] = useState<{ name: string, email: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setError('Token de ativação ausente.');
                setLoading(false);
                return;
            }

            try {
                const data = await api.auth.verifyInvite(token);
                setUser(data);
            } catch (err: any) {
                setError(err.message || 'Link de ativação inválido ou expirado.');
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setActivating(true);
        setError(null);

        try {
            const data = await api.auth.activateInvite({ token, password });
            
            // Auto login logic
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            setSuccess(true);
            
            // Redirect based on onboarding status
            setTimeout(() => {
                if (data.user.onboarding_completed) {
                    navigate('/dashboard');
                } else {
                    navigate('/quiz');
                }
            }, 2500);
        } catch (err: any) {
            setError(err.message || 'Erro ao ativar conta. Tente novamente.');
        } finally {
            setActivating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="animate-spin text-[#10B981] mx-auto" size={48} />
                    <p className="text-slate-500 font-medium animate-pulse">Verificando seu convite...</p>
                </div>
            </div>
        );
    }

    if (error && !user) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[var(--bg-card)] p-10 rounded-[32px] shadow-2xl max-w-md w-full text-center space-y-6 border border-slate-100"
                >
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <AlertCircle size={40} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight text-balance">Link de Ativação Inválido</h2>
                        <p className="text-slate-500 leading-relaxed font-medium">{error}</p>
                    </div>
                    <button 
                        onClick={() => navigate('/login')}
                        className="w-full py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
                    >
                        Voltar para Login
                    </button>
                    <p className="text-xs text-slate-400">Se você acredita que isso é um erro, entre em contato com o suporte.</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--bg-card)] rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden max-w-lg w-full border border-slate-100"
            >
                {/* Visual Header */}
                <div className="bg-gradient-to-br from-[#10B981] to-[#059669] p-12 text-center relative overflow-hidden">
                    <div className="absolute top-[-50%] right-[-20%] w-64 h-64 bg-[var(--bg-card)]/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-[-30%] left-[-10%] w-48 h-48 bg-emerald-900/10 rounded-full blur-2xl" />
                    
                    <div className="relative z-10 space-y-4">
                        <div className="w-20 h-20 bg-[var(--bg-card)]/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto border border-white/30 shadow-2xl transform hover:rotate-6 transition-transform">
                            <Lock className="text-white" size={38} />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-3xl font-black text-white tracking-tight">Ativar sua Conta</h1>
                            <p className="text-emerald-50/90 text-sm font-semibold italic">
                                👋 Olá, {user?.name.split(' ')[0]}! Você está a um passo da elite.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-12">
                    <AnimatePresence mode="wait">
                        {success ? (
                            <motion.div 
                                key="success"
                                initial={{ opacity: 0, zoom: 0.9 }}
                                animate={{ opacity: 1, zoom: 1 }}
                                className="text-center space-y-6"
                            >
                                <div className="w-24 h-24 bg-emerald-50 text-[#10B981] rounded-full flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50/50">
                                    <CheckCircle size={56} className="animate-in zoom-in-50 duration-500" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Sucesso Absoluto! 🎉</h2>
                                    <p className="text-slate-500 font-medium leading-relaxed">
                                        Sua senha foi definida e sua conta ProFit está ativa. <br/>
                                        Estamos preparando seu perfil agora mesmo...
                                    </p>
                                </div>
                                <div className="pt-6">
                                    <div className="inline-flex items-center gap-3 px-8 py-4 bg-slate-50 rounded-3xl border border-slate-100 shadow-sm animate-bounce">
                                        <Loader2 className="animate-spin text-[#10B981]" size={20} />
                                        <span className="text-sm font-bold text-slate-600">Entrando no Ecossistema...</span>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="form" className="space-y-8">
                                <div className="text-center space-y-1">
                                    <h3 className="text-lg font-bold text-slate-700">Defina sua Senha</h3>
                                    <p className="text-sm text-slate-400 font-medium">Use pelo menos 6 caracteres para sua segurança.</p>
                                </div>

                                <form onSubmit={handleActivate} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Sua Nova Senha</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#10B981] transition-colors">
                                                <Lock size={20} />
                                            </div>
                                            <input 
                                                type={showPassword ? "text" : "password"}
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full pl-12 pr-12 py-5 bg-slate-50 border-2 border-transparent rounded-[20px] focus:border-[#10B981]/30 focus:bg-[var(--bg-card)] focus:ring-4 focus:ring-[#10B981]/5 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                                placeholder="Sua senha secreta"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirme a Senha</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#10B981] transition-colors">
                                                <Lock size={20} />
                                            </div>
                                            <input 
                                                type={showPassword ? "text" : "password"}
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full pl-12 pr-4 py-5 bg-slate-50 border-2 border-transparent rounded-[20px] focus:border-[#10B981]/30 focus:bg-[var(--bg-card)] focus:ring-4 focus:ring-[#10B981]/5 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                                placeholder="Repita a senha"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <motion.div 
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="p-4 bg-rose-50 text-rose-500 text-xs font-bold rounded-2xl border border-rose-100 flex items-center gap-3 shadow-sm shadow-rose-100/50"
                                        >
                                            <div className="w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shrink-0">!</div>
                                            {error}
                                        </motion.div>
                                    )}

                                    <button 
                                        type="submit"
                                        disabled={activating}
                                        className="w-full py-6 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-black text-lg rounded-[24px] shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-3 hover:translate-y-[-4px] hover:shadow-emerald-500/50 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0"
                                    >
                                        {activating ? <Loader2 className="animate-spin" size={28} /> : (
                                            <>
                                                Ativar Minha Conta
                                                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                <div className="px-12 pb-12 text-center">
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                        Ecossistema ProFit AI &bull; Premium Nutrition
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default ActivateAccount;
