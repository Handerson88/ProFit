import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight, CheckCircle2, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!token) {
      setError('Link de recuperação inválido ou inexistente.');
    }
  }, [token]);

  // Auto-redirect after success
  useEffect(() => {
    if (!success) return;
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { navigate('/login'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [success, navigate]);

  const getStrength = (pwd: string) => {
    if (pwd.length === 0) return { level: 0, label: '', color: '' };
    if (pwd.length < 6) return { level: 1, label: 'Fraca', color: 'bg-red-400' };
    if (pwd.length < 8) return { level: 2, label: 'Média', color: 'bg-yellow-400' };
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return { level: 4, label: 'Forte', color: 'bg-[#56AB2F]' };
    return { level: 3, label: 'Boa', color: 'bg-blue-400' };
  };

  const strength = getStrength(password);

  const handleSubmit = async () => {
    if (!token) return;
    if (password.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem. Verifique e tente novamente.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.auth.resetPassword({ token, newPassword: password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Link expirado ou inválido. Solicite um novo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-wrapper bg-[#F6F7F9]">
      <div className="app-container flex flex-col items-center justify-center p-6 bg-transparent shadow-none border-none">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-sm bg-white rounded-[40px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-white/80 mx-auto relative"
        >
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-[#A8E063] to-[#56AB2F] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Senha atualizada! 🎉</h2>
                <p className="text-gray-500 text-sm mb-2 leading-relaxed">
                  Sua senha foi redefinida com sucesso. Agora você pode fazer login normalmente.
                </p>
                <p className="text-gray-400 text-xs mb-8">
                  Redirecionando em <strong className="text-[#56AB2F]">{countdown}s</strong>...
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gradient-to-r from-[#A8E063] to-[#56AB2F] text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                >
                  Ir para o Login agora
                </button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center mt-2 mb-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#A8E063] to-[#56AB2F] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md">
                    <ShieldCheck className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-3xl font-black text-gray-900 mb-2">Nova Senha</h1>
                  <p className="text-gray-400 font-medium text-sm leading-relaxed">
                    Defina uma nova senha segura para sua conta ProFit.
                  </p>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3"
                    >
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-500 text-xs font-bold leading-tight">{error}</p>
                        {!token && (
                          <button
                            onClick={() => navigate('/forgot-password')}
                            className="mt-2 text-[10px] font-black text-[#56AB2F] uppercase tracking-wider hover:underline"
                          >
                            Solicitar novo link
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  {/* Password field */}
                  <div>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#56AB2F] transition-colors">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Nova senha (mín. 6 caracteres)"
                        className="w-full bg-[#F6F7F9] border-[1.5px] border-transparent rounded-2xl py-5 pl-14 pr-14 text-gray-900 font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-[#A8E063]/20 focus:border-[#A8E063]/40 transition-all outline-none"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        disabled={!token}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Strength bar */}
                    {password.length > 0 && (
                      <div className="mt-2 px-1">
                        <div className="flex gap-1 h-1.5">
                          {[1, 2, 3, 4].map(i => (
                            <div
                              key={i}
                              className={`flex-1 rounded-full transition-all duration-300 ${i <= strength.level ? strength.color : 'bg-gray-200'}`}
                            />
                          ))}
                        </div>
                        <p className={`text-[10px] font-bold mt-1 ${strength.level <= 1 ? 'text-red-400' : strength.level === 2 ? 'text-yellow-500' : 'text-[#56AB2F]'}`}>
                          Força: {strength.label}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#56AB2F] transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirmar nova senha"
                      className={`w-full bg-[#F6F7F9] border-[1.5px] rounded-2xl py-5 pl-14 pr-14 text-gray-900 font-medium placeholder:text-gray-300 focus:ring-2 transition-all outline-none ${confirmPassword && confirmPassword !== password ? 'border-red-300 focus:ring-red-200/40' : 'border-transparent focus:ring-[#A8E063]/20 focus:border-[#A8E063]/40'}`}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      disabled={!token}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(v => !v)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-red-400 text-[10px] font-bold px-1">As senhas não coincidem</p>
                  )}
                  {confirmPassword && confirmPassword === password && password.length >= 6 && (
                    <p className="text-[#56AB2F] text-[10px] font-bold px-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Senhas coincidem ✓
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !password || !confirmPassword || !token}
                  className="w-full bg-gradient-to-r from-[#A8E063] to-[#56AB2F] text-white font-black py-5 rounded-2xl mt-8 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Confirmar nova senha</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {!token && (
                  <button
                    onClick={() => navigate('/forgot-password')}
                    className="w-full mt-4 text-center text-[#56AB2F] text-sm font-bold hover:text-green-700 transition-colors py-2"
                  >
                    Solicitar novo link de recuperação
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};
