import { Home, Dumbbell, Scan, History, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const BottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const NavItem = ({ to, icon: Icon, active, disabled = false }: { to: string, icon: any, active?: boolean, disabled?: boolean }) => {
    return (
      <Link 
        to={disabled ? '#' : to} 
        className={cn("flex flex-col items-center justify-center relative w-12 h-12 transition-all active:scale-95", disabled && 'opacity-30 pointer-events-none')}
      >
        <Icon className={cn("w-[26px] h-[26px] transition-colors duration-300", active ? "text-primary fill-primary/10 stroke-[2.5]" : "text-gray-400 stroke-2 hover:text-gray-600")} />
        <div className={cn("absolute -bottom-2 w-1.5 h-1.5 rounded-full transition-all duration-300", active ? "bg-primary scale-100" : "bg-transparent scale-0")} />
      </Link>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full flex justify-center pointer-events-none z-50">
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl relative pb-6 px-6 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-xl rounded-[32px] shadow-[0_20px_50px_-5px_rgb(0,0,0,0.15)] border border-gray-100/50 px-8 py-4 flex justify-between items-center relative z-10">
          
          <div className="flex space-x-6">
            <NavItem to="/home" icon={Home} active={currentPath === '/home'} />
            <NavItem to="/workout" icon={Dumbbell} active={currentPath === '/workout'} />
          </div>

          <div className="absolute left-1/2 -top-6 -translate-x-1/2">
            <Link to="/scanner" className="flex items-center justify-center w-[68px] h-[68px] bg-gradient-to-tr from-[#56AB2F] to-[#A8E063] rounded-full shadow-[0_15px_30px_-5px_rgba(86,171,47,0.5)] active:scale-95 transition-all text-white border-4 border-[#F6F7F9]">
              <Scan className="w-7 h-7 stroke-[2.5]" />
            </Link>
          </div>

          <div className="flex space-x-6">
            <NavItem to="/history" icon={History} active={currentPath === '/history'} />
            <NavItem to="/profile" icon={User} active={currentPath === '/profile'} />
          </div>
          
        </div>
      </div>
    </div>
  );
};
