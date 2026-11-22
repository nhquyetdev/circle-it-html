/* CIRCLE IT — game engine. Bosses live in js/bosses.js, settings in js/config.js */
(() => {
'use strict';
const CFG = Object.assign({ TIME_LIMIT: 180, POINTS_PER_BOSS: 5, POINTS_PER_STAGE_AFTER: 4 }, window.CIRCLEIT_CONFIG || {});
const BOSSES = window.CIRCLEIT_BOSSES || [];
const $ = id => document.getElementById(id);
const TAU = Math.PI * 2, LINE_LIFE = 2.0;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
  let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0; t = clamp(t, 0, 1);
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function segInt(a, b, c, d) {
  const r1x = b.x - a.x, r1y = b.y - a.y, r2x = d.x - c.x, r2y = d.y - c.y;
  const den = r1x * r2y - r1y * r2x; if (Math.abs(den) < 1e-9) return null;
  const t = ((c.x - a.x) * r2y - (c.y - a.y) * r2x) / den, u = ((c.x - a.x) * r1y - (c.y - a.y) * r1x) / den;
  return (t >= 0 && t <= 1 && u >= 0 && u <= 1) ? { x: a.x + t * r1x, y: a.y + t * r1y } : null;
}
function polyArea(p) { let s = 0; for (let i = 0, j = p.length - 1; i < p.length; j = i++) s += (p[j].x + p[i].x) * (p[j].y - p[i].y); return Math.abs(s / 2); }
function inPoly(x, y, p) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { if (((p[i].y > y) !== (p[j].y > y)) && (x < (p[j].x - p[i].x) * (y - p[i].y) / (p[j].y - p[i].y) + p[i].x)) c = !c; } return c; }

/* ---------- canvas ---------- */
const cv = $('game'), ctx = cv.getContext('2d');
let W = 800, H = 800, S = 1, DPR = 1, K = 1;
let SAFE = { l: 0, r: 0, t: 0, b: 0 }, ARENA = null, SK = null;
function readSafe() {
  const p = $('safeProbe'); if (!p) return; const cs = getComputedStyle(p);
  SAFE = { l: parseFloat(cs.paddingLeft) || 0, r: parseFloat(cs.paddingRight) || 0, t: parseFloat(cs.paddingTop) || 0, b: parseFloat(cs.paddingBottom) || 0 };
}
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  const cw = window.innerWidth, ch = window.innerHeight;
  cv.width = Math.round(cw * DPR); cv.height = Math.round(ch * DPR);
  cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
  const sm = Math.min(cw, ch); S = sm / (sm < 600 ? 600 : 800); W = cw / S; H = ch / S;
  K = Math.max(1, (ch < 520 ? .72 : .85) / S); // HUD scale so text stays readable on phones
  readSafe(); layout();
}
// fight area = screen minus HUD (top bar, HP/MP bars, skill buttons, notch)
function layout() {
  const r = $('skills').getBoundingClientRect();
  SK = r.width ? { x: r.left / S, y: r.top / S, w: r.width / S, h: r.height / S, vertical: r.height > r.width } : null;
  const top = SAFE.t / S + 58 * K + 12, bars = SAFE.b / S + 12 + 44 * K + 10;
  let x1 = W - 30 - SAFE.r / S, y1 = H - bars;
  if (SK && SK.vertical) x1 = Math.min(x1, SK.x - 14);
  else if (SK) y1 = Math.min(y1, SK.y - 10);
  ARENA = { x0: 30 + SAFE.l / S, y0: top, x1, y1 };
  // never collapse: keep at least room for a big boss
  if (ARENA.y1 - ARENA.y0 < 260) { const c = (ARENA.y0 + ARENA.y1) / 2; ARENA.y0 = Math.max(10, c - 130); ARENA.y1 = Math.min(H - 10, c + 130); }
  if (ARENA.x1 - ARENA.x0 < 260) { const c = (ARENA.x0 + ARENA.x1) / 2; ARENA.x0 = Math.max(10, c - 130); ARENA.x1 = Math.min(W - 10, c + 130); }
}
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 200));
if (window.visualViewport) visualViewport.addEventListener('resize', resize);
const arena = () => ARENA;

/* ---------- audio ---------- */
let AC = null, muted = localStorage.getItem('circleit_mute') === '1';
function beep(f = 440, d = .08, type = 'square', v = .05, slide = 0) {
  if (muted) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + .02);
  } catch (e) {}
}

/* ---------- images ---------- */
function loadImg(def) {
  if (!def.img || def._imgTried) return; def._imgTried = true;
  const im = new Image(); im.onload = () => { def._img = im; }; im.src = def.img;
}
BOSSES.forEach(loadImg);

/* ---------- stats ---------- */
const STATS = {
  STR: { n: 'Strength', d: s => `Attack <b>${20 + s * 5}</b> (+5)` },
  LUCK: { n: 'Luck', d: s => `Crit chance <b>${Math.round(Math.min(.75, .05 + s * .02) * 100)}%</b> (+2%)` },
  CRIT: { n: 'Crit Dmg', d: s => `Crit damage <b>${Math.round((1.5 + s * .1) * 100)}%</b> (+10%)` },
  INT: { n: 'Intellect', d: s => `Mana <b>${60 + s * 8}</b>, regen <b>${(6 + s * .6).toFixed(1)}/s</b>, cooldown <b>-${Math.round(Math.min(.5, s * .025) * 100)}%</b>` },
  VIT: { n: 'Vitality', d: s => `Max HP <b>${100 + s * 20}</b> (+20)` },
  AGI: { n: 'Agility', d: s => `Pen speed <b>${1100 + s * 90}</b> (+90)` },
  PREC: { n: 'Precision', d: s => `Accuracy <b>+${s * 2}%</b> vs boss evasion` }
};
function derived(s) {
  return {
    atk: 20 + s.STR * 5, crit: Math.min(.75, .05 + s.LUCK * .02), critMul: 1.5 + s.CRIT * .1,
    maxMp: 60 + s.INT * 8, mpRegen: 6 + s.INT * .6, cdr: Math.min(.5, s.INT * .025),
    maxHp: 100 + s.VIT * 20, pen: 1100 + s.AGI * 90, acc: s.PREC * .02
  };
}
const SKILLS = [
  { key: '1', name: 'Freeze', ic: '❄', cost: 30, cd: 12, desc: 'Slow bosses 3s' },
  { key: '2', name: 'Shield', ic: '🛡', cost: 25, cd: 10, desc: 'Line immune 2.5s' },
  { key: '3', name: 'Power', ic: '✦', cost: 40, cd: 15, desc: 'Next circle x3' }
];

/* ---------- state ---------- */
let state = 'title', paused = false, run = null, F = null, testMode = false, testDef = null;
const ptr = { x: 0, y: 0, down: false };

function newRun() {
  const st = {}; Object.keys(STATS).forEach(k => st[k] = 0);
  return { stage: 1, stats: st, points: 0, spent: {}, totalDmg: 0, name: getName() };
}
function getName() { return (localStorage.getItem('circleit_name') || '').trim() || 'Player'; }

