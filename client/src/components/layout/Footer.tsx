import React from 'react';
import { Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-zinc-200 bg-zinc-50 py-8 text-center text-xs dark:border-zinc-800 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-500 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Copyright */}
          <div className="flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-400">
            <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse" />
            <span>© 2026 AI Job Search Assistant. All rights reserved.</span>
          </div>

          {/* Slogan */}
          <div className="text-zinc-400 dark:text-zinc-600">
            Search Smarter. Apply Faster. Get Hired with AI.
          </div>

          {/* Links */}
          <div className="flex space-x-4">
            <span className="hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer transition-colors">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer transition-colors">Terms of Service</span>
          </div>

        </div>
      </div>
    </footer>
  );
};
