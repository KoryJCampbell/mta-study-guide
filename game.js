// Diamond Run: a 3D quiz runner for the LA Alumni MTA study guide.
// Steer the diamond through the gate that holds the right answer.
import * as THREE from './vendor/three.module.min.js';
import { DECKS, FOUNDERS, BANK, greekQuestion } from './game-data.js';

const $ = (id) => document.getElementById(id);
const rand = (n) => Math.floor(Math.random() * n);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const sample = (a, n) => shuffle(a).slice(0, n);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TEST = /[?&]test\b/.test(location.search);
const DECK_NAME = Object.fromEntries(DECKS);
DECK_NAME.missed = 'Review misses';
const FONT = '"Source Sans 3", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/* ---------- saved progress ---------- */
const KEY = 'mta.game.v1';
let S = {};
try { S = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { S = {}; }
S.stats = S.stats || {}; S.best = S.best || 0; S.deck = S.deck || 'all'; S.mute = !!S.mute;
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode */ } };

/* ---------- sound (synthesized, no files) ---------- */
let actx = null;
function tone(freqs, type, dur, vol) {
  if (S.mute) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    let t = actx.currentTime + 0.01;
    for (const f of freqs) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + dur + 0.03);
      t += dur * 0.75;
    }
  } catch (e) { /* audio not available */ }
}
const sfx = {
  good: () => tone([659, 880, 1319], 'triangle', 0.1, 0.09),
  bad: () => tone([220, 165], 'sawtooth', 0.17, 0.045),
  move: () => tone([540], 'sine', 0.045, 0.025),
  rush: () => tone([392, 523], 'square', 0.06, 0.025),
  start: () => tone([440, 554, 659, 880], 'triangle', 0.08, 0.07)
};

/* ---------- renderer ---------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('scene'), antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  $('menu').hidden = true; $('nogl').hidden = false;
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
const MAX_ANISO = renderer.capabilities.getMaxAnisotropy();

const scene = new THREE.Scene();
const HORIZON = new THREE.Color('#3A0906');
scene.background = HORIZON;
scene.fog = new THREE.Fog(HORIZON, 34, 125);
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);

// Sky: a gradient dome that meets the fog color at the horizon.
scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(320, 32, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { top: { value: new THREE.Color('#0D0201') }, horizon: { value: HORIZON }, glow: { value: new THREE.Color('#8C2412') } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 horizon; uniform vec3 glow; varying vec3 vP;\n' +
      'void main(){ float h = vP.y; vec3 c = mix(horizon, top, smoothstep(0.0, 0.5, h));\n' +
      'c = mix(c, glow, (1.0 - smoothstep(0.0, 0.16, abs(h - 0.03))) * 0.5);\n' +
      'gl_FragColor = vec4(c, 1.0);\n#include <colorspace_fragment>\n}'
  })
));

scene.add(new THREE.HemisphereLight(0xFFE6D2, 0x3A0906, 2.0));
const sun = new THREE.DirectionalLight(0xFFF0DC, 2.4);
sun.position.set(-5, 12, 8);
scene.add(sun);

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = MAX_ANISO;
  return t;
}

/* ---------- road, ground, scenery ---------- */
const LANE_W = 2.4, LANES = [-LANE_W, 0, LANE_W], ROAD_W = LANE_W * 3;
const TILE = 10; // world units per texture repeat along the road

const roadTex = canvasTexture(512, 512, (g, w, h) => {
  g.fillStyle = '#521009'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(242,235,215,0.06)'; g.lineWidth = 3;
  for (let x = -h; x < w + h; x += 85) {
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x + h, h); g.stroke();
    g.beginPath(); g.moveTo(x + h, 0); g.lineTo(x, h); g.stroke();
  }
  g.fillStyle = '#F2EBD7'; g.fillRect(6, 0, 12, h); g.fillRect(w - 18, 0, 12, h);
  g.fillStyle = 'rgba(242,235,215,0.6)';
  for (let y = 0; y < h; y += 128) { g.fillRect(w / 3 - 5, y + 20, 10, 70); g.fillRect(2 * w / 3 - 5, y + 20, 10, 70); }
});
roadTex.wrapT = THREE.RepeatWrapping; roadTex.repeat.set(1, 260 / TILE);
const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, 260), new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.82, metalness: 0.05 }));
road.rotation.x = -Math.PI / 2; road.position.set(0, 0, -110);
scene.add(road);

