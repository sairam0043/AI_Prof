export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user', -- 'user' | 'admin'
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spaces (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'BookOpen',
  color TEXT DEFAULT '#6366f1',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  learning_goal TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  page_count INTEGER DEFAULT 1,
  status TEXT DEFAULT 'queued', -- 'queued' | 'processing' | 'ready' | 'failed'
  error_message TEXT,
  extracted_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS material_chunks (
  id TEXT PRIMARY KEY,
  material_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  page_number INTEGER DEFAULT 1,
  section_title TEXT,
  content TEXT NOT NULL,
  embedding_json TEXT, -- JSON array of floats for cosine similarity
  token_count INTEGER DEFAULT 0,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS concepts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'core',
  importance INTEGER DEFAULT 3, -- 1 to 5
  estimated_mastery INTEGER DEFAULT 50, -- 0 to 100
  trend TEXT DEFAULT 'stable', -- 'improving' | 'stable' | 'requiring_attention'
  page_references_json TEXT, -- JSON array of { material_id, page_number, quote }
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS learner_context (
  id TEXT PRIMARY KEY,
  project_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  strengths_json TEXT DEFAULT '[]',
  weaknesses_json TEXT DEFAULT '[]',
  preferences_json TEXT DEFAULT '{}',
  repeated_mistakes_json TEXT DEFAULT '[]',
  summary TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT DEFAULT 'Learning Session',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL, -- 'user' | 'tutor' | 'system'
  content TEXT NOT NULL,
  citations_json TEXT, -- JSON array of { source_title, page_number, quote, chunk_id }
  latency_ms INTEGER DEFAULT 0,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  focus_concept_ids_json TEXT DEFAULT '[]',
  difficulty TEXT DEFAULT 'intermediate', -- 'beginner' | 'intermediate' | 'advanced'
  status TEXT DEFAULT 'in_progress', -- 'in_progress' | 'completed'
  score INTEGER DEFAULT 0, -- percentage 0-100
  total_questions INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL,
  concept_id TEXT,
  type TEXT NOT NULL, -- 'mcq' | 'open_ended'
  question TEXT NOT NULL,
  options_json TEXT, -- JSON array of strings for MCQ
  correct_answer TEXT, -- option string for MCQ or reference answer for open-ended
  explanation TEXT,
  difficulty TEXT DEFAULT 'intermediate',
  order_index INTEGER DEFAULT 0,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS quiz_answers (
  id TEXT PRIMARY KEY,
  quiz_question_id TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT 0,
  score INTEGER DEFAULT 0, -- 0-100 for open ended
  ai_feedback TEXT,
  evaluation_details_json TEXT, -- { understanding_score, accuracy_score, key_concepts_covered, missing_concepts, feedback }
  answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recommendations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reason TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'review_material' | 'take_quiz' | 'tutor_practice' | 'deep_dive'
  target_concept_id TEXT,
  target_material_id TEXT,
  status TEXT DEFAULT 'active', -- 'active' | 'completed' | 'dismissed'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (target_concept_id) REFERENCES concepts(id) ON DELETE SET NULL,
  FOREIGN KEY (target_material_id) REFERENCES materials(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS learning_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT,
  event_type TEXT NOT NULL, -- 'project_created' | 'material_uploaded' | 'material_processed' | 'tutor_asked' | 'quiz_completed' | 'mastery_updated' | 'mistake_detected'
  payload_json TEXT DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  project_id TEXT,
  feature TEXT NOT NULL, -- 'tutor_chat' | 'quiz_generation' | 'quiz_grading' | 'concept_extraction' | 'recommendation' | 'eval_runner'
  model TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  estimated_cost REAL DEFAULT 0.0,
  success BOOLEAN DEFAULT 1,
  error_message TEXT,
  request_preview TEXT,
  response_preview TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_eval_runs (
  id TEXT PRIMARY KEY,
  suite_name TEXT NOT NULL, -- 'groundedness' | 'unsupported_questions' | 'quiz_grading' | 'recommendations'
  test_name TEXT NOT NULL,
  score REAL DEFAULT 0.0, -- 0 to 1.0 or percentage
  metrics_json TEXT DEFAULT '{}',
  passed BOOLEAN DEFAULT 1,
  latency_ms INTEGER DEFAULT 0,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS background_jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'process_document' | 'extract_concepts' | 'evaluate_quiz_growth' | 'generate_recommendations'
  status TEXT DEFAULT 'queued', -- 'queued' | 'running' | 'completed' | 'failed'
  payload_json TEXT NOT NULL,
  retries INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for maximum retrieval performance
CREATE INDEX IF NOT EXISTS idx_spaces_user ON spaces(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_space ON projects(space_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_project ON materials(project_id);
CREATE INDEX IF NOT EXISTS idx_chunks_project ON material_chunks(project_id);
CREATE INDEX IF NOT EXISTS idx_concepts_project ON concepts(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_project ON quizzes(project_id);
CREATE INDEX IF NOT EXISTS idx_recs_project ON recommendations(project_id);
CREATE INDEX IF NOT EXISTS idx_events_user ON learning_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_feature ON ai_logs(feature);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created ON ai_logs(created_at);
`;
