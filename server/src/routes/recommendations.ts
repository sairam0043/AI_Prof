import { Router, Request, Response } from 'express';
import { AppDatabase } from '../db/database.js';
import { RecommendationService } from '../services/recommendation-service.js';

export const recommendationsRouter = Router();

// GET active recommendations for a project
recommendationsRouter.get('/', (req: Request, res: Response) => {
  const projectId = req.query.projectId as string;
  const userId = (req.query.userId as string) || 'usr_sarah';

  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  const recs = AppDatabase.query(
    `SELECT r.*, c.name as target_concept_name, m.title as target_material_title
     FROM recommendations r
     LEFT JOIN concepts c ON r.target_concept_id = c.id
     LEFT JOIN materials m ON r.target_material_id = m.id
     WHERE r.project_id = ? AND r.user_id = ? AND r.status = 'active'
     ORDER BY r.created_at DESC`,
    [projectId, userId]
  );

  res.json({ recommendations: recs });
});

// POST refresh recommendations
recommendationsRouter.post('/refresh', async (req: Request, res: Response) => {
  const { projectId, userId = 'usr_sarah' } = req.body;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  try {
    const recommendations = await RecommendationService.generateRecommendations(projectId, userId, 'Manual Refresh');
    res.json({ recommendations });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to refresh recommendations' });
  }
});

// POST update recommendation status (complete or dismiss)
recommendationsRouter.post('/:id/status', (req: Request, res: Response) => {
  const recId = req.params.id;
  const { status } = req.body; // 'completed' | 'dismissed' | 'active'

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  AppDatabase.run('UPDATE recommendations SET status = ? WHERE id = ?', [status, recId]);
  res.json({ success: true, message: `Recommendation marked as ${status}` });
});
