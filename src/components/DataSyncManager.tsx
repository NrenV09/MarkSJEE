/**
 * DataSyncManager.tsx
 * Component for massive data ingestion: One-click local sync and manual file drop
 * with real-time non-blocking progress bar and memory monitoring.
 */

import React, { useState } from 'react';
import { useQuestionLoader } from '../hooks/useQuestionLoader';
import { 
  Database, 
  UploadCloud, 
  DownloadCloud, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  Zap, 
  HardDrive,
  FileJson,
  Layers,
  Sparkles
} from 'lucide-react';

interface DataSyncManagerProps {
  stats: {
    totalQuestions: number;
    physicsCount: number;
    chemistryCount: number;
    mathsCount: number;
  };
  onDataSynced: () => void;
}

export const DataSyncManager: React.FC<DataSyncManagerProps> = ({ stats, onDataSynced }) => {
  const { 
    progress, 
    syncLocalQuestionLibrary, 
    importDroppedFile, 
    cancelSync, 
    clearAllQuestions 
  } = useQuestionLoader(onDataSynced);

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await importDroppedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await importDroppedFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Subject Cache Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold text-blue-400">Physics Library</span>
            <span className="text-[11px] font-mono bg-blue-950/60 text-blue-300 px-2 py-0.5 rounded border border-blue-900/50">2002-2026</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats.physicsCount.toLocaleString()} <span className="text-xs text-slate-500 font-normal">PYQs cached</span>
          </div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold text-emerald-400">Chemistry Library</span>
            <span className="text-[11px] font-mono bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-900/50">2002-2026</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats.chemistryCount.toLocaleString()} <span className="text-xs text-slate-500 font-normal">PYQs cached</span>
          </div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold text-indigo-400">Mathematics Library</span>
            <span className="text-[11px] font-mono bg-indigo-950/60 text-indigo-300 px-2 py-0.5 rounded border border-indigo-900/50">2002-2026</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats.mathsCount.toLocaleString()} <span className="text-xs text-slate-500 font-normal">PYQs cached</span>
          </div>
        </div>
      </div>

      {/* Ingestion Engine Card */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 md:p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-2">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              <span>Client-Side IndexedDB Engine</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              Question Library Sync & Ingestion
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Store 15,000+ JEE Main & Advanced questions locally in browser IndexedDB via non-blocking stream chunks. Once cached, practice anytime without internet.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled={progress.isSyncing}
              onClick={() => syncLocalQuestionLibrary()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-950 transition active:scale-95 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>One-Click Local Sync</span>
            </button>
          </div>
        </div>

        {/* Live Progress Bar (when syncing) */}
        {progress.isSyncing && (
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-indigo-900/50 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-300 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span>{progress.statusMessage}</span>
              </span>
              <span className="font-mono font-bold text-white text-sm">
                {progress.percentage}%
              </span>
            </div>

            {/* Progress bar track */}
            <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div 
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-200"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Inserting in background chunks (60 FPS main thread preserved)</span>
              <button 
                onClick={cancelSync}
                className="text-rose-400 hover:text-rose-300 underline font-medium"
              >
                Cancel Sync
              </button>
            </div>
          </div>
        )}

        {/* Success or Error Alert */}
        {!progress.isSyncing && progress.statusMessage && (
          <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border ${
            progress.error
              ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
          }`}>
            {progress.error ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{progress.error || progress.statusMessage}</span>
          </div>
        )}

        {/* Manual File Drop Zone */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Or Manual File Drop (.json Bundle)
          </h3>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer ${
              isDragOver
                ? 'border-indigo-400 bg-indigo-950/40 scale-[1.01]'
                : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/70'
            }`}
          >
            <input 
              type="file" 
              id="bundle-upload" 
              accept=".json" 
              onChange={handleFileSelect} 
              className="hidden" 
            />
            <label htmlFor="bundle-upload" className="cursor-pointer block space-y-3">
              <FileJson className="w-10 h-10 text-indigo-400 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  Drop custom question pack (<code className="text-indigo-300 font-mono">.json</code>) here
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports multi-megabyte files (15,000+ questions parsed and indexed automatically)
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer info & reset options */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Total Cached in IndexedDB: <strong className="text-white font-mono">{stats.totalQuestions.toLocaleString()}</strong> questions</span>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all questions from IndexedDB?')) {
                clearAllQuestions();
              }
            }}
            className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 text-xs hover:bg-rose-950/30 px-3 py-1.5 rounded-lg transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear IndexedDB Questions</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataSyncManager;
