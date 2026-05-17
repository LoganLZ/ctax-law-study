import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ChevronRight, PenTool } from 'lucide-react';
import { getChapterById, getQuestionsByChapter } from '../utils/data';
import { useStudyData } from '../hooks/useStudyData';

type FilterType = 'all' | 'high';

export default function KnowledgePointList() {
  const { chId } = useParams<{ chId: string }>();
  const navigate = useNavigate();
  const { data } = useStudyData();
  const [filter, setFilter] = useState<FilterType>('all');

  if (!chId) return <div>未找到章节</div>;
  const chapter = getChapterById(chId);
  if (!chapter) return <div>章节不存在</div>;

  // Get questions for this chapter
  const chapterQuestions = getQuestionsByChapter(chId);

  const filteredKps = filter === 'high'
    ? chapter.knowledgePoints.filter(kp => kp.importance === 'high')
    : chapter.knowledgePoints;

  // Map section IDs to section titles
  const sectionMap = chapter.sections.map(s => ({ id: s.id, title: s.title }));

  return (
    <div className="space-y-4">
      {/* Chapter Header */}
      <div className="card p-4 animate-enter">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold font-display" style={{ color: 'var(--color-primary-dark)' }}>{chapter.title}</h2>
          {chapterQuestions.length > 0 && (
            <button
              onClick={() => navigate(`/practice/chapter?chId=${chapter.id}`)}
              className="btn-gold px-3 py-1.5 text-xs font-medium flex items-center gap-1"
            >
              <PenTool className="w-3 h-3" />
              练习本章
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <span>考 {chapter.expectedScore}</span>
          <span>·</span>
          <span>{chapter.knowledgePoints.length} 个知识点</span>
          <span>·</span>
          <span>{chapterQuestions.length} 道题</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 animate-enter-delay-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'all' ? 'btn-primary' : 'btn-outline'
          }`}
        >
          全部
        </button>
        <button
          onClick={() => setFilter('high')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
            filter === 'high' ? 'btn-gold' : 'btn-outline'
          }`}
        >
          <Star className="w-3 h-3" /> 仅重点
        </button>
      </div>

      {/* Section Grouped Knowledge Points */}
      <div className="space-y-4">
        {sectionMap.map(section => {
          const sectionKps = filteredKps.filter(kp => kp.sectionId === section.id);
          if (sectionKps.length === 0) return null;

          return (
            <div key={section.id} className="animate-enter-delay-2">
              <h3 className="text-sm font-semibold font-display mb-2 px-1 flex items-center gap-2" style={{ color: 'var(--color-primary-dark)' }}>
                <div className="gold-dot" />
                {section.title}
              </h3>
              <div className="space-y-2">
                {sectionKps.map(kp => {
                  const kpQuestions = chapterQuestions.filter(q => q.relatedKpId === kp.id);
                  const completedQs = kpQuestions.filter(q => data.completedQuestions.includes(q.id)).length;
                  const isCompleted = data.completedKps.includes(kp.id);

                  return (
                    <div
                      key={kp.id}
                      className="card card-hover p-4"
                    >
                      <div
                        className="flex items-start gap-3 cursor-pointer"
                        onClick={() => navigate(`/kp/${kp.id}`)}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                          style={{
                            background: isCompleted ? 'var(--color-success)' : 'var(--color-primary-light)',
                            color: isCompleted ? '#fff' : 'var(--color-text-secondary)',
                          }}
                        >
                          {isCompleted ? '\u2713' : ''}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium" style={{ color: 'var(--color-text)' }}>{kp.title}</span>
                            {kp.importance === 'high' && (
                              <span className="badge-gold text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                <Star className="w-3 h-3" style={{ color: 'var(--color-gold)' }} /> 重点
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                            <span>{completedQs}/{kpQuestions.length} 题已练</span>
                            {kpQuestions.length > 0 && (
                              <span className="text-gold">查看详情 &rarr;</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                      </div>

                      {/* Quick Practice Button */}
                      {kpQuestions.length > 0 && (
                        <button
                          onClick={() => navigate(`/practice/kp?kpId=${kp.id}`)}
                          className="mt-2 w-full py-2 text-sm font-medium btn-ghost flex items-center justify-center gap-1"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          立即练习
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {filteredKps.length === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          当前章节暂无重点知识点
        </div>
      )}
    </div>
  );
}