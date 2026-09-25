/**
 * IndexedDB integration via Dexie.js for MarksJEE
 * True offline-first storage for questions, user attempts, bookmarks, notes, and mock tests.
 */

import Dexie, { type Table } from 'dexie';
import { 
  Question, 
  UserProgress, 
  TestSession, 
  QuestionFilters, 
  QuestionAttemptStatus,
  OfflineBundle,
  FullUserBackup,
  Subject
} from '../types/question';
import { INITIAL_QUESTIONS } from '../data/initialQuestions';

export class JEEDatabase extends Dexie {
  questions!: Table<Question, string>;
  userProgress!: Table<UserProgress, string>;
  testSessions!: Table<TestSession, string>;
  customPacks!: Table<{ id: string; name: string; importedAt: string; count: number }, string>;

  constructor() {
    super('MarksJEEDatabase');
    
    this.version(1).stores({
      questions: 'id, subject, subSubject, chapterId, year, examType, questionType, difficulty, [subject+chapterId]',
      userProgress: 'questionId, status, isBookmarked, isCorrect, lastAttemptedAt',
      testSessions: 'id, examType, completedAt, score',
      customPacks: 'id, name, importedAt'
    });
  }
}

export const db = new JEEDatabase();

/**
 * Initializes database and seeds initial questions if table is empty
 */
export async function initializeDatabase(): Promise<void> {
  const count = await db.questions.count();
  if (count === 0) {
    await db.questions.bulkPut(INITIAL_QUESTIONS);
    console.log(`[IndexedDB] Seeded ${INITIAL_QUESTIONS.length} initial JEE questions.`);
  }
}

/**
 * Fetches filtered questions with combined user progress state
 */
export async function getFilteredQuestions(filters: Partial<QuestionFilters> = {}): Promise<Array<Question & { progress?: UserProgress }>> {
  let query = db.questions.toCollection();

  // Primary indexed filtering where applicable
  if (filters.subject && filters.subject !== 'all') {
    if (filters.chapterId && filters.chapterId !== 'all') {
      query = db.questions.where('[subject+chapterId]').equals([filters.subject, filters.chapterId]);
    } else {
      query = db.questions.where('subject').equals(filters.subject);
    }
  } else if (filters.chapterId && filters.chapterId !== 'all') {
    query = db.questions.where('chapterId').equals(filters.chapterId);
  }

  let questions = await query.toArray();

  // In-memory filter passes for secondary criteria
  if (filters.examType && filters.examType !== 'all') {
    questions = questions.filter(q => q.examType === filters.examType);
  }
  if (filters.year && filters.year !== 'all') {
    questions = questions.filter(q => q.year === Number(filters.year));
  }
  if (filters.questionType && filters.questionType !== 'all') {
    questions = questions.filter(q => q.questionType === filters.questionType);
  }
  if (filters.difficulty && filters.difficulty !== 'all') {
    questions = questions.filter(q => q.difficulty === filters.difficulty);
  }
  if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
    const qLower = filters.searchQuery.toLowerCase().trim();
    questions = questions.filter(q => 
      q.questionText.toLowerCase().includes(qLower) ||
      q.chapterName.toLowerCase().includes(qLower) ||
      (q.topic && q.topic.toLowerCase().includes(qLower)) ||
      q.session.toLowerCase().includes(qLower)
    );
  }

  // Fetch all user progress mappings
  const allProgress = await db.userProgress.toArray();
  const progressMap = new Map<string, UserProgress>();
  for (const p of allProgress) {
    progressMap.set(p.questionId, p);
  }

  // Merge questions with user progress
  let results = questions.map(q => ({
    ...q,
    progress: progressMap.get(q.id)
  }));

  // Status & Bookmark filtering
  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'bookmarked') {
      results = results.filter(r => r.progress?.isBookmarked);
    } else if (filters.status === 'unattempted') {
      results = results.filter(r => !r.progress || r.progress.status === 'unattempted');
    } else {
      results = results.filter(r => r.progress?.status === filters.status);
    }
  }

  return results;
}

/**
 * Toggle bookmark state for a question
 */
export async function toggleQuestionBookmark(questionId: string): Promise<boolean> {
  const existing = await db.userProgress.get(questionId);
  const newBookmarked = existing ? !existing.isBookmarked : true;

  if (existing) {
    await db.userProgress.update(questionId, {
      isBookmarked: newBookmarked,
      lastAttemptedAt: new Date().toISOString()
    });
  } else {
    await db.userProgress.put({
      questionId,
      status: 'unattempted',
      timeSpentSeconds: 0,
      isBookmarked: newBookmarked,
      lastAttemptedAt: new Date().toISOString()
    });
  }

  return newBookmarked;
}

/**
 * Save user answer response
 */
export async function saveQuestionAttempt(
  questionId: string, 
  userAnswer: string | string[] | Record<string, string[]>, 
  isCorrect: boolean, 
  timeSpentSeconds: number,
  status: QuestionAttemptStatus = 'attempted'
): Promise<UserProgress> {
  const existing = await db.userProgress.get(questionId);
  const updatedProgress: UserProgress = {
    questionId,
    userAnswer,
    isCorrect,
    status,
    timeSpentSeconds: (existing?.timeSpentSeconds || 0) + timeSpentSeconds,
    isBookmarked: existing?.isBookmarked ?? false,
    notes: existing?.notes,
    lastAttemptedAt: new Date().toISOString()
  };

  await db.userProgress.put(updatedProgress);
  return updatedProgress;
}

/**
 * Update personal notes for a question
 */