const groundTex = canvasTexture(256, 256, (g, w, h) => {
  g.fillStyle = '#300805'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(242,235,215,0.11)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(w / 2, 8); g.lineTo(w - 8, h / 2); g.lineTo(w / 2, h - 8); g.lineTo(8, h / 2); g.closePath(); g.stroke();
});
groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping; groundTex.repeat.set(400 / TILE, 400 / TILE);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.03, -170);
scene.add(ground);

const creamMat = new THREE.MeshStandardMaterial({ color: '#F2EBD7', roughness: 0.55 });
const crimsonMat = new THREE.MeshStandardMaterial({ color: '#70110C', emissive: '#70110C', emissiveIntensity: 0.45, roughness: 0.45 });
const goldMat = new THREE.MeshStandardMaterial({ color: '#E9C979', emissive: '#7A5512', emissiveIntensity: 0.7, roughness: 0.3, metalness: 0.45, flatShading: true });

// Columns topped with diamonds line both sides of the road.
const columns = [];
const colGeo = new THREE.BoxGeometry(0.46, 3.8, 0.46), capGeo = new THREE.OctahedronGeometry(0.4), baseGeo = new THREE.BoxGeometry(0.8, 0.3, 0.8);
const COL_GAP = 11, COL_COUNT = 14;
for (let i = 0; i < COL_COUNT; i++) {
  for (const side of [-1, 1]) {
    const c = new THREE.Group();
    const shaft = new THREE.Mesh(colGeo, creamMat); shaft.position.y = 2.05;
    const base = new THREE.Mesh(baseGeo, crimsonMat); base.position.y = 0.15;
    const cap = new THREE.Mesh(capGeo, goldMat); cap.position.y = 4.45;
    c.add(shaft, base, cap);
    c.position.set(side * (ROAD_W / 2 + 3.4), 0, 8 - i * COL_GAP);
    c.userData.cap = cap;
    scene.add(c); columns.push(c);
  }
}

// Large wireframe diamonds and stars far off in the sky.
const skyDiamonds = [[-46, 26, -190, 11], [52, 36, -230, 15], [6, 52, -300, 22]].map(([x, y, z, s]) => {
  const m = new THREE.Mesh(new THREE.OctahedronGeometry(s), new THREE.MeshBasicMaterial({ color: '#F2EBD7', wireframe: true, transparent: true, opacity: 0.16, fog: false }));
  m.position.set(x, y, z); scene.add(m); return m;
});
{
  const n = 500, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const th = Math.random() * Math.PI - Math.PI, ph = 0.06 + Math.random() * 1.2, r = 300;
    pos[i * 3] = r * Math.cos(ph) * Math.sin(th); pos[i * 3 + 1] = r * Math.sin(ph); pos[i * 3 + 2] = -Math.abs(r * Math.cos(ph) * Math.cos(th));
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: '#F2EBD7', size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.55, fog: false })));
}

/* ---------- the player's diamond ---------- */
const player = new THREE.Group();
const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), new THREE.MeshStandardMaterial({
  color: '#F2EBD7', emissive: '#F2EBD7', emissiveIntensity: 0.28, roughness: 0.2, metalness: 0.35, flatShading: true
}));
gem.scale.set(1, 1.38, 1);
const cage = new THREE.Mesh(new THREE.OctahedronGeometry(0.64), new THREE.MeshBasicMaterial({ color: '#E0452F', wireframe: true, transparent: true, opacity: 0.5 }));
cage.scale.copy(gem.scale);
const glow = new THREE.PointLight('#FFD6A8', 9, 7, 1.6); glow.position.y = 0.1;
player.add(gem, cage, glow);
player.position.set(0, 1, 0);
scene.add(player);
const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.55, 28), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.38, depthWrite: false }));
shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.02;
scene.add(shadow);

