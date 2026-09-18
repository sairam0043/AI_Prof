import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import {
  FolderPlus,
  BookOpen,
  Upload,
  Sparkles,
  Sliders,
  CheckCircle2,
  FileText,
  ExternalLink
} from 'lucide-react';

export const Modals: React.FC = () => {
  const {
    activeModal,
    closeModal,
    spaces,
    activeSpaceId,
    activeProjectId,
    refreshData,
    refreshActiveProject,
    selectProject,
    selectedCitation
  } = useApp();

  // Create Space Form
  const [spaceName, setSpaceName] = useState('');
  const [spaceDesc, setSpaceDesc] = useState('');
  const [spaceColor, setSpaceColor] = useState('#8b5cf6');

  // Create Project Form
  const [targetSpaceId, setTargetSpaceId] = useState(activeSpaceId || (spaces[0]?.id || ''));
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [learningGoal, setLearningGoal] = useState('');

  // Upload Material Form
  const [materialTitle, setMaterialTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Settings Form
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [useMock, setUseMock] = useState(false);

  if (!activeModal) return null;

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceName.trim()) return;
    setIsSubmitting(true);
    try {
      await api.createSpace({ name: spaceName, description: spaceDesc, color: spaceColor });
      await refreshData();
      closeModal();
      setSpaceName('');
      setSpaceDesc('');
    } catch (err) {
      console.error('Failed to create space:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const sid = targetSpaceId || activeSpaceId || spaces[0]?.id;
    if (!projectName.trim() || !learningGoal.trim() || !sid) return;
    setIsSubmitting(true);
    try {
      const data = await api.createProject({
        spaceId: sid,
        name: projectName,
        description: projectDesc,
        learningGoal
      });
      await refreshData();
      closeModal();
      selectProject(data.project.id);
      setProjectName('');
      setProjectDesc('');
      setLearningGoal('');
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectId || !selectedFile) return;
    setIsSubmitting(true);
    try {
      await api.uploadMaterial(activeProjectId, selectedFile, materialTitle || selectedFile.name);
      await refreshActiveProject();
      closeModal();
      setSelectedFile(null);
      setMaterialTitle('');
    } catch (err) {
      console.error('Failed to upload material:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.saveAdminSettings({
        geminiApiKey: geminiKey || undefined,
        openaiApiKey: openaiKey || undefined,
        useMockAI: useMock
      });
      closeModal();
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
        padding: '20px'
      }}
      onClick={closeModal}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: activeModal === 'source_preview' ? '650px' : '520px',
          padding: '28px',
          background: '#0d1322',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          border: '1px solid var(--border-glow)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL 1: Create Space */}
        {activeModal === 'create_space' && (
          <form onSubmit={handleCreateSpace} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderPlus size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Create Learning Space</h3>
              </div>
              <button type="button" onClick={closeModal} className="btn-ghost">✕</button>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Space Name
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Machine Learning & AI Engineering"
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Description
              </label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Broad learning domain, certification goals, or area of study..."
                value={spaceDesc}
                onChange={(e) => setSpaceDesc(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Theme Color Accent
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'].map((c) => (
                  <div
                    key={c}
                    onClick={() => setSpaceColor(c)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: c,
                      cursor: 'pointer',
                      border: spaceColor === c ? '3px solid #ffffff' : 'none'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isSubmitting || !spaceName.trim()} className="btn-primary">
                {isSubmitting ? 'Creating...' : 'Create Space'}
              </button>
            </div>
          </form>
        )}

        {/* MODAL 2: Create Project */}
        {activeModal === 'create_project' && (
          <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={20} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Create Focused Project</h3>
              </div>
              <button type="button" onClick={closeModal} className="btn-ghost">✕</button>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Target Learning Space
              </label>
              <select
                className="input-field"
                value={targetSpaceId}
                onChange={(e) => setTargetSpaceId(e.target.value)}
              >
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Project Name
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Deep Neural Networks & Optimization"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Learning Goal (Core Focus)
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Master gradient descent variations, backprop equations, and regularization"
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Description
              </label>
              <textarea
                className="input-field"
                rows={2}
                placeholder="Details on what this project entails..."
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isSubmitting || !projectName.trim() || !learningGoal.trim()} className="btn-primary">
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        )}

        {/* MODAL 3: Upload Material */}
        {activeModal === 'upload_material' && (
          <form onSubmit={handleUploadMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={20} color="var(--accent-purple)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Upload Study Material</h3>
              </div>
              <button type="button" onClick={closeModal} className="btn-ghost">✕</button>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Document Title
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Neural Networks Chapter 3 Notes"
                value={materialTitle}
                onChange={(e) => setMaterialTitle(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                PDF File
              </label>
              <input
                type="file"
                accept=".pdf,.txt,.md"
                onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
                className="input-field"
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isSubmitting || !selectedFile} className="btn-primary">
                {isSubmitting ? 'Uploading & Enqueuing...' : 'Upload & Process'}
              </button>
            </div>
          </form>
        )}

        {/* MODAL 4: Citation Source Viewer */}
        {activeModal === 'source_preview' && selectedCitation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Source Evidence Excerpt</h3>
              </div>
              <button type="button" onClick={closeModal} className="btn-ghost">✕</button>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  {selectedCitation.source_title}
                </span>
                <span className="badge badge-ready">
                  Page {selectedCitation.page_number}
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6', fontStyle: 'italic', borderLeft: '3px solid var(--primary)', paddingLeft: '12px', marginTop: '6px' }}>
                "{selectedCitation.quote}"
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} className="btn-secondary">Close</button>
            </div>
          </div>
        )}

        {/* MODAL 5: AI System Settings */}
        {activeModal === 'ai_settings' && (
          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>AI Engine & Provider Settings</h3>
              </div>
              <button type="button" onClick={closeModal} className="btn-ghost">✕</button>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Google Gemini API Key (Optional)
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                OpenAI API Key (Optional)
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <input
                type="checkbox"
                id="mockCheck"
                checked={useMock}
                onChange={(e) => setUseMock(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <label htmlFor="mockCheck" style={{ fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                Force Local Simulation Mode (Offline Evaluator)
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Save Settings</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
