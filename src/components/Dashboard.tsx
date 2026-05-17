import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, BookOpenCheck, AlertCircle, List } from 'lucide-react';
import { useStudyData } from '../hooks/useStudyData';
import { chaptersData } from '../data/chapters';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, getTodayReviewCount, getProgressStats } = useStudyData();
  const stats = getProgressStats();
  const reviewCount = getTodayReviewCount();
  const totalKps = chaptersData.reduce((sum, ch) => sum + ch.knowledgePoints.length, 0);

  const lastChapter = data.completedKps.length > 0
    ? (() => {
        for (const ch of chaptersData) {
          for (const kp of ch.knowledgePoints) {
            if (data.completedKps.includes(kp.id)) return ch;
          }
        }
        return undefined;
      })()
    : undefined;

  return (
    <div className="space-y-5">
      {/* ── Hero Banner ── */}
      <div
        className="card animate-enter p-5 relative overflow-hidden"
        style={{ background: 'var(--color-primary-dark)' }}
      >
        {/* Decorative gold line */}
        <div className="gold-line absolute bottom-0 left-0 right-0" />

        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-wide" style={{ color: 'var(--color-gold-glow)' }}>
              今日学习
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              每日精进，逢考必过
            </p>
          </div>
          <div className="gold-dot mt-2" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-gold-glow)' }}>{stats.totalKps}</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>已学知识点</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-gold-glow)' }}>{stats.totalQuestions}</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>已练题数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-gold-glow)' }}>{stats.accuracy}%</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>正确率</div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
            <span>总体进度</span>
            <span>{stats.totalKps}/{totalKps}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill-gold progress-bar-fill" style={{ width: `${totalKps > 0 ? (stats.totalKps / totalKps) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* ── Today's Review (Gold accent card) ── */}
      {reviewCount > 0 && (
        <div className="card-gold p-4 animate-enter-delay-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-gold)', color: '#fff' }}>
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-semibold" style={{ color: 'var(--color-gold-dark)' }}>今日复习任务</h3>
                <p className="text-sm" style={{ color: 'var(--color-gold)' }}>{reviewCount} 道题等待复习</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/review')}
              className="btn-gold px-4 py-2 text-sm flex items-center gap-1"
            >
              去复习 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="card p-4 animate-enter-delay-2 space-y-2">
        <h3 className="font-display font-semibold text-sm mb-2" style={{ color: 'var(--color-primary-dark)' }}>
          快捷入口
        </h3>

        {lastChapter && (
          <button
            onClick={() => navigate(`/chapter/${lastChapter.id}`)}
            className="w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 card-hover"
            style={{ background: 'var(--color-primary-light)' }}
          >
            <BookOpenCheck className="w-4 h-4" style={{ color: 'var(--color-primary-dark)' }} />
            <div className="text-left flex-1">
              <div className="text-sm font-medium" style={{ color: 'var(--color-primary-dark)' }}>继续上次学习</div>
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{lastChapter.title}</div>
            </div>
            <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        )}

        <button
          onClick={() => navigate('/chapters')}
          className="w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 card-hover"
          style={{ background: 'var(--color-bg)' }}
        >
          <List className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
          <div className="text-left flex-1">
            <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>章节列表</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>共19章，按节关联知识点与题目</div>
          </div>
          <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
        </button>

        <button
          onClick={() => navigate('/wrongbook')}
          className="w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 card-hover"
          style={{ background: 'var(--color-danger-light)' }}
        >
          <AlertCircle className="w-4 h-4" style={{ color: 'var(--color-danger)' }} />
          <div className="text-left flex-1">
            <div className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>错题本</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{data.wrongBook.length} 道错题待复习</div>
          </div>
          <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
        </button>
      </div>

      {/* ── Chapter Progress ── */}
      <div className="card p-4 animate-enter-delay-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--color-primary-dark)' }}>
            章节进度
          </h3>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{stats.totalKps}/{totalKps} 已学</span>
        </div>
        <div className="space-y-2.5">
          {chaptersData.map(ch => {
            const chapterKps = ch.knowledgePoints;
            const completedKps = chapterKps.filter(kp => data.completedKps.includes(kp.id)).length;
            const progress = chapterKps.length > 0 ? (completedKps / chapterKps.length) * 100 : 0;
            const isComplete = progress >= 100;
            return (
              <button
                key={ch.id}
                onClick={() => navigate(`/chapter/${ch.id}`)}
                className="w-full text-left group transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{
                        background: isComplete ? 'var(--color-success-light)' : 'var(--color-primary-light)',
                        color: isComplete ? 'var(--color-success)' : 'var(--color-primary-dark)',
                      }}
                    >
                      {ch.number}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                      {ch.title.replace(/^第.+章\s+/, '')}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: isComplete ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                    {completedKps}/{chapterKps.length}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-bar-fill ${isComplete ? 'progress-bar-fill-green' : 'progress-bar-fill-blue'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}