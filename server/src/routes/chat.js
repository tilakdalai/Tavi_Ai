import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';
import { chatLimiter } from '../middleware/rateLimiter.js';
import { streamChatResponse } from '../services/aiService.js';
import { getUserMemories } from '../services/memoryService.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { getDBStatus } from '../config/db.js';
import { localStore } from '../services/store.js';

const router = Router();

/**
 * POST /api/chat
 * Streams conversational AI response using Server-Sent Events (SSE).
 * Persists user and assistant messages to MongoDB with strict owner isolation.
 */
router.post('/chat', requireAuth, chatLimiter, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const {
      conversationId,
      content,
      language,
      attachments = [],
      model = 'beam:cloud',
      searchMode = 'auto',
    } = req.body;

    // Validate prompt content
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({
        error: { message: 'Message content cannot be empty.', code: 'INVALID_CONTENT' },
      });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length > 30000) {
      return res.status(400).json({
        error: { message: 'Message is too long. Limit is 30,000 characters.', code: 'CONTENT_TOO_LONG' },
      });
    }

    const dbStatus = getDBStatus();
    let targetConversationId = conversationId;
    let history = [];
    let userLang = language || 'en';

    // 1. Fetch user memories if enabled
    const memories = await getUserMemories(userId);

    if (dbStatus === 'connected') {
      // Fetch user's preferred language if not specified in request
      if (!language) {
        const userDoc = await User.findOne({ $or: [{ userId }, { firebaseUid: userId }] }).select('preferredLanguage').lean();
        if (userDoc?.preferredLanguage) userLang = userDoc.preferredLanguage;
      }

      // 2. Resolve or create conversation
      let conversation;
      if (targetConversationId) {
        if (!mongoose.Types.ObjectId.isValid(targetConversationId)) {
          return res.status(400).json({
            error: { message: 'Invalid conversation ID format.', code: 'INVALID_ID' },
          });
        }

        conversation = await Conversation.findOne({ _id: targetConversationId, userId });
        if (!conversation) {
          return res.status(404).json({
            error: { message: 'Conversation not found or access denied.', code: 'NOT_FOUND' },
          });
        }
      } else {
        // Derive initial title from prompt
        const initialTitle =
          trimmedContent.length > 45 ? `${trimmedContent.slice(0, 42)}...` : trimmedContent;

        conversation = await Conversation.create({
          userId,
          title: initialTitle,
          model,
        });
        targetConversationId = conversation._id.toString();
      }

      // 3. Fetch history for context window
      history = await Message.find({ conversationId: targetConversationId, userId })
        .sort({ createdAt: 1 })
        .limit(20)
        .lean();

      // 4. Save User Message to MongoDB
      await Message.create({
        conversationId: targetConversationId,
        userId,
        role: 'user',
        content: trimmedContent,
        attachments: attachments.map((a) => ({
          name: a.name || 'document.txt',
          type: a.type || 'text/plain',
          size: a.size || 0,
          textContent: a.textContent || '',
        })),
        requestStatus: 'completed',
      });
    } else {
      // Local persistent store fallback
      if (!targetConversationId) {
        const initialTitle =
          trimmedContent.length > 45 ? `${trimmedContent.slice(0, 42)}...` : trimmedContent;
        const newConv = localStore.createConversation(userId, { title: initialTitle, model });
        targetConversationId = newConv._id;
      }

      // Fetch history for context window
      history = localStore.getMessages(userId, targetConversationId).slice(-20);

      // Save User Message to localStore
      localStore.addMessage(userId, {
        conversationId: targetConversationId,
        role: 'user',
        content: trimmedContent,
        attachments: attachments.map((a) => ({
          name: a.name || 'document.txt',
          type: a.type || 'text/plain',
          size: a.size || 0,
          textContent: a.textContent || '',
        })),
        modelMetadata: { model, provider: 'beam' },
      });
    }

    // 5. Stream response via AI service
    await streamChatResponse({
      res,
      history,
      userPrompt: trimmedContent,
      memories,
      preferredLanguage: userLang,
      attachments,
      model,
      searchMode,
      userId,
      onComplete: async (fullAssistantText, citations = []) => {
        if (dbStatus === 'connected') {
          try {
            await Message.create({
              conversationId: targetConversationId,
              userId,
              role: 'assistant',
              content: fullAssistantText,
              citations: citations || [],
              requestStatus: 'completed',
              modelMetadata: {
                model,
                provider: 'beam',
              },
            });

            await Conversation.updateOne(
              { _id: targetConversationId, userId },
              { $set: { lastMessageAt: new Date() } }
            );
          } catch (dbErr) {
            console.error('[Chat Persistence Error]:', dbErr.message);
          }
        } else {
          // Save Assistant Message to localStore
          localStore.addMessage(userId, {
            conversationId: targetConversationId,
            role: 'assistant',
            content: fullAssistantText,
            citations: citations || [],
            modelMetadata: {
              model,
              provider: 'beam',
            },
          });
        }
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/chat/messages/:id/feedback
 * Submit like/dislike feedback for a message.
 */
router.post('/chat/messages/:id/feedback', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;
    const { feedback } = req.body; // 'like', 'dislike', or null

    if (!['like', 'dislike', null].includes(feedback)) {
      return res.status(400).json({ error: { message: 'Invalid feedback value.', code: 'INVALID_FEEDBACK' } });
    }

    const dbStatus = getDBStatus();
    if (dbStatus === 'connected') {
      await Message.updateOne({ _id: id, userId }, { $set: { feedback } });
    }

    res.status(200).json({ success: true, feedback });
  } catch (err) {
    next(err);
  }
});

export default router;
