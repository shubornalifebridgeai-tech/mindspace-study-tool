import { translations } from './utils/translations';

export type TranslationKey = keyof typeof translations.en;

export interface Flashcard {
  question: string;
  answer: string;
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
}

export interface MindMapNode {
  id: string;
  concept: string;
  subConcepts?: MindMapNode[];
  // --- New Customization Properties ---
  color?: string; // e.g., 'fill-red-200/80 dark:fill-red-800/60'
  textColor?: string; // e.g., 'fill-red-900 dark:fill-red-100'
  isBold?: boolean;
  isItalic?: boolean;
  x?: number; // Manual x position override
  y?: number; // Manual y position override
}

// FIX: Define and export PositionedNode to make it available globally. This resolves the import error in MindMapNode.tsx.
export interface PositionedNode extends MindMapNode {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    textColor: string;
    isRoot: boolean;
    level: number;
}

export interface StudyData {
  summary?: string;
  keyInsight?: string;
  mindMap?: MindMapNode[];
  flashcards?: Flashcard[];
  quiz?: QuizQuestion[];
}

export interface SavedNote {
  id: string;
  title: string;
  createdAt: string; 
  data: StudyData;
  chatHistory?: ChatMessage[];
}

export interface Tab {
    id: 'help' | 'input' | 'notes' | 'flashcards' | 'quizzes' | 'studyStreak' | 'clarityAi' | 'saved';
    labelKey: TranslationKey;
    tooltipKey: TranslationKey;
}

export interface GenerationOptions {
    generateSummary: boolean;
    generateMindMap: boolean;
    generateFlashcards: boolean;
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

export interface User {
    name: string;
    email: string;
    picture: string;
}

export interface StudyStreakData {
    currentStreak: number;
    longestStreak: number;
    lastStudyDate: string | null; // YYYY-MM-DD
    studyDays: string[]; // Array of YYYY-MM-DD
}