import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Filter, ArrowRight, Zap, Play, CheckCircle2, Eye, CreditCard, RefreshCw, Activity, Utensils, Calendar, Ruler, Smile } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function AdminFunnel() {
  const [loading, setLoading] = useState(true);
  const [funnelData, setFunnelData] = useState<{ counts: any, users: any[], blockers: any, objectives: any }>({ counts: {}, users: [], blockers: {}, objectives: {} });

  useEffect(() => {
    fetchFunnelStats();
  }, []);

  const fetchFunnelStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/funnel-stats`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setFunnelData(data);
    } catch (err) {
      console.error('Error fetching funnel stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 'REGISTERED', label: 'Cadastrados', icon: Users, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
    { id: 'QUIZ_STARTED', label: 'Iniciou Quiz', icon: Play, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { id: 'QUIZ_COMPLETED', label: 'Terminou Quiz', icon: CheckCircle2, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
    { id: 'PLAN_VIEWED', label: 'Viu Plano', icon: Eye, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { id: 'PAYMENT_PENDING', label: 'Pendente', icon: CreditCard, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
    { id: 'PAID', label: 'Pagos (Ativos)', icon: Zap, color: 'text-[#38A169]', bg: 'bg-[#38A169]/10' }
  ];

  const blockersLabels: Record<string, { label: string, icon: any }> = {
    consistencia: { label: 'Falta de consistência', icon: Activity },
    habitos_ruins: { label: 'Hábitos alimentares', icon: Utensils },
    falta_suporte: { label: 'Falta de suporte', icon: Users },
    agenda_ocupada: { label: 'Agenda ocupada', icon: Calendar },
    falta_inspiracao: { label: 'Falta de inspiração', icon: Ruler },
  };

  const objectivesLabels: Record<string, { label: string, icon: any }> = {
    'Comer e viver de forma mais saudável': { label: 'Vida Saudável', icon: Utensils },
    'Aumentar minha energia e humor': { label: 'Energia e Humor', icon: Zap },
    'Me manter motivado e consistente': { label: 'Foco e Consistência', icon: Activity },
    'Me sentir melhor com meu corpo': { label: 'Estética e Bem-estar', icon: Smile },
  };

  const getCount = (stepId: string) => funnelData.counts[stepId] || 0;
  const totalRegistered = getCount('REGISTERED') + getCount('QUIZ_STARTED') + getCount('QUIZ_COMPLETED') + getCount('PLAN_VIEWED') + getCount('PAYMENT_PENDING') + getCount('PAID');

  const getPercentage = (stepId: string) => {
    const total = totalRegistered;
    const accumulated = getRawAccumulated(stepId);
    if (total === 0) return 0;
    return Math.round((accumulated / total) * 100);
  };

  const getRawAccumulated = (stepId: string) => {
    let accumulated = getCount(stepId);
    const startIndex = steps.findIndex(s => s.id === stepId) + 1;
    for (let i = startIndex; i < steps.length; i++) {
        accumulated += getCount(steps[i].id);
    }
    return accumulated;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#38A169] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white capitalize flex items-center gap-2">
            <Filter size={24} className="text-[#38A169]" /> Funil de Conversão
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Monitorize a jornada dos usuários desde o cadastro até à assinatura do plano
          </p>
        </div>
        <button 
          onClick={fetchFunnelStats}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-[#38A169] transition-all"
        >
            <RefreshCw size={16} /> Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Funnel Visualizer */}
        <div className="lg:col-span-2 xl:col-span-3 bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm overflow-x-auto">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Visão Geral do Funil</h2>
          
          <div className="flex items-center gap-2 min-w-[600px]">
            {steps.map((step, index) => {
              const accumulated = getRawAccumulated(step.id);
              const percentage = getPercentage(step.id);
              
              return (
                <React.Fragment key={step.id}>
                  <div className="flex-1 flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${step.bg} mb-3 shadow-inner`}>
                      <step.icon size={20} className={step.color} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">{step.label}</p>
                    <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{accumulated}</p>
                    <div className="mt-2 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">
                      <span className={`text-[10px] font-bold ${percentage >= 50 ? 'text-[#38A169]' : 'text-slate-500 dark:text-slate-400'}`}>
                          {percentage}%
                      </span>
                    </div>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="flex justify-center text-slate-300 dark:text-slate-600 mb-8 self-center">
                      <ArrowRight size={16} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Top Blockers */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Principais Obstáculos</h2>
          <div className="space-y-4">
            {Object.entries(blockersLabels).map(([key, config]) => {
              const count = funnelData.blockers?.[key] || 0;
              const totalBlockers = Object.values(funnelData.blockers || {}).reduce((a: any, b: any) => a + b, 0) as number;
              const barPercentage = totalBlockers > 0 ? (count / totalBlockers) * 100 : 0;
              
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <config.icon size={14} className="text-slate-400" />
                      <span className="font-bold text-slate-600 dark:text-slate-300">{config.label}</span>
                    </div>
                    <span className="font-black text-slate-800 dark:text-white">{count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${barPercentage}%` }}
                      className="h-full bg-[#38A169]"
                    />
                  </div>
                </div>
              )
            })}
            {Object.keys(funnelData.blockers || {}).length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-slate-400">Nenhum obstáculo registrado ainda.</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Objectives */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Objetivos Principais</h2>
          <div className="space-y-4">
            {Object.entries(objectivesLabels).map(([key, config]) => {
              const count = funnelData.objectives?.[key] || 0;
              const totalObjectives = Object.values(funnelData.objectives || {}).reduce((a: any, b: any) => a + b, 0) as number;
              const barPercentage = totalObjectives > 0 ? (count / totalObjectives) * 100 : 0;
              
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <config.icon size={14} className="text-slate-400" />
                      <span className="font-bold text-slate-600 dark:text-slate-300">{config.label}</span>
                    </div>
                    <span className="font-black text-slate-800 dark:text-white">{count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${barPercentage}%` }}
                      className="h-full bg-blue-500"
                    />
                  </div>
                </div>
              )
            })}
            {Object.keys(funnelData.objectives || {}).length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-slate-400">Nenhum objetivo registrado ainda.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Usuários Recentes no Funil</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700/50">
                <th className="pb-3 text-[12px] font-black tracking-wider text-slate-400 uppercase">Usuário</th>
                <th className="pb-3 text-[12px] font-black tracking-wider text-slate-400 uppercase">Email</th>
                <th className="pb-3 text-[12px] font-black tracking-wider text-slate-400 uppercase">Data</th>
                <th className="pb-3 text-[12px] font-black tracking-wider text-slate-400 uppercase">Etapa Atual</th>
                <th className="pb-3 text-[12px] font-black tracking-wider text-slate-400 uppercase text-right">Plano</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {funnelData.users.slice(0, 50).map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4">
                    <span className="font-bold text-slate-800 dark:text-white text-sm">{user.name}</span>
                  </td>
                  <td className="py-4">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{user.email}</span>
                  </td>
                  <td className="py-4">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                         {steps.find(s => s.id === user.funnel_step)?.label || user.funnel_step || 'REGISTERED'}
                    </div>
                  </td>
                  <td className="py-4 text-right">
                     {user.plan === 'PRO' || user.payment_status === 'PAID' ? (
                         <span className="inline-flex items-center gap-1 text-[#38A169] text-xs font-bold bg-[#38A169]/10 px-2 py-1 rounded-md">
                            <Zap size={12} className="fill-current" /> PRO
                         </span>
                     ) : (
                         <span className="text-slate-400 text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">FREE</span>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {funnelData.users.length === 0 && (
              <p className="text-center text-sm font-medium text-slate-500 mt-6">Nenhum usuário encontrado no funil.</p>
          )}
        </div>
      </div>
    </div>
  );
}
