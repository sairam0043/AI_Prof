export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar_url?: string;
  created_at: string;
}

export interface Space {
  id: string;
  user_id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  created_at: string;
  project_count?: number;
}

export interface Project {
  id: string;
  space_id: string;
  user_id: string;
  name: string;
  description: string;
  learning_goal: string;
  created_at: string;
  updated_at: string;
  material_count?: number;
  concept_count?: number;
  average_mastery?: number;
  last_activity?: string;
}

export interface Material {
  id: string;
  project_id: string;
  title: string;
  filename: string;
  file_path: string;
  file_size: number;
  page_count: number;
  status: 'queued' | 'processing' | 'ready' | 'failed';
  error_message?: string;
  extracted_text?: string;
  created_at: string;
}

export interface MaterialChunk {
  id: string;
  material_id: string;
  project_id: string;
  chunk_index: number;
  page_number: number;
  section_title?: string;
  content: string;
  embedding?: number[];
  token_count: number;
}

export interface Concept {
  id: string;
  project_id: string;
  name: string;
  description: string;
  category: string;
  importance: number;
  estimated_mastery: number; // 0 to 100
  trend: 'improving' | 'stable' | 'requiring_attention';
  page_references: Array<{ material_id: string; material_title?: string; page_number: number; quote?: string }>;
  created_at: string;
  updated_at: string;
}

export interface LearnerContext {
  id: string;
  project_id: string;
  user_id: string;
  strengths: string[];
  weaknesses: string[];
  preferences: Record<string, any>;
  repeated_mistakes: string[];
  summary: string;
  updated_at: string;
}

export interface Citation {
  source_title: string;
  page_number: number;
  quote: string;
  chunk_id?: string;
  confidence?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'tutor' | 'system';
  content: string;
  citations?: Citation[];
  latency_ms?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  concept_id?: string;
  concept_name?: string;
  type: 'mcq' | 'open_ended';
  question: string;
  options?: string[];
  correct_answer?: string;
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  order_index: number;
  user_answer?: string;
  is_correct?: boolean;
  score?: number;
  ai_feedback?: string;
  evaluation_details?: {
    understanding_score: number;
    accuracy_score: number;
    key_concepts_covered: string[];
    missing_concepts: string[];
    feedback: string;
  };
}

export interface Quiz {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  focus_concept_ids: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'in_progress' | 'completed';
  score: number;
  total_questions: number;
  created_at: string;
  completed_at?: string;
  questions?: QuizQuestion[];
}

export interface Recommendation {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string;
  reason: string;
  action_type: 'review_material' | 'take_quiz' | 'tutor_practice' | 'deep_dive';
  target_concept_id?: string;
  target_concept_name?: string;
  target_material_id?: string;
  status: 'active' | 'completed' | 'dismissed';
  created_at: string;
}

export interface LearningEvent {
  id: string;
  user_id: string;
  project_id?: string;
  event_type: string;
  payload: Record<string, any>;
  created_at: string;
}

export interface AILog {
  id: string;
  user_id?: string;
  project_id?: string;
  feature: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
  estimated_cost: number;
  success: boolean;
  error_message?: string;
  request_preview?: string;
  response_preview?: string;
  created_at: string;
}

export interface AIEvalRun {
  id: string;
  suite_name: string;
  test_name: string;
  score: number;
  metrics: Record<string, any>;
  passed: boolean;
  latency_ms: number;
  details?: string;
  created_at: string;
}

export interface BackgroundJob {
  id: string;
  type: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  payload: Record<string, any>;
  retries: number;
  max_retries: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}
