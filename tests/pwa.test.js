import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

test('service worker precaches every src module', () => {
  for (const f of readdirSync(new URL('../src/', import.meta.url))) {
    assert.ok(sw.includes(`'src/${f}'`), `sw.js is missing src/${f}`);
  }
});
test('service worker precaches the shell files', () => {
  for (const f of ['index.html', 'style.css', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']) {
    assert.ok(sw.includes(`'${f}'`), `sw.js is missing ${f}`);
  }
});
test('manifest is valid and icons exist', () => {
  const m = JSON.parse(readFileSync(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));
  assert.equal(m.display, 'standalone');
  for (const icon of m.icons) assert.ok(existsSync(new URL(`../${icon.src}`, import.meta.url)), icon.src);
});
test('app makes no external requests', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(!/https?:\/\//.test(html.replace('<!doctype html>', '')));
});
