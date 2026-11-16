// Practice page: a practice test, type-the-answer drills, and the Daily 10.
// Every question comes from game-data.js, which takes its facts from the study guide.
import { FOUNDERS, GREEK, BANK } from './game-data.js';

const $ = (id) => document.getElementById(id);
const KEY = 'mta.practice.v1';
let S;
try { S = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { S = {}; }
if (!S || typeof S !== 'object' || Array.isArray(S)) S = {};
if (!Array.isArray(S.tests)) S.tests = [];
if (!S.daily || typeof S.daily !== 'object') S.daily = {};
if (!S.drills || typeof S.drills !== 'object') S.drills = {};
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode or storage full */ } };

const NAMES = {
  history: 'History', founders: 'Founders', national: 'The Fraternity', province: 'Western Province',
  chapter: 'Los Angeles Alumni', programs: 'Programs', greek: 'Greek Alphabet', mta: 'Spring 2027'
};
const ORDER = ['history', 'founders', 'national', 'province', 'chapter', 'programs', 'greek', 'mta'];
const PASS = 70;
const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------------- helpers ---------------- */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function seedFrom(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}
function mulberry32(a) {
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rngFor = (s) => mulberry32(seedFrom(s));
const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];
function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const sample = (arr, n, rng) => shuffle(arr, rng).slice(0, n);
const sum = (arr) => arr.reduce((a, b) => a + b, 0);
function fmtClock(ms) { const s = Math.max(0, Math.floor(ms / 1000)), m = Math.floor(s / 60); return m + ':' + String(s % 60).padStart(2, '0'); }
function fmtDur(ms) {
  const m = Math.round(ms / 60000);
  if (m < 1) return 'under a minute';
  if (m < 60) return m + (m === 1 ? ' minute' : ' minutes');
  const h = Math.floor(m / 60), r = m % 60;
  return h + (h === 1 ? ' hour' : ' hours') + (r ? ' ' + r + ' min' : '');
}
function norm(s) { s = String(s).toLowerCase(); if (s.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); return s; }
const clean = (s) => norm(s).replace(/[^a-z]/g, '');
function toast(t) {
  const el = $('toast'); el.textContent = t; el.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 1900);
}
function keepInView(el) {
  const r = el.getBoundingClientRect();
  if (r.top < 56 || r.top > window.innerHeight * 0.6) {
    window.scrollTo({ top: Math.max(0, window.scrollY + r.top - 70), behavior: 'auto' });
  }
}
function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
function say(el, text, cls) { el.textContent = text; el.className = 'msg' + (cls ? ' ' + cls : ''); }
// A mouse click leaves focus on the button. Blur it so keyboard shortcuts keep working.
const tapBlur = (e) => { if (e && e.detail > 0 && e.currentTarget && e.currentTarget.blur) e.currentTarget.blur(); };

/* ---------------- building questions ---------------- */
const G_TYPES = ['pos', 'after', 'before', 'sym', 'name'];
function greekItem(type, i, rng) {
  let text, ans, label = (k) => GREEK[k][2];
  if (type === 'pos') { text = 'Letter #' + (i + 1) + ' of the Greek alphabet'; ans = i; }
  else if (type === 'after') { text = 'Which letter comes right after ' + GREEK[i][2] + '?'; ans = i + 1; }
  else if (type === 'before') { text = 'Which letter comes right before ' + GREEK[i][2] + '?'; ans = i - 1; }
  else if (type === 'sym') { text = 'Which letter is ' + GREEK[i][0] + ' ' + GREEK[i][1] + '?'; ans = i; }
  else { text = 'Which is ' + GREEK[i][2] + '?'; ans = i; label = (k) => GREEK[k][0] + ' ' + GREEK[k][1]; }
  // Wrong answers are letters close to the right one, never the letter named in the question.
  const near = [];
  for (let d = 1; d < 24 && near.length < 5; d++) {
    for (const k of [ans + d, ans - d]) if (k >= 0 && k < 24 && k !== i && k !== ans && near.length < 5) near.push(k);
  }
  return { id: 'gk-' + type + '-' + i, d: 'greek', q: text, a: label(ans), w: sample(near, 3, rng).map(label) };
}
function randomGreek(rng, used) {
  for (let tries = 0; tries < 60; tries++) {
    const i = Math.floor(rng() * 24);
    if (used && used.has(i)) continue;
    let type = pick(G_TYPES, rng);
    if (type === 'after' && i === 23) type = 'before';
    if (type === 'before' && i === 0) type = 'after';
    if (used) used.add(i);
    return greekItem(type, i, rng);
  }
  return greekItem('pos', Math.floor(rng() * 24), rng);
}
// Up to four choices: fixed questions have two curated wrong answers, the rest get three.
function build(it, rng) {
  let a, wrong;
  if (it.who) {
    const whos = [].concat(it.who), key = pick(whos, rng);
    a = FOUNDERS[key];
    const skip = new Set([...whos, ...it.not]);
    wrong = sample(Object.keys(FOUNDERS).filter((k) => !skip.has(k)), 3, rng).map((k) => FOUNDERS[k]);
  } else if (it.right) {
    a = pick(it.right, rng);
    wrong = sample(it.wrong.filter((x) => x !== a), 3, rng);
  } else { a = it.a; wrong = it.w.slice(0, 3); }
  const opts = shuffle([a, ...wrong], rng);
  return { id: it.id, d: it.d, q: it.q, n: it.n || '', opts, a: opts.indexOf(a) };
}

