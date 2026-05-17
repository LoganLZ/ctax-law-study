import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, PenTool, AlertCircle } from 'lucide-react';
import { getKpById, getQuestionById, getSectionById } from '../utils/data';
import { useStudyData } from '../hooks/useStudyData';
import { formatContent } from '../utils/contentFormatter';

/** Parse **text** markers into React elements with green-bold styling */
function renderGreenBold(text: string) {
  const parts = text.split(/\*\*/);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-bold" style={{ color: '#24b89a' }}>{part}</strong>
      : part
  );
}

export default function KnowledgePointDetail() {
  const { kpId } = useParams<{ kpId: string }>();
  const navigate = useNavigate();
  const { data, markKnowledgePointCompleted } = useStudyData();

  if (!kpId) return <div>未找到知识点</div>;
  const kp = getKpById(kpId);

  if (!kp) return <div>知识点不存在</div>;

  // Find related questions
  const relatedQuestions = kp.relatedQuestionIds
    .map(qId => getQuestionById(qId))
    .filter(Boolean);

  // Get chapter info for back navigation
  const sectionInfo = getSectionById(kp.sectionId);

  const contentBlocks = formatContent(kp.content);

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <button
        onClick={() => navigate(sectionInfo ? `/chapter/${sectionInfo.chapterId}` : '/')}
        className="btn-outline flex items-center gap-1 text-sm px-3 py-1.5 animate-enter"
      >
        <ArrowLeft className="w-4 h-4" />
        返回章节
      </button>

      {/* Knowledge Point Card */}
      <div className="card-warm p-4 animate-enter-delay-1">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-bold font-display" style={{ color: 'var(--color-primary-dark)' }}>{kp.title}</h2>
          {kp.importance === 'high' && (
            <span className="badge-gold text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Star className="w-3 h-3" style={{ color: 'var(--color-gold)' }} /> 重点
            </span>
          )}
        </div>

        <div className="text-sm space-y-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {contentBlocks.map((block, i) => {
            if (block.type === 'table') {
              return (
                <div
                  key={i}
                  className="mt-3 p-3 rounded-lg text-xs"
                  style={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: '2',
                    background: 'var(--color-primary-light)',
                    border: '1px solid var(--color-border)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {renderGreenBold(block.text)}
                </div>
              );
            }

            const isHeading = block.type === 'heading';
            return (
              <p
                key={i}
                className={isHeading ? 'font-semibold font-display mt-3' : 'mt-1.5'}
                style={isHeading ? { color: 'var(--color-primary-dark)' } : undefined}
              >
                {renderGreenBold(block.text)}
              </p>
            );
          })}
        </div>

        {/* Mark as completed */}
        <button
          onClick={() => markKnowledgePointCompleted(kp.id)}
          disabled={data.completedKps.includes(kp.id)}
          className="mt-4 w-full py-2.5 text-sm font-medium rounded-lg transition-all btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: data.completedKps.includes(kp.id) ? 'var(--color-primary-light)' : 'var(--color-primary-dark)',
            color: data.completedKps.includes(kp.id) ? 'var(--color-text-muted)' : '#fff',
          }}
        >
          {data.completedKps.includes(kp.id) ? '\u2713 已标记为已学习' : '标记为已学习'}
        </button>
      </div>

      {/* Related Questions */}
      {relatedQuestions.length > 0 && (
        <div className="card p-4 animate-enter-delay-2">
          <h3 className="font-semibold font-display mb-3 flex items-center gap-2" style={{ color: 'var(--color-primary-dark)' }}>
            <PenTool className="w-4 h-4" />
            相关练习题（{relatedQuestions.length}题）
          </h3>
          <div className="space-y-2">
            {relatedQuestions.map(q => {
              if (!q) return null;
              const isDone = data.completedQuestions.includes(q.id);
              const isWrong = data.wrongBook.some(w => w.questionId === q.id);
              return (
                <button
                  key={q.id}
                  onClick={() => navigate(`/practice/q?questionId=${q.id}`)}
                  className="w-full text-left p-3 rounded-lg transition-all card-hover"
                  style={{ background: 'var(--color-primary-light)', border: '1px solid var(--color-border)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="badge-ink text-xs px-2 py-0.5 rounded font-mono">
                        {q.number}
                      </span>
                      <span className="text-sm truncate" style={{ color: 'var(--color-text-secondary)' }}>{q.question.substring(0, 40)}...</span>
                    </div>
                    {isDone && (
                      isWrong ? (
                        <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-danger)' }} />
                      ) : (
                        <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-success)' }}>&#10003;</span>
                      )
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}