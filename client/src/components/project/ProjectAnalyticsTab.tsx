import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Zap,
  Clock,
  DollarSign,
  Cpu,
  Layers,
  Award
} from 'lucide-react';

export const ProjectAnalyticsTab: React.FC = () => {
  const { activeProjectId } = useApp();
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activeProjectId) return;
    const loadAnalytics = async () => {
      try {
        const data = await api.getProjectAnalytics(activeProjectId);
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to load project analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAnalytics();
  }, [activeProjectId]);

  if (isLoading || !analytics) {
    return <div style={{ padding: '30px', color: 'var(--text-muted)' }}>Loading analytics telemetry...</div>;
  }

  const { concepts, quiz_scores, recent_events, ai_usage } = analytics;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Telemetry Header */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Project Learning Analytics & AI Telemetry</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Real-time measurement of learner growth, quiz performance curves, and AI token consumption.
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>TOTAL AI REQUESTS</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
            {ai_usage.total_calls}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Tutor & Quiz Generations</span>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>TOTAL TOKENS</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
            {ai_usage.total_tokens.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Prompt + Completion</span>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>AVG LATENCY</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            {ai_usage.avg_latency_ms}ms
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Mean response time</span>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>ESTIMATED COST</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
            ${(ai_usage.total_cost || 0).toFixed(4)}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Project AI expenditure</span>
        </div>
      </div>

      {/* 2-Column Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Quiz Performance History */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Assessment Scorecard History</h3>
          </div>

          {quiz_scores && quiz_scores.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {quiz_scores.map((qs: any) => (
                <div
                  key={qs.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{qs.title}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                      Difficulty: {qs.difficulty} • {qs.total_questions} Questions
                    </div>
                  </div>
                  <span className="badge badge-improving" style={{ fontSize: '0.85rem' }}>
                    {qs.score}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
              No completed quizzes yet.
            </div>
          )}
        </div>

        {/* Learning Events Stream */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Learning Event Logs</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {recent_events && recent_events.map((ev: any) => (
              <div
                key={ev.id}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {ev.event_type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                  {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
