// Practice page: a practice test, type-the-answer drills, and the Daily 10.
// Every question comes from game-data.js, which takes its facts from the study guide.
import { FOUNDERS, GREEK, BANK } from './game-data.js';
import { XWORDS, XTHEMES } from './crossword-data.js';

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
const MODES = ['test', 'drills', 'crossword', 'daily', 'listen'];
let mode = null;
function setMode(m, fromHash) {
  if (!MODES.includes(m)) m = 'test';
  mode = m;
  MODES.forEach((k) => { $('m-' + k).hidden = k !== m; $('tab-' + k).setAttribute('aria-selected', String(k === m)); });
  if (!fromHash && location.hash !== '#' + m) history.replaceState(null, '', '#' + m);
  try { localStorage.setItem('mta.practice.mode', m); } catch (e) { /* ignore */ }
  if (m !== 'crossword' && typeof xPause === 'function' && X.p) xPause();
  if (m === 'test') testInit();
  else if (m === 'drills') { if (!drill) showDrillList(); }
  else if (m === 'crossword') xInit();
  else if (m === 'listen') listenInit();
  else dailyInit();
}
document.querySelectorAll('.modes button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
const setModesH = () => document.documentElement.style.setProperty('--modes-h', document.querySelector('.modes').offsetHeight + 'px');
setModesH();
window.addEventListener('resize', setModesH);
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
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('Copied'); return; } catch (e) { /* fall back below */ }
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove();
  toast(ok ? 'Copied' : 'Select the text above to copy it');
}
$('d-copy').addEventListener('click', () => copyText(shareText()));
$('d-share-btn').addEventListener('click', () => { navigator.share({ text: shareText() }).catch(() => {}); });

/* ================= CROSSWORD ================= */
const XMAX_W = 12, XMAX_H = 16, XTARGET = 13;
if (!S.xw || typeof S.xw !== 'object') S.xw = {};
if (!S.xw.cur || typeof S.xw.cur !== 'object') S.xw.cur = {};
if (!S.xw.stats || typeof S.xw.stats !== 'object') S.xw.stats = { solved: 0, best: {}, daily: {} };
const X = { p: null, sel: null, els: null, cell: 30, tick: 0, timer: null, armed: 0, handled: 0 };
let xTheme = XTHEMES.some(([v]) => v === S.xw.theme) ? S.xw.theme : 'today';

