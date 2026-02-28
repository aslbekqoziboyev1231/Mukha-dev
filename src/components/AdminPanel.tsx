import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, BookOpen, Loader2, AlertCircle, User, Lock, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { getApiUrl } from '../apiConfig';
import { useToast } from '../context/ToastContext';

interface Knowledge {
  _id: string;
  title: string;
  content: string;
}

export default function AdminPanel() {
  const { showToast } = useToast();
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newKnowledge, setNewKnowledge] = useState({ title: '', content: '' });
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  
  // Profile Update State
  const [profileForm, setProfileForm] = useState({ email: '', password: '', displayName: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const fetchKnowledge = async () => {
    try {
      const response = await fetch(getApiUrl('/api/knowledge'));
      if (response.ok) {
        const data = await response.json();
        setKnowledge(data);
      }
    } catch (err) {
      showToast('Failed to load knowledge base', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch(getApiUrl('/api/knowledge'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKnowledge),
      });
      if (response.ok) {
        const added = await response.json();
        setKnowledge([added, ...knowledge]);
        setNewKnowledge({ title: '', content: '' });
        showToast('Knowledge added successfully', 'success');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add knowledge');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(getApiUrl(`/api/knowledge/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (response.ok) {
        const updated = await response.json();
        setKnowledge(knowledge.map(k => k._id === id ? updated : k));
        setEditingId(null);
        showToast('Knowledge updated successfully', 'success');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update knowledge');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge?')) return;
    try {
      const response = await fetch(getApiUrl(`/api/knowledge/${id}`), { method: 'DELETE' });
      if (response.ok) {
        setKnowledge(knowledge.filter(k => k._id !== id));
        showToast('Knowledge deleted successfully', 'success');
      }
    } catch (err) {
      showToast('Failed to delete knowledge', 'error');
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

  const startEditing = (k: Knowledge) => {
    setEditingId(k._id);
    setEditForm({ title: k.title, content: k.content });
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
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Admin Control</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Manage knowledge and security</p>
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

      {/* Knowledge Base Section */}
      <div className="space-y-8">
        {/* Add New Knowledge */}
        <form onSubmit={handleAdd} className="bg-white dark:bg-zinc-800 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-sm space-y-4">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Plus size={18} className="text-brand-600" />
            Add New Knowledge
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Title (e.g., Company Policy)"
              value={newKnowledge.title}
              onChange={e => setNewKnowledge({ ...newKnowledge, title: e.target.value })}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              required
            />
            <textarea
              placeholder="Content..."
              value={newKnowledge.content}
              onChange={e => setNewKnowledge({ ...newKnowledge, content: e.target.value })}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all min-h-[100px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            Add to Knowledge Base
          </button>
        </form>

        {/* Knowledge List */}
        <div className="space-y-4">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 px-2">Existing Knowledge</h3>
          <div className="grid gap-4">
            {knowledge.map(k => (
              <motion.div
                key={k._id}
                layout
                className="bg-white dark:bg-zinc-800 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-sm group"
              >
                {editingId === k._id ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-zinc-900 dark:text-zinc-100"
                    />
                    <textarea
                      value={editForm.content}
                      onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none min-h-[100px] text-zinc-900 dark:text-zinc-100"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(k._id)}
                        className="flex-1 py-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Save size={16} /> Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{k.title}</h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{k.content}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditing(k)}
                        className="p-2 text-zinc-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(k._id)}
                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
            {knowledge.length === 0 && (
              <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-700">
                <p className="text-zinc-400 text-sm italic">Knowledge base is empty</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
