import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { guard } from './jb.mjs';
import { attachTab } from './tab.mjs';

test('PDF selection uses the authorized chat input and refuses mismatches before dispatch', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'jb-attach-'));
  const pdf = join(directory, 'synthetic.pdf');
  writeFileSync(pdf, '%PDF-1.4\n%%EOF');
  try {
    for (const options of [
      {}, { approved: false }, { email: 'wrong@example.com' }, { disabled: true },
      { origin: 'https://example.com' }, { inputCount: 2 }, { accept: '.txt' }, { popup: true },
    ]) {
      const origin = options.origin ?? 'https://quantum.loan';
      const url = `${origin}/chat/new`;
      const writes = [];
      const input = { accept: options.accept ?? '.pdf', closest: () => null };
      const composer = { querySelectorAll: () => Array(options.inputCount ?? 1).fill(input) };
      const button = {
        disabled: options.disabled ?? false,
        getAttribute: () => 'Attach file',
        closest: selector => selector === '[data-chat-composer-dropzone="true"]' ? composer : null,
      };
      const connection = {
        on() {}, close() {},
        async send(method, params = {}) {
          if (method === 'Page.getFrameTree') return { frameTree: { frame: { loaderId: 'fixture', url } } };
          if (method === 'Accessibility.getFullAXTree') return { nodes: [{ nodeId: '1', backendDOMNodeId: 1, role: { value: 'button' }, name: { value: 'Attach file' } }] };
          if (method === 'DOM.resolveNode') return { object: { objectId: 'button' } };
          if (method === 'Runtime.evaluate') {
            const expression = params.expression;
            const value = expression === 'document.visibilityState' ? 'visible'
              : expression === 'location.href' ? url
              : expression === '[document.title, location.href]' ? ['Fixture', url]
              : expression.startsWith('Promise.all') ? [options.email ?? 'tnewman@quantafinance.com', true] : 'stable';
            return { result: { value } };
          }
          if (method === 'Runtime.callFunctionOn') {
            try {
              assert.equal(runInNewContext(`(${params.functionDeclaration})`, { location: { origin } }).call(button), input);
              return { result: { objectId: 'input' } };
            } catch (error) { return { result: {}, exceptionDetails: { exception: { description: error.message } } }; }
          }
          if (method === 'DOM.setFileInputFiles') writes.push(params);
          return {};
        },
      };
      const tab = await attachTab('fixture', { connection });
      await tab.getAXState();
      const meta = { role: 'button', name: 'Attach file', chatComposer: true, props: { disabled: button.disabled } };
      tab.meta = () => meta;
      tab.context = async () => meta;
      tab.children = async () => [];
      if (options.popup) tab.windowOpens.push('https://example.com');
      guard(tab, options.approved ?? true);
      if (Object.keys(options).length) {
        await assert.rejects(tab.attachPdf(0, pdf));
        assert.equal(writes.length, 0);
      } else {
        assert.equal(await tab.attachPdf(0, pdf), true);
        assert.deepEqual(writes, [{ objectId: 'input', files: [pdf] }]);
        await assert.rejects(tab.attachPdf(0, 'relative.pdf'));
      }
      tab.close();
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
