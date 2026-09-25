/**
 * Dexie.js Database Engine for Marks by MathonGo Replica
 * Scaled for 15,000+ questions with compound indexing for instant offline retrieval.
 */

import Dexie, { type Table } from 'dexie';

export interface QuestionRecord {
  id: string;
  subject: 'physics' | 'chemistry' | 'maths';
  chapter: string;
  year: number;
  examType: 'JEE Main' | 'JEE Advanced';
  type: 'single_choice' | 'multi_correct' | 'numerical' | 'matrix_match';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  session?: string;
  questionText: string;
  options?: Array<{ id: string; text: string }>;
  correctAnswer: string | string[] | Record<string, string[]>;
  solution?: {
    steps: Array<{ title: string; content: string }>;
    finalAnswer: string;
    keyConcepts?: string[];
    shortcutMethod?: string;
  };
  stats?: {
    totalAttempts?: number;
    accuracy?: number;
    timeSpentSeconds?: number;
  };
}

export interface UserActivityRecord {
  questionId: string;
  status: 'attempted' | 'skipped' | 'marked_for_review' | 'unattempted';
  selectedOption?: string | string[] | Record<string, string[]>;
  isCorrect?: boolean | null;
  timeSpentSeconds: number;
  isBookmarked: boolean;
  notes?: string;
  timestamp: string;
}

export interface TestSessionRecord {
  testId: string;
  title: string;
  score: number;
  maxScore: number;
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  accuracy: number;
  durationMinutes: number;
  timeTakenSeconds: number;
  subjectBreakdown: Record<string, { total: number; attempted: number; score: number }>;
  timestamp: string;
}

export class MarksJEEDatabase extends Dexie {
  questions!: Table<QuestionRecord, string>;
  userActivity!: Table<UserActivityRecord, string>;
  testSessions!: Table<TestSessionRecord, string>;

  constructor() {
    super('MarksJEEMassiveDB');

    // Version 1 Schema with requested compound indexes for sub-millisecond filtering
    this.version(1).stores({
      questions: 'id, subject, chapter, year, examType, type, difficulty, [subject+chapter], [subject+year], [subject+chapter+year]',
      userActivity: 'questionId, status, isCorrect, isBookmarked, timestamp',
      testSessions: 'testId, title, score, totalQuestions, timestamp'
    });
  }
}

export const db = new MarksJEEDatabase();

/**
 * Filter questions offline using Dexie compound indexes
 */