function stageBosses(stage) {
  if (testMode) return [{ def: testDef, m: { hp: 1, atk: 1, spd: 1, eva: 0, rate: 1 } }];
  if (stage <= BOSSES.length && stage <= 10) return [{ def: BOSSES[stage - 1], m: { hp: 1, atk: 1, spd: 1, eva: 0, rate: 1 } }];
  const k = stage - 10, pool = BOSSES.filter(b => !b.tutorial && !b.noRandom);
  const count = Math.min(5, 2 + Math.floor((k - 1) / 4));
  const m = {
    hpBase: true, hp: Math.pow(1.09, k - 1), atk: 1 + .06 * k, spd: Math.min(1.5, 1 + .03 * k),
    eva: Math.min(.25, .01 * k), rate: 1 + Math.min(.6, .03 * k)
  };
  const out = [];
  // deterministic-ish variety: shuffle pool by stage
  const p = pool.slice(); for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < count; i++) out.push({ def: p[i % p.length], m });
  return out;
}

function makeBoss(def, m, i, n) {
  const A = arena();
  const hp = m.hpBase ? (2500 + def.hp * .5) * m.hp : def.hp * m.hp;
  const ang = n > 1 ? (i / n) * TAU - Math.PI / 2 : 0;
  const cx = (A.x0 + A.x1) / 2, cy = (A.y0 + A.y1) / 2, rad = n > 1 ? Math.min(A.x1 - A.x0, A.y1 - A.y0) * .3 : 0;
  const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad;
  const a = rand(0, TAU);
  loadImg(def);
  return {
    def, x, y, hx: x, hy: y, r: def.r || 55, hp, maxHp: hp, atk: (def.atk || 0) * (m.atk || 1) * (def.atk ? 1 : 1),
    spd: (def.speed || 0) * m.spd, eva: Math.min(.6, (def.eva || 0) + m.eva), rate: m.rate,
    dx: Math.cos(a), dy: Math.sin(a), tx: x, ty: y,
    timers: (def.attacks || []).map(at => (at.every || 2) * rand(.5, 1)),
    dashT: def.move && def.move.dashEvery ? def.move.dashEvery * rand(.6, 1) : 0, mode: 'move', modeT: 0, dvx: 0, dvy: 0,
    tpT: def.move && def.move.teleportEvery ? def.move.teleportEvery : 0, tp: 0, tpS: 0,
    alpha: 1, shieldT: 0, invisT: 0, enraged: false, hist: [], flash: 0, spinA: rand(0, TAU), dead: false, t: rand(0, 10)
  };
}

function startStage() {
  $('hud').classList.remove('hidden'); layout();
  const d = derived(run.stats);
  const list = stageBosses(run.stage);
  F = {
    now: 0, time: CFG.TIME_LIMIT, d, hp: d.maxHp, mp: d.maxMp,
    bosses: list.map((b, i) => makeBoss(b.def, b.m, i, list.length)),
    projs: [], rings: [], lasers: [], hazards: [], texts: [], parts: [],
    stroke: [], ghost: [], ghostT: 0, drawing: false, pen: { x: 0, y: 0 },
    iframes: 0, shieldT: 0, freezeT: 0, power: false, cds: [0, 0, 0], shake: 0,
    endT: 0, ending: null, tut: list[0].def.tutorial ? { step: 0, hits: 0, used: false } : null,
    stageDmg: 0
  };
  ptr.down = false; paused = false;
  state = 'play'; show(null); $('hud').classList.remove('hidden'); layout();
  beep(330, .15, 'sawtooth', .05, 300);
}

/* ---------- input ---------- */
let activePtr = null;
cv.addEventListener('pointerdown', e => {
  if (state !== 'play' || paused || !F || F.ending) return;
  if (activePtr !== null) return;
  activePtr = e.pointerId; try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  ptr.x = e.clientX / S; ptr.y = e.clientY / S; ptr.down = true;
  F.drawing = true; F.pen.x = ptr.x; F.pen.y = ptr.y; F.stroke = [{ x: ptr.x, y: ptr.y, t: F.now }];
  beep(660, .03, 'sine', .02);
});
cv.addEventListener('pointermove', e => {
  if (activePtr !== null && e.pointerId !== activePtr) return;
  ptr.x = e.clientX / S; ptr.y = e.clientY / S;
});
function endDraw(e) {
  if (e && activePtr !== null && e.pointerId !== activePtr) return;
  activePtr = null; ptr.down = false;
  if (F && F.drawing) { F.drawing = false; F.ghost = F.stroke; F.ghostT = .25; F.stroke = []; }
}
cv.addEventListener('pointerup', endDraw); cv.addEventListener('pointercancel', endDraw);
cv.addEventListener('lostpointercapture', endDraw);
addEventListener('keydown', e => {
  if (state === 'play') {
    if (e.key === '1' || e.key === '2' || e.key === '3') useSkill(+e.key - 1);
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') togglePause();
  }
});
addEventListener('blur', () => { if (state === 'play' && !paused && F && !F.ending) togglePause(); });
document.addEventListener('contextmenu', e => { if (e.target === cv) e.preventDefault(); });

/* ---------- skills ---------- */
const skillEls = [];
SKILLS.forEach((s, i) => {
  const b = document.createElement('button'); b.className = 'skill';
  b.innerHTML = `<span class="key">${s.key}</span><span class="ic">${s.ic}</span><span class="nm">${s.name}</span><span class="mp">${s.cost}</span><div class="cd"></div><div class="cdt"></div>`;
  b.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); useSkill(i); });
  $('skills').appendChild(b); skillEls.push(b);
});
resize();
function useSkill(i) {
  if (!F || paused || F.ending) return;
  const s = SKILLS[i];
  if (F.cds[i] > 0 || F.mp < s.cost) { beep(120, .08, 'square', .03); return; }
  F.mp -= s.cost; F.cds[i] = s.cd * (1 - F.d.cdr);
  if (i === 0) { F.freezeT = 3; addText(W / 2, H / 2 - 120, 'FREEZE!', '#7ad7ff', 34); beep(1200, .3, 'sine', .05, -900); }
  if (i === 1) { F.shieldT = 2.5; addText(W / 2, H / 2 - 120, 'INK SHIELD', '#ffd43b', 34); beep(500, .25, 'triangle', .06, 400); }
  if (i === 2) { F.power = true; addText(W / 2, H / 2 - 120, 'POWER RING ×3', '#ff4d8d', 34); beep(300, .3, 'sawtooth', .05, 600); }
  if (F.tut) F.tut.used = true;
}
function updateSkillUI() {
  skillEls.forEach((el, i) => {
    const s = SKILLS[i], cd = F.cds[i], max = s.cd * (1 - F.d.cdr);
    el.querySelector('.cd').style.height = cd > 0 ? (cd / max * 100) + '%' : '0';
    el.querySelector('.cdt').textContent = cd > 0 ? Math.ceil(cd) : '';
    el.classList.toggle('nomp', F.mp < s.cost);
    el.classList.toggle('active', (i === 0 && F.freezeT > 0) || (i === 1 && F.shieldT > 0) || (i === 2 && F.power));
  });
}

