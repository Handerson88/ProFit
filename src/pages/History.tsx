import React from 'react';
import { Calendar, ChevronRight, Utensils } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { BottomNav } from '../components/BottomNav';
import { motion } from 'framer-motion';

const HistoryItem = ({ title, time, calories, color }: any) => (
  <div className="flex justify-between items-center py-5 bg-white active:scale-[0.98] transition-all last:border-none border-b border-gray-50/50">
    <div className="flex items-center space-x-5">
      <div className={`w-14 h-14 rounded-3xl ${color} flex items-center justify-center shadow-lg border-4 border-white`}>
        <Utensils className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="font-black text-text-primary text-base tracking-tight">{title}</p>
        <p className="text-xs text-text-secondary font-bold opacity-40">{time}</p>
      </div>
    </div>
    <div className="text-right flex items-center space-x-4">
      <span className="font-black text-text-primary text-base">+{calories} <span className="text-[10px] opacity-40 uppercase">kcal</span></span>
      <ChevronRight className="w-5 h-5 text-gray-200" />
    </div>
  </div>
);

export const History = () => {
  const days = [
    {
      date: 'Today, 15 Nov',
      items: [
        { title: 'Breakfast', time: '08:30 AM', calories: 456, color: 'bg-orange-400' },
        { title: 'Lunch', time: '01:15 PM', calories: 650, color: 'bg-blue-400' },
        { title: 'Snack', time: '04:00 PM', calories: 120, color: 'bg-green-400' },
      ]
    },
    {
      date: 'Yesterday, 14 Nov',
      items: [
        { title: 'Dinner', time: '08:00 PM', calories: 520, color: 'bg-purple-400' },
        { title: 'Lunch', time: '12:45 PM', calories: 710, color: 'bg-blue-400' },
      ]
    }
  ];

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-black">History</h1>
        <button className="p-4 bg-white shadow-soft rounded-[20px] flex items-center space-x-3 active:scale-95 transition-all border border-gray-50">
          <Calendar className="w-5 h-5 text-primary" />
          <span className="text-xs font-black text-text-primary uppercase tracking-widest">Date</span>
        </button>
      </div>

      <div className="space-y-12">
        {days.map((day, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
          >
            <h2 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-6 ml-2 opacity-30">{day.date}</h2>
            <div className="card-premium p-1 px-5 shadow-premium">
              {day.items.map((item, j) => (
                <HistoryItem key={j} {...item} />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <BottomNav />
    </AppLayout>
  );
};
