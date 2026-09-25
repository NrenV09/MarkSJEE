/**
 * MarksJEE - Domain Types & Data Contracts
 * Offline-first JEE Main & Advanced Practice Platform
 */

export type Subject = 'physics' | 'chemistry' | 'mathematics';

export type SubSubject = 
  | 'mechanics' 
  | 'electrodynamics' 
  | 'optics_modern' 
  | 'thermodynamics_waves'
  | 'physical' 
  | 'organic' 
  | 'inorganic'
  | 'calculus' 
  | 'algebra' 
  | 'coordinate_geometry' 
  | 'vectors_3d';

export type ExamType = 'JEE Main' | 'JEE Advanced';

export type QuestionType = 
  | 'single_choice' 
  | 'multi_correct' 
  | 'numerical' 
  | 'matrix_match';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type QuestionAttemptStatus = 
  | 'unattempted' 
  | 'attempted' 
  | 'marked_for_review' 
  | 'marked_and_attempted';

export interface Option {
  id: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
}

export interface MatrixRowItem {
  key: string; // 'P', 'Q', 'R', 'S'
  text: string;
}

export interface MatrixColItem {
  key: string; // '1', '2', '3', '4'
  text: string;
}

export interface MatrixMatchData {
  rows: MatrixRowItem[];
  cols: MatrixColItem[];
}

export interface SolutionStep {
  title: string;
  content: string; // Supports LaTeX markdown
}

export interface Solution {
  steps: SolutionStep[];
  finalAnswer: string;
  keyConcepts: string[];
  shortcutMethod?: string;
  commonPitfalls?: string;
}

export interface Question {
  id: string;
  subject: Subject;
  subSubject?: SubSubject;
  chapterId: string;
  chapterName: string;
  topic?: string;
  examType: ExamType;
  year: number;
  session: string; // e.g. "Jan 27 Shift 1", "Paper 1", "Sep 02 Shift 2"
  questionType: QuestionType;
  difficulty: Difficulty;
  questionText: string; // LaTeX supported with $..$ and $$..$$
  options?: Option[]; // for single_choice and multi_correct
  matrixMatchData?: MatrixMatchData; // for matrix_match
  correctAnswer: string | string[] | Record<string, string[]>; 
  // string: 'A' or '12.5'
  // string[]: ['A', 'C'] for multi_correct
  // Record<string, string[]>: { 'P': ['1', '3'], 'Q': ['2'], ... } for matrix match
  numericalTolerance?: number;
  numericalRange?: [number, number]; // [min, max] inclusive
  solution: Solution;
  stats?: {
    totalAttempts: number;
    accuracy: number; // 0 to 100
    averageTimeSeconds: number;
  };
}

export interface UserProgress {
  questionId: string;
  userAnswer?: string | string[] | Record<string, string[]>;
  isCorrect?: boolean | null;
  status: QuestionAttemptStatus;
  timeSpentSeconds: number;
  isBookmarked: boolean;
  notes?: string;
  lastAttemptedAt?: string;
}

export interface TestSession {
  id: string;
  title: string;
  examType: ExamType;
  durationMinutes: number;
  timeRemainingSeconds: number;
  startedAt: string;
  completedAt?: string;
  questionIds: string[];
  responses: Record<string, {
    userAnswer?: string | string[] | Record<string, string[]>;
    status: QuestionAttemptStatus;
    timeSpentSeconds: number;
    isCorrect?: boolean | null;
    scoreAwarded?: number;
  }>;
  score?: number;
  maxScore?: number;
  accuracy?: number;
  subjectSummary?: Record<Subject, {
    total: number;
    attempted: number;
    correct: number;
    score: number;
  }>;
}

export interface Chapter {
  id: string;
  name: string;
  subject: Subject;
  subSubject?: SubSubject;
  totalQuestions: number;
}

export interface QuestionFilters {
  subject: Subject | 'all';
  subSubject?: SubSubject | 'all';
  chapterId?: string | 'all';
  examType?: ExamType | 'all';
  year?: number | 'all';
  questionType?: QuestionType | 'all';
  difficulty?: Difficulty | 'all';
  status?: QuestionAttemptStatus | 'bookmarked' | 'all';
  searchQuery?: string;
}

export interface OfflineBundle {
  version: string;
  exportedAt: string;
  name: string;
  description?: string;
  questions: Question[];
}

export interface FullUserBackup {
  version: string;
  exportedAt: string;
  questions: Question[];
  userProgress: UserProgress[];
  testSessions: TestSession[];
}
