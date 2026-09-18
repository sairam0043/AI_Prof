import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import {
  FileText,
  Upload,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCode,
  Layers,
  Sparkles
} from 'lucide-react';

export const MaterialsTab: React.FC = () => {
  const { activeProjectId, activeProjectDetails, refreshActiveProject, openModal } = useApp();
  const [isUploadingDemo, setIsUploadingDemo] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null);

  if (!activeProjectDetails) {
    return <div style={{ padding: '30px', color: 'var(--text-muted)' }}>Loading materials...</div>;
  }

  const { materials } = activeProjectDetails;

  const handleGenerateDemo = async () => {
    if (!activeProjectId) return;
    setIsUploadingDemo(true);
    try {
      await api.createDemoMaterial(activeProjectId);
      await refreshActiveProject();
    } catch (err) {
      console.error('Failed to create demo material:', err);
    } finally {
      setIsUploadingDemo(false);
    }
  };

  const handleReprocess = async (materialId: string) => {
    try {
      await api.reprocessMaterial(materialId);
      await refreshActiveProject();
    } catch (err) {
      console.error('Failed to reprocess material:', err);
    }
  };

  const handleViewChunks = async (materialId: string) => {
    try {
      const data = await api.getMaterial(materialId);
      setSelectedMaterial(data);
    } catch (err) {
      console.error('Failed to fetch material chunks:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Action Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Project Learning Materials & Knowledge Base</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Upload PDFs or course notes. The system extracts pages, builds vector chunks, and pulls domain concepts automatically.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleGenerateDemo}
            disabled={isUploadingDemo}
            className="btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            <Sparkles size={15} color="var(--accent-purple)" />
            {isUploadingDemo ? 'Processing Notes...' : 'Add Sample Lecture Notes'}
          </button>

          <button onClick={() => openModal('upload_material')} className="btn-primary" style={{ fontSize: '0.85rem' }}>
            <Upload size={15} /> Upload PDF Material
          </button>
        </div>
      </div>

      {/* Materials Grid */}
      {materials && materials.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '18px' }}>
          {materials.map((mat: any) => {
            const isReady = mat.status === 'ready';
            const isProcessing = mat.status === 'processing';
            const isQueued = mat.status === 'queued';

            return (
              <div key={mat.id} className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FileText size={24} color="var(--primary)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>{mat.title}</h3>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                        {mat.filename} • {Math.round((mat.file_size || 1024) / 1024)} KB
                      </div>
                    </div>
                  </div>

                  <span className={`badge badge-${isReady ? 'ready' : isProcessing ? 'processing' : 'stable'}`}>
                    {mat.status}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    padding: '8px 12px',
                    borderRadius: '8px'
                  }}
                >
                  <span>📄 {mat.page_count || 1} Pages</span>
                  <span>•</span>
                  <span>🧩 {mat.chunk_count || 4} Semantic Chunks</span>
                  <span>•</span>
                  <span>🔍 Vector Indexed</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '12px',
                    marginTop: 'auto'
                  }}
                >
                  <button
                    onClick={() => handleViewChunks(mat.id)}
                    className="btn-ghost"
                    style={{ fontSize: '0.8rem' }}
                  >
                    <Eye size={14} /> Inspect Chunks & Citations
                  </button>

                  <button
                    onClick={() => handleReprocess(mat.id)}
                    className="btn-ghost"
                    style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}
                    title="Re-run background OCR, chunking & concept extraction"
                  >
                    <RefreshCw size={13} /> Reprocess
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="glass-panel"
          style={{
            padding: '50px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <FileText size={48} color="var(--text-dim)" />
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>No study materials uploaded for this project</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '420px' }}>
            Upload PDF textbook chapters or click "Add Sample Lecture Notes" to test grounded citations and knowledge extraction.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button onClick={handleGenerateDemo} className="btn-secondary">
              <Sparkles size={15} color="var(--accent-purple)" /> Add Sample Lecture Notes
            </button>
            <button onClick={() => openModal('upload_material')} className="btn-primary">
              <Upload size={15} /> Upload PDF
            </button>
          </div>
        </div>
      )}

      {/* Chunk & Knowledge Inspector Drawer / Modal */}
      {selectedMaterial && (
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
          onClick={() => setSelectedMaterial(null)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '850px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '28px',
              gap: '18px',
              background: '#0d1322'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  Material Chunks & Citations Inspector
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {selectedMaterial.material?.title} ({selectedMaterial.chunks?.length || 0} indexed chunks)
                </span>
              </div>
              <button onClick={() => setSelectedMaterial(null)} className="btn-ghost" style={{ fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
              {selectedMaterial.chunks?.map((c: any) => (
                <div
                  key={c.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-ready">Page {c.page_number}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Chunk #{c.chunk_index + 1} • ~{c.token_count} tokens
                    </span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                    {c.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
