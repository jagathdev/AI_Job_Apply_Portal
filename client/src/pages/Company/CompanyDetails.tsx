import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { motion } from 'motion/react';
import axios from 'axios';
import {
  Sparkles, Globe, Linkedin, Shield, MapPin, DollarSign,
  Bookmark, ClipboardCheck, ArrowLeft, Layers, Heart,
  TrendingUp, Clock, HelpCircle, MessageSquare, Briefcase,
  Mail, Phone, ExternalLink, Image as ImageIcon, ChevronRight,
  ChevronLeft, ArrowRight, Star, Award, Zap, Check, BookOpen, Users,
  CheckCircle2, MessageCircle
} from 'lucide-react';
import { openEmailDraft, openWhatsAppDraft } from '../../utils/contactUtils';

const getEnrichedStepDetails = (stepText: string, index: number) => {
  const text = stepText.toLowerCase();

  if (text.includes('screening') || text.includes('phone') || text.includes('recruiter')) {
    return {
      duration: '30-45 mins',
      format: 'Phone / Video Call',
      focus: ['Professional background review', 'Basic technical fit', 'Communication & expectations alignment'],
      tip: 'Prepare a 2-minute elevator pitch of your experience. Be ready to discuss your salary expectations and notice period.'
    };
  }

  if (text.includes('coding') || text.includes('test') || text.includes('exercise') || text.includes('assignment')) {
    return {
      duration: '60-90 mins',
      format: 'Online Assessment / Hackerrank',
      focus: ['Data structures & algorithm complexity', 'Code cleanliness & modular design', 'Problem-solving under time limits'],
      tip: 'Practice easy-medium algorithms on LeetCode. Write clean, self-documenting code and test edge cases before submitting.'
    };
  }

  if (text.includes('technical') || text.includes('architect') || text.includes('coding interview') || text.includes('system design')) {
    return {
      duration: '60 mins',
      format: 'Live Coding & System Design',
      focus: ['Live problem solving and debugging', 'System scalability & architecture design', 'Core technology-stack fundamentals'],
      tip: 'Think out loud during coding. Clarify requirements before writing code, and discuss trade-offs of different design solutions.'
    };
  }

  if (text.includes('culture') || text.includes('fit') || text.includes('manager') || text.includes('director') || text.includes('lead')) {
    return {
      duration: '45-60 mins',
      format: 'Panel Interview / Video Call',
      focus: ['Behavioral scenario checks (STAR format)', 'Team collaboration and conflict resolution', 'Growth mindset & long-term goals alignment'],
      tip: 'Structure your answers using the STAR method (Situation, Task, Action, Result). Highlight how you collaborate with cross-functional teams.'
    };
  }

  if (text.includes('offer') || text.includes('negotiation') || text.includes('closing')) {
    return {
      duration: '15-30 mins',
      format: 'Call with HR Director',
      focus: ['Compensation & benefit packages breakdown', 'Start date and onboarding coordinates', 'Equity/Stock options parameters'],
      tip: 'Do your research on market rates for the role. Highlight the unique value you bring and be polite but confident during salary alignments.'
    };
  }

  return {
    duration: '45 mins',
    format: 'Video Conference',
    focus: ['Role alignment and core capabilities assessment', 'Collaboration model fit'],
    tip: 'Review the job description thoroughly and prepare 2-3 thoughtful questions to ask the interviewers about the team.'
  };
};

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



  const getBenefitIcon = (ben: string) => {
    const b = ben.toLowerCase();
    if (b.includes('salary') || b.includes('pay') || b.includes('compensation') || b.includes('bonus')) {
      return <DollarSign className="h-4 w-4 text-emerald-500" />;
    }
    if (b.includes('insurance') || b.includes('medical') || b.includes('health') || b.includes('dental')) {
      return <Shield className="h-4 w-4 text-sky-500" />;
    }
    if (b.includes('equity') || b.includes('stock') || b.includes('shares') || b.includes('options')) {
      return <TrendingUp className="h-4 w-4 text-indigo-500" />;
    }
    if (b.includes('learn') || b.includes('development') || b.includes('training') || b.includes('budget') || b.includes('education')) {
      return <BookOpen className="h-4 w-4 text-amber-500" />;
    }
    if (b.includes('food') || b.includes('meals') || b.includes('snacks') || b.includes('lunch') || b.includes('coffee')) {
      return <Sparkles className="h-4 w-4 text-rose-500" />;
    }
    if (b.includes('off-site') || b.includes('retreat') || b.includes('team') || b.includes('trip') || b.includes('travel') || b.includes('annual')) {
      return <Users className="h-4 w-4 text-purple-500" />;
    }
    return <Check className="h-4 w-4 text-indigo-500" />;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 px-4 py-8 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-650 text-white shadow-xl shadow-indigo-500/10 text-2xl font-bold uppercase">
              {company.companyName ? company.companyName.charAt(0) : <Sparkles className="h-7 w-7" />}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">{company.jobTitle}</h1>
              <p className="text-sm text-indigo-650 dark:text-indigo-400 font-bold">{company.companyName}</p>

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-xs text-zinc-500">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                  {company.location}
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <DollarSign className="h-3.5 w-3.5 text-zinc-400" />
                  {company.salaryRange} <span className="text-[9px] text-zinc-400 italic">(estimated)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleBookmark}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold border transition-all duration-300 transform hover:scale-[1.03] active:scale-95 cursor-pointer ${isSaved
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-transparent text-white shadow-lg shadow-amber-500/20'
                : 'border-zinc-200 bg-white hover:bg-indigo-50/40 hover:border-indigo-200/50 hover:text-indigo-600 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:!bg-indigo-950/30 dark:hover:!border-indigo-900/40 dark:hover:!text-indigo-400 text-zinc-700 dark:text-zinc-300'
                }`}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? 'Bookmarked' : 'Bookmark Job'}
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
                className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${activeTab === tab.id
                  ? 'border-indigo-650 text-indigo-650 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-650'
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
              className="space-y-6"
            >
              {/* Top Row: Overview/Standing and HR Contacts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {/* Left side: Overview & Standing */}
                <div className="md:col-span-2 md:border-r md:border-zinc-200/80 dark:md:border-zinc-800/80 md:pr-6 flex flex-col h-full">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm h-full flex flex-col justify-between gap-6">
                    {/* Overview Card */}
                    <div className="space-y-4 pb-6 border-b border-zinc-150 dark:border-zinc-800/60 flex-grow">
                      <h3 className="text-base font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                        <Briefcase className="h-5 w-5 text-indigo-500" />
                        Company Overview
                      </h3>
                      <p className="text-xs text-zinc-650 dark:text-zinc-300 leading-relaxed">
                        {company.companyOverview || 'Not explicitly stated in the job description.'}
                      </p>
                    </div>

                    {/* Standing Card */}
                    <div className="space-y-4 pt-2 flex-grow">
                      <h3 className="text-base font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                        <TrendingUp className="h-5 w-5 text-indigo-500" />
                        Industry Standing
                      </h3>
                      <p className="text-xs text-zinc-655 dark:text-zinc-300 leading-relaxed">
                        {company.glassdoorSummary || 'Not provided in the job description.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right side: HR Contacts */}
                <div className="md:col-span-1 flex flex-col h-full">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm h-full flex flex-col justify-between">
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                        <Users className="h-4.5 w-4.5 text-indigo-500" />
                        HR & Media Contacts
                      </h3>
                      <ul className="space-y-3.5 text-xs">
                        {company.hrEmail && (
                          <li className="flex flex-col gap-1">
                            <span className="text-zinc-400 dark:text-zinc-500">HR Email ID:</span>
                            <button
                              type="button"
                              onClick={() => openEmailDraft(
                                company.hrEmail,
                                `Application for ${company.jobTitle || 'Role'} - ${company.companyName || ''}`,
                                `Dear HR Team,\n\nI am writing to express my interest in the ${company.jobTitle || 'Role'} position at ${company.companyName || ''}.\n\nBest regards,`
                              )}
                              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 text-left cursor-pointer"
                            >
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              {company.hrEmail}
                            </button>
                          </li>
                        )}
                        {company.hrMobile && (
                          <li className="flex flex-col gap-1">
                            <span className="text-zinc-400 dark:text-zinc-500">HR Mobile / WhatsApp:</span>
                            <div className="flex items-center gap-3 flex-wrap">
                              <button
                                type="button"
                                onClick={() => openWhatsAppDraft(
                                  company.hrMobile,
                                  `Hello HR Team, I am interested in applying for the ${company.jobTitle || 'role'} position at ${company.companyName || ''}.`
                                )}
                                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 text-left cursor-pointer"
                              >
                                <MessageCircle className="h-3.5 w-3.5 shrink-0 fill-current" />
                                WhatsApp ({company.hrMobile})
                              </button>
                              <a
                                href={`tel:${company.hrMobile}`}
                                className="text-[11px] font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:underline flex items-center gap-1"
                              >
                                <Phone className="h-3 w-3 shrink-0" />
                                Call
                              </a>
                            </div>
                          </li>
                        )}
                        {!company.hrEmail && !company.hrMobile && (
                          <li className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                            No direct HR contacts provided in the job description.
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="pt-4 flex flex-col gap-2 mt-4 md:mt-0">
                      <a
                        href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(company.companyName + ' office office-tour')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-indigo-50/40 hover:border-indigo-200/50 hover:text-indigo-600 dark:hover:!bg-indigo-950/30 dark:hover:!border-indigo-900/40 dark:hover:!text-indigo-400 text-xs font-bold transition-all cursor-pointer text-zinc-700 dark:text-zinc-300"
                      >
                        <ImageIcon className="h-4 w-4 text-zinc-450 shrink-0" />
                        Search Office Images
                        <ExternalLink className="h-3 w-3 text-zinc-400 shrink-0" />
                      </a>
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(company.companyName + ' official website')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:!bg-indigo-955 text-indigo-650 dark:text-indigo-400 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Globe className="h-4 w-4 text-indigo-500 shrink-0" />
                        Search Website
                        <ExternalLink className="h-3 w-3 text-indigo-400 shrink-0" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>



              {/* Bottom Row: Core Metadata and Competitors side-by-side (50% and 50% width) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {/* Core Metadata (50%) */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100 font-sans">
                      <Globe className="h-4.5 w-4.5 text-indigo-500" />
                      Core Metadata
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <li className="flex flex-col gap-0.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        <span className="text-zinc-450 dark:text-zinc-505 font-semibold">Industry</span>
                        <span className="font-bold text-zinc-850 dark:text-zinc-250 block mt-0.5 leading-relaxed">{company.industry}</span>
                      </li>
                      <li className="flex flex-col gap-0.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        <span className="text-zinc-455 dark:text-zinc-505 font-semibold">Company Size</span>
                        <span className="font-bold text-zinc-850 dark:text-zinc-250 block mt-0.5 leading-relaxed">{company.employeeStrength}</span>
                      </li>
                      <li className="flex flex-col gap-0.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        <span className="text-zinc-455 dark:text-zinc-505 font-semibold">Rating (Est.)</span>
                        <span className="font-bold text-amber-500 block mt-0.5">{company.companyRatings}</span>
                      </li>
                      <li className="flex flex-col gap-0.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        <span className="text-zinc-455 dark:text-zinc-505 font-semibold">Department</span>
                        <span className="font-bold text-zinc-850 dark:text-zinc-250 block mt-0.5">{company.department}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Competitors (50%) */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Competitors</h3>
                    <p className="text-[11px] text-zinc-450 dark:text-zinc-500 leading-normal">
                      Major business and product category competitors in this vertical:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(!company.competitors || company.competitors.length === 0) && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 italic">None explicitly listed.</span>
                      )}
                      {company.competitors?.map((comp: string, i: number) => (
                        <span key={i} className="text-xs font-bold px-3.5 py-2 rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200/40 dark:border-zinc-700/40 shadow-sm transition-all hover:bg-indigo-50/50 hover:text-indigo-600 hover:border-indigo-200/50 dark:hover:!bg-indigo-950/30 dark:hover:!text-indigo-400 dark:hover:!border-indigo-900/40 cursor-default">
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Pagination */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-zinc-200 dark:border-zinc-800 mt-4">
                <Link
                  to="/dashboard"
                  className="flex items-center justify-center gap-1.5 px-4.5 py-3 sm:py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-indigo-50/40 hover:border-indigo-200/50 hover:text-indigo-600 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:!bg-indigo-950/30 dark:hover:!border-indigo-900/40 dark:hover:!text-indigo-400 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer duration-200 hover:-translate-x-0.5 w-full sm:w-auto whitespace-nowrap shrink-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Dashboard
                </Link>
                <button
                  onClick={() => {
                    setActiveTab('stack');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center justify-center gap-1.5 px-5 py-3 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/10 transition-all cursor-pointer duration-200 hover:translate-x-0.5 w-full sm:w-auto whitespace-nowrap shrink-0"
                >
                  Next: Products & Tech Stack
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'stack' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Tech Stack Card with Detailed Content (Full Width) */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-4">
                <h3 className="text-base font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                  <Layers className="h-5 w-5 text-indigo-500 animate-pulse" />
                  Required Tech Stack Highlights
                </h3>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-normal mb-3">
                  We mapped the keywords in the job description to plain, straightforward explanations of their core operational scope:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {company.techStack?.map((tech: any, i: number) => {
                    const techName = typeof tech === 'string' ? tech : (tech?.name || 'Technology');
                    const techExpl = typeof tech === 'string' ? '' : (tech?.explanation || '');
                    return (
                      <div key={i} className="p-3.5 rounded-xl border border-zinc-150 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/20 flex flex-col justify-between gap-3 group hover:border-indigo-500/50 transition-all">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            {techName}
                          </span>
                          {techExpl && (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                              {techExpl}
                            </p>
                          )}
                        </div>
                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex justify-between items-center">
                          <span className="text-[9px] font-black tracking-wide uppercase px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 whitespace-nowrap">
                            Required
                          </span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Core Skill</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Key Products Card (Full Width) */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-4">
                <h3 className="text-base font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                  <Globe className="h-5 w-5 text-purple-500" />
                  Core Products & Verticals
                </h3>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-normal mb-3">
                  Corporate offerings and services extracted from metadata analysis:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {company.products?.map((prod: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-4.5 rounded-xl border border-zinc-150 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/20 group hover:border-purple-500/50 transition-all">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5 animate-pulse">
                        <Globe className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">{prod}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Projects with Premium Bento */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                  <Award className="h-5 w-5 text-emerald-500" />
                  Active Projects & Initiatives
                </h3>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-normal">
                  Overview of key active operations and development tasks mapped to this role:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                  {company.currentProjects?.map((proj: string, i: number) => (
                    <div key={i} className="p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/15 shadow-sm space-y-3 relative overflow-hidden group hover:border-indigo-500/50 transition-all duration-300">
                      <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/5 rounded-full translate-x-4 -translate-y-4 group-hover:scale-125 transition-transform" />

                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase font-bold text-indigo-650 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full">
                          Initiative {i + 1}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full">
                          <Zap className="h-3 w-3 animate-pulse" /> Active Match
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs mt-2.5">
                          {proj}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Pagination */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-zinc-200 dark:border-zinc-800 mt-6">
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center justify-center gap-1.5 px-4.5 py-3 sm:py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-indigo-50/40 hover:border-indigo-200/50 hover:text-indigo-600 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:!bg-indigo-950/30 dark:hover:!border-indigo-900/40 dark:hover:!text-indigo-400 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer duration-200 hover:-translate-x-0.5 w-full sm:w-auto whitespace-nowrap shrink-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back: Company Profile
                </button>
                <button
                  onClick={() => {
                    setActiveTab('culture');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center justify-center gap-1.5 px-5 py-3 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/10 transition-all cursor-pointer duration-200 hover:translate-x-0.5 w-full sm:w-auto whitespace-nowrap shrink-0"
                >
                  Next: Culture & Benefits
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}          {activeTab === 'culture' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Top Row: Culture/Growth and Work Hours Setup */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {/* Left side: Culture block */}
                <div className="md:col-span-2 md:border-r md:border-zinc-200/80 dark:md:border-zinc-800/80 md:pr-6 flex flex-col h-full">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm h-full flex flex-col justify-between gap-6">
                    {/* Culture Section */}
                    <div className="space-y-4 pb-6 border-b border-zinc-150 dark:border-zinc-800/60 flex-grow">
                      <h3 className="text-base font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                        <Heart className="h-5 w-5 text-rose-500 animate-pulse" />
                        Culture & Work Values
                      </h3>
                      <p className="text-xs text-zinc-650 dark:text-zinc-300 leading-relaxed">
                        {company.workCulture || 'Not explicitly provided.'}
                      </p>
                    </div>

                    {/* Growth Section */}
                    <div className="space-y-4 pt-2 flex-grow">
                      <h3 className="text-base font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                        <TrendingUp className="h-5 w-5 text-indigo-500" />
                        Career Growth Outlook
                      </h3>
                      <p className="text-xs text-zinc-650 dark:text-zinc-300 leading-relaxed">
                        {company.careerGrowth || 'Not explicitly provided.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right side: Working Setup */}
                <div className="md:col-span-1 flex flex-col h-full">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm h-full flex flex-col justify-between">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                      <Clock className="h-4.5 w-4.5 text-zinc-500" />
                      Hours & Working Setup
                    </h3>
                    <div className="flex-grow flex flex-col mt-4 gap-4 text-xs">
                      <div className="p-3.5 rounded-xl border border-zinc-150 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/20 flex-grow flex flex-col justify-center">
                        <span className="text-zinc-400 dark:text-zinc-500 font-semibold block mb-1">Standard Work Hours:</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{company.workingHours || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Key Benefits (Full Width with Horizontal Items Grid) */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  Key Benefits & Perks
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                  {company.benefits?.map((ben: string, i: number) => (
                    <div key={i} className="flex items-center gap-3.5 p-4 rounded-xl border border-zinc-150 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/20 group hover:border-emerald-500/50 transition-all shadow-sm">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                        {getBenefitIcon(ben)}
                      </span>
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 leading-normal">{ben}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Pagination */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-zinc-200 dark:border-zinc-800 mt-4">
                <button
                  onClick={() => {
                    setActiveTab('stack');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center justify-center gap-1.5 px-4.5 py-3 sm:py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-indigo-50/40 hover:border-indigo-200/50 hover:text-indigo-600 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:!bg-indigo-950/30 dark:hover:!border-indigo-900/40 dark:hover:!text-indigo-400 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer duration-200 hover:-translate-x-0.5 w-full sm:w-auto whitespace-nowrap shrink-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back: Products & Tech Stack
                </button>
                <button
                  onClick={() => {
                    setActiveTab('interview');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center justify-center gap-1.5 px-5 py-3 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/10 transition-all cursor-pointer duration-200 hover:translate-x-0.5 w-full sm:w-auto whitespace-nowrap shrink-0"
                >
                  Next: Recruitment & Interviews
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}          {activeTab === 'interview' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

                {/* Recruitment Timeline Flow */}
                <div className="md:col-span-2 md:border-r md:border-zinc-200/80 dark:md:border-zinc-800/80 md:pr-6 flex flex-col h-full">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm h-full flex flex-col justify-between">
                    <h3 className="text-base font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100 mb-4 shrink-0">
                      <Clock className="h-5 w-5 text-indigo-500" />
                      Hiring Timeline Steps
                    </h3>                    <div className="space-y-6 relative ml-2.5 flex-grow">
                      {company.hiringProcess?.map((stepObj: any, i: number) => {
                        const isLegacy = typeof stepObj === 'string';
                        const stepTitle = isLegacy ? stepObj.split(':')[0] : (stepObj?.step || `Step ${i + 1}`);
                        const stepDesc = isLegacy ? stepObj.split(':')[1] || 'Recruitment coordination checkpoint' : '';

                        const enrichedFallback = isLegacy ? getEnrichedStepDetails(stepObj, i) : null;
                        const duration = isLegacy ? enrichedFallback?.duration : (stepObj?.duration || '45 mins');
                        const format = isLegacy ? enrichedFallback?.format : (stepObj?.format || 'Video Interview');
                        const tip = isLegacy ? enrichedFallback?.tip : (stepObj?.tip || 'Review key role requirements.');

                        return (
                          <div key={i} className="relative pl-8 pb-6 last:pb-0">
                            {/* Connecting line */}
                            {i < company.hiringProcess.length - 1 && (
                              <span className="absolute left-[9px] top-6 bottom-0 w-[2px] bg-indigo-100 dark:bg-indigo-950/60" aria-hidden="true" />
                            )}
                            <span className="absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-black text-white shadow-md ring-4 ring-white dark:ring-zinc-900">
                              {i + 1}
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{stepTitle}</h4>
                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-650 dark:bg-indigo-950/60 dark:text-indigo-400 text-[10px] font-semibold border border-indigo-100/40 dark:border-indigo-900/40 whitespace-nowrap">
                                  {duration} • {format}
                                </span>
                              </div>

                              {stepDesc && (
                                <p className="text-[11px] text-zinc-555 dark:text-zinc-400 mt-1 font-medium leading-relaxed">
                                  {stepDesc}
                                </p>
                              )}

                              <div className="mt-1.5 text-[10.5px] text-zinc-400 dark:text-zinc-500 font-medium">
                                <span className="font-semibold text-indigo-500 dark:text-indigo-400">Prep Tip: </span>
                                {tip}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Expected Skills & Hiring Trend Details */}
                <div className="md:col-span-1 flex flex-col h-full">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm h-full flex flex-col justify-between">
                    {/* Required Skills */}
                    <div className="space-y-4 pb-6 border-b border-zinc-150 dark:border-zinc-800/60 flex-grow">
                      <h3 className="text-sm font-bold flex items-center gap-1.5 text-zinc-800 dark:text-zinc-100">
                        <Shield className="h-4 w-4 text-emerald-500" />
                        Required Skill Overlaps
                      </h3>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {company.requiredSkills?.map((skill: string, i: number) => (
                          <span key={i} className="text-[10px] font-black tracking-wide uppercase px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200/40 dark:border-zinc-700/40">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Hiring Trends */}
                    <div className="space-y-4 pt-6 flex-grow flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-bold flex items-center gap-1.5 text-zinc-800 dark:text-zinc-100">
                          <Sparkles className="h-4 w-4 text-purple-500" />
                          Hiring Trend Details
                        </h3>
                        <p className="text-xs text-zinc-655 dark:text-zinc-300 leading-normal font-medium mt-3.5">
                          {company.hiringTrends || 'Not explicitly stated.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interview Checklist */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-4">
                <h3 className="text-base font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                  <ClipboardCheck className="h-5 w-5 text-indigo-500" />
                  Preparation & Expectations Checklist
                </h3>
                <p className="text-xs text-zinc-650 dark:text-zinc-300 leading-relaxed font-medium">
                  {company.interviewExpectations || 'Not explicitly stated.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 pt-2 text-xs">
                  {(!company.interviewChecklist || company.interviewChecklist.length === 0) && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 italic">No specific interview checklist provided.</span>
                  )}
                  {company.interviewChecklist?.map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400 font-semibold shadow-sm">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-zinc-200 dark:border-zinc-800 mt-8 mb-4">
                <button
                  onClick={() => {
                    setActiveTab('culture');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center justify-center gap-1.5 px-4.5 py-3 sm:py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-indigo-50/40 hover:border-indigo-200/50 hover:text-indigo-600 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:!bg-indigo-950/30 dark:hover:!border-indigo-900/40 dark:hover:!text-indigo-400 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer duration-200 hover:-translate-x-0.5 w-full sm:w-auto whitespace-nowrap shrink-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back: Culture & Benefits
                </button>
                <button
                  onClick={() => {
                    navigate('/resume-builder');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center justify-center gap-1.5 px-5 py-3 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/10 transition-all cursor-pointer duration-200 hover:translate-x-0.5 w-full sm:w-auto whitespace-nowrap shrink-0"
                >
                  Next: Resume Builder
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>



      </div>
    </div>
  );
};
