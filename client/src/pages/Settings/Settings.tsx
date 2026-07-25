import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { motion } from 'motion/react';
import axios from 'axios';
import {
  Sparkles, ShieldAlert, Download, Trash2, Sun, Moon, Lock, Info, KeyRound, ArrowLeft, Eye, EyeOff, ExternalLink
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { theme, toggleTheme, logoutUser, showToast, token } = useApp();
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // API Key States
  const [groqKey, setGroqKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [groqApiKeySet, setGroqApiKeySet] = useState(false);
  const [geminiApiKeySet, setGeminiApiKeySet] = useState(false);
  const [isUpdatingKeys, setIsUpdatingKeys] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

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

    const groqToSave = groqKey.trim();
    const geminiToSave = geminiKey.trim();

    if (!groqToSave && !geminiToSave) {
      showToast('Please provide at least one API key.', 'error');
      return;
    }

    if (groqToSave === geminiToSave && groqToSave !== '••••••••••••••••') {
      showToast('Groq and Gemini keys cannot be exactly the same.', 'error');
      return;
    }

    if (groqToSave && groqToSave !== '••••••••••••••••') {
      if (!groqToSave.startsWith('gsk_') || groqToSave.length < 50) {
        showToast('Invalid Groq API Key. Must start with "gsk_" and be valid length.', 'error');
        return;
      }
    }

    if (geminiToSave && geminiToSave !== '••••••••••••••••') {
      if (!geminiToSave.startsWith('AIzaSy') || geminiToSave.length < 35) {
        showToast('Invalid Gemini API Key. Must start with "AIzaSy" and be valid length.', 'error');
        return;
      }
    }

    setIsUpdatingKeys(true);
    try {
      const payload: any = {};
      if (groqToSave && groqToSave !== '••••••••••••••••') payload.groqApiKey = groqToSave;
      if (geminiToSave && geminiToSave !== '••••••••••••••••') payload.geminiApiKey = geminiToSave;

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
      <div className="mx-auto max-w-3xl space-y-6">



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
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${theme === 'light'
                  ? 'border-indigo-600 bg-indigo-50/20 text-indigo-600'
                  : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950/20'
                  }`}
              >
                <Sun className="h-4 w-4" />
                Daylight Mode
              </button>

              <button
                onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${theme === 'dark'
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
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 pr-10 text-xs outline-none focus:bg-white focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:bg-zinc-950 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                  >
                    {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 pr-10 text-xs outline-none focus:bg-white focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:bg-zinc-950 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
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
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-6 shadow-sm">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <KeyRound className="h-4.5 w-4.5" />
                Custom AI API Keys
              </h3>
              <p className="text-xs text-zinc-500">
                Provide your own credentials to use custom models.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Groq Procedure */}
                <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950/40 space-y-3 border border-zinc-200/40 dark:border-zinc-800/40">
                  <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-indigo-500" />
                    How to get Groq API Key:
                  </h4>
                  <ol className="list-decimal list-inside text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1.5 leading-relaxed font-medium">
                    <li>
                      Go to{' '}
                      <a
                        href="https://console.groq.com/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        console.groq.com
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                    <li>Log in or register your free account.</li>
                    <li>Navigate to <strong>API Keys</strong> in the sidebar.</li>
                    <li>Click <strong>Create API Key</strong>, name it, and copy it.</li>
                  </ol>
                </div>

                {/* Gemini Procedure */}
                <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950/40 space-y-3 border border-zinc-200/40 dark:border-zinc-800/40">
                  <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-purple-500" />
                    How to get Gemini API Key:
                  </h4>
                  <ol className="list-decimal list-inside text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1.5 leading-relaxed font-medium">
                    <li>
                      Go to{' '}
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 font-bold text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        Google AI Studio
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                    <li>Sign in with your Google account.</li>
                    <li>Click <strong>Get API key</strong> in the left menu.</li>
                    <li>Click <strong>Create API key</strong> and copy it.</li>
                  </ol>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveApiKeys} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 flex justify-between">
                    <span>Groq API Key</span>
                    {groqApiKeySet && <span className="text-green-500 normal-case font-medium">(Saved)</span>}
                  </label>
                  <div className="relative flex items-center">
                    <KeyRound className="absolute left-3.5 h-4.5 w-4.5 text-zinc-400 pointer-events-none" />
                    <input
                      type="password"
                      value={groqKey}
                      placeholder="gsk_..."
                      onChange={(e) => setGroqKey(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3.5 pl-10.5 pr-4 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:focus:bg-zinc-950 transition-all font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 flex justify-between">
                    <span>Gemini API Key</span>
                    {geminiApiKeySet && <span className="text-green-500 normal-case font-medium">(Saved)</span>}
                  </label>
                  <div className="relative flex items-center">
                    <KeyRound className="absolute left-3.5 h-4.5 w-4.5 text-zinc-400 pointer-events-none" />
                    <input
                      type="password"
                      value={geminiKey}
                      placeholder="AIzaSy..."
                      onChange={(e) => setGeminiKey(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3.5 pl-10.5 pr-4 text-xs outline-none focus:border-purple-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:focus:bg-zinc-950 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Terms and conditions checkbox */}
              <div className="flex items-start gap-2.5 mt-2 bg-zinc-50 dark:bg-zinc-950/30 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <input
                  type="checkbox"
                  id="settingsTermsCheck"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                />
                <label htmlFor="settingsTermsCheck" className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed select-none cursor-pointer">
                  I agree to the Terms and Conditions and accept that our API key is used to generate the AI job apply analysis, resume tailoring, and interview preparation. I understand it will be securely saved to my database profile.
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingKeys || !agreedTerms}
                  className="px-4.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-40"
                >
                  {isUpdatingKeys ? 'Saving...' : 'Save API Keys'}
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

        {/* Previous Step Back link - Moved to Bottom */}
        <div className="flex justify-start pt-6 mt-6 border-t border-zinc-200 dark:border-zinc-800">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-bold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
};
