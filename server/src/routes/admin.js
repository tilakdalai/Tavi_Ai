import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import CreatorProfile from '../models/CreatorProfile.js';
import UsageLog from '../models/UsageLog.js';
import { getDBStatus } from '../config/db.js';
import { getAIConfig } from '../config/ai.js';
import { VERIFIED_CREATOR } from '../services/creatorService.js';

const router = Router();

/**
 * Middleware: Verify user has administrator privileges.
 */
async function requireAdmin(req, res, next) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
  }

  // Allow admin if specified in env, or role === 'admin', or test mock
  const adminEmail = process.env.ADMIN_EMAIL || 'tilakdalai@gmail.com';
  const isAdmin =
    user.email === adminEmail ||
    user.role === 'admin' ||
    user.isMock ||
    process.env.NODE_ENV !== 'production';

  if (!isAdmin) {
    return res.status(403).json({
      error: { message: 'Forbidden. Administrator privileges required.', code: 'FORBIDDEN' },
    });
  }

  next();
}

/**
 * GET /api/admin/stats
 * Aggregated statistics for the Admin Dashboard.
 */
router.get('/admin/stats', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const dbStatus = getDBStatus();
    const { model, hasApiKey, host } = getAIConfig();

    if (dbStatus !== 'connected') {
      return res.status(200).json({
        stats: {
          totalUsers: 1,
          activeUsers: 1,
          totalConversations: 0,
          totalMessages: 0,
          databaseStatus: dbStatus,
          providerStatus: {
            provider: 'Beam Cloud / Ollama',
            model,
            hasKey: hasApiKey,
            host,
            status: hasApiKey ? 'active' : 'pending_key',
          },
          systemHealth: 'optimal',
          uptime: process.uptime(),
        },
      });
    }

    const [totalUsers, totalConversations, totalMessages, recentLogs] = await Promise.all([
      User.countDocuments(),
      Conversation.countDocuments(),
      Message.countDocuments(),
      UsageLog.find().sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    res.status(200).json({
      stats: {
        totalUsers,
        activeUsers: Math.max(totalUsers, 1),
        totalConversations,
        totalMessages,
        databaseStatus: dbStatus,
        providerStatus: {
          provider: 'Beam Cloud via Ollama',
          model,
          hasKey: hasApiKey,
          host,
          status: hasApiKey ? 'active' : 'local_ready',
        },
        systemHealth: 'healthy',
        uptime: process.uptime(),
        recentLogs,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/users
 * Paginated list of users for management.
 */
router.get('/admin/users', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const dbStatus = getDBStatus();
    if (dbStatus !== 'connected') {
      return res.status(200).json({
        users: [
          {
            userId: req.user.uid,
            firebaseUid: req.user.uid,
            displayName: req.user.displayName,
            email: req.user.email,
            role: 'admin',
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }

    const users = await User.find().sort({ createdAt: -1 }).limit(50).lean();
    res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/creator
 * Update creator profile record.
 */
router.patch('/admin/creator', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const dbStatus = getDBStatus();
    const updateData = req.body;

    if (dbStatus !== 'connected') {
      Object.assign(VERIFIED_CREATOR, updateData);
      return res.status(200).json({ creator: VERIFIED_CREATOR });
    }

    const profile = await CreatorProfile.findOneAndUpdate(
      {},
      { $set: updateData },
      { upsert: true, new: true }
    );

    res.status(200).json({ creator: profile });
  } catch (err) {
    next(err);
  }
});

export default router;

