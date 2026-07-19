import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { 
  Sparkles, FileText, Link as LinkIcon, ArrowRight, 
  MapPin, DollarSign, Brain, Layers, ShieldCheck, Check
} from 'lucide-react';

export const Home: React.FC = () => {
  const { showToast, setActiveCompany } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'text' | 'url'>('text');
  const [jdText, setJdText] = useState('');
  const [jdUrl, setJdUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);

  // Compact result state
  const [analyzedResult, setAnalyzedResult] = useState<any | null>(null);

  const loadingStages = [
    'Parsing document structures...',
    'Extracting role metadata & tech stack...',
    'Estimating market salary benchmarks...',
    'Grounded culture review & intelligence assembly...',
    'Drafting tailored preparation packages...'
  ];

  const triggerLoaderCycle = (stopRef: { current: boolean }) => {
    setLoadingStage(0);
    const interval = setInterval(() => {
      if (stopRef.current) {
        clearInterval(interval);
        return;
      }
      setLoadingStage((prev) => (prev + 1) % loadingStages.length);
    }, 2800);
    return interval;
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const body: any = {};
    if (activeTab === 'text') {
      if (!jdText.trim() || jdText.trim().length < 100) {
        showToast('Please enter a job description of at least 100 characters.', 'error');
        return;
      }
      body.jdText = jdText.trim();
    } else {
      if (!jdUrl.trim()) {
        showToast('Please enter a valid job URL.', 'error');
        return;
      }
      body.jdUrl = jdUrl.trim();
    }

    setIsLoading(true);
    setAnalyzedResult(null);
    const stopRef = { current: false };
    const loaderInterval = triggerLoaderCycle(stopRef);

    try {
      const res = await axios.post('/api/company/analyze', body);
      stopRef.current = true;
      clearInterval(loaderInterval);
      
      setAnalyzedResult(res.data.company);
      setActiveCompany(res.data.company);
      showToast('AI Company Analysis completed successfully!', 'success');
    } catch (err: any) {
      stopRef.current = true;
      clearInterval(loaderInterval);
      
      if (err.response?.data?.code === 'SCRAPE_BLOCKED') {
        showToast('Scraper blocked. Please paste the job text instead.', 'info');
        setActiveTab('text');
      } else {
        showToast(err.response?.data?.error || 'AI analysis timed out or failed.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="flex-1 mx-auto max-w-4xl px-4 py-12 md:py-20 w-full flex flex-col justify-center">
        
        {/* Hero Headline */}
        <div className="text-center space-y-4 mb-12">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 text-xs font-bold uppercase tracking-wider"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI RECRUITMENT SUITE
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Search Smarter. Apply Faster.<br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">Get Hired with AI.</span>
          </h1>
          <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Paste a job description or URL. Our AI extracts hidden intelligence, grades your resume, rewrites optimized bullet-points, and builds custom interview preps.
          </p>
        </div>

        {/* Input Panel */}
        <AnimatePresence mode="wait">
          {!isLoading && !analyzedResult && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* Tab Selector */}
              <div className="flex border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-6 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('text')}
                  className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold tracking-tight border-b-2 transition-all cursor-pointer ${
                    activeTab === 'text'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                      : 'border-transparent text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  Paste Job Description
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('url')}
                  className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold tracking-tight border-b-2 transition-all cursor-pointer ${
                    activeTab === 'url'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                      : 'border-transparent text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  <LinkIcon className="h-4 w-4" />
                  Job Board Link (Best Effort)
                </button>
              </div>

              <form onSubmit={handleAnalyze} className="space-y-4">
                {activeTab === 'text' ? (
                  <div>
                    <textarea
                      required
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                      placeholder="Paste the target job description text here (including required experience, tools, culture etc.). Min 100 characters."
                      rows={8}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:focus:bg-zinc-950 transition-all font-sans leading-relaxed"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Target Job Board URL
                    </label>
                    <div className="relative flex items-center">
                      <LinkIcon className="absolute left-3.5 h-4 w-4 text-zinc-400 pointer-events-none" />
                      <input
                        type="url"
                        required
                        value={jdUrl}
                        onChange={(e) => setJdUrl(e.target.value)}
                        placeholder="https://www.linkedin.com/jobs/view/..."
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-4 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:focus:bg-zinc-950 transition-all"
                      />
                    </div>
                    <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 mt-2">
                      💡 Note: Private networks & portals often block crawlers. Paste description text if url scraping fails.
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 hover:shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  <Brain className="h-4 w-4" />
                  Analyze Role with Grok AI
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </motion.div>
          )}

          {/* Premium Loading Skeleton */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-xl space-y-6"
            >
              <div className="flex flex-col items-center justify-center text-center py-6">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                  <Sparkles className="h-8 w-8 animate-spin" />
                  <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-20 animate-ping" />
                </div>
                <h3 className="mt-4 text-sm font-bold tracking-tight">Extracting Corporate Intelligence...</h3>
                <p className="mt-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse">
                  {loadingStages[loadingStage]}
                </p>
              </div>

              {/* Skeletons blocks to look highly technical */}
              <div className="space-y-3.5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-3/4 animate-pulse" />
                <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-1/2 animate-pulse delay-75" />
                <div className="h-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg w-5/6 animate-pulse delay-150" />
                <div className="h-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg w-2/3 animate-pulse delay-300" />
              </div>
            </motion.div>
          )}

          {/* Compact Results Summary Card */}
          {analyzedResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-xl dark:border-emerald-950/40 dark:bg-zinc-900 space-y-6"
            >
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 shrink-0">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{analyzedResult.jobTitle}</h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{analyzedResult.companyName}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <Check className="h-3 w-3" />
                  ANALYZED
                </span>
              </div>

              {/* Bento Grid layout inside compact card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950/40 space-y-1">
                  <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-zinc-400">
                    <MapPin className="h-3 w-3" />
                    Location
                  </span>
                  <span className="block text-xs font-semibold">{analyzedResult.location}</span>
                </div>
                
                <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950/40 space-y-1">
                  <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-zinc-400">
                    <DollarSign className="h-3 w-3" />
                    Salary (Est.)
                  </span>
                  <span className="block text-xs font-semibold">{analyzedResult.salaryRange}</span>
                </div>

                <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950/40 space-y-1">
                  <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-zinc-400">
                    <Layers className="h-3 w-3" />
                    Employment Type
                  </span>
                  <span className="block text-xs font-semibold">{analyzedResult.employmentType}</span>
                </div>
              </div>

              {/* Skills summary block */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-500">Core Required Stack</h4>
                <div className="flex flex-wrap gap-1.5">
                  {analyzedResult.techStack.slice(0, 6).map((tech: string, i: number) => (
                    <span key={i} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {tech}
                    </span>
                  ))}
                  {analyzedResult.techStack.length > 6 && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                      +{analyzedResult.techStack.length - 6} more
                    </span>
                  )}
                </div>
              </div>

              {/* Trigger details CTA */}
              <button
                onClick={() => navigate(`/company/${analyzedResult._id}`)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-all cursor-pointer"
              >
                Explore 25+ Corporate Insights
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
