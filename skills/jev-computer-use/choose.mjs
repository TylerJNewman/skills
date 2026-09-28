#!/usr/bin/env node
// Propose one native navigation action. CUA execution and fresh-target checks belong to the caller.
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { decide } from '../jev-browser/bridge.mjs';

export async function choose(task, key = process.env.AI_GATEWAY_API_KEY) {
  const text = (value) => typeof value === 'string' && value.trim().length > 0;
  if (!task || !['goal', 'app', 'window', 'state'].every((field) => text(task[field])) ||
      !Array.isArray(task.actions) || task.actions.length > 30 ||
      JSON.stringify(task).length > 24000) throw new Error('Provide goal, app, window, state, and up to 30 observed actions (24,000 characters maximum).');
  const actions = task.actions.map((action) => {
    if (!action || !Number.isSafeInteger(action.index) || action.index < 0 || !text(action.name) ||
        !['click', 'scroll'].includes(action.op) ||
        (action.op === 'scroll' && !['up', 'down'].includes(action.direction))) {
      throw new Error('Each action needs an observed index, name, and click or scroll operation; scroll needs up/down.');
    }
    return action.op === 'click'
      ? { op: 'click', index: action.index, name: action.name, description: `Click ${action.name}` }
      : { op: 'scroll', index: action.index, name: action.name, direction: action.direction, amount: 1,
          description: `Scroll ${action.direction} within ${action.name}` };
  });
  const result = await decide({ key, goal: task.goal,
    state: { app: task.app, window: task.window, accessibility: task.state }, actions, timeoutMs: 10000 });
  const status = result.confidence < 0.55 ? 'low_confidence' : result.choice === 'DONE' ? 'needs_verification'
    : result.action ? 'proposed' : result.choice === 'WAIT' ? 'wait' : 'blocked';
  return { status, app: task.app, window: task.window, choice: result.choice, confidence: result.confidence,
    model: result.model, apiMs: result.apiMs, action: status === 'proposed' ? result.action : null };
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await choose(JSON.parse(readFileSync(0, 'utf8'))), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
