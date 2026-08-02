import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Sparkles, AlertCircle, RefreshCw, Send, Star, ChevronRight, Award,
  HelpCircle, ArrowLeft, CheckCircle2, ChevronDown, Check, X, BookOpen, AlertTriangle
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
  const [showIdeal, setShowIdeal] = useState(false);

  // Track evaluations for each question
  const [evaluations, setEvaluations] = useState<Record<string, { score: number; feedback: string; suggestions: string }>>({});
  const [showFinalScoreModal, setShowFinalScoreModal] = useState(false);

  useEffect(() => {
    if (activeCompany) {
      checkExistingGuide();
    }
  }, [activeCompany]);

  const checkExistingGuide = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/interview/all');
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
      showToast('Generating personalized mock interview rounds with AI...', 'info');
      const res = await axios.post('/api/interview/generate', {
        companyId: activeCompany._id,
        resumeId: activeResume._id
      });
      setGuide(res.data.guide);
      showToast('Interview preparation guide generated successfully!', 'success');
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

    const activeRound = rounds[activeRoundIdx];
    const activeQuestion = activeRound.questions[activeQuestionIdx];

    setIsEvaluating(true);

    try {
      showToast('Submitting practice answer to AI evaluator...', 'info');
      const res = await axios.post('/api/interview/evaluate-response', {
        question: activeQuestion.question,
        userAnswer: userAnswer.trim(),
        category: activeRound.name
      });

      // Backend returns { score, feedback, suggestions }
      const evalData = {
        score: typeof res.data.score === 'number' ? res.data.score : 75,
        feedback: res.data.feedback || 'Evaluation completed successfully.',
        suggestions: res.data.suggestions || ''
      };

      setEvaluations((prev) => ({
        ...prev,
        [activeQuestion.question]: evalData
      }));

      showToast('Evaluation complete! Check score feedback below.', 'success');
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
            Please complete a **Company Job Description Analysis** first. The AI custom-tailors interview prep parameters based specifically on their corporate metadata!
          </p>
          <div className="pt-4">
            <Link to="/dashboard" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm">Go to Dashboard</Link>
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

  if (!guide) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-zinc-50 dark:bg-zinc-950 px-4 py-8 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
        <div className="mx-auto max-w-lg w-full mt-10">

          {/* Back Step link */}
          <Link to="/ats-score" className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-indigo-600 transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to ATS Score
          </Link>

          <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 space-y-6 shadow-md text-center">
            <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto dark:bg-indigo-950/40 dark:text-indigo-400">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold tracking-tight">Generate Preparation Guide</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                We found no pre-generated preparation materials for <b>{activeCompany.companyName}</b>. Click the button below to have AI formulate customized mock rounds (Behavioral, Technical, HR, Scenario, Coding) tailored explicitly for your active resume and this specific job profile!
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
              Generate Custom Prep Guide with AI
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Compile rounds
  const rounds: Array<{ name: string; questions: Array<{ question: string; idealAnswerSTAR: string }> }> = [];
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
  const activeEvaluation = activeQuestion ? evaluations[activeQuestion.question] : null;

  // Score Calculation details
  const evaluatedQuestionsCount = Object.keys(evaluations).length;
  const totalQuestionsCount = rounds.reduce((sum, r) => sum + r.questions.length, 0);

  const calculateFinalConfirmationScore = () => {
    if (evaluatedQuestionsCount === 0) {
      showToast('Please answer and evaluate at least one question first.', 'error');
      return;
    }
    setShowFinalScoreModal(true);
  };

  const getFinalMetrics = () => {
    const scores = Object.values(evaluations).map((e: any) => e.score);
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    // Scale or adjust final score representation
    const finalScoreValue = Math.round(avgScore);
    const isSuccessful = finalScoreValue >= 80;

    // Find weak topics (questions with scores below 80)
    const weakTopics: string[] = [];
    rounds.forEach((r) => {
      r.questions.forEach((q) => {
        const ev = evaluations[q.question];
        if (ev && ev.score < 80) {
          weakTopics.push(`${r.name}: ${q.question.substring(0, 45)}...`);
        }
      });
    });

    return {
      finalScore: finalScoreValue,
      isSuccessful,
      weakTopics
    };
  };

  const metrics = evaluatedQuestionsCount > 0 ? getFinalMetrics() : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 px-4 py-8 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      <div className="mx-auto max-w-5xl space-y-6">



        {/* Header Block */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            Interactive Mock Interview Simulator
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Grounded practice sessions compiled for <b>{activeCompany.companyName} ({activeCompany.jobTitle})</b>.
          </p>
        </div>

        {rounds.length > 0 && activeRound && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left rail - Rounds list & Questions (span 4) */}
            <div className="lg:col-span-4 space-y-6">

              {/* Rounds Tabs */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-4.5 dark:border-zinc-800 dark:bg-zinc-900 space-y-2 shadow-sm">
                <span className="block text-[10px] uppercase font-bold text-zinc-400 mb-2">Hiring Rounds</span>
                <div className="space-y-1.5">
                  {rounds.map((round: any, idx: number) => {
                    // Count how many questions in this round are answered
                    const answeredInRound = round.questions.filter((q: any) => !!evaluations[q.question]).length;

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveRoundIdx(idx);
                          setActiveQuestionIdx(0);
                          setUserAnswer('');
                          setShowIdeal(false);
                        }}
                        className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-between cursor-pointer ${activeRoundIdx === idx
                          ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm'
                          : 'border-zinc-150 bg-zinc-50/50 hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 dark:border-zinc-800/50 dark:bg-zinc-950/20 dark:hover:bg-indigo-900/20 dark:hover:border-indigo-800/30 dark:hover:text-indigo-400 text-zinc-600 dark:text-zinc-400'
                          }`}
                      >
                        <span className="truncate pr-1">{round.name}</span>
                        <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-black/15 text-white whitespace-nowrap shrink-0">
                          {answeredInRound}/{round.questions.length} Done
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Questions list */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-4.5 dark:border-zinc-800 dark:bg-zinc-900 space-y-2 shadow-sm">
                <span className="block text-[10px] uppercase font-bold text-zinc-400 mb-2">Round Questions</span>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {activeRound.questions?.map((q: any, idx: number) => {
                    const hasEval = !!evaluations[q.question];
                    const score = evaluations[q.question]?.score;

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveQuestionIdx(idx);
                          setUserAnswer('');
                          setShowIdeal(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-all border flex items-center justify-between gap-2 cursor-pointer ${activeQuestionIdx === idx
                          ? 'border-indigo-600 bg-indigo-50/20 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'border-transparent hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 text-zinc-500'
                          }`}
                      >
                        <span className="truncate flex-1">
                          {idx + 1}. {q.question}
                        </span>

                        {hasEval ? (
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md ${score >= 80
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : score >= 60
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                              : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                            }`}>
                            {score}%
                          </span>
                        ) : (
                          <span className="text-[9px] text-zinc-400 font-medium whitespace-nowrap">Pending</span>
                        )}
                      </button>
                    );
                  })}
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
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowIdeal(!showIdeal)}
                      className="w-full flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/40 p-4 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-indigo-500" />
                        Model STAR Answer Guideline
                      </span>
                      <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${showIdeal ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showIdeal && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden"
                        >
                          <div className="p-4 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {activeQuestion.idealAnswerSTAR}
                          </div>
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
                        placeholder="Type or paste your response structure here. Describe your experiences, technologies, metrics achieved."
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
                        {isEvaluating ? 'AI calculating feedback matrix...' : 'Submit Response for AI Review'}
                      </button>
                    </div>
                  </form>

                  {/* Realtime AI evaluation output */}
                  <AnimatePresence>
                    {activeEvaluation && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="pt-6 border-t border-zinc-150 dark:border-zinc-800 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-indigo-500 animate-pulse" />
                            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">Evaluation Report</h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-400 uppercase font-bold">Answer Score:</span>
                            <span className={`text-sm font-black px-2.5 py-1 rounded-lg ${activeEvaluation.score >= 80
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                              : activeEvaluation.score >= 60
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                              }`}>
                              {activeEvaluation.score}/100
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3 text-xs leading-relaxed">
                          <div className="p-3 rounded-xl border border-zinc-150 bg-zinc-50 dark:bg-zinc-950/40">
                            <span className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Clarity & Communication Feedback</span>
                            <p className="text-zinc-700 dark:text-zinc-300 font-medium">{activeEvaluation.feedback}</p>
                          </div>

                          {activeEvaluation.suggestions && (
                            <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-500/5 dark:border-indigo-950/40">
                              <span className="block text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase mb-1 flex items-center gap-1">
                                <Sparkles className="h-3.5 w-3.5" />
                                Recommended Impressive Wording
                              </span>
                              <p className="text-zinc-700 dark:text-zinc-300 italic leading-relaxed">"{activeEvaluation.suggestions}"</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              )}

            </div>

          </div>
        )}

        {/* Navigation Actions Bottom */}
        <div className="flex items-center justify-between pt-8 border-t border-zinc-200 dark:border-zinc-800 mt-8 mb-4">
          <Link
            to="/resume-builder"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-bold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back (Resume Builder)
          </Link>

          <div className="flex items-center gap-3">
            {evaluatedQuestionsCount > 0 && (
              <button
                onClick={calculateFinalConfirmationScore}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-all cursor-pointer"
              >
                Finish Evaluation
                <Award className="h-4.5 w-4.5" />
                Show My Final Score
              </button>
            )}
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-bold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Dashboard
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </div>

      {/* FINAL SCORE CELEBRATORY / CONSTRUCTIVE OVERLAY MODAL */}
      <AnimatePresence>
        {showFinalScoreModal && metrics && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 overflow-hidden"
            >
              {/* Close x */}
              <button
                onClick={() => setShowFinalScoreModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl border border-zinc-150 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950/40 text-zinc-500 hover:text-zinc-700 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="text-center space-y-6 py-4">

                {/* Big decorative badge */}
                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border shrink-0 ${metrics.isSuccessful
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900'
                  }`}>
                  {metrics.isSuccessful ? <CheckCircle2 className="h-9 w-9" /> : <AlertTriangle className="h-9 w-9 animate-bounce" />}
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Overall Application Prep Score</span>

                  {metrics.isSuccessful ? (
                    <div>
                      <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">90% Confirmation</h3>
                      <h4 className="text-sm font-bold uppercase text-zinc-700 dark:text-zinc-300 mt-1">YOU CONFIRM get a job!</h4>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-3xl font-black text-amber-500">{metrics.finalScore}% Rating</h3>
                      <h4 className="text-sm font-semibold text-zinc-500 mt-1">Almost there! Keep practicing</h4>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/40 dark:border-zinc-800/40 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
                  {metrics.isSuccessful ? (
                    <p>
                      Excellent presentation! Your mock responses match the requirements of the job posting perfectly. Your communication style is highly convincing.
                    </p>
                  ) : (
                    <div className="space-y-3 text-left">
                      <p>
                        You are trying well! Your overall preparation indicates solid technical and behavioral parameters, but you can focus more on the following topics to boost your scores:
                      </p>
                      {metrics.weakTopics.length > 0 && (
                        <div className="space-y-1.5 pl-2 border-l border-amber-300">
                          {metrics.weakTopics.slice(0, 3).map((topic, i) => (
                            <span key={i} className="block font-semibold text-zinc-800 dark:text-zinc-300">{topic}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setShowFinalScoreModal(false)}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
                  >
                    Continue Practicing
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
