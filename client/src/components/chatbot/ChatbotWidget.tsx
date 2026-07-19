import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { 
  MessageSquare, Send, X, Sparkles, Trash2, 
  Minus, AlertCircle, ArrowUpRight, HelpCircle
} from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export const ChatbotWidget: React.FC = () => {
  const { user, token, activeResume, activeCompany, showToast } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const textToSend = inputValue.trim();
    setInputValue('');
    
    // Optimistic user message
    const userMsg: ChatMessage = { sender: 'user', text: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsSending(true);

    try {
      const res = await axios.post('/api/chat/send', {
        message: textToSend,
        activeResumeId: activeResume?._id || null,
        activeCompanyId: activeCompany?._id || null
      });

      // Append real-time server response
      const aiMsg: ChatMessage = { sender: 'ai', text: res.data.reply, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to connect to AI assistant.', 'error');
    } finally {
      setIsSending(false);
    }
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

  // Quick prompt suggestions to ease user flow
  const quickPrompts = [
    { label: 'Review my resume', query: 'Can you look at my uploaded resume and suggest 3 high-impact enhancements?' },
    { label: 'Interview questions', query: 'What are the top 3 technical questions they will ask me based on this JD?' },
    { label: 'Is my resume matching?', query: 'How well does my resume align with the target skills in this JD?' },
  ];

  if (!user) return null; // Chatbot is a secure feature

  return (
    <div className="fixed bottom-6 right-6 z-50">
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
            className="flex h-[550px] w-[380px] flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-900 to-indigo-800 px-4.5 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-indigo-500/20 text-white border border-indigo-500/20">
                  <Sparkles className="h-4.5 w-4.5 text-indigo-300 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold tracking-tight">AI Search Buddy</h4>
                  <p className="text-[10px] text-indigo-200">Grok 2.0 • Context Grounded</p>
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
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt.label}
                        onClick={() => {
                          setInputValue(prompt.query);
                        }}
                        className="w-full text-left p-2 rounded-xl text-[10px] border border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/50 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400 transition-all cursor-pointer"
                      >
                        {prompt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                        : 'bg-zinc-100 text-zinc-800 rounded-bl-none dark:bg-zinc-900 dark:text-zinc-100 border border-zinc-200/50 dark:border-zinc-800/50'
                    }`}
                  >
                    {/* Render message with linebreaks */}
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}

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
