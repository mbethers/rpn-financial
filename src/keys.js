const NA = 'Not in this version (programming)';
const k = (id, face, f, g, help) => ({ id, face, f, g, help });

// Grid order: 5 columns x 8 rows. ENTER spans rows 7-8 of column 1.
export const KEYS = [
  k('n', 'n', 'AMORT', '12×', ['Number of periods (store, or solve if nothing typed)', 'AMORT – amortize X periods: interest in X, principal in Y, balance in PV', '12× – X × 12 into n']),
  k('i', 'i', 'INT', '12÷', ['Interest rate per period, %', 'INT – simple interest on a 360-day year', '12÷ – X ÷ 12 into i']),
  k('pv', 'PV', 'NPV', 'CF₀', ['Present value', 'NPV – net present value at i', 'CF₀ – initial cash flow']),
  k('pmt', 'PMT', 'RND', 'CFj', ['Payment per period', 'RND – round X to the displayed digits', 'CFj – next cash flow']),
  k('fv', 'FV', 'IRR', 'Nj', ['Future value', 'IRR – internal rate of return (stored in i)', 'Nj – repeat count of the last cash flow']),

  k('yx', 'yˣ', 'PRICE', '√x', ['Y raised to the power X', 'PRICE – bond price per $100 (settlement date in Y, maturity in X; coupon in PMT, yield in i)', '√x – square root']),
  k('recip', '1/x', 'YTM', 'eˣ', ['Reciprocal', 'YTM – bond yield (price in PV)', 'eˣ – e to the power X']),
  k('pct_t', '%T', 'SL', 'LN', ['X as a percent of Y', 'SL – straight-line depreciation for year X (n life, PV cost, FV salvage)', 'LN – natural logarithm']),
  k('dpct', 'Δ%', 'SOYD', 'FRAC', ['Percent change from Y to X', 'SOYD – sum-of-years-digits depreciation', 'FRAC – fractional part']),
  k('pct', '%', 'DB', 'INTG', ['X percent of Y', 'DB – declining-balance depreciation (i = factor %)', 'INTG – integer part']),

  k('rs', 'R/S', 'P/R', 'PSE', [NA, NA, NA]),
  k('sst', 'SST', 'CLEAR Σ', 'BST', [NA, 'CLEAR Σ – clear statistics registers and the stack', NA]),
  k('rdown', 'R↓', 'PRGM', 'GTO', ['Roll the stack down', NA, NA]),
  k('xy', 'x↔y', 'FIN', 'x≤y', ['Swap X and Y', 'CLEAR FIN – clear n, i, PV, PMT, FV', NA]),
  k('clx', 'CLx', 'REG', 'x=0', ['Clear X', 'CLEAR REG – clear all registers, the stack and cash flows', NA]),

  k('on', 'ON', '', '', ['Clears a pending algebraic expression', '', '']),
  k('f', 'f', '', '', ['Gold shift – next key uses its gold function; f + digit sets decimals', '', '']),
  k('g', 'g', '', '', ['Blue shift – next key uses its blue function', '', '']),
  k('sto', 'STO', '', '', ['Store X: STO then digit (or .digit); STO + − × ÷ digit does register math; STO n/i/PV/PMT/FV', '', '']),
  k('rcl', 'RCL', '', '', ['Recall a register: RCL then digit (or .digit), or RCL n/i/PV/PMT/FV', '', '']),

  k('chs', 'CHS', '', 'DATE', ['Change sign', '', 'DATE – date in Y plus X days (weekday in the registers panel)']),
  k('7', '7', '', 'BEG', ['Digit 7', 'f 7 – show 7 decimals', 'BEG – payments at the start of each period']),
  k('8', '8', '', 'END', ['Digit 8', 'f 8 – show 8 decimals', 'END – payments at the end of each period']),
  k('9', '9', '', 'MEM', ['Digit 9', 'f 9 – show 9 decimals', NA]),
  k('div', '÷', '', '', ['Divide', '', '']),

  k('eex', 'EEX', '', 'ΔDYS', ['Enter an exponent', '', 'ΔDYS – days between dates (earlier in Y, later in X): actual in X, 30/360 in Y']),
  k('4', '4', '', 'D.MY', ['Digit 4', 'f 4 – show 4 decimals', 'D.MY – dates as day.monthyear']),
  k('5', '5', '', 'M.DY', ['Digit 5', 'f 5 – show 5 decimals', 'M.DY – dates as month.dayyear']),
  k('6', '6', '', 'x̄w', ['Digit 6', 'f 6 – show 6 decimals', 'x̄w – weighted mean (x data, y weights)']),
  k('mul', '×', '', '', ['Multiply', '', '']),

  k('enter', 'ENTER', '', 'LSTx', ['Push X up the stack', '', 'LSTx – recall the last X']),
  k('1', '1', '', 'x̂,r', ['Digit 1', 'f 1 – show 1 decimal', 'x̂,r – estimate x for the y in X; r in Y']),
  k('2', '2', '', 'ŷ,r', ['Digit 2', 'f 2 – show 2 decimals', 'ŷ,r – estimate y for the x in X; r in Y']),
  k('3', '3', '', 'n!', ['Digit 3', 'f 3 – show 3 decimals', 'n! – factorial']),
  k('sub', '−', '', '', ['Subtract', '', '']),

  k('0', '0', '', 'x̄', ['Digit 0', 'f 0 – show 0 decimals', 'x̄ – mean of x in X, of y in Y']),
  k('dot', '.', '', 's', ['Decimal point', '', 's – standard deviation of x in X, of y in Y']),
  k('sigma', 'Σ+', '', 'Σ−', ['Add data point (x in X, y in Y)', '', 'Σ− – remove data point']),
  k('add', '+', '', '', ['Add', '', '']),
];
