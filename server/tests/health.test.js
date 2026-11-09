import test from 'node:test';
import assert from 'node:assert';
import app from '../src/server.js';
import http from 'node:http';

test('Tavi AI Server Health Endpoint', async (t) => {
  let server;
  const testPort = 5055;

  await t.test('Server starts and binds to port', async () => {
    await new Promise((resolve) => {
      server = app.listen(testPort, () => resolve());
    });
    assert.ok(server.listening);
  });

  await t.test('GET /api/health returns 200 and valid service identity', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/health`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.status, 'healthy');
    assert.strictEqual(body.service, 'Tavi AI API');
    assert.strictEqual(body.creator, 'Tilak Dalai');
    assert.strictEqual(body.tagline, 'Your AI. Your Ideas. Your World.');
    assert.strictEqual(body.subsystems.aiModel.model, 'beam:cloud');
    assert.strictEqual(body.subsystems.aiModel.provider, 'Beam via Ollama Cloud');
    assert.ok(body.timestamp);
  });

  await t.test('GET /api/unknown-endpoint returns 404 with standard error format', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/unknown-route-test`);
    assert.strictEqual(res.status, 404);

    const body = await res.json();
    assert.strictEqual(body.error.code, 'ROUTE_NOT_FOUND');
    assert.ok(body.error.message.includes('not found'));
  });

  // Cleanup
  await new Promise((resolve) => server.close(resolve));
});

