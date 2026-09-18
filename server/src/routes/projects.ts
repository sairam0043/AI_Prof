import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppDatabase } from '../db/database.js';
import { EventDispatcher } from '../services/event-dispatcher.js';

export const projectsRouter = Router();

// GET all projects for a space or user
projectsRouter.get('/', (req: Request, res: Response) => {
  const spaceId = req.query.spaceId as string;
  const userId = (req.query.userId as string) || 'usr_sarah';

  let sql = `
    SELECT 
      p.*,
      COUNT(DISTINCT m.id) as material_count,
      COUNT(DISTINCT c.id) as concept_count,
      ROUND(AVG(c.estimated_mastery)) as average_mastery,
      MAX(le.created_at) as last_activity
    FROM projects p
    LEFT JOIN materials m ON m.project_id = p.id
    LEFT JOIN concepts c ON c.project_id = p.id
    LEFT JOIN learning_events le ON le.project_id = p.id
    WHERE p.user_id = ?
  `;
  const params: any[] = [userId];

  if (spaceId) {
    sql += ' AND p.space_id = ?';
    params.push(spaceId);
  }

  sql += ' GROUP BY p.id ORDER BY p.updated_at DESC';

  const projects = AppDatabase.query(sql, params);
  res.json({ projects });
});

// GET single project dashboard summary
projectsRouter.get('/:id', (req: Request, res: Response) => {
  const projectId = req.params.id;

  const project = AppDatabase.get<{
    id: string;
    space_id: string;
    user_id: string;
    name: string;
    description: string;
    learning_goal: string;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM projects WHERE id = ?', [projectId]);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Get concepts summary
  const concepts = AppDatabase.query(
    'SELECT id, name, category, importance, estimated_mastery, trend FROM concepts WHERE project_id = ? ORDER BY estimated_mastery ASC',
    [projectId]
  );

  // Get materials count & status
  const materials = AppDatabase.query(
    'SELECT id, title, filename, file_size, page_count, status, created_at FROM materials WHERE project_id = ?',
    [projectId]
  );

  // Get active recommendations
  const recommendations = AppDatabase.query(
    "SELECT * FROM recommendations WHERE project_id = ? AND status = 'active' ORDER BY created_at DESC",
    [projectId]
  );

  // Get learner context
  const learnerContext = AppDatabase.get('SELECT * FROM learner_context WHERE project_id = ?', [projectId]);

  // Get recent quizzes
  const recentQuizzes = AppDatabase.query(
    'SELECT id, title, score, total_questions, status, completed_at FROM quizzes WHERE project_id = ? ORDER BY created_at DESC LIMIT 5',
    [projectId]
  );

  // Calculate average mastery
  const avgMastery = concepts.length > 0
    ? Math.round(concepts.reduce((sum: number, c: any) => sum + c.estimated_mastery, 0) / concepts.length)
    : 0;

  res.json({
    project,
    metrics: {
      average_mastery: avgMastery,
      concepts_count: concepts.length,
      materials_count: materials.length,
      quizzes_completed: recentQuizzes.filter((q: any) => q.status === 'completed').length
    },
    concepts,
    materials,
    recommendations,
    learner_context: learnerContext ? {
      ...learnerContext,
      strengths: JSON.parse(learnerContext.strengths_json || '[]'),
      weaknesses: JSON.parse(learnerContext.weaknesses_json || '[]'),
      repeated_mistakes: JSON.parse(learnerContext.repeated_mistakes_json || '[]')
    } : null,
    recent_quizzes: recentQuizzes
  });
});

// POST create project
projectsRouter.post('/', (req: Request, res: Response) => {
  const { spaceId, name, description, learningGoal, userId = 'usr_sarah' } = req.body;

  if (!spaceId || !name || !learningGoal) {
    return res.status(400).json({ error: 'spaceId, name, and learningGoal are required' });
  }

  const projectId = uuidv4();
  AppDatabase.run(
    `INSERT INTO projects (id, space_id, user_id, name, description, learning_goal, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [projectId, spaceId, userId, name, description || '', learningGoal]
  );

  // Create default initial conversation
  const convId = uuidv4();
  AppDatabase.run(
    `INSERT INTO conversations (id, project_id, user_id, title)
     VALUES (?, ?, ?, 'Welcome Session')`,
    [convId, projectId, userId]
  );

  // Initial greeting
  AppDatabase.run(
    `INSERT INTO messages (id, conversation_id, role, content)
     VALUES (?, ?, 'tutor', ?)`,
    [
      uuidv4(),
      convId,
      `Hello! I am your AI Study Companion for **"${name}"**.\n\nYour learning goal is: *"${learningGoal}"*.\n\nTo get started, you can upload your PDF notes, textbook chapters, or reference slides in the **Materials** tab, or ask me any questions about the concepts you'd like to explore!`
    ]
  );

  EventDispatcher.dispatch({
    user_id: userId,
    project_id: projectId,
    event_type: 'project_created',
    payload: { name, spaceId, learningGoal }
  });

  const created = AppDatabase.get('SELECT * FROM projects WHERE id = ?', [projectId]);
  res.status(201).json({ project: created });
});

// DELETE project
projectsRouter.delete('/:id', (req: Request, res: Response) => {
  const projectId = req.params.id;
  AppDatabase.run('DELETE FROM projects WHERE id = ?', [projectId]);
  res.json({ success: true, message: 'Project deleted' });
});
