import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Ticket, 
    Trash2, 
    CheckCircle, 
    XCircle, 
    Search, 
    BarChart3, 
    TrendingUp, 
    Users,
    Calendar,
    Tag,
    ChevronRight,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

const AdminCoupons = () => {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Form State
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percent',
        discount_value: '',
        max_uses: '',
        expires_at: '',
        influencer_name: '' // For lookup
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [couponsRes, statsRes] = await Promise.all([
                api.coupons.list(),
                api.coupons.getInfluencerStats()
            ]);
            setCoupons(couponsRes);
            setStats(statsRes);
        } catch (error) {
            console.error('Error fetching coupons:', error);
            toast.error('Erro ao carregar cupons');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        const loadingToast = toast.loading('Gerando seu cupom...');
        
        try {
            await api.coupons.create({
                code: formData.code,
                discount_type: formData.discount_type,
                discount_value: parseFloat(formData.discount_value),
                max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
                expires_at: formData.expires_at || null,
                influencer_id: formData.influencer_name || null
            });
            
            toast.success('Cupom ativado com sucesso! 🎉', { id: loadingToast });
            setShowCreateModal(false);
            setFormData({ code: '', discount_type: 'percent', discount_value: '', max_uses: '', expires_at: '', influencer_name: '' });
            fetchData();
        } catch (error: any) {
            console.error('Creation error:', error);
            toast.error(error.message || 'Erro ao criar cupom. Verifique os dados.', { id: loadingToast });
        } finally {
            setIsCreating(false);
        }
    };

    const toggleStatus = async (id: string, current: boolean) => {
        try {
            await api.coupons.toggleStatus(id, !current);
            toast.success(`Cupom ${!current ? 'ativado' : 'desativado'}!`);
            fetchData();
        } catch (error) {
            console.error('Error toggling coupon:', error);
            toast.error('Falha ao atualizar status');
        }
    };

    const filteredCoupons = coupons.filter(c => 
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.influencer_name && c.influencer_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50/30 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Ticket className="text-green-600" size={32} />
                        Gestão de Cupons
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Crie promoções e rastreie o desempenho de influenciadores</p>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                >
                    <Plus size={20} /> Criar Novo Cupom
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                        <TrendingUp size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total de Usos</p>
                        <h3 className="text-2xl font-black text-gray-900 mt-1">
                            {coupons.reduce((acc, c) => acc + (c.used_count || 0), 0)}
                        </h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <Users size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Influenciadores Ativos</p>
                        <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.length}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                        <BarChart3 size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Conversão Média</p>
                        <h3 className="text-2xl font-black text-gray-900 mt-1">12.4%</h3>
                    </div>
                </div>
            </div>

            {/* List & Search */}
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por código ou influenciador..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-green-500/20 text-sm font-medium"
                        />
                    </div>
                    <button 
                        onClick={fetchData}
                        className="p-3 bg-gray-50 text-gray-500 rounded-xl hover:text-gray-900 transition-colors"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Cupom</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Desconto</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Influenciador</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Usos</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Validade</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredCoupons.map((coupon) => (
                                <tr key={coupon.id} className="hover:bg-gray-50/30 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-black text-xs">
                                                {coupon.code.substring(0, 2)}
                                            </div>
                                            <span className="font-black text-gray-900 tracking-wide">{coupon.code}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-black">
                                            <Tag size={12} />
                                            {coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : `${coupon.discount_value} MZN`}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        {coupon.influencer_name ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-[10px] font-black">
                                                    {coupon.influencer_name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-semibold text-gray-700">{coupon.influencer_name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs font-bold text-gray-400 italic">Geral</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase">
                                                <span>{coupon.used_count || 0} usos</span>
                                                {coupon.max_uses && <span>/ {coupon.max_uses}</span>}
                                            </div>
                                            {coupon.max_uses && (
                                                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-black rounded-full" 
                                                        style={{ width: `${Math.min(100, (coupon.used_count / coupon.max_uses) * 100)}%` }} 
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-xs font-bold text-gray-600">
                                            {coupon.expires_at ? dayjs(coupon.expires_at).format('DD/MM/YYYY') : 'Permanente'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <button 
                                            onClick={() => toggleStatus(coupon.id, coupon.active)}
                                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                                                coupon.active 
                                                ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                                            }`}
                                        >
                                            {coupon.active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                            {coupon.active ? 'Ativo' : 'Inativo'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-5">
                                        <button className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Criar Cupom */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pb-20">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCreateModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
                        >
                            <div className="p-10">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-black text-gray-900">Novo Benefício Promocional</h2>
                                    <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-900">
                                        <XCircle size={24} />
                                    </button>
                                </div>

                                <form onSubmit={handleCreate} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Código do Cupom</label>
                                            <input 
                                                required
                                                type="text"
                                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-black uppercase tracking-widest text-gray-900 focus:ring-2 focus:ring-green-500/20"
                                                placeholder="EX: PROFIT10"
                                                value={formData.code}
                                                onChange={(e) => setFormData({...formData, code: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Desconto</label>
                                            <select 
                                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-black text-gray-900 focus:ring-2 focus:ring-green-500/20"
                                                value={formData.discount_type}
                                                onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                                            >
                                                <option value="percent">Porcentagem (%)</option>
                                                <option value="fixed">Valor Fixo (MZN)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor do Desconto</label>
                                            <input 
                                                required
                                                type="number"
                                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-green-500/20"
                                                placeholder="Ex: 10"
                                                value={formData.discount_value}
                                                onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Limite Global de Usos</label>
                                            <input 
                                                type="number"
                                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-green-500/20"
                                                placeholder="Opcional"
                                                value={formData.max_uses}
                                                onChange={(e) => setFormData({...formData, max_uses: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Validade</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input 
                                                    type="date"
                                                    className="w-full pl-12 pr-5 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-green-500/20"
                                                    value={formData.expires_at}
                                                    onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ID do Influenciador</label>
                                            <div className="relative">
                                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input 
                                                    type="text"
                                                    className="w-full pl-12 pr-5 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-green-500/20"
                                                    placeholder="UUID ou Nome"
                                                    value={formData.influencer_name}
                                                    onChange={(e) => setFormData({...formData, influencer_name: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        type="submit"
                                        disabled={isCreating}
                                        className="w-full bg-black text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest mt-6 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isCreating ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Gerando...
                                            </>
                                        ) : (
                                            'Gerar Cupom Agora'
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminCoupons;
