import axios from 'axios';
import * as cheerio from 'cheerio';
import { validateAndSanitizeUrl, getDomainAndFavicon } from '../security/url-validator.js';
import { getCachedPage, setCachedPage, CacheDurations } from '../cache/cache.service.js';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 TaviSearch/1.0';

/**
 * Clean and extract readable content from raw HTML using Cheerio.
 */
export function extractArticleContent(html, sourceUrl = '') {
  const $ = cheerio.load(html);

  // Remove clutter: scripts, styles, iframes, ads, cookie banners, navigation, footers
  $(
    'script, style, noscript, iframe, svg, nav, footer, header, aside, .advertisement, .ads, .cookie-banner, #cookie-notice, .social-share, .newsletter-signup'
  ).remove();

  // Extract Metadata
  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim() ||
    $('h1').first().text().trim() ||
    'Web Source';

  const description =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    '';

  const publishedTime =
    $('meta[property="article:published_time"]').attr('content') ||
    $('meta[name="pubdate"]').attr('content') ||
    $('time').first().attr('datetime') ||
    null;

  const author =
    $('meta[name="author"]').attr('content') ||
    $('meta[property="article:author"]').attr('content') ||
    '';

  // Extract Main Content
  let mainContainer = $('article, main, [role="main"], .content, #content, .post-content, .article-body');
  if (!mainContainer.length) {
    mainContainer = $('body');
  }

  // Extract meaningful text paragraphs and headings
  const textSegments = [];
  mainContainer.find('h1, h2, h3, p, li').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text.length > 25) {
      textSegments.push(text);
    }
  });

  const fullText = textSegments.join('\n\n');
  const { domain, favicon } = getDomainAndFavicon(sourceUrl);

  return {
    title: title.slice(0, 160),
    description: description.slice(0, 300),
    author: author.slice(0, 100),
    publishedAt: publishedTime ? new Date(publishedTime) : null,
    domain,
    favicon,
    content: fullText.slice(0, 8000), // Cap at 8,000 characters for LLM context efficiency
    wordCount: fullText.split(/\s+/).length,
  };
}

/**
 * Fetch and extract a public webpage with SSRF security and caching.
 */
export async function scrapeWebPage(targetUrl, options = {}) {
  const cleanUrl = validateAndSanitizeUrl(targetUrl);

  // 1. Check cache first
  const cached = await getCachedPage(cleanUrl);
  if (cached && !options.bypassCache) {
    return {
      url: cleanUrl,
      title: cached.title,
      domain: cached.domain,
      content: cached.extractedContent,
      fromCache: true,
      retrievedAt: cached.fetchedAt,
    };
  }

  // 2. Fetch fresh page over HTTPS
  const response = await axios.get(cleanUrl, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    timeout: 7000, // 7-second strict timeout
    maxRedirects: 4,
    responseType: 'text',
    validateStatus: (status) => status >= 200 && status < 300,
  });

  // 3. Extract clean text content
  const extracted = extractArticleContent(response.data, cleanUrl);

  // 4. Save to cache
  await setCachedPage(cleanUrl, {
    title: extracted.title,
    domain: extracted.domain,
    content: extracted.content,
    duration: options.cacheDuration || CacheDurations.GENERAL_SEARCH,
  });

  return {
    url: cleanUrl,
    ...extracted,
    fromCache: false,
    retrievedAt: new Date(),
  };
}