// "(5,5,2)" for Kappa Alpha Nu, "(4-7)" for Ritz-Carlton, "(5)" for Diggs.
function enumOf(a) {
  let out = '';
  a.split(/([\s-]+)/).filter(Boolean).forEach((part) => {
    if (/^\s+$/.test(part)) out += ',';
    else if (/^[\s-]+$/.test(part)) out += '-';
    else out += part.replace(/[^A-Za-z]/g, '').length;
  });
  return '(' + out + ')';
}
function xPool(theme, rng) {
  const greek = [];
  GREEK.forEach((g, i) => {
    if (g[2].length < 3) return;
    const kinds = ['sym', 'pos'];
    if (i > 0) kinds.push('after');
    if (i < 23) kinds.push('before');
    const k = pick(kinds, rng);
    const c = k === 'sym' ? 'Greek letter ' + g[0] + ' ' + g[1] : k === 'pos' ? 'Letter #' + (i + 1) + ' of the Greek alphabet'
      : k === 'after' ? 'Greek letter right after ' + GREEK[i - 1][2] : 'Greek letter right before ' + GREEK[i + 1][2];
    greek.push({ a: g[2], c, t: 'greek' });
  });
  let list;
  if (theme === 'today' || theme === 'mixed') list = XWORDS.concat(sample(greek, 3, rng));
  else if (theme === 'greek') list = XWORDS.filter((e) => e.t === 'greek').concat(greek);
  else list = XWORDS.filter((e) => e.t === theme);
  return list.map((e) => Object.assign({}, e, { w: e.a.toUpperCase().replace(/[^A-Z]/g, '') }));
}
// Criss-cross layout: every new word has to cross one already placed, and no two letters touch
// unless they belong to a word that crosses there.
function xLayout(pool, rng) {
  const cells = new Map(), words = [];
  let minR = 0, maxR = 0, minC = 0, maxC = 0, crossings = 0;
  const at = (r, c) => cells.get(r + ',' + c);
  const fits = (w, r, c, dir) => {
    const dr = dir === 'd' ? 1 : 0, dc = 1 - dr, L = w.length;
    if (at(r - dr, c - dc) || at(r + dr * L, c + dc * L)) return -1;
    const r2 = r + dr * (L - 1), c2 = c + dc * (L - 1);
    if (Math.max(maxR, r2) - Math.min(minR, r) + 1 > XMAX_H || Math.max(maxC, c2) - Math.min(minC, c) + 1 > XMAX_W) return -1;
    let cross = 0;
    for (let i = 0; i < L; i++) {
      const rr = r + dr * i, cc = c + dc * i, cell = at(rr, cc);
      if (cell) {
        if (cell.ch !== w[i] || cell[dir]) return -1;
        cross++;
      } else if (dir === 'a' ? (at(rr - 1, cc) || at(rr + 1, cc)) : (at(rr, cc - 1) || at(rr, cc + 1))) return -1;
    }
    return cross;
  };
  const place = (e, r, c, dir) => {
    const dr = dir === 'd' ? 1 : 0, dc = 1 - dr;
    for (let i = 0; i < e.w.length; i++) {
      const key = (r + dr * i) + ',' + (c + dc * i);
      const cell = cells.get(key) || { ch: e.w[i], a: false, d: false };
      cell[dir] = true;
      cells.set(key, cell);
    }
    if (!words.length) { minR = maxR = r; minC = maxC = c; }
    words.push({ e, r, c, dir });
    minR = Math.min(minR, r); maxR = Math.max(maxR, r + dr * (e.w.length - 1));
    minC = Math.min(minC, c); maxC = Math.max(maxC, c + dc * (e.w.length - 1));
  };
  place(pool[0], 0, 0, 'a');
  const used = new Set([pool[0].w]), groups = new Set(pool[0].g ? [pool[0].g] : []);
  for (const e of pool) {
    if (words.length >= XTARGET) break;
    if (used.has(e.w) || (e.g && groups.has(e.g))) continue;
    let best = null;
    for (const [key, cell] of cells) {
      const k = key.indexOf(','), r0 = +key.slice(0, k), c0 = +key.slice(k + 1);
      for (let j = 0; j < e.w.length; j++) {
        if (e.w[j] !== cell.ch) continue;
        for (const dir of ['a', 'd']) {
          if (cell[dir]) continue;
          const r = dir === 'd' ? r0 - j : r0, c = dir === 'a' ? c0 - j : c0;
          const cross = fits(e.w, r, c, dir);
          if (cross < 1) continue;
          const dr = dir === 'd' ? 1 : 0, dc = 1 - dr;
          const area = (Math.max(maxR, r + dr * (e.w.length - 1)) - Math.min(minR, r) + 1) * (Math.max(maxC, c + dc * (e.w.length - 1)) - Math.min(minC, c) + 1);
          const s = cross * 30 - area * 0.15 + rng() * 4;
          if (!best || s > best.s) best = { r, c, dir, s, cross };
        }
      }
    }
    if (best) { place(e, best.r, best.c, best.dir); used.add(e.w); if (e.g) groups.add(e.g); crossings += best.cross; }
  }
  return { words, w: maxC - minC + 1, h: maxR - minR + 1, minR, minC, crossings };
}
function xGenerate(theme, seed) {
  const rng = rngFor('mta-xword|' + seed), all = xPool(theme, rng);
  let best = null;
  for (let attempt = 0; attempt < 24; attempt++) {
    const keyed = shuffle(all, rng).slice(0, 36).map((e) => ({ e, k: Math.min(e.w.length, 9) + rng() * 5 }));
    keyed.sort((a, b) => b.k - a.k);
    const pool = keyed.map((x) => x.e);
    const lead = pool.findIndex((e) => e.w.length <= XMAX_W && e.w.length >= 5);
    if (lead > 0) pool.unshift(pool.splice(lead, 1)[0]);
    const res = xLayout(pool, rng), score = res.words.length * 100 + res.crossings * 8 - res.w * res.h * 0.4;
    if (!best || score > best.score) { best = res; best.score = score; }
  }
  const words = best.words.map((x) => ({ r: x.r - best.minR, c: x.c - best.minC, dir: x.dir, ans: x.e.w, clue: x.e.c, en: enumOf(x.e.a) }));
  const starts = [...new Set(words.map((w) => w.r * 100 + w.c))].sort((a, b) => a - b);
  words.forEach((w) => { w.n = starts.indexOf(w.r * 100 + w.c) + 1; });
  words.sort((a, b) => (a.dir === b.dir ? a.n - b.n : a.dir === 'a' ? -1 : 1));
  const grid = Array.from({ length: best.h }, () => Array(best.w).fill(''));
  words.forEach((w) => { for (let i = 0; i < w.ans.length; i++) grid[w.r + (w.dir === 'd' ? i : 0)][w.c + (w.dir === 'a' ? i : 0)] = w.ans[i]; });
  return { theme, seed, w: best.w, h: best.h, words, grid, fill: grid.map((row) => row.map(() => '')), rev: {}, bad: {}, el: 0, done: false, help: false, gaveUp: false };
}
const xCells = (w) => Array.from({ length: w.ans.length }, (_, i) => [w.r + (w.dir === 'd' ? i : 0), w.c + (w.dir === 'a' ? i : 0)]);
const xWordsAt = (r, c) => X.p.words.filter((w) => (w.dir === 'a' ? w.r === r && c >= w.c && c < w.c + w.ans.length : w.c === c && r >= w.r && r < w.r + w.ans.length));

