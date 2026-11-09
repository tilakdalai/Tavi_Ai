import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import { getDBStatus } from '../config/db.js';

const router = Router();

// In-memory fallback for local dev
const inMemoryProfiles = new Map();

/**
 * GET /api/me
 * Hydrates or auto-provisions user profile in MongoDB using verified Firebase UID.
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { uid, email, displayName, photoURL } = req.user;
    const dbStatus = getDBStatus();

    if (dbStatus !== 'connected') {
      let profile = inMemoryProfiles.get(uid);
      if (!profile) {
        profile = {
          userId: uid,
          firebaseUid: uid,
          email,
          displayName: displayName || email?.split('@')[0] || 'Tavi User',
          photoURL: photoURL || '',
          role: email === process.env.ADMIN_EMAIL ? 'admin' : 'user',
          preferredLanguage: 'en',
          onboardingCompleted: false,
          preferences: {
            theme: 'dark',
            reducedMotion: false,
            voiceAutoPlay: false,
            memoryEnabled: true,
          },
          dbPersistence: 'in-memory',
        };
        inMemoryProfiles.set(uid, profile);
      }
      return res.status(200).json({ user: profile });
    }

    // Upsert user profile in MongoDB
    const now = new Date();
    const user = await User.findOneAndUpdate(
      { $or: [{ userId: uid }, { firebaseUid: uid }] },
      {
        $set: {
          userId: uid,
          firebaseUid: uid,
          email,
          displayName: displayName || email?.split('@')[0] || 'Tavi User',
          photoURL: photoURL || '',
          lastLoginAt: now,
        },
        $setOnInsert: {
          role: email === process.env.ADMIN_EMAIL ? 'admin' : 'user',
          preferredLanguage: 'en',
          onboardingCompleted: false,
          preferences: {
            theme: 'dark',
            reducedMotion: false,
            voiceAutoPlay: false,
            memoryEnabled: true,
          },
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      user: {
        id: user._id,
        userId: user.userId || user.firebaseUid,
        firebaseUid: user.firebaseUid || user.userId,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        onboardingCompleted: user.onboardingCompleted,
        preferences: user.preferences,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        dbPersistence: 'active',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/me
 * Update user preferences, language, display name, or onboarding state.
 */
router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { preferences, preferredLanguage, displayName, onboardingCompleted } = req.body;

    const updateFields = {};

    if (preferences && typeof preferences === 'object') {
      if (['dark', 'light', 'system'].includes(preferences.theme)) {
        updateFields['preferences.theme'] = preferences.theme;
      }
      if (typeof preferences.reducedMotion === 'boolean') {
        updateFields['preferences.reducedMotion'] = preferences.reducedMotion;
      }
      if (typeof preferences.voiceAutoPlay === 'boolean') {
        updateFields['preferences.voiceAutoPlay'] = preferences.voiceAutoPlay;
      }
      if (typeof preferences.memoryEnabled === 'boolean') {
        updateFields['preferences.memoryEnabled'] = preferences.memoryEnabled;
      }
    }

    if (typeof preferredLanguage === 'string' && preferredLanguage.trim()) {
      updateFields.preferredLanguage = preferredLanguage.trim().toLowerCase();
    }

    if (typeof displayName === 'string' && displayName.trim()) {
      updateFields.displayName = displayName.trim().slice(0, 100);
    }

    if (typeof onboardingCompleted === 'boolean') {
      updateFields.onboardingCompleted = onboardingCompleted;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        error: {
          message: 'No valid fields provided to update.',
          code: 'NO_VALID_FIELDS',
        },
      });
    }

    const dbStatus = getDBStatus();
    if (dbStatus !== 'connected') {
      const profile = inMemoryProfiles.get(uid) || { firebaseUid: uid };
      // Deep merge
      for (const [key, value] of Object.entries(updateFields)) {
        if (key.startsWith('preferences.')) {
          const prefKey = key.split('.')[1];
          profile.preferences = profile.preferences || {};
          profile.preferences[prefKey] = value;
        } else {
          profile[key] = value;
        }
      }
      inMemoryProfiles.set(uid, profile);
      return res.status(200).json({ user: profile });
    }

    const updatedUser = await User.findOneAndUpdate(
      { $or: [{ userId: uid }, { firebaseUid: uid }] },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        error: {
          message: 'User not found.',
          code: 'USER_NOT_FOUND',
        },
      });
    }

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
});

export default router;
