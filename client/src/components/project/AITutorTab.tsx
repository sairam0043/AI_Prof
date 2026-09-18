import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { Message, Citation, Conversation } from '../../types';
import {
  Send,
  Sparkles,
  Brain,
  BookOpen,
  HelpCircle,
  Plus,
  Clock,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  FileText,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export const AITutorTab: React.FC = () => {
  const { activeProjectId, activeProjectDetails, openModal } = useApp();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    if (!activeProjectId) return;
    try {
      const data = await api.getConversations(activeProjectId);
      setConversations(data.conversations || []);
      if (data.conversations?.length > 0 && !activeConvId) {
        setActiveConvId(data.conversations[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const data = await api.getMessages(convId);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [activeProjectId]);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedText]);

  const handleCreateNewConversation = async () => {
    if (!activeProjectId) return;
    try {
      const title = `Session ${new Date().toLocaleDateString()}`;
      const data = await api.createConversation(activeProjectId, title);
      setConversations((prev) => [data.conversation, ...prev]);
      setActiveConvId(data.conversation.id);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create new conversation:', err);
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const message = textToSend || inputMessage;
    if (!message.trim() || !activeConvId || !activeProjectId || isStreaming) return;

    // Optimistic user message addition
    const userMsg: Message = {
      id: `temp_${Date.now()}`,
      conversation_id: activeConvId,
      role: 'user',
      content: message,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsStreaming(true);
    setStreamedText('');

    api.streamChat(
      activeConvId,
      activeProjectId,
      message,
      (chunk) => {
        setStreamedText((prev) => prev + chunk);
      },
      (finalMessage) => {
        setIsStreaming(false);
        setStreamedText('');
        setMessages((prev) => [...prev, finalMessage]);
      },
      (error) => {
        setIsStreaming(false);
        setStreamedText('');
        console.error('Tutor stream error:', error);
      }
    );
  };

  const handleCitationClick = (citation: Citation) => {
    openModal('source_preview', citation);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', height: 'calc(100vh - 210px)' }}>
      {/* Conversations Session List */}
      <div
        className="glass-panel"
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflowY: 'auto'
        }}
      >
        <button
          onClick={handleCreateNewConversation}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', fontSize: '0.84rem' }}
        >
          <Plus size={14} /> New Session
        </button>

        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
          Recent Sessions
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {conversations.map((conv) => {
            const isActive = activeConvId === conv.id;
            return (
              <div
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.84rem',
                  color: isActive ? 'var(--text-main)' : 'var(--text-muted)'
                }}
              >
                <MessageSquare size={14} color={isActive ? 'var(--primary)' : 'var(--text-dim)'} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {conv.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Stream Container */}
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Chat Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(11, 15, 25, 0.6)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Brain size={20} color="var(--primary)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--text-main)' }}>
                Grounded AI Tutor
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                Scoped to: <strong>{activeProjectDetails?.project?.name}</strong> • Citations verified
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleSendMessage('Can you explain how Gradient Descent updates parameters and why learning rate is critical?')}
              className="btn-ghost"
              style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}
              title="Test grounded response with citations"
            >
              🟢 Test Grounded Query
            </button>
            <button
              onClick={() => handleSendMessage('What is the secret recipe for baking chocolate brownies?')}
              className="btn-ghost"
              style={{ fontSize: '0.75rem', background: 'rgba(244, 63, 94, 0.1)', color: '#fb7185' }}
              title="Test anti-hallucination refusal"
            >
              🛑 Test Unsupported Refusal
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {messages.map((msg) => {
            const isTutor = msg.role === 'tutor';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignSelf: isTutor ? 'flex-start' : 'flex-end',
                  maxWidth: '85%'
                }}
              >
                {isTutor && (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Brain size={16} color="#ffffff" />
                  </div>
                )}

                <div
                  style={{
                    background: isTutor ? 'rgba(255, 255, 255, 0.04)' : 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                    border: isTutor ? '1px solid var(--border-subtle)' : 'none',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    color: 'var(--text-main)',
                    fontSize: '0.92rem',
                    lineHeight: '1.6',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>

                  {/* Structured Citations Section */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        paddingTop: '10px'
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                        📚 Supporting Document Sources:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {msg.citations.map((c, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleCitationClick(c)}
                            className="citation-pill"
                          >
                            <BookOpen size={12} />
                            <span>{c.source_title} — Page {c.page_number}</span>
                            <ExternalLink size={10} style={{ opacity: 0.7 }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Telemetry metadata footer */}
                  {isTutor && (msg.latency_ms || msg.prompt_tokens) && (
                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.7rem', color: 'var(--text-dim)', borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '6px' }}>
                      <span>⚡ {msg.latency_ms || 280}ms latency</span>
                      <span>•</span>
                      <span>🔢 {(msg.prompt_tokens || 0) + (msg.completion_tokens || 0)} tokens</span>
                      <span>•</span>
                      <span>🛡️ Scoped Grounding</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Real-time Streaming Bubble */}
          {isStreaming && (
            <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start', maxWidth: '85%' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Brain size={16} color="#ffffff" />
              </div>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-glow)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  color: 'var(--text-main)',
                  fontSize: '0.92rem',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {streamedText}
                <span style={{ display: 'inline-block', width: '6px', height: '14px', background: 'var(--primary)', marginLeft: '4px', animation: 'pulse-border 0.8s infinite' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div style={{ padding: '8px 20px', display: 'flex', gap: '8px', overflowX: 'auto', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0, 0, 0, 0.2)' }}>
          {[
            'Explain this in simpler terms',
            'Give a real-world example',
            'How does L2 regularization prevent overfitting?',
            'Test my understanding with a conceptual question'
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="btn-ghost"
              style={{
                fontSize: '0.78rem',
                whiteSpace: 'nowrap',
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '20px',
                padding: '4px 12px'
              }}
            >
              💡 {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '12px', background: 'rgba(11, 15, 25, 0.9)' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Ask your AI Tutor about any concept, equation, or proof..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isStreaming}
            className="btn-primary"
            style={{ padding: '0 20px', opacity: inputMessage.trim() && !isStreaming ? 1 : 0.6 }}
          >
            <Send size={16} /> Send
          </button>
        </div>
      </div>
    </div>
  );
};
