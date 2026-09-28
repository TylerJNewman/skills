// Minimal Chrome DevTools Protocol client over Node's built-in WebSocket, pointed at the Dex Chrome.
import { readFileSync } from 'node:fs';

const DEADLINE_MS = 15000;

export function endpoint() {
  const port = readFileSync('/Users/tyler/.oracle/browser-profile/DevToolsActivePort', 'utf8').split('\n')[0];
  return `http://127.0.0.1:${port}`;
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
  const { webSocketDebuggerUrl } = await (await fetch(`${endpoint()}/json/version`, { signal: AbortSignal.timeout(DEADLINE_MS) })).json();
  const c = await connect(webSocketDebuggerUrl);
  c.instance = webSocketDebuggerUrl.split('/').pop();
  return c;
}
