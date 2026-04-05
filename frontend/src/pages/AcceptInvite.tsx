import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, ArrowRight, Loader2, User, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/api';

export const AcceptInvite: React.FC = () => {
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
        const verify = async () => {
            if (!token) {
                setError('Link de convite inválido ou inexistente.');
                setLoading(false);
                return;
            }
            try {
                const data = await api.auth.verifyInvite(token);
                setUser(data);
            } catch (err: any) {
                setError(err.message || 'Convite expirado ou inválido.');
            } finally {
                setLoading(false);
            }
        };

        verify();
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
            
            // Auto Login - Restore context for navigation later in life
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            setSuccess(true);
            setTimeout(() => {
                // To ensure global auth context sees the token change easily 
                // we can also force refresh or navigate to root
                window.location.href = '/home';
            }, 1000);
        } catch (err: any) {
            setError(err.message || 'Erro ao ativar conta.');
        } finally {
            setActivating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-4">
                <Loader2 className="animate-spin text-[#6366F1]" size={40} />
            </div>
        );
    }

    if (error && !user) {
        return (
            <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-4">
                <div className="bg-[var(--bg-card)] p-8 rounded-[24px] shadow-xl max-w-md w-full text-center space-y-4 border border-rose-100">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--text-main)]">Link Inválido</h2>
                    <p className="text-[var(--text-muted)] font-medium pb-4">{error}</p>
                    <button 
                        onClick={() => navigate('/login')}
                        className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-lg"
                    >
                        Voltar para Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--bg-card)] rounded-[32px] shadow-xl overflow-hidden max-w-md w-full"
            >
                <div className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] p-8 text-center space-y-2">
                    <h1 className="text-3xl font-black text-white">Bem-vindo!</h1>
                    <p className="text-white/90 font-medium text-sm">Olá, <span className="font-bold underline">{user?.name}</span>. Ative sua conta ProFit Pro.</p>
                </div>

                <div className="p-8">
                    {success ? (
                        <div className="text-center space-y-4 py-6">
                            <div className="w-20 h-20 bg-green-50 text-[#56AB2F] rounded-full flex items-center justify-center mx-auto mb-2">
                                <CheckCircle size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-[var(--text-main)]">Conta Ativada!</h2>
                            <p className="text-[var(--text-muted)] text-sm">Entrando no ProFit Pro...</p>
                            <Loader2 className="animate-spin text-[#6366F1] mx-auto mt-4" size={24} />
                        </div>
                    ) : (
                        <form onSubmit={handleActivate} className="space-y-4">
                            <div className="space-y-2">
                                <div className="relative opacity-60">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                                    <input 
                                        type="text"
                                        disabled
                                        value={user?.name || ''}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-100 border-none rounded-2xl text-[var(--text-main)] font-medium"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="relative opacity-60">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                                    <input 
                                        type="email"
                                        disabled
                                        value={user?.email || ''}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-100 border-none rounded-2xl text-[var(--text-main)] font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[#56AB2F] transition-colors" size={18} />
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-4 bg-[var(--bg-app)] border-none rounded-2xl focus:ring-2 focus:ring-[#A8E063]/20 transition-all font-medium text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                                        placeholder="Crie uma Senha Segura"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[#56AB2F] transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[#56AB2F] transition-colors" size={18} />
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-4 bg-[var(--bg-app)] border-none rounded-2xl focus:ring-2 focus:ring-[#A8E063]/20 transition-all font-medium text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                                        placeholder="Confirme a Senha"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-500 text-xs font-bold rounded-2xl border border-red-100 text-center leading-tight">
                                    {error}
                                </div>
                            )}

                            <button 
                                type="submit"
                                disabled={activating || !password || !confirmPassword}
                                className="w-full py-5 mt-4 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white font-black rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {activating ? <Loader2 className="animate-spin" size={20} /> : (
                                    <>
                                        Ativar e Entrar
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
