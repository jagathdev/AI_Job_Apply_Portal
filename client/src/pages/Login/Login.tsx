import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { motion } from 'motion/react';
import axios from 'axios';
import { Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { loginUser, showToast, setIsLoading, isLoading } = useApp();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      showToast('Please enter both Email/Mobile and Password.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post('/api/auth/login', {
        identifier: identifier.trim(),
        password: password.trim()
      });

      loginUser(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Invalid credentials or connection issue.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-xl dark:border-zinc-800/80 dark:bg-zinc-900"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight">Welcome Back</h2>
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            Search Smarter. Apply Faster. Get Hired with AI.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {/* Email/Mobile Field */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              Email or Mobile Number
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 h-4 w-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com or mobile"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:focus:bg-zinc-950 transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Password
              </label>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                Forgot password?
              </span>
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 h-4 w-4 text-zinc-400 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:focus:bg-zinc-950 transition-all"
              />
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 hover:shadow-indigo-500/20 disabled:opacity-50 transition-all mt-6 cursor-pointer"
          >
            {isLoading ? 'Checking qualifications...' : 'Login to Account'}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Create an Account
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
