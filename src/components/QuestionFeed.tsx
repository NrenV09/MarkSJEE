/**
 * QuestionFeed.tsx
 * High performance question feed with pagination (20 per page) so rendering
 * hundreds or thousands of questions doesn't lag the DOM.
 * Features instant practice mode, "Show Solution" accordion, KaTeX MathView, and attempt grading.
 */

import React, { useState } from 'react';
import { QuestionRecord, UserActivityRecord } from '../db/db';
import { MathView } from './MathView';
import { 
  Bookmark, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Clock, 
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface QuestionFeedProps {
  questions: Array<QuestionRecord & { activity?: UserActivityRecord }>;
  page: number;
  totalPages: number;
  totalMatching: number;
  onPageChange: (newPage: number) => void;
  onAnswerSubmit: (questionId: string, answer: any, isCorrect: boolean, timeSpent: number) => void;
  onToggleBookmark: (questionId: string) => void;
}

export const QuestionFeed: React.FC<QuestionFeedProps> = ({
  questions,
  page,
  totalPages,
  totalMatching,
  onPageChange,
  onAnswerSubmit,
  onToggleBookmark
}) => {
  // Local state for expanded solutions per question ID
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});
  // Local state for draft selections
  const [draftAnswers, setDraftAnswers] = useState<Record<string, any>>({});

  const toggleSolution = (qId: string) => {
    setExpandedSolutions(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleSelectOption = (q: QuestionRecord & { activity?: UserActivityRecord }, optId: string) => {
    if (q.activity?.status === 'attempted') return;

    if (q.type === 'multi_correct') {
      const current = Array.isArray(draftAnswers[q.id]) ? draftAnswers[q.id] : [];
      const updated = current.includes(optId)
        ? current.filter((x: string) => x !== optId)
        : [...current, optId];
      setDraftAnswers({ ...draftAnswers, [q.id]: updated });
    } else {
      setDraftAnswers({ ...draftAnswers, [q.id]: optId });
    }
  };

  const handleCheckAnswer = (q: QuestionRecord & { activity?: UserActivityRecord }) => {
    const userAns = draftAnswers[q.id];
    if (!userAns) return;

    let isCorrect = false;
    if (q.type === 'single_choice') {
      isCorrect = String(userAns).trim().toUpperCase() === String(q.correctAnswer).trim().toUpperCase();
    } else if (q.type === 'multi_correct') {
      const correctArr = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer as string];
      const userArr = Array.isArray(userAns) ? userAns : [];
      isCorrect = userArr.length === correctArr.length && userArr.every(x => correctArr.includes(x));
    } else if (q.type === 'numerical') {
      const userNum = parseFloat(String(userAns).trim());
      const correctNum = parseFloat(String(q.correctAnswer).trim());
      isCorrect = Math.abs(userNum - correctNum) <= 0.1;
    }

    onAnswerSubmit(q.id, userAns, isCorrect, 45);
    setExpandedSolutions(prev => ({ ...prev, [q.id]: true }));
  };

  if (questions.length === 0) {
    return (
      <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-12 text-center space-y-4">
        <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-base font-bold text-white">No Questions Found</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          No questions match your current subject, chapter, or year filters. Try adjusting your filters or use the Sync Engine to cache more questions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info & Pagination Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 px-5 py-3 rounded-2xl border border-slate-800">
        <span className="text-xs font-semibold text-slate-300">
          Showing <span className="text-indigo-400 font-mono font-bold">{questions.length}</span> of <span className="font-mono text-white font-bold">{totalMatching.toLocaleString()}</span> questions
        </span>

        {/* Pagination buttons */}
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-30 hover:bg-slate-700 text-slate-300 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-200 px-2">
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-30 hover:bg-slate-700 text-slate-300 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-5">
        {questions.map((q, idx) => {
          const isAttempted = q.activity?.status === 'attempted';
          const isCorrect = q.activity?.isCorrect;
          const isBookmarked = q.activity?.isBookmarked;
          const isExpanded = expandedSolutions[q.id];
          const selectedAnswer = draftAnswers[q.id] !== undefined ? draftAnswers[q.id] : q.activity?.selectedOption;

          return (
            <article
              key={q.id}
              className="bg-slate-900/90 rounded-2xl border border-slate-800/90 p-5 md:p-6 shadow-xl space-y-5 hover:border-slate-700/80 transition"
            >
              {/* Question Metadata Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-900/60 px-2.5 py-0.5 rounded-lg">
                    #{(page - 1) * 20 + idx + 1}
                  </span>

                  {/* Exam badge */}
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${
                    q.examType === 'JEE Advanced'
                      ? 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                      : 'bg-blue-950/40 text-blue-300 border-blue-800/40'
                  }`}>
                    {q.examType}
                  </span>

                  {/* Year & Session */}
                  <span className="text-xs font-medium text-slate-300 bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-slate-700/60">
                    {q.year} {q.session ? `• ${q.session}` : ''}
                  </span>

                  {/* Chapter */}
                  <span className="text-xs text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                    {q.chapter}
                  </span>

                  {/* Difficulty */}
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    q.difficulty === 'Easy' ? 'text-emerald-400 bg-emerald-950/30' :
                    q.difficulty === 'Medium' ? 'text-amber-400 bg-amber-950/30' :
                    'text-rose-400 bg-rose-950/30'
                  }`}>
                    {q.difficulty}
                  </span>
                </div>

                {/* Bookmark button */}
                <button
                  onClick={() => onToggleBookmark(q.id)}
                  title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Question'}
                  className={`p-1.5 rounded-lg border transition ${
                    isBookmarked
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                      : 'bg-slate-800/50 text-slate-400 hover:text-white border-slate-700/60'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400' : ''}`} />
                </button>
              </div>

              {/* Question Text with KaTeX */}
              <div className="text-sm md:text-base leading-relaxed">
                <MathView content={q.questionText} />
              </div>

              {/* Options selection */}
              {q.options && q.options.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  {q.options.map((opt) => {
                    const isSelected = q.type === 'multi_correct'
                      ? (Array.isArray(selectedAnswer) && selectedAnswer.includes(opt.id))
                      : selectedAnswer === opt.id;

                    const isTargetCorrect = q.type === 'multi_correct'
                      ? (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt.id))
                      : opt.id === q.correctAnswer;

                    let optClass = "border-slate-800 bg-slate-950/50 text-slate-200 hover:border-slate-700";

                    if (isAttempted) {
                      if (isTargetCorrect) {
                        optClass = "border-emerald-500/80 bg-emerald-950/30 text-emerald-200";
                      } else if (isSelected && !isTargetCorrect) {
                        optClass = "border-rose-500/80 bg-rose-950/30 text-rose-200";
                      }
                    } else if (isSelected) {
                      optClass = "border-indigo-500 bg-indigo-950/50 text-indigo-100 ring-1 ring-indigo-500/50";
                    }

                    return (
                      <button
                        key={opt.id}
                        disabled={isAttempted}
                        onClick={() => handleSelectOption(q, opt.id)}
                        className={`w-full text-left p-3.5 rounded-xl border flex items-start gap-3 transition ${optClass}`}
                      >
                        <span className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold border transition ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-400 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}>
                          {opt.id}
                        </span>
                        <div className="flex-1 overflow-x-auto pt-0.5">
                          <MathView content={opt.text} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Numerical Input Type */}
              {q.type === 'numerical' && (
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 max-w-sm space-y-2">
                  <label className="text-xs text-slate-400 font-medium">Numerical Answer:</label>
                  <input
                    type="text"
                    disabled={isAttempted}
                    placeholder="Enter value"
                    value={selectedAnswer || ''}
                    onChange={(e) => setDraftAnswers({ ...draftAnswers, [q.id]: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Action Toolbar */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {!isAttempted ? (
                    <button
                      onClick={() => handleCheckAnswer(q)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-950 transition active:scale-95 flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Check Answer</span>
                    </button>
                  ) : (
                    <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                      isCorrect
                        ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300'
                        : 'bg-rose-950/60 border border-rose-800/60 text-rose-300'
                    }`}>
                      {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{isCorrect ? 'Correct (+4)' : 'Incorrect (-1)'}</span>
                    </div>
                  )}
                </div>

                {/* Instant "Show Solution" Toggle */}
                {q.solution && (
                  <button
                    onClick={() => toggleSolution(q.id)}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold bg-slate-950 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-800 transition"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{isExpanded ? 'Hide Solution' : 'Show Solution'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {/* Solution Accordion */}
              {isExpanded && q.solution && (
                <div className="pt-4 border-t border-slate-800 space-y-4 animate-in fade-in duration-200">
                  <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                      <span className="font-bold text-white">Step-by-Step LaTeX Solution</span>
                      <span className="font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-800/40">
                        Answer: {String(q.solution.finalAnswer)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {q.solution.steps.map((st, sIdx) => (
                        <div key={sIdx} className="space-y-1">
                          <p className="text-xs font-semibold text-indigo-300">{st.title}</p>
                          <MathView content={st.content} />
                        </div>
                      ))}
                    </div>

                    {q.solution.shortcutMethod && (
                      <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs">
                        <span className="font-bold text-amber-300 block mb-1">Marks Shortcut Method:</span>
                        <MathView content={q.solution.shortcutMethod} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Bottom Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 disabled:opacity-40"
          >
            Previous Page
          </button>
          <span className="text-xs font-mono text-slate-400 px-3">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 disabled:opacity-40"
          >
            Next Page
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionFeed;
