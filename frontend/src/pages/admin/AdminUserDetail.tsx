import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Mail, 
  User, 
  Activity, 
  Dumbbell, 
  Utensils, 
  Target, 
  Flame, 
  CheckCircle, 
  Ban,
  Clock,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';

const AdminUserDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserDetails();
    }, [id]);

    const fetchUserDetails = async () => {
        try {
            const result = await api.admin.getUser(id!);
            setData(result);
        } catch (err) {
            console.error('Error fetching user details:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#38A169]"></div>
            </div>
        );
    }

    if (!data) return <div>Usuário não encontrado.</div>;

    const { user, stats, plans, history } = data;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate('/admin/users')}
                    className="p-2.5 bg-white dark:bg-[#1E293B] border border-[#E6EAF0] dark:border-[#334155] rounded-xl text-[#718096] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#2D3748] dark:hover:text-white transition-all shadow-sm"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-[24px] font-semibold text-[#1A202C] dark:text-white tracking-tight transition-colors">Perfil do Usuário</h1>
                    <p className="text-[14px] text-[#718096] dark:text-slate-400">ID: {user.id}</p>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-[#1E293B] rounded-[24px] border border-[#E6EAF0] dark:border-[#334155] p-8 shadow-sm transition-colors duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-md flex items-center justify-center text-3xl font-black text-[#2D3748] dark:text-white mb-4 overflow-hidden ring-4 ring-[#F7FAFC] dark:ring-slate-800/10">
                                {user.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <h2 className="text-[20px] font-bold text-[#2D3748] dark:text-white mb-1 transition-colors">{user.name || 'Usuário Sem Nome'}</h2>
                            <div className="flex items-center gap-2 text-[#718096] dark:text-slate-400 text-[14px] mb-4 transition-colors">
                                <Mail size={14} />
                                {user.email}
                            </div>
                            
                            <div className={`px-4 py-1.5 rounded-full text-[13px] font-semibold border ${user.status === 'blocked' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'} transition-colors`}>
                                {user.status === 'blocked' ? 'Acesso Bloqueado' : 'Acesso Ativo'}
                            </div>
                        </div>

                        <div className="mt-10 space-y-4 pt-8 border-t border-[#F7FAFC] dark:border-slate-800 transition-colors">
                            <div className="flex items-center justify-between text-[14px]">
                                <span className="text-[#A0AEC0] dark:text-slate-500 flex items-center gap-2 font-medium"><Calendar size={16} /> Cadastro</span>
                                <span className="text-[#2D3748] dark:text-slate-200 font-bold">{new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center justify-between text-[14px]">
                                <span className="text-[#A0AEC0] dark:text-slate-500 flex items-center gap-2 font-medium"><User size={16} /> Gênero</span>
                                <span className="text-[#2D3748] dark:text-slate-200 font-bold capitalize">{user.gender || 'Não informado'}</span>
                            </div>
                            <div className="flex items-center justify-between text-[14px]">
                                <span className="text-[#A0AEC0] dark:text-slate-500 flex items-center gap-2 font-medium"><Clock size={16} /> Idade</span>
                                <span className="text-[#2D3748] dark:text-slate-200 font-bold">{user.age || '--'} anos</span>
                            </div>
                            <div className="flex items-center justify-between text-[14px]">
                                <span className="text-[#A0AEC0] dark:text-slate-500 flex items-center gap-2 font-medium"><Target size={16} /> Objetivo</span>
                                <span className="text-[#2D3748] dark:text-slate-200 font-bold capitalize">{user.goal || 'Fibrado'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#F0F9FF] dark:bg-blue-900/20 border border-[#E0F2FE] dark:border-blue-800/30 p-4 rounded-2xl transition-colors duration-300">
                           <p className="text-[11px] font-black text-[#0369A1] dark:text-blue-400 uppercase tracking-wider mb-1">Refeições</p>
                           <p className="text-[24px] font-black text-[#0369A1] dark:text-blue-300">{stats.totalMeals}</p>
                        </div>
                        <div className="bg-[#F0FDF4] dark:bg-emerald-900/20 border border-[#DCFCE7] dark:border-emerald-800/30 p-4 rounded-2xl transition-colors duration-300">
                           <p className="text-[11px] font-black text-[#15803D] dark:text-emerald-400 uppercase tracking-wider mb-1">Calorias (Σ)</p>
                           <p className="text-[24px] font-black text-[#15803D] dark:text-emerald-300">{stats.totalCalories.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Areas */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Metrics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-[#1E293B] rounded-[24px] border border-[#E6EAF0] dark:border-[#334155] p-6 shadow-sm flex items-center gap-5 transition-colors duration-300">
                            <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center text-orange-500 dark:text-orange-400">
                                <Flame size={28} />
                            </div>
                            <div>
                                <p className="text-[12px] font-bold text-[#A0AEC0] dark:text-slate-500 uppercase tracking-widest transition-colors">Planos de Treino</p>
                                <p className="text-[24px] font-black text-[#2D3748] dark:text-white transition-colors">{plans.length}</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#1E293B] rounded-[24px] border border-[#E6EAF0] dark:border-[#334155] p-6 shadow-sm flex items-center gap-5 transition-colors duration-300">
                            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                                <TrendingUp size={28} />
                            </div>
                            <div>
                                <p className="text-[12px] font-bold text-[#A0AEC0] dark:text-slate-500 uppercase tracking-widest transition-colors">Fotos Escaneadas</p>
                                <p className="text-[24px] font-black text-[#2D3748] dark:text-white transition-colors">{stats.totalScans}</p>
                            </div>
                        </div>
                    </div>

                    {/* Activity History */}
                    <div className="bg-white dark:bg-[#1E293B] rounded-[24px] border border-[#E6EAF0] dark:border-[#334155] shadow-sm overflow-hidden flex flex-col h-full min-h-[500px] transition-colors duration-300">
                        <div className="p-6 border-b border-[#F7FAFC] dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/30 transition-colors">
                            <h3 className="text-[16px] font-bold text-[#2D3748] dark:text-white transition-colors">Histórico de Atividade Recente</h3>
                            <Award className="text-[#A0AEC0] dark:text-slate-500" size={20} />
                        </div>
                        <div className="flex-1 overflow-y-auto max-h-[600px] p-6">
                            <div className="space-y-6">
                                {history.length > 0 ? history.map((item: any, idx: number) => (
                                    <div key={idx} className="flex gap-4 relative">
                                        {idx !== history.length - 1 && (
                                            <div className="absolute left-6 top-10 bottom-[-20px] w-0.5 bg-[#F1F5F9] dark:bg-slate-800" />
                                        )}
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 z-10 ${item.type === 'meal' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'} transition-colors`}>
                                            {item.type === 'meal' ? <Utensils size={20} /> : <Dumbbell size={20} />}
                                        </div>
                                        <div className="flex-1 pt-1 pb-4">
                                            <div className="flex justify-between mb-1">
                                                <h4 className="font-bold text-[#2D3748] dark:text-white text-[14px] transition-colors">{item.title}</h4>
                                                <span className="text-[12px] text-[#A0AEC0] dark:text-slate-500 font-medium transition-colors">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                            <p className="text-[13px] text-[#718096] dark:text-slate-400 transition-colors">
                                                {item.type === 'meal' ? `${item.info} kcal detectadas` : `Iniciou plano de ${item.info}`}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-20 text-[#A0AEC0] dark:text-slate-600 transition-colors">
                                        Nenhuma atividade registrada recentemente.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminUserDetail;
