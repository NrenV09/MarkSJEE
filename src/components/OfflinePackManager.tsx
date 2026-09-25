/**
 * OfflinePackManager Component
 * Drag-and-drop question pack importer, database seeding, and full JSON analytics backup/restore.
 */

import React, { useState } from 'react';
import { 
  importQuestionBundle, 
  exportFullBackup, 
  restoreFullBackup, 
  restoreInitialSeedQuestions,
  resetAllUserData 
} from '../db/dexieDB';
import { OfflineBundle, FullUserBackup } from '../types/question';
import { 
  UploadCloud, 
  DownloadCloud, 
  Database, 
  FileCheck, 
  AlertCircle, 
  RefreshCw, 
  Check, 
  Trash2,
  FileCode,
  ShieldCheck
} from 'lucide-react';

interface OfflinePackManagerProps {
  onDataChanged: () => void;
}

export const OfflinePackManager: React.FC<OfflinePackManagerProps> = ({ onDataChanged }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcessFile = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      setImportStatus({ type: 'error', message: 'Please upload a valid .json question bundle file.' });
      return;
    }

    setIsProcessing(true);
    setImportStatus(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      // Check if it's a full user backup or a question pack
      if (parsed.questions && Array.isArray(parsed.questions)) {
        if (parsed.userProgress || parsed.testSessions) {
          // Full backup
          await restoreFullBackup(parsed as FullUserBackup);
          setImportStatus({ 
            type: 'success', 
            message: `Successfully restored full backup with ${parsed.questions.length} questions & your test history!` 
          });
        } else {
          // Question pack bundle
          const res = await importQuestionBundle(parsed as OfflineBundle);
          setImportStatus({ 
            type: 'success', 
            message: `Successfully ingested offline pack "${parsed.name || 'Question Bundle'}" with ${res.importedCount} questions into IndexedDB!` 
          });
        }
        onDataChanged();
      } else {
        throw new Error('JSON is missing the "questions" array schema.');
      }
    } catch (err: any) {
      setImportStatus({ 
        type: 'error', 
        message: `Failed to import file: ${err.message || 'Malformed JSON file'}` 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleProcessFile(e.target.files[0]);
    }
  };

  const handleExportBackup = async () => {
    try {
      const backup = await exportFullBackup();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `MarksJEE_Backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadSamplePack = () => {
    const samplePack: OfflineBundle = {
      version: "1.0.0",
      name: "Sample Offline JEE Question Pack",
      exportedAt: new Date().toISOString(),
      questions: [
        {
          id: "custom-pack-math-01",
          subject: "mathematics",
          subSubject: "calculus",
          chapterId: "definite-integration",
          chapterName: "Definite Integration",
          topic: "Leibniz Rule",
          examType: "JEE Main",
          year: 2024,
          session: "Apr Session",
          questionType: "single_choice",
          difficulty: "Medium",
          questionText: "If $\\int_0^x f(t) dt = x^2 + \\sin x$, find $f'(\\pi/2)$.",
          options: [
            { id: "A", text: "$2$" },
            { id: "B", text: "$1$" },
            { id: "C", text: "$0$" },
            { id: "D", text: "$3$" }
          ],
          correctAnswer: "B",
          solution: {
            steps: [
              {
                title: "Step 1: Differentiate both sides using Leibniz Rule",
                content: "Differentiating $\\int_0^x f(t)dt$ with respect to $x$ yields $f(x) = 2x + \\cos x$."
              },
              {
                title: "Step 2: Differentiate again to find $f'(x)$",
                content: "$f'(x) = 2 - \\sin x$. At $x = \\pi/2$, $f'(\\pi/2) = 2 - 1 = 1$."
              }
            ],
            finalAnswer: "B",
            keyConcepts: ["Leibniz Integral Rule", "Calculus Derivatives"]
          }
        }
      ]
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(samplePack, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "sample_jee_pack_template.json");
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleResetUserData = async () => {
    if (window.confirm("Are you sure you want to reset your practice attempts and test history? Questions will remain intact.")) {
      await resetAllUserData();
      onDataChanged();
      setImportStatus({ type: 'success', message: 'User progress and test analytics reset successfully.' });
    }
  };

  const handleRestoreInitialSeed = async () => {
    if (window.confirm("Restore default question bank? This will re-seed the authentic JEE Main & Advanced questions.")) {
      await restoreInitialSeedQuestions();
      onDataChanged();
      setImportStatus({ type: 'success', message: 'Default question bank restored.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <Database className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-base font-bold text-white">Offline Question Pack & Data Management</h2>
            <p className="text-xs text-slate-400">All data is kept in your device's IndexedDB. No external servers required.</p>
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div className="mt-5">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer ${
              isDragging 
                ? 'border-indigo-400 bg-indigo-950/40 scale-[1.01]' 
                : 'border-slate-700 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-950/70'
            }`}
          >
            <input
              type="file"
              id="file-upload"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer block space-y-3">
              <UploadCloud className="w-10 h-10 text-indigo-400 mx-auto animate-bounce duration-1000" />
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  Drop your offline question pack (<code className="text-indigo-300 font-mono">.json</code>) here
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  or click to browse from your device
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-[11px] text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero bandwidth after download. Completely offline.</span>
              </div>
            </label>
          </div>
        </div>

        {/* Status Notification */}
        {importStatus && (
          <div className={`mt-4 p-4 rounded-xl text-xs flex items-center gap-2.5 border ${
            importStatus.type === 'success' 
              ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300' 
              : 'bg-rose-950/50 border-rose-800/60 text-rose-300'
          }`}>
            {importStatus.type === 'success' ? (
              <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800">
          {/* Export Backup */}
          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition active:scale-95"
          >
            <DownloadCloud className="w-4 h-4 text-indigo-400" />
            <span>Export Full Backup (.json)</span>
          </button>

          {/* Download Sample Template */}
          <button
            onClick={handleDownloadSamplePack}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition active:scale-95"
          >
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span>Sample Question JSON Template</span>
          </button>

          {/* Restore Seed Questions */}
          <button
            onClick={handleRestoreInitialSeed}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition active:scale-95"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <span>Reset Question Bank</span>
          </button>
        </div>

        {/* Danger zone */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={handleResetUserData}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 py-1.5 px-3 rounded-lg hover:bg-rose-950/30 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Attempt History & Bookmarks</span>
          </button>
        </div>
      </div>
    </div>
  );
};
