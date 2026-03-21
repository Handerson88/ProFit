import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const Register = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-8 bg-background flex flex-col justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-premium h-full"
      >
        <div className="mb-10">
          <h1 className="text-3xl font-black mb-3 text-text-primary tracking-tight">Create Account</h1>
          <p className="text-text-secondary font-bold opacity-60">Start your fitness journey today.</p>
        </div>

        <div className="space-y-6 max-h-[55vh] overflow-y-auto pb-4 pr-3 calendar-slider">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-text-secondary mb-2 ml-1 uppercase tracking-widest opacity-60">Name</label>
              <input type="text" placeholder="John" className="input-premium" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-secondary mb-2 ml-1 uppercase tracking-widest opacity-60">Age</label>
              <input type="number" placeholder="25" className="input-premium" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-text-secondary mb-2 ml-1 uppercase tracking-widest opacity-60">Email Address</label>
            <input type="email" placeholder="john@example.com" className="input-premium" />
          </div>

          <div>
            <label className="block text-[10px] font-black text-text-secondary mb-2 ml-1 uppercase tracking-widest opacity-60">Password</label>
            <input type="password" placeholder="••••••••" className="input-premium" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-text-secondary mb-2 ml-1 uppercase tracking-widest opacity-60">Weight (kg)</label>
              <input type="number" placeholder="70" className="input-premium" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-secondary mb-2 ml-1 uppercase tracking-widest opacity-60">Height (cm)</label>
              <input type="number" placeholder="175" className="input-premium" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-text-secondary mb-2 ml-1 uppercase tracking-widest opacity-60">Your Goal</label>
            <div className="relative">
              <select className="input-premium appearance-none bg-white">
                <option>Lose weight</option>
                <option>Maintain weight</option>
                <option>Gain muscle</option>
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                <ChevronRight className="w-5 h-5 rotate-90" />
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="btn-primary w-full mt-10"
        >
          Get Started
        </button>
      </motion.div>

      <p className="text-center mt-10 text-text-secondary font-bold text-sm">
        Already have an account? {' '}
        <button onClick={() => navigate('/login')} className="text-primary font-black hover:underline underline-offset-4 transition-all">Log In</button>
      </p>
    </div>
  );
};

const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
)
