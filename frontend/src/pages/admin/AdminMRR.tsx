import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  ArrowUpRight, 
  DollarSign 
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

const AdminMRR: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [statsRes, chartRes] = await Promise.all([
                fetch('http://127.0.0.1:5000/api/admin/mrr/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://127.0.0.1:5000/api/admin/mrr/chart', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
            
            const statsData = await statsRes.json();
            const chartData = await chartRes.json();
            
            setStats(statsData);
            setChartData(chartData);
        } catch (err) {
            console.error('Error fetching MRR data:', err);
        } finally {
            setLoading(false);
        }
    };

    const cards = [
        { label: 'MRR Total', value: `MZN ${stats?.mrr?.toLocaleString() || 0}`, icon: DollarSign, color: 'text-emerald-500', trend: `${stats?.growth || 0}%`, positive: true },
        { label: 'Assinantes Ativos', value: stats?.subscribers || 0, icon: Users, color: 'text-blue-500', trend: 'Novos: 4', positive: true },
        { label: 'Ticket Médio', value: `MZN ${stats?.arpu?.toFixed(2) || 0}`, icon: CreditCard, color: 'text-purple-500', trend: 'Estável', positive: true },
        { label: 'Crescimento Mensal', value: stats?.growth ? `${stats.growth}%` : '0%', icon: TrendingUp, color: 'text-orange-500', trend: 'Meta: 15%', positive: stats?.growth > 0 },
    ];

    if (loading) return (
        <div className="space-y-6">
            <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-[110px] bg-white rounded-xl border border-[#E6EAF0] animate-pulse" />
                ))}
            </div>
            <div className="h-96 bg-white rounded-xl border border-[#E6EAF0] animate-pulse" />
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-[24px] font-semibold text-[#1A202C] dark:text-white tracking-tight transition-colors">Monthly Recurring Revenue (MRR)</h1>
                <p className="text-[14px] text-[#718096] dark:text-slate-400 mt-0.5 transition-colors">Visão detalhada da receita recorrente e assinantes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#1E293B] px-4 py-4 rounded-[12px] border border-[#E6EAF0] dark:border-[#334155] h-[110px] flex flex-col justify-between shadow-sm transition-all duration-300">
                        <div className="flex justify-between items-start">
                            <span className="text-[12px] font-semibold text-[#A0AEC0] dark:text-slate-500 uppercase tracking-wider">{card.label}</span>
                            <div className={`p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 ${card.color}`}>
                                <card.icon size={18} />
                            </div>
                        </div>
                        <div className="flex items-baseline justify-between mt-auto">
                            <span className="text-[24px] font-bold text-[#2D3748] dark:text-white leading-none transition-colors">
                                {card.value}
                            </span>
                            <span className={`text-[11px] font-medium flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${card.positive ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'} dark:bg-opacity-10 transition-colors`}>
                                <ArrowUpRight size={10} />
                                {card.trend}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-[#1E293B] p-6 rounded-[14px] border border-[#E6EAF0] dark:border-[#334155] shadow-sm transition-colors duration-300">
                <h2 className="text-[16px] font-semibold text-[#2D3748] dark:text-white mb-6 transition-colors">Tendência de Receita (12 Meses)</h2>
                <div className="h-[350px]">
                    {chartData && chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDF2F7" className="dark:opacity-10" />
                                <XAxis 
                                    dataKey="month" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#A0AEC0', fontSize: 11 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#A0AEC0', fontSize: 11 }}
                                    tickFormatter={(value) => `MZN ${value}`}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '8px', 
                                        border: '1px solid #E6EAF0', 
                                        backgroundColor: 'var(--tw-backgroundColor-white)',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                                    }}
                                    formatter={(value: any) => [`MZN ${value.toLocaleString()}`, 'Receita']}
                                    itemStyle={{ color: '#2D3748' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="#10B981" 
                                    strokeWidth={2}
                                    fillOpacity={1} 
                                    fill="url(#colorValue)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-[#718096] dark:text-slate-500 space-y-2 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 transition-colors">
                            <CreditCard size={32} className="opacity-20" />
                            <p className="text-[14px]">Nenhum dado de receita disponível no momento.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminMRR;
