// Reviewed Research-grid operations. Page annotations never grant execution authority.
export const RESEARCH_TOOLS = ['research_grid_get_state', 'research_grid_set_view'];
export const RESEARCH_PAGE_SIZES = [100, 500, 1000, 5000];

export function isResearchUrl(href) {
  try {
    const url = new URL(href);
    return (url.origin === 'https://quantum.loan' && url.pathname === '/leads/research')
      || (url.origin === 'http://jb-fixture.localhost:4174' && url.pathname === '/research');
  } catch { return false; }
}

// Runs in the page for a single live DOM node. Popups must stay inside the reviewed root;
// listbox options must belong to a known selector through aria-controls, never name alone.
export function researchControl() {
  const roots = document.querySelectorAll('[data-research-grid="true"]');
  if (roots.length !== 1) return null;
  const root = roots[0];
  const grids = root.querySelectorAll('[grid-id="research-grid"]');
  if (grids.length !== 1 || root.querySelectorAll('[grid-id]').length !== 1 || !root.contains(this) || this.closest('.ag-cell, .ag-row, [data-research-grid-business-control]')) return null;
  const grid = grids[0];
  const role = this.getAttribute('role');
  const header = this.closest('.ag-header-cell');
  const colId = header?.getAttribute('col-id');
  if (grid.contains(this) && header && colId) {
    if (this === header && header.classList.contains('ag-header-cell-sortable') && role === 'columnheader') return { kind: 'sort', colId };
  }
  if (grid.contains(this) && this.closest('.ag-paging-panel')) {
    const page = ['first', 'previous', 'next', 'last'].find(value => this.getAttribute('data-ref') === `bt${value[0].toUpperCase()}${value.slice(1)}`);
    if (role === 'button' && page) return { kind: 'page', page };
    if (role === 'combobox' && this.closest('.ag-paging-page-size .ag-select')) return { kind: 'page-size' };
  }
  const filter = this.closest('.ag-filter');
  if (filter && root.contains(filter) && filter.closest('.ag-popup-child, .ag-menu')) {
    if (this.matches('input[type="text"], input[type="number"]') && this.closest('.ag-input-field')) return { kind: 'filter-input' };
    if (role === 'combobox' && this.closest('.ag-select')) return { kind: 'filter-operator' };
  }
  if (role === 'option' && this.closest('.ag-select-list')) {
    const list = this.closest('[role="listbox"]');
    if (!list?.id) return null;
    const owner = [...root.querySelectorAll('[role="combobox"][aria-controls]')].filter(element => element.getAttribute('aria-controls') === list.id);
    if (owner.length !== 1) return null;
    const kind = researchControl.call(owner[0])?.kind;
    if (kind === 'page-size' && ['100', '500', '1000', '5000'].includes(this.textContent.trim())) return { kind: 'page-size-option' };
    if (kind === 'filter-operator') return { kind: 'filter-operator-option' };
  }
  return null;
}

