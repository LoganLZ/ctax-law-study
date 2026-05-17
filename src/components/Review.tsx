import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, BookOpen, RefreshCw } from 'lucide-react';
import { getQuestionById } from '../utils/data';
import { useStudyData } from '../hooks/useStudyData';
import { getTodayReviewCards } from '../utils/sm2';

export default function Review() {
  const navigate = useNavigate();
  const { data, recordAnswer, markKnowledgePointCompleted } = useStudyData();
  const todayCards = getTodayReviewCards(data.sm2Cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | number[] | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState<{ correct: number; wrong: number }>({ correct: 0, wrong: 0 });

  // Filter to only cards that still have questions (some may have been deleted)
  const validCards = todayCards.filter(c => getQuestionById(c.questionId));

  // Sync currentIndex when cards change (e.g. questions deleted mid-review)
  useEffect(() => {
    if (currentIndex >= validCards.length && validCards.length > 0) {
      setCurrentIndex(validCards.length - 1);
    } else if (validCards.length === 0) {
      setCompleted(true);
    }
  }, [validCards.length, currentIndex]);

  const currentCard = validCards[currentIndex];
  const currentQuestion = currentCard ? getQuestionById(currentCard.questionId) : undefined;

  const isAnswerCorrect = () => {
    if (!currentQuestion || selectedAnswer === null) return false;
    const expected = currentQuestion.answer;
    if (Array.isArray(expected)) {
      if (!Array.isArray(selectedAnswer)) return false;
      const expectedSorted = [...expected].sort();
      const selectedSorted = [...selectedAnswer].sort();
      return JSON.stringify(expectedSorted) === JSON.stringify(selectedSorted);
    }
    return selectedAnswer === expected;
  };

  const handleSelect = (optionIndex: number) => {
    if (showResult || !currentQuestion) return;
    if (currentQuestion.type === 'single' || currentQuestion.type === 'judge') {
      setSelectedAnswer(optionIndex);
      const correct = isAnswerCorrect();
      handleRecordAnswer(correct);
      setShowResult(true);
    } else {
      setSelectedAnswer([optionIndex]);
    }
  };

  const handleMultiConfirm = () => {
    if (selectedAnswer === null) return;
    const correct = isAnswerCorrect();
    handleRecordAnswer(correct);
    setShowResult(true);
  };

  const handleRecordAnswer = (correct: boolean) => {
    if (!currentQuestion) return;
    recordAnswer(currentQuestion.id, correct);
    setResults(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1),
    }));
    // Mark knowledge point as completed when answered correctly
    if (correct && currentQuestion.relatedKpId) {
      markKnowledgePointCompleted(currentQuestion.relatedKpId);
    }
  };

  const handleNext = () => {
    if (validCards.length === 0) {
      setCompleted(true);
      return;
    }
    // Adjust currentIndex if it went out of bounds
    const safeIndex = Math.min(currentIndex, validCards.length - 1);
    if (safeIndex < validCards.length - 1) {
      setCurrentIndex(prev => Math.min(prev + 1, validCards.length - 1));
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setCompleted(true);
    }
  };

  if (validCards.length === 0) {
    return (
      <div className="text-center py-16 animate-enter">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--color-success-light)' }}
        >
          <BookOpen className="w-8 h-8" style={{ color: 'var(--color-success)' }} />
        </div>
        <h2 className="text-xl font-bold font-display mb-2" style={{ color: 'var(--color-primary-dark)' }}>暂无今日复习任务</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>继续学习新内容吧！学过的题目会在遗忘曲线上安排复习。</p>
        <button
          onClick={() => navigate('/chapters')}
          className="px-6 py-2.5 btn-primary text-sm font-medium"
        >
          去学习
        </button>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>
        暂无数据
      </div>
    );
  }

  if (completed) {
    return (
      <div className="card p-6 text-center animate-enter">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--color-gold-light)' }}>
          <RefreshCw className="w-7 h-7" style={{ color: 'var(--color-gold)' }} />
        </div>
        <h2 className="text-xl font-bold font-display mb-2" style={{ color: 'var(--color-primary-dark)' }}>复习完成！</h2>
        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>{results.correct}</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>正确</div>
          </div>
          <div className="text-2xl" style={{ color: 'var(--color-border)' }}>|</div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-danger)' }}>{results.wrong}</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>错误</div>
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 btn-primary text-sm font-medium"
        >
          返回首页
        </button>
      </div>
    );
  }

  const letters = 'ABCD';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between animate-enter">
        <h2 className="text-lg font-bold font-display" style={{ color: 'var(--color-primary-dark)' }}>智能复习</h2>
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{currentIndex + 1}/{validCards.length}</span>
      </div>

      {/* Progress */}
      <div className="progress-bar animate-enter">
        <div
          className="progress-bar-fill progress-bar-fill-gold"
          style={{ width: `${((currentIndex + 1) / validCards.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="card p-4 animate-enter-delay-1">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-gold" />
          <span className="badge-ink text-xs px-2 py-0.5 rounded font-mono">
            {currentQuestion.number} · 复习
          </span>
        </div>
        <p className="text-base mb-4 leading-relaxed" style={{ color: 'var(--color-text)' }}>{currentQuestion.question}</p>

        <div className="space-y-2">
          {currentQuestion.options.map((option: string, idx: number) => {
            const isCorrectAnswer = Array.isArray(currentQuestion.answer)
              ? currentQuestion.answer.includes(idx)
              : currentQuestion.answer === idx;
            const isSelected = Array.isArray(selectedAnswer)
              ? selectedAnswer.includes(idx)
              : selectedAnswer === idx;

            // Determine option class
            let optionClass = 'option-default';
            if (showResult) {
              if (isCorrectAnswer) {
                optionClass = 'option-correct';
              } else if (isSelected && !isCorrectAnswer) {
                optionClass = 'option-wrong';
              } else {
                optionClass = 'option-muted';
              }
            } else if (selectedAnswer !== null && isSelected) {
              optionClass = 'option-selected';
            }

            // Determine letter circle style
            let circleStyle: React.CSSProperties = {
              background: 'var(--color-primary-light)',
              color: 'var(--color-text-muted)',
            };
            let circleContent = letters[idx];

            if (showResult) {
              if (isCorrectAnswer) {
                circleStyle = { background: 'var(--color-success)', color: '#fff' };
                circleContent = '\u2713';
              } else if (isSelected) {
                circleStyle = { background: 'var(--color-danger)', color: '#fff' };
                circleContent = '\u2717';
              }
            } else if (isSelected) {
              circleStyle = { background: 'var(--color-primary-dark)', color: '#fff' };
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={showResult}
                className={`w-full text-left p-3 flex items-start gap-3 transition-all ${optionClass}`}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={circleStyle}
                >
                  {circleContent}
                </span>
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{option}</span>
              </button>
            );
          })}
        </div>

        {currentQuestion.type === 'multi' && selectedAnswer !== null && !showResult && (
          <button onClick={handleMultiConfirm} className="mt-4 w-full py-2.5 btn-primary text-sm font-medium">
            确认答案
          </button>
        )}

        {showResult && currentQuestion.analysis && (
          <div className="mt-4 p-3 card-warm rounded-lg">
            <h4 className="text-sm font-semibold mb-1 font-display" style={{ color: 'var(--color-primary-dark)' }}>解析</h4>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{currentQuestion.analysis}</p>
          </div>
        )}

        {showResult && currentQuestion.relatedKpId && (
          <button
            onClick={() => navigate(`/kp/${currentQuestion.relatedKpId}`)}
            className="mt-3 w-full flex items-center justify-center gap-1 text-sm font-medium btn-ghost py-2"
          >
            <BookOpen className="w-3.5 h-3.5" />
            查看相关知识点
          </button>
        )}

        {showResult && (
          <button
            onClick={handleNext}
            className="mt-3 w-full py-2.5 btn-primary text-sm font-medium flex items-center justify-center gap-1"
          >
            {currentIndex < validCards.length - 1 ? '下一题' : '查看结果'}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}