// Share of a 100-question test by section. The MTA said the test covers the Founders and their
// occupations, the Greek alphabet and the history, plus the three levels of the organization.
const SECTIONS = [['history', 14], ['founders', 22], ['national', 14], ['province', 12], ['chapter', 16], ['programs', 10], ['greek', 12]];
const OCCUPATIONS = new Set(['f-dean', 'f-lincoln', 'f-law', 'f-electric', 'f-dentist', 'f-chef', 'f-doctor', 'f-journalist']);
// Pairs where one question's wording gives away the other's answer. A test or a Daily 10 never has both.
const CONFLICTS = [
  ['h-found', 'h-kan'], ['h-where', 'h-city'], ['h-psi', 'h-kan'], ['k-kan', 'h-kan'], ['f-initiate', 'f-initiates'],
  ['n-honor', 'n-obj1'], ['n-endeavor', 'n-obj2'], ['n-welfare', 'n-obj3'], ['n-colleges', 'n-obj4'], ['n-service', 'n-obj5'],
  ['n-motto', 'n-endeavor'], ['n-motto', 'n-obj2'], ['n-gp', 'n-gp-init'],
  ['c-pm-before', 'c-polemarch'], ['c-lifetime-name', 'c-lifetime-2026'], ['c-bwb-birth', 'c-bwb-since'], ['c-bwb-birth', 'c-bwb-west'],
  ['g-kl-adopted', 'g-kl-charlotte'], ['g-kl-name', 'g-kl-founders'],
  ['g-stjude', 'g-stjude-since'], ['g-stjude', 'g-stjude-goal'], ['g-stjude', 'g-stjude-walk']
];
function picker() {
  const chosen = new Set();
  const blocked = (id) => CONFLICTS.some(([x, y]) => (x === id && chosen.has(y)) || (y === id && chosen.has(x)));
  // Adds up to n items from list to out. Returns how many it couldn't add.
  const take = (list, n, out) => {
    for (const it of list) {
      if (n <= 0) break;
      if (chosen.has(it.id) || blocked(it.id)) continue;
      chosen.add(it.id); out.push(it); n--;
    }
    return n;
  };
  return { take };
}
function quotas(n) {
  const raw = SECTIONS.map(([, q]) => (q * n) / 100), base = raw.map(Math.floor);
  let left = n - sum(base);
  raw.map((r, i) => [r - base[i], i]).sort((x, y) => y[0] - x[0]).forEach(([, i]) => { if (left > 0) { base[i]++; left--; } });
  return base;
}
function makeTest(n, rng) {
  const qs = quotas(n), { take } = picker(), out = [];
  let short = 0;
  SECTIONS.forEach(([d], si) => {
    let want = qs[si];
    const pool = shuffle(BANK.filter((it) => it.d === d), rng);
    if (d === 'greek') {
      const fixed = Math.min(want, Math.max(1, Math.round(want / 4)));
      const gen = want - (fixed - take(pool, fixed, out)), used = new Set();
      for (let k = 0; k < gen; k++) out.push(randomGreek(rng, used));
      return;
    }
    if (d === 'founders') {
      const occ = pool.filter((it) => OCCUPATIONS.has(it.id)), occWant = Math.min(occ.length, Math.round(want * 0.32));
      want = want - occWant + take(occ, occWant, out);
    }
    short += take(pool, want, out);
  });
  if (short > 0) take(shuffle(BANK.filter((it) => it.d !== 'mta'), rng), short, out);
  return shuffle(out, rng);
}
const DAILY_DECKS = ['history', 'founders', 'national', 'province', 'chapter', 'programs', 'greek', 'mta'];
// The same ten for everyone on a given Pacific date: one from each section, two more from anywhere.
function dailySet(key) {
  const rng = rngFor('mta-daily|' + key), { take } = picker(), out = [];
  DAILY_DECKS.forEach((d) => {
    if (d === 'greek' && rng() < 0.7) { out.push(randomGreek(rng)); return; }
    take(shuffle(BANK.filter((it) => it.d === d), rng), 1, out);
  });
  take(shuffle(BANK.filter((it) => it.d !== 'greek'), rng), 10 - out.length, out);
  return shuffle(out, rng).map((it) => build(it, rng));
}

