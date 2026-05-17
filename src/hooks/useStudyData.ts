import { useLocalStorage } from './useLocalStorage';
import type { StudyData } from '../types';
import { updateSM2Card, getTodayReviewCards, scheduleForToday } from '../utils/sm2';
import { getQuestionById } from '../utils/data';

const DEFAULT_DATA: StudyData = {
  completedKps: [],
  completedQuestions: [],
  wrongBook: [],
  sm2Cards: {},
  stats: {
    totalCorrect: 0,
    totalWrong: 0,
    lastStudyDate: '',
  },
};

export function useStudyData() {
  const [data, setData, removeData] = useLocalStorage<StudyData>('ctax_study_data', DEFAULT_DATA);

  const recordAnswer = (questionId: string, correct: boolean) => {
    const today = new Date().toISOString().split('T')[0];
    setData(prev => {
      const newStats = {
        ...prev.stats,
        totalCorrect: prev.stats.totalCorrect + (correct ? 1 : 0),
        totalWrong: prev.stats.totalWrong + (correct ? 0 : 1),
        lastStudyDate: today,
      };

      // 更新 completed questions
      const newCompletedQs = prev.completedQuestions.includes(questionId)
        ? prev.completedQuestions
        : [...prev.completedQuestions, questionId];

      // 更新错题本和 SM2 卡片
      const question = getQuestionById(questionId);
      let newWrongBook = [...prev.wrongBook];
      let newSm2Cards = { ...prev.sm2Cards };

      if (question) {
        if (correct) {
          // 正确：从错题本移除（如果存在），更新 SM2
          newWrongBook = newWrongBook.filter(w => w.questionId !== questionId);
          const existingCard = newSm2Cards[questionId];
          if (existingCard) {
            const updatedCard = updateSM2Card(existingCard, 5);
            newSm2Cards[questionId] = updatedCard;
          } else {
            newSm2Cards[questionId] = {
              questionId,
              easeFactor: 2.5,
              interval: 6,
              repetitions: 2,
              nextReviewDate: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
              lastReviewDate: today,
            };
          }
        } else {
          // 错误：加入错题本
          const existing = newWrongBook.find(w => w.questionId === questionId);
          if (existing) {
            newWrongBook = newWrongBook.map(w =>
              w.questionId === questionId
                ? { ...w, timestamp: Date.now(), reviewedCount: w.reviewedCount + 1 }
                : w
            );
          } else {
            newWrongBook.push({
              questionId,
              timestamp: Date.now(),
              reviewedCount: 0,
            });
          }
          // 创建/更新 SM2 卡片
          const existingCard = newSm2Cards[questionId];
          if (existingCard) {
            const updatedCard = updateSM2Card(existingCard, 0);
            newSm2Cards[questionId] = updatedCard;
          } else {
            newSm2Cards[questionId] = {
              questionId,
              easeFactor: 2.5,
              interval: 1,
              repetitions: 0,
              nextReviewDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
              lastReviewDate: today,
            };
          }
        }
      }

      return {
        ...prev,
        completedQuestions: newCompletedQs,
        wrongBook: newWrongBook,
        sm2Cards: newSm2Cards,
        stats: newStats,
      };
    });
  };

  const markKnowledgePointCompleted = (kpId: string) => {
    setData(prev => ({
      ...prev,
      completedKps: prev.completedKps.includes(kpId) ? prev.completedKps : [...prev.completedKps, kpId],
    }));
  };

  const removeFromWrongBook = (questionId: string) => {
    setData(prev => ({
      ...prev,
      wrongBook: prev.wrongBook.filter(w => w.questionId !== questionId),
      sm2Cards: Object.fromEntries(
        Object.entries(prev.sm2Cards).filter(([id]) => id !== questionId)
      ),
    }));
  };

  const clearWrongBook = () => {
    setData(prev => ({
      ...prev,
      wrongBook: [],
    }));
  };

  const addToTodayReview = (questionId: string) => {
    setData(prev => ({
      ...prev,
      sm2Cards: scheduleForToday(questionId, prev.sm2Cards),
    }));
  };

  const getTodayReviewCount = () => {
    return getTodayReviewCards(data.sm2Cards).length;
  };

  const getProgressStats = () => {
    const totalKps = data.completedKps.length;
    const totalQuestions = data.completedQuestions.length;
    const accuracy = (data.stats.totalCorrect + data.stats.totalWrong) > 0
      ? Math.round((data.stats.totalCorrect / (data.stats.totalCorrect + data.stats.totalWrong)) * 100)
      : 0;
    return { totalKps, totalQuestions, accuracy };
  };

  return {
    data,
    recordAnswer,
    markKnowledgePointCompleted,
    removeFromWrongBook,
    addToTodayReview,
    clearWrongBook,
    getTodayReviewCount,
    getProgressStats,
    resetData: removeData,
  };
}
