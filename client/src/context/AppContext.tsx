import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Base API URL configuration
axios.defaults.baseURL = import.meta.env.VITE_API_URL;

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

// Cookie Utilities
const setCookie = (name: string, value: string, days = 3) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (encodeURIComponent(value) || "") + expires + "; path=/";
};

const getCookie = (name: string) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
};

const eraseCookie = (name: string) => {
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

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
  logoutUser: (message?: string) => void;
  toggleTheme: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  setActiveResume: (resume: any) => void;
  setActiveCompany: (company: any) => void;
  setIsLoading: (loading: boolean) => void;
  refreshDashboardStats: () => Promise<any>;
  dashboardStats: any;
  openAiLimitModal: boolean;
  setOpenAiLimitModal: (open: boolean) => void;
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
  const [openAiLimitModal, setOpenAiLimitModal] = useState<boolean>(false);

  const logoutUser = (message?: string) => {
    setToken(null);
    setUser(null);
    setActiveResumeState(null);
    setActiveCompanyState(null);
    setDashboardStats(null);
    eraseCookie('job_search_token');
    eraseCookie('job_search_user');
    eraseCookie('job_search_login_time');
    delete axios.defaults.headers.common['Authorization'];
    showToast(message || 'Logged out successfully.', message ? 'error' : 'info');
  };

  // Global Axios Interceptor for 401 Unauthorized (Auto logout) & AI Limit Hit
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const errorMsg = error.response?.data?.error || '';

        if (status === 401) {
          logoutUser('Session expired (3 days max). Please log in again.');
          return Promise.reject(error);
        }

        const isLimitHit = status === 429 ||
          errorMsg.toLowerCase().includes('limit') ||
          errorMsg.toLowerCase().includes('rate limit') ||
          errorMsg.toLowerCase().includes('quota') ||
          errorMsg.toLowerCase().includes('api key') ||
          errorMsg.toLowerCase().includes('completely unavailable') ||
          errorMsg.toLowerCase().includes('exhausted');

        if (isLimitHit) {
          setOpenAiLimitModal(true);
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Initialize theme and auth from cookies on mount, checking for 3-day expiration
  useEffect(() => {
    const storedToken = getCookie('job_search_token');
    const storedUser = getCookie('job_search_user');
    const storedLoginTime = getCookie('job_search_login_time');
    const storedTheme = getCookie('job_search_theme') as 'light' | 'dark';
    const storedCompany = getCookie('active_company_cache');
    const storedResume = getCookie('active_resume_cache');

    if (storedToken && storedUser && storedLoginTime) {
      const elapsed = Date.now() - parseInt(storedLoginTime, 10);
      if (elapsed >= THREE_DAYS_MS) {
        eraseCookie('job_search_token');
        eraseCookie('job_search_user');
        eraseCookie('job_search_login_time');
        showToast('Session expired after 3 days. Please log in again.', 'error');
      } else {
        setToken(storedToken);
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Failed to parse user:', e);
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
    } else if (storedToken || storedUser) {
      // If token/user cookies exist without a valid 3-day timestamp, clear them
      eraseCookie('job_search_token');
      eraseCookie('job_search_user');
      eraseCookie('job_search_login_time');
    }

    if (storedCompany) {
      try {
        setActiveCompanyState(JSON.parse(storedCompany));
      } catch (e) {
        console.error('Failed to parse cached company:', e);
      }
    }

    if (storedResume) {
      try {
        setActiveResumeState(JSON.parse(storedResume));
      } catch (e) {
        console.error('Failed to parse cached resume:', e);
      }
    }

    const initialTheme = storedTheme || 'dark';
    setTheme(initialTheme);
    applyThemeClass(initialTheme);
  }, []);

  // Periodic interval check for 3-day session auto-logout while active
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      const storedLoginTime = getCookie('job_search_login_time');
      if (storedLoginTime) {
        const elapsed = Date.now() - parseInt(storedLoginTime, 10);
        if (elapsed >= THREE_DAYS_MS) {
          logoutUser('Session expired after 3 days. Please log in again.');
        }
      } else {
        logoutUser('Session expired. Please log in again.');
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [token]);

  const applyThemeClass = (currentTheme: 'light' | 'dark') => {
    const root = window.document.documentElement;
    if (currentTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const loginUser = (userToken: string, userData: User) => {
    const now = Date.now().toString();
    setToken(userToken);
    setUser(userData);
    setCookie('job_search_token', userToken, 3);
    setCookie('job_search_user', JSON.stringify(userData), 3);
    setCookie('job_search_login_time', now, 3);
    axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;

    // Set theme based on user preferences
    if (userData.themePreference) {
      setTheme(userData.themePreference);
      applyThemeClass(userData.themePreference);
      setCookie('job_search_theme', userData.themePreference);
    }
    showToast(`Welcome back, ${userData.name}!`, 'success');
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyThemeClass(nextTheme);
    setCookie('job_search_theme', nextTheme);

    // If user is logged in, optionally persist preference
    if (user) {
      const updatedUser = { ...user, themePreference: nextTheme };
      setUser(updatedUser);
      setCookie('job_search_user', JSON.stringify(updatedUser));

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
      setCookie('active_resume_cache', JSON.stringify(resume));
    } else {
      eraseCookie('active_resume_cache');
    }
  };

  const setActiveCompany = (company: any) => {
    setActiveCompanyState(company);
    if (company) {
      setCookie('active_company_cache', JSON.stringify(company));
    } else {
      eraseCookie('active_company_cache');
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
        openAiLimitModal,
        setOpenAiLimitModal,
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
