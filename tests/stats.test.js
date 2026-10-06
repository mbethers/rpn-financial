import test from 'node:test';
import assert from 'node:assert/strict';
import { createCalc } from '../src/calc.js';
import { run, seq, near } from './helpers.js';

const DATA = '2 enter 1 sigma 4 enter 2 sigma 6 enter 3 sigma'; // points (1,2) (2,4) (3,6)

test('Σ+ returns the count in X', () => assert.equal(run(DATA).x, 3));
test('mean in X and Y', () => {
  const v = run(DATA + ' g 0');
  assert.deepEqual([v.x, v.y], [2, 4]);
});
test('standard deviations', () => {
  const v = run(DATA + ' g dot');
  near(v.x, 1, 1e-9);
  near(v.y, 2, 1e-9);
});
test('ŷ estimate and r', () => {
  const v = run(DATA + ' 4 g 2');
  near(v.x, 8, 1e-9);
  near(v.y, 1, 1e-9);
});
test('x̂ estimate and r', () => {
  const v = run(DATA + ' 10 g 1');
  near(v.x, 5, 1e-9);
  near(v.y, 1, 1e-9);
});
test('weighted mean', () => {
  // values 10 (weight 1) and 20 (weight 3) -> 17.5
  const v = run('1 enter 10 sigma 3 enter 20 sigma g 6');
  near(v.x, 17.5, 1e-9);
});
test('Σ− removes a point', () => {
  const v = run(DATA + ' 3 enter 3 g sigma');
  // (3,3) was never added, but Σ− just subtracts it, so the count drops from 3 to 2
  assert.equal(v.x, 2);
});
test('s with one point is Error 2', () => assert.equal(run('2 enter 1 sigma g dot').display, 'Error 2'));
test('CLEAR Σ resets registers and stack', () => {
  const c = createCalc();
  seq(c, DATA + ' f sst');
  const v = c.view();
  assert.deepEqual([v.regs[1], v.regs[2], v.x], [0, 0, 0]);
});
