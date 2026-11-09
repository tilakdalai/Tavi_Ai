import { Ollama } from 'ollama';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAIConfig } from '../config/ai.js';
import {
  isCreatorQuestion,
  getCreatorSystemDirective,
} from './creatorService.js';
import { formatMemoriesForPrompt } from './memoryService.js';
import {
  performWebSearch,
  shouldExecuteSearch,
} from '../modules/search/search.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from server directory and root directory
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

const BASE_SYSTEM_PROMPT = `
You are Tavi AI, an intelligent, helpful, and highly capable personal AI assistant created by Tilak Dalai.
Tagline: "One AI. Infinite Possibilities."
Attribution: "Designed & Developed by Tilak Dalai"

Instructions:
- Provide clear, accurate, in-depth, and well-structured answers with Markdown formatting.
- When generating code, always format with code fences and specify the language (e.g. \`\`\`java, \`\`\`python).
- Understand and naturally respond in the user's preferred language (English, Hindi, Hinglish, Odia, etc.).
- When asked about your creator, accurately state that you were designed and developed by Tilak Dalai, a developer and CSE student from Government College of Engineering, Kalahandi, Odisha, India.
- If live internet search results are provided in your context, prioritize the live data to answer current events, news, versions, weather, scores, and release information accurately. Cite sources.
`.trim();

/**
 * Prepares the message history array for the AI provider.
 */
export function prepareMessagesContext({
  historyMessages = [],
  newPrompt = '',
  memories = [],
  preferredLanguage = 'en',
  attachments = [],
  webSearchContext = '',
}) {
  const isCreatorQuery = isCreatorQuestion(newPrompt);

  let systemPrompt = BASE_SYSTEM_PROMPT;

  if (preferredLanguage === 'hi') {
    systemPrompt += `\n\n[LANGUAGE DIRECTIVE]: Respond primarily in clear, natural Hindi (हिंदी).`;
  } else if (preferredLanguage === 'hinglish') {
    systemPrompt += `\n\n[LANGUAGE DIRECTIVE]: Respond primarily in friendly Hinglish (Hindi written in Latin/English alphabet).`;
  } else if (preferredLanguage === 'or') {
    systemPrompt += `\n\n[LANGUAGE DIRECTIVE]: Respond primarily in authentic Odia (ଓଡ଼ିଆ) using proper Unicode font script.`;
  } else if (preferredLanguage === 'sa') {
    systemPrompt += `\n\n[LANGUAGE DIRECTIVE]: Respond in clear Sanskrit (संस्कृतम्).`;
  }

  if (memories && memories.length > 0) {
    systemPrompt += `\n\n${formatMemoriesForPrompt(memories)}`;
  }

  if (isCreatorQuery) {
    systemPrompt += `\n\n${getCreatorSystemDirective()}`;
  }

  if (webSearchContext) {
    systemPrompt += `\n\n[LIVE INTERNET SEARCH CONTEXT - RETRIEVED IN REAL TIME]:\n${webSearchContext}\n\n[DIRECTIVE]: Synthesize a comprehensive, factual answer based on the real-time search context above. Reference verified facts and dates accurately.`;
  }

  const formattedMessages = [{ role: 'system', content: systemPrompt }];

  // Sliding window: keep recent 12 turns
  const recentHistory = historyMessages.slice(-12);
  for (const msg of recentHistory) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      formattedMessages.push({ role: msg.role, content: msg.content });
    }
  }

  let fullUserContent = newPrompt;
  if (attachments && attachments.length > 0) {
    const attachmentTexts = attachments
      .filter((a) => a.textContent)
      .map((a) => `\n[ATTACHED FILE: ${a.name}]\n${a.textContent.slice(0, 8000)}\n[END FILE]`)
      .join('\n');
    if (attachmentTexts) {
      fullUserContent = `${fullUserContent}\n\n${attachmentTexts}`;
    }
  }

  if (fullUserContent) {
    formattedMessages.push({ role: 'user', content: fullUserContent });
  }

  return {
    messages: formattedMessages,
  };
}

/**
 * Live streaming caller with automated real-time web search integration.
 */
