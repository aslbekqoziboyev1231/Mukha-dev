import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Loader2, ArrowRight, UserPlus, LogIn, User, KeyRound, RefreshCw, AlertTriangle } from 'lucide-react';
import { getApiUrl } from '../apiConfig';
import { useToast } from '../context/ToastContext';

interface AuthFormProps {
  onSuccess: (user: { email: string; displayName?: string }) => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const { showToast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isResetting) {
      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(getApiUrl('/api/auth/reset-password'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, oldPassword, newPassword: password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        showToast(data.message, 'success');
        setIsResetting(false);
        setIsLogin(true);
        setOldPassword('');
        setPassword('');
        setConfirmPassword('');
      } catch (err: any) {
        showToast(err.message, 'error');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!isLogin && displayName) {
      if (displayName.length > 12) {
        showToast('Display name max 12 characters', 'error');
        return;
      }
      if (!/^[a-zA-Z0-9']+$/.test(displayName)) {
        showToast("Only letters, numbers and ' allowed in display name", 'error');
        return;
      }
    }

    setIsLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ...(isLogin ? {} : { displayName }) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      showToast(isLogin ? 'Welcome back!' : 'Account created successfully!', 'success');
      onSuccess(data.user);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-800 transition-colors duration-300">
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 bg-brand-600 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white shadow-xl shadow-brand-200 dark:shadow-brand-900/20"
        >
          {isResetting ? <RefreshCw size={32} /> : isLogin ? <LogIn size={32} /> : <UserPlus size={32} />}
        </motion.div>
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {isResetting ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
          {isResetting 
            ? 'Warning: Resetting password will delete all your chat history' 
            : isLogin ? 'Sign in to continue to Mukha Web' : 'Join Mukha Web and start chatting'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isResetting && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-start gap-3 mb-4">
            <AlertTriangle className="text-red-600 shrink-0" size={20} />
            <p className="text-xs text-red-700 dark:text-red-400 font-medium">
              All your previous chat data will be permanently deleted upon password reset.
            </p>
          </div>
        )}

        {!isLogin && !isResetting && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Display Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={12}
                className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
          </div>
        </div>

        {isResetting && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Recovery Code / Old Password</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Any value (not verified)"
                className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
            {isResetting ? 'New Password' : 'Password'}
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
          </div>
        </div>

        {isResetting && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all flex items-center justify-center gap-2 group"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              {isResetting ? 'Reset Password' : isLogin ? 'Sign In' : 'Sign Up'}
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 flex flex-col gap-3 text-center">
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setIsResetting(false);
          }}
          className="text-sm font-medium text-zinc-500 hover:text-brand-600 transition-colors"
        >
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
        </button>
        
        {isLogin && !isResetting && (
          <button
            onClick={() => setIsResetting(true)}
            className="text-sm font-medium text-zinc-400 hover:text-red-500 transition-colors"
          >
            Forgot Password?
          </button>
        )}

        {isResetting && (
          <button
            onClick={() => setIsResetting(false)}
            className="text-sm font-medium text-zinc-400 hover:text-brand-600 transition-colors"
          >
            Back to Login
          </button>
        )}
      </div>
    </div>
  );
}
