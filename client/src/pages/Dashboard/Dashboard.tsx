import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import {
  Sparkles, FileText, Briefcase, ChevronRight, TrendingUp,
  CheckCircle2, Bookmark, HelpCircle, MapPin, DollarSign,
  Layers, ArrowRight, ShieldCheck, Trash2, Search,
  PlusCircle, BookOpen, AlertCircle, RefreshCw, BarChart4,
  ExternalLink, ChevronDown, Home
} from 'lucide-react';

interface ResumeItem {
  _id: string;
  name: string;
  createdAt: string;
}

interface AppliedJob {
  _id: string;
  companyName: string;
  jobTitle: string;
  status: 'applied' | 'interviewing' | 'offered' | 'rejected' | 'interview' | 'completed';
  appliedDate: string;
  notes?: string;
}

interface SavedJob {
  _id: string;
  companyName: string;
  jobTitle: string;
  location?: string;
  salary?: string;
  createdAt: string;
}

interface AnalyzedCompany {
  _id: string;
  companyName: string;
  jobTitle: string;
  location?: string;
  techStack?: string[];
}

const STATUS_OPTIONS = [
  { value: 'applied', label: 'Applied', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'interview', label: 'Interview', color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 'rejected', label: 'Rejected', color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' }
];

export const Dashboard: React.FC = () => {
  const { user, showToast } = useApp();
  const navigate = useNavigate();

  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [analyzedCompanies, setAnalyzedCompanies] = useState<AnalyzedCompany[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & tab controls
  const [activeTab, setActiveTab] = useState<'resumes' | 'applied' | 'bookmarks'>('applied');
  const [searchQuery, setSearchQuery] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');
  const [isUpdatingStatusId, setIsUpdatingStatusId] = useState<string | null>(null);
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    setExpandedIndex(null);
  }, [questionSearch]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [resumesRes, appliedRes, savedRes, companiesRes] = await Promise.all([
        axios.get('/api/resume/all'),
        axios.get('/api/company/applied/all'),
        axios.get('/api/company/saved/all'),
        axios.get('/api/company/all')
      ]);

      setResumes(resumesRes.data);
      setAppliedJobs(appliedRes.data);
      setSavedJobs(savedRes.data);
      setAnalyzedCompanies(companiesRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      showToast('Error syncing dashboard metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResume = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      await axios.delete(`/api/resume/${id}`);
      setResumes((prev) => prev.filter((r) => r._id !== id));
      showToast('Resume removed successfully.', 'success');
    } catch (err) {
      showToast('Failed to delete resume.', 'error');
    }
  };

  const handleDeleteSaved = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await axios.delete(`/api/company/saved/${id}`);
      setSavedJobs((prev) => prev.filter((s) => s._id !== id));
      showToast('Saved job bookmark removed.', 'success');
    } catch (err) {
      showToast('Failed to remove saved job.', 'error');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setIsUpdatingStatusId(id);
    try {
      await axios.put(`/api/company/applied/${id}`, { status });
      setAppliedJobs((prev) =>
        prev.map((job) => (job._id === id ? { ...job, status: status as any } : job))
      );
      showToast('Application status updated.', 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update status.';
      showToast(errMsg, 'error');
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdatingStatusId(null);
    }
  };

  const handleDeleteApplied = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Remove this application log?')) return;
    try {
      await axios.delete(`/api/company/applied/${id}`);
      setAppliedJobs((prev) => prev.filter((j) => j._id !== id));
      showToast('Application log removed.', 'success');
    } catch (err) {
      showToast('Failed to delete application log.', 'error');
    }
  };

  // Find dynamic company _id based on name matching
  const findCompanyId = (companyName: string) => {
    const clean = companyName.toLowerCase().trim();
    const comp = analyzedCompanies.find((c) => c.companyName.toLowerCase().trim() === clean);
    return comp ? comp._id : null;
  };

  // Calculate dynamic match scores for jobs based on tech overlays
  const calculateMatchScore = (companyName: string) => {
    const clean = companyName.toLowerCase().trim();
    const comp = analyzedCompanies.find((c) => c.companyName.toLowerCase().trim() === clean);
    if (!comp) return 72; // default realistic baseline
    const techCount = comp.techStack?.length || 0;
    const score = 65 + (techCount * 4) + (comp.location?.toLowerCase().includes('remote') ? 8 : 4);
    return Math.min(score, 98); // cap at 98%
  };

  const scoreData = analyzedCompanies.slice(-6).map((comp) => ({
    companyName: comp.companyName,
    score: calculateMatchScore(comp.companyName),
  }));

  const avgConfirmScore = analyzedCompanies.length > 0
    ? Math.round(analyzedCompanies.reduce((acc, curr) => acc + calculateMatchScore(curr.companyName), 0) / analyzedCompanies.length)
    : 0;

  // Calculate stats status breakdown
  const statusStats = {
    applied: appliedJobs.filter((j) => j.status === 'applied').length,
    interview: appliedJobs.filter((j) => j.status === 'interview' || j.status === 'interviewing').length,
    completed: appliedJobs.filter((j) => j.status === 'completed' || j.status === 'offered').length,
    rejected: appliedJobs.filter((j) => j.status === 'rejected').length,
    total: appliedJobs.length
  };

  // Render Chart Coordinates
  const statusPercentages = {
    applied: statusStats.total ? Math.round((statusStats.applied / statusStats.total) * 100) : 0,
    interview: statusStats.total ? Math.round((statusStats.interview / statusStats.total) * 100) : 0,
    completed: statusStats.total ? Math.round((statusStats.completed / statusStats.total) * 100) : 0,
    rejected: statusStats.total ? Math.round((statusStats.rejected / statusStats.total) * 100) : 0
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Synchronizing application dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">

      {/* 1. TOP SUMMARY CONTAINER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-zinc-950 py-10 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="mx-auto max-w-[96%] w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-2">
                <BarChart4 className="h-6 w-6 text-indigo-400" />
                Applications Command Center
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Monitor status distribution ratios, manage resumes, and track dynamic match parameters.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/home"
                className="flex items-center gap-1.5 self-start px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 hover:text-white border border-indigo-500/20 text-xs font-bold transition-all cursor-pointer"
              >
                <Home className="h-3.5 w-3.5" />
                Back to Home
              </Link>
              <button
                onClick={fetchDashboardData}
                className="flex items-center gap-1.5 self-start px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh Dashboard
              </button>
            </div>
          </div>

          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between shadow-lg backdrop-blur-sm">
              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Jobs Applied</span>
              <span className="text-3xl font-black mt-2 text-indigo-300">{statusStats.total}</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between shadow-lg backdrop-blur-sm">
              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Active Resumes</span>
              <span className="text-3xl font-black mt-2 text-purple-300">{resumes.length}</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between shadow-lg backdrop-blur-sm">
              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Bookmarked Jobs</span>
              <span className="text-3xl font-black mt-2 text-amber-300">{savedJobs.length}</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between shadow-lg backdrop-blur-sm">
              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Job Confirm Score</span>
              <span className="text-3xl font-black mt-2 text-emerald-300">{avgConfirmScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ANALYTICS & CHARTS PANEL */}
      <div className="mx-auto max-w-[96%] w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch mb-8">

          {/* Pie Chart Card */}
          <div className="lg:col-span-1 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col justify-between">
            <h3 className="text-sm font-black flex items-center gap-1.5 text-zinc-800 dark:text-zinc-100 mb-4">
              Application Status Breakdown
            </h3>

            {statusStats.total === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-400 dark:text-zinc-500 min-h-[180px]">
                <Briefcase className="h-10 w-10 mb-2 opacity-40" />
                <span className="text-xs font-semibold">No status data compiled yet.</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-grow py-4">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  {/* Clean CSS-SVG Pie Ring */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f4f4f5" strokeWidth="3" className="dark:stroke-zinc-800" />

                    {/* Ring segments based on percentages */}
                    {statusPercentages.applied > 0 && (
                      <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="3.2"
                        strokeDasharray={`${statusPercentages.applied} ${100 - statusPercentages.applied}`}
                        strokeDashoffset="0"
                      />
                    )}
                    {statusPercentages.interview > 0 && (
                      <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="3.2"
                        strokeDasharray={`${statusPercentages.interview} ${100 - statusPercentages.interview}`}
                        strokeDashoffset={`-${statusPercentages.applied}`}
                      />
                    )}
                    {statusPercentages.completed > 0 && (
                      <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3.2"
                        strokeDasharray={`${statusPercentages.completed} ${100 - statusPercentages.completed}`}
                        strokeDashoffset={`-${statusPercentages.applied + statusPercentages.interview}`}
                      />
                    )}
                    {statusPercentages.rejected > 0 && (
                      <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="3.2"
                        strokeDasharray={`${statusPercentages.rejected} ${100 - statusPercentages.rejected}`}
                        strokeDashoffset={`-${statusPercentages.applied + statusPercentages.interview + statusPercentages.completed}`}
                      />
                    )}
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-zinc-800 dark:text-white">{statusStats.total}</span>
                    <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Total logged</span>
                  </div>
                </div>

                {/* Legends */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-6 w-full text-[11px] font-bold">
                  <div className="flex items-center gap-1.5 text-zinc-650 dark:text-zinc-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 shrink-0" />
                    <span>Applied: {statusPercentages.applied}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-650 dark:text-zinc-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span>Interview: {statusPercentages.interview}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-650 dark:text-zinc-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Completed: {statusPercentages.completed}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-650 dark:text-zinc-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
                    <span>Rejected: {statusPercentages.rejected}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Activity Graph Card */}
          <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col justify-between">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <h3 className="text-sm font-black flex items-center gap-1.5 text-zinc-800 dark:text-zinc-100">
                Job Confirmation Score Progression
              </h3>
              <span className="shrink-0 text-[10px] font-black px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 uppercase tracking-wide">
                AI Analytics
              </span>
            </div>

            {/* Custom SVG Line Graph */}
            <div className="flex-grow flex items-center justify-center py-2 h-44 relative min-h-[140px]">
              {scoreData.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-zinc-400 dark:text-zinc-500">
                  <AlertCircle className="h-7 w-7 mb-2 text-indigo-500 opacity-60" />
                  <span className="text-xs font-bold">No score progression data yet.</span>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-[280px]">
                    Run a job analysis on the Home page to start tracking scores.
                  </p>
                </div>
              ) : (
                <svg className="w-full h-full" viewBox="0 0 500 150">
                  {/* Horizontal Gridlines */}
                  <line x1="20" y1="20" x2="480" y2="20" stroke="#e4e4e7" strokeWidth="0.5" className="dark:stroke-zinc-800" strokeDasharray="3 3" />
                  <line x1="20" y1="65" x2="480" y2="65" stroke="#e4e4e7" strokeWidth="0.5" className="dark:stroke-zinc-800" strokeDasharray="3 3" />
                  <line x1="20" y1="110" x2="480" y2="110" stroke="#e4e4e7" strokeWidth="0.5" className="dark:stroke-zinc-800" strokeDasharray="3 3" />

                  {/* Bottom line axis */}
                  <line x1="20" y1="130" x2="480" y2="130" stroke="#d4d4d8" strokeWidth="1" className="dark:stroke-zinc-800" />

                  {/* Dynamic Graph Path representing logged steps */}
                  {(() => {
                    const getX = (idx: number) => scoreData.length === 1 ? 250 : 40 + (idx * (420 / (scoreData.length - 1)));
                    const getY = (s: number) => 130 - s;
                    let d = `M ${getX(0)} ${getY(scoreData[0].score)}`;
                    for (let i = 1; i < scoreData.length; i++) {
                      d += ` L ${getX(i)} ${getY(scoreData[i].score)}`;
                    }
                    return (
                      <path
                        d={d}
                        fill="none"
                        stroke="url(#indigo-grad)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    );
                  })()}

                  {/* Dynamic Point Marks and text labels */}
                  {scoreData.map((item, i) => {
                    const getX = (idx: number) => scoreData.length === 1 ? 250 : 40 + (idx * (420 / (scoreData.length - 1)));
                    const getY = (s: number) => 130 - s;
                    const cx = getX(i);
                    const cy = getY(item.score);
                    return (
                      <g key={i}>
                        <circle cx={cx} cy={cy} r="4.5" className="fill-indigo-600 stroke-white stroke-2 dark:stroke-zinc-900" />
                        <text x={cx} y={cy - 12} textAnchor="middle" className="text-[10px] font-black fill-indigo-650 dark:fill-indigo-400">
                          {item.score}%
                        </text>
                        <text x={cx} y="145" textAnchor="middle" className="text-[9px] font-black fill-zinc-400 dark:fill-zinc-500 uppercase tracking-wide">
                          {item.companyName.length > 8 ? item.companyName.substring(0, 6) + '..' : item.companyName}
                        </text>
                      </g>
                    );
                  })}

                  {/* SVG Gradient definitions */}
                  <defs>
                    <linearGradient id="indigo-grad" x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
              )}
            </div>

            <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 leading-normal mt-2">
              Graph maps historical job confirmation scores recursively across recent analyzed opportunities.
            </p>
          </div>
        </div>

        {/* 3. WORKSPACE MANAGEMENTS PANEL */}
        <div className="w-full space-y-6">

          {/* Header Tabs */}
          <div className="flex justify-start w-full border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => { setActiveTab('applied'); setSearchQuery(''); }}
              className={`py-3.5 px-5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'applied'
                ? 'border-indigo-650 text-indigo-650 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
            >
              <Briefcase className="h-4 w-4 shrink-0" />
              My Job List ({appliedJobs.length})
            </button>
            <button
              onClick={() => { setActiveTab('resumes'); setSearchQuery(''); }}
              className={`py-3.5 px-5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'resumes'
                ? 'border-indigo-650 text-indigo-650 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
            >
              <FileText className="h-4 w-4 shrink-0" />
              My Resumes ({resumes.length})
            </button>
            <button
              onClick={() => { setActiveTab('bookmarks'); setSearchQuery(''); }}
              className={`py-3.5 px-5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'bookmarks'
                ? 'border-indigo-650 text-indigo-650 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
            >
              <Bookmark className="h-4 w-4 shrink-0" />
              Bookmarked ({savedJobs.length})
            </button>
          </div>

          {/* TAB CONTENTS */}
          <div className="min-h-[300px]">

            {/* APPLIED JOBS PANEL */}
            {activeTab === 'applied' && (
              <div className="space-y-4">
                {appliedJobs.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-200 border-dashed p-10 text-center text-zinc-400 dark:border-zinc-800 dark:text-zinc-500 bg-white dark:bg-zinc-900">
                    <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-40 text-indigo-500" />
                    <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No job applications logged yet</h4>
                    <p className="text-xs mt-1.5 max-w-sm mx-auto">
                      Once you run a job analysis on the Home page, you can log it as an active application stage.
                    </p>
                    <Link
                      to="/home"
                      className="inline-flex items-center gap-1 mt-4 px-4 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Analyze New Job Description
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {appliedJobs.map((job) => {
                      const companyId = findCompanyId(job.companyName);
                      const matchScore = calculateMatchScore(job.companyName);
                      return (
                        <div
                          key={job._id}
                          className="p-5 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-indigo-500/40 transition-all"
                        >
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${job.status === 'completed' || job.status === 'offered'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/65'
                                : job.status === 'interview' || job.status === 'interviewing'
                                  ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/65'
                                  : job.status === 'rejected'
                                    ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/65'
                                    : 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/65'
                                }`}>
                                {job.status === 'interviewing' ? 'interview' : job.status === 'offered' ? 'completed' : job.status}
                              </span>

                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-50 border border-zinc-150 text-zinc-650 dark:bg-zinc-950/60 dark:border-zinc-800/80 dark:text-zinc-400 flex items-center gap-1">
                                Match Score:
                                <b className="text-indigo-600 dark:text-indigo-400">{matchScore}%</b>
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate">
                              {job.jobTitle}
                            </h4>

                            <p className="text-xs text-zinc-450 dark:text-zinc-500 font-semibold">
                              {job.companyName} • Logged on {new Date(job.appliedDate).toLocaleDateString()}
                            </p>

                            {job.notes && (
                              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 italic mt-1.5 truncate">
                                Notes: "{job.notes}"
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {/* Custom Status Dropdown */}
                            <div className="relative">
                              <button
                                disabled={isUpdatingStatusId === job._id}
                                onClick={() => setOpenStatusDropdownId(openStatusDropdownId === job._id ? null : job._id)}
                                onBlur={(e) => {
                                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                    setTimeout(() => setOpenStatusDropdownId(null), 150);
                                  }
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all disabled:opacity-50
                                    ${openStatusDropdownId === job._id
                                    ? 'border-indigo-500 bg-white dark:bg-zinc-900 dark:border-indigo-500 shadow-sm'
                                    : 'border-zinc-200 bg-zinc-50 hover:bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900'}
                                    ${STATUS_OPTIONS.find(o => o.value === (job.status === 'interviewing' ? 'interview' : job.status === 'offered' ? 'completed' : job.status))?.color || ''}
                                  `}
                              >
                                {STATUS_OPTIONS.find(o => o.value === (job.status === 'interviewing' ? 'interview' : job.status === 'offered' ? 'completed' : job.status))?.label || job.status}
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openStatusDropdownId === job._id ? 'rotate-180' : ''}`} />
                              </button>

                              <AnimatePresence>
                                {openStatusDropdownId === job._id && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-1.5 w-36 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-20"
                                  >
                                    <div className="flex flex-col py-1">
                                      {STATUS_OPTIONS.map((opt) => (
                                        <button
                                          key={opt.value}
                                          onClick={() => {
                                            handleUpdateStatus(job._id, opt.value);
                                            setOpenStatusDropdownId(null);
                                          }}
                                          className={`text-left flex items-center gap-2 px-3 py-2 text-[11px] font-bold transition-colors w-full
                                              ${(job.status === 'interviewing' ? 'interview' : job.status === 'offered' ? 'completed' : job.status) === opt.value
                                              ? 'bg-zinc-50 dark:bg-zinc-800/50 text-indigo-600 dark:text-indigo-400'
                                              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                                            }
                                            `}
                                        >
                                          <span className={`w-2 h-2 rounded-full ${opt.color.split(' ')[0]}`} />
                                          {opt.label}
                                        </button>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>


                            {companyId ? (
                              <Link
                                to={`/company/${companyId}`}
                                className="p-2 rounded-xl border border-zinc-200 hover:border-indigo-200/50 bg-white hover:bg-indigo-50/40 text-zinc-600 hover:text-indigo-600 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:!bg-indigo-950/30 dark:hover:!border-indigo-900/40 dark:hover:!text-indigo-400 transition-all cursor-pointer duration-200 flex items-center justify-center"
                                title="View Database Details"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            ) : (
                              <button
                                onClick={() => {
                                  showToast(`Company details not indexed. Run an analysis on the Home page for "${job.companyName}".`, 'info');
                                }}
                                className="p-2 rounded-xl border border-zinc-200 bg-zinc-100 opacity-60 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 flex items-center justify-center cursor-not-allowed"
                                title="Details not analyzed yet"
                              >
                                <AlertCircle className="h-4 w-4" />
                              </button>
                            )}

                            <button
                              onClick={(e) => handleDeleteApplied(job._id, e)}
                              className="p-2 rounded-xl border border-red-200 hover:border-red-300 bg-white hover:bg-red-50 text-red-500 dark:border-red-950/50 dark:bg-zinc-900 dark:hover:bg-red-950/20 transition-all cursor-pointer duration-200"
                              title="Delete Log"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* MY RESUMES PANEL */}
            {activeTab === 'resumes' && (
              <div className="space-y-4">
                {resumes.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-200 border-dashed p-10 text-center text-zinc-400 dark:border-zinc-800 dark:text-zinc-500 bg-white dark:bg-zinc-900">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-40 text-purple-500" />
                    <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No resumes registered yet</h4>
                    <p className="text-xs mt-1.5 max-w-sm mx-auto">
                      Upload your core professional resume inside the resume workspace to analyze benchmarks.
                    </p>
                    <Link
                      to="/resume-builder"
                      className="inline-flex items-center gap-1 mt-4 px-4 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Open Resume Builder
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {resumes.map((res) => (
                      <div
                        key={res._id}
                        className="p-5 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col justify-between gap-4 group hover:border-indigo-500/40 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5 min-w-0">
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-650 dark:bg-purple-950/40 dark:text-purple-400">
                              PDF Document
                            </span>
                            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate mt-1">
                              {res.name}
                            </h4>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">
                              Registered on {new Date(res.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <button
                            onClick={(e) => handleDeleteResume(res._id, e)}
                            className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer shrink-0"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>

                        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
                          <Link
                            to="/resume-builder"
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            View & Rephrase Bullets
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* BOOKMARKS PANEL */}
            {activeTab === 'bookmarks' && (
              <div className="space-y-4">
                {savedJobs.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-200 border-dashed p-10 text-center text-zinc-400 dark:border-zinc-800 dark:text-zinc-500 bg-white dark:bg-zinc-900">
                    <Bookmark className="h-10 w-10 mx-auto mb-3 opacity-40 text-amber-500" />
                    <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No bookmarked jobs yet</h4>
                    <p className="text-xs mt-1.5 max-w-sm mx-auto">
                      Bookmark jobs directly on the Company Details panels to easily keep track of them here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {savedJobs.map((job) => {
                      const companyId = findCompanyId(job.companyName);
                      return (
                        <div
                          key={job._id}
                          className="p-5 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-indigo-500/40 transition-all"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate">
                              {job.jobTitle}
                            </h4>
                            <p className="text-xs text-zinc-455 dark:text-zinc-500 font-semibold">
                              {job.companyName} {job.location ? `• ${job.location}` : ''}
                            </p>
                            {job.salary && (
                              <p className="text-[11px] font-bold text-indigo-650 dark:text-indigo-400">
                                Salary: {job.salary}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {companyId ? (
                              <Link
                                to={`/company/${companyId}`}
                                className="px-4 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold transition-all flex items-center gap-1"
                              >
                                Go to Details
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            ) : (
                              <button
                                onClick={() => {
                                  showToast(`Company details not indexed. Run an analysis on the Home page for "${job.companyName}".`, 'info');
                                }}
                                className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-450 border border-zinc-200 text-xs font-bold transition-all dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400 cursor-not-allowed"
                              >
                                Analyze to View
                              </button>
                            )}

                            <button
                              onClick={(e) => handleDeleteSaved(job._id, e)}
                              className="p-2 rounded-xl border border-red-200 hover:border-red-300 bg-white hover:bg-red-50 text-red-500 dark:border-red-950/50 dark:bg-zinc-900 dark:hover:bg-red-950/20 transition-all cursor-pointer duration-200"
                              title="Remove Bookmark"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
