import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import AuthForm from './components/AuthForm';
import AdminPanel from './components/AdminPanel';
import { Loader2 } from 'lucide-react';
import { getApiUrl } from './apiConfig';

export default function App() {
  const [user, setUser] = useState<{ email: string; isAdmin?: boolean } | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [view, setView] = useState<'chat' | 'admin'>('chat');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(getApiUrl('/api/auth/me'));
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(getApiUrl('/api/auth/logout'), { method: 'POST' });
      setUser(null);
      setView('chat');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center p-4 sm:p-8 transition-colors duration-300">
      {user ? (
        <div className="w-full max-w-4xl">
          {view === 'chat' ? (
            <ChatInterface 
              user={user} 
              onLogout={handleLogout} 
              onOpenAdmin={() => setView('admin')} 
            />
          ) : (
            <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden">
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <button 
                  onClick={() => setView('chat')}
                  className="px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-all flex items-center gap-2"
                >
                  ← Back to Chat
                </button>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Admin Mode</span>
              </div>
              <div className="max-h-[80vh] overflow-y-auto">
                <AdminPanel />
              </div>
            </div>
          )}
        </div>
      ) : (
        <AuthForm onSuccess={setUser} />
      )}
    </div>
  );
}
