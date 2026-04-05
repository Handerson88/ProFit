import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  ArrowUpRight, 
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { api } from '../../services/api';

const AdminMRR: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsData, chartData] = await Promise.all([
                api.admin.getMRRStats(),
                api.admin.getMRRChart()
            ]);
            
            setStats(statsData);
            setChartData(chartData);
        } catch (err) {
            console.error('Error fetching MRR data:', err);
        } finally {
            setLoading(false);
        }
    };

    const isEstimado = stats?.mode === 'ESTIMADO' || !stats?.charging;

    const cards = [
        { 
            label: isEstimado ? 'MRR Estimado (Beta)' : 'MRR Total Real', 
            value: `MZN ${stats?.mrr?.toLocaleString() || 0}`, 
            icon: DollarSign, 
            color: isEstimado ? 'text-blue-500' : 'text-emerald-500', 
            trend: `${stats?.growth || 0}%`, 
            positive: true 
        },
        { 
            label: isEstimado ? 'Usuários Potenciais' : 'Assinantes Ativos', 
            value: stats?.subscribers || 0, 
            icon: Users, 
            color: 'text-indigo-500', 
            trend: `Total: ${stats?.totalUsers || 0}`, 
            positive: true 
        },
        { 
            label: 'Ticket Fixo', 
            value: `MZN 299.00`, 
            icon: CreditCard, 
            color: 'text-purple-500', 
            trend: 'Padrão', 
            positive: true 
        },
        { 
            label: 'Crescimento Mensal', 
            value: stats?.growth ? `${stats.growth}%` : '0%', 
            icon: TrendingUp, 
            color: 'text-orange-500', 
            trend: 'Meta: 15%', 
            positive: stats?.growth > 0 
        },
    ];

    if (loading) return (
        <div className="space-y-8 p-4">
            <div className="flex flex-col gap-2">
                <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-96 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
            {/* Projected Skeleton */}
            <div className="h-[120px] bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-[120px] bg-[var(--bg-card)] dark:bg-slate-800 rounded-2xl animate-pulse" />
                ))}
            </div>
            <div className="h-[400px] bg-[var(--bg-card)] dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-[24px] font-semibold text-[#1A202C] dark:text-white tracking-tight transition-colors">Monthly Recurring Revenue</h1>
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase shadow-sm ${isEstimado ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'}`}>
                            {isEstimado ? 'Modo Beta' : 'Cobrança Ativa'}
                        </span>
                    </div>
                    <p className="text-[14px] text-[#718096] dark:text-slate-400 mt-1 transition-colors">Visão detalhada da receita e assinaturas (Plano PRO - 299 MZN).</p>
                </div>
            </div>

            {/* Projected Revenue Card (Only shown if < 20 users) */}
            {isEstimado && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/50 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:shadow-md relative overflow-hidden">
                    {/* Background glow decoration */}
                    <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-2xl"></div>
                    
                    <div className="flex items-start gap-4 relative z-10">
                        <div className="p-3 bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-400 rounded-xl">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-200">Receita Projetada</h3>
                            <p className="text-[13px] text-slate-600 dark:text-slate-400 mt-1 max-w-lg">
                                O sistema está em modo beta gratuito. Ao atingir a meta de <strong>20 usuários</strong>, o paywall e a cobrança automática serão ativados.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6 bg-white dark:bg-[#1E293B] px-5 py-3 rounded-xl border border-blue-50 dark:border-slate-700 shadow-sm relative z-10 w-full md:w-auto">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Usuários Atuais</span>
                            <span className="text-[18px] font-bold text-slate-800 dark:text-white">
                                {stats?.totalUsers || 0} / 20
                            </span>
                        </div>
                        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Receita Futura</span>
                            <span className="text-[18px] font-bold text-blue-600 dark:text-blue-400">
                                {((stats?.totalUsers || 0) * 299).toLocaleString()} MZN
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-[var(--bg-card)] dark:bg-[#1E293B] px-5 py-5 rounded-2xl border border-[#E6EAF0] dark:border-[#334155] flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[12px] font-semibold text-[#A0AEC0] dark:text-slate-400 uppercase tracking-wider group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{card.label}</span>
                            <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                                <card.icon size={18} />
                            </div>
                        </div>
                        <div className="flex items-baseline justify-between mt-auto">
                            <span className="text-[26px] font-bold text-[#2D3748] dark:text-white leading-none tracking-tight">
                                {card.value}
                            </span>
                            <span className={`text-[11px] font-bold flex items-center gap-1 px-2 py-1 rounded-lg ${card.positive ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400' : 'text-rose-600 bg-rose-50 dark:text-rose-400'} dark:bg-opacity-10 transition-colors`}>
                                <ArrowUpRight size={12} />
                                {card.trend}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-[var(--bg-card)] dark:bg-[#1E293B] p-6 sm:p-8 rounded-2xl border border-[#E6EAF0] dark:border-[#334155] shadow-sm transition-colors duration-300">
                <div className="mb-8">
                    <h2 className="text-[18px] font-bold text-[#2D3748] dark:text-white transition-colors">Histórico Financeiro</h2>
                    <p className="text-[13px] text-slate-500 mt-1">Evolução do faturamento (12 meses)</p>
                </div>
                
                <div className="h-[350px]">
                    {chartData && chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDF2F7" className="dark:opacity-10" />
                                <XAxis 
                                    dataKey="month" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#A0AEC0', fontSize: 12, fontWeight: 500 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#A0AEC0', fontSize: 12, fontWeight: 500 }}
                                    tickFormatter={(value) => `MZN ${value}`}
                                    dx={-10}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '12px', 
                                        border: '1px solid #E6EAF0', 
                                        backgroundColor: 'var(--tw-backgroundColor-white)',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                                        padding: '12px 16px',
                                        fontWeight: 600
                                    }}
                                    formatter={(value: any) => [`MZN ${value.toLocaleString()}`, 'Receita']}
                                    itemStyle={{ color: '#10B981', paddingTop: '4px' }}
                                    labelStyle={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="#10B981" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorValue)" 
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-[#718096] dark:text-slate-500 space-y-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 transition-colors">
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                                <CreditCard size={32} className="text-slate-400 opacity-50" />
                            </div>
                            <p className="text-[14px] font-medium">Nenhum dado financeiro processado até o momento.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminMRR;
