import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { motion } from 'motion/react';
import axios from 'axios';
import { User, Mail, Phone, Lock, Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const Register: React.FC = () => {
  const { showToast, setIsLoading, isLoading } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validate password strength: min 8 chars, 1 uppercase, 1 lowercase, 1 number
  const isPasswordStrong = (pass: string) => {
    if (pass.length < 8) return false;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNum = /[0-9]/.test(pass);
    return hasUpper && hasLower && hasNum;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !mobile.trim() || !password || !confirmPassword) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    if (!isPasswordStrong(password)) {
      showToast('Password must be at least 8 characters and include uppercase, lowercase, and numbers.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (!acceptTerms) {
      showToast('You must accept the Terms and Conditions.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post('/api/auth/register', {
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        password,
        confirmPassword,
        acceptTerms
      });

      showToast(res.data.message || 'Registration successful! Please log in.', 'success');
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Registration failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-100/50 dark:bg-zinc-950 p-4 sm:p-8 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-indigo-900/5 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:shadow-black/50 dark:ring-zinc-800 my-auto grid grid-cols-1 lg:grid-cols-5"
      >
        {/* Premium Left Panel - Info & Features */}
        <div className="hidden lg:flex lg:col-span-2 relative bg-indigo-600 overflow-hidden flex-col p-10 text-white h-full justify-center">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute -top-[10%] -left-[10%] w-[80%] h-[80%] rounded-full bg-indigo-500/50 blur-[80px]" />
            <div className="absolute bottom-[20%] -right-[20%] w-[70%] h-[70%] rounded-full bg-purple-500/30 blur-[80px]" />
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
              Create an account to unlock AI optimization templates, score your resume against live job descriptions, and tailor applications instantly.
            </p>
          </div>

          <div className="relative z-10 space-y-5 mt-10">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-md border border-white/20">
                <span className="font-bold text-sm text-indigo-100">1</span>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Deep AI Analysis</h3>
                <p className="text-indigo-200 text-xs mt-0.5">We parse your work history and map it to required tech stacks automatically.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-md border border-white/20">
                <span className="font-bold text-sm text-indigo-100">2</span>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Grok & Gemini Integration</h3>
                <p className="text-indigo-200 text-xs mt-0.5">Bring your own API keys to rewrite bullet points using world-class LLMs.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-md border border-white/20">
                <span className="font-bold text-sm text-indigo-100">3</span>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Interview AI Coach</h3>
                <p className="text-indigo-200 text-xs mt-0.5">Generate dynamic interview questions and get feedback on your answers.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Register Form */}
        <div className="flex lg:col-span-3 items-center justify-center p-8 sm:p-12 lg:p-16 relative">
          <div className="w-full max-w-sm">
            <div className="flex flex-col items-start mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Create Account</h2>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Start applying smarter in less than a minute.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 h-4.5 w-4.5 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-950 transition-all text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 h-4.5 w-4.5 text-zinc-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email ID"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-950 transition-all text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3.5 h-4.5 w-4.5 text-zinc-400 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="Enter your mobile number"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-950 transition-all text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Password (strength-validated)
                </label>
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
                <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5">
                  Must be 8+ chars and contain upper, lower, & numeric characters.
                </span>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 h-4.5 w-4.5 text-zinc-400 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-950 transition-all text-zinc-900 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              {/* Consent Checkbox */}
              <div className="flex items-start pt-3">
                <input
                  id="terms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                />
                <label htmlFor="terms" className="ml-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed cursor-pointer select-none">
                  I certify that all information in my applications will be truthful and I accept the terms of data-processing.
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all mt-6 cursor-pointer overflow-hidden border border-indigo-400/20"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 flex items-center gap-2">
                  {isLoading ? 'Creating account...' : 'Register Account'}
                  {!isLoading && <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />}
                </span>
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Already registered?{' '}
              <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
