import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import {
  Sparkles, FileText, Briefcase, Trophy, ChevronRight,
  TrendingUp, Calendar, AlertCircle, Play, CheckCircle2,
  Bookmark, ClipboardList, HelpCircle, MapPin, DollarSign,
  Layers, ArrowRight, Brain, ArrowDown, ShieldCheck, KeyRound,
  FileCheck2, Settings as SettingsIcon, AlertTriangle
} from 'lucide-react';

export const Home: React.FC = () => {
  const { 
    user, 
    refreshDashboardStats, 
    dashboardStats, 
    activeResume, 
    setActiveResume,
    activeCompany, 
    setActiveCompany, 
    showToast 
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [jdText, setJdText] = useState('');
  const [jdUrl, setJdUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [showBlockModal, setShowBlockModal] = useState(false);

  const guideRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const loadingStages = [
    'Parsing document structures...',
    'Extracting role metadata & tech stack...',
    'Estimating market salary benchmarks...',
    'Grounded culture review & intelligence assembly...',
    'Drafting tailored preparation packages...'
  ];

  useEffect(() => {
    loadStatsAndContext();
  }, []);

  const loadStatsAndContext = async () => {
    setLoading(true);
    await refreshDashboardStats();
    
    // Attempt to pull latest resume from DB if context cache is empty
    try {
      const res = await axios.get('/api/resume/all');
      if (res.data.length > 0 && !activeResume) {
        setActiveResume(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to pre-fetch resumes:', err);
    }
    
    setLoading(false);
  };

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
    const textVal = jdText.trim();
    const urlVal = jdUrl.trim();

    if (!urlVal && !textVal) {
      showToast('Please enter a job URL or paste the job description text.', 'error');
      return;
    }

    if (urlVal) {
      body.jdUrl = urlVal;
    }

    if (textVal) {
      if (textVal.match(/^https?:\/\/[^\s]+$/)) {
        showToast('You pasted a URL into the description box. Please paste the actual text of the job description here, or use the URL box above.', 'error');
        return;
      }
      
      if (textVal.length < 100) {
        showToast('Please enter a job description of at least 100 characters.', 'error');
        return;
      }
      body.jdText = textVal;
    }

    setIsAnalyzing(true);
    const stopRef = { current: false };
    const loaderInterval = triggerLoaderCycle(stopRef);

    try {
      const res = await axios.post('/api/company/analyze', body);
      stopRef.current = true;
      clearInterval(loaderInterval);
      
      setActiveCompany(res.data.company);
      showToast('AI Job Analysis completed successfully!', 'success');
      await refreshDashboardStats();
      navigate(`/company/${res.data.company._id || res.data.company.id}`);
    } catch (err: any) {
      stopRef.current = true;
      clearInterval(loaderInterval);
      
      const isBlocked = err.response?.data?.code === 'SCRAPE_BLOCKED' || err.response?.status === 400;
      if (isBlocked) {
        setShowBlockModal(true);
      } else {
        showToast(err.response?.data?.error || 'AI analysis timed out or failed.', 'error');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scrollToGuide = () => {
    guideRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Assembling your workspace...</p>
        </div>
      </div>
    );
  }

  const completionPercentage = user?.profileCompletion || 30;
  const isResumeUploaded = !!activeResume;
  const isJobAnalyzed = !!activeCompany;
  const isTailored = activeResume?.name?.toLowerCase().includes('tailored') || false;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      
      {/* HERO BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-zinc-950 py-16 md:py-24 text-white">
        
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        {/* Colorful blur spots */}
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-500/15 blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-bold uppercase tracking-wider mx-auto"
          >
            <Sparkles className="h-4 w-4 text-indigo-400" />
            AI Application Pipeline Active
          </motion.div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-balance break-words">
            Accelerate Your Job Application Journey
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-zinc-300 max-w-2xl mx-auto leading-relaxed text-balance">
            Our AI-guided suite helps you analyze company cultures, tailor resume experience bullets utilizing Grok AI, and prepare custom mock interviews. Follow the checklist below to land your role.
          </p>

          <div className="pt-4 flex justify-center">
            <button
              onClick={scrollToGuide}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all cursor-pointer group"
            >
              Start AI Apply Journey
              <ArrowDown className="h-4 w-4 group-hover:translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div ref={guideRef} className="mx-auto max-w-6xl px-4 py-12 md:py-16 space-y-12">
        
        {/* Section Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black tracking-tight">AI Job Apply Pipeline Guide</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Complete these 7 logical steps to verify your suitability and master your interview parameters.
          </p>
        </div>

        {/* PIPELINE INTERACTIVE MAP */}
        <div className="space-y-6 max-w-4xl mx-auto">
          
          {/* STEP 1: AUTHENTICATION */}
          <div className="flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border border-emerald-200/50 bg-emerald-500/5 dark:border-emerald-950/40 dark:bg-emerald-950/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-full translate-x-8 -translate-y-8" />
            
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Step 1 (Completed)</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Create Account & Authenticate</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                You are registered and logged in as <b className="text-zinc-800 dark:text-zinc-200">{user?.name}</b> ({user?.email}).
              </p>
            </div>
          </div>

          {/* STEP 2: JD ANALYSIS */}
          <div className={`flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border transition-all ${
            isJobAnalyzed 
              ? 'border-emerald-200 bg-emerald-500/5 dark:border-emerald-950/40 dark:bg-emerald-950/5' 
              : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm'
          }`}>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
              isJobAnalyzed 
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' 
                : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
            }`}>
              {isJobAnalyzed ? <CheckCircle2 className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
            </div>

            <div className="space-y-4 flex-1">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isJobAnalyzed ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'
                  }`}>
                    Step 2: {isJobAnalyzed ? 'Job Analyzed (Completed)' : 'Paste Job Link or Description'}
                  </span>
                  {isJobAnalyzed && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">AI-Powered Job Analysis</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Submit a job post link or paste description text below. The AI will extract its tech stack, interview stages, key culture points, and competitor lists.
                </p>
              </div>

              {!isAnalyzing && isJobAnalyzed && (
                <div className="flex flex-wrap gap-2.5 items-center bg-zinc-55 bg-zinc-100/50 dark:bg-zinc-800/40 p-3.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/40 text-xs">
                  <Briefcase className="h-4 w-4 text-indigo-500 shrink-0" />
                  <div className="flex-1">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{activeCompany.companyName}</span>
                    <span className="mx-2 text-zinc-350 dark:text-zinc-600">•</span>
                    <span className="text-zinc-500 dark:text-zinc-400">{activeCompany.jobTitle}</span>
                  </div>
                  <Link 
                    to={`/company/${activeCompany._id || activeCompany.id}`}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0"
                  >
                    View Details
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}

              <form onSubmit={handleAnalyze} className="space-y-3.5">
                <div className="grid grid-cols-1 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Job Link / URL</label>
                    <input
                      type="url"
                      placeholder="e.g. https://jobs.lever.co/example-company/software-engineer"
                      value={jdUrl}
                      onChange={(e) => setJdUrl(e.target.value)}
                      disabled={isAnalyzing}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-xs shadow-sm focus:border-indigo-500 focus:outline-none transition-all disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Job Description Text (Optional fallback if link fails)</label>
                    <textarea
                      placeholder="Paste the full job description text here..."
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                      disabled={isAnalyzing}
                      rows={4}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-xs shadow-sm focus:border-indigo-500 focus:outline-none transition-all disabled:opacity-50 resize-y"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isAnalyzing}
                    className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md shadow-indigo-500/10 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4" />
                        Analyze Job Details
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Progress feedback when analyzing */}
              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 dark:border-indigo-950/40 dark:bg-indigo-950/10 mt-2 space-y-2">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                          AI Analyst at work...
                        </span>
                        <span className="text-zinc-400 dark:text-zinc-500 font-mono">Stage {loadingStage + 1}/5</span>
                      </div>
                      <p className="text-xs text-zinc-650 dark:text-zinc-350 italic font-medium animate-pulse">
                        "{loadingStages[loadingStage]}"
                      </p>
                      <div className="w-full bg-indigo-100 dark:bg-indigo-950/60 h-1.5 rounded-full overflow-hidden">
                        <motion.div 
                          className="bg-indigo-600 h-full rounded-full"
                          animate={{ width: `${((loadingStage + 1) / 5) * 100}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* STEP 3: COMPANY CULTURE SCREEN */}
          <div className={`flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border transition-all ${
            isJobAnalyzed 
              ? 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm' 
              : 'opacity-55 bg-zinc-50 dark:bg-zinc-900/10 border-zinc-200 dark:border-zinc-850'
          }`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/40 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div className="space-y-2 flex-1">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Step 3: Company Intelligence screen</span>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Review Company & Tech Details</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Explore the structured summary panels for company standings, core engineering verticals, work hours layout, and competitors.
              </p>
              {isJobAnalyzed && (
                <div className="pt-2">
                  <Link
                    to={`/company/${activeCompany._id || activeCompany.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all"
                  >
                    View Details & Verticals
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* STEP 4: RESUME BUILDER */}
          <div className={`flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border transition-all ${
            isResumeUploaded 
              ? 'border-emerald-200 bg-emerald-500/5 dark:border-emerald-950/40 dark:bg-emerald-950/5' 
              : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm'
          }`}>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
              isResumeUploaded 
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' 
                : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
            }`}>
              {isResumeUploaded ? <CheckCircle2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  isResumeUploaded ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'
                }`}>
                  Step 4: {isResumeUploaded ? 'Resume Uploaded (Completed)' : 'Upload or Paste Resume'}
                </span>
                {isResumeUploaded && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Upload Your Resume Profile</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Provide your latest professional resume. The platform will parsing key details and index them for tailored customizations.
              </p>
              
              {isResumeUploaded && (
                <div className="flex items-center gap-2 bg-zinc-100/50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/40 text-xs">
                  <FileText className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 flex-1 truncate">{activeResume.name}</span>
                </div>
              )}

              <div className="pt-2">
                <Link
                  to="/resume-builder"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Manage Resume Workspace
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* STEP 5: RESUME TAILORING */}
          <div className={`flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border transition-all ${
            isResumeUploaded && isJobAnalyzed && isTailored
              ? 'border-emerald-200 bg-emerald-500/5 dark:border-emerald-950/40 dark:bg-emerald-950/5' 
              : isResumeUploaded && isJobAnalyzed
                ? 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm'
                : 'opacity-55 bg-zinc-50 dark:bg-zinc-900/10 border-zinc-200 dark:border-zinc-850'
          }`}>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
              isResumeUploaded && isJobAnalyzed && isTailored
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' 
                : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
            }`}>
              {isResumeUploaded && isJobAnalyzed && isTailored ? <CheckCircle2 className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  isResumeUploaded && isJobAnalyzed && isTailored ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'
                }`}>
                  Step 5: {isResumeUploaded && isJobAnalyzed && isTailored ? 'Resume Tailored (Completed)' : 'Tailor Resume Bullets'}
                </span>
                {isResumeUploaded && isJobAnalyzed && isTailored && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">AI Resume Tailoring</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Rephrase your resume bullets to align with the core requirements and tech stack of the analyzed job, maximizing ATS fit.
              </p>
              {isResumeUploaded && isJobAnalyzed && (
                <div className="pt-2">
                  <Link
                    to="/resume-builder"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all"
                  >
                    Tailor Experience Now
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* STEP 6: ATS FIT CARD */}
          <div className={`flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border transition-all ${
            isResumeUploaded && isJobAnalyzed 
              ? 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm' 
              : 'opacity-55 bg-zinc-50 dark:bg-zinc-900/10 border-zinc-200 dark:border-zinc-850'
          }`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/40 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-2 flex-1">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Step 6: ATS Compatibility Check</span>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Verify ATS Compatibility</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Run a simulated ATS check to score your resume relevance against the job description and find specific keywords to add.
              </p>
              {isResumeUploaded && isJobAnalyzed && (
                <div className="pt-2">
                  <Link
                    to="/ats-score"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all"
                  >
                    Run ATS Scoring Report
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* STEP 7: INTERVIEW PREPARATION */}
          <div className={`flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border transition-all ${
            isJobAnalyzed 
              ? 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm' 
              : 'opacity-55 bg-zinc-50 dark:bg-zinc-900/10 border-zinc-200 dark:border-zinc-850'
          }`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/40 shrink-0">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="space-y-2 flex-1">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Step 7: Interview Prep Guide</span>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Complete Mock Interview Prep</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Review the hiring timeline, and practice coding, system design, and culture-fit behavioral questions tailored to this position.
              </p>
              {isJobAnalyzed && (
                <div className="pt-2">
                  <Link
                    to="/interview-preparation"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all"
                  >
                    Open Interview Prep
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Blocked Scraper Modal */}
      <AnimatePresence>
        {showBlockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-zinc-200 dark:border-zinc-800"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-amber-500">
                  <AlertTriangle className="h-6 w-6" />
                  <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">Webpage Blocked</h3>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  This webpage has blocked me, so you can give me a job description, I will analyze it and respond to you. Thank you.
                </p>
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setShowBlockModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/20"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
