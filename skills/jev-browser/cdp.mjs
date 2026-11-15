// Minimal Chrome DevTools Protocol client over Node's built-in WebSocket, pointed at the Dex Chrome.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const DEADLINE_MS = 15000;
const PROBE_MS = 3000;
const DEX = '/Users/tyler/.oracle/browser-profile';

const answers = (port) => fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(PROBE_MS) }).then((r) => r.ok, () => false);
const asPort = (text) => (/^[1-9]\d{0,4}$/.test(text ?? '') ? text : '');
const listProcesses = () => execFileSync('/bin/ps', ['-axww', '-o', 'args='], { encoding: 'utf8' });

function recordedPort(portFile) {
  try { return asPort(readFileSync(portFile, 'utf8').split('\n')[0].trim()); } catch { return ''; }
}

const launchedPort = (processes) => processes().split('\n')
  .filter((args) => ` ${args.trim()} `.includes(` --user-data-dir=${DEX} `))
  .map((args) => asPort(args.match(/ --remote-debugging-port=(\d+)(?= |$)/)?.[1]))
  .find(Boolean) ?? '';

export async function endpoint({ portFile = `${DEX}/DevToolsActivePort`, processes = listProcesses } = {}) {
  const recorded = recordedPort(portFile);
  if (recorded && await answers(recorded)) return `http://127.0.0.1:${recorded}`;
  const launched = launchedPort(processes);
  if (launched && launched !== recorded && await answers(launched)) return `http://127.0.0.1:${launched}`;
  const fileSays = `${portFile} names ${recorded ? `port ${recorded}` : 'no port'}`;
  const chromeSays = launched
    ? `the Chrome running with --user-data-dir=${DEX} has --remote-debugging-port=${launched}`
    : `no Chrome running with --user-data-dir=${DEX} has a --remote-debugging-port`;
  throw new Error(`Dex Chrome DevTools answers on neither port: ${fileSays}, and ${chromeSays}`);
}

// Every command settles: with its result, the protocol error, a closed socket, or the deadline.
export async function connect(wsUrl, { socket = new WebSocket(wsUrl) } = {}) {
  await new Promise((ok, fail) => {
    const give = (error) => { clearTimeout(timer); fail(error); };
    const timer = setTimeout(() => { give(new Error(`${wsUrl} did not open in ${DEADLINE_MS / 1000} s`)); socket.close(); }, DEADLINE_MS);
    socket.onopen = () => { clearTimeout(timer); ok(); };
    socket.onerror = () => give(new Error(`cannot reach ${wsUrl}`));
    socket.onclose = () => give(new Error(`${wsUrl} closed before it opened`));
  });
  let id = 0;
  const pending = new Map();
  const listeners = new Set();
  const failAll = (reason) => {
    for (const { fail } of pending.values()) fail(new Error(reason));
    pending.clear();
  };
  socket.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.id && pending.has(msg.id)) {
      const { ok, fail } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? fail(new Error(msg.error.message)) : ok(msg.result);
    } else for (const fn of listeners) fn(msg);
  };
  socket.onclose = () => failAll('browser connection closed');
  socket.onerror = () => failAll('browser connection failed');
  return {
    send(method, params = {}) {
      return new Promise((ok, fail) => {
        const n = ++id;
        const timer = setTimeout(() => { pending.delete(n); fail(new Error(`${method} got no answer in ${DEADLINE_MS / 1000} s`)); }, DEADLINE_MS);
        pending.set(n, { ok: (v) => { clearTimeout(timer); ok(v); }, fail: (e) => { clearTimeout(timer); fail(e); } });
        socket.send(JSON.stringify({ id: n, method, params }));
      });
    },
    on: (fn) => listeners.add(fn),
    close: () => socket.close(),
  };
}

// The browser-level connection, labeled with the running Chrome's instance id (it changes on restart).
export async function browser() {
  const { webSocketDebuggerUrl } = await (await fetch(`${await endpoint()}/json/version`, { signal: AbortSignal.timeout(DEADLINE_MS) })).json();
  const c = await connect(webSocketDebuggerUrl);
  c.instance = webSocketDebuggerUrl.split('/').pop();
  return c;
}
