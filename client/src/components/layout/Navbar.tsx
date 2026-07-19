import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, FileText, Sparkles, CheckCircle, 
  Menu, X, Sun, Moon, LogOut, User, Settings, ShieldAlert
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logoutUser, theme, toggleTheme } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
    setIsOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const authLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: Briefcase },
    { name: 'Resume Builder', path: '/resume-builder', icon: FileText },
    { name: 'ATS Score', path: '/ats-score', icon: CheckCircle },
    { name: 'Interview Prep', path: '/interview-preparation', icon: Sparkles },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/85 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/85 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-zinc-900 via-indigo-950 to-indigo-600 bg-clip-text text-transparent dark:from-zinc-50 dark:via-zinc-200 dark:to-indigo-400">
                Apply<span className="font-medium text-indigo-600 dark:text-indigo-400">AI</span>
              </span>
            </Link>
          </div>

          {/* Desktop Links (Authenticated) */}
          {user && (
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {authLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive(link.path)
                        ? 'bg-zinc-100 dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Actions (Theme toggle, auth CTAs) */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 transition-all duration-200 text-zinc-600 dark:text-zinc-400"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {user ? (
              <div className="flex items-center space-x-3">
                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                  <User className="h-3 w-3" />
                  {user.subscriptionStatus === 'premium' ? 'Premium' : 'Free Tier'}
                </span>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-red-200 dark:border-red-950/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4.5 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden"
          >
            <div className="space-y-1.5 px-4 py-4">
              {user ? (
                <>
                  <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 dark:border-zinc-900 pb-3 mb-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{user.name}</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                      {user.subscriptionStatus.toUpperCase()}
                    </span>
                  </div>

                  {authLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-base font-medium transition-all ${
                          isActive(link.path)
                            ? 'bg-zinc-100 dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {link.name}
                      </Link>
                    );
                  })}

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2.5 mt-4 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                </>
              ) : (
                <div className="space-y-2 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
