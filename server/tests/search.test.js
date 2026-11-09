import test from 'node:test';
import assert from 'node:assert';
import app from '../src/server.js';
import { validateAndSanitizeUrl, getDomainAndFavicon } from '../src/modules/security/url-validator.js';
import { classifyQuery, shouldExecuteSearch } from '../src/modules/search/search.service.js';
import { getCachedPage, setCachedPage, CacheDurations } from '../src/modules/cache/cache.service.js';

test('SSRF Protection & URL Validator', async (t) => {
  await t.test('Blocks localhost and loopback IPv4', () => {
    assert.throws(() => validateAndSanitizeUrl('http://localhost:5000'), /prohibited|blocked/);
    assert.throws(() => validateAndSanitizeUrl('http://127.0.0.1:8080'), /prohibited|blocked/);
    assert.throws(() => validateAndSanitizeUrl('http://127.0.0.2'), /prohibited|blocked/);
  });

  await t.test('Blocks private RFC 1918 and link-local cloud metadata IPs', () => {
    assert.throws(() => validateAndSanitizeUrl('http://10.0.0.1/admin'), /blocked/);
    assert.throws(() => validateAndSanitizeUrl('http://192.168.1.1/router'), /blocked/);
    assert.throws(() => validateAndSanitizeUrl('http://172.16.0.5'), /blocked/);
    assert.throws(() => validateAndSanitizeUrl('http://169.254.169.254/latest/meta-data'), /blocked/);
  });

  await t.test('Blocks non-HTTP/HTTPS protocols', () => {
    assert.throws(() => validateAndSanitizeUrl('file:///etc/passwd'), /Only HTTP and HTTPS/);
    assert.throws(() => validateAndSanitizeUrl('ftp://ftp.example.com'), /Only HTTP and HTTPS/);
    assert.throws(() => validateAndSanitizeUrl('gopher://gopher.example.com'), /Only HTTP and HTTPS/);
  });

  await t.test('Allows and normalizes valid public web URLs', () => {
    const res = validateAndSanitizeUrl('https://developer.mozilla.org/en-US/docs/Web');
    assert.strictEqual(res, 'https://developer.mozilla.org/en-US/docs/Web');
    const info = getDomainAndFavicon(res);
    assert.strictEqual(info.domain, 'developer.mozilla.org');
    assert.ok(info.favicon.includes('google.com/s2/favicons'));
  });
});

test('Search Intelligence & Query Classifier', async (t) => {
  await t.test('Classifies general knowledge queries', () => {
    const result = classifyQuery('What is Java?');
    assert.strictEqual(result.category, 'general_knowledge');
    assert.strictEqual(result.shouldSearch, false);
  });

  await t.test('Classifies real-time technology queries', () => {
    const result = classifyQuery('What is the latest version of React?');
    assert.strictEqual(result.category, 'technology');
    assert.strictEqual(result.shouldSearch, true);
  });

  await t.test('Classifies sports queries', () => {
    const result = classifyQuery("Who won today's cricket match?");
    assert.strictEqual(result.category, 'sports');
    assert.strictEqual(result.shouldSearch, true);
  });

  await t.test('Classifies latest news queries', () => {
    const result = classifyQuery('What are today top headlines?');
    assert.ok(result.category === 'latest_news' || result.category === 'realtime_info');
    assert.strictEqual(result.shouldSearch, true);
  });

  await t.test('Classifies weather queries', () => {
    const result = classifyQuery('Current weather in Bhubaneswar');
    assert.strictEqual(result.category, 'weather');
    assert.strictEqual(result.shouldSearch, true);
  });

  await t.test('Determines shouldExecuteSearch based on searchMode', () => {
    // Mode: ai_only always false
    assert.strictEqual(shouldExecuteSearch('What is latest React?', 'ai_only'), false);

    // Mode: web always true
    assert.strictEqual(shouldExecuteSearch('What is binary search?', 'web'), true);

    // Mode: auto activates for real-time keywords
    assert.strictEqual(shouldExecuteSearch('Latest version of Next.js release today', 'auto'), true);
    assert.strictEqual(shouldExecuteSearch('Explain recursion in computer science', 'auto'), false);
  });
});

test('Cache Service In-Memory Layer', async (t) => {
  await t.test('Caches and retrieves page content within TTL', async () => {
    const testUrl = 'https://example.com/cached-article';
    await setCachedPage(testUrl, {
      title: 'Cached Article',
      domain: 'example.com',
      content: 'This is the cached text content.',
      duration: CacheDurations.GENERAL_SEARCH,
    });

    const cached = await getCachedPage(testUrl);
    assert.ok(cached);
    assert.strictEqual(cached.title, 'Cached Article');
    assert.strictEqual(cached.domain, 'example.com');
    assert.strictEqual(cached.extractedContent, 'This is the cached text content.');
  });
});

test('Search & Scraper Endpoints Integration', async (t) => {
  let server;
  const testPort = 5066;

  await t.test('Server binds to test port', async () => {
    await new Promise((resolve) => {
      server = app.listen(testPort, () => resolve());
    });
    assert.ok(server.listening);
  });

  await t.test('POST /api/search rejects empty query with 400', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '' }),
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.error.code, 'INVALID_QUERY');
  });

  await t.test('POST /api/search returns valid search results structure', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Node.js documentation', maxResults: 3 }),
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.query, 'Node.js documentation');
    assert.ok(Array.isArray(body.sources));
    assert.ok(body.sources.length >= 1);
    const firstSource = body.sources[0];
    assert.ok(firstSource.title);
    assert.ok(firstSource.url);
    assert.ok(firstSource.domain);
  });

  await t.test('POST /api/search/answer synthesizes an answer with sources', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/search/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Who created Tavi AI?' }),
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.answer);
    assert.ok(body.answer.includes('Tilak Dalai') || body.answer.length > 20);
    assert.ok(Array.isArray(body.sources));
  });

  await t.test('POST /api/scraper/extract rejects SSRF targets with 400', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/scraper/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://127.0.0.1:5000/internal' }),
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.error.code, 'SCRAPE_FAILED');
  });

  // Cleanup
  await new Promise((resolve) => server.close(resolve));
});
