import type { Chapter, Question, KnowledgePoint } from '../types';

let chapters: Chapter[] = [];
let questions: Question[] = [];

export function setData(ch: Chapter[], qs: Question[]) {
  chapters = ch;
  questions = qs;
}

export function getChapters(): Chapter[] { return chapters; }

export function getChapterById(id: string): Chapter | undefined {
  return chapters.find(c => c.id === id);
}

export function getQuestions(): Question[] { return questions; }

export function getQuestionById(id: string): Question | undefined {
  return questions.find(q => q.id === id);
}

export function getQuestionsByChapter(chapterId: string): Question[] {
  return questions.filter(q => q.chapterId === chapterId);
}

export function getQuestionsBySection(sectionId: string): Question[] {
  return questions.filter(q => q.sectionId === sectionId);
}

export function getKpById(kpId: string): KnowledgePoint | undefined {
  for (const ch of chapters) {
    for (const _sec of ch.sections) {
      const kp = ch.knowledgePoints.find(k => k.id === kpId);
      if (kp) return kp;
    }
  }
  return undefined;
}

export function getSectionById(sectionId: string): { section: { id: string; title: string }; chapterId: string } | undefined {
  for (const ch of chapters) {
    const sec = ch.sections.find(s => s.id === sectionId);
    if (sec) return { section: sec, chapterId: ch.id };
  }
  return undefined;
}
