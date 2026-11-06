// Sample the product geometry without starting a browser or changing app code.
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../../../../../../web/thinking-orb.js', import.meta.url), 'utf8');
const context = new Proxy({}, { get: () => () => {}, set: () => true });
const sandbox = {
  window: { devicePixelRatio: 1 },
  document: { documentElement: { dataset: {} }, addEventListener() {} },
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  performance: { now: () => 0 },
};
vm.runInNewContext(source, sandbox);
const orb = sandbox.window.ThinkingOrb.attach({ getContext: () => context, style: {} }, { state: 'connecting', size: 64 });
const frames = Array.from({ length: 60 }, (_, i) => {
  const frame = orb.snapshot(1200 + 4500 * (1 - Math.cos(i / 60 * Math.PI * 2)) / 2).frame;
  const k = 120 / 64;
  return {
    lines: frame.lines.map(line => ({ ...line, x1: line.x1 * k, y1: line.y1 * k, x2: line.x2 * k, y2: line.y2 * k, w: line.w * k })),
    dots: frame.dots.map(dot => ({ ...dot, x: dot.x * k, y: dot.y * k, r: dot.r * k })),
  };
});
writeFileSync(new URL('./orb-frames.json', import.meta.url), JSON.stringify(frames));
