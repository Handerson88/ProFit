import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';

export const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const [searchParams] = useSearchParams();
  const referralCodeFromUrl = searchParams.get('ref') || '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setError('');
    
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      setIsLoading(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Por favor, insira um email válido.');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      setIsLoading(false);
      return;
    }

    try {
      const normalizedEmail = formData.email.trim().toLowerCase();
      await register(formData.name, normalizedEmail, formData.password, referralCodeFromUrl);
      navigate('/quiz');
    } catch (err: any) {
      console.error("Erro:", err);
      setError(err.message || 'Não foi possível registrar o usuário.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="main-wrapper bg-[var(--bg-app)] transition-colors duration-300">
      <div className="app-container p-8 flex flex-col justify-center bg-transparent shadow-none border-none">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-[40px] p-10 shadow-[0_15px_40px_rgba(0,0,0,0.04)] border border-white mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Criar Conta</h1>
          <p className="text-gray-400 font-medium">Informações de Acesso</p>
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
              <User className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              name="name"
              placeholder="Nome completo" 
              className="w-full bg-[#F6F7F9] border-none rounded-2xl py-5 pl-14 pr-6 text-gray-900 font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-[#A8E063]/20 transition-all outline-none" 
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#56AB2F] transition-colors">
              <Mail className="w-5 h-5" />
            </div>
            <input 
              type="email" 
              name="email"
              placeholder="Seu email" 
              className="w-full bg-[#F6F7F9] border-none rounded-2xl py-5 pl-14 pr-6 text-gray-900 font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-[#A8E063]/20 transition-all outline-none" 
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#56AB2F] transition-colors">
              <Lock className="w-5 h-5" />
            </div>
            <input 
              type="password" 
              name="password"
              placeholder="Criar senha" 
              className="w-full bg-[#F6F7F9] border-none rounded-2xl py-5 pl-14 pr-6 text-gray-900 font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-[#A8E063]/20 transition-all outline-none" 
              value={formData.password}
              onChange={handleChange}
            />
          </div>
        </div>

        <button 
          onClick={handleRegister}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-[#A8E063] to-[#56AB2F] text-white font-black py-5 rounded-2xl mt-10 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <span>Criar Conta</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

      </motion.div>

      <p className="text-center mt-10 text-gray-500 font-medium">
        Já tem uma conta? {' '}
        <button onClick={() => navigate('/login')} className="text-[#56AB2F] font-black hover:underline underline-offset-4 transition-all">Faça login</button>
      </p>
      </div>
    </div>
  );
};
