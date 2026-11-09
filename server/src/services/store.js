import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'tavi_local_db.json');

// In-memory cache structures
let inMemoryData = {
  conversations: [], // [{ _id, userId, title, model, isPinned, isArchived, createdAt, updatedAt, lastMessageAt }]
  messages: [],      // [{ _id, conversationId, userId, role, content, attachments, citations, modelMetadata, createdAt }]
  memories: [],      // [{ _id, userId, content, category, createdAt }]
};

// Ensure data directory exists and load persistent snapshot
function initStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      if (raw) {
        const parsed = JSON.parse(raw);
        inMemoryData = {
          conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
          messages: Array.isArray(parsed.messages) ? parsed.messages : [],
          memories: Array.isArray(parsed.memories) ? parsed.memories : [],
        };
      }
    }
  } catch (err) {
    console.warn('[Local Store Init Warning]:', err.message);
  }
}

// Persist in-memory snapshot to disk with debounce
let saveTimeout = null;
function persistToDisk() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(inMemoryData, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[Local Store Persist Warning]:', err.message);
    }
  }, 100);
}

initStore();

export const localStore = {
  // --- CONVERSATIONS ---
  getConversations(userId, { q = '', limit = 50, page = 1 } = {}) {
    let list = inMemoryData.conversations.filter((c) => c.userId === userId && !c.isArchived);
    if (q) {
      const lower = q.toLowerCase();
      list = list.filter((c) => c.title && c.title.toLowerCase().includes(lower));
    }
    // Sort pinned first, then latest updated
    list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const total = list.length;
    const paginated = list.slice((parsedPage - 1) * parsedLimit, parsedPage * parsedLimit);

    return { conversations: paginated, total, page: parsedPage };
  },

  getConversation(userId, conversationId) {
    return inMemoryData.conversations.find((c) => c._id === conversationId && c.userId === userId) || null;
  },

  createConversation(userId, { title = 'New Conversation', model = 'beam:cloud' } = {}) {
    const _id = new mongoose.Types.ObjectId().toString();
    const now = new Date().toISOString();
    const cleanTitle = (typeof title === 'string' && title.trim()) ? title.trim().slice(0, 120) : 'New Conversation';

    const conv = {
      _id,
      userId,
      title: cleanTitle,
      model,
      isPinned: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
    };

    inMemoryData.conversations.unshift(conv);
    persistToDisk();
    return conv;
  },

  updateConversation(userId, conversationId, updates = {}) {
    const conv = inMemoryData.conversations.find((c) => c._id === conversationId && c.userId === userId);
    if (!conv) return null;

    if (typeof updates.title === 'string' && updates.title.trim()) {
      conv.title = updates.title.trim().slice(0, 120);
    }
    if (typeof updates.isPinned === 'boolean') {
      conv.isPinned = updates.isPinned;
    }
    if (typeof updates.isArchived === 'boolean') {
      conv.isArchived = updates.isArchived;
    }
    conv.updatedAt = new Date().toISOString();

    persistToDisk();
    return conv;
  },

  deleteConversation(userId, conversationId) {
    const initialLen = inMemoryData.conversations.length;
    inMemoryData.conversations = inMemoryData.conversations.filter(
      (c) => !(c._id === conversationId && c.userId === userId)
    );
    // Cascade delete messages
    inMemoryData.messages = inMemoryData.messages.filter(
      (m) => !(m.conversationId === conversationId && m.userId === userId)
    );

    persistToDisk();
    return inMemoryData.conversations.length < initialLen;
  },

  // --- MESSAGES ---
  getMessages(userId, conversationId) {
    const msgs = inMemoryData.messages.filter(
      (m) => m.conversationId === conversationId && m.userId === userId
    );
    // Sort chronologically
    msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return msgs;
  },

  addMessage(userId, { conversationId, role, content, attachments = [], citations = [], modelMetadata = null }) {
    const _id = new mongoose.Types.ObjectId().toString();
    const now = new Date().toISOString();

    const msg = {
      _id,
      conversationId,
      userId,
      role,
      content,
      attachments: attachments || [],
      citations: citations || [],
      modelMetadata: modelMetadata || { model: 'beam:cloud', provider: 'beam' },
      createdAt: now,
      updatedAt: now,
    };

    inMemoryData.messages.push(msg);

    // Update conversation lastMessageAt and updatedAt
    const conv = inMemoryData.conversations.find((c) => c._id === conversationId && c.userId === userId);
    if (conv) {
      conv.lastMessageAt = now;
      conv.updatedAt = now;
    }

    persistToDisk();
    return msg;
  },

  // --- MEMORIES ---
  getMemories(userId) {
    return inMemoryData.memories.filter((m) => m.userId === userId);
  },

  addMemory(userId, content, category = 'fact') {
    const _id = new mongoose.Types.ObjectId().toString();
    const now = new Date().toISOString();
    const mem = {
      _id,
      userId,
      content: content.trim(),
      category,
      createdAt: now,
    };
    inMemoryData.memories.unshift(mem);
    persistToDisk();
    return mem;
  },

  deleteMemory(userId, memoryId) {
    const initialLen = inMemoryData.memories.length;
    inMemoryData.memories = inMemoryData.memories.filter(
      (m) => !(m._id === memoryId && m.userId === userId)
    );
    persistToDisk();
    return inMemoryData.memories.length < initialLen;
  },

  clearMemories(userId) {
    inMemoryData.memories = inMemoryData.memories.filter((m) => m.userId !== userId);
    persistToDisk();
    return true;
  },
};

