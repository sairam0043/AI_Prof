import { v4 as uuidv4 } from 'uuid';
import { AppDatabase } from '../db/database.js';
import { VectorStore, SearchResult } from './vector-store.js';
import { AIGateway } from './ai-gateway.js';
import { EventDispatcher } from './event-dispatcher.js';
import { Citation, Message } from '../types/index.js';

export interface TutorChatParams {
  conversationId: string;
  projectId: string;
  userId: string;
  userMessage: string;
  onChunk?: (textChunk: string) => void;
}

export class TutorService {
  public static async chat(params: TutorChatParams): Promise<Message> {
    const startTime = Date.now();
    const { conversationId, projectId, userId, userMessage, onChunk } = params;

    // 1. Fetch Project & Learning Goal
    const project = AppDatabase.get<{ id: string; name: string; learning_goal: string }>(
      'SELECT id, name, learning_goal FROM projects WHERE id = ?',
      [projectId]
    );

    // 2. Fetch Learner Context
    const learnerContext = AppDatabase.get<{
      strengths_json: string;
      weaknesses_json: string;
      repeated_mistakes_json: string;
    }>('SELECT strengths_json, weaknesses_json, repeated_mistakes_json FROM learner_context WHERE project_id = ?', [projectId]);

    const weaknesses = learnerContext ? JSON.parse(learnerContext.weaknesses_json || '[]') : [];

    // 3. Retrieve relevant chunks from project vector store
    const retrievedChunks: SearchResult[] = VectorStore.search(projectId, userMessage, 4);

    // 4. Fetch project concepts
    const concepts = AppDatabase.query<{ name: string; estimated_mastery: number; trend: string }>(
      'SELECT name, estimated_mastery, trend FROM concepts WHERE project_id = ? LIMIT 8',
      [projectId]
    );

    // 5. Check if we have sufficient grounding evidence
    const maxScore = retrievedChunks.length > 0 ? retrievedChunks[0].score : 0;
    const hasEvidence = retrievedChunks.length > 0 && maxScore > 0.08;

    // 6. Fetch recent conversation history (last 4 messages)
    const recentMessages = AppDatabase.query<{ role: string; content: string }>(
      'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 4',
      [conversationId]
    ).reverse();

    // 7. Save user message to database
    const userMsgId = uuidv4();
    AppDatabase.run(
      `INSERT INTO messages (id, conversation_id, role, content, created_at)
       VALUES (?, ?, 'user', ?, CURRENT_TIMESTAMP)`,
      [userMsgId, conversationId, userMessage]
    );

    // Build citations list
    const citations: Citation[] = [];
    if (hasEvidence) {
      for (const chunk of retrievedChunks.slice(0, 3)) {
        if (chunk.score > 0.1) {
          citations.push({
            source_title: chunk.material_title,
            page_number: chunk.page_number,
            quote: chunk.content.slice(0, 140) + (chunk.content.length > 140 ? '...' : ''),
            chunk_id: chunk.chunk_id,
            confidence: Math.round(chunk.score * 100) / 100
          });
        }
      }
    }

    let tutorAnswer = '';
    let promptTokens = 0;
    let completionTokens = 0;

    if (!hasEvidence && concepts.length > 0 && !this.isGeneralGreeting(userMessage)) {
      // PRD Requirement: Refusal & Graceful handling when project material lacks evidence
      const availableConceptNames = concepts.map((c) => c.name).slice(0, 5).join(', ');
      tutorAnswer = `I cannot find sufficient evidence in your uploaded study materials for **"${project?.name || 'this project'}"** to answer this reliably.

To prevent misinformation, I only answer questions directly grounded in your project documents. 

📚 **Indexed concepts available in this project:**
${availableConceptNames ? `• ${availableConceptNames}` : '• (Upload PDF materials to index concepts)'}

Feel free to ask about any of these topics or upload related course notes!`;
    } else {
      // Build System & Context Prompt
      const systemPrompt = `You are an elite, pedagogical AI Tutor dedicated to helping the student achieve their learning goal.
Project: "${project?.name || 'Study Workspace'}"
Learning Goal: "${project?.learning_goal || 'Understand core concepts deeply'}"
Student Known Weaknesses: ${weaknesses.length > 0 ? weaknesses.join(', ') : 'None identified yet'}.

STRICT GROUNDING & CITATION RULES:
1. Prioritize facts and principles from the provided PROJECT MATERIALS.
2. Structure your answers with clear explanations, bullet points, and intuitive analogies.
3. Whenever citing a fact, refer to the source material and page number (e.g. "[Source: Document Title — Page X]").
4. If the materials are ambiguous, state uncertainty rather than fabricating details.`;

      const contextChunksFormatted = retrievedChunks.map((c, i) => `--- EVIDENCE CHUNK ${i+1} [${c.material_title} | Page ${c.page_number} | Relevance: ${Math.round(c.score*100)}%] ---\n${c.content}`).join('\n\n');

      const userPrompt = `PROJECT EVIDENCE:
${contextChunksFormatted || 'No specific document chunks retrieved.'}

PROJECT CONCEPTS:
${concepts.map((c) => `- ${c.name} (Current Mastery: ${c.estimated_mastery}%, Status: ${c.trend})`).join('\n')}

CONVERSATION HISTORY:
${recentMessages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

STUDENT QUESTION:
${userMessage}

Please provide a grounded, structured, and pedagogical answer with clear citations to page numbers where applicable.`;

      const aiResult = await AIGateway.complete({
        feature: 'tutor_chat',
        userId,
        projectId,
        systemPrompt,
        userPrompt,
        temperature: 0.3
      });

      tutorAnswer = aiResult.text;
      promptTokens = aiResult.promptTokens;
      completionTokens = aiResult.completionTokens;
    }

    // Stream out chunks if callback provided
    if (onChunk) {
      // Simulate micro-chunk streaming for smooth UI effect
      const words = tutorAnswer.split(' ');
      for (let i = 0; i < words.length; i += 3) {
        const slice = words.slice(i, i + 3).join(' ') + ' ';
        onChunk(slice);
      }
    }

    const latencyMs = Date.now() - startTime;
    const tutorMsgId = uuidv4();

    // Save Tutor message to database
    AppDatabase.run(
      `INSERT INTO messages (id, conversation_id, role, content, citations_json, latency_ms, prompt_tokens, completion_tokens, created_at)
       VALUES (?, ?, 'tutor', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        tutorMsgId,
        conversationId,
        tutorAnswer,
        JSON.stringify(citations),
        latencyMs,
        promptTokens,
        completionTokens
      ]
    );

    // Dispatch learning event
    EventDispatcher.dispatch({
      user_id: userId,
      project_id: projectId,
      event_type: 'tutor_asked',
      payload: {
        conversation_id: conversationId,
        question_length: userMessage.length,
        has_citations: citations.length > 0,
        citation_count: citations.length
      }
    });

    return {
      id: tutorMsgId,
      conversation_id: conversationId,
      role: 'tutor',
      content: tutorAnswer,
      citations,
      latency_ms: latencyMs,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      created_at: new Date().toISOString()
    };
  }

  private static isGeneralGreeting(msg: string): boolean {
    const clean = msg.trim().toLowerCase();
    return ['hi', 'hello', 'hey', 'start', 'help', 'who are you', 'how are you'].includes(clean);
  }
}
