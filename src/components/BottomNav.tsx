import { Home, BarChart3, History, User, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const BottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const NavItem = ({ to, icon: Icon, active }: { to: string, icon: any, active: boolean }) => (
    <Link to={to} className="flex flex-col items-center justify-center space-y-1">
      <Icon className={cn("w-6 h-6 transition-colors", active ? "text-primary" : "text-text-secondary")} />
      <div className={cn("w-1 h-1 rounded-full transition-all", active ? "bg-primary scale-100" : "bg-transparent scale-0")} />
    </Link>
  );

  return (
    <div className="glass-nav">
      <NavItem to="/" icon={Home} active={currentPath === '/'} />
      <NavItem to="/stats" icon={BarChart3} active={currentPath === '/stats'} />
      
      <Link to="/add-meal" className="relative -top-8">
        <div className="w-16 h-16 rounded-full bg-accent-gradient shadow-lg flex items-center justify-center group active:scale-90 transition-transform">
          <Plus className="text-white w-8 h-8" />
        </div>
      </Link>
      
      <NavItem to="/history" icon={History} active={currentPath === '/history'} />
      <NavItem to="/profile" icon={User} active={currentPath === '/profile'} />
    </div>
  );
};