/* ---------- particles: trail behind the diamond and bursts at the gates ---------- */
const dotTex = canvasTexture(64, 64, (g, w, h) => {
  const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.35, 'rgba(255,255,255,0.7)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
});
function particleSystem(n, size) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.frustumCulled = false; scene.add(pts);
  return { n, pos, col, vel: new Float32Array(n * 3), base: new Float32Array(n * 3), life: new Float32Array(n), next: 0, g };
}
const trail = particleSystem(70, 0.26);
const sparks = particleSystem(220, 0.38);
const tmpColor = new THREE.Color();

function emit(ps, x, y, z, vx, vy, vz, color) {
  const i = ps.next; ps.next = (ps.next + 1) % ps.n;
  ps.pos[i * 3] = x; ps.pos[i * 3 + 1] = y; ps.pos[i * 3 + 2] = z;
  ps.vel[i * 3] = vx; ps.vel[i * 3 + 1] = vy; ps.vel[i * 3 + 2] = vz;
  tmpColor.set(color); ps.base[i * 3] = tmpColor.r; ps.base[i * 3 + 1] = tmpColor.g; ps.base[i * 3 + 2] = tmpColor.b;
  ps.life[i] = 1;
}
function burst(color, count) {
  for (let k = 0; k < count; k++) {
    const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 5.5;
    emit(sparks, player.position.x, player.position.y, player.position.z,
      Math.cos(a) * s, 2.5 + Math.random() * 5, Math.sin(a) * s * 0.6, Math.random() < 0.35 ? '#E9C979' : color);
  }
}
function stepParticles(ps, dt, drift, gravity, fade) {
  for (let i = 0; i < ps.n; i++) {
    if (ps.life[i] <= 0) { ps.col[i * 3] = ps.col[i * 3 + 1] = ps.col[i * 3 + 2] = 0; continue; }
    ps.life[i] -= dt * fade;
    ps.vel[i * 3 + 1] -= gravity * dt;
    ps.pos[i * 3] += ps.vel[i * 3] * dt;
    ps.pos[i * 3 + 1] = Math.max(0.05, ps.pos[i * 3 + 1] + ps.vel[i * 3 + 1] * dt);
    ps.pos[i * 3 + 2] += (ps.vel[i * 3 + 2] + drift) * dt;
    const l = Math.max(ps.life[i], 0);
    ps.col[i * 3] = ps.base[i * 3] * l; ps.col[i * 3 + 1] = ps.base[i * 3 + 1] * l; ps.col[i * 3 + 2] = ps.base[i * 3 + 2] * l;
  }
  ps.g.attributes.position.needsUpdate = true; ps.g.attributes.color.needsUpdate = true;
}

/* ---------- answer gates ---------- */
const PANEL_W = 2.04, PANEL_H = 1.16;
const postGeo = new THREE.BoxGeometry(0.16, 3.4, 0.16), beamGeo = new THREE.BoxGeometry(2.3, 0.18, 0.22), ornGeo = new THREE.OctahedronGeometry(0.22);
const gates = LANES.map((x) => {
  const g = new THREE.Group();
  const l = new THREE.Mesh(postGeo, creamMat); l.position.set(-1.08, 1.7, 0);
  const r = new THREE.Mesh(postGeo, creamMat); r.position.set(1.08, 1.7, 0);
  const beam = new THREE.Mesh(beamGeo, crimsonMat); beam.position.y = 3.45;
  const orn = new THREE.Mesh(ornGeo, goldMat); orn.position.y = 3.82;
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 292;
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = MAX_ANISO;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(PANEL_W, PANEL_H), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  panel.position.y = 2.6;
  g.add(l, r, beam, orn, panel);
  g.position.set(x, 0, -300); g.visible = false;
  scene.add(g);
  return { g, panel, canvas, tex, orn };
});

function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function wrapLines(g, text, max) {
  const words = String(text).split(/\s+/), lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (!cur || g.measureText(t).width <= max) cur = t; else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}
