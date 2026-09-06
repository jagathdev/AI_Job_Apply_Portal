import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import {
  MessageSquare, Send, X, Sparkles, Trash2,
  Minus, AlertCircle, ArrowUpRight, HelpCircle, Copy, Check, RotateCcw,
  Mail, MessageCircle
} from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isError?: boolean;
  retryQuery?: string;
}

export const ChatbotWidget: React.FC = () => {
  const { user, token, activeResume, activeCompany, showToast } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const copyToClipboard = (textToCopy: string, key: string, label: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedKey(key);
    showToast(`${label} copied!`, 'info');
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const parseEmailMessage = (text: string) => {
    if (!text) return null;
    const subjectMatch = text.match(/^\s*Subject:\s*([^\n]+)/i);
    if (!subjectMatch) return null;

    const isEmailFormat = /\b(Dear|Best regards|Warm regards|Sincerely|Application for|Respected|Hiring Team|Recruiter)\b/i.test(text);
    if (!isEmailFormat) return null;

    const subject = subjectMatch[1].trim();
    const subjectFullLineMatch = text.match(/^\s*Subject:\s*[^\n]+[\r\n]*/i);
    const body = subjectFullLineMatch ? text.substring(subjectFullLineMatch[0].length).trim() : text;
    return { subject, body };
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const content = part.slice(2, -2);
        return (
          <strong
            key={index}
            className="font-bold text-zinc-950 dark:text-white bg-indigo-100/80 dark:bg-indigo-900/70 px-1 py-0.5 rounded border border-indigo-200/80 dark:border-indigo-800/80"
          >
            {content}
          </strong>
        );
      }
      return part;
    });
  };

  const cleanBold = (text: string) => text.replace(/\*\*(.*?)\*\*/g, '$1');

  const extractHRContacts = (msgText: string) => {
    let email = activeCompany?.hrEmail?.trim() || null;
    let mobile = activeCompany?.hrMobile?.trim() || null;

    if (!email) {
      const found = msgText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g);
      if (found) {
        const filtered = found.filter(e =>
          !e.toLowerCase().includes('jagath9360') &&
          e.toLowerCase() !== user?.email?.toLowerCase()
        );
        if (filtered.length > 0) email = filtered[0];
      }
    }

    if (!mobile) {
      const found = msgText.match(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g);
      if (found) {
        const filtered = found.filter(p => !p.includes('9360270984'));
        if (filtered.length > 0) mobile = filtered[0];
      }
    }

    return { hrEmail: email, hrMobile: mobile };
  };

  // Sync / fetch chat history when panel opens
  useEffect(() => {
    if (token && isOpen) {
      fetchChatHistory();
    }
  }, [token, isOpen]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const fetchChatHistory = async () => {
    try {
      const res = await axios.get('/api/chat/history');
      setMessages(res.data.map((m: any) => ({
        sender: m.sender,
        text: m.text,
        timestamp: new Date(m.timestamp)
      })));
    } catch (err) {
      console.error('Failed to pull chat logs:', err);
    }
  };

  const sendPromptMessage = async (queryText: string) => {
    if (!queryText.trim() || isSending) return;

    const userMsg: ChatMessage = { sender: 'user', text: queryText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsSending(true);

    try {
      const res = await axios.post('/api/chat/send', {
        message: queryText,
        activeResumeId: activeResume?._id || null,
        activeCompanyId: activeCompany?._id || null
      });

      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: res.data.reply, timestamp: new Date() }
      ]);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'AI service temporarily unavailable. Please try again.';
      showToast(errorMsg, 'error');
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: errorMsg,
          timestamp: new Date(),
          isError: true,
          retryQuery: queryText
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const textToSend = inputValue.trim();
    setInputValue('');
    await sendPromptMessage(textToSend);
  };

  const clearHistory = async () => {
    if (window.confirm('Clear all conversation logs with the AI Assistant?')) {
      try {
        await axios.delete('/api/chat/clear');
        setMessages([]);
        showToast('Chat history cleared.', 'info');
      } catch (err) {
        showToast('Failed to clear history.', 'error');
      }
    }
  };

  // Dynamic prompt suggestions based on user flow and context
  const allPrompts = [
    { id: 'interview_qs', label: 'Technical interview questions (5 Q&As)', query: 'Provide 5 technical interview questions with concise answers based on this JD.' },
    { id: 'more_qs', label: 'More Questions (Load 5 More)', query: 'Give me 5 more technical interview questions with concise answers based on this JD.' },
    { id: 'system_design', label: 'System design & architecture Q&A', query: 'What system design and architecture questions might be asked for this role?' },
    { id: 'react_deepdive', label: 'React & Frontend deep-dive Q&A', query: 'Give me 3 advanced React.js and Frontend performance questions with answers.' },
    { id: 'backend_db', label: 'Node.js & Database Q&A', query: 'What backend API and database questions could come up for this role?' },
    { id: 'hr_email', label: 'Draft HR email (short)', query: 'Review my resume and target JD, and provide a concise, professional cold email format to send to HR including my Portfolio, GitHub, and LinkedIn links.' },
    { id: 'followup_timing', label: 'Email follow-up strategy', query: 'How and when should I send a follow-up email if HR does not reply in 3 days?' },
    { id: 'behavioral_qs', label: 'Behavioral & STAR method tips', query: 'What behavioral interview questions should I prepare for this role?' },
    { id: 'hr_round_qs', label: 'HR round & situational questions', query: 'What non-technical situational questions does HR ask during screening?' },
    { id: 'salary_negotiation', label: 'Salary expectation advice', query: 'What is the typical salary range and negotiation tip for an entry-level Associate Software Engineer?' },
    { id: 'review_resume', label: 'Review my resume', query: 'Can you look at my uploaded resume and suggest 3 high-impact enhancements based on this JD?' },
    { id: 'resume_match', label: 'Is my resume matching?', query: 'How well does my resume align with the target skills in this JD?' },
  ];

  const getSuggestedPrompts = () => {
    if (messages.length === 0) {
      return [
        allPrompts.find(p => p.id === 'interview_qs')!,
        allPrompts.find(p => p.id === 'hr_email')!,
        allPrompts.find(p => p.id === 'review_resume')!,
        allPrompts.find(p => p.id === 'resume_match')!,
      ].filter(Boolean);
    }

    const userMessages = messages.filter(m => m.sender === 'user').map(m => m.text.toLowerCase());
    const lastUserMsg = userMessages[userMessages.length - 1] || '';

    // Track what topics have been asked so far
    const askedTopics = new Set<string>();
    userMessages.forEach(msg => {
      if (msg.includes('system design')) askedTopics.add('system_design');
      if (msg.includes('react') || msg.includes('frontend')) askedTopics.add('react_deepdive');
      if (msg.includes('backend') || msg.includes('database') || msg.includes('node')) askedTopics.add('backend_db');
      if (msg.includes('behavioral')) askedTopics.add('behavioral_qs');
      if (msg.includes('hr round') || msg.includes('situational')) askedTopics.add('hr_round_qs');
      if (msg.includes('salary')) askedTopics.add('salary_negotiation');
      if (msg.includes('follow-up') || msg.includes('followup')) askedTopics.add('followup_timing');
      if (msg.includes('email') || msg.includes('mail')) askedTopics.add('hr_email');
      if (msg.includes('resume') || msg.includes('match')) askedTopics.add('resume_match');
    });

    const isInterviewFlow = lastUserMsg.includes('interview') || lastUserMsg.includes('question') || lastUserMsg.includes('q&a') || lastUserMsg.includes('qs') || lastUserMsg.includes('5 more');

    let pool: typeof allPrompts = [];

    if (isInterviewFlow) {
      // Dynamic technical & prep flow rotation
      pool = [
        allPrompts.find(p => p.id === 'more_qs')!,
        !askedTopics.has('react_deepdive') ? allPrompts.find(p => p.id === 'react_deepdive')! : null,
        !askedTopics.has('system_design') ? allPrompts.find(p => p.id === 'system_design')! : null,
        !askedTopics.has('backend_db') ? allPrompts.find(p => p.id === 'backend_db')! : null,
        !askedTopics.has('behavioral_qs') ? allPrompts.find(p => p.id === 'behavioral_qs')! : null,
        !askedTopics.has('hr_round_qs') ? allPrompts.find(p => p.id === 'hr_round_qs')! : null,
        allPrompts.find(p => p.id === 'hr_email')!,
        allPrompts.find(p => p.id === 'resume_match')!,
      ].filter(Boolean) as typeof allPrompts;
    } else if (lastUserMsg.includes('email') || lastUserMsg.includes('mail') || lastUserMsg.includes('hr')) {
      pool = [
        allPrompts.find(p => p.id === 'followup_timing')!,
        allPrompts.find(p => p.id === 'interview_qs')!,
        allPrompts.find(p => p.id === 'salary_negotiation')!,
        allPrompts.find(p => p.id === 'review_resume')!,
      ].filter(Boolean) as typeof allPrompts;
    } else {
      // General dynamic rotation based on message turn count
      const turnIndex = messages.length % 3;
      if (turnIndex === 0) {
        pool = [
          allPrompts.find(p => p.id === 'interview_qs')!,
          allPrompts.find(p => p.id === 'react_deepdive')!,
          allPrompts.find(p => p.id === 'hr_email')!,
          allPrompts.find(p => p.id === 'behavioral_qs')!,
        ].filter(Boolean) as typeof allPrompts;
      } else if (turnIndex === 1) {
        pool = [
          allPrompts.find(p => p.id === 'more_qs')!,
          allPrompts.find(p => p.id === 'system_design')!,
          allPrompts.find(p => p.id === 'followup_timing')!,
          allPrompts.find(p => p.id === 'salary_negotiation')!,
        ].filter(Boolean) as typeof allPrompts;
      } else {
        pool = [
          allPrompts.find(p => p.id === 'backend_db')!,
          allPrompts.find(p => p.id === 'hr_round_qs')!,
          allPrompts.find(p => p.id === 'review_resume')!,
          allPrompts.find(p => p.id === 'resume_match')!,
        ].filter(Boolean) as typeof allPrompts;
      }
    }

    // Ensure 4 unique, unasked/relevant prompt options
    const uniquePool: typeof allPrompts = [];
    pool.forEach(p => {
      if (!uniquePool.some(existing => existing.id === p.id)) {
        uniquePool.push(p);
      }
    });

    return uniquePool.slice(0, 4);
  };

  if (!user) return null; // Chatbot is a secure feature

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 shadow-indigo-600/30 border border-indigo-500/10 cursor-pointer"
          >
            <MessageSquare className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-sky-500"></span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="flex h-[75vh] max-h-[600px] sm:h-[550px] w-[calc(100vw-2rem)] sm:w-[380px] flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-900 to-indigo-800 px-4.5 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-indigo-500/20 text-white border border-indigo-500/20">
                  <Sparkles className="h-4.5 w-4.5 text-indigo-300 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold tracking-tight">AI Search Buddy</h4>
                  <p className="text-[10px] text-indigo-200">AI Assistant • Context Grounded</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 text-indigo-300">
                <button
                  onClick={clearHistory}
                  className="p-1 rounded hover:bg-white/10 hover:text-white transition-all"
                  title="Clear conversation log"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-white/10 hover:text-white transition-all"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Context bar (indicates what AI knows) */}
            <div className="flex items-center justify-between bg-zinc-50 px-4 py-1.5 text-[10px] dark:bg-zinc-900 text-zinc-500 border-b border-zinc-100 dark:border-zinc-900">
              <span className="flex items-center gap-1">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${activeResume ? 'bg-green-500' : 'bg-amber-500'}`} />
                Resume: <span className="font-medium truncate max-w-[80px]">{activeResume ? activeResume.name : 'Missing'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${activeCompany ? 'bg-green-500' : 'bg-amber-500'}`} />
                Target JD: <span className="font-medium truncate max-w-[80px]">{activeCompany ? activeCompany.companyName : 'Missing'}</span>
              </span>
            </div>

            {/* Message Pane */}
            <div className="flex-1 overflow-y-auto px-4.5 py-4 space-y-4">
              {messages.length === 0 && !isSending && (
                <div className="flex flex-col items-center justify-center h-full text-center py-6">
                  <HelpCircle className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-2" />
                  <h5 className="text-xs font-semibold">How can I help you?</h5>
                  <p className="text-[11px] text-zinc-400 max-w-[200px] mt-1">
                    Ask me about interview rounds, resume scores, or how to phrase experiences!
                  </p>

                  {/* Suggestions list */}
                  <div className="w-full mt-4 space-y-1.5">
                    {getSuggestedPrompts().map((prompt) => (
                      <button
                        key={prompt.id}
                        onClick={() => {
                          sendPromptMessage(prompt.query);
                        }}
                        className="w-full text-left p-2 rounded-xl text-[10px] border border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/50 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400 transition-all cursor-pointer"
                      >
                        {prompt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => {
                const parsedEmail = msg.sender === 'ai' ? parseEmailMessage(msg.text) : null;
                const { hrEmail, hrMobile } = msg.sender === 'ai' ? extractHRContacts(msg.text) : { hrEmail: null, hrMobile: null };
                const subjKey = `subj-${i}`;
                const bodyKey = `body-${i}`;
                const fullKey = `full-${i}`;

                return (
                  <div
                    key={i}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-3.5 py-3 text-xs ${msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                        : 'bg-zinc-100 text-zinc-800 rounded-bl-none dark:bg-zinc-900 dark:text-zinc-100 border border-zinc-200/50 dark:border-zinc-800/50'
                        }`}
                    >
                      {parsedEmail ? (
                        <div className="space-y-3">
                          {/* TOP: Subject Card & Copy Subject Button */}
                          <div className="rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/40 p-2.5 space-y-1.5 shadow-2xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                                📌 Subject
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(cleanBold(parsedEmail.subject), subjKey, 'Subject')}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-all cursor-pointer"
                              >
                                {copiedKey === subjKey ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3" />}
                                {copiedKey === subjKey ? 'Subject Copied' : 'Copy Subject'}
                              </button>
                            </div>
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100 leading-snug select-all bg-white/70 dark:bg-zinc-900/80 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                              {renderFormattedText(parsedEmail.subject)}
                            </div>
                          </div>

                          {/* BOTTOM: Email Body Card & Copy Body Button */}
                          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 space-y-2 shadow-2xs">
                            <div className="flex items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
                              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                📝 Email Content / Body
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(cleanBold(parsedEmail.body), bodyKey, 'Email Body')}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-all cursor-pointer"
                              >
                                {copiedKey === bodyKey ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3" />}
                                {copiedKey === bodyKey ? 'Body Copied' : 'Copy Body'}
                              </button>
                            </div>
                            <div className="whitespace-pre-wrap leading-relaxed text-zinc-800 dark:text-zinc-200 select-all font-normal">
                              {renderFormattedText(parsedEmail.body)}
                            </div>
                          </div>

                          {/* DIRECT HR CONTACT & WHATSAPP BUTTONS (Only if email or mobile exists) */}
                          {(hrEmail || hrMobile) && (
                            <div className="rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 p-2.5 space-y-2">
                              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
                                ⚡ Direct HR Connect
                              </span>
                              <div className="flex items-center gap-2 flex-wrap">
                                {hrEmail && (
                                  <a
                                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(hrEmail)}&su=${encodeURIComponent(cleanBold(parsedEmail.subject))}&body=${encodeURIComponent(cleanBold(parsedEmail.body))}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all cursor-pointer shadow-xs"
                                  >
                                    <Mail className="h-3.5 w-3.5" />
                                    Email HR ({hrEmail})
                                  </a>
                                )}
                                {hrMobile && (
                                  <a
                                    href={`https://web.whatsapp.com/send?phone=${hrMobile.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(`${cleanBold(parsedEmail.subject)}\n\n${cleanBold(parsedEmail.body)}`)}`}
                                    target="whatsapp_web"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer shadow-xs"
                                  >
                                    <MessageCircle className="h-3.5 w-3.5 fill-current" />
                                    WhatsApp HR ({hrMobile})
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : msg.isError ? (
                        <div className="space-y-2 p-1 text-red-600 dark:text-red-400">
                          <div className="flex items-center gap-1.5 font-semibold text-xs text-red-600 dark:text-red-400">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>Request Failed</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300 bg-red-50 dark:bg-red-950/40 p-2 rounded-lg border border-red-200 dark:border-red-900/50">
                            {msg.text}
                          </p>
                          {msg.retryQuery && (
                            <button
                              type="button"
                              onClick={() => sendPromptMessage(msg.retryQuery!)}
                              disabled={isSending}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50 mt-1"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Retry Request
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                          {msg.sender === 'ai' && (
                            <div className="flex items-center justify-between gap-1.5 border-b border-zinc-200/80 dark:border-zinc-800 pb-1.5 mb-2">
                              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                AI Assistant
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(msg.text, fullKey, 'Message')}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                              >
                                {copiedKey === fullKey ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                {copiedKey === fullKey ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                          )}
                          <div className="whitespace-pre-wrap leading-relaxed">
                            {msg.text}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {isSending && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl rounded-bl-none bg-zinc-100 px-3.5 py-3 text-xs dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50">
                    <div className="flex items-center space-x-1.5">
                      <span className="block h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
                      <span className="block h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 delay-150" />
                      <span className="block h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 delay-300" />
                    </div>
                  </div>
                </div>
              )}

              {messages.length > 0 && !isSending && (
                <div className="pt-3 pb-1 space-y-1.5 border-t border-zinc-100 dark:border-zinc-900/60 mt-3">
                  <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mb-1.5 px-1">Suggested questions:</p>
                  <div className="space-y-1.5">
                    {getSuggestedPrompts().map((prompt) => (
                      <button
                        key={prompt.id}
                        type="button"
                        onClick={() => sendPromptMessage(prompt.query)}
                        className="w-full text-left p-2 rounded-xl text-[10px] border border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/50 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400 transition-all cursor-pointer shadow-2xs"
                      >
                        {prompt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={scrollRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950">
              <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask Search Buddy..."
                  disabled={isSending}
                  className="flex-1 bg-transparent px-3 py-1.5 text-xs outline-none focus:ring-0 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isSending}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-30 disabled:hover:bg-indigo-600 transition-all"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
