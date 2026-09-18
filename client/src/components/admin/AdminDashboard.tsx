import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { AILog, AIEvalRun, BackgroundJob } from '../../types';
import {
  ShieldCheck,
  Activity,
  Zap,
  Clock,
  DollarSign,
  Cpu,
  Layers,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Settings,
  Eye,
  Terminal,
  Database
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [overview, setOverview] = useState<any | null>(null);
  const [aiLogs, setAiLogs] = useState<AILog[]>([]);
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [evalRuns, setEvalRuns] = useState<AIEvalRun[]>([]);
  const [selectedLog, setSelectedLog] = useState<AILog | null>(null);
  const [isRunningEval, setIsRunningEval] = useState(false);
  const [featureFilter, setFeatureFilter] = useState<string>('');
  const [activeAdminTab, setActiveAdminTab] = useState<'observability' | 'evals' | 'queue' | 'users'>('observability');

  const loadData = async () => {
    try {
      const [ov, logsData, jobsData, evalsData] = await Promise.all([
        api.getAdminOverview(),
        api.getAILogs(50, featureFilter || undefined),
        api.getBackgroundJobs(),
        (await fetch('/api/eval/runs')).json()
      ]);
      setOverview(ov);
      setAiLogs(logsData.logs || []);
      setJobs(jobsData.jobs || []);
      setEvalRuns(evalsData.runs || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [featureFilter]);

  const handleRunEvals = async () => {
    setIsRunningEval(true);
    try {
      await api.runAIEvalSuite();
      await loadData();
    } catch (err) {
      console.error('Eval run failed:', err);
    } finally {
      setIsRunningEval(false);
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(168, 85, 247, 0.2)',
              border: '1px solid rgba(168, 85, 247, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShieldCheck size={26} color="#c084fc" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-ready">Platform Telemetry</span>
              <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600 }}>● System Healthy</span>
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800 }} className="gradient-text">
              Platform Administration & AI Observability Console
            </h1>
          </div>
        </div>

        <button onClick={handleRunEvals} disabled={isRunningEval} className="btn-primary" style={{ fontSize: '0.85rem' }}>
          <Sparkles size={15} />
          {isRunningEval ? 'Running AI Eval Suite...' : 'Run Automated AI Evals'}
        </button>
      </div>

      {/* Platform KPI Row */}
      {overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>TOTAL AI CALLS</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
              {overview.ai_observability?.total_requests || 0}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>
              {overview.ai_observability?.success_rate || 100}% Success Rate
            </span>
          </div>

          <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>TOTAL TOKENS</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {(overview.ai_observability?.total_tokens || 0).toLocaleString()}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Input & Output</span>
          </div>

          <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>MEAN LATENCY</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
              {overview.ai_observability?.avg_latency_ms || 0}ms
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Engine response time</span>
          </div>

          <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>TOTAL EXPENDITURE</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
              ${(overview.ai_observability?.total_cost || 0).toFixed(4)}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Estimated model cost</span>
          </div>

          <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>PLATFORM ENTITIES</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
              {overview.platform?.projects || 0} Proj / {overview.platform?.materials || 0} Docs
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Across {overview.platform?.spaces || 0} Spaces</span>
          </div>
        </div>
      )}

      {/* Admin Tabs Switcher */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
        {(['observability', 'evals', 'queue'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveAdminTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.86rem',
              fontWeight: 600,
              background: activeAdminTab === tab ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: activeAdminTab === tab ? 'var(--text-main)' : 'var(--text-dim)',
              border: activeAdminTab === tab ? '1px solid var(--border-glow)' : '1px solid transparent',
              cursor: 'pointer'
            }}
          >
            {tab === 'observability' && '📊 AI Requests & Traces'}
            {tab === 'evals' && `🧪 AI Evaluation Suites (${evalRuns.length})`}
            {tab === 'queue' && `⚙️ Async Background Queue (${jobs.length})`}
          </button>
        ))}
      </div>

      {/* TAB 1: Observability & AI Traces */}
      {activeAdminTab === 'observability' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Feature Breakdown Summary */}
          {overview?.ai_observability?.feature_breakdown && (
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>AI Consumption by Feature</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                {overview.ai_observability.feature_breakdown.map((f: any) => (
                  <div
                    key={f.feature}
                    style={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      {f.feature.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{f.call_count} calls</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Avg {f.avg_latency_ms}ms • {f.total_tokens.toLocaleString()} tokens
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Logs Table */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Live AI Request Telemetry Stream</h3>
              <select
                className="input-field"
                style={{ width: '220px', padding: '6px 12px', fontSize: '0.8rem' }}
                value={featureFilter}
                onChange={(e) => setFeatureFilter(e.target.value)}
              >
                <option value="">All Features</option>
                <option value="tutor_chat">Tutor Chat</option>
                <option value="quiz_generation">Quiz Generation</option>
                <option value="quiz_grading">Quiz Grading</option>
                <option value="concept_extraction">Concept Extraction</option>
                <option value="recommendation">Recommendation</option>
              </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>TIMESTAMP</th>
                    <th style={{ padding: '10px' }}>FEATURE</th>
                    <th style={{ padding: '10px' }}>MODEL</th>
                    <th style={{ padding: '10px' }}>LATENCY</th>
                    <th style={{ padding: '10px' }}>TOKENS</th>
                    <th style={{ padding: '10px' }}>EST. COST</th>
                    <th style={{ padding: '10px' }}>STATUS</th>
                    <th style={{ padding: '10px' }}>INSPECT</th>
                  </tr>
                </thead>
                <tbody>
                  {aiLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                      <td style={{ padding: '10px', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                        {new Date(log.created_at).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: '10px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {log.feature}
                      </td>
                      <td style={{ padding: '10px', color: 'var(--accent-purple)' }}>{log.model}</td>
                      <td style={{ padding: '10px', color: '#34d399' }}>{log.latency_ms}ms</td>
                      <td style={{ padding: '10px', color: 'var(--accent-cyan)' }}>
                        {(log.prompt_tokens || 0) + (log.completion_tokens || 0)}
                      </td>
                      <td style={{ padding: '10px' }}>${(log.estimated_cost || 0).toFixed(5)}</td>
                      <td style={{ padding: '10px' }}>
                        <span className={`badge badge-${log.success ? 'ready' : 'attention'}`} style={{ fontSize: '0.7rem' }}>
                          {log.success ? 'Success' : 'Error'}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <button onClick={() => setSelectedLog(log)} className="btn-ghost" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                          <Eye size={12} /> Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI Evaluations */}
      {activeAdminTab === 'evals' && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Automated AI Evaluation Scorecards</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Continuous regression testing covering Groundedness, Unsupported Refusals, AI Grading Accuracy, and Recommendation Alignment.
              </p>
            </div>
            <button onClick={handleRunEvals} disabled={isRunningEval} className="btn-primary" style={{ fontSize: '0.85rem' }}>
              <Play size={14} /> {isRunningEval ? 'Evaluating...' : 'Run Test Suite'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
            {evalRuns.map((run) => (
              <div
                key={run.id}
                style={{
                  padding: '18px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '10px',
                  border: `1px solid ${run.passed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                      {run.suite_name}
                    </span>
                    <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                      {run.test_name}
                    </h4>
                  </div>
                  <span className={`badge badge-${run.passed ? 'ready' : 'attention'}`}>
                    {run.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>

                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {run.details}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  <span>Score: <strong style={{ color: run.passed ? '#34d399' : '#fb7185' }}>{Math.round(run.score * 100)}%</strong></span>
                  <span>Latency: {run.latency_ms}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Background Worker Queue */}
      {activeAdminTab === 'queue' && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Background Task Queue Monitor</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>JOB ID</th>
                  <th style={{ padding: '10px' }}>TASK TYPE</th>
                  <th style={{ padding: '10px' }}>STATUS</th>
                  <th style={{ padding: '10px' }}>RETRIES</th>
                  <th style={{ padding: '10px' }}>CREATED AT</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                    <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {job.id.slice(0, 8)}...
                    </td>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{job.type}</td>
                    <td style={{ padding: '10px' }}>
                      <span className={`badge badge-${job.status === 'completed' ? 'improving' : job.status === 'running' ? 'processing' : 'stable'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>{job.retries} / {job.max_retries}</td>
                    <td style={{ padding: '10px', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                      {new Date(job.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trace Inspection Modal */}
      {selectedLog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '24px'
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '750px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '28px',
              gap: '16px',
              background: '#0e1424'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>AI Request Trace Details</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  {selectedLog.feature} • {selectedLog.model} • {selectedLog.latency_ms}ms
                </span>
              </div>
              <button onClick={() => setSelectedLog(null)} className="btn-ghost" style={{ fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>PROMPT PREVIEW:</div>
                <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', whiteSpace: 'pre-wrap', marginTop: '4px' }}>
                  {selectedLog.request_preview || 'No prompt preview logged'}
                </pre>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>RESPONSE PREVIEW:</div>
                <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', whiteSpace: 'pre-wrap', marginTop: '4px' }}>
                  {selectedLog.response_preview || 'No response preview logged'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
