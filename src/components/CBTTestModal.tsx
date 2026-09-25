/**
 * CBTTestModal.tsx
 * Authentic Computer Based Test (CBT) simulator modeled after Marks by MathonGo
 * Question palette grid (Green, Red, Purple status), countdown timer,
 * and automatic score calculation (+4/-1 for JEE Main, variable marking for Advanced).
 */

import React, { useState, useEffect } from 'react';
import { QuestionRecord, db } from '../db/db';
import { MathView } from './MathView';
import { 
  Clock, 
  Flag, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ChevronLeft, 
  Trophy, 
  X, 
  AlertCircle 
} from 'lucide-react';

interface CBTTestModalProps {
  questions: QuestionRecord[];
  durationMinutes?: number;
  testTitle?: string;
  onClose: () => void;
  onCompleted?: () => void;
}

type PaletteStatus = 'not_visited' | 'unattempted' | 'attempted' | 'marked_for_review' | 'marked_and_attempted';

export const CBTTestModal: React.FC<CBTTestModalProps> = ({
  questions,
  durationMinutes = 60,
  testTitle = 'JEE CBT Mock Examination (2002-2026 PYQs)',
  onClose,
  onCompleted
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Status and responses
  const [paletteStates, setPaletteStates] = useState<Record<string, PaletteStatus>>(() => {
    const init: Record<string, PaletteStatus> = {};
    questions.forEach((q, i) => {
      init[q.id] = i === 0 ? 'unattempted' : 'not_visited';
    });
    return init;
  });

  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [draftOption, setDraftOption] = useState<string>('');

  const currentQ = questions[currentIndex];

  // Sync draft answer when question changes
  useEffect(() => {
    if (!currentQ) return;
    setDraftOption(userAnswers[currentQ.id] || '');
    setPaletteStates(prev => {
      if (prev[currentQ.id] === 'not_visited') {
        return { ...prev, [currentQ.id]: 'unattempted' };
      }
      return prev;
    });
  }, [currentIndex, currentQ?.id]);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSaveAndNext = () => {
    const hasAns = Boolean(draftOption);
    setUserAnswers(prev => ({ ...prev, [currentQ.id]: draftOption }));
    setPaletteStates(prev => ({
      ...prev,
      [currentQ.id]: hasAns ? 'attempted' : 'unattempted'
    }));

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleMarkForReview = () => {
    const hasAns = Boolean(draftOption);
    setUserAnswers(prev => ({ ...prev, [currentQ.id]: draftOption }));
    setPaletteStates(prev => ({
      ...prev,
      [currentQ.id]: hasAns ? 'marked_and_attempted' : 'marked_for_review'
    }));

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleClear = () => {
    setDraftOption('');
    setUserAnswers(prev => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
    setPaletteStates(prev => ({ ...prev, [currentQ.id]: 'unattempted' }));
  };

  // Evaluate marks (+4 / -1 for Main, variable for Advanced)
  const calculateResult = () => {
    let totalScore = 0;
    let correct = 0;
    let attempted = 0;
    const maxScore = questions.length * 4;

    questions.forEach(q => {
      const userAns = userAnswers[q.id];
      if (userAns) {
        attempted++;
        const isRight = String(userAns).trim().toUpperCase() === String(q.correctAnswer).trim().toUpperCase();
        if (isRight) {
          correct++;
          totalScore += 4;
        } else {
          // Negative marking: -1 for Main, -2 for Advanced multi-correct
          const deduction = q.examType === 'JEE Advanced' && q.type === 'multi_correct' ? -2 : -1;
          totalScore += deduction;
        }
      }
    });

    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    return { totalScore, maxScore, correct, attempted, accuracy };
  };

  const handleSubmit = async () => {
    const res = calculateResult();
    const testId = `cbt-${Date.now()}`;

    await db.testSessions.put({
      testId,
      title: testTitle,
      score: res.totalScore,
      maxScore: res.maxScore,
      totalQuestions: questions.length,
      attemptedCount: res.attempted,
      correctCount: res.correct,
      accuracy: res.accuracy,
      durationMinutes,
      timeTakenSeconds: durationMinutes * 60 - timeLeft,
      subjectBreakdown: {
        all: { total: questions.length, attempted: res.attempted, score: res.totalScore }
      },
      timestamp: new Date().toISOString()
    });

    setIsSubmitted(true);
    setShowConfirm(false);
    onCompleted?.();
  };

  const result = isSubmitted ? calculateResult() : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden text-slate-100 select-none">
      {/* Top CBT Navigation Bar */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">
            M
          </div>
          <div>
            <h1 className="text-sm font-bold text-white truncate max-w-sm">{testTitle}</h1>
            <p className="text-[10px] text-slate-400">NTA Computer Based Test Simulation</p>
          </div>
        </div>

        {/* Countdown Clock */}
        {!isSubmitted && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs font-bold text-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Time Left: {formatTime(timeLeft)}</span>
          </div>
        )}

        <div>
          {!isSubmitted ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-1.5 rounded-xl transition"
            >
              Submit Exam
            </button>
          ) : (
            <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Examination Workspace */}
      {!isSubmitted ? (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Active Question Canvas */}
          <main className="flex-1 flex flex-col p-6 overflow-y-auto bg-slate-950">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="font-bold text-white">Question {currentIndex + 1} of {questions.length}</span>
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-mono font-bold">+4.00</span>
                <span className="text-rose-400 font-mono font-bold">{currentQ.examType === 'JEE Advanced' ? '-2.00' : '-1.00'}</span>
              </div>
            </div>

            <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 flex-1 mb-6">
              <MathView content={currentQ.questionText} className="text-base mb-6" />

              {/* Options */}
              {currentQ.options && (
                <div className="space-y-3">
                  {currentQ.options.map(opt => (
                    <label
                      key={opt.id}
                      onClick={() => setDraftOption(opt.id)}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                        draftOption === opt.id
                          ? 'bg-indigo-950/60 border-indigo-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cbt-opt"
                        checked={draftOption === opt.id}
                        onChange={() => setDraftOption(opt.id)}
                        className="mt-1"
                      />
                      <span className="font-bold text-xs w-5">({opt.id})</span>
                      <div className="flex-1 overflow-x-auto"><MathView content={opt.text} /></div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions Toolbar */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveAndNext}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition"
                >
                  Save & Next
                </button>
                <button
                  onClick={handleClear}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs px-3 py-2 rounded-xl transition"
                >
                  Clear Response
                </button>
                <button
                  onClick={handleMarkForReview}
                  className="bg-purple-700 hover:bg-purple-600 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Mark for Review & Next</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(currentIndex - 1)}
                  className="bg-slate-800 disabled:opacity-30 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-xl"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="bg-slate-800 disabled:opacity-30 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-xl"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </main>

          {/* Right Question Palette (Green, Red, Purple) */}
          <aside className="w-full md:w-72 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/60 p-4 space-y-4 shrink-0 overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800">
              Question Palette ({questions.length})
            </h3>

            {/* Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const st = paletteStates[q.id];
                const isCur = idx === currentIndex;
                let bg = "bg-slate-800 text-slate-300 border-slate-700";

                if (st === 'attempted') bg = "bg-emerald-600 text-white border-emerald-400";
                else if (st === 'unattempted') bg = "bg-rose-600 text-white border-rose-400";
                else if (st === 'marked_for_review') bg = "bg-purple-600 text-white border-purple-400";
                else if (st === 'marked_and_attempted') bg = "bg-purple-600 text-white border-purple-400";

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-9 h-9 rounded-lg font-mono text-xs font-bold border transition ${bg} ${
                      isCur ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-800 space-y-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-rose-600" />
                <span>Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-purple-600" />
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700" />
                <span>Not Visited</span>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        /* Results Report */
        <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-3xl mx-auto space-y-6">
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 text-center space-y-4">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto" />
            <h2 className="text-2xl font-black text-white">Test Completed!</h2>
            <div className="text-4xl font-black text-indigo-400 font-mono">
              {result?.totalScore} <span className="text-lg text-slate-500 font-normal">/ {result?.maxScore}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800">
              <div className="p-3 bg-slate-950 rounded-xl">
                <p className="text-lg font-bold text-white">{result?.accuracy}%</p>
                <p className="text-[11px] text-slate-400">Accuracy</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl">
                <p className="text-lg font-bold text-emerald-400">{result?.correct}</p>
                <p className="text-[11px] text-slate-400">Correct</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl">
                <p className="text-lg font-bold text-slate-300">{result?.attempted}</p>
                <p className="text-[11px] text-slate-400">Attempted</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
            >
              Return to Practice Mode
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 text-center">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Submit Test?</h3>
            <p className="text-xs text-slate-400">
              You still have {formatTime(timeLeft)} remaining. Are you sure you want to finish and compute marks?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Continue
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CBTTestModal;
