import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { Concept } from '../../types';
import {
  TrendingUp,
  Brain,
  Sparkles,
  RefreshCw,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Star,
  Target
} from 'lucide-react';

export const MasteryGrowthTab: React.FC = () => {
  const { activeProjectId, activeProjectDetails, refreshActiveProject, setProjectTab } = useApp();
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [filter, setFilter] = useState<'all' | 'improving' | 'stable' | 'requiring_attention'>('all');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [growthSummary, setGrowthSummary] = useState({
    improving: 0,
    stable: 0,
    requiring_attention: 0,
    average_mastery: 0
  });

  const loadConcepts = async () => {
    if (!activeProjectId) return;
    try {
      const data = await api.getConcepts(activeProjectId);
      setConcepts(data.concepts || []);
      if (data.growth_summary) {
        setGrowthSummary(data.growth_summary);
      }
    } catch (err) {
      console.error('Failed to load concepts:', err);
    }
  };

  useEffect(() => {
    loadConcepts();
  }, [activeProjectId]);

  const handleReevaluateGrowth = async () => {
    if (!activeProjectId) return;
    setIsEvaluating(true);
    try {
      await api.evaluateGrowth(activeProjectId);
      await loadConcepts();
      await refreshActiveProject();
    } catch (err) {
      console.error('Failed to evaluate growth:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const filteredConcepts = concepts.filter((c) => {
    if (filter === 'all') return true;
    return c.trend === filter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & Growth Trigger */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Concept Mastery & Growth Analysis</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Dynamic mastery scores calculated from quizzes and tutor dialogue. Concepts evolve through evidence over time.
          </p>
        </div>

        <button
          onClick={handleReevaluateGrowth}
          disabled={isEvaluating}
          className="btn-secondary"
          style={{ fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} className={isEvaluating ? 'animate-spin' : ''} />
          {isEvaluating ? 'Analyzing Growth...' : 'Re-Evaluate Growth'}
        </button>
      </div>

      {/* Growth Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>PROJECT AVERAGE</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: growthSummary.average_mastery >= 75 ? '#34d399' : '#fbbf24' }}>
            {growthSummary.average_mastery}%
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Estimated project mastery</span>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 600 }}>IMPROVING 🟢</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>
            {growthSummary.improving}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Consistent upward trend</span>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.74rem', color: '#fbbf24', fontWeight: 600 }}>STABLE 🟡</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24' }}>
            {growthSummary.stable}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Consistent performance</span>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.74rem', color: '#fb7185', fontWeight: 600 }}>REQUIRING ATTENTION 🔴</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fb7185' }}>
            {growthSummary.requiring_attention}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Mistakes or low mastery</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        {(['all', 'improving', 'stable', 'requiring_attention'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className="btn-ghost"
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 600,
              background: filter === tab ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: filter === tab ? 'var(--text-main)' : 'var(--text-dim)',
              border: filter === tab ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent'
            }}
          >
            {tab === 'all' ? `All Concepts (${concepts.length})` : `${tab.replace(/_/g, ' ').toUpperCase()}`}
          </button>
        ))}
      </div>

      {/* Concepts Matrix Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {filteredConcepts.map((c) => {
          const isAttention = c.trend === 'requiring_attention';
          const isImproving = c.trend === 'improving';

          return (
            <div
              key={c.id}
              className="glass-panel"
              style={{
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                border: isAttention ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--text-main)' }}>{c.name}</h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                    {c.category || 'Core'} • Importance: {'★'.repeat(c.importance || 3)}
                  </span>
                </div>
                <span className={`badge badge-${isAttention ? 'attention' : isImproving ? 'improving' : 'stable'}`}>
                  {c.estimated_mastery}%
                </span>
              </div>

              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {c.description}
              </p>

              {/* Progress bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  <span>Mastery Level</span>
                  <span>{c.estimated_mastery}% / 100%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${c.estimated_mastery}%`,
                      height: '100%',
                      background: isImproving ? 'linear-gradient(90deg, #10b981, #06b6d4)' : isAttention ? 'linear-gradient(90deg, #f43f5e, #f59e0b)' : 'linear-gradient(90deg, #f59e0b, #6366f1)',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>
              </div>

              {/* Page References */}
              {c.page_references && c.page_references.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                  {c.page_references.map((pr: any, i: number) => (
                    <span key={i} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '3px 8px', borderRadius: '4px' }}>
                      📄 {pr.material_title || 'Document'} (Page {pr.page_number})
                    </span>
                  ))}
                </div>
              )}

              {/* Drill Down Actions */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: 'auto' }}>
                <button
                  onClick={() => setProjectTab('tutor')}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '6px 10px' }}
                >
                  <Brain size={13} color="var(--primary)" /> Tutor Drill
                </button>
                <button
                  onClick={() => setProjectTab('quiz')}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '6px 10px' }}
                >
                  <Target size={13} /> Booster Quiz
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
