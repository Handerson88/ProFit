import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, selectedDate, onSelectDate }) => {
  const [currentViewDate, setCurrentViewDate] = useState(new Date(selectedDate));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Sync view date when modal opens relative to the selected date
  useEffect(() => {
    if (isOpen) {
      setCurrentViewDate(new Date(selectedDate));
    }
  }, [isOpen, selectedDate]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1);
    if (nextMonth.getFullYear() < today.getFullYear() || (nextMonth.getFullYear() === today.getFullYear() && nextMonth.getMonth() <= today.getMonth())) {
      setCurrentViewDate(nextMonth);
    }
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), day);
    clickedDate.setHours(0,0,0,0);
    
    if (clickedDate <= today) {
      onSelectDate(clickedDate);
    }
  };

  // Generate calendar grid
  const daysInMonth = getDaysInMonth(currentViewDate.getFullYear(), currentViewDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentViewDate.getFullYear(), currentViewDate.getMonth());
  
  const blanks = Array.from({ length: firstDay }, (_, i) => <div key={`blank-${i}`} className="w-10 h-10"></div>);
  
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const thisDate = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), day);
    thisDate.setHours(0,0,0,0);
    
    const isFuture = thisDate > today;
    const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === currentViewDate.getMonth() && selectedDate.getFullYear() === currentViewDate.getFullYear();
    const isToday = today.getDate() === day && today.getMonth() === currentViewDate.getMonth() && today.getFullYear() === currentViewDate.getFullYear();

    return (
      <button
        key={day}
        disabled={isFuture}
        onClick={() => handleDateClick(day)}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all relative
          ${isFuture ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 active:scale-95 cursor-pointer'}
          ${isSelected && !isFuture ? 'bg-gradient-to-r from-[#A8E063] to-[#56AB2F] text-white shadow-md' : ''}
          ${!isSelected && !isFuture ? 'hover:bg-gray-100' : ''}
        `}
      >
        <span className="relative z-10">{day}</span>
        {isToday && !isSelected && (
           <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#56AB2F] rounded-full"></div>
        )}
      </button>
    );
  });

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const isNextDisabled = currentViewDate.getFullYear() === today.getFullYear() && currentViewDate.getMonth() === today.getMonth();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-50 overflow-hidden shadow-2xl pb-safe"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Selecionar Data</h2>
                <button onClick={onClose} className="p-2 bg-gray-50 rounded-full active:scale-95 transition-all text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-[#F6F7F9] rounded-[24px] p-5">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-bold text-lg text-gray-900 capitalize">
                    {monthNames[currentViewDate.getMonth()]} {currentViewDate.getFullYear()}
                  </span>
                  <div className="flex space-x-2">
                    <button 
                      onClick={handlePrevMonth}
                      className="w-8 h-8 flex justify-center items-center bg-white rounded-full shadow-sm active:scale-95 transition-all text-gray-700"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={handleNextMonth}
                      disabled={isNextDisabled}
                      className={`w-8 h-8 flex justify-center items-center rounded-full transition-all ${isNextDisabled ? 'bg-white/50 border border-gray-100 cursor-not-allowed' : 'bg-white shadow-sm active:scale-95'} text-gray-700`}
                    >
                      <ChevronRight className={`w-4 h-4 ${isNextDisabled ? 'text-gray-300' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-y-4 justify-items-center mb-2">
                  {dayLabels.map((lbl, i) => (
                    <div translate="no" key={i} className="text-[12px] font-bold text-gray-400">
                      {lbl}
                    </div>
                  ))}
                  {blanks}
                  {days}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