function xInit() {
  const box = $('x-theme');
  if (!box.childElementCount) {
    XTHEMES.forEach(([v, label]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.v = v; b.textContent = label;
      b.addEventListener('click', () => xOpen(v));
      box.appendChild(b);
    });
  }
  xOpen(xTheme);
}
function xOpen(theme, fresh) {
  xPause();
  xTheme = theme; S.xw.theme = theme;
  let p = fresh ? null : S.xw.cur[theme];
  if (theme === 'today') {
    const seed = 'today-' + laKey();
    if (!p || p.seed !== seed) p = xGenerate('today', seed);
  } else if (!p) p = xGenerate(theme, theme + '-' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36));
  S.xw.cur[theme] = p; X.p = p; X.sel = null; X.armed = 0;
  save();
  document.querySelectorAll('#x-theme button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === theme)));
  const label = (XTHEMES.find(([v]) => v === theme) || [])[1];
  $('x-eyebrow').textContent = theme === 'today' ? 'Crossword · the same puzzle for everyone today' : 'Crossword';
  $('x-title').textContent = theme === 'today' ? 'Today’s crossword: ' + fmtKey(p.seed.slice(6), { weekday: 'short', month: 'short', day: 'numeric' })
    : theme === 'mixed' ? 'Mixed crossword' : label + ' crossword';
  $('x-new').hidden = theme === 'today';
  $('x-rev-all').textContent = 'Reveal the puzzle';
  xRender();
  const start = p.words.find((w) => xCells(w).some(([r, c]) => !p.fill[r][c])) || p.words[0];
  xGoWord(start);
  xClock();
  xShowDone(false);
}
function xRender() {
  const p = X.p, grid = $('x-grid'), wrapW = $('x-wrap').clientWidth || 320;
  X.cell = Math.max(22, Math.min(40, Math.floor((wrapW - 4) / p.w)));
  grid.style.setProperty('--cell', X.cell + 'px');
  grid.style.gridTemplateColumns = 'repeat(' + p.w + ', ' + X.cell + 'px)';
  grid.style.gridTemplateRows = 'repeat(' + p.h + ', ' + X.cell + 'px)';
  const num = {};
  p.words.forEach((w) => { num[w.r + ',' + w.c] = w.n; });
  grid.innerHTML = '';
  X.els = [];
  for (let r = 0; r < p.h; r++) {
    const row = [];
    for (let c = 0; c < p.w; c++) {
      const d = document.createElement('div');
      if (p.grid[r][c]) {
        d.className = 'xc'; d.dataset.r = r; d.dataset.c = c;
        d.innerHTML = (num[r + ',' + c] ? '<span class="xn">' + num[r + ',' + c] + '</span>' : '') + '<span class="xl"></span>';
      } else d.className = 'xc x0';
      grid.appendChild(d);
      row.push(d);
    }
    X.els.push(row);
  }
  ['a', 'd'].forEach((dir) => {
    const ol = $(dir === 'a' ? 'x-across' : 'x-down');
    ol.innerHTML = '';
    p.words.forEach((w, i) => {
      if (w.dir !== dir) return;
      const li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.dataset.i = i;
      b.innerHTML = '<b>' + w.n + '</b><span>' + esc(w.clue) + ' <span class="en">' + w.en + '</span></span>';
      b.addEventListener('click', () => { xGoWord(w); keepInView($('x-bar')); xFocus(); });
      li.appendChild(b); ol.appendChild(li);
    });
  });
}
function xPaint() {
  const p = X.p, s = X.sel;
  if (!p || !X.els) return;
  const cur = new Set(s ? xCells(s.w).map(([r, c]) => r + ',' + c) : []);
  for (let r = 0; r < p.h; r++) {
    for (let c = 0; c < p.w; c++) {
      if (!p.grid[r][c]) continue;
      const d = X.els[r][c], k = r + ',' + c;
      d.lastChild.textContent = p.fill[r][c];
      d.classList.toggle('hl', cur.has(k) && !p.done);
      d.classList.toggle('sel', !!s && s.r === r && s.c === c && !p.done);
      d.classList.toggle('bad', !!p.bad[k]);
      d.classList.toggle('rev', !!p.rev[k]);
    }
  }
  $('x-grid').classList.toggle('solved', p.done && !p.gaveUp);
  if (s) $('x-clue').innerHTML = '<b>' + s.w.n + (s.w.dir === 'a' ? ' Across' : ' Down') + '</b>' + esc(s.w.clue) + ' <span class="en">' + s.w.en + '</span>';
  document.querySelectorAll('.x-list button').forEach((b) => {
    const w = p.words[+b.dataset.i];
    b.classList.toggle('on', !!s && w === s.w);
    b.classList.toggle('full', xCells(w).every(([r, c]) => p.fill[r][c]));
  });
}
function xSelect(r, c, dir) {
  const ws = xWordsAt(r, c);
  if (!ws.length) return;
  let w = ws.find((x) => x.dir === dir);
  if (!w) { w = ws[0]; dir = w.dir; }
  X.sel = { r, c, dir, w };
  xPaint();
  const d = X.els[r][c], inp = $('x-input');
  inp.style.left = d.offsetLeft + 'px'; inp.style.top = d.offsetTop + 'px';
  inp.style.width = X.cell + 'px'; inp.style.height = X.cell + 'px';
}
function xGoWord(w) {
  const cells = xCells(w), spot = cells.find(([r, c]) => !X.p.fill[r][c]) || cells[0];
  xSelect(spot[0], spot[1], w.dir);
}
function xFocus() {
  const inp = $('x-input');
  inp.value = '​';
  try { inp.focus({ preventScroll: true }); } catch (e) { inp.focus(); }
  try { inp.setSelectionRange(1, 1); } catch (e) { /* not supported */ }
}
function xNextWord(step, preferEmpty) {
  const p = X.p, list = p.words, i = Math.max(0, list.indexOf(X.sel.w));
  for (let n = 1; n <= list.length; n++) {
    const w = list[(i + step * n + list.length * 4) % list.length];
    if (!preferEmpty || n === list.length || xCells(w).some(([r, c]) => !p.fill[r][c])) { xGoWord(w); return; }
  }
}
function xAfterChange() { save(); xPaint(); xCheckDone(); }
function xType(ch) {
  const p = X.p, s = X.sel;
  if (!p || !s || p.done) return;
  xStart();
  const k = s.r + ',' + s.c;
  if (!p.rev[k]) { p.fill[s.r][s.c] = ch; delete p.bad[k]; }
  const cells = xCells(s.w), i = cells.findIndex(([r, c]) => r === s.r && c === s.c);
  if (i < cells.length - 1) xSelect(cells[i + 1][0], cells[i + 1][1], s.dir);
  else xNextWord(1, true);
  xAfterChange();
}
function xBack() {
  const p = X.p, s = X.sel;
  if (!p || !s || p.done) return;
  const k = s.r + ',' + s.c;
  if (p.fill[s.r][s.c] && !p.rev[k]) { p.fill[s.r][s.c] = ''; delete p.bad[k]; }
  else {
    const cells = xCells(s.w), i = cells.findIndex(([r, c]) => r === s.r && c === s.c);
    if (i > 0) {
      const [r, c] = cells[i - 1];
      xSelect(r, c, s.dir);
      if (!p.rev[r + ',' + c]) { p.fill[r][c] = ''; delete p.bad[r + ',' + c]; }
    }
  }
  xAfterChange();
}
function xArrow(key) {
  const s = X.sel;
  if (!s) return;
  const dir = key === 'ArrowLeft' || key === 'ArrowRight' ? 'a' : 'd';
  if (s.dir !== dir && xWordsAt(s.r, s.c).some((w) => w.dir === dir)) { xSelect(s.r, s.c, dir); return; }
  const dr = key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : 0, dc = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0;
  let r = s.r + dr, c = s.c + dc;
  while (r >= 0 && c >= 0 && r < X.p.h && c < X.p.w) {
    if (X.p.grid[r][c]) { xSelect(r, c, s.dir); return; }
    r += dr; c += dc;
  }
}
function xStart() {
  if (!X.p || X.p.done || X.tick) return;
  X.tick = Date.now();
  clearInterval(X.timer);
  X.timer = setInterval(xClock, 1000);
}
function xPause() {
  if (X.tick && X.p) { X.p.el += Date.now() - X.tick; save(); }
  X.tick = 0; clearInterval(X.timer); X.timer = null;
  xClock();
}
function xClock() { if (X.p) $('x-clock').textContent = fmtClock(X.p.el + (X.tick ? Date.now() - X.tick : 0)); }
function xCheckDone() {
  const p = X.p;
  if (p.done) return;
  for (let r = 0; r < p.h; r++) for (let c = 0; c < p.w; c++) if (p.grid[r][c] && p.fill[r][c] !== p.grid[r][c]) return;
  xPause();
  p.done = true;
  const st = S.xw.stats;
  if (!p.gaveUp) {
    st.solved = (st.solved || 0) + 1;
    if (!p.help && (!st.best[p.theme] || p.el < st.best[p.theme])) st.best[p.theme] = p.el;
    if (p.theme === 'today') st.daily[p.seed.slice(6)] = { ms: p.el, help: p.help };
  }
  save(); xPaint(); xShowDone(true);
  try { $('x-input').blur(); } catch (e) { /* ignore */ }
}
function xShareText() {
  const p = X.p;
  return 'MTA Crossword · ' + fmtKey(p.seed.slice(6), { month: 'short', day: 'numeric', year: 'numeric' }) + '\nSolved in ' + fmtClock(p.el) +
    (p.help ? ' with help' : ', no help') + '\n' + location.origin + location.pathname + '#crossword';
}
function xShowDone(fresh) {
  const p = X.p, box = $('x-done');
  box.hidden = !p.done;
  if (!p.done) return;
  const best = S.xw.stats.best[p.theme];
  $('x-done-t').textContent = p.gaveUp ? 'Puzzle revealed' : 'Solved in ' + fmtClock(p.el);
  $('x-done-s').textContent = p.gaveUp ? 'Every answer is filled in above. Try another one when you’re ready.'
    : (p.help ? 'You used Check or Reveal on this one.' : 'No help used.') + (best ? ' Your best on this kind of puzzle without help: ' + fmtClock(best) + '.' : '');
  const share = p.theme === 'today' && !p.gaveUp;
  $('x-share').hidden = !share; $('x-copy').hidden = !share;
  if (share) $('x-share').textContent = xShareText();
  $('x-another').textContent = p.theme === 'today' ? 'Try a themed puzzle' : 'Another puzzle';
  if (fresh) keepInView(box);
}
function xReveal(cells) {
  const p = X.p;
  if (!p || p.done) return;
  cells.forEach(([r, c]) => { if (p.fill[r][c] !== p.grid[r][c]) { p.fill[r][c] = p.grid[r][c]; p.rev[r + ',' + c] = 1; } delete p.bad[r + ',' + c]; });
  p.help = true;
  xAfterChange();
}
$('x-grid').addEventListener('click', (e) => {
  const d = e.target.closest('.xc');
  if (!d || d.classList.contains('x0') || !X.p) return;
  const r = +d.dataset.r, c = +d.dataset.c, s = X.sel;
  if (s && s.r === r && s.c === c) xSelect(r, c, s.dir === 'a' ? 'd' : 'a');
  else xSelect(r, c, s ? s.dir : 'a');
  // On a phone, bring the clue bar to the top so the grid has room above the keyboard.
  if (window.innerWidth < 700) {
    const top = $('x-bar').getBoundingClientRect().top, mh = $('x-bar').offsetTop ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--modes-h')) || 52 : 52;
    if (top > mh + 8) window.scrollTo(0, window.scrollY + top - mh);
  }
  xFocus();
});
$('x-input').addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (k === 'Backspace') { e.preventDefault(); X.handled = Date.now(); xBack(); }
  else if (k === 'Delete') { e.preventDefault(); const s = X.sel; if (s && !X.p.rev[s.r + ',' + s.c] && !X.p.done) { X.p.fill[s.r][s.c] = ''; xAfterChange(); } }
  else if (k.indexOf('Arrow') === 0) { e.preventDefault(); xArrow(k); }
  else if (k === 'Tab' || k === 'Enter') { e.preventDefault(); xNextWord(e.shiftKey ? -1 : 1, false); }
  else if (k === ' ') { e.preventDefault(); const s = X.sel; if (s) xSelect(s.r, s.c, s.dir === 'a' ? 'd' : 'a'); }
  else if (/^[a-zA-Z]$/.test(k)) { e.preventDefault(); X.handled = Date.now(); xType(k.toUpperCase()); }
});
// Phone keyboards often skip keydown details, so read what landed in the input instead.
// A zero-width space stays in the box so Backspace has something to delete.
$('x-input').addEventListener('input', () => {
  const inp = $('x-input'), v = inp.value;
  if (Date.now() - X.handled > 80) {
    if (!v.length) xBack();
    else for (const ch of v.replace(/​/g, '').toUpperCase()) if (ch >= 'A' && ch <= 'Z') xType(ch);
  }
  inp.value = '​';
  try { inp.setSelectionRange(1, 1); } catch (e) { /* not supported */ }
});
$('x-prev').addEventListener('click', () => { if (X.sel) { xNextWord(-1, false); xFocus(); } });
$('x-next').addEventListener('click', () => { if (X.sel) { xNextWord(1, false); xFocus(); } });
$('x-check').addEventListener('click', () => {
  const p = X.p;
  if (!p || p.done) return;
  let wrong = 0, filled = 0;
  for (let r = 0; r < p.h; r++) {
    for (let c = 0; c < p.w; c++) {
      if (!p.grid[r][c] || !p.fill[r][c]) continue;
      filled++;
      if (p.fill[r][c] !== p.grid[r][c]) { p.bad[r + ',' + c] = 1; wrong++; }
    }
  }
  if (!filled) { toast('Fill in some letters first'); return; }
  p.help = true;
  xAfterChange();
  toast(wrong ? wrong + (wrong === 1 ? ' letter is wrong' : ' letters are wrong') : 'Everything so far is right');
});
$('x-rev-l').addEventListener('click', () => { if (X.sel) { xReveal([[X.sel.r, X.sel.c]]); if (!X.p.done) xFocus(); } });
$('x-rev-w').addEventListener('click', () => { if (X.sel) { xReveal(xCells(X.sel.w)); if (!X.p.done) { xNextWord(1, true); } } });
$('x-rev-all').addEventListener('click', () => {
  const p = X.p, b = $('x-rev-all');
  if (!p || p.done) return;
  if (Date.now() - X.armed > 4000) { X.armed = Date.now(); b.textContent = 'Tap again to reveal everything'; setTimeout(() => { if (Date.now() - X.armed >= 4000) b.textContent = 'Reveal the puzzle'; }, 4100); return; }
  X.armed = 0; b.textContent = 'Reveal the puzzle';
  p.gaveUp = true;
  const all = [];
  for (let r = 0; r < p.h; r++) for (let c = 0; c < p.w; c++) if (p.grid[r][c]) all.push([r, c]);
  xReveal(all);
});
$('x-new').addEventListener('click', () => xOpen(xTheme, true));
$('x-another').addEventListener('click', () => { if (xTheme === 'today') xOpen('mixed', true); else xOpen(xTheme, true); keepInView($('m-crossword')); });
$('x-copy').addEventListener('click', () => copyText(xShareText()));
let xResizeT = 0;
window.addEventListener('resize', () => {
  clearTimeout(xResizeT);
  xResizeT = setTimeout(() => { if (mode === 'crossword' && X.p) { const s = X.sel; xRender(); if (s) xSelect(s.r, s.c, s.dir); else xPaint(); } }, 150);
});
document.addEventListener('visibilitychange', () => { if (document.hidden) xPause(); });

