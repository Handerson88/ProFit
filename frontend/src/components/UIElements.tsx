import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const PremiumCard = ({ children, className, title, subtitle }: CardProps) => {
  return (
    <div className={cn("card-premium", className)}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h3 className="text-xl font-black text-text-primary tracking-tight">{title}</h3>}
          {subtitle && <p className="text-xs text-text-secondary font-bold opacity-60">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

export const ProgressBar = ({ value, max, label, colorClass = "bg-accent-gradient" }: { value: number, max: number, label?: string, colorClass?: string }) => {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  
  return (
    <div className="w-full">
      <div className="flex justify-between mb-3 items-end">
        {label && <span className="text-xs font-black text-text-secondary uppercase tracking-widest opacity-40">{label}</span>}
        <span className="text-sm font-black text-primary">{percentage}%</span>
      </div>
      <div className="w-full h-4 bg-gray-100/50 rounded-full overflow-hidden border border-white">
        <div 
          className={cn("h-full rounded-full transition-all duration-[1500ms] cubic-bezier(0.34, 1.56, 0.64, 1)", colorClass)}
          style={{ width: `${percentage}%` }}
        >
          <div className="w-full h-full bg-white/20 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};
