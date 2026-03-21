import React, { useEffect, useState } from 'react';
import { 
  User, Mail, Calendar, Ruler, Weight, Target, 
  ArrowLeft, Edit3, Save, CheckCircle2, X 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

export const Account = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    height: '',
    weight: '',
    goal: '',
    daily_calorie_target: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await api.user.getProfile();
      setProfile(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        age: data.age || '',
        height: data.height || '',
        weight: data.weight || '',
        goal: data.goal || 'manter',
        daily_calorie_target: data.daily_calorie_target || '2000'
      });
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await api.user.uploadProfilePhoto(file);
      setProfile({ ...profile, avatar_url: result.avatar_url });
    } catch (err) {
      console.error("Upload failed", err);
      setError("Falha no upload da foto.");
    }
  };

  const validate = () => {
    if (!formData.name.trim()) return "O nome não pode estar vazio.";
    if (!formData.email.includes('@')) return "Email inválido.";
    if (isNaN(Number(formData.age))) return "Idade deve ser um número.";
    if (isNaN(Number(formData.height))) return "Altura deve ser um número.";
    if (isNaN(Number(formData.weight))) return "Peso deve ser um número.";
    return null;
  };

  const handleSave = async () => {
    const errorMsg = validate();
    if (errorMsg) {
      setError(errorMsg);
      return;
    }

    setError('');
    setIsSaving(true);
    try {
      await api.user.updateAccount({
        ...formData,
        age: parseInt(formData.age),
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        daily_calorie_target: parseInt(formData.daily_calorie_target)
      });
      setShowSuccess(true);
      setIsEditing(false);
      await fetchProfile();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError("Erro ao salvar alterações. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const ModernInput = ({ label, icon: Icon, value, name, type = "text", disabled = !isEditing }: any) => (
    <div className={`group bg-white rounded-3xl p-5 border-2 transition-all duration-300 shadow-sm ${
      isEditing ? 'border-gray-100 focus-within:border-[#56AB2F]/30 focus-within:shadow-lg focus-within:shadow-[#56AB2F]/5' : 'border-transparent'
    }`}>
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
          isEditing ? 'bg-gray-50 text-[#56AB2F]' : 'bg-gray-50 text-gray-400'
        }`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1">{label}</p>
          <input 
            type={type}
            disabled={disabled}
            value={value}
            onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
            className="w-full bg-transparent text-lg font-bold text-gray-900 outline-none placeholder:text-gray-200 disabled:opacity-100"
            placeholder={`Digite seu ${label.toLowerCase()}...`}
          />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F7F9]">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-[#56AB2F] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="main-wrapper bg-[#F8FAFC]">
      <div className="app-container min-h-screen flex flex-col pb-24">
        {/* Header */}
        <div className="px-6 pt-12 pb-8 flex items-center justify-between sticky top-0 z-40 bg-[#F8FAFC]/80 backdrop-blur-md">
          <button 
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm active:scale-90 transition-all text-gray-900 border border-gray-100"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Conta</h1>
          <div className="w-12" />
        </div>

        <div className="px-6 flex-1">
          {/* Profile Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[40px] p-8 shadow-xl shadow-gray-200/50 border border-gray-50 mb-10 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#A8E063]/10 to-transparent rounded-bl-full" />
            
            <div className="flex flex-col items-center relative z-10">
              <div className="relative mb-6">
                <input 
                  type="file" 
                  id="account-photo-upload" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
                <label htmlFor="account-photo-upload" className="cursor-pointer group block">
                  <div className="w-32 h-32 rounded-[40px] overflow-hidden border-4 border-gray-50 p-1 shadow-inner bg-gray-50 relative">
                    {(profile?.avatar_url || profile?.profile_photo) ? (
                      <img 
                        src={(profile.avatar_url || profile.profile_photo).startsWith('data:') 
                          ? (profile.avatar_url || profile.profile_photo) 
                          : (profile.avatar_url || profile.profile_photo)} 
                        alt="Avatar" 
                        className="w-full h-full object-cover rounded-[35px]" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                        <User className="w-16 h-16" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[35px]">
                      <Edit3 className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </label>
                {!isEditing && (
                  <label 
                    htmlFor="account-photo-upload"
                    className="absolute -right-2 -bottom-2 w-10 h-10 bg-[#56AB2F] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#56AB2F]/40 active:scale-90 transition-all border-4 border-white cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </label>
                )}
              </div>

              <h2 className="text-2xl font-black text-gray-900 mb-1">{profile?.name || 'Seu Nome'}</h2>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-bold text-gray-400 bg-gray-50 px-4 py-1.5 rounded-full">{profile?.email || 'seuemail@exemplo.com'}</p>
                {profile?.plan_type === 'elite' ? (
                  <span className="bg-gradient-to-r from-indigo-600 to-violet-700 text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-200">
                    ELITE
                  </span>
                ) : (
                   <button 
                     onClick={() => navigate('/checkout')}
                     className="bg-indigo-50 text-indigo-600 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest active:scale-95 transition-all border border-indigo-100"
                   >
                     🚀 Upgrade Elite
                   </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Success/Error Alerts */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mb-6 bg-green-500 text-white rounded-3xl p-5 flex items-center justify-center space-x-3 shadow-lg shadow-green-500/30"
              >
                <CheckCircle2 className="w-6 h-6" />
                <span className="font-black text-sm uppercase tracking-wider">Perfil atualizado com sucesso!</span>
              </motion.div>
            )}
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mb-6 bg-rose-500 text-white rounded-3xl p-5 flex items-center justify-between shadow-lg shadow-rose-500/30"
              >
                <div className="flex items-center space-x-3">
                  <X className="w-6 h-6" />
                  <span className="font-bold text-sm">{error}</span>
                </div>
                <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Information Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2 ml-2">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Dados Pessoais</h3>
            </div>
            
            <div className="grid gap-4">
              <ModernInput label="Nome" icon={User} value={formData.name} name="name" />
              <ModernInput label="Email" icon={Mail} value={formData.email} name="email" type="email" />
              <div className="grid grid-cols-2 gap-4">
                <ModernInput label="Idade" icon={Calendar} value={formData.age} name="age" type="number" />
                <ModernInput label="Altura" icon={Ruler} value={formData.height} name="height" type="number" />
              </div>
              <ModernInput label="Peso" icon={Weight} value={formData.weight} name="weight" type="number" />
            </div>
          </div>

          {/* Footer Save Button */}
          <div className="mt-12">
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="editing-buttons"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="space-y-4"
                >
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-[#56AB2F] hover:bg-[#4a9428] text-white h-20 rounded-[35px] font-black text-lg uppercase tracking-widest shadow-xl shadow-[#56AB2F]/30 active:scale-[0.98] transition-all flex items-center justify-center"
                  >
                    {isSaving ? (
                      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-6 h-6 mr-3" />
                        Salvar Alterações
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: profile?.name || '',
                        email: profile?.email || '',
                        age: profile?.age || '',
                        height: profile?.height || '',
                        weight: profile?.weight || '',
                        goal: profile?.goal || '',
                        daily_calorie_target: profile?.daily_calorie_target || ''
                      });
                    }}
                    className="w-full h-16 text-gray-400 font-black text-sm uppercase tracking-widest"
                  >
                    Cancelar
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="edit-button"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-100 h-20 rounded-[35px] font-black text-lg uppercase tracking-widest shadow-sm active:scale-[0.98] transition-all flex items-center justify-center"
                  >
                    <Edit3 className="w-6 h-6 mr-3 text-[#56AB2F]" />
                    Editar Perfil
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
