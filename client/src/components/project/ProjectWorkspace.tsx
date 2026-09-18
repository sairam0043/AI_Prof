import React from 'react';
import { useApp } from '../../context/AppContext';
import { OverviewTab } from './OverviewTab';
import { MaterialsTab } from './MaterialsTab';
import { AITutorTab } from './AITutorTab';
import { AdaptiveQuizTab } from './AdaptiveQuizTab';
import { MasteryGrowthTab } from './MasteryGrowthTab';
import { ProjectAnalyticsTab } from './ProjectAnalyticsTab';
import {
  BookOpen,
  Brain,
  FileText,
  Award,
  TrendingUp,
  BarChart3,
  Sparkles,
  LayoutDashboard
} from 'lucide-react';

export const ProjectWorkspace: React.FC = () => {
  const { activeProjectDetails, projectTab, setProjectTab } = useApp();

  if (!activeProjectDetails) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading project workspace...</div>;
  }

  const { project, metrics } = activeProjectDetails;

  interface TabItem {
    id: 'overview' | 'materials' | 'tutor' | 'quiz' | 'mastery' | 'analytics';
    label: string;
    icon: any;
    count?: number;
    badge?: string;
    score?: string;
  }

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'materials', label: 'Materials & Knowledge', icon: FileText, count: metrics?.materials_count },
    { id: 'tutor', label: 'Grounded AI Tutor', icon: Brain, badge: 'Live' },
    { id: 'quiz', label: 'Adaptive Quiz', icon: Award, count: metrics?.quizzes_completed },
    { id: 'mastery', label: 'Mastery & Growth', icon: TrendingUp, score: `${metrics?.average_mastery || 0}%` },
    { id: 'analytics', label: 'Telemetry & Logs', icon: BarChart3 }
  ];

  return (
    <div style={{ padding: '28px 36px', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Project Title Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
              border: '1px solid var(--border-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <BookOpen size={24} color="var(--accent-cyan)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800 }} className="gradient-text">
                {project.name}
              </h1>
              <span className="badge badge-improving">{metrics?.average_mastery || 0}% Mastery</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '2px' }}>
              {project.description}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '2px',
          overflowX: 'auto'
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = projectTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setProjectTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                color: isActive ? 'var(--text-main)' : 'var(--text-dim)',
                fontSize: '0.88rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} color={isActive ? 'var(--primary)' : 'var(--text-dim)'} />
              <span>{tab.label}</span>

              {tab.score && (
                <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
                  {tab.score}
                </span>
              )}

              {tab.badge && (
                <span style={{ fontSize: '0.7rem', background: 'rgba(99, 102, 241, 0.25)', color: '#a5b4fc', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      <div style={{ marginTop: '6px' }}>
        {projectTab === 'overview' && <OverviewTab />}
        {projectTab === 'materials' && <MaterialsTab />}
        {projectTab === 'tutor' && <AITutorTab />}
        {projectTab === 'quiz' && <AdaptiveQuizTab />}
        {projectTab === 'mastery' && <MasteryGrowthTab />}
        {projectTab === 'analytics' && <ProjectAnalyticsTab />}
      </div>
    </div>
  );
};
