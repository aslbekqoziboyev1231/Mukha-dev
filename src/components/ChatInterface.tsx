import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Trash2, Sparkles, LogOut, Menu, X, Clock, MessageSquare, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { getChatResponse } from '../services/gemini';
import { cn } from '../lib/utils';
import { getApiUrl } from '../apiConfig';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  user: { email: string; isAdmin?: boolean };
  onLogout: () => void;
  onOpenAdmin: () => void;
}

export default function ChatInterface({ user, onLogout, onOpenAdmin }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch(getApiUrl('/api/messages'));
        if (response.ok) {
          const history = await response.json();
          setMessages(history.map((m: any) => ({
            id: m._id,
            role: m.role,
            text: m.text,
            timestamp: new Date(m.createdAt)
          })));
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Save user message to DB
      await fetch(getApiUrl('/api/messages'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', text: input }),
      });

      const history = messages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));

      const response = await getChatResponse(input, history);
      
      const botMessageText = response.text || 'Sorry, I couldn\'t generate a response.';
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: botMessageText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      
      // Save bot message to DB
      await fetch(getApiUrl('/api/messages'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'model', text: botMessageText }),
      });
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: 'An error occurred while processing your request.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await fetch(getApiUrl('/api/messages'), { method: 'DELETE' });
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  return (
    <div className="flex flex-col h-[90vh] w-full max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-zinc-200 relative">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-2xl border-r border-zinc-100 flex flex-col"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h2 className="font-bold text-zinc-900 flex items-center gap-2">
                  <Clock size={20} className="text-brand-600" />
                  History
                </h2>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 px-2">
                    Historical Chats
                  </h3>
                  
                  {messages.length > 0 ? (
                    <div className="group p-3 rounded-xl bg-zinc-50 border border-zinc-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-zinc-100 flex items-center justify-center text-brand-600 shrink-0">
                          <MessageSquare size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-900 truncate">
                            {messages[messages.length - 1].text}
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-1">
                            Last chat • {messages[messages.length - 1].timestamp.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 px-2 italic">No history yet</p>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-zinc-100 bg-zinc-50/50">
                {user.isAdmin && (
                  <button
                    onClick={onOpenAdmin}
                    className="w-full mb-4 py-2 px-4 bg-brand-50 text-brand-600 border border-brand-100 rounded-xl text-xs font-bold hover:bg-brand-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Shield size={14} />
                    Admin Panel
                  </button>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                    {user.email[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 truncate">{user.email}</p>
                    <p className="text-[10px] text-zinc-400">Standard Plan</p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full py-2 px-4 bg-white border border-zinc-200 text-zinc-600 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-200">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="font-semibold text-zinc-900 tracking-tight">Mukha Web</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">
                {user.email}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear Chat"
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={onLogout}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-200">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400">
              <Sparkles size={32} />
            </div>
            <div>
              <p className="text-zinc-500 font-medium">Welcome back, {user.email.split('@')[0]}</p>
              <p className="text-sm text-zinc-400">Your chat history is synced with MongoDB.</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4",
                message.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                message.role === 'user' ? "bg-zinc-900 text-white" : "bg-brand-100 text-brand-600"
              )}>
                {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={cn(
                "max-w-[80%] px-4 py-3 rounded-2xl shadow-sm",
                message.role === 'user' 
                  ? "bg-zinc-900 text-white rounded-tr-none" 
                  : "bg-zinc-50 text-zinc-800 rounded-tl-none border border-zinc-100"
              )}>
                <div className="markdown-body">
                  <Markdown>{message.text}</Markdown>
                </div>
                <div className={cn(
                  "text-[10px] mt-1 opacity-50",
                  message.role === 'user' ? "text-right" : "text-left"
                )}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))
        )}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-zinc-50 px-4 py-3 rounded-2xl rounded-tl-none border border-zinc-100 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-brand-500" />
              <span className="text-sm text-zinc-400 font-medium">Mukha is thinking...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="p-6 bg-white border-t border-zinc-100">
        <form onSubmit={handleSend} className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="w-full pl-4 pr-14 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-zinc-400 text-zinc-900"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 bottom-2 px-4 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:hover:bg-brand-600 transition-all shadow-lg shadow-brand-200 flex items-center justify-center"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
        <p className="text-center text-[10px] text-zinc-400 mt-4 uppercase tracking-widest font-medium">
          Mukha may do mistakes, so check information double
        </p>
      </footer>
    </div>
  );
}
