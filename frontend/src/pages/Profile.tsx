import React, { useEffect, useState } from 'react';
import { User, Bell, ChevronRight, Settings, Shield, HelpCircle, LogOut, Award, Target, Scale, Ruler, Calendar, ArrowLeft, Edit2, Weight, Gift } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { neonAuth } from '../services/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationModal } from '../components/NotificationModal';
import { ToggleLeft, ToggleRight } from 'lucide-react';

export const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showEnableModal, setShowEnableModal] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.user.getProfile();
        setProfile(data);
      } catch (err) {
        console.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await api.user.uploadProfilePhoto(file);
      setProfile({ ...profile, profile_photo: result.profile_photo });
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  const handleLogout = async () => {
    try {
      await neonAuth.signOut();
    } catch(err) {
      console.error(err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleToggleNotifications = async () => {
    if (profile?.notifications_enabled) {
      setShowDisableModal(true);
    } else {
      setShowEnableModal(true);
    }
  };

  const confirmEnableNotifications = async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Only update backend if user granted permission
          await api.user.updateNotificationSettings(true);
          setProfile({ ...profile, notifications_enabled: true });
        } else {
          console.log("Permission denied by user");
        }
      } else {
        // Fallback or handle cases where notifications are not supported
        await api.user.updateNotificationSettings(true);
        setProfile({ ...profile, notifications_enabled: true });
      }
    } catch (err) {
      console.error("Failed to enable notifications", err);
    } finally {
      setShowEnableModal(false);
    }
  };

  const confirmDisableNotifications = async () => {
    try {
      await api.user.updateNotificationSettings(false);
      setProfile({ ...profile, notifications_enabled: false });
    } catch (err) {
      console.error(err);
    } finally {
      setShowDisableModal(false);
    }
  };

  const MenuItem = ({ icon: Icon, title, subtitle, color = "text-gray-400", onClick, rightElement }: any) => (
    <button 
      onClick={onClick}
      className="w-full flex justify-between items-center py-4 bg-white active:scale-[0.98] transition-all last:border-none border-b border-gray-50/50 group"
    >
      <div className="flex items-center space-x-4">
        <div className={`w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center ${color} group-hover:bg-gray-100 transition-colors`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-left">
          <p className="font-bold text-gray-900 text-[15px] leading-snug">{title}</p>
          {subtitle && <p className="text-[12px] text-gray-400 font-medium">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {rightElement}
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>
    </button>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F7F9]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="main-wrapper bg-[#F6F7F9]">
      <div className="app-container pb-32 bg-transparent shadow-none border-none">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 z-40 bg-[#F6F7F9]/90 backdrop-blur-sm">
        <div className="flex-1 flex justify-start">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.03)] active:scale-95 transition-all text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex justify-center">
          <h1 className="text-[20px] font-black text-gray-900 tracking-tight">Perfil</h1>
        </div>
        <div className="flex-1 flex justify-end">
          <button 
            onClick={() => navigate('/convites')}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.03)] active:scale-95 transition-all text-[#56AB2F] hover:text-[#4a9328]"
          >
            <Gift className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-6">
        <motion.div
           initial={{ opacity: 0, y: 15 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
        >
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="relative mb-4">
              <input 
                type="file" 
                id="profile-upload" 
                className="hidden" 
                accept="image/*"
                onChange={handlePhotoUpload}
              />
              <label htmlFor="profile-upload" className="block cursor-pointer group">
                <motion.div 
                  whileTap={{ scale: 0.95 }}
                  className="w-[110px] h-[110px] rounded-full border-4 border-[#56AB2F] p-0.5 shadow-[0_8px_20px_rgba(86,171,47,0.15)] relative bg-white"
                >
                  <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center text-4xl overflow-hidden relative">
                    {(profile?.avatar_url || profile?.profile_photo) ? (
                      <img 
                        src={`http://localhost:5000${profile.avatar_url || profile.profile_photo}`} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-gray-300" />
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Edit2 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute right-0 bottom-0 w-8 h-8 bg-white rounded-full border border-gray-100 flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.1)] text-gray-600">
                    <Edit2 className="w-3.5 h-3.5 ml-0.5" />
                  </div>
                </motion.div>
              </label>
            </div>
            
            <h2 className="text-[22px] font-black text-gray-900 leading-tight">
              {profile?.name || profile?.first_name ? `${profile.first_name || profile.name} ${profile.last_name || ''}`.trim() : 'Seu nome'}
            </h2>
            
               <div className="inline-flex items-center justify-center space-x-1.5 mt-2 px-4 py-1.5 bg-[#A8E063]/15 rounded-full relative">
                 <Target className="w-3.5 h-3.5 text-[#56AB2F]" />
                 <span className="text-[10px] font-bold text-[#56AB2F] uppercase tracking-wider">{profile?.goal || 'OBJETIVO GERAL'}</span>
                 {profile?.plan_type === 'elite' && (
                   <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-lg shadow-indigo-200 animate-pulse">
                     ELITE
                   </div>
                 )}
               </div>
          </div>

          {/* Body Metrics Cards Grid */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-white rounded-[20px] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col items-center hover:scale-[1.02] transition-transform">
              <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center mb-2">
                 <Weight className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1 text-center">Peso</span>
              <span className="text-[17px] font-black text-gray-900 leading-none">{profile?.weight ? `${profile.weight} kg` : '--'}</span>
            </div>
            <div className="bg-white rounded-[20px] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col items-center hover:scale-[1.02] transition-transform">
              <div className="w-7 h-7 rounded-xl bg-orange-50 flex items-center justify-center mb-2">
                 <Ruler className="w-4 h-4 text-orange-500" />
              </div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1 text-center">Altura</span>
              <span className="text-[17px] font-black text-gray-900 leading-none">{profile?.height ? `${profile.height} cm` : '--'}</span>
            </div>
            <div className="bg-white rounded-[20px] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col items-center hover:scale-[1.02] transition-transform">
              <div className="w-7 h-7 rounded-xl bg-purple-50 flex items-center justify-center mb-2">
                 <Calendar className="w-4 h-4 text-purple-500" />
              </div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1 text-center">Idade</span>
              <span className="text-[17px] font-black text-gray-900 leading-none">{profile?.age ? `${profile.age} anos` : '--'}</span>
            </div>
          </div>

          {/* Settings List */}
          <div className="bg-white rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.03)] px-5 py-2 mb-8 border border-gray-50/50">
            <MenuItem 
              icon={Bell} 
              title="Notificações" 
              subtitle="Alertas de app e lembretes" 
              color="text-green-500" 
              onClick={handleToggleNotifications}
              rightElement={
                <span className={`text-[12px] font-bold ${profile?.notifications_enabled ? 'text-[#56AB2F]' : 'text-gray-400'}`}>
                  {profile?.notifications_enabled ? 'Ativado' : 'Desativado'}
                </span>
              }
            />
            <MenuItem 
              icon={Award} 
              title="Conquistas" 
              subtitle="Seus emblemas e troféus" 
              color="text-[#56AB2F]" 
              onClick={() => navigate('/achievements')}
            />
            <MenuItem 
              icon={HelpCircle} 
              title="Dúvidas com IA" 
              subtitle="Assistente fitness especializado" 
              color="text-blue-500" 
              onClick={() => navigate('/ai-chat')}
            />
            <MenuItem 
              icon={Settings} 
              title="Preferências" 
              subtitle="Tema e linguagem" 
              color="text-purple-500" 
              onClick={() => navigate('/preferences')}
            />
            <MenuItem 
              icon={User} 
              title="Conta" 
              subtitle="Dados pessoais, Meta de Kcal" 
              color="text-orange-500" 
              onClick={() => navigate('/account')}
            />
          </div>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-3 py-5 bg-red-50 text-red-500 rounded-[28px] font-black text-sm uppercase tracking-widest active:scale-95 transition-all mb-4 hover:bg-red-100/50"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </motion.div>
      </div>

      <BottomNav />
      
      {/* Modals */}
      <NotificationModal 
        isOpen={showEnableModal}
        onClose={() => setShowEnableModal(false)}
        onConfirm={confirmEnableNotifications}
      />

      <NotificationModal 
        isOpen={showDisableModal}
        title="Desativar notificações?"
        message="Você deixará de receber lembretes importantes sobre suas metas e refeições."
        confirmLabel="Desativar"
        cancelLabel="Cancelar"
        onClose={() => setShowDisableModal(false)}
        onConfirm={confirmDisableNotifications}
      />
      </div>
    </div>
  );
};
