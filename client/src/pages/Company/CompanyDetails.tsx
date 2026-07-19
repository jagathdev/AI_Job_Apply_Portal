import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { motion } from 'motion/react';
import axios from 'axios';
import {
  Sparkles, Globe, Linkedin, Shield, MapPin, DollarSign,
  Bookmark, ClipboardCheck, ArrowLeft, Layers, Heart,
  TrendingUp, Clock, HelpCircle, MessageSquare, Briefcase
} from 'lucide-react';

export const CompanyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast, setActiveCompany, activeCompany } = useApp();
  const navigate = useNavigate();

  const [company, setCompany] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'stack' | 'culture' | 'interview'>('profile');
  const [isSaved, setIsSaved] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  useEffect(() => {
    loadCompanyDetails();
  }, [id]);

  const loadCompanyDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/company/${id}`);
      setCompany(res.data);
      setActiveCompany(res.data);
      
      // Check if job is already bookmarked
      const savedRes = await axios.get('/api/company/saved/all');
      const exists = savedRes.data.some((job: any) => job.companyName === res.data.companyName && job.jobTitle === res.data.jobTitle);
      setIsSaved(exists);
    } catch (err) {
      showToast('Failed to load company details.', 'error');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!company) return;
    try {
      if (isSaved) {
        // Find saved record to delete
        const savedRes = await axios.get('/api/company/saved/all');
        const match = savedRes.data.find((job: any) => job.companyName === company.companyName && job.jobTitle === company.jobTitle);
        if (match) {
          await axios.delete(`/api/company/saved/${match._id}`);
          setIsSaved(false);
          showToast('Job removed from bookmarks.', 'info');
        }
      } else {
        await axios.post('/api/company/saved/add', {
          companyName: company.companyName,
          jobTitle: company.jobTitle,
          location: company.location,
          salary: company.salaryRange,
          jobDescription: company.companyOverview
        });
        setIsSaved(true);
        showToast('Job added to saved bookmarks.', 'success');
      }
    } catch (err) {
      showToast('Failed to sync saved bookmark.', 'error');
    }
  };

  const handleLogApplication = async () => {
    if (!company || isLogging) return;
    setIsLogging(true);
    try {
      await axios.post('/api/company/applied/add', {
        companyName: company.companyName,
        jobTitle: company.jobTitle,
        status: 'applied',
        notes: `AI Analysis generated on ${new Date().toLocaleDateString()}`
      });
      showToast('Application logged in tracker!', 'success');
    } catch (err) {
      showToast('Failed to log application.', 'error');
    } finally {
      setIsLogging(false);
    }
  };

  if (loading || !company) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium font-mono">Digesting benchmarks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 px-4 py-8 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* Back Link */}
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/10">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">{company.jobTitle}</h1>
              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-bold">{company.companyName}</p>
              
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {company.location}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  {company.salaryRange} <span className="text-[9px] text-zinc-400 italic">(estimated)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleBookmark}
              className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isSaved 
                  ? 'bg-amber-500 border-amber-600 text-white shadow-sm'
                  : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900'
              }`}
            >
              <Bookmark className="h-4 w-4" />
              {isSaved ? 'Bookmarked' : 'Bookmark Job'}
            </button>
            <button
              onClick={handleLogApplication}
              disabled={isLogging}
              className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/10 transition-all cursor-pointer"
            >
              <ClipboardCheck className="h-4 w-4" />
              Log as Applied
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 pb-3 gap-6 overflow-x-auto">
          {[
            { id: 'profile', name: 'Company Profile', icon: Globe },
            { id: 'stack', name: 'Products & Tech Stack', icon: Layers },
            { id: 'culture', name: 'Culture & Benefits', icon: Heart },
            { id: 'interview', name: 'Recruitment & Interviews', icon: HelpCircle }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="min-h-[300px]">
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Left bento */}
              <div className="md:col-span-2 space-y-6">
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                  <h3 className="text-base font-bold">Company Overview</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {company.companyOverview || 'No description extracted. This company profile is synthesized from JD benchmarks.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                  <h3 className="text-base font-bold">Industry standing</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {company.glassdoorSummary || 'Extrapolated ratings and comments reflect a highly supportive environment specializing in rapid delivery and code quality benchmarks.'}
                  </p>
                </div>
              </div>

              {/* Right side bento info */}
              <div className="md:col-span-1 space-y-6">
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                  <h3 className="text-sm font-bold">Core Metadata</h3>
                  <ul className="space-y-3.5 text-xs">
                    <li className="flex justify-between">
                      <span className="text-zinc-400">Industry:</span>
                      <span className="font-semibold">{company.industry}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-zinc-400">Company Size:</span>
                      <span className="font-semibold">{company.employeeStrength}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-zinc-400">Rating (Est.):</span>
                      <span className="font-semibold text-amber-500">{company.companyRatings}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-zinc-400">Department:</span>
                      <span className="font-semibold">{company.department}</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                  <h3 className="text-sm font-bold">Competitors</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {company.competitors?.map((comp: string, i: number) => (
                      <span key={i} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200/40 dark:border-zinc-700/40">
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'stack' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Tech Stack Card */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Layers className="h-5 w-5 text-indigo-500" />
                    Required Tech Stack
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {company.techStack?.map((tech: string, i: number) => (
                      <span key={i} className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Key Products */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Globe className="h-5 w-5 text-purple-500" />
                    Core Products & Verticals
                  </h3>
                  <ul className="space-y-2 pt-2 text-xs text-zinc-600 dark:text-zinc-300">
                    {company.products?.map((prod: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                        {prod}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Current Projects */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                <h3 className="text-base font-bold">Active Projects & Initiatives</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {company.currentProjects?.map((proj: string, i: number) => (
                    <div key={i} className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 text-xs">
                      <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Initiative {i+1}</h4>
                      <p className="text-zinc-500 leading-normal">{proj}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'culture' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Culture block */}
              <div className="md:col-span-2 space-y-6">
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                  <h3 className="text-base font-bold">Culture & Work Values</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {company.workCulture || 'Synthesized records describe a highly decentralized layout utilizing high developer autonomy, flexible core hours, and robust peer mentorship structures.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                  <h3 className="text-base font-bold">Career Growth Outlook</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {company.careerGrowth || 'Strong career architecture with biannual reviews. High internal mobility with active training sessions for lead and architectural coordinates.'}
                  </p>
                </div>
              </div>

              {/* Benefits & Hours bento */}
              <div className="md:col-span-1 space-y-6">
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Clock className="h-4.5 w-4.5 text-zinc-500" />
                    Hours & Working Setup
                  </h3>
                  <span className="block text-xs text-zinc-600 dark:text-zinc-300">{company.workingHours}</span>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                  <h3 className="text-sm font-bold">Key Benefits</h3>
                  <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
                    {company.benefits?.map((ben: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        {ben}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'interview' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Recruitment Timeline Flow */}
                <div className="md:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
                  <h3 className="text-base font-bold">Hiring Timeline Steps</h3>
                  
                  <div className="space-y-6 pl-3 border-l border-indigo-100 dark:border-indigo-950">
                    {company.hiringProcess?.map((step: string, i: number) => (
                      <div key={i} className="relative">
                        <span className="absolute -left-6.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                          {i+1}
                        </span>
                        <div className="pl-2">
                          <h4 className="text-xs font-bold">{step.split(':')[0]}</h4>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{step.split(':')[1] || 'Recruitment coordination checkpoint'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expected Skills */}
                <div className="md:col-span-1 space-y-6">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-1.5 text-zinc-500">
                      <Shield className="h-4 w-4 text-emerald-500" />
                      Required Skill Overlaps
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {company.requiredSkills?.map((skill: string, i: number) => (
                        <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-1.5 text-zinc-500">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      Hiring Trend Details
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-normal">
                      {company.hiringTrends || 'Actively seeking engineering profiles to support global expansions.'}
                    </p>
                  </div>
                </div>

              </div>

              {/* Interview expectation statement */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
                <h3 className="text-base font-bold">Preparation & Expectations Checklist</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {company.interviewExpectations || 'Interview focuses heavily on scalable systems, code quality benchmarks, testing paradigms, and alignment on team-wide code reviews.'}
                </p>
              </div>
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
};
