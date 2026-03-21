import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit2, 
  Trash2, 
  Calendar,
  Utensils,
  ChevronDown,
  X,
  Save,
  User as UserIcon
} from 'lucide-react';
import { api } from '../../services/api';
const API_URL = import.meta.env.VITE_API_URL || '';
import { ConfirmModal } from '../../components/ConfirmModal';

interface ScannedDish {
  id: string;
  user_id: string;
  dish_name: string;
  image_url: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  scan_source: string;
  created_at: string;
  user_name: string;
  user_email: string;
}

const AdminDishes: React.FC = () => {
  const [dishes, setDishes] = useState<ScannedDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modals
  const [selectedDish, setSelectedDish] = useState<ScannedDish | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    dish_name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

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

  const fetchDishes = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getScannedDishes(search, period);
      setDishes(data);
    } catch (err) {
      console.error('Failed to fetch dishes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchDishes();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search, period]);

  const handleDelete = async (id: string) => {
    setConfirmOptions({
      isOpen: true,
      title: 'Confirmar exclusão',
      message: 'Tem certeza que deseja excluir este prato?',
      type: 'danger',
      confirmText: 'Excluir',
      showCancel: true,
      onConfirm: async () => {
        try {
          await api.admin.deleteScannedDish(id);
          setDishes(prev => prev.filter(d => d.id !== id));
        } catch (err) {
          setConfirmOptions({
            isOpen: true,
            title: 'Erro',
            message: 'Erro ao excluir prato',
            type: 'danger',
            confirmText: 'Fechar',
            showCancel: false,
            onConfirm: async () => {}
          });
        }
      }
    });
  };

  const handleEdit = (dish: ScannedDish) => {
    setSelectedDish(dish);
    setEditFormData({
      dish_name: dish.dish_name,
      calories: dish.calories,
      protein: dish.protein,
      carbs: dish.carbs,
      fat: dish.fat
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDish) return;
    try {
      await api.admin.updateScannedDish(selectedDish.id, editFormData);
      setIsEditModalOpen(false);
      fetchDishes();
    } catch (err) {
      setConfirmOptions({
        isOpen: true,
        title: 'Erro',
        message: 'Erro ao atualizar prato',
        type: 'danger',
        confirmText: 'Fechar',
        showCancel: false,
        onConfirm: async () => {}
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gerenciamento de Pratos Escaneados</h1>
        <p className="text-slate-500 dark:text-slate-400">Visualize e gerencie os alimentos analisados pela IA.</p>
      </div>

      {/* Stats & Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por prato ou usuário..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#38A169] outline-none transition-all dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group">
            <div className="flex items-center gap-2 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl cursor-not-allowed opacity-50">
              <Calendar size={18} className="text-slate-400" />
              <span className="text-sm font-medium dark:text-white">
                {period === 'all' ? 'Todo Período' : period === 'today' ? 'Hoje' : period === 'week' ? 'Esta Semana' : 'Este Mês'}
              </span>
              <ChevronDown size={16} className="text-slate-400" />
            </div>
            {/* Real Select Hidden behind visual UI */}
            <select 
              className="absolute inset-0 opacity-0 cursor-pointer"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="all">Todo Período</option>
              <option value="today">Hoje</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
            </select>
          </div>
          
          <button 
            onClick={() => fetchDishes()}
            className="p-2.5 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Prato</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Macros (C | P | K | F)</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Usuário</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Data da Análise</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8">
                       <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : dishes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    Nenhum prato escaneado encontrado.
                  </td>
                </tr>
              ) : (
                dishes.map((dish) => (
                  <tr key={dish.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                          {dish.image_url ? (
                            <img 
                              src={dish.image_url.startsWith('data:') ? dish.image_url : `${API_URL}${dish.image_url}`} 
                              alt={dish.dish_name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Utensils size={20} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">{dish.dish_name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-tight">{dish.scan_source}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded text-xs font-medium">
                          {dish.calories} kcal
                        </span>
                        <div className="flex gap-1">
                          <span title="Proteínas" className="w-6 h-6 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-[10px] font-bold">P</span>
                          <span title="Carboidratos" className="w-6 h-6 flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-bold">C</span>
                          <span title="Gorduras" className="w-6 h-6 flex items-center justify-center bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded text-[10px] font-bold">F</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <UserIcon size={14} className="text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white leading-none mb-1">{dish.user_name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-none">{dish.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400">{formatDate(dish.created_at)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedDish(dish);
                            setIsDetailsModalOpen(true);
                          }}
                          className="p-2 text-[#718096] dark:text-slate-400 hover:bg-[#EDF2F7] dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title="Ver Detalhes"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleEdit(dish)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(dish.id)}
                          className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {isDetailsModalOpen && selectedDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1A202C] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="relative h-64 bg-slate-100 dark:bg-slate-800">
              {selectedDish.image_url ? (
                <img 
                  src={selectedDish.image_url.startsWith('data:') ? selectedDish.image_url : `${API_URL}${selectedDish.image_url}`} 
                  alt={selectedDish.dish_name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Utensils size={48} />
                </div>
              )}
              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8">
              <div className="mb-6">
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider">
                  Escaneamento IA
                </span>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{selectedDish.dish_name}</h2>
                <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                  <UserIcon size={14} /> {selectedDish.user_name} • {formatDate(selectedDish.created_at)}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-2xl text-center border border-orange-100 dark:border-orange-800/30">
                  <p className="text-[10px] uppercase font-bold text-orange-600/70 dark:text-orange-400/70">Kcal</p>
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{selectedDish.calories}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl text-center border border-blue-100 dark:border-blue-800/30">
                  <p className="text-[10px] uppercase font-bold text-blue-600/70 dark:text-blue-400/70">Prot</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{selectedDish.protein}g</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-2xl text-center border border-emerald-100 dark:border-emerald-800/30">
                  <p className="text-[10px] uppercase font-bold text-emerald-600/70 dark:text-emerald-400/70">Carb</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{selectedDish.carbs}g</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-2xl text-center border border-purple-100 dark:border-purple-800/30">
                  <p className="text-[10px] uppercase font-bold text-purple-600/70 dark:text-purple-400/70">Fat</p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{selectedDish.fat}g</p>
                </div>
              </div>

              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl hover:opacity-90 transition-opacity"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1A202C] w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Editar Informações</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nome do Prato</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#38A169] dark:text-white"
                  value={editFormData.dish_name}
                  onChange={(e) => setEditFormData({...editFormData, dish_name: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Calorias (kcal)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#38A169] dark:text-white"
                    value={editFormData.calories}
                    onChange={(e) => setEditFormData({...editFormData, calories: Number(e.target.value)})}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Proteínas (g)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#38A169] dark:text-white"
                    value={editFormData.protein}
                    onChange={(e) => setEditFormData({...editFormData, protein: Number(e.target.value)})}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Carboidratos (g)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#38A169] dark:text-white"
                    value={editFormData.carbs}
                    onChange={(e) => setEditFormData({...editFormData, carbs: Number(e.target.value)})}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Gorduras (g)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#38A169] dark:text-white"
                    value={editFormData.fat}
                    onChange={(e) => setEditFormData({...editFormData, fat: Number(e.target.value)})}
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-semibold rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-[#38A169] text-white font-semibold rounded-2xl hover:bg-[#2F855A] transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Salvar
                </button>
              </div>
            </form>
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

export default AdminDishes;
