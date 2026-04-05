import React from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Ativar notificações",
  message = "Deseja ativar notificações para receber lembretes de refeições, metas de calorias e dicas de saúde?",
  confirmLabel = "Ativar notificações",
  cancelLabel = "Agora não"
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-[340px] bg-[var(--bg-card)] rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
          >
            {/* Background Decoration */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#A8E063]/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#56AB2F]/10 rounded-full blur-2xl" />

            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 bg-[#F0F9EB] rounded-[24px] flex items-center justify-center mb-6 shadow-sm">
                <Bell className="w-8 h-8 text-[#56AB2F]" />
              </div>
              
              <h3 className="text-[22px] font-black text-[var(--text-main)] leading-tight mb-3">
                {title}
              </h3>
              
              <p className="text-[var(--text-muted)] font-medium text-[15px] leading-relaxed mb-8 px-2">
                {message}
              </p>

              <div className="w-full space-y-3">
                <button
                  onClick={onConfirm}
                  className="w-full py-4 bg-[#56AB2F] text-white rounded-[20px] font-black text-[15px] shadow-[0_8px_20px_rgba(86,171,47,0.3)] active:scale-[0.98] transition-all"
                >
                  {confirmLabel}
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full py-4 text-[var(--text-muted)] font-bold text-[14px] hover:text-[var(--text-muted)] active:scale-[0.98] transition-all"
                >
                  {cancelLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
