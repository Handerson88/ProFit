import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

export const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="bg-gray-200/50 min-h-screen flex justify-center overflow-x-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
         <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
         <div className="absolute top-1/2 -left-24 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="app-container w-full max-w-md bg-white min-h-screen relative pb-32 shadow-2xl overflow-y-auto calendar-slider">
        <motion.main
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="p-8 pb-10"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};
