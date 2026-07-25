import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import axios from 'axios';
import { ShieldAlert, KeyRound, ExternalLink, X, Info } from 'lucide-react';

export const AiLimitModal: React.FC = () => {
  const { openAiLimitModal, setOpenAiLimitModal, showToast } = useApp();
  const [apiKey, setApiKey] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !apiKey.startsWith('gsk_')) {
      showToast('Please enter a valid Groq API Key starting with "gsk_".', 'error');
      return;
    }
    if (!agreedTerms) {
      showToast('You must agree to the Terms & Conditions to proceed.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await axios.put('/api/profile/api-keys', { groqApiKey: apiKey.trim() });
      showToast('Groq API Key saved successfully! Resuming operations.', 'success');
      setOpenAiLimitModal(false);
      setApiKey('');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save API Key.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!openAiLimitModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 overflow-hidden">
        
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
            <p className="text-xs text-zinc-400">System resources saturated. Upgrade to resume.</p>
          </div>
        </div>

        {/* Procedure list */}
        <div className="mt-4.5 space-y-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            The shared community AI limits have been temporarily exhausted. To get uninterrupted service, you can easily create and paste your own personal **Groq Cloud API Key**.
          </p>

          <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950/40 space-y-3 border border-zinc-200/40 dark:border-zinc-800/40">
            <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-indigo-500" />
              How to get your API Key:
            </h4>
            
            <ol className="list-decimal list-inside text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 leading-relaxed font-medium">
              <li>
                Go to{' '}
                <a
                  href="https://console.groq.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  console.groq.com
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Log in or register your free account.</li>
              <li>Navigate to **API Keys** in the sidebar.</li>
              <li>Click **Create API Key**, name it, and copy it.</li>
            </ol>
          </div>

          <form onSubmit={handleSave} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-bold text-zinc-400">
                Paste Groq API Key
              </label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3.5 h-4.5 w-4.5 text-zinc-400 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3.5 pl-10.5 pr-4 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:focus:bg-zinc-950 transition-all font-mono"
                />
              </div>
            </div>

            {/* Terms and conditions checkbox */}
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="termsCheck"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="termsCheck" className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal select-none">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline"
                >
                  Terms and Conditions
                </button>{' '}
                of custom key database storage.
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
                disabled={isSaving || !apiKey.trim() || !agreedTerms}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40 transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
              >
                Save Key & Continue
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Embedded Mini Terms Dialog */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <h4 className="text-sm font-bold tracking-tight">Terms & Database Storage Agreement</h4>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-3 overflow-y-auto max-h-[220px] leading-relaxed pr-1.5">
              <p>
                By saving your API key, you authorize the platform to securely save it to your encrypted profile in the MongoDB database database cache.
              </p>
              <p>
                This key is used <b>only</b> on your behalf to authenticate request routing to GroqCloud completions endpoints. It is never shared with third parties or logged in public servers.
              </p>
              <p>
                You can delete or replace this API key at any time in the settings page.
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowTerms(false)}
                className="px-4.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
              >
                Accept & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
