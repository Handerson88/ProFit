import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const slides = [
  {
    title: "Track your calories easily",
    subtitle: "Stay healthy and achieve your body goals with ProFit.",
    color: "#A8E063",
    icon: "🍎"
  },
  {
    title: "Smart nutrition tracking",
    subtitle: "Log meals and monitor your daily calorie intake.",
    color: "#56AB2F",
    icon: "🥗"
  },
  {
    title: "Reach your fitness goals",
    subtitle: "Track progress and stay motivated every day.",
    color: "#2D5A27",
    icon: "🏆"
  }
];

export const Onboarding = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const next = () => {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="main-wrapper bg-[var(--bg-card)]">
      <div className="app-container h-screen flex flex-col p-8 overflow-hidden bg-[var(--bg-card)] shadow-none border-none">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <div className="text-8xl mb-12 animate-bounce">{slides[current].icon}</div>
            <h1 className="text-3xl font-bold text-text-primary mb-4 leading-tight">
              {slides[current].title}
            </h1>
            <p className="text-lg text-text-secondary">
              {slides[current].subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="py-12 space-y-6">
        <div className="flex justify-center space-x-2">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-primary' : 'w-2 bg-gray-200'}`}
            />
          ))}
        </div>

        <button 
          onClick={next}
          className="btn-primary w-full"
        >
          {current === slides.length - 1 ? 'Get Started' : 'Next'}
        </button>

        {current === 0 && (
          <button 
            onClick={() => navigate('/login')}
            className="w-full text-text-secondary font-medium"
          >
            Login
          </button>
        )}
      </div>
      </div>
    </div>
  );
};
