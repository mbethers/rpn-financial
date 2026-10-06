import { CalcError } from './errors.js';

const DAY_MS = 86400000;

export function decode(x, dmy) {
  const ip = Math.trunc(x);
  const frac = Math.round((x - ip) * 1e6);
  const dd = Math.trunc(frac / 10000);
  const year = frac % 10000;
  return dmy ? { year, month: dd, day: ip } : { year, month: ip, day: dd };
}

export function encode({ year, month, day }, dmy) {
  const a = dmy ? day : month;
  const b = dmy ? month : day;
  return Number((a + b / 100 + year / 1e6).toFixed(6));
}

export const toSerial = ({ year, month, day }) => Math.round(Date.UTC(year, month - 1, day) / DAY_MS);

export function fromSerial(n) {
  const d = new Date(n * DAY_MS);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function validate(dt) {
  const back = fromSerial(toSerial(dt));
  const ok = back.year === dt.year && back.month === dt.month && back.day === dt.day;
  if (!ok || dt.year < 1582 || dt.year > 9999) throw new CalcError(8);
  return dt;
}

export function days360(a, b) {
  let d1 = a.day;
  let d2 = b.day;
  if (d1 === 31) d1 = 30;
  if (d2 === 31 && d1 >= 30) d2 = 30;
  return (b.year - a.year) * 360 + (b.month - a.month) * 30 + (d2 - d1);
}

const daysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

export function addMonths(dt, n) {
  const total = dt.year * 12 + (dt.month - 1) + n;
  const year = Math.floor(total / 12);
  const month = (total % 12 + 12) % 12 + 1;
  return { year, month, day: Math.min(dt.day, daysInMonth(year, month)) };
}

export function weekday(dt) {
  const d = new Date(Date.UTC(dt.year, dt.month - 1, dt.day)).getUTCDay();
  return d === 0 ? 7 : d;
}
