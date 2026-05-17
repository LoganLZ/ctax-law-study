import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronRight, CheckCircle2, BookOpen, RotateCcw, Filter, ListChecks } from 'lucide-react';
import { getQuestionById, getKpById } from '../utils/data';
import { useStudyData } from '../hooks/useStudyData';
import { chaptersData } from '../data/chapters';

export default function WrongBook() {
  const navigate = useNavigate();
  const { data, removeFromWrongBook, addToTodayReview, clearWrongBook } = useStudyData();
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [filterChapter, setFilterChapter] = useState<string>('all');

  const wrongQuestions = data.wrongBook.map(w => ({
    ...w,
    question: getQuestionById(w.questionId),
  })).filter(w => w.question);

  // Apply chapter filter
  const filteredQuestions = filterChapter === 'all'
    ? wrongQuestions
    : wrongQuestions.filter(w => w.question?.chapterId === filterChapter);

  // Get available chapters for filter
  const availableChapters = chaptersData.filter(ch =>
    wrongQuestions.some(w => w.question?.chapterId === ch.id)
  );

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between animate-enter">
        <h2 className="text-xl font-bold font-display" style={{ color: 'var(--color-primary-dark)' }}>
          错题本
          <span className="text-sm font-normal ml-2" style={{ color: 'var(--color-text-secondary)' }}>共 {wrongQuestions.length} 道</span>
        </h2>
        <div className="flex items-center gap-2">
          {wrongQuestions.length > 0 && (
            <button
              onClick={() => {
                const count = wrongQuestions.length;
                if (confirm(`将 ${count} 道错题全部加入今日复习吗？`)) {
                  wrongQuestions.forEach(w => addToTodayReview(w.question!.id));
                }
              }}
              className="text-xs flex items-center gap-1 btn-ghost px-2 py-1"
              style={{ color: 'var(--color-primary-dark)' }}
            >
              <ListChecks className="w-3 h-3" />
              全部加入复习
            </button>
          )}
          {wrongQuestions.length > 0 && (
            <button
              onClick={() => {
                if (confirm('确定清空所有错题吗？')) {
                  clearWrongBook();
                }
              }}
              className="text-xs btn-danger px-2 py-1"
            >
              清空
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      {availableChapters.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 animate-enter-delay-1">
          <Filter className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
          <button
            onClick={() => setFilterChapter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              filterChapter === 'all' ? 'btn-primary' : 'btn-outline'
            }`}
          >
            全部
          </button>
          {availableChapters.map(ch => (
            <button
              key={ch.id}
              onClick={() => setFilterChapter(ch.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                filterChapter === ch.id ? 'btn-primary' : 'btn-outline'
              }`}
            >
              第{ch.number}章
            </button>
          ))}
        </div>
      )}

      {/* Wrong Questions List */}
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-16 animate-enter" style={{ color: 'var(--color-text-muted)' }}>
          <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-sm">暂无错题记录</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>做对的题目不会出现在这里</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredQuestions.map(({ question, timestamp, reviewedCount }) => {
            if (!question) return null;
            const detail = showDetail === question.id;
            const kp = question.relatedKpId ? getKpById(question.relatedKpId) : undefined;

            return (
              <div key={question.id} className="card overflow-hidden animate-enter-delay-2" style={{ border: '1.5px solid var(--color-danger-light)' }}>
                <button
                  onClick={() => setShowDetail(detail ? null : question.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-danger)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge-ink text-xs px-2 py-0.5 rounded font-mono">
                          {question.number}
                        </span>
                        {kp && (
                          <span className="text-xs text-gold">
                            {kp.title.length > 15 ? kp.title.substring(0, 15) + '...' : kp.title}
                          </span>
                        )}
                      </div>
                      <p className="text-sm line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{question.question}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        <span>{formatDate(timestamp)}</span>
                        <span>已复习 {reviewedCount} 次</span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${detail ? 'rotate-90' : ''}`} style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                </button>

                {/* Detail */}
                {detail && (
                  <div className="p-4 space-y-3" style={{ background: 'var(--color-danger-light)', borderTop: '1px solid var(--color-border-warm)' }}>
                    <div>
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>正确答案：{getAnswerDisplay(question)}</span>
                    </div>
                    <div className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{question.analysis}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addToTodayReview(question.id)}
                        className="flex-1 py-2 text-sm font-medium btn-gold flex items-center justify-center gap-1"
                      >
                        <ListChecks className="w-3.5 h-3.5" />
                        加入今日复习
                      </button>
                      <button
                        onClick={() => navigate(`/practice/q?questionId=${question.id}`)}
                        className="flex-1 py-2 text-sm font-medium btn-primary flex items-center justify-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        重新练习
                      </button>
                      {kp && (
                        <button
                          onClick={() => navigate(`/kp/${kp.id}`)}
                          className="flex-1 py-2 text-sm font-medium btn-outline flex items-center justify-center gap-1"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          相关知识点
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromWrongBook(question.id);
                        }}
                        className="py-2 px-3 text-sm btn-ghost"
                        style={{ color: 'var(--color-success)' }}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getAnswerDisplay(q: { answer: number | number[] }): string {
  if (Array.isArray(q.answer)) {
    return q.answer.map((i: number) => String.fromCharCode(65 + i)).join(', ');
  }
  return String.fromCharCode(65 + q.answer);
}