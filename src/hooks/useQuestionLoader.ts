/**
 * useQuestionLoader.ts / useQuestionLoader.js
 * High-performance hook for loading & bulk-storing multi-megabyte JSON packs
 * into IndexedDB in non-blocking batches without freezing the main UI thread.
 */

import { useState, useCallback, useRef } from 'react';
import { db, QuestionRecord, bulkInsertQuestionsChunk, getDatabaseStats } from '../db/db';

export interface SyncProgressState {
  isSyncing: boolean;
  currentSubject: string;
  processedCount: number;
  totalCount: number;
  percentage: number;
  statusMessage: string;
  error: string | null;
}

const CHUNK_SIZE = 250; // Size of each batch inserted into IndexedDB

// Schedule work on idle frames or next tick so UI maintains 60 FPS
function yieldToMainThread(): Promise<void> {
  return new Promise(resolve => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => resolve(), { timeout: 16 });
    } else {
      setTimeout(resolve, 0);
    }
  });
}

export function useQuestionLoader(onComplete?: () => void) {
  const [progress, setProgress] = useState<SyncProgressState>({
    isSyncing: false,
    currentSubject: '',
    processedCount: 0,
    totalCount: 0,
    percentage: 0,
    statusMessage: '',
    error: null
  });

  const isCancelledRef = useRef<boolean>(false);

  /**
   * Bulk insert an array of questions in non-blocking streaming chunks
   */
  const ingestQuestionsInChunks = useCallback(async (
    questions: QuestionRecord[], 
    subjectLabel: string
  ): Promise<number> => {
    const total = questions.length;
    let inserted = 0;

    for (let i = 0; i < total; i += CHUNK_SIZE) {
      if (isCancelledRef.current) {
        break;
      }

      const chunk = questions.slice(i, i + CHUNK_SIZE);
      await bulkInsertQuestionsChunk(chunk);
      inserted += chunk.length;

      const percentage = Math.round((inserted / total) * 100);

      setProgress(prev => ({
        ...prev,
        currentSubject: subjectLabel,
        processedCount: inserted,
        totalCount: total,
        percentage,
        statusMessage: `Importing ${subjectLabel}: ${inserted.toLocaleString()} / ${total.toLocaleString()} questions cached...`
      }));

      // Yield thread to let React render progress bar and prevent UI freeze
      await yieldToMainThread();
    }

    return inserted;
  }, []);

  /**
   * One-Click Local Sync: Auto-fetch static JSON files placed in /public/data/
   */
  const syncLocalQuestionLibrary = useCallback(async (
    targets: Array<{ subject: 'physics' | 'chemistry' | 'maths'; path: string; label: string }> = [
      { subject: 'physics', path: '/data/physics_pyqs.json', label: 'Physics' },
      { subject: 'chemistry', path: '/data/chemistry_pyqs.json', label: 'Chemistry' },
      { subject: 'maths', path: '/data/maths_pyqs.json', label: 'Mathematics' }
    ]
  ) => {
    isCancelledRef.current = false;
    setProgress({
      isSyncing: true,
      currentSubject: 'Preparing...',
      processedCount: 0,
      totalCount: 0,
      percentage: 0,
      statusMessage: 'Connecting to local question library...',
      error: null
    });

    try {
      let grandTotalInserted = 0;

      for (const target of targets) {
        if (isCancelledRef.current) break;

        setProgress(prev => ({
          ...prev,
          currentSubject: target.label,
          statusMessage: `Fetching ${target.label} question pack from /data/${target.subject}_pyqs.json...`
        }));

        const response = await fetch(target.path);
        if (!response.ok) {
          throw new Error(`Failed to load ${target.label} pack (${response.status} ${response.statusText})`);
        }

        const questions: QuestionRecord[] = await response.json();
        if (!Array.isArray(questions)) {
          throw new Error(`Invalid JSON format in ${target.label} pack: expected array.`);
        }

        const count = await ingestQuestionsInChunks(questions, target.label);
        grandTotalInserted += count;
      }

      setProgress({
        isSyncing: false,
        currentSubject: 'Complete',
        processedCount: grandTotalInserted,
        totalCount: grandTotalInserted,
        percentage: 100,
        statusMessage: `All ${grandTotalInserted.toLocaleString()} questions cached successfully in IndexedDB!`,
        error: null
      });

      onComplete?.();
    } catch (err: any) {
      console.error('[Sync Error]', err);
      setProgress(prev => ({
        ...prev,
        isSyncing: false,
        error: err.message || 'Failed to sync questions'
      }));
    }
  }, [ingestQuestionsInChunks, onComplete]);

  /**
   * Manual File Drop: Parse dropped JSON file and stream into IndexedDB
   */
  const importDroppedFile = useCallback(async (file: File) => {
    isCancelledRef.current = false;

    if (!file.name.endsWith('.json')) {
      setProgress(prev => ({ ...prev, error: 'Please upload a valid .json dataset file.' }));
      return;
    }

    setProgress({
      isSyncing: true,
      currentSubject: file.name,
      processedCount: 0,
      totalCount: 0,
      percentage: 0,
      statusMessage: `Reading ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`,
      error: null
    });

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      let questionsArray: QuestionRecord[] = [];
      if (Array.isArray(parsed)) {
        questionsArray = parsed;
      } else if (parsed && Array.isArray(parsed.questions)) {
        questionsArray = parsed.questions;
      } else {
        throw new Error('JSON missing questions array.');
      }

      const inserted = await ingestQuestionsInChunks(questionsArray, file.name.replace('.json', ''));

      setProgress({
        isSyncing: false,
        currentSubject: 'Complete',
        processedCount: inserted,
        totalCount: inserted,
        percentage: 100,
        statusMessage: `Imported ${inserted.toLocaleString()} questions from ${file.name}!`,
        error: null
      });

      onComplete?.();
    } catch (err: any) {
      console.error('[Import Error]', err);
      setProgress(prev => ({
        ...prev,
        isSyncing: false,
        error: err.message || 'Failed to parse JSON file'
      }));
    }
  }, [ingestQuestionsInChunks, onComplete]);

  const cancelSync = useCallback(() => {
    isCancelledRef.current = true;
    setProgress(prev => ({
      ...prev,
      isSyncing: false,
      statusMessage: 'Sync cancelled by user.'
    }));
  }, []);

  const clearAllQuestions = useCallback(async () => {
    await db.questions.clear();
    onComplete?.();
  }, [onComplete]);

  return {
    progress,
    syncLocalQuestionLibrary,
    importDroppedFile,
    cancelSync,
    clearAllQuestions
  };
}

export default useQuestionLoader;
