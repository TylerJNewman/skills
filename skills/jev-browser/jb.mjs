#!/usr/bin/env node
// jb: drive Chrome tabs in the Dex Work profile, by hand or on Jev autopilot.
import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as bridge from './bridge.mjs';
import { attachTab, browserInstance, closeTarget, openedBy, openInDexWork, POPUP, targetInfo, within } from './tab.mjs';

const USAGE = `jb: drive Chrome tabs in the Dex Work profile, by hand or on Jev autopilot.

  jb open <url>                    open a Dex Work tab; prints its id, sign-in, and the page's controls
  jb <tab> go <url>                load a URL in the tab
  jb <tab> snap [--text] [regex]   print the controls (--text adds page text; regex keeps matching lines)
  jb <tab> click "<name>" ...      click each named control in order; each waits up to 10 s to appear
  jb <tab> type "<name>" "<text>"  replace the text in the one field with this exact name ("" = the focused field)
  jb <tab> press <key>             Enter, Escape, Tab, Shift+Tab, arrows, PageUp, PageDown, Home, End
  jb <tab> jev "<goal>" [--allow "<regex>"] [--steps N]
                                   Jev autopilot toward one observable goal, on an approved origin
  jb <tab> shot [file.png]         screenshot the viewport and print its path (brings the Dex window forward)
  jb <tab> close                   close the tab

  --yes   after click, type, or press: Tyler approved this consequential action in chat.
          On quantum.loan it unlocks chat input only; identity and target checks still apply.

<tab> is the id jb printed, or any unique prefix. jb drives only tabs it opened and tabs those opened.
Autopilot runs only on origins listed in ~/.config/jev-browser/origins (one per line), because
it sends the page's text to TypeSafe through Vercel AI Gateway. It reads AI_GATEWAY_API_KEY from
JEV_ENV_FILE (default: the muse-birds .env.local, per the /jev skill).`;

const HOME = join(homedir(), '.cache', 'jev-browser');
const OWNED = join(HOME, 'tabs'); // one file per tab jb owns: <targetId>.json
const ORIGINS = join(homedir(), '.config', 'jev-browser', 'origins');
const JEV = { envFile: process.env.JEV_ENV_FILE ?? '/Users/tyler/code/muse-birds/.env.local' };
const QUANTUM = 'https://quantum.loan';
const ACCOUNT = 'tnewman@quantafinance.com';
const SHELL = '[data-sidebar]'; // Quantum's app-shell sidebar parts (at least its trigger); absent on its sign-in page
const SEARCH_DIALOG = 'Search Quantum';
const SEARCH_BUTTON = /^Search\b.*⌘ ?K$/; // its label changes between releases ("Search everything... ⌘ K", "Search... ⌘ K")
// Buttons on quantum.loan reviewed as navigation only: they open the sidebar, its menus, or the loan's section list.
const QUANTUM_OPENERS = new Set(['Toggle Sidebar', 'Loan sections', 'Leads', 'Loans', 'Borrowers', 'Accounting', 'More', 'Admin', 'Developer', 'Open chat']);
const CHAT_INPUTS = new Set(['Attach file', 'Send message', 'Queue after answer', 'Stop generation']);
// Consequential by name. Autopilot never clicks these; elsewhere a hand-flown one needs --yes.
export const CONSEQUENTIAL = /\b(delete|remove|archive|submit|send|save|publish|pay|purchase|buy|checkout|sign|approve|fund|transfer|upload|import|export|download|disconnect|log ?out|change|sync|generate|create|edit|invite|share|reply|forward|accept|confirm|enable|disable)\b/i;
// Snapshot role names of controls that hold a setting; autopilot never clicks them.
export const TOGGLES = ['switch', 'check box', 'radio button', 'toggle button', 'menuitemcheckbox', 'menuitemradio'];
// Every clickable role bridge.mjs knows except tab and link: on quantum.loan autopilot may only navigate.
const NOT_NAVIGATION = ['button', 'checkBox', 'checkbox', 'check box', 'radio button', 'radioButton', 'menu item', 'menuItem', 'switch', 'toggle button', 'togglebutton', 'menu button'];
const SAFE_KEYS = new Set(['Tab', 'Shift+Tab', 'Escape']); // move focus or close; never submit or change a value
const ACTIVATABLE = new Set(['link', 'button', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'tab', 'treeitem', 'checkbox', 'radio', 'switch']);
const NOT_CLICKABLE = new Set(['text', 'heading', 'dialog', 'alertdialog', 'alert', 'status']);
const TYPEABLE = new Set(['text field', 'combo box']);
const MAX_MS = 45000; // one autopilot run

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const originOf = (url) => { try { return new URL(url).origin; } catch { return ''; } };
const bare = (line) => line.replace(/^\d+ /, '');
const nameOf = (entry) => entry.name.replace(/, Value:.*$/, '');
const short = (id) => id.slice(0, 8);

