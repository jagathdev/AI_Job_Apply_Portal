import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Base API URL configuration
axios.defaults.baseURL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://ai-job-apply-portal.onrender.com' : '');

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  themePreference: 'light' | 'dark';
  avatar?: string;
  profileCompletion: number;
  subscriptionStatus: 'free' | 'premium';
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  user: User | null;
  token: string | null;
  theme: 'light' | 'dark';
  toasts: Toast[];
  activeResume: any | null;
  activeCompany: any | null;
  isLoading: boolean;
  loginUser: (token: string, userData: User) => void;
  logoutUser: () => void;
  toggleTheme: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  setActiveResume: (resume: any) => void;
  setActiveCompany: (company: any) => void;
  setIsLoading: (loading: boolean) => void;
  refreshDashboardStats: () => Promise<any>;
  dashboardStats: any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeResume, setActiveResumeState] = useState<any | null>(null);
  const [activeCompany, setActiveCompanyState] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  // Initialize theme and auth from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('job_search_token');
    const storedUser = localStorage.getItem('job_search_user');
    const storedTheme = localStorage.getItem('job_search_theme') as 'light' | 'dark';

    if (storedToken && storedUser) {
      setToken(storedToken);
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }

    const initialTheme = storedTheme || 'dark';
    setTheme(initialTheme);
    applyThemeClass(initialTheme);
  }, []);

  const applyThemeClass = (currentTheme: 'light' | 'dark') => {
    const root = window.document.documentElement;
    if (currentTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const loginUser = (userToken: string, userData: User) => {
    setToken(userToken);
    setUser(userData);
    localStorage.setItem('job_search_token', userToken);
    localStorage.setItem('job_search_user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
    
    // Set theme based on user preferences
    if (userData.themePreference) {
      setTheme(userData.themePreference);
      applyThemeClass(userData.themePreference);
      localStorage.setItem('job_search_theme', userData.themePreference);
    }
    showToast(`Welcome back, ${userData.name}!`, 'success');
  };

  const logoutUser = () => {
    setToken(null);
    setUser(null);
    setActiveResumeState(null);
    setActiveCompanyState(null);
    setDashboardStats(null);
    localStorage.removeItem('job_search_token');
    localStorage.removeItem('job_search_user');
    delete axios.defaults.headers.common['Authorization'];
    showToast('Logged out successfully.', 'info');
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyThemeClass(nextTheme);
    localStorage.setItem('job_search_theme', nextTheme);
    
    // If user is logged in, optionally persist preference
    if (user) {
      const updatedUser = { ...user, themePreference: nextTheme };
      setUser(updatedUser);
      localStorage.setItem('job_search_user', JSON.stringify(updatedUser));
      
      axios.put('/api/profile', { themePreference: nextTheme })
        .catch(err => console.error('Failed to sync theme preference:', err));
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const setActiveResume = (resume: any) => {
    setActiveResumeState(resume);
    if (resume) {
      localStorage.setItem('active_resume_cache', JSON.stringify(resume));
    } else {
      localStorage.removeItem('active_resume_cache');
    }
  };

  const setActiveCompany = (company: any) => {
    setActiveCompanyState(company);
    if (company) {
      localStorage.setItem('active_company_cache', JSON.stringify(company));
    } else {
      localStorage.removeItem('active_company_cache');
    }
  };

  const refreshDashboardStats = async () => {
    if (!token) return null;
    try {
      const res = await axios.get('/api/auth/dashboard-summary');
      setDashboardStats(res.data);
      if (res.data.user && user) {
        // Sync user data completion score
        setUser(prev => prev ? { ...prev, profileCompletion: res.data.user.profileCompletion } : null);
      }
      return res.data;
    } catch (err) {
      console.error('Failed to fetch dashboard summaries:', err);
      return null;
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        theme,
        toasts,
        activeResume,
        activeCompany,
        isLoading,
        loginUser,
        logoutUser,
        toggleTheme,
        showToast,
        removeToast,
        setActiveResume,
        setActiveCompany,
        setIsLoading,
        refreshDashboardStats,
        dashboardStats,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
