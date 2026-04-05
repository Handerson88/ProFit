import React from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0F172A] p-6 text-center">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-rose-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 bg-rose-500/10 rounded-[28px] flex items-center justify-center text-rose-500 mb-8 border border-rose-500/20 shadow-xl shadow-rose-500/10"
      >
        <AlertCircle size={40} />
      </motion.div>
      
      <h1 className="text-2xl font-black text-white mb-3 tracking-tight">Ops! Algo deu errado</h1>
      <p className="text-gray-400 font-medium max-w-[280px] mb-10 leading-relaxed">
        Tivemos um problema inesperado ao preparar sua experiência. Mas não se preocupe!
      </p>
      
      {process.env.NODE_ENV === 'development' && (
        <pre className="bg-black/40 p-4 rounded-2xl text-[10px] text-rose-400 text-left mb-10 max-w-sm overflow-auto border border-white/5 font-mono">
            {error.message}
            {error.stack && `\n\nStack Trace:\n${error.stack.slice(0, 200)}...`}
        </pre>
      )}

      <div className="flex flex-col w-full max-w-[280px] gap-4">
        <button 
          onClick={() => {
            localStorage.removeItem('quizData');
            sessionStorage.removeItem('quizData');
            resetErrorBoundary();
            window.location.reload();
          }}
          className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 active:scale-95 transition-all"
        >
          <RotateCcw size={18} />
          <span>Tentar Novamente</span>
        </button>
        
        <button 
          onClick={() => window.location.href = '/'}
          className="w-full py-4 bg-white/5 text-white font-black rounded-2xl border border-white/10 flex items-center justify-center space-x-2 active:scale-95 transition-all"
        >
          <Home size={18} />
          <span>Ir para Início</span>
        </button>
      </div>
      
      <p className="mt-12 text-[10px] font-black text-gray-600 uppercase tracking-widest">
        ProFit © {new Date().getFullYear()}
      </p>
    </div>
  );
};
