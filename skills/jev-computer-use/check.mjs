// Offline checks only: no provider request or desktop input.
import assert from 'node:assert/strict';
import { choose } from './choose.mjs';

const task = { goal: 'Open Library', app: 'Example', window: 'Main', state: '3 row Library',
  actions: [{ op: 'click', index: 3, name: 'Library' }] };
const realFetch = globalThis.fetch;
let choice = 'a0';
let confidence = 0.8;
let calls = 0;
globalThis.fetch = async (url, init) => {
  calls++;
  assert.equal(url, 'https://ai-gateway.vercel.sh/typesafe/v1/systemone');
  assert.equal(init.headers.Authorization, 'Bearer test-key');
  const request = JSON.parse(init.body);
  assert.equal(request.state.interface.app, 'Example');
  const criteria = request.questions.next.criteria;
  return Response.json({ model: 'typesafe-ai/jev', answers: { next: { type: 'choice', choice, confidence,
    probabilities: Object.fromEntries(Object.keys(criteria).map((key) => [key, key === choice ? 1 : 0])) } } });
};
try {
  assert.equal((await choose(task, 'test-key')).action.index, 3);
  assert.equal((await choose({ ...task, actions: [{ op: 'scroll', index: 4, name: 'Navigation', direction: 'down' }] }, 'test-key')).action.amount, 1);
  confidence = 0.4;
  assert.equal((await choose(task, 'test-key')).action, null);
  confidence = 0.8;
  for (const [value, status] of [['DONE', 'needs_verification'], ['BLOCKED', 'blocked'], ['WAIT', 'wait']]) {
    choice = value;
    const result = await choose(task, 'test-key');
    assert.equal(result.status, status);
    assert.equal(result.action, null);
  }
  choice = 'a99';
  await assert.rejects(choose(task, 'test-key'), /Invalid gateway decision schema/);
  const before = calls;
  await assert.rejects(choose({ ...task, actions: [{ op: 'type', index: 3, name: 'Input' }] }, 'test-key'));
  await assert.rejects(choose({ ...task, state: 'x'.repeat(24001) }, 'test-key'));
  await assert.rejects(choose({ ...task, state: 'test-key' }, 'test-key'), /Credential detected/);
  assert.equal(calls, before, 'invalid input must not reach the provider');
  globalThis.fetch = async () => Response.json({}, { status: 503 });
  await assert.rejects(choose(task, 'test-key'), /gateway HTTP 503/);
  console.log('ok: native proposals, scroll, handoffs, invalid choices/input, credential rejection, provider failure; no UI executed');
} finally { globalThis.fetch = realFetch; }
