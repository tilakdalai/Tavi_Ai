import Memory from '../models/Memory.js';
import { getDBStatus } from '../config/db.js';

// In-memory fallback for local dev when MongoDB is offline
const inMemoryStore = new Map();

/**
 * Retrieve active memories for a given user.
 */
export async function getUserMemories(userId) {
  if (!userId) return [];
  const dbStatus = getDBStatus();

  if (dbStatus !== 'connected') {
    return (inMemoryStore.get(userId) || []).filter((m) => m.isActive !== false);
  }

  try {
    return await Memory.find({ userId, isActive: true }).sort({ createdAt: -1 }).lean();
  } catch (err) {
    console.error('[MemoryService] Failed to load memories:', err.message);
    return [];
  }
}

/**
 * Save an explicit memory or user preference.
 */
export async function saveUserMemory(userId, content, category = 'fact') {
  if (!userId || !content) return null;
  const cleanContent = content.trim().slice(0, 1000);
  const dbStatus = getDBStatus();

  if (dbStatus !== 'connected') {
    const memory = {
      _id: 'mem_' + Date.now(),
      userId,
      content: cleanContent,
      category,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const list = inMemoryStore.get(userId) || [];
    inMemoryStore.set(userId, [memory, ...list]);
    return memory;
  }

  return await Memory.create({
    userId,
    content: cleanContent,
    category,
    isActive: true,
  });
}

/**
 * Delete an individual memory item.
 */
export async function deleteUserMemory(userId, memoryId) {
  if (!userId || !memoryId) return false;
  const dbStatus = getDBStatus();

  if (dbStatus !== 'connected') {
    const list = inMemoryStore.get(userId) || [];
    const updated = list.filter((m) => m._id !== memoryId);
    inMemoryStore.set(userId, updated);
    return true;
  }

  const result = await Memory.deleteOne({ _id: memoryId, userId });
  return result.deletedCount > 0;
}

/**
 * Format memories into a concise prompt block for Tavi AI.
 */
export function formatMemoriesForPrompt(memories = []) {
  if (!memories.length) return '';

  const lines = memories.map((m) => `- [${m.category.toUpperCase()}]: ${m.content}`).join('\n');
  return `
[TAVI LONG-TERM MEMORY & USER CONTEXT]:
The user has asked you to remember the following relevant information about them:
${lines}
Use this context naturally to personalize your answers without explicitly referencing this memory list unless asked.
`.trim();
}

