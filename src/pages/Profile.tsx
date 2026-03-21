import React from 'react';
import { User, Bell, ChevronRight, Settings, Shield, HelpCircle, LogOut } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { BottomNav } from '../components/BottomNav';
import { PremiumCard } from '../components/UIElements';
import { useNavigate } from 'react-router-dom';

export const Profile = () => {
  const navigate = useNavigate();

  const MenuItem = ({ icon: Icon, title, subtitle, color = "text-text-secondary" }: any) => (
    <button className="w-full flex justify-between items-center py-6 bg-white active:scale-[0.98] transition-all last:border-none border-b border-gray-50/50">
      <div className="flex items-center space-x-5">
        <div className={`p-4 rounded-[20px] bg-gray-50/50 ${color} border border-white shadow-sm`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-left">
          <p className="font-black text-text-primary text-base tracking-tight">{title}</p>
          <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest opacity-40">{subtitle}</p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-200" />
    </button>
  );

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-black">Profile</h1>
        <button className="p-4 bg-white shadow-soft rounded-[20px] active:scale-90 transition-all border border-gray-50">
          <Settings className="w-6 h-6 text-text-primary" />
        </button>
      </div>

      <div className="flex flex-col items-center mb-12">
        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-[40px] bg-accent-gradient p-1.5 shadow-xl rotate-3">
            <div className="w-full h-full rounded-[34px] bg-white p-1 -rotate-3 transition-transform hover:rotate-0 duration-500">
              <img 
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=300&h=300&fit=crop" 
                className="w-full h-full object-cover rounded-[30px]" 
                alt="Profile" 
              />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-2xl border-4 border-white flex items-center justify-center shadow-lg">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-text-primary">Alex Jemison</h2>
        <p className="text-xs font-black text-text-secondary uppercase tracking-widest mt-1 opacity-40">Elite Fitness Pack</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <PremiumCard className="p-4 flex flex-col items-center justify-center space-y-1 bg-white border border-gray-100">
          <span className="text-[10px] font-black text-text-secondary uppercase opacity-40">Weight</span>
          <span className="text-base font-black">75 <span className="text-[10px] opacity-40">kg</span></span>
        </PremiumCard>
        <PremiumCard className="p-4 flex flex-col items-center justify-center space-y-1 bg-white border border-gray-100">
          <span className="text-[10px] font-black text-text-secondary uppercase opacity-40">Height</span>
          <span className="text-base font-black">182 <span className="text-[10px] opacity-40">cm</span></span>
        </PremiumCard>
        <PremiumCard className="p-4 flex flex-col items-center justify-center space-y-1 bg-white border border-gray-100">
          <span className="text-[10px] font-black text-text-secondary uppercase opacity-40">Age</span>
          <span className="text-base font-black">24 <span className="text-[10px] opacity-40">yo</span></span>
        </PremiumCard>
      </div>

      <div className="card-premium p-1 overflow-hidden px-5 mb-8 shadow-premium">
        <MenuItem icon={Bell} title="Notifications" subtitle="App & Meal alerts" color="text-primary" />
        <MenuItem icon={Shield} title="Privacy" subtitle="Security settings" color="text-blue-500" />
        <MenuItem icon={HelpCircle} title="Help Center" subtitle="Support & FAQ" color="text-orange-500" />
      </div>

      <button 
        onClick={() => navigate('/login')}
        className="w-full flex items-center justify-center space-x-3 py-6 bg-red-50 text-red-500 rounded-[28px] font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-sm"
      >
        <LogOut className="w-5 h-5" />
        <span>Log Out</span>
      </button>

      <BottomNav />
    </AppLayout>
  );
};
