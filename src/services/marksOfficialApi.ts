/**
 * marksOfficialApi.ts
 * Real-time connector to the official MARKS (MathonGo) platform (production.getmarks.app)
 * Allows users to link their MARKS session token to retrieve official JEE PYQs,
 * test series questions, and chapter-wise question banks directly into offline IndexedDB.
 */

import { QuestionRecord } from '../db/db';

const MARKS_API_BASE_V1 = 'https://production.getmarks.app/api/v1';
const MARKS_API_BASE_V4 = 'https://production.getmarks.app/api/v4';

export interface MarksUserProfile {
  id: string;
  name: string;
  email?: string;
  examCategory?: string;
  isPremium?: boolean;
}

export interface MarksExamCategory {
  _id: string;
  title: string;
  icon?: string;
}

export interface MarksFetchResult {
  questions: QuestionRecord[];
  totalAvailable: number;
  hasMore: boolean;
}

/**
 * Validates a user's MARKS JWT token by calling /user/me
 */
export async function verifyMarksSession(token: string): Promise<MarksUserProfile> {
  const cleanToken = token.trim().replace(/^Bearer\s+/i, '');
  if (!cleanToken) {
    throw new Error('Please enter a valid MARKS authentication token.');
  }

  const response = await fetch(`${MARKS_API_BASE_V1}/user/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${cleanToken}`
    }
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    const errorMsg = data?.error?.message || response.statusText || 'Authentication failed';
    throw new Error(`MARKS Auth Error: ${errorMsg}`);
  }

  const user = data.data?.user || data.data;
  return {
    id: user._id || user.id || 'unknown',
    name: user.name || user.firstName || 'MARKS Student',
    email: user.email,
    examCategory: user.examCategory,
    isPremium: Boolean(user.isPremium || user.subscription?.isActive)
  };
}

/**
 * Fetches available exam categories (Engineering / Medical)
 */
