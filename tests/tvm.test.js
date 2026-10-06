import test from 'node:test';
import assert from 'node:assert/strict';
import { solveTvm } from '../src/tvm.js';
import { run, near } from './helpers.js';

const mortgage = { n: 360, i: 0.5, pv: 200000, pmt: 0, fv: 0, begin: false };

test('PMT of a 30-year 6% loan', () => near(solveTvm('pmt', mortgage), -1199.1, 0.01));
test('PV from payment', () => near(solveTvm('pv', { ...mortgage, pmt: -1199.1 }), 200000, 0.5));
test('FV of monthly savings (END)', () =>
  near(solveTvm('fv', { n: 12, i: 1, pv: 0, pmt: -100, fv: 0, begin: false }), 1268.25, 0.005));
test('FV of monthly savings (BEG)', () =>
  near(solveTvm('fv', { n: 12, i: 1, pv: 0, pmt: -100, fv: 0, begin: true }), 1280.93, 0.01));
test('n rounds up to whole periods', () =>
  assert.equal(solveTvm('n', { n: 0, i: 1, pv: -1000, pmt: 0, fv: 1104.62, begin: false }), 10));
test('i solved from payment', () =>
  near(solveTvm('i', { n: 360, i: 0, pv: 200000, pmt: -1199.1, fv: 0, begin: false }), 0.5, 0.001));
test('zero interest', () =>
  assert.equal(solveTvm('pmt', { n: 10, i: 0, pv: 1000, pmt: 0, fv: 0, begin: false }), -100));
test('impossible n is Error 5', () =>
  assert.throws(() => solveTvm('n', { n: 0, i: 1, pv: 1000, pmt: 0, fv: 1000, begin: false }), e => e.code === 5));

test('keys: mortgage payment', () => near(run('360 n 0.5 i 200000 pv pmt').x, -1199.1, 0.01));
test('keys: solve i', () => near(run('360 n 200000 pv -1199.1 pmt i').x, 0.5, 0.001));
test('keys: solve n', () => assert.equal(run('1 i -1000 pv 1104.62 fv n').x, 10));
test('keys: BEG mode', () => near(run('12 n 1 i -100 pmt g 7 fv').x, 1280.93, 0.01));
test('keys: END mode restores', () => near(run('12 n 1 i -100 pmt g 7 g 8 fv').x, 1268.25, 0.01));
test('keys: 12×', () => {
  const v = run('30 g n');
  assert.deepEqual([v.x, v.fin.n], [360, 360]);
});
test('keys: 12÷', () => {
  const v = run('6 g i');
  assert.deepEqual([v.x, v.fin.i], [0.5, 0.5]);
});
test('keys: RCL PV', () => assert.equal(run('5000 pv clx rcl pv').x, 5000));
test('keys: simple interest', () => near(run('60 n 12 i -1000 pv f i').x, 20, 1e-9));
test('keys: CLEAR FIN', () => assert.deepEqual(run('5 n 6 i f xy').fin, { n: 0, i: 0, pv: 0, pmt: 0, fv: 0 }));
