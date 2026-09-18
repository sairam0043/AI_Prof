import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Brain,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw
} from 'lucide-react';

export const OverviewTab: React.FC = () => {
  const { activeProjectDetails, setProjectTab, openModal } = useApp();

  if (!activeProjectDetails) {
    return <div style={{ padding: '30px', color: 'var(--text-muted)' }}>Loading project summary...</div>;
  }

  const { project, metrics, concepts, recommendations, recent_quizzes } = activeProjectDetails;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Learning Goal Header Callout */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 30px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-ready">Target Goal</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Project Isolation Active</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
            "{project.learning_goal}"
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setProjectTab('tutor')} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Brain size={15} color="var(--primary)" /> Ask AI Tutor
          </button>
          <button onClick={() => setProjectTab('quiz')} className="btn-primary" style={{ fontSize: '0.85rem' }}>
            <Play size={15} /> Practice Quiz
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>OVERALL MASTERY</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: (metrics.average_mastery || 0) >= 75 ? '#34d399' : '#fbbf24' }}>
            {metrics.average_mastery || 0}%
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Calculated from quizzes & tutor</span>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>INDEXED CONCEPTS</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
            {metrics.concepts_count || 0}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>With verified page citations</span>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>STUDY MATERIALS</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
            {metrics.materials_count || 0}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>PDFs parsed & chunked</span>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>ASSESSMENTS TAKEN</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            {metrics.quizzes_completed || 0}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Adaptive check-ins</span>
        </div>
      </div>

      {/* Recommendations ("What should I do next?") */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--accent-purple)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Recommended Next Actions</h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Event-driven recommendations</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
          {recommendations && recommendations.length > 0 ? (
            recommendations.map((rec: any) => (
              <div
                key={rec.id}
                className="glass-panel"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  border: '1px solid rgba(168, 85, 247, 0.3)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                    {rec.title}
                  </div>
                  <span className="badge badge-processing">
                    {rec.action_type.replace(/_/g, ' ')}
                  </span>
                </div>

                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {rec.description}
                </p>

                <div
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-dim)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '6px 10px',
                    borderRadius: '6px'
                  }}
                >
                  💡 <strong>Reason:</strong> {rec.reason}
                </div>

                <button
                  onClick={() => {
                    if (rec.action_type === 'take_quiz') setProjectTab('quiz');
                    else if (rec.action_type === 'tutor_practice') setProjectTab('tutor');
                    else if (rec.action_type === 'review_material') setProjectTab('materials');
                    else setProjectTab('mastery');
                  }}
                  className="btn-primary"
                  style={{ marginTop: 'auto', justifyContent: 'center', fontSize: '0.82rem', padding: '8px 14px' }}
                >
                  Execute Action <ArrowRight size={14} />
                </button>
              </div>
            ))
          ) : (
            <div className="glass-panel" style={{ padding: '24px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
              All concepts on track! Complete a quiz or upload new material to trigger new recommendations.
            </div>
          )}
        </div>
      </div>

      {/* Concepts Mastery Snapshot */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Concept Mastery Overview</h3>
          </div>
          <button onClick={() => setProjectTab('mastery')} className="btn-ghost" style={{ fontSize: '0.82rem' }}>
            Explore Full Matrix <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {concepts && concepts.slice(0, 4).map((c: any) => (
            <div key={c.id} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{c.name}</span>
                <span className={`badge badge-${c.trend === 'requiring_attention' ? 'attention' : c.trend}`}>
                  {c.estimated_mastery}%
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${c.estimated_mastery}%`,
                    height: '100%',
                    background: c.estimated_mastery >= 75 ? '#34d399' : c.estimated_mastery >= 60 ? '#fbbf24' : '#fb7185',
                    borderRadius: '3px'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