export async function queryQuestions(filters: {
  subject?: 'physics' | 'chemistry' | 'maths' | 'all';
  chapter?: string | 'all';
  year?: number | 'all';
  examType?: 'JEE Main' | 'JEE Advanced' | 'all';
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'all';
  type?: 'single_choice' | 'multi_correct' | 'numerical' | 'matrix_match' | 'all';
  status?: 'all' | 'attempted' | 'skipped' | 'bookmarked';
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  questions: Array<QuestionRecord & { activity?: UserActivityRecord }>;
  totalMatching: number;
  page: number;
  totalPages: number;
}> {
  const {
    subject = 'all',
    chapter = 'all',
    year = 'all',
    examType = 'all',
    difficulty = 'all',
    type = 'all',
    status = 'all',
    search = '',
    page = 1,
    pageSize = 20
  } = filters;

  let collection;

  // Utilize composite index when both subject and chapter are specified
  if (subject !== 'all' && chapter !== 'all') {
    if (year !== 'all') {
      collection = db.questions.where('[subject+chapter+year]').equals([subject, chapter, Number(year)]);
    } else {
      collection = db.questions.where('[subject+chapter]').equals([subject, chapter]);
    }
  } else if (subject !== 'all' && year !== 'all') {
    collection = db.questions.where('[subject+year]').equals([subject, Number(year)]);
  } else if (subject !== 'all') {
    collection = db.questions.where('subject').equals(subject);
  } else if (chapter !== 'all') {
    collection = db.questions.where('chapter').equals(chapter);
  } else if (year !== 'all') {
    collection = db.questions.where('year').equals(Number(year));
  } else {
    collection = db.questions.toCollection();
  }

  let items = await collection.toArray();

  // Secondary filters
  if (examType !== 'all') {
    items = items.filter(q => q.examType === examType);
  }
  if (difficulty !== 'all') {
    items = items.filter(q => q.difficulty === difficulty);
  }
  if (type !== 'all') {
    items = items.filter(q => q.type === type);
  }
  if (year !== 'all' && (subject === 'all' || chapter !== 'all')) {
    items = items.filter(q => q.year === Number(year));
  }
  if (search.trim()) {
    const qLower = search.toLowerCase().trim();
    items = items.filter(q => 
      q.questionText.toLowerCase().includes(qLower) ||
      q.chapter.toLowerCase().includes(qLower) ||
      (q.session && q.session.toLowerCase().includes(qLower))
    );
  }

  // Activity mapping
  const allActivity = await db.userActivity.toArray();
  const actMap = new Map<string, UserActivityRecord>();
  allActivity.forEach(a => actMap.set(a.questionId, a));

  let combined = items.map(q => ({
    ...q,
    activity: actMap.get(q.id)
  }));

  // Status filtering
  if (status === 'attempted') {
    combined = combined.filter(q => q.activity && q.activity.status === 'attempted');
  } else if (status === 'skipped') {
    combined = combined.filter(q => q.activity && q.activity.status === 'skipped');
  } else if (status === 'bookmarked') {
    combined = combined.filter(q => q.activity && q.activity.isBookmarked);
  }

  const totalMatching = combined.length;
  const totalPages = Math.max(1, Math.ceil(totalMatching / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginated = combined.slice(startIndex, startIndex + pageSize);

  return {
    questions: paginated,
    totalMatching,
    page: safePage,
    totalPages
  };
}

/**
 * Record a user attempt on a question
 */
export async function saveUserAttempt(
  questionId: string,
  selectedOption: string | string[] | Record<string, string[]>,
  isCorrect: boolean,
  timeSpentSeconds: number
): Promise<void> {
  const existing = await db.userActivity.get(questionId);
  await db.userActivity.put({
    questionId,
    status: 'attempted',
    selectedOption,
    isCorrect,
    timeSpentSeconds: (existing?.timeSpentSeconds || 0) + timeSpentSeconds,
    isBookmarked: existing?.isBookmarked || false,
    notes: existing?.notes,
    timestamp: new Date().toISOString()
  });
}

/**
 * Toggle bookmark on a question
 */
export async function toggleBookmark(questionId: string): Promise<boolean> {
  const existing = await db.userActivity.get(questionId);
  const isBookmarked = existing ? !existing.isBookmarked : true;

  if (existing) {
    await db.userActivity.update(questionId, { isBookmarked, timestamp: new Date().toISOString() });
  } else {
    await db.userActivity.put({
      questionId,
      status: 'unattempted',
      isBookmarked: true,
      timeSpentSeconds: 0,
      timestamp: new Date().toISOString()
    });
  }

  return isBookmarked;
}

/**
 * Save custom revision note
 */
export async function saveNote(questionId: string, notes: string): Promise<void> {
  const existing = await db.userActivity.get(questionId);
  if (existing) {
    await db.userActivity.update(questionId, { notes });
  } else {
    await db.userActivity.put({
      questionId,
      status: 'unattempted',
      isBookmarked: false,
      notes,
      timeSpentSeconds: 0,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get distinct chapter list with question counts per subject
 */
export async function getChaptersWithCounts(subject: 'physics' | 'chemistry' | 'maths'): Promise<Array<{ chapter: string; count: number }>> {
  const questions = await db.questions.where('subject').equals(subject).toArray();
  const countsMap = new Map<string, number>();

  questions.forEach(q => {
    countsMap.set(q.chapter, (countsMap.get(q.chapter) || 0) + 1);
  });

  return Array.from(countsMap.entries())
    .map(([chapter, count]) => ({ chapter, count }))
    .sort((a, b) => a.chapter.localeCompare(b.chapter));
}

/**
 * High-performance bulk chunk insert
 */
export async function bulkInsertQuestionsChunk(chunk: QuestionRecord[]): Promise<void> {
  await db.questions.bulkPut(chunk);
}

/**
 * Get overall database stats
 */
export async function getDatabaseStats() {
  const totalQuestions = await db.questions.count();
  const physicsCount = await db.questions.where('subject').equals('physics').count();
  const chemistryCount = await db.questions.where('subject').equals('chemistry').count();
  const mathsCount = await db.questions.where('subject').equals('maths').count();

  const allActivity = await db.userActivity.toArray();
  const attempted = allActivity.filter(a => a.status === 'attempted');
  const correct = attempted.filter(a => a.isCorrect);
  const bookmarked = allActivity.filter(a => a.isBookmarked).length;

  return {
    totalQuestions,
    physicsCount,
    chemistryCount,
    mathsCount,
    attemptedCount: attempted.length,
    correctCount: correct.length,
    accuracy: attempted.length > 0 ? Math.round((correct.length / attempted.length) * 100) : 0,
    bookmarkedCount: bookmarked
  };
}

export default db;
