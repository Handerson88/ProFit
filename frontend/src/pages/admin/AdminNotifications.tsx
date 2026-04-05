import React, { useState, useEffect } from 'react';
import { Send, Users, User, Bell, AlertCircle, CheckCircle2, Layout, ChevronDown, Rocket, Droplets, Utensils, Coffee, Star, ShieldCheck, Zap, Trash2, Clock, Calendar } from 'lucide-react';
import { api } from '../../services/api';

const AdminNotifications: React.FC = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('info');
    const [recipientType, setRecipientType] = useState('all');
    const [specificUserId, setSpecificUserId] = useState('');
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [templates, setTemplates] = useState<any[]>([]);
    const [showTemplates, setShowTemplates] = useState(true);
    const [activeTab, setActiveTab] = useState<'manual' | 'scheduled'>('manual');
    const [scheduledAt, setScheduledAt] = useState('');
    const [scheduledNotifications, setScheduledNotifications] = useState<any[]>([]);

    useEffect(() => {
        fetchTemplates();
        fetchScheduledNotifications();
    }, []);

    const fetchScheduledNotifications = async () => {
        try {
            const data = await api.admin.getScheduledNotifications();
            setScheduledNotifications(data);
        } catch (err) {
            console.error('Error fetching scheduled notifications:', err);
        }
    };

    const fetchTemplates = async () => {
        try {
            const data = await api.admin.getNotificationTemplates();
            setTemplates(data);
        } catch (err) {
            console.error('Error fetching templates:', err);
        }
    };

    const getTemplateIcon = (name: string) => {
        if (!name) return <Bell size={16} />;
        const n = name.toLowerCase();
        if (n.includes('mata-bicho') || n.includes('café')) return <Coffee size={16} />;
        if (n.includes('almoço') || n.includes('jantar')) return <Utensils size={16} />;
        if (n.includes('água') || n.includes('hidratação')) return <Droplets size={16} />;
        if (n.includes('pro')) return <Star size={16} />;
        if (n.includes('engajamento')) return <Rocket size={16} />;
        if (n.includes('reativação')) return <Zap size={16} />;
        return <Bell size={16} />;
    };

    const handleSelectTemplate = (template: any) => {
        setTitle(template.title);
        setMessage(template.message);
        setType(template.type);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setStatus(null);

        try {
            if (activeTab === 'manual') {
                await api.admin.sendAdminNotification({
                    title,
                    message,
                    type,
                    recipientType,
                    userId: recipientType === 'specific' ? specificUserId : null
                });
                setStatus({ type: 'success', message: 'Notificação enviada com sucesso!' });
            } else {
                await api.admin.scheduleAdminNotification({
                    title,
                    message,
                    type,
                    recipientType,
                    userId: recipientType === 'specific' ? specificUserId : null,
                    scheduledAt
                });
                setStatus({ type: 'success', message: 'Notificação agendada com sucesso!' });
                fetchScheduledNotifications();
            }
            // Don't clear Title/Message immediately so user can see what was sent
            setTimeout(() => setStatus(null), 5000);
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: activeTab === 'manual' ? 'Erro ao enviar notificação.' : 'Erro ao agendar notificação.' });
        } finally {
            setSending(false);
        }
    };

    const handleDeleteScheduled = async (id: string) => {
        try {
            await api.admin.deleteScheduledNotification(id);
            fetchScheduledNotifications();
        } catch (err) {
            console.error('Error deleting scheduled notification:', err);
        }
    };

    return (
        <div className="max-w-[1000px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-[32px] font-bold text-[#1A202C] dark:text-white tracking-tight flex items-center gap-3">
                        Push Center <span className="text-[14px] font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30">Live</span>
                    </h1>
                    <p className="text-[16px] text-[#718096] dark:text-slate-400 mt-1 transition-colors">Broadcast em tempo real e engajamento inteligente.</p>
                </div>
                
                <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl">
                   <div 
                    onClick={() => setActiveTab('manual')}
                    className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer transition-all ${activeTab === 'manual' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                   >
                    Manual
                   </div>
                   <div 
                    onClick={() => setActiveTab('scheduled')}
                    className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer transition-all ${activeTab === 'scheduled' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                   >
                    Agendado
                   </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Main Form Section */}
                <div className="lg:col-span-12 space-y-6">
                     {/* Templates Selector */}
                    <div className="bg-[var(--bg-card)] dark:bg-[#1E293B] p-6 rounded-[24px] border border-[#E6EAF0] dark:border-[#334155] shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                    <Layout size={20} />
                                </div>
                                <div>
                                    <h3 className="text-[17px] font-bold text-[#2D3748] dark:text-white">Smart Templates</h3>
                                    <p className="text-[13px] text-[#718096] dark:text-slate-500">Selecione um dos 13 modelos otimizados.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowTemplates(!showTemplates)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <ChevronDown size={20} className={`transition-transform duration-300 ${showTemplates ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {showTemplates && (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 animate-in fade-in zoom-in-95 duration-500">
                                {templates.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => handleSelectTemplate(template)}
                                        className="flex flex-col items-start p-4 bg-slate-50/50 dark:bg-slate-800/40 border border-[#E6EAF0] dark:border-slate-700/50 rounded-[16px] hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all text-left group"
                                    >
                                        <div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-indigo-500 dark:text-indigo-400 mb-3 shadow-soft group-hover:scale-110 transition-transform">
                                            {getTemplateIcon(template.name || template.title)}
                                        </div>
                                        <span className="text-[13px] font-bold text-[#2D3748] dark:text-slate-200 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{template.name || template.title}</span>
                                        <span className="text-[11px] text-[#718096] dark:text-slate-500 line-clamp-1 mt-0.5">{template.title}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Form & Preview */}
                <div className="lg:col-span-7 space-y-6">
                    <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] dark:bg-[#1E293B] p-8 rounded-[24px] border border-[#E6EAF0] dark:border-slate-700/50 shadow-sm space-y-8">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2.5">
                                    <label className="text-[14px] font-semibold text-slate-700 dark:text-slate-300">Título da Notificação</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Ex: Hora do Mata-bicho! ☀️" 
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-[15px] dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-[14px] font-semibold text-slate-700 dark:text-slate-300">Visual / Tipo</label>
                                    <select 
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-[15px] dark:text-white"
                                    >
                                        <option value="info">Informação (Azul)</option>
                                        <option value="success">Sucesso (Verde)</option>
                                        <option value="warning">Alerta (Laranja)</option>
                                        <option value="promotion">Premium (Dourado)</option>
                                        <option value="alert">Crítico (Vermelho)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-[14px] font-semibold text-slate-700 dark:text-slate-300">Corpo da Mensagem</label>
                                <textarea 
                                    required
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Escreva a mensagem personalizada aqui..." 
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-[15px] dark:text-white resize-none"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[14px] font-semibold text-slate-700 dark:text-slate-300">Target Segment (Público-Alvo)</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                    {[
                                        { id: 'all', label: 'Todos', icon: Users },
                                        { id: 'active_subscribers', label: 'Ativos', icon: ShieldCheck },
                                        { id: 'pro_users', label: 'PRO', icon: Star },
                                        { id: 'inactive_users', label: 'Inativos', icon: Zap },
                                        { id: 'specific', label: 'Target', icon: User },
                                    ].map((target) => (
                                        <button 
                                            key={target.id}
                                            type="button"
                                            onClick={() => setRecipientType(target.id)}
                                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-[12px] font-bold ${recipientType === target.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                                        >
                                            <target.icon size={18} />
                                            {target.label}
                                        </button>
                                    ))}
                                </div>

                                {recipientType === 'specific' && (
                                    <div className="animate-in slide-in-from-top-2 duration-300">
                                        <input 
                                            required
                                            type="text" 
                                            value={specificUserId}
                                            onChange={(e) => setSpecificUserId(e.target.value)}
                                            placeholder="Insira o ID ou Email do Usuário..." 
                                            className="w-full px-4 py-3 bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-[14px] dark:text-white"
                                        />
                                    </div>
                                )}
                            </div>

                            {activeTab === 'scheduled' && (
                                <div className="space-y-4 p-5 bg-indigo-50/30 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-[13px] uppercase tracking-wider mb-2">
                                        <Bell size={14} />
                                        Configuração de Agendamento
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[14px] font-semibold text-slate-700 dark:text-slate-300">Data e Hora do Envio</label>
                                        <input 
                                            required={activeTab === 'scheduled'}
                                            type="datetime-local" 
                                            value={scheduledAt}
                                            onChange={(e) => setScheduledAt(e.target.value)}
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-[15px] dark:text-white"
                                        />
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                            <AlertCircle size={10} />
                                            O horário segue o fuso padrão de Maputo (GMT+2)
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {status && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 animate-in zoom-in-95 duration-300 ${status.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20'}`}>
                                {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                <span className="text-[14px] font-bold">{status.message}</span>
                            </div>
                        )}

                        <button 
                            disabled={sending || !title || !message || (activeTab === 'scheduled' && !scheduledAt)}
                            type="submit"
                            className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-4 rounded-xl font-bold text-[16px] flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-100 dark:shadow-none active:scale-[0.98]"
                        >
                            {sending ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    {activeTab === 'manual' ? 'Disparando...' : 'Agendando...'}
                                </div>
                            ) : (
                                <>
                                    {activeTab === 'manual' ? <Send size={20} /> : <Bell size={20} />}
                                    {activeTab === 'manual' ? 'Enviar Agora' : 'Confirmar Agendamento'}
                                </>
                            )}
                        </button>
                    </form>

                    {/* Scheduled List Section */}
                    {scheduledNotifications.length > 0 && (
                        <div className="bg-[var(--bg-card)] dark:bg-[#1E293B] p-6 rounded-[24px] border border-[#E6EAF0] dark:border-slate-700/50 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-[17px] font-bold text-[#2D3748] dark:text-white">Agendamentos Pendentes</h3>
                                        <p className="text-[13px] text-[#718096] dark:text-slate-500">Notificações aguardando disparo automático.</p>
                                    </div>
                                </div>
                                <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[12px] font-bold px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/30">
                                    {scheduledNotifications.length} Ativos
                                </span>
                            </div>

                            <div className="space-y-3">
                                {scheduledNotifications.map((notif) => (
                                    <div key={notif.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-2xl hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                                <Clock size={18} className="text-slate-400 dark:text-slate-500" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-200">{notif.title}</h4>
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                                        {notif.recipient_type === 'all' ? 'Todos' : notif.recipient_type}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[12px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {new Date(notif.scheduled_at).toLocaleString('pt-MZ', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteScheduled(notif.id)}
                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                                            title="Cancelar agendamento"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Live Preview Section */}
                <div className="lg:col-span-5 sticky top-24">
                    <div className="bg-slate-900 rounded-[32px] p-4 shadow-2xl aspect-[9/16] max-w-[320px] mx-auto border-[8px] border-slate-800 relative overflow-hidden group">
                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20"></div>
                        
                        {/* Wallpapaer / Content */}
                        <div className="h-full w-full bg-gradient-to-tr from-indigo-900 via-slate-950 to-slate-900 rounded-[20px] flex flex-col p-6 pt-12 relative overflow-hidden">
                             {/* Floating Glow */}
                             <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
                             
                             <div className="text-white/60 text-[12px] font-medium flex justify-between items-center mb-8">
                                <span>21:30</span>
                                <div className="flex gap-1.5 items-center">
                                    <div className="w-4 h-4 rounded-full border border-white/20"></div>
                                    <div className="w-10 h-3 rounded-full bg-white/20"></div>
                                </div>
                             </div>

                             <div className="flex flex-col items-center mt-12 mb-16 text-center">
                                <div className="w-20 h-20 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 mb-4 animate-bounce duration-1000">
                                    <img src="/logo.png" alt="ProFit" className="w-12 h-12 grayscale opacity-80" />
                                </div>
                                <h2 className="text-white font-bold text-[24px]">ProFit</h2>
                                <p className="text-white/40 text-[13px]">Sua jornada continua</p>
                             </div>

                             {/* The Notification Card */}
                             {(title || message) && (
                                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[20px] p-4 shadow-2xl animate-in slide-in-from-top-8 duration-500 ease-out-expo scale-100 group-hover:scale-105 transition-transform">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
                                                <img src="/logo.png" alt="P" className="w-4 h-4" />
                                            </div>
                                            <span className="text-white text-[11px] font-bold uppercase tracking-wider opacity-80">ProFit</span>
                                        </div>
                                        <span className="text-white/40 text-[10px]">agora</span>
                                    </div>
                                    <h3 className="text-white font-bold text-[14px] leading-tight mb-1">{title || 'Título da Notificação'}</h3>
                                    <p className="text-white/70 text-[12px] leading-snug line-clamp-3">{message || 'O corpo da mensagem aparecerá aqui para você visualizar antes de disparar...'}</p>
                                </div>
                             )}

                             {/* Bottom Indicator */}
                             <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/20 rounded-full"></div>
                        </div>
                    </div>
                    <p className="text-center mt-4 text-[12px] text-slate-500 font-medium tracking-wide uppercase">Preview Mobile em Tempo Real</p>
                </div>
            </div>
        </div>
    );
};

export default AdminNotifications;