/* ---------------- Pacific dates ---------------- */
function laKey(d) {
  const p = {};
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(d || new Date()).forEach((x) => { p[x.type] = x.value; });
  return p.year + '-' + p.month + '-' + p.day;
}
const keyUTC = (key) => { const [y, m, d] = key.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const shiftKey = (key, days) => new Date(keyUTC(key) + days * 864e5).toISOString().slice(0, 10);
const dayNo = (key) => Math.round((keyUTC(key) - Date.UTC(2026, 10, 16)) / 864e5) + 1;
const fmtKey = (key, opts) => new Date(keyUTC(key) + 12 * 36e5).toLocaleDateString('en-US', Object.assign({ timeZone: 'UTC' }, opts));

/* ---------------- modes ---------------- */
const MODES = ['test', 'drills', 'daily'];
let mode = null;
function setMode(m, fromHash) {
  if (!MODES.includes(m)) m = 'test';
  mode = m;
  MODES.forEach((k) => { $('m-' + k).hidden = k !== m; $('tab-' + k).setAttribute('aria-selected', String(k === m)); });
  if (!fromHash && location.hash !== '#' + m) history.replaceState(null, '', '#' + m);
  try { localStorage.setItem('mta.practice.mode', m); } catch (e) { /* ignore */ }
  if (m === 'test') testInit();
  else if (m === 'drills') { if (!drill) showDrillList(); }
  else dailyInit();
}
document.querySelectorAll('.modes button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
window.addEventListener('hashchange', () => setMode(location.hash.slice(1), true));

/* ================= PRACTICE TEST ================= */
let tLen = 100, tState = 'intro', tTick = 0, advTimer = null;
function tView(v) { tState = v; ['intro', 'run', 'done'].forEach((k) => { $('t-' + k).hidden = k !== v; }); }
function testInit() {
  if (tState === 'run' && S.cur) { tView('run'); tShow(); return; }
  if (tState === 'done' && S.last) { tResults(S.last); return; }
  tIntro();
}
function tIntro() {
  tView('intro');
  $('t-len-h').textContent = tLen;
  const c = S.cur;
  $('t-resume').hidden = !c;
  $('t-start').textContent = c ? 'Start a new test' : 'Start the test';
  if (c) {
    const done = c.ans.filter((x) => x > -1).length;
    $('t-resume-text').textContent = (c.kind === 'retake' ? 'You have a retake in progress: ' : 'You have a ' + c.qs.length + '-question test in progress: ') +
      done + ' of ' + c.qs.length + ' answered.';
  }
  $('t-last').hidden = !S.last;
  const h = S.tests.slice(-8).reverse();
  $('t-hist-wrap').hidden = !h.length;
  $('t-history').innerHTML = h.map((r) =>
    '<li><span>' + esc(new Date(r.t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) + '</span><span>' +
    (r.kind === 'retake' ? 'Retake of ' + r.n + ' missed' : r.n + ' questions') + '</span><b class="' + (r.pct >= PASS ? 'pass' : 'fail') + '">' + r.pct + '%</b></li>').join('');
}
document.querySelectorAll('#t-len button').forEach((b) => b.addEventListener('click', () => {
  tLen = +b.dataset.n;
  document.querySelectorAll('#t-len button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  $('t-len-h').textContent = tLen;
}));
function tStart(kind, qs) {
  clearTimeout(advTimer);
  S.cur = { kind, qs, ans: qs.map(() => -1), at: 0, el: 0, t0: Date.now() };
  save(); tTick = Date.now(); tView('run'); tShow(true);
}
function tBank() { const now = Date.now(); if (S.cur) S.cur.el += Math.min(now - tTick, 5 * 60000); tTick = now; }
function tShow(scroll) {
  const c = S.cur, i = c.at, q = c.qs[i], n = c.qs.length;
  $('t-pos').textContent = 'Question ' + (i + 1) + ' of ' + n;
  $('t-sec').textContent = NAMES[q.d] || '';
  $('t-q').textContent = q.q;
  const box = $('t-opts');
  box.innerHTML = '';
  q.opts.forEach((o, k) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'opt';
    b.setAttribute('aria-pressed', String(c.ans[i] === k));
    b.innerHTML = '<span class="k">' + 'ABCD'[k] + '</span><span></span>';
    b.lastChild.textContent = o;
    b.addEventListener('click', (e) => { tPick(k); tapBlur(e); });
    box.appendChild(b);
  });
  $('t-back').disabled = i === 0;
  $('t-next').innerHTML = i === n - 1 ? 'Finish' : 'Next &rsaquo;';
  $('t-next').disabled = c.ans[i] < 0;
  tProgress();
  if (scroll) keepInView($('t-run'));
}
function tProgress() {
  const c = S.cur, done = c.ans.filter((x) => x > -1).length;
  $('t-bar').style.width = (done / c.qs.length * 100) + '%';
  $('t-answered').textContent = done + ' of ' + c.qs.length + ' answered' + (fineHover ? ' · keys 1 to 4, ← →' : '');
}
function tPick(k) {
  const c = S.cur; if (!c) return;
  const i = c.at;
  c.ans[i] = k; tBank(); save();
  [...$('t-opts').children].forEach((b, j) => b.setAttribute('aria-pressed', String(j === k)));
  $('t-next').disabled = false;
  tProgress();
  clearTimeout(advTimer);
  if (i < c.qs.length - 1) advTimer = setTimeout(() => { if (S.cur === c && c.at === i) { c.at++; save(); tShow(true); } }, 360);
}
function tNext() {
  const c = S.cur; if (!c || c.ans[c.at] < 0) return;
  clearTimeout(advTimer);
  if (c.at < c.qs.length - 1) { c.at++; save(); tShow(true); } else tFinish();
}
function tBack() { const c = S.cur; if (!c || c.at === 0) return; clearTimeout(advTimer); c.at--; save(); tShow(true); }
function tFinish() {
  tBank();
  const c = S.cur, right = c.qs.reduce((s, q, i) => s + (c.ans[i] === q.a ? 1 : 0), 0);
  S.tests.push({ t: Date.now(), n: c.qs.length, right, pct: Math.round(right / c.qs.length * 100), kind: c.kind, ms: c.el });
  if (S.tests.length > 40) S.tests = S.tests.slice(-40);
  S.last = Object.assign({}, c, { done: Date.now() });
  S.cur = null; save();
  tResults(S.last);
}
function tResults(t) {
  tView('done');
  const n = t.qs.length, by = {}, misses = [];
  let right = 0;
  t.qs.forEach((q, i) => {
    const ok = t.ans[i] === q.a;
    if (ok) right++; else misses.push([q, t.ans[i]]);
    if (!by[q.d]) by[q.d] = [0, 0];
    by[q.d][0] += ok ? 1 : 0; by[q.d][1]++;
  });
  const pct = Math.round(right / n * 100), pass = pct >= PASS;
  $('t-hero').className = 'hero ' + (pass ? 'pass' : 'fail');
  $('t-pct').textContent = pct + '%';
  $('t-verdict').textContent = pass ? 'Pass' : 'Below 70%';
  $('t-meta').textContent = right + ' of ' + n + ' right' + (pass ? '' : ', and passing takes ' + Math.ceil(n * PASS / 100)) + '. Time: ' + fmtDur(t.el) + '.';
  $('t-secs').innerHTML = ORDER.filter((d) => by[d]).map((d) => {
    const [ok, m] = by[d], p = Math.round(ok / m * 100);
    return '<li class="' + (p < PASS ? 'low' : '') + '"><span>' + NAMES[d] + '</span><span class="sc">' + ok + '/' + m +
      '</span><span class="bar"><i style="width:' + p + '%"></i></span><span class="pc">' + p + '%</span></li>';
  }).join('');
  $('t-miss-h').textContent = misses.length ? 'What you missed (' + misses.length + ')' : 'No misses. Every answer right.';
  $('t-misses').innerHTML = misses.map(([q, k]) => '<li><p class="mq">' + esc(q.q) + '</p>' +
    (k > -1 ? '<p class="you">You said: <s>' + esc(q.opts[k]) + '</s></p>' : '') +
    '<p class="ans">Answer: <b>' + esc(q.opts[q.a]) + '</b></p>' + (q.n ? '<p class="note">' + esc(q.n) + '</p>' : '') + '</li>').join('');
  $('t-retake').hidden = !misses.length;
  $('t-retake').textContent = 'Retake the ' + misses.length + ' you missed';
  keepInView($('t-done'));
}
$('t-start').addEventListener('click', () => tStart('full', makeTest(tLen, Math.random).map((it) => build(it, Math.random))));
$('t-resume-go').addEventListener('click', () => { tTick = Date.now(); tView('run'); tShow(true); });
$('t-discard').addEventListener('click', () => { S.cur = null; save(); tIntro(); });
$('t-last').addEventListener('click', () => { if (S.last) tResults(S.last); });
$('t-back').addEventListener('click', (e) => { tBack(); tapBlur(e); });
$('t-next').addEventListener('click', (e) => { tNext(); tapBlur(e); });
$('t-exit').addEventListener('click', () => { clearTimeout(advTimer); tBank(); save(); tIntro(); toast('Saved. Pick it back up any time.'); });
$('t-new').addEventListener('click', () => { tIntro(); keepInView($('t-intro')); });
$('t-retake').addEventListener('click', () => {
  const t = S.last; if (!t) return;
  const qs = t.qs.filter((q, i) => t.ans[i] !== q.a).map((q) => {
    const right = q.opts[q.a], opts = shuffle(q.opts, Math.random);
    return Object.assign({}, q, { opts, a: opts.indexOf(right) });
  });
  if (qs.length) tStart('retake', shuffle(qs, Math.random));
});

/* ================= DRILLS ================= */
let drill = null, clockTimer = null;
function startClock(el, t0) { stopClock(); clockTimer = setInterval(() => { el.textContent = fmtClock(Date.now() - t0); }, 250); }
function stopClock() { clearInterval(clockTimer); clockTimer = null; }
function showDrillList() {
  drill = null; stopClock();
  ['list', 'founders', 'order', 'symbols'].forEach((k) => { $('dr-' + k).hidden = k !== 'list'; });
  const b = S.drills;
  $('best-founders').textContent = b.founders ? 'Best: all ten in ' + fmtClock(b.founders.ms) + (b.founders.full ? ', full names' : ', first and last') : 'Not tried yet';
  $('best-order').textContent = b.order ? 'Best: ' + fmtClock(b.order.ms) + (b.order.miss ? ', ' + b.order.miss + (b.order.miss === 1 ? ' miss' : ' misses') : ', no misses') : 'Not tried yet';
  $('best-symbols').textContent = b.symbols ? 'Best: ' + b.symbols.right + ' of 24' : 'Not tried yet';
}
function openDrill(name) {
  drill = name;
  ['list', 'founders', 'order', 'symbols'].forEach((k) => { $('dr-' + k).hidden = k !== name; });
  if (name === 'founders') fReset(); else if (name === 'order') oReset(); else sReset();
  keepInView($('dr-' + name));
}
document.querySelectorAll('.drill').forEach((b) => b.addEventListener('click', () => openDrill(b.dataset.drill)));
document.querySelectorAll('.dr-back').forEach((b) => b.addEventListener('click', () => { showDrillList(); keepInView($('dr-list')); }));
function chips(id, onPick) {
  document.querySelectorAll('#' + id + ' button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('#' + id + ' button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    onPick(b.dataset.v);
  }));
}
// Optimal string alignment distance: counts a swapped pair of letters as one typo.
function typos(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const d = [];
  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const c = a[i - 1] === b[j - 1] ? 0 : 1;
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[m][n];
}
const allowed = (w) => (w.length <= 3 ? 0 : w.length <= 7 ? 1 : 2);
const close = (x, w) => x === w || typos(x, w) <= allowed(w);

/* ----- the Ten Founders ----- */
const F_NAMES = Object.values(FOUNDERS);
const F_TOK = F_NAMES.map((n) => norm(n).split(' '));
let F = null, fNeed = 2;
const words = (s) => norm(s).replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
function fMatch(input) {
  const t = words(input);
  if (!t.length) return { kind: 'empty' };
  let hint = null;
  for (let idx = 0; idx < F_TOK.length; idx++) {
    const [fi, mi, la] = F_TOK[idx];
    if (!close(t[t.length - 1], la)) continue;
    if (t.length === 1) { hint = hint || { kind: 'first' }; continue; }
    if (!close(t[0], fi)) continue;
    const exact = t[0] === fi && t[t.length - 1] === la;
    if (t.length === 2) {
      if (fNeed === 3) { hint = { kind: 'middle' }; continue; }
      return { kind: 'ok', idx, exact };
    }
    const mid = t.slice(1, -1).join(' ');
    if (mid.length > 1 && close(mid, mi)) return { kind: 'ok', idx, exact: exact && mid === mi };
    if (mid.length === 1 && mid === mi[0]) {
      if (fNeed === 3) { hint = { kind: 'middle' }; continue; }
      return { kind: 'ok', idx, exact };
    }
    hint = { kind: 'badmiddle' };
  }
  if (!hint && F_TOK.some(([fi]) => close(t[0], fi))) hint = { kind: 'last' };
  return hint || { kind: 'none' };
}
function fReset() {
  stopClock();
  F = { found: [], t0: 0, done: false };
  const inp = $('f-in');
  inp.value = ''; inp.disabled = false;
  say($('f-msg'), '');
  $('f-clock').textContent = '0:00';
  fRender();
  if (fineHover) inp.focus();
}
function fRender(flashLast) {
  const ol = $('f-slots');
  ol.innerHTML = '';
  for (let k = 0; k < 10; k++) {
    const li = document.createElement('li'), f = F.found[k];
    li.innerHTML = '<span class="n">' + (k + 1) + '</span><span></span>';
    if (f) { li.className = f.shown ? 'shown' : 'got'; li.lastChild.textContent = F_NAMES[f.i]; if (flashLast && k === F.found.length - 1) li.classList.add('flash'); }
    ol.appendChild(li);
  }
  $('f-count').textContent = F.found.filter((f) => !f.shown).length + ' of 10';
}
function fDone() {
  F.done = true; stopClock();
  F.found.sort((x, y) => x.i - y.i); // the official order: Diggs first, then by last name
  fRender();
  const ms = Date.now() - F.t0;
  $('f-clock').textContent = fmtClock(ms);
  $('f-in').disabled = true;
  const b = S.drills.founders, full = fNeed === 3;
  const better = !b || (full && !b.full) || (full === !!b.full && ms < b.ms);
  if (better) { S.drills.founders = { ms, full }; save(); }
  say($('f-msg'), 'All ten in ' + fmtClock(ms) + (better ? '. A new best.' : '.'), 'ok');
}
$('f-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (F.done) return;
  const inp = $('f-in'), v = inp.value, msg = $('f-msg');
  if (!v.trim()) return;
  if (!F.t0) { F.t0 = Date.now(); startClock($('f-clock'), F.t0); }
  const m = fMatch(v);
  if (m.kind === 'ok') {
    inp.value = '';
    if (F.found.some((f) => f.i === m.idx)) { say(msg, 'You already have ' + F_NAMES[m.idx] + '.'); return; }
    F.found.push({ i: m.idx });
    say(msg, m.exact ? 'Yes. ' + F_NAMES[m.idx] + '.' : 'Yes. It’s spelled ' + F_NAMES[m.idx] + '.', 'ok');
    fRender(true);
    if (F.found.length === 10) fDone();
    return;
  }
  const text = {
    first: 'Add his first name too.',
    last: 'Add his last name too.',
    middle: 'Full name: add his middle name.',
    badmiddle: 'Close. Check his middle name.',
    none: 'That’s not one of the ten. Check the spelling or try another.'
  }[m.kind];
  if (text) { say(msg, text, 'no'); shake(inp); }
});
$('f-give').addEventListener('click', () => {
  if (F.done) return;
  for (let i = 0; i < 10; i++) if (!F.found.some((f) => f.i === i)) F.found.push({ i, shown: true });
  F.found.sort((x, y) => x.i - y.i);
  F.done = true; stopClock();
  $('f-in').disabled = true;
  fRender();
  const got = F.found.filter((f) => !f.shown).length;
  say($('f-msg'), 'You had ' + got + ' of 10. The grey ones are the ones you missed. Start over to try again.');
});
$('f-restart').addEventListener('click', fReset);
chips('f-mode', (v) => { fNeed = +v; fReset(); });

