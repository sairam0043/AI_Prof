import { Router, Request, Response } from 'express';
import { AppDatabase } from '../db/database.js';

export const adminRouter = Router();

// GET platform-wide observability overview
adminRouter.get('/overview', (req: Request, res: Response) => {
  const userCount = AppDatabase.get('SELECT COUNT(id) as count FROM users')?.count || 0;
  const spaceCount = AppDatabase.get('SELECT COUNT(id) as count FROM spaces')?.count || 0;
  const projectCount = AppDatabase.get('SELECT COUNT(id) as count FROM projects')?.count || 0;
  const materialCount = AppDatabase.get('SELECT COUNT(id) as count FROM materials')?.count || 0;
  const quizCount = AppDatabase.get("SELECT COUNT(id) as count FROM quizzes WHERE status = 'completed'")?.count || 0;

  // AI Telemetry aggregation
  const aiStats = AppDatabase.get(
    `SELECT 
      COUNT(id) as total_requests,
      SUM(prompt_tokens) as total_prompt_tokens,
      SUM(completion_tokens) as total_completion_tokens,
      ROUND(AVG(latency_ms)) as avg_latency_ms,
      SUM(estimated_cost) as total_cost,
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_requests,
      SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_requests
     FROM ai_logs`
  );

  // AI Usage by Feature
  const featureBreakdown = AppDatabase.query(
    `SELECT 
      feature,
      COUNT(id) as call_count,
      ROUND(AVG(latency_ms)) as avg_latency_ms,
      SUM(prompt_tokens + completion_tokens) as total_tokens,
      SUM(estimated_cost) as total_cost
     FROM ai_logs
     GROUP BY feature
     ORDER BY call_count DESC`
  );

  // Background Jobs summary
  const jobsSummary = AppDatabase.query(
    `SELECT status, COUNT(id) as count FROM background_jobs GROUP BY status`
  );

  // System Health
  const health = {
    database: 'healthy',
    background_worker: 'healthy',
    ai_gateway: (aiStats?.failed_requests || 0) === 0 ? 'operational' : 'degraded',
    uptime_seconds: Math.round(process.uptime())
  };

  res.json({
    platform: {
      users: userCount,
      spaces: spaceCount,
      projects: projectCount,
      materials: materialCount,
      quizzes: quizCount
    },
    ai_observability: {
      total_requests: aiStats?.total_requests || 0,
      total_tokens: (aiStats?.total_prompt_tokens || 0) + (aiStats?.total_completion_tokens || 0),
      avg_latency_ms: aiStats?.avg_latency_ms || 0,
      total_cost: aiStats?.total_cost || 0,
      success_rate: aiStats?.total_requests > 0
        ? Math.round(((aiStats?.successful_requests || 0) / aiStats.total_requests) * 100)
        : 100,
      feature_breakdown: featureBreakdown
    },
    jobs_summary: jobsSummary,
    health
  });
});

// GET detailed AI logs for inspection
adminRouter.get('/ai-logs', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const feature = req.query.feature as string;

  let sql = 'SELECT * FROM ai_logs';
  const params: any[] = [];

  if (feature) {
    sql += ' WHERE feature = ?';
    params.push(feature);
  }

  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  const logs = AppDatabase.query(sql, params);
  res.json({ logs });
});

// GET users inspection list
adminRouter.get('/users', (req: Request, res: Response) => {
  const users = AppDatabase.query(
    `SELECT u.*, 
      COUNT(DISTINCT s.id) as space_count,
      COUNT(DISTINCT p.id) as project_count,
      COUNT(DISTINCT q.id) as quiz_count
     FROM users u
     LEFT JOIN spaces s ON s.user_id = u.id
     LEFT JOIN projects p ON p.user_id = u.id
     LEFT JOIN quizzes q ON q.user_id = u.id AND q.status = 'completed'
     GROUP BY u.id`
  );

  res.json({ users });
});

// GET background jobs queue
adminRouter.get('/jobs', (req: Request, res: Response) => {
  const jobs = AppDatabase.query('SELECT * FROM background_jobs ORDER BY created_at DESC LIMIT 20');
  const parsed = jobs.map((j: any) => ({
    ...j,
    payload: JSON.parse(j.payload_json || '{}')
  }));

  res.json({ jobs: parsed });
});

// POST save AI system settings
adminRouter.post('/settings', (req: Request, res: Response) => {
  const { geminiApiKey, openaiApiKey, useMockAI } = req.body;

  if (geminiApiKey !== undefined) {
    process.env.GEMINI_API_KEY = geminiApiKey;
    AppDatabase.run(
      "INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES ('GEMINI_API_KEY', ?, CURRENT_TIMESTAMP)",
      [geminiApiKey ? 'SET' : '']
    );
  }

  if (openaiApiKey !== undefined) {
    process.env.OPENAI_API_KEY = openaiApiKey;
    AppDatabase.run(
      "INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES ('OPENAI_API_KEY', ?, CURRENT_TIMESTAMP)",
      [openaiApiKey ? 'SET' : '']
    );
  }

  if (useMockAI !== undefined) {
    process.env.USE_MOCK_AI = useMockAI ? 'true' : 'false';
    AppDatabase.run(
      "INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES ('USE_MOCK_AI', ?, CURRENT_TIMESTAMP)",
      [useMockAI ? 'true' : 'false']
    );
  }

  res.json({
    success: true,
    settings: {
      has_gemini_key: Boolean(process.env.GEMINI_API_KEY),
      has_openai_key: Boolean(process.env.OPENAI_API_KEY),
      use_mock_ai: process.env.USE_MOCK_AI === 'true'
    }
  });
});
