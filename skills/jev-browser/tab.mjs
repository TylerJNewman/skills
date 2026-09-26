// One Chrome tab over CDP, shaped like the cua_repl tab bridge.mjs drives (getAXState, click,
// scroll, pressKey, reload), plus the verbs jb adds for hand-flying. Snapshot format:
//   Browser tab: <title>. URL: "<url>".
//   <index> <role>[ (<states>)] <name>[, Value: <value>]
// Every click, type, key press, and scroll first passes `tab.authorize`, which jb installs, so hand-flown
// actions and Jev's actions meet the same check at the moment of dispatch.
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { browser, connect, endpoint } from './cdp.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEX = '/Users/tyler/.oracle/browser-profile';
// Distinct names keep checkable menu items out of bridge.mjs's clickable roles.
const ROLE = {
  checkbox: 'check box', radio: 'radio button', menuitem: 'menu item', textbox: 'text field', searchbox: 'text field',
  combobox: 'combo box', StaticText: 'text', toggleButton: 'toggle button',
};
const CONTROLS = new Set(['button', 'toggleButton', 'link', 'tab', 'checkbox', 'radio', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
  'switch', 'combobox', 'textbox', 'searchbox', 'option', 'treeitem', 'slider', 'spinbutton']);
const NAMED = new Set(['heading', 'dialog', 'alertdialog', 'alert', 'status']);
const STATES = ['focused', 'selected', 'expanded', 'checked', 'pressed', 'disabled'];
const BUDGET = 22000; // bridge.mjs rejects snapshots over 24000 chars
const KEYS = {
  Enter: [13, 'Enter', '\r'], Escape: [27, 'Escape'], Tab: [9, 'Tab'], PageUp: [33, 'PageUp'],
  PageDown: [34, 'PageDown'], End: [35, 'End'], Home: [36, 'Home'],
  ArrowUp: [38, 'ArrowUp'], ArrowDown: [40, 'ArrowDown'], ArrowLeft: [37, 'ArrowLeft'], ArrowRight: [39, 'ArrowRight'],
};
// Hidden tabs never finish CSS animations, which leaves closed dialogs and menus mounted, so a hidden
// tab runs without them. A visible tab keeps the page as shipped.
const STILL = `(() => {
  if (document.getElementById('jb-still')) return;
  const style = document.createElement('style');
  style.id = 'jb-still';
  style.textContent = '*, *::before, *::after { animation: none !important; transition: none !important; }';
  document.documentElement.append(style);
})()`;
const UNSTILL = `document.getElementById('jb-still')?.remove()`;
// Refuses disabled or covered targets; otherwise scrolls the target into view and returns its center.
const PROBE = `function () {
  if (this.disabled || this.getAttribute('aria-disabled') === 'true' || this.closest('[inert]')) return 'disabled';
  this.scrollIntoView({ block: 'center', inline: 'center' });
  const r = this.getBoundingClientRect();
  const x = r.x + r.width / 2;
  const y = r.y + r.height / 2;
  const hit = document.elementFromPoint(x, y);
  return hit && (hit === this || this.contains(hit)) ? [x, y] : 'covered';
}`;
const SYNTHETIC_CLICK = `function (x, y) {
  const o = { bubbles: true, cancelable: true, composed: true, view: window, clientX: x, clientY: y,
    button: 0, buttons: 1, pointerId: 1, pointerType: 'mouse', isPrimary: true };
  this.dispatchEvent(new PointerEvent('pointerdown', o));
  this.dispatchEvent(new MouseEvent('mousedown', o));
  this.focus?.();
  this.dispatchEvent(new PointerEvent('pointerup', { ...o, buttons: 0 }));
  this.dispatchEvent(new MouseEvent('mouseup', { ...o, buttons: 0 }));
  this.dispatchEvent(new MouseEvent('click', { ...o, buttons: 0 }));
}`;
const DIALOG = `function () { return this.closest('[role="dialog"], [role="alertdialog"], dialog'); }`;
// Whether this element is a dialog's search input (a combobox whose aria-controls listbox sits in the same
// dialog) and whether it has a selected result there, or is itself a result in such a listbox.
const RELATION = `function () {
  const d = this.closest('[role="dialog"], [role="alertdialog"], dialog');
  const listOf = (input) => (input?.getAttribute('role') === 'combobox' ? document.getElementById(input.getAttribute('aria-controls') ?? '') : null);
  const own = listOf(this);
  const searchInput = !!(d && own && own.getAttribute('role') === 'listbox' && d.contains(own));
  const list = this.closest('[role="listbox"]');
  const inResults = !!(d && list && this.getAttribute('role') === 'option' && [...d.querySelectorAll('[role="combobox"]')].some((i) => listOf(i) === list));
  const resultSelected = searchInput && !!own.querySelector('[role="option"][aria-selected="true"]');
  return { searchInput, inResults, resultSelected };
}`;
const FINGERPRINT = '`${location.href}|${document.getElementsByTagName("*").length}|${document.body?.textContent.length}`';
export const POPUP = 'the page opened, or asked to open, a new tab, so jb stopped on this one; it prints the new tab once it appears';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clip = (s, n = 100) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
// Page text is untrusted: one line per element, so no title, name, or value can forge a row or the URL.
const oneLine = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const origin = (url) => { try { return new URL(url).origin; } catch { return ''; } };
// Chrome's own facts about a control, unclipped: what authorization decides on.
const metaOf = (n) => ({
  role: n.role?.value, name: oneLine(n.name?.value), backendNodeId: n.backendDOMNodeId,
  props: Object.fromEntries((n.properties ?? []).map((p) => [p.name, p.value?.value])),
});

