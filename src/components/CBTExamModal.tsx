/**
 * CBTExamModal Component
 * Authentic JEE Computer Based Test (CBT) examination simulator
 * Features NTA-style palette, timer countdown, section switching, review flags,
 * submission modal, and comprehensive performance analysis report.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Question, 
  UserProgress, 
  Subject, 
  QuestionAttemptStatus, 
  TestSession 
} from '../types/question';
import { MathRenderer } from './MathRenderer';
import { TestPalette, PaletteItem } from './TestPalette';
import { saveTestSession } from '../db/dexieDB';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Flag, 
  Award, 
  BarChart3, 
  Trophy,
  X,
  BookOpen
} from 'lucide-react';

interface CBTExamModalProps {
  questions: Question[];
  durationMinutes?: number;
  testTitle?: string;
  onClose: () => void;
  onTestSubmitted?: () => void;
}

interface CBTAnswerState {
  userAnswer?: string | string[] | Record<string, string[]>;
  status: QuestionAttemptStatus | 'not_visited';
  timeSpentSeconds: number;
}

export const CBTExamModal: React.FC<CBTExamModalProps> = ({
  questions,
  durationMinutes = 60,
  testTitle = 'JEE Main Full Syllabus Mock Test #01',
  onClose,
  onTestSubmitted
}) => {
  // Current active question index
  const [currentIndex, setCurrentIndex] = useState(0);

  // Per-question state in exam
  const [examAnswers, setExamAnswers] = useState<Record<string, CBTAnswerState>>(() => {
    const init: Record<string, CBTAnswerState> = {};
    questions.forEach((q, idx) => {
      init[q.id] = {
        status: idx === 0 ? 'unattempted' : 'not_visited',
        timeSpentSeconds: 0
      };
    });
    return init;
  });

  // Current draft response for the active question
  const [draftOption, setDraftOption] = useState<string>('');
  const [draftMulti, setDraftMulti] = useState<string[]>([]);
  const [draftNumerical, setDraftNumerical] = useState<string>('');
  const [draftMatrix, setDraftMatrix] = useState<Record<string, string[]>>({});

  // Countdown Timer
  const [timeLeft, setTimeLeft] = useState<number>(durationMinutes * 60);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [completedSession, setCompletedSession] = useState<TestSession | null>(null);

  // Active section filter in palette
  const [paletteSubject, setPaletteSubject] = useState<Subject | 'all'>('all');

  const currentQ = questions[currentIndex];

  // Track draft values whenever question index changes
  useEffect(() => {
    if (!currentQ) return;
    const existing = examAnswers[currentQ.id];
    if (existing?.userAnswer) {
      if (currentQ.questionType === 'single_choice') {
        setDraftOption(existing.userAnswer as string);
      } else if (currentQ.questionType === 'multi_correct') {
        setDraftMulti(Array.isArray(existing.userAnswer) ? existing.userAnswer : []);
      } else if (currentQ.questionType === 'numerical') {
        setDraftNumerical(existing.userAnswer as string);
      } else if (currentQ.questionType === 'matrix_match') {
        setDraftMatrix(existing.userAnswer as Record<string, string[]>);
      }
    } else {
      setDraftOption('');
      setDraftMulti([]);
      setDraftNumerical('');
      setDraftMatrix({});
    }

    // Mark as visited (unattempted if not attempted)
    setExamAnswers(prev => {
      const qState = prev[currentQ.id];
      if (!qState || qState.status === 'not_visited') {
        return {
          ...prev,
          [currentQ.id]: {
            ...qState,
            status: 'unattempted',
            timeSpentSeconds: qState?.timeSpentSeconds || 0
          }
        };
      }
      return prev;
    });
  }, [currentIndex, currentQ?.id]);

  // Overall and per-question timer
  useEffect(() => {
    if (isSubmitted) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitTestAuto();
          return 0;
        }
        return prev - 1;
      });

      // Increment time spent on current question
      if (currentQ) {
        setExamAnswers(prev => ({
          ...prev,
          [currentQ.id]: {
            ...prev[currentQ.id],
            timeSpentSeconds: (prev[currentQ.id]?.timeSpentSeconds || 0) + 1
          }
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isSubmitted, currentQ?.id]);

  // Format time remaining
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? `${h}:` : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Build current draft answer payload
  const getCurrentDraftPayload = () => {
    if (currentQ.questionType === 'single_choice') {
      return draftOption || undefined;
    }
    if (currentQ.questionType === 'multi_correct') {
      return draftMulti.length > 0 ? draftMulti : undefined;
    }
    if (currentQ.questionType === 'numerical') {
      return draftNumerical.trim() ? draftNumerical.trim() : undefined;
    }
    if (currentQ.questionType === 'matrix_match') {
      return Object.keys(draftMatrix).length > 0 ? draftMatrix : undefined;
    }
    return undefined;
  };

  // 1. SAVE & NEXT
  const handleSaveAndNext = () => {
    const ans = getCurrentDraftPayload();
    const newStatus: QuestionAttemptStatus = ans ? 'attempted' : 'unattempted';

    setExamAnswers(prev => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        userAnswer: ans,
        status: newStatus
      }
    }));

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // 2. MARK FOR REVIEW & NEXT
  const handleMarkForReviewAndNext = () => {
    const ans = getCurrentDraftPayload();
    const newStatus: QuestionAttemptStatus = ans ? 'marked_and_attempted' : 'marked_for_review';

    setExamAnswers(prev => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        userAnswer: ans,
        status: newStatus
      }
    }));

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // 3. CLEAR RESPONSE
  const handleClearResponse = () => {
    setDraftOption('');
    setDraftMulti([]);
    setDraftNumerical('');
    setDraftMatrix({});

    setExamAnswers(prev => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        userAnswer: undefined,
        status: 'unattempted'
      }
    }));
  };

  // Evaluate single question result
  const evaluateQuestion = (q: Question, userAns: any): { isCorrect: boolean; score: number } => {
    if (!userAns) return { isCorrect: false, score: 0 };

    if (q.questionType === 'single_choice') {
      const correct = String(userAns).trim().toUpperCase() === String(q.correctAnswer).trim().toUpperCase();
      return { isCorrect: correct, score: correct ? 4 : -1 };
    }

    if (q.questionType === 'multi_correct') {
      const correctArr = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer as string];
      const userArr = Array.isArray(userAns) ? userAns : [];
      if (userArr.length === correctArr.length && userArr.every(x => correctArr.includes(x))) {
        return { isCorrect: true, score: 4 };
      }
      // Negative marking for incorrect choice
      const hasWrong = userArr.some(x => !correctArr.includes(x));
      if (hasWrong) return { isCorrect: false, score: -2 };
      // Partial positive marking
      return { isCorrect: false, score: userArr.length };
    }

    if (q.questionType === 'numerical') {
      const userNum = parseFloat(String(userAns).trim());
      if (isNaN(userNum)) return { isCorrect: false, score: 0 };

      let correct = false;
      if (q.numericalRange) {
        correct = userNum >= q.numericalRange[0] && userNum <= q.numericalRange[1];
      } else {
        const targetNum = parseFloat(String(q.correctAnswer));
        const tol = q.numericalTolerance || 0.05;
        correct = Math.abs(userNum - targetNum) <= tol;
      }
      return { isCorrect: correct, score: correct ? 4 : 0 };
    }

    if (q.questionType === 'matrix_match') {
      const correctMap = q.correctAnswer as Record<string, string[]>;
      const userMap = userAns as Record<string, string[]>;
      let allMatch = true;
      for (const k of Object.keys(correctMap)) {
        const uM = (userMap[k] || []).sort().join(',');
        const cM = (correctMap[k] || []).sort().join(',');
        if (uM !== cM) {
          allMatch = false;
          break;
        }
      }
      return { isCorrect: allMatch, score: allMatch ? 3 : -1 };
    }

    return { isCorrect: false, score: 0 };
  };

  // Final submission logic
  const finalizeSubmission = async () => {
    let totalScore = 0;
    let maxScore = questions.length * 4;
    let correctCount = 0;
    let attemptedCount = 0;

    const responsesRecord: TestSession['responses'] = {};
    const subjectBreakdown: TestSession['subjectSummary'] = {
      physics: { total: 0, attempted: 0, correct: 0, score: 0 },
      chemistry: { total: 0, attempted: 0, correct: 0, score: 0 },
      mathematics: { total: 0, attempted: 0, correct: 0, score: 0 }
    };

    questions.forEach(q => {
      const ansState = examAnswers[q.id];
      const hasAnswer = Boolean(ansState?.userAnswer);
      const { isCorrect, score } = evaluateQuestion(q, ansState?.userAnswer);

      if (hasAnswer) {
        attemptedCount++;
        if (isCorrect) correctCount++;
        totalScore += score;
      }

      if (subjectBreakdown[q.subject]) {
        subjectBreakdown[q.subject].total++;
        if (hasAnswer) {
          subjectBreakdown[q.subject].attempted++;
          subjectBreakdown[q.subject].score += score;
          if (isCorrect) subjectBreakdown[q.subject].correct++;
        }
      }

      responsesRecord[q.id] = {
        userAnswer: ansState?.userAnswer,
        status: (ansState?.status || 'not_visited') as QuestionAttemptStatus,
        timeSpentSeconds: ansState?.timeSpentSeconds || 0,
        isCorrect: hasAnswer ? isCorrect : null,
        scoreAwarded: hasAnswer ? score : 0
      };
    });

    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

    const session: TestSession = {
      id: `cbt-${Date.now()}`,
      title: testTitle,
      examType: 'JEE Main',
      durationMinutes,
      timeRemainingSeconds: timeLeft,
      startedAt: new Date(Date.now() - (durationMinutes * 60 - timeLeft) * 1000).toISOString(),
      completedAt: new Date().toISOString(),
      questionIds: questions.map(q => q.id),
      responses: responsesRecord,
      score: totalScore,
      maxScore,
      accuracy,
      subjectSummary: subjectBreakdown
    };

    await saveTestSession(session);
    setCompletedSession(session);
    setIsSubmitted(true);
    setShowConfirmModal(false);
    onTestSubmitted?.();
  };

  const handleSubmitTestAuto = () => {
    finalizeSubmission();
  };

  // Convert answers to palette items
  const paletteItems: PaletteItem[] = useMemo(() => {
    return questions.map((q, idx) => ({
      index: idx,
      questionId: q.id,
      status: examAnswers[q.id]?.status || 'not_visited',
      subject: q.subject
    }));
  }, [questions, examAnswers]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden text-slate-100 select-none">
      {/* Top CBT Navbar */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm">
            M
          </div>
          <div>
            <h1 className="text-sm font-bold text-white truncate max-w-[200px] md:max-w-md">
              {testTitle}
            </h1>
            <p className="text-[11px] text-slate-400">JEE Computer Based Test (CBT)</p>
          </div>
        </div>

        {/* Center Countdown Clock */}
        {!isSubmitted && (
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-sm ${
            timeLeft < 300 
              ? 'bg-rose-950/80 border-rose-600 text-rose-300 animate-pulse' 
              : 'bg-slate-950/80 border-slate-700 text-amber-300'
          }`}>
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Time Left: {formatTime(timeLeft)}</span>
          </div>
        )}

        {/* Right Exit / Submit */}
        <div className="flex items-center gap-2">
          {!isSubmitted ? (
            <button
              onClick={() => setShowConfirmModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow-md shadow-emerald-950 active:scale-95"
            >
              Submit Test
            </button>
          ) : (
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
            >
              <X className="w-4 h-4" />
              <span>Close Report</span>
            </button>
          )}
        </div>
      </header>

      {/* Main CBT Workspace (or Test Report when submitted) */}
      {!isSubmitted ? (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Active Question Area */}
          <main className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 bg-slate-950">
            {/* Section Switcher Tabs */}
            <div className="flex items-center gap-2 pb-4 border-b border-slate-800 mb-5">
              {(['physics', 'chemistry', 'mathematics'] as Subject[]).map(sub => {
                const countInSub = questions.filter(q => q.subject === sub).length;
                if (countInSub === 0) return null;

                const isCurrentSub = currentQ.subject === sub;

                return (
                  <button
                    key={sub}
                    onClick={() => {
                      const firstInSub = questions.findIndex(q => q.subject === sub);
                      if (firstInSub !== -1) setCurrentIndex(firstInSub);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition border ${
                      isCurrentSub
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sub} ({countInSub})
                  </button>
                );
              })}
            </div>

            {/* Question Details Bar */}
            <div className="flex items-center justify-between text-xs text-slate-400 mb-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-2 font-semibold">
                <span className="text-indigo-400">Question {currentIndex + 1} of {questions.length}</span>
                <span>•</span>
                <span className="capitalize">{currentQ.subject}</span>
                <span>•</span>
                <span className="text-slate-300">{currentQ.chapterName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-mono font-bold">+4.00</span>
                <span className="text-rose-400 font-mono font-bold">-1.00</span>
              </div>
            </div>

            {/* Question Statement */}
            <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 mb-6 flex-1">
              <MathRenderer content={currentQ.questionText} className="text-base md:text-lg mb-6" />

              {/* Options selection for Single Choice */}
              {currentQ.questionType === 'single_choice' && currentQ.options && (
                <div className="space-y-3">
                  {currentQ.options.map(opt => (
                    <label
                      key={opt.id}
                      onClick={() => setDraftOption(opt.id)}
                      className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition ${
                        draftOption === opt.id
                          ? 'bg-indigo-950/50 border-indigo-500 text-white ring-1 ring-indigo-500/40'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cbt-single"
                        checked={draftOption === opt.id}
                        onChange={() => setDraftOption(opt.id)}
                        className="mt-1"
                      />
                      <span className="font-bold text-xs w-6 shrink-0">({opt.id})</span>
                      <div className="flex-1 overflow-x-auto"><MathRenderer content={opt.text} /></div>
                    </label>
                  ))}
                </div>
              )}

              {/* Options selection for Multi Correct */}
              {currentQ.questionType === 'multi_correct' && currentQ.options && (
                <div className="space-y-3">
                  <p className="text-xs text-indigo-400 font-medium mb-1">
                    Multiple correct choices. Select all that apply:
                  </p>
                  {currentQ.options.map(opt => {
                    const isChecked = draftMulti.includes(opt.id);
                    const toggleCheck = () => {
                      setDraftMulti(prev => isChecked ? prev.filter(x => x !== opt.id) : [...prev, opt.id]);
                    };

                    return (
                      <label
                        key={opt.id}
                        onClick={toggleCheck}
                        className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition ${
                          isChecked
                            ? 'bg-indigo-950/50 border-indigo-500 text-white ring-1 ring-indigo-500/40'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={toggleCheck}
                          className="mt-1"
                        />
                        <span className="font-bold text-xs w-6 shrink-0">({opt.id})</span>
                        <div className="flex-1 overflow-x-auto"><MathRenderer content={opt.text} /></div>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Numerical Input Area */}
              {currentQ.questionType === 'numerical' && (
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 max-w-sm space-y-3">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Enter numerical answer:
                  </label>
                  <input
                    type="text"
                    value={draftNumerical}
                    onChange={(e) => setDraftNumerical(e.target.value)}
                    placeholder="Enter value"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 font-mono text-base text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Bottom Actions Bar matching NTA CBT */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveAndNext}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition active:scale-95 flex items-center gap-1.5"
                >
                  <span>Save & Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleClearResponse}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs px-3.5 py-2.5 rounded-xl transition"
                >
                  Clear Response
                </button>

                <button
                  onClick={handleMarkForReviewAndNext}
                  className="bg-purple-700 hover:bg-purple-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition active:scale-95 flex items-center gap-1.5"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Mark for Review & Next</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(currentIndex - 1)}
                  className="bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1 transition"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </main>

          {/* Right: Question Palette Sidebar */}
          <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/60 p-4 shrink-0 overflow-y-auto">
            <TestPalette
              items={paletteItems}
              currentIndex={currentIndex}
              onSelectIndex={(idx) => setCurrentIndex(idx)}
              activeSubject={paletteSubject}
              onFilterSubject={(sub) => setPaletteSubject(sub)}
            />
          </aside>
        </div>
      ) : (
        /* Test Completed - Comprehensive Analysis Report */
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header Score Card */}
            <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 p-6 md:p-8 rounded-3xl border border-indigo-500/30 shadow-2xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Mock Test Submitted Successfully!</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-white">
                    {completedSession?.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Submitted on {new Date().toLocaleDateString()} • JEE Pattern Marking Scheme
                  </p>
                </div>

                <div className="text-center md:text-right">
                  <div className="text-3xl md:text-5xl font-black text-indigo-400 font-mono">
                    {completedSession?.score} <span className="text-xl text-slate-500 font-normal">/ {completedSession?.maxScore}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Total Score Awarded</p>
                </div>
              </div>

              {/* Quick stats pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
                  <p className="text-xl font-bold text-white">{completedSession?.accuracy}%</p>
                  <p className="text-[11px] text-slate-400">Accuracy</p>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
                  <p className="text-xl font-bold text-emerald-400">
                    {Object.values(completedSession?.responses || {}).filter(r => r.isCorrect).length}
                  </p>
                  <p className="text-[11px] text-slate-400">Correct</p>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
                  <p className="text-xl font-bold text-rose-400">
                    {Object.values(completedSession?.responses || {}).filter(r => r.userAnswer && !r.isCorrect).length}
                  </p>
                  <p className="text-[11px] text-slate-400">Incorrect</p>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
                  <p className="text-xl font-bold text-slate-300">
                    {Object.values(completedSession?.responses || {}).filter(r => !r.userAnswer).length}
                  </p>
                  <p className="text-[11px] text-slate-400">Unattempted</p>
                </div>
              </div>
            </div>

            {/* Subject Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['physics', 'chemistry', 'mathematics'] as Subject[]).map(sub => {
                const subStat = completedSession?.subjectSummary?.[sub];
                if (!subStat || subStat.total === 0) return null;

                return (
                  <div key={sub} className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <h3 className="text-sm font-bold capitalize text-white flex items-center justify-between">
                      <span>{sub}</span>
                      <span className="font-mono text-indigo-400">{subStat.score} pts</span>
                    </h3>
                    <div className="space-y-1 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Attempted:</span>
                        <span className="text-white font-mono">{subStat.attempted} / {subStat.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Correct:</span>
                        <span className="text-emerald-400 font-mono">{subStat.correct}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed Question by Question Solution Review */}
            <div className="space-y-4 pt-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                Detailed Question-by-Question Solution Review
              </h3>

              {questions.map((q, idx) => {
                const resp = completedSession?.responses[q.id];
                const wasAnswered = Boolean(resp?.userAnswer);
                const isCorrect = resp?.isCorrect;

                return (
                  <div key={q.id} className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
                      <span className="font-bold text-indigo-400">Question {idx + 1}</span>
                      <div className="flex items-center gap-2">
                        {wasAnswered ? (
                          isCorrect ? (
                            <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+4)
                            </span>
                          ) : (
                            <span className="text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40 font-semibold flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Incorrect (-1)
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded">
                            Unattempted (0)
                          </span>
                        )}
                      </div>
                    </div>

                    <MathRenderer content={q.questionText} />

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-slate-400">Your Answer: </span>
                        <span className="font-mono font-bold text-white">
                          {resp?.userAnswer ? JSON.stringify(resp.userAnswer) : 'None'}
                        </span>
                      </div>
                      <div>
                        <span className="text-emerald-400">Correct Answer: </span>
                        <span className="font-mono font-bold text-white">
                          {JSON.stringify(q.correctAnswer)}
                        </span>
                      </div>
                    </div>

                    {/* Step-by-step Solution */}
                    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/60 space-y-3">
                      <h4 className="text-xs font-semibold text-indigo-300">Solution:</h4>
                      {q.solution.steps.map((st, sIdx) => (
                        <div key={sIdx} className="space-y-1">
                          <p className="text-xs font-medium text-slate-300">{st.title}</p>
                          <MathRenderer content={st.content} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal before Final Submit */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 text-slate-200">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              Submit JEE CBT Mock Test?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to finish the exam? You will receive an immediate score breakdown, accuracy report, and step-by-step solutions.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div>Total Questions: <span className="font-mono font-bold text-white">{questions.length}</span></div>
              <div>Answered: <span className="font-mono font-bold text-emerald-400">{Object.values(examAnswers).filter(a => a.userAnswer).length}</span></div>
              <div>Time Left: <span className="font-mono font-bold text-amber-400">{formatTime(timeLeft)}</span></div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Continue Exam
              </button>
              <button
                onClick={finalizeSubmission}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-md shadow-emerald-950"
              >
                Confirm Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
