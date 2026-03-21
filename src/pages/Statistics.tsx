import React from 'react';
import { ArrowUpRight, Activity, MoreVertical } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { BottomNav } from '../components/BottomNav';
import { PremiumCard } from '../components/UIElements';
import { motion } from 'framer-motion';

const WeeklyChart = () => {
  const data = [
    { day: 'Sun', value: 60, target: 80 },
    { day: 'Mon', value: 45, target: 80 },
    { day: 'Tue', value: 75, target: 80 },
    { day: 'Wed', value: 100, target: 80 }, // Active today
    { day: 'Thu', value: 40, target: 80 },
    { day: 'Fri', value: 30, target: 80 },
    { day: 'Sat', value: 50, target: 80 },
  ];

  return (
    <div className="flex justify-between items-end h-48 mt-10 mb-6">
      {data.map((item, i) => (
        <div key={i} className="flex flex-col items-center space-y-4">
          <div className="flex flex-col items-center justify-end h-36 w-10 bg-gray-50/50 rounded-full overflow-hidden relative border border-white">
            <div className="absolute top-[20%] w-full h-[1px] border-t border-dashed border-gray-200 z-10"></div>
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: `${item.value}%` }}
              transition={{ duration: 1.5, delay: i * 0.1, ease: "circOut" }}
              className={`w-full rounded-full ${item.value >= 100 ? 'bg-primary shadow-[0_0_15px_rgba(86,171,47,0.4)]' : 'bg-primary-light/40'}`}
            />
          </div>
          <span className="text-[10px] font-black text-text-secondary uppercase tracking-tighter opacity-40">{item.day}</span>
        </div>
      ))}
    </div>
  );
};

export const Statistics = () => {
  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-black">Statistics</h1>
        <button className="p-4 bg-white shadow-soft rounded-[20px] active:scale-90 transition-all">
          <MoreVertical className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      <PremiumCard className="mb-6 overflow-hidden relative">
        <div className="flex justify-between items-center mb-2 px-2">
           <div className="flex items-center space-x-3">
             <div className="p-2 bg-primary/10 rounded-xl">
               <Activity className="w-5 h-5 text-primary" />
             </div>
             <span className="text-2xl font-black">1,250 <span className="text-xs font-bold text-text-secondary opacity-40">kcal</span></span>
           </div>
           <div className="text-right">
             <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-40">Today's Target</p>
             <p className="text-xs font-bold text-text-primary">1,920 kcal</p>
           </div>
        </div>

        <WeeklyChart />
        
        <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-text-primary text-white px-4 py-2 rounded-2xl text-[10px] font-black shadow-xl border-4 border-white">
          120%
        </div>
      </PremiumCard>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <PremiumCard className="flex flex-col justify-between p-7">
           <div className="flex justify-between mb-8">
             <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-40">BP</span>
             <ArrowUpRight className="w-4 h-4 text-primary" />
           </div>
           <div>
             <span className="text-3xl font-black">120</span>
             <span className="text-[10px] font-black text-text-secondary uppercase ml-1 opacity-40">sys</span>
           </div>
        </PremiumCard>
        <PremiumCard className="flex flex-col justify-between p-7 text-white" style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5253 100%)' }}>
           <div className="flex justify-between mb-8">
             <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-white">Heart</span>
             <Activity className="w-4 h-4 text-white animate-pulse" />
           </div>
           <div>
             <span className="text-3xl font-black">140</span>
             <span className="text-[10px] font-black uppercase ml-1 opacity-60 text-white">bpm</span>
           </div>
        </PremiumCard>
      </div>

      <BottomNav />
    </AppLayout>
  );
};
