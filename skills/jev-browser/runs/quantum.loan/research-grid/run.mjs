#!/usr/bin/env node
// jb-run origin=https://quantum.loan entry=/leads/research account=tnewman@quantafinance.com
// Bounded read/view smoke test. No model requests, saved views, exports, or business writes.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseState } from '../../../bridge.mjs';
import { guard, resolveTab } from '../../../jb.mjs';
import { attachTab } from '../../../tab.mjs';
import { callResearchTool, isResearchUrl, listResearchTools } from '../../../research-grid.mjs';

const [outputArg, entry = 'https://quantum.loan/leads/research'] = process.argv.slice(2);
if (!outputArg || !isResearchUrl(entry) || process.argv.length > 4) {
  console.error('usage: node run.mjs <evidence-directory> [https://quantum.loan/leads/research | http://jb-fixture.localhost:4174/research]');
  process.exit(2);
}
const output = resolve(outputArg);
mkdirSync(output, { recursive: true });
const jb = fileURLToPath(new URL('../../../jb.mjs', import.meta.url));
const receipt = { entry, startedAt: new Date().toISOString(), status: 'running', semanticChecks: [], uiChecks: [], restored: false, closed: false, screenshots: [], limitations: [] };
let tab;
let prefix;
let original;
let changed = false;
const sleep = ms => new Promise(done => setTimeout(done, ms));
const setView = async view => { changed = true; return callResearchTool(tab, 'research_grid_set_view', view); };
const state = () => callResearchTool(tab, 'research_grid_get_state', {});
const record = (channel, name, value) => { receipt[channel].push({ name, passed: true, state: value }); };

async function ready(predicate = () => true) {
  for (const deadline = Date.now() + 12000; ;) {
    const current = await state();
    if (current.error) throw new Error(`grid error: ${current.error}`);
    if (!current.loading && predicate(current)) return current;
    if (Date.now() >= deadline) throw new Error('grid did not reach the expected loaded state within 12 seconds');
    await sleep(250);
  }
}

async function control(kind, match = () => true) {
  const snapshot = await tab.getAXState();
  const roles = kind === 'sort' ? ['columnheader']
    : kind === 'filter-input' ? ['text field', 'spinbutton']
      : kind.endsWith('-option') ? ['option']
        : ['page-size', 'filter-operator'].includes(kind) ? ['combo box'] : ['button'];
  const candidates = parseState(snapshot).filter(entry => roles.includes(entry.role));
  const hits = [];
  for (const candidate of candidates) {
    const live = await tab.context(candidate.index);
    if (live?.researchGrid?.kind === kind && match(live)) hits.push(candidate);
  }
  if (hits.length !== 1) throw new Error(`expected one ${kind} control, found ${hits.length}`);
  return hits[0].index;
}

async function visible() {
  if (await tab.evaluate('document.visibilityState') !== 'visible') {
    const filename = `ui-${receipt.uiChecks.length}.png`;
    await tab.screenshot(resolve(output, filename));
    receipt.screenshots.push(filename);
  }
  if (await tab.evaluate('document.visibilityState') !== 'visible') throw new Error('Dex Work tab is covered; UI smoke proof requires the visible tab');
}

async function click(kind, match) {
  await visible();
  await tab.click(await control(kind, match));
  if (tab.inputs.has('page-dispatched') || tab.animationsOff) throw new Error('UI input used a hidden-tab path; no UI pass is recorded');
}

