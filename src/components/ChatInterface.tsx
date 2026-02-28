import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Trash2, Sparkles, LogOut, Menu, X, Clock, MessageSquare, Shield, Sun, Moon, ExternalLink, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { getChatResponse } from '../services/gemini';
import { cn } from '../lib/utils';
import { getApiUrl } from '../apiConfig';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  user: { email: string; displayName?: string; isAdmin?: boolean };
  onLogout: () => void;
  onOpenAdmin: () => void;
}

export default function ChatInterface({ user, onLogout, onOpenAdmin }: ChatInterfaceProps) {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSmartLink = () => {
    const url = 'https://www.effectivegatecpm.com/a7sqsdwxu1?key=b0af03149894b2335a1caca63812869a';
    const win = window.open(url, '_blank');
    
    if (win) {
      showToast('Opening special offer in new tab...', 'info');
      setTimeout(() => {
        try {
          win.close();
        } catch (e) {
          console.warn("Browser blocked automatic tab closing for security reasons.");
        }
      }, 5000);
    }
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
        showToast('Failed to load chat history', 'error');
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
      
      await fetch(getApiUrl('/api/messages'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'model', text: botMessageText }),
      });
    } catch (error: any) {
      showToast(error.message || 'Failed to send message', 'error');
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
    if (!confirm('Are you sure you want to clear all messages?')) return;
    try {
      const response = await fetch(getApiUrl('/api/messages'), { method: 'DELETE' });
      if (response.ok) {
        setMessages([]);
        showToast('Chat history cleared', 'success');
      }
    } catch (err) {
      showToast('Failed to clear history', 'error');
    }
  };

  return (
    <div className="flex flex-col h-[90vh] w-full max-w-4xl mx-auto bg-white dark:bg-zinc-900 shadow-2xl rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative transition-colors duration-300">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-zinc-900 z-50 shadow-2xl border-r border-zinc-100 dark:border-zinc-800 flex flex-col"
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Clock size={20} className="text-brand-600" />
                  History
                </h2>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-6">
                  {/* Promoted Section */}
                  <div className="px-2">
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-3">
                      Special Offer
                    </h3>
                    <button
                      onClick={handleSmartLink}
                      className="w-full p-4 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-200 dark:shadow-brand-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-left group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Sparkles size={18} className="text-brand-200" />
                        <ExternalLink size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-sm font-bold leading-tight">Exclusive Content</p>
                      <p className="text-[10px] text-brand-100 mt-1 opacity-80">Click to explore premium features and rewards.</p>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 px-2">
                      Historical Chats
                    </h3>
                    
                    {messages.length > 0 ? (
                      <div className="group p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 hover:border-brand-200 dark:hover:border-brand-700 hover:bg-brand-50/30 dark:hover:bg-brand-900/10 transition-all cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-brand-600 shrink-0">
                            <MessageSquare size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
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
              </div>

              <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                {user.isAdmin && (
                  <button
                    onClick={onOpenAdmin}
                    className="w-full mb-4 py-2 px-4 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/30 rounded-xl text-xs font-bold hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-all flex items-center justify-center gap-2"
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
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{user.email}</p>
                    <p className="text-[10px] text-zinc-400">Standard Plan</p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full py-2 px-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-xl text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-100 dark:hover:border-red-900/30 transition-all flex items-center justify-center gap-2"
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
      <header className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-200 dark:shadow-brand-900/20">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Mukha Web</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">
                {user.displayName || user.email}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="More options"
          >
            <MoreVertical size={24} />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      toggleTheme();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 rounded-xl transition-all"
                  >
                    {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                    {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                  </button>
                  
                  <button
                    onClick={() => {
                      clearChat();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                    Clear Chat
                  </button>

                  <div className="h-px bg-zinc-100 dark:bg-zinc-700 mx-2 my-1" />

                  <button
                    onClick={() => {
                      onLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 rounded-xl transition-all"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
        {/* Promoted Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/30 flex items-center justify-between gap-4 group cursor-pointer"
          onClick={handleSmartLink}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-brand-200 dark:shadow-brand-900/20">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Special Reward Available!</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Click to claim your exclusive Mukha Web bonus.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold text-xs">
            Claim Now
            <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </motion.div>

        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
              <Sparkles size={32} />
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium">Welcome back, {user.email.split('@')[0]}</p>
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
                message.role === 'user' ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" : "bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
              )}>
                {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={cn(
                "max-w-[80%] px-4 py-3 rounded-2xl shadow-sm",
                message.role === 'user' 
                  ? "bg-zinc-900 dark:bg-brand-600 text-white rounded-tr-none" 
                  : "bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-100 dark:border-zinc-700"
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
            <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800 px-4 py-3 rounded-2xl rounded-tl-none border border-zinc-100 dark:border-zinc-700 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-brand-500" />
              <span className="text-sm text-zinc-400 font-medium">Mukha is thinking...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="p-6 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 transition-colors duration-300">
        <form onSubmit={handleSend} className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="w-full pl-4 pr-14 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
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
