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
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      console.log("Iniciando tentativa de login...");
      const user = await login(email, password);
      
      const userRole = user.role || 'user';
      if (email === 'handersonchemane@gmail.com' || userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      console.error("Erro:", err);
      setError(err.message || 'Credenciais inválidas ou erro no servidor.');
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
        className="w-full max-w-sm bg-white rounded-[40px] p-10 shadow-[0_15px_40px_rgba(0,0,0,0.04)] border border-white"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-[#A8E063] to-[#56AB2F] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
             <span className="text-white text-3xl font-black -rotate-3">P</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Bem-vindo de volta</h1>
          <p className="text-gray-400 font-medium">Faça login na sua conta ProFit</p>
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

        <div className="space-y-6">
          <div className="relative">
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

          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#56AB2F] transition-colors">
              <Lock className="w-5 h-5" />
            </div>
            <input 
              type="password" 
              placeholder="Sua senha" 
              className="w-full bg-[#F6F7F9] border-none rounded-2xl py-5 pl-14 pr-6 text-gray-900 font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-[#A8E063]/20 transition-all outline-none" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex justify-end mt-2">
            <button onClick={() => navigate('/forgot-password')} className="text-[#56AB2F] text-sm font-bold hover:underline transition-all">Esqueceu a senha?</button>
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
