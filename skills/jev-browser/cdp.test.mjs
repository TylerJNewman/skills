import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { endpoint } from './cdp.mjs';

const DEX = '/Users/tyler/.oracle/browser-profile';
const listen = () => new Promise((ok) => { const s = createServer((_req, res) => res.end('{}')).listen(0, '127.0.0.1', () => ok(s)); });
const deadPort = async () => { const s = await listen(); const { port } = s.address(); await new Promise((ok) => s.close(ok)); return port; };
const portFile = (port) => {
  const file = join(mkdtempSync(join(tmpdir(), 'jb-port-')), 'DevToolsActivePort');
  writeFileSync(file, `${port}\n/devtools/browser/stale\n`);
  return file;
};
const chromes = (...launches) => () => launches.map(([dir, port]) =>
  `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome --remote-debugging-port=${port} --user-data-dir=${dir} --no-first-run`).join('\n');

test('a stale DevToolsActivePort falls back to the running Dex Chrome port', async () => {
  const live = await listen();
  try {
    const { port } = live.address();
    assert.equal(await endpoint({ portFile: portFile(await deadPort()), processes: chromes([DEX, port]) }), `http://127.0.0.1:${port}`);
  } finally { live.close(); }
});

test('with no live Dex port the error names both ports and ignores other profiles', async () => {
  const other = await listen();
  try {
    const [recorded, launched] = [await deadPort(), await deadPort()];
    const processes = chromes([`${DEX}-other`, other.address().port], [DEX, launched]);
    await assert.rejects(endpoint({ portFile: portFile(recorded), processes }), new RegExp(`neither port: .* names port ${recorded}, and the Chrome .* has --remote-debugging-port=${launched}$`));
  } finally { other.close(); }
});
