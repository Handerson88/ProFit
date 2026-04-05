import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  User, 
  Phone, 
  Lock,
  ChevronLeft,
  Smartphone,
  Ticket,
  Mail,
  Gamepad2,
  LockKeyhole,
  Tag
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Checkout = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'processing' | 'waiting_pin' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  
  // Form State
  const [selectedMethod, setSelectedMethod] = useState<'mpesa' | 'emola' | null>('mpesa');
  const [email, setEmail] = useState(searchParams.get('email') || user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Coupon State
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setValidatingCoupon(true);
    setCouponError(null);
    try {
        const result = await api.coupons.validate(couponCode);
        setAppliedCoupon(result);
        setCouponError(null);
    } catch (err: any) {
        setCouponError(err.message || 'Cupom inválido');
        setAppliedCoupon(null);
    } finally {
        setValidatingCoupon(false);
    }
  };

  const calculateTotal = () => {
    const plan = searchParams.get('plan');
    const base = plan === 'anual' ? 2490 : 299;
    if (!appliedCoupon) return base;
    if (appliedCoupon.discount_type === 'percent') {
        return Math.max(0, base * (1 - appliedCoupon.discount_value / 100));
    }
    return Math.max(0, base - appliedCoupon.discount_value);
  };

  const handlePayment = async () => {
    if (!email.trim()) {
        setError('Por favor, insira o e-mail da conta.');
        return;
    }
    if (!phoneNumber.trim()) {
        setError('Por favor, insira o número de telefone.');
        return;
    }
    if (!selectedMethod) {
        setError('Selecione um método de pagamento.');
        return;
    }

    if (selectedMethod === 'mpesa' && !phoneNumber.startsWith('84') && !phoneNumber.startsWith('85')) {
        setError('Número M-Pesa inválido. Deve começar com 84 ou 85.');
        return;
    }
    if (selectedMethod === 'emola' && !phoneNumber.startsWith('86') && !phoneNumber.startsWith('87')) {
        setError('Número e-Mola inválido. Deve começar com 86 ou 87.');
        return;
    }

    setStatus('processing');
    setError(null);
    
    try {
      if (user?.id) {
         api.user.updateFunnelStep('PAYMENT_PENDING').catch(() => {});
      }

      const response = await api.payments.create({
        amount: calculateTotal(),
        method: selectedMethod,
        phone: phoneNumber,
        name: searchParams.get('name') || '',
        couponCode: appliedCoupon?.code,
        email: email,
        plan: searchParams.get('plan') || 'mensal'
      });
      
      if (response.success && response.transactionId) {
        setTransactionId(response.transactionId);
        setStatus('waiting_pin');
        startPolling(response.transactionId);
      } else {
        throw new Error(response.message || 'Erro ao iniciar pagamento.');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Falha ao processar pagamento. Tente novamente.');
      setStatus('idle');
    }
  };

  const startPolling = (txId: string) => {
    let attempts = 0;
    const maxAttempts = 20; 
    
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await api.payments.getStatus(txId);
        if (res.status === 'SUCCESS' || res.status === 'COMPLETED' || res.status === 'PAID') {
          clearInterval(interval);
          setStatus('success');
          
          const plan = searchParams.get('plan') || 'mensal';
          const name = searchParams.get('name') || '';
          
          setTimeout(() => {
            navigate(`/register-password?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&plan=${plan}`);
          }, 1500);
        } else if (res.status === 'FAILED' || res.status === 'CANCELLED') {
          clearInterval(interval);
          setError('O pagamento foi cancelado ou falhou no seu celular.');
          setStatus('idle');
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setError('Tempo limite atingido. Se você já pagou, aguarde alguns instantes e atualize a página.');
          setStatus('idle');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#22C55E]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#22C55E]/5 rounded-full blur-[100px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-[420px] w-full bg-[var(--bg-card)] rounded-[40px] p-10 text-center border border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative z-10"
        >
          <div className="w-24 h-24 bg-[#22C55E]/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-[#22C55E]/20">
            <CheckCircle2 size={48} className="text-[#22C55E] drop-shadow-[0_0_12px_rgba(86,171,47,0.4)]" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3 tracking-tight">Pagamento Confirmado! 🎉</h1>
          <p className="text-gray-400 mb-10 font-bold text-[15px] leading-relaxed">Sua conta ProFit Pro está quase pronta. Agora, defina sua senha de acesso!</p>
          <div 
            className="w-full h-16 bg-gradient-to-r from-[#22C55E] to-[#22C55E] text-white rounded-2xl font-black text-[15px] uppercase tracking-widest shadow-[0_20px_40px_-8px_rgba(86,171,47,0.35)] flex items-center justify-center gap-3"
          >
            Configurando Acesso... <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-5%] w-[600px] h-[600px] bg-[#22C55E]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-[400px] w-full z-10 px-2">
        {/* Simple Top Navigation */}
        <div className="flex items-center justify-center relative mb-4">
            <button 
                onClick={() => navigate(-1)}
                className="absolute left-[-10px] top-[-10px] w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/5 active:scale-90 hover:bg-white/10 transition-all z-20"
            >
                <ChevronLeft size={22} className="text-white" />
            </button>
            <div className="text-center pt-1">
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Checkout Seguro</span>
            </div>
        </div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--bg-card)] rounded-[32px] border border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] px-6 py-6 overflow-hidden"
        >
            {/* Plan Card Premium */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 mb-5 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-[#22C55E]/20 rounded-xl blur-lg group-hover:scale-110 transition-transform duration-500" />
                        <div className="w-10 h-10 bg-gradient-to-tr from-[#22C55E] to-[#22C55E] rounded-xl flex items-center justify-center text-white relative border border-[#22C55E]/20 shadow-lg shadow-[#22C55E]/20">
                            <Zap size={20} className="fill-current" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-black text-[15px] text-white leading-none mb-1">ProFit Pro</h3>
                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none">
                            {searchParams.get('plan') === 'anual' ? 'ASSINATURA ANUAL' : 'ASSINATURA MENSAL'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    {appliedCoupon ? (
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-gray-600 line-through font-bold">
                                {searchParams.get('plan') === 'anual' ? '2.490 MT' : '299 MT'}
                            </span>
                            <span className="text-[18px] font-black text-[#22C55E] tracking-tight">{calculateTotal()} MT</span>
                        </div>
                    ) : (
                        <span className="text-[18px] font-black text-[#22C55E] tracking-tight">
                            {searchParams.get('plan') === 'anual' ? '2.490' : '299'} MT
                        </span>
                    )}
                </div>
            </div>

            {/* Methods Selection Section */}
            <div className="space-y-6">
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Método de Pagamento</h4>
                        <LockKeyhole size={12} className="text-gray-600" />
                    </div>
                    
                    <div className="flex gap-3">
                        {/* M-PESA */}
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedMethod('mpesa')}
                            className={`flex-1 relative p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                                selectedMethod === 'mpesa' 
                                ? 'border-[#22C55E] bg-[#22C55E]/10' 
                                : 'border-white/5 bg-black/20 hover:bg-black/40'
                            }`}
                        >
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                <Zap size={16} className={selectedMethod === 'mpesa' ? 'text-[#22C55E] fill-current' : 'text-gray-500'} />
                            </div>
                            <span className={`text-[12px] font-black ${selectedMethod === 'mpesa' ? 'text-white' : 'text-gray-500'}`}>M-Pesa</span>
                            {selectedMethod === 'mpesa' && (
                                <motion.div layoutId="payment_dot" className="absolute top-2 right-2 w-2 h-2 bg-[#22C55E] rounded-full shadow-[0_0_8px_rgba(86,171,47,0.6)]" />
                            )}
                        </motion.button>

                        {/* e-Mola */}
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedMethod('emola')}
                            className={`flex-1 relative p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                                selectedMethod === 'emola' 
                                ? 'border-[#22C55E] bg-[#22C55E]/10' 
                                : 'border-white/5 bg-black/20 hover:bg-black/40'
                            }`}
                        >
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                <Smartphone size={16} className={selectedMethod === 'emola' ? 'text-orange-500' : 'text-gray-500'} />
                            </div>
                            <span className={`text-[12px] font-black ${selectedMethod === 'emola' ? 'text-white' : 'text-gray-500'}`}>e-Mola</span>
                            {selectedMethod === 'emola' && (
                                <motion.div layoutId="payment_dot" className="absolute top-2 right-2 w-2 h-2 bg-[#22C55E] rounded-full shadow-[0_0_8px_rgba(86,171,47,0.6)]" />
                            )}
                        </motion.button>
                    </div>
                </section>

                {/* Form Data Section */}
                <section className="space-y-3">
                    <div className="bg-[var(--bg-card)] rounded-2xl p-3 border border-white/5 focus-within:border-[#22C55E] transition-all">
                        <div className="flex items-center gap-4">
                            <Mail size={16} className="text-gray-600" />
                            <div className="flex-1">
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-0.5">E-mail da Conta</p>
                                <input 
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@parceiro.com"
                                    className="w-full bg-transparent border-none outline-none text-[14px] font-bold text-white placeholder:text-gray-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-[var(--bg-card)] rounded-2xl p-3 border border-white/5 focus-within:border-[#22C55E] transition-all">
                        <div className="flex items-center gap-4">
                            <Phone size={16} className="text-gray-600" />
                            <div className="flex-1">
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-0.5">Número de Celular</p>
                                <input 
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder={selectedMethod === 'mpesa' ? "84 ou 85..." : "86 ou 87..."}
                                    className="w-full bg-transparent border-none outline-none text-[14px] font-bold text-white placeholder:text-gray-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Refined Coupon Section */}
                    <div>
                        {!showCouponInput ? (
                            <button 
                                onClick={() => setShowCouponInput(true)}
                                className="text-[11px] font-black text-[#22C55E] uppercase tracking-[0.1em] flex items-center gap-2 px-1 hover:brightness-125 transition-all"
                            >
                                <Ticket size={14} /> Tem um cupom?
                            </button>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-black/30 rounded-2xl p-2 border border-dashed border-white/10 flex items-center gap-2"
                            >
                                <input 
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    placeholder="CÓDIGO"
                                    disabled={validatingCoupon || !!appliedCoupon}
                                    className="flex-1 bg-transparent border-none outline-none text-xs font-black text-white pl-3 uppercase tracking-widest placeholder:text-gray-700"
                                />
                                {appliedCoupon ? (
                                    <div className="flex items-center gap-2 bg-[#22C55E]/20 text-[#22C55E] px-3 py-2 rounded-xl text-[10px] font-black uppercase border border-[#22C55E]/20">
                                        <CheckCircle2 size={12} /> {appliedCoupon.discount_value}{appliedCoupon.discount_type === 'percent' ? '%' : ' MT'} OFF
                                    </div>
                                ) : (
                                    <button 
                                        onClick={handleApplyCoupon}
                                        disabled={!couponCode || validatingCoupon}
                                        className="bg-white text-black px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-20"
                                    >
                                        {validatingCoupon ? '...' : 'OK'}
                                    </button>
                                )}
                            </motion.div>
                        )}
                        {couponError && <p className="text-[10px] font-bold text-red-500 mt-2 ml-1">{couponError}</p>}
                    </div>
                </section>

                {/* Error Banner */}
                <AnimatePresence>
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-500 text-[11px] font-bold text-center"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer and Button Section */}
                <div className="pt-1">
                    <button 
                        onClick={handlePayment}
                        disabled={status !== 'idle'}
                        className="w-full h-14 bg-gradient-to-r from-[#22C55E] to-[#22C55E] text-white font-black text-[15px] uppercase tracking-[0.2em] rounded-2xl shadow-[0_20px_40px_-5px_rgba(86,171,47,0.35)] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-70 group"
                    >
                        {status === 'processing' ? (
                            <>
                                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Processando...</span>
                            </>
                        ) : status === 'waiting_pin' ? (
                            <>
                                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Aguardando PIN...</span>
                            </>
                        ) : (
                            <>
                                <span>PAGAR AGORA</span>
                                <motion.div
                                    animate={{ x: [0, 5, 0] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                >
                                    <ArrowRight size={22} />
                                </motion.div>
                            </>
                        )}
                    </button>

                    {status === 'waiting_pin' && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="mt-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 text-center"
                        >
                            <p className="text-[11px] font-bold text-amber-500 leading-tight">
                                💡 Verifique seu celular agora e digite seu PIN para autorizar.
                            </p>
                        </motion.div>
                    )}

                    {/* Secure Footer */}
                    <div className="mt-6 flex flex-col items-center gap-2 opacity-50">
                        <div className="flex items-center gap-2">
                            <Lock size={12} className="text-[#22C55E]" />
                            <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Pagamento 100% seguro</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Checkout;
