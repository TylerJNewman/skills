#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const MAGICK_BIN = existsSync('/opt/homebrew/bin/magick') ? '/opt/homebrew/bin/magick' : 'magick';

const sha256File = (filePath) => createHash('sha256').update(readFileSync(filePath)).digest('hex');

export function evaluateAntiSkyboxStopRules({
  detectorRegressions = 0,
  axisScores = {},
  consecutiveP3OnlyRounds = 0,
  consecutiveNearTieOrPlateauRounds = 0,
  regressedExistingStateProb = 0,
}) {
  if (detectorRegressions > 0) {
    return { action: 'REJECT', reason: 'DETERMINISTIC_DETECTOR_REGRESSION' };
  }
  if (regressedExistingStateProb >= 0.7) {
    return { action: 'ROLLBACK', reason: 'REGRESSED_EXISTING_STATE' };
  }
  const coreAxes = ['P0_functional_readout', 'P1_layout_hierarchy', 'P1_component_fidelity'];
  const coreReady = coreAxes.every((axis) => (axisScores[axis] ?? 0) >= 0.8);
  const effectiveWeights = {
    P0_functional_readout: 0.4,
    P1_layout_hierarchy: 0.25,
    P1_component_fidelity: 0.2,
    P2_surface_tokens: 0.1,
    P3_ambient_polish: coreReady ? 0.05 : 0,
  };
  if (consecutiveP3OnlyRounds > 2) {
    return { action: 'STOP', reason: 'SKYBOX_TRAP_STOP', effectiveWeights };
  }
  if (consecutiveNearTieOrPlateauRounds >= 2) {
    return { action: 'STOP', reason: 'PLATEAU_REACHED', effectiveWeights };
  }
  const weightedScore = Object.entries(effectiveWeights).reduce(
    (sum, [axis, weight]) => sum + (axisScores[axis] ?? 0) * weight,
    0,
  );
  if (coreReady && weightedScore >= 0.85) {
    return { action: 'STOP', reason: 'TARGET_MET', weightedScore, effectiveWeights };
  }
  const failingAxis = coreAxes.find((axis) => (axisScores[axis] ?? 0) < 0.8) ?? 'P2_surface_tokens';
  return { action: 'CONTINUE', nextFocusAxis: failingAxis, weightedScore, effectiveWeights };
}