/** Rejects if `promise` has not settled within `ms`. */
export function within(ms, promise, what) {
  let timer;
  const late = new Promise((_, fail) => { timer = setTimeout(() => fail(new Error(`${what} took over ${Math.ceil(ms / 1000)} s`)), Math.max(0, ms)); });
  return Promise.race([promise, late]).finally(() => clearTimeout(timer));
}

/** Snapshot text from an accessibility tree, plus each index's backend node and raw metadata. */
export function formatState(title, url, nodes) {
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));
  const insideControl = (n) => {
    for (let p = byId.get(n.parentId), d = 0; p && d < 4; p = byId.get(p.parentId), d++)
      if (CONTROLS.has(p.role?.value) || p.role?.value === 'heading') return true;
    return false;
  };
  const byIndex = [];
  const meta = [];
  const lines = [];
  for (const n of nodes) {
    let role = n.role?.value;
    const name = oneLine(n.name?.value);
    if (n.ignored || !(CONTROLS.has(role) || NAMED.has(role) || role === 'StaticText')) continue;
    if (role === 'StaticText' && (!name || insideControl(n))) continue;
    if (NAMED.has(role) && !name) continue;
    const m = metaOf(n);
    if (role === 'button' && 'pressed' in m.props) role = 'toggleButton';
    const states = STATES.filter((s) => m.props[s] === true || m.props[s] === 'true' || m.props[s] === 'mixed');
    const value = oneLine(n.value?.value);
    // bridge.mjs cannot parse an empty name, and reads a leading "(...)" as states, so those get an explicit slot.
    const label = clip(name || '(no name)') + (value ? `, Value: ${clip(value, 60)}` : '');
    const slot = states.length || label.startsWith('(') ? ` (${states.join(', ')})` : '';
    byIndex.push(n.backendDOMNodeId);
    meta.push(m);
    lines.push({ text: `${byIndex.length - 1} ${ROLE[role] ?? role}${slot} ${label}`, prose: role === 'StaticText' });
  }
  const head = `Browser tab: ${clip(oneLine(title).replaceAll('"', "'"), 120)}. URL: "${url}".`;
  let size = head.length + lines.reduce((t, l) => t + l.text.length + 1, 0);
  let dropped = 0;
  for (let i = lines.length - 1; i >= 0 && size > BUDGET; i--)
    if (lines[i].prose) { size -= lines[i].text.length + 1; lines[i] = null; dropped++; }
  const text = [head, ...lines.filter(Boolean).map((l) => l.text), ...(dropped ? [`(${dropped} text lines omitted)`] : [])].join('\n');
  return { text, byIndex, meta };
}

async function withBrowser(fn) {
  const b = await browser();
  try { return await fn(b); } finally { b.close(); }
}

/** The running Chrome's instance id; it changes when Chrome restarts, and target ids with it. */
export async function browserInstance() {
  return (await (await fetch(`${endpoint()}/json/version`, { signal: AbortSignal.timeout(15000) })).json()).webSocketDebuggerUrl.split('/').pop();
}

/**
 * Open an inert tab in the Dex Work profile through Chrome's own profile routing
 * (--profile-directory=Default) and claim exactly that tab by its one-time address. The caller then
 * navigates it. Tabs made with /json/new or Target.createTarget land in Chrome's last-used profile
 * instead, which can be Dex Personal. The inert page is this skill's blank.html, because Chrome turns
 * a command-line about:blank into its new-tab page.
 */
