import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { guard, verdictFor } from './jb.mjs';
import { callResearchTool, isResearchUrl, researchActionAllowed, researchControl, researchToolsInPage, validateResearchCall } from './research-grid.mjs';

const href = 'https://quantum.loan/leads/research';
const meta = (kind, extra = {}) => ({ role: 'button', name: 'Next Page', props: {}, researchGrid: kind ? { kind } : null, ...extra });

test('grid controls require the reviewed route and a classified DOM relationship', () => {
  for (const url of [href, 'http://jb-fixture.localhost:4174/research']) assert.equal(isResearchUrl(url), true);
  for (const url of ['https://quantum.loan/leads', 'https://quantum.loan/leads/research/other', 'https://evil.test/leads/research', 'http://localhost:4173/research', 'http://jb-fixture.localhost:4173/research']) assert.equal(isResearchUrl(url), false);
  for (const kind of ['page', 'sort', 'page-size', 'filter-input', 'filter-operator', 'page-size-option', 'filter-operator-option']) {
    assert.equal(researchActionAllowed({ verb: 'click', meta: meta(kind), href }), true);
    assert.equal(researchActionAllowed({ verb: 'click', meta: meta(kind), href: 'https://quantum.loan/loans' }), false);
    assert.equal(researchActionAllowed({ verb: 'click', meta: meta(kind, { props: { disabled: true } }), href }), false);
  }
  assert.equal(verdictFor({ verb: 'click', meta: meta(null), quantum: true, href })?.hard, true, 'a matching Next Page name is insufficient');
  assert.equal(verdictFor({ verb: 'click', meta: meta('page'), quantum: true, href }), null);
  assert.equal(verdictFor({ verb: 'click', meta: meta(null, { name: 'Save View' }), quantum: true, href })?.hard, true);
  assert.equal(researchActionAllowed({ verb: 'type', meta: meta('filter-input'), href }), true);
  assert.equal(researchActionAllowed({ verb: 'type', meta: meta('page-size'), href }), false);
  assert.equal(researchActionAllowed({ verb: 'press', focused: meta('filter-operator'), key: 'ArrowDown', href }), true);
  assert.equal(researchActionAllowed({ verb: 'press', focused: meta('sort'), key: 'ArrowDown', href }), false);
  assert.equal(researchActionAllowed({ verb: 'press', focused: meta('sort'), key: 'Ctrl+Enter', href }), true);
  assert.equal(verdictFor({ verb: 'press', focused: meta(null), key: 'Ctrl+Enter', quantum: true, href })?.hard, true);
  assert.equal(verdictFor({ verb: 'press', focused: meta(null), key: 'Ctrl+Enter', quantum: false, href: 'https://example.com' })?.hard, true);
});

test('DOM classification refuses duplicate roots, other grids, and editable cells', () => {
  const node = { closest: () => null, getAttribute: () => 'button', matches: () => false };
  for (const options of [{ roots: 0 }, { roots: 2 }, { grids: 0 }, { grids: 2 }, { inside: false }, { cell: true }]) {
    const grid = { contains: () => true };
    const root = { querySelectorAll: () => Array(options.grids ?? 1).fill(grid), contains: () => options.inside !== false };
    const document = { querySelectorAll: () => Array(options.roots ?? 1).fill(root) };
    const candidate = { ...node, closest: selector => options.cell && selector.includes('.ag-cell') ? {} : null };
    const inspect = runInNewContext(`(${researchControl.toString()})`, { document });
    assert.equal(inspect.call(candidate), null);
  }
});

test('bounded arguments reject unsupported verbs, extra keys, and oversized models', () => {
  validateResearchCall('research_grid_get_state', {});
  validateResearchCall('research_grid_set_view', { page: 2, pageSize: 100, filters: {}, sorts: [{ colId: 'loanCount', sort: 'desc' }] });
  for (const [name, args] of [
    ['save_view', {}], ['research_grid_get_state', { page: 1 }], ['research_grid_set_view', {}],
    ['research_grid_set_view', { page: 0 }], ['research_grid_set_view', { page: 1.5 }],
    ['research_grid_set_view', { pageSize: 10000 }], ['research_grid_set_view', { save: true }],
    ['research_grid_set_view', { filters: [] }], ['research_grid_set_view', { sorts: [{ colId: 'entity', sort: 'asc', save: true }] }],
    ['research_grid_set_view', { filters: { entity: { filter: 'x'.repeat(16000) } } }],
  ]) assert.throws(() => validateResearchCall(name, args));
});