function view(state, { text = false, filter } = {}) {
  const [head, ...lines] = state.split('\n');
  return [head, ...lines.filter((l) => (text || !/^\d+ text /.test(l)) && (!filter || filter.test(l)))].join('\n');
}

// What an action changed, index numbers ignored: removed lines (-) and added lines (+).
function diff(before, after, url) {
  const a = before.split('\n').slice(1).map(bare);
  const b = after.split('\n').slice(1).map(bare);
  const A = new Set(a);
  const B = new Set(b);
  const side = (lines, sign) => [...lines.slice(0, 20).map((l) => `${sign} ${l}`), ...(lines.length > 20 ? [`${sign} …${lines.length - 20} more`] : [])];
  const changes = [...side(a.filter((l) => !B.has(l)), '-'), ...side(b.filter((l) => !A.has(l)), '+')];
  return [`url ${url}`, ...(changes.length ? changes : ['(no visible change)'])].join('\n');
}

const TOGGLE_ROLES = new Set(['switch', 'checkbox', 'radio', 'menuitemcheckbox', 'menuitemradio', 'toggleButton']);
const isToggle = (m) => TOGGLE_ROLES.has(m.role) || (m.role === 'button' && 'pressed' in m.props);
const isDisabled = (m) => m.props.disabled === true || m.props.disabled === 'true';

/**
 * The execution check behind every click, type, and key press, hand-flown or Jev's. It decides on facts
 * read at dispatch time: `meta` for the target, `focused` for keys, each with Chrome's role, name, and
 * properties, its dialog's name, and its search relationship (searchInput, inResults, resultSelected).
 * Returns null, or { reason, hard }: a hard refusal cannot be overridden; a soft one needs Tyler's --yes.
 * Quantum permits navigation/search and explicitly approved chat-composer input.
 */
