import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Layers,
  Brain,
  ShieldCheck,
  Home,
  Sliders,
  ChevronRight,
  BookOpen,
  Activity
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    spaces,
    projects,
    activeSpaceId,
    activeProjectId,
    selectSpace,
    selectProject,
    openModal
  } = useApp();

  const activeSpace = spaces.find((s) => s.id === activeSpaceId);
  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(9, 13, 22, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 24px',
        height: '68px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      {/* Brand & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          onClick={() => setCurrentView('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer'
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.5)'
            }}
          >
            <Brain size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }} className="gradient-text">
              AI Study Companion
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.04em' }}>
              LEARNING & GROWTH WORKSPACE
            </div>
          </div>
        </div>

        {/* Dynamic Breadcrumb trail */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px', fontSize: '0.88rem' }}>
          <button
            onClick={() => setCurrentView('home')}
            className="btn-ghost"
            style={{ color: currentView === 'home' ? 'var(--primary)' : 'var(--text-muted)' }}
          >
            <Home size={15} />
            Home
          </button>

          {activeSpace && currentView !== 'home' && currentView !== 'admin' && (
            <>
              <ChevronRight size={14} color="var(--text-dim)" />
              <button
                onClick={() => selectSpace(activeSpace.id)}
                className="btn-ghost"
                style={{ color: currentView === 'space' ? 'var(--primary)' : 'var(--text-muted)' }}
              >
                <Layers size={15} />
                {activeSpace.name}
              </button>
            </>
          )}

          {activeProject && currentView === 'project' && (
            <>
              <ChevronRight size={14} color="var(--text-dim)" />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '4px 10px',
                  borderRadius: '6px'
                }}
              >
                <BookOpen size={14} color="var(--accent-cyan)" />
                {activeProject.name}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* System Health / AI Gateway Badge */}
        <div
          onClick={() => openModal('ai_settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.78rem',
            color: '#34d399',
            cursor: 'pointer'
          }}
          title="Click to configure AI Settings & API Keys"
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <span style={{ fontWeight: 600 }}>Grounded AI Engine</span>
          <Sliders size={13} style={{ marginLeft: '4px', opacity: 0.8 }} />
        </div>

        {/* View Switcher: User App vs Admin Observability */}
        <button
          onClick={() => setCurrentView(currentView === 'admin' ? 'home' : 'admin')}
          className={currentView === 'admin' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem', padding: '8px 14px' }}
        >
          {currentView === 'admin' ? (
            <>
              <BookOpen size={16} />
              Return to Student View
            </>
          ) : (
            <>
              <ShieldCheck size={16} color="#a855f7" />
              Admin & AI Observability
            </>
          )}
        </button>

        {/* User Profile */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderLeft: '1px solid var(--border-subtle)',
            paddingLeft: '14px'
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
            alt="Avatar"
            style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid var(--primary)' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Sarah Chen</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>AI Fellow</span>
          </div>
        </div>
      </div>
    </header>
  );
};