export function buildComparisonGrid({ states, refDir, prevDir, nowDir, outPath, prevLabel = 'prev', tileGeometry = '480x270+6+6' }) {
  const workDir = mkdtempSync(join(tmpdir(), 'visual-grid-'));
  try {
    const tiles = [];
    const stateReceipts = [];
    for (const state of states) {
      const id = typeof state === 'string' ? state : state.id;
      const refPath = resolve(refDir, `${id}.png`);
      const prevPath = resolve(prevDir, `${id}.png`);
      const nowPath = resolve(nowDir, `${id}.png`);
      assert(existsSync(refPath), `Missing reference image: ${refPath}`);
      assert(existsSync(prevPath), `Missing previous image: ${prevPath}`);
      assert(existsSync(nowPath), `Missing candidate image: ${nowPath}`);

      const prevSha = sha256File(prevPath);
      const nowSha = sha256File(nowPath);
      const unchanged = prevSha === nowSha;
      stateReceipts.push({ id, prevSha, nowSha, unchanged });

      const columns = [
        { tag: `Reference: ${id}`, src: refPath, slug: `${id}_0_ref.png` },
        { tag: `${prevLabel}: ${id}`, src: prevPath, slug: `${id}_1_prev.png` },
        { tag: `now: ${id}`, src: nowPath, slug: `${id}_2_now.png` },
      ];
      for (const col of columns) {
        const dest = join(workDir, col.slug);
        execFileSync(MAGICK_BIN, [
          col.src,
          '-resize', '480x270!',
          '-font', '/System/Library/Fonts/Menlo.ttc',
          '-gravity', 'NorthWest',
          '-fill', 'white',
          '-undercolor', '#000000B0',
          '-pointsize', '14',
          '-annotate', '+8+8', col.tag,
          dest,
        ]);
        tiles.push(dest);
      }
    }
    mkdirSync(resolve(outPath, '..'), { recursive: true });
    execFileSync(MAGICK_BIN, [
      'montage',
      '-font', '/System/Library/Fonts/Menlo.ttc',
      ...tiles,
      '-tile', `3x${states.length}`,
      '-geometry', tileGeometry,
      '-background', '#111111',
      resolve(outPath),
    ]);
    return {
      outPath: resolve(outPath),
      states: stateReceipts,
      allUnchanged: stateReceipts.every((s) => s.unchanged),
    };
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

function runSelfTest() {
  const dir = mkdtempSync(join(tmpdir(), 'visual-grid-test-'));
  try {
    const refDir = join(dir, 'ref');
    const prevDir = join(dir, 'prev');
    const nowDir = join(dir, 'now');
    mkdirSync(refDir);
    mkdirSync(prevDir);
    mkdirSync(nowDir);

    for (const [id, refColor, prevColor, nowColor] of [
      ['P16_shadeWall', '#223344', '#223344', '#223344'],
      ['P17_sun', '#556677', '#334455', '#445566'],
    ]) {
      execFileSync(MAGICK_BIN, ['-size', '320x180', `xc:${refColor}`, join(refDir, `${id}.png`)]);
      execFileSync(MAGICK_BIN, ['-size', '320x180', `xc:${prevColor}`, join(prevDir, `${id}.png`)]);
      if (prevColor === nowColor) {
        writeFileSync(join(nowDir, `${id}.png`), readFileSync(join(prevDir, `${id}.png`)));
      } else {
        execFileSync(MAGICK_BIN, ['-size', '320x180', `xc:${nowColor}`, join(nowDir, `${id}.png`)]);
      }
    }

    const outPath = join(dir, 'pairs_c.jpg');
    const receipt = buildComparisonGrid({
      states: ['P16_shadeWall', 'P17_sun'],
      refDir,
      prevDir,
      nowDir,
      outPath,
      prevLabel: '868a533',
    });
    assert(existsSync(outPath) && statSync(outPath).size > 0, 'Expected non-empty montage image');
    assert.equal(receipt.states[0].unchanged, true);
    assert.equal(receipt.states[1].unchanged, false);
    assert.equal(receipt.allUnchanged, false);

    const skyboxVerdict = evaluateAntiSkyboxStopRules({
      axisScores: { P0_functional_readout: 0.7, P1_layout_hierarchy: 0.85, P1_component_fidelity: 0.85, P3_ambient_polish: 0.99 },
      consecutiveP3OnlyRounds: 3,
    });
    assert.equal(skyboxVerdict.action, 'STOP');
    assert.equal(skyboxVerdict.reason, 'SKYBOX_TRAP_STOP');
    assert.equal(skyboxVerdict.effectiveWeights.P3_ambient_polish, 0);

    const plateauVerdict = evaluateAntiSkyboxStopRules({
      axisScores: { P0_functional_readout: 0.85, P1_layout_hierarchy: 0.85, P1_component_fidelity: 0.85 },
      consecutiveNearTieOrPlateauRounds: 2,
    });
    assert.equal(plateauVerdict.action, 'STOP');
    assert.equal(plateauVerdict.reason, 'PLATEAU_REACHED');

    console.log('PASS: 3-way visual grid montage, 0%-diff detection, and Anti-Skybox stop rules');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (process.argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1])) {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      states: { type: 'string' },
      'ref-dir': { type: 'string' },
      'prev-dir': { type: 'string' },
      'now-dir': { type: 'string' },
      out: { type: 'string' },
      'prev-label': { type: 'string' },
      'self-test': { type: 'boolean' },
    },
  });
  if (values['self-test']) {
    runSelfTest();
  } else {
    assert(values.states && values['ref-dir'] && values['prev-dir'] && values['now-dir'] && values.out, 'Required: --states, --ref-dir, --prev-dir, --now-dir, --out');
    const statesData = JSON.parse(readFileSync(resolve(values.states), 'utf8'));
    const result = buildComparisonGrid({
      states: Array.isArray(statesData) ? statesData : statesData.states,
      refDir: values['ref-dir'],
      prevDir: values['prev-dir'],
      nowDir: values['now-dir'],
      outPath: values.out,
      prevLabel: values['prev-label'] ?? 'prev',
    });
    console.log(JSON.stringify(result, null, 2));
  }
}
