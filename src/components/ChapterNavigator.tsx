/**
 * ChapterNavigator Component
 * Marks by MathonGo style chapter browser with subject breakdown, sub-subject chips,
 * question count badges, completion progress bars, and search.
 */

import React, { useState, useMemo } from 'react';
import { Subject, SubSubject, Chapter, UserProgress, Question } from '../types/question';
import { INITIAL_CHAPTERS } from '../data/initialQuestions';
import { 
  Atom, 
  FlaskConical, 
  Pi, 
  Search, 
  CheckCircle, 
  Layers, 
  ChevronRight, 
  Sparkles,
  Award
} from 'lucide-react';

interface ChapterNavigatorProps {
  currentSubject: Subject;
  selectedChapterId: string | 'all';
  onSelectSubject: (subject: Subject) => void;
  onSelectChapter: (chapterId: string | 'all') => void;
  questions: Array<Question & { progress?: UserProgress }>;
}

export const ChapterNavigator: React.FC<ChapterNavigatorProps> = ({
  currentSubject,
  selectedChapterId,
  onSelectSubject,
  onSelectChapter,
  questions
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubSubject, setSelectedSubSubject] = useState<string>('all');

  // Sub-subject categories per subject
  const subSubjectFilters: Record<Subject, Array<{ id: string; label: string }>> = {
    physics: [
      { id: 'all', label: 'All Physics' },
      { id: 'mechanics', label: 'Mechanics' },
      { id: 'electrodynamics', label: 'Electrodynamics' },
      { id: 'optics_modern', label: 'Optics & Modern' },
      { id: 'thermodynamics_waves', label: 'Thermal & Waves' }
    ],
    chemistry: [
      { id: 'all', label: 'All Chemistry' },
      { id: 'physical', label: 'Physical Chemistry' },
      { id: 'organic', label: 'Organic Chemistry' },
      { id: 'inorganic', label: 'Inorganic Chemistry' }
    ],
    mathematics: [
      { id: 'all', label: 'All Mathematics' },
      { id: 'calculus', label: 'Calculus' },
      { id: 'algebra', label: 'Algebra' },
      { id: 'coordinate_geometry', label: 'Coordinate Geometry' },
      { id: 'vectors_3d', label: 'Vectors & 3D' }
    ]
  };

  // Compute chapter statistics from current questions array
  const chaptersWithStats = useMemo(() => {
    const subjectChapters = INITIAL_CHAPTERS.filter(ch => ch.subject === currentSubject);

    return subjectChapters.map(ch => {
      // Find loaded questions for this chapter
      const chQuestions = questions.filter(q => q.chapterId === ch.id);
      const totalLoaded = chQuestions.length;
      const attempted = chQuestions.filter(q => q.progress?.status === 'attempted' || q.progress?.status === 'marked_and_attempted').length;
      const correct = chQuestions.filter(q => q.progress?.isCorrect).length;
      
      const completionPercentage = totalLoaded > 0 ? Math.round((attempted / totalLoaded) * 100) : 0;
      const accuracyPercentage = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

      return {
        ...ch,
        loadedCount: totalLoaded || ch.totalQuestions,
        attemptedCount: attempted,
        accuracyPercentage,
        completionPercentage
      };
    });
  }, [currentSubject, questions]);

  // Filtered chapters based on search and sub-subject
  const filteredChapters = useMemo(() => {
    return chaptersWithStats.filter(ch => {
      const matchesSearch = ch.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSub = selectedSubSubject === 'all' || ch.subSubject === selectedSubSubject;
      return matchesSearch && matchesSub;
    });
  }, [chaptersWithStats, searchTerm, selectedSubSubject]);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-5">
      {/* Subject Selector Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950 rounded-xl border border-slate-800/80">
        <button
          onClick={() => {
            onSelectSubject('physics');
            setSelectedSubSubject('all');
            onSelectChapter('all');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs md:text-sm font-semibold transition ${
            currentSubject === 'physics'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Atom className="w-4 h-4 text-blue-300" />
          <span>Physics</span>
        </button>

        <button
          onClick={() => {
            onSelectSubject('chemistry');
            setSelectedSubSubject('all');
            onSelectChapter('all');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs md:text-sm font-semibold transition ${
            currentSubject === 'chemistry'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FlaskConical className="w-4 h-4 text-emerald-300" />
          <span>Chemistry</span>
        </button>

        <button
          onClick={() => {
            onSelectSubject('mathematics');
            setSelectedSubSubject('all');
            onSelectChapter('all');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs md:text-sm font-semibold transition ${
            currentSubject === 'mathematics'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Pi className="w-4 h-4 text-indigo-300" />
          <span>Mathematics</span>
        </button>
      </div>

      {/* Sub-Subject category pills (Physical/Organic/Inorganic, Calculus, etc.) */}
      <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
        {subSubjectFilters[currentSubject].map(filter => (
          <button
            key={filter.id}
            onClick={() => setSelectedSubSubject(filter.id)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${
              selectedSubSubject === filter.id
                ? 'bg-slate-800 border-indigo-500/70 text-indigo-200'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Chapter Search Box */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={`Search ${currentSubject} chapters...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* "All Chapters" Option */}
      <button
        onClick={() => onSelectChapter('all')}
        className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition ${
          selectedChapterId === 'all'
            ? 'bg-indigo-950/40 border-indigo-500/80 text-white'
            : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span className="text-xs md:text-sm font-semibold">All Chapters & Topics</span>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          Full Syllabus
        </span>
      </button>

      {/* Chapters List */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {filteredChapters.map(ch => {
          const isSelected = selectedChapterId === ch.id;

          return (
            <button
              key={ch.id}
              onClick={() => onSelectChapter(ch.id)}
              className={`w-full text-left p-3.5 rounded-xl border transition group ${
                isSelected
                  ? 'bg-indigo-950/50 border-indigo-500 text-white ring-1 ring-indigo-500/50'
                  : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs md:text-sm font-semibold truncate group-hover:text-white">
                  {ch.name}
                </span>
                <span className="text-xs font-mono text-slate-400 shrink-0 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {ch.loadedCount} PYQs
                </span>
              </div>

              {/* Progress & Accuracy Stats */}
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${ch.completionPercentage}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] shrink-0">
                  {ch.completionPercentage}% done
                </span>
                {ch.attemptedCount > 0 && (
                  <span className="font-mono text-[11px] text-emerald-400 shrink-0">
                    {ch.accuracyPercentage}% acc
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {filteredChapters.length === 0 && (
          <div className="text-center py-6 text-xs text-slate-500">
            No chapters match your search filter.
          </div>
        )}
      </div>
    </div>
  );
};
