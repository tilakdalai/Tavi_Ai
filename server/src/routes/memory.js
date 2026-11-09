import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getUserMemories,
  saveUserMemory,
  deleteUserMemory,
} from '../services/memoryService.js';
import Memory from '../models/Memory.js';
import { getDBStatus } from '../config/db.js';

const router = Router();

/**
 * GET /api/memories
 * Retrieve all active memories for the authenticated user.
 */
router.get('/memories', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const memories = await getUserMemories(userId);
    res.status(200).json({ memories });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/memories
 * Create a new user memory.
 */
router.post('/memories', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { content, category = 'fact' } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({
        error: { message: 'Memory content cannot be empty.', code: 'INVALID_CONTENT' },
      });
    }

    const memory = await saveUserMemory(userId, content.trim(), category);
    res.status(201).json({ memory });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/memories/:id
 * Delete a specific memory item.
 */
router.delete('/memories/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    const success = await deleteUserMemory(userId, id);
    res.status(200).json({ success, deletedId: id });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/memories
 * Clear all memories for the authenticated user.
 */
router.delete('/memories', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const dbStatus = getDBStatus();

    if (dbStatus === 'connected') {
      await Memory.deleteMany({ userId });
    }

    res.status(200).json({ success: true, message: 'All memories cleared.' });
  } catch (err) {
    next(err);
  }
});

export default router;

