import test from 'node:test';
import assert from 'node:assert';
import app from '../src/server.js';

test('Tavi AI Conversations & Isolation Test Suite', async (t) => {
  let server;
  const testPort = 5077;
  const baseUrl = `http://127.0.0.1:${testPort}`;
  const userAToken = 'Bearer mock-token-user-alpha';
  const userBToken = 'Bearer mock-token-user-beta';

  await t.test('Start test server instance', async () => {
    await new Promise((resolve) => {
      server = app.listen(testPort, () => resolve());
    });
    assert.ok(server.listening);
  });

  await t.test('1. Unauthenticated request to /api/conversations is rejected with 401', async () => {
    const res = await fetch(`${baseUrl}/api/conversations`);
    assert.strictEqual(res.status, 401);
  });

  let convIdUserA;

  await t.test('2. User Alpha can create a new conversation', async () => {
    const res = await fetch(`${baseUrl}/api/conversations`, {
      method: 'POST',
      headers: {
        Authorization: userAToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Alpha Project Exploration' }),
    });
    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.ok(body.conversation);
    assert.strictEqual(body.conversation.title, 'Alpha Project Exploration');
    assert.strictEqual(body.conversation.userId, 'user-alpha');
    convIdUserA = body.conversation._id;
  });

  await t.test('3. User Alpha can list their conversations', async () => {
    const res = await fetch(`${baseUrl}/api/conversations`, {
      headers: { Authorization: userAToken },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.conversations));
    assert.ok(body.conversations.some((c) => c._id === convIdUserA));
  });

  await t.test('3.5. Conversation details returns associated messages', async () => {
    const chatRes = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        Authorization: userAToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId: convIdUserA,
        content: 'Hello Tavi, test message',
      }),
    });
    assert.strictEqual(chatRes.status, 200);

    const getRes = await fetch(`${baseUrl}/api/conversations/${convIdUserA}`, {
      headers: { Authorization: userAToken },
    });
    assert.strictEqual(getRes.status, 200);
    const body = await getRes.json();
    assert.ok(Array.isArray(body.messages));
    assert.ok(body.messages.length >= 1);
    assert.strictEqual(body.messages[0].content, 'Hello Tavi, test message');
  });

  await t.test('4. Data Isolation: User Beta CANNOT view or access User Alpha conversation', async () => {
    // User Beta tries to access User Alpha's conversation by ID
    const res = await fetch(`${baseUrl}/api/conversations/${convIdUserA}`, {
      headers: { Authorization: userBToken },
    });
    assert.strictEqual(res.status, 404); // Or 403, returns not found to avoid ID enumeration
  });

  await t.test('5. Data Isolation: User Beta conversation list does not contain User Alpha data', async () => {
    const res = await fetch(`${baseUrl}/api/conversations`, {
      headers: { Authorization: userBToken },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.conversations.some((c) => c._id === convIdUserA), false);
  });

  await t.test('6. User Alpha can rename their conversation', async () => {
    const res = await fetch(`${baseUrl}/api/conversations/${convIdUserA}`, {
      method: 'PATCH',
      headers: {
        Authorization: userAToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Renamed Alpha Discussion' }),
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.conversation.title, 'Renamed Alpha Discussion');
  });

  await t.test('7. User Alpha can delete their conversation', async () => {
    const res = await fetch(`${baseUrl}/api/conversations/${convIdUserA}`, {
      method: 'DELETE',
      headers: { Authorization: userAToken },
    });
    assert.strictEqual(res.status, 200);
  });

  // Teardown
  await new Promise((resolve) => server.close(resolve));
});

