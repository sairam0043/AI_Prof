import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import {
  Compass,
  Sparkles,
  ArrowRight,
  Brain,
  Layers,
  Award,
  BookOpen,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  TrendingUp,
  RefreshCw,
  FolderPlus,
  Plus
} from 'lucide-react';

export const HomeDashboard: React.FC = () => {
  const { spaces, projects, selectProject, selectSpace, openModal } = useApp();
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadGlobalAnalytics = async () => {
      try {
        const data = await api.getGlobalAnalytics();
        setGlobalStats(data);
      } catch (err) {
        console.error('Failed to load global analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadGlobalAnalytics();
  }, []);

  const recentProject = projects[0];

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Hero Welcome & Philosophy Header */}
      <div
        className="glass-panel"
        style={{
          padding: '28px 36px',
          background: 'linear-gradient(135deg, rgba(30, 41, 67, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: -50, right: -50, width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-improving">Welcome Back, Sarah</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Learning Session Active</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }} className="gradient-text">
            Where was I, how am I doing, and what should I do next?
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '650px' }}>
            Your contextual AI companion has indexed your notes, tracked concept mastery, and synthesized your next optimal learning actions.
          </p>
        </div>

        {recentProject && (
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              padding: '16px 22px',
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              minWidth: '280px',
              zIndex: 1
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Continue Learning
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#ffffff' }}>
              {recentProject.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Mastery: <strong style={{ color: '#34d399' }}>{recentProject.average_mastery || 72}%</strong>
              </span>
              <button
                onClick={() => selectProject(recentProject.id)}
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              >
                <Play size={13} />
                Resume
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3 Core Questions Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {/* Card 1: What am I learning? */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={20} color="var(--accent-cyan)" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>What am I learning?</h3>
            </div>
            <span className="badge badge-ready">{projects.length} Projects</span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Structured knowledge across <strong>{spaces.length} Spaces</strong> and <strong>{globalStats?.overview?.total_concepts || 6} concepts</strong> derived from verified PDF materials.
          </p>
          <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
            {spaces.slice(0, 2).map((s) => (
              <div
                key={s.id}
                onClick={() => selectSpace(s.id)}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {s.name}
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: How well am I learning it? */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={20} color="var(--accent-emerald)" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>How well am I learning?</h3>
            </div>
            <span className="badge badge-improving">{globalStats?.overview?.average_mastery || 68}% Mastery</span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Evidence measured from <strong>{globalStats?.overview?.quizzes_completed || 3} adaptive quizzes</strong> and AI multi-factor assessments.
          </p>
          <div style={{ display: 'flex', gap: '16px', marginTop: 'auto' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>IMPROVING</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399' }}>
                {globalStats?.overview?.improving_concepts || 2} Concepts
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>NEEDS ATTENTION</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fb7185' }}>
                {globalStats?.overview?.requiring_attention || 2} Concepts
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: What should I do next? */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={20} color="var(--accent-purple)" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>What should I do next?</h3>
            </div>
            <span className="badge badge-processing">Recommended</span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 500, lineHeight: '1.4' }}>
            "Review L2 Regularization penalty mechanics and complete a 2-question focused quiz."
          </p>
          <button
            onClick={() => recentProject && selectProject(recentProject.id, 'quiz')}
            className="btn-primary"
            style={{ marginTop: 'auto', width: '100%', justifyContent: 'center', fontSize: '0.84rem' }}
          >
            Start Recommended Practice <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Spaces & Projects Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Your Learning Spaces</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Broad subject domains containing focused project journeys.</p>
          </div>
          <button onClick={() => openModal('create_space')} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Plus size={15} /> Create Space
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
          {spaces.map((space) => {
            const spaceProjects = projects.filter((p) => p.space_id === space.id);

            return (
              <div key={space.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: `${space.color}22`,
                        border: `1px solid ${space.color}66`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Brain size={22} color={space.color || '#6366f1'} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{space.name}</h3>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        {spaceProjects.length} Active {spaceProjects.length === 1 ? 'Project' : 'Projects'}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => selectSpace(space.id)} className="btn-ghost" style={{ fontSize: '0.8rem' }}>
                    View Space <ArrowRight size={13} />
                  </button>
                </div>

                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', minHeight: '36px' }}>
                  {space.description || 'General study and mastery workspace.'}
                </p>

                {/* Projects inside Space */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                    Projects in this Space:
                  </div>
                  {spaceProjects.length === 0 ? (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                      No projects yet. Create your first project to begin!
                    </div>
                  ) : (
                    spaceProjects.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => selectProject(p.id)}
                        className="glass-card-interactive"
                        style={{
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <BookOpen size={15} color="var(--primary)" />
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>{p.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600 }}>
                            {p.average_mastery || 60}% Mastery
                          </span>
                          <ArrowRight size={14} color="var(--text-dim)" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Activity Feed */}
      {globalStats?.activity_stream && globalStats.activity_stream.length > 0 && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Learning Activity</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {globalStats.activity_stream.slice(0, 5).map((act: any) => (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {act.event_type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>in {act.project_name || 'Learning Workspace'}</span>
                </div>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                  {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
