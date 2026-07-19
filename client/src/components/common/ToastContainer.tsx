import React from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  const iconMap = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
    error: <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-sky-500 shrink-0" />
  };

  const borderMap = {
    success: 'border-emerald-100 dark:border-emerald-950/50 bg-emerald-50/90 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300',
    error: 'border-red-100 dark:border-red-950/50 bg-red-50/90 dark:bg-red-950/20 text-red-900 dark:text-red-300',
    info: 'border-sky-100 dark:border-sky-950/50 bg-sky-50/90 dark:bg-sky-950/20 text-sky-900 dark:text-sky-300'
  };

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            layout
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-lg ${borderMap[toast.type]} transition-colors duration-200`}
          >
            {iconMap[toast.type]}
            <p className="text-xs font-semibold flex-1 leading-relaxed">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-0.5 rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