export function verdictFor({ verb, meta, key, focused, quantum }) {
  const hard = (reason) => ({ reason, hard: true });
  const soft = (reason) => ({ reason, hard: false });
  const said = (m) => `"${m.name || '(no name)'}"`;
  if (verb === 'click' || verb === 'type') {
    if (isDisabled(meta)) return hard(`${said(meta)} is disabled`);
    if (verb === 'click' && !meta.name) return hard('an unnamed control cannot be clicked by name; click a named one');
  }
  if (quantum) {
    if (meta?.chatComposer && ((verb === 'type' && meta.name === 'Message composer') ||
      (verb === 'click' && meta.role === 'button' && CHAT_INPUTS.has(meta.name))))
      return soft('Quantum chat input needs task authorization');
    if (verb === 'click') {
      if (isToggle(meta) || CONSEQUENTIAL.test(meta.name)) return hard(`unsupported quantum.loan action: ${meta.role} ${said(meta)} could change data`);
      if (meta.role === 'tab' || meta.role === 'link') return null;
      if (meta.role === 'button' && (QUANTUM_OPENERS.has(meta.name) || SEARCH_BUTTON.test(meta.name))) return null;
      if (meta.dialog === SEARCH_DIALOG && ((meta.role === 'option' && meta.inResults) || (meta.role === 'button' && meta.name === 'Close'))) return null;
      return hard(`unsupported quantum.loan action: jb clicks only tabs, links, reviewed menu openers, the search palette, and chat input controls, not ${meta.role} ${said(meta)}`);
    }
    if (verb === 'type') return meta.dialog === SEARCH_DIALOG && meta.searchInput ? null : hard('unsupported quantum.loan action: jb types only into the search palette\'s own input or the chat composer');
    if (SAFE_KEYS.has(key)) return null;
    if (focused?.chatComposer && focused.name === 'Message composer') return soft('Quantum chat input needs task authorization');
    if (!(focused?.dialog === SEARCH_DIALOG && focused.searchInput)) return hard(`unsupported quantum.loan action: ${key} goes only to the search palette's own input or the chat composer`);
    return key === 'Enter' && !focused.resultSelected ? hard('no search result is selected; snap and check it first') : null;
  }
  if (verb === 'click') {
    if (isToggle(meta)) return soft(`${said(meta)} is a ${meta.role}; flipping it changes a setting`);
    return CONSEQUENTIAL.test(meta.name) ? soft(`${said(meta)} sounds consequential`) : null;
  }
  if (verb === 'type' || SAFE_KEYS.has(key)) return null;
  if (!focused) return soft(`nothing is focused, so ${key} would go to the page`);
  if (key === 'Enter') {
    // Enter activates the focused control, so it gets exactly the verdict a click on it would.
    if (ACTIVATABLE.has(focused.role) || isToggle(focused)) return verdictFor({ verb: 'click', meta: focused, quantum: false });
    if (focused.role === 'searchbox') return null;
    return soft(`Enter in ${focused.role} ${said(focused)} can submit a form or pick a value`);
  }
  if (['slider', 'spinbutton', 'radio', 'combobox'].includes(focused.role) || isToggle(focused)) return soft(`${key} would change ${said(focused)}`);
  return null;
}

// On quantum.loan the live session must be Tyler's, inside the app shell, off the sign-in page.
async function identityProblem(tab, href) {
  if (originOf(href) !== QUANTUM) return null;
  if (new URL(href).pathname.startsWith('/api/auth')) return 'this is the Quantum sign-in page';
  const [email, shell] = await tab.evaluate(`Promise.all([fetch('/api/auth/session', { cache: 'no-store' }).then((r) => r.json()).then((j) => j?.user?.email ?? null).catch(() => null), !!document.querySelector(${JSON.stringify(SHELL)})])`);
  if (email !== ACCOUNT) return `the Quantum session is ${email ?? 'signed out'}, not ${ACCOUNT}`;
  return shell ? null : 'the Quantum app shell is missing';
}

async function reportIdentity(tab) {
  if (originOf(tab.url) !== QUANTUM) return;
  const problem = await identityProblem(tab, tab.url).catch((error) => `identity check failed: ${error.message}`);
  console.log(problem ? `NOT VERIFIED: ${problem}. jb will not act here; ask Tyler to sign in in this tab, then rerun` : `signed in as ${ACCOUNT}`);
}

/**
 * Before every input and before every snapshot goes to Jev, for the page at `href`: on quantum.loan the
 * session is Tyler's, inside the app shell, off the sign-in page; and every tab this one opened is owned,
 * so reported, and it has not asked for another. The queue is read after the awaited reads.
 */
async function preflight(tab, href) {
  const children = await tab.children();
  const problem = await identityProblem(tab, href);
  if (problem) throw new Error(`${problem}; jb will not act on quantum.loan or send it to Jev. Ask Tyler to sign in in this tab, then rerun`);
  if (tab.windowOpens.length || children.some((c) => !isOwned(c.targetId))) throw new Error(POPUP);
}

/**
 * Installs the execution check on a tab for one command; `approved` is this command's --yes. Right before
 * any input it runs the preflight, then decides on the target's facts read now, refusing if they no
 * longer match the snapshot. A scroll needs only the preflight.
 */