export async function fetchMarksCategories(token?: string): Promise<MarksExamCategory[]> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token.trim().replace(/^Bearer\s+/i, '')}`;
  }

  const response = await fetch(`${MARKS_API_BASE_V1}/content/examCategory`, { headers });
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || 'Failed to fetch exam categories');
  }

  return data.data || [];
}

/**
 * Converts a raw question from the official MARKS API into the application's QuestionRecord schema
 */
export function parseMarksQuestionToRecord(
  rawQ: any,
  fallbackSubject: 'physics' | 'chemistry' | 'maths' = 'physics',
  fallbackChapter: string = 'General'
): QuestionRecord {
  const id = String(rawQ._id || rawQ.id || `marks_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

  // Detect subject
  let subject: 'physics' | 'chemistry' | 'maths' = fallbackSubject;
  const rawSub = String(rawQ.subject?.title || rawQ.subjectId || rawQ.subject || '').toLowerCase();
  if (rawSub.includes('phys')) subject = 'physics';
  else if (rawSub.includes('chem')) subject = 'chemistry';
  else if (rawSub.includes('math')) subject = 'maths';

  // Detect chapter
  const chapter = rawQ.chapter?.title || rawQ.chapterTitle || rawQ.chapter || fallbackChapter;

  // Detect paper / year / shift
  const paperTitle = rawQ.previousYearPapers?.[0]?.title || rawQ.paper?.title || rawQ.examShift || '';
  const yearMatch = paperTitle.match(/\b(20[0-2][0-9]|199[0-9])\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : (rawQ.year || 2024);

  // Detect Exam type
  const isAdv = /adv|advanced/i.test(paperTitle) || /adv|advanced/i.test(rawQ.exam?.title || '');
  const examType: 'JEE Main' | 'JEE Advanced' = isAdv ? 'JEE Advanced' : 'JEE Main';

  // Detect Question Type
  let type: 'single_choice' | 'multi_correct' | 'numerical' | 'matrix_match' = 'single_choice';
  const rawType = String(rawQ.type || '').toUpperCase();
  if (rawType.includes('MULTIPLE') || rawType === 'MULTIPLE_CORRECT') {
    type = 'multi_correct';
  } else if (rawType.includes('NUMERICAL') || rawType === 'NUMERICAL') {
    type = 'numerical';
  } else if (rawType.includes('MATRIX')) {
    type = 'matrix_match';
  } else {
    type = 'single_choice';
  }

  // Parse options
  let options: Array<{ id: string; text: string }> | undefined = undefined;
  let correctAnswer: string | string[] = 'A';

  if (Array.isArray(rawQ.options) && rawQ.options.length > 0) {
    options = rawQ.options.map((opt: any, idx: number) => {
      const optId = String(opt.id || opt.key || String.fromCharCode(65 + idx));
      return {
        id: optId,
        text: opt.text || opt.title || opt.statement || `Option ${optId}`
      };
    });

    const correctOpts = rawQ.options.filter((opt: any) => opt.isCorrect);
    if (type === 'multi_correct') {
      correctAnswer = correctOpts.length > 0
        ? correctOpts.map((o: any, i: number) => String(o.id || String.fromCharCode(65 + i)))
        : ['A'];
    } else {
      correctAnswer = correctOpts.length > 0
        ? String(correctOpts[0].id || 'A')
        : ((options && options[0]?.id) || 'A');
    }
  } else if (type === 'numerical') {
    correctAnswer = String(
      rawQ.correctValue !== undefined 
        ? rawQ.correctValue 
        : (rawQ.answer !== undefined ? rawQ.answer : '0')
    );
  }

  // Question statement
  const questionText = rawQ.question || rawQ.questionText || rawQ.statement || rawQ.title || 'Question statement unavailable.';

  // Solution
  const solText = rawQ.solution?.text || rawQ.solution || rawQ.explanation || 'Detailed step-by-step solution provided by MARKS.';
  const solution = {
    steps: [
      {
        title: 'Step 1: Concept & Setup',
        content: typeof solText === 'string' ? solText : JSON.stringify(solText)
      }
    ],
    finalAnswer: String(correctAnswer),
    keyConcepts: rawQ.topics ? rawQ.topics.map((t: any) => t.title || t) : [chapter]
  };

  return {
    id,
    subject,
    chapter,
    year,
    examType,
    type,
    difficulty: (rawQ.difficulty || 'Medium') as 'Easy' | 'Medium' | 'Hard',
    session: paperTitle || `${examType} ${year}`,
    questionText,
    options,
    correctAnswer,
    solution
  };
}

/**
 * Fetches questions from official MARKS endpoint for an exam and chapter
 */
export async function fetchMarksChapterQuestions(params: {
  token: string;
  examId?: string;
  subjectId: string;
  chapterId: string;
  limit?: number;
  offset?: number;
}): Promise<MarksFetchResult> {
  const cleanToken = params.token.trim().replace(/^Bearer\s+/i, '');
  const examId = params.examId || '616059730283de43c87e3e22'; // Default JEE Main Exam ID in MARKS
  const limit = params.limit || 25;
  const offset = params.offset || 0;

  const url = `${MARKS_API_BASE_V4}/cpyqb/exam/${examId}/subject/${params.subjectId}/chapter/${params.chapterId}/questions?limit=${limit}&offset=${offset}&platform=web`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${cleanToken}`
    }
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    const errorMsg = json?.error?.message || response.statusText || 'Failed to fetch questions from MARKS';
    throw new Error(errorMsg);
  }

  const rawQuestions: any[] = json.data?.questions || json.data || [];
  const parsed = rawQuestions.map(q => 
    parseMarksQuestionToRecord(
      q, 
      params.subjectId.toLowerCase().includes('chem') ? 'chemistry' : params.subjectId.toLowerCase().includes('math') ? 'maths' : 'physics',
      params.chapterId
    )
  );

  return {
    questions: parsed,
    totalAvailable: json.data?.total || parsed.length,
    hasMore: Boolean(json.data?.hasMore || (offset + parsed.length < (json.data?.total || 0)))
  };
}