const PANEL_STYLE = {
  idle: ['#F2EBD7', '#70110C', '#70110C'],
  right: ['#DDEFE1', '#1E5A34', '#3E9A62'],
  wrong: ['#F5D5D0', '#8E1B12', '#C0392B'],
  dim: ['#D9CFBC', '#8E8179', '#A89C8A']
};
function drawPanel(gate, text, mode) {
  const g = gate.canvas.getContext('2d'), W = gate.canvas.width, H = gate.canvas.height;
  const [bg, ink, edge] = PANEL_STYLE[mode] || PANEL_STYLE.idle;
  g.clearRect(0, 0, W, H);
  roundRect(g, 4, 4, W - 8, H - 8, 30); g.fillStyle = bg; g.fill();
  g.lineWidth = 8; g.strokeStyle = edge; roundRect(g, 18, 18, W - 36, H - 36, 20); g.stroke();
  const maxW = W - 80, maxH = H - 70;
  let size = 66, lines = [];
  for (; size >= 24; size -= 2) {
    g.font = `700 ${size}px ${FONT}`;
    lines = wrapLines(g, text, maxW);
    if (lines.length * size * 1.1 <= maxH && lines.every((ln) => g.measureText(ln).width <= maxW)) break;
  }
  g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
  const lh = size * 1.1, y0 = H / 2 - ((lines.length - 1) * lh) / 2 + size * 0.04;
  lines.forEach((ln, i) => g.fillText(ln, W / 2, y0 + i * lh));
  gate.tex.needsUpdate = true;
}

/* ---------- picking questions ---------- */
const ALL = DECKS.map((d) => d[0]).filter((k) => k !== 'all');

// Questions missed and not yet answered right twice in a row.
function missedList() {
  const out = [];
  for (const it of BANK) { const s = S.stats[it.id]; if (s && s.m > 0 && (s.k || 0) < 2) out.push(it); }
  for (const id of Object.keys(S.stats)) {
    if (!id.startsWith('gk-')) continue;
    const s = S.stats[id];
    if (s.m > 0 && (s.k || 0) < 2) { const g = greekQuestion(id); if (g) out.push(g); }
  }
  return out;
}
// Missed questions come up more often; ones answered right three times in a row come up less.
function weight(id) {
  const s = S.stats[id];
  if (!s) return 1.4;
  let w = 1 + Math.min(s.m || 0, 4) * 1.25;
  if ((s.k || 0) >= 3) w *= 0.3;
  return w;
}
function weighted(list) {
  const n = Math.min(14, Math.floor(list.length / 2));
  const avoid = new Set(n ? run.recent.slice(-n) : []);
  let cand = list.filter((it) => !avoid.has(it.id));
  if (!cand.length) cand = list;
  let total = 0;
  const acc = cand.map((it) => (total += weight(it.id)));
  const x = Math.random() * total;
  return cand[acc.findIndex((v) => v >= x)] || cand[0];
}
function pickItem() {
  let deck = run.deck;
  if (deck === 'missed') {
    const list = missedList();
    if (list.length) return weighted(list);
    run.deck = deck = 'all';
    showToast('<div class="info">Every miss cleared. Switching to All.</div>', 1800);
  }
  if (deck === 'all') deck = ALL[rand(ALL.length)];
  if (deck === 'greek' && Math.random() < 0.72) {
    for (let i = 0; i < 10; i++) { const g = greekQuestion(); if (!run.recent.includes(g.id)) return g; }
  }
  return weighted(BANK.filter((it) => it.d === deck));
}
function build(it) {
  let a, wrong;
  if (it.who) {
    const whos = [].concat(it.who), key = whos[rand(whos.length)];
    a = FOUNDERS[key];
    const skip = new Set([...whos, ...it.not]);
    wrong = sample(Object.keys(FOUNDERS).filter((k) => !skip.has(k)), 2).map((k) => FOUNDERS[k]);
  } else if (it.right) {
    a = it.right[rand(it.right.length)];
    wrong = sample(it.wrong.filter((x) => x !== a), 2);
  } else { a = it.a; wrong = it.w; }
  const opts = shuffle([a, ...wrong]);
  return { id: it.id, d: it.d, q: it.q, a, n: it.n, opts, correct: opts.indexOf(a) };
}