/* ----- the alphabet in order ----- */
const G_NAMES = GREEK.map((g) => g[2].toLowerCase());
const ALIAS = { lambda: ['lamda'] };
const isName = (v, k) => v === G_NAMES[k] || (ALIAS[G_NAMES[k]] || []).includes(v);
let O = null;
function oReset() {
  stopClock();
  O = { k: 0, t0: 0, miss: 0, tries: 0, res: [], done: false };
  const inp = $('o-in');
  inp.value = ''; inp.disabled = false; inp.placeholder = 'Letter 1';
  say($('o-msg'), '');
  $('o-clock').textContent = '0:00';
  oRender();
  if (fineHover) inp.focus();
}
function oRender() {
  const box = $('o-tiles');
  box.innerHTML = '';
  GREEK.forEach((g, i) => {
    const d = document.createElement('div'), r = O.res[i];
    if (r !== undefined) { d.className = r ? 'ok' : 'miss'; d.innerHTML = '<b>' + g[0] + '</b><span>' + g[2] + '</span>'; }
    else if (i === O.k && !O.done) { d.className = 'cur'; d.innerHTML = '<b>?</b><span>' + (i + 1) + '</span>'; }
    else d.innerHTML = '<b>·</b><span>' + (i + 1) + '</span>';
    box.appendChild(d);
  });
  $('o-count').textContent = O.k + ' of 24' + (O.miss ? ' · ' + O.miss + (O.miss === 1 ? ' miss' : ' misses') : '');
}
function oStartClock() { if (!O.t0) { O.t0 = Date.now(); startClock($('o-clock'), O.t0); } }
function oAdvance() {
  O.k++; O.tries = 0;
  $('o-in').value = '';
  if (O.k >= 24) { oDone(); return; }
  $('o-in').placeholder = 'Letter ' + (O.k + 1);
  oRender();
}
function oAccept() {
  const g = GREEK[O.k];
  O.res[O.k] = O.tries === 0 ? 1 : 0;
  say($('o-msg'), g[0] + ' ' + g[1] + '  ' + g[2], O.tries === 0 ? 'ok' : '');
  oAdvance();
}
function oReveal() {
  if (O.tries === 0) O.miss++;
  O.res[O.k] = 0;
  say($('o-msg'), 'Letter ' + (O.k + 1) + ' is ' + GREEK[O.k][2] + ' (' + GREEK[O.k][0] + ' ' + GREEK[O.k][1] + ').', 'no');
  oAdvance();
}
function oDone() {
  O.done = true; stopClock();
  const ms = Date.now() - O.t0;
  $('o-clock').textContent = fmtClock(ms);
  $('o-in').disabled = true; $('o-in').placeholder = '';
  oRender();
  const b = S.drills.order, better = !b || O.miss < b.miss || (O.miss === b.miss && ms < b.ms);
  if (better) { S.drills.order = { ms, miss: O.miss }; save(); }
  say($('o-msg'), 'All 24 in ' + fmtClock(ms) + (O.miss ? ' with ' + O.miss + (O.miss === 1 ? ' miss' : ' misses') : ' with no misses') + (better ? '. A new best.' : '.'), O.miss ? '' : 'ok');
}
$('o-in').addEventListener('input', () => {
  if (O.done) return;
  oStartClock();
  if (isName(clean($('o-in').value), O.k)) oAccept();
});
$('o-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (O.done) return;
  const v = clean($('o-in').value);
  if (!v) return;
  oStartClock();
  if (isName(v, O.k)) { oAccept(); return; }
  if (O.tries === 0) O.miss++;
  O.tries++;
  if (O.tries >= 2) { oReveal(); return; }
  say($('o-msg'), 'Not quite. Letter ' + (O.k + 1) + ' starts with “' + GREEK[O.k][2][0] + '.”', 'no');
  shake($('o-in')); $('o-in').select();
  oRender();
});
$('o-show').addEventListener('click', () => { if (O.done) return; oStartClock(); oReveal(); $('o-in').focus(); });
$('o-restart').addEventListener('click', oReset);

