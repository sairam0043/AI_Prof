import { Router, Request, Response } from 'express';
import { AppDatabase } from '../db/database.js';
import { EvalService } from '../services/eval-service.js';

export const evalRouter = Router();

// GET all eval runs
evalRouter.get('/runs', (req: Request, res: Response) => {
  const runs = AppDatabase.query(
    'SELECT * FROM ai_eval_runs ORDER BY created_at DESC LIMIT 30'
  );

  const parsed = runs.map((r: any) => ({
    ...r,
    passed: Boolean(r.passed),
    metrics: r.metrics_json ? JSON.parse(r.metrics_json) : {}
  }));

  res.json({ runs: parsed });
});

// POST trigger full AI evaluation suite
evalRouter.post('/run', async (req: Request, res: Response) => {
  try {
    const report = await EvalService.runAllEvaluations();
    res.json({ success: true, report });
  } catch (err: any) {
    console.error('[EvalRoute] Evaluation suite execution failed:', err);
    res.status(500).json({ error: err.message || 'Evaluation failed' });
  }
});
