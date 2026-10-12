import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Dumbbell, X } from 'lucide-react';
import { api } from '../services/api';

interface TrainingScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (schedule: { days: string[]; time: string }) => void;
  initialDays?: string[];
  initialTime?: string;
}

const DAYS: { key: string; label: string }[] = [
  { key: 'monday', label: 'Seg' },
  { key: 'tuesday', label: 'Ter' },
  { key: 'wednesday', label: 'Qua' },
  { key: 'thursday', label: 'Qui' },
  { key: 'friday', label: 'Sex' },
  { key: 'saturday', label: 'Sáb' },
  { key: 'sunday', label: 'Dom' },
];

export const TrainingScheduleModal: React.FC<TrainingScheduleModalProps> = ({ isOpen, onClose, onSaved, initialDays, initialTime }) => {
  const [selectedDays, setSelectedDays] = useState<string[]>(initialDays || []);
  const [time, setTime] = useState(initialTime || '07:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedDays(initialDays || []);
      setTime(initialTime || '07:00');
      setError(null);
    }
  }, [isOpen, initialDays, initialTime]);

  const toggleDay = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSave = async () => {
    if (selectedDays.length === 0) {
      setError('Selecione pelo menos um dia de treino.');
      return;
    }
    if (!time) {
      setError('Escolha um horário.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.user.updateTrainingSchedule({ days: selectedDays, time });
      onSaved?.({ days: selectedDays, time });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao guardar horário. Tenta novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-[var(--bg-card)] rounded-[40px] p-8 shadow-2xl overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 bg-gradient-to-tr from-[#A8E063] to-[#56AB2F] rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20 rotate-6">
              <Dumbbell className="w-8 h-8 text-white -rotate-6" />
            </div>

            <h2 className="text-2xl font-black text-[var(--text-main)] mb-2 leading-tight">
              Quando vais treinar?
            </h2>
            <p className="text-[var(--text-muted)] font-medium mb-6 leading-relaxed text-sm">
              Define os dias e o horário dos teus treinos para recebermos lembretes certos.
            </p>

            <div className="mb-6">
              <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">Dias da semana</p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => toggleDay(key)}
                    className={`w-11 h-11 rounded-2xl text-xs font-black border-2 transition-all active:scale-95 ${
                      selectedDays.includes(key)
                        ? 'bg-gradient-to-r from-[#A8E063] to-[#56AB2F] border-transparent text-white shadow-md'
                        : 'bg-transparent border-[var(--border-main)] text-[var(--text-muted)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">Horário</p>
              <div className="flex items-center gap-3 p-3 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-main)]">
                <Clock size={18} className="text-[var(--text-muted)]" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm font-bold text-[var(--text-main)] [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs font-bold text-red-500 mb-4 text-center">{error}</p>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gray-900 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-60"
            >
              {saving ? 'A guardar...' : 'Guardar horário'}
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
