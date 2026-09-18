import { Router, Request, Response } from 'express';
import { AppDatabase } from '../db/database.js';

export const analyticsRouter = Router();

// GET project-level analytics
analyticsRouter.get('/project/:id', (req: Request, res: Response) => {
  const projectId = req.params.id;

  const project = AppDatabase.get('SELECT * FROM projects WHERE id = ?', [projectId]);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Concept mastery distribution
  const concepts = AppDatabase.query(
    'SELECT name, category, importance, estimated_mastery, trend FROM concepts WHERE project_id = ? ORDER BY estimated_mastery DESC',
    [projectId]
  );

  // Quiz history
  const quizScores = AppDatabase.query(
    "SELECT id, title, score, total_questions, difficulty, completed_at FROM quizzes WHERE project_id = ? AND status = 'completed' ORDER BY completed_at ASC",
    [projectId]
  );

  // Learning events timeline
  const events = AppDatabase.query(
    'SELECT * FROM learning_events WHERE project_id = ? ORDER BY created_at DESC LIMIT 15',
    [projectId]
  );

  const parsedEvents = events.map((e: any) => ({
    ...e,
    payload: e.payload_json ? JSON.parse(e.payload_json) : {}
  }));

  // AI Usage for this project
  const aiUsage = AppDatabase.get(
    `SELECT 
      COUNT(id) as total_calls,
      SUM(prompt_tokens) as total_prompt_tokens,
      SUM(completion_tokens) as total_completion_tokens,
      ROUND(AVG(latency_ms)) as avg_latency_ms,
      SUM(estimated_cost) as total_cost
     FROM ai_logs
     WHERE project_id = ?`,
    [projectId]
  );

  res.json({
    project,
    concepts,
    quiz_scores: quizScores,
    recent_events: parsedEvents,
    ai_usage: {
      total_calls: aiUsage?.total_calls || 0,
      total_tokens: (aiUsage?.total_prompt_tokens || 0) + (aiUsage?.total_completion_tokens || 0),
      avg_latency_ms: aiUsage?.avg_latency_ms || 0,
      total_cost: aiUsage?.total_cost || 0
    }
  });
});

// GET global user learning analytics
analyticsRouter.get('/global', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'usr_sarah';

  const user = AppDatabase.get('SELECT * FROM users WHERE id = ?', [userId]);
  const spacesCount = AppDatabase.get('SELECT COUNT(id) as count FROM spaces WHERE user_id = ?', [userId])?.count || 0;
  const projectsCount = AppDatabase.get('SELECT COUNT(id) as count FROM projects WHERE user_id = ?', [userId])?.count || 0;
  const materialsCount = AppDatabase.get(
    `SELECT COUNT(m.id) as count FROM materials m JOIN projects p ON m.project_id = p.id WHERE p.user_id = ?`,
    [userId]
  )?.count || 0;

  const quizStats = AppDatabase.get(
    `SELECT 
      COUNT(q.id) as completed_count,
      ROUND(AVG(q.score)) as avg_score
     FROM quizzes q
     WHERE q.user_id = ? AND q.status = 'completed'`,
    [userId]
  );

  const totalMasteryStats = AppDatabase.get(
    `SELECT 
      COUNT(c.id) as total_concepts,
      SUM(CASE WHEN c.trend = 'improving' THEN 1 ELSE 0 END) as improving_count,
      SUM(CASE WHEN c.trend = 'requiring_attention' THEN 1 ELSE 0 END) as attention_count,
      ROUND(AVG(c.estimated_mastery)) as avg_mastery
     FROM concepts c
     JOIN projects p ON c.project_id = p.id
     WHERE p.user_id = ?`,
    [userId]
  );

  const globalEvents = AppDatabase.query(
    `SELECT le.*, p.name as project_name
     FROM learning_events le
     LEFT JOIN projects p ON le.project_id = p.id
     WHERE le.user_id = ?
     ORDER BY le.created_at DESC
     LIMIT 20`,
    [userId]
  );

  res.json({
    user,
    overview: {
      spaces_count: spacesCount,
      projects_count: projectsCount,
      materials_count: materialsCount,
      quizzes_completed: quizStats?.completed_count || 0,
      average_quiz_score: quizStats?.avg_score || 0,
      total_concepts: totalMasteryStats?.total_concepts || 0,
      average_mastery: totalMasteryStats?.avg_mastery || 0,
      improving_concepts: totalMasteryStats?.improving_count || 0,
      requiring_attention: totalMasteryStats?.attention_count || 0
    },
    activity_stream: globalEvents.map((e: any) => ({
      ...e,
      payload: e.payload_json ? JSON.parse(e.payload_json) : {}
    }))
  });
});
