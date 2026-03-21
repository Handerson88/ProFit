import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validate early if missing token
  useEffect(() => {
    if (!token) {
      setError('Link de recuperação inválido ou inexistente.');
    }
  }, [token]);

  const handleSubmit = async () => {
    if (!token) return;
    
    if (password.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await api.auth.resetPassword({ token, newPassword: password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Token expirado ou erro no servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-wrapper bg-[#F6F7F9]">
      <div className="app-container flex flex-col items-center justify-center p-6 bg-transparent shadow-none border-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-sm bg-white rounded-[40px] p-10 shadow-[0_15px_40px_rgba(0,0,0,0.04)] border border-white mx-auto relative"
        >
          <div className="text-center mt-2 mb-10">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Nova Senha</h1>
            <p className="text-gray-400 font-medium text-sm">Defina uma nova senha para sua conta ProFit.</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }}
              className="mb-8 p-4 bg-red-50 rounded-2xl border border-red-100"
            >
              <p className="text-red-500 text-xs font-bold text-center leading-tight">{error}</p>
            </motion.div>
          )}

          {success ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Senha alterada!</h2>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                Sua senha foi redefinida com sucesso. Recomenda-se fazer o login agora.
              </p>
              
              <button 
                onClick={() => navigate('/login')}
                className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
              >
                Ir para o Login
              </button>
            </motion.div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#56AB2F] transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input 
                    type="password" 
                    placeholder="Nova senha (min. 6 caracteres)" 
                    className="w-full bg-[#F6F7F9] border-none rounded-2xl py-5 pl-14 pr-6 text-gray-900 font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-[#A8E063]/20 transition-all outline-none" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={!token}
                  />
                </div>

                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#56AB2F] transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input 
                    type="password" 
                    placeholder="Confirmar nova senha" 
                    className="w-full bg-[#F6F7F9] border-none rounded-2xl py-5 pl-14 pr-6 text-gray-900 font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-[#A8E063]/20 transition-all outline-none" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={!token}
                  />
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={isLoading || !password || !confirmPassword || !token}
                className="w-full bg-gradient-to-r from-[#A8E063] to-[#56AB2F] text-white font-black py-5 rounded-2xl mt-10 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Redefinir Senha</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              
              {!token && (
                 <button 
                  onClick={() => navigate('/login')}
                  className="w-full mt-4 text-center text-gray-400 hover:text-gray-600 font-bold text-sm"
                 >
                   Voltar
                 </button>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};
