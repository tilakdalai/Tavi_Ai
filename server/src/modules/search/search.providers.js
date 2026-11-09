import axios from 'axios';
import * as cheerio from 'cheerio';
import { getDomainAndFavicon } from '../security/url-validator.js';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * 1. Open Web Multi-Search Adapter (Zero API Key required)
 * Integrates HackerNews Algolia Web Search, Wikipedia Knowledge API,
 * and DuckDuckGo for fast, real-time web discovery.
 */
export async function searchOpenWeb(query, maxResults = 6) {
  const results = [];
  const seenUrls = new Set();

  const addResult = (item) => {
    if (!item?.url || !item.url.startsWith('http')) return;
    if (seenUrls.has(item.url) || results.length >= maxResults) return;
    seenUrls.add(item.url);
    const { domain, favicon } = getDomainAndFavicon(item.url);
    results.push({
      title: item.title || domain,
      url: item.url,
      domain,
      favicon,
      snippet: item.snippet || '',
      provider: item.provider || 'Live Web',
    });
  };

  // Sub-task A: HackerNews / Tech & News Web Search
  const hnPromise = (async () => {
    try {
      const res = await axios.get('https://hn.algolia.com/api/v1/search', {
        params: { query, hitsPerPage: Math.min(maxResults, 6) },
        timeout: 4500,
      });
      const hits = res.data?.hits || [];
      for (const h of hits) {
        if (h.url) {
          addResult({
            title: h.title,
            url: h.url,
            snippet: `${h.points ? h.points + ' points. ' : ''}${h._highlightResult?.story_text?.value || ''}`.trim() || 'Verified web discussion and source release.',
            provider: 'HackerNews / Web',
          });
        }
      }
    } catch (err) {
      // Non-fatal
    }
  })();

  // Sub-task B: Wikipedia Open Search (Encyclopedic, scientific, historical, definitions)
  const wikiPromise = (async () => {
    try {
      const res = await axios.get('https://en.wikipedia.org/w/api.php', {
        params: {
          action: 'query',
          list: 'search',
          srsearch: query,
          format: 'json',
          srlimit: Math.min(maxResults, 4),
          origin: '*',
        },
        headers: { 'User-Agent': 'TaviAI/1.0 (https://tilak-portfolio-wine.vercel.app/)' },
        timeout: 4500,
      });
      const searchItems = res.data?.query?.search || [];
      for (const item of searchItems) {
        const cleanSnippet = (item.snippet || '')
          .replace(/<span class="searchmatch">/g, '')
          .replace(/<\/span>/g, '')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'");
        const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, '_'))}`;
        addResult({
          title: item.title,
          url: pageUrl,
          snippet: cleanSnippet,
          provider: 'Wikipedia',
        });
      }
    } catch (err) {
      // Non-fatal
    }
  })();

  // Sub-task C: DuckDuckGo Instant Answer API
  const ddgPromise = (async () => {
    try {
      const res = await axios.get('https://api.duckduckgo.com/', {
        params: { q: query, format: 'json', no_html: 1, skip_disambig: 1 },
        timeout: 4500,
      });
      const data = res.data;
      if (data.AbstractURL && data.Heading) {
        addResult({
          title: data.Heading,
          url: data.AbstractURL,
          snippet: data.AbstractText || data.Definition || '',
          provider: 'DuckDuckGo Knowledge',
        });
      }
      if (Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics.slice(0, 3)) {
          if (topic.FirstURL && topic.Text) {
            addResult({
              title: topic.Text.slice(0, 70),
              url: topic.FirstURL,
              snippet: topic.Text,
              provider: 'DuckDuckGo',
            });
          }
        }
      }
    } catch (err) {
      // Non-fatal
    }
  })();

  // Await all open sources concurrently
  await Promise.allSettled([hnPromise, wikiPromise, ddgPromise]);

  return results;
}

/**
 * 2. Tavily Search API Adapter
 */
export async function searchTavily(query, apiKey, maxResults = 6) {
  try {
    const res = await axios.post(
      'https://api.tavily.com/search',
      {
        api_key: apiKey,
        query,
        search_depth: 'basic',
        include_answer: true,
        max_results: maxResults,
      },
      { timeout: 7000 }
    );

    const data = res.data;
    const results = (data.results || []).map((r) => {
      const { domain, favicon } = getDomainAndFavicon(r.url);
      return {
        title: r.title,
        url: r.url,
        domain,
        favicon,
        snippet: r.content,
        publishedDate: r.published_date,
        provider: 'Tavily',
      };
    });

    return {
      results,
      answer: data.answer || null,
    };
  } catch (err) {
    console.warn('[SearchProvider Tavily warning]:', err.message);
    return null;
  }
}

/**
 * 3. Brave Search API Adapter
 */
export async function searchBrave(query, apiKey, maxResults = 6) {
  try {
    const res = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      headers: {
        Accept: 'application/json',
        'X-Subscription-Token': apiKey,
      },
      params: { q: query, count: maxResults },
      timeout: 6000,
    });

    const items = res.data.web?.results || [];
    return items.map((r) => {
      const { domain, favicon } = getDomainAndFavicon(r.url);
      return {
        title: r.title,
        url: r.url,
        domain,
        favicon,
        snippet: r.description,
        publishedDate: r.age,
        provider: 'Brave',
      };
    });
  } catch (err) {
    console.warn('[SearchProvider Brave warning]:', err.message);
    return null;
  }
}

/**
 * Unified Multi-Provider Search Runner with Automatic Fallback
 */
export async function executeMultiProviderSearch(query, maxResults = 6) {
  const tavilyKey = process.env.TAVILY_API_KEY;
  const braveKey = process.env.BRAVE_SEARCH_API_KEY;

  // 1. If Tavily key available, try Tavily
  if (tavilyKey && !tavilyKey.includes('your_')) {
    const tavilyData = await searchTavily(query, tavilyKey, maxResults);
    if (tavilyData?.results?.length) {
      return {
        provider: 'Tavily',
        results: tavilyData.results,
        aiSummary: tavilyData.answer,
      };
    }
  }

  // 2. If Brave key available, try Brave
  if (braveKey && !braveKey.includes('your_')) {
    const braveResults = await searchBrave(query, braveKey, maxResults);
    if (braveResults?.length) {
      return {
        provider: 'Brave Search',
        results: braveResults,
      };
    }
  }

  // 3. Fallback: Open Web Multi-Provider (DuckDuckGo + Wikipedia + HackerNews)
  const openWebResults = await searchOpenWeb(query, maxResults);
  return {
    provider: 'Open Web Live Search',
    results: openWebResults,
  };
}
