/* ═══════════════════════════════════════════════════════════════════════════
   ULTIMATE ELEVEN — AERIAL CONTEST (HEADERS)                      2026-09-19
   ---------------------------------------------------------------------------
   Roadmap C.4 / Part 5, step 1 of 3 (then corners, then the CPU's set-piece
   brain). Author's spec: REAL-TIME jump timing, no pause. As a high ball comes
   down you press X to jump; the timing decides the header, and a PERFECT jump
   plus the stick gives an aimed header.

   THE MODEL IS PHYSICAL, NOT A PROMPT. A player can play a dropping ball when
   it is within reach sideways AND no higher than his head:
        reach = headBz + jumpBz * jumpHeight          (engine ball units, bz)
   jumpHeight is the game's own 0..1 jump curve, so a jump that peaks as the
   ball arrives reaches highest - and the ball comes DOWN, so the highest
   reach touches it first and wins the ball. Early / late are not rules: an
   early jumper is already landing and a late one is still crouched when the
   ball passes, so they reach no higher than a man standing still, and a
   better-timed opponent gets there first. The grade is simply how high the
   winner was when he met it.

   Numbers: at the author's sprite size a head is ~bz 14 and a full jump adds
   ~9-17, so a well-timed head is at ~bz 23-31; a cross comes down through
   that in its last ~17% (~140ms). The jump peaks 315ms after the press; the
   MEASURED PERFECT window is -48..+63ms (111ms) - the keeper's Save ring.
   Heights are read live from the renderer (P3D.aerialHeights), so changing
   the sprite size in the Camera Lab moves the window with the picture.

   Pure core only: no DOM, no clock. game.js owns movement, input and drawing
   and asks this module the rule questions. Tests: node lab/test-aerial.js
   ═══════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var TUNE = {
    /* grade by how high the winner was when he met it (the game's 0..1 curve).
       MEASURED, not guessed (lab/test-aerial.js presses at every ms offset):
       .85/.35 gave a lopsided 166ms PERFECT and a GOOD reaching +245ms late,
       because a late jumper rises INTO the falling ball and meets it high for
       longer than it looks. .93/.55 gives PERFECT -48..+63ms (111ms) - the
       keeper's Save ring - and it holds for short/long crosses and every
       sprite size tried (the window only moves with the jump curve). */
    perfectH: 0.93, goodH: 0.55,
    /* header power edge by grade - applied like tackleEdge */
    edge: { PERFECT: 1.20, GOOD: 1.00, STANDING: 0.85 },
    reachW: 0.016,          // sideways reach, fraction of pitch width (ground touch is .010)
    minBz: 0.5,             // below headBz*minBz it is a chest/feet ball, not a header
    gkArms: 1.35,           // a keeper's reach: arms above the head
    gkBoxDepth: 0.10,       // keepers contest only this far off their line (fraction of W)
    gkBoxHalf: 0.22,        // ...and this close to the centre line (fraction of H)
    apexMs: 315,            // jump peak after the press: (80 + 550) / 2, see JUMP.frames
    /* AI timing error (ms, one standard deviation) - elite 70ms, poor 160ms.
       MEASURED in a live match, fixed 60fps steps, 2 centre-backs marking one
       striker: at 25-110 a good CB hit PERFECT ~95% of the time and even a
       perfectly timed human won 5/30. At 70-160 a strong CB is PERFECT about
       half the time, a perfect human jump wins 13/30 (all PERFECT) against
       two markers, and no jump / early wins 0. */
    aiSigma: [70, 160],
    aiReactW: 0.075,        // AI players within this of the drop zone try to head it
    shotProgress: 0.78,     // attacker header this far up the pitch...
    shotBand: 0.26,         // ...and this central (|y-H/2| < band*H) is a header AT GOAL
    fallbackHeights: { headBz: 14, jumpBz: 12 }
  };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /** Ball height on a cross at flight fraction t - the SAME formula as
      tickPhysicalPass (arc parabola plus the carried launch lift). */
  function bzAt(t, arc, launchBz) {
    return arc * 4 * t * (1 - t) + (launchBz || 0) * (1 - t) * (1 - t);
  }

  /** Flight fraction where the DESCENDING ball reaches height h. Solves
      bz(t)=h for the root after the apex; null if the ball never gets up there. */
  function descentT(arc, launchBz, h) {
    var L = launchBz || 0;
    // bz(t) = (L-4arc) t^2 + (4arc - 2L) t + L
    var A = L - 4 * arc, B = 4 * arc - 2 * L, C = L - h;
    if (Math.abs(A) < 1e-9) { if (Math.abs(B) < 1e-9) return null; var t0 = -C / B; return t0 >= 0 && t0 <= 1 ? t0 : null; }
    var D = B * B - 4 * A * C;
    if (D < 0) return null;
    var s = Math.sqrt(D), r1 = (-B + s) / (2 * A), r2 = (-B - s) / (2 * A);
    var roots = [r1, r2].filter(function (r) { return r >= 0 && r <= 1; });
    if (!roots.length) return null;
    return Math.max.apply(null, roots);               // the later root = on the way down
  }

  function reach(heights, jumpH, isGK) {
    var head = heights.headBz * (isGK ? TUNE.gkArms : 1);
    return head + heights.jumpBz * clamp(jumpH || 0, 0, 1);
  }

  function grade(jumpH) {
    return jumpH >= TUNE.perfectH ? 'PERFECT' : jumpH >= TUNE.goodH ? 'GOOD' : 'STANDING';
  }

  /** Who wins a dropping ball RIGHT NOW. cands: [{id, reach, skill, jumpH}],
      each already inside sideways reach. Only those whose reach is at or above
      the ball can touch it; the highest reach wins, heading skill breaks a
      tie, then chance. Returns the winner (with .grade) or null. */
  function contest(cands, ballBz, headBz, rand) {
    rand = rand || Math.random;
    if (ballBz < headBz * TUNE.minBz) return null;    // too low for a header
    var live = cands.filter(function (c) { return c.reach >= ballBz; });
    if (!live.length) return null;
    live.forEach(function (c) { c._s = c.reach + (c.skill || 0.5) * 1.5 + rand() * 0.8; });
    live.sort(function (a, b) { return b._s - a._s; });
    var w = live[0];
    w.grade = grade(w.jumpH || 0);
    w.edge = TUNE.edge[w.grade];
    return w;
  }

  /** Heading skill 0..1 from the stats this game has (no heading stat):
      attackers finish with power, defenders defend with power, keepers catch. */
  function skill(pl, role) {
    if (!pl) return 0.5;
    var g = function (k) { return +pl[k] || 60; };
    var v = role === 'gk' ? (g('ref') + g('sav')) / 2
          : role === 'def' ? (g('pwr') + g('def')) / 2
          : (g('pwr') + g('sho')) / 2;
    return clamp((v - 45) / 50, 0, 1);
  }

  /** When should an AI player press jump? msToContact = time until the ball
      is at his best reach; the press is apexMs earlier, blurred by skill. */
  function aiPressDelay(msToContact, sk, rand) {
    rand = rand || Math.random;
    var sigma = TUNE.aiSigma[1] - (TUNE.aiSigma[1] - TUNE.aiSigma[0]) * clamp(sk, 0, 1);
    // Box-Muller: a normal error, so most AI jumps are close and a few are bad
    var u = Math.max(1e-9, rand()), v = rand();
    var n = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return msToContact - TUNE.apexMs + n * sigma;
  }

  /** What the winner does with it. side roles: 'atk' (the crossing side), 'def', 'gk'. */
  function outcome(role, progress, yFrac) {
    if (role === 'gk') return 'claim';
    if (role === 'def') return 'clear';
    return (progress >= TUNE.shotProgress && Math.abs(yFrac - 0.5) < TUNE.shotBand) ? 'shot' : 'knockdown';
  }

  global.AERIAL = {
    TUNE: TUNE,
    bzAt: bzAt, descentT: descentT, reach: reach, grade: grade,
    contest: contest, skill: skill, aiPressDelay: aiPressDelay, outcome: outcome
  };
})(typeof window !== 'undefined' ? window : globalThis);
