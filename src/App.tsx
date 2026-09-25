/**
 * App.tsx / App.jsx
 * Offline-first replica of "Marks by MathonGo" for JEE Main & Advanced PYQs (2002-2026)
 * Supports client-side IndexedDB caching of 15,000+ questions, compound indexing,
 * KaTeX MathView, instant practice mode, and NTA CBT test mode.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  queryQuestions, 
  getChaptersWithCounts, 
  getDatabaseStats, 
  saveUserAttempt, 
  toggleBookmark,
  QuestionRecord,
  UserActivityRecord 
} from './db/db';
import { MathView } from './components/MathView';
import { SidebarFilter } from './components/SidebarFilter';
import { QuestionFeed } from './components/QuestionFeed';
import { DataSyncManager } from './components/DataSyncManager';
import { CBTTestModal } from './components/CBTTestModal';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';
import { 
  Zap, 
  HardDrive, 
  Clock, 
  Search, 
  Bookmark, 
  Layers, 
  Sparkles,
  BookOpen
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'practice' | 'sync' | 'cbt'>('practice');

  // Filter state
  const [subject, setSubject] = useState<'physics' | 'chemistry' | 'maths'>('maths');
  const [chapter, setChapter] = useState<string | 'all'>('all');
  const [year, setYear] = useState<number | 'all'>('all');
  const [examType, setExamType] = useState<'JEE Main' | 'JEE Advanced' | 'all'>('all');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'all'>('all');
  const [status, setStatus] = useState<'all' | 'attempted' | 'skipped' | 'bookmarked'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination & data
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalMatching, setTotalMatching] = useState<number>(0);
  const [questions, setQuestions] = useState<Array<QuestionRecord & { activity?: UserActivityRecord }>>([]);
  const [chaptersList, setChaptersList] = useState<Array<{ chapter: string; count: number }>>([]);

  // Database cache stats
  const [dbStats, setDbStats] = useState({
    totalQuestions: 0,
    physicsCount: 0,
    chemistryCount: 0,
    mathsCount: 0,
    attemptedCount: 0,
    correctCount: 0,
    accuracy: 0,
    bookmarkedCount: 0
  });

  // CBT Exam Modal
  const [isCBTActive, setIsCBTActive] = useState<boolean>(false);

  // Load database summary
  const refreshStats = useCallback(async () => {
    const stats = await getDatabaseStats();
    setDbStats(stats);
  }, []);

  // Load distinct chapters for current subject
  const loadChapters = useCallback(async (sub: 'physics' | 'chemistry' | 'maths') => {
    const list = await getChaptersWithCounts(sub);
    setChaptersList(list);
  }, []);

  // Fetch paginated questions from Dexie using compound index
  const fetchQuestions = useCallback(async () => {
    const result = await queryQuestions({
      subject,
      chapter,
      year,
      examType,
      difficulty,
      status,
      search: searchQuery,
      page,
      pageSize: 20
    });

    setQuestions(result.questions);
    setTotalMatching(result.totalMatching);
    setTotalPages(result.totalPages);
    setPage(result.page);
  }, [subject, chapter, year, examType, difficulty, status, searchQuery, page]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      await refreshStats();
      await loadChapters(subject);
    };
    init();
  }, [subject, refreshStats, loadChapters]);

  // Refetch when filters or page change
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Auto-sync prompt if DB is empty on first load
  useEffect(() => {
    if (dbStats.totalQuestions === 0) {
      // Auto-load starter library
      const autoSync = async () => {
        try {
          const res = await fetch('/data/maths_pyqs.json');
          if (res.ok) {
            const data = await res.json();
            const { bulkInsertQuestionsChunk } = await import('./db/db');
            await bulkInsertQuestionsChunk(data);
            await refreshStats();
            await loadChapters(subject);
            await fetchQuestions();
          }
        } catch (e) {
          // ignore
        }
      };
      autoSync();
    }
  }, [dbStats.totalQuestions, subject, refreshStats, loadChapters, fetchQuestions]);

  // Question attempt handler
  const handleAnswerSubmit = async (qId: string, answer: any, isCorrect: boolean, timeSpent: number) => {
    await saveUserAttempt(qId, answer, isCorrect, timeSpent);
    await refreshStats();
    await fetchQuestions();
  };

  // Bookmark toggle handler
  const handleToggleBookmark = async (qId: string) => {
    await toggleBookmark(qId);
    await refreshStats();
    await fetchQuestions();
  };

  const handleResetFilters = () => {
    setChapter('all');
    setYear('all');
    setExamType('all');
    setDifficulty('all');
    setStatus('all');
    setSearchQuery('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div 
              className="flex items-center gap-3 cursor-pointer" 
              onClick={() => { setActiveTab('practice'); handleResetFilters(); }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-950">
                M
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-tight text-white">Marks<span className="text-indigo-400">JEE</span></span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-emerald-400">
                    Offline MathonGo
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">15,000+ PYQs (2002 - 2026)</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveTab('practice')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'practice'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Practice PYQs</span>
              </button>

              <button
                onClick={() => setActiveTab('sync')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'sync'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Sync Library ({dbStats.totalQuestions.toLocaleString()})</span>
              </button>

              <button
                onClick={() => setIsCBTActive(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 transition"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>CBT Test Mode</span>
              </button>
            </nav>

            {/* Right Install Action */}
            <div className="flex items-center gap-3">
              <PWAInstallButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: PRACTICE MODE */}
        {activeTab === 'practice' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Left Sidebar Filter */}
            <div className="lg:col-span-1 space-y-4">
              <SidebarFilter
                subject={subject}
                chapter={chapter}
                year={year}
                examType={examType}
                difficulty={difficulty}
                status={status}
                chaptersList={chaptersList}
                onSubjectChange={(newSub) => {
                  setSubject(newSub);
                  setChapter('all');
                  setPage(1);
                  loadChapters(newSub);
                }}
                onChapterChange={(newCh) => {
                  setChapter(newCh);
                  setPage(1);
                }}
                onYearChange={(newY) => {
                  setYear(newY);
                  setPage(1);
                }}
                onExamTypeChange={(newE) => {
                  setExamType(newE);
                  setPage(1);
                }}
                onDifficultyChange={(newD) => {
                  setDifficulty(newD);
                  setPage(1);
                }}
                onStatusChange={(newSt) => {
                  setStatus(newSt);
                  setPage(1);
                }}
                onResetFilters={handleResetFilters}
              />

              {/* Offline Library Status Card */}
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300 font-semibold">
                  <span>Offline Cache Status</span>
                  <span className="text-emerald-400 font-mono">{dbStats.totalQuestions} Loaded</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Operates 100% offline via IndexedDB. Use "Sync Library" to ingest all 15,000+ questions.
                </p>
              </div>
            </div>

            {/* Right Question Feed */}
            <div className="lg:col-span-3 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search inside 15,000+ PYQs by formula, concept, keyword or session..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Feed List */}
              <QuestionFeed
                questions={questions}
                page={page}
                totalPages={totalPages}
                totalMatching={totalMatching}
                onPageChange={(p) => setPage(p)}
                onAnswerSubmit={handleAnswerSubmit}
                onToggleBookmark={handleToggleBookmark}
              />
            </div>
          </div>
        )}

        {/* TAB 2: DATA SYNC & MASSIVE INGESTION */}
        {activeTab === 'sync' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <DataSyncManager
              stats={dbStats}
              onDataSynced={async () => {
                await refreshStats();
                await loadChapters(subject);
                await fetchQuestions();
              }}
            />
          </div>
        )}
      </main>

      {/* CBT Test Simulator Modal */}
      {isCBTActive && (
        <CBTTestModal
          questions={questions.length >= 10 ? questions.slice(0, 30) : questions}
          durationMinutes={60}
          testTitle={`${subject.toUpperCase()} Full Mock CBT Test`}
          onClose={() => setIsCBTActive(false)}
          onCompleted={() => {
            refreshStats();
            fetchQuestions();
          }}
        />
      )}

      {/* Offline Toast */}
      <OfflineIndicator />
    </div>
  );
}
