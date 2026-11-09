import test from 'node:test';
import assert from 'node:assert';
import app from '../src/server.js';
import { isCreatorQuestion, VERIFIED_CREATOR } from '../src/services/creatorService.js';

test('Tavi AI Chat & Creator Knowledge Test Suite', async (t) => {
  let server;
  const testPort = 5088;
  const baseUrl = `http://127.0.0.1:${testPort}`;
  const authToken = 'Bearer mock-token-user-tester';

  await t.test('Start test server instance', async () => {
    await new Promise((resolve) => {
      server = app.listen(testPort, () => resolve());
    });
    assert.ok(server.listening);
  });

  await t.test('1. GET /api/creator returns verified Tilak Dalai profile', async () => {
    const res = await fetch(`${baseUrl}/api/creator`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.creator.name, 'Tilak Dalai');
    assert.ok(body.creator.education.degree.includes('Computer Science'));
    assert.ok(body.creator.links.portfolio.includes('tilak-portfolio-wine.vercel.app'));
    assert.ok(body.creator.links.github.includes('github.com/tilakdalai'));
  });

  await t.test('2. Creator intent detection accurately detects questions about Tilak Dalai', () => {
    assert.strictEqual(isCreatorQuestion('Who created Tavi?'), true);
    assert.strictEqual(isCreatorQuestion('Who made you?'), true);
    assert.strictEqual(isCreatorQuestion('Who is Tilak Dalai?'), true);
    assert.strictEqual(isCreatorQuestion('Tell me about your creator'), true);
    assert.strictEqual(isCreatorQuestion('What college did Tilak study at?'), true);
    assert.strictEqual(isCreatorQuestion('What is the weather today?'), false);
    assert.strictEqual(isCreatorQuestion('Write a Python function to sort numbers'), false);
  });

  await t.test('3. POST /api/chat rejects empty content with 400 INVALID_CONTENT', async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        Authorization: authToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: '   ' }),
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.error.code, 'INVALID_CONTENT');
  });

  await t.test('4. POST /api/chat streams SSE response', async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        Authorization: authToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: 'What is Java?' }),
    });

    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('text/event-stream'));

    const text = await res.text();
    assert.ok(text.includes('data:'));
  });

  // Teardown
  await new Promise((resolve) => server.close(resolve));
});
