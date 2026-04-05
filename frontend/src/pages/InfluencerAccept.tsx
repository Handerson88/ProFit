import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Star, ArrowRight, Loader2, 
  CheckCircle2, AlertCircle, Lock, User
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const InfluencerAccept: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [inviteData, setInviteData] = useState<{
    email: string;
    exists: boolean;
    name: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!token) {
      setError('Link de convite inválido ou ausente.');
      setLoading(false);
      return;
    }
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const data = await api.auth.verifyInfluencerInvite(token!);
      setInviteData(data);
      setValid(true);
      if (data.name) setFormData(prev => ({ ...prev, name: data.name }));
    } catch (err: any) {
      setError(err.message || 'Este convite expirou ou já foi utilizado.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData?.exists) {
      if (formData.password !== formData.confirmPassword) {
        setError('As senhas não coincidem');
        return;
      }
      if (formData.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres');
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await api.auth.acceptInfluencerInvite({
        token,
        password: formData.password,
        name: formData.name
      });

      if (response.success) {
        // Redirecionar para o Quiz se não completou onboarding, senão Dashboard
        if (response.user.onboarding_completed) {
          navigate('/dashboard');
        } else {
          navigate('/quiz');
        }
        // Force reload para garantir que o contexto de Auth pegue os novos dados
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao ativar sua conta VIP.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#22C55E] animate-spin mx-auto" />
          <p className="text-gray-400 font-medium font-outfit">Validando seu acesso VIP...</p>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[var(--bg-card)] p-8 rounded-[32px] shadow-2xl max-w-md w-full text-center space-y-6 border border-white/5"
        >
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white leading-tight uppercase">Convite Inválido</h1>
            <p className="text-gray-400">{error || 'Ocorreu um erro ao validar seu acesso.'}</p>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-100 transition-all uppercase"
          >
            Voltar para o Início
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-4 font-outfit">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--bg-card)] rounded-[32px] shadow-2xl max-w-xl w-full overflow-hidden border border-white/5"
      >
        {/* Header Hero */}
        <div className="bg-[#22C55E]/10 p-10 text-center text-white relative border-b border-white/5">
          <div className="absolute top-4 right-4 bg-[#22C55E] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(34,197,94,0.5)]">
            VIP ACCESS
          </div>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="w-20 h-20 bg-[#22C55E] text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#22C55E]/20 border-2 border-white/20"
          >
            <Star size={40} fill="currentColor" />
          </motion.div>
          <h1 className="text-3xl font-black mb-2 uppercase tracking-tight">Bem-vindo ao ProFit!</h1>
          <p className="text-[#22C55E] font-black tracking-widest uppercase text-[12px]">Você foi selecionado para ter acesso total gratuito.</p>
        </div>

        <div className="p-10 space-y-8">
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="w-12 h-12 bg-[#22C55E]/20 rounded-xl flex items-center justify-center text-[#22C55E] shadow-sm shrink-0 border border-[#22C55E]/20">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#22C55E] uppercase tracking-wide">Status: Liberado</p>
              <p className="text-[15px] text-white font-medium uppercase">Acesso PRO Vitalício Ativado ✅</p>
            </div>
          </div>

          <form onSubmit={handleAccept} className="space-y-6">
            {!inviteData?.exists ? (
              <>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[14px] font-bold text-white ml-1 uppercase text-[12px] tracking-widest font-black">Como quer ser chamado?</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        required 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#22C55E] focus:border-[#22C55E] outline-none transition-all text-white placeholder:text-gray-600"
                        placeholder="Seu nome oficial"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[14px] font-bold text-white ml-1 uppercase text-[12px] tracking-widest font-black">Crie sua senha VIP</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        required 
                        type="password" 
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#22C55E] focus:border-[#22C55E] outline-none transition-all text-white placeholder:text-gray-600"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[14px] font-bold text-white ml-1 uppercase text-[12px] tracking-widest font-black">Confirme sua senha</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        required 
                        type="password" 
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#22C55E] focus:border-[#22C55E] outline-none transition-all text-white placeholder:text-gray-600"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 bg-[#22C55E]/10 text-[#22C55E] rounded-full flex items-center justify-center mx-auto border border-[#22C55E]/20">
                  <ShieldCheck size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-white font-black text-lg uppercase">Você já possui uma conta!</p>
                  <p className="text-gray-400 text-sm font-medium">Clique abaixo para migrar sua conta `{inviteData?.email}` para o status de Influenciador VIP agora.</p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-50 text-rose-600 rounded-xl flex items-center gap-3 text-[14px] font-medium animate-shake">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <button 
              disabled={submitting}
              type="submit"
              className="w-full py-5 bg-[#22C55E] hover:brightness-110 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-[#22C55E]/20 flex items-center justify-center gap-3 group disabled:opacity-70 uppercase tracking-widest"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>Ativando...</span>
                </>
              ) : (
                <>
                  <span>ATIVAR MEU ACESSO VIP AGORA</span>
                  <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[12px] text-slate-400 font-medium">
            Ao ativar seu acesso, você concorda com nossos Termos de Parceria VIP.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default InfluencerAccept;
