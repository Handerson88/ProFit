import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Sparkles, MessageSquare, Plus, Clock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { motion, AnimatePresence } from 'framer-motion';

export const AIChat = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    const socket = socketService.connect();

    return () => {
      // Don't disconnect globally if it might be used elsewhere, 
      // but we'll stop listing to events for this component
      socket.off('new_message');
      socket.off('user_typing');
    };
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      socketService.joinConversation(activeConversationId);
      
      const socket = socketService.getSocket();
      if (socket) {
        socket.off('new_message'); // Clear previous to avoid duplicates
        socket.on('new_message', (data: any) => {
          if (data.conversationId === activeConversationId || data.conversation_id === activeConversationId) {
            setMessages(prev => {
              // Avoid duplicate messages
              const exists = prev.some(m => 
                (data.id && m.id === data.id) || 
                (data.user_message && data.user_message.id && m.id === data.user_message.id)
              );
              if (exists) return prev;

              if (data.user_message) {
                // This is a package with both user and AI response
                return [...prev, data.user_message, data];
              }
              return [...prev, data];
            });
            setIsAiTyping(false);
            setIsAdminTyping(false);
          }
        });

        socket.off('user_typing');
        socket.on('user_typing', ({ sender, isTyping }: any) => {
          if (sender === 'admin' || sender === 'ai') {
            setIsAdminTyping(isTyping);
          }
        });
      }
    }
  }, [activeConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiTyping, isAdminTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const data = await api.ai.getConversations();
      setConversations(data);
      if (data.length > 0) {
        selectConversation(data[0].id);
      } else {
        startNewChat();
      }
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  };

  const selectConversation = async (id: string) => {
    setActiveConversationId(id);
    setShowHistory(false);
    try {
      const msgs = await api.ai.getMessages(id);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  const startNewChat = async () => {
    try {
      const { id } = await api.ai.newConversation();
      setActiveConversationId(id);
      setMessages([]);
      setConversations(prev => [{ id, created_at: new Date().toISOString() }, ...prev]);
      setShowHistory(false);
    } catch (err) {
      console.error('Failed to create new chat', err);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };


  const handleInputChange = (val: string) => {
    setInputValue(val);
    if (activeConversationId) {
      socketService.emitTyping(activeConversationId, 'user', val.length > 0);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const tempId = Date.now().toString();
    const userMsg = { 
      id: tempId,
      sender: 'user', 
      message: inputValue, 
      created_at: new Date().toISOString() 
    };

    setMessages(prev => [...prev, userMsg]);
    const messageToSend = inputValue;
    setInputValue('');
    setIsLoading(true);
    setIsAiTyping(true);
    
    // Stop typing indicator on send
    if (activeConversationId) {
        socketService.emitTyping(activeConversationId, 'user', false);
    }

    try {
      const response = await api.ai.sendMessage(activeConversationId, messageToSend);
      
      // The socket will likely deliver the message too, but we handle the HTTP response for safety and immediate feedback
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempId);
        const updatedUserMsg = response.user_message || { ...userMsg, created_at: response.user_message_created_at || userMsg.created_at };
        
        // Check if AI response already added via socket
        const aiResponseExists = prev.some(m => m.id === response.id);
        if (aiResponseExists) return [...filtered, updatedUserMsg];
        
        return [...filtered, updatedUserMsg, response];
      });
      
      if (!activeConversationId && response.conversationId) {
        setActiveConversationId(response.conversationId);
        fetchConversations();
      }
    } catch (err: any) {
      console.error('Failed to send message', err);
      const fallbackMsg = err.response?.data?.error || 'Estou tendo dificuldade para responder agora. Tente novamente em alguns segundos.';
      setMessages(prev => [...prev, { 
        id: `error-${tempId}`,
        sender: 'ai', 
        message: fallbackMsg,
        created_at: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
      setIsAiTyping(false);
    }
  };

  return (
    <div className="main-wrapper bg-[#F6F7F9]">
      <div className="app-container h-screen flex flex-col bg-white overflow-hidden shadow-none border-none">
        {/* Header */}
        <div className="px-6 pt-12 pb-6 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-50">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-lg font-black text-gray-900 leading-none">Dúvidas com IA</h1>
            <div className="flex items-center space-x-1 mt-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Especialista Fitness</span>
            </div>
          </div>
          <button 
            onClick={() => setShowHistory(!showHistory)} 
            className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 active:scale-95 transition-all"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.length === 0 && !isAiTyping && !isAdminTyping && (
            <div className="flex flex-col items-center justify-center h-full opacity-40">
              <Sparkles className="w-12 h-12 text-[#56AB2F] mb-4" />
              <p className="text-sm font-bold text-gray-400 text-center max-w-[200px]">
                Olá! Sou sua IA Fitness. Como posso te ajudar hoje?
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={msg.id || i}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] px-5 py-4 rounded-[28px] ${
                msg.sender === 'user' 
                  ? 'bg-gradient-to-br from-[#A8E063] to-[#56AB2F] text-white shadow-lg shadow-[#56AB2F]/20 rounded-tr-none' 
                  : msg.sender === 'admin'
                    ? 'bg-blue-600 text-white rounded-tl-none shadow-lg shadow-blue-500/10'
                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
              }`}>
                {msg.sender === 'admin' && <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-70">Suporte</p>}
                <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                <p className={`text-[9px] mt-2 font-bold opacity-50 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </motion.div>
          ))}

          {(isAiTyping || isAdminTyping) && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-5 py-4 rounded-[24px] rounded-tl-none">
                <div className="flex flex-col">
                  {isAdminTyping && <p className="text-[8px] font-black uppercase tracking-widest mb-1 text-gray-400">Suporte digitando...</p>}
                  <div className="flex space-x-1.5">
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-gray-50 mb-4">
          <div className="flex items-center space-x-3 bg-gray-50 p-2 rounded-[32px] border border-gray-100 shadow-sm focus-within:border-[#56AB2F]/30 transition-all">
            <input
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite sua dúvida..."
              className="flex-1 bg-transparent px-4 py-2 text-[15px] font-bold outline-none placeholder:text-gray-300"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                inputValue.trim() 
                  ? 'bg-[#56AB2F] text-white shadow-lg shadow-[#56AB2F]/30 scale-100' 
                  : 'bg-gray-200 text-white scale-90'
              }`}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* History Sidebar/Overlay */}
        <AnimatePresence>
          {showHistory && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowHistory(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" 
              />
              <motion.div 
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                className="fixed right-0 top-0 h-full w-[80%] max-w-sm bg-white z-[60] shadow-2xl p-8 flex flex-col"
              >
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-black text-gray-900">Histórico</h3>
                  <button onClick={() => setShowHistory(false)} className="text-gray-400 font-bold">Fechar</button>
                </div>
                
                <button 
                  onClick={startNewChat}
                  className="w-full py-4 mb-8 bg-black text-white rounded-2xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Nova Conversa
                </button>

                <div className="flex-1 overflow-y-auto space-y-3">
                  {conversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectConversation(c.id)}
                      className={`w-full p-5 rounded-2xl text-left border-2 transition-all ${
                        activeConversationId === c.id 
                          ? 'border-[#56AB2F] bg-[#F0F9EB]' 
                          : 'border-gray-50 hover:border-gray-100'
                      }`}
                    >
                      <p className="font-bold text-gray-900 text-sm">
                        Chat #{c.id.slice(0, 8)}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-widest italic">
                        {new Date(c.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
