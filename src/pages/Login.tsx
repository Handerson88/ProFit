import React from 'react';
import { motion } from 'framer-motion';
import { Apple, Chrome as Google } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-8 flex flex-col justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
          <p className="text-text-secondary">Please sign in to continue.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2 ml-1">Email</label>
            <input type="email" placeholder="hello@example.com" className="input-premium" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2 ml-1">Password</label>
            <input type="password" placeholder="••••••••" className="input-premium" />
          </div>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="btn-primary w-full mt-8"
        >
          Login
        </button>

        <div className="flex items-center my-8">
          <div className="flex-1 h-px bg-gray-100"></div>
          <span className="px-4 text-sm text-gray-400">or continue with</span>
          <div className="flex-1 h-px bg-gray-100"></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 rounded-[20px] bg-white border border-gray-100 shadow-sm active:scale-95 transition-all">
            <Google className="w-5 h-5" />
            <span className="font-semibold text-sm">Google</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 rounded-[20px] bg-white border border-gray-100 shadow-sm active:scale-95 transition-all">
            <Apple className="w-5 h-5" />
            <span className="font-semibold text-sm">Apple</span>
          </button>
        </div>
      </motion.div>

      <p className="text-center mt-8 text-text-secondary">
        Don't have an account? {' '}
        <button onClick={() => navigate('/register')} className="text-primary font-bold">Create account</button>
      </p>
    </div>
  );
};
