import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import {
  Sparkles, AlertCircle, RefreshCw, Send, Star, ChevronRight, Award, HelpCircle
} from 'lucide-react';

export const InterviewPrep: React.FC = () => {
  const { activeCompany, activeResume, showToast } = useApp();

  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState<any | null>(null);
  const [activeRoundIdx, setActiveRoundIdx] = useState(0);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  // Playground state
  const [userAnswer, setUserAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [showIdeal, setShowIdeal] = useState(false);

  useEffect(() => {
    if (activeCompany) {
      checkExistingGuide();
    }
  }, [activeCompany]);

  const checkExistingGuide = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/interview/all');
      // Look for a guide corresponding to our active company ID
      const match = res.data.find((g: any) => g.companyId?._id === activeCompany._id || g.companyId === activeCompany._id);
      if (match) {
        setGuide(match);
      } else {
        setGuide(null);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to check existing interview guides.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateGuide = async () => {
    if (!activeCompany || !activeResume) {
      showToast('Ensure both target JD and active Resume are loaded.', 'error');
      return;
    }

    setLoading(true);
    try {
      showToast('Generating personalized mock interview rounds with Grok...', 'info');
      const res = await axios.post('/api/interview/generate', {
        companyId: activeCompany._id,
        resumeId: activeResume._id
      });
      setGuide(res.data.guide);
      showToast('Interview preparation guide generated!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to generate interview guide.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) {
      showToast('Please draft a response first.', 'error');
      return;
    }

    const activeRound = guide.rounds[activeRoundIdx];
    const activeQuestion = activeRound.questions[activeQuestionIdx];

    setIsEvaluating(true);
    setFeedbackText(null);

    try {
      showToast('Submitting practice answer to Grok evaluator...', 'info');
      const res = await axios.post('/api/interview/evaluate-response', {
        question: activeQuestion.question,
        userAnswer: userAnswer.trim(),
        category: activeRound.name
      });

      setFeedbackText(res.data.feedback);
      showToast('Evaluation complete! Scroll down to review advice.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to complete evaluation.', 'error');
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!activeCompany) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 text-center">
        <div className="max-w-md rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 space-y-4 shadow-sm">
          <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold">JD Profile Required</h3>
          <p className="text-xs text-zinc-500">
            Please run a **Company Job Description Analysis** first. The AI custom-tailors interview prep guide criteria based specifically on their corporate tech stack & interview process metadata!
          </p>
          <div className="pt-4">
            <a href="/home" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm">Analyze Job JD Now</a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center space-y-4">
          <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin mx-auto" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Assembling interview framework parameters...</p>
        </div>
      </div>
    );
  }

  // State where company loaded but guide has not been generated
  if (!guide) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 text-center">
        <div className="max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 space-y-6 shadow-md">
          <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto dark:bg-indigo-950/40 dark:text-indigo-400">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold tracking-tight">Generate Preparation Guide</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              We found no pre-generated preparation materials for <b>{activeCompany.companyName}</b>. Click the button below to have Grok AI formulate three customized mock rounds (Behavioral, Technical, System Design) tailored explicitly for your active resume and this specific job profile!
            </p>
          </div>

          {!activeResume && (
            <div className="p-3.5 bg-amber-50 text-amber-800 rounded-xl text-[11px] font-semibold dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40">
              ⚠️ Please upload a Resume in the builder first so the AI can compare your experiences!
            </div>
          )}

          <button
            onClick={handleGenerateGuide}
            disabled={!activeResume}
            className="flex w-full items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40 transition-all cursor-pointer shadow-md shadow-indigo-500/10"
          >
            Generate Custom Prep Guide with Grok
          </button>
        </div>
      </div>
    );
  }

  // Map the disparate backend arrays into unified rounds that the UI expects
  const rounds = [];
  if (guide?.behavioralQuestions?.length) {
    rounds.push({
      name: 'Behavioral Questions',
      questions: guide.behavioralQuestions.map((q: any) => ({
        question: q.question,
        idealAnswerSTAR: `Situation: ${q.situation}\nTask: ${q.task}\nAction: ${q.action}\nResult: ${q.result}`
      }))
    });
  }
  if (guide?.technicalQuestions?.length) {
    rounds.push({
      name: 'Technical Questions',
      questions: guide.technicalQuestions.map((q: any) => ({
        question: q.question,
        idealAnswerSTAR: q.answer
      }))
    });
  }
  if (guide?.hrQuestions?.length) {
    rounds.push({
      name: 'HR Questions',
      questions: guide.hrQuestions.map((q: any) => ({
        question: q.question,
        idealAnswerSTAR: q.answer
      }))
    });
  }
  if (guide?.scenarioQuestions?.length) {
    rounds.push({
      name: 'Scenario Questions',
      questions: guide.scenarioQuestions.map((q: any) => ({
        question: q.scenario,
        idealAnswerSTAR: q.approach
      }))
    });
  }
  if (guide?.codingQuestions?.length) {
    rounds.push({
      name: 'Coding Questions',
      questions: guide.codingQuestions.map((q: any) => ({
        question: q.title,
        idealAnswerSTAR: `Description: ${q.description}\nHint: ${q.hint}\nSolution:\n${q.solution}`
      }))
    });
  }

  const activeRound = rounds[activeRoundIdx];
  const activeQuestion = activeRound?.questions?.[activeQuestionIdx];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 px-4 py-8 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* Header Block */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-600 animate-pulse" />
            Interactive Mock Interview Simulator
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Grounded interview preparation tailored specifically for <b>{activeCompany.companyName} ({activeCompany.jobTitle})</b>.
          </p>
        </div>

        {rounds.length > 0 && activeRound && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left rail - Rounds list & Questions (span 4) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Rounds Tabs */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-4.5 dark:border-zinc-800 dark:bg-zinc-900 space-y-2">
                <span className="block text-[10px] uppercase font-bold text-zinc-400 mb-2">Hiring Rounds</span>
                <div className="space-y-1.5">
                  {rounds.map((round: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveRoundIdx(idx);
                        setActiveQuestionIdx(0);
                        setFeedbackText(null);
                        setUserAnswer('');
                        setShowIdeal(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-between cursor-pointer ${
                        activeRoundIdx === idx
                          ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm'
                          : 'border-zinc-150 bg-zinc-50/50 hover:bg-zinc-100 dark:border-zinc-800/50 dark:bg-zinc-950/20 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <span>{round.name}</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Questions list */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-4.5 dark:border-zinc-800 dark:bg-zinc-900 space-y-2">
                <span className="block text-[10px] uppercase font-bold text-zinc-400 mb-2">Round Questions</span>
                <div className="space-y-1.5">
                  {activeRound.questions?.map((q: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveQuestionIdx(idx);
                        setFeedbackText(null);
                        setUserAnswer('');
                        setShowIdeal(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition-all border block cursor-pointer truncate ${
                        activeQuestionIdx === idx
                          ? 'border-indigo-600 bg-indigo-50/20 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-950/20 text-zinc-500'
                      }`}
                    >
                      {idx + 1}. {q.question}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Right main area - Sandbox Playground (span 8) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Sandbox Card */}
              {activeQuestion && (
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6">
                  
                  {/* Prompt */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-500 flex items-center gap-1">
                      <Star className="h-3.5 w-3.5" />
                      Active Question
                    </span>
                    <h3 className="text-base font-bold tracking-tight text-zinc-950 dark:text-zinc-50">{activeQuestion.question}</h3>
                  </div>

                  {/* Ideal Expandable review */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowIdeal(!showIdeal)}
                      className="text-xs font-bold text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {showIdeal ? 'Hide Model Structure Guidance' : 'Reveal Model STAR Answer Guideline'}
                    </button>
                    
                    <AnimatePresence>
                      {showIdeal && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 p-4 rounded-xl border border-indigo-50 bg-indigo-50/20 dark:border-indigo-950 dark:bg-indigo-950/10 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed overflow-hidden whitespace-pre-wrap"
                        >
                          {activeQuestion.idealAnswerSTAR}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Submission form */}
                  <form onSubmit={handleEvaluate} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Your practice draft response</label>
                      <textarea
                        required
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Type or paste your response structure here. Use details on Situations, Actions taken, and outcomes achieved."
                        rows={6}
                        disabled={isEvaluating}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50/30 p-4 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:focus:bg-zinc-950 focus:ring-0 leading-relaxed"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isEvaluating || !userAnswer.trim()}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/10 disabled:opacity-45 transition-all cursor-pointer"
                      >
                        <Send className="h-4 w-4" />
                        {isEvaluating ? 'Grok calculating feedback matrix...' : 'Submit Response for AI Review'}
                      </button>
                    </div>
                  </form>

                  {/* Realtime AI evaluation output */}
                  <AnimatePresence>
                    {feedbackText && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="pt-6 border-t border-zinc-150 dark:border-zinc-800 space-y-4"
                      >
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-indigo-500 animate-pulse" />
                          <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">Grok Verbal Evaluation Feedback</h4>
                        </div>
                        <div className="p-4 rounded-xl border border-zinc-150 bg-zinc-50 dark:bg-zinc-950/40 text-xs leading-relaxed whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">
                          {feedbackText}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
