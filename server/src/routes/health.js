import { Router } from 'express';
import { getDBStatus } from '../config/db.js';
import { getAIConfig } from '../config/ai.js';

const router = Router();
const startTime = Date.now();

router.get('/health', (req, res) => {
  const { model, hasApiKey } = getAIConfig();

  res.status(200).json({
    status: 'healthy',
    service: 'Tavi AI API',
    creator: 'Tilak Dalai',
    tagline: 'Your AI. Your Ideas. Your World.',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    environment: process.env.NODE_ENV || 'development',
    subsystems: {
      database: getDBStatus(),
      auth: 'native_ready',
      firebaseAuth: 'ready',
      aiModel: {
        model,
        hasKeyConfigured: hasApiKey,
        provider: 'Beam via Ollama Cloud',
      },
    },
  });
});

export default router;

