import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dumbbell, 
  Search, 
  Clock, 
  User, 
  Flame, 
  Calendar,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Zap,
  MoreHorizontal,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');

interface WorkoutSession {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    plan_title: string;
    status: 'active' | 'completed' | 'cancelled';
    workout_type: string;
    workout_day: string;
    start_time: string;
    end_time: string | null;
    duration: number;
    calories: number;
    created_at: string;
}

interface DashboardStats {
    total_today: number;
    active_now: number;
    completed_today: number;
    calories_today: number;
}

const AdminWorkouts: React.FC = () => {
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const [sessionsRes, statsRes] = await Promise.all([
                api.admin.getWorkoutActivity({
                    search,
                    status: statusFilter,
                    type: typeFilter,
                    page,
                    limit: 8
                }),
                api.admin.getWorkoutStats()
            ]);

            setSessions(sessionsRes.data);
            setTotalPages(sessionsRes.pagination.pages);
            setStats(statsRes);
        } catch (err) {
            console.error('Failed to fetch workout data:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [search, statusFilter, typeFilter, page]);

    useEffect(() => {
        fetchData();
        
        // Real-time setup
        socketService.connect();
        socketService.joinAdminRoom();
        
        const handleSessionUpdate = (data: any) => {
            console.log('Real-time session update received:', data);
            fetchData(true); // Refresh data silently
        };

        socketService.on('workout_session_update', handleSessionUpdate);

        const interval = setInterval(() => fetchData(true), 60000); // Less frequent polling since we have real-time
        
        return () => {
            clearInterval(interval);
            socketService.off('workout_session_update', handleSessionUpdate);
        };
    }, [fetchData]);

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'completed':
                return {
                    bg: 'bg-emerald-500/10',
                    text: 'text-emerald-500',
                    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
                    label: 'Concluído'
                };
            case 'active':
                return {
                    bg: 'bg-amber-500/10',
                    text: 'text-amber-500',
                    icon: <Clock className="w-3.5 h-3.5 animate-pulse" />,
                    label: 'Em andamento'
                };
            case 'cancelled':
                return {
                    bg: 'bg-rose-500/10',
                    text: 'text-rose-500',
                    icon: <XCircle className="w-3.5 h-3.5" />,
                    label: 'Cancelado'
                };
            default:
                return {
                    bg: 'bg-slate-500/10',
                    text: 'text-slate-500',
                    icon: <AlertCircle className="w-3.5 h-3.5" />,
                    label: status
                };
        }
    };

    const formatDate = (dateStr: string) => {
        return dayjs(dateStr).format("DD MMM, HH:mm");
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
                            <Dumbbell className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Atividade de Treinos</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Monitore o desempenho e engajamento dos usuários em tempo real</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => fetchData(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Atualizando...' : 'Atualizar'}
                    </button>
                    <button className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95">
                        <ArrowUpRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Treinos Hoje', value: stats?.total_today || 0, icon: <Activity className="w-5 h-5" />, color: 'blue' },
                    { label: 'Ativos Agora', value: stats?.active_now || 0, icon: <Zap className="w-5 h-5" />, color: 'amber' },
                    { label: 'Concluídos Hoje', value: stats?.completed_today || 0, icon: <CheckCircle2 className="w-5 h-5" />, color: 'emerald' },
                    { label: 'Calorias (Hoje)', value: stats?.calories_today || 0, icon: <Flame className="w-5 h-5" />, color: 'rose' },
                ].map((stat, i) => (
                    <motion.div 
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all group"
                    >
                        <div className="flex items-start justify-between">
                            <div className={`p-2.5 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-500 group-hover:scale-110 transition-transform`}>
                                {stat.icon}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Status</span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">{stat.label}</h3>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">{stat.value.toLocaleString()}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Content Card */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-[32px] shadow-sm overflow-hidden flex flex-col">
                {/* Filters Bar */}
                <div className="p-6 border-b border-slate-50 dark:border-slate-700/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar por usuário ou email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:border-emerald-500 rounded-2xl text-sm transition-all outline-none"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                            <option value="all">Todos os Status</option>
                            <option value="active">Em andamento</option>
                            <option value="completed">Concluídos</option>
                            <option value="cancelled">Cancelados</option>
                        </select>

                        <select 
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                            <option value="all">Tipos</option>
                            <option value="IA">Treino IA</option>
                            <option value="Manual">Manual</option>
                        </select>

                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

                        <button className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500/20 transition-all">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-8 space-y-6">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="flex items-center gap-6 animate-pulse">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-2xl" />
                                    <div className="flex-1 space-y-3">
                                        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-1/4" />
                                        <div className="h-3 bg-slate-50 dark:bg-slate-900 rounded w-1/2" />
                                    </div>
                                    <div className="w-24 h-8 bg-slate-100 dark:bg-slate-700 rounded-xl" />
                                </div>
                            ))}
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900/50 rounded-[28px] flex items-center justify-center mb-6">
                                <Activity className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nenhum treino encontrado</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mt-2">
                                Tente ajustar seus filtros para encontrar o que procura.
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/20 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-widest border-b border-slate-50 dark:border-slate-700/50">
                                    <th className="px-6 py-4">Usuário</th>
                                    <th className="px-6 py-4">Plano / Tipo</th>
                                    <th className="px-6 py-4">Início / Duração</th>
                                    <th className="px-6 py-4">Calorias</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                <AnimatePresence mode="popLayout">
                                    {sessions.map((session, index) => {
                                        const status = getStatusStyles(session.status);
                                        return (
                                            <motion.tr 
                                                key={session.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="group hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                                                            {session.user_name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{session.user_name}</div>
                                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{session.user_email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-semibold text-slate-700 dark:text-slate-300 text-sm max-w-[180px] truncate">
                                                            {session.plan_title || 'Plano Personalizado'}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter bg-emerald-500/5 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                                                            {session.workout_type}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium tracking-tight">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {formatDate(session.start_time)}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {session.duration > 0 ? `${session.duration} min` : '--:--'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`p-1 rounded-lg ${session.calories > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 text-slate-400'}`}>
                                                            <Flame className="w-3.5 h-3.5" />
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                                                            {session.calories || 0}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border border-transparent ${status.bg} ${status.text}`}>
                                                        {status.icon}
                                                        {status.label}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {!loading && sessions.length > 0 && (
                    <div className="p-6 bg-slate-50/30 dark:bg-slate-900/10 border-t border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            Página {page} de {totalPages}
                        </div>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-sm"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-sm"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Tip */}
            <div className="flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                <p className="text-xs font-medium italic">Dados sincronizados em tempo real com o servidor</p>
            </div>
        </div>
    );
};

export default AdminWorkouts;