export async function openInDexWork() {
  const blank = `${new URL('./blank.html', import.meta.url).href}#jb-${randomUUID()}`;
  return withBrowser(async (b) => {
    execFileSync(CHROME, [`--user-data-dir=${DEX}`, '--profile-directory=Default', blank], { stdio: 'ignore', timeout: 15000 });
    for (const deadline = performance.now() + 15000; performance.now() < deadline; await sleep(100)) {
      const hits = (await b.send('Target.getTargets')).targetInfos.filter((t) => t.type === 'page' && t.url === blank);
      if (hits.length > 1) throw new Error('more than one tab carries this open marker; refusing to guess');
      if (hits.length === 1) return { targetId: hits[0].targetId, contextId: hits[0].browserContextId, browser: b.instance };
    }
    throw new Error('Chrome did not open the Dex Work tab within 15 s');
  });
}

/** Browser-level facts about a target, or null once it is gone. */
export const targetInfo = (targetId) => withBrowser(async (b) =>
  (await b.send('Target.getTargets')).targetInfos.find((t) => t.targetId === targetId) ?? null);

/** Page targets this tab opened (window.open, target=_blank). */
export const openedBy = (targetId) => withBrowser(async (b) =>
  (await b.send('Target.getTargets')).targetInfos.filter((t) => t.type === 'page' && t.openerId === targetId));

export const closeTarget = (targetId) => withBrowser((b) => b.send('Target.closeTarget', { targetId }));

