import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/api';

const InviteActivation: React.FC = () => {
    const { token } = useParams<{ token: string }>();
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
        const verifyInvite = async () => {
            try {
                const data = await api.auth.verifyInvite(token!);
                setUser(data);
            } catch (err) {
                setError('Erro ao conectar com o servidor.');
            } finally {
                setLoading(false);
            }
        };

        verifyInvite();
    }, [token]);

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setActivating(true);
        setError(null);

        try {
            const data = await api.auth.activateInvite({ token, password });
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setSuccess(true);
            // Wait 2 seconds then redirect to quiz
            setTimeout(() => {
                navigate('/quiz');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Erro ao conectar com o servidor.');
        } finally {
            setActivating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-4">
                <Loader2 className="animate-spin text-[#38A169]" size={40} />
            </div>
        );
    }

    if (error && !user) {
        return (
            <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-[24px] shadow-xl max-w-md w-full text-center space-y-4">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                        <X size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-[#1A202C]">Ops! Algo deu errado</h2>
                    <p className="text-[#718096]">{error}</p>
                    <button 
                        onClick={() => navigate('/login')}
                        className="w-full py-4 bg-[#38A169] text-white font-bold rounded-xl"
                    >
                        Ir para Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[32px] shadow-2xl overflow-hidden max-w-md w-full"
            >
                {/* Header Section */}
                <div className="bg-[#38A169] p-8 text-center space-y-2">
                    <h1 className="text-3xl font-extrabold text-white">Bem-vindo ao ProFit!</h1>
                    <p className="text-emerald-50 text-sm">Olá, <span className="font-bold underline">{user?.name}</span>! Finalize seu cadastro abaixo.</p>
                </div>

                <div className="p-8 space-y-6">
                    {success ? (
                        <div className="text-center space-y-4 py-8 animate-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle size={48} />
                            </div>
                            <h2 className="text-2xl font-bold text-[#1A202C]">Conta Ativada!</h2>
                            <p className="text-[#718096]">Sua conta foi ativada com sucesso. Vamos começar pelo quiz inicial.</p>
                            <Loader2 className="animate-spin text-emerald-500 mx-auto" size={24} />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-1 text-center">
                                <p className="text-sm text-[#718096]">Defina uma senha segura para acessar sua conta.</p>
                            </div>

                            <form onSubmit={handleActivate} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[#718096] uppercase pl-1">Senha</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0AEC0]" size={18} />
                                        <input 
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-12 pr-12 py-4 bg-[#F7F9FC] border-none rounded-2xl focus:ring-2 focus:ring-[#38A169]/20 transition-all font-medium"
                                            placeholder="Nova senha"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0AEC0] hover:text-[#38A169] transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[#718096] uppercase pl-1">Confirmar Senha</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0AEC0]" size={18} />
                                        <input 
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-[#F7F9FC] border-none rounded-2xl focus:ring-2 focus:ring-[#38A169]/20 transition-all font-medium"
                                            placeholder="Repita a senha"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-rose-50 text-rose-500 text-xs font-bold rounded-xl border border-rose-100 italic">
                                        * {error}
                                    </div>
                                )}

                                <button 
                                    type="submit"
                                    disabled={activating}
                                    className="w-full py-4 bg-gradient-to-r from-[#38A169] to-[#2F855A] text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 hover:translate-y-[-2px] active:translate-y-0 transition-all disabled:opacity-50"
                                >
                                    {activating ? <Loader2 className="animate-spin" size={20} /> : (
                                        <>
                                            Ativar Agora
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const X: React.FC<{ size?: number }> = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

export default InviteActivation;
