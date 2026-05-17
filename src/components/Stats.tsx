import { useState } from 'react';
import { getChapters } from '../utils/data';
import { useStudyData } from '../hooks/useStudyData';
import { Download, RotateCcw } from 'lucide-react';

export default function Stats() {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { data, resetData, getProgressStats } = useStudyData();

  // Export study data
  const handleExport = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      appVersion: '1.0',
      studyData: data,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ctax-law-study-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import study data
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        const importedData = imported.studyData || imported;
        if (importedData && importedData.completedKps && importedData.wrongBook) {
          if (confirm('导入将覆盖当前学习进度，确定继续吗？')) {
            localStorage.setItem('ctax_study_data', JSON.stringify(importedData));
            window.location.reload();
          }
        }
      } catch {
        alert('文件格式不正确，请选择正确的备份文件');
      }
    };
    reader.readAsText(file);
  };

  // Reset progress
  const handleReset = () => {
    if (confirm('确定要重置所有学习进度吗？此操作不可撤销。')) {
      resetData();
      window.location.reload();
    }
    setShowResetConfirm(false);
  };
  const stats = getProgressStats();
  const chapters = getChapters();

  const totalKps = chapters.reduce((sum, ch) => sum + ch.knowledgePoints.length, 0);
  const totalQuestions = chapters.reduce((sum, ch) => sum + ch.knowledgePoints.reduce((s, kp) => s + kp.relatedQuestionIds.length, 0), 0);

  // Chapter-level stats
  const chapterStats = chapters.map(ch => {
    const kpCount = ch.knowledgePoints.length;
    const completedKps = ch.knowledgePoints.filter(kp => data.completedKps.includes(kp.id)).length;
    const questionCount = ch.knowledgePoints.reduce((s, kp) => s + kp.relatedQuestionIds.length, 0);
    const completedQuestions = ch.knowledgePoints.reduce((s, kp) => {
      return s + kp.relatedQuestionIds.filter(qId => data.completedQuestions.includes(qId)).length;
    }, 0);
    const highKps = ch.knowledgePoints.filter(kp => kp.importance === 'high').length;
    const completedHighKps = ch.knowledgePoints.filter(kp => kp.importance === 'high' && data.completedKps.includes(kp.id)).length;

    return {
      id: ch.id,
      title: ch.title,
      expectedScore: ch.expectedScore,
      kpCount,
      completedKps,
      questionCount,
      completedQuestions,
      highKps,
      completedHighKps,
    };
  });

  // Find most practiced chapter
  const topChapter = chapterStats.reduce((top: typeof chapterStats[number] | undefined, ch) =>
    ch.completedQuestions > (top?.completedQuestions || 0) ? ch : top, undefined
  );

  // Find most wrong chapter — O(n+m) with precomputed question-to-chapter map
  const wrongCountByChapter: Record<string, number> = {};
  const questionToChapter = new Map<string, string>();
  for (const ch of chapters) {
    for (const kp of ch.knowledgePoints) {
      for (const qId of kp.relatedQuestionIds) {
        questionToChapter.set(qId, ch.id);
      }
    }
  }
  data.wrongBook.forEach(w => {
    const chId = questionToChapter.get(w.questionId);
    if (chId) {
      wrongCountByChapter[chId] = (wrongCountByChapter[chId] || 0) + 1;
    }
  });

  return (
    <div className="space-y-4">
      {/* Overview — Dark hero section matching Dashboard style */}
      <div
        className="card p-5 relative overflow-hidden animate-enter"
        style={{ background: 'var(--color-primary-dark)' }}
      >
        <div className="gold-line absolute bottom-0 left-0 right-0" />

        <h3 className="font-display font-semibold mb-3" style={{ color: 'var(--color-gold-glow)' }}>学习概览</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold" style={{ color: 'var(--color-gold-glow)' }}>{stats.totalKps}</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>已学知识点</div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: 'var(--color-gold-glow)' }}>{stats.totalQuestions}</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>已练习题数</div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: 'var(--color-gold-glow)' }}>{stats.accuracy}%</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>正确率</div>
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="card p-4 animate-enter-delay-1">
        <h3 className="font-semibold font-display mb-3" style={{ color: 'var(--color-primary-dark)' }}>总体进度</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              <span>知识点掌握</span>
              <span>{stats.totalKps}/{totalKps}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill progress-bar-fill-blue" style={{ width: `${totalKps > 0 ? (stats.totalKps / totalKps) * 100 : 0}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              <span>练习题完成</span>
              <span>{stats.totalQuestions}/{totalQuestions}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill progress-bar-fill-green" style={{ width: `${totalQuestions > 0 ? (stats.totalQuestions / totalQuestions) * 100 : 0}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              <span>重点知识点掌握</span>
              <span>{chapterStats.reduce((s, ch) => s + ch.completedHighKps, 0)}/{chapterStats.reduce((s, ch) => s + ch.highKps, 0)}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill progress-bar-fill-gold" style={{ width: `${chapterStats.reduce((s, ch) => s + ch.highKps, 0) > 0 ? (chapterStats.reduce((s, ch) => s + ch.completedHighKps, 0) / chapterStats.reduce((s, ch) => s + ch.highKps, 0)) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Top Chapter */}
      {topChapter && (
        <div className="card-gold p-4 animate-enter-delay-2">
          <h3 className="font-semibold font-display mb-2" style={{ color: 'var(--color-gold-dark)' }}>学习最多的章节</h3>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="font-medium" style={{ color: 'var(--color-gold)' }}>{topChapter.title}</span>
            <span>·</span>
            <span>已练 {topChapter.completedQuestions} 题</span>
          </div>
        </div>
      )}

      {/* Wrong Chapter Ranking */}
      {Object.keys(wrongCountByChapter).length > 0 && (
        <div className="card p-4 animate-enter-delay-3">
          <h3 className="font-semibold font-display mb-2" style={{ color: 'var(--color-primary-dark)' }}>错题最多章节</h3>
          <div className="space-y-2">
            {Object.entries(wrongCountByChapter)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([chId, count]) => (
                <div key={chId} className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {chapters.find(c => c.id === chId)?.title?.replace(/^\d+章\s*/, '') || chId}
                  </span>
                  <span className="badge-danger text-xs px-2 py-0.5 rounded font-medium">{count} 题</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Data Management */}
      <div className="card p-4 animate-enter-delay-4">
        <h3 className="font-semibold font-display mb-3" style={{ color: 'var(--color-primary-dark)' }}>数据管理</h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium btn-ghost"
            >
              <Download className="w-3.5 h-3.5" />
              导出进度
            </button>
            <label className="flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium btn-gold cursor-pointer">
              <Download className="w-3.5 h-3.5" />
              导入进度
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
          <div>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-2 text-sm font-medium btn-danger flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重置所有进度
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="card p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold font-display mb-2" style={{ color: 'var(--color-primary-dark)' }}>确认重置</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>此操作将删除所有学习进度、错题记录和复习计划，确定继续吗？</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 text-sm font-medium btn-outline"
              >
                取消
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2 text-sm font-medium"
                style={{ background: 'var(--color-danger)', color: '#fff', borderRadius: 'var(--radius-sm)' }}
              >
                确定重置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chapter Breakdown */}
      <div className="card p-4 animate-enter-delay-4">
        <h3 className="font-semibold font-display mb-3" style={{ color: 'var(--color-primary-dark)' }}>章节详情</h3>
        <div className="space-y-4">
          {chapterStats.map(ch => (
            <div key={ch.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{ch.title.replace(/^\d+章\s*/, '')}</span>
                  <span className="badge-ink text-xs px-1.5 py-0.5 rounded">考 {ch.expectedScore}</span>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <span>{ch.completedKps}/{ch.kpCount} 知识点</span>
                  <span>{ch.completedQuestions}/{ch.questionCount} 题</span>
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill progress-bar-fill-blue" style={{ width: `${ch.kpCount > 0 ? (ch.completedKps / ch.kpCount) * 100 : 0}%` }} />
              </div>
              {/* High importance progress */}
              {ch.highKps > 0 && (
                <div className="progress-bar mt-1">
                  <div className="progress-bar-fill progress-bar-fill-gold" style={{ width: `${(ch.completedHighKps / ch.highKps) * 100}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}