try {
  let opened;
  try {
    opened = execFileSync(process.execPath, [jb, 'open', entry], { encoding: 'utf8', timeout: 35000, maxBuffer: 1000000 });
  } catch (error) {
    prefix = String(error.stdout ?? '').match(/^tab ([A-Fa-f0-9]+)/m)?.[1];
    throw error;
  }
  prefix = opened.match(/^tab ([A-Fa-f0-9]+)/m)?.[1];
  if (!prefix) throw new Error('jb did not return an owned tab');
  receipt.tab = prefix;
  const owner = await resolveTab(prefix);
  tab = await attachTab(owner.id);
  guard(tab, false);
  const tools = await listResearchTools(tab);
  if (!['research_grid_get_state', 'research_grid_set_view'].every(name => tools.some(tool => tool.name === name))) throw new Error('both reviewed Research tools must be registered');
  const initial = await ready();
  original = { page: initial.page, pageSize: initial.pageSize, filters: initial.filters, sorts: initial.sorts };
  receipt.initial = initial;
  if (initial.rowCount <= 1000) throw new Error('smoke requires more than 1000 matching rows');
  const first = await setView({ page: 1, pageSize: 100, filters: {}, sorts: [{ colId: 'loanCount', sort: 'asc' }, { colId: 'totalVolume', sort: 'desc' }] });
  assert.equal(first.loading, false);
  assert.equal(first.error, null);
  assert.ok(first.rowIds.length > 0);
  assert.equal(new Set(first.rowIds).size, first.rowIds.length);
  for (let i = 1; i < first.rows.length; i++) {
    const a = first.rows[i - 1];
    const b = first.rows[i];
    const countsOrdered = a.loanCount === null ? b.loanCount === null : b.loanCount === null || a.loanCount <= b.loanCount;
    const volumesOrdered = a.totalVolume === null ? b.totalVolume === null : b.totalVolume === null || Number(a.totalVolume) >= Number(b.totalVolume);
    assert.ok(countsOrdered && (a.loanCount !== b.loanCount || volumesOrdered), 'loanCount asc / numeric totalVolume desc, NULLS LAST');
  }
  record('semanticChecks', 'sorted first page and unique row IDs', first);
  const beyond = await setView({ page: 11 });
  assert.equal(beyond.page, 11);
  assert.ok(beyond.rowIds.length > 0 && beyond.rowIds.every(id => !first.rowIds.includes(id)));
  record('semanticChecks', 'page beyond first 1000 rows', beyond);
  const back = await setView({ page: 1 });
  assert.deepEqual(back.rowIds, first.rowIds);
  record('semanticChecks', 'back navigation preserves row IDs', back);

  await tab.screenshot(resolve(output, 'before-ui.png'));
  receipt.screenshots.push('before-ui.png');
  // screenshot brings the tab forward; reset only earlier semantic-path animation observations.
  tab.inputs.clear();
  tab.animationsOff = false;
  await click('page', item => item.researchGrid.page === 'next');
  record('uiChecks', 'Next Page click', await ready(value => value.page === 2));
  await click('page', item => item.researchGrid.page === 'previous');
  const uiBack = await ready(value => value.page === 1);
  assert.deepEqual(uiBack.rowIds, first.rowIds);
  record('uiChecks', 'Previous Page click', uiBack);
  await click('page-size');
  await click('page-size-option', item => item.name === '500');
  record('uiChecks', 'page-size selector', await ready(value => value.pageSize === 500));
  await click('sort', item => item.researchGrid.colId === 'entity');
  record('uiChecks', 'sortable header click', await ready(value => value.sorts[0]?.colId === 'entity' && value.sorts[0]?.sort === 'asc'));

  const entity = first.rows.find(row => typeof row.entityName === 'string' && row.entityName.trim())?.entityName;
  if (!entity) throw new Error('no entity name is available for the filter smoke');
  await visible();
  await tab.pressKey(null, 'Ctrl+Enter');
  await click('filter-operator');
  await click('filter-operator-option', item => item.name === 'Equals');
  await visible();
  await tab.type(await control('filter-input'), entity);
  const filtered = await ready(value => value.filters.entity?.filter === entity && value.filters.entity?.type === 'equals');
  if (tab.inputs.has('page-dispatched') || tab.animationsOff) throw new Error('filter input used a hidden-tab path; no UI pass is recorded');
  assert.ok(filtered.rows.length && filtered.rows.every(row => typeof row.entityName === 'string' && row.entityName.toLowerCase() === entity.toLowerCase()), 'filtered rows must contain the selected entity name');
  record('uiChecks', 'text filter through actual input', filtered);
  await tab.pressKey(null, 'Escape');
  await tab.screenshot(resolve(output, 'filtered-ui.png'));
  receipt.screenshots.push('filtered-ui.png');
  receipt.status = 'passed';
  receipt.limitations.push('Screenshots require separate visual inspection; passing UI assertions establishes control effects, not visual quality.');
} catch (error) {
  receipt.status = changed ? 'failed' : 'not-covered';
  receipt.error = error.message;
  process.exitCode = changed ? 1 : 2;
} finally {
  if (tab && original && changed) {
    try {
      const restored = await callResearchTool(tab, 'research_grid_set_view', original);
      assert.equal(restored.page, original.page);
      assert.equal(restored.pageSize, original.pageSize);
      assert.deepEqual(restored.filters, original.filters);
      assert.deepEqual(restored.sorts, original.sorts);
      receipt.restored = true;
    } catch (error) {
      receipt.restoreError = error.message;
      receipt.status = 'failed';
      process.exitCode = 1;
    }
  }
  tab?.close();
  if (prefix) {
    try {
      const closed = execFileSync(process.execPath, [jb, prefix, 'close'], { encoding: 'utf8', timeout: 15000 });
      receipt.closed = closed.includes(`closed ${prefix}`);
    } catch (error) { receipt.closeError = error.message; }
    if (!receipt.closed) { receipt.status = 'failed'; process.exitCode = 1; }
  }
  receipt.completedAt = new Date().toISOString();
  writeFileSync(resolve(output, 'result.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(JSON.stringify(receipt, null, 2));
}