/* ---------- game state ---------- */
const SPAWN_Z = -86, IDLE_SPEED = 7;
let state = 'menu'; // menu | play | paused | over
let lane = 1, rush = false, round = null, gap = 0, shake = 0, kick = 0, speed = IDLE_SPEED, trailAcc = 0, camX = 0;
const run = { deck: 'all', score: 0, lives: 3, streak: 0, correct: 0, total: 0, missed: [], recent: [] };
const lanesEls = [...document.querySelectorAll('.lane')];
const mult = () => 1 + Math.min(Math.floor(run.streak / 3), 4) * 0.5;
const show = (id, on) => { $(id).hidden = !on; };
if (TEST) window.__dr = { round: null, get state() { return state; }, get lane() { return lane; }, get run() { return run; }, setLane: (i) => setLane(i), rush: () => doRush() };

let toastTimer = 0;
function showToast(html, ms) {
  const el = $('toast');
  el.innerHTML = html; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}
function paintHud() {
  $('score').textContent = run.score.toLocaleString();
  [...$('lives').children].forEach((el, i) => el.classList.toggle('off', i >= run.lives));
  $('lives').setAttribute('aria-label', run.lives + (run.lives === 1 ? ' life left' : ' lives left'));
  const m = mult();
  $('streak').textContent = run.streak >= 2 ? `Streak ${run.streak}${m > 1 ? ' · ×' + m : ''}` : '';
}
function paintLanes() {
  const open = !!(round && !round.done);
  lanesEls.forEach((el, i) => el.classList.toggle('on', open && i === lane));
}
function setPlayUI(on) { ['hud', 'qcard', 'lanes'].forEach((id) => show(id, on)); if (!on) show('rushHint', false); }

function setLane(i) {
  if (state !== 'play') return;
  i = clamp(i, 0, 2);
  if (i !== lane) { lane = i; sfx.move(); }
  paintLanes();
}
function doRush() {
  if (state !== 'play' || !round || round.done || rush) return;
  rush = true; sfx.rush();
  show('rushHint', false);
  if (!S.rushed) { S.rushed = true; persist(); }
}

function nextRound() {
  const r = build(pickItem());
  run.recent.push(r.id); if (run.recent.length > 14) run.recent.shift();
  // Longer questions get more reading time. Time shrinks as the run goes on.
  const chars = r.q.length + r.opts.join(' ').length;
  r.T = clamp(3 + chars * 0.045, 5, 10.5) * Math.max(0.62, 1 - run.correct * 0.012);
  r.speed = -SPAWN_Z / r.T; r.z = SPAWN_Z; r.t = 0; r.after = 0; r.done = false;
  rush = false; round = r;
  gates.forEach((gate, i) => {
    drawPanel(gate, r.opts[i], 'idle');
    gate.g.position.set(LANES[i], -3.8, SPAWN_Z); gate.g.visible = true; gate.panel.material.opacity = 1;
  });
  $('qdeck').textContent = DECK_NAME[r.d] || '';
  $('qtext').textContent = r.q;
  $('timer').style.transform = 'scaleX(1)';
  lanesEls.forEach((el, i) => {
    el.classList.remove('right', 'wrong');
    el.querySelector('span').textContent = r.opts[i];
    el.setAttribute('aria-label', `Lane ${i + 1}: ${r.opts[i]}`);
  });
  show('rushHint', !S.rushed && run.total >= 1 && run.total < 6);
  paintLanes(); paintHud();
  if (TEST) window.__dr.round = { seq: run.total, id: r.id, q: r.q, opts: r.opts.slice(), correct: r.correct };
}

