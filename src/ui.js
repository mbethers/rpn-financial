import { createCalc } from './calc.js';
import { createAlgebraic } from './algebraic.js';
import { formatFixed } from './format.js';
import { KEYS } from './keys.js';

const $ = id => document.getElementById(id);
const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, v) { try { localStorage.setItem(key, v); } catch { /* storage unavailable */ } },
};

const calc = createCalc();
const alg = createAlgebraic(calc);
let algebraic = store.get('rpnfin.alg') === '1';
try {
  const saved = store.get('rpnfin.state');
  if (saved) {
    const o = JSON.parse(saved);
    const ok = o && Array.isArray(o.regs) && o.regs.length === 20 && Array.isArray(o.cfs)
      && o.fin && typeof o.fin === 'object'
      && ['n', 'i', 'pv', 'pmt', 'fv'].every(k => Number.isFinite(o.fin[k]))
      && o.regs.every(Number.isFinite)
      && o.cfs.every(c => c && Number.isFinite(c.amt) && Number.isFinite(c.n))
      && Number.isFinite(o.cf0) && Number.isFinite(o.decimals)
      && ['x', 'y', 'z', 't', 'lastx'].every(k => Number.isFinite(o[k]));
    if (ok) calc.restore(o);
  }
} catch { /* ignore corrupt saved state */ }

const keysEl = $('keys');
for (const k of KEYS) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'key' + (k.id === 'f' ? ' fkey' : '') + (k.id === 'g' ? ' gkey' : '') + (k.id === 'enter' ? ' enter' : '');
  b.dataset.key = k.id;
  b.setAttribute('aria-label', k.help[0] ? `${k.face}: ${k.help[0]}` : k.face);
  b.innerHTML = `<span class="f" aria-hidden="true">${k.f}</span><span class="face">${k.face}</span><span class="g" aria-hidden="true">${k.g}</span>`;
  keysEl.appendChild(b);
}

function renderPanel(v) {
  const f = n => formatFixed(n, v.decimals);
  const row = (a, b) => `<div class="row"><span>${a}</span><span>${b}</span></div>`;
  let h = '<h4>Stack</h4>' + [['T', v.t], ['Z', v.z], ['Y', v.y], ['X', v.x], ['LSTx', v.lastx]]
    .map(([a, b]) => row(a, f(b))).join('');
  h += '<h4>Financial</h4>' + ['n', 'i', 'pv', 'pmt', 'fv']
    .map(key => row(key.toUpperCase(), formatFixed(v.fin[key], 4))).join('');
  const used = v.regs.map((r, idx) => [idx, r]).filter(([, r]) => r !== 0);
  if (used.length) {
    h += '<h4>Registers</h4>' + used
      .map(([idx, r]) => row(idx < 10 ? `R${idx}` : `R.${idx - 10}`, formatFixed(r, 4))).join('');
  }
  if (v.cfs.length || v.cf0) {
    h += '<h4>Cash flows</h4>' + row('CF0', f(v.cf0))
      + v.cfs.map((c, k) => row(`CF${k + 1} ×${Number(c.n)}`, f(c.amt))).join('');
  }
  if (v.amort.length) {
    h += '<h4>Amortization (last run)</h4>' + v.amort.slice(0, 60)
      .map(r => row(`#${r.k}`, `int ${f(r.interest)} · prin ${f(r.principal)} · bal ${f(r.balance)}`)).join('');
  }
  if (v.dow) h += '<h4>Last DATE weekday</h4>' + row('Mon=1 … Sun=7', String(v.dow));
  $('panel').innerHTML = h;
}

function render() {
  const v = (algebraic ? alg : calc).view();
  $('digits').textContent = v.display;
  const ann = [];
  if (v.prefix === 'f') ann.push('f');
  if (v.prefix === 'g') ann.push('g');
  if (v.prefix && v.prefix.startsWith('sto')) ann.push('STO');
  if (v.prefix && v.prefix.startsWith('rcl')) ann.push('RCL');
  if (v.begin) ann.push('BEG');
  if (v.dmy) ann.push('D.MY');
  $('ann').textContent = ann.join('  ');
  $('expr').textContent = v.expr || '';
  document.querySelector('[data-key="f"]').classList.toggle('active-shift', v.prefix === 'f');
  document.querySelector('[data-key="g"]').classList.toggle('active-shift', v.prefix === 'g');
  $('algBtn').textContent = algebraic ? 'Entry: ALG' : 'Entry: RPN';
  if (!$('panel').hidden) renderPanel(v);
}

function press(key) {
  (algebraic ? alg : calc).press(key);
  store.set('rpnfin.state', JSON.stringify(calc.snapshot()));
  render();
}

let helpTimer = null;
const hideHelp = () => { clearTimeout(helpTimer); $('help').hidden = true; };
function showHelp(id) {
  const key = KEYS.find(x => x.id === id);
  const [p, f, g] = key.help;
  $('help').textContent = [p && `${key.face}: ${p}`, f && `f: ${f}`, g && `g: ${g}`].filter(Boolean).join('\n');
  $('help').hidden = false;
  clearTimeout(helpTimer);
  helpTimer = setTimeout(hideHelp, 6000);
}

const active = new Map();
const clearActive = id => {
  const a = active.get(id);
  if (a) { clearTimeout(a.timer); active.delete(id); }
  return a;
};
keysEl.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const b = e.target.closest('.key');
  if (!b) return;
  hideHelp();
  clearActive(e.pointerId);
  const rec = { key: b, longFired: false, timer: null };
  rec.timer = setTimeout(() => { rec.longFired = true; showHelp(b.dataset.key); }, 500);
  active.set(e.pointerId, rec);
});
keysEl.addEventListener('pointerup', e => {
  const rec = clearActive(e.pointerId);
  if (!rec || rec.longFired) return;
  const under = document.elementFromPoint(e.clientX, e.clientY);
  if (!under || under.closest('.key') !== rec.key) return;
  hideHelp();
  if (navigator.vibrate) navigator.vibrate(8);
  press(rec.key.dataset.key);
});
keysEl.addEventListener('pointercancel', e => { clearActive(e.pointerId); });
keysEl.addEventListener('click', e => {
  if (e.detail !== 0) return;
  const b = e.target.closest('.key');
  if (b) press(b.dataset.key);
});
keysEl.addEventListener('contextmenu', e => e.preventDefault());

$('panelBtn').addEventListener('click', () => { $('panel').hidden = !$('panel').hidden;
  $('panelBtn').setAttribute('aria-expanded', String(!$('panel').hidden));
  render();
});
$('algBtn').addEventListener('click', () => {
  algebraic = !algebraic;
  store.set('rpnfin.alg', algebraic ? '1' : '0');
  alg.press('on');
  render();
});

const KEYMAP = { Enter: 'enter', Backspace: 'clx', '+': 'add', '-': 'sub', '*': 'mul', '/': 'div', '.': 'dot', '^': 'yx' };
document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target.tagName === 'BUTTON' && !e.target.closest('.keys')) return;
  const key = /^[0-9]$/.test(e.key) ? e.key : KEYMAP[e.key];
  if (key) { e.preventDefault(); press(key); }
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
render();
