/* ═══════════════════════════════════════════════════════════════════════════
   ULTIMATE ELEVEN — GOALKEEPER QUICK-TIME EVENT                  2026-09-19
   ---------------------------------------------------------------------------
   After the keeper's move is chosen (Save / Punch / Super Save), a short
   quick-time event decides a BONUS or a PENALTY on his save power. The dice
   roll in calcDefencePower is +-10%; the QTE swings more than that, so the
   keeper's hands decide the save, not luck.

   ONE QTE PER MOVE (author's spec):
     SAVE        timing ring  - press [] as the ring lands on the target
     PUNCH       button mash  - hammer X for 1.4s
     SUPER SAVE  sequence     - three random buttons, in order, against the clock

   Each ends in PERFECT / GOOD / MISS, and TUNE.mult turns that into a
   multiplier on defence power (like G.D.tackleEdge, which keepers never get).

   AI KEEPERS cannot play it, so simulate() rolls the same three grades from
   the keeper's REFLEX, on the same table - a great AI keeper still makes
   great saves, and a human keeper is not strictly stronger than every AI one.

   LAYERS
     core   create / step / mult / odds / simulate - no DOM, no clock of its
            own: time and presses are passed in. That is what lets
            lab/test-gkqte.js check every window exactly in node.
     ui     run() - mounts the overlay, reads presses from the game's own
            input layer (DUEL_* actions: keyboard, pad and the touch diamond
            all arrive the same way), draws, resolves a Promise.

   Status: WIRED INTO THE MATCH 2026-09-19 (game.js gkQteThen, roadmap D.6b) at
   the author's request, before a lab sign-off - first real test is the
   author's phone. lab/lab-gk-qte.html still drives the same code for tuning.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  /* ── TUNING — every number that decides how it feels, in one place ─────── */
  var TUNE = {
    /* grade -> multiplier on the keeper's defence power. Harder QTE, bigger
       swing both ways: the Super Save is the gamble it should be. */
    mult: {
      save:      { PERFECT: 1.20, GOOD: 1.08, MISS: 0.85 },
      punch:     { PERFECT: 1.25, GOOD: 1.10, MISS: 0.82 },
      supersave: { PERFECT: 1.35, GOOD: 1.12, MISS: 0.75 }
    },
    save: {
      delayMin: 350, delayMax: 800,   // random lead-in so the beat cannot be pre-timed
      dur: 850,                       // ring travel from full size to the target
      perfect: 55, good: 140          // +-ms around the target, before the stat scale
    },
    punch: {
      ready: 550,                     // "get ready" beat - presses do not count yet
      dur: 1400,                      // mash window
      perfect: 11, good: 6            // presses needed, before the stat scale
    },
    supersave: {
      ready: 450,
      steps: 3,
      stepMs: 850,                    // time allowed per button, before the stat scale
      fastFrac: 0.5                   // every step inside this share of its limit = PERFECT
    },
    /* How much the stat moves the difficulty. 50 is neutral. */
    reflexScale: function (reflex) { return 0.8 + 0.4 * clamp01((reflex == null ? 50 : reflex) / 100); },
    powerScale:  function (power)  { return 1.2 - 0.4 * clamp01((power  == null ? 50 : power)  / 100); },
    /* AI roll. d = how much harder than a Save the move is for anybody. */
    aiDifficulty: { save: 0, punch: 0.04, supersave: 0.14 }
  };

  var BUTTONS = ['tri', 'cross', 'square', 'circle'];
  var MOVE_BUTTON = { save: 'square', punch: 'cross' };   // supersave: the sequence decides

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ════════════════════════════ CORE ═══════════════════════════════════════ */

  /** New QTE state. stats: {reflex, power}. rand: () => [0,1). now: ms. */
  function create(move, stats, rand, now) {
    if (!TUNE.mult[move]) throw new Error('GKQTE: unknown move ' + move);
    rand = rand || Math.random;
    stats = stats || {};
    var s = { move: move, t0: now, done: false, grade: null, detail: '', phase: '' };
    var rs = TUNE.reflexScale(stats.reflex);
    if (move === 'save') {
      var S = TUNE.save;
      s.phase = 'wait';
      s.ringStart = now + S.delayMin + rand() * (S.delayMax - S.delayMin);
      s.tTarget = s.ringStart + S.dur;
      s.perfectMs = S.perfect * rs;
      s.goodMs = S.good * rs;
    } else if (move === 'punch') {
      var P = TUNE.punch, ps = TUNE.powerScale(stats.power);
      s.phase = 'ready';
      s.mashStart = now + P.ready;
      s.mashEnd = s.mashStart + P.dur;
      s.needPerfect = Math.max(2, Math.ceil(P.perfect * ps));
      s.needGood = Math.max(1, Math.ceil(P.good * ps));
      s.count = 0;
    } else {
      var Q = TUNE.supersave, seq = [], last = null;
      for (var i = 0; i < Q.steps; i++) {
        var pool = BUTTONS.filter(function (b) { return b !== last; });
        last = pool[Math.floor(rand() * pool.length) % pool.length];
        seq.push(last);
      }
      s.phase = 'ready';
      s.seq = seq;
      s.idx = 0;
      s.stepMs = Q.stepMs * rs;
      s.stepStart = now + Q.ready;
      s.times = [];
    }
    return s;
  }

  function finish(s, grade, detail) {
    s.done = true; s.grade = grade; s.detail = detail; s.phase = 'done';
    s.mult = TUNE.mult[s.move][grade];
    return s;
  }

  /** Advance to `now` and apply the presses made since the last step.
      presses: [{btn:'square'|'cross'|'tri'|'circle', t:ms}], in time order. */
  function step(s, now, presses) {
    if (s.done) return s;
    presses = presses || [];

    if (s.move === 'save') {
      for (var i = 0; i < presses.length; i++) {
        var p = presses[i];
        if (p.btn !== MOVE_BUTTON.save) continue;          // only [] counts; others ignored
        // ONE press decides it - spamming cannot find the window.
        if (p.t < s.ringStart) return finish(s, 'MISS', 'too early');
        var err = p.t - s.tTarget, a = Math.abs(err);
        var ms = (err < 0 ? '' : '+') + Math.round(err) + 'ms';
        if (a <= s.perfectMs) return finish(s, 'PERFECT', ms);
        if (a <= s.goodMs)    return finish(s, 'GOOD', ms);
        return finish(s, 'MISS', err < 0 ? ms + ' early' : ms + ' late');
      }
      if (now > s.tTarget + s.goodMs) return finish(s, 'MISS', 'no save');
      s.phase = now < s.ringStart ? 'wait' : 'ring';
      return s;
    }

    if (s.move === 'punch') {
      for (var j = 0; j < presses.length; j++) {
        var q = presses[j];
        if (q.btn !== MOVE_BUTTON.punch) continue;
        if (q.t < s.mashStart || q.t > s.mashEnd) continue; // outside the window: not counted
        s.count++;
        if (s.count >= s.needPerfect)                      // full meter ends it early
          return finish(s, 'PERFECT', s.count + ' punches');
      }
      if (now >= s.mashEnd) {
        return s.count >= s.needGood
          ? finish(s, 'GOOD', s.count + '/' + s.needPerfect + ' punches')
          : finish(s, 'MISS', s.count + '/' + s.needGood + ' punches');
      }
      s.phase = now < s.mashStart ? 'ready' : 'mash';
      return s;
    }

    // supersave
    for (var k = 0; k < presses.length; k++) {
      var r = presses[k];
      if (r.t < s.stepStart) continue;                      // presses during "ready" are ignored
      if (r.t > s.stepStart + s.stepMs) break;              // handled as a timeout below
      if (r.btn !== s.seq[s.idx]) return finish(s, 'MISS', 'wrong button (' + (s.idx + 1) + '/' + s.seq.length + ')');
      s.times.push(r.t - s.stepStart);
      s.idx++;
      s.stepStart = r.t;
      if (s.idx >= s.seq.length) {
        var fast = s.times.every(function (t) { return t <= s.stepMs * TUNE.supersave.fastFrac; });
        var total = s.times.reduce(function (x, y) { return x + y; }, 0);
        return finish(s, fast ? 'PERFECT' : 'GOOD', s.seq.length + '/' + s.seq.length + ' in ' + (total / 1000).toFixed(2) + 's');
      }
    }
    if (now > s.stepStart + s.stepMs) return finish(s, 'MISS', 'too slow (' + (s.idx + 1) + '/' + s.seq.length + ')');
    s.phase = now < s.stepStart && s.idx === 0 ? 'ready' : 'seq';
    return s;
  }

  function mult(move, grade) { return (TUNE.mult[move] || {})[grade] || 1; }

  /** AI keeper: chance of each grade from REFLEX. Sums to 1. */
  function odds(move, reflex) {
    var r = clamp01((reflex == null ? 50 : reflex) / 100);
    var d = TUNE.aiDifficulty[move] || 0;
    var perfect = clamp(0.05 + 0.40 * r * r - d, 0.02, 0.60);
    var miss = clamp(0.45 - 0.40 * r + d, 0.05, 0.70);
    var good = Math.max(0, 1 - perfect - miss);
    return { PERFECT: perfect, GOOD: good, MISS: miss };
  }

  function simulate(move, reflex, rand) {
    var o = odds(move, reflex), x = (rand || Math.random)();
    var grade = x < o.PERFECT ? 'PERFECT' : x < o.PERFECT + o.GOOD ? 'GOOD' : 'MISS';
    return { move: move, grade: grade, mult: mult(move, grade), detail: 'AI roll', simulated: true };
  }

  /* ════════════════════════════ UI ═════════════════════════════════════════ */

  var ACTION_BTN = {                       // input-layer action -> QTE button
    DUEL_READ: 'tri', DUEL_BODY: 'cross', DUEL_COMMIT: 'square', DUEL_COMBO: 'circle',
    /* RT may still be held from picking SUPER SAVE (RT+[]). The chord layer
       then reports the S_ action instead of the plain one, and the press would
       vanish - so both mean the same button here. */
    DUEL_S_READ: 'tri', DUEL_S_BODY: 'cross', DUEL_S_COMMIT: 'square', DUEL_S_COMBO: 'circle'
  };
  var GLYPH = { tri: '△', cross: '✕', square: '□', circle: '○' };
  var KEY = { tri: 'Q', cross: 'X', square: 'E', circle: 'R' };

  var queue = [], active = null, hooked = false;
  function nowMs() { return (global.performance && performance.now) ? performance.now() : Date.now(); }
  function push(btn) { if (active) queue.push({ btn: btn, t: nowMs() }); }

  function hookInput() {
    if (hooked) return; hooked = true;
    if (global.UEInput && UEInput.on) {
      // Listeners fire once per press edge from the input poll - exact, and the
      // same path keyboard and pad both take.
      Object.keys(ACTION_BTN).forEach(function (a) {
        if (UEInput.ACTIONS && UEInput.ACTIONS[a]) UEInput.on(a, function () { push(ACTION_BTN[a]); });
      });
    } else {
      // No input layer (a bare test page): the same keys by hand.
      var map = { q: 'tri', x: 'cross', e: 'square', r: 'circle' };
      global.addEventListener('keydown', function (ev) {
        if (ev.repeat) return;
        var b = map[(ev.key || '').toLowerCase()]; if (b) push(b);
      });
    }
  }

  var CSS_ID = 'gkqte-css';
  /* STYLE follows the live duel (style.css "the row" block + STYLE.md):
     Cinzel title case for the move name, like the duel rows; Rajdhani caps
     captions on the wide track, like the cost caption; Bold Pixel on the
     NUMBER only (numerals are its sole job - never letters, never faux-bold).
     Sizes are px: this mounts inside the fixed 1280x720 stage, where vw/vh
     and vmin measure the window, not the box (the ROADMAP "viewport units"
     bug) - an earlier lab build had max-width:70vmin and would have shrunk
     on a phone. */
  function injectCSS() {
    if (document.getElementById(CSS_ID)) return;
    var st = document.createElement('style'); st.id = CSS_ID;
    st.textContent = [
      '.gkq{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;',
      ' pointer-events:none;z-index:60;font-family:var(--u-font-ui,Rajdhani,system-ui,sans-serif);color:var(--u-ink,#fbfbfc)}',
      /* a soft pool of dark behind the ring so it reads over the keeper art */
      '.gkq::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;',
      ' background:radial-gradient(ellipse 34% 46% at 50% 50%,rgba(var(--u-panel-rgb,2,10,26),.70) 0%,',
      ' rgba(var(--u-panel-rgb,2,10,26),.35) 55%,rgba(0,0,0,0) 100%)}',
      '.gkq-h{font-family:var(--u-font-display,Cinzel,Georgia,serif);font-weight:700;font-size:30px;letter-spacing:.02em;',
      ' text-transform:none;text-shadow:0 2px 6px rgba(0,0,0,.92);margin-bottom:2px}',
      '.gkq-sub{font-weight:700;font-size:13px;letter-spacing:var(--u-track-wide,.22em);text-transform:uppercase;',
      ' color:var(--u-ink-dim,#9fb2cc);text-shadow:0 1px 3px rgba(0,0,0,.9);min-height:1.3em}',
      '.gkq canvas{width:380px;height:380px}',
      '.gkq-res{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;',
      ' opacity:0;transform:scale(1.25);transition:opacity .18s,transform .22s cubic-bezier(.2,.9,.3,1.3)}',
      '.gkq-res.in{opacity:1;transform:scale(1)}',
      '.gkq-grade{font-family:var(--u-font-display,Cinzel,serif);font-weight:900;font-size:64px;letter-spacing:.06em;',
      ' text-shadow:0 0 24px currentColor,0 4px 14px rgba(0,0,0,.9)}',
      '.gkq-grade.PERFECT{color:rgb(var(--u-gold-rgb,240,192,64))}',
      '.gkq-grade.GOOD{color:var(--u-accent-bright,#4a9bf0)}',
      '.gkq-grade.MISS{color:var(--u-bad,#e04848)}',
      '.gkq-eff{display:flex;align-items:baseline;gap:8px;margin-top:6px;text-shadow:0 2px 6px rgba(0,0,0,.9)}',
      '.gkq-eff b{font-family:var(--u-font-num,"Bold Pixel",monospace);font-weight:400;font-synthesis:none;font-size:28px}',
      '.gkq-eff span{font-weight:700;font-size:13px;letter-spacing:var(--u-track-wide,.22em);text-transform:uppercase;',
      ' color:var(--u-ink-dim,#9fb2cc)}',
      '.gkq-det{font-weight:600;font-size:14px;color:var(--u-ink-dim,#9fb2cc);margin-top:4px;letter-spacing:.06em}',
      '.gkq-pad{position:absolute;right:6%;bottom:8%;width:156px;height:156px;pointer-events:auto}',
      '.gkq-pad button{position:absolute;width:52px;height:52px;border-radius:50%;border:1.5px solid rgba(255,255,255,.35);',
      ' background:rgba(var(--u-panel-rgb,2,10,26),.78);color:#fff;font-size:22px;line-height:1;cursor:pointer;',
      ' touch-action:none;-webkit-tap-highlight-color:transparent}',
      '.gkq-pad button:active{transform:scale(.92);background:rgba(var(--u-accent-rgb,38,126,226),.6)}',
      '.gkq-pad [data-b=tri]{left:52px;top:0}.gkq-pad [data-b=circle]{left:104px;top:52px}',
      '.gkq-pad [data-b=cross]{left:52px;top:104px}.gkq-pad [data-b=square]{left:0;top:52px}'
    ].join('');
    document.head.appendChild(st);
  }

  var TITLE = { save: 'Save', punch: 'Punch', supersave: 'Super Save' };

  /** Run one QTE. opts: {host, stats:{reflex,power}, touch:bool, glyph:fn(btn)}
      Resolves {move, grade, mult, detail}. */
  function run(move, opts) {
    opts = opts || {};
    hookInput(); injectCSS();
    if (active) cancel();
    var host = opts.host || document.body;
    var glyph = opts.glyph || function (b) { return GLYPH[b]; };
    var root = document.createElement('div'); root.className = 'gkq';
    root.innerHTML = '<div class="gkq-h"></div><div class="gkq-sub"></div><canvas width="640" height="640"></canvas>' +
      '<div class="gkq-res"><div class="gkq-grade"></div><div class="gkq-eff"></div><div class="gkq-det"></div></div>';
    var h = root.querySelector('.gkq-h'), sub = root.querySelector('.gkq-sub');
    var cv = root.querySelector('canvas'), cx = cv.getContext('2d');
    h.textContent = TITLE[move];
    if (opts.touch !== false) {
      var pad = document.createElement('div'); pad.className = 'gkq-pad';
      BUTTONS.forEach(function (b) {
        var el = document.createElement('button'); el.dataset.b = b; el.textContent = GLYPH[b];
        el.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); push(b); });
        pad.appendChild(el);
      });
      root.appendChild(pad);
    }
    host.appendChild(root);

    var s = create(move, opts.stats, Math.random, nowMs());
    queue = [];
    var pop = 0;                                  // punch hit-flash
    return new Promise(function (resolve) {
      active = { root: root, resolve: resolve, raf: 0 };
      function frame() {
        if (!active || active.root !== root) return;
        var t = nowMs(), before = s.count || 0;
        var ps = queue; queue = [];
        step(s, t, ps);
        if ((s.count || 0) > before) pop = t;
        draw(cx, s, t, glyph, sub, pop);
        if (s.done) { showResult(root, s); active.raf = 0; setTimeout(function () { end(resolve, s); }, opts.holdMs || 1100); return; }
        active.raf = requestAnimationFrame(frame);
      }
      active.raf = requestAnimationFrame(frame);
    });
  }

  function end(resolve, s) {
    if (active) { if (active.root.parentNode) active.root.parentNode.removeChild(active.root); active = null; }
    resolve({ move: s.move, grade: s.grade, mult: s.mult, detail: s.detail });
  }
  function cancel() {
    if (!active) return;
    if (active.raf) cancelAnimationFrame(active.raf);
    if (active.root.parentNode) active.root.parentNode.removeChild(active.root);
    active = null; queue = [];
  }

  function showResult(root, s) {
    var r = root.querySelector('.gkq-res');
    var g = r.querySelector('.gkq-grade'); g.textContent = s.grade; g.className = 'gkq-grade ' + s.grade;
    var pct = Math.round((s.mult - 1) * 100), eff = r.querySelector('.gkq-eff');
    eff.innerHTML = '';                        // number in Bold Pixel, words in Rajdhani
    var b = document.createElement('b'); b.textContent = (pct >= 0 ? '+' : '') + pct + '%';
    var sp = document.createElement('span'); sp.textContent = 'save power';
    eff.appendChild(b); eff.appendChild(sp);
    r.querySelector('.gkq-det').textContent = s.detail;
    root.querySelector('canvas').style.opacity = '.25';
    requestAnimationFrame(function () { r.classList.add('in'); });
  }

  /* ── drawing (canvas is 640x640 backing, shown at 320) ─────────────────── */
  var C = 320;
  function cssVar(n, fb) {
    try { var v = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); return v || fb; }
    catch (e) { return fb; }
  }
  /* The PlayStation face colours, exactly as the in-match touch pad paints
     them (style.css #dpad .tri/.sq/.ci/.xx), so a button looks the same on
     the pad and in the QTE. Only used when the glyph IS the PS symbol - an
     Xbox letter or a key name stays white rather than wearing the wrong
     brand's colour. */
  var PS_COL = { tri: '#3cdc78', square: '#ff69b4', circle: '#ff5050', cross: '#78aaff' };
  var _glyphCol = null;
  function colFor(b, glyph) { return glyph(b) === GLYPH[b] ? PS_COL[b] : '#fff'; }
  function draw(cx, s, t, glyph, sub, pop) {
    var gold = 'rgb(' + cssVar('--u-gold-rgb', '240,192,64') + ')';
    /* SUPER SAVE is a special: purple, like its row in the duel menu. */
    var acc = 'rgb(' + (s.move === 'supersave' ? cssVar('--u-magic-rgb', '150,96,255')
                                               : cssVar('--u-accent-rgb', '38,126,226')) + ')';
    _glyphCol = function (b) { return colFor(b, glyph); };
    cx.clearRect(0, 0, 640, 640);
    cx.lineCap = 'round';
    if (s.move === 'save') drawSave(cx, s, t, glyph, sub, gold, acc);
    else if (s.move === 'punch') drawPunch(cx, s, t, glyph, sub, gold, acc, pop);
    else drawSeq(cx, s, t, glyph, sub, gold, acc);
  }
  function btnGlyph(cx, txt, x, y, size, col) {
    cx.fillStyle = col; cx.font = '700 ' + size + 'px system-ui,"Segoe UI Symbol",sans-serif';
    cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(txt, x, y);
  }
  function drawSave(cx, s, t, glyph, sub, gold, acc) {
    var RT = 110, R0 = RT * 2.6, span = s.tTarget - s.ringStart;
    // radius as a function of time: R0 at ringStart, RT at the target, keeps closing after
    function rAt(time) { return RT + (R0 - RT) * (s.tTarget - time) / span; }
    // the GOOD band and the PERFECT band, drawn where the ring will be at those instants
    cx.lineWidth = rAt(s.tTarget - s.goodMs) - rAt(s.tTarget + s.goodMs);
    cx.strokeStyle = 'rgba(74,155,240,.22)';
    cx.beginPath(); cx.arc(C, C, RT, 0, Math.PI * 2); cx.stroke();
    cx.lineWidth = rAt(s.tTarget - s.perfectMs) - rAt(s.tTarget + s.perfectMs);
    cx.strokeStyle = gold; cx.globalAlpha = .55;
    cx.beginPath(); cx.arc(C, C, RT, 0, Math.PI * 2); cx.stroke(); cx.globalAlpha = 1;
    btnGlyph(cx, glyph('square'), C, C, 96, _glyphCol('square'));
    if (t < s.ringStart) { sub.textContent = 'Get ready…'; return; }
    sub.textContent = 'Press ' + glyph('square') + ' as the ring hits gold';
    var r = Math.max(8, rAt(t));
    cx.lineWidth = 10; cx.strokeStyle = '#fff'; cx.shadowColor = acc; cx.shadowBlur = 24;
    cx.beginPath(); cx.arc(C, C, r, 0, Math.PI * 2); cx.stroke(); cx.shadowBlur = 0;
  }
  function drawPunch(cx, s, t, glyph, sub, gold, acc, pop) {
    var R = 200, fill = Math.min(1, s.count / s.needPerfect);
    cx.lineWidth = 26; cx.strokeStyle = 'rgba(255,255,255,.12)';
    cx.beginPath(); cx.arc(C, C, R, 0, Math.PI * 2); cx.stroke();
    // GOOD tick
    var ga = -Math.PI / 2 + Math.PI * 2 * (s.needGood / s.needPerfect);
    cx.lineWidth = 34; cx.strokeStyle = acc;
    cx.beginPath(); cx.arc(C, C, R, ga - .02, ga + .02); cx.stroke();
    cx.lineWidth = 26; cx.strokeStyle = s.count >= s.needGood ? gold : acc;
    cx.beginPath(); cx.arc(C, C, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fill); cx.stroke();
    var k = pop ? Math.max(0, 1 - (t - pop) / 120) : 0;
    btnGlyph(cx, glyph('cross'), C, C, 120 + 40 * k, k > 0 ? gold : _glyphCol('cross'));
    if (t < s.mashStart) { sub.textContent = 'Get ready…'; return; }
    var left = Math.max(0, s.mashEnd - t);
    sub.textContent = 'Mash ' + glyph('cross') + '!  ' + (left / 1000).toFixed(1) + 's';
    // time bar
    cx.fillStyle = 'rgba(255,255,255,.12)'; cx.fillRect(170, 590, 300, 10);
    cx.fillStyle = '#fff'; cx.fillRect(170, 590, 300 * left / TUNE.punch.dur, 10);
  }
  function drawSeq(cx, s, t, glyph, sub, gold, acc) {
    var n = s.seq.length, gap = 180, x0 = C - gap * (n - 1) / 2;
    for (var i = 0; i < n; i++) {
      var x = x0 + gap * i, y = C, done = i < s.idx, cur = i === s.idx && t >= s.stepStart;
      cx.lineWidth = 6;
      cx.strokeStyle = done ? gold : cur ? '#fff' : 'rgba(255,255,255,.25)';
      cx.fillStyle = 'rgba(2,10,26,.6)';
      cx.beginPath(); cx.arc(x, y, 70, 0, Math.PI * 2); cx.fill(); cx.stroke();
      if (cur) {                                    // draining timer around the live button
        var left = clamp01(1 - (t - s.stepStart) / s.stepMs);
        cx.lineWidth = 12; cx.strokeStyle = left > TUNE.supersave.fastFrac ? gold : acc;
        cx.beginPath(); cx.arc(x, y, 86, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left); cx.stroke();
      }
      cx.globalAlpha = (done || cur || t < s.stepStart) ? 1 : 0.38;          // the ones still to come wait dimmed
      btnGlyph(cx, glyph(s.seq[i]), x, y, 72, done ? gold : _glyphCol(s.seq[i]));
      cx.globalAlpha = 1;
    }
    sub.textContent = t < s.stepStart && s.idx === 0 ? 'Get ready…' : 'Press them in order';
  }

  global.GKQTE = {
    TUNE: TUNE, BUTTONS: BUTTONS,
    create: create, step: step, mult: mult, odds: odds, simulate: simulate,
    run: run, cancel: cancel,
    /** Feed a press from outside the input layer - the match's own touch pad
        (#dpad) routes its face buttons here while a QTE is live. */
    press: function (btn) { if (BUTTONS.indexOf(btn) > -1) push(btn); },
    active: function () { return !!active; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
