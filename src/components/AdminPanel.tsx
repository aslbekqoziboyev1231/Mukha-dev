import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, Image as ImageIcon, Loader2, Save, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { getApiUrl } from '../apiConfig';
import { useToast } from '../context/ToastContext';

interface ImageRequest {
  _id: string;
  userEmail: string;
  prompt: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function AdminPanel() {
  const { showToast } = useToast();
  const [imageRequests, setImageRequests] = useState<ImageRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Profile Update State
  const [profileForm, setProfileForm] = useState({ email: '', password: '', displayName: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    fetchImageRequests();
  }, []);

  const fetchImageRequests = async () => {
    try {
      const response = await fetch(getApiUrl('/api/image-requests'));
      if (response.ok) {
        const data = await response.json();
        setImageRequests(data);
      }
    } catch (err) {
      showToast('Failed to load image requests', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageRequest = async (id: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(getApiUrl(`/api/image-requests/${id}/${action}`), {
        method: 'POST',
      });
      if (response.ok) {
        const updated = await response.json();
        setImageRequests(imageRequests.map(r => r._id === id ? updated : r));
        showToast(`Request ${action}d successfully`, 'success');
      }
    } catch (err) {
      showToast(`Failed to ${action} request`, 'error');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.email && !profileForm.password && !profileForm.displayName) {
      showToast('Please provide at least one field to update', 'info');
      return;
    }

    if (profileForm.displayName) {
      if (profileForm.displayName.length > 12) {
        showToast('Display name max 12 characters', 'error');
        return;
      }
      if (!/^[a-zA-Z0-9']+$/.test(profileForm.displayName)) {
        showToast("Only letters, numbers and ' allowed in display name", 'error');
        return;
      }
    }

    setIsUpdatingProfile(true);
    try {
      const response = await fetch(getApiUrl('/api/auth/update-profile'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      const data = await response.json();
      if (response.ok) {
        showToast('Profile updated successfully', 'success');
        setProfileForm({ email: '', password: '', displayName: '' });
      } else {
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-4xl mx-auto p-6 bg-white dark:bg-zinc-900 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-lg">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Admin Control</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Manage security and requests</p>
          </div>
        </div>
      </div>

      {/* Profile Settings Section */}
      <section className="space-y-4">
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 px-2 flex items-center gap-2">
          <User size={18} className="text-brand-600" />
          Profile Settings
        </h3>
        <form onSubmit={handleUpdateProfile} className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">New Display Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  placeholder="New Name"
                  value={profileForm.displayName}
                  onChange={e => setProfileForm({ ...profileForm, displayName: e.target.value })}
                  maxLength={12}
                  className="w-full pl-12 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">New Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="email"
                  placeholder="new-admin@example.com"
                  value={profileForm.email}
                  onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={profileForm.password}
                  onChange={e => setProfileForm({ ...profileForm, password: e.target.value })}
                  className="w-full pl-12 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={isUpdatingProfile}
            className="w-full py-3 bg-zinc-900 dark:bg-brand-600 text-white rounded-xl font-bold hover:bg-zinc-800 dark:hover:bg-brand-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isUpdatingProfile ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Update Admin Credentials
          </button>
        </form>
      </section>

      <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

      {/* Image Requests Section */}
      <section className="space-y-4">
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 px-2 flex items-center gap-2">
          <ImageIcon size={18} className="text-brand-600" />
          Image Generation Requests
        </h3>
        <div className="grid gap-4">
          {imageRequests.filter(r => r.status === 'pending').map(request => (
            <motion.div
              key={request._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded-lg uppercase tracking-wider">Pending</span>
                  <span className="text-xs text-zinc-400">{new Date(request.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Foydalanuvchi {request.userEmail}ning rasm yaratish limiti tugagagn. U yana rasm yaratishni so'rayabdi. Ruxsat berasizmi?
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                  Prompt: "{request.prompt}"
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleImageRequest(request._id, 'approve')}
                  className="px-4 py-2 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition-all flex items-center gap-2 shadow-lg shadow-brand-500/20"
                >
                  Ruxsat berish
                </button>
                <button
                  onClick={() => handleImageRequest(request._id, 'reject')}
                  className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-bold rounded-xl hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-all"
                >
                  Rad etish
                </button>
              </div>
            </motion.div>
          ))}
          {imageRequests.filter(r => r.status === 'pending').length === 0 && (
            <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-700">
              <p className="text-zinc-400 text-sm italic">No pending image requests</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