function pageFixture(options = {}) {
  const window = {};
  window.top = options.frame ? {} : window;
  const location = new URL(options.href ?? href);
  const state = { page: 1, pageSize: 1000, rowCount: 2001, totalPages: 3, filters: {}, sorts: [], loading: false, error: null, rows: [], rowIds: [] };
  const tool = { name: 'research_grid_get_state', description: 'State', inputSchema: { type: 'object', properties: {} }, origin: options.toolOrigin ?? location.origin, window: options.toolFrame ? {} : window };
  let discoveryCount = 0;
  const calls = [];
  const context = {
    async getTools() {
      discoveryCount++;
      if (options.navigate && discoveryCount === 2) location.pathname = '/loans';
      if (options.changed && discoveryCount === 2) return [{ ...tool, inputSchema: { type: 'string' } }];
      return options.duplicate ? [tool, { ...tool }] : [tool];
    },
    async executeTool(found, args, executionOptions) {
      calls.push({ found, args, executionOptions });
      return options.result ?? state;
    },
  };
  const root = { querySelectorAll: () => Array(options.grids ?? 1).fill({}) };
  const document = { querySelector: () => options.shell === false ? null : {}, querySelectorAll: () => Array(options.roots ?? 1).fill(root), modelContext: options.unsupported ? undefined : context };
  const fetch = async () => ({ ok: true, json: async () => ({ user: { email: (calls.length ? options.postEmail : options.email) ?? 'tnewman@quantafinance.com' } }) });
  const invoke = runInNewContext(`(${researchToolsInPage.toString()})`, { document, window, location, AbortSignal, fetch });
  return { invoke, calls };
}

test('native execution uses the exact top-level descriptor and object arguments', async () => {
  const { invoke, calls } = pageFixture();
  assert.equal((await invoke())[0].name, 'research_grid_get_state');
  const state = await invoke('research_grid_get_state', {});
  assert.equal(state.page, 1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].found.name, 'research_grid_get_state');
  assert.equal(typeof calls[0].args, 'object');
  assert.ok(calls[0].executionOptions.signal instanceof AbortSignal);
});

test('native execution fails closed on route, root, frame, missing API, and changed tool', async () => {
  for (const options of [
    { href: 'https://evil.test/leads/research' }, { href: 'https://quantum.loan/leads' },
    { roots: 0 }, { roots: 2 }, { grids: 0 }, { grids: 2 }, { frame: true },
    { toolFrame: true }, { toolOrigin: 'https://evil.test' }, { duplicate: true },
    { unsupported: true }, { changed: true }, { navigate: true }, { email: 'wrong@example.com' }, { shell: false },
  ]) {
    const { invoke, calls } = pageFixture(options);
    await assert.rejects(invoke('research_grid_get_state', {}), JSON.stringify(options));
    assert.equal(calls.length, 0);
  }
});

test('native execution rejects oversized output instead of returning customer data', async () => {
  const { invoke } = pageFixture({ result: { rows: Array(21).fill({}), rowIds: [] } });
  await assert.rejects(invoke('research_grid_get_state', {}), /unbounded/);
});

test('tools retain live account and popup guards before page execution', async () => {
  for (const options of [{ email: 'wrong@example.com' }, { popup: true }, { href: 'https://quantum.loan/loans' }]) {
    let executed = false;
    const tab = {
      windowOpens: options.popup ? ['https://evil.test'] : [], children: async () => [], lastCheck() {},
      async evaluate(expression) {
        if (expression === 'location.href') return options.href ?? href;
        if (expression.startsWith('Promise.all')) return [options.email ?? 'tnewman@quantafinance.com', true];
        executed = true;
        return {};
      },
    };
    guard(tab, false);
    await assert.rejects(callResearchTool(tab, 'research_grid_get_state', {}));
    assert.equal(executed, false);
  }
});

test('identity changes during execution withhold tool results', async () => {
  const { invoke, calls } = pageFixture({ postEmail: 'wrong@example.com' });
  await assert.rejects(invoke('research_grid_get_state', {}), /account or app shell changed/);
  assert.equal(calls.length, 1, 'the view operation completed, but no result was released for the changed account');
});