/* ----- symbols to names ----- */
let SY = null, sMode = 'both', sTimer = null;
function sGlyph(i) { const g = GREEK[i]; return sMode === 'upper' ? g[0] : sMode === 'lower' ? g[1] : g[0] + ' ' + g[1]; }
function sReset() {
  clearTimeout(sTimer);
  SY = { order: shuffle(GREEK.map((_, i) => i), Math.random), k: 0, right: 0, misses: [], wait: false, done: false };
  $('s-result').hidden = true;
  const inp = $('s-in');
  inp.value = ''; inp.disabled = false;
  say($('s-msg'), '');
  sShow();
  if (fineHover) inp.focus();
}
function sShow() {
  SY.wait = false;
  $('s-sym').textContent = sGlyph(SY.order[SY.k]);
  $('s-pos').textContent = (SY.k + 1) + ' of 24';
  $('s-count').textContent = SY.right + ' right so far';
  $('s-go').textContent = 'Check';
  $('s-skip').hidden = false;
}
function sReveal(i) {
  SY.misses.push(i); SY.wait = true;
  say($('s-msg'), 'That one is ' + GREEK[i][2] + '. Press Enter for the next.', 'no');
  $('s-go').textContent = 'Next'; $('s-skip').hidden = true;
}
function sNext() {
  clearTimeout(sTimer);
  SY.k++;
  $('s-in').value = '';
  say($('s-msg'), '');
  if (SY.k >= 24) sDone(); else sShow();
}
function sDone() {
  SY.done = true;
  $('s-in').disabled = true; $('s-skip').hidden = true;
  $('s-sym').textContent = ''; $('s-pos').textContent = '';
  $('s-count').textContent = '';
  const b = S.drills.symbols, better = !b || SY.right > b.right;
  if (better) { S.drills.symbols = { right: SY.right }; save(); }
  $('s-result').hidden = false;
  $('s-hero').className = 'hero' + (SY.right >= 17 ? ' pass' : '');
  $('s-score').textContent = SY.right + '/24';
  $('s-verdict').textContent = SY.right === 24 ? 'Every letter.' + (better ? ' A new best.' : '') : (better ? 'A new best.' : 'Your best is ' + b.right + ' of 24.');
  $('s-miss-h').textContent = SY.misses.length ? 'Study these' : '';
  $('s-misses').innerHTML = SY.misses.map((i) => '<li><p class="ans"><b>' + GREEK[i][0] + ' ' + GREEK[i][1] + '</b> &nbsp;' + GREEK[i][2] + '</p></li>').join('');
  keepInView($('s-result'));
}
$('s-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (SY.done) return;
  if (SY.wait) { sNext(); return; }
  const v = clean($('s-in').value);
  if (!v) return;
  const i = SY.order[SY.k];
  if (isName(v, i)) {
    SY.right++; SY.wait = true;
    say($('s-msg'), 'Yes, ' + GREEK[i][2] + '.', 'ok');
    $('s-count').textContent = SY.right + ' right so far';
    sTimer = setTimeout(() => { if (SY.wait && SY.order[SY.k] === i) sNext(); }, 650);
  } else { sReveal(i); shake($('s-in')); }
});
$('s-skip').addEventListener('click', () => { if (SY.done || SY.wait) return; sReveal(SY.order[SY.k]); $('s-in').focus(); });
$('s-restart').addEventListener('click', sReset);
chips('s-mode', (v) => { sMode = v; sReset(); });

