import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import axios from 'axios';
import { ShieldAlert, KeyRound, ExternalLink, X, Info } from 'lucide-react';

export const AiLimitModal: React.FC = () => {
  const { openAiLimitModal, setOpenAiLimitModal, showToast } = useApp();
  const [groqApiKey, setGroqApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const gApiKey = groqApiKey.trim();
    const gemApiKey = geminiApiKey.trim();

    if (!gApiKey && !gemApiKey) {
      showToast('Please enter at least one API Key (Groq or Gemini).', 'error');
      return;
    }

    if (gApiKey === gemApiKey) {
      showToast('Groq and Gemini keys cannot be exactly the same.', 'error');
      return;
    }

    if (gApiKey && (!gApiKey.startsWith('gsk_') || gApiKey.length < 50)) {
      showToast('Invalid Groq API Key. Must start with "gsk_" and be valid length.', 'error');
      return;
    }

    if (gemApiKey && (!gemApiKey.startsWith('AIzaSy') || gemApiKey.length < 35)) {
      showToast('Invalid Gemini API Key. Must start with "AIzaSy" and be valid length.', 'error');
      return;
    }

    if (!agreedTerms) {
      showToast('You must agree to the Terms & Conditions to proceed.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {};
      if (gApiKey) payload.groqApiKey = gApiKey;
      if (gemApiKey) payload.geminiApiKey = gemApiKey;

      await axios.put('/api/profile/api-keys', payload);
      showToast('API Key saved successfully! Resuming operations.', 'success');
      setOpenAiLimitModal(false);
      setGroqApiKey('');
      setGeminiApiKey('');
      setAgreedTerms(false);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save API Key.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!openAiLimitModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 overflow-hidden max-h-[95vh] overflow-y-auto">

        {/* Close Button */}
        <button
          onClick={() => setOpenAiLimitModal(false)}
          className="absolute top-4 right-4 p-1.5 rounded-xl border border-zinc-150 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950/40 text-zinc-500 hover:text-zinc-700 transition-all cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title & Icon */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-100/60 dark:border-amber-900/40 shrink-0">
            <ShieldAlert className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight">AI Request Limit Exceeded</h3>
            <p className="text-xs text-zinc-400">The shared AI daily limit is reached. Try again in 5 hours, or provide your own key.</p>
          </div>
        </div>

        {/* Procedure list */}
        <div className="mt-4.5 space-y-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            The shared community AI daily limit has been reached. You can <strong>try again after 5 hours</strong>, or to get uninterrupted service immediately, you can easily create and paste your own personal <strong>Groq API Key</strong> or <strong>Gemini API Key</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Groq Procedure */}
            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950/40 space-y-3 border border-zinc-200/40 dark:border-zinc-800/40">
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Info className="h-4 w-4 text-indigo-500" />
                How to get Groq API Key:
              </h4>
              <ol className="list-decimal list-inside text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 leading-relaxed font-medium">
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
              <ol className="list-decimal list-inside text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 leading-relaxed font-medium">
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

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-zinc-400">
                  Paste Groq API Key
                </label>
                <div className="relative flex items-center">
                  <KeyRound className="absolute left-3.5 h-4.5 w-4.5 text-zinc-400 pointer-events-none" />
                  <input
                    type="password"
                    value={groqApiKey}
                    onChange={(e) => setGroqApiKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3.5 pl-10.5 pr-4 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:focus:bg-zinc-950 transition-all font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-zinc-400">
                  Paste Gemini API Key
                </label>
                <div className="relative flex items-center">
                  <KeyRound className="absolute left-3.5 h-4.5 w-4.5 text-zinc-400 pointer-events-none" />
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3.5 pl-10.5 pr-4 text-xs outline-none focus:border-purple-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:focus:bg-zinc-950 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Terms and conditions checkbox */}
            <div className="flex items-start gap-2.5 mt-2 bg-zinc-50 dark:bg-zinc-950/30 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <input
                type="checkbox"
                id="termsCheck"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
              />
              <label htmlFor="termsCheck" className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed select-none cursor-pointer">
                I agree to the Terms and Conditions and accept that our API key is used to generate the AI job apply analysis, resume tailoring, and interview preparation. I understand it will be securely saved to my database profile.
              </label>
            </div>

            {/* CTAs */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOpenAiLimitModal(false)}
                className="px-4.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-all cursor-pointer text-zinc-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || (!groqApiKey.trim() && !geminiApiKey.trim()) || !agreedTerms}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40 transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
              >
                Save Key & Continue
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
