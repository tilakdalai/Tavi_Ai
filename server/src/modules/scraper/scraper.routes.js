import { Router } from 'express';
import { scrapeWebPage } from './scraper.service.js';

const router = Router();

/**
 * POST /api/scraper/extract
 * Extracts article text, metadata, headings, and clean content from a public webpage.
 * Protected with SSRF filters.
 */
router.post('/scraper/extract', async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({
        error: { message: 'URL is required to extract content.', code: 'MISSING_URL' },
      });
    }

    const scraped = await scrapeWebPage(url.trim());

    res.status(200).json({
      success: true,
      data: scraped,
    });
  } catch (err) {
    res.status(400).json({
      error: {
        message: err.message || 'Failed to extract content from webpage.',
        code: 'SCRAPE_FAILED',
      },
    });
  }
});

export default router;

