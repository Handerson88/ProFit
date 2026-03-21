import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CreditCard, Smartphone, CheckCircle2, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { trackingService } from '../services/trackingService';

export const Checkout = () => {
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const [method, setMethod] = useState<'mpesa' | 'emola'>('mpesa');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'approved' | 'failed'>('idle');
  const [paymentId, setPaymentId] = useState<string | null>(null);

  // Lógica de Desconto v2
  const activeDiscount = user?.active_discounts?.[0];
  const discountPercentage = activeDiscount ? activeDiscount.percentage : (user?.discount_earned && !user?.discount_used ? 30 : 0);
  const basePrice = 599;
  const finalPrice = Number((basePrice * (1 - discountPercentage / 100)).toFixed(1));
  const hasDiscount = discountPercentage > 0;

  useEffect(() => {
    let interval: any;
    if (paymentStatus === 'pending' && paymentId) {
       interval = setInterval(async () => {
          try {
             const status = await api.payments.getStatus(paymentId);
             if (status.status === 'approved') {
                setPaymentStatus('approved');
                clearInterval(interval);
                await refreshUser();
                trackingService.logEvent('payment_success', { id: paymentId, method });
             } else if (status.status === 'failed') {
                setPaymentStatus('failed');
                clearInterval(interval);
             }
          } catch (e) {
             console.error('Error polling payment status:', e);
          }
       }, 3000);
    }
    return () => clearInterval(interval);
  }, [paymentStatus, paymentId, method, refreshUser]);

  const handlePayment = async () => {
    if (!phone || phone.length < 9) {
      alert('Por favor, insira um número de telefone válido.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.payments.create({
        amount: finalPrice,
        method,
        phone
      });
      setPaymentId(res.id);
      setPaymentStatus('pending');
      trackingService.logEvent('payment_initiated', { method, phone, amount: finalPrice });
    } catch (err: any) {
      console.error('Payment error:', err);
      alert(err.message || 'Erro ao iniciar pagamento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (paymentStatus === 'approved') {
    return (
      <div className="main-wrapper bg-[#F6F7F9]">
        <div className="app-container flex flex-col items-center justify-center p-8 text-center bg-transparent shadow-none border-none">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-8"
          >
            <CheckCircle2 size={48} />
          </motion.div>
          <h1 className="text-3xl font-black text-gray-900 mb-4">Pagamento Confirmado!</h1>
          <p className="text-gray-500 font-medium mb-10">Parabéns! Você agora é **ProFit Elite**. Aproveite acesso total e sem limites.</p>
          <button 
            onClick={() => navigate('/home')}
            className="w-full max-w-xs bg-gray-900 text-white font-black py-5 rounded-3xl shadow-xl active:scale-95 transition-all"
          >
            Começar Agora
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-wrapper bg-[#F6F7F9]">
      <div className="app-container overflow-y-auto pb-32">
        <div className="pt-8 px-6 flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate(-1)}
            disabled={paymentStatus === 'pending'}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm active:scale-90 transition-all disabled:opacity-30"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-xl font-black text-gray-900">Checkout</h1>
          <div className="w-12"></div>
        </div>

        <div className="px-6">
          {/* Plan Summary Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[32px] p-6 text-white mb-8 shadow-xl shadow-indigo-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Zap size={100} />
             </div>
             <div className="relative z-10">
                <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">PLANO ATIVO</div>
                <h2 className="text-2xl font-black mb-4">ProFit Elite</h2>
                <div className="flex items-center gap-3 mb-6">
                    {hasDiscount ? (
                       <div className="flex flex-col">
                         <span className="text-xs font-bold line-through opacity-50">{basePrice} MZN</span>
                         <div className="flex items-center gap-2">
                            <span className="text-4xl font-black">{finalPrice}</span>
                            <span className="text-sm font-bold opacity-80 uppercase tracking-tighter">MZN / Único</span>
                            <div className="bg-emerald-500 text-[10px] font-black px-2 py-0.5 rounded-full ml-1">{discountPercentage}% OFF</div>
                         </div>
                       </div>
                    ) : (
                       <>
                         <span className="text-4xl font-black">{basePrice}</span>
                         <span className="text-sm font-bold opacity-80 uppercase tracking-tighter">MZN / Único</span>
                       </>
                    )}
                </div>

                <ul className="space-y-2">
                   <li className="flex items-center gap-2 text-xs font-bold bg-white/10 w-fit px-3 py-1.5 rounded-full">
                      <CheckCircle2 size={12} /> Acesso Total Ilimitado
                   </li>
                   <li className="flex items-center gap-2 text-xs font-bold bg-white/10 w-fit px-3 py-1.5 rounded-full">
                      <CheckCircle2 size={12} /> Scans de IA Infinitos
                   </li>
                </ul>
             </div>
          </div>

          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
             <h3 className="text-lg font-black text-gray-900 mb-6">Método de Pagamento</h3>
             
             <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                  onClick={() => setMethod('mpesa')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${method === 'mpesa' ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-50 bg-gray-50 text-gray-400'}`}
                >
                   <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white mb-2 font-black italic shadow-md">M</div>
                   <span className="text-xs font-black">M-Pesa</span>
                </button>
                <button 
                  onClick={() => setMethod('emola')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${method === 'emola' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-50 bg-gray-50 text-gray-400'}`}
                >
                   <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white mb-2 font-black italic shadow-md">e</div>
                   <span className="text-xs font-black">e-Mola</span>
                </button>
             </div>

             <div className="mb-8">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">NÚMERO DE TELEFONE</label>
                <div className="relative">
                   <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Smartphone size={20} />
                   </div>
                   <input 
                     type="tel" 
                     placeholder="Ex: 84 / 85 / 86 / 87" 
                     value={phone}
                     onChange={(e) => setPhone(e.target.value)}
                     disabled={paymentStatus === 'pending'}
                     className="w-full bg-[#F6F7F9] border-none rounded-2xl py-5 pl-14 pr-6 text-gray-900 font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-indigo-600/20 transition-all outline-none"
                   />
                </div>
             </div>

             <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 mb-8">
                <ShieldCheck className="text-indigo-600" size={24} />
                <p className="text-[10px] text-indigo-700 font-medium leading-relaxed">
                   Pagamento seguro processado localmente. Você receberá um pedido de confirmação no seu telemóvel para digitar seu PIN.
                </p>
             </div>

             <button 
               onClick={handlePayment}
               disabled={isLoading || paymentStatus === 'pending'}
               className="w-full bg-gray-900 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
             >
                {paymentStatus === 'pending' ? (
                   <>
                     <Loader2 size={20} className="animate-spin" />
                     Aguardando confirmação...
                   </>
                ) : (
                   <>
                     Pagar {finalPrice} MZN
                     <CreditCard size={18} />
                   </>
                )}
             </button>

             {paymentStatus === 'failed' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-center"
                >
                   <p className="text-red-500 text-xs font-bold">O pagamento falhou ou foi cancelado. Tente novamente.</p>
                </motion.div>
             )}
          </div>
        </div>

        {/* Floating Security Badge */}
        <div className="fixed bottom-10 left-0 right-0 flex justify-center pointer-events-none">
           <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-gray-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Servidor de Pagamento Online</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
