import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Brain,
  Plus,
  BookOpen,
  ArrowRight,
  TrendingUp,
  FileText,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';

export const SpaceView: React.FC = () => {
  const { spaces, projects, activeSpaceId, selectProject, openModal } = useApp();

  const space = spaces.find((s) => s.id === activeSpaceId);
  const spaceProjects = projects.filter((p) => p.space_id === activeSpaceId);

  if (!space) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Space not found. Please select a valid space from the sidebar.
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Space Hero Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: `linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, ${space.color || '#6366f1'}15 100%)`,
          border: `1px solid ${space.color || '#6366f1'}44`
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: `${space.color || '#6366f1'}25`,
              border: `1px solid ${space.color || '#6366f1'}66`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Brain size={32} color={space.color || '#6366f1'} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-ready">Space Workspace</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                {spaceProjects.length} {spaceProjects.length === 1 ? 'Project' : 'Projects'} Active
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px' }}>{space.name}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px', maxWidth: '700px' }}>
              {space.description || 'Explore learning projects and mastery within this domain.'}
            </p>
          </div>
        </div>

        <button onClick={() => openModal('create_project', { spaceId: space.id })} className="btn-primary">
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Projects Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Projects in {space.name}</h2>

        {spaceProjects.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: '48px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <BookOpen size={40} color="var(--text-dim)" />
            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>No projects created in this space yet</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '400px' }}>
              Create a project with a specific learning goal to upload PDFs, chat with the AI tutor, and practice adaptive quizzes.
            </p>
            <button
              onClick={() => openModal('create_project', { spaceId: space.id })}
              className="btn-primary"
              style={{ marginTop: '8px' }}
            >
              <Plus size={16} /> Create Project
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {spaceProjects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => selectProject(proj.id)}
                className="glass-panel glass-card-interactive"
                style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {proj.name}
                  </h3>
                  <span className="badge badge-improving">
                    {proj.average_mastery || 65}% Mastery
                  </span>
                </div>

                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.4', minHeight: '40px' }}>
                  {proj.description || 'Targeted learning journey.'}
                </p>

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: 'var(--text-dim)'
                  }}
                >
                  🎯 <strong>Goal:</strong> {proj.learning_goal}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '14px',
                    marginTop: 'auto',
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)'
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span>{proj.material_count || 1} Materials</span>
                    <span>•</span>
                    <span>{proj.concept_count || 4} Concepts</span>
                  </div>
                  <span style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Open Hub <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
