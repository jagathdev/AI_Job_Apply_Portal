import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import {
  Sparkles, FileText, CheckCircle2, AlertTriangle, ArrowRight,
  TrendingUp, RefreshCw, Layers, ListTodo, ThumbsUp, ThumbsDown
} from 'lucide-react';

export const ATSScore: React.FC = () => {
  const { activeResume, activeCompany, showToast } = useApp();

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any | null>(null);

  useEffect(() => {
    if (activeResume && activeCompany) {
      runATSCheck();
    }
  }, [activeResume, activeCompany]);

  const runATSCheck = async () => {
    setLoading(true);
    try {
      showToast('Running deep ATS scan against target tech stack...', 'info');
      const res = await axios.post('/api/ats/analyze', {
        resumeId: activeResume._id,
        companyId: activeCompany._id
      });
      // The backend returns { message: string, report: ATSReport }
      setReport(res.data.report || res.data);
      showToast('ATS Compliance Report ready!', 'success');
    } catch (err) {
      showToast('Failed to run ATS comparison.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyBullet = async (comp: any, idx: number) => {
    if (!activeResume) return;
    try {
      showToast('Writing optimized bullet back to resume...', 'info');
      await axios.post('/api/ats/apply-bullet', {
        resumeId: activeResume._id,
        section: comp.section,
        index: comp.index,
        text: comp.suggested
      });

      // Optimistically update local view
      setReport((prev: any) => {
        if (!prev) return prev;
        const list = [...prev.bulletPointComparisons];
        list[idx] = { ...list[idx], applied: true };
        return { ...prev, bulletPointComparisons: list };
      });

      showToast('Resume experience updated with STAR-optimized bullet!', 'success');
    } catch (err) {
      showToast('Failed to save tailored experience.', 'error');
    }
  };

  if (!activeResume || !activeCompany) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 text-center">
        <div className="max-w-md rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 space-y-4 shadow-sm">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto animate-bounce" />
          <h3 className="text-base font-bold">Workspace Incomplete</h3>
          <p className="text-xs text-zinc-500">
            You must upload/create at least one **Resume** and complete a **Company Job Description Analysis** before checking your ATS Match scores.
          </p>
          <div className="pt-4 flex gap-3 justify-center">
            <a href="/resume-builder" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm">Resume Builder</a>
            <a href="/home" className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold">Analyze JD</a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center space-y-4">
          <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin mx-auto" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Re-indexing ATS parser matrices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 px-4 py-8 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* Header summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-indigo-600 animate-pulse" />
              Grok ATS Scanner & Advisor
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Comparing <b>{activeResume.name}</b> against <b>{activeCompany.jobTitle} ({activeCompany.companyName})</b>
            </p>
          </div>

          <button
            onClick={runATSCheck}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Recalculate Score
          </button>
        </div>

        {report && (
          <div className="space-y-8">
            
            {/* Bento Grid Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* ATS Score card */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 text-center space-y-2">
                <span className="text-[10px] uppercase font-bold text-zinc-400">ATS Compliance</span>
                <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{report.overallScore}/100</div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
                  <div className="h-full bg-indigo-600" style={{ width: `${report.overallScore}%` }} />
                </div>
                <p className="text-[10px] text-zinc-400">Target threshold: 75% for enterprise ATS parsers.</p>
              </div>

              {/* Keyword Match card */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 text-center space-y-2">
                <span className="text-[10px] uppercase font-bold text-zinc-400">Keyword Density</span>
                <div className="text-4xl font-black text-purple-600 dark:text-purple-400">{report.keywordMatchScore}%</div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
                  <div className="h-full bg-purple-600" style={{ width: `${report.keywordMatchScore}%` }} />
                </div>
                <p className="text-[10px] text-zinc-400">Density of target stack tools parsed.</p>
              </div>

              {/* Resume rating card */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 text-center space-y-3 flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400">AI Evaluation</span>
                <span className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-sm font-black tracking-tight uppercase">
                  {report.overallScore >= 80 ? 'EXCELLENT' : report.overallScore >= 60 ? 'GOOD' : 'NEEDS IMPROVEMENT'}
                </span>
              </div>

            </div>

            {/* Keyword gaps & suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Missing keywords */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                <h3 className="text-sm font-bold text-red-600 uppercase flex items-center gap-1.5">
                  <AlertTriangle className="h-4.5 w-4.5" />
                  Missing Critical Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {report.missingKeywords?.map((kw: string, i: number) => (
                    <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-950/30">
                      {kw}
                    </span>
                  ))}
                  {(!report.missingKeywords || report.missingKeywords.length === 0) && (
                    <span className="text-xs text-zinc-400">All target skills represented in your document!</span>
                  )}
                </div>
              </div>

              {/* Suggestions */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                <h3 className="text-sm font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                  <Layers className="h-4.5 w-4.5 text-indigo-500" />
                  SaaS Advisor Suggestions
                </h3>
                <ul className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300">
                  {report.suggestions?.map((sug: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 leading-relaxed">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      {sug}
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Side-by-side Experience bullet points rewrites comparison */}
            {report.bulletPointComparisons?.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
                <div>
                  <h3 className="text-base font-bold">STAR-Method Experience Comparison</h3>
                  <p className="text-xs text-zinc-400 mt-1">Review original experience phrasings vs. Grok tailored impact statements.</p>
                </div>

                <div className="space-y-6">
                  {report.bulletPointComparisons.map((comp: any, idx: number) => (
                    <div key={idx} className="p-4.5 rounded-xl border border-zinc-150 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/40 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                      
                      {/* Original */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Original phrasing</span>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal">{comp.original}</p>
                      </div>

                      {/* Suggested */}
                      <div className="space-y-3 border-l border-zinc-200 md:pl-6 dark:border-zinc-800">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-500 uppercase flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5" />
                            Grok STAR Suggestion
                          </span>
                          <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-normal mt-1">{comp.suggested}</p>
                        </div>

                        <div className="flex justify-end pt-1.5">
                          <button
                            onClick={() => handleApplyBullet(comp, idx)}
                            disabled={comp.applied}
                            className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer ${
                              comp.applied
                                ? 'bg-emerald-500 text-white cursor-default'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                          >
                            {comp.applied ? 'Adopted ✓' : 'Adopt AI Phrasing'}
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
