import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { v4 as uuidv4 } from 'uuid';
import { AppDatabase } from '../db/database.js';
import { BackgroundQueue } from '../services/background-queue.js';
import { EventDispatcher } from '../services/event-dispatcher.js';

export const materialsRouter = Router();

// Configure multer storage
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// GET materials for a project
materialsRouter.get('/', (req: Request, res: Response) => {
  const projectId = req.query.projectId as string;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  const materials = AppDatabase.query(
    `SELECT m.*, COUNT(mc.id) as chunk_count
     FROM materials m
     LEFT JOIN material_chunks mc ON mc.material_id = m.id
     WHERE m.project_id = ?
     GROUP BY m.id
     ORDER BY m.created_at DESC`,
    [projectId]
  );

  res.json({ materials });
});

// GET single material details with chunks
materialsRouter.get('/:id', (req: Request, res: Response) => {
  const materialId = req.params.id;
  const material = AppDatabase.get('SELECT * FROM materials WHERE id = ?', [materialId]);
  if (!material) {
    return res.status(404).json({ error: 'Material not found' });
  }

  const chunks = AppDatabase.query(
    'SELECT id, page_number, chunk_index, content, token_count FROM material_chunks WHERE material_id = ? ORDER BY chunk_index ASC',
    [materialId]
  );

  res.json({ material, chunks });
});

// POST upload PDF material
materialsRouter.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  const { projectId, title } = req.body;
  const file = req.file;

  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  const materialId = uuidv4();
  const materialTitle = title || file?.originalname || 'Study Document';
  const filename = file?.filename || `${materialId}.pdf`;
  const filePath = file?.path || path.join(UPLOAD_DIR, filename);
  const fileSize = file?.size || 0;

  AppDatabase.run(
    `INSERT INTO materials (id, project_id, title, filename, file_path, file_size, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'queued', CURRENT_TIMESTAMP)`,
    [materialId, projectId, materialTitle, filename, filePath, fileSize]
  );

  // Enqueue background processing job
  const jobId = BackgroundQueue.enqueue('process_document', {
    materialId,
    projectId
  });

  EventDispatcher.dispatch({
    user_id: 'usr_sarah',
    project_id: projectId,
    event_type: 'material_uploaded',
    payload: { materialId, title: materialTitle, jobId }
  });

  const created = AppDatabase.get('SELECT * FROM materials WHERE id = ?', [materialId]);
  res.status(202).json({
    message: 'File uploaded and enqueued for async processing',
    material: created,
    jobId
  });
});

// POST demo document creator for instant testing
materialsRouter.post('/demo-upload', (req: Request, res: Response) => {
  const { projectId, title, textContent } = req.body;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  const materialId = uuidv4();
  const materialTitle = title || 'Neural Attention & Transformers Lecture Notes';
  const filename = `demo_${materialId}.txt`;
  const filePath = path.join(UPLOAD_DIR, filename);

  const content = textContent || `Lecture 4: Self-Attention and Transformer Architecture
Page 1: Foundations of Attention Mechanisms
Traditional sequence models like RNNs suffer from sequential bottlenecking and vanishing gradients over long horizons. Attention mechanisms compute soft alignment scores between queries and keys.

Page 2: Scaled Dot-Product Attention
The attention score is computed as: Attention(Q, K, V) = softmax(Q * K^T / sqrt(d_k)) * V. Scaling by sqrt(d_k) prevents dot products from growing excessively large in high dimensions, which would cause the softmax function to push gradients into regions with extremely small derivatives.

Page 3: Multi-Head Attention Subspaces
Rather than performing a single attention function with d_model dimensional queries, keys, and values, multi-head attention linearly projects queries, keys, and values h times with distinct parameter matrices. This allows the model to jointly attend to information from different representation subspaces at different positions.

Page 4: Feed-Forward Networks & Residual Connections
Each sub-layer (Attention and Feed-Forward) employs a residual connection followed by Layer Normalization: Output = LayerNorm(x + Sublayer(x)). This stabilizes deep gradient propagation and enables training models with hundreds of layers.`;

  fs.writeFileSync(filePath, content, 'utf8');

  AppDatabase.run(
    `INSERT INTO materials (id, project_id, title, filename, file_path, file_size, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'queued', CURRENT_TIMESTAMP)`,
    [materialId, projectId, materialTitle, filename, filePath, content.length]
  );

  const jobId = BackgroundQueue.enqueue('process_document', {
    materialId,
    projectId
  });

  EventDispatcher.dispatch({
    user_id: 'usr_sarah',
    project_id: projectId,
    event_type: 'material_uploaded',
    payload: { materialId, title: materialTitle, jobId }
  });

  const created = AppDatabase.get('SELECT * FROM materials WHERE id = ?', [materialId]);
  res.status(202).json({
    message: 'Demo material enqueued for processing',
    material: created,
    jobId
  });
});

// POST reprocess material
materialsRouter.post('/:id/reprocess', (req: Request, res: Response) => {
  const materialId = req.params.id;
  const material = AppDatabase.get<{ id: string; project_id: string }>('SELECT id, project_id FROM materials WHERE id = ?', [materialId]);

  if (!material) {
    return res.status(404).json({ error: 'Material not found' });
  }

  AppDatabase.run(`UPDATE materials SET status = 'queued', error_message = NULL WHERE id = ?`, [materialId]);
  const jobId = BackgroundQueue.enqueue('process_document', {
    materialId,
    projectId: material.project_id
  });

  res.json({ message: 'Material re-queued for processing', jobId });
});

// DELETE material
materialsRouter.delete('/:id', (req: Request, res: Response) => {
  const materialId = req.params.id;
  AppDatabase.run('DELETE FROM materials WHERE id = ?', [materialId]);
  res.json({ success: true, message: 'Material deleted' });
});