function resolve() {
  const r = round;
  r.done = true; rush = false;
  const ok = lane === r.correct;
  run.total++;
  const st = S.stats[r.id] || (S.stats[r.id] = { s: 0, c: 0, m: 0, k: 0 });
  st.s = (st.s || 0) + 1;
  gates.forEach((gate, i) => drawPanel(gate, r.opts[i], i === r.correct ? 'right' : i === lane ? 'wrong' : 'dim'));
  lanesEls.forEach((el, i) => {
    el.classList.remove('on');
    el.classList.toggle('right', i === r.correct);
    el.classList.toggle('wrong', !ok && i === lane);
  });
  show('rushHint', false);
  if (ok) {
    st.c = (st.c || 0) + 1; st.k = (st.k || 0) + 1;
    run.correct++; run.streak++;
    const bonus = Math.round(100 * clamp(1 - r.t / r.T, 0, 1)), m = mult();
    const pts = Math.round((100 + bonus) * m);
    run.score += pts;
    burst('#9FE3B8', 48); sfx.good();
    showToast(`<div class="pts">+${pts}</div>${m > 1 ? `<div class="mult">×${m} streak</div>` : ''}`, 800);
    gap = 0.7;
  } else {
    st.m = (st.m || 0) + 1; st.k = 0;
    run.streak = 0; run.lives--;
    run.missed.push({ q: r.q, a: r.a });
    burst('#FF6B4A', 40); sfx.bad();
    if (!REDUCED) shake = 0.6;
    try { if (navigator.vibrate) navigator.vibrate(120); } catch (e) { /* not supported */ }
    showToast(`<div class="miss"><b>Answer</b><p>${esc(r.a)}</p>${r.n ? `<small>${esc(r.n)}</small>` : ''}</div>`, 2500);
    gap = 2.7;
  }
  persist(); paintHud();
}

/* ---------- screens ---------- */
function startRun() {
  if (S.deck === 'missed' && !missedList().length) S.deck = 'all';
  Object.assign(run, { deck: S.deck, score: 0, lives: 3, streak: 0, correct: 0, total: 0, missed: [], recent: [] });
  lane = 1; rush = false; round = null; gap = 0.9; shake = 0;
  gates.forEach((gate) => { gate.g.visible = false; });
  ['menu', 'over', 'paused'].forEach((id) => show(id, false));
  $('qdeck').textContent = DECK_NAME[run.deck] || '';
  $('qtext').textContent = 'Get ready…';
  $('timer').style.transform = 'scaleX(1)';
  lanesEls.forEach((el) => { el.classList.remove('right', 'wrong', 'on'); el.querySelector('span').textContent = ''; el.removeAttribute('aria-label'); });
  setPlayUI(true);
  state = 'play';
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  sfx.start(); paintHud(); paintLanes();
}
function endRun() {
  state = 'over'; round = null; rush = false;
  gates.forEach((gate) => { gate.g.visible = false; });
  setPlayUI(false); show('paused', false);
  const isBest = run.score > S.best;
  if (isBest) S.best = run.score;
  persist();
  $('ovScore').textContent = run.score.toLocaleString();
  $('ovBest').textContent = S.best.toLocaleString();
  $('ovRight').textContent = `${run.correct}/${run.total}`;
  $('ovNew').hidden = !isBest || !run.score;
  const ul = $('ovList'), seen = new Set();
  ul.innerHTML = '';
  for (const m of run.missed) {
    if (seen.has(m.q)) continue;
    seen.add(m.q);
    const li = document.createElement('li');
    li.innerHTML = `${esc(m.q)}<b>${esc(m.a)}</b>`;
    ul.appendChild(li);
  }
  show('ovReview', run.missed.length > 0);
  show('ovPerfect', !run.missed.length && run.total > 0);
  show('over', true);
}
function buildMenu() {
  const missN = missedList().length;
  if (S.deck === 'missed' && !missN) S.deck = 'all';
  const box = $('decks');
  box.innerHTML = '';
  for (const [k, label] of [...DECKS, ['missed', `Review misses${missN ? ' (' + missN + ')' : ''}`]]) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = label;
    b.setAttribute('aria-pressed', String(S.deck === k));
    if (k === 'missed' && !missN) { b.disabled = true; b.title = 'Questions you miss collect here'; }
    b.addEventListener('click', () => { S.deck = k; persist(); buildMenu(); });
    box.appendChild(b);
  }
  $('best').textContent = S.best ? `Best run: ${S.best.toLocaleString()}` : '';
}
function openMenu() {
  state = 'menu'; round = null;
  setPlayUI(false);
  gates.forEach((gate) => { gate.g.visible = false; });
  ['over', 'paused'].forEach((id) => show(id, false));
  buildMenu(); show('menu', true);
}
function pause() {
  if (state !== 'play') return;
  state = 'paused';
  $('pausedDeck').textContent = `${DECK_NAME[run.deck] || ''} · ${run.score.toLocaleString()} points`;
  show('paused', true);
}
function resume() {
  if (state !== 'paused') return;
  show('paused', false); state = 'play'; clock.getDelta();
}