/* ---------- effects ---------- */
function addText(x, y, txt, col = '#fff', size = 22, life = .9) { F.texts.push({ x, y, txt, col, size, t: 0, life }); }
function burst(x, y, col, n = 14, sp = 260) {
  for (let i = 0; i < n; i++) { const a = rand(0, TAU), v = rand(.3, 1) * sp; F.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: rand(.3, .7), col, s: rand(2, 5) }); }
}

/* ---------- drawing / loops ---------- */
function addPoint(x, y) {
  const pts = F.stroke; pts.push({ x, y, t: F.now });
  const n = pts.length; if (n < 4) return;
  const a = pts[n - 2], b = pts[n - 1];
  for (let i = 0; i < n - 3; i++) {
    const ip = segInt(a, b, pts[i], pts[i + 1]);
    if (ip) { const poly = [ip].concat(pts.slice(i + 1, n - 1)); resolveLoop(poly); F.stroke = [{ x: b.x, y: b.y, t: F.now }]; return; }
  }
  if (n > 14 && dist(b.x, b.y, pts[0].x, pts[0].y) < 18) { resolveLoop(pts.slice()); F.stroke = [{ x: b.x, y: b.y, t: F.now }]; }
}
function resolveLoop(poly) {
  if (poly.length < 6) return;
  const area = polyArea(poly); if (area < 400) return;
  const hit = F.bosses.filter(b => !b.dead && inPoly(b.x, b.y, poly));
  F.loopFx = { poly, t: 0, col: hit.length ? '#ffd43b' : '#5ef1ff' };
  if (!hit.length) return;
  const bodyArea = hit.reduce((s, b) => s + Math.PI * b.r * b.r, 0), ratio = area / bodyArea;
  let q = ratio <= 2.6 ? ['PERFECT', 1.5, '#ffd43b'] : ratio <= 6 ? ['GOOD', 1, '#7dffb0'] : ['SLOPPY', .6, '#aab4e8'];
  const combo = 1 + .25 * (hit.length - 1), pw = F.power ? 3 : 1;
  F.power = false;
  let cx = 0, cy = 0; poly.forEach(p => { cx += p.x; cy += p.y; }); cx /= poly.length; cy /= poly.length;
  addText(cx, cy - 40, q[0] + (hit.length > 1 ? ` ×${hit.length} COMBO` : ''), q[2], 26);
  hit.forEach(b => {
    if (b.tp) { addText(b.x, b.y - b.r - 10, 'GONE', '#aab4e8'); return; }
    if (b.shieldT > 0) { addText(b.x, b.y - b.r - 10, 'BLOCKED', '#7ad7ff', 24); beep(200, .08, 'square', .04); burst(b.x, b.y, '#7ad7ff', 8); return; }
    const ev = Math.max(0, b.eva - F.d.acc);
    if (Math.random() < ev) { addText(b.x, b.y - b.r - 10, 'EVADE', '#c9d3e0', 24); beep(900, .05, 'sine', .03, 400); return; }
    const crit = Math.random() < F.d.crit;
    let dmg = F.d.atk * q[1] * combo * pw * (crit ? F.d.critMul : 1) * rand(.92, 1.08);
    dmg = Math.round(dmg);
    b.hp -= dmg; b.flash = .15; run.totalDmg += dmg; F.stageDmg += dmg;
    addText(b.x + rand(-20, 20), b.y - b.r * .3, (crit ? 'CRIT ' : '') + dmg, crit ? '#ff4d8d' : '#fff', crit ? 34 : 26);
    burst(b.x, b.y, b.def.color || '#fff', crit ? 26 : 14, crit ? 420 : 280);
    F.shake = Math.max(F.shake, crit ? 10 : 5);
    beep(crit ? 880 : 520, .09, 'square', .05, crit ? 600 : 200);
    if (F.tut) F.tut.hits++;
    if (b.hp <= 0) { b.dead = true; b.hp = 0; burst(b.x, b.y, b.def.color || '#fff', 60, 600); burst(b.x, b.y, '#fff', 30, 400); F.shake = 18; beep(120, .5, 'sawtooth', .07, -80); }
  });
  if (F.bosses.every(b => b.dead)) endStage(true);
}

/* ---------- line collision ---------- */
function lineHitCircle(x, y, r) {
  const p = F.stroke; if (!p.length) return false;
  if (p.length === 1) return dist(x, y, p[0].x, p[0].y) < r;
  for (let i = 0; i < p.length - 1; i++) if (segDist(x, y, p[i].x, p[i].y, p[i + 1].x, p[i + 1].y) < r) return true;
  return false;
}
function canBeHurt() { return F.drawing && F.stroke.length && F.iframes <= 0 && F.shieldT <= 0 && !F.ending; }
function hurt(dmg, x, y, src) {
  F.stroke = [{ x: F.pen.x, y: F.pen.y, t: F.now }];
  F.iframes = .7;
  if (dmg <= 0) { addText(x, y, src || 'Line broken!', '#ffb36b', 20); beep(180, .1, 'square', .04); return; }
  dmg = Math.round(dmg); F.hp -= dmg; F.shake = Math.max(F.shake, 12);
  addText(x, y, '-' + dmg, '#ff3b5c', 30); burst(x, y, '#ff3b5c', 16);
  beep(110, .2, 'sawtooth', .07, -50);
  if (F.hp <= 0) { F.hp = 0; endStage(false, 'Your ink ran dry…'); }
}

