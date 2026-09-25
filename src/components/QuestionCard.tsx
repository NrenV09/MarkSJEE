/**
 * QuestionCard Component
 * Responsive Marks-styled card supporting Single Choice, Multi-Correct, Numerical, and Matrix Match
 * with instant feedback, score calculation (+4/-1), solution breakdown, and personal notes.
 */

import React, { useState, useEffect } from 'react';
import { 
  Question, 
  UserProgress, 
  Option, 
  MatrixMatchData 
} from '../types/question';
import { MathRenderer } from './MathRenderer';
import { 
  Bookmark, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Lightbulb, 
  AlertTriangle, 
  BookOpen, 
  Save, 
  RotateCcw,
  Zap,
  Clock
} from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  progress?: UserProgress;
  onAnswerSubmit: (answer: string | string[] | Record<string, string[]>, isCorrect: boolean, timeSpent: number) => void;
  onClearAnswer: () => void;
  onToggleBookmark: () => void;
  onSaveNote: (note: string) => void;
  mode?: 'practice' | 'cbt';
  questionNumber?: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  progress,
  onAnswerSubmit,
  onClearAnswer,
  onToggleBookmark,
  onSaveNote,
  mode = 'practice',
  questionNumber
}) => {
  // Local state for interactive answering
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [selectedMulti, setSelectedMulti] = useState<string[]>([]);
  const [numericalInput, setNumericalInput] = useState<string>('');
  const [matrixMatches, setMatrixMatches] = useState<Record<string, string[]>>({});
  
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>(progress?.notes || '');
  const [isNotesSaved, setIsNotesSaved] = useState<boolean>(false);
  
  // Per-question timer
  const [secondsSpent, setSecondsSpent] = useState<number>(0);

  // Sync state when question changes or progress changes
  useEffect(() => {
    setShowSolution(false);
    setNotes(progress?.notes || '');
    setSecondsSpent(0);

    if (progress?.userAnswer) {
      if (question.questionType === 'single_choice') {
        setSelectedOption(progress.userAnswer as string);
      } else if (question.questionType === 'multi_correct') {
        setSelectedMulti(Array.isArray(progress.userAnswer) ? progress.userAnswer : []);
      } else if (question.questionType === 'numerical') {
        setNumericalInput(progress.userAnswer as string);
      } else if (question.questionType === 'matrix_match') {
        setMatrixMatches(progress.userAnswer as Record<string, string[]>);
      }
    } else {
      setSelectedOption('');
      setSelectedMulti([]);
      setNumericalInput('');
      setMatrixMatches({});
    }
  }, [question.id, progress]);

  // Timer effect in practice mode
  useEffect(() => {
    if (progress?.status === 'attempted') return;
    const interval = setInterval(() => {
      setSecondsSpent(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [question.id, progress?.status]);

  const isAttempted = progress?.status === 'attempted' || progress?.status === 'marked_and_attempted';
  const isCorrect = progress?.isCorrect ?? false;

  // Grade user's answer
  const evaluateAnswer = (): boolean => {
    if (question.questionType === 'single_choice') {
      return selectedOption.trim().toUpperCase() === (question.correctAnswer as string).trim().toUpperCase();
    } 
    
    if (question.questionType === 'multi_correct') {
      const correctArr = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer as string];
      if (selectedMulti.length !== correctArr.length) return false;
      const sortedSelected = [...selectedMulti].sort();
      const sortedCorrect = [...correctArr].sort();
      return sortedSelected.every((val, index) => val === sortedCorrect[index]);
    }

    if (question.questionType === 'numerical') {
      const parsedUser = parseFloat(numericalInput.trim());
      if (isNaN(parsedUser)) return false;

      // Check range or exact or tolerance
      if (question.numericalRange) {
        return parsedUser >= question.numericalRange[0] && parsedUser <= question.numericalRange[1];
      }
      const parsedCorrect = parseFloat(question.correctAnswer as string);
      const tolerance = question.numericalTolerance ?? 0.05;
      return Math.abs(parsedUser - parsedCorrect) <= tolerance;
    }

    if (question.questionType === 'matrix_match') {
      const correctMap = question.correctAnswer as Record<string, string[]>;
      const keys = Object.keys(correctMap);
      for (const k of keys) {
        const userMatched = matrixMatches[k] || [];
        const correctMatched = correctMap[k] || [];
        if (userMatched.length !== correctMatched.length) return false;
        const sortedU = [...userMatched].sort();
        const sortedC = [...correctMatched].sort();
        if (!sortedU.every((val, i) => val === sortedC[i])) return false;
      }
      return true;
    }

    return false;
  };

  const handleSubmit = () => {
    let answerPayload: string | string[] | Record<string, string[]> = '';

    if (question.questionType === 'single_choice') {
      if (!selectedOption) return;
      answerPayload = selectedOption;
    } else if (question.questionType === 'multi_correct') {
      if (selectedMulti.length === 0) return;
      answerPayload = selectedMulti;
    } else if (question.questionType === 'numerical') {
      if (!numericalInput.trim()) return;
      answerPayload = numericalInput.trim();
    } else if (question.questionType === 'matrix_match') {
      if (Object.keys(matrixMatches).length === 0) return;
      answerPayload = matrixMatches;
    }

    const correct = evaluateAnswer();
    onAnswerSubmit(answerPayload, correct, secondsSpent);
    if (mode === 'practice') {
      setShowSolution(true);
    }
  };

  const handleClear = () => {
    setSelectedOption('');
    setSelectedMulti([]);
    setNumericalInput('');
    setMatrixMatches({});
    setShowSolution(false);
    onClearAnswer();
  };

  const handleSaveNoteClick = () => {
    onSaveNote(notes);
    setIsNotesSaved(true);
    setTimeout(() => setIsNotesSaved(false), 2000);
  };

  const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden transition-all duration-200">
      {/* Question Header Bar */}
      <div className="px-5 py-4 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {questionNumber !== undefined && (
            <span className="font-bold text-sm text-indigo-400 bg-indigo-950/60 border border-indigo-800/50 px-2.5 py-1 rounded-lg">
              Q{questionNumber}
            </span>
          )}

          {/* Exam Badge */}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
            question.examType === 'JEE Advanced' 
              ? 'bg-amber-950/40 text-amber-300 border-amber-800/40' 
              : 'bg-blue-950/40 text-blue-300 border-blue-800/40'
          }`}>
            {question.examType}
          </span>

          {/* Year & Session Badge */}
          <span className="text-xs font-medium text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
            {question.year} • {question.session}
          </span>

          {/* Question Type */}
          <span className="text-xs text-slate-400 bg-slate-800/40 px-2 py-0.5 rounded border border-slate-800">
            {question.questionType === 'single_choice' && 'Single Choice (+4, -1)'}
            {question.questionType === 'multi_correct' && 'Multiple Correct (+4, -2)'}
            {question.questionType === 'numerical' && 'Numerical Value (+4, 0)'}
            {question.questionType === 'matrix_match' && 'Matrix Match (+3, -1)'}
          </span>

          {/* Difficulty Badge */}
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
            question.difficulty === 'Easy' ? 'text-emerald-400 bg-emerald-950/30' :
            question.difficulty === 'Medium' ? 'text-amber-400 bg-amber-950/30' :
            'text-rose-400 bg-rose-950/30'
          }`}>
            {question.difficulty}
          </span>
        </div>

        {/* Right side controls: Timer & Bookmark */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{formatTimer(secondsSpent || progress?.timeSpentSeconds || 0)}</span>
          </div>

          <button
            onClick={onToggleBookmark}
            title={progress?.isBookmarked ? 'Remove Bookmark' : 'Bookmark Question'}
            className={`p-2 rounded-lg transition active:scale-90 border ${
              progress?.isBookmarked 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border-slate-700/60 hover:bg-slate-800'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${progress?.isBookmarked ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Question Body */}
      <div className="p-6">
        <div className="text-base md:text-lg mb-6 leading-relaxed">
          <MathRenderer content={question.questionText} />
        </div>

        {/* Option Selection Area */}
        <div className="mt-4">
          {/* 1. SINGLE CHOICE */}
          {question.questionType === 'single_choice' && question.options && (
            <div className="space-y-3">
              {question.options.map((opt: Option) => {
                const isSelected = selectedOption === opt.id;
                const isCorrectOption = opt.id === (question.correctAnswer as string);
                
                let optionStyle = "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-200";
                
                if (isAttempted && mode === 'practice') {
                  if (isCorrectOption) {
                    optionStyle = "border-emerald-500/80 bg-emerald-950/30 text-emerald-200 shadow-sm shadow-emerald-950";
                  } else if (isSelected && !isCorrectOption) {
                    optionStyle = "border-rose-500/80 bg-rose-950/30 text-rose-200 shadow-sm shadow-rose-950";
                  }
                } else if (isSelected) {
                  optionStyle = "border-indigo-500 bg-indigo-950/40 text-indigo-100 ring-1 ring-indigo-500/50";
                }

                return (
                  <button
                    key={opt.id}
                    disabled={isAttempted && mode === 'practice'}
                    onClick={() => setSelectedOption(opt.id)}
                    className={`w-full text-left p-4 rounded-xl border flex items-start gap-3.5 transition group ${optionStyle}`}
                  >
                    <span className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold border transition ${
                      isSelected 
                        ? 'bg-indigo-600 border-indigo-400 text-white' 
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 group-hover:border-slate-600'
                    }`}>
                      {opt.id}
                    </span>
                    <div className="pt-0.5 flex-1 overflow-x-auto">
                      <MathRenderer content={opt.text} />
                    </div>
                    {isAttempted && mode === 'practice' && isCorrectOption && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    {isAttempted && mode === 'practice' && isSelected && !isCorrectOption && (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. MULTI CORRECT */}
          {question.questionType === 'multi_correct' && question.options && (
            <div className="space-y-3">
              <div className="text-xs text-indigo-400 mb-2 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>One or more options may be correct. Partial marks awarded according to JEE Advanced scheme.</span>
              </div>
              {question.options.map((opt: Option) => {
                const isSelected = selectedMulti.includes(opt.id);
                const correctList = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer as string];
                const isCorrectOption = correctList.includes(opt.id);

                let optionStyle = "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-200";

                if (isAttempted && mode === 'practice') {
                  if (isCorrectOption) {
                    optionStyle = "border-emerald-500/80 bg-emerald-950/30 text-emerald-200";
                  } else if (isSelected && !isCorrectOption) {
                    optionStyle = "border-rose-500/80 bg-rose-950/30 text-rose-200";
                  }
                } else if (isSelected) {
                  optionStyle = "border-indigo-500 bg-indigo-950/40 text-indigo-100 ring-1 ring-indigo-500/50";
                }

                const toggleOption = () => {
                  if (isAttempted && mode === 'practice') return;
                  if (selectedMulti.includes(opt.id)) {
                    setSelectedMulti(selectedMulti.filter(item => item !== opt.id));
                  } else {
                    setSelectedMulti([...selectedMulti, opt.id]);
                  }
                };

                return (
                  <button
                    key={opt.id}
                    onClick={toggleOption}
                    className={`w-full text-left p-4 rounded-xl border flex items-start gap-3.5 transition group ${optionStyle}`}
                  >
                    <span className={`w-7 h-7 shrink-0 rounded-md flex items-center justify-center text-xs font-bold border transition ${
                      isSelected 
                        ? 'bg-indigo-600 border-indigo-400 text-white' 
                        : 'bg-slate-800/80 border-slate-700 text-slate-300'
                    }`}>
                      {opt.id}
                    </span>
                    <div className="pt-0.5 flex-1 overflow-x-auto">
                      <MathRenderer content={opt.text} />
                    </div>
                    {isAttempted && mode === 'practice' && isCorrectOption && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* 3. NUMERICAL VALUE TYPE */}
          {question.questionType === 'numerical' && (
            <div className="bg-slate-950/60 border border-slate-800/80 p-5 rounded-2xl max-w-lg space-y-4">
              <label className="block text-xs font-medium text-slate-300">
                Enter your numerical answer:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="e.g. 55.30 or 3"
                  value={numericalInput}
                  disabled={isAttempted && mode === 'practice'}
                  onChange={(e) => setNumericalInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-mono text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Quick on-screen numpad for CBT realism */}
              {(!isAttempted || mode === 'cbt') && (
                <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-800/60">
                  {['1', '2', '3', 'Backspace', '4', '5', '6', 'Clear', '7', '8', '9', '-', '0', '.', '00', '+/-'].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        if (key === 'Backspace') {
                          setNumericalInput(prev => prev.slice(0, -1));
                        } else if (key === 'Clear') {
                          setNumericalInput('');
                        } else if (key === '+/-') {
                          setNumericalInput(prev => prev.startsWith('-') ? prev.slice(1) : '-' + prev);
                        } else {
                          setNumericalInput(prev => prev + key);
                        }
                      }}
                      className="py-1.5 text-xs font-mono font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-200 active:scale-95 transition"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              )}

              {isAttempted && mode === 'practice' && (
                <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  isCorrect 
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' 
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                }`}>
                  <div className="flex items-center gap-2">
                    {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                    <span>{isCorrect ? 'Correct Numerical Value!' : 'Incorrect Numerical Value'}</span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    Correct: {String(question.correctAnswer)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 4. MATRIX MATCH */}
          {question.questionType === 'matrix_match' && question.matrixMatchData && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column I */}
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Column I
                  </h4>
                  <div className="space-y-3">
                    {question.matrixMatchData.rows.map((row) => (
                      <div key={row.key} className="flex items-start gap-2.5 text-sm">
                        <span className="font-bold text-indigo-400 shrink-0 w-6">({row.key})</span>
                        <div className="flex-1"><MathRenderer content={row.text} /></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column II */}
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Column II
                  </h4>
                  <div className="space-y-3">
                    {question.matrixMatchData.cols.map((col) => (
                      <div key={col.key} className="flex items-start gap-2.5 text-sm">
                        <span className="font-bold text-emerald-400 shrink-0 w-6">({col.key})</span>
                        <div className="flex-1"><MathRenderer content={col.text} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Match Matrix Selector Grid */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 overflow-x-auto">
                <h4 className="text-xs font-semibold text-slate-300 mb-3">
                  Match Responses:
                </h4>
                <div className="min-w-[320px] space-y-2">
                  {question.matrixMatchData.rows.map((row) => (
                    <div key={row.key} className="flex items-center gap-3 py-1 border-b border-slate-800/40">
                      <span className="w-8 font-bold text-sm text-indigo-300">({row.key})</span>
                      <div className="flex items-center gap-3">
                        {question.matrixMatchData?.cols.map((col) => {
                          const isMatched = (matrixMatches[row.key] || []).includes(col.key);
                          const toggleMatch = () => {
                            if (isAttempted && mode === 'practice') return;
                            const current = matrixMatches[row.key] || [];
                            const updated = current.includes(col.key)
                              ? current.filter(k => k !== col.key)
                              : [...current, col.key];
                            setMatrixMatches({ ...matrixMatches, [row.key]: updated });
                          };

                          return (
                            <button
                              key={col.key}
                              type="button"
                              onClick={toggleMatch}
                              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium border transition ${
                                isMatched 
                                  ? 'bg-indigo-600 border-indigo-400 text-white' 
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                              }`}
                            >
                              {col.key}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!isAttempted ? (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-indigo-950 transition active:scale-95"
              >
                <Zap className="w-4 h-4" />
                <span>Check Answer</span>
              </button>
            ) : (
              <button
                onClick={handleClear}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl font-medium text-xs border border-slate-700 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-attempt</span>
              </button>
            )}

            {isAttempted && (
              <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                isCorrect 
                  ? 'bg-emerald-950/60 border border-emerald-800/50 text-emerald-300' 
                  : 'bg-rose-950/60 border border-rose-800/50 text-rose-300'
              }`}>
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Correct (+4 Marks)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Incorrect (-1 Mark)</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {mode === 'practice' && (
              <button
                onClick={() => setShowSolution(!showSolution)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                  showSolution 
                    ? 'bg-slate-800 border-slate-700 text-white' 
                    : 'bg-slate-900 border-slate-800 text-indigo-400 hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{showSolution ? 'Hide Solution' : 'View Solution'}</span>
                {showSolution ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Solution Drawer / Accordion */}
        {showSolution && question.solution && (
          <div className="mt-6 pt-6 border-t border-slate-800/80 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="bg-slate-950/70 rounded-2xl border border-slate-800 p-5 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  Step-by-Step Mathematical Solution
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/40">
                  Correct Answer: {String(question.solution.finalAnswer)}
                </span>
              </div>

              {/* Step-by-step breakdown */}
              <div className="space-y-4">
                {question.solution.steps.map((step, idx) => (
                  <div key={idx} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/60">
                    <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
                      {step.title}
                    </h4>
                    <MathRenderer content={step.content} />
                  </div>
                ))}
              </div>

              {/* Alternative Shortcut / Trick */}
              {question.solution.shortcutMethod && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/30 to-indigo-950/30 border border-amber-800/40">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    MathonGo / Marks Alternative Shortcut Method
                  </h4>
                  <MathRenderer content={question.solution.shortcutMethod} />
                </div>
              )}

              {/* Key Concepts Tested */}
              {question.solution.keyConcepts && question.solution.keyConcepts.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Key Concepts & Formulas Tested
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {question.solution.keyConcepts.map((concept, idx) => (
                      <div 
                        key={idx} 
                        className="text-xs bg-slate-900 text-slate-300 px-3 py-1 rounded-lg border border-slate-800"
                      >
                        <MathRenderer content={concept} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Notes Section */}
              <div className="pt-4 border-t border-slate-800/60">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Save className="w-3.5 h-3.5 text-indigo-400" />
                    Personal Revision Notes (Saved in IndexedDB)
                  </label>
                  {isNotesSaved && (
                    <span className="text-xs text-emerald-400 font-medium">Saved!</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write a custom memory tip, mistake log, or formula reminder here..."
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleSaveNoteClick}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shrink-0 transition"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
