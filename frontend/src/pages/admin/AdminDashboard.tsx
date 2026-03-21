import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Utensils, 
  Dumbbell, 
  Camera, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Crown,
  ShieldCheck,
  AlertCircle,
  DollarSign,
  CreditCard
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { api } from '../../services/api';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        fetchStats();
    }, []);

    const activityData = stats?.activityData || [];

    if (loading) return (
        <div className="space-y-6">
            <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-[110px] bg-white rounded-xl border border-[#E6EAF0] animate-pulse" />
                ))}
            </div>
            <div className="h-80 bg-white rounded-xl border border-[#E6EAF0] animate-pulse" />
        </div>
    );

    const mainStats = [
        { label: 'Usuários Totais', value: stats?.total_users || 0, icon: Users, color: 'text-blue-500', trend: 'SaaS' },
        { label: 'Usuários PRO', value: stats?.pro_users || 0, icon: Crown, color: 'text-amber-500', trend: 'Premium' },
        { label: 'Paywall Ativo', value: stats?.paywall_active ? 'SIM' : 'NÃO', icon: ShieldCheck, color: stats?.paywall_active ? 'text-rose-500' : 'text-emerald-500', trend: stats?.paywall_active ? 'Bloqueado' : 'Liberado' },
        { label: 'MRR Estimado', value: `${(stats?.mrr || 0).toLocaleString()} MT`, icon: TrendingUp, color: 'text-indigo-500', trend: 'Mensal' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* SaaS Header */}
            <div>
                <h1 className="text-[24px] font-semibold text-[#1A202C] dark:text-white tracking-tight transition-colors">Visão Geral</h1>
                <p className="text-[14px] text-[#718096] dark:text-slate-400 mt-0.5 transition-colors">Métricas de desempenho e saúde do sistema.</p>
            </div>

            {/* Compact Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mainStats.map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#1E293B] px-4 py-4 rounded-[12px] border border-[#E6EAF0] dark:border-[#334155] h-[110px] flex flex-col justify-between hover:shadow-sm transition-all duration-300">
                        <div className="flex justify-between items-start">
                            <span className="text-[12px] font-semibold text-[#A0AEC0] dark:text-slate-500 uppercase tracking-wider">{stat.label}</span>
                            <div className={`p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 ${stat.color}`}>
                                <stat.icon size={18} />
                            </div>
                        </div>
                        <div className="flex items-baseline justify-between mt-auto">
                            <span className="text-[28px] font-semibold text-[#2D3748] dark:text-white leading-none transition-colors">
                                {stat.value.toLocaleString()}
                            </span>
                            <span className="text-[12px] font-medium text-emerald-500 flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                                <ArrowUpRight size={12} />
                                {stat.trend}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Layout Grid: Chart + Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Horizontal Graphic */}
                <div className="lg:col-span-8 bg-white dark:bg-[#1E293B] p-5 rounded-[14px] border border-[#E6EAF0] dark:border-[#334155] transition-colors duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-[16px] font-semibold text-[#2D3748] dark:text-white transition-colors">Tendência de Engajamento</h2>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                <span className="text-[12px] text-[#718096] dark:text-slate-400">Usuários</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-orange-500" />
                                <span className="text-[12px] text-[#718096] dark:text-slate-400">Refeições</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={activityData}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3182CE" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#3182CE" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDF2F7" className="dark:opacity-10" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#A0AEC0', fontSize: 11 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#A0AEC0', fontSize: 11 }}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '8px', 
                                        border: '1px solid #E6EAF0', 
                                        backgroundColor: 'var(--tw-backgroundColor-white)',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                                    }}
                                    itemStyle={{ color: '#2D3748' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="users" 
                                    stroke="#3182CE" 
                                    strokeWidth={2}
                                    fillOpacity={1} 
                                    fill="url(#colorUsers)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Server Status Indicators (SaaS Style) */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white dark:bg-[#1E293B] p-5 rounded-[14px] border border-[#E6EAF0] dark:border-[#334155] transition-colors duration-300">
                        <h2 className="text-[16px] font-semibold text-[#2D3748] dark:text-white mb-4 transition-colors">Estado do Sistema</h2>
                        
                        <div className="space-y-3">
                            {[
                                { label: 'Banco de Dados', status: 'Online', weight: 'Verde' },
                                { label: 'IA (Vumba Core)', status: 'Operacional', weight: 'Verde' },
                                { label: 'Paywall (20 Users)', status: stats?.paywall_active ? 'Ativado' : 'Inativo', weight: stats?.paywall_active ? 'Amarelo' : 'Verde' },
                                { label: 'Usuários Free', status: stats?.free_users || 0, weight: 'Cinza' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50 last:border-0 transition-colors">
                                    <span className="text-[14px] text-[#4A5568] dark:text-slate-300">{item.label}</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${
                                            item.weight === 'Verde' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                                            item.weight === 'Amarelo' ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                                        }`} />
                                        <span className="text-[12px] font-medium text-[#718096] dark:text-slate-500">{item.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#2D3748] to-[#1A202C] dark:from-[#334155] dark:to-[#0F172A] p-5 rounded-[14px] text-white overflow-hidden relative group transition-all duration-300">
                        <Activity className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 group-hover:scale-110 transition-transform" />
                        <h3 className="text-[14px] font-semibold mb-2 flex items-center gap-2">
                            Ação Recomendada
                            <ShieldCheck size={14} className="text-emerald-400" />
                        </h3>
                        <p className="text-[12px] text-slate-300 leading-relaxed">
                            O sistema está operando perfeitamente. Nenhuma intervenção manual necessária nas últimas 24h.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
