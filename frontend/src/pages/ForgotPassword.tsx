import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Por favor, insira seu e-mail.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Formato de e-mail inválido.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.auth.forgotPassword(trimmedEmail);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar solicitação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="main-wrapper bg-[var(--bg-app)]">
      <div className="app-container flex flex-col items-center justify-center p-6 bg-transparent shadow-none border-none">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-sm bg-[var(--bg-card)] rounded-[40px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-white/5 mx-auto relative shadow-2xl backdrop-blur-md"
        >
          <button
            onClick={() => navigate('/login')}
            className="absolute top-8 left-8 p-2 rounded-full hover:bg-white/5 transition-all text-white/50 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
          </button>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-[#22C55E] to-[#22C55E] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-black text-[var(--text-main)] mb-3">E-mail enviado!</h2>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-2">
                  Se <strong className="text-[var(--text-main)]">{email}</strong> tiver uma conta ProFit, você receberá um link de recuperação em breve.
                </p>
                <p className="text-[var(--text-muted)] text-xs font-medium mb-8">
                  Verifique também sua pasta de spam.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-gradient-to-r from-[#22C55E] to-[#22C55E] text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                  >
                    Voltar ao Login
                  </button>
                  <button
                    onClick={() => { setSuccess(false); setEmail(''); }}
                    className="w-full text-center text-[var(--text-muted)] text-sm font-semibold hover:text-[var(--text-muted)] transition-colors py-2"
                  >
                    Usar outro e-mail
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center mt-6 mb-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#22C55E] to-[#22C55E] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md">
                    <Mail className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-3xl font-black text-[var(--text-main)] mb-2">Recuperar Senha</h1>
                  <p className="text-[var(--text-muted)] font-medium text-sm leading-relaxed">
                    Digite seu e-mail de cadastro para receber um link de redefinição seguro.
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
                      <p className="text-red-500 text-xs font-bold leading-tight">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-6">
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[#56AB2F] transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      placeholder="Seu e-mail"
                      className={`w-full bg-[var(--bg-app)] border-[1.5px] rounded-2xl py-5 pl-14 pr-6 text-[var(--text-main)] font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-[#A8E063]/20 transition-all outline-none ${error ? 'border-red-300' : 'border-transparent focus:border-[#A8E063]/40'}`}
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      onKeyDown={handleKeyDown}
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !email}
                  className="w-full bg-gradient-to-r from-[#22C55E] to-[#22C55E] text-white font-black py-5 rounded-2xl mt-8 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar link de recuperação</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full mt-4 text-center text-[var(--text-muted)] text-sm font-semibold hover:text-[var(--text-muted)] transition-colors py-2"
                >
                  Lembrei minha senha — Voltar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};
