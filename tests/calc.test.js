import test from 'node:test';
import assert from 'node:assert/strict';
import { createCalc } from '../src/calc.js';
import { run, seq, near } from './helpers.js';

test('add', () => assert.equal(run('5 enter 3 add').x, 8));
test('RPN chain', () => assert.equal(run('2 enter 3 add 4 mul').x, 20));
test('stack fills X Y Z T', () => {
  const v = run('1 enter 2 enter 3 enter 4');
  assert.deepEqual([v.x, v.y, v.z, v.t], [4, 3, 2, 1]);
});
test('roll down', () => {
  const v = run('1 enter 2 enter 3 enter 4 rdown');
  assert.deepEqual([v.x, v.y, v.z, v.t], [3, 2, 1, 4]);
});
test('x<>y', () => {
  const v = run('1 enter 2 xy');
  assert.deepEqual([v.x, v.y], [1, 2]);
});
test('digit after ENTER overwrites X', () => {
  const v = run('5 enter 7');
  assert.deepEqual([v.x, v.y], [7, 5]);
});
test('LSTx recalls last X', () => assert.equal(run('5 enter 3 sub g enter').x, 3));
test('CLx', () => assert.equal(run('5 clx').x, 0));

test('decimals via f digit', () => assert.equal(run('f 4 1 enter 3 div').display, '0.3333'));
test('default 2 decimals', () => assert.equal(run('2 enter 3 div').display, '0.67'));
test('RND rounds X to display digits', () => assert.equal(run('2 enter 3 div f pmt').x, 0.67));

test('STO / RCL', () => assert.equal(run('42 sto 5 clx rcl 5').x, 42));
test('STO arithmetic', () => assert.equal(run('10 sto 1 5 sto add 1 rcl 1').x, 15));
test('dot registers', () => assert.equal(run('7 sto dot 3 clx rcl dot 3').x, 7));

test('percent keeps Y', () => {
  const v = run('200 enter 15 pct');
  assert.deepEqual([v.x, v.y], [30, 200]);
});
test('delta percent', () => assert.equal(run('80 enter 100 dpct').x, 25));
test('percent of total', () => assert.equal(run('200 enter 50 pct_t').x, 25));

test('divide by zero shows Error 0 and next key clears it', () => {
  const c = createCalc();
  seq(c, '1 enter 0 div');
  assert.equal(c.view().display, 'Error 0');
  c.press('clx');
  assert.equal(c.view().display, '0.00');
});
test('negative sqrt is Error 0', () => assert.equal(run('1 chs g yx').display, 'Error 0'));

test('CHS during entry', () => {
  const c = createCalc();
  seq(c, '5 chs');
  assert.equal(c.view().display, '-5');
  c.press('enter');
  assert.equal(c.view().display, '-5.00');
});
test('entry shows thousands separators', () => assert.equal(run('1234').display, '1,234'));
test('EEX', () => assert.equal(run('1 eex 3 enter').x, 1000));
test('EEX negative exponent', () => near(run('2 eex chs 2 enter').x, 0.02, 1e-12));
test('entry limited to 10 digits', () => assert.equal(run('123456789012').x, 1234567890));

test('square root', () => assert.equal(run('9 g yx').x, 3));
test('power', () => assert.equal(run('2 enter 10 yx').x, 1024));
test('reciprocal', () => assert.equal(run('4 recip').x, 0.25));
test('e^x', () => assert.equal(run('0 g recip').x, 1));
test('ln', () => assert.equal(run('1 g pct_t').x, 0));
test('frac / intg', () => {
  near(run('2.75 g dpct').x, 0.75, 1e-12);
  assert.equal(run('2.75 g pct').x, 2);
});
test('factorial', () => assert.equal(run('5 g 3').x, 120));

test('snapshot / restore', () => {
  const a = createCalc();
  seq(a, '42 sto 3 7');
  const b = createCalc();
  b.restore(JSON.parse(JSON.stringify(a.snapshot())));
  assert.equal(b.view().regs[3], 42);
  assert.equal(b.view().x, 7);
});
test('restore lifts the stack on the next digit', () => {
  const a = createCalc();
  seq(a, '2 enter 3 add');
  const b = createCalc();
  b.restore(JSON.parse(JSON.stringify(a.snapshot())));
  b.press('4');
  assert.equal(b.view().y, 5);
  assert.equal(b.view().x, 4);
});
test('inject places a value in X', () => {
  const c = createCalc();
  seq(c, '5 clx');
  c.inject(9);
  assert.equal(c.view().x, 9);
});
test('fail shows error code', () => {
  const c = createCalc();
  c.fail(3);
  assert.equal(c.view().display, 'Error 3');
});
test('CLEAR REG', () => {
  const v = run('5 sto 1 f clx');
  assert.deepEqual([v.x, v.regs[1]], [0, 0]);
});