/* ---------- boss update ---------- */
function penTarget() { return F.drawing ? F.pen : ptr; }
function pickWander(b) { const A = arena(); b.tx = rand(A.x0 + b.r, A.x1 - b.r); b.ty = rand(A.y0 + b.r, A.y1 - b.r); }
function updBoss(b, dt) {
  const def = b.def, mv = def.move || { type: 'still' };
  b.t += dt; b.flash = Math.max(0, b.flash - dt);
  if (def.enrage && !b.enraged && b.hp < b.maxHp * .3) { b.enraged = true; addText(b.x, b.y - b.r - 30, 'ENRAGED!', '#ff3b5c', 30); beep(90, .4, 'sawtooth', .07, 60); }
  const frz = F.freezeT > 0 ? .3 : 1, spd = b.spd * frz * (b.enraged ? 1.35 : 1);
  b.shieldT = Math.max(0, b.shieldT - dt); b.invisT = Math.max(0, b.invisT - dt);
  // teleport
  if (mv.teleportEvery && !b.tp) { b.tpT -= dt * frz; if (b.tpT <= 0 && b.mode === 'move') { b.tp = 1; b.tpS = 0; } }
  if (b.tp) {
    b.tpS += dt;
    if (b.tp === 1) { b.alpha = 1 - b.tpS / .35; if (b.tpS >= .35) { const A = arena(), p = penTarget(); let x, y, k = 0; do { x = rand(A.x0 + b.r, A.x1 - b.r); y = rand(A.y0 + b.r, A.y1 - b.r); k++; } while (k < 20 && dist(x, y, p.x, p.y) < 180); b.x = x; b.y = y; b.tx = x; b.ty = y; b.tp = 2; b.tpS = 0; } }
    else { b.alpha = b.tpS / .35; if (b.tpS >= .35) { b.tp = 0; b.alpha = 1; b.tpT = mv.teleportEvery * (b.enraged ? .7 : 1); } }
    return;
  }
  // dash
  if (mv.dashEvery) {
    if (b.mode === 'move') { b.dashT -= dt * frz; if (b.dashT <= 0) { b.mode = 'aim'; b.modeT = .6; const p = penTarget(); b.atx = p.x; b.aty = p.y; beep(250, .1, 'triangle', .03, 200); } }
    else if (b.mode === 'aim') { b.modeT -= dt; const p = penTarget(); b.atx += (p.x - b.atx) * Math.min(1, dt * 3); b.aty += (p.y - b.aty) * Math.min(1, dt * 3);
      if (b.modeT <= 0) { const a = Math.atan2(b.aty - b.y, b.atx - b.x), s = (mv.dashSpeed || 700) * (b.enraged ? 1.2 : 1); b.dvx = Math.cos(a) * s; b.dvy = Math.sin(a) * s; b.mode = 'dash'; b.modeT = Math.min(.9, dist(b.x, b.y, b.atx, b.aty) / s + .15); } }
    else if (b.mode === 'dash') { b.modeT -= dt; b.x += b.dvx * dt * frz; b.y += b.dvy * dt * frz; if (b.modeT <= 0) { b.mode = 'move'; b.dashT = mv.dashEvery * (b.enraged ? .65 : 1); } }
  }
  if (b.mode === 'move') {
    switch (mv.type) {
      case 'still': b.x = b.hx + Math.sin(b.t * 1.3) * 8; b.y = b.hy + Math.sin(b.t * 2.1) * 3; break;
      case 'bounce': b.x += b.dx * spd * dt; b.y += b.dy * spd * dt; break;
      case 'chase': {
        const p = penTarget(), a = Math.atan2(p.y - b.y, p.x - b.x);
        const want = F.drawing ? 1 : .55;
        b.dx += (Math.cos(a) - b.dx) * Math.min(1, dt * 2.2); b.dy += (Math.sin(a) - b.dy) * Math.min(1, dt * 2.2);
        const l = Math.hypot(b.dx, b.dy) || 1; b.x += b.dx / l * spd * want * dt; b.y += b.dy / l * spd * want * dt; break;
      }
      default: { // wander
        if (dist(b.x, b.y, b.tx, b.ty) < 15) pickWander(b);
        const a = Math.atan2(b.ty - b.y, b.tx - b.x); b.x += Math.cos(a) * spd * dt; b.y += Math.sin(a) * spd * dt;
      }
    }
  }
  const A = arena();
  if (b.x < A.x0 + b.r) { b.x = A.x0 + b.r; b.dx = Math.abs(b.dx); if (b.mode === 'dash') b.modeT = 0; }
  if (b.x > A.x1 - b.r) { b.x = A.x1 - b.r; b.dx = -Math.abs(b.dx); if (b.mode === 'dash') b.modeT = 0; }
  if (b.y < A.y0 + b.r) { b.y = A.y0 + b.r; b.dy = Math.abs(b.dy); if (b.mode === 'dash') b.modeT = 0; }
  if (b.y > A.y1 - b.r) { b.y = A.y1 - b.r; b.dy = -Math.abs(b.dy); if (b.mode === 'dash') b.modeT = 0; }
  b.hist.unshift({ x: b.x, y: b.y }); if (b.hist.length > 60) b.hist.pop();
  // attacks
  if (F.freezeT <= 0) (def.attacks || []).forEach((at, i) => {
    b.timers[i] -= dt * b.rate * (b.enraged ? 1.43 : 1);
    if (b.timers[i] <= 0) { b.timers[i] += at.every || 2; fire(b, at); }
  });
}
function fire(b, at) {
  const dmg = at.dmg != null ? at.dmg * (b.atk / Math.max(1, b.def.atk || 1)) : b.atk * .6;
  const col = b.def.color2 || '#ff4d6d';
  switch (at.type) {
    case 'radial': {
      const n = at.count || 8; let off = at.spin ? (b.spinA += at.spin * 2) : rand(0, TAU);
      for (let k = 0; k < n; k++) { const a = off + k * TAU / n; spawnProj(b.x, b.y, a, at.speed || 200, at.size || 8, dmg, col); }
      beep(400, .05, 'triangle', .025); break;
    }
    case 'aimed': {
      const p = penTarget(), base = Math.atan2(p.y - b.y, p.x - b.x), n = at.count || 1, sp = at.spread || .2;
      for (let k = 0; k < n; k++) spawnProj(b.x, b.y, base + (k - (n - 1) / 2) * sp, at.speed || 250, at.size || 9, dmg, col);
      beep(520, .05, 'triangle', .025); break;
    }
    case 'ring': F.rings.push({ x: b.x, y: b.y, R: b.r, spd: at.speed || 260, w: at.width || 12, dmg: at.dmg != null ? dmg : b.atk * .8, col }); beep(80, .35, 'sine', .08, 40); break;
    case 'laser': { const p = penTarget(); F.lasers.push({ b, ang: Math.atan2(p.y - b.y, p.x - b.x), t: 0, warn: at.warn || .8, dur: at.dur || 1.2, w: at.width || 16, sweep: (at.sweep || 0) * (Math.random() < .5 ? -1 : 1), dmg: at.dmg != null ? dmg : b.atk * .9, col }); beep(1400, .2, 'sine', .03, -800); break; }
    case 'trail': if (b.alpha > .5) F.hazards.push({ x: b.x + rand(-6, 6), y: b.y + rand(-6, 6), r: at.size || 14, t: 0, life: at.life || 2.5, arm: 0, dmg: at.dmg != null ? dmg : b.atk * .5, kind: 'fire', col: b.def.color || '#ff7a1a' }); break;
    case 'mines': { const A = arena(); for (let k = 0; k < (at.count || 3); k++) F.hazards.push({ x: rand(A.x0, A.x1), y: rand(A.y0, A.y1), r: at.size || 16, t: 0, life: at.life || 6, arm: .8, dmg: at.dmg != null ? dmg : b.atk * .7, kind: 'mine', col: col }); break; }
    case 'shield': b.shieldT = at.dur || 2; beep(700, .15, 'sine', .04, 300); break;
    case 'invis': b.invisT = at.dur || 2; beep(300, .3, 'sine', .03, -200); break;
  }
}
function spawnProj(x, y, a, sp, r, dmg, col) { F.projs.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r, dmg, col, t: 0 }); }