export function guard(tab, approved) {
  tab.authorize = async ({ verb, index, key }) => {
    const href = await tab.evaluate('location.href');
    await preflight(tab, href);
    if (verb === 'scroll') return;
    const quantum = originOf(href) === QUANTUM;
    let meta;
    let focused;
    if (verb === 'press') {
      focused = await tab.context('focused');
    } else {
      meta = await tab.context(index);
      const seen = tab.meta(index);
      if (!meta || meta.role !== seen.role || meta.name !== seen.name) throw new Error('the control changed since the snapshot, so nothing was done; snap again');
    }
    const verdict = verdictFor({ verb, meta, key, focused, quantum });
    if (verdict && (verdict.hard || !approved)) {
      throw new Error(`${verdict.reason}. Nothing was done${verdict.hard ? '' : '; ask Tyler, then rerun with --yes'}`);
    }
  };
}

// The one element with this exact name among roles that pass `fits`, waiting up to 10 s for it to render.
// An empty name means the focused element.
async function find(tab, name, fits) {
  for (const deadline = Date.now() + 10000; ;) {
    const state = await within(Math.max(deadline - Date.now(), 1000), tab.getAXState(), 'reading the page');
    const entries = bridge.parseState(state).filter((e) => fits(e.role));
    const hits = entries.filter((e) => (name === '' ? e.states.includes('focused') : nameOf(e) === name));
    if (hits.length === 1) return { state, entry: hits[0] };
    if (hits.length > 1) throw new Error(`${hits.length} elements named "${name}"; snap and pick a control with a unique name`);
    if (Date.now() > deadline) throw new Error(`nothing named "${name}" after 10 s; jb <tab> snap shows the names`);
    await sleep(250);
  }
}

// Ownership: one file per tab, created exclusively, so agents working in parallel never overwrite each other.
function own(targetId, record) {
  mkdirSync(OWNED, { recursive: true, mode: 0o700 });
  writeFileSync(join(OWNED, `${targetId}.json`), JSON.stringify({ ...record, at: new Date().toISOString() }), { mode: 0o600, flag: 'wx' });
}
const ownedIds = () => (existsSync(OWNED) ? readdirSync(OWNED).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)) : []);
const isOwned = (targetId) => existsSync(join(OWNED, `${targetId}.json`));
const recordOf = (targetId) => JSON.parse(readFileSync(join(OWNED, `${targetId}.json`), 'utf8'));
const disown = (targetId) => { try { unlinkSync(join(OWNED, `${targetId}.json`)); } catch {} };

async function resolveTab(prefix) {
  const ids = ownedIds().filter((id) => id.startsWith(prefix));
  if (ids.length !== 1) throw new Error(ids.length ? `tab prefix ${prefix} is ambiguous` : `no tab ${prefix} from jb; jb open <url> first`);
  const [id] = ids;
  const record = recordOf(id);
  if (record.browser !== (await browserInstance())) { disown(id); throw new Error(`Chrome restarted since tab ${prefix} was opened; jb open <url> for a new one`); }
  const info = await targetInfo(id);
  if (!info) { disown(id); throw new Error(`tab ${prefix} is gone (closed?); jb open <url> for a new one`); }
  if (info.browserContextId !== record.contextId) throw new Error(`tab ${prefix} is not in the Dex Work context it was opened in; refusing to drive it`);
  return { id, contextId: info.browserContextId, browser: record.browser };
}

// Closes a tab and gives up ownership only once Chrome confirms it is gone (it can linger for a moment).
async function closeOwned(id) {
  try { await closeTarget(id); } catch {}
  for (const deadline = Date.now() + 5000; Date.now() < deadline; await sleep(100)) {
    if (!(await within(deadline - Date.now(), targetInfo(id), 'checking the tab').catch(() => true))) { disown(id); return true; }
  }
  return false;
}

