import test from 'node:test';
import assert from 'node:assert/strict';
import { decode, encode, toSerial, fromSerial, validate, days360, addMonths, weekday } from '../src/dates.js';

test('decode M.DY', () => assert.deepEqual(decode(4.152025, false), { year: 2025, month: 4, day: 15 }));
test('decode D.MY', () => assert.deepEqual(decode(15.042025, true), { year: 2025, month: 4, day: 15 }));
test('encode M.DY', () => assert.equal(encode({ year: 2024, month: 3, day: 1 }, false), 3.012024));
test('encode D.MY', () => assert.equal(encode({ year: 2024, month: 3, day: 1 }, true), 1.032024));
test('serial difference across leap Feb', () =>
  assert.equal(toSerial({ year: 2024, month: 3, day: 1 }) - toSerial({ year: 2024, month: 1, day: 1 }), 60));
test('serial round trip', () =>
  assert.deepEqual(fromSerial(toSerial({ year: 2025, month: 12, day: 31 })), { year: 2025, month: 12, day: 31 }));
test('validate rejects Feb 30 with Error 8', () =>
  assert.throws(() => validate(decode(2.302024, false)), e => e.code === 8));
test('days360 basic', () =>
  assert.equal(days360({ year: 2007, month: 11, day: 15 }, { year: 2008, month: 2, day: 15 }), 90));
test('days360 month-end rule', () =>
  assert.equal(days360({ year: 2024, month: 1, day: 31 }, { year: 2024, month: 3, day: 31 }), 60));
test('addMonths back six', () =>
  assert.deepEqual(addMonths({ year: 2017, month: 11, day: 15 }, -6), { year: 2017, month: 5, day: 15 }));
test('addMonths clips day', () =>
  assert.deepEqual(addMonths({ year: 2024, month: 3, day: 31 }, -1), { year: 2024, month: 2, day: 29 }));
test('weekday ISO (Mon=1)', () => assert.equal(weekday({ year: 2024, month: 3, day: 1 }), 5));
