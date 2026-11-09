import test from 'node:test';
import assert from 'node:assert';
import app from '../src/server.js';

test('Tavi AI Authentication & Protected Routes Test Suite', async (t) => {
  let server;
  const testPort = 5066;
  const baseUrl = `http://127.0.0.1:${testPort}`;

  await t.test('Start test server instance', async () => {
    await new Promise((resolve) => {
      server = app.listen(testPort, () => resolve());
    });
    assert.ok(server.listening);
  });

  await t.test('1. Unauthenticated request to /api/me is rejected with 401 AUTH_TOKEN_MISSING', async () => {
    const res = await fetch(`${baseUrl}/api/me`);
    assert.strictEqual(res.status, 401);

    const body = await res.json();
    assert.strictEqual(body.error.code, 'AUTH_TOKEN_MISSING');
  });

  await t.test('2. Request with malformed Authorization header is rejected with 401', async () => {
    const res = await fetch(`${baseUrl}/api/me`, {
      headers: { Authorization: 'Basic some-credentials' },
    });
    assert.strictEqual(res.status, 401);

    const body = await res.json();
    assert.strictEqual(body.error.code, 'AUTH_TOKEN_MISSING');
  });

  await t.test('3. Request with empty Bearer token is rejected with 401 AUTH_TOKEN_EMPTY', async () => {
    const res = await fetch(`${baseUrl}/api/me`, {
      headers: { Authorization: 'Bearer ' },
    });
    assert.strictEqual(res.status, 401);

    const body = await res.json();
    assert.strictEqual(body.error.code, 'AUTH_TOKEN_EMPTY');
  });

  await t.test('4. Dev/test token successfully authenticates and returns user profile', async () => {
    const res = await fetch(`${baseUrl}/api/me`, {
      headers: { Authorization: 'Bearer mock-token-tilak123' },
    });
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.user.firebaseUid, 'tilak123');
    assert.strictEqual(body.user.email, 'tilak123@example.com');
    assert.strictEqual(body.user.displayName, 'Test User (tilak123)');
  });

  await t.test('5. Account isolation: different tokens return strictly isolated user profiles', async () => {
    const resUserA = await fetch(`${baseUrl}/api/me`, {
      headers: { Authorization: 'Bearer mock-token-user-alice' },
    });
    const resUserB = await fetch(`${baseUrl}/api/me`, {
      headers: { Authorization: 'Bearer mock-token-user-bob' },
    });

    const bodyA = await resUserA.json();
    const bodyB = await resUserB.json();

    assert.strictEqual(bodyA.user.firebaseUid, 'user-alice');
    assert.strictEqual(bodyB.user.firebaseUid, 'user-bob');
    assert.notStrictEqual(bodyA.user.firebaseUid, bodyB.user.firebaseUid);
  });

  await t.test('6. PATCH /api/me validates payload and updates preferences', async () => {
    // Test invalid payload
    const invalidRes = await fetch(`${baseUrl}/api/me`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer mock-token-tilak123',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    assert.strictEqual(invalidRes.status, 400);

    // Test valid payload
    const validRes = await fetch(`${baseUrl}/api/me`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer mock-token-tilak123',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        preferences: { theme: 'light', reducedMotion: true },
      }),
    });
    assert.strictEqual(validRes.status, 200);
  });

  // Teardown
  await new Promise((resolve) => server.close(resolve));
});
