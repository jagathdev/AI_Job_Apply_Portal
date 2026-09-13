import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CareerLensLogo } from '../common/CareerLensLogo';
import { openWhatsAppDraft, openEmailDraft } from '../../utils/contactUtils';
import { useApp } from '../../context/AppContext';
import {
  Briefcase, FileText, Sparkles, Building, Home as HomeIcon,
  ShieldCheck, FileCheck, X, Heart, Github, Linkedin,
  Mail, CheckCircle2, Globe, ExternalLink
} from 'lucide-react';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 2C6.477 2 2 6.477 2 12c0 2.22.723 4.27 1.95 5.93L2 22l4.24-1.89C7.83 21.29 9.84 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.87 0-3.62-.51-5.12-1.4l-.37-.22-2.52 1.12 1.13-2.46-.24-.39C3.99 15.22 3.5 13.66 3.5 12c0-4.69 3.81-8.5 8.5-8.5s8.5 3.81 8.5 8.5-3.81 8.5-8.5 8.5z" />
  </svg>
);

export const Footer: React.FC = () => {
  const [modalContent, setModalContent] = useState<'privacy' | 'terms' | null>(null);
  const { activeCompany } = useApp();

  const navigationLinks = [
    { name: 'Home', path: '/home', icon: HomeIcon },
    { name: 'Dashboard', path: '/dashboard', icon: Briefcase },
    {
      name: 'Company Details',
      path: activeCompany?._id ? `/company/${activeCompany._id}` : '/home',
      icon: Building
    },
    { name: 'Resume Builder', path: '/resume-builder', icon: FileText },
    { name: 'Interview Prep', path: '/interview-preparation', icon: Sparkles },
  ];

  return (
    <>
      <footer className="w-full border-t border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 transition-colors duration-300 relative z-10 overflow-hidden">

        {/* Glow ambient background effects */}
        <div className="absolute top-0 left-1/4 h-64 w-64 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 translate-y-1/2 rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-zinc-200 dark:border-zinc-800/80">

            {/* Column 1: Brand & Slogan */}
            <div className="lg:col-span-2 space-y-4">
              <Link to="/" className="inline-block">
                <CareerLensLogo />
              </Link>
              <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-sm">
                CareerLens AI empowers candidates to analyze target company profiles, craft 100% ATS-optimized resumes, prepare for AI mock interviews, and land jobs faster.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <a
                  href="https://github.com/jagathdev"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-200/80 bg-purple-50 text-purple-600 hover:bg-purple-100 hover:border-purple-500 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-400 dark:hover:bg-purple-900/50 dark:hover:border-purple-400 transition-all shadow-sm hover:scale-105"
                  aria-label="GitHub"
                  title="GitHub - jagathdev"
                >
                  <Github className="h-4.5 w-4.5" />
                </a>
                <a
                  href="https://www.linkedin.com/in/jagathdevloper/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200/80 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-500 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/50 dark:hover:border-blue-400 transition-all shadow-sm hover:scale-105"
                  aria-label="LinkedIn"
                  title="LinkedIn - Jagath"
                >
                  <Linkedin className="h-4.5 w-4.5" />
                </a>
                <button
                  onClick={() => openWhatsAppDraft('9360270984', 'Hello Jagath!')}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-500 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/50 dark:hover:border-emerald-400 transition-all shadow-sm hover:scale-105 cursor-pointer"
                  aria-label="WhatsApp"
                  title="WhatsApp: 9360270984"
                >
                  <WhatsAppIcon className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => openEmailDraft('jagath9360@gmail.com', 'Inquiry via CareerLens AI', 'Hi Jagath,')}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200/80 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-500 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/50 dark:hover:border-rose-400 transition-all shadow-sm hover:scale-105 cursor-pointer"
                  aria-label="Email"
                  title="Email: jagath9360@gmail.com"
                >
                  <Mail className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Column 2: Navigation Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Navigation
              </h4>
              <ul className="space-y-2 text-xs font-medium">
                {navigationLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="text-indigo-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5 font-semibold sm:font-medium"
                      >
                        <Icon className="h-3.5 w-3.5 opacity-80" />
                        {link.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Column 3: AI Capabilities */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Features
              </h4>
              <ul className="space-y-2 text-xs font-medium">
                <li>
                  <Link
                    to="/home"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="text-indigo-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors font-semibold sm:font-medium"
                  >
                    Company Intelligence
                  </Link>
                </li>
                <li>
                  <Link
                    to="/resume-builder"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="text-indigo-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors font-semibold sm:font-medium"
                  >
                    ATS Resume Formatting
                  </Link>
                </li>
                <li>
                  <Link
                    to="/interview-preparation"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="text-indigo-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors font-semibold sm:font-medium"
                  >
                    AI Mock Evaluation
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="text-indigo-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors font-semibold sm:font-medium"
                  >
                    Job Match Analytics
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Legal & Policy */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Trust & Legal
              </h4>
              <ul className="space-y-2 text-xs font-medium">
                <li>
                  <button
                    onClick={() => setModalContent('privacy')}
                    className="text-indigo-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors font-semibold sm:font-medium cursor-pointer text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setModalContent('terms')}
                    className="text-indigo-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors font-semibold sm:font-medium cursor-pointer text-left"
                  >
                    Terms of Service
                  </button>
                </li>
                <li className="pt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                    <CheckCircle2 className="h-3 w-3" /> 100% ATS Verified
                  </span>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Copyright Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span>© {new Date().getFullYear()} CareerLens AI. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setModalContent('privacy')}
                className="hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                onClick={() => setModalContent('terms')}
                className="hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* PRIVACY POLICY & TERMS MODAL */}
      <AnimatePresence>
        {modalContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalContent(null)}
              className="fixed inset-0 bg-zinc-950/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 sm:p-8 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-6 z-10"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                    {modalContent === 'privacy' ? <ShieldCheck className="h-5 w-5" /> : <FileCheck className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold">
                      {modalContent === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      CareerLens AI Data Protection & User Guidelines
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setModalContent(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-4 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {modalContent === 'privacy' ? (
                  <>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">1. Data Privacy & Encryption</h4>
                    <p>
                      At CareerLens AI, your candidate data privacy is paramount. Your resume contents, uploaded documents, target company analyses, and mock interview performance records are encrypted at rest and in transit.
                    </p>

                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">2. Usage of AI Models</h4>
                    <p>
                      We parse job descriptions and resume text using secure AI instances. Your personal identification information (PII) is never sold or utilized to train external third-party public models.
                    </p>

                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">3. Cookies & Storage</h4>
                    <p>
                      We utilize local storage and secure authentication session tokens to retain your theme preferences, active resume state, and bookmarked target companies across browser sessions.
                    </p>
                  </>
                ) : (
                  <>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">1. Acceptance of Terms</h4>
                    <p>
                      By utilizing CareerLens AI, you agree to comply with our candidate guidelines. Our platform is designed to assist job applicants in tailoring ATS resumes and analyzing legitimate job postings.
                    </p>

                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">2. ATS & Application Disclaimer</h4>
                    <p>
                      While CareerLens AI formats resumes to 100% vector-compliant ATS standards and maps target company keywords, hiring decisions rest solely with employer recruiters.
                    </p>

                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">3. User Conduct</h4>
                    <p>
                      Users agree not to submit fraudulent job links or malicious scripts into the analysis engine. Misuse of the platform may result in session termination.
                    </p>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                <button
                  onClick={() => setModalContent(null)}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/10 cursor-pointer"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