export async function saveQuestionNote(questionId: string, notes: string): Promise<void> {
  const existing = await db.userProgress.get(questionId);
  if (existing) {
    await db.userProgress.update(questionId, { notes });
  } else {
    await db.userProgress.put({
      questionId,
      status: 'unattempted',
      timeSpentSeconds: 0,
      isBookmarked: false,
      notes,
      lastAttemptedAt: new Date().toISOString()
    });
  }
}

/**
 * Clear answer for a single question
 */
export async function clearQuestionAttempt(questionId: string): Promise<void> {
  const existing = await db.userProgress.get(questionId);
  if (existing) {
    await db.userProgress.update(questionId, {
      userAnswer: undefined,
      isCorrect: null,
      status: 'unattempted'
    });
  }
}

/**
 * Reset progress for all questions in a given chapter
 */
export async function resetChapterProgress(chapterId: string): Promise<void> {
  const chapterQuestions = await db.questions.where('chapterId').equals(chapterId).toArray();
  const qIds = chapterQuestions.map(q => q.id);
  for (const qId of qIds) {
    const existing = await db.userProgress.get(qId);
    if (existing) {
      await db.userProgress.update(qId, {
        userAnswer: undefined,
        isCorrect: null,
        status: 'unattempted',
        timeSpentSeconds: 0
      });
    }
  }
}

/**
 * Reset entire user history (attempts, mock tests, bookmarks)
 */
export async function resetAllUserData(): Promise<void> {
  await db.userProgress.clear();
  await db.testSessions.clear();
}

/**
 * Restore questions to initial seed
 */
export async function restoreInitialSeedQuestions(): Promise<void> {
  await db.questions.clear();
  await db.questions.bulkPut(INITIAL_QUESTIONS);
}

/**
 * Ingest offline question pack JSON
 */
export async function importQuestionBundle(bundle: OfflineBundle): Promise<{ importedCount: number }> {
  if (!bundle || !Array.isArray(bundle.questions)) {
    throw new Error('Invalid bundle format: "questions" array is missing.');
  }

  await db.questions.bulkPut(bundle.questions);
  
  // Register pack
  await db.customPacks.put({
    id: `pack-${Date.now()}`,
    name: bundle.name || `Question Pack (${bundle.questions.length} questions)`,
    importedAt: new Date().toISOString(),
    count: bundle.questions.length
  });

  return { importedCount: bundle.questions.length };
}

/**
 * Export full backup containing all questions, user attempts, and mock tests
 */
export async function exportFullBackup(): Promise<FullUserBackup> {
  const questions = await db.questions.toArray();
  const userProgress = await db.userProgress.toArray();
  const testSessions = await db.testSessions.toArray();

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    questions,
    userProgress,
    testSessions
  };
}

/**
 * Restore full backup
 */
export async function restoreFullBackup(backup: FullUserBackup): Promise<void> {
  if (!backup || !Array.isArray(backup.questions)) {
    throw new Error('Invalid backup file format.');
  }

  await db.questions.bulkPut(backup.questions);
  if (Array.isArray(backup.userProgress)) {
    await db.userProgress.bulkPut(backup.userProgress);
  }
  if (Array.isArray(backup.testSessions)) {
    await db.testSessions.bulkPut(backup.testSessions);
  }
}

/**
 * Save test session
 */
export async function saveTestSession(session: TestSession): Promise<void> {
  await db.testSessions.put(session);
}

/**
 * Get all mock test sessions
 */
export async function getAllTestSessions(): Promise<TestSession[]> {
  return await db.testSessions.orderBy('startedAt').reverse().toArray();
}

/**
 * Computes aggregated statistics for dashboard
 */
export async function getAggregatedStats(): Promise<{
  totalQuestions: number;
  attemptedQuestions: number;
  correctQuestions: number;
  accuracy: number;
  totalTimeSeconds: number;
  bookmarkedCount: number;
  subjectStats: Record<Subject, { total: number; attempted: number; correct: number }>;
}> {
  const allQuestions = await db.questions.toArray();
  const allProgress = await db.userProgress.toArray();

  const progressMap = new Map<string, UserProgress>();
  for (const p of allProgress) {
    progressMap.set(p.questionId, p);
  }

  let attempted = 0;
  let correct = 0;
  let totalTime = 0;
  let bookmarked = 0;

  const subjectStats: Record<Subject, { total: number; attempted: number; correct: number }> = {
    physics: { total: 0, attempted: 0, correct: 0 },
    chemistry: { total: 0, attempted: 0, correct: 0 },
    mathematics: { total: 0, attempted: 0, correct: 0 }
  };

  for (const q of allQuestions) {
    if (subjectStats[q.subject]) {
      subjectStats[q.subject].total++;
    }

    const p = progressMap.get(q.id);
    if (p) {
      if (p.isBookmarked) bookmarked++;
      totalTime += p.timeSpentSeconds || 0;
      if (p.status === 'attempted' || p.status === 'marked_and_attempted') {
        attempted++;
        if (subjectStats[q.subject]) {
          subjectStats[q.subject].attempted++;
        }
        if (p.isCorrect) {
          correct++;
          if (subjectStats[q.subject]) {
            subjectStats[q.subject].correct++;
          }
        }
      }
    }
  }

  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

  return {
    totalQuestions: allQuestions.length,
    attemptedQuestions: attempted,
    correctQuestions: correct,
    accuracy,
    totalTimeSeconds: totalTime,
    bookmarkedCount: bookmarked,
    subjectStats
  };
}
