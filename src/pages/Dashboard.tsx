import React from 'react';
import { ChevronLeft, ChevronRight, Bell, MoreVertical, Droplets, Footprints } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { BottomNav } from '../components/BottomNav';
import { PremiumCard, ProgressBar } from '../components/UIElements';
import { motion } from 'framer-motion';

const CalendarSlider = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dates = [12, 13, 14, 15, 16, 17, 18];
  const activeIndex = 3; // Wednesday 15th

  return (
    <div className="bg-[#E9F5DB] rounded-[32px] p-6 mb-8 border border-white">
      <div className="flex justify-between items-center mb-4 px-2">
        <span className="font-bold text-text-primary">November 2025</span>
        <div className="flex space-x-2">
          <button className="p-2 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm"><ChevronLeft className="w-4 h-4 text-text-primary" /></button>
          <button className="p-2 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm"><ChevronRight className="w-4 h-4 text-text-primary" /></button>
        </div>
      </div>
      <div className="flex justify-between overflow-x-auto calendar-slider">
        {days.map((day, i) => (
          <div key={i} className={`flex flex-col items-center min-w-[50px] py-4 rounded-[20px] transition-all ${i === activeIndex ? 'bg-white shadow-soft scale-110' : ''}`}>
            <span className={`text-[10px] uppercase font-black mb-2 ${i === activeIndex ? 'text-primary' : 'text-text-secondary opacity-40'}`}>
              {day}
            </span>
            <span className={`text-base font-black ${i === activeIndex ? 'text-text-primary' : 'text-text-secondary'}`}>
              {dates[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const MealCard = ({ title, calories, target, ingredients }: any) => (
  <PremiumCard className="mb-6">
    <div className="flex justify-between items-center mb-6">
      <div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-sm font-medium text-text-secondary mt-1">
          <span className="text-text-primary font-bold">{calories}</span> / {target} kcal
        </p>
      </div>
      <button className="p-3 bg-gray-50/50 rounded-2xl"><MoreVertical className="w-5 h-5 text-gray-400" /></button>
    </div>
    
    <ProgressBar value={calories} max={target} />

    <div className="mt-8 flex justify-between">
      {ingredients.map((ing: any, i: number) => (
        <div key={i} className="flex flex-col items-center">
          <span className="text-[10px] font-black text-text-secondary uppercase mb-2 tracking-tighter">{ing.name}</span>
          <div className="h-1.5 w-12 rounded-full mb-2 bg-gray-100 relative overflow-hidden">
             <div className="absolute top-0 left-0 h-full rounded-full" style={{ width: '70%', backgroundColor: ing.color }}></div>
          </div>
          <span className="text-xs font-black text-text-primary">{ing.kcal} <span className="text-[10px] opacity-40">kcal</span></span>
        </div>
      ))}
    </div>
  </PremiumCard>
);

export const Dashboard = () => {
  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-soft">
            <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100&h=100&fit=crop" alt="User" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-bold uppercase tracking-wider">Good morning 👋</p>
            <h1 className="text-xl font-black text-text-primary">Alex Jemison</h1>
          </div>
        </div>
        <button className="relative p-4 bg-white shadow-soft rounded-[20px] active:scale-90 transition-all">
          <Bell className="w-6 h-6 text-text-primary" />
          <span className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        </button>
      </div>

      <CalendarSlider />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <MealCard 
          title="Breakfast"
          calories={456}
          target={512}
          ingredients={[
            { name: 'Avocado', kcal: 200, color: '#FF7043' },
            { name: 'Bread', kcal: 150, color: '#4FC3F7' },
            { name: 'Olive oil', kcal: 80, color: '#AED581' }
          ]}
        />

        <div className="grid grid-cols-2 gap-4 mb-8">
          <PremiumCard className="flex flex-col items-center justify-center py-8">
            <div className="w-full flex justify-between items-center mb-4 px-2">
              <span className="text-[10px] font-black text-text-secondary uppercase">Step to walk</span>
              <Footprints className="w-4 h-4 text-primary opacity-60" />
            </div>
            <div className="text-center">
              <span className="text-3xl font-black text-text-primary">5,234</span>
              <p className="text-[10px] font-bold text-text-secondary uppercase mt-1 tracking-widest opacity-40">step</p>
            </div>
          </PremiumCard>

          <PremiumCard className="flex flex-col items-center justify-center py-8">
            <div className="w-full flex justify-between items-center mb-4 px-2">
              <span className="text-[10px] font-black text-text-secondary uppercase">Drink water</span>
              <Droplets className="w-4 h-4 text-primary" />
            </div>
            <div className="text-center">
              <span className="text-3xl font-black text-text-primary">12</span>
              <p className="text-[10px] font-bold text-text-secondary uppercase mt-1 tracking-widest opacity-40">glass</p>
            </div>
          </PremiumCard>
        </div>
      </motion.div>

      <BottomNav />
    </AppLayout>
  );
};
