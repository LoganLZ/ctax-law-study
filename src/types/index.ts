export type Importance = 'high' | 'normal';
export type QuestionType = 'single' | 'multi' | 'judge';

export interface KnowledgePoint {
  id: string;
  sectionId: string;
  title: string;
  content: string;
  importance: Importance;
  relatedQuestionIds: string[];
}

export interface Section {
  id: string;
  number: number;
  title: string;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  expectedScore: string;
  sections: Section[];
  knowledgePoints: KnowledgePoint[];
}

export interface Question {
  id: string;
  chapterId: string;
  sectionId: string;
  number: string;
  type: QuestionType;
  question: string;
  options: string[];
  answer: number | number[];
  analysis: string;
  relatedKpId: string;
}

export interface StudyData {
  completedKps: string[];
  completedQuestions: string[];
  wrongBook: WrongItem[];
  sm2Cards: Record<string, SM2Card>;
  stats: {
    totalCorrect: number;
    totalWrong: number;
    lastStudyDate: string;
  };
}

export interface WrongItem {
  questionId: string;
  timestamp: number;
  reviewedCount: number;
}

export interface SM2Card {
  questionId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  lastReviewDate: string;
}
