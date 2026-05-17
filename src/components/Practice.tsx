import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, BookOpen, Trophy } from 'lucide-react';
import { getQuestionById, getChapterById, getKpById } from '../utils/data';
import { useStudyData } from '../hooks/useStudyData';
import type { Question } from '../types';

export default function Practice() {
  const { type } = useParams<{ type: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { recordAnswer, markKnowledgePointCompleted } = useStudyData();

  // Determine mode: kp/:kpId, chapter/:chId, or question/:qId
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | number[] | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isMultiSelected, setIsMultiSelected] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState<{ correct: number; wrong: number }>({ correct: 0, wrong: 0 });

  const currentQuestion = questions[currentIndex];

  // Load questions based on mode
  useEffect(() => {
    let qs: Question[] = [];

    if (type === 'kp' && searchParams.has('kpId')) {
      const kpId = searchParams.get('kpId');
      const kp = kpId ? getKpById(kpId) : undefined;
      if (kp) {
        qs = kp.relatedQuestionIds
          .map(qId => getQuestionById(qId))
          .filter((q): q is Question => q !== undefined);
      }
    } else if (type === 'chapter' && searchParams.has('chId')) {
      const chId = searchParams.get('chId');
      const ch = chId ? getChapterById(chId) : undefined;
      if (ch) {
        qs = ch.knowledgePoints
          .flatMap(kp => kp.relatedQuestionIds.map(qId => getQuestionById(qId)).filter((q): q is Question => q !== undefined));
      }
    } else if (type === 'q' && searchParams.has('questionId')) {
      const qId = searchParams.get('questionId');
      const q = qId ? getQuestionById(qId) : undefined;
      if (q) qs = [q];
    }

    // Shuffle questions for randomization
    const shuffled = [...qs].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsMultiSelected(false);
    setCompleted(false);
    setResults({ correct: 0, wrong: 0 });
  }, [type, searchParams]);

  const isAnswerCorrect = useCallback((): boolean => {
    if (!currentQuestion || selectedAnswer === null) return false;

    const expected = currentQuestion.answer;
    if (Array.isArray(expected)) {
      if (!Array.isArray(selectedAnswer)) return false;
      const expectedSorted = [...expected].sort();
      const selectedSorted = [...selectedAnswer].sort();
      return JSON.stringify(expectedSorted) === JSON.stringify(selectedSorted);
    }
    return selectedAnswer === expected;
  }, [currentQuestion, selectedAnswer]);

  const handleSelect = (optionIndex: number) => {
    if (showResult) return;

    if (currentQuestion.type === 'multi') {
      if (isMultiSelected) return;
      setSelectedAnswer([optionIndex]);
    } else {
      setSelectedAnswer(optionIndex);
      // Single choice and judge: submit immediately
      const correct = isAnswerCorrect();
      recordAnswer(currentQuestion.id, correct);
      setResults(prev => ({
        correct: prev.correct + (correct ? 1 : 0),
        wrong: prev.wrong + (correct ? 0 : 1),
      }));
      setShowResult(true);

      // Mark knowledge point as completed
      if (currentQuestion.relatedKpId) {
        markKnowledgePointCompleted(currentQuestion.relatedKpId);
      }
    }
  };

  const handleMultiConfirm = () => {
    if (!selectedAnswer || (Array.isArray(selectedAnswer) && selectedAnswer.length === 0)) return;
    const correct = isAnswerCorrect();
    recordAnswer(currentQuestion.id, correct);
    setResults(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1),
    }));
    setShowResult(true);

    if (currentQuestion.relatedKpId) {
      markKnowledgePointCompleted(currentQuestion.relatedKpId);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsMultiSelected(false);
    } else {
      setCompleted(true);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
        暂无练习题，请先学习知识点
      </div>
    );
  }

  if (completed) {
    return (
      <div className="card p-6 text-center animate-enter">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 gold-shimmer">
          <Trophy className="w-7 h-7" style={{ color: '#fff' }} />
        </div>
        <h2 className="text-xl font-bold font-display mb-2" style={{ color: 'var(--color-primary-dark)' }}>练习完成！</h2>
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
          <div className="text-2xl" style={{ color: 'var(--color-border)' }}>|</div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>{results.correct + results.wrong > 0 ? Math.round(results.correct / (results.correct + results.wrong) * 100) : 0}%</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>正确率</div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/chapters')}
            className="flex-1 py-2.5 text-sm font-medium btn-outline"
          >
            返回章节
          </button>
          <button
            onClick={() => navigate('/wrongbook')}
            className="flex-1 py-2.5 text-sm font-medium btn-danger"
          >
            查看错题本
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="flex items-center justify-between text-sm animate-enter" style={{ color: 'var(--color-text-secondary)' }}>
        <span>
          第 {currentIndex + 1}/{questions.length} 题
        </span>
        <span className="badge-ink text-xs px-2 py-0.5 rounded">
          {currentQuestion.type === 'single' ? '单选题' : currentQuestion.type === 'multi' ? '多选题' : '判断题'}
        </span>
      </div>
      <div className="progress-bar animate-enter">
        <div
          className="progress-bar-fill progress-bar-fill-gold"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="card p-4 animate-enter-delay-1">
        <div className="flex items-center gap-2 mb-3">
          <span className="badge-ink text-xs px-2 py-0.5 rounded font-mono">
            {currentQuestion.number}
          </span>
        </div>
        <p className="text-base mb-4 leading-relaxed" style={{ color: 'var(--color-text)' }}>{currentQuestion.question}</p>

        {/* Options */}
        <div className="space-y-2">
          {currentQuestion.options.map((option: string, idx: number) => {
            const letters = 'ABCD';
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

        {/* Multi-confirm button */}
        {currentQuestion.type === 'multi' && selectedAnswer !== null && !showResult && (
          <button
            onClick={handleMultiConfirm}
            className="mt-4 w-full py-2.5 btn-primary text-sm font-medium"
          >
            确认答案
          </button>
        )}

        {/* Analysis */}
        {showResult && currentQuestion.analysis && (
          <div className="mt-4 p-3 card-warm rounded-lg">
            <h4 className="text-sm font-semibold mb-1 font-display" style={{ color: 'var(--color-primary-dark)' }}>解析</h4>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{currentQuestion.analysis}</p>
          </div>
        )}

        {/* Related Knowledge Point Link */}
        {showResult && currentQuestion.relatedKpId && (
          <button
            onClick={() => navigate(`/kp/${currentQuestion.relatedKpId}`)}
            className="mt-3 w-full flex items-center justify-center gap-1 text-sm font-medium btn-ghost py-2"
          >
            <BookOpen className="w-3.5 h-3.5" />
            查看相关知识点
          </button>
        )}

        {/* Next Button */}
        {showResult && (
          <button
            onClick={handleNext}
            className="mt-3 w-full py-2.5 btn-primary text-sm font-medium flex items-center justify-center gap-1"
          >
            {currentIndex < questions.length - 1 ? '下一题' : '查看结果'}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}