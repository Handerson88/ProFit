import React, { useEffect, useState } from 'react';
import { API_URL } from '../../services/api';
import { 
  Dumbbell, 
  Calendar, 
  User, 
  ChevronRight,
  Filter,
  Search,
  ExternalLink
} from 'lucide-react';

const AdminPlans: React.FC = () => {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/admin/plans`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                setPlans(data);
            } catch (err) {
                console.error('Error fetching plans:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-[24px] font-semibold text-[#1A202C] dark:text-white tracking-tight transition-colors">Planos de Treino Gerados</h1>
                    <p className="text-[14px] text-[#718096] dark:text-slate-400 mt-0.5 transition-colors">Histórico de planos criados pela IA para os usuários.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-[var(--bg-card)] dark:bg-[#1E293B] rounded-[14px] border border-[#E6EAF0] dark:border-[#334155] animate-pulse" />
                    ))
                ) : plans.map((plan) => (
                    <div key={plan.id} className="bg-[var(--bg-card)] dark:bg-[#1E293B] p-5 rounded-[14px] border border-[#E6EAF0] dark:border-[#334155] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-sm dark:hover:bg-[#243147] transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#EDF2F7] dark:bg-slate-800 text-[#2D3748] dark:text-white rounded-[10px] flex items-center justify-center border border-[#E2E8F0] dark:border-slate-700 transition-colors">
                                <Dumbbell size={24} />
                            </div>
                            <div>
                                <h3 className="text-[16px] font-semibold text-[#2D3748] dark:text-white capitalize leading-tight transition-colors">{plan.goal}</h3>
                                <div className="flex items-center gap-4 mt-1.5 ">
                                    <span className="flex items-center gap-1.5 text-[13px] text-[#718096] dark:text-slate-400">
                                        <User size={14} className="text-[#A0AEC0] dark:text-slate-600" /> {plan.user_name}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-[13px] text-[#718096] dark:text-slate-400">
                                        <Calendar size={14} className="text-[#A0AEC0] dark:text-slate-600" /> {new Date(plan.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-8">
                            <div className="text-center hidden md:block">
                                <p className="text-[11px] text-[#A0AEC0] dark:text-slate-500 uppercase font-bold tracking-wider">Nível</p>
                                <p className="text-[13px] font-semibold text-[#4A5568] dark:text-slate-300 transition-colors">{plan.level}</p>
                            </div>
                            <div className="text-center hidden md:block">
                                <p className="text-[11px] text-[#A0AEC0] dark:text-slate-500 uppercase font-bold tracking-wider">Frequência</p>
                                <p className="text-[13px] font-semibold text-[#4A5568] dark:text-slate-300 transition-colors">{plan.days_per_week} dias/sem</p>
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 text-[#4A5568] dark:text-slate-300 rounded-[8px] hover:bg-[#38A169] dark:hover:bg-[#38A169] hover:text-white transition-all text-[13px] font-semibold border border-[#E6EAF0] dark:border-[#334155]">
                                <span>Ver Detalhes</span>
                                <ExternalLink size={14} />
                            </button>
                        </div>
                    </div>
                ))}

                {!loading && plans.length === 0 && (
                    <div className="p-12 text-center bg-[var(--bg-card)] dark:bg-[#1E293B] rounded-[14px] border border-dashed border-[#E6EAF0] dark:border-[#334155] text-[#718096] dark:text-slate-500 transition-colors">
                        <p className="text-[14px]">Nenhum plano de treino gerado ainda.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPlans;
