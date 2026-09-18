import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { Quiz, QuizQuestion } from '../../types';
import {
  Award,
  Play,
  CheckCircle2,
  XCircle,
  Sparkles,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Brain,
  RotateCcw,
  BarChart2,
  Clock,
  Plus
} from 'lucide-react';

export const AdaptiveQuizTab: React.FC = () => {
  const { activeProjectId, activeProjectDetails, refreshActiveProject } = useApp();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [openEndedAnswer, setOpenEndedAnswer] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');

  const loadQuizzes = async () => {
    if (!activeProjectId) return;
    try {
      const res = await fetch(`/api/quiz?projectId=${activeProjectId}`);
      const data = await res.json();
      setQuizzes(data.quizzes || []);
      if (data.quizzes?.length > 0 && !activeQuiz) {
        // Load details for first quiz
        const fullQuiz = await api.getQuiz(data.quizzes[0].id);
        setActiveQuiz(fullQuiz.quiz);
      }
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, [activeProjectId]);

  const handleStartNewQuiz = async () => {
    if (!activeProjectId) return;
    setIsGenerating(true);
    try {
      const data = await api.generateQuiz(activeProjectId, undefined, 3, difficulty);
      setActiveQuiz(data.quiz);
      setCurrentQuestionIndex(0);
      setSelectedOption('');
      setOpenEndedAnswer('');
      setEvaluationResult(null);
      await loadQuizzes();
    } catch (err) {
      console.error('Failed to generate quiz:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectQuiz = async (quizId: string) => {
    try {
      const full = await api.getQuiz(quizId);
      setActiveQuiz(full.quiz);
      setCurrentQuestionIndex(0);
      setSelectedOption('');
      setOpenEndedAnswer('');
      setEvaluationResult(null);
    } catch (err) {
      console.error('Failed to get quiz:', err);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!activeQuiz || !currentQuestion) return;

    const answer = currentQuestion.type === 'mcq' ? selectedOption : openEndedAnswer;
    if (!answer.trim()) return;

    setIsEvaluating(true);
    try {
      const result = await api.submitQuizAnswer({
        quizId: activeQuiz.id,
        questionId: currentQuestion.id,
        userAnswer: answer
      });

      setEvaluationResult(result);

      if (result.quiz_completed) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        await refreshActiveProject();
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (!activeQuiz?.questions) return;
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption('');
      setOpenEndedAnswer('');
      setEvaluationResult(null);
    }
  };

  const currentQuestion: QuizQuestion | undefined = activeQuiz?.questions?.[currentQuestionIndex];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', minHeight: '600px' }}>
      {/* Left Sidebar: Quiz History & Generator */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Adaptive Engine Settings
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['beginner', 'intermediate', 'advanced'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                className="btn-ghost"
                style={{
                  flex: 1,
                  padding: '6px 4px',
                  fontSize: '0.72rem',
                  textTransform: 'capitalize',
                  background: difficulty === diff ? 'var(--primary)' : 'rgba(255, 255, 255, 0.04)',
                  color: difficulty === diff ? '#ffffff' : 'var(--text-dim)',
                  fontWeight: 600
                }}
              >
                {diff}
              </button>
            ))}
          </div>

          <button
            onClick={handleStartNewQuiz}
            disabled={isGenerating}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '6px', fontSize: '0.85rem' }}
          >
            <Sparkles size={15} />
            {isGenerating ? 'Synthesizing Quiz...' : 'Start New Adaptive Quiz'}
          </button>
        </div>

        {/* Quizzes List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Quiz Attempts ({quizzes.length})
          </div>

          {quizzes.map((q) => {
            const isSelected = activeQuiz?.id === q.id;
            return (
              <div
                key={q.id}
                onClick={() => handleSelectQuiz(q.id)}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                  border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {q.title}
                  </span>
                  <span className={`badge badge-${q.status === 'completed' ? 'improving' : 'processing'}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                    {q.status === 'completed' ? `${q.score}%` : 'Active'}
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  {q.difficulty} • {q.total_questions} Questions
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Container: Active Quiz Player */}
      <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {activeQuiz && currentQuestion ? (
          <>
            {/* Header & Progress */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{activeQuiz.title}</h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Target Concept: <strong>{currentQuestion.concept_name || 'Project Core'}</strong> ({currentQuestion.difficulty})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-ready">
                  Question {currentQuestionIndex + 1} of {activeQuiz.questions?.length}
                </span>
                <span className="badge badge-stable">
                  Type: {currentQuestion.type === 'mcq' ? 'Multiple Choice' : 'Open-Ended'}
                </span>
              </div>
            </div>

            {/* Question Box */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '24px',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                lineHeight: '1.5'
              }}
            >
              {currentQuestion.question}
            </div>

            {/* Answer Input depending on Type */}
            {currentQuestion.type === 'mcq' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {currentQuestion.options?.map((opt, idx) => {
                  const isChecked = selectedOption === opt;
                  return (
                    <div
                      key={idx}
                      onClick={() => !evaluationResult && setSelectedOption(opt)}
                      style={{
                        padding: '14px 18px',
                        borderRadius: '10px',
                        background: isChecked ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                        border: isChecked ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                        cursor: evaluationResult ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '0.92rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: isChecked ? '6px solid var(--primary)' : '2px solid var(--text-dim)',
                          background: '#ffffff'
                        }}
                      />
                      <span>{opt}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <textarea
                  className="input-field"
                  rows={5}
                  placeholder="Type your structured explanation here. The AI evaluator will analyze conceptual understanding, technical accuracy, and key nuance coverage..."
                  value={openEndedAnswer}
                  onChange={(e) => !evaluationResult && setOpenEndedAnswer(e.target.value)}
                  disabled={Boolean(evaluationResult)}
                  style={{ resize: 'vertical', lineHeight: '1.5' }}
                />
              </div>
            )}

            {/* AI Multi-factor Evaluation Scorecard */}
            {evaluationResult && (
              <div
                style={{
                  background: evaluationResult.is_correct ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                  border: `1px solid ${evaluationResult.is_correct ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {evaluationResult.is_correct ? (
                      <CheckCircle2 size={22} color="#34d399" />
                    ) : (
                      <XCircle size={22} color="#fb7185" />
                    )}
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: evaluationResult.is_correct ? '#34d399' : '#fb7185' }}>
                      {evaluationResult.is_correct ? 'Correct & Well Explained' : 'Needs Further Review'}
                    </span>
                  </div>
                  <span className={`badge badge-${evaluationResult.is_correct ? 'improving' : 'attention'}`}>
                    Score: {evaluationResult.score}%
                  </span>
                </div>

                <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                  {evaluationResult.ai_feedback}
                </p>

                {/* Open ended breakdown if available */}
                {evaluationResult.evaluation_details && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
                        ✅ Key Concepts Covered:
                      </div>
                      <ul style={{ fontSize: '0.82rem', color: 'var(--text-muted)', paddingLeft: '16px', marginTop: '4px' }}>
                        {evaluationResult.evaluation_details.key_concepts_covered?.map((p: string, i: number) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fb7185', textTransform: 'uppercase' }}>
                        ⚠️ Missing / Weak Nuances:
                      </div>
                      <ul style={{ fontSize: '0.82rem', color: 'var(--text-muted)', paddingLeft: '16px', marginTop: '4px' }}>
                        {evaluationResult.evaluation_details.missing_concepts?.map((p: string, i: number) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              {!evaluationResult ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={isEvaluating || (currentQuestion.type === 'mcq' ? !selectedOption : !openEndedAnswer.trim())}
                  className="btn-primary"
                >
                  <Brain size={16} />
                  {isEvaluating ? 'Evaluating Response...' : 'Submit for AI Evaluation'}
                </button>
              ) : (
                <>
                  {currentQuestionIndex < (activeQuiz.questions?.length || 1) - 1 ? (
                    <button onClick={handleNextQuestion} className="btn-primary">
                      Next Question <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button onClick={handleStartNewQuiz} className="btn-secondary">
                      <RotateCcw size={16} /> Start Another Adaptive Quiz
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <Award size={48} color="var(--primary)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Ready to test your knowledge?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '450px' }}>
              Our adaptive assessment engine generates MCQs and open-ended questions targeting your weakest concepts.
            </p>
            <button onClick={handleStartNewQuiz} className="btn-primary" style={{ marginTop: '8px' }}>
              <Play size={16} /> Start Adaptive Assessment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