/* ================= DAILY 10 ================= */
let D = null, dLocked = false;
function dView(v) { ['intro', 'run', 'done'].forEach((k) => { $('d-' + k).hidden = k !== v; }); }
function streak() {
  let k = laKey(), n = 0;
  if (!(S.daily[k] && S.daily[k].done)) k = shiftKey(k, -1);
  while (S.daily[k] && S.daily[k].done) { n++; k = shiftKey(k, -1); }
  return n;
}
function week(el) {
  const today = laKey();
  let html = '';
  for (let d = -6; d <= 0; d++) {
    const k = shiftKey(today, d), rec = S.daily[k], on = !!(rec && rec.done);
    html += '<span><b class="' + (on ? 'on' : '') + '">' + (on ? sum(rec.r) : '') + '</b>' + fmtKey(k, { weekday: 'short' }) + '</span>';
  }
  el.innerHTML = html;
}
function dias(el, r, cur) {
  el.innerHTML = '';
  for (let k = 0; k < 10; k++) {
    const i = document.createElement('i');
    if (k < r.length) i.className = r[k] ? 'r' : 'w'; else if (k === cur) i.className = 'cur';
    el.appendChild(i);
  }
}
function dailyInit() {
  const key = laKey();
  if (!D || D.key !== key) D = { key, qs: dailySet(key) };
  const cutoff = shiftKey(key, -120);
  Object.keys(S.daily).forEach((k) => { if (k < cutoff) delete S.daily[k]; });
  $('d-no').textContent = 'Daily 10 · No. ' + dayNo(key);
  $('d-date').textContent = fmtKey(key, { weekday: 'long', month: 'long', day: 'numeric' });
  const rec = S.daily[key];
  if (rec && rec.done) { dDone(); return; }
  if (rec && rec.r.length) { dView('run'); dShow(); return; }
  dView('intro');
  const s = streak();
  $('d-streak-intro').textContent = s ? 'You’re on a ' + s + '-day streak.' : '';
  week($('d-week-intro'));
}
function dShow() {
  const rec = S.daily[D.key], i = rec.r.length, q = D.qs[i];
  dLocked = false;
  dias($('d-dias'), rec.r, i);
  $('d-pos').textContent = 'Question ' + (i + 1) + ' of 10';
  $('d-sec').textContent = NAMES[q.d] || '';
  $('d-q').textContent = q.q;
  const box = $('d-opts');
  box.innerHTML = '';
  q.opts.forEach((o, k) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'opt';
    b.innerHTML = '<span class="k">' + 'ABCD'[k] + '</span><span></span>';
    b.lastChild.textContent = o;
    b.addEventListener('click', (e) => { dPick(k, e.detail === 0); tapBlur(e); });
    box.appendChild(b);
  });
  $('d-fb').hidden = true;
  $('d-next').hidden = true;
}
function dPick(k, viaKeyboard) {
  if (dLocked) return;
  dLocked = true;
  const rec = S.daily[D.key], i = rec.r.length, q = D.qs[i], ok = k === q.a;
  rec.r.push(ok ? 1 : 0);
  if (!Array.isArray(rec.m)) rec.m = [];
  if (!ok) rec.m.push({ q: q.q, you: q.opts[k], a: q.opts[q.a], n: q.n });
  save();
  [...$('d-opts').children].forEach((b, j) => {
    b.disabled = true;
    if (j === q.a) b.classList.add('right'); else if (j === k) b.classList.add('wrong');
  });
  const fb = $('d-fb'), note = q.n ? '<span class="n">' + esc(q.n) + '</span>' : '';
  fb.className = 'feedback ' + (ok ? 'ok' : 'no');
  fb.innerHTML = ok ? '<b>Right.</b>' + note : '<b>Not quite.</b> The answer is ' + esc(q.opts[q.a]) + '.' + note;
  fb.hidden = false;
  dias($('d-dias'), rec.r, rec.r.length);
  const nx = $('d-next');
  nx.innerHTML = rec.r.length >= 10 ? 'See your score' : 'Next &rsaquo;';
  nx.hidden = false;
  if (viaKeyboard) nx.focus();
}
function dNext() {
  const rec = S.daily[D.key];
  if (rec.r.length >= 10) { rec.done = Date.now(); save(); dDone(); } else dShow();
  keepInView($('m-daily'));
}
function shareText() {
  const rec = S.daily[D.key];
  return 'MTA Daily 10 · No. ' + dayNo(D.key) + ' · ' + fmtKey(D.key, { month: 'short', day: 'numeric', year: 'numeric' }) + '\n' +
    rec.r.map((x) => (x ? '◆' : '◇')).join('') + '  ' + sum(rec.r) + '/10\n' + location.origin + location.pathname + '#daily';
}
function dDone() {
  dView('done');
  const rec = S.daily[D.key], right = sum(rec.r), s = streak();
  $('d-hero').className = 'hero' + (right >= 7 ? ' pass' : '');
  $('d-score').textContent = right + '/10';
  dias($('d-dias-done'), rec.r, -1);
  $('d-streak').textContent = s > 1 ? s + '-day streak' : 'Day one of your streak';
  $('d-share').textContent = shareText();
  $('d-share-btn').hidden = !navigator.share;
  week($('d-week'));
  const m = rec.m || [];
  $('d-miss-h').textContent = m.length ? 'What you missed' : 'A perfect ten.';
  $('d-misses').innerHTML = m.map((x) => '<li><p class="mq">' + esc(x.q) + '</p><p class="you">You said: <s>' + esc(x.you) +
    '</s></p><p class="ans">Answer: <b>' + esc(x.a) + '</b></p>' + (x.n ? '<p class="note">' + esc(x.n) + '</p>' : '') + '</li>').join('');
}
$('d-start').addEventListener('click', () => { S.daily[D.key] = { r: [], m: [] }; save(); dView('run'); dShow(); });
$('d-next').addEventListener('click', (e) => { dNext(); tapBlur(e); });
$('d-copy').addEventListener('click', async () => {
  const text = shareText();
  try { await navigator.clipboard.writeText(text); toast('Copied'); return; } catch (e) { /* fall back below */ }
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove();
  toast(ok ? 'Copied' : 'Select the text above to copy it');
});
$('d-share-btn').addEventListener('click', () => { navigator.share({ text: shareText() }).catch(() => {}); });

