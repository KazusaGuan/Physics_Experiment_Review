/* Storage, selection, scoring and the calculator engine. */

const STORE_KEY = 'dsh.physics-lab-sprint.v1';
const ACTIVE_KEY = 'dsh.physics-lab-sprint.active.v1';
const CUSTOM_KEY = 'dsh.physics-lab-sprint.custom.v1';
const SCOPE_KEY = 'dsh.physics-lab-sprint.scope.v1';
const LETTERS = 'ABCDEFGH';
const CUSTOM_ACCENTS = ['brand', 'success', 'warn', 'error', 'idle'];

let CUSTOM_BANKS = [];

function emptyStore() {
  return { v: 1, q: {}, sessions: [] };
}

function loadStore() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== 1 || !parsed.q || typeof parsed.q !== 'object') return emptyStore();
    return {
      v: 1,
      q: parsed.q,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions.slice(-40) : [],
    };
  } catch (err) {
    return emptyStore();
  }
}

function persistStore(store) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch (err) {
    /* storage may be unavailable; progress stays in memory */
  }
}

function saveActive(session) {
  try {
    window.localStorage.setItem(ACTIVE_KEY, JSON.stringify(session));
  } catch (err) {
    /* ignore */
  }
}

function loadActive() {
  try {
    const raw = window.localStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || !Array.isArray(saved.ids) || !saved.ids.length) return null;
    return saved;
  } catch (err) {
    return null;
  }
}

function clearActive() {
  try {
    window.localStorage.removeItem(ACTIVE_KEY);
  } catch (err) {
    /* ignore */
  }
}

function isCustomBank(value) {
  return !!(
    value &&
    typeof value.id === 'string' &&
    value.id &&
    typeof value.name === 'string' &&
    value.name &&
    Array.isArray(value.questions) &&
    value.questions.length
  );
}

function normalizeCustomBank(bank) {
  return Object.assign({}, bank, {
    questions: (bank.questions || []).map((q) =>
      q && q.dim === 'uncertainty' ? Object.assign({}, q, { dim: 'data' }) : q
    ),
  });
}