/* ================= LISTEN ================= */
// Two recordings (facts and quiz), each one MP3 with chapter times in audio/tracks.json.
// One file per recording means playback never has to switch files while the phone is locked.
const audio = $('l-audio');
let LM = null, lPending = null, lLastSave = 0, lLastPos = 0, lRep = 0;
let LS;
try { LS = JSON.parse(localStorage.getItem('mta.listen.v1')) || {}; } catch (e) { LS = {}; }
if (!LS || typeof LS !== 'object') LS = {};
if (!LS.pos || typeof LS.pos !== 'object') LS.pos = {};
const lSave = () => { try { localStorage.setItem('mta.listen.v1', JSON.stringify(LS)); } catch (e) { /* ignore */ } };
const SPEEDS = [0.8, 1, 1.25, 1.5];
const fmtT = (s) => {
  s = Math.max(0, Math.floor(s || 0));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : String(m)) + ':' + String(x).padStart(2, '0');
};
const lFile = () => LM.files.find((f) => f.id === LS.file) || LM.files[0];
const lDur = () => (isFinite(audio.duration) && audio.duration > 0 ? audio.duration : lFile().duration);
const lPos = () => (lPending != null ? lPending : audio.currentTime || 0);
function lChAt(t) {
  const ch = lFile().chapters;
  let i = 0;
  for (let k = 0; k < ch.length; k++) if (t + 0.3 >= ch[k].start) i = k;
  return i;
}
async function listenInit() {
  if (LM) { lPaint(); return; }
  try {
    const r = await fetch('audio/tracks.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error(r.status);
    LM = await r.json();
  } catch (e) {
    $('l-now').textContent = 'Couldn’t load the recordings';
    say($('l-msg'), 'Check your connection and try again.', 'no');
    return;
  }
  if (!SPEEDS.includes(LS.speed)) LS.speed = 1;
  if (LS.repeat !== 'one') LS.repeat = 'all';
  const fileBox = $('l-files');
  LM.files.forEach((f) => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.v = f.id;
    b.textContent = f.title + ' · ' + Math.round(f.duration / 60) + ' min';
    b.addEventListener('click', () => { if (f.id !== lFile().id) { const playing = !audio.paused; lStorePos(); LS.file = f.id; lSave(); lLoad(playing); } });
    fileBox.appendChild(b);
  });
  SPEEDS.forEach((v) => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.v = v; b.textContent = (v === 1 ? '1' : String(v)) + '×';
    b.addEventListener('click', () => { LS.speed = v; audio.playbackRate = v; lSave(); lPaint(); });
    $('l-speed').appendChild(b);
  });
  [['all', 'Keep going'], ['one', 'Repeat it']].forEach(([v, label]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.v = v; b.textContent = label;
    b.addEventListener('click', () => { LS.repeat = v; audio.loop = v === 'all'; lRep = lChAt(lPos()); lSave(); lPaint(); });
    $('l-repeat').appendChild(b);
  });
  lLoad(false);
}
function lLoad(autoplay) {
  const f = lFile();
  LS.file = f.id;
  audio.src = f.src;
  audio.loop = LS.repeat === 'all';
  audio.playbackRate = LS.speed;
  lPending = LS.pos[f.id] || 0;
  lRep = lChAt(lPending);
  const dl = $('l-dl');
  dl.href = f.src; dl.setAttribute('download', 'MTA Study Guide - ' + f.title + '.mp3');
  const ol = $('l-topics');
  ol.innerHTML = '';
  f.chapters.forEach((ch, i) => {
    const li = document.createElement('li'), b = document.createElement('button');
    b.type = 'button'; b.dataset.i = i;
    b.innerHTML = esc(ch.title) + '<span>' + fmtT(ch.end - ch.start) + '</span>';
    b.addEventListener('click', () => { lSeek(ch.start); lPlay(); });
    li.appendChild(b); ol.appendChild(li);
  });
  lPaint();
  if (autoplay) lPlay();
}
function lPlay() {
  audio.playbackRate = LS.speed;
  const p = audio.play();
  if (p && p.catch) p.catch(() => say($('l-msg'), 'Tap play again to start the audio.', ''));
}
function lSeek(t) {
  t = Math.max(0, Math.min(t, lDur() - 0.5));
  if (audio.readyState >= 1) { audio.currentTime = t; lPending = null; } else lPending = t;
  lRep = lChAt(t);
  LS.pos[lFile().id] = t; lSave();
  lPaint();
}
function lStorePos() { if (LM) { LS.pos[lFile().id] = lPos(); lSave(); } }
function lPrev() {
  const f = lFile(), t = lPos(), i = lChAt(t), ch = f.chapters[i];
  lSeek(t - ch.start > 3 || i === 0 ? ch.start : f.chapters[i - 1].start);
}
function lNext() {
  const f = lFile(), i = lChAt(lPos());
  lSeek(f.chapters[(i + 1) % f.chapters.length].start);
}
function lMeta(i) {
  if (!('mediaSession' in navigator) || !LM || typeof MediaMetadata === 'undefined') return;
  const f = lFile(), ch = f.chapters[i] || f.chapters[0];
  try {
    navigator.mediaSession.metadata = new MediaMetadata({ title: ch.title, artist: 'MTA Study Guide', album: f.title,
      artwork: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }] });
  } catch (e) { /* ignore */ }
}
let lShownCh = -1;
function lPaint() {
  if (!LM) return;
  const f = lFile(), t = lPos(), d = lDur(), i = lChAt(t), playing = !audio.paused;
  document.querySelectorAll('#l-files button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === f.id)));
  document.querySelectorAll('#l-speed button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.v === LS.speed)));
  document.querySelectorAll('#l-repeat button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === LS.repeat)));
  $('l-file').textContent = f.title;
  $('l-now').textContent = f.chapters[i].title;
  if (!$('l-seek').matches(':active')) $('l-seek').value = String(Math.round((t / d) * 1000) || 0);
  $('l-cur').textContent = fmtT(t);
  $('l-left').textContent = '-' + fmtT(d - t);
  $('l-play').setAttribute('aria-label', playing ? 'Pause' : 'Play');
  $('l-play-i').innerHTML = playing ? '<path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/>' : '<path d="M8 5v14l11-7z" fill="currentColor"/>';
  $('tab-listen').classList.toggle('playing', playing);
  document.querySelectorAll('#l-topics button').forEach((b) => b.classList.toggle('on', +b.dataset.i === i));
  if (i !== lShownCh) { lShownCh = i; lMeta(i); }
}
audio.addEventListener('loadedmetadata', () => {
  audio.playbackRate = LS.speed;
  if (lPending != null) { try { audio.currentTime = lPending; } catch (e) { /* ignore */ } lPending = null; }
  lPaint();
});
audio.addEventListener('timeupdate', () => {
  if (!LM) return;
  const f = lFile(), t = audio.currentTime;
  // "Repeat it": once the topic being held has ended, go back to its start.
  if (LS.repeat === 'one' && !audio.paused) {
    const ch = f.chapters[lRep] || f.chapters[lChAt(t)];
    if (t >= ch.end + 0.4) { audio.currentTime = ch.start; return; }
  }
  lPaint();
  const now = Date.now();
  if (now - lLastSave > 5000) { lLastSave = now; LS.pos[f.id] = t; lSave(); }
  if ('mediaSession' in navigator && navigator.mediaSession.setPositionState && Math.abs(t - lLastPos) > 2) {
    lLastPos = t;
    try { navigator.mediaSession.setPositionState({ duration: lDur(), playbackRate: audio.playbackRate, position: Math.min(t, lDur()) }); } catch (e) { /* ignore */ }
  }
});
audio.addEventListener('play', () => { say($('l-msg'), ''); lPaint(); if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'; });
audio.addEventListener('pause', () => { lStorePos(); lPaint(); if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'; });
audio.addEventListener('ended', () => { if (LS.repeat === 'all') { audio.currentTime = 0; lPlay(); } });
audio.addEventListener('error', () => { if (audio.getAttribute('src')) say($('l-msg'), 'Couldn’t play the audio. Check your connection and try again.', 'no'); });
window.addEventListener('pagehide', lStorePos);
$('l-play').addEventListener('click', () => { if (!LM) return; if (audio.paused) lPlay(); else audio.pause(); });
$('l-prev').addEventListener('click', () => { if (LM) lPrev(); });
$('l-next').addEventListener('click', () => { if (LM) lNext(); });
$('l-back').addEventListener('click', () => { if (LM) lSeek(lPos() - 15); });
$('l-fwd').addEventListener('click', () => { if (LM) lSeek(lPos() + 15); });
$('l-seek').addEventListener('input', () => { if (!LM) return; const t = (+$('l-seek').value / 1000) * lDur(); $('l-cur').textContent = fmtT(t); $('l-left').textContent = '-' + fmtT(lDur() - t); });
$('l-seek').addEventListener('change', () => { if (LM) lSeek((+$('l-seek').value / 1000) * lDur()); });
if ('mediaSession' in navigator) {
  const ms = navigator.mediaSession, on = (a, fn) => { try { ms.setActionHandler(a, fn); } catch (e) { /* not supported */ } };
  on('play', () => lPlay());
  on('pause', () => audio.pause());
  on('previoustrack', () => lPrev());
  on('nexttrack', () => lNext());
  on('seekbackward', (d) => lSeek(lPos() - ((d && d.seekOffset) || 15)));
  on('seekforward', (d) => lSeek(lPos() + ((d && d.seekOffset) || 15)));
  on('seekto', (d) => { if (d && d.seekTime != null) lSeek(d.seekTime); });
}

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
  } else if (mode === 'listen' && e.key === ' ' && tag !== 'BUTTON' && tag !== 'A' && LM) {
    e.preventDefault();
    if (audio.paused) lPlay(); else audio.pause();
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
