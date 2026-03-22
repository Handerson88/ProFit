import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Calendar, 
  User, 
  Mail, 
  Target, 
  Clock, 
  X,
  RefreshCw,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';

interface Workout {
    id: string;
    user_id: string;
    user_email: string;
    user_name: string;
    goal: string;
    level: string;
    duration: string;
    exercises: any;
    created_at: string;
}

const AdminWorkouts: React.FC = () => {
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
    const [isMigrating, setIsMigrating] = useState(false);

    const fetchWorkouts = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const data = await api.admin.getWorkouts(page, search);
            setWorkouts(data.workouts);
            setTotalPages(data.pages);
        } catch (err) {
            console.error('Failed to fetch workouts:', err);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkouts();
        // Polling every 30s
        const interval = setInterval(() => fetchWorkouts(false), 30000);
        return () => clearInterval(interval);
    }, [page, search]);

    const handleMigrate = async () => {
        setIsMigrating(true);
        try {
            await api.admin.migrateWorkouts();
            fetchWorkouts();
            alert('Migração concluída com sucesso!');
        } catch (err) {
            console.error('Migration failed:', err);
            alert('Falha na migração.');
        } finally {
            setIsMigrating(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Dumbbell className="w-8 h-8 text-emerald-500" />
                        Treinos Gerados por IA
                    </h1>
                    <p className="text-slate-400">Gerencie e visualize todos os treinos criados pelos usuários.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleMigrate}
                        disabled={isMigrating}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isMigrating ? 'animate-spin' : ''}`} />
                        <span>Migrar Treinos Antigos</span>
                    </button>
                    
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                {loading && workouts.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-400">Carregando treinos...</p>
                    </div>
                ) : workouts.length === 0 ? (
                    <div className="p-20 text-center">
                        <Dumbbell className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Nenhum treino gerado ainda</h3>
                        <p className="text-slate-400">Assim que os usuários começarem a treinar, eles aparecerão aqui.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/50">
                                    <th className="px-6 py-4 text-slate-400 font-medium">Usuário</th>
                                    <th className="px-6 py-4 text-slate-400 font-medium">Objetivo</th>
                                    <th className="px-6 py-4 text-slate-400 font-medium">Nível</th>
                                    <th className="px-6 py-4 text-slate-400 font-medium">Data</th>
                                    <th className="px-6 py-4 text-right text-slate-400 font-medium">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {workouts.map((workout) => (
                                    <tr key={workout.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium">{workout.user_name}</div>
                                                    <div className="text-slate-500 text-sm flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {workout.user_email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <Target className="w-4 h-4 text-emerald-500" />
                                                {workout.goal}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">
                                            {workout.level}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-300 flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-slate-500" />
                                                {new Date(workout.created_at).toLocaleDateString('pt-BR')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => setSelectedWorkout(workout)}
                                                className="p-2 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-all"
                                                title="Ver Detalhes"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
                        <p className="text-slate-400 text-sm">
                            Página {page} de {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Detalhes */}
            <AnimatePresence>
                {selectedWorkout && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedWorkout(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Detalhes do Treino</h2>
                                    <p className="text-slate-400 text-sm">{selectedWorkout.user_name} • {selectedWorkout.goal}</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedWorkout(null)}
                                    className="p-2 hover:bg-slate-800 text-slate-400 rounded-full transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-6 bg-slate-950/30">
                                <div className="space-y-6">
                                    {/* Stats Summary */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                                            <div className="text-slate-500 text-xs mb-1 uppercase tracking-wider font-semibold">Nível</div>
                                            <div className="text-white font-medium">{selectedWorkout.level}</div>
                                        </div>
                                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                                            <div className="text-slate-500 text-xs mb-1 uppercase tracking-wider font-semibold">Duração</div>
                                            <div className="text-white font-medium">{selectedWorkout.duration}</div>
                                        </div>
                                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                                            <div className="text-slate-500 text-xs mb-1 uppercase tracking-wider font-semibold">Data</div>
                                            <div className="text-white font-medium">{new Date(selectedWorkout.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>

                                    {/* Exercises List */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                            <Info className="w-5 h-5 text-emerald-500" />
                                            Estrutura do Treino
                                        </h3>
                                        
                                        {/* Dynamic rendering based on structured_plan structure */}
                                        {selectedWorkout.exercises?.days ? (
                                            selectedWorkout.exercises.days.map((day: any, dIndex: number) => (
                                                <div key={dIndex} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                                                    <h4 className="text-emerald-500 font-bold mb-3 flex justify-between">
                                                        <span>{day.title || `Dia ${dIndex + 1}`}</span>
                                                        <span className="text-slate-500 text-xs uppercase font-normal">{day.focus}</span>
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {day.exercises?.map((ex: any, eIndex: number) => (
                                                            <div key={eIndex} className="flex justify-between items-center p-3 bg-slate-800/40 rounded-xl">
                                                                <div>
                                                                    <div className="text-white font-medium">{ex.name}</div>
                                                                    <div className="text-slate-500 text-xs flex items-center gap-2">
                                                                        <span>{ex.sets} séries</span>
                                                                        <span>•</span>
                                                                        <span>{ex.reps}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-emerald-500/80 text-xs font-mono bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10">
                                                                    {ex.rest || '60s'}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-slate-500 italic text-center py-4 bg-slate-900 rounded-2xl">
                                                Estrutura do treino indisponível para este formato antigo.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminWorkouts;
