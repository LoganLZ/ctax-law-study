import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, AlertCircle, BarChart3 } from 'lucide-react';

type TabItem = {
  id: string;
  label: string;
  icon: typeof BookOpen;
  path: string;
};

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('/');

  useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path.startsWith('/chapters') || path.startsWith('/chapter') || path.startsWith('/kp') || path.startsWith('/practice') || path.startsWith('/review')) {
      setActiveTab('/');
    } else if (path === '/wrongbook') {
      setActiveTab('/wrongbook');
    } else if (path === '/stats') {
      setActiveTab('/stats');
    }
  }, [location.pathname]);

  const tabs: TabItem[] = [
    { id: 'study', label: '学习', icon: BookOpen, path: '/' },
    { id: 'wrong', label: '错题', icon: AlertCircle, path: '/wrongbook' },
    { id: 'stats', label: '统计', icon: BarChart3, path: '/stats' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* Header — Ink bar with gold accent line */}
      <header className="sticky top-0 z-50" style={{ background: 'var(--color-primary-dark)' }}>
        <div className="gold-line" />
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="font-display text-lg font-semibold tracking-wide" style={{ color: 'var(--color-gold-glow)' }}>
            涉税法律学堂
          </h1>
          <div className="flex items-center gap-1">
            <div className="gold-dot" />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              税务师备考
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 px-4 py-4 max-w-lg mx-auto w-full">
        {children}
      </main>

      {/* Bottom Tab Bar — Clean ink style with gold active indicator */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-around"
        style={{
          background: 'var(--color-card)',
          boxShadow: 'var(--shadow-tab)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.path); navigate(tab.path); }}
            className={`flex flex-col items-center py-2 px-6 relative transition-all duration-200 ${
              activeTab === tab.path ? 'scale-105' : ''
            }`}
          >
            {activeTab === tab.path && (
              <div
                className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                style={{ background: 'var(--color-gold)' }}
              />
            )}
            <tab.icon
              className="w-5 h-5 transition-colors duration-200"
              style={{
                color: activeTab === tab.path ? 'var(--color-gold)' : 'var(--color-text-muted)',
              }}
            />
            <span
              className="text-xs mt-1 font-medium transition-colors duration-200"
              style={{
                color: activeTab === tab.path ? 'var(--color-gold-dark)' : 'var(--color-text-muted)',
              }}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}