/**
 * SidebarFilter.tsx
 * Marks by MathonGo style sidebar filter:
 * Select Subject -> Select Chapter -> Filter by Year (2002–2026) -> Filter by Exam (JEE Main / JEE Advanced)
 */

import React from 'react';
import { Atom, FlaskConical, Pi, Search, Layers, RotateCcw, Filter } from 'lucide-react';

interface SidebarFilterProps {
  subject: 'physics' | 'chemistry' | 'maths';
  chapter: string | 'all';
  year: number | 'all';
  examType: 'JEE Main' | 'JEE Advanced' | 'all';
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'all';
  status: 'all' | 'attempted' | 'skipped' | 'bookmarked';
  chaptersList: Array<{ chapter: string; count: number }>;
  onSubjectChange: (sub: 'physics' | 'chemistry' | 'maths') => void;
  onChapterChange: (ch: string | 'all') => void;
  onYearChange: (y: number | 'all') => void;
  onExamTypeChange: (e: 'JEE Main' | 'JEE Advanced' | 'all') => void;
  onDifficultyChange: (d: 'Easy' | 'Medium' | 'Hard' | 'all') => void;
  onStatusChange: (s: 'all' | 'attempted' | 'skipped' | 'bookmarked') => void;
  onResetFilters: () => void;
}

export const SidebarFilter: React.FC<SidebarFilterProps> = ({
  subject,
  chapter,
  year,
  examType,
  difficulty,
  status,
  chaptersList,
  onSubjectChange,
  onChapterChange,
  onYearChange,
  onExamTypeChange,
  onDifficultyChange,
  onStatusChange,
  onResetFilters
}) => {
  // Generate list of years from 2026 down to 2002
  const years: number[] = [];
  for (let y = 2026; y >= 2002; y--) {
    years.push(y);
  }

  return (
    <aside className="bg-slate-900/90 rounded-3xl border border-slate-800 p-5 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-indigo-400" />
          <span>PYQ Filters</span>
        </h3>
        <button
          onClick={onResetFilters}
          className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* 1. Subject Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          1. Subject
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => onSubjectChange('physics')}
            className={`py-2 px-1 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition ${
              subject === 'physics'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Atom className="w-3.5 h-3.5 text-blue-300" />
            <span>Phy</span>
          </button>

          <button
            onClick={() => onSubjectChange('chemistry')}
            className={`py-2 px-1 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition ${
              subject === 'chemistry'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-emerald-300" />
            <span>Chem</span>
          </button>

          <button
            onClick={() => onSubjectChange('maths')}
            className={`py-2 px-1 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition ${
              subject === 'maths'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Pi className="w-3.5 h-3.5 text-indigo-300" />
            <span>Math</span>
          </button>
        </div>
      </div>

      {/* 2. Chapter Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            2. Chapter
          </label>
          <span className="text-[11px] text-slate-500 font-mono">
            {chaptersList.length} Chapters
          </span>
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          <button
            onClick={() => onChapterChange('all')}
            className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${
              chapter === 'all'
                ? 'bg-indigo-950/60 border-indigo-500 text-white'
                : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>All Chapters</span>
            <span className="text-[10px] font-mono bg-slate-900 px-1.5 py-0.5 rounded">All</span>
          </button>

          {chaptersList.map(ch => (
            <button
              key={ch.chapter}
              onClick={() => onChapterChange(ch.chapter)}
              className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition group ${
                chapter === ch.chapter
                  ? 'bg-indigo-950/60 border-indigo-500 text-white font-semibold'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              <span className="truncate pr-2 group-hover:text-white">{ch.chapter}</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded shrink-0">
                {ch.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Filter by Year (2002 - 2026) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          3. Year (2002 - 2026)
        </label>
        <select
          value={year}
          onChange={(e) => onYearChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
        >
          <option value="all">All Years (2002 - 2026)</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* 4. Filter by Exam */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          4. Exam Target
        </label>
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
          {(['all', 'JEE Main', 'JEE Advanced'] as const).map(eType => (
            <button
              key={eType}
              onClick={() => onExamTypeChange(eType)}
              className={`py-1.5 rounded-lg font-semibold transition ${
                examType === eType
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {eType === 'all' ? 'All' : eType.replace('JEE ', '')}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Filter by Status & Difficulty */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-1">Status</label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'attempted', label: 'Attempted' },
              { id: 'bookmarked', label: 'Bookmarked' },
              { id: 'skipped', label: 'Skipped' }
            ].map(st => (
              <button
                key={st.id}
                onClick={() => onStatusChange(st.id as any)}
                className={`py-1 rounded-lg text-[11px] font-medium border ${
                  status === st.id
                    ? 'bg-slate-800 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarFilter;
