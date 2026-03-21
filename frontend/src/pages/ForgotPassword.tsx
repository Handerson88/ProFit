import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setError('Por favor, digite seu email.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await api.auth.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar solicitação.');
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
          <button 
            onClick={() => navigate('/login')}
            className="absolute top-8 left-8 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          
          <div className="text-center mt-6 mb-10">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Recuperar Senha</h1>
            <p className="text-gray-400 font-medium text-sm">Digite seu email de cadastro para receber um link de redefinição seguro.</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-100"
            >
              <p className="text-red-500 text-xs font-bold text-center leading-tight">{error}</p>
            </motion.div>
          )}

          {success ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-6 bg-green-50 rounded-2xl border border-green-100 text-center"
            >
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-6 h-6" />
              </div>
              <p className="text-[#56AB2F] text-sm font-bold leading-relaxed mb-4">
                Se este email estiver cadastrado, um link de recuperação foi enviado para sua caixa de entrada.
              </p>
              <p className="text-gray-400 text-xs font-medium">Verifique também sua pasta de spam.</p>
            </motion.div>
          ) : (
            <>
              <div className="space-y-6">
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#56AB2F] transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input 
                    type="email" 
                    placeholder="Seu email" 
                    className="w-full bg-[#F6F7F9] border-none rounded-2xl py-5 pl-14 pr-6 text-gray-900 font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-[#A8E063]/20 transition-all outline-none" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={isLoading || !email}
                className="w-full bg-gradient-to-r from-[#A8E063] to-[#56AB2F] text-white font-black py-5 rounded-2xl mt-10 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Enviar link de recuperação</span>
                )}
              </button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};
