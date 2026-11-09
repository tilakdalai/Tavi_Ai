import { Router } from 'express';
import { VERIFIED_CREATOR } from '../services/creatorService.js';
import CreatorProfile from '../models/CreatorProfile.js';
import { getDBStatus } from '../config/db.js';

const router = Router();

/**
 * GET /api/creator
 * Returns public verified profile information about creator Tilak Dalai.
 */
router.get('/creator', async (req, res, next) => {
  try {
    const dbStatus = getDBStatus();

    if (dbStatus === 'connected') {
      const storedProfile = await CreatorProfile.findOne();
      if (storedProfile) {
        return res.status(200).json({ creator: storedProfile });
      }
    }

    res.status(200).json({ creator: VERIFIED_CREATOR });
  } catch (error) {
    next(error);
  }
});

export default router;

