import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('../public/workflow-background.js', import.meta.url), 'utf8');
// Test animation lifecycle without a browser or a graphics dependency.
function fixture(initialReduced = false) {
  const events = new Map(), frames = new Map();
  let id = 0;
  const listen = (key, fn) => events.set(key, fn);
  const drawing = new Proxy({}, { get: (_, key) => key === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {} });
  const canvas = { getContext: () => drawing };
  const layer = { querySelector: () => canvas, getBoundingClientRect: () => ({ width: 390, height: 844 }) };
  const button = { addEventListener: (_, fn) => listen('pause', fn), setAttribute() {} };
  const reduced = { matches: initialReduced, addEventListener: (_, fn) => listen('reduce', fn) };
  const document = {
    hidden: false, body: { classList: { toggle() {} } },
    documentElement: { addEventListener() {} },
    querySelector: s => s === '.automation-background' ? layer : button,
    createElement: () => ({ getContext: () => drawing }),
    addEventListener: listen,
  };
  runInNewContext(source, {
    document, devicePixelRatio: 3, performance: { now: () => 0 },
    matchMedia: q => q.includes('reduced') ? reduced : { matches: false },
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    window: { addEventListener: listen }, ResizeObserver: class { observe() {} },
    requestAnimationFrame: fn => { frames.set(++id, fn); return id; },
    cancelAnimationFrame: key => frames.delete(key),
  });
  return { document, reduced, canvas, frames, button, fire: (name, value) => events.get(name)?.(value) };
}
test('background stops when hidden and never creates parallel frame loops', () => {
  const f = fixture(); assert.equal(f.frames.size, 1);
  f.document.hidden = true; f.fire('visibilitychange'); assert.equal(f.frames.size, 0);
  f.fire('portfolio:workflow-step', { detail: { step: 2 } }); assert.equal(f.frames.size, 0);
  f.document.hidden = false; f.fire('visibilitychange'); f.fire('pageshow'); assert.equal(f.frames.size, 1);
  f.fire('pagehide'); assert.equal(f.frames.size, 0);
});
test('reduced motion blocks animation on load and when preferences change', () => {
  const f = fixture(true); assert.equal(f.frames.size, 0); assert.equal(f.button.disabled, true);
  f.fire('portfolio:workflow-step', { detail: { step: 0 } }); assert.equal(f.frames.size, 0);
  f.reduced.matches = false; f.fire('reduce'); assert.equal(f.frames.size, 1);
  f.reduced.matches = true; f.fire('reduce'); assert.equal(f.frames.size, 0);
});
test('manual pause survives tab visibility changes and density is capped', () => {
  const f = fixture(); assert.equal(f.canvas.width, 585);
  f.fire('pause'); assert.equal(f.frames.size, 0);
  f.fire('pageshow'); assert.equal(f.frames.size, 0);
  f.fire('pause'); assert.equal(f.frames.size, 1);
});
