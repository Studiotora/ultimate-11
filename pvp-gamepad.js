/* ============================================================
   PVP GAMEPAD INPUT LAYER  ·  Stage 1  (standalone / additive)
   ------------------------------------------------------------
   - Polls up to 2 controllers every frame into window.GP
   - Brand-agnostic: reads the Standard Mapping by button INDEX,
     so Xbox / PS / generic pads all work on one path.
   - Consumes NOTHING from the engine. Self-driving rAF loop.
     Safe to load before or after game.js. Breaks nothing.

   Add in index.html (anywhere, order doesn't matter):
       <script src="pvp-gamepad.js?v=1"></script>

   Test:  open console ->  GP.debug(true)   (or set window.UE_DEV=true)
          then wiggle sticks / press buttons on both pads.
   ============================================================ */
(function () {
  'use strict';

  // Standard-mapping indices -> semantic, POSITION-based names.
  // (south=A/✕, east=B/○, west=X/□, north=Y/△ — same physical slot
  //  on Xbox and PS, so map by position and relabel glyphs in UI.)
  const BTN = {
    south: 0, east: 1, west: 2, north: 3,
    l1: 4, r1: 5, l2: 6, r2: 7,
    back: 8, start: 9, l3: 10, r3: 11,
    dup: 12, ddown: 13, dleft: 14, dright: 15
  };
  const DEAD = 0.25;     // left-stick radial deadzone
  const MAXPADS = 2;

  function newSlot() {
    return {
      connected: false, index: -1, id: '', mapping: '', nonStandard: false,
      stick: { x: 0, y: 0 },
      down: {}, prev: {}, pressed: {}, released: {}
    };
  }
  const slots = [newSlot(), newSlot()];

  function clamp(n) { return n < -1 ? -1 : n > 1 ? 1 : n; }
  function deadzone(v) {
    const m = Math.hypot(v.x, v.y);
    if (m < DEAD) return { x: 0, y: 0 };
    const s = (m - DEAD) / (1 - DEAD) / m;          // clean ramp from edge
    return { x: clamp(v.x * s), y: clamp(v.y * s) };
  }
  function resetSlot(s) { s.stick = { x: 0, y: 0 }; s.down = {}; s.prev = {}; s.pressed = {}; s.released = {}; }

  function poll() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const live = [];
    for (let i = 0; i < pads.length; i++) if (pads[i]) live.push(pads[i]);

    for (let n = 0; n < MAXPADS; n++) {
      const slot = slots[n];
      const gp = live[n] || null;
      if (!gp) {
        if (slot.connected) resetSlot(slot);
        slot.connected = false; slot.index = -1;
        continue;
      }
      slot.connected = true;
      slot.index = gp.index;
      slot.id = gp.id || '';
      slot.mapping = gp.mapping || '';
      slot.nonStandard = (gp.mapping !== 'standard');

      const ax = gp.axes || [];
      slot.stick = deadzone({ x: ax[0] || 0, y: ax[1] || 0 });

      // edge detection: pressed = down now & not last frame
      slot.prev = slot.down; slot.down = {}; slot.pressed = {}; slot.released = {};
      const b = gp.buttons || [];
      for (const name in BTN) {
        const bt = b[BTN[name]];
        const hit = !!(bt && (bt.pressed || bt.value > 0.5));
        slot.down[name] = hit;
        const was = !!slot.prev[name];
        if (hit && !was) slot.pressed[name] = true;
        if (!hit && was) slot.released[name] = true;
      }
    }
    if (_dbg) drawDebug();
  }

  // self-driving loop — independent of the engine's render loop
  let _raf = 0;
  function gpLoop() { poll(); _raf = requestAnimationFrame(gpLoop); }

  // ---- public API.  player = 1 (P1 / home)  |  2 (P2 / away) ----
  function slotOf(p) { return slots[(p === 2) ? 1 : 0]; }
  const GP = {
    BTN,
    start() { if (!_raf) gpLoop(); },
    stop() { if (_raf) { cancelAnimationFrame(_raf); _raf = 0; } },
    connected(p) { return slotOf(p).connected; },
    ready() { return slots[0].connected && slots[1].connected; },   // both pads in
    count() { return (slots[0].connected ? 1 : 0) + (slots[1].connected ? 1 : 0); },
    stick(p) { const s = slotOf(p).stick; return { x: s.x, y: s.y }; },
    down(p, name) { return !!slotOf(p).down[name]; },               // held
    pressed(p, name) { return !!slotOf(p).pressed[name]; },         // this frame only (use for menu/duel confirm)
    released(p, name) { return !!slotOf(p).released[name]; },
    info(p) { const s = slotOf(p); return { connected: s.connected, index: s.index, id: s.id, mapping: s.mapping, nonStandard: s.nonStandard }; },
    debug(on) { _dbg = (on !== false); if (_dbg) ensureDebug(); else hideDebug(); }
  };
  window.GP = GP;

  window.addEventListener('gamepadconnected', e =>
    console.log('[GP] connected slot', e.gamepad.index, '|', e.gamepad.id, '| mapping=' + e.gamepad.mapping));
  window.addEventListener('gamepaddisconnected', e =>
    console.log('[GP] disconnected slot', e.gamepad.index));

  // ---- optional on-screen debug overlay (off by default) ----
  let _dbg = false, _dbgEl = null;
  function ensureDebug() {
    if (_dbgEl) { _dbgEl.style.display = 'block'; return; }
    const el = document.createElement('div');
    el.id = 'gp-debug';
    el.style.cssText =
      'position:fixed;top:8px;right:8px;z-index:99999;font:11px/1.4 monospace;' +
      'background:rgba(0,0,0,.78);color:#9fe;padding:8px 10px;border-radius:8px;' +
      'white-space:pre;pointer-events:none;max-width:42vw;';
    document.body.appendChild(el);
    _dbgEl = el;
  }
  function hideDebug() { if (_dbgEl) _dbgEl.style.display = 'none'; }
  function rowFor(label, s) {
    if (!s.connected) return label + ': —';
    const dn = Object.keys(s.down).filter(k => s.down[k]).join(' ') || '·';
    const warn = s.nonStandard ? '  ⚠NON-STD' : '';
    return label + ': ' + s.id.slice(0, 22) + warn +
      '\n   stick ' + s.stick.x.toFixed(2) + ',' + s.stick.y.toFixed(2) +
      '\n   down  ' + dn;
  }
  function drawDebug() {
    if (!_dbgEl) return;
    _dbgEl.textContent =
      'PADS ' + GP.count() + '/2   ready=' + GP.ready() + '\n' +
      rowFor('P1', slots[0]) + '\n' + rowFor('P2', slots[1]);
  }

  GP.start();
  if (window.UE_DEV) GP.debug(true);
})();
