import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { trackingService } from '../services/trackingService';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'email' | 'password' | 'general' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    setErrorType(null);
    try {
      console.log("Iniciando tentativa de login...");
      const normalizedEmail = email.trim().toLowerCase();
      const user = await login(normalizedEmail, password);
      
      const userRole = user.role || 'user';
      if (email === 'handersonchemane@gmail.com' || userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      console.error("Erro no login:", err);
      const msg = err.message || 'Erro ao conectar com servidor.';
      setError(msg);
      
      if (err.status === 404 || msg.toLowerCase().includes('e-mail') || msg.toLowerCase().includes('conta não encontrada')) {
        setErrorType('email');
      } else if (err.status === 401 || msg.toLowerCase().includes('senha')) {
        setErrorType('password');
      } else {
        setErrorType('general');
      }
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="main-wrapper bg-[var(--bg-app)] transition-colors duration-300">
      <div className="app-container flex flex-col items-center justify-center p-6 bg-transparent shadow-none border-none">
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm bg-white rounded-[40px] p-10 shadow-[0_15px_40px_rgba(0,0,0,0.04)] border border-white"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-[#A8E063] to-[#56AB2F] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
             <span className="text-white text-3xl font-black -rotate-3">P</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Bem-vindo de volta</h1>
          <p className="text-gray-400 font-medium">Faça login na sua conta ProFit</p>
        </div>

        {(error && errorType === 'general') && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-100"
          >
            <p className="text-red-500 text-xs font-bold text-center leading-tight">{error}</p>
          </motion.div>
        )}

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#56AB2F] transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input 
                type="email" 
                placeholder="Seu email" 
                className={`w-full bg-[#F6F7F9] rounded-2xl py-5 pl-14 pr-6 text-gray-900 font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-[#A8E063]/20 transition-all outline-none border-[1.5px] ${errorType === 'email' ? 'border-red-300 bg-red-50/10' : 'border-transparent'}`} 
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorType === 'email') setErrorType(null);
                }}
              />
            </div>
            {errorType === 'email' && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="px-2 space-y-2">
                <p className="text-red-500 text-[10px] font-bold">{error}</p>
                <button 
                  onClick={() => navigate('/register')}
                  className="w-full py-2 bg-[#56AB2F]/10 text-[#56AB2F] rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#56AB2F] hover:text-white transition-all"
                >
                  Criar minha conta agora
                </button>
              </motion.div>
            )}
          </div>

          <div className="space-y-2">
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#56AB2F] transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input 
                type="password" 
                placeholder="Sua senha" 
                className={`w-full bg-[#F6F7F9] rounded-2xl py-5 pl-14 pr-6 text-gray-900 font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-[#A8E063]/20 transition-all outline-none border-[1.5px] ${errorType === 'password' ? 'border-red-300 bg-red-50/10' : 'border-transparent'}`} 
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorType === 'password') setErrorType(null);
                }}
              />
            </div>
            <div className="flex justify-between items-center px-1">
              {errorType === 'password' ? (
                <p className="text-red-500 text-[10px] font-bold">{error}</p>
              ) : <div />}
              <button 
                onClick={() => navigate('/forgot-password')} 
                className="text-[#56AB2F] text-xs font-bold hover:underline transition-all"
              >
                Esqueceu a senha?
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={handleLogin}
          disabled={isLoading || !email || !password}
          className="w-full bg-gradient-to-r from-[#A8E063] to-[#56AB2F] text-white font-black py-5 rounded-2xl mt-10 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <span>Entrar</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

      </motion.div>

      <p className="mt-10 text-gray-500 font-medium">
        Não tem uma conta? {' '}
        <button 
          onClick={() => navigate('/register')} 
          className="text-[#56AB2F] font-black hover:underline underline-offset-4 transition-all"
        >
          Criar conta
        </button>
      </p>
      </div>
    </div>
  );
};
