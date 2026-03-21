import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ChevronRight,
  Info,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { api } from '../../services/api';
import { ConfirmModal } from '../../components/ConfirmModal';

const AdminFoods: React.FC = () => {
    const [foods, setFoods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});
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
        fetchFoods();
    }, []);

    const fetchFoods = async () => {
        try {
            const data = await api.admin.getFoods();
            setFoods(data);
        } catch (err) {
            console.error('Error fetching foods:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (food: any) => {
        setEditingId(food.id);
        setEditForm({ ...food });
    };

    const handleSave = async (id: string) => {
        try {
            await api.admin.updateFood(id, editForm);
            setFoods(foods.map(f => f.id === id ? editForm : f));
            setEditingId(null);
        } catch (err) {
            console.error('Error saving food:', err);
        }
    };

    const handleDelete = async (id: string) => {
        setConfirmOptions({
            isOpen: true,
            title: 'Confirmar exclusão',
            message: 'Tem certeza que deseja excluir este alimento do banco de dados?',
            type: 'danger',
            confirmText: 'Excluir',
            showCancel: true,
            onConfirm: async () => {
                try {
                    await api.admin.deleteFood(id);
                    setFoods(prev => prev.filter(f => f.id !== id));
                } catch (err) {
                    console.error('Error deleting food:', err);
                }
            }
        });
    };

    const filteredFoods = foods.filter(f => 
        f.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-[24px] font-semibold text-[#1A202C] dark:text-white tracking-tight transition-colors">Banco de Alimentos</h1>
                    <p className="text-[14px] text-[#718096] dark:text-slate-400 mt-0.5 transition-colors">Gerencie a base de dados nutricionais do sistema.</p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-[320px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0AEC0] dark:text-slate-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar alimento..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#1E293B] border border-[#E6EAF0] dark:border-[#334155] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#38A169]/10 focus:border-[#38A169] transition-all text-[14px] dark:text-white placeholder:dark:text-slate-600"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1E293B] rounded-[14px] border border-[#E6EAF0] dark:border-[#334155] overflow-hidden shadow-sm transition-colors duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-[#E6EAF0] dark:border-[#334155] transition-colors">
                                <th className="px-6 py-4 text-[12px] font-bold text-[#A0AEC0] dark:text-slate-500 uppercase tracking-wider">Nome</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-[#A0AEC0] dark:text-slate-500 uppercase tracking-wider text-center">Calorias</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-[#A0AEC0] dark:text-slate-500 uppercase tracking-wider text-center">Proteína</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-[#A0AEC0] dark:text-slate-500 uppercase tracking-wider text-center">Carbo</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-[#A0AEC0] dark:text-slate-500 uppercase tracking-wider text-center">Gordura</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-[#A0AEC0] dark:text-slate-500 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F7F9FC] dark:divide-[#334155]">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" /></td>
                                    </tr>
                                ))
                            ) : filteredFoods.map((food) => (
                                <tr key={food.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        {editingId === food.id ? (
                                            <input 
                                                type="text" 
                                                value={editForm.name} 
                                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                                className="w-full px-3 py-1.5 border border-[#38A169] dark:bg-[#0F172A] dark:text-white rounded-[8px] focus:ring-2 focus:ring-[#38A169]/10 text-[14px] outline-none"
                                            />
                                        ) : (
                                            <span className="font-semibold text-[#2D3748] dark:text-white text-[14px] capitalize transition-colors">{food.name}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-[14px] text-[#4A5568] dark:text-slate-300 text-center font-medium transition-colors">
                                        {editingId === food.id ? (
                                            <input 
                                                type="number" 
                                                value={editForm.calories} 
                                                onChange={(e) => setEditForm({...editForm, calories: parseFloat(e.target.value)})}
                                                className="w-20 px-2 py-1 border border-[#E6EAF0] dark:border-slate-700 dark:bg-[#0F172A] dark:text-white rounded-[6px] text-center"
                                            />
                                        ) : `${food.calories}kcal`}
                                    </td>
                                    <td className="px-6 py-4 text-[14px] text-[#4A5568] dark:text-slate-300 text-center transition-colors">
                                        {editingId === food.id ? (
                                            <input 
                                                type="number" 
                                                value={editForm.protein} 
                                                onChange={(e) => setEditForm({...editForm, protein: parseFloat(e.target.value)})}
                                                className="w-20 px-2 py-1 border border-[#E6EAF0] dark:border-slate-700 dark:bg-[#0F172A] dark:text-white rounded-[6px] text-center"
                                            />
                                        ) : `${food.protein}g`}
                                    </td>
                                    <td className="px-6 py-4 text-[14px] text-[#4A5568] dark:text-slate-300 text-center transition-colors">
                                        {editingId === food.id ? (
                                            <input 
                                                type="number" 
                                                value={editForm.carbs} 
                                                onChange={(e) => setEditForm({...editForm, carbs: parseFloat(e.target.value)})}
                                                className="w-20 px-2 py-1 border border-[#E6EAF0] dark:border-slate-700 dark:bg-[#0F172A] dark:text-white rounded-[6px] text-center"
                                            />
                                        ) : `${food.carbs}g`}
                                    </td>
                                    <td className="px-6 py-4 text-[14px] text-[#4A5568] dark:text-slate-300 text-center transition-colors">
                                        {editingId === food.id ? (
                                            <input 
                                                type="number" 
                                                value={editForm.fat} 
                                                onChange={(e) => setEditForm({...editForm, fat: parseFloat(e.target.value)})}
                                                className="w-20 px-2 py-1 border border-[#E6EAF0] dark:border-slate-700 dark:bg-[#0F172A] dark:text-white rounded-[6px] text-center"
                                            />
                                        ) : `${food.fat}g`}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {editingId === food.id ? (
                                                <>
                                                    <button onClick={() => handleSave(food.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-colors">
                                                        <Check size={18} />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors">
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(food)} className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors" title="Editar">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(food.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors" title="Excluir">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

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

export default AdminFoods;
