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
  Smartphone
} from 'lucide-react';
import { api } from '../services/api';

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [selectedMethod, setSelectedMethod] = useState<'mpesa' | 'emola' | null>('mpesa');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handlePayment = async () => {
    if (!fullName.trim()) {
        setError('Por favor, insira seu nome completo.');
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

    // Basic validation based on method
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
      await api.payments.create({
        amount: 29.90, // Fixed price for consistency with paywall message
        method: selectedMethod,
        phone: phoneNumber,
        name: fullName
      });
      
      // Simulation of network delay & backend processing
      setTimeout(() => {
        setStatus('success');
      }, 3000);
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Falha ao processar pagamento. Tente novamente.');
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[var(--bg-container)] rounded-[40px] p-10 text-center border border-[var(--border-main)] shadow-2xl"
        >
          <div className="w-24 h-24 bg-[#56AB2F]/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={48} className="text-[#56AB2F]" />
          </div>
          <h1 className="text-2xl font-black text-[var(--text-main)] mb-3">Pagamento Confirmado! 🎉</h1>
          <p className="text-[var(--text-muted)] mb-10 font-medium">Sua conta ProFit Pro já está ativa. Aproveite todos os recursos agora!</p>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-gradient-to-r from-[#56AB2F] to-[#A8E063] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-[#56AB2F]/20 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            Começar Treino <ArrowRight size={20} />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] pb-12">
      {/* Top Header Navigation */}
      <div className="px-6 pt-12 flex items-center justify-between mb-8 max-w-lg mx-auto">
        <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-[var(--bg-container)] rounded-full flex items-center justify-center border border-[var(--border-main)] active:scale-95 transition-all"
        >
            <ChevronLeft size={20} />
        </button>
        <span className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Checkout Seguro</span>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="max-w-lg mx-auto px-6">
        
        {/* Plan Summary Card */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--bg-container)] rounded-[32px] p-6 mb-8 border border-[var(--border-main)] shadow-sm"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-tr from-[#56AB2F] to-[#A8E063] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#56AB2F]/20">
                        <Zap size={24} className="fill-current" />
                    </div>
                    <div>
                        <h3 className="font-black text-lg leading-tight text-[var(--text-main)]">ProFit Pro</h3>
                        <p className="text-[10px] font-black text-[#56AB2F] uppercase tracking-widest mt-0.5">Assinatura Mensal</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xl font-black text-[var(--text-main)]">R$ 29,90</span>
                    <p className="text-[10px] text-[var(--text-muted)] font-bold">/mês</p>
                </div>
            </div>
        </motion.div>

        {/* Content Section */}
        <div className="space-y-8">
            {/* Payment Method Selector */}
            <section>
                <div className="flex items-center justify-between mb-4 px-2">
                    <h4 className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest">Escolha o Método</h4>
                    <Lock size={12} className="text-[var(--text-muted)]" />
                </div>
                
                <div className="flex gap-4">
                    {/* M-PESA */}
                    <button 
                        onClick={() => setSelectedMethod('mpesa')}
                        className={`flex-1 group relative p-5 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center gap-3 ${
                            selectedMethod === 'mpesa' 
                            ? 'border-[#56AB2F] bg-[#56AB2F]/5 shadow-md' 
                            : 'border-[var(--border-main)] bg-[var(--bg-container)] opacity-60 hover:opacity-100'
                        }`}
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                            selectedMethod === 'mpesa' ? 'bg-[#56AB2F] text-white' : 'bg-[var(--bg-surface)] text-red-500'
                        }`}>
                            <Zap size={24} className={selectedMethod === 'mpesa' ? 'fill-current' : ''} />
                        </div>
                        <span className="text-sm font-black whitespace-nowrap">M-Pesa</span>
                        
                        {/* Radio indicator */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedMethod === 'mpesa' ? 'border-[#56AB2F]' : 'border-[var(--border-main)]'
                        }`}>
                            {selectedMethod === 'mpesa' && <div className="w-2.5 h-2.5 bg-[#56AB2F] rounded-full" />}
                        </div>
                    </button>

                    {/* e-Mola */}
                    <button 
                        onClick={() => setSelectedMethod('emola')}
                        className={`flex-1 group relative p-5 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center gap-3 ${
                            selectedMethod === 'emola' 
                            ? 'border-[#56AB2F] bg-[#56AB2F]/5 shadow-md' 
                            : 'border-[var(--border-main)] bg-[var(--bg-container)] opacity-60 hover:opacity-100'
                        }`}
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                            selectedMethod === 'emola' ? 'bg-[#56AB2F] text-white' : 'bg-[var(--bg-surface)] text-orange-500'
                        }`}>
                            <Smartphone size={24} />
                        </div>
                        <span className="text-sm font-black whitespace-nowrap">e-Mola</span>

                        {/* Radio indicator */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedMethod === 'emola' ? 'border-[#56AB2F]' : 'border-[var(--border-main)]'
                        }`}>
                            {selectedMethod === 'emola' && <div className="w-2.5 h-2.5 bg-[#56AB2F] rounded-full" />}
                        </div>
                    </button>
                </div>
            </section>

            {/* Form Inputs */}
            <section className="space-y-4">
                {/* Full Name Input */}
                <div className="group bg-[var(--bg-container)] rounded-2xl p-4 border-2 border-transparent focus-within:border-[#56AB2F] transition-all bg-[var(--bg-container)] border-[var(--border-main)]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] flex items-center justify-center text-[var(--text-muted)] group-focus-within:text-[#56AB2F] transition-colors">
                            <User size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-1">Nome Completo</p>
                            <input 
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Seu nome completo"
                                className="w-full bg-transparent border-none outline-none text-sm font-bold text-[var(--text-main)] placeholder:text-[var(--text-muted)]/40 px-0 py-0"
                            />
                        </div>
                    </div>
                </div>

                {/* Phone Number Input */}
                <div className="group bg-[var(--bg-container)] rounded-2xl p-4 border-2 border-transparent focus-within:border-[#56AB2F] transition-all bg-[var(--bg-container)] border-[var(--border-main)]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] flex items-center justify-center text-[var(--text-muted)] group-focus-within:text-[#56AB2F] transition-colors">
                            <Phone size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-1">Número de Celular</p>
                            <input 
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder={selectedMethod === 'mpesa' ? "Ex: 84xxxxxxx" : "Ex: 86xxxxxxx"}
                                className="w-full bg-transparent border-none outline-none text-sm font-bold text-[var(--text-main)] placeholder:text-[var(--text-muted)]/40 px-0 py-0"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-500 text-xs font-bold text-center"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Action Section */}
            <div className="pt-4 flex flex-col items-center gap-6">
                <button 
                    onClick={handlePayment}
                    disabled={status === 'processing'}
                    className="w-full h-20 bg-gradient-to-r from-[#56AB2F] to-[#A8E063] text-white font-black text-lg uppercase tracking-[0.15em] rounded-[24px] shadow-xl shadow-[#56AB2F]/30 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-70"
                >
                    {status === 'processing' ? (
                        <>
                            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Processando...</span>
                        </>
                    ) : (
                        <>
                            PAGAR AGORA
                            <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>

                <div className="flex flex-col items-center gap-2 opacity-60">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-[#56AB2F]" />
                        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Pagamento 100% seguro</span>
                    </div>
                    <p className="text-[9px] text-[var(--text-muted)] font-medium max-w-[200px] text-center">
                        Sua transação é protegida com criptografia de ponta a ponta pela Vodacom/Movitel.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