const ICON_SOUND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
const ICON_MUTED = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="m16 9 5 6M21 9l-5 6"/></svg>';
function paintMute() {
  const b = $('mute');
  b.innerHTML = S.mute ? ICON_MUTED : ICON_SOUND;
  b.setAttribute('aria-label', 'Mute');
  b.setAttribute('aria-pressed', String(S.mute));
}

/* ---------- input ---------- */
$('start').addEventListener('click', startRun);
$('again').addEventListener('click', startRun);
$('toMenu').addEventListener('click', openMenu);
$('pause').addEventListener('click', pause);
$('resume').addEventListener('click', resume);
$('endRun').addEventListener('click', endRun);
$('mute').addEventListener('click', () => { S.mute = !S.mute; persist(); paintMute(); });
lanesEls.forEach((el, i) => el.addEventListener('click', () => { setLane(i); el.blur(); }));

// Tap a third of the screen to jump to that lane, swipe sideways to move one lane, swipe up to rush.
const touch = $('touch');
let p0 = null;
touch.addEventListener('pointerdown', (e) => { if (state === 'play') p0 = { x: e.clientX, y: e.clientY, id: e.pointerId }; });
touch.addEventListener('pointerup', (e) => {
  if (!p0 || state !== 'play' || e.pointerId !== p0.id) { p0 = null; return; }
  const dx = e.clientX - p0.x, dy = e.clientY - p0.y;
  p0 = null;
  if (Math.abs(dx) > 34 && Math.abs(dx) > Math.abs(dy)) setLane(lane + Math.sign(dx));
  else if (dy < -42 && -dy > Math.abs(dx)) doRush();
  else if (Math.abs(dx) < 16 && Math.abs(dy) < 16) setLane(Math.floor((e.clientX / innerWidth) * 3));
});
touch.addEventListener('pointercancel', () => { p0 = null; });

