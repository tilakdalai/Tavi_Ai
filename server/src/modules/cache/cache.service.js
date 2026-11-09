import crypto from 'crypto';
import CachedPages from '../../models/CachedPages.js';
import { getDBStatus } from '../../config/db.js';

const inMemoryCache = new Map();

export const CacheDurations = {
  REALTIME_NEWS: 15 * 60 * 1000, // 15 mins
  WEATHER_SPORTS: 10 * 60 * 1000, // 10 mins
  GENERAL_SEARCH: 60 * 60 * 1000, // 1 hour
  DOCUMENTATION: 48 * 60 * 60 * 1000, // 48 hours
};

export function hashString(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Get cached extracted page content.
 */
export async function getCachedPage(url) {
  const now = new Date();

  // 1. Check in-memory cache
  const memoryHit = inMemoryCache.get(url);
  if (memoryHit && new Date(memoryHit.expiresAt) > now) {
    return memoryHit;
  }

  // 2. Check MongoDB if active
  if (getDBStatus() === 'connected') {
    try {
      const page = await CachedPages.findOne({ url, expiresAt: { $gt: now } }).lean();
      if (page) {
        inMemoryCache.set(url, page);
        return page;
      }
    } catch (err) {
      console.warn('[Cache] Lookup warning:', err.message);
    }
  }

  return null;
}

/**
 * Set cached extracted page content with TTL.
 */
export async function setCachedPage(url, { title, domain, content, duration = CacheDurations.GENERAL_SEARCH }) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + duration);
  const contentHash = hashString(content);

  const cacheObject = {
    url,
    title,
    domain,
    extractedContent: content,
    contentHash,
    fetchedAt: now,
    expiresAt,
  };

  inMemoryCache.set(url, cacheObject);

  if (getDBStatus() === 'connected') {
    try {
      await CachedPages.findOneAndUpdate(
        { url },
        { $set: cacheObject },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.warn('[Cache] Persist warning:', err.message);
    }
  }

  return cacheObject;
}

