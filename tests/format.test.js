import test from 'node:test';
import assert from 'node:assert/strict';
import { formatFixed, group } from '../src/format.js';

test('groups thousands', () => assert.equal(group('1234567'), '1,234,567'));
test('fixed decimals with grouping', () => assert.equal(formatFixed(1199.1, 2), '1,199.10'));
test('no negative zero', () => assert.equal(formatFixed(-0.001, 2), '0.00'));
test('rounds to zero decimals', () => assert.equal(formatFixed(1234567.891, 0), '1,234,568'));
test('negative', () => assert.equal(formatFixed(-5, 2), '-5.00'));
test('scientific for 1e10 and up', () => assert.equal(formatFixed(12345678901, 2), '1.23e10'));
