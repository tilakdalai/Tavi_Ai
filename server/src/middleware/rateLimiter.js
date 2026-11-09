import rateLimit from 'express-rate-limit';

// General API Rate Limiter: 100 requests per 15 minutes per IP
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many requests from this IP, please try again after 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
});

// Stricter Rate Limiter for Chat and AI endpoints: 30 requests per minute
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many messages sent. Please slow down.',
      code: 'CHAT_RATE_LIMIT_EXCEEDED',
    },
  },
});

