export const group = s => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export function formatFixed(x, d) {
  if (Math.abs(x) >= 1e10) return x.toExponential(d).replace('e+', 'e');
  const s = Math.abs(x).toFixed(d);
  const [int, frac] = s.split('.');
  const neg = x < 0 && Number(s) !== 0;
  return (neg ? '-' : '') + group(int) + (frac ? '.' + frac : '');
}