function loadCustomBanks() {
  try {
    const raw = window.localStorage.getItem(CUSTOM_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter(isCustomBank).map(normalizeCustomBank) : [];
  } catch (err) {
    return [];
  }
}

function saveCustomBanks(list) {
  try {
    window.localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
  } catch (err) {
    /* ignore */
  }
}

function setCustomBanks(list) {
  CUSTOM_BANKS = Array.isArray(list) ? list.filter(isCustomBank).map(normalizeCustomBank) : [];
}

function getCustomBanks() {
  return CUSTOM_BANKS;
}

function loadScopeExcluded() {
  try {
    const raw = window.localStorage.getItem(SCOPE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed && parsed.excluded)
      ? parsed.excluded.filter((id) => typeof id === 'string')
      : [];
  } catch (err) {
    return [];
  }
}

function saveScopeExcluded(excluded) {
  try {
    window.localStorage.setItem(SCOPE_KEY, JSON.stringify({ excluded }));
  } catch (err) {
    /* ignore */
  }
}

function allQuestions() {
  let list = BANK.slice();
  CUSTOM_BANKS.forEach((bank) => {
    list = list.concat(bank.questions || []);
  });
  return list;
}

function allExps() {
  const custom = CUSTOM_BANKS.map((bank, index) => ({
    id: bank.id,
    name: bank.name,
    badge: bank.badge || Array.from(bank.name)[0] || '验',
    short: Array.from(bank.name).slice(0, 6).join(''),
    accent: bank.accent || CUSTOM_ACCENTS[index % CUSTOM_ACCENTS.length],
    custom: true,
    source: bank.source || '',
  }));
  return EXPS.concat(custom);
}

function expMeta(id) {
  const all = allExps();
  return all.filter((e) => e.id === id)[0] || all[0] || EXPS[0];
}
function dimMeta(id) {
  return DIMS.filter((d) => d.id === id)[0] || DIMS[0];
}
function questionsForExp(exp) {
  return allQuestions().filter((q) => q.exp === exp);
}
function questionsOf(exp, dim) {
  return allQuestions().filter((q) => q.exp === exp && q.dim === dim);
}
function letterOf(index) {
  return LETTERS.charAt(index);
}

function shuffle(list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

function pickQuestions(n, ids, scopeIds) {
  if (ids && ids.length) {
    const wanted = {};
    ids.forEach((id) => { wanted[id] = true; });
    return shuffle(allQuestions().filter((q) => wanted[q.id]));
  }
  const meta = allExps();
  const known = {};
  meta.forEach((exp) => { known[exp.id] = true; });
  const allowed = (scopeIds && scopeIds.length ? scopeIds : meta.map((exp) => exp.id))
    .filter((id) => known[id]);
  const pool = shuffle(allQuestions().filter((q) => allowed.indexOf(q.exp) !== -1));
  if (!pool.length) return [];
  const chosen = [];
  const taken = {};
  const perExp = {};
  const perDim = {};

  function take(q) {
    chosen.push(q);
    taken[q.id] = true;
    perExp[q.exp] = (perExp[q.exp] || 0) + 1;
    perDim[q.dim] = (perDim[q.dim] || 0) + 1;
  }

  /* Cover as many selected experiments as the round allows. */
  const coverage = shuffle(allowed).slice(0, Math.min(allowed.length, n));
  coverage.forEach((expId) => {
    if (chosen.length >= n) return;
    const q = pool.filter((item) => item.exp === expId && !taken[item.id])[0];
    if (q) take(q);
  });

  /* Guarantee every exam direction appears at least once. */
  DIMS.forEach((dim) => {
    if (chosen.length >= n || perDim[dim.id]) return;
    const q = pool.filter((item) => item.dim === dim.id && !taken[item.id])[0];
    if (q) take(q);
  });

  const maxExp = Math.max(2, Math.ceil(n / Math.max(1, allowed.length)));
  const maxDim = Math.ceil(n / DIMS.length) + 1;
  for (let i = 0; i < pool.length && chosen.length < n; i += 1) {
    const q = pool[i];
    if (taken[q.id]) continue;
    if ((perExp[q.exp] || 0) >= maxExp) continue;
    if ((perDim[q.dim] || 0) >= maxDim) continue;
    take(q);
  }
  for (let i = 0; i < pool.length && chosen.length < n; i += 1) {
    if (!taken[pool[i].id]) take(pool[i]);
  }
  return chosen.slice(0, n);
}

function parseNumeric(raw) {
  if (raw === null || raw === undefined) return NaN;
  let s = String(raw).trim();
  if (!s) return NaN;
  s = s.replace(/\s/g, '').replace(/，/g, '').replace(/,/g, '');
  s = s.replace(/(?:×|\*)\s*10\s*\^?/g, 'e').replace(/[xX]\s*10\s*\^?/g, 'e');
  s = s.replace(/^\+/, '');
  return Number(s);
}

function isAnswered(q, selection) {
  if (q.type === 'multi') return Array.isArray(selection) && selection.length > 0;
  if (q.type === 'numeric') return selection !== undefined && selection !== null && String(selection).trim() !== '';
  return selection !== undefined && selection !== null;
}

function selectionText(q, selection) {
  if (q.type === 'numeric') {
    return isAnswered(q, selection)
      ? String(selection) + (q.unit ? ' ' + q.unit : '')
      : '未作答';
  }
  if (q.type === 'multi') {
    if (!Array.isArray(selection) || !selection.length) return '未作答';
    return selection.slice().sort((a, b) => a - b).map(letterOf).join('、');
  }
  if (selection === undefined || selection === null) return '未作答';
  return letterOf(selection);
}

function checkAnswer(q, selection) {
  if (q.type === 'multi') {
    if (!Array.isArray(selection)) return false;
    const a = selection.slice().sort().join(',');
    const b = q.answer.slice().sort().join(',');
    return a === b;
  }
  if (q.type === 'numeric') {
    const value = parseNumeric(selection);
    if (!isFinite(value)) return false;
    return Math.abs(value - q.answer) <= Math.abs(q.answer) * (q.tol || 0.01);
  }
  return selection === q.answer;
}

function optionVerdict(q, index, selection, submitted) {
  const picked = q.type === 'multi' ? (Array.isArray(selection) && selection.indexOf(index) !== -1) : selection === index;
  if (!submitted) return picked ? 'is-selected' : '';
  const isRight = q.type === 'multi' ? q.answer.indexOf(index) !== -1 : q.answer === index;
  if (isRight && picked) return 'is-correct';
  if (isRight) return 'is-correct is-dim';
  if (picked) return 'is-wrong';
  return '';
}

function formatNumber(value) {
  if (typeof value === 'number') {
    if (!isFinite(value)) return String(value);
    if (value === 0) return '0';
    const abs = Math.abs(value);
    if (abs >= 1e7 || abs < 1e-4) {
      return value.toExponential(6).replace(/\.?0+e/, 'e').replace('e+', 'e');
    }
    let s = value.toPrecision(10);
    if (s.indexOf('.') !== -1) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s;
  }
  return String(value);
}

function numericAnswerText(q) {
  const unit = q.unit ? ' ' + q.unit : '';
  let text = formatNumber(q.answer) + unit;
  if (q.sigfig && q.unit === '' && q.answer >= 1e-4 && q.answer < 1e7) {
    text = formatNumber(q.answer);
  }
  return text;
}

function correctAnswerText(q) {
  if (q.type === 'numeric') return numericAnswerText(q);
  if (q.type === 'multi') return q.answer.map((i) => letterOf(i)).join('、');
  return letterOf(q.answer) + '. ' + q.options[q.answer];
}

function fmtTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const two = (n) => (n < 10 ? '0' + n : String(n));
  if (h > 0) return h + ':' + two(m) + ':' + two(sec);
  return two(m) + ':' + two(sec);
}

function overallStats(store) {
  let attempts = 0;
  let correct = 0;
  let wrongLeft = 0;
  const ids = Object.keys(store.q);
  ids.forEach((id) => {
    const rec = store.q[id] || {};
    attempts += rec.s || 0;
    correct += rec.c || 0;
    if (rec.last === false) wrongLeft += 1;
  });
  return {
    attempts,
    correct,
    rate: attempts ? correct / attempts : null,
    practiced: ids.length,
    wrongLeft,
  };
}

function cellStats(store, exp, dim) {
  const qs = questionsOf(exp, dim);
  let seen = 0;
  let correct = 0;
  qs.forEach((q) => {
    const rec = store.q[q.id];
    if (rec) {
      seen += rec.s || 0;
      correct += rec.c || 0;
    }
  });
  return { seen, correct, rate: seen ? correct / seen : null, total: qs.length };
}

function weakSpots(store) {
  const out = [];
  allExps().forEach((exp) => {
    DIMS.forEach((dim) => {
      const st = cellStats(store, exp.id, dim.id);
      if (st.seen >= 2 && st.rate !== null && st.rate < 0.85) {
        out.push({ exp: exp.id, dim: dim.id, rate: st.rate, seen: st.seen });
      }
    });
  });
  out.sort((a, b) => a.rate - b.rate);
  return out.slice(0, 4);
}

function reviewQuestions(store) {
  return allQuestions().filter((q) => {
    const rec = store.q[q.id];
    return rec && rec.last === false;
  }).sort((a, b) => {
    const ra = store.q[a.id];
    const rb = store.q[b.id];
    return (rb.w || 0) - (ra.w || 0);
  });
}

/* ---------- calculator ---------- */

function calculatorEval(rawExpr, useDeg) {
  const src = String(rawExpr || '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'pi')
    .replace(/√/g, 'sqrt');
  let i = 0;

  function space() {
    while (i < src.length && /\s/.test(src.charAt(i))) i += 1;
  }
  function fail() {
    throw new Error('表达式不完整');
  }
  function isIdentStart(c) {
    return /[a-zA-Z]/.test(c);
  }

  function expression() {
    let v = term();
    for (;;) {
      space();
      const c = src.charAt(i);
      if (c === '+' || c === '-') {
        i += 1;
        const r = term();
        v = c === '+' ? v + r : v - r;
      } else {
        return v;
      }
    }
  }

  function term() {
    let v = unary();
    for (;;) {
      space();
      const c = src.charAt(i);
      if (c === '*' || c === '/') {
        i += 1;
        const r = unary();
        v = c === '*' ? v * r : v / r;
        continue;
      }
      if (c && /[0-9.(π]/.test(c)) {
        const r = unary();
        v *= r;
        continue;
      }
      if (c && isIdentStart(c)) {
        const r = unary();
        v *= r;
        continue;
      }
      return v;
    }
  }

  function unary() {
    space();
    const c = src.charAt(i);
    if (c === '-') { i += 1; return -unary(); }
    if (c === '+') { i += 1; return unary(); }
    return power();
  }

  function power() {
    const v = primary();
    space();
    if (src.charAt(i) === '^') {
      i += 1;
      return Math.pow(v, unary());
    }
    return v;
  }

  function primary() {
    space();
    const c = src.charAt(i);
    if (c === '(') {
      i += 1;
      const v = expression();
      space();
      if (src.charAt(i) !== ')') fail();
      i += 1;
      return v;
    }
    if (c === 'π') { i += 1; return Math.PI; }
    const num = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(src.slice(i));
    if (num) {
      i += num[0].length;
      return Number(num[0]);
    }
    const id = /^[a-zA-Z]+/.exec(src.slice(i));
    if (id) {
      i += id[0].length;
      const name = id[0].toLowerCase();
      if (name === 'pi') return Math.PI;
      if (name === 'e') return Math.E;
      space();
      if (src.charAt(i) !== '(') fail();
      i += 1;
      const arg = expression();
      space();
      if (src.charAt(i) !== ')') fail();
      i += 1;
      const rad = useDeg ? (arg * Math.PI) / 180 : arg;
      switch (name) {
        case 'sin': return Math.sin(rad);
        case 'cos': return Math.cos(rad);
        case 'tan': return Math.tan(rad);
        case 'asin': return useDeg ? (Math.asin(arg) * 180) / Math.PI : Math.asin(arg);
        case 'acos': return useDeg ? (Math.acos(arg) * 180) / Math.PI : Math.acos(arg);
        case 'atan': return useDeg ? (Math.atan(arg) * 180) / Math.PI : Math.atan(arg);
        case 'sqrt': return Math.sqrt(arg);
        case 'ln': return Math.log(arg);
        case 'log': return Math.log(arg) / Math.LN10;
        case 'exp': return Math.exp(arg);
        case 'abs': return Math.abs(arg);
        default: throw new Error('未知函数 ' + name);
      }
    }
    fail();
  }

  const value = expression();
  space();
  if (i < src.length) throw new Error('无法解析：' + src.slice(i));
  if (!isFinite(value)) throw new Error('结果不是有限数');
  return value;
}
