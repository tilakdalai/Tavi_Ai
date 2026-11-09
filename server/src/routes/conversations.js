import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { getDBStatus } from '../config/db.js';
import { localStore } from '../services/store.js';

const router = Router();

/**
 * GET /api/conversations
 * Fetch paginated list of conversations belonging to the authenticated user.
 */
router.get('/conversations', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { q, limit = 50, page = 1 } = req.query;
    const dbStatus = getDBStatus();

    if (dbStatus !== 'connected') {
      const result = localStore.getConversations(userId, { q, limit, page });
      return res.status(200).json({
        conversations: result.conversations,
        total: result.total,
        page: result.page,
        totalPages: Math.ceil(result.total / (parseInt(limit, 10) || 50)) || 1,
        dbPersistence: 'local-store',
      });
    }

    const query = { userId };
    if (q && typeof q === 'string') {
      query.title = { $regex: q.trim(), $options: 'i' };
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const [conversations, total] = await Promise.all([
      Conversation.find(query)
        .sort({ isPinned: -1, updatedAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      Conversation.countDocuments(query),
    ]);

    res.status(200).json({
      conversations,
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit),
      dbPersistence: 'active',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/conversations
 * Create a new conversation.
 */
router.post('/conversations', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { title = 'New Conversation' } = req.body;
    const cleanTitle = (typeof title === 'string' && title.trim()) ? title.trim().slice(0, 120) : 'New Conversation';
    const dbStatus = getDBStatus();

    if (dbStatus !== 'connected') {
      const mockConv = localStore.createConversation(userId, {
        title: cleanTitle,
        model: 'beam:cloud',
      });
      return res.status(201).json({ conversation: mockConv, dbPersistence: 'local-store' });
    }

    const conversation = await Conversation.create({
      userId,
      title: cleanTitle,
      model: 'beam:cloud',
    });

    res.status(201).json({ conversation, dbPersistence: 'active' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/conversations/:id
 * Retrieve a specific conversation and all its messages. Strictly checks ownership.
 */
router.get('/conversations/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: { message: 'Invalid conversation ID format.', code: 'INVALID_ID' },
      });
    }

    const dbStatus = getDBStatus();
    if (dbStatus !== 'connected') {
      const conv = localStore.getConversation(userId, id);
      if (!conv) {
        return res.status(404).json({
          error: { message: 'Conversation not found or access denied.', code: 'NOT_FOUND' },
        });
      }
      const msgs = localStore.getMessages(userId, id);
      return res.status(200).json({ conversation: conv, messages: msgs });
    }

    const conversation = await Conversation.findOne({ _id: id, userId });
    if (!conversation) {
      return res.status(404).json({
        error: { message: 'Conversation not found or access denied.', code: 'NOT_FOUND' },
      });
    }

    const messages = await Message.find({ conversationId: id, userId })
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json({ conversation, messages });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/conversations/:id
 * Rename conversation or toggle pin status.
 */
router.patch('/conversations/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;
    const { title, isPinned, isArchived } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: { message: 'Invalid conversation ID format.', code: 'INVALID_ID' },
      });
    }

    const updates = {};
    if (typeof title === 'string' && title.trim()) {
      updates.title = title.trim().slice(0, 120);
    }
    if (typeof isPinned === 'boolean') {
      updates.isPinned = isPinned;
    }
    if (typeof isArchived === 'boolean') {
      updates.isArchived = isArchived;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: { message: 'No valid fields provided to update.', code: 'NO_UPDATES' },
      });
    }

    const dbStatus = getDBStatus();
    if (dbStatus !== 'connected') {
      const conv = localStore.updateConversation(userId, id, updates);
      if (!conv) {
        return res.status(404).json({
          error: { message: 'Conversation not found or access denied.', code: 'NOT_FOUND' },
        });
      }
      return res.status(200).json({ conversation: conv });
    }

    const conversation = await Conversation.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({
        error: { message: 'Conversation not found or access denied.', code: 'NOT_FOUND' },
      });
    }

    res.status(200).json({ conversation });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/conversations/:id
 * Cascade deletes a conversation and all its messages. Strictly checks ownership.
 */
router.delete('/conversations/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: { message: 'Invalid conversation ID format.', code: 'INVALID_ID' },
      });
    }

    const dbStatus = getDBStatus();
    if (dbStatus !== 'connected') {
      localStore.deleteConversation(userId, id);
      return res.status(200).json({ success: true, deletedId: id });
    }

    const conversation = await Conversation.findOneAndDelete({ _id: id, userId });
    if (!conversation) {
      return res.status(404).json({
        error: { message: 'Conversation not found or access denied.', code: 'NOT_FOUND' },
      });
    }

    // Cascade delete associated messages
    await Message.deleteMany({ conversationId: id, userId });

    res.status(200).json({ success: true, deletedId: id });
  } catch (error) {
    next(error);
  }
});

export default router;

