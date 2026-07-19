import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { motion } from 'motion/react';
import axios from 'axios';
import {
  Sparkles, FileText, Briefcase, Trophy, ChevronRight,
  TrendingUp, Calendar, AlertCircle, Play, CheckCircle2,
  Bookmark, ClipboardList, HelpCircle
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, refreshDashboardStats, dashboardStats, theme, toggleTheme, showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    await refreshDashboardStats();
    setLoading(false);
  };

  const getTodayDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const stats = dashboardStats?.stats || {
    hasResume: false,
    hasCompany: false,
    hasInterview: false,
    recentResumeId: null,
    recentCompanyId: null,
    recentCompanyName: null,
    recentJobTitle: null,
  };

  const activities = dashboardStats?.activities || [];
  const completionPercentage = user?.profileCompletion || 35;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 px-4 py-8 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200/50 pb-6 dark:border-zinc-800/50">
          <div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <Calendar className="h-3.5 w-3.5" />
              {getTodayDate()}
            </span>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Candidate'}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Here is the state of your application pipeline. Use AI to optimize your edge.
            </p>
          </div>

          {/* Mini controls */}
          <div className="flex items-center gap-3">
            <Link
              to="/home"
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4.5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 transition-all cursor-pointer"
            >
              <Briefcase className="h-4 w-4" />
              Analyze New JD
            </Link>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Progress & Core Actions */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Completion Dial Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
              <h3 className="text-sm font-semibold tracking-tight text-zinc-600 dark:text-zinc-400">Profile Strength</h3>
              <div className="mt-6 flex flex-col items-center">
                
                {/* SVG Radial progress */}
                <div className="relative flex items-center justify-center">
                  <svg className="h-32 w-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      className="stroke-zinc-100 dark:stroke-zinc-800 fill-transparent"
                      strokeWidth="8"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      className="stroke-indigo-600 fill-transparent transition-all duration-1000"
                      strokeWidth="8"
                      strokeDasharray="339.292"
                      strokeDashoffset={339.292 - (339.292 * completionPercentage) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black">{completionPercentage}%</span>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Ready</span>
                  </div>
                </div>

                <div className="mt-6 text-center space-y-1">
                  <h4 className="text-xs font-bold">
                    {completionPercentage < 50 ? 'Bootstrap in Progress' : completionPercentage < 80 ? 'Competitive Ready' : 'Fully Optimized'}
                  </h4>
                  <p className="text-[11px] text-zinc-400 max-w-[200px]">
                    {completionPercentage < 60 ? 'Upload your resume and complete a JD analysis to increase score!' : 'You have active documents ready to optimize! Check your metrics below.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-zinc-200/80 bg-white p-4 dark:border-zinc-800/80 dark:bg-zinc-900/60 text-center">
                <FileText className="mx-auto h-5 w-5 text-indigo-500 mb-1" />
                <span className="block text-xs font-bold text-zinc-500">Resumes</span>
                <span className="text-lg font-black">{stats.hasResume ? '1 Active' : '0'}</span>
              </div>
              <div className="rounded-xl border border-zinc-200/80 bg-white p-4 dark:border-zinc-800/80 dark:bg-zinc-900/60 text-center">
                <Briefcase className="mx-auto h-5 w-5 text-purple-500 mb-1" />
                <span className="block text-xs font-bold text-zinc-500">Job Profiles</span>
                <span className="text-lg font-black">{stats.hasCompany ? '1 Loaded' : '0'}</span>
              </div>
            </div>

          </div>

          {/* Right Column (span-2): Active Assets & Feed */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Active Assets Quick Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6">
              <h2 className="text-lg font-bold tracking-tight">Active Application Pipeline</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Active Resume */}
                <div className="rounded-xl border border-zinc-150 bg-zinc-50/50 p-4.5 dark:border-zinc-800 dark:bg-zinc-950/40 flex flex-col justify-between min-h-[160px]">
                  <div>
                    <div className="flex items-center gap-2 text-zinc-500">
                      <FileText className="h-4.5 w-4.5 text-indigo-500" />
                      <span className="text-xs font-bold uppercase tracking-wider">Active Resume</span>
                    </div>
                    {stats.hasResume ? (
                      <div className="mt-3">
                        <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">Extracted Resume Profile</h4>
                        <p className="text-xs text-zinc-400 mt-1">Ready to score & rewrite against any role.</p>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <h4 className="text-sm font-semibold text-zinc-400">No Resume Uploaded</h4>
                        <p className="text-[11px] text-zinc-400 mt-1">Upload a PDF or DOCX file to extract your work history.</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
                    <Link
                      to="/resume-builder"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {stats.hasResume ? 'Manage & Edit' : 'Upload Resume Now'}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Active Company / Job */}
                <div className="rounded-xl border border-zinc-150 bg-zinc-50/50 p-4.5 dark:border-zinc-800 dark:bg-zinc-950/40 flex flex-col justify-between min-h-[160px]">
                  <div>
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Briefcase className="h-4.5 w-4.5 text-purple-500" />
                      <span className="text-xs font-bold uppercase tracking-wider">Target Job Profile</span>
                    </div>
                    {stats.hasCompany ? (
                      <div className="mt-3">
                        <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">{stats.recentJobTitle}</h4>
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1 truncate">{stats.recentCompanyName}</p>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <h4 className="text-sm font-semibold text-zinc-400">No Job Profile Loaded</h4>
                        <p className="text-[11px] text-zinc-400 mt-1">Paste a job posting or JD description to analyze company culture.</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
                    <Link
                      to={stats.hasCompany ? `/company/${stats.recentCompanyId}` : '/home'}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      {stats.hasCompany ? 'Review AI Analysis' : 'Analyze Target JD'}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

              </div>

              {/* Instant Next Action Banner */}
              {stats.hasResume && stats.hasCompany && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl bg-indigo-50 p-4 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                  <div className="flex gap-2.5">
                    <Trophy className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold">Ready to Optimize!</h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Run ATS Checker or Boot Mock Interview rounds for {stats.recentCompanyName}.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to="/ats-score"
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-[11px] font-bold text-white shadow-sm transition-all"
                    >
                      Check ATS Match
                    </Link>
                    <Link
                      to="/interview-preparation"
                      className="px-3.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900 hover:bg-indigo-100/50 dark:hover:bg-indigo-950/40 text-[11px] font-bold"
                    >
                      Interview Prep
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Activity Feed Section */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-4">
              <h2 className="text-base font-bold">Recent Pipeline Activity</h2>
              
              <div className="flow-root">
                <ul className="-mb-8">
                  {activities.map((activity: any, idx: number) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {idx !== activities.length - 1 && (
                          <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />
                        )}
                        <div className="relative flex items-start space-x-3.5">
                          
                          {/* Icon marker */}
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-8 ring-white dark:ring-zinc-900 ${
                            activity.type === 'resume' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400' :
                            activity.type === 'company' ? 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400' :
                            activity.type === 'interview' ? 'bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400' :
                            'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}>
                            {activity.type === 'resume' ? <FileText className="h-5 w-5" /> :
                             activity.type === 'company' ? <Briefcase className="h-5 w-5" /> :
                             activity.type === 'interview' ? <Sparkles className="h-5 w-5" /> :
                             <CheckCircle2 className="h-5 w-5" />}
                          </div>

                          <div className="min-w-0 flex-1 py-1.5">
                            <div className="text-xs font-bold flex justify-between gap-2">
                              <span>{activity.title}</span>
                              <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap">
                                {new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                              {activity.description}
                            </p>
                          </div>

                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
