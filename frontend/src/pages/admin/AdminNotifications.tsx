import React, { useState, useEffect } from 'react';
import { Send, Users, User, Bell, AlertCircle, CheckCircle2, Layout, ChevronDown } from 'lucide-react';

const AdminNotifications: React.FC = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('info');
    const [recipientType, setRecipientType] = useState('all');
    const [specificUserId, setSpecificUserId] = useState('');
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [templates, setTemplates] = useState<any[]>([]);
    const [showTemplates, setShowTemplates] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://127.0.0.1:5000/api/admin/notifications/templates', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setTemplates(data);
        } catch (err) {
            console.error('Error fetching templates:', err);
        }
    };

    const handleSelectTemplate = (template: any) => {
        setTitle(template.title);
        setMessage(template.message);
        setType(template.type);
        setShowTemplates(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setStatus(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://127.0.0.1:5000/api/admin/notifications/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    message,
                    type,
                    recipientType,
                    userId: recipientType === 'specific' ? specificUserId : null
                })
            });

            if (response.ok) {
                setStatus({ type: 'success', message: 'Notificação enviada com sucesso para os usuários!' });
                setTitle('');
                setMessage('');
            } else {
                setStatus({ type: 'error', message: 'Erro ao enviar notificação. Tente novamente.' });
            }
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: 'Erro de conexão com o servidor.' });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-[800px] space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-[24px] font-semibold text-[#1A202C] dark:text-white tracking-tight transition-colors">Sistema de Notificações</h1>
                <p className="text-[14px] text-[#718096] dark:text-slate-400 mt-0.5 transition-colors">Envie mensagens em tempo real para os usuários do aplicativo.</p>
            </div>

            {/* Template Selection */}
            <div className="bg-white dark:bg-[#1E293B] p-6 rounded-[16px] border border-[#E6EAF0] dark:border-[#334155] shadow-sm space-y-4 transition-colors duration-300">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <Layout size={20} />
                        </div>
                        <div>
                            <h3 className="text-[15px] font-semibold text-[#2D3748] dark:text-white transition-colors">Templates de Notificação</h3>
                            <p className="text-[12px] text-[#718096] dark:text-slate-500">Escolha uma mensagem pré-definida para agilizar o envio.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowTemplates(!showTemplates)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-[#E6EAF0] dark:border-[#334155] rounded-lg text-[13px] font-medium text-[#4A5568] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    >
                        {showTemplates ? 'Ocultar Templates' : 'Ver Templates'}
                        <ChevronDown size={14} className={`transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {showTemplates && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-in slide-in-from-top-2 duration-300">
                        {templates.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => handleSelectTemplate(template)}
                                className="flex flex-col items-start p-3 bg-white dark:bg-[#0F172A]/50 border border-[#E6EAF0] dark:border-[#334155] rounded-[12px] hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all text-left group"
                            >
                                <span className="text-[13px] font-bold text-[#2D3748] dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{template.name}</span>
                                <span className="text-[11px] text-[#718096] dark:text-slate-500 line-clamp-1 mt-1">{template.title}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1E293B] p-8 rounded-[16px] border border-[#E6EAF0] dark:border-[#334155] shadow-sm space-y-6 transition-colors duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[14px] font-medium text-[#4A5568] dark:text-slate-300 transition-colors">Título da Notificação</label>
                        <input 
                            required
                            type="text" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Novo Pacote de Treino Disponível!" 
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0F172A]/50 border border-[#E6EAF0] dark:border-[#334155] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#38A169]/10 focus:border-[#38A169] transition-all text-[14px] dark:text-white placeholder:dark:text-slate-600"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[14px] font-medium text-[#4A5568] dark:text-slate-300 transition-colors">Tipo</label>
                        <select 
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0F172A]/50 border border-[#E6EAF0] dark:border-[#334155] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#38A169]/10 focus:border-[#38A169] transition-all text-[14px] dark:text-white"
                        >
                            <option value="info">Informação (Azul)</option>
                            <option value="update">Atualização (Verde)</option>
                            <option value="promotion">Promoção (Laranja)</option>
                            <option value="alert">Alerta (Vermelho)</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[14px] font-medium text-[#4A5568] dark:text-slate-300 transition-colors">Mensagem</label>
                    <textarea 
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Descreva o conteúdo da notificação..." 
                        rows={4}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0F172A]/50 border border-[#E6EAF0] dark:border-[#334155] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#38A169]/10 focus:border-[#38A169] transition-all text-[14px] dark:text-white placeholder:dark:text-slate-600"
                    />
                </div>

                <div className="space-y-4">
                    <label className="text-[14px] font-medium text-[#4A5568] dark:text-slate-300 transition-colors">Destinatários</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button 
                            type="button"
                            onClick={() => setRecipientType('all')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-[12px] border transition-all text-[13px] font-medium ${recipientType === 'all' ? 'bg-[#38A169] text-white border-[#38A169] shadow-md shadow-emerald-100 dark:shadow-none' : 'bg-white dark:bg-[#0F172A]/50 text-[#718096] dark:text-slate-400 border-[#E6EAF0] dark:border-[#334155] hover:border-emerald-200'}`}
                        >
                            <Users size={16} /> Todos
                        </button>
                        <button 
                            type="button"
                            onClick={() => setRecipientType('active_subscribers')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-[12px] border transition-all text-[13px] font-medium ${recipientType === 'active_subscribers' ? 'bg-[#38A169] text-white border-[#38A169] shadow-md shadow-emerald-100 dark:shadow-none' : 'bg-white dark:bg-[#0F172A]/50 text-[#718096] dark:text-slate-400 border-[#E6EAF0] dark:border-[#334155] hover:border-emerald-200'}`}
                        >
                            <CheckCircle2 size={16} /> Assinantes
                        </button>
                        <button 
                            type="button"
                            onClick={() => setRecipientType('specific')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-[12px] border transition-all text-[13px] font-medium ${recipientType === 'specific' ? 'bg-[#38A169] text-white border-[#38A169] shadow-md shadow-emerald-100 dark:shadow-none' : 'bg-white dark:bg-[#0F172A]/50 text-[#718096] dark:text-slate-400 border-[#E6EAF0] dark:border-[#334155] hover:border-emerald-200'}`}
                        >
                            <User size={16} /> Específico
                        </button>
                    </div>

                    {recipientType === 'specific' && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                            <input 
                                required
                                type="text" 
                                value={specificUserId}
                                onChange={(e) => setSpecificUserId(e.target.value)}
                                placeholder="Insira o ID do Usuário..." 
                                className="w-full px-4 py-2.5 bg-white dark:bg-[#0F172A]/50 border border-emerald-200 dark:border-[#38A169]/30 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#38A169]/10 focus:border-[#38A169] transition-all text-[14px] dark:text-white"
                            />
                        </div>
                    )}
                </div>

                {status && (
                    <div className={`p-4 rounded-[12px] flex items-center gap-3 animate-in zoom-in-95 duration-300 ${status.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-800'}`}>
                        {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        <span className="text-[14px] font-medium">{status.message}</span>
                    </div>
                )}

                <button 
                    disabled={sending}
                    type="submit"
                    className="w-full bg-[#2D3748] dark:bg-[#38A169] text-white py-3.5 rounded-[12px] font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-[#1A202C] dark:hover:bg-[#2F855A] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-200 dark:shadow-none"
                >
                    {sending ? (
                        <>Enviando...</>
                    ) : (
                        <>
                            <Send size={18} />
                            Enviar Notificação
                        </>
                    )}
                </button>
            </form>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-5 rounded-[16px] flex gap-4 transition-colors duration-300">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-[#1E293B] flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-50 dark:border-emerald-800">
                    <Bell size={20} />
                </div>
                <div>
                    <h4 className="text-[14px] font-semibold text-emerald-900 dark:text-emerald-200">Dica do Administrador</h4>
                    <p className="text-[13px] text-emerald-700 dark:text-emerald-400/80 mt-1 leading-relaxed">
                        Notificações de "Atualização" têm maior taxa de clique. Use títulos curtos e chamativos para melhor engajamento.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminNotifications;