addEventListener('keydown', (e) => {
  const k = e.key;
  if (state === 'play') {
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') setLane(lane - 1);
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') setLane(lane + 1);
    else if (k === '1' || k === '2' || k === '3') setLane(+k - 1);
    else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') doRush();
    else if (k === 'p' || k === 'P' || k === 'Escape') pause();
    else return;
    e.preventDefault();
  } else if (state === 'paused') {
    if (k === 'p' || k === 'P' || k === 'Escape' || k === ' ') { e.preventDefault(); resume(); }
  } else if ((state === 'menu' || state === 'over') && k === 'Enter') {
    const a = document.activeElement;
    if (!(a instanceof HTMLButtonElement) && !(a instanceof HTMLAnchorElement)) startRun();
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
addEventListener('blur', pause);

/* ---------- sizing ---------- */
let portrait = false, baseFov = 55;
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  portrait = camera.aspect < 0.85;
  // On tall screens widen the view so all three lanes stay visible.
  const need = 0.36 / camera.aspect, min = Math.tan(THREE.MathUtils.degToRad(26));
  baseFov = THREE.MathUtils.radToDeg(2 * Math.atan(clamp(need, min, 0.9)));
  camera.fov = baseFov;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

/* ---------- main loop ---------- */
const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  const raw = Math.min(clock.getDelta(), 0.05);
  const dt = state === 'paused' ? 0 : raw;
  const t = clock.elapsedTime;

  // World speed follows the current gate row; rushing triples it.
  let target = IDLE_SPEED;
  if (state === 'play') target = round ? round.speed * (rush && !round.done ? 3.2 : 1) : 9;
  speed = damp(speed, target, rush ? 5 : 3, dt);
  const move = speed * dt;
  roadTex.offset.y += move / TILE;
  groundTex.offset.y += move / TILE;
  for (const c of columns) {
    c.position.z += move;
    if (c.position.z > 9) c.position.z -= COL_COUNT * COL_GAP;
    c.userData.cap.rotation.y += dt * 1.4;
  }
  skyDiamonds.forEach((m, i) => { m.rotation.y += dt * (0.05 + i * 0.02); m.rotation.x += dt * 0.015; });

  if (state === 'play') {
    if (round) {
      round.z += move;
      if (!round.done) {
        round.t += dt;
        const rise = clamp(round.t / 0.7, 0, 1), y = -3.8 * Math.pow(1 - rise, 3);
        for (const gate of gates) { gate.g.position.z = round.z; gate.g.position.y = y; gate.orn.rotation.y += dt * 2; }
        $('timer').style.transform = `scaleX(${clamp(round.z / SPAWN_Z, 0, 1).toFixed(3)})`;
        if (round.z >= 0) resolve();
      } else {
        // After the pass the gates sink into the road; the right one lingers a moment.
        round.after += dt;
        gates.forEach((gate, i) => {
          const a = Math.max(0, round.after - (i === round.correct ? 0.35 : 0));
          gate.g.position.z = round.z;
          gate.g.position.y = -14 * a * a;
          gate.panel.material.opacity = clamp(1 - a * 1.6, 0, 1);
          if (round.z > 20) gate.g.visible = false;
        });
      }
    }
    if (!round || round.done) {
      gap -= dt;
      if (gap <= 0) { if (run.lives > 0) nextRound(); else endRun(); }
    }
  }

  // The diamond
  const tx = LANES[lane];
  player.position.x = damp(player.position.x, tx, 13, dt);
  player.rotation.z = clamp(-(tx - player.position.x) * 0.32, -0.55, 0.55);
  player.position.y = 1 + (REDUCED ? 0 : Math.sin(t * 3.2) * 0.09);
  gem.rotation.y += dt * (1.4 + speed * 0.09);
  cage.rotation.y -= dt * 0.9;
  cage.rotation.x = Math.sin(t * 0.7) * 0.25;
  glow.intensity = 8 + Math.sin(t * 6) * 1.5;
  shadow.position.x = player.position.x;
  shadow.material.opacity = 0.34 - (player.position.y - 1) * 0.6;
  if (dt > 0) {
    trailAcc += dt * (10 + speed * 1.6);
    while (trailAcc >= 1) {
      trailAcc -= 1;
      emit(trail, player.position.x + (Math.random() - 0.5) * 0.35, player.position.y - 0.25 + (Math.random() - 0.5) * 0.4,
        player.position.z + 0.25, 0, 0.2, 0, Math.random() < 0.5 ? '#F2EBD7' : '#E9C979');
    }
  }
  stepParticles(trail, dt, speed, 0, 1.7);
  stepParticles(sparks, dt, speed * 0.4, 9, 1.05);

  // Camera follows the diamond; a miss shakes it, a rush widens the view.
  const P = portrait ? { y: 3.9, z: 8.2, ly: 1.1, lz: -9, f: 0.45 } : { y: 3.3, z: 6.6, ly: 1.4, lz: -10, f: 0.35 };
  camX = damp(camX, player.position.x * P.f, 4, dt);
  let sx = 0, sy = 0;
  if (shake > 0) { sx = (Math.random() - 0.5) * shake * 0.6; sy = (Math.random() - 0.5) * shake * 0.6; shake = Math.max(0, shake - dt * 1.5); }
  camera.position.set(camX + sx, P.y + sy, P.z);
  camera.lookAt(camX * 0.6, P.ly, P.lz);
  kick = damp(kick, rush && round && !round.done ? 1 : 0, 4, dt);
  const fov = baseFov + kick * 7;
  if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }

  renderer.render(scene, camera);
}

/* ---------- boot ---------- */
paintMute();
buildMenu();
requestAnimationFrame(frame);
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => { if (round && !round.done) gates.forEach((g, i) => drawPanel(g, round.opts[i], 'idle')); });
}
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
