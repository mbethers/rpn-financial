import { OPS } from './ops.js';
import { CalcError } from './errors.js';

const PREC = { add: 1, sub: 1, mul: 2, div: 2, yx: 3 };
const SYMBOL = { add: '+', sub: '−', mul: '×', div: '÷', yx: '^' };

export function evaluate(nums, ops) {
  const vals = [nums[0]];
  const stack = [];
  const apply = () => {
    const b = vals.pop();
    const a = vals.pop();
    vals.push(OPS[stack.pop()](a, b));
  };
  for (let k = 0; k < ops.length; k++) {
    const op = ops[k];
    while (stack.length) {
      const top = stack[stack.length - 1];
      if (PREC[top] > PREC[op] || (PREC[top] === PREC[op] && op !== 'yx')) apply(); else break;
    }
    stack.push(op);
    vals.push(nums[k + 1]);
  }
  while (stack.length) apply();
  return vals[0];
}

export function createAlgebraic(calc) {
  let nums = [];
  let ops = [];
  let awaiting = false; // an operator was just pressed and no operand typed yet

  const reset = () => { nums = []; ops = []; awaiting = false; };
  const view = () => ({
    ...calc.view(),
    expr: nums.map((n, k) => (ops[k] ? `${n} ${SYMBOL[ops[k]]}` : String(n))).join(' '),
  });

  function press(key) {
    const pending = calc.view().prefix;
    if (!pending && key in PREC) {
      if (awaiting) {
        ops[ops.length - 1] = key;
      } else {
        nums.push(calc.view().x);
        ops.push(key);
        calc.press('clx');
        awaiting = true;
      }
      return view();
    }
    if (!pending && key === 'enter' && ops.length) {
      nums.push(awaiting ? nums[nums.length - 1] : calc.view().x);
      try {
        const result = evaluate(nums, ops);
        reset();
        calc.press('clx');
        calc.inject(result);
      } catch (e) {
        if (!(e instanceof CalcError)) throw e;
        reset();
        calc.fail(e.code);
      }
      return view();
    }
    if (key === 'on' || ['n', 'i', 'pv', 'pmt', 'fv'].includes(key)
      || (pending === 'f' && ['clx', 'sst', 'xy'].includes(key))) reset();
    if (/^[0-9]$/.test(key) || key === 'dot' || key === 'eex') awaiting = false;
    calc.press(key);
    return view();
  }

  return { press, view };
}
