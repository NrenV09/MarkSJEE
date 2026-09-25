/**
 * TestPalette Component
 * JEE CBT standard question palette grid (1 to N) with status indicators:
 * Green (Answered), Red (Not Answered), Purple (Marked for Review),
 * Purple + Green dot (Answered & Marked for Review), Gray (Not Visited).
 */

import React, { useMemo } from 'react';
import { QuestionAttemptStatus, Subject } from '../types/question';

export interface PaletteItem {
  index: number;
  questionId: string;
  status: QuestionAttemptStatus | 'not_visited';
  subject?: Subject;
}

interface TestPaletteProps {
  items: PaletteItem[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  activeSubject?: Subject | 'all';
  onFilterSubject?: (sub: Subject | 'all') => void;
}

export const TestPalette: React.FC<TestPaletteProps> = ({
  items,
  currentIndex,
  onSelectIndex,
  activeSubject = 'all',
  onFilterSubject
}) => {
  // Filtered items if subject filtering is active
  const filteredItems = useMemo(() => {
    if (activeSubject === 'all') return items;
    return items.filter(it => !it.subject || it.subject === activeSubject);
  }, [items, activeSubject]);

  // Status counts calculation
  const counts = useMemo(() => {
    let answered = 0;
    let notAnswered = 0;
    let markedForReview = 0;
    let markedAndAnswered = 0;
    let notVisited = 0;

    for (const item of items) {
      if (item.status === 'attempted') answered++;
      else if (item.status === 'unattempted') notAnswered++;
      else if (item.status === 'marked_for_review') markedForReview++;
      else if (item.status === 'marked_and_attempted') markedAndAnswered++;
      else notVisited++;
    }

    return { answered, notAnswered, markedForReview, markedAndAnswered, notVisited };
  }, [items]);

  const getItemClass = (status: PaletteItem['status'], isCurrent: boolean) => {
    let base = "relative w-9 h-9 rounded-lg font-mono text-xs font-bold flex items-center justify-center transition active:scale-95 border ";

    if (isCurrent) {
      base += "ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900 ";
    }

    switch (status) {
      case 'attempted':
        // JEE Green
        return base + "bg-emerald-600 border-emerald-400 text-white shadow-sm shadow-emerald-950";
      case 'unattempted':
        // JEE Red
        return base + "bg-rose-600 border-rose-400 text-white shadow-sm shadow-rose-950";
      case 'marked_for_review':
        // JEE Purple
        return base + "bg-purple-600 border-purple-400 text-white shadow-sm shadow-purple-950";
      case 'marked_and_attempted':
        // JEE Purple with green badge
        return base + "bg-purple-600 border-purple-400 text-white";
      case 'not_visited':
      default:
        // JEE Neutral / Gray
        return base + "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600";
    }
  };

  return (
    <div className="bg-slate-900/95 rounded-2xl border border-slate-800 p-4 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Question Palette
        </h3>
        <span className="text-xs font-mono text-slate-400">
          {items.length} Questions
        </span>
      </div>

      {/* Subject Filter Pills (if multiple subjects are present) */}
      {onFilterSubject && (
        <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
          {(['all', 'physics', 'chemistry', 'mathematics'] as const).map(sub => (
            <button
              key={sub}
              onClick={() => onFilterSubject(sub)}
              className={`flex-1 py-1 rounded-lg capitalize font-medium transition ${
                activeSubject === sub 
                  ? 'bg-slate-800 text-white font-semibold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sub === 'all' ? 'All' : sub.slice(0, 4)}
            </button>
          ))}
        </div>
      )}

      {/* Grid of question buttons */}
      <div className="grid grid-cols-5 gap-2 max-h-[260px] overflow-y-auto p-1">
        {filteredItems.map(item => {
          const isCurrent = item.index === currentIndex;

          return (
            <button
              key={item.questionId}
              onClick={() => onSelectIndex(item.index)}
              className={getItemClass(item.status, isCurrent)}
            >
              <span>{item.index + 1}</span>
              {item.status === 'marked_and_attempted' && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-slate-900" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend summary matching NTA / JEE CBT standard */}
      <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-emerald-600 flex items-center justify-center font-mono text-[9px] text-white">
              {counts.answered}
            </span>
            <span>Answered</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-rose-600 flex items-center justify-center font-mono text-[9px] text-white">
              {counts.notAnswered}
            </span>
            <span>Not Answered</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-purple-600 flex items-center justify-center font-mono text-[9px] text-white">
              {counts.markedForReview}
            </span>
            <span>Marked Review</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-purple-600 relative flex items-center justify-center font-mono text-[9px] text-white">
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              {counts.markedAndAnswered}
            </span>
            <span>Ans & Review</span>
          </div>

          <div className="flex items-center gap-2 col-span-2">
            <span className="w-4 h-4 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-[9px] text-slate-300">
              {counts.notVisited}
            </span>
            <span>Not Visited</span>
          </div>
        </div>
      </div>
    </div>
  );
};
