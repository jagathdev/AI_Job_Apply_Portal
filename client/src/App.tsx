import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ChatbotWidget } from './components/chatbot/ChatbotWidget';
import { ToastContainer } from './components/common/ToastContainer';

// Import Pages
import { Home } from './pages/Home/Home';
import { Login } from './pages/Login/Login';
import { Register } from './pages/Register/Register';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { CompanyDetails } from './pages/Company/CompanyDetails';
import { ResumeBuilder } from './pages/ResumeBuilder/ResumeBuilder';
import { ATSScore } from './pages/ATS/ATSScore';
import { InterviewPrep } from './pages/Interview/InterviewPrep';
import { Settings } from './pages/Settings/Settings';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useApp();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Guard (prevents logged-in users from seeing login/register again)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useApp();
  return !token ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const AppContent: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      
      {/* Global Toast Alerts */}
      <ToastContainer />

      {/* Primary Navigation bar */}
      <Navbar />

      {/* Main Viewport Content */}
      <main className="flex-1">
        <Routes>
          {/* Public views */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected workspace views */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/company/:id" element={<ProtectedRoute><CompanyDetails /></ProtectedRoute>} />
          <Route path="/resume-builder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
          <Route path="/ats-score" element={<ProtectedRoute><ATSScore /></ProtectedRoute>} />
          <Route path="/interview-preparation" element={<ProtectedRoute><InterviewPrep /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>

      {/* Global Context-Aware Chatbot Buddy */}
      <ChatbotWidget />

      {/* Global Footer Branding */}
      <Footer />

    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </Router>
  );
}
