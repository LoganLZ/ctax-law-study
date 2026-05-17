import { useNavigate } from 'react-router-dom';
import { Award } from 'lucide-react';
import { getChapters } from '../utils/data';
import { useStudyData } from '../hooks/useStudyData';

export default function ChapterList() {
  const navigate = useNavigate();
  const { data } = useStudyData();
  const chapters = getChapters();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between animate-enter">
        <h2 className="text-xl font-bold font-display" style={{ color: 'var(--color-primary-dark)' }}>章节列表</h2>
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>共 {chapters.length} 章</span>
      </div>

      <div className="space-y-3">
        {chapters.map((ch, idx) => {
          const chapterKps = ch.knowledgePoints;
          const completedKps = chapterKps.filter(kp => data.completedKps.includes(kp.id)).length;
          const progress = chapterKps.length > 0 ? (completedKps / chapterKps.length) * 100 : 0;
          const isComplete = chapterKps.length > 0 && completedKps === chapterKps.length;

          return (
            <button
              key={ch.id}
              onClick={() => navigate(`/chapter/${ch.id}`)}
              className={`w-full text-left card card-hover p-4 transition-all animate-enter-delay-${Math.min(idx, 4)}`}
              style={{
                border: isComplete ? '1.5px solid var(--color-success)' : '1.5px solid var(--color-border)',
                background: isComplete ? 'var(--color-success-light)' : 'var(--color-card)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="badge-gold text-sm font-bold px-2 py-0.5 rounded"
                    style={{
                      background: isComplete ? 'var(--color-success)' : 'var(--color-gold)',
                      color: '#fff',
                    }}
                  >
                    {ch.number}
                  </span>
                  <span className="font-semibold font-display" style={{ color: 'var(--color-text)' }}>{ch.title}</span>
                </div>
                <Award className="w-4 h-4 text-gold" />
              </div>
              <div className="flex items-center justify-between text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                <span>考 {ch.expectedScore}</span>
                <span>{ch.sections.length} 节</span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-bar-fill ${isComplete ? 'progress-bar-fill-green' : 'progress-bar-fill-gold'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {completedKps}/{chapterKps.length} 知识点已学习
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}