export function approvedOrigins() {
  if (!existsSync(ORIGINS)) return [];
  return readFileSync(ORIGINS, 'utf8').split('\n').map((l) => l.replace(/#.*/, '').trim()).filter(Boolean).map(originOf);
}

/**
 * Owns every tab the parent opened that jb does not own yet (window.open, target=_blank), whenever it
 * appeared, and prints each id before looking at it, so every new tab is owned even if inspecting it
 * fails. A tab that could not be owned stays unowned, so it stops the parent's next action again.
 * `requested` are URLs the page asked to open; their tabs can appear seconds later, so a request is
 * waited for (5 s).
 */
async function adoptChildren(parent, tab, requested = []) {
  const born = [];
  const elsewhere = new Set();
  const deadline = Date.now() + (requested.length ? 5000 : 0);
  do {
    for (const child of await within(Math.max(deadline - Date.now(), 1000), tab.children(), 'listing new tabs')) {
      if (isOwned(child.targetId) || elsewhere.has(child.targetId)) continue;
      if (child.browserContextId !== parent.contextId) {
        elsewhere.add(child.targetId);
        console.log(`(tab ${short(child.targetId)} opened outside the Dex Work context; left alone)`);
        continue;
      }
      own(child.targetId, { contextId: child.browserContextId, browser: parent.browser, openedBy: parent.id });
      born.push(child.targetId);
      console.log(`opened new tab ${short(child.targetId)}; it is yours to drive and close`);
    }
    if (born.length >= requested.length) break;
    await sleep(250);
  } while (Date.now() < deadline);
  if (requested.length) console.log(`(the page asked for ${requested.length} new tab${requested.length > 1 ? 's' : ''}; ${born.length} appeared)`);
  for (const id of born) {
    let child;
    try {
      child = await attachTab(id);
      const settled = await child.landed();
      await child.getAXState();
      console.log(`  tab ${short(id)} is at ${child.url}${settled ? '' : ' (still loading)'}`);
      await reportIdentity(child);
    } catch (error) {
      console.log(`  tab ${short(id)} could not be inspected: ${error.message}`);
    } finally {
      child?.close();
    }
  }
  return born;
}

const NEXT = {
  needs_verification: 'autopilot claims this goal is reached: land it with a fresh snap before anything else',
  low_confidence: 'disengaged: inspect the state below and replan; there may be no single right click',
  blocked: 'disengaged: inspect the state below and replan; there may be no single right click',
  no_progress: 'disengaged: its last click changed nothing; inspect the state below and replan',
  loading_timeout: 'the page was still changing after the last action: snap again, then replan',
  decision_error: 'the Jev request failed (key, quota, or network): fix that cause; clicking will not help',
  action_error: 'the last action may have happened: check its effect in the state below before repeating anything',
  step_limit: 'out of steps: review progress before starting another run',
  budget: 'out of time: review progress before starting another run',
  stopped: 'jb stopped the run for the reason on the error line, before sending Jev the page: inspect the state below and replan',
};

function describe(h) {
  const p = h.confidence == null ? '' : ` (${h.confidence.toFixed(2)})`;
  if (h.executed) return `${h.action}${p}`;
  if (h.reason === 'stale_state' || h.reason === 'wait') return `discarded ${h.action}${p}`;
  if (h.reason === 'action_error') return `uncertain ${h.action}${p}`;
  if (h.reason) return 'failed request';
  return h.choice === 'DONE' || h.choice === 'BLOCKED' ? `${h.choice}${p}` : `proposed ${h.action}${p}`;
}

async function fresh(tab) {
  try { return view(await tab.getAXState()); } catch (error) { return `(the page could not be read: ${error.message})`; }
}

/**
 * The view of the tab Jev drives, for one run that must end by `deadline` (performance.now()): each
 * snapshot is read and preflighted within the run's time, or not released at all; and after the
 * deadline no input starts and no request goes to Jev (bridge.mjs calls the tab's lastCheck).
 */
export function pilotOf(tab, deadline) {
  tab.deadline = deadline;
  const release = async (args) => {
    const state = await tab.getAXState(...args);
    await preflight(tab, tab.url);
    return state;
  };
  return Object.create(tab, {
    getAXState: { value: (...args) => within(deadline - performance.now(), release(args), 'reading and checking the page in the run\'s remaining time') },
  });
}

async function autopilot(tab, goal, { allow, steps }) {
  await tab.getAXState();
  const origin = originOf(tab.url);
  if (!approvedOrigins().includes(origin)) {
    throw new Error(`autopilot is off for ${origin}: it would send this page's text to TypeSafe through Vercel. Hand-fly it, or ask Tyler to add the origin to ${ORIGINS}`);
  }
  const policy = {
    click: true, scrollDirections: ['down', 'up'], denyStates: ['disabled'],
    denyRoles: origin === QUANTUM ? NOT_NAVIGATION : TOGGLES,
    denyNames: [CONSEQUENTIAL, /^\(no name\)/], ...(allow ? { allowNames: [new RegExp(allow)] } : {}),
  };
  let out;
  try {
    // Each run is fresh and stays on the origin it started on; after hand-flying, a new run takes over.
    out = await bridge.run(pilotOf(tab, performance.now() + MAX_MS), { ...JEV, goal, policy, allowedOrigins: [origin], maxSteps: Number(steps ?? 12), maxMs: MAX_MS, minConfidence: 0.55 });
  } catch (error) {
    console.log(`jev stopped: ${error.message}`);
    console.log('next: nothing more was sent to Jev; inspect the state below and replan');
    console.log(await fresh(tab));
    return;
  }
  console.log(`jev ${out.status} in ${(out.elapsedMs / 1000).toFixed(1)}s: ${out.history.map(describe).join(' > ')}`);
  if (out.error) console.log(`error ${out.error}`);
  console.log(`next: ${NEXT[out.status]}`);
  console.log(out.status === 'needs_verification' ? `url ${tab.url}` : await fresh(tab));
}

// In a hidden tab Chrome can drop or delay key presses and blocks new tabs, so a silent result there says so.
function hiddenAndInert(tab, changes) {
  if ((tab.inputs.has('page-dispatched') || tab.animationsOff) && changes.endsWith('(no visible change)')) {
    console.log('(nothing visibly changed in this hidden tab; Chrome can drop key presses and block new tabs there. `jb <tab> shot` brings the Dex window forward; then retry)');
  }
}

function note(tab, settled) {
  const facts = [];
  if (tab.inputs.has('page-dispatched')) facts.push('pointer input was page-dispatched');
  if (tab.animationsOff) facts.push('animations were off');
  if (facts.length) console.log(`(hidden tab: ${facts.join('; ')}; this is navigation evidence only, so check interaction or visual behavior with the window visible)`);
  if (settled === false) console.log('(page still changing after 5 s: snap again before relying on this)');
}

async function main([first, verb, ...rest]) {
  if (!first || first === '--help' || first === '-h') return console.log(USAGE);
  mkdirSync(HOME, { recursive: true, mode: 0o700 });

  if (first === 'open') {
    if (!/^https?:\/\//.test(verb ?? '')) throw new Error('usage: jb open <url>');
    const { targetId, contextId, browser } = await openInDexWork();
    let tab;
    try {
      own(targetId, { contextId, browser, url: verb });
      console.log(`tab ${short(targetId)}`);
      tab = await attachTab(targetId);
      const settled = await tab.navigate(verb);
      await tab.getAXState();
      await reportIdentity(tab);
      note(tab, settled);
      console.log(view(await tab.getAXState()));
    } catch (error) {
      // A tab that never became usable is closed rather than left behind, and stays owned if it will not close.
      tab?.close();
      tab = undefined;
      const closed = await closeOwned(targetId).catch(() => false);
      throw new Error(`${error.message} (${closed ? `tab ${short(targetId)} was closed` : `tab ${short(targetId)} could not be closed and stays yours: jb ${short(targetId)} close`})`);
    } finally {
      tab?.close();
    }
    return;
  }

  const parent = await resolveTab(first);
  const { id } = parent;

  if (verb === 'close') {
    // Children are registered without being opened or inspected, so a broken child never blocks the close.
    for (const child of await openedBy(id)) {
      if (isOwned(child.targetId) || child.browserContextId !== parent.contextId) continue;
      own(child.targetId, { contextId: child.browserContextId, browser: parent.browser, openedBy: id });
      console.log(`tab ${short(id)} had opened tab ${short(child.targetId)}; it is yours to close: jb ${short(child.targetId)} close`);
    }
    if (!(await closeOwned(id))) throw new Error(`tab ${short(id)} did not close; it stays yours`);
    console.log(`closed ${short(id)}`);
    return;
  }

  const tab = await attachTab(id);
  try {
    if (verb === 'go') {
      const settled = await tab.navigate(rest[0]);
      await tab.getAXState();
      await reportIdentity(tab);
      note(tab, settled);
      console.log(view(await tab.getAXState()));
    } else if (verb === 'snap') {
      const text = rest.includes('--text');
      const pattern = rest.find((a) => a !== '--text');
      console.log(view(await tab.getAXState(), { text, filter: pattern && new RegExp(pattern, 'i') }));
    } else if (verb === 'click') {
      guard(tab, rest.includes('--yes'));
      const names = rest.filter((a) => a !== '--yes');
      if (!names.length) throw new Error('usage: jb <tab> click "<name>" ["<next name>" ...] [--yes]');
      let first;
      for (const [i, name] of names.entries()) {
        const { state, entry } = await find(tab, name, (role) => !NOT_CLICKABLE.has(role));
        first ??= state;
        const settled = await tab.click(entry.index);
        const left = names.length - 1 - i;
        if (settled === false) throw new Error(`"${name}" was clicked, but the page was still changing after 5 s; snap before continuing${left ? ' (the rest of the chain was not clicked)' : ''}`);
        const requested = tab.windowOpens.splice(0);
        const born = await adoptChildren(parent, tab, requested);
        if ((requested.length || born.length) && left) {
          console.log(`"${name}" asked for a new tab, so the rest of the chain was not clicked`);
          break;
        }
      }
      note(tab);
      console.log(diff(first, await tab.getAXState(), tab.url));
    } else if (verb === 'type') {
      const [name, text, ...flags] = rest;
      if (name === undefined || text === undefined) throw new Error('usage: jb <tab> type "<name>" "<text>" [--yes] (pass "" as the text to clear the field)');
      guard(tab, flags.includes('--yes'));
      const { state, entry } = await find(tab, name, (role) => TYPEABLE.has(role));
      const settled = await tab.type(entry.index, text);
      note(tab, settled);
      console.log(diff(state, await tab.getAXState(), tab.url));
    } else if (verb === 'press') {
      const [key, ...flags] = rest;
      guard(tab, flags.includes('--yes'));
      const state = await tab.getAXState();
      const settled = await tab.pressKey(null, key);
      note(tab, settled);
      const changes = diff(state, await tab.getAXState(), tab.url);
      console.log(changes);
      if (!tab.windowOpens.length) hiddenAndInert(tab, changes);
    } else if (verb === 'jev') {
      guard(tab, false);
      const flag = (name) => { const i = rest.indexOf(name); return i > 0 ? rest[i + 1] : undefined; };
      await autopilot(tab, rest[0], { allow: flag('--allow'), steps: flag('--steps') });
      note(tab);
    } else if (verb === 'shot') {
      const path = rest[0] ?? join(HOME, `${short(id)}-${Date.now()}.png`);
      await tab.screenshot(path);
      console.log(`saved ${path}`);
    } else {
      throw new Error(`unknown verb ${verb ?? ''}\n\n${USAGE}`);
    }
  } finally {
    // Whatever happened, any tab this command caused is owned and reported, never left behind silently.
    if (['click', 'type', 'press', 'jev'].includes(verb)) {
      await adoptChildren(parent, tab, tab.windowOpens.splice(0)).catch((error) => console.log(`(could not check for new tabs: ${error.message})`));
    }
    tab.close();
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(`jb: ${error.message}`);
    process.exitCode = 1;
  });
}
