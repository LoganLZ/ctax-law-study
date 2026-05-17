import type { SM2Card } from '../types';

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function updateSM2Card(card: SM2Card, quality: number): SM2Card {
  const newCard = { ...card };

  if (quality < 3) {
    newCard.repetitions = 0;
    newCard.interval = 1;
  } else {
    newCard.repetitions++;
    if (newCard.repetitions === 1) newCard.interval = 1;
    else if (newCard.repetitions === 2) newCard.interval = 6;
    else newCard.interval = Math.round(newCard.interval * newCard.easeFactor);
  }

  newCard.easeFactor = Math.max(1.3, newCard.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  newCard.lastReviewDate = formatDate(new Date());
  newCard.nextReviewDate = formatDate(addDays(new Date(), newCard.interval));

  return newCard;
}

export function getTodayReviewQueue(sm2Cards: Record<string, SM2Card>): string[] {
  const today = formatDate(new Date());
  return Object.values(sm2Cards)
    .filter(card => card.nextReviewDate && card.nextReviewDate <= today && card.questionId)
    .map(card => card.questionId!);
}

export function getTodayReviewCards(sm2Cards: Record<string, SM2Card>): { questionId: string; card: SM2Card }[] {
  const today = formatDate(new Date());
  return Object.entries(sm2Cards)
    .filter(([_, card]) => card.nextReviewDate && card.nextReviewDate <= today)
    .map(([questionId, card]) => ({ questionId, card }));
}

export function scheduleForToday(questionId: string, sm2Cards: Record<string, SM2Card>): Record<string, SM2Card> {
  const today = formatDate(new Date());
  const existing = sm2Cards[questionId];
  const newCard: SM2Card = existing
    ? { ...existing, nextReviewDate: today, lastReviewDate: today }
    : {
        questionId,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        nextReviewDate: today,
        lastReviewDate: today,
      };
  return { ...sm2Cards, [questionId]: newCard };
}
