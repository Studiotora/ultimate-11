/* ═══════════════════════════════════════════════════════════════════════════
   ULTIMATE ELEVEN — CROSS QTE (HEADER / VOLLEY / CLEAR / CLAIM)    2026-09-29
   ---------------------------------------------------------------------------
   Author's spec (2026-09-29): when a cross comes down in the box, time slows
   and a ring closes on the player under it.
     ATTACKING (your cross):  ✕ on the first mark  = HEADER
                              □ on the second mark = VOLLEY (the ball lower)
     DEFENDING (CPU cross):   ✕ on its mark = your defender HEADS IT CLEAR
                              □ on its mark = your keeper CLAIMS it (if he can reach)
   Each press is graded PERFECT / GOOD / MISS on its own mark. The winner then
   plays on through the existing aerial outcomes (header at goal -> keeper duel
   with its GK QTE, clearance, claim, knock-down).

   THE MARKS ARE PHYSICAL. Each sits at the flight moment the ball really passes
   that height at the header point (AERIAL.descentT), so a slow-motion ring is
   the same beat the real-time jump used to be - only visible and readable.

   Core (no DOM, no clock): grade / aiGrade / beats / ringRadius - tests in node.
   UI: mount / draw / flash / unmount - one absolutely positioned canvas over
   the player, plus a vignette. game.js owns flight, slow-mo, input, outcomes.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var TUNE = {
    slow: 0.28,              // ball + players run at 28% while the ring is up
    rampMs: 140,             // ease into / out of slow motion (real ms)
    leadMs: 720,             // real ms from the ring appearing to the FIRST mark
    tailMs: 260,             // real ms the ring keeps closing after the last mark
    perfectMs: 75,           // |press - mark| in REAL ms -> PERFECT
    goodMs: 180,             //                            -> GOOD, beyond -> MISS
    volleyBzFrac: 0.42,      // volley contact: ball at 42% of head height (knee / waist)
    edge: {                  // power edge carried into the keeper duel
      header: { PERFECT: 1.20, GOOD: 1.00 },
      volley: { PERFECT: 1.35, GOOD: 1.05 }
    },
    /* CPU contender: a timing error from heading skill (same sigma range as the
       aerial AI jumps: elite 70ms, poor 160ms), graded on the same windows. */
    aiSigma: [70, 160],
    ringR: [96, 26]          // ring radius (px) at the start / end of the window
  };
  var RANK = { PERFECT: 3, GOOD: 2, MISS: 0 };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /** Grade a press: errMs = press time - mark time, in REAL milliseconds. */
  function grade(errMs) {
    var e = Math.abs(errMs);
    return e <= TUNE.perfectMs ? 'PERFECT' : e <= TUNE.goodMs ? 'GOOD' : 'MISS';
  }
  /** A CPU player's timing error (ms) for the same moment, from heading skill 0..1. */
  function aiErr(skill, rand) {
    rand = rand || Math.random;
    var sigma = TUNE.aiSigma[1] - (TUNE.aiSigma[1] - TUNE.aiSigma[0]) * clamp(skill == null ? 0.5 : skill, 0, 1);
    var u = Math.max(1e-9, rand()), v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sigma;
  }
  function aiGrade(skill, rand) { return grade(aiErr(skill, rand)); }
  /** Does grade a (the human) beat grade b (the CPU)? A tie is close to a coin. */
  function beats(a, b, rand) {
    rand = rand || Math.random;
    if (RANK[a] !== RANK[b]) return RANK[a] > RANK[b];
    if (!RANK[a]) return false;                       // both missed: nobody
    return rand() < 0.55;
  }
  /** Ring radius for a flight position p between p0 (ring appears) and p1 (ring gone). */
  function ringRadius(p, p0, p1) {
    var t = clamp((p - p0) / Math.max(1e-6, p1 - p0), 0, 1);
    return TUNE.ringR[0] + (TUNE.ringR[1] - TUNE.ringR[0]) * t;
  }
  /** Flight ticks <-> real ms while slowed. One tick = 16.667ms at normal speed. */
  function ticksToMs(ticks) { return ticks / TUNE.slow * 16.667; }
  function msToTicks(ms) { return ms * TUNE.slow / 16.667; }

  /* ════════════════════════════════ UI ═════════════════════════════════════ */
  var ui = null;
  function css() {
    if (document.getElementById('crossqte-css')) return;
    var st = document.createElement('style'); st.id = 'crossqte-css';
    st.textContent =
      '#cq-vig{position:fixed;inset:0;pointer-events:none;z-index:60;opacity:0;transition:opacity .14s;' +
      'background:radial-gradient(ellipse at center,rgba(0,0,0,0) 38%,rgba(4,10,24,.55) 100%);}' +
      '#cq-vig.on{opacity:1}' +
      '#cq-cv{position:fixed;pointer-events:none;z-index:61;}' +
      '#cq-res{position:fixed;pointer-events:none;z-index:62;transform:translate(-50%,-50%);' +
      'font:700 30px Cinzel,serif;letter-spacing:.08em;color:#fff;text-shadow:0 2px 0 #000,0 0 18px rgba(0,0,0,.6);' +
      'opacity:0;transition:opacity .12s,transform .25s;white-space:nowrap}' +
      '#cq-res.on{opacity:1;transform:translate(-50%,-70%)}' +
      '#cq-res.perfect{color:#ffd24a}#cq-res.good{color:#9fe6ff}#cq-res.miss{color:#ff7a7a}';
    document.head.appendChild(st);
  }
  function mount() {
    css();
    if (ui) return ui;
    var vig = document.createElement('div'); vig.id = 'cq-vig';
    var cv = document.createElement('canvas'); cv.id = 'cq-cv'; cv.width = 460; cv.height = 460;
    var res = document.createElement('div'); res.id = 'cq-res';
    document.body.appendChild(vig); document.body.appendChild(cv); document.body.appendChild(res);
    ui = { vig: vig, cv: cv, cx: cv.getContext('2d'), res: res };
    requestAnimationFrame(function () { if (ui) ui.vig.classList.add('on'); });
    return ui;
  }
  /** Draw the ring at client position (px,py). marks: [{r, glyph, label, col, done}] */
  function draw(px, py, ringR, marks) {
    if (!ui) return;
    var cv = ui.cv, c = ui.cx, S = cv.width;
    cv.style.left = (px - S / 2) + 'px'; cv.style.top = (py - S / 2) + 'px';
    c.clearRect(0, 0, S, S);
    var o = S / 2, maxR = 0;
    marks.forEach(function (m) { if (!m.done && m.r > maxR) maxR = m.r; });
    marks.forEach(function (m, i) {
      c.beginPath(); c.arc(o, o, m.r, 0, Math.PI * 2);
      c.lineWidth = m.done ? 2 : 4; c.strokeStyle = m.done ? 'rgba(255,255,255,.25)' : m.col; c.stroke();
      if (!m.done) {
        /* first mark's tag upper-right, second lower-right, both clear of the
           outermost circle (a colour bar ties each tag to its circle) */
        var a = i === 0 ? -0.72 : 0.62, txt = m.glyph + '  ' + m.label;
        c.font = '700 16px Rajdhani, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle';
        var tx = o + Math.cos(a) * maxR + 12, ty = o + Math.sin(a) * maxR + (i === 0 ? -8 : 8);
        var tw = c.measureText(txt).width;
        c.fillStyle = 'rgba(8,14,30,.86)'; c.fillRect(tx - 6, ty - 12, tw + 12, 24);
        c.fillStyle = m.col; c.fillRect(tx - 6, ty - 12, 3, 24);
        c.fillText(txt, tx + 2, ty + 1);
      }
    });
    if (ringR == null) return;                        // pressed: the ring has done its job
    // the closing ring
    c.beginPath(); c.arc(o, o, ringR, 0, Math.PI * 2);
    c.lineWidth = 3; c.strokeStyle = '#ffffff'; c.shadowColor = 'rgba(255,255,255,.8)'; c.shadowBlur = 8; c.stroke();
    c.shadowBlur = 0;
  }
  function flash(px, py, text, cls) {
    if (!ui) mount();
    var r = ui.res; r.textContent = text; r.className = cls || '';
    r.style.left = px + 'px'; r.style.top = (py - 40) + 'px';
    requestAnimationFrame(function () { r.classList.add('on'); });
  }
  function unmount(delay) {
    var u = ui; ui = null; if (!u) return;
    u.vig.classList.remove('on');
    u.cx.clearRect(0, 0, u.cv.width, u.cv.height);
    setTimeout(function () { [u.vig, u.cv, u.res].forEach(function (e) { if (e && e.parentNode) e.parentNode.removeChild(e); }); }, delay || 700);
  }

  global.CROSSQTE = {
    TUNE: TUNE, RANK: RANK,
    grade: grade, aiErr: aiErr, aiGrade: aiGrade, beats: beats, ringRadius: ringRadius,
    ticksToMs: ticksToMs, msToTicks: msToTicks,
    mount: mount, draw: draw, flash: flash, unmount: unmount
  };
})(typeof window !== 'undefined' ? window : globalThis);
