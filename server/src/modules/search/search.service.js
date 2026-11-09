import { executeMultiProviderSearch } from './search.providers.js';
import { scrapeWebPage } from '../scraper/scraper.service.js';
import SearchHistory from '../../models/SearchHistory.js';
import SearchSources from '../../models/SearchSources.js';
import { getDBStatus } from '../../config/db.js';

/**
 * Intelligent Query Classifier
 */
export function classifyQuery(query = '') {
  const lower = query.toLowerCase().trim();

  // 1. Explicit search keywords & temporal triggers
  const realTimePatterns = [
    /\b(latest|current|today|tonight|now|recent|upcoming|newest|released?)\b/i,
    /\b(news|headline|weather|score|match|winner|election|stock|price|market|version|changelog)\b/i,
    /\b(in\s+202[5-9]|november\s+2026)\b/i,
    /\b(jobs?|vacancy|notification|admit\s+card|result)\b/i,
    /\b(who\s+won|who\s+is\s+currently)\b/i,
  ];

  // Specific categories
  if (/\b(weather|temperature|forecast|rain)\b/i.test(lower)) return { shouldSearch: true, category: 'weather' };
  if (/\b(cricket|football|match|score|ipl|fifa|tournament|game)\b/i.test(lower)) return { shouldSearch: true, category: 'sports' };
  if (/\b(news|headline|breaking)\b/i.test(lower)) return { shouldSearch: true, category: 'latest_news' };
  if (/\b(stock|shares|crypto|bitcoin|market\s+price)\b/i.test(lower)) return { shouldSearch: true, category: 'finance' };
  if (/\b(version|releases?|changelog|framework\s+update)\b/i.test(lower)) return { shouldSearch: true, category: 'technology' };
  if (/\b(job|notification|government\s+job|recruitment)\b/i.test(lower)) return { shouldSearch: true, category: 'jobs' };

  const matchesRealtime = realTimePatterns.some((pattern) => pattern.test(lower));
  if (matchesRealtime) {
    return { shouldSearch: true, category: 'realtime_info' };
  }

  return { shouldSearch: false, category: 'general_knowledge' };
}

/**
 * Determine if search is required based on mode and query
 */
export function shouldExecuteSearch(query, mode = 'auto') {
  if (mode === 'web') return true;
  if (mode === 'ai_only') return false;
  return classifyQuery(query).shouldSearch;
}

/**
 * Execute real-time search, ranking, and selective deep scraping of top sources
 */
export async function performWebSearch({
  query,
  userId = 'guest',
  mode = 'auto',
  maxResults = 6,
  deepScrape = true,
  onStatusUpdate,
}) {
  const classification = classifyQuery(query);

  if (onStatusUpdate) onStatusUpdate('Searching the web...');

  // 1. Execute multi-provider search
  const { provider, results = [], aiSummary } = await executeMultiProviderSearch(query, maxResults);

  if (!results.length) {
    return {
      performed: true,
      query,
      provider,
      category: classification.category,
      sources: [],
      aggregatedContext: '',
    };
  }

  // 2. Rank and deduplicate results
  const seenUrls = new Set();
  const rankedSources = [];

  for (const item of results) {
    if (!seenUrls.has(item.url)) {
      seenUrls.add(item.url);
      rankedSources.push({
        title: item.title,
        url: item.url,
        domain: item.domain,
        favicon: item.favicon,
        snippet: item.snippet,
        provider: item.provider || provider,
      });
    }
  }

  if (onStatusUpdate) onStatusUpdate('Reading relevant websites...');

  // 3. Deep scrape top 2 authoritative web pages concurrently to get real in-depth context
  let detailedWebContext = '';
  if (deepScrape && rankedSources.length > 0) {
    const topUrls = rankedSources.slice(0, 2).map((s) => s.url);
    const scrapePromises = topUrls.map((url) =>
      scrapeWebPage(url, { bypassCache: false }).catch(() => null)
    );

    const scrapedPages = await Promise.all(scrapePromises);
    const validPages = scrapedPages.filter(Boolean);

    if (validPages.length > 0) {
      if (onStatusUpdate) onStatusUpdate('Comparing and verifying information...');
      detailedWebContext = validPages
        .map(
          (p) =>
            `--- SOURCE: ${p.title} (${p.domain}) ---\nURL: ${p.url}\nCONTENT: ${p.content.slice(
              0,
              1800
            )}\n`
        )
        .join('\n\n');
    }
  }

  // Fallback to snippets if deep scrape was empty
  if (!detailedWebContext) {
    detailedWebContext = rankedSources
      .map((s) => `--- SOURCE: ${s.title} (${s.domain}) ---\nURL: ${s.url}\nSNIPPET: ${s.snippet}\n`)
      .join('\n\n');
  }

  // 4. Record history in MongoDB if connected
  if (getDBStatus() === 'connected' && userId) {
    try {
      const historyRecord = await SearchHistory.create({
        userId,
        query,
        searchMode: mode,
        category: classification.category,
        resultCount: rankedSources.length,
        providerUsed: provider,
      });

      if (rankedSources.length > 0) {
        const sourceDocs = rankedSources.map((s) => ({
          searchId: historyRecord._id,
          title: s.title,
          url: s.url,
          domain: s.domain,
          snippet: s.snippet,
          favicon: s.favicon,
          retrievedAt: new Date(),
        }));
        await SearchSources.insertMany(sourceDocs);
      }
    } catch (err) {
      console.warn('[SearchService] Search record log warning:', err.message);
    }
  }

  return {
    performed: true,
    query,
    provider,
    category: classification.category,
    sources: rankedSources,
    aiSummary,
    aggregatedContext: detailedWebContext,
  };
}

