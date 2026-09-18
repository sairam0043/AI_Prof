import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppDatabase } from '../db/database.js';
import { MasteryService } from '../services/mastery-service.js';

export const conceptsRouter = Router();

// GET all concepts for a project with growth breakdown
conceptsRouter.get('/', (req: Request, res: Response) => {
  const projectId = req.query.projectId as string;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  const concepts = AppDatabase.query(
    'SELECT * FROM concepts WHERE project_id = ? ORDER BY estimated_mastery ASC',
    [projectId]
  );

  const parsed = concepts.map((c: any) => ({
    ...c,
    page_references: c.page_references_json ? JSON.parse(c.page_references_json) : []
  }));

  const growthSummary = {
    improving: parsed.filter((c) => c.trend === 'improving').length,
    stable: parsed.filter((c) => c.trend === 'stable').length,
    requiring_attention: parsed.filter((c) => c.trend === 'requiring_attention').length,
    average_mastery: parsed.length > 0
      ? Math.round(parsed.reduce((sum, c) => sum + c.estimated_mastery, 0) / parsed.length)
      : 0
  };

  res.json({ concepts: parsed, growth_summary: growthSummary });
});

// POST re-evaluate project growth
conceptsRouter.post('/evaluate-growth', async (req: Request, res: Response) => {
  const { projectId, userId = 'usr_sarah' } = req.body;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  try {
    await MasteryService.evaluateProjectGrowth(projectId, userId);
    res.json({ success: true, message: 'Growth evaluated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Evaluation failed' });
  }
});

// POST manually create / edit concept
conceptsRouter.post('/', (req: Request, res: Response) => {
  const { projectId, name, description, category = 'General', importance = 3, estimatedMastery = 50 } = req.body;
  if (!projectId || !name) {
    return res.status(400).json({ error: 'projectId and name are required' });
  }

  const conceptId = uuidv4();
  AppDatabase.run(
    `INSERT INTO concepts (id, project_id, name, description, category, importance, estimated_mastery, trend, page_references_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'stable', '[]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [conceptId, projectId, name, description || '', category, importance, estimatedMastery]
  );

  const created = AppDatabase.get('SELECT * FROM concepts WHERE id = ?', [conceptId]);
  res.status(201).json({ concept: created });
});
