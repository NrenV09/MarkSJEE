/**
 * Navbar Component for MarksJEE
 * Top brand header with navigation tabs, PWA install button, and offline indicator.
 */

import React from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { 
  BookOpen, 
  Clock, 
  Layers, 
  Bookmark, 
  Database, 
  Award,
  Zap
} from 'lucide-react';

export type ActiveTab = 'practice' | 'cbt' | 'chapters' | 'bookmarks' | 'offline_pack';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  bookmarkedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  bookmarkedCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('practice')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-indigo-950/50">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">Marks<span className="text-indigo-400">JEE</span></span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-emerald-400">
                  Offline PYQs
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Modelled after Marks by MathonGo</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => onTabChange('practice')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'practice'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Practice PYQs</span>
            </button>

            <button
              onClick={() => onTabChange('cbt')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'cbt'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>CBT Mock Test</span>
            </button>

            <button
              onClick={() => onTabChange('chapters')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'chapters'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Chapter Analytics</span>
            </button>

            <button
              onClick={() => onTabChange('bookmarks')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'bookmarks'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved ({bookmarkedCount})</span>
            </button>

            <button
              onClick={() => onTabChange('offline_pack')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'offline_pack'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Offline Packs</span>
            </button>
          </nav>

          {/* Right Action: PWA Install Button */}
          <div className="flex items-center gap-3">
            <PWAInstallButton />
          </div>
        </div>

        {/* Mobile Sub Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-2 border-t border-slate-900 scrollbar-none">
          <button
            onClick={() => onTabChange('practice')}
            className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 ${
              activeTab === 'practice' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Practice
          </button>
          <button
            onClick={() => onTabChange('cbt')}
            className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 ${
              activeTab === 'cbt' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            CBT Exam
          </button>
          <button
            onClick={() => onTabChange('chapters')}
            className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 ${
              activeTab === 'chapters' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Chapters
          </button>
          <button
            onClick={() => onTabChange('bookmarks')}
            className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 ${
              activeTab === 'bookmarks' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Saved ({bookmarkedCount})
          </button>
          <button
            onClick={() => onTabChange('offline_pack')}
            className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 ${
              activeTab === 'offline_pack' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Offline Packs
          </button>
        </div>
      </div>
    </header>
  );
};
