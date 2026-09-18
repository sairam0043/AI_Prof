import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { AppDatabase } from './db/database.js';
import { seedDatabase } from './db/seed.js';
import { BackgroundQueue } from './services/background-queue.js';
import { DocumentProcessor } from './services/document-processor.js';
import { MasteryService } from './services/mastery-service.js';
import { RecommendationService } from './services/recommendation-service.js';

import { spacesRouter } from './routes/spaces.js';
import { projectsRouter } from './routes/projects.js';
import { materialsRouter } from './routes/materials.js';
import { tutorRouter } from './routes/tutor.js';
import { quizRouter } from './routes/quiz.js';
import { conceptsRouter } from './routes/concepts.js';
import { recommendationsRouter } from './routes/recommendations.js';
import { analyticsRouter } from './routes/analytics.js';
import { adminRouter } from './routes/admin.js';
import { evalRouter } from './routes/eval.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads serving
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Initialize DB & Auto-seed on first launch if empty
AppDatabase.getDB();
try {
  const userCount = AppDatabase.query<{ c: number }>('SELECT count(*) as c FROM users')[0]?.c || 0;
  if (userCount === 0) {
    console.log('[Database] Empty database detected. Auto-seeding initial study companion data...');
    seedDatabase();
  }
} catch (e) {
  console.warn('[Database] Seed check warning:', e);
}

// Register Background Handlers
BackgroundQueue.registerHandler('process_document', async (payload) => {
  await DocumentProcessor.processMaterial(payload.materialId);
});

BackgroundQueue.registerHandler('evaluate_quiz_growth', async (payload) => {
  await MasteryService.evaluateProjectGrowth(payload.projectId, payload.userId);
  await RecommendationService.generateRecommendations(payload.projectId, payload.userId, 'Quiz Completed');
});

BackgroundQueue.registerHandler('generate_recommendations', async (payload) => {
  await RecommendationService.generateRecommendations(payload.projectId, payload.userId, payload.reason);
});

// Start Background Worker
BackgroundQueue.startWorker();

// Mount Routes
app.use('/api/spaces', spacesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/tutor', tutorRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/concepts', conceptsRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/eval', evalRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.round(process.uptime()),
    features: ['grounded_tutor', 'adaptive_quiz', 'concept_mastery', 'growth_analytics', 'observability']
  });
});

// Serve Frontend Static Build in Production
const possibleDistPaths = [
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../../../client/dist')
];
const clientDistPath = possibleDistPaths.find((p) => fs.existsSync(p));

if (clientDistPath) {
  console.log(`[Static] Serving React frontend from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[AI Study Companion Server] Running on http://localhost:${PORT}`);
});
