import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Calendar,
  History,
  TrendingUp,
  RefreshCw,
  Database,
  Loader2,
  Info,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { api } from '../../services/api';

type ToastType = { type: 'success' | 'error'; message: string } | null;

const AdminFoods: React.FC = () => {
    const [foods, setFoods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('count');
    const [isMigrating, setIsMigrating] = useState(false);
    const [toast, setToast] = useState<ToastType>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    };

    useEffect(() => {
        fetchFoods();
    }, [searchTerm, sortBy]);

    const fetchFoods = async () => {
        try {
            const data = await api.admin.getAIDetectedFoods(searchTerm, sortBy);
            setFoods(data);
        } catch (err) {
            console.error('Error fetching AI foods:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMigrate = async () => {
        setShowConfirm(false);
        setIsMigrating(true);
        try {
            const res = await api.admin.migrateAIFoods();
            showToast('success', `${res.message || 'Migração concluída'}: ${res.totalIngredients || 0} alimentos processados.`);
            fetchFoods();
        } catch (err: any) {
            console.error('Migration failed:', err);
            showToast('error', err?.message || 'Falha na migração. Verifique os logs do servidor.');
        } finally {
            setIsMigrating(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-[14px] shadow-xl border animate-in slide-in-from-top-4 duration-300 max-w-[400px] ${
                    toast.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/30 dark:border-rose-700 dark:text-rose-300'
                }`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                    <span className="text-[13px] font-medium flex-1">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100 transition-opacity">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Confirm Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-[var(--bg-card)] dark:bg-[#1E293B] rounded-[20px] p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                                <RefreshCw className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-[#1A202C] dark:text-white">Sincronizar Histórico?</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Esta ação pode levar alguns segundos.</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
                            Deseja iniciar a migração de alimentos detectados anteriormente? O banco será atualizado com novos ingredientes.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-2.5 rounded-[10px] text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleMigrate}
                                className="flex-1 py-2.5 rounded-[10px] text-sm font-bold text-white bg-[#38A169] hover:bg-[#2F855A] transition-all"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-[24px] font-bold text-[#1A202C] dark:text-white flex items-center gap-2">
                        <Database className="w-7 h-7 text-[#38A169]" />
                        Memória da IA
                    </h1>
                    <p className="text-[14px] text-[#718096] dark:text-slate-400 mt-1">
                        Visualize todos os alimentos identificados automaticamente pela inteligência artificial.
                    </p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setShowConfirm(true)}
                        disabled={isMigrating}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-[10px] transition-all disabled:opacity-50 text-sm font-medium border border-slate-200 dark:border-slate-700"
                    >
                        {isMigrating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        <span>Sincronizar Histórico</span>
                    </button>
                    
                    <div className="relative flex-1 md:w-[280px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0AEC0] dark:text-slate-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar alimento..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-card)] dark:bg-[#1E293B] border border-[#E6EAF0] dark:border-[#334155] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#38A169]/10 focus:border-[#38A169] transition-all text-[14px] dark:text-white"
                        />
                    </div>

                    <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-2 bg-[var(--bg-card)] dark:bg-[#1E293B] border border-[#E6EAF0] dark:border-[#334155] rounded-[10px] text-sm focus:outline-none dark:text-white"
                    >
                        <option value="count">Mais Detectados</option>
                        <option value="recent">Mais Recentes</option>
                        <option value="oldest">Mais Antigos</option>
                    </select>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="p-5 bg-[var(--bg-card)] dark:bg-[#1E293B] rounded-[16px] border border-[#E6EAF0] dark:border-[#334155] shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-sm text-slate-500 font-medium">Total de Variedades</span>
                    </div>
                    <div className="text-2xl font-bold dark:text-white">{foods.length}</div>
                 </div>
                 <div className="p-5 bg-[var(--bg-card)] dark:bg-[#1E293B] rounded-[16px] border border-[#E6EAF0] dark:border-[#334155] shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <History className="w-5 h-5" />
                        </div>
                        <span className="text-sm text-slate-500 font-medium">Deteções Totais</span>
                    </div>
                    <div className="text-2xl font-bold dark:text-white">
                        {foods.reduce((acc, curr) => acc + curr.count, 0)}
                    </div>
                 </div>
                 <div className="p-5 bg-[var(--bg-card)] dark:bg-[#1E293B] rounded-[16px] border border-[#E6EAF0] dark:border-[#334155] shadow-sm flex items-center gap-3">
                    <Info className="w-5 h-5 text-slate-400 shrink-0" />
                    <p className="text-xs text-slate-500 italic">
                        Este banco cresce automaticamente conforme a IA identifica novos ingredientes nos pratos dos usuários.
                    </p>
                 </div>
            </div>

            {/* Main Table */}
            <div className="bg-[var(--bg-card)] dark:bg-[#1E293B] rounded-[16px] border border-[#E6EAF0] dark:border-[#334155] overflow-hidden shadow-sm transition-colors duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-[#E6EAF0] dark:border-[#334155]">
                                <th className="px-6 py-4 text-[12px] font-bold text-[#A0AEC0] dark:text-slate-500 uppercase tracking-wider">Nome do Alimento</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-[#A0AEC0] dark:text-slate-500 uppercase tracking-wider text-center">Vezes Detectado</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-[#A0AEC0] dark:text-slate-500 uppercase tracking-wider text-right">Última Deteção</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F7F9FC] dark:divide-[#334155]">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={3} className="px-6 py-5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" /></td>
                                    </tr>
                                ))
                            ) : foods.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <Database className="w-12 h-12 opacity-20" />
                                            <p>Nenhum alimento encontrado na memória da IA.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : foods.map((food) => (
                                <tr key={food.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-[#38A169]/40" />
                                            <span className="font-semibold text-[#2D3748] dark:text-white text-[14px] capitalize">{food.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-100 dark:border-emerald-800/50">
                                            <TrendingUp className="w-3 h-3" />
                                            {food.count} detecções
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(food.last_detected_at).toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminFoods;
