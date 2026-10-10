/*
 * This file adapts the dotted thought-orb engine from thinking-orbs.
 * States: working, searching, solving, listening, connecting,
 * weaving, composing, breathing, shaping, dawning, swirling, unfolding,
 * melting, shattering, looping.
 * The seven later states are local additions. Each changes the
 * silhouette, the topology or the rhythm, not only the surface pattern.
 * Source: https://github.com/Jakubantalik/Libraries
 *
 * MIT License
 *
 * Copyright (c) 2026 Jakub Antalik
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict";

(() => {
  // ---------- Shared geometry helpers ----------

  const hashD = (a, b) => {
    const h = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
    return h - Math.floor(h);
  };
  const frac = (v) => v - Math.floor(v);
  const lerp = (a, b, f) => a + (b - a) * f;

  function vnoise(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    let fx = x - xi;
    let fy = y - yi;
    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    const a = hashD(xi, yi);
    const b = hashD(xi + 1, yi);
    const c = hashD(xi, yi + 1);
    const d = hashD(xi + 1, yi + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }

  function fibDir(i, n) {
    const golden = Math.PI * (3 - Math.sqrt(5));
    const y = 1 - (2 * (i + 0.5)) / n;
    const rad = Math.sqrt(1 - y * y);
    const a = i * golden;
    return [rad * Math.cos(a), y, rad * Math.sin(a)];
  }

  const angleDelta = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const norm3 = (x, y, z) => {
    const l = Math.max(1e-6, Math.hypot(x, y, z));
    return [x / l, y / l, z / l];
  };
  const easeOut = (q) => 1 - (1 - clamp(q)) ** 3;
  const easeInOut = (q) => { q = clamp(q); return q < 0.5 ? 4 * q * q * q : 1 - (-2 * q + 2) ** 3 / 2; };

  // Rotate a vector about a unit axis (Rodrigues).
  function rotAxis([x, y, z], [ax, ay, az], ang) {
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const d = ax * x + ay * y + az * z;
    return [
      x * c + (ay * z - az * y) * s + ax * d * (1 - c),
      y * c + (az * x - ax * z) * s + ay * d * (1 - c),
      z * c + (ax * y - ay * x) * s + az * d * (1 - c),
    ];
  }

  function makeProj(yaw, tilt, cx, cy, scale) {
    const st = Math.sin(tilt);
    const ct = Math.cos(tilt);
    const sy = Math.sin(yaw);
    const cyw = Math.cos(yaw);
    return (x, y, z) => {
      const x1 = x * cyw + z * sy;
      const z1 = -x * sy + z * cyw;
      const y1 = y * ct - z1 * st;
      const z2 = y * st + z1 * ct;
      return [cx + x1 * scale, cy - y1 * scale, z2];
    };
  }

  const radiusScale = (size, pow) => (size / 300) ** pow;

  function finalizeFrame(dots, lines, rMin = 0.3) {
    const visible = [];
    for (const d of dots) {
      if ((d.a ?? 1) < 0.02) continue;
      d.r = Math.max(rMin, d.r);
      visible.push(d);
    }
    visible.sort((a, b) => a.z - b.z);
    return { dots: visible, lines: lines.filter((l) => (l.a ?? 1) >= 0.02) };
  }

  // ---------- Mode frames ----------

  // Orbits: particles on tilted orbits — "working".
  function frameOrbits(size, t, o) {
    const cx = size / 2;
    const cy = size / 2;
    const R = (size / 2) * 0.82;
    const pt = makeProj(t * 0.12, 0.3, cx, cy, 1);
    const rs = radiusScale(size, o.rsPow ?? 0.6);
    const dots = [];
    const orbitN = o.orbitN ?? 12;
    const ghostN = o.ghostN ?? 40;
    const particles = o.particles ?? 3;

    for (let orb = 0; orb < orbitN; orb++) {
      const h1 = hashD(orb, 1.7);
      const h2 = hashD(orb, 5.2);
      const h3 = hashD(orb, 8.9);
      const ro = R * (0.45 + 0.52 * h1);
      const th = h1 * 2 * Math.PI;
      const phi = Math.acos(2 * h2 - 1);
      const nx = Math.sin(phi) * Math.cos(th);
      const ny = Math.cos(phi);
      const nz = Math.sin(phi) * Math.sin(th);
      let ux = -ny;
      let uy = nx;
      const uz = 0;
      const ul = Math.max(1e-6, Math.hypot(ux, uy));
      ux /= ul;
      uy /= ul;
      const vx = ny * uz - nz * uy;
      const vy = nz * ux - nx * uz;
      const vz = nx * uy - ny * ux;
      const speed = (0.25 + 0.55 * h3) * (h3 > 0.5 ? 1 : -1);

      for (let k = 0; k < ghostN; k++) {
        const a = (k / ghostN) * 2 * Math.PI;
        const [px, py, z] = pt(
          (ux * Math.cos(a) + vx * Math.sin(a)) * ro,
          (uy * Math.cos(a) + vy * Math.sin(a)) * ro,
          (uz * Math.cos(a) + vz * Math.sin(a)) * ro,
        );
        const depth = (z / ro + 1) / 2;
        dots.push({
          x: px, y: py, z,
          r: (o.ghostR ?? 0.9) * rs,
          white: 0.72,
          a: (o.ghostA ?? 0.5) * (0.4 + 0.6 * depth),
        });
      }
      for (let m = 0; m < particles; m++) {
        const a = t * speed + (m / particles) * 2 * Math.PI + h2 * 6;
        const [px, py, z] = pt(
          (ux * Math.cos(a) + vx * Math.sin(a)) * ro,
          (uy * Math.cos(a) + vy * Math.sin(a)) * ro,
          (uz * Math.cos(a) + vz * Math.sin(a)) * ro,
        );
        const depth = (z / ro + 1) / 2;
        dots.push({
          x: px, y: py, z,
          r: ((o.partR ?? 1.2) + (o.partRDepth ?? 1.6) * depth) * rs,
          white: 0.3 - 0.22 * depth,
        });
      }
    }
    return finalizeFrame(dots, [], o.rMin);
  }

  // Globe: a scan meridian sweeps a dotted globe — "searching".
  function frameGlobe(size, t, o) {
    const spin = 0.5;
    const cx = size / 2;
    const cy = size / 2;
    const radius = (size / 2) * 0.82;
    const tilt = 0.4 + 0.06 * Math.sin(t * 0.35);
    const pt = makeProj(t * spin, tilt, cx, cy, radius);
    const scan = t * (spin + (1.7 - spin) * (o.scanMul ?? 1));
    const rs = radiusScale(size, o.rsPow ?? 0.6);
    const dimBase = o.dimBase ?? 1;
    const dots = [];
    const latRings = o.latRings ?? 17;
    const lonDensity = o.lonDensity ?? 44;
    for (let li = 0; li <= latRings; li++) {
      const lat = -Math.PI / 2 + (li / latRings) * Math.PI;
      const cosLat = Math.cos(lat);
      const sinLat = Math.sin(lat);
      const lonCount = Math.max(1, Math.round(Math.abs(cosLat) * lonDensity));
      for (let lj = 0; lj < lonCount; lj++) {
        const lon = (lj / lonCount) * 2 * Math.PI;
        const [px, py, z] = pt(cosLat * Math.cos(lon), sinLat, cosLat * Math.sin(lon));
        const depth = (z + 1) / 2;
        const d = angleDelta(lon + t * spin, scan);
        const boost = Math.exp(-(d * d) / 0.18) * Math.max(0, z);
        dots.push({
          x: px, y: py, z,
          r: ((o.rBase ?? 0.6) + (o.rDepth ?? 1.7) * depth + (o.rBoost ?? 1) * boost) * rs,
          white: (o.inkFar ?? 0.62) - (o.inkSpan ?? 0.54) * depth,
          a: dimBase + (1 - dimBase) * Math.min(1, boost),
        });
      }
    }
    return finalizeFrame(dots, [], o.rMin);
  }

  // Rubik solver heartbeat: scramble, then replay in reverse.
  function solveCycle(time, count, slotDur, rest) {
    const cyc = 2 * count * slotDur + rest;
    const tc = time % cyc;
    const amount = new Array(count).fill(0);
    let active = -1;
    if (tc < 2 * count * slotDur) {
      const slot = Math.floor(tc / slotDur);
      const p = (tc - slot * slotDur) / slotDur;
      const cl = Math.min(1, p / 0.7);
      const ep = 1 - (1 - cl) ** 3;
      if (slot < count) {
        for (let i = 0; i < slot; i++) amount[i] = 1;
        amount[slot] = ep;
        active = slot;
      } else {
        const u = 2 * count - 1 - slot;
        for (let i = 0; i < u; i++) amount[i] = 1;
        amount[u] = 1 - ep;
        active = u;
      }
    }
    return { amount, active };
  }

  function makeMoves(count) {
    const moves = [];
    for (let i = 0; i < count; i++) {
      const axis = Math.min(2, Math.floor(hashD(i, 2.3) * 3));
      const lo = -1.0 + 0.5 * Math.min(3, Math.floor(hashD(i, 5.9) * 4));
      const dir = hashD(i, 7.7) < 0.5 ? 1 : -1;
      moves.push({ axis, lo, hi: lo + 0.5, ang: (dir * Math.PI) / 2 });
    }
    return moves;
  }

  function applyMoves(pt3, moves, sc) {
    let [x, y, z] = pt3;
    let inActive = false;
    for (let i = 0; i < moves.length; i++) {
      if (sc.amount[i] <= 0) continue;
      const mv = moves[i];
      const coord = mv.axis === 0 ? x : mv.axis === 1 ? y : z;
      if (coord < mv.lo || coord >= mv.hi) continue;
      if (i === sc.active) inActive = true;
      const a = mv.ang * sc.amount[i];
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      if (mv.axis === 0) {
        const y2 = y * ca - z * sa;
        z = y * sa + z * ca;
        y = y2;
      } else if (mv.axis === 1) {
        const x2 = x * ca + z * sa;
        z = -x * sa + z * ca;
        x = x2;
      } else {
        const x2 = x * ca - y * sa;
        y = x * sa + y * ca;
        x = x2;
      }
    }
    return [x, y, z, inActive];
  }

  // Rubik: bands scramble, then click back solved — "solving".
  function frameRubik(size, t, o) {
    const cx = size / 2;
    const cy = size / 2;
    const R = (size / 2) * 0.82;
    const pt = makeProj(t * 0.55, 0.35 + 0.1 * Math.sin(t * 0.9), cx, cy, R);
    const rs = radiusScale(size, o.rsPow ?? 0.6);
    const moveCount = o.moveCount ?? 14;
    const moves = makeMoves(moveCount);
    const sc = solveCycle(t, moveCount, 0.42, 1.2);
    const dots = [];
    const latRings = o.latRings ?? 15;
    const lonDensity = o.lonDensity ?? 40;
    for (let li = 0; li <= latRings; li++) {
      const lat = -Math.PI / 2 + (li / latRings) * Math.PI;
      const cosLat = Math.cos(lat);
      const sinLat = Math.sin(lat);
      const lonCount = Math.max(1, Math.round(Math.abs(cosLat) * lonDensity));
      for (let lj = 0; lj < lonCount; lj++) {
        const lon = (lj / lonCount) * 2 * Math.PI;
        const [x, y, z, inActive] = applyMoves(
          [cosLat * Math.cos(lon), sinLat, cosLat * Math.sin(lon)], moves, sc,
        );
        const [px, py, zr] = pt(x, y, z);
        const depth = (zr + 1) / 2;
        dots.push({
          x: px, y: py, z: zr,
          r: ((o.rBase ?? 0.6) + (o.rDepth ?? 1.7) * depth + (inActive ? (o.rActive ?? 0.3) : 0)) * rs,
          white: (o.inkFar ?? 0.62) - (o.inkSpan ?? 0.54) * depth - (inActive ? 0.14 : 0),
        });
      }
    }
    return finalizeFrame(dots, [], o.rMin);
  }

  // Wave: a waveform rolls through the rings — "listening".
  function frameWave(size, t, o) {
    const cx = size / 2;
    const cy = size / 2;
    const R = (size / 2) * 0.874;
    const pt = makeProj(t * 0.18, 0.38, cx, cy, 1);
    const rs = radiusScale(size, o.rsPow ?? 0.6);
    const dots = [];
    const rings = o.rings ?? 15;
    const lonDensity = o.lonDensity ?? 40;
    for (let ri = 0; ri <= rings; ri++) {
      const lat = -Math.PI / 2 + (ri / rings) * Math.PI;
      const cosLat = Math.cos(lat);
      const sinLat = Math.sin(lat);
      const w = 0.62 * Math.sin(t * 2.1 - ri * 0.52) + 0.38 * Math.sin(t * 1.27 + ri * 0.83);
      const rr = R * (0.88 + 0.105 * w);
      const lonCount = Math.max(1, Math.round(Math.abs(cosLat) * lonDensity));
      for (let lj = 0; lj < lonCount; lj++) {
        const lon = (lj / lonCount) * 2 * Math.PI;
        const [px, py, z] = pt(cosLat * Math.cos(lon) * rr, sinLat * rr, cosLat * Math.sin(lon) * rr);
        const depth = (z / R + 1) / 2;
        const crest = Math.max(0, w);
        dots.push({
          x: px, y: py, z,
          r: ((o.rBase ?? 0.6) + (o.rDepth ?? 1.7) * depth) * (1 + 0.4 * crest) * rs,
          white: 0.66 - 0.56 * depth - 0.1 * crest,
        });
      }
    }
    return finalizeFrame(dots, [], o.rMin);
  }

  // Web: a constellation wires itself — "connecting".
  function frameWeb(size, t, o) {
    const cx = size / 2;
    const cy = size / 2;
    const R = (size / 2) * 0.8 * (o.spread ?? 1);
    const pt = makeProj(t * 0.12, 0.32, cx, cy, R);
    const rs = radiusScale(size, o.rsPow ?? 0.6);
    const nodeN = o.nodeN ?? 30;
    const thr = o.thr ?? 0.72;
    const nodeR = o.nodeR ?? 1.4;
    const nodeRDepth = o.nodeRDepth ?? 1.8;

    const nodes = [];
    for (let i = 0; i < nodeN; i++) {
      const d = fibDir(i, nodeN);
      const x = d[0] + 0.3 * (vnoise(i * 0.31 + 9, t * 0.24) - 0.5) * 2;
      const y = d[1] + 0.3 * (vnoise(i * 0.53 + 27, t * 0.21) - 0.5) * 2;
      const z = d[2] + 0.3 * (vnoise(i * 0.77 + 55, t * 0.27) - 0.5) * 2;
      const l = Math.hypot(x, y, z);
      nodes.push([x / l, y / l, z / l]);
    }

    const lines = [];
    const dots = [];
    for (let i = 0; i < nodeN; i++) {
      for (let j = i + 1; j < nodeN; j++) {
        const dist = Math.hypot(
          nodes[i][0] - nodes[j][0],
          nodes[i][1] - nodes[j][1],
          nodes[i][2] - nodes[j][2],
        );
        if (dist >= thr) continue;
        const [x1, y1, z1] = pt(...nodes[i]);
        const [x2, y2, z2] = pt(...nodes[j]);
        const depth = ((z1 + z2) / 2 + 1) / 2;
        lines.push({
          x1, y1, x2, y2,
          white: 0.42,
          a: (1 - dist / thr) * (0.3 + 0.55 * depth),
          w: Math.max(0.6, (o.lineW ?? 0.8) * rs),
        });
      }
    }
    for (let i = 0; i < nodeN; i++) {
      const [px, py, z] = pt(...nodes[i]);
      const depth = (z + 1) / 2;
      const pulse = 1 + 0.25 * Math.sin(t * 1.4 + i * 2.7);
      dots.push({
        x: px, y: py, z,
        r: (nodeR + nodeRDepth * depth) * pulse * rs,
        white: 0.55 - 0.45 * depth,
      });
    }
    const signals = o.signals ?? 5;
    for (let s = 0; s < signals; s++) {
      const seg = Math.floor(t * 0.55 + s * 7.31);
      const a = Math.floor(hashD(seg, s * 3.1 + 1.7) * nodeN);
      const b = Math.floor(hashD(seg, s * 5.7 + 4.2) * nodeN);
      if (a === b) continue;
      const f = frac(t * 0.55 + s * 7.31);
      const x = lerp(nodes[a][0], nodes[b][0], f);
      const y = lerp(nodes[a][1], nodes[b][1], f);
      const z = lerp(nodes[a][2], nodes[b][2], f);
      const l = Math.max(1e-6, Math.hypot(x, y, z));
      const [px, py, zr] = pt(x / l, y / l, z / l);
      const depth = (zr + 1) / 2;
      dots.push({
        x: px, y: py, z: zr,
        r: (nodeR * 1.5 + nodeRDepth * depth) * rs,
        white: 0.05,
        a: 0.5 + 0.5 * depth,
      });
    }
    return finalizeFrame(dots, lines, o.rMin);
  }

  // Braid: three strands plait around the sphere — "weaving".
  function frameBraid(size, t, o) {
    const cx = size / 2;
    const cy = size / 2;
    const R = (size / 2) * 0.76;
    const pt = makeProj(t * 0.4, 0.3, cx, cy, 1);
    const rs = radiusScale(size, o.rsPow ?? 0.6);
    const dots = [];
    const ghostN = o.ghostN ?? 150;
    for (let i = 0; i < ghostN; i++) {
      const d = fibDir(i, ghostN);
      const [px, py, z] = pt(d[0] * R, d[1] * R, d[2] * R);
      const depth = (z / R + 1) / 2;
      dots.push({ x: px, y: py, z, r: 0.8 * rs, white: 0.78, a: 0.1 + 0.22 * depth });
    }
    const strandN = o.strandN ?? 52;
    const turns = o.turns ?? 3;
    for (let s = 0; s < 3; s++) {
      const phase = (s / 3) * 2 * Math.PI;
      for (let i = 0; i < strandN; i++) {
        const u = (frac(i / strandN + t * 0.045) * 2 - 1) * 0.96;
        const surf = Math.sqrt(Math.max(0, 1 - u * u));
        const endFade = Math.min(1, (1 - Math.abs(u)) / 0.1);
        const a = u * Math.PI * turns + phase;
        const weave = 1 + 0.075 * Math.sin(u * Math.PI * turns * 2 + phase * 2 + t * 0.8);
        const rr = surf * R * weave;
        const [px, py, zr] = pt(Math.cos(a) * rr, u * R * weave, Math.sin(a) * rr);
        const depth = (zr / R + 1) / 2;
        dots.push({
          x: px, y: py, z: zr,
          r: ((o.rBase ?? 1.2) + (o.rDepth ?? 1.8) * depth) * rs,
          white: 0.55 - 0.45 * depth,
          a: endFade * (0.45 + 0.55 * depth),
        });
      }
    }
    return finalizeFrame(dots, [], o.rMin);
  }

  // Ribbon: an undulating sash — "composing". With faceOn: "breathing".
  function frameRibbon(size, t, o) {
    const cx = size / 2;
    const cy = size / 2;
    const R = (size / 2) * 0.78;
    const spin = o.spin ?? 1;
    const camTilt = 0.3;
    const pt = makeProj(t * 0.1 * spin, camTilt, cx, cy, 1);
    const rs = radiusScale(size, o.rsPow ?? 0.6);
    const dots = [];
    const ghostN = o.ghostN ?? 150;
    for (let i = 0; i < ghostN; i++) {
      const d = fibDir(i, ghostN);
      const [px, py, z] = pt(d[0] * R, d[1] * R, d[2] * R);
      const depth = (z / R + 1) / 2;
      dots.push({ x: px, y: py, z, r: 0.8 * rs, white: 0.78, a: 0.1 + 0.22 * depth });
    }
    const ya = t * 0.24 * spin;
    const ta = o.faceOn ? -camTilt : 0.55 + 0.3 * Math.sin(t * 0.18) * spin;
    const ux = Math.cos(ya);
    const uy = 0;
    const uz = Math.sin(ya);
    const vx = -uz * Math.sin(ta);
    const vy = Math.cos(ta);
    const vz = ux * Math.sin(ta);
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const wobAmp = 0.23 * (o.wobMul ?? 1);
    const baseR = o.faceOn ? R / (1 + 0.85 * wobAmp) : R;
    const baseLanes = o.lanes ?? 5;
    const segs = o.segs ?? 88;
    const lanes = Math.max(1, Math.round(baseLanes * (o.bandMul ?? 1)));
    for (let w = 0; w < lanes; w++) {
      const laneOff = (w - (lanes - 1) / 2) * 0.075;
      const edge = Math.abs(w - (lanes - 1) / 2) / Math.max(1, (lanes - 1) / 2);
      for (let k = 0; k < segs; k++) {
        const a = (k / segs) * 2 * Math.PI;
        const wob =
          (0.16 * Math.sin(a * 3 - t * 1.7 + w * 0.22) + 0.07 * Math.sin(a * 5 + t * 1.1)) * (o.wobMul ?? 1);
        const radial = o.faceOn ? 1 + wob : 1;
        const off = o.faceOn ? laneOff : laneOff + wob;
        const x = ux * Math.cos(a) + vx * Math.sin(a) + nx * off;
        const y = uy * Math.cos(a) + vy * Math.sin(a) + ny * off;
        const z = uz * Math.cos(a) + vz * Math.sin(a) + nz * off;
        const l = Math.hypot(x, y, z);
        const rr = baseR * radial;
        const [px, py, zr] = pt((x / l) * rr, (y / l) * rr, (z / l) * rr);
        const depth = (zr / R + 1) / 2;
        dots.push({
          x: px, y: py, z: zr,
          r: ((o.rBase ?? 1.1) + (o.rDepth ?? 1.7) * depth) * (1 - 0.25 * edge) * rs,
          white: 0.52 - 0.44 * depth + 0.18 * edge,
          a: 0.4 + 0.6 * depth,
        });
      }
    }
    return finalizeFrame(dots, [], o.rMin);
  }

  // Morph: one cloud remakes itself as sphere, cube, torus, octahedron — "shaping".
  function frameMorph(size, t, o) {
    const cx = size / 2;
    const cy = size / 2;
    const R = (size / 2) * 0.8;
    const rs = radiusScale(size, o.rsPow ?? 0.6);
    const g = o.faceGrid ?? 7;
    const n = 6 * g * g;
    const pt = makeProj(t * 0.35, 0.35, cx, cy, R);
    const shape = (which, i) => {
      if (which === 0) return fibDir(i, n);
      if (which === 1) {
        const face = i % 6;
        const k = Math.floor(i / 6);
        const u = (((k % g) + 0.5) / g) * 2 - 1;
        const v = ((Math.floor(k / g) + 0.5) / g) * 2 - 1;
        const s = 0.74;
        if (face === 0) return [s, u * s, v * s];
        if (face === 1) return [-s, u * s, v * s];
        if (face === 2) return [u * s, s, v * s];
        if (face === 3) return [u * s, -s, v * s];
        if (face === 4) return [u * s, v * s, s];
        return [u * s, v * s, -s];
      }
      if (which === 2) {
        const u = frac(i * 0.618034) * 2 * Math.PI;
        const v = (i / n) * 2 * Math.PI;
        const Rm = 0.66;
        const rm = 0.28;
        const x = (Rm + rm * Math.cos(v)) * Math.cos(u);
        const y = rm * Math.sin(v);
        const z = (Rm + rm * Math.cos(v)) * Math.sin(u);
        // Tip the ring so its hole shows.
        const c = Math.cos(0.7);
        const s = Math.sin(0.7);
        return [x, y * c - z * s, y * s + z * c];
      }
      const d = fibDir(i, n);
      const l1 = Math.abs(d[0]) + Math.abs(d[1]) + Math.abs(d[2]);
      return [d[0] / l1 * 0.98, d[1] / l1 * 0.98, d[2] / l1 * 0.98];
    };
    const hold = o.hold ?? 1.0;
    const move = o.move ?? 0.7;
    const per = hold + move;
    const tau = t * (o.rate ?? 0.5);
    const idx = Math.floor(tau / per) % 4;
    const ph = tau - Math.floor(tau / per) * per;
    const dots = [];
    for (let i = 0; i < n; i++) {
      const a = shape(idx, i);
      let x = a[0];
      let y = a[1];
      let z = a[2];
      let swell = 0;
      if (ph > hold) {
        const f = easeInOut(((ph - hold) / move - 0.3 * hashD(i, 3.3)) / 0.7);
        const b = shape((idx + 1) % 4, i);
        x = lerp(a[0], b[0], f);
        y = lerp(a[1], b[1], f);
        z = lerp(a[2], b[2], f);
        swell = Math.sin(Math.PI * f);
      }
      const [px, py, pz] = pt(x, y, z);
      const depth = (pz + 1) / 2;
      dots.push({
        x: px, y: py, z: pz,
        r: ((o.rBase ?? 0.9) + (o.rDepth ?? 1.5) * depth) * (1 + 0.5 * swell) * rs,
        white: 0.6 - 0.5 * depth + 0.1 * swell,
        a: 0.4 + 0.6 * depth,
      });
    }
    return finalizeFrame(dots, [], o.rMin);
  }

  // Eclipse: a half-tone moon with a light that circles the viewer — "dawning".
  function frameEclipse(size, t, o) {
    const cx = size / 2;
    const cy = size / 2;
    const R = (size / 2) * 0.82;
    const rs = radiusScale(size, o.rsPow ?? 0.6);
    const n = o.dotN ?? 520;
    const yaw = t * 0.1;
    const tilt = 0.3;
    const pt = makeProj(yaw, tilt, cx, cy, R);
    const view = makeProj(yaw, tilt, 0, 0, 1);
    const la = t * (o.rate ?? 0.45);
    const L = norm3(Math.cos(la), 0.35, Math.sin(la));
    const dots = [];
    for (let i = 0; i < n; i++) {
      const d = fibDir(i, n);
      const [px, py, z] = pt(d[0], d[1], d[2]);
      const [vx, vy] = view(d[0], d[1], d[2]);
      const nd = vx * L[0] - vy * L[1] + z * L[2];
      const lam = Math.max(0, nd);
      const term = Math.exp(-((nd / 0.1) ** 2));
      const depth = (z + 1) / 2;
      dots.push({
        x: px, y: py, z,
        r: ((o.rBase ?? 0.45) + (o.rDepth ?? 0.9) * depth + (o.rLit ?? 1.7) * lam + 0.5 * term) * rs,
        white: 0.92 - 0.85 * lam - 0.2 * term,
        a: 0.2 + 0.8 * Math.max(lam, 0.8 * term) + 0.1 * depth,
      });
    }
    return finalizeFrame(dots, [], o.rMin);
  }

  // Galaxy: a tilted spiral disc with a bright bulge — "swirling".
  function frameGalaxy(size, t, o) {
    const cx = size / 2;
    const cy = size / 2;
    const R = (size / 2) * 0.9;
    const rs = radiusScale(size, o.rsPow ?? 0.6);
    const n = o.dotN ?? 320;
    const arms = o.arms ?? 2;
    const pt = makeProj(t * 0.12, 1.0 + 0.18 * Math.sin(t * 0.2), cx, cy, R);
    const spin = t * (o.rate ?? 0.45);
    const dots = [];
    for (let i = 0; i < n; i++) {
      const h1 = hashD(i, 1.3);
      const h2 = hashD(i, 2.7);
      const h3 = hashD(i, 4.1);
      const rr = 0.08 + 0.92 * h1 ** 0.7;
      const arm = i % arms;
      const spread = 0.28 * (0.25 + rr);
      const th = (arm / arms) * 2 * Math.PI + rr * (o.wind ?? 2.4) * Math.PI + (h2 - 0.5) * spread * 2 * Math.PI + spin;
      const y = (h3 - 0.5) * 0.14 * (1.2 - rr);
      const [px, py, z] = pt(rr * Math.cos(th), y, rr * Math.sin(th));
      const depth = (z + 1) / 2;
      const twinkle = 0.8 + 0.2 * Math.sin(t * 2.3 + i * 1.7);
      dots.push({
        x: px, y: py, z,
        r: ((o.rBase ?? 0.6) + (o.rDepth ?? 1.0) * depth) * (1.6 - rr) * twinkle * rs,
        white: 0.66 - 0.4 * depth - 0.25 * (1 - rr),
        a: (0.3 + 0.7 * (1 - 0.55 * rr)) * twinkle,
      });
    }
    const coreN = o.coreN ?? 28;
    for (let i = 0; i < coreN; i++) {
      const d = fibDir(i, coreN);
      const cr = 0.1 + 0.04 * hashD(i, 9.1);
      const p = rotAxis(d, [0, 1, 0], spin * 1.5);
      const [px, py, z] = pt(p[0] * cr, p[1] * cr * 0.6, p[2] * cr);
      const depth = (z + 1) / 2;
      dots.push({ x: px, y: py, z, r: ((o.rBase ?? 0.6) * 1.6 + 1.0 * depth) * rs, white: 0.1, a: 0.6 + 0.4 * depth });
    }
    return finalizeFrame(dots, [], o.rMin);
  }

  // Tesseract: a hypercube turns in two 4D planes — "unfolding".
  function frameTesseract(size, t, o) {
    const cx = size / 2;
    const cy = size / 2;
    const R = (size / 2) * 0.82;
    const rs = radiusScale(size, o.rsPow ?? 0.6);
    const pt = makeProj(t * 0.15, 0.3, cx, cy, R);
    const a = t * (o.rate ?? 0.5);
    const b = t * (o.rate ?? 0.5) * 0.6;
    const c = t * 0.2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const cb = Math.cos(b);
    const sb = Math.sin(b);
    const cc = Math.cos(c);
    const sc = Math.sin(c);
    const verts = [];
    for (let v = 0; v < 16; v++) {
      let x = v & 1 ? 1 : -1;
      let y = v & 2 ? 1 : -1;
      let z = v & 4 ? 1 : -1;
      let w = v & 8 ? 1 : -1;
      // Rotate in the xw, yz and xy planes.
      [x, w] = [x * ca - w * sa, x * sa + w * ca];
      [y, z] = [y * cb - z * sb, y * sb + z * cb];
      [x, y] = [x * cc - y * sc, x * sc + y * cc];
      const k = (0.55 / (1.9 - w * 0.45)) * 1.35;
      verts.push([x * k, y * k, z * k, k]);
    }
    const dots = [];
    const lines = [];
    const edgeDots = o.edgeDots ?? 7;
    const lineW = Math.max(0.6, (o.lineW ?? 0.8) * rs);
    for (let v = 0; v < 16; v++) {
      const [x, y, z, k] = verts[v];
      const [px, py, pz] = pt(x, y, z);
      const depth = (pz + 1) / 2;
      dots.push({
        x: px, y: py, z: pz,
        r: ((o.rBase ?? 1.5) + (o.rDepth ?? 1.6) * depth) * (0.5 + 0.7 * k) * rs,
        white: 0.4 - 0.35 * depth,
        a: 0.55 + 0.45 * depth,
      });
      for (const bit of [1, 2, 4, 8]) {
        const u = v | bit;
        if (u === v) continue;
        const [x2, y2, z2] = verts[u];
        const [qx, qy, qz] = pt(x2, y2, z2);
        const ldepth = ((pz + qz) / 2 + 1) / 2;
        lines.push({ x1: px, y1: py, x2: qx, y2: qy, white: 0.6, a: 0.12 + 0.3 * ldepth, w: lineW });
        for (let m = 1; m <= edgeDots; m++) {
          const f = m / (edgeDots + 1);
          const [ex, ey, ez] = pt(lerp(x, x2, f), lerp(y, y2, f), lerp(z, z2, f));
          const ed = (ez + 1) / 2;
          dots.push({ x: ex, y: ey, z: ez, r: ((o.rBase ?? 1.5) * 0.45 + 0.9 * ed) * rs, white: 0.7 - 0.4 * ed, a: 0.4 + 0.6 * ed });
        }
      }
    }
    return finalizeFrame(dots, lines, o.rMin);
  }

  // Blob: low-frequency noise pushes the surface in and out like liquid — "melting".
  function frameBlob(size, t, o) {
    const cx = size / 2;
    const cy = size / 2;
    const R = (size / 2) * 0.72;
    const rs = radiusScale(size, o.rsPow ?? 0.6);
    const n = o.dotN ?? 380;
    const pt = makeProj(t * 0.15, 0.3, cx, cy, R);
    const amp = o.amp ?? 0.5;
    const dots = [];
    for (let i = 0; i < n; i++) {
      const d = fibDir(i, n);
      const disp =
        0.55 * (vnoise(d[0] * 1.3 + t * 0.35, d[1] * 1.3 + 5.1) - 0.5) +
        0.35 * (vnoise(d[1] * 1.6 + 9.7, d[2] * 1.6 + t * 0.3) - 0.5) +
        0.3 * (vnoise(d[2] * 2 + t * 0.25 + 3.3, d[0] * 2) - 0.5);
      const rad = 1 + amp * disp * 2;
      const [px, py, z] = pt(d[0] * rad, d[1] * rad, d[2] * rad);
      const depth = (z / rad + 1) / 2;
      const bulge = clamp(disp * 2, -1, 1);
      dots.push({
        x: px, y: py, z,
        r: ((o.rBase ?? 0.8) + (o.rDepth ?? 1.4) * depth) * (1 + 0.55 * bulge) * rs,
        white: 0.62 - 0.5 * depth - 0.18 * bulge,
        a: 0.35 + 0.65 * depth,
      });
    }
    return finalizeFrame(dots, [], o.rMin);
  }

  // Shatter: the shell splits into shards that drift apart, then snap back — "shattering".
  function frameShatter(size, t, o) {
    const cx = size / 2;
    const cy = size / 2;
    const R = (size / 2) * 0.64;
    const rs = radiusScale(size, o.rsPow ?? 0.6);
    const n = o.dotN ?? 400;
    const K = o.shardN ?? 8;
    const pt = makeProj(t * 0.18, 0.3, cx, cy, R);
    const p = frac(t * (o.rate ?? 0.22));
    let a;
    if (p < 0.3) a = 0;
    else if (p < 0.55) a = easeOut((p - 0.3) / 0.25);
    else if (p < 0.7) a = 1;
    else a = 1 - ((p - 0.7) / 0.3) ** 3;
    const seeds = [];
    for (let k = 0; k < K; k++) {
      const d = fibDir(k, K);
      seeds.push({
        dir: norm3(d[0] + 0.5 * (hashD(k, 1.1) - 0.5), d[1] + 0.5 * (hashD(k, 2.2) - 0.5), d[2] + 0.5 * (hashD(k, 3.3) - 0.5)),
        off: (0.35 + 0.3 * hashD(k, 8.8)) * clamp((a * 1.3 - 0.3 * hashD(k, 6.6)) / 1.0),
        rot: (hashD(k, 5.5) - 0.5) * 1.4 * a,
      });
    }
    const dots = [];
    for (let i = 0; i < n; i++) {
      const d = fibDir(i, n);
      let best = -2;
      let second = -2;
      let bk = 0;
      for (let k = 0; k < K; k++) {
        const s = seeds[k].dir;
        const dp = d[0] * s[0] + d[1] * s[1] + d[2] * s[2];
        if (dp > best) { second = best; best = dp; bk = k; }
        else if (dp > second) second = dp;
      }
      const seed = seeds[bk];
      const edge = Math.exp(-(((best - second) / 0.05) ** 2));
      const r3 = rotAxis(d, seed.dir, seed.rot);
      const x = r3[0] + seed.dir[0] * seed.off;
      const y = r3[1] + seed.dir[1] * seed.off;
      const z = r3[2] + seed.dir[2] * seed.off;
      const [px, py, pz] = pt(x, y, z);
      const depth = (pz / (1 + seed.off) + 1) / 2;
      dots.push({
        x: px, y: py, z: pz,
        r: ((o.rBase ?? 0.7) + (o.rDepth ?? 1.5) * depth) * (1 + 0.6 * edge) * rs,
        white: 0.66 - 0.5 * depth - 0.35 * edge,
        a: 0.35 + 0.65 * depth,
      });
    }
    return finalizeFrame(dots, [], o.rMin);
  }

  // Knot: a trefoil ribbon flows through itself with two pulses — "looping".
  function frameKnot(size, t, o) {
    const cx = size / 2;
    const cy = size / 2;
    const R = (size / 2) * 0.86;
    const rs = radiusScale(size, o.rsPow ?? 0.6);
    const n = o.dotN ?? 200;
    const pt = makeProj(t * 0.3, 0.5 + 0.25 * Math.sin(t * 0.25), cx, cy, R);
    const flow = t * (o.rate ?? 0.5);
    const P = (u) => [
      (Math.sin(u) + 2 * Math.sin(2 * u)) / 3,
      (Math.cos(u) - 2 * Math.cos(2 * u)) / 3,
      -Math.sin(3 * u) / 3,
    ];
    const dots = [];
    const lines = [];
    const lineW = Math.max(0.6, (o.lineW ?? 0.8) * rs);
    let prev = null;
    let first = null;
    for (let i = 0; i < n; i++) {
      const u = (i / n) * 2 * Math.PI + flow;
      const c = P(u);
      const nx = P(u + 0.01);
      const T = norm3(nx[0] - c[0], nx[1] - c[1], nx[2] - c[2]);
      const side = norm3(T[2], 0, -T[0]);
      let boost = 0;
      for (let k = 0; k < 2; k++) {
        const du = Math.atan2(Math.sin(u - t * 1.6 - k * Math.PI), Math.cos(u - t * 1.6 - k * Math.PI));
        boost += Math.exp(-((du / 0.18) ** 2));
      }
      const [px, py, z] = pt(c[0], c[1], c[2]);
      const depth = (z + 1) / 2;
      dots.push({
        x: px, y: py, z,
        r: ((o.rBase ?? 1.1) + (o.rDepth ?? 1.6) * depth) * (1 + 1.1 * boost) * rs,
        white: 0.55 - 0.45 * depth - 0.3 * boost,
        a: 0.45 + 0.55 * depth,
      });
      for (const sgn of [-1, 1]) {
        const w = 0.075;
        const [qx, qy, qz] = pt(c[0] + side[0] * w * sgn, c[1] + side[1] * w * sgn, c[2] + side[2] * w * sgn);
        const qd = (qz + 1) / 2;
        dots.push({ x: qx, y: qy, z: qz, r: ((o.rBase ?? 1.1) * 0.55 + 0.8 * qd) * rs, white: 0.78, a: 0.25 + 0.35 * qd });
      }
      const cur = [px, py, depth];
      if (prev) lines.push({ x1: prev[0], y1: prev[1], x2: px, y2: py, white: 0.6, a: 0.15 + 0.3 * (prev[2] + depth) / 2, w: lineW });
      else first = cur;
      prev = cur;
    }
    if (prev && first) lines.push({ x1: prev[0], y1: prev[1], x2: first[0], y2: first[1], white: 0.6, a: 0.3, w: lineW });
    return finalizeFrame(dots, lines, o.rMin);
  }

  // ---------- Presets ----------

  const MODE_FRAMES = {
    orbits: frameOrbits,
    globe: frameGlobe,
    rubik: frameRubik,
    wave: frameWave,
    web: frameWeb,
    braid: frameBraid,
    ribbon: frameRibbon,
    ring: frameRibbon,
    morph: frameMorph,
    eclipse: frameEclipse,
    galaxy: frameGalaxy,
    tesseract: frameTesseract,
    blob: frameBlob,
    shatter: frameShatter,
    knot: frameKnot,
  };

  const STATE_TO_MODE = {
    working: "orbits",
    searching: "globe",
    solving: "rubik",
    listening: "wave",
    connecting: "web",
    weaving: "braid",
    composing: "ribbon",
    breathing: "ring",
    shaping: "morph",
    dawning: "eclipse",
    swirling: "galaxy",
    unfolding: "tesseract",
    melting: "blob",
    shattering: "shatter",
    looping: "knot",
  };

  const BASE_PROFILES = {
    globe: { latRings: 17, lonDensity: 44, rBase: 0.6, rDepth: 1.7, rBoost: 1.0, inkFar: 0.62, inkSpan: 0.54, rsPow: 0.6, rMin: 0.3 },
    orbits: { orbitN: 12, ghostN: 40, ghostR: 0.9, ghostA: 0.5, particles: 3, partR: 1.2, partRDepth: 1.6, rsPow: 0.6, rMin: 0.3 },
    rubik: { latRings: 15, lonDensity: 40, moveCount: 14, rBase: 0.6, rDepth: 1.7, rActive: 0.3, inkFar: 0.62, inkSpan: 0.54, rsPow: 0.6, rMin: 0.3 },
    wave: { rings: 15, lonDensity: 40, rBase: 0.6, rDepth: 1.7, rsPow: 0.6, rMin: 0.3 },
    web: { nodeN: 30, thr: 0.72, signals: 5, nodeR: 1.4, nodeRDepth: 1.8, lineW: 0.8, rsPow: 0.6, rMin: 0.3 },
    braid: { strandN: 52, turns: 3.0, ghostN: 150, rBase: 1.2, rDepth: 1.8, rsPow: 0.6, rMin: 0.3 },
    ribbon: { lanes: 5, segs: 88, ghostN: 150, rBase: 1.1, rDepth: 1.7, rsPow: 0.6, rMin: 0.3 },
    ring: { lanes: 5, segs: 88, ghostN: 0, faceOn: 1, rBase: 1.1, rDepth: 1.7, rsPow: 0.6, rMin: 0.3 },
    morph: { faceGrid: 7, hold: 1.0, move: 0.7, rate: 0.5, rBase: 0.9, rDepth: 1.5, rsPow: 0.6, rMin: 0.3 },
    eclipse: { dotN: 520, rate: 0.45, rBase: 0.45, rDepth: 0.9, rLit: 1.7, rsPow: 0.6, rMin: 0.3 },
    galaxy: { dotN: 320, arms: 2, wind: 2.4, coreN: 28, rate: 0.45, rBase: 0.75, rDepth: 1.1, rsPow: 0.6, rMin: 0.3 },
    tesseract: { edgeDots: 7, rate: 0.5, rBase: 1.5, rDepth: 1.6, lineW: 0.8, rsPow: 0.6, rMin: 0.3 },
    blob: { dotN: 380, amp: 0.5, rBase: 0.8, rDepth: 1.4, rsPow: 0.6, rMin: 0.3 },
    shatter: { dotN: 400, shardN: 8, rate: 0.22, rBase: 0.7, rDepth: 1.5, rsPow: 0.6, rMin: 0.3 },
    knot: { dotN: 200, rate: 0.5, rBase: 1.1, rDepth: 1.6, lineW: 0.8, rsPow: 0.6, rMin: 0.3 },
  };

  const PRESETS = {
    orbits: {
      64: { speed: 1.885, count: 1, size: 1 },
      20: { speed: 3.9, count: 0.238, size: 2.4 },
    },
    globe: {
      64: { speed: 2.015, count: 0.42, size: 1.15, extra: { scanMul: 4.08, dimBase: 0.45 } },
      20: { speed: 2.665, count: 0.105, size: 1.75, extra: { scanMul: 4.335, dimBase: 0.45 } },
    },
    rubik: {
      64: { speed: 1.82, count: 0.35, size: 1.05 },
      20: { speed: 1.95, count: 0.088, size: 1.9 },
    },
    wave: {
      64: { speed: 4.388, count: 0.341, size: 1 },
      20: { speed: 3.998, count: 0.105, size: 1.6 },
    },
    web: {
      64: { speed: 3.315, count: 1.35, size: 0.95 },
      20: { speed: 6.63, count: 0.25, size: 1.52 },
    },
    braid: {
      64: { speed: 1.625, count: 0.5, size: 1 },
      20: { speed: 2.75, count: 0.1125, size: 1.36 },
    },
    ribbon: {
      64: { speed: 2.34, count: 0.25, size: 0.85, extra: { spin: 0, bandMul: 3.9, wobMul: 1 } },
      20: { speed: 3.12, count: 0.051, size: 1.073, extra: { spin: 0, bandMul: 4.94, wobMul: 1 } },
    },
    ring: {
      64: { speed: 3.24, count: 0.25, size: 0.956, extra: { spin: 0, bandMul: 3.627, wobMul: 0.368 } },
      20: { speed: 3.78, count: 0.028, size: 1.622, extra: { spin: 0, bandMul: 3.968, wobMul: 0.565 } },
    },
    morph: {
      64: { speed: 1.5, count: 1, size: 1 },
      20: { speed: 1.9, count: 0.3, size: 1.7 },
    },
    eclipse: {
      64: { speed: 1.6, count: 1, size: 1 },
      20: { speed: 2.0, count: 0.3, size: 1.8 },
    },
    galaxy: {
      64: { speed: 1.5, count: 1, size: 1 },
      20: { speed: 1.9, count: 0.35, size: 1.7 },
    },
    tesseract: {
      64: { speed: 1.4, count: 1, size: 1 },
      20: { speed: 1.8, count: 0.2, size: 1.6 },
    },
    blob: {
      64: { speed: 1.7, count: 1, size: 1 },
      20: { speed: 2.1, count: 0.3, size: 1.8 },
    },
    shatter: {
      64: { speed: 1.7, count: 1, size: 1 },
      20: { speed: 2.1, count: 0.3, size: 1.7 },
    },
    knot: {
      64: { speed: 1.6, count: 1, size: 1 },
      20: { speed: 2.0, count: 0.4, size: 1.6 },
    },
  };

  // Global tempo. 0.75 slows every state by a quarter.
  const SPEED_SCALE = 0.75;

  const COUNT_PAIRS = [
    ["latRings", "lonDensity"],
    ["rings", "lonDensity"],
    ["lanes", "segs"],
  ];
  const COUNT_KEYS = ["orbitN", "ghostN", "nodeN", "strandN", "signals", "dotN", "coreN"];
  // Grid keys scale with the square root, like the count pairs.
  const SQRT_KEYS = ["faceGrid", "edgeDots"];
  const RADIUS_KEYS = ["rBase", "rDepth", "rActive", "rDot", "ghostR", "partR", "partRDepth", "nodeR", "nodeRDepth", "rLit"];

  function scaleCounts(opts, scale) {
    const out = { ...opts };
    const done = new Set();
    const rt = Math.sqrt(scale);
    for (const [a, b] of COUNT_PAIRS) {
      if (out[a] != null && out[b] != null && !done.has(a) && !done.has(b)) {
        out[a] = Math.max(2, Math.round(out[a] * rt));
        out[b] = Math.max(2, Math.round(out[b] * rt));
        done.add(a);
        done.add(b);
      }
    }
    for (const k of COUNT_KEYS) {
      const v = out[k];
      if (v != null && v !== 0 && !done.has(k)) out[k] = Math.max(1, Math.round(v * scale));
    }
    for (const k of SQRT_KEYS) {
      if (out[k] != null) out[k] = Math.max(2, Math.round(out[k] * rt));
    }
    return out;
  }

  function scaleRadii(opts, scale) {
    const out = { ...opts };
    for (const k of RADIUS_KEYS) {
      if (out[k] != null) out[k] *= scale;
    }
    return out;
  }

  const presetCache = new Map();

  function resolvePreset(state, size) {
    const key = state + "-" + size;
    const hit = presetCache.get(key);
    if (hit) return hit;
    const mode = STATE_TO_MODE[state] || "orbits";
    const preset = PRESETS[mode][size] || PRESETS[mode][20];
    let opts = { ...BASE_PROFILES[mode] };
    if (preset.count !== 1) opts = scaleCounts(opts, preset.count);
    if (preset.size !== 1) opts = scaleRadii(opts, preset.size);
    if (preset.extra) opts = { ...opts, ...preset.extra };
    const resolved = { frame: MODE_FRAMES[mode], speed: preset.speed * SPEED_SCALE, opts };
    presetCache.set(key, resolved);
    return resolved;
  }

  const STATES = Object.keys(STATE_TO_MODE);

  // ---------- Canvas binding ----------

  function attach(canvas, options = {}) {
    let state = options.state || "working";
    const size = options.size || 20;
    let resolved = resolvePreset(state, size);
    const context = canvas.getContext("2d");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";

    let requested = false;
    let active = false;
    let frameId = 0;
    let destroyed = false;
    let lastTheme = "";
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

    const colour = (white, alpha, dark) => {
      const w = Math.min(1, Math.max(0, white));
      const grey = Math.round((dark ? 1 - w : w) * 255);
      return `rgba(${grey},${grey},${grey},${alpha})`;
    };

    const snapshot = (time = performance.now()) => ({
      state,
      size,
      frame: resolved.frame(size, (time / 1000) * resolved.speed, resolved.opts),
    });

    const draw = (time = performance.now()) => {
      const dark = document.documentElement.dataset.theme === "dark";
      const frame = snapshot(time).frame;
      lastTheme = dark ? "dark" : "light";
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, size, size);
      for (const line of frame.lines) {
        context.strokeStyle = colour(line.white, line.a ?? 1, dark);
        context.lineWidth = line.w;
        context.beginPath();
        context.moveTo(line.x1, line.y1);
        context.lineTo(line.x2, line.y2);
        context.stroke();
      }
      for (const dot of frame.dots) {
        context.fillStyle = colour(dot.white, dot.a ?? 1, dark);
        context.beginPath();
        context.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        context.fill();
      }
    };

    const destroy = () => {
      if (destroyed) return;
      destroyed = true;
      active = false;
      cancelAnimationFrame(frameId);
      document.removeEventListener("visibilitychange", sync);
      reducedMotion.removeEventListener?.("change", sync);
    };

    const loop = (time) => {
      if (!canvas.isConnected) {
        destroy();
        return;
      }
      draw(time);
      if (active) frameId = requestAnimationFrame(loop);
    };

    function sync() {
      if (destroyed) return;
      const canAnimate = requested && !reducedMotion.matches && document.visibilityState !== "hidden" && canvas.isConnected;
      const theme = document.documentElement.dataset.theme || "light";
      if (canAnimate === active && (active || theme === lastTheme)) return;
      active = canAnimate;
      cancelAnimationFrame(frameId);
      draw(reducedMotion.matches ? 600 / resolved.speed : performance.now());
      if (active) frameId = requestAnimationFrame(loop);
    }

    const setActive = (next) => {
      requested = next;
      sync();
    };

    const setState = (next) => {
      if (destroyed || next === state || !STATE_TO_MODE[next]) return;
      state = next;
      resolved = resolvePreset(state, size);
      if (!active) draw(600 / resolved.speed);
    };

    document.addEventListener("visibilitychange", sync);
    reducedMotion.addEventListener?.("change", sync);
    draw(600 / resolved.speed);
    return { setActive, setState, snapshot, destroy };
  }

  window.ThinkingOrb = { attach, STATES };
})();