export async function streamChatResponse({
  res,
  history = [],
  userPrompt = '',
  memories = [],
  preferredLanguage = 'en',
  attachments = [],
  model = 'beam:cloud',
  searchMode = 'auto', // 'auto' | 'web' | 'ai_only'
  userId = 'guest',
  onComplete,
}) {
  // Reload environment variables so updates to server/.env take effect immediately
  dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
  dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

  const targetModel = model || process.env.OLLAMA_MODEL || 'beam:cloud';

  // Setup SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  const sendEvent = (eventData) => {
    res.write(`data: ${JSON.stringify(eventData)}\n\n`);
  };

  let webSearchSources = [];
  let webSearchContext = '';

  // 1. Check if real-time web search is required
  const needsSearch = shouldExecuteSearch(userPrompt, searchMode);

  if (needsSearch) {
    sendEvent({ status: 'Understanding your question...' });

    try {
      const searchResult = await performWebSearch({
        query: userPrompt,
        userId,
        mode: searchMode,
        maxResults: 6,
        deepScrape: true,
        onStatusUpdate: (statusText) => {
          sendEvent({ status: statusText });
        },
      });

      if (searchResult?.sources?.length > 0) {
        webSearchSources = searchResult.sources;
        webSearchContext = searchResult.aggregatedContext;

        // Send discovered sources to frontend for Google-style source cards
        sendEvent({
          sources: webSearchSources,
          status: 'Comparing verified sources...',
        });
      }
    } catch (searchErr) {
      console.warn('[Real-Time Search Warning]:', searchErr.message);
    }
  }

  sendEvent({ status: 'Preparing your answer...' });

  const { messages } = prepareMessagesContext({
    historyMessages: history,
    newPrompt: userPrompt,
    memories,
    preferredLanguage,
    attachments,
    webSearchContext,
  });

  let fullResponseText = '';

  // Check API keys
  const ollamaKey = process.env.OLLAMA_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const ollamaHost = process.env.OLLAMA_HOST || 'https://ollama.com';
  const isLocalOllama = ollamaHost.includes('localhost') || ollamaHost.includes('127.0.0.1');

  const hasValidOllamaKey = Boolean(ollamaKey && !ollamaKey.includes('your_') && ollamaKey.length > 5);
  const hasValidGeminiKey = Boolean(geminiKey && !geminiKey.includes('your_') && geminiKey.length > 5);
  const hasValidOpenAIKey = Boolean(openaiKey && !openaiKey.includes('your_') && openaiKey.length > 5);

  // If no API key is configured at all
  if (!hasValidOllamaKey && !hasValidGeminiKey && !hasValidOpenAIKey && !isLocalOllama) {
    const errorNotice = `⚠️ **Real-Time AI API Key Required**\n\nTavi AI connects directly to live AI models (Beam Cloud, Ollama, Gemini, or OpenAI) to generate real-time answers.\n\nCurrently, no active API key is set in your \`server/.env\` file.\n\n### How to activate real-time answers right now:\n1. Open \`server/.env\` on your computer.\n2. Add your API key using any of these supported providers:\n\n**Option A: Ollama Cloud (Beam Cloud)**\n\`\`\`env\nOLLAMA_API_KEY=your_actual_ollama_cloud_key_here\nOLLAMA_MODEL=beam:cloud\n\`\`\`\n\n**Option B: Google Gemini API (Free)**\n\`\`\`env\nGEMINI_API_KEY=AIzaSy...\n\`\`\`\n\n**Option C: OpenAI / Groq / OpenRouter**\n\`\`\`env\nOPENAI_API_KEY=sk-...\n\`\`\`\n\n3. Save \`server/.env\` and ask your question again. Tavi will immediately stream live real-time answers!`;

    sendEvent({ chunk: errorNotice, status: null });
    sendEvent({ done: true, fullResponse: errorNotice, sources: webSearchSources });
    if (onComplete) await onComplete(errorNotice, webSearchSources);
    return res.end();
  }

  // Clear status before streaming tokens
  sendEvent({ status: null });

  // 1. Try Beam Cloud / Ollama Cloud / Local Ollama
  if (hasValidOllamaKey || isLocalOllama) {
    try {
      const client = new Ollama({
        host: ollamaHost,
        headers: hasValidOllamaKey ? { Authorization: `Bearer ${ollamaKey}` } : {},
      });

      const stream = await client.chat({
        model: targetModel,
        messages,
        stream: true,
      });

      for await (const part of stream) {
        const chunk = part.message?.content || '';
        if (chunk) {
          fullResponseText += chunk;
          sendEvent({ chunk });
        }
      }

      sendEvent({ done: true, fullResponse: fullResponseText, sources: webSearchSources });
      if (onComplete) await onComplete(fullResponseText, webSearchSources);
      return res.end();
    } catch (ollamaErr) {
      console.warn('[Ollama API error, checking alternatives]:', ollamaErr.message);
    }
  }

  // 2. Try Google Gemini API if configured
  if (hasValidGeminiKey) {
    try {
      const systemInstruction = messages.find((m) => m.role === 'system')?.content || '';
      const conversationTurns = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${geminiKey}`;

      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: conversationTurns,
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        throw new Error(`Gemini API error (${geminiRes.status}): ${errText}`);
      }

      const reader = geminiRes.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;
            try {
              const parsed = JSON.parse(dataStr);
              const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (chunk) {
                fullResponseText += chunk;
                sendEvent({ chunk });
              }
            } catch {}
          }
        }
      }

      sendEvent({ done: true, fullResponse: fullResponseText, sources: webSearchSources });
      if (onComplete) await onComplete(fullResponseText, webSearchSources);
      return res.end();
    } catch (geminiErr) {
      console.warn('[Gemini API error]:', geminiErr.message);
    }
  }

  // 3. Try OpenAI / Groq / OpenRouter API if configured
  if (hasValidOpenAIKey) {
    try {
      const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

      const openaiRes = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: openaiModel,
          messages,
          stream: true,
        }),
      });

      if (!openaiRes.ok) {
        const errText = await openaiRes.text();
        throw new Error(`OpenAI API error (${openaiRes.status}): ${errText}`);
      }

      const reader = openaiRes.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              const chunk = parsed.choices?.[0]?.delta?.content || '';
              if (chunk) {
                fullResponseText += chunk;
                sendEvent({ chunk });
              }
            } catch {}
          }
        }
      }

      sendEvent({ done: true, fullResponse: fullResponseText, sources: webSearchSources });
      if (onComplete) await onComplete(fullResponseText, webSearchSources);
      return res.end();
    } catch (openaiErr) {
      console.warn('[OpenAI API error]:', openaiErr.message);
    }
  }

  // If all providers failed
  const failureMsg = `⚠️ **API Error:** Tavi could not connect to your configured AI provider.\n\nPlease verify that your API key is active and has available quota in \`server/.env\`.`;
  sendEvent({ chunk: failureMsg, status: null });
  sendEvent({ done: true, fullResponse: failureMsg, sources: webSearchSources });
  if (onComplete) await onComplete(failureMsg, webSearchSources);
  res.end();
}
