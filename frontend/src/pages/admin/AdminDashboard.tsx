import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Crown, 
  ShieldCheck, 
  TrendingUp, 
  ArrowUpRight,
  Activity,
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// Simplified Counter Component for Numbers
const Counter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
    const [displayValue, setDisplayValue] = useState(0);
    
    useEffect(() => {
        let start = 0;
        const end = value;
        if (start === end) return;
        
        let totalMiliseconds = 1000;
        let incrementTime = (totalMiliseconds / end) > 10 ? (totalMiliseconds / end) : 10;
        
        let timer = setInterval(() => {
            start += Math.ceil(end / (totalMiliseconds / incrementTime));
            if (start >= end) {
                setDisplayValue(end);
                clearInterval(timer);
            } else {
                setDisplayValue(start);
            }
        }, incrementTime);
        
        return () => clearInterval(timer);
    }, [value]);
    
    return <span>{displayValue.toLocaleString()}{suffix}</span>;
};

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const data = await api.admin.getDashboardData();
            setStats(data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div className="space-y-6">
            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-[110px] bg-[var(--bg-card)] dark:bg-slate-900 rounded-xl border border-[#E6EAF0] dark:border-slate-800 animate-pulse" />
                ))}
            </div>
            <div className="h-80 bg-[var(--bg-card)] dark:bg-slate-900 rounded-xl border border-[#E6EAF0] dark:border-slate-800 animate-pulse" />
        </div>
    );

    const mainStats = [
        { label: 'Usuários Totais', value: stats?.total_users || 0, icon: Users, color: 'text-[#22C55E]', trend: 'SaaS', suffix: '' },
        { label: 'Usuários PRO', value: stats?.pro_users || 0, icon: Crown, color: 'text-amber-400', trend: 'Premium', suffix: '' },
        { label: 'Paywall Ativo', value: stats?.paywall_active ? 'SIM' : 'NÃO', icon: ShieldCheck, color: stats?.paywall_active ? 'text-rose-400' : 'text-[#22C55E]', trend: stats?.paywall_active ? 'Bloqueado' : 'Liberado', isBoolean: true },
        { label: 'MRR Estimado', value: stats?.mrr || 0, icon: TrendingUp, color: 'text-blue-400', trend: 'Mensal', suffix: ' MT' },
    ];

    const activityData = stats?.activityData || [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* SaaS Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-[24px] font-semibold text-[#1A202C] dark:text-white tracking-tight transition-colors">Visão Geral</h1>
                    <p className="text-[14px] text-[#718096] dark:text-slate-400 mt-0.5 transition-colors">Métricas de desempenho e saúde do sistema em tempo real.</p>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                </div>
            </div>

            {/* Compact Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mainStats.map((stat, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx} 
                        className="bg-[var(--bg-card)] dark:bg-[#1E293B] px-5 py-5 rounded-[16px] border border-[#E6EAF0] dark:border-[#334155] h-[120px] flex flex-col justify-between hover:shadow-lg hover:border-[#22C55E]/30 transition-all duration-300 group"
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-[12px] font-bold text-[#A0AEC0] dark:text-slate-400 uppercase tracking-widest">{stat.label}</span>
                            <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <div className="flex items-baseline justify-between mt-auto">
                            <span className="text-[32px] font-black text-[#2D3748] dark:text-white leading-none tracking-tight transition-colors">
                                {typeof stat.value === 'number' ? (
                                    <Counter value={stat.value} suffix={stat.suffix} />
                                ) : (
                                    stat.value
                                )}
                            </span>
                            <span className={`text-[11px] font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
                                stat.trend === 'Bloqueado' ? 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' : 'text-[#22C55E] bg-emerald-50 dark:bg-[#22C55E]/10'
                            }`}>
                                <ArrowUpRight size={12} />
                                {stat.trend}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Layout Grid: Chart + Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Horizontal Graphic */}
                <div className="lg:col-span-8 bg-[var(--bg-card)] dark:bg-[#1E293B] p-5 rounded-[14px] border border-[#E6EAF0] dark:border-[#334155] transition-colors duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-[16px] font-semibold text-[#2D3748] dark:text-white transition-colors">Tendência de Engajamento</h2>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                <span className="text-[12px] text-[#718096] dark:text-slate-400">Usuários Ativos</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-orange-500" />
                                <span className="text-[12px] text-[#718096] dark:text-slate-400">Refeições Registradas</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={activityData}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorMeals" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '12px', 
                                        border: '1px solid #334155', 
                                        backgroundColor: '#1E293B',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
                                        backdropFilter: 'blur(8px)',
                                        color: '#fff'
                                    }}
                                    itemStyle={{ fontSize: '12px', padding: '2px 0' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="users" 
                                    name="Usuários Ativos"
                                    stroke="#22C55E" 
                                    strokeWidth={4}
                                    fillOpacity={1} 
                                    fill="url(#colorUsers)" 
                                    animationDuration={2000}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="meals" 
                                    name="Refeições"
                                    stroke="#94A3B8" 
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    fillOpacity={1} 
                                    fill="url(#colorMeals)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Server Status Indicators (SaaS Style) */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-[var(--bg-card)] dark:bg-[#1E293B] p-5 rounded-[14px] border border-[#E6EAF0] dark:border-[#334155] transition-colors duration-300">
                        <h2 className="text-[16px] font-semibold text-[#2D3748] dark:text-white mb-4 transition-colors">Estado do Sistema</h2>
                        
                        <div className="space-y-3">
                            {[
                                { label: 'Banco de Dados', status: stats?.system_status?.database || 'Offline', weight: stats?.system_status?.database === 'Online' ? 'Verde' : 'Vermelho' },
                                { label: 'IA (Vumba Core)', status: stats?.system_status?.vumba_core || 'Desconectado', weight: 'Verde' },
                                { label: 'Paywall (20 Users)', status: stats?.paywall_active ? 'Ativo' : 'Inativo', weight: stats?.paywall_active ? 'Amarelo' : 'Verde' },
                                { label: 'Usuários Free', status: stats?.free_users || 0, weight: 'Cinza' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-[#334155]/50 last:border-0 transition-colors">
                                    <span className="text-[14px] font-medium text-[#4A5568] dark:text-slate-300">{item.label}</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${
                                            item.weight === 'Verde' ? 'bg-[#22C55E] shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 
                                            item.weight === 'Amarelo' ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]' : 
                                            item.weight === 'Vermelho' ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]' : 'bg-slate-300 dark:bg-slate-700'
                                        }`} />
                                        <span className="text-[12px] font-bold text-[#718096] dark:text-slate-400">{item.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#2D3748] to-[#1A202C] dark:from-[#334155] dark:to-[#0F172A] p-5 rounded-[14px] text-white overflow-hidden relative group transition-all duration-300">
                        <Activity className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 group-hover:scale-110 transition-transform" />
                        <h3 className="text-[14px] font-semibold mb-2 flex items-center gap-2">
                            Ação Recomendada
                            <ShieldCheck size={14} className={`text-emerald-400`} />
                        </h3>
                        <p className="text-[12px] text-slate-300 leading-relaxed">
                            {stats?.paywall_active 
                                ? "O Paywall está ativo. Monitorando conversão de usuários PRO." 
                                : "O sistema está operando em modo livre. Nenhuma intervenção necessária."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