/* ---------------- keyboard ---------------- */
const keyIndex = (key) => { if (!key || key.length !== 1) return -1; const i = '1234'.indexOf(key); return i > -1 ? i : 'abcd'.indexOf(key.toLowerCase()); };
document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const tag = e.target && e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  const enterOnButton = e.key === 'Enter' && tag === 'BUTTON';
  if (mode === 'test' && tState === 'run' && S.cur) {
    const k = keyIndex(e.key);
    if (k > -1 && k < S.cur.qs[S.cur.at].opts.length) { e.preventDefault(); tPick(k); }
    else if ((e.key === 'Enter' && !enterOnButton) || e.key === 'ArrowRight') { e.preventDefault(); tNext(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); tBack(); }
  } else if (mode === 'daily' && !$('d-run').hidden) {
    const k = keyIndex(e.key);
    if (k > -1 && !dLocked && D && k < D.qs[S.daily[D.key].r.length].opts.length) { e.preventDefault(); dPick(k, true); }
    else if (((e.key === 'Enter' && !enterOnButton) || e.key === 'ArrowRight') && !$('d-next').hidden) { e.preventDefault(); dNext(); }
  }
});

/* ---------------- start ---------------- */
let first = location.hash.slice(1);
if (!MODES.includes(first)) { try { first = localStorage.getItem('mta.practice.mode'); } catch (e) { first = null; } }
setMode(MODES.includes(first) ? first : 'test');
