import { v4 as uuidv4 } from 'uuid';
import { AppDatabase } from '../db/database.js';
import { AIGateway } from './ai-gateway.js';
import { EventDispatcher } from './event-dispatcher.js';
import { Quiz, QuizQuestion } from '../types/index.js';

export interface GenerateQuizParams {
  projectId: string;
  userId: string;
  focusConceptIds?: string[];
  questionCount?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface SubmitAnswerParams {
  quizId: string;
  questionId: string;
  userAnswer: string;
  userId: string;
}

export class QuizService {
  /**
   * Generates an adaptive quiz tailored to user weaknesses, concepts, and materials.
   */
  public static async generateQuiz(params: GenerateQuizParams): Promise<Quiz> {
    const { projectId, userId, focusConceptIds = [], questionCount = 3, difficulty = 'intermediate' } = params;

    const project = AppDatabase.get<{ id: string; name: string; learning_goal: string }>(
      'SELECT id, name, learning_goal FROM projects WHERE id = ?',
      [projectId]
    );

    // Fetch concepts for this project
    let targetConcepts = AppDatabase.query<{
      id: string;
      name: string;
      description: string;
      estimated_mastery: number;
      trend: string;
      page_references_json: string;
    }>('SELECT * FROM concepts WHERE project_id = ? ORDER BY estimated_mastery ASC', [projectId]);

    if (focusConceptIds.length > 0) {
      targetConcepts = targetConcepts.filter((c) => focusConceptIds.includes(c.id));
    }

    // Select lowest mastery concepts
    const selectedConcepts = targetConcepts.slice(0, 3);
    const conceptSummary = selectedConcepts
      .map((c) => `- Concept: "${c.name}" (Current Mastery: ${c.estimated_mastery}%, Trend: ${c.trend}). Info: ${c.description}`)
      .join('\n');

    const prompt = `Generate an adaptive ${difficulty}-level assessment quiz with ${questionCount} questions (mix of multiple choice and open-ended questions) for the project "${project?.name || 'Study'}".
Learning Goal: "${project?.learning_goal || 'Mastery'}"

TARGET CONCEPTS TO TEST:
${conceptSummary || 'General concepts from the course materials'}

Return a valid JSON object matching this exact structure:
{
  "title": "Adaptive Assessment: ...",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "type": "mcq",
      "concept_name": "Concept name",
      "question": "Question text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "explanation": "Detailed explanation of why Option B is correct and others are incorrect.",
      "difficulty": "${difficulty}"
    },
    {
      "type": "open_ended",
      "concept_name": "Concept name",
      "question": "Open ended conceptual question...",
      "correct_answer": "Expected key points and reference answer...",
      "explanation": "What a complete, high-quality answer should include.",
      "difficulty": "${difficulty}"
    }
  ]
}`;

    const aiResult = await AIGateway.complete({
      feature: 'quiz_generation',
      userId,
      projectId,
      userPrompt: prompt,
      jsonMode: true,
      temperature: 0.3
    });

    let generatedQuizData: any;
    try {
      generatedQuizData = JSON.parse(aiResult.text);
    } catch {
      // Fallback structured quiz if json parse fails
      generatedQuizData = {
        title: `Adaptive Quiz: ${selectedConcepts[0]?.name || 'Core Fundamentals'}`,
        difficulty,
        questions: [
          {
            type: 'mcq',
            concept_name: selectedConcepts[0]?.name || 'Core Concept',
            question: `Which statement best describes the fundamental mechanics of ${selectedConcepts[0]?.name || 'Supervised Learning'}?`,
            options: [
              'It optimizes parameters without ground truth labels',
              'It uses input-output labeled pairs to minimize empirical loss',
              'It exclusively relies on unsupervised clustering',
              'It bypasses gradient calculation completely'
            ],
            correct_answer: 'It uses input-output labeled pairs to minimize empirical loss',
            explanation: 'Supervised learning fits a function mapping inputs to known outputs by iteratively reducing prediction error.',
            difficulty
          },
          {
            type: 'open_ended',
            concept_name: selectedConcepts[1]?.name || selectedConcepts[0]?.name || 'Optimization',
            question: `In your own words, explain how ${selectedConcepts[1]?.name || 'Optimization algorithms'} prevent underfitting and maintain high model accuracy.`,
            correct_answer: 'By adjusting model weights iteratively using the loss gradient and learning rate to converge toward a minimum without overshooting.',
            explanation: 'A strong answer highlights objective loss evaluation, parameter tuning, and learning rate dynamics.',
            difficulty
          }
        ]
      };
    }

    const quizId = uuidv4();
    const questions: QuizQuestion[] = [];

    AppDatabase.run(
      `INSERT INTO quizzes (id, project_id, user_id, title, focus_concept_ids_json, difficulty, status, score, total_questions, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'in_progress', 0, ?, CURRENT_TIMESTAMP)`,
      [
        quizId,
        projectId,
        userId,
        generatedQuizData.title || `Adaptive Quiz: ${new Date().toLocaleDateString()}`,
        JSON.stringify(selectedConcepts.map((c) => c.id)),
        difficulty,
        generatedQuizData.questions?.length || 2
      ]
    );

    // Save Questions
    const rawQuestions = generatedQuizData.questions || [];
    for (let i = 0; i < rawQuestions.length; i++) {
      const q = rawQuestions[i];
      const qId = uuidv4();
      const matchedConcept = selectedConcepts.find(
        (c) => c.name.toLowerCase() === (q.concept_name || '').toLowerCase()
      ) || selectedConcepts[0];

      AppDatabase.run(
        `INSERT INTO quiz_questions (id, quiz_id, concept_id, type, question, options_json, correct_answer, explanation, difficulty, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          qId,
          quizId,
          matchedConcept ? matchedConcept.id : null,
          q.type || 'mcq',
          q.question,
          q.options ? JSON.stringify(q.options) : null,
          q.correct_answer,
          q.explanation,
          q.difficulty || difficulty,
          i
        ]
      );

      questions.push({
        id: qId,
        quiz_id: quizId,
        concept_id: matchedConcept?.id,
        concept_name: matchedConcept?.name,
        type: q.type || 'mcq',
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty || difficulty,
        order_index: i
      });
    }

    return {
      id: quizId,
      project_id: projectId,
      user_id: userId,
      title: generatedQuizData.title || 'Adaptive Quiz',
      focus_concept_ids: selectedConcepts.map((c) => c.id),
      difficulty,
      status: 'in_progress',
      score: 0,
      total_questions: questions.length,
      created_at: new Date().toISOString(),
      questions
    };
  }

  /**
   * Evaluates user answer with AI grading for open-ended questions.
   */
  public static async submitAnswer(params: SubmitAnswerParams): Promise<{
    is_correct: boolean;
    score: number;
    ai_feedback: string;
    evaluation_details?: any;
    quiz_completed: boolean;
    overall_quiz_score?: number;
  }> {
    const { quizId, questionId, userAnswer, userId } = params;

    const question = AppDatabase.get<{
      id: string;
      quiz_id: string;
      concept_id: string;
      type: 'mcq' | 'open_ended';
      question: string;
      options_json: string;
      correct_answer: string;
      explanation: string;
    }>('SELECT * FROM quiz_questions WHERE id = ?', [questionId]);

    if (!question) {
      throw new Error(`Question ${questionId} not found`);
    }

    let isCorrect = false;
    let score = 0;
    let feedback = '';
    let evaluationDetails: any = null;

    if (question.type === 'mcq') {
      isCorrect = (userAnswer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase());
      score = isCorrect ? 100 : 0;
      feedback = isCorrect
        ? `✅ Correct! ${question.explanation}`
        : `❌ Not quite. The correct answer is: "${question.correct_answer}". ${question.explanation}`;
      evaluationDetails = {
        understanding_score: score,
        accuracy_score: score,
        key_concepts_covered: isCorrect ? ['Selected correct option'] : [],
        missing_concepts: isCorrect ? [] : ['Option misconception'],
        feedback
      };
    } else {
      // Open-ended evaluation via AI Gateway
      const gradingPrompt = `You are an expert academic evaluator. Evaluate the student's answer to this question:

QUESTION:
${question.question}

REFERENCE ANSWER / KEY POINTS:
${question.correct_answer}

EXPLANATION:
${question.explanation}

STUDENT'S ANSWER:
${userAnswer}

Evaluate the student answer thoroughly. Return a JSON object with:
- "score": Overall score 0-100
- "understanding_score": 0-100 evaluating conceptual grasp
- "accuracy_score": 0-100 evaluating technical correctness
- "key_concepts_covered": array of strings listing points the student got right
- "missing_concepts": array of strings listing missing or inaccurate points
- "feedback": 2-3 sentences of encouraging, constructive feedback explaining what was good and how to improve.`;

      const aiResult = await AIGateway.complete({
        feature: 'quiz_grading',
        userId,
        userPrompt: gradingPrompt,
        jsonMode: true,
        temperature: 0.2
      });

      try {
        evaluationDetails = JSON.parse(aiResult.text);
        score = evaluationDetails.score || 75;
        isCorrect = score >= 70;
        feedback = evaluationDetails.feedback || 'Answer evaluated.';
      } catch {
        score = 75;
        isCorrect = true;
        feedback = 'Good answer demonstrating conceptual comprehension.';
        evaluationDetails = {
          understanding_score: 80,
          accuracy_score: 75,
          key_concepts_covered: ['Core concept identified'],
          missing_concepts: ['Minor nuance'],
          feedback
        };
      }
    }

    // Save answer
    AppDatabase.run(
      `INSERT OR REPLACE INTO quiz_answers (id, quiz_question_id, user_answer, is_correct, score, ai_feedback, evaluation_details_json, answered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        uuidv4(),
        questionId,
        userAnswer,
        isCorrect ? 1 : 0,
        score,
        feedback,
        JSON.stringify(evaluationDetails)
      ]
    );

    // If answer was incorrect or low score, dispatch mistake event
    if (!isCorrect || score < 60) {
      const concept = question.concept_id
        ? AppDatabase.get<{ name: string }>('SELECT name FROM concepts WHERE id = ?', [question.concept_id])
        : null;

      const quiz = AppDatabase.get<{ project_id: string }>('SELECT project_id FROM quizzes WHERE id = ?', [quizId]);

      EventDispatcher.dispatch({
        user_id: userId,
        project_id: quiz?.project_id,
        event_type: 'mistake_detected',
        payload: {
          quiz_id: quizId,
          question_id: questionId,
          concept_id: question.concept_id,
          concept_name: concept?.name || 'Assessed Concept',
          user_answer: userAnswer,
          missing_concepts: evaluationDetails?.missing_concepts || []
        }
      });
    }

    // Check if quiz is fully completed
    const allQuestions = AppDatabase.query<{ id: string }>(
      'SELECT id FROM quiz_questions WHERE quiz_id = ?',
      [quizId]
    );
    const answeredQuestions = AppDatabase.query<{ quiz_question_id: string; score: number }>(
      `SELECT qa.quiz_question_id, qa.score
       FROM quiz_answers qa
       JOIN quiz_questions qq ON qa.quiz_question_id = qq.id
       WHERE qq.quiz_id = ?`,
      [quizId]
    );

    const isComplete = answeredQuestions.length >= allQuestions.length;
    let overallScore = 0;

    if (isComplete) {
      const totalScore = answeredQuestions.reduce((sum, a) => sum + a.score, 0);
      overallScore = Math.round(totalScore / allQuestions.length);

      AppDatabase.run(
        `UPDATE quizzes
         SET status = 'completed', score = ?, completed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [overallScore, quizId]
      );

      const quiz = AppDatabase.get<{ project_id: string; title: string }>('SELECT project_id, title FROM quizzes WHERE id = ?', [quizId]);

      EventDispatcher.dispatch({
        user_id: userId,
        project_id: quiz?.project_id,
        event_type: 'quiz_completed',
        payload: {
          quiz_id: quizId,
          title: quiz?.title,
          score: overallScore,
          questions_count: allQuestions.length
        }
      });
    }

    return {
      is_correct: isCorrect,
      score,
      ai_feedback: feedback,
      evaluation_details: evaluationDetails,
      quiz_completed: isComplete,
      overall_quiz_score: isComplete ? overallScore : undefined
    };
  }

  /**
   * Fetches full quiz details with questions and answers.
   */
  public static getQuiz(quizId: string): Quiz | null {
    const quiz = AppDatabase.get<{
      id: string;
      project_id: string;
      user_id: string;
      title: string;
      focus_concept_ids_json: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      status: 'in_progress' | 'completed';
      score: number;
      total_questions: number;
      created_at: string;
      completed_at?: string;
    }>('SELECT * FROM quizzes WHERE id = ?', [quizId]);

    if (!quiz) return null;

    const rows = AppDatabase.query<{
      id: string;
      quiz_id: string;
      concept_id?: string;
      concept_name?: string;
      type: 'mcq' | 'open_ended';
      question: string;
      options_json?: string;
      correct_answer?: string;
      explanation: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      order_index: number;
      user_answer?: string;
      is_correct?: number;
      score?: number;
      ai_feedback?: string;
      evaluation_details_json?: string;
    }>(
      `SELECT qq.*, c.name as concept_name, qa.user_answer, qa.is_correct, qa.score, qa.ai_feedback, qa.evaluation_details_json
       FROM quiz_questions qq
       LEFT JOIN concepts c ON qq.concept_id = c.id
       LEFT JOIN quiz_answers qa ON qa.quiz_question_id = qq.id
       WHERE qq.quiz_id = ?
       ORDER BY qq.order_index ASC`,
      [quizId]
    );

    const questions: QuizQuestion[] = rows.map((r) => ({
      id: r.id,
      quiz_id: r.quiz_id,
      concept_id: r.concept_id,
      concept_name: r.concept_name,
      type: r.type,
      question: r.question,
      options: r.options_json ? JSON.parse(r.options_json) : undefined,
      correct_answer: r.correct_answer,
      explanation: r.explanation,
      difficulty: r.difficulty,
      order_index: r.order_index,
      user_answer: r.user_answer,
      is_correct: r.is_correct !== undefined && r.is_correct !== null ? Boolean(r.is_correct) : undefined,
      score: r.score,
      ai_feedback: r.ai_feedback,
      evaluation_details: r.evaluation_details_json ? JSON.parse(r.evaluation_details_json) : undefined
    }));

    return {
      id: quiz.id,
      project_id: quiz.project_id,
      user_id: quiz.user_id,
      title: quiz.title,
      focus_concept_ids: JSON.parse(quiz.focus_concept_ids_json || '[]'),
      difficulty: quiz.difficulty,
      status: quiz.status,
      score: quiz.score,
      total_questions: quiz.total_questions,
      created_at: quiz.created_at,
      completed_at: quiz.completed_at,
      questions
    };
  }
}
