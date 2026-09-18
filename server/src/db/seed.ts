import { v4 as uuidv4 } from 'uuid';
import { AppDatabase } from './database.js';
import { VectorStore } from '../services/vector-store.js';

export function seedDatabase() {
  console.log('[Seed] Seeding database with rich study companion sample data...');

  const db = AppDatabase.getDB();

  // Clear existing data for clean seed
  db.exec(`
    DELETE FROM users;
    DELETE FROM spaces;
    DELETE FROM projects;
    DELETE FROM materials;
    DELETE FROM material_chunks;
    DELETE FROM concepts;
    DELETE FROM learner_context;
    DELETE FROM conversations;
    DELETE FROM messages;
    DELETE FROM quizzes;
    DELETE FROM quiz_questions;
    DELETE FROM quiz_answers;
    DELETE FROM recommendations;
    DELETE FROM learning_events;
    DELETE FROM ai_logs;
    DELETE FROM ai_eval_runs;
    DELETE FROM background_jobs;
  `);

  // 1. Users
  const user1 = { id: 'usr_sarah', name: 'Sarah Chen', email: 'sarah.chen@example.com', role: 'user', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' };
  const admin1 = { id: 'usr_admin', name: 'Alex Rivera (Admin)', email: 'admin@aistudy.internal', role: 'admin', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' };

  AppDatabase.run(`INSERT INTO users (id, name, email, role, avatar_url) VALUES (?, ?, ?, ?, ?)`, [user1.id, user1.name, user1.email, user1.role, user1.avatar_url]);
  AppDatabase.run(`INSERT INTO users (id, name, email, role, avatar_url) VALUES (?, ?, ?, ?, ?)`, [admin1.id, admin1.name, admin1.email, admin1.role, admin1.avatar_url]);

  // 2. Spaces
  const space1 = { id: 'spc_ml', user_id: user1.id, name: 'Machine Learning & AI Engineering', description: 'Deep learning theory, mathematical optimization, architectures, and evaluation.', icon: 'Brain', color: '#8b5cf6' };
  const space2 = { id: 'spc_dist', user_id: user1.id, name: 'Distributed Systems & Cloud', description: 'Consensus algorithms, replication strategies, and fault-tolerant architecture.', icon: 'Layers', color: '#06b6d4' };

  AppDatabase.run(`INSERT INTO spaces (id, user_id, name, description, icon, color) VALUES (?, ?, ?, ?, ?, ?)`, [space1.id, space1.user_id, space1.name, space1.description, space1.icon, space1.color]);
  AppDatabase.run(`INSERT INTO spaces (id, user_id, name, description, icon, color) VALUES (?, ?, ?, ?, ?, ?)`, [space2.id, space2.user_id, space2.name, space2.description, space2.icon, space2.color]);

  // 3. Projects
  const proj1 = {
    id: 'prj_nn_opt',
    space_id: space1.id,
    user_id: user1.id,
    name: 'Neural Network Optimization & Regularization',
    description: 'Mastering gradient descent variations, loss surfaces, vanishing gradients, and regularization techniques.',
    learning_goal: 'Develop an intuitive and mathematical mastery of deep neural network training dynamics and generalization techniques.'
  };

  const proj2 = {
    id: 'prj_rag_llm',
    space_id: space1.id,
    user_id: user1.id,
    name: 'RAG Systems & Vector Embeddings',
    description: 'Semantic vector spaces, hybrid retrieval, chunking heuristics, and citation faithfulness.',
    learning_goal: 'Design resilient retrieval-augmented generation pipelines with grounded citations and low latency.'
  };

  AppDatabase.run(`INSERT INTO projects (id, space_id, user_id, name, description, learning_goal) VALUES (?, ?, ?, ?, ?, ?)`, [proj1.id, proj1.space_id, proj1.user_id, proj1.name, proj1.description, proj1.learning_goal]);
  AppDatabase.run(`INSERT INTO projects (id, space_id, user_id, name, description, learning_goal) VALUES (?, ?, ?, ?, ?, ?)`, [proj2.id, proj2.space_id, proj2.user_id, proj2.name, proj2.description, proj2.learning_goal]);

  // 4. Materials for Project 1
  const mat1 = {
    id: 'mat_dl_notes',
    project_id: proj1.id,
    title: 'Deep Learning & Neural Optimization Handbook',
    filename: 'deep_learning_handbook.pdf',
    file_path: 'uploads/deep_learning_handbook.pdf',
    file_size: 2450000,
    page_count: 4,
    status: 'ready'
  };

  AppDatabase.run(
    `INSERT INTO materials (id, project_id, title, filename, file_path, file_size, page_count, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [mat1.id, mat1.project_id, mat1.title, mat1.filename, mat1.file_path, mat1.file_size, mat1.page_count, mat1.status]
  );

  // Material Chunks
  const chunkData = [
    {
      page: 1,
      content: 'Supervised Learning paradigms map high-dimensional input features X to target output labels Y through iterative empirical risk minimization. The model parameter set Theta is optimized over training batches to minimize expected task loss.'
    },
    {
      page: 2,
      content: 'Loss Functions and Gradient Optimization: The objective loss function measures the discrepancy between predicted and actual values. Gradient Descent computes the partial derivatives of the loss with respect to parameters (the gradient vector) and adjusts weights in the negative gradient direction scaled by the learning rate alpha. Stochastic Gradient Descent (SGD) with Momentum and Adam accelerate convergence across ill-conditioned ravines.'
    },
    {
      page: 3,
      content: 'Regularization and Overfitting: Deep models with large parameter capacity are vulnerable to memorizing training dataset noise rather than learning generalizable representations. L2 Regularization (Ridge / Weight Decay) penalizes large weight magnitudes by adding a quadratic penalty term to the loss function. Dropout randomly deactivates neurons during forward passes to prevent co-adaptation.'
    },
    {
      page: 4,
      content: 'Transformer Architectures and Self-Attention: Multi-Head Self-Attention projects queries, keys, and values across distinct representation subspaces, enabling models to capture long-range contextual relationships with parallelizable matrix operations.'
    }
  ];

  chunkData.forEach((cd, idx) => {
    const chunkId = uuidv4();
    const emb = VectorStore.generateEmbedding(cd.content);
    AppDatabase.run(
      `INSERT INTO material_chunks (id, material_id, project_id, chunk_index, page_number, content, embedding_json, token_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [chunkId, mat1.id, proj1.id, idx, cd.page, cd.content, JSON.stringify(emb), Math.round(cd.content.length / 4)]
    );
  });

  // 5. Concepts for Project 1
  const concepts = [
    {
      id: 'cpt_supervised',
      project_id: proj1.id,
      name: 'Supervised Learning Fundamentals',
      description: 'The mathematical framing of learning functions from labeled input-output training pairs.',
      category: 'Core Theory',
      importance: 5,
      estimated_mastery: 88,
      trend: 'improving',
      page_refs: [{ material_id: mat1.id, material_title: mat1.title, page_number: 1, quote: 'Supervised Learning paradigms map high-dimensional input features...' }]
    },
    {
      id: 'cpt_gradient_descent',
      project_id: proj1.id,
      name: 'Gradient Descent & Loss Optimization',
      description: 'Iterative optimization using loss partial derivatives and learning rate step sizes.',
      category: 'Optimization',
      importance: 5,
      estimated_mastery: 72,
      trend: 'stable',
      page_refs: [{ material_id: mat1.id, material_title: mat1.title, page_number: 2, quote: 'Gradient Descent computes the partial derivatives...' }]
    },
    {
      id: 'cpt_regularization',
      project_id: proj1.id,
      name: 'L2 Regularization & Weight Decay',
      description: 'Constraining weight norms via loss penalties to prevent high-variance overfitting.',
      category: 'Model Generalization',
      importance: 4,
      estimated_mastery: 52,
      trend: 'requiring_attention',
      page_refs: [{ material_id: mat1.id, material_title: mat1.title, page_number: 3, quote: 'L2 Regularization penalizes large weight magnitudes...' }]
    },
    {
      id: 'cpt_attention',
      project_id: proj1.id,
      name: 'Self-Attention & Multi-Head Projections',
      description: 'Dynamic contextual weighting mechanism using query, key, and value dot products.',
      category: 'Architectures',
      importance: 4,
      estimated_mastery: 42,
      trend: 'requiring_attention',
      page_refs: [{ material_id: mat1.id, material_title: mat1.title, page_number: 4, quote: 'Multi-Head Self-Attention projects queries, keys, and values...' }]
    }
  ];

  concepts.forEach((c) => {
    AppDatabase.run(
      `INSERT INTO concepts (id, project_id, name, description, category, importance, estimated_mastery, trend, page_references_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.project_id, c.name, c.description, c.category, c.importance, c.estimated_mastery, c.trend, JSON.stringify(c.page_refs)]
    );
  });

  // 6. Learner Context
  AppDatabase.run(
    `INSERT INTO learner_context (id, project_id, user_id, strengths_json, weaknesses_json, preferences_json, repeated_mistakes_json, summary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      `lc_${proj1.id}`,
      proj1.id,
      user1.id,
      JSON.stringify(['Supervised Learning Fundamentals', 'Empirical Risk Minimization']),
      JSON.stringify(['L2 Regularization & Weight Decay', 'Self-Attention & Multi-Head Projections']),
      JSON.stringify({ preferred_explanation_style: 'intuitive_with_math_examples', target_sessions_per_week: 4 }),
      JSON.stringify(['Confusing L1 sparsity with L2 weight shrinkage']),
      'Student demonstrates high fluency in fundamental machine learning concepts, but needs focused practice on regularization penalties and attention projection mechanics.'
    ]
  );

  // 7. Initial Conversation & Messages
  const conv1Id = 'cnv_default_session';
  AppDatabase.run(
    `INSERT INTO conversations (id, project_id, user_id, title)
     VALUES (?, ?, ?, 'Core Concepts & Optimization Walkthrough')`,
    [conv1Id, proj1.id, user1.id]
  );

  const initialCitations = [
    {
      source_title: mat1.title,
      page_number: 2,
      quote: 'Gradient Descent computes the partial derivatives of the loss with respect to parameters (the gradient vector)...'
    }
  ];

  AppDatabase.run(
    `INSERT INTO messages (id, conversation_id, role, content, citations_json, latency_ms, prompt_tokens, completion_tokens)
     VALUES (?, ?, 'user', 'Can you explain how Gradient Descent updates parameters and why learning rate choice is critical?', NULL, 0, 0, 0)`,
    [uuidv4(), conv1Id]
  );

  AppDatabase.run(
    `INSERT INTO messages (id, conversation_id, role, content, citations_json, latency_ms, prompt_tokens, completion_tokens)
     VALUES (?, ?, 'tutor', ?, ?, 240, 310, 185)`,
    [
      uuidv4(),
      conv1Id,
      `Here is how parameter updates work in Gradient Descent:

1. **Gradient Computation**: For each parameter $\\theta_j$, the algorithm calculates the partial derivative $\\frac{\\partial L}{\\partial \\theta_j}$, which indicates the direction of steepest ascent on the loss surface.
2. **Negative Direction Step**: To minimize loss, weights update in the *opposite* direction: $\\theta \\leftarrow \\theta - \\alpha \\nabla L(\\theta)$.
3. **Role of Learning Rate ($\\alpha$)**:
   - **Too Large**: The updates overshoot the minimum, causing oscillations or divergence.
   - **Too Small**: Convergence is painfully slow and prone to stagnation in saddle points.

> [Source: Deep Learning & Neural Optimization Handbook — Page 2]`,
      JSON.stringify(initialCitations)
    ]
  );

  // 8. Sample Completed Quiz
  const quiz1Id = 'qz_initial_assessment';
  AppDatabase.run(
    `INSERT INTO quizzes (id, project_id, user_id, title, focus_concept_ids_json, difficulty, status, score, total_questions, completed_at)
     VALUES (?, ?, ?, 'Foundational Neural Optimization Quiz', ?, 'intermediate', 'completed', 80, 2, CURRENT_TIMESTAMP)`,
    [quiz1Id, proj1.id, user1.id, JSON.stringify([concepts[1].id, concepts[2].id])]
  );

  const q1Id = uuidv4();
  const q2Id = uuidv4();

  AppDatabase.run(
    `INSERT INTO quiz_questions (id, quiz_id, concept_id, type, question, options_json, correct_answer, explanation, difficulty, order_index)
     VALUES (?, ?, ?, 'mcq', ?, ?, ?, ?, 'intermediate', 0)`,
    [
      q1Id,
      quiz1Id,
      concepts[2].id,
      'What is the mathematical effect of adding an L2 regularization term (weight decay) to the objective loss function?',
      JSON.stringify([
        'It forces non-informative feature weights strictly to zero',
        'It penalizes large weight magnitudes, shrinking parameters smoothly toward zero',
        'It doubles the gradient magnitude regardless of weight size',
        'It disables dropout layers during backpropagation'
      ]),
      'It penalizes large weight magnitudes, shrinking parameters smoothly toward zero',
      'L2 regularization adds lambda/2 * ||w||^2 to the loss, whose derivative shrinks weights proportionally to their magnitude.',
    ]
  );

  AppDatabase.run(
    `INSERT INTO quiz_answers (id, quiz_question_id, user_answer, is_correct, score, ai_feedback)
     VALUES (?, ?, ?, 1, 100, ?)`,
    [
      uuidv4(),
      q1Id,
      'It penalizes large weight magnitudes, shrinking parameters smoothly toward zero',
      '✅ Correct! L2 weight penalties encourage distributed, smaller weights across all connections.'
    ]
  );

  AppDatabase.run(
    `INSERT INTO quiz_questions (id, quiz_id, concept_id, type, question, correct_answer, explanation, difficulty, order_index)
     VALUES (?, ?, ?, 'open_ended', ?, ?, ?, 'intermediate', 1)`,
    [
      q2Id,
      quiz1Id,
      concepts[1].id,
      'Explain how Stochastic Gradient Descent differs from standard Batch Gradient Descent in terms of memory and convergence speed.',
      'Batch Gradient Descent computes gradients across the entire dataset per step, which is memory intensive and slow for large datasets. SGD computes gradients using single random samples or mini-batches, allowing much faster updates and escaping shallow local minima with stochastic noise.',
      'A complete answer addresses dataset pass size, memory efficiency, and gradient variance.'
    ]
  );

  AppDatabase.run(
    `INSERT INTO quiz_answers (id, quiz_question_id, user_answer, is_correct, score, ai_feedback, evaluation_details_json)
     VALUES (?, ?, ?, 1, 80, ?, ?)`,
    [
      uuidv4(),
      q2Id,
      'SGD uses random mini-batches instead of the full dataset, making updates faster and requiring less memory per step.',
      'Strong explanation. You identified the memory efficiency and update speed advantages. To make it perfect, also mention how stochastic noise helps escape saddle points.',
      JSON.stringify({
        understanding_score: 85,
        accuracy_score: 80,
        key_concepts_covered: ['Mini-batch sampling', 'Memory efficiency', 'Faster iteration'],
        missing_concepts: ['Stochastic noise escaping local minima / saddle points'],
        feedback: 'Strong answer demonstrating practical intuition.'
      })
    ]
  );

  // 9. Recommendations
  AppDatabase.run(
    `INSERT INTO recommendations (id, project_id, user_id, title, description, reason, action_type, target_concept_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    [
      uuidv4(),
      proj1.id,
      user1.id,
      'Targeted Drill: L2 Regularization vs L1 Sparsity',
      'Your understanding of weight decay is improving, but distinguishing L1 vs L2 behavior under noisy features requires practice. Take a 2-question focused quiz.',
      'Identified repeated mistake in regularization questions.',
      'take_quiz',
      concepts[2].id
    ]
  );

  AppDatabase.run(
    `INSERT INTO recommendations (id, project_id, user_id, title, description, reason, action_type, target_concept_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    [
      uuidv4(),
      proj1.id,
      user1.id,
      'Deep Dive: Multi-Head Attention Dimensions',
      'Ask the AI Tutor to explain how query, key, and value matrices are projected into d_k dimensional subspaces.',
      'Current mastery in Self-Attention is at 42%.',
      'tutor_practice',
      concepts[3].id
    ]
  );

  // 10. AI Telemetry Logs
  const sampleLogs = [
    { feature: 'tutor_chat', model: 'gemini-1.5-pro', prompt: 410, completion: 220, latency: 420, cost: 0.0037, success: 1 },
    { feature: 'quiz_generation', model: 'gemini-1.5-pro', prompt: 650, completion: 480, latency: 680, cost: 0.0073, success: 1 },
    { feature: 'quiz_grading', model: 'gemini-1.5-flash', prompt: 380, completion: 140, latency: 290, cost: 0.00028, success: 1 },
    { feature: 'concept_extraction', model: 'gemini-1.5-pro', prompt: 1200, completion: 390, latency: 950, cost: 0.0083, success: 1 },
    { feature: 'recommendation', model: 'gemini-1.5-flash', prompt: 520, completion: 180, latency: 310, cost: 0.00037, success: 1 }
  ];

  sampleLogs.forEach((log) => {
    AppDatabase.run(
      `INSERT INTO ai_logs (id, user_id, project_id, feature, model, prompt_tokens, completion_tokens, latency_ms, estimated_cost, success)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), user1.id, proj1.id, log.feature, log.model, log.prompt, log.completion, log.latency, log.cost, log.success]
    );
  });

  // 11. Initial AI Evaluation Runs
  const evalReports = [
    { suite: 'Groundedness & Retrieval', test: 'Tutor Grounded Citations Verification', score: 1.0, passed: 1, latency: 320, details: 'Passed: 100% of tested responses included verified page citations.' },
    { suite: 'Anti-Hallucination Guardrails', test: 'Unsupported Question Handling & Refusal', score: 1.0, passed: 1, latency: 280, details: 'Passed: Successfully refused 5 out-of-domain queries without hallucinations.' },
    { suite: 'Adaptive Assessment & AI Grading', test: 'Multi-Factor Open-Ended Evaluation', score: 0.95, passed: 1, latency: 410, details: 'Passed: High grading consistency (Pearson r = 0.94) against human benchmark.' },
    { suite: 'Personalized Growth Engine', test: 'Actionable Recommendation Generation', score: 1.0, passed: 1, latency: 340, details: 'Passed: All generated recommendations matched low-mastery concepts.' }
  ];

  evalReports.forEach((e) => {
    AppDatabase.run(
      `INSERT INTO ai_eval_runs (id, suite_name, test_name, score, metrics_json, passed, latency_ms, details)
       VALUES (?, ?, ?, ?, '{}', ?, ?, ?)`,
      [uuidv4(), e.suite, e.test, e.score, e.passed, e.latency, e.details]
    );
  });

  console.log('[Seed] Database seed completed successfully!');
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
}
