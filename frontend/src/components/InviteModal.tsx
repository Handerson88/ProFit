import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, User, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      await api.auth.createInvite(name, email);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setName('');
        setEmail('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar convite.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm shadow-none border-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-white rounded-[40px] shadow-[0_15px_40px_rgba(0,0,0,0.04)] overflow-hidden relative"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-[#F6F7F9] rounded-full text-gray-500 hover:bg-gray-200 transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="p-10">
              <div className="text-center mb-10 mt-2">
                <div className="w-16 h-16 bg-[#F0F9EB] text-[#56AB2F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={32} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Convidar Amigo</h2>
                <p className="text-gray-400 text-sm font-medium">
                  Envie um acesso exclusivo para treinar com você no ProFit.
                </p>
              </div>

              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#F0F9EB] p-6 rounded-3xl text-center border border-[#E6F4E2]"
                >
                  <CheckCircle2 className="w-12 h-12 text-[#56AB2F] mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-[#56AB2F] mb-1">Convite Enviado!</h3>
                  <p className="text-[#56AB2F] text-sm opacity-80">
                    Um email com o link de acesso foi encaminhado para {email}.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#56AB2F] transition-colors" size={20} />
                    <input
                      type="text"
                      placeholder="Nome completo do amigo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-[#F6F7F9] border-none rounded-2xl text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-[#A8E063]/20 transition-all outline-none"
                    />
                  </div>

                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#56AB2F] transition-colors" size={20} />
                    <input
                      type="email"
                      placeholder="Email do amigo"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-[#F6F7F9] border-none rounded-2xl text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-[#A8E063]/20 transition-all outline-none"
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 text-red-500 text-xs font-bold rounded-2xl text-center border border-red-100 leading-tight">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || !name || !email}
                    className="w-full py-5 mt-6 bg-gradient-to-r from-[#A8E063] to-[#56AB2F] text-white font-black rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        Enviar Convite
                        <Send size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
