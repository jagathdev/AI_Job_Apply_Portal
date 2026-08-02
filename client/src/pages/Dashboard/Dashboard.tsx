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
  format?: 'pdf' | 'docx';
  createdAt: string;
  atsScore?: number;
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
  createdAt?: string;
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
  const [resumeFilter, setResumeFilter] = useState<'all' | 'pdf' | 'docx'>('all');
  const [chartView, setChartView] = useState<'week' | 'month'>('week');
  const [jobMonthFilter, setJobMonthFilter] = useState<string>('all');
  const [jobDisplayLimit, setJobDisplayLimit] = useState<number>(6);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    type: 'resume' | 'applied' | 'saved' | 'company';
    title: string;
    message: string;
  }>({ isOpen: false, id: '', type: 'resume', title: '', message: '' });

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

  const handleDeleteResume = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteModal({
      isOpen: true,
      id,
      type: 'resume',
      title: 'Delete Resume',
      message: 'Are you sure you want to delete this resume? This action cannot be undone.'
    });
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteModal({
      isOpen: true,
      id,
      type: 'saved',
      title: 'Remove Bookmark',
      message: 'Are you sure you want to remove this bookmarked job?'
    });
  };

  const handleDeleteCompany = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteModal({
      isOpen: true,
      id,
      type: 'company',
      title: 'Delete Job Analysis',
      message: 'Are you sure you want to delete this generated job analysis?'
    });
  };

  const confirmDelete = async () => {
    const { id, type } = deleteModal;
    setDeleteModal(prev => ({ ...prev, isOpen: false }));
    try {
      if (type === 'resume') {
        await axios.delete(`/api/resume/${id}`);
        setResumes((prev) => prev.filter((r) => r._id !== id));
        showToast('Resume removed successfully.', 'success');
      } else if (type === 'saved') {
        await axios.delete(`/api/company/saved/${id}`);
        setSavedJobs((prev) => prev.filter((s) => s._id !== id));
        showToast('Saved job bookmark removed.', 'success');
      } else if (type === 'company') {
        await axios.delete(`/api/company/${id}`);
        setAnalyzedCompanies((prev) => prev.filter((c) => c._id !== id));
        showToast('Job analysis deleted.', 'success');
      } else if (type === 'applied') {
        await axios.delete(`/api/company/applied/${id}`);
        setAppliedJobs((prev) => prev.filter((j) => j._id !== id));
        showToast('Application log removed.', 'success');
      }
    } catch (err) {
      showToast('Failed to delete item.', 'error');
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

  const handleDeleteApplied = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteModal({
      isOpen: true,
      id,
      type: 'applied',
      title: 'Delete Application Log',
      message: 'Are you sure you want to remove this application log?'
    });
  };

  // Find dynamic company _id based on name matching
  const findCompanyId = (companyName: string) => {
    const clean = companyName.toLowerCase().trim();
    const comp = analyzedCompanies.find((c) => c.companyName.toLowerCase().trim() === clean);
    return comp ? comp._id : null;
  };

  // Calculate dynamic match scores for jobs based on tech overlays
  // Group and sort analyzed companies
  const groupedJobs = React.useMemo(() => {
    let filtered = analyzedCompanies;

    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (jobMonthFilter !== 'all') {
      filtered = filtered.filter(job => {
        if (!job.createdAt) return false;
        const date = new Date(job.createdAt);
        return date.getMonth().toString() === jobMonthFilter;
      });
    }

    // Sort descending by date
    const sorted = [...filtered].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    // Group by formatted date
    const groups: { dateStr: string; dateObj: Date; jobs: AnalyzedCompany[] }[] = [];

    sorted.forEach(job => {
      if (!job.createdAt) return;
      const dateObj = new Date(job.createdAt);
      // Format as "Aug 1"
      const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const existingGroup = groups.find(g => g.dateStr === dateStr);
      if (existingGroup) {
        existingGroup.jobs.push(job);
      } else {
        groups.push({ dateStr, dateObj, jobs: [job] });
      }
    });

    return groups;
  }, [analyzedCompanies, searchQuery, jobMonthFilter]);

  const visibleGroupedJobs = React.useMemo(() => {
    let count = 0;
    const visibleGroups: typeof groupedJobs = [];

    for (const group of groupedJobs) {
      if (count >= jobDisplayLimit) break;

      if (count + group.jobs.length <= jobDisplayLimit) {
        visibleGroups.push(group);
        count += group.jobs.length;
      } else {
        // Only push up to the limit
        const remaining = jobDisplayLimit - count;
        visibleGroups.push({
          ...group,
          jobs: group.jobs.slice(0, remaining)
        });
        count += remaining;
        break;
      }
    }

    return visibleGroups;
  }, [groupedJobs, jobDisplayLimit]);

  const handleLoadMore = () => {
    setJobDisplayLimit(prev => prev + 12);
  };

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
              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Jobs Generated</span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-black text-indigo-300">{analyzedCompanies.length}</span>
                <span className="text-[10px] font-bold text-zinc-400/60 uppercase tracking-wider mb-1">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
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
                Jobs Generated
              </h3>

              <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                <button
                  onClick={() => setChartView('week')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${chartView === 'week' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                  Week
                </button>
                <button
                  onClick={() => setChartView('month')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${chartView === 'month' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                  Month
                </button>
              </div>
            </div>

            {/* Custom SVG Bar Graph */}
            <div className="flex-grow flex items-end justify-center py-2 h-[280px] relative min-h-[280px]">
              {(() => {
                let data: { label: string; count: number; fullLabel: string; companies: string[] }[] = [];

                if (chartView === 'week') {
                  // Week view (Mon - Sun)
                  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                  const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                  data = days.map((d, i) => ({ label: d, count: 0, fullLabel: fullDays[i], companies: [] }));

                  const today = new Date();
                  const currentDayIndex = (today.getDay() + 6) % 7; // 0 for Mon, 6 for Sun
                  const startOfWeek = new Date(today);
                  startOfWeek.setDate(today.getDate() - currentDayIndex);
                  startOfWeek.setHours(0, 0, 0, 0);

                  analyzedCompanies.forEach(job => {
                    if (!job.createdAt) return;
                    const date = new Date(job.createdAt);
                    if (date >= startOfWeek) {
                      const dayIdx = (date.getDay() + 6) % 7;
                      data[dayIdx].count++;
                      data[dayIdx].companies.push(job.companyName);
                    }
                  });
                } else {
                  // Month view (Jan - Dec)
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  data = months.map(m => ({ label: m, count: 0, fullLabel: m, companies: [] }));
                  const currentYear = new Date().getFullYear();

                  analyzedCompanies.forEach(job => {
                    if (!job.createdAt) return;
                    const date = new Date(job.createdAt);
                    if (date.getFullYear() === currentYear) {
                      const monthIdx = date.getMonth();
                      data[monthIdx].count++;
                      data[monthIdx].companies.push(job.companyName);
                    }
                  });
                }

                const maxCount = Math.max(...data.map(d => d.count), 5); // Ensure some height even if small
                const barWidth = chartView === 'week' ? 30 : 20;
                const gap = chartView === 'week' ? 40 : 15;
                const maxHeight = 100;

                return (
                  <div className="w-full h-full overflow-x-auto overflow-y-hidden scrollbar-hide flex items-end justify-start sm:justify-center relative pb-[40px] px-2 pt-[100px]">
                    {/* Horizontal grid line */}
                    <div className="absolute bottom-[40px] left-0 right-0 h-px bg-zinc-200 dark:bg-zinc-800"></div>

                    <div className="flex items-end gap-[15px] sm:gap-[40px] px-2 h-[120px] mt-auto" style={{ gap: `${gap}px` }}>
                      {data.map((item, idx) => {
                        const height = (item.count / maxCount) * maxHeight;
                        return (
                          <div key={idx} className="flex flex-col items-center justify-end group relative h-full">
                            {/* Tooltip with Companies List */}
                            <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold p-2.5 rounded-lg shadow-xl pointer-events-none z-10 min-w-[140px] flex flex-col items-center">
                              <div className="text-indigo-400 dark:text-indigo-600 mb-1.5 pb-1.5 border-b border-zinc-700 dark:border-zinc-200 w-full text-center">
                                {item.fullLabel}: {item.count} jobs
                              </div>
                              {item.companies.length > 0 ? (
                                <ul className="flex flex-col gap-1 text-left font-medium w-full">
                                  {item.companies.slice(-5).map((c, i) => (
                                    <li key={i} className="truncate max-w-[160px] text-zinc-300 dark:text-zinc-600">• {c}</li>
                                  ))}
                                  {item.companies.length > 5 && (
                                    <li className="text-zinc-400 dark:text-zinc-500 italic mt-0.5 font-bold text-center w-full">+{item.companies.length - 5} more</li>
                                  )}
                                </ul>
                              ) : (
                                <span className="text-zinc-500 font-medium italic">No jobs</span>
                              )}

                              {/* Triangle pointer */}
                              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-zinc-800 dark:bg-white rounded-sm"></div>
                            </div>

                            {/* Count label above bar */}
                            {item.count > 0 && (
                              <span className="text-[10px] font-black text-indigo-500 mb-1.5">{item.count}</span>
                            )}
                            {item.count === 0 && (
                              <span className="text-[10px] font-black text-zinc-300 dark:text-zinc-600 mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity">{item.count}</span>
                            )}

                            {/* Bar */}
                            <div
                              className={`w-[${barWidth}px] rounded-t-sm transition-all duration-500 hover:brightness-110 ${item.count > 0 ? 'bg-gradient-to-t from-indigo-600 to-purple-500' : 'bg-zinc-100 dark:bg-zinc-800'}`}
                              style={{ height: `${height || 2}px`, width: `${barWidth}px` }}
                            ></div>

                            {/* X Axis Label */}
                            <span className="absolute top-full mt-3 text-[9px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap left-1/2 -translate-x-1/2">{item.fullLabel}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
            <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 leading-normal mt-6 text-center">
              Graph maps the amount of jobs generated by week and month.
            </p>
          </div>
        </div>

        {/* 3. WORKSPACE MANAGEMENTS PANEL */}
        <div className="w-full space-y-6">

          {/* Header Tabs & Search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-6 gap-4">
            <div className="flex justify-start overflow-x-auto scrollbar-hide w-full sm:w-auto">
              <button
                onClick={() => { setActiveTab('applied'); setSearchQuery(''); }}
                className={`py-3.5 px-5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'applied'
                  ? 'border-indigo-650 text-indigo-650 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
              >
                <Briefcase className="h-4 w-4 shrink-0" />
                My Job List ({analyzedCompanies.length})
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

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              {activeTab === 'applied' && (
                <div className="relative shrink-0">
                  <select
                    value={jobMonthFilter}
                    onChange={(e) => setJobMonthFilter(e.target.value)}
                    className="pl-3 pr-8 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-all text-zinc-800 dark:text-zinc-200 appearance-none cursor-pointer"
                  >
                    <option value="all">All Months</option>
                    <option value="0">January</option>
                    <option value="1">February</option>
                    <option value="2">March</option>
                    <option value="3">April</option>
                    <option value="4">May</option>
                    <option value="5">June</option>
                    <option value="6">July</option>
                    <option value="7">August</option>
                    <option value="8">September</option>
                    <option value="9">October</option>
                    <option value="10">November</option>
                    <option value="11">December</option>
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              )}
              <div className="relative w-full sm:w-64 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all text-zinc-800 dark:text-zinc-200"
                />
              </div>
            </div>
          </div>

          {/* TAB CONTENTS */}
          <div className="min-h-[300px]">

            {/* APPLIED JOBS PANEL */}
            {activeTab === 'applied' && (
              <div className="space-y-4">
                {analyzedCompanies.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-200 border-dashed p-10 text-center text-zinc-400 dark:border-zinc-800 dark:text-zinc-500 bg-white dark:bg-zinc-900">
                    <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-40 text-indigo-500" />
                    <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No job analysis generated yet</h4>
                    <p className="text-xs mt-1.5 max-w-sm mx-auto">
                      Once you run a job analysis on the Home page, it will appear here.
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
                  <div className="space-y-8">
                    {visibleGroupedJobs.map((group, groupIdx) => (
                      <div key={groupIdx} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <h4 className="text-sm font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">{group.dateStr}</h4>
                          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                          {group.jobs.map((job) => {
                            const matchScore = calculateMatchScore(job.companyName);
                            return (
                              <div
                                key={job._id}
                                className="p-5 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col justify-between gap-4 group hover:border-indigo-500/40 transition-all"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-2 min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                      <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-50 border border-zinc-150 text-zinc-650 dark:bg-zinc-950/60 dark:border-zinc-800/80 dark:text-zinc-400 items-center gap-1">
                                        Match Score:
                                        <b className="text-indigo-600 dark:text-indigo-400">{matchScore}%</b>
                                      </span>

                                      <button
                                        onClick={(e) => handleDeleteCompany(job._id, e)}
                                        className="p-1.5 -m-1.5 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer shrink-0"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>

                                    <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 line-clamp-2 mt-1">
                                      {job.jobTitle}
                                    </h4>

                                    <p className="text-xs text-zinc-450 dark:text-zinc-500 font-semibold line-clamp-2">
                                      {job.companyName}
                                    </p>
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
                                  <Link
                                    to={`/company/${job._id}`}
                                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 w-full"
                                    title="View Database Details"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    View Details
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {visibleGroupedJobs.reduce((acc, g) => acc + g.jobs.length, 0) < groupedJobs.reduce((acc, g) => acc + g.jobs.length, 0) && (
                      <div className="pt-4 flex justify-center">
                        <button
                          onClick={handleLoadMore}
                          className="px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                        >
                          Load More Jobs
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
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
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {resumes
                        .filter(res => {
                          if (resumeFilter === 'all') return true;
                          const resFormat = res.format || 'pdf'; // Default old resumes to pdf
                          return resFormat === resumeFilter;
                        })
                        .filter(res => res.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((res) => {
                          const resFormat = res.format || 'pdf';
                          return (
                            <div
                              key={res._id}
                              className="p-5 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col justify-between gap-4 group hover:border-indigo-500/40 transition-all"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1.5 min-w-0">
                                  <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate mt-1">
                                    {res.name}
                                  </h4>
                                  <div className="flex items-center gap-2 flex-wrap mt-1">
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">
                                      Registered on {new Date(res.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' })}
                                    </p>
                                    {res.atsScore !== undefined && res.atsScore > 0 && (
                                      <span className="inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-50 border border-zinc-200 text-zinc-600 dark:bg-zinc-950/60 dark:border-zinc-800/80 dark:text-zinc-400 items-center gap-1">
                                        ATS Score: <b className="text-indigo-600 dark:text-indigo-400">{res.atsScore}%</b>
                                      </span>
                                    )}
                                  </div>
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
                          );
                        })}
                    </div>
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 text-left shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    {deleteModal.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {deleteModal.message}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
