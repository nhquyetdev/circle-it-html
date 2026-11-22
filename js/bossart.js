/* CIRCLE IT — built-in boss art. Shared by the game and tools/editor.html.
   Add a new  case 'yourshape':  in drawBossArt to make new built-in art,
   or just use a PNG image (see js/bosses.js). */
(() => {
'use strict';
const TAU = Math.PI * 2;

function drawBossArt(c, def, r, t, o = {}) {
  if (def._img) { c.drawImage(def._img, -r * 1.1, -r * 1.1, r * 2.2, r * 2.2); return; }
  const col = def.color || '#888', col2 = def.color2 || '#fff';
  const C = (x, y, rr) => { c.beginPath(); c.arc(x, y, Math.max(0, rr), 0, TAU); };
  const eyes = (y, sp, er, ec = '#111', pupil = true) => { [-1, 1].forEach(s => { c.fillStyle = '#fff'; C(s * sp, y, er); c.fill(); if (pupil) { c.fillStyle = ec; C(s * sp + Math.cos(o.lookA || 0) * er * .35, y + Math.sin(o.lookA || 0) * er * .35, er * .5); c.fill(); } }); };
  switch (def.shape) {
    case 'dummy': {
      const ring = [col, col2, col, col2, col];
      ring.forEach((cc, k) => { c.fillStyle = cc; C(0, 0, r * (1 - k * .19)); c.fill(); });
      c.strokeStyle = '#7a4b22'; c.lineWidth = r * .06; C(0, 0, r); c.stroke();
      c.strokeStyle = 'rgba(122,75,34,.5)'; c.lineWidth = 2; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + .3; c.beginPath(); c.moveTo(Math.cos(a) * r * .85, Math.sin(a) * r * .85); c.lineTo(Math.cos(a) * r * 1.0, Math.sin(a) * r * 1.0); c.stroke(); }
      c.fillStyle = '#222'; C(-r * .28, -r * .15, r * .08); c.fill(); C(r * .28, -r * .15, r * .08); c.fill();
      c.strokeStyle = '#222'; c.lineWidth = r * .05; c.beginPath(); c.arc(0, r * .05, r * .22, .2, Math.PI - .2); c.stroke();
      break;
    }
    case 'blob': {
      const g = c.createRadialGradient(-r * .3, -r * .4, r * .1, 0, 0, r); g.addColorStop(0, '#b8ffc4'); g.addColorStop(1, col);
      c.fillStyle = g; c.beginPath();
      for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU; let rr = r * (.92 + .06 * Math.sin(a * 5 + t * 3)); if (Math.sin(a) > .5) rr *= .95; const x = Math.cos(a) * rr, y = Math.sin(a) * rr * .9 + r * .08; i ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.fill();
      eyes(-r * .05, r * .3, r * .17);
      c.fillStyle = '#1a5c2a'; c.beginPath(); c.ellipse(0, r * .35, r * .2, r * .1, 0, 0, Math.PI); c.fill();
      c.fillStyle = col2; c.beginPath(); c.moveTo(-r * .4, -r * .62); c.lineTo(-r * .45, -r * 1.02); c.lineTo(-r * .2, -r * .8); c.lineTo(0, -r * 1.06); c.lineTo(r * .2, -r * .8); c.lineTo(r * .45, -r * 1.02); c.lineTo(r * .4, -r * .62); c.closePath(); c.fill();
      c.fillStyle = '#ff3b5c'; C(0, -r * .8, r * .07); c.fill();
      break;
    }
    case 'bat': {
      const f = Math.sin(t * 14) * .35;
      c.fillStyle = '#3b2270';
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * r * .3, -r * .1); c.lineTo(s * r * 1.05, -r * (.55 + f)); c.lineTo(s * r * .9, -r * .05); c.lineTo(s * r * 1.0, r * (.25 - f * .5)); c.lineTo(s * r * .7, r * .15); c.lineTo(s * r * .6, r * .45); c.lineTo(s * r * .3, r * .2); c.closePath(); c.fill(); });
      const g = c.createRadialGradient(0, -r * .2, 0, 0, 0, r * .6); g.addColorStop(0, col); g.addColorStop(1, '#3b2270');
      c.fillStyle = g; C(0, 0, r * .55); c.fill();
      c.fillStyle = col; [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * r * .15, -r * .45); c.lineTo(s * r * .38, -r * .95); c.lineTo(s * r * .45, -r * .35); c.fill(); });
      c.fillStyle = col2; C(-r * .2, -r * .1, r * .1); c.fill(); C(r * .2, -r * .1, r * .1); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-r * .12, r * .18); c.lineTo(-r * .06, r * .35); c.lineTo(0, r * .18); c.lineTo(r * .06, r * .35); c.lineTo(r * .12, r * .18); c.fill();
      break;
    }
    case 'turtle': {
      c.fillStyle = col2;
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + t * .3; c.beginPath(); c.moveTo(Math.cos(a - .18) * r * .8, Math.sin(a - .18) * r * .8); c.lineTo(Math.cos(a) * r * 1.08, Math.sin(a) * r * 1.08); c.lineTo(Math.cos(a + .18) * r * .8, Math.sin(a + .18) * r * .8); c.fill(); }
      const g = c.createRadialGradient(-r * .2, -r * .3, 0, 0, 0, r * .85); g.addColorStop(0, '#a9c46a'); g.addColorStop(1, col);
      c.fillStyle = g; C(0, 0, r * .85); c.fill();
      c.strokeStyle = '#3f5a1e'; c.lineWidth = r * .05;
      c.beginPath(); for (let k = 0; k <= 6; k++) { const a = k / 6 * TAU + Math.PI / 6; const x = Math.cos(a) * r * .38, y = Math.sin(a) * r * .38; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + Math.PI / 6; c.beginPath(); c.moveTo(Math.cos(a) * r * .38, Math.sin(a) * r * .38); c.lineTo(Math.cos(a) * r * .85, Math.sin(a) * r * .85); c.stroke(); }
      c.fillStyle = '#c9b07a'; C(0, r * .02, r * .24); c.fill(); eyes(-r * .02, r * .1, r * .07);
      break;
    }
    case 'ghost': {
      const g = c.createLinearGradient(0, -r, 0, r); g.addColorStop(0, '#ffffff'); g.addColorStop(1, col2);
      c.fillStyle = g; c.globalAlpha *= .92; c.beginPath(); c.arc(0, -r * .15, r * .78, Math.PI, 0);
      c.lineTo(r * .78, r * .7);
      for (let k = 0; k <= 6; k++) { const x = r * .78 - k * (r * 1.56 / 6); c.lineTo(x, r * (.7 + (k % 2 ? .25 : 0) + .06 * Math.sin(t * 6 + k))); }
      c.closePath(); c.fill(); c.globalAlpha /= .92;
      c.fillStyle = '#1a1f3a'; c.beginPath(); c.ellipse(-r * .28, -r * .2, r * .13, r * .2, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(r * .28, -r * .2, r * .13, r * .2, 0, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(0, r * .2, r * .12, r * .16 + .04 * r * Math.sin(t * 4), 0, 0, TAU); c.fill();
      break;
    }
    case 'serpent': {
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + t * 2; c.fillStyle = k % 2 ? col2 : col; c.globalAlpha *= .6; C(Math.cos(a) * r * .8, Math.sin(a) * r * .8, r * (.18 + .06 * Math.sin(t * 9 + k))); c.fill(); c.globalAlpha /= .6; }
      const g = c.createRadialGradient(-r * .2, -r * .3, 0, 0, 0, r * .8); g.addColorStop(0, col2); g.addColorStop(1, col);
      c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, r * .8, r * .72, 0, 0, TAU); c.fill();
      c.fillStyle = '#7a2a00'; [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * r * .35, -r * .55); c.lineTo(s * r * .6, -r * 1.05); c.lineTo(s * r * .55, -r * .45); c.fill(); });
      [-1, 1].forEach(s => { c.fillStyle = '#fff36b'; c.beginPath(); c.ellipse(s * r * .3, -r * .12, r * .16, r * .12, 0, 0, TAU); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.ellipse(s * r * .3, -r * .12, r * .04, r * .11, 0, 0, TAU); c.fill(); });
      c.strokeStyle = '#7a2a00'; c.lineWidth = r * .05; c.beginPath(); c.moveTo(-r * .3, r * .3); c.lineTo(r * .3, r * .3); c.stroke();
      break;
    }
    case 'knight': {
      c.fillStyle = col2; c.beginPath(); c.moveTo(-r * .15, -r * .7); c.quadraticCurveTo(r * .2, -r * 1.25, r * .55, -r * .9); c.quadraticCurveTo(r * .2, -r * .85, r * .15, -r * .65); c.fill();
      const g = c.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#ffffff'); g.addColorStop(.5, col); g.addColorStop(1, '#5a6478');
      c.fillStyle = g; C(0, 0, r * .82); c.fill();
      c.strokeStyle = '#5a6478'; c.lineWidth = r * .05; c.beginPath(); c.moveTo(0, -r * .82); c.lineTo(0, -r * .2); c.stroke();
      c.fillStyle = '#141826'; roundPath(c, -r * .62, -r * .18, r * 1.24, r * .3, r * .1); c.fill();
      c.fillStyle = o.enraged ? '#ff3b5c' : '#7ad7ff'; c.shadowColor = c.fillStyle; c.shadowBlur = 10; c.fillRect(-r * .5, -r * .06, r, r * .06); c.shadowBlur = 0;
      c.fillStyle = '#5a6478'; for (let k = -2; k <= 2; k++) { c.fillRect(k * r * .14 - r * .03, r * .25, r * .06, r * .25); }
      break;
    }
    case 'eye': {
      c.strokeStyle = col2; c.lineWidth = r * .06;
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + t * .8; c.beginPath(); c.moveTo(Math.cos(a) * r * .9, Math.sin(a) * r * .9); c.lineTo(Math.cos(a + .1) * r * 1.0, Math.sin(a + .1) * r * 1.0); c.lineTo(Math.cos(a - .05) * r * 1.0, Math.sin(a - .05) * r * 1.0); c.lineTo(Math.cos(a + .05) * r * 1.1, Math.sin(a + .05) * r * 1.1); c.stroke(); }
      c.fillStyle = '#f4f6ff'; C(0, 0, r * .88); c.fill();
      c.strokeStyle = 'rgba(255,59,92,.6)'; c.lineWidth = 1.5; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * r * .88, Math.sin(a) * r * .88); c.quadraticCurveTo(Math.cos(a + .2) * r * .7, Math.sin(a + .2) * r * .7, Math.cos(a + .1) * r * .55, Math.sin(a + .1) * r * .55); c.stroke(); }
      const ix = Math.cos(o.lookA || 0) * r * .3, iy = Math.sin(o.lookA || 0) * r * .3;
      const g = c.createRadialGradient(ix, iy, 0, ix, iy, r * .42); g.addColorStop(0, '#bfe6ff'); g.addColorStop(1, o.enraged ? '#ff3b5c' : col);
      c.fillStyle = g; C(ix, iy, r * .42); c.fill(); c.fillStyle = '#0a0c18'; C(ix, iy, r * (.17 + .04 * Math.sin(t * 3))); c.fill();
      c.fillStyle = '#fff'; C(ix - r * .1, iy - r * .12, r * .07); c.fill();
      break;
    }
    case 'golem': {
      c.save(); c.rotate(t * .6); c.fillStyle = '#5a5f69';
      for (let k = 0; k < 10; k++) { c.rotate(TAU / 10); c.fillRect(-r * .12, -r * 1.06, r * .24, r * .3); }
      c.restore();
      const g = c.createLinearGradient(0, -r, 0, r); g.addColorStop(0, '#b4bac4'); g.addColorStop(1, col);
      c.fillStyle = g; roundPath(c, -r * .78, -r * .78, r * 1.56, r * 1.56, r * .25); c.fill();
      c.fillStyle = '#5a5f69'; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { C(sx * r * .6, sy * r * .6, r * .07); c.fill(); });
      c.fillStyle = col2; c.shadowColor = col2; c.shadowBlur = 12; c.fillRect(-r * .48, -r * .25, r * .32, r * .14); c.fillRect(r * .16, -r * .25, r * .32, r * .14); c.shadowBlur = 0;
      c.fillStyle = '#3a3e46'; for (let k = 0; k < 5; k++) c.fillRect(-r * .4 + k * r * .18, r * .2, r * .1, r * .25);
      break;
    }
    case 'king': {
      const g = c.createRadialGradient(0, 0, r * .3, 0, 0, r * 1.1); g.addColorStop(0, col); g.addColorStop(1, 'rgba(155,92,255,0)');
      c.fillStyle = g; C(0, 0, r * 1.1); c.fill();
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + t * 1.5; c.fillStyle = col2; C(Math.cos(a) * r * .95, Math.sin(a) * r * .95, r * .06); c.fill(); }
      c.fillStyle = '#05030d'; C(0, 0, r * .78); c.fill(); c.strokeStyle = col; c.lineWidth = r * .04; c.stroke();
      c.fillStyle = '#ffd43b'; c.beginPath(); c.moveTo(-r * .5, -r * .55); c.lineTo(-r * .55, -r * 1.05); c.lineTo(-r * .25, -r * .78); c.lineTo(0, -r * 1.1); c.lineTo(r * .25, -r * .78); c.lineTo(r * .55, -r * 1.05); c.lineTo(r * .5, -r * .55); c.closePath(); c.fill();
      c.fillStyle = col2; c.shadowColor = col2; c.shadowBlur = 16;
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * r * .1, -r * .1); c.lineTo(s * r * .45, -r * .2); c.lineTo(s * r * .4, r * .02); c.closePath(); c.fill(); });
      c.shadowBlur = 0; c.strokeStyle = col2; c.lineWidth = r * .04; c.beginPath(); c.arc(0, r * .25, r * .25, .3, Math.PI - .3); c.stroke();
      break;
    }
    default: {
      const g = c.createRadialGradient(-r * .3, -r * .3, 0, 0, 0, r); g.addColorStop(0, '#fff'); g.addColorStop(.3, col2); g.addColorStop(1, col);
      c.fillStyle = g; C(0, 0, r * .95); c.fill(); eyes(-r * .1, r * .3, r * .16);
    }
  }
}
function roundPath(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

/* export built-in art as PNG (used by tools/editor.html) */
function renderBossPNG(def, size = 512, t = 0) {
  const c2 = document.createElement('canvas'); c2.width = c2.height = size; const x = c2.getContext('2d');
  const r = size / 2.2; x.translate(size / 2, size / 2);
  const d = Object.assign({}, def); delete d._img; drawBossArt(x, d, r, t, { lookA: Math.PI / 2 });
  return c2.toDataURL('image/png');
}


window.CircleArt = { drawBossArt, renderBossPNG, SHAPES: ['dummy','blob','bat','turtle','ghost','serpent','knight','eye','golem','king','orb'] };
})();
