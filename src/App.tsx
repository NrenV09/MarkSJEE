/**
 * MarksJEE - Offline-First JEE Main & Advanced PYQ Practice Platform
 * Architecture modeled after Marks by MathonGo.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Question, 
  UserProgress, 
  Subject, 
  QuestionFilters, 
  ExamType, 
  QuestionType, 
  Difficulty, 
  TestSession 
} from './types/question';
import { 
  initializeDatabase, 
  getFilteredQuestions, 
  saveQuestionAttempt, 
  clearQuestionAttempt, 
  toggleQuestionBookmark, 
  saveQuestionNote, 
  getAggregatedStats,
  getAllTestSessions 
} from './db/dexieDB';
import { Navbar, ActiveTab } from './components/Navbar';
import { QuestionCard } from './components/QuestionCard';
import { ChapterNavigator } from './components/ChapterNavigator';
import { TestPalette, PaletteItem } from './components/TestPalette';
import { CBTExamModal } from './components/CBTExamModal';
import { OfflinePackManager } from './components/OfflinePackManager';
import { OfflineIndicator } from './components/PWAInstallButton';
import { 
  Search, 
  Filter, 
  Play, 
  Trophy, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  Bookmark, 
  ChevronRight, 
  ChevronLeft,
  Flame,
  Zap,
  BookOpen,
  Layers,
  History
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('practice');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters State
  const [filters, setFilters] = useState<QuestionFilters>({
    subject: 'all',
    chapterId: 'all',
    examType: 'all',
    year: 'all',
    questionType: 'all',
    difficulty: 'all',
    status: 'all',
    searchQuery: ''
  });

  // Loaded questions list
  const [questions, setQuestions] = useState<Array<Question & { progress?: UserProgress }>>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  // CBT Exam mode modal state
  const [isCBTActive, setIsCBTActive] = useState<boolean>(false);
  const [cbtDuration, setCbtDuration] = useState<number>(60);
  const [pastTestSessions, setPastTestSessions] = useState<TestSession[]>([]);

  // Aggregated Stats
  const [stats, setStats] = useState<{
    totalQuestions: number;
    attemptedQuestions: number;
    correctQuestions: number;
    accuracy: number;
    totalTimeSeconds: number;
    bookmarkedCount: number;
    subjectStats: Record<Subject, { total: number; attempted: number; correct: number }>;
  }>({
    totalQuestions: 0,
    attemptedQuestions: 0,
    correctQuestions: 0,
    accuracy: 0,
    totalTimeSeconds: 0,
    bookmarkedCount: 0,
    subjectStats: {
      physics: { total: 0, attempted: 0, correct: 0 },
      chemistry: { total: 0, attempted: 0, correct: 0 },
      mathematics: { total: 0, attempted: 0, correct: 0 }
    }
  });

  // Load questions and stats from Dexie IndexedDB
  const refreshData = useCallback(async () => {
    try {
      const filtered = await getFilteredQuestions(filters);
      setQuestions(filtered);
      
      const aggStats = await getAggregatedStats();
      setStats(aggStats);

      const tests = await getAllTestSessions();
      setPastTestSessions(tests);
    } catch (err) {
      console.error('[MarksJEE DB Error]', err);
    }
  }, [filters]);

  // Initial mount: setup Dexie DB and load initial data
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await initializeDatabase();
      await refreshData();
      setIsLoading(false);
    };
    init();
  }, [refreshData]);

  // Ensure current question index is within range
  useEffect(() => {
    if (currentQuestionIndex >= questions.length && questions.length > 0) {
      setCurrentQuestionIndex(0);
    }
  }, [questions.length, currentQuestionIndex]);

  // Answer submit handler
  const handleAnswerSubmit = async (
    questionId: string,
    answer: string | string[] | Record<string, string[]>,
    isCorrect: boolean,
    timeSpent: number
  ) => {
    await saveQuestionAttempt(questionId, answer, isCorrect, timeSpent, 'attempted');
    await refreshData();
  };

  // Clear answer handler
  const handleClearAnswer = async (questionId: string) => {
    await clearQuestionAttempt(questionId);
    await refreshData();
  };

  // Toggle bookmark handler
  const handleToggleBookmark = async (questionId: string) => {
    await toggleQuestionBookmark(questionId);
    await refreshData();
  };

  // Save note handler
  const handleSaveNote = async (questionId: string, note: string) => {
    await saveQuestionNote(questionId, note);
    await refreshData();
  };

  // Convert questions to palette items for quick jumping
  const paletteItems: PaletteItem[] = useMemo(() => {
    return questions.map((q, idx) => ({
      index: idx,
      questionId: q.id,
      status: q.progress?.status || 'not_visited',
      subject: q.subject
    }));
  }, [questions]);

  const activeQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'bookmarks') {
            setFilters(prev => ({ ...prev, status: 'bookmarked' }));
          } else if (filters.status === 'bookmarked') {
            setFilters(prev => ({ ...prev, status: 'all' }));
          }
        }} 
        bookmarkedCount={stats.bookmarkedCount} 
      />

      {/* Main Content Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Performance Banner */}
        <section className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Attempted</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl md:text-2xl font-black text-white font-mono">
              {stats.attemptedQuestions} <span className="text-xs text-slate-500 font-normal">/ {stats.totalQuestions}</span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Accuracy</span>
              <Trophy className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl md:text-2xl font-black text-emerald-400 font-mono">
              {stats.accuracy}%
            </div>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Correct</span>
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl md:text-2xl font-black text-indigo-300 font-mono">
              {stats.correctQuestions}
            </div>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Bookmarked</span>
              <Bookmark className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl md:text-2xl font-black text-amber-400 font-mono">
              {stats.bookmarkedCount}
            </div>
          </div>
        </section>

        {/* TAB 1: PRACTICE MODE */}
        {(activeTab === 'practice' || activeTab === 'bookmarks') && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 space-y-3">
              {/* Subject Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {(['all', 'physics', 'chemistry', 'mathematics'] as const).map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setFilters({ ...filters, subject: sub, chapterId: 'all' })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                        filters.subject === sub
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sub === 'all' ? 'All Subjects' : sub}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search PYQ text, topic..."
                    value={filters.searchQuery || ''}
                    onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Secondary Filter Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
                {/* Exam Type */}
                <select
                  value={filters.examType || 'all'}
                  onChange={(e) => setFilters({ ...filters, examType: e.target.value as any })}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Exams</option>
                  <option value="JEE Main">JEE Main</option>
                  <option value="JEE Advanced">JEE Advanced</option>
                </select>

                {/* Year */}
                <select
                  value={filters.year || 'all'}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value === 'all' ? 'all' : Number(e.target.value) })}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Years</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                  <option value="2020">2020</option>
                </select>

                {/* Question Type */}
                <select
                  value={filters.questionType || 'all'}
                  onChange={(e) => setFilters({ ...filters, questionType: e.target.value as any })}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Question Types</option>
                  <option value="single_choice">Single Choice</option>
                  <option value="multi_correct">Multi Correct</option>
                  <option value="numerical">Numerical Value</option>
                  <option value="matrix_match">Matrix Match</option>
                </select>

                {/* Attempt Status */}
                <select
                  value={filters.status || 'all'}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="unattempted">Unattempted</option>
                  <option value="attempted">Attempted</option>
                  <option value="bookmarked">Bookmarked</option>
                </select>

                {/* Reset Filters */}
                {(filters.examType !== 'all' || filters.year !== 'all' || filters.questionType !== 'all' || filters.status !== 'all' || filters.searchQuery) && (
                  <button
                    onClick={() => setFilters({
                      subject: filters.subject,
                      chapterId: 'all',
                      examType: 'all',
                      year: 'all',
                      questionType: 'all',
                      difficulty: 'all',
                      status: 'all',
                      searchQuery: ''
                    })}
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-xs px-2 py-1 rounded bg-indigo-950/40 border border-indigo-900/60"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Filters</span>
                  </button>
                )}
              </div>
            </div>

            {/* Questions Workspace: Split Layout */}
            {questions.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* Active Question Display (3 Columns) */}
                <div className="lg:col-span-3 space-y-4">
                  {/* Top Navigation between questions */}
                  <div className="flex items-center justify-between bg-slate-900/60 px-4 py-2.5 rounded-xl border border-slate-800">
                    <span className="text-xs font-semibold text-slate-300">
                      Showing Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                        className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-30 hover:bg-slate-700 text-slate-300"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="font-mono text-xs text-indigo-400 font-bold px-1">
                        {currentQuestionIndex + 1} / {questions.length}
                      </span>
                      <button
                        disabled={currentQuestionIndex === questions.length - 1}
                        onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                        className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-30 hover:bg-slate-700 text-slate-300"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {activeQuestion && (
                    <QuestionCard
                      question={activeQuestion}
                      progress={activeQuestion.progress}
                      questionNumber={currentQuestionIndex + 1}
                      onAnswerSubmit={(answer, isCorrect, timeSpent) => 
                        handleAnswerSubmit(activeQuestion.id, answer, isCorrect, timeSpent)
                      }
                      onClearAnswer={() => handleClearAnswer(activeQuestion.id)}
                      onToggleBookmark={() => handleToggleBookmark(activeQuestion.id)}
                      onSaveNote={(note) => handleSaveNote(activeQuestion.id, note)}
                      mode="practice"
                    />
                  )}
                </div>

                {/* Right Quick Jump Question Palette (1 Column) */}
                <div className="lg:col-span-1 space-y-4">
                  <TestPalette
                    items={paletteItems}
                    currentIndex={currentQuestionIndex}
                    onSelectIndex={(idx) => setCurrentQuestionIndex(idx)}
                  />

                  {/* Start Mock Test Prompt */}
                  <div className="bg-gradient-to-br from-indigo-950/60 to-purple-950/40 p-4 rounded-2xl border border-indigo-800/40 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                      <Clock className="w-4 h-4" />
                      <span>Ready for Mock Test?</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Test your exam temperament with timed conditions, negative marking, and NTA CBT question palette.
                    </p>
                    <button
                      onClick={() => {
                        setActiveTab('cbt');
                        setIsCBTActive(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-950 transition active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Launch CBT Mock Test</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/60 p-12 rounded-3xl border border-slate-800 text-center space-y-4">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">No Questions Match Selected Filters</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Try adjusting the subject, year, or question status filters, or import an offline question pack.
                </p>
                <button
                  onClick={() => setFilters({
                    subject: 'all',
                    chapterId: 'all',
                    examType: 'all',
                    year: 'all',
                    questionType: 'all',
                    difficulty: 'all',
                    status: 'all',
                    searchQuery: ''
                  })}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CBT EXAM MODE LAUNCHER */}
        {activeTab === 'cbt' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 p-8 rounded-3xl border border-indigo-500/30 shadow-2xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-3">
                    <Clock className="w-3.5 h-3.5" />
                    <span>NTA JEE Computer Based Test (CBT)</span>
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-white">
                    JEE Main & Advanced Full Mock Test
                  </h2>
                  <p className="text-xs text-slate-300 mt-2 max-w-lg leading-relaxed">
                    Experience authentic exam simulation with a live countdown timer, question palette navigation (Green/Red/Purple), +4 / -1 JEE marking scheme, and detailed rank/accuracy analytics.
                  </p>
                </div>

                <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 text-center space-y-3 min-w-[220px]">
                  <label className="text-xs text-slate-400 font-medium block">
                    Select Test Duration:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCbtDuration(30)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border ${
                        cbtDuration === 30 ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      30 Mins
                    </button>
                    <button
                      onClick={() => setCbtDuration(60)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border ${
                        cbtDuration === 60 ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      60 Mins
                    </button>
                  </div>
                  <button
                    onClick={() => setIsCBTActive(true)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start Test Now</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Test History */}
            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                <span>Previous Mock Test Attempts ({pastTestSessions.length})</span>
              </h3>

              {pastTestSessions.length > 0 ? (
                <div className="space-y-3">
                  {pastTestSessions.map(sess => (
                    <div
                      key={sess.id}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-white">{sess.title}</h4>
                        <p className="text-xs text-slate-400">
                          {new Date(sess.completedAt || sess.startedAt).toLocaleDateString()} • {sess.durationMinutes} mins
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-black text-indigo-400 font-mono">
                            {sess.score} <span className="text-xs text-slate-500 font-normal">/ {sess.maxScore}</span>
                          </p>
                          <p className="text-[11px] text-slate-400">{sess.accuracy}% Accuracy</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  You haven't completed any mock tests yet. Launch your first test above!
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CHAPTER ANALYTICS & HIERARCHY */}
        {activeTab === 'chapters' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <ChapterNavigator
              currentSubject={filters.subject === 'all' ? 'physics' : (filters.subject as Subject)}
              selectedChapterId={filters.chapterId || 'all'}
              onSelectSubject={(sub) => setFilters(prev => ({ ...prev, subject: sub, chapterId: 'all' }))}
              onSelectChapter={(chId) => {
                setFilters(prev => ({ ...prev, chapterId: chId }));
                setActiveTab('practice');
              }}
              questions={questions}
            />
          </div>
        )}

        {/* TAB 4: OFFLINE QUESTION PACKS & BACKUP */}
        {activeTab === 'offline_pack' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <OfflinePackManager onDataChanged={refreshData} />
          </div>
        )}
      </div>

      {/* CBT Fullscreen Simulator Modal */}
      {isCBTActive && (
        <CBTExamModal
          questions={questions.length >= 3 ? questions : questions}
          durationMinutes={cbtDuration}
          testTitle={`JEE Mock Exam (${cbtDuration} Mins)`}
          onClose={() => setIsCBTActive(false)}
          onTestSubmitted={refreshData}
        />
      )}

      {/* Offline Toast Indicator */}
      <OfflineIndicator />
    </div>
  );
}