export function researchActionAllowed({ verb, meta, key, focused, href }) {
  if (!isResearchUrl(href)) return false;
  const target = verb === 'press' ? focused : meta;
  if (!target || target.props?.disabled === true || target.props?.disabled === 'true') return false;
  const kind = target.researchGrid?.kind;
  if (verb === 'click') return ['sort', 'page', 'page-size', 'filter-input', 'filter-operator', 'page-size-option', 'filter-operator-option'].includes(kind);
  if (verb === 'type') return kind === 'filter-input';
  if (verb !== 'press') return false;
  if (key === 'Ctrl+Enter') return kind === 'sort';
  if (['page-size', 'filter-operator', 'page-size-option', 'filter-operator-option'].includes(kind)) return ['ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', 'Escape', 'Tab', 'Shift+Tab'].includes(key);
  if (kind === 'filter-input') return ['Enter', 'Escape', 'Tab', 'Shift+Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key);
  return ['sort', 'page'].includes(kind) && ['Enter', 'Escape', 'Tab', 'Shift+Tab'].includes(key);
}

export function validateResearchCall(name, args) {
  if (!RESEARCH_TOOLS.includes(name)) throw new Error(`unreviewed Research tool: ${name}`);
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('tool arguments must be a JSON object');
  const keys = Object.keys(args);
  if (name === 'research_grid_get_state') {
    if (keys.length) throw new Error('research_grid_get_state takes no arguments');
    return;
  }
  if (!keys.length || keys.some(key => !['page', 'pageSize', 'filters', 'sorts'].includes(key))) throw new Error('set_view accepts only page, pageSize, filters, and sorts, with at least one supplied');
  if ('page' in args && (!Number.isSafeInteger(args.page) || args.page < 1 || args.page > 2147483647)) throw new Error('page must be an integer from 1 to 2147483647');
  if ('pageSize' in args && !RESEARCH_PAGE_SIZES.includes(args.pageSize)) throw new Error('unsupported Research page size');
  if ('filters' in args && (!args.filters || typeof args.filters !== 'object' || Array.isArray(args.filters) || Object.keys(args.filters).length > 40)) throw new Error('filters must be a bounded model object');
  if ('sorts' in args && (!Array.isArray(args.sorts) || args.sorts.length > 40 || args.sorts.some(sort => !sort || typeof sort.colId !== 'string' || !['asc', 'desc'].includes(sort.sort) || Object.keys(sort).some(key => !['colId', 'sort'].includes(key))))) throw new Error('sorts must be a bounded array of {colId, sort}');
  if (JSON.stringify(args).length > 16000) throw new Error('Research tool arguments exceed 16000 characters');
}

// Deliberately native-only: no old navigator API, testing shim, or app-private execution hook.
// Every invocation rediscovers tools, rejects frame tools and rechecks the contract before execution.
export async function researchToolsInPage(name, args) {
  const assertPage = () => {
    const allowed = (location.origin === 'https://quantum.loan' && location.pathname === '/leads/research')
      || (location.origin === 'http://jb-fixture.localhost:4174' && location.pathname === '/research');
    const roots = document.querySelectorAll('[data-research-grid="true"]');
    if (!allowed || window !== window.top || roots.length !== 1 || roots[0].querySelectorAll('[grid-id="research-grid"]').length !== 1 || roots[0].querySelectorAll('[grid-id]').length !== 1) throw new Error('Research tools require the reviewed top-level route and unique grid');
  };
  const assertIdentity = async () => {
    if (location.origin !== 'https://quantum.loan') return;
    const response = await fetch('/api/auth/session', { cache: 'no-store', signal: AbortSignal.timeout(1000) });
    const session = response.ok ? await response.json().catch(() => null) : null;
    if (!response.ok || session?.user?.email !== 'tnewman@quantafinance.com' || !document.querySelector('[data-sidebar]')) throw new Error('Quantum account or app shell changed during Research tool access');
  };
  assertPage();
  const context = document.modelContext;
  if (!context?.getTools || !context?.executeTool) throw new Error('native document.modelContext getTools/executeTool is unavailable; this browser does not support the required WebMCP API');
  const allowedNames = ['research_grid_get_state', 'research_grid_set_view'];
  const local = tool => tool.window === window && tool.origin === location.origin && allowedNames.includes(tool.name);
  const describe = tool => ({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema });
  const tools = (await context.getTools()).filter(local);
  assertPage();
  if (tools.some(tool => tools.filter(other => other.name === tool.name).length !== 1)) throw new Error('ambiguous Research tool registration');
  if (!name) {
    await assertIdentity();
    assertPage();
    return tools.map(describe);
  }
  const tool = tools.find(tool => tool.name === name);
  if (!tool) throw new Error(`reviewed top-level tool is not registered: ${name}`);
  const expected = JSON.stringify(describe(tool));
  const fresh = (await context.getTools()).filter(candidate => local(candidate) && candidate.name === name);
  assertPage();
  if (fresh.length !== 1 || JSON.stringify(describe(fresh[0])) !== expected) throw new Error('Research tool changed during discovery; nothing was executed');
  await assertIdentity();
  assertPage();
  const result = await context.executeTool(fresh[0], args, { signal: AbortSignal.timeout(12000) });
  await assertIdentity();
  assertPage();
  if (result === null) throw new Error('Research tool navigated instead of returning grid state');
  const state = typeof result === 'string' ? JSON.parse(result) : result;
  if (!state || typeof state !== 'object' || !Array.isArray(state.rows) || !Array.isArray(state.rowIds) || state.rows.length > 20 || state.rowIds.length > 20 || JSON.stringify(state).length > 32000) throw new Error('Research tool returned an invalid or unbounded state');
  return state;
}

export async function listResearchTools(tab) {
  await tab.authorize({ verb: 'research-tools' });
  tab.lastCheck();
  return tab.evaluate(`(${researchToolsInPage.toString()})()`);
}

export async function callResearchTool(tab, name, args) {
  validateResearchCall(name, args);
  await tab.authorize({ verb: 'research-tools' });
  tab.lastCheck();
  return tab.evaluate(`(${researchToolsInPage.toString()})(${JSON.stringify(name)}, ${JSON.stringify(args)})`);
}
