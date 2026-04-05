import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Lock, User, Mail, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onUpdateSuccess?: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({ isOpen, onClose, user, onUpdateSuccess }) => {
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(user?.profile_photo || null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB.');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewPhoto(e.target?.result as string);
    reader.readAsDataURL(file);

    setIsPhotoLoading(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await fetch(`${API_URL}/user/photo-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao enviar foto');
      
      toast.success('Foto de perfil atualizada!');
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Falha ao atualizar foto');
      setPreviewPhoto(user?.profile_photo); // Revert
    } finally {
      setIsPhotoLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('O nome não pode ficar vazio.');
      return;
    }

    if (password && password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password && password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/user/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: name.trim(),
          ...(password && { password })
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao salvar perfil');

      toast.success('Perfil atualizado com sucesso!');
      if (onUpdateSuccess) onUpdateSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Falha ao atualizar informações');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-[24px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700/50"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-[#1E293B]/50">
            <h2 className="text-xl font-black text-slate-800 dark:text-white">Meu Perfil</h2>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className={`w-24 h-24 rounded-full border-4 border-white dark:border-[#1E293B] shadow-lg overflow-hidden bg-slate-100 dark:bg-slate-800 ${isPhotoLoading ? 'opacity-50' : 'opacity-100'} transition-opacity`}>
                  {previewPhoto ? (
                    <img src={previewPhoto} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-[#56AB2F]/20 to-[#A8E063]/20 text-[#56AB2F] font-black text-3xl">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                    </div>
                  )}
                </div>
                
                {/* Overlay / Edit Icon */}
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
                
                {/* Loading Spinner */}
                {isPhotoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <p className="text-xs font-bold text-slate-400 mt-3 uppercase tracking-widest">Alterar Foto</p>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload}
                accept="image/*" 
                className="hidden" 
              />
            </div>

            <div className="space-y-4">
              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Nome Completo</label>
                <div className="relative flex items-center">
                  <User size={18} className="absolute left-4 text-slate-400" />
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-[#56AB2F] outline-none transition-all"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              {/* Email Input (Readonly) */}
              <div className="space-y-1.5 opacity-70">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">E-mail de Acesso</label>
                <div className="relative flex items-center">
                  <Mail size={18} className="absolute left-4 text-slate-400" />
                  <input 
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Password Divider */}
              <div className="pt-4 pb-2">
                <div className="h-[1px] w-full bg-slate-100 dark:bg-slate-700/50" />
              </div>

              {/* New Password Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Nova Senha (Opcional)</label>
                <div className="relative flex items-center">
                  <Lock size={18} className="absolute left-4 text-slate-400" />
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-[#56AB2F] outline-none transition-all placeholder:font-normal"
                    placeholder="Deixe em branco para não alterar"
                  />
                </div>
              </div>

              {/* Confirm Password Input */}
              {password && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-1.5"
                >
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Confirmar Nova Senha</label>
                  <div className="relative flex items-center">
                    <Lock size={18} className="absolute left-4 text-slate-400" />
                    <input 
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-[#56AB2F] outline-none transition-all"
                      placeholder="Repita sua nova senha"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-5 py-3.5 bg-gradient-to-r from-[#56AB2F] to-[#A8E063] rounded-xl text-white text-sm font-black uppercase tracking-wider shadow-lg shadow-[#56AB2F]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={18} />
                    SALVAR
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
