export type CardType = 'term' | 'note' | 'mnemonic';
export type Difficulty = 'unrated' | 'easy' | 'medium' | 'hard';

export interface Card {
  id: string;
  term: string;
  definition: string;
  type: CardType;
  category: string;
  difficulty: Difficulty;
}

// SM-2 spaced repetition state per card
export interface SRState {
  cardId: string;
  easeFactor: number;   // starts at 2.5
  interval: number;     // days until next review
  repetitions: number;
  dueDate: string;      // ISO date string
  lastRating?: SRRating;
}

export type SRRating = 0 | 1 | 2 | 3; // Again=0 Hard=1 Good=2 Easy=3

export interface MasteryState {
  cardId: string;
  status: 'new' | 'learning' | 'mastered';
  correctCount: number;
  incorrectCount: number;
}

export interface QuizResult {
  id: string;
  date: string;
  mode: string;
  score: number;
  total: number;
  categories: Record<string, { correct: number; total: number }>;
}

// Editor overlay — patches on top of cards.json
export type CardPatch = Partial<Omit<Card, 'id'>> & { deleted?: boolean };
export type EditorOverlay = Record<string, CardPatch>;
