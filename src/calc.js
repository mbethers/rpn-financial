import { CalcError } from './errors.js';
import { OPS } from './ops.js';
import { formatFixed, group } from './format.js';
import * as st from './stats.js';
import * as tvm from './tvm.js';
import * as cf from './cashflow.js';
import * as dt from './dates.js';
import * as bonds from './bonds.js';
import * as dep from './depreciation.js';
// <<imports>>

const DIGITS = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
const FIN_KEYS = new Set(['n', 'i', 'pv', 'pmt', 'fv']);
const REG_OPS = { add: '+', sub: '-', mul: '*', div: '/' };
const REG_OP_KEYS = { '+': 'add', '-': 'sub', '*': 'mul', '/': 'div' };
const MAX_MANTISSA = 10;
const zeroFin = () => ({ n: 0, i: 0, pv: 0, pmt: 0, fv: 0 });

const parseEntry = t => {
  const v = Number(t.replace(/e-?$/, ''));
  return Number.isNaN(v) ? 0 : v;
};

function entryDisplay(t) {
  const m = t.match(/^(-?)(\d*)(.*)$/);
  return m[1] + group(m[2] || '0') + m[3];
}

export function createCalc() {
  const s = {
    x: 0, y: 0, z: 0, t: 0, lastx: 0,
    entry: null,      // string while a number is being typed, else null
    lift: false,      // whether the next number lifts the stack
    prefix: null,     // null | 'f' | 'g' | 'sto…' | 'rcl…'
    error: null,
    decimals: 2, begin: false, dmy: false,
    fin: zeroFin(),
    regs: new Array(20).fill(0),   // R0–R9, then R.0–R.9
    cf0: 0, cfs: [], amort: [], dow: null,
    tvmChain: false,  // true right after a TVM key (or g 12x / g 12÷); not snapshotted
  };

  const pushStack = () => { s.t = s.z; s.z = s.y; s.y = s.x; };
  const commit = () => {
    if (s.entry !== null) {
      s.x = parseEntry(s.entry);
      s.entry = null;
      s.lift = true;
    }
  };
  const place = v => { if (s.lift) pushStack(); s.x = v; s.lift = true; };
  const finite = v => { if (!Number.isFinite(v)) throw new CalcError(0); return v; };
  const unary = fn => { commit(); const v = finite(fn(s.x)); s.lastx = s.x; s.x = v; s.lift = true; };
  const binary = fn => {
    commit();
    const v = finite(fn(s.y, s.x));
    s.lastx = s.x; s.x = v; s.y = s.z; s.z = s.t; s.lift = true;
  };
  const withY = fn => { commit(); const v = finite(fn(s.y, s.x)); s.lastx = s.x; s.x = v; s.lift = true; };

  function typeKey(key) {
    if (s.entry === null) {
      if (s.lift) pushStack();
      s.entry = '';
    }
    let e = s.entry;
    if (key === 'dot') {
      if (!e.includes('.') && !e.includes('e')) e += (e === '' || e === '-') ? '0.' : '.';
    } else if (e.includes('e')) {
      if (/e-?\d?$/.test(e)) e += key;
    } else if (e.replace(/\D/g, '').length < MAX_MANTISSA) {
      e = e === '0' ? key : e === '-0' ? '-' + key : e + key;
    }
    s.entry = e;
    s.x = parseEntry(e);
  }

  const P = {}; // plain keys
  const F = {}; // after f
  const G = {}; // after g

  P.chs = () => {
    if (s.entry === null) { s.x = -s.x; return; }
    s.entry = s.entry.includes('e')
      ? s.entry.replace(/e(-?)/, (m, sign) => (sign ? 'e' : 'e-'))
      : s.entry.startsWith('-') ? s.entry.slice(1) : '-' + s.entry;
    s.x = parseEntry(s.entry);
  };
  P.eex = () => {
    if (s.entry === null) { if (s.lift) pushStack(); s.entry = '1'; }
    if (!s.entry.includes('e')) s.entry += 'e';
    s.x = parseEntry(s.entry);
  };
  P.enter = () => { commit(); pushStack(); s.lift = false; };
  P.xy = () => { commit(); [s.x, s.y] = [s.y, s.x]; s.lift = true; };
  P.rdown = () => { commit(); [s.x, s.y, s.z, s.t] = [s.y, s.z, s.t, s.x]; s.lift = true; };
  P.clx = () => { s.x = 0; s.entry = null; s.lift = false; };
  for (const k of ['add', 'sub', 'mul', 'div', 'yx']) P[k] = () => binary(OPS[k]);
  P.recip = () => unary(x => OPS.div(1, x));
  P.pct = () => withY((y, x) => y * x / 100);
  P.dpct = () => withY((y, x) => { if (y === 0) throw new CalcError(0); return (x - y) / y * 100; });
  P.pct_t = () => withY((y, x) => { if (y === 0) throw new CalcError(0); return x / y * 100; });
  P.sigma = () => {
    commit();
    st.add(s.regs, s.x, s.y, 1);
    s.lastx = s.x; s.x = s.regs[1]; s.lift = false;
  };
  for (const k of FIN_KEYS) {
    P[k] = () => {
      if (s.entry !== null || !s.tvmChain) { commit(); s.fin[k] = s.x; s.tvmChain = true; return; }
      const v = tvm.solveTvm(k, { ...s.fin, begin: s.begin });
      s.fin[k] = v;
      place(v);
      s.tvmChain = true;
    };
  }
  // <<plain-handlers>>

  F.pmt = () => unary(x => {
    const m = 10 ** s.decimals;
    return Math.sign(x) * Math.round(Math.abs(x) * m) / m;
  });
  F.clx = () => {
    s.x = s.y = s.z = s.t = s.lastx = 0;
    s.regs.fill(0);
    s.fin = zeroFin();
    s.cf0 = 0; s.cfs = []; s.amort = [];
    s.entry = null; s.lift = false;
  };
  F.sst = () => { s.regs.fill(0, 1, 7); s.x = s.y = s.z = s.t = 0; s.entry = null; s.lift = false; };
  F.i = () => {
    commit();
    const old = s.x;
    const i360 = finite(tvm.simpleInterest(s.fin));
    const i365 = finite(tvm.simpleInterest365(s.fin));
    place(i365);
    place(-s.fin.pv);
    place(i360);
    s.lastx = old;
  };
  F.xy = () => { s.fin = zeroFin(); };
  F.pv = () => unary(() => cf.npv(s.fin.i / 100, s.cf0, s.cfs));
  F.fv = () => unary(() => {
    const r = cf.irr(s.cf0, s.cfs);
    s.fin.i = r;
    return r;
  });
  F.n = () => {
    commit();
    const count = Math.trunc(s.x);
    if (count < 1 || count > 1200) throw new CalcError(5);
    const r = cf.amortize({ ...s.fin, begin: s.begin }, count, s.decimals);
    s.lastx = s.x;
    s.x = r.interest; s.y = r.principal; s.z = count;
    s.fin.pv = r.pv; s.fin.n = r.n;
    s.amort = r.rows.slice(0, 60);
    s.lift = true;
  };
  const dateOf = v => dt.validate(dt.decode(v, s.dmy));
  F.yx = () => {
    commit();
    const r = bonds.bondPrice({
      settle: dateOf(s.y), mat: dateOf(s.x), yieldPct: s.fin.i, couponPct: s.fin.pmt,
    });
    s.lastx = s.x; s.x = r.price; s.y = r.accrued; s.lift = true;
  };
  F.recip = () => {
    commit();
    const y = bonds.bondYield({
      settle: dateOf(s.y), mat: dateOf(s.x), couponPct: s.fin.pmt, price: s.fin.pv,
    });
    s.lastx = s.x; s.x = y; s.lift = true;
  };
  const depKey = fn => () => {
    commit();
    const r = fn({ cost: s.fin.pv, salvage: s.fin.fv, life: s.fin.n, factorPct: s.fin.i }, Math.trunc(s.x));
    s.lastx = s.x; s.x = r.dep; s.y = r.rdv; s.lift = true;
  };
  F.pct_t = depKey(dep.depSL);
  F.dpct = depKey(dep.depSOYD);
  F.pct = depKey(dep.depDB);
  // <<f-handlers>>

  G.yx = () => unary(x => { if (x < 0) throw new CalcError(0); return Math.sqrt(x); });
  G.recip = () => unary(x => {
    const v = Math.exp(x);
    if (!Number.isFinite(v)) throw new CalcError(0);
    return v;
  });
  G.pct_t = () => unary(x => { if (x <= 0) throw new CalcError(0); return Math.log(x); });
  G.dpct = () => unary(x => x - Math.trunc(x));
  G.pct = () => unary(Math.trunc);
  G['3'] = () => unary(x => {
    if (!Number.isInteger(x) || x < 0 || x > 69) throw new CalcError(0);
    let f = 1;
    for (let k = 2; k <= x; k++) f *= k;
    return f;
  });
  G.enter = () => { commit(); place(s.lastx); };
  G.sigma = () => {
    commit();
    st.add(s.regs, s.x, s.y, -1);
    s.lastx = s.x; s.x = s.regs[1]; s.lift = false;
  };
  G['0'] = () => { commit(); const m = st.mean(s.regs); s.lastx = s.x; s.x = m.x; s.y = m.y; s.lift = true; };
  G.dot = () => { commit(); const d = st.stdev(s.regs); s.lastx = s.x; s.x = d.x; s.y = d.y; s.lift = true; };
  G['6'] = () => unary(() => st.weightedMean(s.regs));
  G['1'] = () => { commit(); const e = st.estimateX(s.regs, s.x); s.lastx = s.x; s.x = e.est; s.y = e.r; s.lift = true; };
  G['2'] = () => { commit(); const e = st.estimateY(s.regs, s.x); s.lastx = s.x; s.x = e.est; s.y = e.r; s.lift = true; };
  G.n = () => { unary(x => { s.fin.n = x * 12; return x * 12; }); s.tvmChain = true; };
  G.i = () => { unary(x => { s.fin.i = x / 12; return x / 12; }); s.tvmChain = true; };
  G['7'] = () => { commit(); s.begin = true; };
  G['8'] = () => { commit(); s.begin = false; };
  G.pv = () => { commit(); s.cf0 = s.x; s.cfs = []; s.lift = true; };
  G.pmt = () => {
    commit();
    if (s.cfs.length >= 20) throw new CalcError(6);
    s.cfs.push({ amt: s.x, n: 1 });
    s.lift = true;
  };
  G.fv = () => {
    commit();
    const n = Math.trunc(s.x);
    if (!s.cfs.length || n < 1 || n > 99) throw new CalcError(6);
    s.cfs[s.cfs.length - 1].n = n;
    s.lift = true;
  };
  G['4'] = () => { commit(); s.dmy = true; };
  G['5'] = () => { commit(); s.dmy = false; };
  G.chs = () => {
    commit();
    const target = dt.fromSerial(dt.toSerial(dateOf(s.y)) + Math.trunc(s.x));
    dt.validate(target);
    s.lastx = s.x;
    s.x = dt.encode(target, s.dmy);
    s.dow = dt.weekday(target);
    s.y = s.z; s.z = s.t;
    s.lift = true;
  };
  G.eex = () => {
    commit();
    const a = dateOf(s.y);
    const b = dateOf(s.x);
    const actual = dt.toSerial(b) - dt.toSerial(a);
    const d360 = dt.days360(a, b);
    s.lastx = s.x; s.x = actual; s.y = d360; s.lift = true;
  };
  // <<g-handlers>>

  function storage(pre, key) {
    const kind = pre.slice(0, 3);
    const rest = pre.slice(3);
    if (kind === 'sto' && rest === '' && REG_OPS[key]) { s.prefix = pre + REG_OPS[key]; return; }
    if (key === 'dot' && !rest.includes('.')) { s.prefix = pre + '.'; return; }
    if (FIN_KEYS.has(key) && rest === '') {
      commit();
      if (kind === 'sto') s.fin[key] = s.x; else place(s.fin[key]);
      return;
    }
    if (DIGITS.has(key)) {
      commit();
      const idx = (rest.includes('.') ? 10 : 0) + Number(key);
      const op = rest.replace('.', '');
      if (kind === 'rcl') { place(s.regs[idx]); return; }
      s.regs[idx] = op === '' ? s.x : OPS[REG_OP_KEYS[op]](s.regs[idx], s.x);
    }
  }

  function dispatch(key) {
    if (s.error !== null) { s.error = null; s.tvmChain = false; return; }
    s.dow = null; // only the DATE handler (g chs) sets it again
    const pre = s.prefix;
    s.prefix = null;
    if (key === 'f' || key === 'g') { s.prefix = key === pre ? null : key; return; }
    if (key === 'sto' || key === 'rcl') { s.prefix = key; return; }
    // tvmChain survives f/g shifts, decimals, BEG and END; TVM handlers set it true
    if (pre === 'f') {
      if (DIGITS.has(key)) { commit(); s.decimals = Number(key); return; }
      s.tvmChain = false;
      if (F[key]) F[key]();
      return;
    }
    if (pre === 'g') {
      if (key === '7' || key === '8') { G[key](); return; }
      s.tvmChain = false;
      if (G[key]) G[key]();
      return;
    }
    if (!(FIN_KEYS.has(key) && !pre)) s.tvmChain = false;
    if (pre) { storage(pre, key); return; }
    if (DIGITS.has(key) || key === 'dot') { typeKey(key); return; }
    if (P[key]) P[key]();
  }

  const view = () => ({
    display: s.error !== null ? `Error ${s.error}`
      : s.entry !== null ? entryDisplay(s.entry)
      : formatFixed(s.x, s.decimals),
    x: s.x, y: s.y, z: s.z, t: s.t, lastx: s.lastx,
    prefix: s.prefix, decimals: s.decimals, begin: s.begin, dmy: s.dmy,
    fin: { ...s.fin }, regs: [...s.regs], cf0: s.cf0,
    cfs: s.cfs.map(c => ({ ...c })), amort: s.amort.slice(0, 60).map(r => ({ ...r })),
    error: s.error, dow: s.dow,
  });

  const fail = code => { s.error = code; s.entry = null; s.prefix = null; s.tvmChain = false; };

  return {
    press(key) {
      try { dispatch(key); } catch (e) {
        if (!(e instanceof CalcError)) throw e;
        fail(e.code);
      }
      return view();
    },
    view,
    inject(v) { commit(); place(v); },
    fail,
    snapshot() {
      const { x, y, z, t, lastx, decimals, begin, dmy, fin, regs, cf0, cfs } = s;
      return JSON.parse(JSON.stringify({ x, y, z, t, lastx, decimals, begin, dmy, fin, regs, cf0, cfs }));
    },
    restore(o) {
      Object.assign(s, JSON.parse(JSON.stringify(o)), { entry: null, prefix: null, error: null, amort: [], tvmChain: false });
      s.lift = true;
    },
  };
}
