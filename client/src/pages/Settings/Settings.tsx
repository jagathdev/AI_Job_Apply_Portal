import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { motion } from 'motion/react';
import axios from 'axios';
import {
  Sparkles, ShieldAlert, Download, Trash2, Sun, Moon, Lock, Info, KeyRound
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { theme, toggleTheme, logoutUser, showToast, token } = useApp();
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // API Key States
  const [groqKey, setGroqKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [groqApiKeySet, setGroqApiKeySet] = useState(false);
  const [geminiApiKeySet, setGeminiApiKeySet] = useState(false);
  const [isUpdatingKeys, setIsUpdatingKeys] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/api/profile');
        setGroqApiKeySet(res.data.groqApiKeySet);
        setGeminiApiKeySet(res.data.geminiApiKeySet);
        if (res.data.groqApiKeySet) setGroqKey('••••••••••••••••');
        if (res.data.geminiApiKeySet) setGeminiKey('••••••••••••••••');
      } catch (err) {
        console.error('Failed to load profile details.', err);
      }
    };
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const handleSaveApiKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingKeys(true);
    try {
      const payload: any = {};
      if (groqKey !== '••••••••••••••••') payload.groqApiKey = groqKey;
      if (geminiKey !== '••••••••••••••••') payload.geminiApiKey = geminiKey;

      const res = await axios.put('/api/profile/api-keys', payload);
      showToast('API keys updated successfully!', 'success');
      setGroqApiKeySet(res.data.groqApiKeySet);
      setGeminiApiKeySet(res.data.geminiApiKeySet);
      if (res.data.groqApiKeySet) setGroqKey('••••••••••••••••');
      if (res.data.geminiApiKeySet) setGeminiKey('••••••••••••••••');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update API keys.', 'error');
    } finally {
      setIsUpdatingKeys(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      showToast('Please fill out password fields.', 'error');
      return;
    }

    setIsChangingPass(true);
    try {
      await axios.put('/api/profile/security', { oldPassword, newPassword });
      showToast('Password updated successfully!', 'success');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update password.', 'error');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleExportData = async () => {
    try {
      showToast('Assembling your full data bundle...', 'info');
      const res = await axios.get('/api/profile/export');
      
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'my_ai_job_assistant_gdpr_bundle.json';
      link.click();
      URL.revokeObjectURL(url);
      
      showToast('JSON Data Bundle exported successfully.', 'success');
    } catch (err) {
      showToast('Failed to assemble export bundle.', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('WARNING: Deleting your account is completely permanent and irreversible! All resumes, company insights, practice logs, and logins will be purged. Proceed?')) {
      setIsDeleting(true);
      try {
        await axios.post('/api/profile/delete');
        showToast('Your account and all associated GDPR logs have been purged.', 'info');
        logoutUser();
        navigate('/register');
      } catch (err) {
        showToast('Failed to complete GDPR account deletion.', 'error');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 px-4 py-8 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      <div className="mx-auto max-w-3xl space-y-8">
        
        {/* Header summary */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <h1 className="text-2xl font-black tracking-tight">Account Preferences & Controls</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your credentials, viewport themes, and GDPR compliance portability controls.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          
          {/* Bento Block 1: Viewport Theme Preferences */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sun className="h-4.5 w-4.5" />
              Display Theme Preference
            </h3>
            <p className="text-xs text-zinc-500">Choose between dark-immersive or clean daylight layout configurations.</p>
            
            <div className="flex gap-4">
              <button
                onClick={() => { if (theme !== 'light') toggleTheme(); }}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'border-indigo-600 bg-indigo-50/20 text-indigo-600'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950/20'
                }`}
              >
                <Sun className="h-4 w-4" />
                Daylight Mode
              </button>

              <button
                onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-indigo-400 bg-indigo-950/40 text-indigo-300'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950/20'
                }`}
              >
                <Moon className="h-4 w-4" />
                Cosmic Dark Mode
              </button>
            </div>
          </div>

          {/* Bento Block 2: Change Password Security */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <KeyRound className="h-4.5 w-4.5" />
              Credentials Security
            </h3>
            
            <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Old Password</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950 focus:bg-white"
                />
              </div>

              <div className="md:col-span-2 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="px-4.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-40"
                >
                  {isChangingPass ? 'Updating credentials...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Bento Block: Custom API Keys Configuration */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <KeyRound className="h-4.5 w-4.5" />
              Custom AI API Keys (Fallback Chain Enabled)
            </h3>
            <p className="text-xs text-zinc-500">
              Provide your own credentials to use custom models. The engine automatically falls back to system API keys if a key fails or is unconfigured.
            </p>
            
            <form onSubmit={handleSaveApiKeys} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1 flex justify-between">
                  <span>Groq API Key</span>
                  {groqApiKeySet && <span className="text-green-500 normal-case font-medium">(Saved)</span>}
                </label>
                <input
                  type="password"
                  value={groqKey}
                  placeholder="gsk_..."
                  onChange={(e) => setGroqKey(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1 flex justify-between">
                  <span>Gemini API Key</span>
                  {geminiApiKeySet && <span className="text-green-500 normal-case font-medium">(Saved)</span>}
                </label>
                <input
                  type="password"
                  value={geminiKey}
                  placeholder="AIzaSy..."
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950 focus:bg-white"
                />
              </div>

              <div className="md:col-span-2 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingKeys}
                  className="px-4.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-40"
                >
                  {isUpdatingKeys ? 'Saving API keys...' : 'Save API Keys'}
                </button>
              </div>
            </form>
          </div>

          {/* Bento Block 3: GDPR Compliance Controls */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
              <ShieldAlert className="h-4.5 w-4.5" />
              GDPR Compliance Portability & Purges
            </h3>
            
            <p className="text-xs text-zinc-500 leading-relaxed max-w-2xl">
              Under General Data Protection Regulation (GDPR) mandates, you hold total authority over your telemetry data. Extract your document portfolios into standard portable JSON formats, or execute a terminal purge to shred all registrations.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                type="button"
                onClick={handleExportData}
                className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 shadow-sm cursor-pointer"
              >
                <Download className="h-4 w-4 text-zinc-500" />
                Export My Data Bundle (JSON)
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-500/10 disabled:opacity-40 transition-all cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                Shred Account & Data Purge
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
