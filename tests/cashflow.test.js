import test from 'node:test';
import assert from 'node:assert/strict';
import { npv, irr, amortize } from '../src/cashflow.js';
import { run, near } from './helpers.js';

test('NPV of a single flow at its IRR is zero', () => near(npv(0.1, -100, [{ amt: 110, n: 1 }]), 0, 1e-9));
test('NPV with repeated flows', () => near(npv(0.1, -1000, [{ amt: 500, n: 3 }]), 243.43, 0.005));
test('IRR of -100, 60, 60', () => near(irr(-100, [{ amt: 60, n: 2 }]), 13.0662, 0.001));
test('IRR with no sign change is Error 7', () =>
  assert.throws(() => irr(100, [{ amt: 50, n: 1 }]), e => e.code === 7));

test('amortize first month of a 30-year loan', () => {
  const r = amortize({ pv: 200000, pmt: -1199.1, i: 0.5, begin: false, n: 360 }, 1, 2);
  near(r.interest, -1000, 0.005);
  near(r.principal, -199.1, 0.005);
  near(r.pv, 199800.9, 0.005);
  assert.equal(r.n, 361);
  assert.equal(r.rows.length, 1);
});
test('amortize 12 months', () => {
  const r = amortize({ pv: 200000, pmt: -1199.1, i: 0.5, begin: false, n: 0 }, 12, 2);
  assert.equal(r.rows.length, 12);
  near(r.interest + r.principal, -1199.1 * 12, 0.005);
});
test('BEG mode first payment has no interest', () => {
  const r = amortize({ pv: 1000, pmt: -100, i: 1, begin: true, n: 0 }, 1, 2);
  assert.equal(r.interest, 0);
  near(r.principal, -100, 1e-9);
});

test('keys: NPV', () => near(run('-100 g pv 110 g pmt 10 i f pv').x, 0, 1e-9));
test('keys: IRR with Nj', () => near(run('-100 g pv 60 g pmt 2 g fv f fv').x, 13.0662, 0.001));
test('keys: IRR stores into i', () => near(run('-100 g pv 110 g pmt f fv').fin.i, 10, 1e-6));
test('keys: Nj without a CFj is Error 6', () => assert.equal(run('3 g fv').display, 'Error 6'));
test('keys: AMORT', () => {
  const v = run('360 n 0.5 i 200000 pv -1199.1 pmt 1 f n');
  near(v.x, -1000, 0.005);
  near(v.y, -199.1, 0.005);
  near(v.fin.pv, 199800.9, 0.005);
  assert.equal(v.amort.length, 1);
});
test('keys: CLEAR REG empties cash flows and amortization', () => {
  const v = run('-100 g pv 110 g pmt f clx');
  assert.deepEqual([v.cf0, v.cfs.length, v.amort.length], [0, 0, 0]);
});
