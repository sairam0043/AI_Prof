import {
  Space,
  Project,
  Material,
  Concept,
  Conversation,
  Message,
  Quiz,
  Recommendation,
  AILog,
  AIEvalRun,
  BackgroundJob
} from './types';

const API_BASE = '/api';

export const api = {
  // Spaces
  async getSpaces(): Promise<{ spaces: Space[] }> {
    const res = await fetch(`${API_BASE}/spaces`);
    return res.json();
  },

  async createSpace(data: { name: string; description: string; icon?: string; color?: string }): Promise<{ space: Space }> {
    const res = await fetch(`${API_BASE}/spaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Projects
  async getProjects(spaceId?: string): Promise<{ projects: Project[] }> {
    const url = spaceId ? `${API_BASE}/projects?spaceId=${spaceId}` : `${API_BASE}/projects`;
    const res = await fetch(url);
    return res.json();
  },

  async getProjectDetails(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${id}`);
    return res.json();
  },

  async createProject(data: { spaceId: string; name: string; description: string; learningGoal: string }): Promise<{ project: Project }> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Materials
  async getMaterials(projectId: string): Promise<{ materials: Material[] }> {
    const res = await fetch(`${API_BASE}/materials?projectId=${projectId}`);
    return res.json();
  },

  async getMaterial(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/materials/${id}`);
    return res.json();
  },

  async uploadMaterial(projectId: string, file: File, title?: string): Promise<any> {
    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('file', file);
    if (title) formData.append('title', title);

    const res = await fetch(`${API_BASE}/materials/upload`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  async createDemoMaterial(projectId: string, title?: string, textContent?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/materials/demo-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, title, textContent })
    });
    return res.json();
  },

  async reprocessMaterial(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/materials/${id}/reprocess`, { method: 'POST' });
    return res.json();
  },

  // AI Tutor & Conversations
  async getConversations(projectId: string): Promise<{ conversations: Conversation[] }> {
    const res = await fetch(`${API_BASE}/tutor/conversations?projectId=${projectId}`);
    return res.json();
  },

  async getMessages(conversationId: string): Promise<{ messages: Message[] }> {
    const res = await fetch(`${API_BASE}/tutor/conversations/${conversationId}/messages`);
    return res.json();
  },

  async createConversation(projectId: string, title?: string): Promise<{ conversation: Conversation }> {
    const res = await fetch(`${API_BASE}/tutor/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, title })
    });
    return res.json();
  },

  async chat(conversationId: string, projectId: string, message: string): Promise<{ response: Message }> {
    const res = await fetch(`${API_BASE}/tutor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, projectId, message })
    });
    return res.json();
  },

  streamChat(
    conversationId: string,
    projectId: string,
    message: string,
    onChunk: (text: string) => void,
    onDone: (message: Message) => void,
    onError: (err: string) => void
  ) {
    fetch(`${API_BASE}/tutor/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, projectId, message })
    })
      .then(async (response) => {
        if (!response.body) throw new Error('ReadableStream not supported');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const payload = JSON.parse(line.slice(6));
                if (payload.type === 'chunk') {
                  onChunk(payload.text);
                } else if (payload.type === 'done') {
                  onDone(payload.message);
                } else if (payload.type === 'error') {
                  onError(payload.error);
                }
              } catch (e) {
                console.error('Failed to parse SSE line:', line, e);
              }
            }
          }
        }
      })
      .catch((err) => onError(err.message));
  },

  // Adaptive Quiz
  async generateQuiz(
    projectId: string,
    focusConceptIds?: string[],
    questionCount: number = 3,
    difficulty: string = 'intermediate'
  ): Promise<{ quiz: Quiz }> {
    const res = await fetch(`${API_BASE}/quiz/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, focusConceptIds, questionCount, difficulty })
    });
    return res.json();
  },

  async getQuiz(id: string): Promise<{ quiz: Quiz }> {
    const res = await fetch(`${API_BASE}/quiz/${id}`);
    return res.json();
  },

  async submitQuizAnswer(data: {
    quizId: string;
    questionId: string;
    userAnswer: string;
  }): Promise<{
    is_correct: boolean;
    score: number;
    ai_feedback: string;
    evaluation_details?: any;
    quiz_completed: boolean;
    overall_quiz_score?: number;
  }> {
    const res = await fetch(`${API_BASE}/quiz/submit-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Concepts & Mastery
  async getConcepts(projectId: string): Promise<{
    concepts: Concept[];
    growth_summary: {
      improving: number;
      stable: number;
      requiring_attention: number;
      average_mastery: number;
    };
  }> {
    const res = await fetch(`${API_BASE}/concepts?projectId=${projectId}`);
    return res.json();
  },

  async evaluateGrowth(projectId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/concepts/evaluate-growth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId })
    });
    return res.json();
  },

  // Recommendations
  async getRecommendations(projectId: string): Promise<{ recommendations: Recommendation[] }> {
    const res = await fetch(`${API_BASE}/recommendations?projectId=${projectId}`);
    return res.json();
  },

  async refreshRecommendations(projectId: string): Promise<{ recommendations: Recommendation[] }> {
    const res = await fetch(`${API_BASE}/recommendations/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId })
    });
    return res.json();
  },

  async updateRecommendationStatus(id: string, status: 'completed' | 'dismissed'): Promise<any> {
    const res = await fetch(`${API_BASE}/recommendations/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  // Analytics
  async getProjectAnalytics(projectId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/project/${projectId}`);
    return res.json();
  },

  async getGlobalAnalytics(): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/global`);
    return res.json();
  },

  // Admin & Observability
  async getAdminOverview(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/overview`);
    return res.json();
  },

  async getAILogs(limit: number = 50, feature?: string): Promise<{ logs: AILog[] }> {
    const url = feature
      ? `${API_BASE}/admin/ai-logs?limit=${limit}&feature=${feature}`
      : `${API_BASE}/admin/ai-logs?limit=${limit}`;
    const res = await fetch(url);
    return res.json();
  },

  async getBackgroundJobs(): Promise<{ jobs: BackgroundJob[] }> {
    const res = await fetch(`${API_BASE}/admin/jobs`);
    return res.json();
  },

  async saveAdminSettings(data: { geminiApiKey?: string; openaiApiKey?: string; useMockAI?: boolean }): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async runAIEvalSuite(): Promise<{ success: boolean; report: AIEvalRun[] }> {
    const res = await fetch(`${API_BASE}/eval/run`, { method: 'POST' });
    return res.json();
  }
};
