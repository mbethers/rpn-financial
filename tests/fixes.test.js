import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createCalc } from '../src/calc.js';
import { createAlgebraic } from '../src/algebraic.js';
import { solveTvm } from '../src/tvm.js';
import { irr, npv } from '../src/cashflow.js';
import { run, near, seq } from './helpers.js';

// 1. TVM store vs solve
test('100 enter 2 mul pv stores X', () => {
  const v = run('100 enter 2 mul pv');
  assert.equal(v.fin.pv, 200);
  assert.equal(v.x, 200);
});
test('30 enter 12 mul n stores n=360, then pmt solves', () => {
  const v = run('30 enter 12 mul n');
  assert.equal(v.fin.n, 360);
  const w = run('30 enter 12 mul n 0.5 i 200000 pv pmt');
  near(w.x, -1199.1, 0.01);
});
test('standard flows', () => {
  near(run('360 n 0.5 i 200000 pv pmt').x, -1199.1, 0.01);
  const v = run('12 n 1 i -100 pmt g 7 fv');
  near(v.x, 1280.93, 0.01);
  assert.equal(run('1 i -1000 pv 1104.62 fv n').x, 10);
  near(run('360 n 200000 pv -1199.1 pmt i').x, 0.5, 0.001);
});
test('rcl then TVM key stores', () => assert.equal(run('5 sto 1 rcl 1 n').fin.n, 5));
test('clx then TVM key stores 0', () => assert.equal(run('5 pv clx pv').fin.pv, 0));
test('f/g shifts and decimals leave the chain intact', () => {
  const c = createCalc();
  seq(c, '360 n 0.5 i 200000 pv f 2 pmt');
  near(c.view().x, -1199.1, 0.01);
});
test('ALG: 30 x 12 = n stores', () => {
  const a = createAlgebraic(createCalc());
  for (const k of ['3', '0', 'mul', '1', '2', 'enter', 'n']) a.press(k);
  assert.equal(a.view().fin.n, 360);
});
test('restore resets the chain', () => {
  const c = createCalc();
  seq(c, '5 pv');
  const snap = c.snapshot();
  const d = createCalc();
  d.restore(snap);
  seq(d, '7 enter 2 mul pv');
  assert.equal(d.view().fin.pv, 14);
});

// 2. INT stack
test('f INT puts 360-day interest in X and principal in Y', () => {
  assert.equal(run('60 n 7 i 450 chs pv f i add').x, 455.25);
});
test('f INT Z holds the 365-day interest', () => {
  const v = run('60 n 7 i 450 chs pv f i');
  near(v.x, 5.25, 1e-9);
  assert.equal(v.y, 450);
  near(v.z, 450 * 60 * 7 / 36500, 1e-9);
});

// 3. AMORT
test('amort over 1200 is Error 5', () => assert.equal(run('2000000 f n').display, 'Error 5'));
test('amort caps stored rows at 60', () => {
  const v = run('360 n 0.5 i 200000 pv pmt 360 f n');
  assert.equal(v.amort.length, 60);
});

// 5. i at exactly 0%
test('solve i at 0%', () =>
  assert.equal(solveTvm('i', { n: 10, pv: 1000, pmt: -100, fv: 0, begin: false }), 0));

// 6. IRR NaN
test('irr does not report -99 for NaN scan points', () => {
  const groups = [{ amt: 50, n: 99 }, { amt: 50, n: 99 }, { amt: -10, n: 1 }];
  let r;
  try { r = irr(-1000, groups); } catch (e) { assert.equal(e.code, 7); return; }
  // the old code returned -99 (NaN scan point read as a sign change); the true root is ~-83.33%,
  // confirmed independently: NPV changes sign across it
  assert.ok(r > -90, `got ${r}`);
  assert.ok(npv(r / 100 - 1e-6, -1000, groups) < 0 && npv(r / 100 + 1e-6, -1000, groups) > 0);
});

// 7. Service worker
test('every sw.js FILES entry exists on disk', () => {
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const block = sw.match(/const FILES = \[([\s\S]*?)\];/)[1];
  const files = [...block.matchAll(/'([^']+)'/g)].map(m => m[1]).filter(f => f !== './');
  assert.ok(files.length > 10);
  for (const f of files) assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), f);
});

// 8. Algebraic stale expression
const algPress = (a, str) => { for (const k of str.trim().split(/\s+/)) a.press(/^\d$/.test(k) ? k : k); return a; };
test('f clx clears pending expression', () => {
  const a = algPress(createAlgebraic(createCalc()), '5 add f clx');
  assert.equal(a.view().expr, '');
  algPress(a, '2 enter');
  assert.equal(a.view().y, 2);
});
test('TVM key clears pending expression', () => {
  const a = algPress(createAlgebraic(createCalc()), '5 add 3 n');
  assert.equal(a.view().expr, '');
});
test('f sst clears pending expression', () => {
  const a = algPress(createAlgebraic(createCalc()), '5 add f sst');
  assert.equal(a.view().expr, '');
});

// 10. Overflow
test('overflow is Error 0', () => assert.equal(run('9 eex 99 enter 9 eex 99 mul enter mul').display, 'Error 0'));

// 13. Negative n
test('negative n is Error 5', () =>
  assert.equal(run('1 i 1000 pv -500 fv 0 pmt n').display, 'Error 5'));