/* ---------- main update ---------- */
function update(dt) {
  F.now += dt;
  if (F.ending) { F.endT -= dt; updFx(dt); if (F.endT <= 0) finishStage(); return; }
  const d = F.d;
  F.time -= dt; if (F.time <= 0) { F.time = 0; endStage(false, "Time's up!"); return; }
  F.mp = Math.min(d.maxMp, F.mp + d.mpRegen * dt);
  F.cds = F.cds.map(c => Math.max(0, c - dt));
  F.iframes = Math.max(0, F.iframes - dt); F.shieldT = Math.max(0, F.shieldT - dt); F.freezeT = Math.max(0, F.freezeT - dt);
  F.shake = Math.max(0, F.shake - dt * 40); F.ghostT = Math.max(0, F.ghostT - dt);
  // pen
  if (F.drawing) {
    const step = d.pen * dt, dx = ptr.x - F.pen.x, dy = ptr.y - F.pen.y, l = Math.hypot(dx, dy);
    const mvd = Math.min(l, step);
    if (l > 0.01) {
      const ux = dx / l, uy = dy / l; let moved = 0;
      while (moved < mvd) { const s = Math.min(6, mvd - moved); moved += s; F.pen.x += ux * s; F.pen.y += uy * s;
        const last = F.stroke[F.stroke.length - 1];
        if (!last || dist(last.x, last.y, F.pen.x, F.pen.y) >= 5) { addPoint(F.pen.x, F.pen.y); if (F.ending) return; } }
    }
    while (F.stroke.length > 1 && F.now - F.stroke[0].t > LINE_LIFE) F.stroke.shift();
  }
  // bosses
  F.bosses.forEach(b => { if (!b.dead) updBoss(b, dt); });
  if (canBeHurt()) for (const b of F.bosses) {
    if (b.dead || b.tp || b.alpha < .5) continue;
    if (lineHitCircle(b.x, b.y, b.r * .88)) { hurt(b.atk, b.x, b.y - b.r - 10, b.atk ? null : "Don't touch it!"); break; }
  }
  // projectiles
  const pf = F.freezeT > 0 ? .4 : 1;
  for (let i = F.projs.length - 1; i >= 0; i--) {
    const p = F.projs[i]; p.t += dt; p.x += p.vx * dt * pf; p.y += p.vy * dt * pf;
    if (p.x < -50 || p.y < -50 || p.x > W + 50 || p.y > H + 50 || p.t > 12) { F.projs.splice(i, 1); continue; }
    if (canBeHurt() && lineHitCircle(p.x, p.y, p.r + 2)) { hurt(p.dmg, p.x, p.y); F.projs.splice(i, 1); }
  }
  // rings
  const maxR = Math.hypot(W, H);
  for (let i = F.rings.length - 1; i >= 0; i--) {
    const r = F.rings[i]; r.R += r.spd * dt * pf; if (r.R > maxR) { F.rings.splice(i, 1); continue; }
    if (canBeHurt()) for (const p of F.stroke) if (Math.abs(dist(p.x, p.y, r.x, r.y) - r.R) < r.w) { hurt(r.dmg, p.x, p.y); break; }
  }
  // lasers
  for (let i = F.lasers.length - 1; i >= 0; i--) {
    const L = F.lasers[i]; L.t += dt;
    if (L.b.dead || L.t > L.warn + L.dur) { F.lasers.splice(i, 1); continue; }
    if (L.t > L.warn) {
      L.ang += L.sweep * dt * pf;
      if (canBeHurt()) { const ex = L.b.x + Math.cos(L.ang) * 3000, ey = L.b.y + Math.sin(L.ang) * 3000;
        for (const p of F.stroke) if (segDist(p.x, p.y, L.b.x, L.b.y, ex, ey) < L.w / 2 + 2) { hurt(L.dmg, p.x, p.y); break; } }
    } else { const p = penTarget(); const ta = Math.atan2(p.y - L.b.y, p.x - L.b.x); let da = ((ta - L.ang + Math.PI * 3) % TAU) - Math.PI; L.ang += da * Math.min(1, dt * 2); }
  }
  // hazards
  for (let i = F.hazards.length - 1; i >= 0; i--) {
    const h = F.hazards[i]; h.t += dt; if (h.t > h.life) { F.hazards.splice(i, 1); continue; }
    if (h.t > h.arm && canBeHurt() && lineHitCircle(h.x, h.y, h.r)) { hurt(h.dmg, h.x, h.y); if (h.kind === 'mine') { burst(h.x, h.y, h.col, 20); F.hazards.splice(i, 1); } }
  }
  updFx(dt);
  // tutorial
  if (F.tut) { const t = F.tut; if (t.step === 0 && t.hits >= 1) t.step = 1; if (t.step === 1 && t.hits >= 3) t.step = 2; if (t.step === 2 && t.used) t.step = 3; }
  updateSkillUI();
}
function updFx(dt) {
  for (let i = F.texts.length - 1; i >= 0; i--) { const t = F.texts[i]; t.t += dt; t.y -= 40 * dt; if (t.t > t.life) F.texts.splice(i, 1); }
  for (let i = F.parts.length - 1; i >= 0; i--) { const p = F.parts[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .94; p.vy *= .94; if (p.t > p.life) F.parts.splice(i, 1); }
  if (F.loopFx) { F.loopFx.t += dt; if (F.loopFx.t > .4) F.loopFx = null; }
}

/* ---------- stage end ---------- */
function endStage(win, reason) {
  if (F.ending) return;
  F.ending = win ? 'win' : 'lose'; F.reason = reason; F.endT = win ? 1.8 : 1.4;
  F.drawing = false; F.stroke = []; F.projs = []; F.lasers = [];
  addText(W / 2, H / 2, win ? (F.bosses.length > 1 ? 'STAGE CLEAR!' : 'BOSS DEFEATED!') : (reason || 'DEFEATED'), win ? '#ffd43b' : '#ff3b5c', 48, 2);
  if (win) { beep(523, .12, 'square', .05); setTimeout(() => beep(659, .12, 'square', .05), 120); setTimeout(() => beep(784, .25, 'square', .05), 240); }
  else beep(200, .6, 'sawtooth', .06, -150);
}
function finishStage() {
  $('hud').classList.add('hidden');
  if (F.ending === 'win') {
    if (testMode) { showOver(true, 'Test boss defeated!'); return; }
    run.stage++; run.points += run.stage - 1 <= 10 ? CFG.POINTS_PER_BOSS : CFG.POINTS_PER_STAGE_AFTER;
    saveBest(run.stage); showAlloc();
  } else showOver(false, F.reason);
}

/* ---------- render ---------- */
function render() {
  ctx.setTransform(DPR * S, 0, 0, DPR * S, 0, 0);
  // background
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d1128'); g.addColorStop(1, '#070915');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(80,110,220,.07)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = 0; x < W; x += 50) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y < H; y += 50) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
  if (state !== 'play' || !F) { drawTitleBg(); return; }
  ctx.save();
  if (F.shake > 0) ctx.translate(rand(-F.shake, F.shake), rand(-F.shake, F.shake));
  const A = arena();
  ctx.strokeStyle = 'rgba(94,241,255,.12)'; ctx.setLineDash([8, 10]); ctx.strokeRect(A.x0, A.y0, A.x1 - A.x0, A.y1 - A.y0); ctx.setLineDash([]);
  if (F.freezeT > 0) { ctx.fillStyle = 'rgba(122,215,255,.06)'; ctx.fillRect(0, 0, W, H); }
  // hazards
  F.hazards.forEach(h => {
    const k = 1 - h.t / h.life, armed = h.t > h.arm;
    ctx.globalAlpha = Math.min(1, k * 2) * (armed ? .85 : .35 + .3 * Math.sin(h.t * 30));
    if (h.kind === 'fire') { const gr = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r * 1.3); gr.addColorStop(0, '#fff3a0'); gr.addColorStop(.4, h.col); gr.addColorStop(1, 'rgba(255,60,0,0)'); ctx.fillStyle = gr; circle(h.x, h.y, h.r * (1.1 + .15 * Math.sin(h.t * 20 + h.x))); ctx.fill(); }
    else { ctx.fillStyle = '#2a2030'; circle(h.x, h.y, h.r); ctx.fill(); ctx.strokeStyle = h.col; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = armed ? '#ff3b5c' : '#888'; circle(h.x, h.y, h.r * .35); ctx.fill(); }
  });
  ctx.globalAlpha = 1;
  // rings
  F.rings.forEach(r => { ctx.strokeStyle = r.col; ctx.lineWidth = r.w * 1.4; ctx.globalAlpha = .5; circle(r.x, r.y, r.R); ctx.stroke(); ctx.globalAlpha = 1; ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; circle(r.x, r.y, r.R); ctx.stroke(); });
  // lasers
  F.lasers.forEach(L => {
    const ex = L.b.x + Math.cos(L.ang) * 3000, ey = L.b.y + Math.sin(L.ang) * 3000;
    ctx.beginPath(); ctx.moveTo(L.b.x, L.b.y); ctx.lineTo(ex, ey);
    if (L.t < L.warn) { ctx.strokeStyle = 'rgba(255,59,92,' + (.3 + .4 * Math.abs(Math.sin(L.t * 20))) + ')'; ctx.lineWidth = 2; ctx.setLineDash([12, 8]); ctx.stroke(); ctx.setLineDash([]); }
    else { ctx.strokeStyle = L.col; ctx.globalAlpha = .45; ctx.lineWidth = L.w * 1.8; ctx.stroke(); ctx.globalAlpha = 1; ctx.strokeStyle = '#fff'; ctx.lineWidth = L.w * .45; ctx.stroke(); }
  });
  // bosses
  F.bosses.forEach(b => { if (!b.dead) drawBossInGame(b); });
  // projectiles
  F.projs.forEach(p => { ctx.fillStyle = p.col; ctx.shadowColor = p.col; ctx.shadowBlur = 10; circle(p.x, p.y, p.r); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; circle(p.x, p.y, p.r * .45); ctx.fill(); });
  // line
  drawStroke(F.stroke, 1); if (F.ghostT > 0) drawStroke(F.ghost, F.ghostT / .25 * .5);
  if (F.loopFx) { const L = F.loopFx; ctx.globalAlpha = 1 - L.t / .4; ctx.fillStyle = L.col; ctx.beginPath(); L.poly.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.globalAlpha *= .25; ctx.fill(); ctx.globalAlpha = 1; }
  // pen / cursor
  if (F.drawing) {
    ctx.fillStyle = F.iframes > 0 ? (Math.sin(F.now * 40) > 0 ? '#ff3b5c' : '#fff') : '#fff';
    ctx.shadowColor = '#5ef1ff'; ctx.shadowBlur = 14; circle(F.pen.x, F.pen.y, 6); ctx.fill(); ctx.shadowBlur = 0;
    if (dist(F.pen.x, F.pen.y, ptr.x, ptr.y) > 12) { ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.5; circle(ptr.x, ptr.y, 10); ctx.stroke(); }
  }
  // particles + texts
  F.parts.forEach(p => { ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.col; ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); });
  ctx.globalAlpha = 1; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  F.texts.forEach(t => { const k = t.t / t.life; ctx.globalAlpha = k > .7 ? (1 - k) / .3 : 1; const sc = t.t < .12 ? 1 + (.12 - t.t) * 4 : 1;
    ctx.font = `900 ${t.size * sc}px "Trebuchet MS",sans-serif`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText(t.txt, t.x, t.y); ctx.fillStyle = t.col; ctx.fillText(t.txt, t.x, t.y); });
  ctx.globalAlpha = 1;
  ctx.restore();
  drawHUD();
}
function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); }
function drawStroke(pts, alpha) {
  if (pts.length < 2) return;
  const col = F.shieldT > 0 ? '#ffd43b' : '#5ef1ff';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = col; ctx.shadowBlur = 12;
  for (let i = 1; i < pts.length; i++) {
    const age = (F.now - pts[i].t) / LINE_LIFE;
    ctx.globalAlpha = alpha * clamp(1 - age, .15, 1); ctx.strokeStyle = col; ctx.lineWidth = F.shieldT > 0 ? 6 : 4;
    ctx.beginPath(); ctx.moveTo(pts[i - 1].x, pts[i - 1].y); ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke();
  }
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;
}
function drawBossInGame(b) {
  let a = b.alpha; if (b.invisT > 0) a *= .1 + .05 * Math.sin(b.t * 10);
  // dash telegraph
  if (b.mode === 'aim') { ctx.strokeStyle = 'rgba(255,59,92,.6)'; ctx.lineWidth = 2; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.atx, b.aty); ctx.stroke(); ctx.setLineDash([]); }
  // serpent body
  if (b.def.shape === 'serpent' && !b.def._img) {
    for (let i = b.hist.length - 1; i > 4; i -= 5) { const h = b.hist[i], k = 1 - i / b.hist.length; ctx.globalAlpha = a * .8; ctx.fillStyle = i % 10 ? b.def.color : b.def.color2; circle(h.x, h.y, b.r * (.35 + .4 * k)); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  ctx.save(); ctx.globalAlpha = Math.max(0, a); ctx.translate(b.x, b.y);
  if (b.enraged) { ctx.shadowColor = '#ff3b5c'; ctx.shadowBlur = 25 + 10 * Math.sin(b.t * 8); }
  const p = penTarget();
  drawBossArt(ctx, b.def, b.r, b.t, { lookA: Math.atan2(p.y - b.y, p.x - b.x), enraged: b.enraged });
  ctx.shadowBlur = 0;
  if (b.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = b.flash / .15 * .6; ctx.fillStyle = '#fff'; circle(0, 0, b.r); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
  ctx.restore();
  if (b.shieldT > 0) { ctx.globalAlpha = .5 + .2 * Math.sin(b.t * 12); ctx.strokeStyle = '#7ad7ff'; ctx.lineWidth = 4; ctx.fillStyle = 'rgba(122,215,255,.15)'; ctx.beginPath();
    for (let i = 0; i <= 6; i++) { const an = i / 6 * TAU + b.t; const x = b.x + Math.cos(an) * b.r * 1.3, y = b.y + Math.sin(an) * b.r * 1.3; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1; }
  // small hp bar
  if (a > .3 && F.bosses.length > 1) { const w = b.r * 1.6; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(b.x - w / 2, b.y - b.r - 18, w, 7); ctx.fillStyle = b.enraged ? '#ff3b5c' : '#ff4d8d'; ctx.fillRect(b.x - w / 2, b.y - b.r - 18, w * b.hp / b.maxHp, 7); }
}
function bar(x, y, w, h, k, col, label) {
  ctx.fillStyle = 'rgba(0,0,0,.55)'; roundRect(x, y, w, h, h / 2); ctx.fill();
  ctx.fillStyle = col; if (k > 0) { roundRect(x, y, Math.max(h, w * clamp(k, 0, 1)), h, h / 2); ctx.fill(); }
  if (label) { ctx.fillStyle = '#fff'; ctx.font = `bold ${h * .7}px "Trebuchet MS",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x + w / 2, y + h / 2 + 1); }
}
function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function drawHUD() {
  ctx.textBaseline = 'middle';
  const font = (px, w = 'bold') => `${w} ${px * K}px "Trebuchet MS",sans-serif`;
  const tot = F.bosses.reduce((s, b) => s + b.maxHp, 0), cur = F.bosses.reduce((s, b) => s + b.hp, 0);
  const SL = SAFE.l / S, ST = SAFE.t / S;
  const side = Math.max(90 * K + SL, (62 + SAFE.r) / S);
  const bw = Math.min(620, W - side * 2), bx = (W - bw) / 2;
  const names = F.bosses.length > 1 ? `Stage ${run.stage} — ${F.bosses.length} bosses` : F.bosses[0].def.name;
  ctx.font = font(19); ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(names, W / 2, ST + 16 * K, bw);
  bar(bx, ST + 29 * K, bw, 18 * K, cur / tot, F.bosses.some(b => b.enraged && !b.dead) ? '#ff3b5c' : '#ff4d8d', `${Math.ceil(cur)} / ${Math.ceil(tot)}`);
  ctx.textAlign = 'left'; ctx.font = font(15); ctx.fillStyle = '#ff4d8d';
  ctx.fillText(testMode ? 'TEST' : 'STAGE ' + run.stage, 10 + SL, ST + 14 * K);
  const tm = Math.ceil(F.time), ts = `${Math.floor(tm / 60)}:${String(tm % 60).padStart(2, '0')}`;
  ctx.font = font(24); ctx.fillStyle = F.time < 30 ? (Math.sin(F.now * 8) > 0 ? '#ff3b5c' : '#fff') : '#fff';
  ctx.fillText(ts, 10 + SL, ST + 38 * K);
  // player bars (left of the skill buttons)
  const room = SK && !SK.vertical ? SK.x - 24 - SL : W * .45;
  const w2 = Math.max(110, Math.min(320 * K, room));
  const py = H - 12 - SAFE.b / S - 44 * K;
  bar(12 + SL, py, w2, 22 * K, F.hp / F.d.maxHp, F.hp / F.d.maxHp < .3 ? '#ff3b5c' : '#4cd964', `HP ${Math.ceil(F.hp)} / ${F.d.maxHp}`);
  bar(12 + SL, py + 28 * K, w2, 15 * K, F.mp / F.d.maxMp, '#3a8bff', `MP ${Math.floor(F.mp)} / ${F.d.maxMp}`);
  if (F.power) { ctx.fillStyle = '#ff4d8d'; ctx.font = font(14); ctx.textAlign = 'left'; ctx.fillText('✦ POWER READY', 12 + SL, py - 14 * K); }
  if (F.tut && !F.ending) {
    const msgs = [
      'Hold & drag to draw. Draw a circle AROUND the dummy!',
      "Nice! Tighter circles = more damage. Don't let your line touch the target.",
      'Skills: press 1 / 2 / 3 or tap the buttons. Try ✦ Power, then circle!',
      'Finish it! Real bosses fight back — if they touch your line, YOU get hurt.'
    ];
    ctx.font = font(16); ctx.textAlign = 'center';
    const lines = wrapLines(msgs[F.tut.step], Math.min(W - 30, 640) - 24);
    const tw = Math.min(W - 30, Math.max(...lines.map(l => ctx.measureText(l).width)) + 28), lh = 20 * K, th = lines.length * lh + 14 * K;
    const ty = ST + 54 * K;
    ctx.fillStyle = 'rgba(29,37,80,.92)'; roundRect(W / 2 - tw / 2, ty, tw, th, 12); ctx.fill();
    ctx.fillStyle = '#ffe48a'; lines.forEach((l, i) => ctx.fillText(l, W / 2, ty + 7 * K + lh * (i + .5)));
  }
}
function wrapLines(t, maxW) {
  const words = t.split(' '), out = []; let line = '';
  words.forEach(w => { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { out.push(line); line = w; } else line = test; });
  if (line) out.push(line); return out;
}
let titleT = 0;
function drawTitleBg() {
  titleT += 1 / 60;
  const cx = W / 2, cy = H / 2;
  ctx.strokeStyle = 'rgba(94,241,255,.15)'; ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) { circle(cx, cy, 200 + i * 90 + Math.sin(titleT + i) * 15); ctx.stroke(); }
}

const drawBossArt = window.CircleArt.drawBossArt, renderBossPNG = window.CircleArt.renderBossPNG;

/* ---------- loop ---------- */
let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (state === 'play' && F && !paused) update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------- screens ---------- */
const SCREENS = ['s-title', 's-help', 's-intro', 's-alloc', 's-pause', 's-over', 's-lb'];
let backTo = 's-title';
function show(id) { SCREENS.forEach(s => $(s).classList.toggle('hidden', s !== id)); }
function togglePause() {
  if (state !== 'play' || !F || F.ending) return;
  paused = !paused; endDraw(); show(paused ? 's-pause' : null);
}
$('pauseBtn').onclick = togglePause;
$('resumeBtn').onclick = togglePause;
$('quitBtn').onclick = () => { paused = false; show(null); F.hp = 0; endStage(false, 'You gave up.'); };

function showIntro() {
  state = 'intro';
  const list = stageBosses(run.stage); run._pending = list;
  const multi = list.length > 1;
  $('introStage').textContent = testMode ? 'TEST BOSS' : multi ? `STAGE ${run.stage} — GAUNTLET` : `STAGE ${run.stage} / BOSS ${run.stage}`;
  const ac = $('introArt'), x = ac.getContext('2d'); x.clearRect(0, 0, 220, 220);
  if (multi) {
    list.forEach((b, i) => { x.save(); const a = i / list.length * TAU - Math.PI / 2; x.translate(110 + Math.cos(a) * 55, 110 + Math.sin(a) * 55); drawBossArt(x, b.def, 38, 0, { lookA: Math.PI / 2 }); x.restore(); });
    $('introName').textContent = list.map(b => b.def.name).join(' + ');
    $('introTitle').textContent = 'Circle several at once for a combo bonus!';
    $('introHint').textContent = 'Stronger, faster, more of them. Every stage gets harder.';
  } else {
    const d = list[0].def; x.save(); x.translate(110, 110); drawBossArt(x, d, 90, 0, { lookA: Math.PI / 2 }); x.restore();
    $('introName').textContent = d.name; $('introTitle').textContent = d.title || ''; $('introHint').textContent = d.hint || '';
  }
  const hpTot = list.reduce((s, b) => s + (b.m.hpBase ? (2500 + b.def.hp * .5) * b.m.hp : b.def.hp * b.m.hp), 0);
  const ev = Math.max(...list.map(b => Math.min(.6, (b.def.eva || 0) + b.m.eva)));
  $('introStats').textContent = `HP ${Math.round(hpTot)} · Evasion ${Math.round(ev * 100)}% · Time ${Math.floor(CFG.TIME_LIMIT / 60)}:${String(CFG.TIME_LIMIT % 60).padStart(2, '0')}`;
  show('s-intro');
}
$('fightBtn').onclick = () => startStage();

function showAlloc() {
  state = 'alloc'; run.spent = {}; Object.keys(STATS).forEach(k => run.spent[k] = 0);
  $('allocTitle').textContent = `Stage ${run.stage - 1} cleared!`;
  renderAlloc(); show('s-alloc');
}
function renderAlloc() {
  $('ptsLeft').textContent = run.points;
  const L = $('statList'); L.innerHTML = '';
  Object.keys(STATS).forEach(k => {
    const row = document.createElement('div'); row.className = 'stat';
    row.innerHTML = `<span class="info"><span class="k">${k}</span><span class="d">${STATS[k].d(run.stats[k])}</span></span><button class="m">−</button><span class="v">${run.stats[k]}</span><button class="p">+</button>`;
    const m = row.querySelector('.m'), p = row.querySelector('.p');
    m.disabled = !(run.spent[k] > 0); p.disabled = run.points <= 0;
    m.onclick = () => { if (run.spent[k] > 0) { run.spent[k]--; run.stats[k]--; run.points++; renderAlloc(); } };
    p.onclick = () => { if (run.points > 0) { run.spent[k]++; run.stats[k]++; run.points--; beep(700, .04, 'sine', .03); renderAlloc(); } };
    L.appendChild(row);
  });
}
$('resetPts').onclick = () => { Object.keys(run.spent).forEach(k => { run.stats[k] -= run.spent[k]; run.points += run.spent[k]; run.spent[k] = 0; }); renderAlloc(); };
$('nextBtn').onclick = () => showIntro();

async function showOver(win, reason) {
  state = 'over';
  $('overTitle').textContent = win ? 'Victory!' : 'Game Over';
  $('overReason').textContent = reason || '';
  $('overStage').textContent = run.stage;
  $('overDmg').textContent = `Total damage: ${run.totalDmg.toLocaleString()}`;
  $('submitMsg').textContent = '';
  $('againBtn').textContent = testMode ? 'Fight again' : 'Play again';
  show('s-over');
  if (testMode) { $('submitMsg').textContent = 'Test mode — score not saved.'; return; }
  saveBest(run.stage);
  $('submitMsg').textContent = 'Saving score…';
  const ok = await LB.submit({ name: run.name, stage: run.stage, dmg: run.totalDmg });
  $('submitMsg').textContent = ok === 'online' ? 'Score saved to the online leaderboard!' : 'Score saved on this device.';
}
$('againBtn').onclick = () => { if (testMode) { location.reload(); return; } beginRun(); };
$('menuBtn').onclick = () => { state = 'title'; testMode = false; refreshTitle(); show('s-title'); };
$('overLbBtn').onclick = () => { backTo = 's-over'; openLB(); };

function beginRun() {
  const n = ($('nameInput').value || '').trim().slice(0, 16); if (n) localStorage.setItem('circleit_name', n);
  run = newRun(); showIntro();
}
$('playBtn').onclick = beginRun;
$('helpBtn').onclick = () => { backTo = 's-title'; show('s-help'); };
$('lbBtn').onclick = () => { backTo = 's-title'; openLB(); };
document.querySelectorAll('.back').forEach(b => b.onclick = () => show(backTo));
$('muteBtn').onclick = () => { muted = !muted; localStorage.setItem('circleit_mute', muted ? '1' : '0'); refreshTitle(); };
$('statHelp').innerHTML = Object.keys(STATS).map(k => `<li><b>${k}</b> — ${STATS[k].d(1).replace(/<\/?b>/g, '')} per point</li>`).join('');
$('kofi').href = CFG.KOFI_URL || '#'; $('yt').href = CFG.YOUTUBE_URL || '#';
if (!CFG.KOFI_URL) $('kofi').classList.add('hidden'); if (!CFG.YOUTUBE_URL) $('yt').classList.add('hidden');

function saveBest(s) { const b = +localStorage.getItem('circleit_best') || 0; if (s > b) localStorage.setItem('circleit_best', s); }
function refreshTitle() {
  $('nameInput').value = localStorage.getItem('circleit_name') || '';
  const b = +localStorage.getItem('circleit_best') || 0;
  $('bestLine').textContent = b ? `Your best: stage ${b}` : '';
  $('muteBtn').textContent = muted ? '🔇 Muted' : '🔊 Sound';
}
refreshTitle();

/* ---------- leaderboard ---------- */
const LB = {
  url: (CFG.FIREBASE_URL || '').trim().replace(/\/+$/, ''),
  local() { try { return JSON.parse(localStorage.getItem('circleit_lb') || '[]'); } catch (e) { return []; } },
  saveLocal(e) { const l = this.local(); l.push(e); l.sort((a, b) => b.stage - a.stage || b.dmg - a.dmg); localStorage.setItem('circleit_lb', JSON.stringify(l.slice(0, 50))); },
  async submit(e) {
    e = { name: String(e.name).slice(0, 16), stage: Math.floor(e.stage), dmg: Math.floor(e.dmg) };
    this.saveLocal(Object.assign({ t: Date.now() }, e));
    if (!this.url) return 'local';
    try {
      const r = await fetch(`${this.url}/circleit/scores.json`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ t: { '.sv': 'timestamp' } }, e)) });
      return r.ok ? 'online' : 'local';
    } catch (err) { return 'local'; }
  },
  async top() {
    if (this.url) {
      try {
        const r = await fetch(`${this.url}/circleit/scores.json?orderBy=%22stage%22&limitToLast=100`);
        if (r.ok) { const j = await r.json() || {}; return { online: true, list: Object.values(j).filter(x => x && typeof x.stage === 'number').sort((a, b) => b.stage - a.stage || (b.dmg || 0) - (a.dmg || 0)).slice(0, 25) }; }
      } catch (err) {}
    }
    return { online: false, list: this.local().slice(0, 25) };
  }
};
async function openLB() {
  show('s-lb'); const body = $('lbBody'); body.innerHTML = '<tr><td colspan="4">Loading…</td></tr>';
  const { online, list } = await LB.top();
  $('lbSource').textContent = online ? 'Online — all players' : (LB.url ? 'Offline — showing this device only' : 'Local leaderboard (set FIREBASE_URL in js/config.js to go online)');
  body.innerHTML = '';
  if (!list.length) body.innerHTML = '<tr><td colspan="4">No scores yet. Be the first!</td></tr>';
  const me = getName();
  list.forEach((e, i) => {
    const tr = document.createElement('tr'); if (e.name === me) tr.className = 'me';
    [i + 1, e.name || '???', e.stage, (e.dmg || 0).toLocaleString()].forEach(v => { const td = document.createElement('td'); td.textContent = v; tr.appendChild(td); });
    body.appendChild(tr);
  });
}

/* ---------- test mode (from boss maker) ---------- */
(function checkTest() {
  if (!/[?&]test\b/.test(location.search)) return;
  try {
    const data = JSON.parse(localStorage.getItem('circleit_testboss') || 'null'); if (!data) return;
    testDef = data.def; if (data.imgData) { const im = new Image(); im.onload = () => { testDef._img = im; }; im.src = data.imgData; testDef._imgTried = true; }
    testMode = true; run = newRun(); Object.keys(run.stats).forEach(k => run.stats[k] = data.statLevel != null ? data.statLevel : 5);
    showIntro();
  } catch (e) { console.warn(e); }
})();

window.CircleIt = { renderBossPNG, drawBossArt, BOSSES, _debug: () => ({ state, F, run }) };
})();
