import React, { useEffect, useState } from 'react';
import { 
  Search, 
  MoreVertical, 
  Eye, 
  Trash2, 
  Ban, 
  CheckCircle,
  Clock,
  Mail,
  Filter,
  UserX,
  UserCheck,
  X,
  Crown,
  User,
  UserPlus,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConfirmModal } from '../../components/ConfirmModal';
import { api } from '../../services/api';

const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [activities, setActivities] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    
    // Modals
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [newLimit, setNewLimit] = useState(3);
    
    // Invite Form
    const [inviteForm, setInviteForm] = useState({ name: '', email: '', limit: 3 });
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

    const navigate = useNavigate();

    const [confirmOptions, setConfirmOptions] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'danger' as 'danger' | 'warning' | 'info' | 'success',
        confirmText: 'OK',
        showCancel: false,
        onConfirm: async () => {}
    });

    const closeConfirm = () => setConfirmOptions(prev => ({ ...prev, isOpen: false }));

    useEffect(() => {
        fetchUsers();
        fetchActivities();

        const interval = setInterval(fetchActivities, 30000); // 30s
        return () => clearInterval(interval);
    }, []);

    const fetchActivities = async () => {
        try {
            const data = await api.admin.getUsersActivity();
            const activityMap: Record<string, any> = {};
            data.forEach((a: any) => {
                activityMap[a.id] = a;
            });
            setActivities(activityMap);
        } catch (err) {
            console.error('Error fetching activities:', err);
        }
    };

    const fetchUsers = async () => {
        try {
            const data = await api.admin.getUsers();
            setUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setConfirmOptions({
            isOpen: true,
            title: 'Confirmar exclusão',
            message: 'Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.',
            type: 'danger',
            confirmText: 'Excluir',
            showCancel: true,
            onConfirm: async () => {
                try {
                    await api.admin.deleteUser(id);
                    setUsers(prev => prev.filter(u => u.id !== id));
                } catch (err) {
                    console.error('Error deleting user:', err);
                }
            }
        });
    };

    const handleUpdateLimit = async () => {
        if (!selectedUser) return;
        try {
            await api.admin.updateUserScanLimit(selectedUser.id, newLimit);
            fetchUsers();
            setIsLimitModalOpen(false);
        } catch (err) {
            console.error('Error updating limit:', err);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = await api.admin.inviteUser({ 
                name: inviteForm.name, 
                email: inviteForm.email, 
                scan_limit: inviteForm.limit 
            });
            setInviteSuccess(data.inviteLink);
            fetchUsers();
        } catch (err) {
            console.error('Error sending invite:', err);
        }
    };

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-[24px] font-semibold text-[#1A202C] dark:text-white tracking-tight transition-colors">Gerenciamento de Usuários</h1>
                    <p className="text-[14px] text-[#718096] dark:text-slate-400 mt-0.5 transition-colors">Visualize e gerencie as contas e limites dos usuários.</p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-[280px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0AEC0] dark:text-slate-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#1E293B] border border-[#E6EAF0] dark:border-[#334155] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#38A169]/10 transition-all text-[14px] dark:text-white"
                        />
                    </div>
                    <button 
                        onClick={() => {
                            setInviteForm({ name: '', email: '', limit: 3 });
                            setInviteSuccess(null);
                            setIsInviteModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#38A169] text-white rounded-[10px] text-[14px] font-semibold hover:bg-[#2F855A] transition-colors shadow-sm"
                    >
                        <UserPlus size={18} />
                        <span>Convidar</span>
                    </button>
                    <button className="p-2 bg-white dark:bg-[#1E293B] border border-[#E6EAF0] dark:border-[#334155] rounded-[10px] text-[#718096] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1E293B] rounded-[14px] border border-[#E6EAF0] dark:border-[#334155] overflow-hidden shadow-sm transition-colors duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-[#E6EAF0] dark:border-[#334155] transition-colors">
                                <th className="px-6 py-4 text-[12px] font-bold text-[#A0AEC0] dark:text-slate-500 uppercase tracking-wider">Usuário</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-[#A0AEC0] dark:text-slate-500 uppercase tracking-wider text-center">Status / Plano</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-[#A0AEC0] dark:text-slate-500 uppercase tracking-wider text-center">Referência</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-[#A0AEC0] dark:text-slate-500 uppercase tracking-wider">Atividade</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-[#A0AEC0] dark:text-slate-500 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F7F9FC] dark:divide-[#334155]">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" /></td>
                                    </tr>
                                ))
                            ) : filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-[#EDF2F7] dark:bg-slate-800 flex items-center justify-center text-[#2D3748] dark:text-white font-bold text-[13px] border border-[#E2E8F0] dark:border-slate-700">
                                                {user.name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-[#2D3748] dark:text-white text-[14px]">{user.name || 'Sem Nome'}</div>
                                                <div className="text-[12px] text-[#718096] dark:text-slate-400">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center gap-1.5">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                user.is_active ? 'bg-[#E6FFFA] text-[#319795]' : 'bg-[#FFF5F5] text-[#E53E3E]'
                                            }`}>
                                                {user.is_active ? 'Ativo' : 'Bloqueado'}
                                            </span>
                                            {user.is_active && !user.onboarding_completed && (
                                                <span className="text-[9px] text-amber-600 font-bold uppercase tracking-tighter">
                                                    Onboarding Pendente
                                                </span>
                                            )}
                                            {user.has_paid && (
                                                <span className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                                                    <Crown size={10} />
                                                    ELITE
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {user.referrer_name ? (
                                            <div className="flex flex-col items-center">
                                                <span className="text-[12px] font-semibold text-gray-700 dark:text-slate-300">{user.referrer_name}</span>
                                                <span className="text-[10px] text-gray-400">Padrinho</span>
                                            </div>
                                        ) : (
                                            <span className="text-[11px] text-gray-300 font-medium">Direto</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {activities[user.id] ? (
                                            <div className="flex items-center gap-2 font-medium">
                                                <div className={`w-2 h-2 rounded-full ${
                                                    activities[user.id].tempo_formatado === 'Online agora' ? 'bg-emerald-500 animate-pulse' :
                                                    activities[user.id].last_active_at && new Date(activities[user.id].last_active_at) > new Date(Date.now() - 3600000) ? 'bg-amber-500' :
                                                    'bg-rose-500'
                                                }`} />
                                                <span className="text-[13px] dark:text-slate-300">
                                                    {activities[user.id].tempo_formatado}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-[#A0AEC0] text-[13px]">Nunca ativo</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setNewLimit(user.scan_limit_per_day);
                                                    setIsLimitModalOpen(true);
                                                }}
                                                className="p-1.5 text-[#3182CE] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors" 
                                                title="Gerenciar Limites"
                                            >
                                                <Settings size={16} />
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        await api.admin.toggleUserStatus(user.id, !user.is_active);
                                                        fetchUsers();
                                                    } catch (err) {
                                                        console.error('Error toggling status:', err);
                                                    }
                                                }}
                                                className={`p-1.5 rounded-md transition-colors ${user.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                                title={user.is_active ? 'Bloquear' : 'Desbloquear'}
                                            >
                                                {user.is_active ? <Ban size={16} /> : <UserCheck size={16} />}
                                            </button>
                                            <button 
                                                onClick={() => navigate(`/admin/users/${user.id}`)}
                                                className="p-1.5 text-[#4A5568] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors" 
                                                title="Ver Perfil"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(user.id)}
                                                className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors" 
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Limites */}
            {isLimitModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-[20px] shadow-2xl p-6 border border-[#E6EAF0] dark:border-[#334155]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-[#1A202C] dark:text-white">Gerenciar Limites</h2>
                            <button onClick={() => setIsLimitModalOpen(false)} className="text-[#A0AEC0] hover:text-gray-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Limite de scans por dia</label>
                                <select 
                                    value={newLimit}
                                    onChange={(e) => setNewLimit(parseInt(e.target.value))}
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#38A169]/20"
                                >
                                    <option value={3}>3 scans (Padrão)</option>
                                    <option value={5}>5 scans</option>
                                    <option value={10}>10 scans</option>
                                    <option value={20}>20 scans</option>
                                    <option value={-1}>Ilimitado</option>
                                </select>
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button 
                                    onClick={() => setIsLimitModalOpen(false)}
                                    className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-[#4A5568] dark:text-slate-400 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleUpdateLimit}
                                    className="flex-1 py-3 bg-[#38A169] text-white font-bold rounded-xl hover:bg-[#2F855A] shadow-md transition-all active:scale-95"
                                >
                                    Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Convite */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-[20px] shadow-2xl p-6 border border-[#E6EAF0] dark:border-[#334155]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-[#1A202C] dark:text-white">Convidar Novo Usuário</h2>
                            <button onClick={() => setIsInviteModalOpen(false)} className="text-[#A0AEC0] hover:text-gray-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        {!inviteSuccess ? (
                            <form onSubmit={handleInvite} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Nome Completo</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={inviteForm.name}
                                        onChange={(e) => setInviteForm({...inviteForm, name: e.target.value})}
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#38A169]/20"
                                        placeholder="Digite o nome do usuário"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Email</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={inviteForm.email}
                                        onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#38A169]/20"
                                        placeholder="email@exemplo.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Limite de Scans</label>
                                    <select 
                                        value={inviteForm.limit}
                                        onChange={(e) => setInviteForm({...inviteForm, limit: parseInt(e.target.value)})}
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#38A169]/20"
                                    >
                                        <option value={3}>3 scans (Padrão)</option>
                                        <option value={5}>5 scans</option>
                                        <option value={10}>10 scans</option>
                                        <option value={-1}>Ilimitado</option>
                                    </select>
                                </div>
                                
                                <div className="pt-4">
                                    <button 
                                        type="submit"
                                        className="w-full py-3 bg-[#38A169] text-white font-bold rounded-xl hover:bg-[#2F855A] shadow-md transition-all active:scale-95"
                                    >
                                        Enviar Convite
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="text-center py-4 space-y-4">
                                <div className="w-16 h-16 bg-[#F0F9EB] text-[#38A169] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="font-bold text-lg">Convite Gerado!</h3>
                                <p className="text-sm text-gray-600 dark:text-slate-400">
                                    O convite foi gerado. Copie o link abaixo para enviar manualmente caso o e-mail atrase.
                                </p>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 break-all text-xs font-mono">
                                    {inviteSuccess}
                                </div>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(inviteSuccess);
                                        setConfirmOptions({
                                            isOpen: true,
                                            title: 'Sucesso',
                                            message: 'Link copiado!',
                                            type: 'success',
                                            confirmText: 'OK',
                                            showCancel: false,
                                            onConfirm: async () => {}
                                        });
                                    }}
                                    className="w-full py-3 bg-[#E6FFFA] text-[#38A169] font-bold rounded-xl hover:bg-[#B2F5EA] transition-colors"
                                >
                                    Copiar Link
                                </button>
                                <button 
                                    onClick={() => setIsInviteModalOpen(false)}
                                    className="w-full py-3 text-gray-500 font-semibold"
                                >
                                    Fechar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <ConfirmModal 
                isOpen={confirmOptions.isOpen}
                onClose={closeConfirm}
                title={confirmOptions.title}
                message={confirmOptions.message}
                type={confirmOptions.type}
                confirmText={confirmOptions.confirmText}
                showCancel={confirmOptions.showCancel}
                onConfirm={confirmOptions.onConfirm}
            />
        </div>
    );
};

export default AdminUsers;
