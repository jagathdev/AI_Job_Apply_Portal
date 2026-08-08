import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { motion } from 'motion/react';
import axios from 'axios';
import { Lock, Mail, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const { loginUser, showToast } = useApp();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      showToast('Please enter both Email/Mobile and Password.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(`/api/auth/login`, {
        identifier: identifier.trim(),
        password: password.trim()
      });

      loginUser(res.data.token, res.data.user);
      navigate('/home');
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Invalid credentials or connection issue.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-100/50 dark:bg-zinc-950 p-4 sm:p-8 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex w-full max-w-5xl flex-col lg:flex-row overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-indigo-900/5 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:shadow-black/50 dark:ring-zinc-800"
      >
        {/* Premium Left Panel - Info & Features */}
        <div className="hidden lg:flex lg:w-[40%] relative bg-indigo-600 overflow-hidden flex-col justify-between p-10 text-white">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] rounded-full bg-indigo-500/50 blur-[80px]" />
            <div className="absolute bottom-[10%] -right-[20%] w-[60%] h-[60%] rounded-full bg-purple-500/30 blur-[80px]" />
          </div>

          <div className="relative z-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-xl mb-6">
              <Sparkles className="h-5 w-5 text-indigo-100" />
            </div>
            <h1 className="text-3xl font-black tracking-tight leading-tight mb-4">
              Your career,<br />
              <span className="text-indigo-200">accelerated.</span>
            </h1>
            <p className="text-sm text-indigo-100/90 font-medium leading-relaxed">
              Join thousands of professionals using AI to optimize their resumes and master interviews.
            </p>
          </div>

          <div className="relative z-10 space-y-5 mt-10">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-md border border-white/20">
                <span className="font-bold text-sm text-indigo-100">1</span>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">ATS Optimization</h3>
                <p className="text-indigo-200 text-xs mt-0.5">Tailor your resume to perfectly match job descriptions.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-md border border-white/20">
                <span className="font-bold text-sm text-indigo-100">2</span>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Smart Tracking</h3>
                <p className="text-indigo-200 text-xs mt-0.5">Manage job applications in a clean dashboard.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-md border border-white/20">
                <span className="font-bold text-sm text-indigo-100">3</span>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Interview AI Coach</h3>
                <p className="text-indigo-200 text-xs mt-0.5">Practice mock interviews and get instant feedback.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex w-full lg:w-[60%] items-center justify-center p-8 sm:p-12 lg:p-16 relative">
          <div className="w-full max-w-sm">
            <div className="flex flex-col items-start mb-10">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Welcome Back</h2>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Enter your credentials to access your dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email/Mobile Field */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Email or Mobile Number
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 h-4.5 w-4.5 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter your email ID or mobile number"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-950 transition-all text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    Password
                  </label>
                  <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 h-4.5 w-4.5 text-zinc-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-950 transition-all text-zinc-900 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all mt-8 cursor-pointer overflow-hidden border border-indigo-400/20"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 flex items-center gap-2">
                  {isSubmitting ? 'Checking credentials...' : 'Login to Account'}
                  {!isSubmitting && <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />}
                </span>
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Create an Account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
