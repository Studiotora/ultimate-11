/* ═══════════════════════════════════════════════════════════════════════════
   ULTIMATE ELEVEN — INPUT LAYER                            roadmap B.1 · 2026-09
   ---------------------------------------------------------------------------
   One place that turns physical input (keyboard / gamepad / touch) into the
   game's SEMANTIC actions. Match code asks "is SHOOT pressed?" and never looks
   at a key code again.

   WHY THIS EXISTS
   game.js already had half of this, built for local PvP: INPUT_BIND, _bindStick
   and _bindDown, with button slots named south/east/west/north/r1. It called a
   `GP` module for pad reads — but `GP` was never written, so `typeof GP` was
   always undefined, _padOK() always returned false, and every pad binding
   silently fell back to the keyboard. This file supplies the missing backend
   and generalises the idea past PvP.

   THE ONE-BUTTON-TWO-MEANINGS RULE
   Football games keep the button count low by giving each button a different
   job depending on whether you have the ball. That is deliberate, and it is why
   the actions below are named for their ATTACKING job with the defending job
   documented beside them — SHOOT and TACKLE are the same physical button, and
   binding them separately would be a bug, not a feature.

   BINDINGS ARE DATA
   Everything is in DEFAULTS below. Changing a control is a one-line edit here,
   never a change to match code. B.3 (the rebinding screen) writes to the same
   structure and persists it to localStorage.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  /* ── ACTIONS ──────────────────────────────────────────────────────────────
     Named for the attacking job; the defending job is in the comment. */
  var ACTIONS = {
    SPRINT: 'SPRINT',   // hold           · both phases
    JUMP:   'JUMP',     // jump           · block
    PASS:   'PASS',     // short pass     · contain (hold)
    SHOOT:  'SHOOT',    // shoot          · tackle
    CROSS:  'CROSS',    // cross          · slide tackle
    SWITCH: 'SWITCH',   // (unused)       · switch player
    SUPER:  'SUPER',    // special/super  · —

    /* ── DUEL (2026-09-15) ────────────────────────────────────────
       The duel is a different CONTEXT, so the same four face buttons carry a
       second action set. These are named for the MEANING rather than the move,
       because one button keeps one meaning on both sides of the ball:

          READ    △   pass      · intercept
          BODY    ✕   dribble   · block / punch
          COMMIT  □   shoot     · tackle / save
          COMBO   ○   one-two   · —

       and RT + the same button is that action's SUPER, exactly like the
       in-match super shot (RT + □). Nothing new to learn in the duel: the
       same finger does the same KIND of thing wherever you are. */
    DUEL_READ:     'DUEL_READ',
    DUEL_BODY:     'DUEL_BODY',
    DUEL_COMMIT:   'DUEL_COMMIT',
    DUEL_COMBO:    'DUEL_COMBO',
    DUEL_S_READ:   'DUEL_S_READ',
    DUEL_S_BODY:   'DUEL_S_BODY',
    DUEL_S_COMMIT: 'DUEL_S_COMMIT',
    DUEL_S_COMBO:  'DUEL_S_COMBO',

    CONFIRM:'CONFIRM',
    CANCEL: 'CANCEL',
    PAUSE:  'PAUSE',
    // Menu navigation. Separate from MOVE because a menu wants discrete steps
    // with a repeat delay, not an analog vector.
    NAV_UP:   'NAV_UP',
    NAV_DOWN: 'NAV_DOWN',
    NAV_LEFT: 'NAV_LEFT',
    NAV_RIGHT:'NAV_RIGHT'
  };

  /* ── DEFAULT BINDINGS ─────────────────────────────────────────────────────
     Author's controller spec (2026-09-10), with the keyboard mapped onto the
     same semantics. Keyboard is deliberately left-hand-only: this game has no
     free camera, so the mouse has no in-match job and the right hand is free.

     Super is RT/R2 + X on a pad (a natural chord there) but its own key on the
     keyboard — modifier chords are miserable to hold while steering with WASD. */
  var DEFAULTS = {
    keyboard: {
      SPRINT:  ['shift'],
      JUMP:    [' ', 'spacebar'],
      PASS:    ['q'],
      SHOOT:   ['e'],
      CROSS:   ['r'],
      SWITCH:  ['f'],
      SUPER:   ['v'],
      /* Duel keys reuse the in-match letters for the same MEANING — q passes
         in play and picks Pass/Intercept in a duel, e shoots and picks
         Shoot/Tackle. Dribble/Block takes 'x' rather than the in-match jump
         key: space is also CONFIRM, and one key must not both pick a move and
         fire it. Shift is the duel's RT — it has no other job on this screen
         (sprint is only read while the ball is in play). */
      DUEL_READ:     ['q'],
      DUEL_BODY:     ['x'],
      DUEL_COMMIT:   ['e'],
      DUEL_COMBO:    ['r'],
      DUEL_S_READ:   ['shift+q'],
      DUEL_S_BODY:   ['shift+x'],
      DUEL_S_COMMIT: ['shift+e'],
      DUEL_S_COMBO:  ['shift+r'],
      CONFIRM: ['enter', ' '],
      CANCEL:  ['backspace'],
      PAUSE:   ['escape', 'tab'],
      NAV_UP:    ['arrowup', 'w'],
      NAV_DOWN:  ['arrowdown', 's'],
      NAV_LEFT:  ['arrowleft', 'a'],
      NAV_RIGHT: ['arrowright', 'd']
    },
    // Xbox naming; ✕/○/□/△ map a/b/x/y respectively on a PlayStation pad.
    pad: {
      SPRINT: 'rb',
      JUMP:   'a',
      PASS:   'y',
      SHOOT:  'x',
      CROSS:  'b',
      SWITCH: 'lb',
      SUPER:  'rt+x',        // chord
      /* Author's duel spec (2026-09-15): pass △, dribble ✕, shoot □,
         one-two ○, and RT + the same button for the super of each. Defence
         reuses the identical four (intercept △, block ✕, tackle □), so the
         button you already press to shoot is the button you press to tackle. */
      DUEL_READ:     'y',
      DUEL_BODY:     'a',
      DUEL_COMMIT:   'x',
      DUEL_COMBO:    'b',
      DUEL_S_READ:   'rt+y',
      DUEL_S_BODY:   'rt+a',
      DUEL_S_COMMIT: 'rt+x',
      DUEL_S_COMBO:  'rt+b',
      CONFIRM:'a',           // the bottom face button — ✕ on a PlayStation pad
      CANCEL: 'b',
      PAUSE:  'start',
      NAV_UP:   'dup',
      NAV_DOWN: 'ddown',
      NAV_LEFT: 'dleft',
      NAV_RIGHT:'dright'
    },
    // Touch buttons address themselves by data-a on the on-screen pad.
    touch: {
      SPRINT: 'sprint',
      JUMP:   'jump',
      PASS:   'pass',
      SHOOT:  'shoot',
      CROSS:  'cross',
      SWITCH: 'switch',
      SUPER:  'super'
    },
    // WASD plus arrows, so either hand position works.
    move: { up: ['w', 'arrowup'], down: ['s', 'arrowdown'], left: ['a', 'arrowleft'], right: ['d', 'arrowright'] }
  };

  /* Standard Gamepad API index → name. Chrome/Firefox both report the
     "standard" mapping for common pads; anything exotic falls back to nothing
     rather than firing the wrong action. */
  var PAD_BUTTON = {
    a: 0, b: 1, x: 2, y: 3,
    lb: 4, rb: 5, lt: 6, rt: 7,
    back: 8, start: 9, l3: 10, r3: 11,
    dup: 12, ddown: 13, dleft: 14, dright: 15
  };
  var STICK_DEADZONE = 0.22;
  var TRIGGER_ON = 0.5;

  var kb = Object.create(null);        // physical key → held
  var touchHeld = Object.create(null); // touch action id → held
  var prev = Object.create(null);      // action → held last poll (edge detection)
  var cur = Object.create(null);       // action → held this poll
  var listeners = Object.create(null); // action → [cb]
  var enabled = true;

  var bindings = JSON.parse(JSON.stringify(DEFAULTS));

  /* ── keyboard ──────────────────────────────────────────────────────────── */
  function keyName(e) {
    var k = (e.key || '').toLowerCase();
    if (k === ' ' || k === 'space') return ' ';
    return k;
  }
  function isTypingTarget(t) {
    return !!(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable));
  }
  global.addEventListener('keydown', function (e) {
    if (isTypingTarget(e.target)) return;
    kb[keyName(e)] = true;
  }, true);
  global.addEventListener('keyup', function (e) {
    kb[keyName(e)] = false;
  }, true);
  // Held keys survive an alt-tab otherwise, and the player sprints forever.
  global.addEventListener('blur', function () {
    for (var k in kb) kb[k] = false;
    for (var t in touchHeld) touchHeld[t] = false;
  });

  /* ── gamepad — the backend game.js has been asking for all along ───────── */
  function pads() {
    if (!navigator.getGamepads) return [];
    var list = navigator.getGamepads();
    var out = [];
    for (var i = 0; i < list.length; i++) if (list[i] && list[i].connected) out.push(list[i]);
    return out;
  }
  var activePadIndex = null;
  function activePad() {
    var list=pads(), current=null, engaged=null;
    for(var i=0;i<list.length;i++){
      var gp=list[i];
      if(gp.index===activePadIndex)current=gp;
      if(gp.buttons.some(function(b){return b&&(b.pressed||b.value>0.5);}) ||
         Math.hypot(gp.axes[0]||0,gp.axes[1]||0)>STICK_DEADZONE) engaged=gp;
    }
    var chosen=engaged||current||list[0]||null;
    activePadIndex=chosen?chosen.index:null;
    return chosen;
  }
  function padMove(gp){
    var v=padStick(gp);if(v.x||v.y)return v;
    var x=Number(padPressed(gp,'dright'))-Number(padPressed(gp,'dleft'));
    var y=Number(padPressed(gp,'ddown'))-Number(padPressed(gp,'dup'));
    var d=Math.hypot(x,y)||1;return {x:x/d,y:y/d};
  }
  function padPressed(gp, name) {
    if (!gp) return false;
    if (name.indexOf('+') > -1) {                     // chord, e.g. "rt+x"
      var parts = name.split('+');
      for (var i = 0; i < parts.length; i++) if (!padPressed(gp, parts[i])) return false;
      return true;
    }
    var idx = PAD_BUTTON[name];
    if (idx == null) return false;
    var b = gp.buttons[idx];
    if (!b) return false;
    // Triggers are analog on most pads and report a value rather than pressed.
    if (name === 'lt' || name === 'rt') return (b.value || 0) >= TRIGGER_ON || !!b.pressed;
    return !!b.pressed || (b.value || 0) >= TRIGGER_ON;
  }
  function padStick(gp) {
    if (!gp || !gp.axes) return { x: 0, y: 0 };
    var x = gp.axes[0] || 0, y = gp.axes[1] || 0;
    var m = Math.hypot(x, y);
    if (m < STICK_DEADZONE) return { x: 0, y: 0 };
    // Rescale past the deadzone so a small push is still a small push.
    var s = (Math.min(1,m) - STICK_DEADZONE) / (1 - STICK_DEADZONE) / m;
    return { x: x * s, y: y * s };
  }

  /* ── touch — driven by the on-screen pad in game.js ────────────────────── */
  function setTouch(id, down) { touchHeld[id] = !!down; }

  /* A keyboard binding may be a chord too ("shift+q"), same syntax as the pad.
     The duel needs it: its four supers are one modifier over the same four
     keys, and the alternative was four more unrelated letters to memorise. */
  function kbHeld(spec) {
    if (spec.indexOf('+') === -1) return !!kb[spec];
    var parts = spec.split('+');
    for (var i = 0; i < parts.length; i++) if (!kb[parts[i]]) return false;
    return true;
  }

  /* ── chord suppression ──────────────────────────────────────────
     A plain button must not fire while a CHORD built on it is held, or RT+□
     fires SUPER *and* SHOOT. This used to be one hardcoded line for that one
     pair; every chord added since (the duel adds four) would have brought the
     double-fire back. Now it is derived from the bindings themselves: index
     every chord by its last part, and suppress a plain binding whose chord is
     currently satisfied. */
  var _chordIdx = null;
  function chordIndex() {
    if (_chordIdx) return _chordIdx;
    var idx = { keyboard: {}, pad: {} };
    ['keyboard', 'pad'].forEach(function (dev) {
      for (var a in bindings[dev]) {
        var specs = bindings[dev][a];
        if (typeof specs === 'string') specs = [specs];
        if (!specs || !specs.length) continue;
        for (var i = 0; i < specs.length; i++) {
          var sp = String(specs[i]);
          if (sp.indexOf('+') === -1) continue;
          var base = sp.split('+').pop();
          (idx[dev][base] || (idx[dev][base] = [])).push(sp);
        }
      }
    });
    _chordIdx = idx;
    return idx;
  }
  function suppressedByChord(dev, spec, gp) {
    if (spec.indexOf('+') > -1) return false;          // a chord suppresses nothing
    var list = chordIndex()[dev][spec];
    if (!list) return false;
    for (var i = 0; i < list.length; i++) {
      if (dev === 'pad' ? (gp && padPressed(gp, list[i])) : kbHeld(list[i])) return true;
    }
    return false;
  }

  /* ── resolve one action across all three backends ──────────────────────── */
  function actionHeld(action, gp) {
    var keys = bindings.keyboard[action], i;
    if (keys) for (i = 0; i < keys.length; i++) {
      if (kbHeld(keys[i]) && !suppressedByChord('keyboard', keys[i], gp)) return true;
    }
    var t = bindings.touch[action];
    if (t && touchHeld[t]) return true;
    var p = bindings.pad[action];
    if (p && gp && padPressed(gp, p) && !suppressedByChord('pad', p, gp)) return true;
    return false;
  }

  function moveVector(gp) {
    if (gp) {
      var s = padMove(gp);
      if (s.x || s.y) return s;
    }
    var m = bindings.move, x = 0, y = 0, i;
    for (i = 0; i < m.left.length; i++)  if (kb[m.left[i]])  { x -= 1; break; }
    for (i = 0; i < m.right.length; i++) if (kb[m.right[i]]) { x += 1; break; }
    for (i = 0; i < m.up.length; i++)    if (kb[m.up[i]])    { y -= 1; break; }
    for (i = 0; i < m.down.length; i++)  if (kb[m.down[i]])  { y += 1; break; }
    var len = Math.hypot(x, y);
    return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
  }

  var moveVec = { x: 0, y: 0 };

  /* Stick-as-d-pad. A menu wants one step per push, then a slow repeat if you
     hold — an analog vector would race through the list in a frame. */
  var NAV_FIRST_MS = 420, NAV_REPEAT_MS = 140, NAV_ENTER = 0.55, NAV_LEAVE = 0.35;
  var stickNav = { dir: null, since: 0, next: 0 };
  function stickNavPulse(gp) {
    var v = gp ? padStick(gp) : { x: 0, y: 0 };
    var dir = null;
    if (Math.abs(v.x) > Math.abs(v.y)) {
      if (v.x >= NAV_ENTER) dir = 'NAV_RIGHT'; else if (v.x <= -NAV_ENTER) dir = 'NAV_LEFT';
    } else {
      if (v.y >= NAV_ENTER) dir = 'NAV_DOWN'; else if (v.y <= -NAV_ENTER) dir = 'NAV_UP';
    }
    // hysteresis so a stick resting near the threshold does not chatter
    if (!dir && stickNav.dir && Math.hypot(v.x, v.y) > NAV_LEAVE) dir = stickNav.dir;
    var now = (global.performance && performance.now) ? performance.now() : Date.now();
    if (!dir) { stickNav.dir = null; return null; }
    if (dir !== stickNav.dir) { stickNav.dir = dir; stickNav.next = now + NAV_FIRST_MS; return dir; }
    if (now >= stickNav.next) { stickNav.next = now + NAV_REPEAT_MS; return dir; }
    return null;
  }

  /* ── poll ─────────────────────────────────────────────────────────────────
     Called once per frame. Edge detection lives here rather than in listeners
     so a pad button and a key behave identically — the Gamepad API has no
     events, only state, so everything has to be polled to stay consistent. */
  var frameToken = 0, polledToken = -1;
  var pollCount = 0, lastFired = '-', lastFiredAt = 0;
  /* A live "which buttons are down" reading is useless for diagnosis — by the
     time you screenshot it you have let go. These remember instead: press
     everything once, then read. */
  var everDown = {}, axisPeak = 0;
  function poll(force) {
    if (!enabled) return;
    /* Exactly one poll per animation frame. The module drives its own rAF so a
       pad works in menus and survives a stalled match loop, but game.js also
       calls poll() from its loop — polling twice in a frame would make
       pressed() lie on the second call.
       This used to be an 8ms time guard, which was wrong: a 144Hz display has
       ~6.9ms frames, so the guard silently dropped every other poll and could
       miss a press-and-release that fell inside a skipped window. Counting
       frames is exact at any refresh rate. */
    if (!force && frameToken === polledToken) return;
    polledToken = frameToken;
    pollCount++;
    var gp = activePad();
    if (gp) {
      for (var bi = 0; bi < gp.buttons.length; bi++) {
        var bb = gp.buttons[bi];
        if (bb && (bb.pressed || (bb.value || 0) > 0.5)) everDown[bi] = true;
      }
      for (var ai = 0; ai < gp.axes.length; ai++) {
        var av = Math.abs(gp.axes[ai] || 0);
        if (av > axisPeak) axisPeak = av;
      }
    }
    var v = moveVector(gp);
    moveVec.x = v.x; moveVec.y = v.y;

    var pulse = stickNavPulse(gp);
    for (var a in ACTIONS) {
      prev[a] = cur[a];
      cur[a] = actionHeld(a, gp);
      // a stick pulse counts as a fresh press of that nav action
      if (a === pulse) { cur[a] = true; prev[a] = false; }
      if (cur[a] && !prev[a]) {
        lastFired = a;
        lastFiredAt = (global.performance && performance.now) ? performance.now() : Date.now();
        var cbs = listeners[a];
        if (cbs) for (var i = 0; i < cbs.length; i++) {
          try { cbs[i](); } catch (err) { console.warn('[input] handler for ' + a + ' threw', err); }
        }
      }
    }
  }

  /* ── public API ───────────────────────────────────────────────────────── */
  var API = {
    ACTIONS: ACTIONS,
    bindings: bindings,

    /** Analog move vector, -1..1, magnitude doubles as a speed scalar.
        Returns the LIVE object, not a copy — it is rewritten every poll, which
        is what you want in a game loop but means you must read .x/.y straight
        away rather than stash the reference and look at it later. */
    move: function () { return moveVec; },

    /** Is the action currently held? */
    held: function (a) { return !!cur[a]; },

    /** Did the action go down since the previous poll? (edge) */
    pressed: function (a) { return !!cur[a] && !prev[a]; },

    /** Fire cb once each time the action goes down. */
    on: function (a, cb) { (listeners[a] || (listeners[a] = [])).push(cb); return API; },

    /** Drive from the game loop. */
    poll: poll,

    /** On-screen buttons call this. */
    setTouch: setTouch,

    /** Is a gamepad connected right now? */
    hasPad: function () { return pads().length > 0; },

    /** RAW pad read on the active pad, by button name or chord ("a", "rt+x").
        The documented hatch out of the semantic layer, for the one case that
        needs it: two actions legitimately share a physical button in different
        contexts (the duel gives PlayStation's ✕ a MOVE, while ✕ is CONFIRM
        everywhere else), so that handler has to know which device asked. */
    padDown: function (name) { return padPressed(activePad(), name); },

    /** Which glyph set to show in prompts. */
    scheme: function () {
      if (pads().length) {
        var id = (activePad().id || '').toLowerCase();
        return (id.indexOf('playstation') > -1 || id.indexOf('dualshock') > -1 || id.indexOf('dualsense') > -1)
          ? 'playstation' : 'xbox';
      }
      return ('ontouchstart' in global || navigator.maxTouchPoints > 0) ? 'touch' : 'keyboard';
    },

    /** Suspend everything (menus, cutscenes). */
    setEnabled: function (v) {
      enabled = !!v;
      if (!enabled) for (var a in ACTIONS) { prev[a] = cur[a] = false; }
    },

    /** Live state, for the on-screen diagnostic. If polls stops climbing the
        rAF driver has died; if it climbs but nothing fires, it is a binding or
        a handler problem, not the loop. */
    debug: function () {
      var gp = activePad();
      var down = [];
      if (gp) for (var i = 0; i < gp.buttons.length; i++) if (gp.buttons[i] && gp.buttons[i].pressed) down.push(i);
      var ever = Object.keys(everDown).map(Number).sort(function (a, b) { return a - b; });
      return {
        polls: pollCount,
        index: gp ? gp.index : null,
        id: gp ? gp.id : null,
        pad: gp ? (gp.mapping || '?') : 'none',
        everDown: ever,
        axisPeak: axisPeak.toFixed(2),
        buttonsDown: down,
        axes: gp ? [ (gp.axes[0]||0).toFixed(2), (gp.axes[1]||0).toFixed(2) ] : [],
        lastFired: lastFired,
        enabled: enabled
      };
    },

    /** Restore factory bindings. */
    reset: function () {
      var d = JSON.parse(JSON.stringify(DEFAULTS));
      for (var k in d) bindings[k] = d[k];
      _chordIdx = null;                 // bindings changed — rebuild the index
    },

    /** B.3 hook: call after writing into UEInput.bindings by hand. */
    rebound: function () { _chordIdx = null; }
  };

  /* Self-driving. The match loop's poll() call is now redundant but harmless —
     whichever runs first in a frame wins and the other is skipped. */
  (function drive() {
    /* Schedule the NEXT frame before doing any work. Previously poll() ran
       first and requestAnimationFrame came after it — so a single throw
       anywhere in poll() killed the driver permanently and the pad went dead
       for the rest of the session, while everything that reads state directly
       (hasPad, the connected chip) carried on looking healthy. */
    global.requestAnimationFrame(drive);
    frameToken++;
    try { poll(); }
    catch (err) { console.warn('[input] poll threw — driver survives', err); }
  })();

  global.addEventListener('gamepadconnected', function (e) {
    console.log('[input] pad connected:', e.gamepad && e.gamepad.id);
  });
  global.addEventListener('gamepaddisconnected', function () {
    console.log('[input] pad disconnected');
  });

  // Adapter for the existing controller assignment and two-player screens.
  // Slots preserve browser indices, including holes after disconnection.
  function slot(n){var list=navigator.getGamepads?navigator.getGamepads():[];var p=list[n-1];return p&&p.connected?p:null;}
  var legacy={south:'a',east:'b',west:'x',north:'y',r1:'rb',l1:'lb',r2:'rt',l2:'lt'};
  global.GP={connected:function(n){return !!slot(n);},info:slot,
    stick:function(n){return padMove(slot(n));},
    down:function(n,name){return padPressed(slot(n),legacy[name]||name);}};
  global.UEInput = API;
})(window);
