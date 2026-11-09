import test from 'node:test';
import assert from 'node:assert';
import app from '../src/server.js';

test('Tavi AI Memory Engine & Admin Dashboard Test Suite', async (t) => {
  let server;
  const testPort = 5099;
  const baseUrl = `http://127.0.0.1:${testPort}`;
  const userToken = 'Bearer mock-token-user-tester';
  const adminToken = 'Bearer mock-token-admin-tester';

  await t.test('Start test server instance', async () => {
    await new Promise((resolve) => {
      server = app.listen(testPort, () => resolve());
    });
    assert.ok(server.listening);
  });

  let memoryId;

  await t.test('1. POST /api/memories saves a new personal memory', async () => {
    const res = await fetch(`${baseUrl}/api/memories`, {
      method: 'POST',
      headers: {
        Authorization: userToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'Preferred response language is Odia and English',
        category: 'preference',
      }),
    });
    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.ok(body.memory);
    assert.strictEqual(body.memory.content, 'Preferred response language is Odia and English');
    memoryId = body.memory._id;
  });

  await t.test('2. GET /api/memories returns user memories', async () => {
    const res = await fetch(`${baseUrl}/api/memories`, {
      headers: { Authorization: userToken },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.memories));
    assert.ok(body.memories.some((m) => m._id === memoryId));
  });

  await t.test('3. DELETE /api/memories/:id deletes specific memory', async () => {
    const res = await fetch(`${baseUrl}/api/memories/${memoryId}`, {
      method: 'DELETE',
      headers: { Authorization: userToken },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
  });

  await t.test('4. GET /api/admin/stats returns system status and metrics', async () => {
    const res = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Authorization: adminToken },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.stats);
    assert.strictEqual(body.stats.systemHealth, 'optimal');
    assert.ok(body.stats.providerStatus);
  });

  // Teardown
  await new Promise((resolve) => server.close(resolve));
});

