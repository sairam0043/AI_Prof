import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Layers,
  Plus,
  BookOpen,
  Brain,
  Cpu,
  Sparkles,
  Award,
  BarChart3,
  TrendingUp,
  FolderPlus
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    spaces,
    projects,
    activeSpaceId,
    activeProjectId,
    selectSpace,
    selectProject,
    openModal,
    currentView,
    setCurrentView
  } = useApp();

  return (
    <aside
      style={{
        width: '260px',
        minWidth: '260px',
        background: 'rgba(11, 15, 25, 0.95)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 68px)',
        overflowY: 'auto',
        padding: '20px 14px'
      }}
    >
      {/* Quick Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => openModal('create_space')}
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'center', fontSize: '0.86rem' }}
        >
          <FolderPlus size={15} color="var(--primary)" />
          New Space
        </button>

        <button
          onClick={() => openModal('create_project')}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', fontSize: '0.86rem' }}
        >
          <Plus size={15} />
          New Project
        </button>
      </div>

      {/* Spaces & Projects Hierarchy List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Learning Spaces ({spaces.length})
        </div>

        {spaces.map((space) => {
          const spaceProjects = projects.filter((p) => p.space_id === space.id);
          const isSpaceActive = activeSpaceId === space.id && currentView === 'space';

          return (
            <div key={space.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* Space Item */}
              <div
                onClick={() => selectSpace(space.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: isSpaceActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: isSpaceActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: space.color || '#6366f1',
                      flexShrink: 0
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: isSpaceActive ? 600 : 500,
                      color: isSpaceActive ? 'var(--text-main)' : 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {space.name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.06)',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    color: 'var(--text-dim)'
                  }}
                >
                  {spaceProjects.length}
                </span>
              </div>

              {/* Projects under Space */}
              <div style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '1px solid rgba(255, 255, 255, 0.06)', marginLeft: '12px' }}>
                {spaceProjects.map((proj) => {
                  const isProjActive = activeProjectId === proj.id && currentView === 'project';
                  return (
                    <div
                      key={proj.id}
                      onClick={() => selectProject(proj.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: isProjActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                        color: isProjActive ? 'var(--text-main)' : 'var(--text-dim)',
                        fontSize: '0.82rem',
                        fontWeight: isProjActive ? 600 : 400,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {proj.name}
                      </span>
                      {proj.average_mastery !== undefined && (
                        <span style={{ fontSize: '0.7rem', color: proj.average_mastery >= 75 ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
                          {proj.average_mastery}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer System Info */}
      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '0.75rem',
          color: 'var(--text-dim)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Core Loop Engine</span>
          <span style={{ color: '#34d399', fontWeight: 600 }}>v3.0 Candidate</span>
        </div>
        <div>Persistent Context & Citations</div>
      </div>
    </aside>
  );
};
