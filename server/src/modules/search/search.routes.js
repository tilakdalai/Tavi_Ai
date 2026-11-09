import { Router } from 'express';
import { Ollama } from 'ollama';
import { performWebSearch, classifyQuery } from './search.service.js';
import SearchSources from '../../models/SearchSources.js';
import SearchFeedback from '../../models/SearchFeedback.js';
import { getDBStatus } from '../../config/db.js';
import { isCreatorQuestion, getCreatorSystemDirective } from '../../services/creatorService.js';

const router = Router();

/**
 * POST /api/search
 * Search the internet using multi-provider adapter.
 */
router.post('/search', async (req, res, next) => {
  try {
    const { query, mode = 'web', maxResults = 6 } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        error: { message: 'Search query cannot be empty.', code: 'INVALID_QUERY' },
      });
    }

    const userId = req.user?.uid || 'guest';
    const searchData = await performWebSearch({
      query: query.trim(),
      userId,
      mode,
      maxResults: Math.min(Math.max(parseInt(maxResults, 10) || 6, 1), 12),
      deepScrape: false,
    });

    res.status(200).json({
      query: searchData.query,
      category: searchData.category,
      provider: searchData.provider,
      resultCount: searchData.sources.length,
      sources: searchData.sources,
      retrievedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/search/answer
 * Direct non-streaming search & answer synthesis endpoint.
 */
router.post('/search/answer', async (req, res, next) => {
  try {
    const { query, mode = 'web', model = 'beam:cloud', language = 'en' } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        error: { message: 'Search query cannot be empty.', code: 'INVALID_QUERY' },
      });
    }

    const userId = req.user?.uid || 'guest';
    const searchData = await performWebSearch({
      query: query.trim(),
      userId,
      mode,
      maxResults: 6,
      deepScrape: true,
    });

    const isCreator = isCreatorQuestion(query);
    let systemPrompt = `You are Tavi AI, an intelligent personal AI assistant created by Tilak Dalai.
Tagline: "One AI. Infinite Possibilities."
Attribution: "Designed & Developed by Tilak Dalai"

Synthesize an authoritative, structured, and factual answer based on the real-time search context below. Cite verified facts and include links to the sources.`;

    if (isCreator) {
      systemPrompt += `\n\n${getCreatorSystemDirective()}`;
    }

    if (searchData.aggregatedContext) {
      systemPrompt += `\n\n[LIVE INTERNET SEARCH CONTEXT]:\n${searchData.aggregatedContext}`;
    }

    let answerText = '';
    const ollamaKey = process.env.OLLAMA_API_KEY;
    const ollamaHost = process.env.OLLAMA_HOST || 'https://ollama.com';
    const isLocalOllama = ollamaHost.includes('localhost') || ollamaHost.includes('127.0.0.1');

    if (ollamaKey || isLocalOllama) {
      try {
        const client = new Ollama({
          host: ollamaHost,
          headers: ollamaKey ? { Authorization: `Bearer ${ollamaKey}` } : {},
        });
        const aiRes = await client.chat({
          model: model || process.env.OLLAMA_MODEL || 'beam:cloud',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query.trim() },
          ],
          stream: false,
        });
        answerText = aiRes.message?.content || '';
      } catch (ollamaErr) {
        console.warn('[search/answer Ollama error]:', ollamaErr.message);
      }
    }

    // Fallback: structured synthesized summary from sources if no LLM generation
    if (!answerText) {
      const topSources = searchData.sources.slice(0, 4);
      answerText = `## Live Web Search Results for "${query}"\n\n` +
        topSources.map((s, i) => `### ${i + 1}. [${s.title}](${s.url})\n**Domain:** \`${s.domain}\`\n\n${s.snippet}\n`).join('\n') +
        `\n---\n*Retrieved live from verified web sources by Tavi AI.*`;
    }

    res.status(200).json({
      query: searchData.query,
      category: searchData.category,
      provider: searchData.provider,
      answer: answerText,
      sources: searchData.sources,
      retrievedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/search/sources/:id
 * Retrieve sources for a specific search ID.
 */
router.get('/search/sources/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const dbStatus = getDBStatus();

    if (dbStatus !== 'connected') {
      return res.status(200).json({ sources: [] });
    }

    const sources = await SearchSources.find({ searchId: id }).lean();
    res.status(200).json({ sources });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/search/feedback
 * Submit rating/feedback for search results.
 */
router.post('/search/feedback', async (req, res, next) => {
  try {
    const { searchId, rating, feedbackText } = req.body;
    const userId = req.user?.uid || 'guest';

    if (!searchId || !rating) {
      return res.status(400).json({
        error: { message: 'searchId and rating are required.', code: 'INVALID_FEEDBACK' },
      });
    }

    const dbStatus = getDBStatus();
    if (dbStatus === 'connected') {
      await SearchFeedback.create({
        userId,
        searchId,
        rating,
        feedbackText: feedbackText || '',
      });
    }

    res.status(200).json({ success: true, message: 'Feedback recorded.' });
  } catch (err) {
    next(err);
  }
});

export default router;
