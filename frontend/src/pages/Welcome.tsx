import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';

const Welcome = () => {
  const navigate = useNavigate();
  const { langData } = useLanguage();

  return (
    <div className="flex flex-col justify-between h-screen bg-[var(--bg-app)] font-sans text-white overflow-hidden uppercase-none">
      <LanguageSelector />

      {/* Área Superior (60% - 70%) - Livre para Imagem Futura */}
      <div className="flex-[0.65] w-full relative overflow-hidden flex items-center justify-center p-8">
        {/* Espaço limpo para imagem futura */}
      </div>

      {/* Container Inferior (30% - 40%) */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-[var(--bg-app)] p-6 pb-10 rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/5 flex flex-col items-center text-center z-10"
      >
        <h1 className="text-[26px] sm:text-[28px] font-black leading-tight tracking-tight text-white mb-3 max-w-[280px] uppercase">
          {langData.welcome_title}
        </h1>
        
        <p className="text-[14px] text-gray-400 font-medium px-6 mb-8 leading-relaxed">
          {langData.welcome_subtitle}
        </p>

        <div className="w-full space-y-4">
          <button
            onClick={() => navigate('/quiz/step-1')}
            className="w-full h-[54px] bg-white text-black rounded-full font-black text-[17px] uppercase flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/20 group mt-4"
          >
            {langData.start_quiz}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-[14px] font-medium text-gray-400 pt-3">
            {langData.already_have_account}{' '}
            <Link to="/login" className="text-[#22C55E] font-bold hover:underline underline-offset-4">
              {langData.login_here}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Welcome;
