import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  User, 
  Settings,
  Clock,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

const AdminLogs: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = localStorage.getItem('token');
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const response = await fetch(`${apiUrl}/api/admin/logs`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                setLogs(data.adminLogs);
            } catch (err) {
                console.error('Error fetching logs:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const getActionColor = (action: string) => {
        if (action.includes('excluído') || action.includes('removido')) return 'text-rose-600 bg-rose-50';
        if (action.includes('editado') || action.includes('atualizado')) return 'text-amber-600 bg-amber-50';
        if (action.includes('Login')) return 'text-emerald-600 bg-emerald-50';
        return 'text-blue-600 bg-blue-50';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-[24px] font-semibold text-[#1A202C] dark:text-white tracking-tight transition-colors">Logs de Auditoria</h1>
                <p className="text-[14px] text-[#718096] dark:text-slate-400 mt-0.5 transition-colors">Histórico detalhado de todas as ações administrativas realizadas no sistema.</p>
            </div>

            <div className="bg-[var(--bg-card)] dark:bg-[#1E293B] rounded-[14px] border border-[#E6EAF0] dark:border-[#334155] overflow-hidden shadow-sm transition-colors duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-[#E6EAF0] dark:border-[#334155] transition-colors">
                                <th className="px-6 py-4 text-[12px] font-bold text-[#A0AEC0] dark:text-slate-500 uppercase tracking-wider">Data / Hora</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-[#A0AEC0] dark:text-slate-500 uppercase tracking-wider">Administrador</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-[#A0AEC0] dark:text-slate-500 uppercase tracking-wider text-center">Ação</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-[#A0AEC0] dark:text-slate-500 uppercase tracking-wider">Recurso</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-[#A0AEC0] dark:text-slate-500 uppercase tracking-wider text-right">ID Alvo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F7F9FC] dark:divide-[#334155]">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" /></td>
                                    </tr>
                                ))
                            ) : logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-[14px] text-[#4A5568] dark:text-slate-300 transition-colors">
                                            <Clock size={14} className="text-[#A0AEC0] dark:text-slate-500" />
                                            {new Date(log.created_at).toLocaleString('pt-BR')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 font-semibold text-[#2D3748] dark:text-white text-[14px] transition-colors">
                                            <ShieldCheck size={14} className="text-[#38A169]" />
                                            {log.admin_email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold uppercase tracking-wider ${getActionColor(log.action)} dark:bg-opacity-10 transition-colors`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-[13px] text-[#718096] dark:text-slate-400 capitalize font-medium transition-colors">
                                            {log.target_type === 'user' && <User size={14} className="text-[#A0AEC0] dark:text-slate-500" />}
                                            {log.target_type === 'food' && <Activity size={14} className="text-[#A0AEC0] dark:text-slate-500" />}
                                            {log.target_type === 'auth' && <Settings size={14} className="text-[#A0AEC0] dark:text-slate-500" />}
                                            {log.target_type}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <code className="text-[12px] bg-[#F7F9FC] dark:bg-[#0F172A] px-2 py-0.5 border border-[#E6EAF0] dark:border-[#334155] rounded-[4px] text-[#718096] dark:text-slate-500 font-mono transition-colors">
                                            {log.target_id?.substring(0, 8)}...
                                        </code>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {!loading && logs.length === 0 && (
                    <div className="p-12 text-center text-[#718096] dark:text-slate-500 transition-colors">
                        <p className="text-[14px]">Nenhum log de auditoria disponível.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminLogs;