export async function attachTab(targetId, { connection } = {}) {
  const c = connection ?? await connect(`${endpoint().replace('http', 'ws')}/devtools/page/${targetId}`);
  // First-party fetch/XHR/document requests only: third-party analytics (PostHog, Sentry) hold requests open.
  const inflight = new Set();
  let lastNetwork = 0;
  c.on(({ method, params }) => {
    if (method === 'Network.requestWillBeSent' && ['Fetch', 'XHR', 'Document'].includes(params.type)
      && (params.type === 'Document' || origin(params.request.url) === origin(params.documentURL))) {
      inflight.add(params.requestId);
      lastNetwork = performance.now();
    } else if ((method === 'Network.loadingFinished' || method === 'Network.loadingFailed') && inflight.delete(params.requestId)) {
      lastNetwork = performance.now();
    } else if (method === 'Page.windowOpen') {
      tab.windowOpens.push(params.url); // the new tab's target can appear seconds later, especially when hidden
    }
  });
  let byIndex = [];
  let meta = [];

  async function evaluate(expression) {
    const { result, exceptionDetails } = await c.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (exceptionDetails) throw new Error(`page script failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
    return result.value;
  }

  async function objectOf(index) {
    const backendNodeId = byIndex[index];
    if (!backendNodeId) throw new Error(`no element ${index} in the latest snapshot`);
    return (await c.send('DOM.resolveNode', { backendNodeId })).object.objectId;
  }

  async function callObject(objectId, functionDeclaration, args = []) {
    const { result, exceptionDetails } = await c.send('Runtime.callFunctionOn', {
      objectId, functionDeclaration, arguments: args.map((value) => ({ value })), returnByValue: true, awaitPromise: true,
    });
    if (exceptionDetails) throw new Error(`page script failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
    return result.value;
  }

  // Chrome's accessibility facts for the element behind a remote object.
  async function metaOfObject(objectId) {
    const { node } = await c.send('DOM.describeNode', { objectId });
    const { nodes } = await c.send('Accessibility.getPartialAXTree', { backendNodeId: node.backendNodeId, fetchRelatives: false });
    const n = nodes.find((x) => x.backendDOMNodeId === node.backendNodeId);
    return n ? metaOf(n) : null;
  }

  // Accessible name of the dialog around a remote object, as Chrome computes it (aria-labelledby lists included).
  async function dialogAround(objectId) {
    const { result } = await c.send('Runtime.callFunctionOn', { objectId, functionDeclaration: DIALOG });
    return result.objectId ? (await metaOfObject(result.objectId))?.name || null : null;
  }

  const visible = async () => (await evaluate('document.visibilityState')) === 'visible';

  // The last check before input reaches the page, or its text goes to Jev: no new tab is pending, and
  // the time the caller set for this work is not spent. Every dispatch that starts input follows it with
  // nothing awaited in between; only a release or key-up, which completes an admitted press, comes later.
  function lastCheck() {
    if (tab.windowOpens.length) throw new Error(POPUP);
    if (performance.now() > tab.deadline) throw new Error('out of time, so nothing more was done');
  }

  // Keep the page as shipped while visible; drop animations while hidden. Rechecked before every action.
  async function syncStill() {
    const hidden = !(await visible());
    await evaluate(hidden ? STILL : UNSTILL);
    if (hidden) tab.animationsOff = true;
    return hidden;
  }

  // After an action, wait until the page holds still (same URL, element count and text length) and the
  // first-party network has been quiet for the same window. A hidden tab's timers fire about once a
  // second, so it needs a longer window before a delayed route change can be ruled out. A page that
  // cannot be read never counts as still. Resolves false when the page is still busy after 5 s.
  async function settle(quietMs = 200, until = Infinity) {
    const deadline = Math.min(performance.now() + 5000, until);
    if (!(await within(deadline - performance.now(), visible(), 'reading the page').catch(() => true))) quietMs = Math.max(quietMs, 1100);
    let last = null;
    let stableSince = performance.now();
    while (performance.now() < deadline) {
      await sleep(50);
      let print;
      try { print = await within(deadline - performance.now(), evaluate(FINGERPRINT), 'reading the page'); } catch { last = null; stableSince = performance.now(); continue; }
      const now = performance.now();
      if (print !== last) { last = print; stableSince = now; continue; }
      if (!inflight.size && now - stableSince >= quietMs && now - lastNetwork >= quietMs) return true;
    }
    return false;
  }

  async function waitForLoad(budgetMs = 30000) {
    const deadline = performance.now() + budgetMs;
    while (performance.now() < deadline) {
      await sleep(250);
      const state = await within(deadline - performance.now(), evaluate('document.readyState'), 'loading').catch(() => '');
      if (state === 'complete') return settle(200, deadline);
    }
    return false;
  }

  const tab = {
    targetId,
    evaluate,
    waitForLoad,
    url: null, // the URL of the latest snapshot, read from the same document as its tree
    inputs: new Set(), // 'trusted' and/or 'page-dispatched', for every action in this attachment
    animationsOff: false,
    windowOpens: [], // URLs the page asked to open in new tabs
    deadline: Infinity, // performance.now() after which no input starts
    authorize: null, // async ({ verb, index, key }) => throws to refuse; installed by jb
    lastCheck,
    close: () => c.close(),

    /** Raw facts about element `index` of the latest snapshot. */
    meta: (index) => meta[index],

    /** Page targets this tab has opened. */
    children: () => openedBy(targetId),

    /**
     * Fresh facts about element `index` (or 'focused'), read now rather than from the snapshot: Chrome's
     * role, name, and properties, the name of its dialog, and its search relationship.
     */
    async context(index) {
      const objectId = index === 'focused'
        ? (await c.send('Runtime.evaluate', { expression: 'document.activeElement' })).result.objectId
        : await objectOf(index);
      if (!objectId) return null;
      const m = await metaOfObject(objectId);
      if (!m) return null;
      const { result } = await c.send('Runtime.callFunctionOn', { objectId, functionDeclaration: RELATION, returnByValue: true });
      return { ...m, ...result.value, dialog: await dialogAround(objectId) };
    },

    // URL and tree must come from one document at one address; any navigation during the read discards it.
    async getAXState() {
      for (let attempt = 0; attempt < 3; attempt++) {
        const before = (await c.send('Page.getFrameTree')).frameTree.frame;
        const [title, url] = await evaluate('[document.title, location.href]');
        const { nodes } = await c.send('Accessibility.getFullAXTree');
        const after = (await c.send('Page.getFrameTree')).frameTree.frame;
        const urlAfter = await evaluate('location.href');
        if (before.loaderId === after.loaderId && url === urlAfter && origin(url) === origin(after.url)) {
          const state = formatState(title, url, nodes);
          byIndex = state.byIndex;
          meta = state.meta;
          tab.url = url;
          return state.text;
        }
        await sleep(200);
      }
      throw new Error('the page kept navigating while it was being read; snap again');
    },

    // Resolves true once the page settles, false if it was still changing after 5 s.
    // The animation sync can change the page, so it runs before the check reads the target's facts; the
    // hit-test runs after both, on the layout the input will meet.
    async click(index) {
      const hidden = await syncStill();
      await tab.authorize?.({ verb: 'click', index });
      const target = await objectOf(index);
      const at = await callObject(target, PROBE);
      if (at === 'disabled') throw new Error(`element ${index} is disabled; nothing was clicked`);
      if (at === 'covered') throw new Error(`element ${index} is covered by another element at its center; nothing was clicked`);
      tab.lastCheck();
      if (hidden) {
        await callObject(target, SYNTHETIC_CLICK, at);
        tab.inputs.add('page-dispatched');
      } else {
        const [x, y] = at;
        await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
        tab.lastCheck(); // the move can make the page ask for a tab, and takes time
        await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
        await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
        tab.inputs.add('trusted');
      }
      return settle();
    },

    // Scrolls the page, or element `index` of the latest snapshot.
    async scroll(index, direction, amount = 1) {
      const pages = (direction === 'down' ? 0.8 : -0.8) * amount;
      const hidden = await syncStill();
      await tab.authorize?.({ verb: 'scroll', index });
      const target = typeof index === 'number' ? await objectOf(index) : null;
      if (hidden) {
        tab.lastCheck();
        if (target) await callObject(target, 'function (p) { (this.scrollHeight > this.clientHeight ? this : document.scrollingElement).scrollBy(0, p * innerHeight); }', [pages]);
        else await evaluate(`scrollBy(0, ${pages} * innerHeight)`);
        tab.inputs.add('page-dispatched');
      } else {
        const at = target ? await callObject(target, PROBE) : await evaluate('[innerWidth / 2, innerHeight / 2]');
        if (!Array.isArray(at)) throw new Error(`element ${index} is ${at}; nothing was scrolled`);
        const deltaY = pages * (await evaluate('innerHeight'));
        tab.lastCheck();
        await c.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: at[0], y: at[1], deltaX: 0, deltaY });
        tab.inputs.add('trusted');
      }
      return settle();
    },

    // Keyboard input is trusted in hidden tabs too.
    async pressKey(_element, name) {
      const shift = name === 'Shift+Tab';
      const spec = KEYS[shift ? 'Tab' : name];
      if (!spec) throw new Error(`unsupported key ${name}`);
      await syncStill();
      await tab.authorize?.({ verb: 'press', key: name });
      const [code, key, text] = spec;
      const base = { key, code: key, windowsVirtualKeyCode: code, modifiers: shift ? 8 : 0 };
      tab.lastCheck();
      await c.send('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', ...base, ...(text ? { text } : {}) });
      await c.send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
      tab.inputs.add('trusted');
      return settle();
    },

    async reload() {
      await c.send('Page.reload');
      return waitForLoad();
    },

    async navigate(url) {
      const { errorText } = await c.send('Page.navigate', { url });
      if (errorText) throw new Error(`could not load ${url}: ${errorText}`);
      return waitForLoad();
    },

    /** A new tab starts as about:blank and commits its URL a moment later; resolves once its page has loaded. */
    async landed(budgetMs = 15000) {
      const deadline = performance.now() + budgetMs;
      while (performance.now() < deadline) {
        const href = await within(deadline - performance.now(), evaluate('location.href'), 'reading the new tab').catch(() => 'about:blank');
        if (!href.startsWith('about:blank')) return waitForLoad(deadline - performance.now()); // settle shares this deadline
        await sleep(250);
      }
      return false;
    },

    // Focus the authorized field, select its value, confirm it still holds focus, then insert text as trusted input.
    async type(index, text) {
      await syncStill();
      await tab.authorize?.({ verb: 'type', index });
      await c.send('DOM.focus', { backendNodeId: byIndex[index] });
      const stillHere = await callObject(await objectOf(index), 'function () { this.select?.(); return document.activeElement === this; }');
      if (!stillHere) throw new Error(`focus moved away from element ${index} when it was focused; nothing was typed`);
      tab.lastCheck();
      await c.send('Input.insertText', { text });
      tab.inputs.add('trusted');
      return settle(600); // search boxes debounce before they fetch
    },

    // A screenshot needs a rendered tab, so this brings the Dex window forward and restores animations.
    async screenshot(path) {
      if (!(await visible())) {
        await c.send('Page.bringToFront');
        for (const deadline = performance.now() + 3000; !(await visible()) && performance.now() < deadline;) await sleep(100);
        if (!(await visible())) throw new Error('the tab stays hidden behind another window, so there is nothing to capture; ask Tyler to uncover the Dex window');
      }
      await evaluate(UNSTILL);
      const { data } = await c.send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(path, Buffer.from(data, 'base64'));
    },
  };

  try {
    for (const d of ['Page', 'DOM', 'Runtime', 'Accessibility', 'Network']) await c.send(`${d}.enable`);
    await syncStill();
  } catch (error) {
    c.close();
    throw error;
  }
  tab.animationsOff = false; // report only the suppression an action in this attachment relied on
  return tab;
}
