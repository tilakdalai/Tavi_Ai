import { Ollama } from 'ollama';

const OLLAMA_HOST = 'https://ollama.com';
const DEFAULT_MODEL = 'beam:cloud';

export function getAIConfig() {
  const apiKey = process.env.OLLAMA_API_KEY || '';
  const model = process.env.OLLAMA_MODEL || DEFAULT_MODEL;

  const client = new Ollama({
    host: OLLAMA_HOST,
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
  });

  return {
    client,
    model,
    hasApiKey: Boolean(apiKey && apiKey !== 'your_ollama_cloud_api_key_here'),
    host: OLLAMA_HOST,
  };
}

export const aiConfig = getAIConfig();

