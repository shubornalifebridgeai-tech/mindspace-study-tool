import { translations } from './translations';

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
}

export interface Tab {
    id: 'help' | 'input' | 'notes' | 'flashcards' | 'quizzes' | 'studyBuddy' | 'saved';
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