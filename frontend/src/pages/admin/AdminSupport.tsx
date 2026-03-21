import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import { MessageSquare, User, Send, ChevronRight, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminSupport = () => {
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConv, setSelectedConv] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [reply, setReply] = useState('');
    const [loading, setLoading] = useState(false);
    const [isUserTyping, setIsUserTyping] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchConversations();
        const socket = socketService.connect();
        socketService.joinAdmin();

        socket.on('admin_new_user_message', (data: any) => {
            // Update sidebar list
            setConversations(prev => {
                const filtered = prev.filter(c => c.id !== data.conversationId);
                return [{
                    id: data.conversationId,
                    user_name: data.user_name,
                    user_email: data.user_email,
                    updated_at: new Date().toISOString()
                }, ...filtered];
            });
        });

        return () => {
            socket.off('admin_new_user_message');
            socket.off('new_message');
            socket.off('user_typing');
        };
    }, []);

    useEffect(() => {
        if (selectedConv) {
            socketService.joinConversation(selectedConv.id);
            const socket = socketService.getSocket();
            if (socket) {
                socket.off('new_message');
                socket.on('new_message', (data: any) => {
                    if (data.conversation_id === selectedConv.id || data.conversationId === selectedConv.id) {
                        setMessages(prev => {
                            const exists = prev.some(m => m.id === data.id);
                            if (exists) return prev;
                            
                            // If it's a message from user (packaged with AI response)
                            if (data.user_message) {
                                return [...prev, data.user_message, data];
                            }
                            return [...prev, data];
                        });
                        setIsUserTyping(false);
                    }
                });

                socket.off('user_typing');
                socket.on('user_typing', ({ sender, isTyping }: any) => {
                    if (sender === 'user') {
                        setIsUserTyping(isTyping);
                    }
                });
            }
        }
    }, [selectedConv?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isUserTyping]);

    const filteredConversations = conversations.filter(conv => 
        conv.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.user_email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const fetchConversations = async () => {
        try {
            const data = await api.ai.adminGetConversations();
            setConversations(data);
        } catch (err) {
            console.error(err);
        }
    };

    const selectConversation = async (conv: any) => {
        setSelectedConv(conv);
        try {
            const msgs = await api.ai.getMessages(conv.id); // Reusing getMessages (it validates token)
            setMessages(msgs);
        } catch (err) {
            console.error(err);
        }
    };

    const handleReply = async () => {
        if (!reply.trim() || !selectedConv) return;
        setLoading(true);
        
        // Stop typing indicator on send
        socketService.emitTyping(selectedConv.id, 'admin', false);

        try {
            const result = await api.ai.adminReply(selectedConv.id, reply);
            
            // Result will likely come via socket too, but we update locally for speed
            setMessages(prev => {
                const exists = prev.some(m => m.id === result.id);
                if (exists) return prev;
                return [...prev, result];
            });
            
            setReply('');
            fetchConversations();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Suporte com IA</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Monitore e responda interações do assistente fitness</p>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 h-[75vh]">
                {/* Conversations List */}
                <div className="col-span-4 bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-[#334155] overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-800/50 space-y-4">
                        <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider">Conversas Recentes</h3>
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Buscar usuário..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-[#334155] rounded-lg px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredConversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => selectConversation(conv)}
                                className={`w-full p-5 text-left border-b border-slate-100 dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all ${
                                    selectedConv?.id === conv.id ? 'bg-indigo-50 dark:bg-indigo-900/10 border-l-4 border-l-indigo-500' : ''
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{conv.user_name}</h4>
                                    <span className="text-[10px] text-slate-400 font-medium">#{conv.id.slice(0, 8)}</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{conv.user_email}</p>
                                <div className="flex items-center gap-2 mt-3">
                                    <Clock size={12} className="text-slate-300" />
                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-none">
                                        Atualizado em {new Date(conv.updated_at).toLocaleString('pt-BR')}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Details */}
                <div className="col-span-8 bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-[#334155] overflow-hidden flex flex-col">
                    {selectedConv ? (
                        <>
                            <div className="p-5 border-b border-slate-200 dark:border-[#334155] flex justify-between items-center bg-white dark:bg-[#1E293B] z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold">
                                        {selectedConv.user_name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">{selectedConv.user_name}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{selectedConv.user_email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                                    <Sparkles size={14} className="text-[#38A169]" />
                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">IA Ativa</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50 dark:bg-[#0F172A]/30">
                                {messages.map((msg, i) => (
                                    <div key={msg.id || i} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${
                                            msg.sender === 'user' 
                                                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-none' 
                                                : msg.sender === 'admin'
                                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-tr-none italic'
                                        }`}>
                                            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-50">
                                                {msg.sender === 'user' ? 'Usuário' : msg.sender === 'admin' ? 'Suporte (Você)' : 'IA Assistente'}
                                            </p>
                                            <p className="text-sm font-medium leading-relaxed">{msg.message}</p>
                                            <p className="text-[9px] mt-2 font-bold opacity-40 text-right">
                                                {new Date(msg.created_at).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {isUserTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none shadow-sm">
                                            <div className="flex flex-col">
                                                <p className="text-[8px] font-black uppercase tracking-widest mb-1 text-slate-400">Usuário está digitando...</p>
                                                <div className="flex space-x-1">
                                                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-slate-400 rounded-full" />
                                                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-slate-400 rounded-full" />
                                                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-slate-400 rounded-full" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-6 bg-white dark:bg-[#1E293B] border-t border-slate-200 dark:border-[#334155]">
                                <div className="flex gap-4">
                                    <input
                                        value={reply}
                                        onChange={(e) => {
                                            setReply(e.target.value);
                                            if (selectedConv) socketService.emitTyping(selectedConv.id, 'admin', e.target.value.length > 0);
                                        }}
                                        onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                                        placeholder="Responder como suporte humano..."
                                        className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-[#334155] rounded-xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm dark:text-white"
                                    />
                                    <button
                                        onClick={handleReply}
                                        disabled={loading || !reply.trim()}
                                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                                    >
                                        {loading ? 'Enviando...' : <Send size={18} />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-3 italic text-center">
                                    Dica: Sua resposta aparecerá com um selo azul de "Suporte" para o usuário.
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                            <MessageSquare size={64} className="mb-4 text-slate-400" />
                            <p className="font-bold text-slate-500">Selecione uma conversa para visualizar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
