import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const languages = [
  { 
    code: 'PT' as const, 
    label: 'Português', 
    flag: 'https://flagcdn.com/w40/pt.png',
    ariaLabel: 'Portugal'
  },
  { 
    code: 'EN' as const, 
    label: 'English (SA)', 
    flag: 'https://flagcdn.com/w40/za.png',
    ariaLabel: 'South Africa'
  }
];

export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100]" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-[6px] px-[10px] py-[6px] rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-50 active:scale-95 transition-all group"
      >
        <div className="w-[18px] h-[18px] rounded-full overflow-hidden flex-shrink-0 border border-gray-100">
          <img 
            src={currentLang.flag} 
            alt={currentLang.ariaLabel}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-[13px] font-bold text-[#111] tracking-wide">{currentLang.code}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#999] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full right-0 mt-2 w-[160px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-gray-50 overflow-hidden py-1.5"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${
                  language === lang.code ? 'bg-gray-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-gray-100">
                  <img src={lang.flag} alt={lang.ariaLabel} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className={`text-[13px] font-bold ${language === lang.code ? 'text-[#111]' : 'text-[#444]'}`}>
                    {lang.code}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium leading-none">
                    {lang.label}
                  </span>
                </div>
                {language === lang.code && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#56AB2F]" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
