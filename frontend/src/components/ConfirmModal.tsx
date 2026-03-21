import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, Info, Loader2, CheckCircle2 } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  showCancel?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  showCancel = true
}: ConfirmModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isProcessing) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, isProcessing, onClose]);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isProcessing && onClose()}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-6"
          >
            <div className="flex flex-col items-center flex-1 text-center">
              {/* Icon Circle */}
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
                type === 'danger' ? 'bg-red-50 text-red-500' :
                type === 'warning' ? 'bg-orange-50 text-orange-500' :
                type === 'success' ? 'bg-green-50 text-[#56AB2F]' :
                'bg-blue-50 text-blue-500'
              }`}>
                {type === 'danger' && <Trash2 className="w-7 h-7" />}
                {type === 'warning' && <AlertTriangle className="w-7 h-7" />}
                {type === 'info' && <Info className="w-7 h-7" />}
                {type === 'success' && <CheckCircle2 className="w-7 h-7" />}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                {message}
              </p>

              {/* Actions */}
              <div className="flex flex-row space-x-3 w-full">
                {showCancel && (
                  <button
                    onClick={onClose}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:active:scale-100"
                  >
                    {cancelText}
                  </button>
                )}
                <button
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl font-semibold text-white active:scale-95 outline-none transition-all disabled:opacity-80 disabled:active:scale-100 ${
                    type === 'danger' ? 'bg-red-500 hover:bg-red-600 focus:ring-2 focus:ring-red-400 shadow-lg shadow-red-500/20' :
                    type === 'warning' ? 'bg-orange-500 hover:bg-orange-600 focus:ring-2 focus:ring-orange-400 shadow-lg shadow-orange-500/20' :
                    type === 'success' ? 'bg-[#56AB2F] hover:bg-[#4a9629] focus:ring-2 focus:ring-green-400 shadow-lg shadow-green-500/20' :
                    'bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 shadow-lg shadow-blue-500/20'
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
