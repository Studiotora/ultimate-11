/* ═══════════════════════════════════════════════════════════════════════════
   ULTIMATE ELEVEN — IN-GAME DIALOG                                  2026-09-29
   ---------------------------------------------------------------------------
   Author: "replace all browser boxes". A native confirm() / alert() throws the
   game out of full screen and looks like a web page. Every one of them now
   goes through this panel instead - drawn inside the game, in the house type
   (Cinzel title, Rajdhani text), driven by pad, keyboard and mouse alike.

     UEDialog.ask(message, {title, ok, cancel, danger})  -> Promise<boolean>
     UEDialog.tell(message, {title, ok})                 -> Promise<void>
     window.ueAsk / window.ueTell                        -> the same, short names

   Pad / keyboard: it registers as a menu OWNER (owns / step / confirm / back,
   the same shape as TS2 / TM2 / PM2 / FT2), so game.js's _navStep / _navConfirm
   / _navBack hand it the d-pad, ✕ / Enter / Space and ○ / Backspace while it is
   open. Escape (PAUSE on the keyboard) also cancels. Several calls in a row are
   shown one after another, never on top of each other. A destructive question
   (danger) opens with CANCEL focused, so a stray press cannot wipe anything.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var root = null, btns = [], cur = 0, open = false, current = null;
  var queue = [];

  function css() {
    if (document.getElementById('ue-dlg-css')) return;
    var st = document.createElement('style'); st.id = 'ue-dlg-css';
    st.textContent =
      '#ue-dlg{position:fixed;inset:0;z-index:9500;display:none;align-items:center;justify-content:center;' +
        'background:rgba(2,6,16,.62);backdrop-filter:blur(2px);}' +
      '#ue-dlg.on{display:flex;}' +
      '#ue-dlg .ued-panel{width:min(540px,88vw);padding:26px 30px 22px;text-align:center;position:relative;' +
        'background:linear-gradient(180deg,rgba(var(--u-panel-rgb,10,18,38),.97),rgba(var(--u-panel-rgb,10,18,38),.92));' +
        'border:1px solid var(--u-rule,rgba(240,192,64,.45));box-shadow:0 18px 60px rgba(0,0,0,.6),inset 0 0 0 1px rgba(255,255,255,.04);' +
        'transform:translateY(6px);opacity:0;transition:transform .16s ease-out,opacity .16s ease-out;}' +
      '#ue-dlg.on .ued-panel{transform:none;opacity:1;}' +
      '#ue-dlg .ued-panel::before,#ue-dlg .ued-panel::after{content:"";position:absolute;width:14px;height:14px;border-color:var(--u-gold,#f0c040);border-style:solid;}' +
      '#ue-dlg .ued-panel::before{left:-1px;top:-1px;border-width:2px 0 0 2px;}' +
      '#ue-dlg .ued-panel::after{right:-1px;bottom:-1px;border-width:0 2px 2px 0;}' +
      '#ue-dlg .ued-title{font:700 22px/1.2 var(--u-font-display,Cinzel,serif);letter-spacing:.12em;color:var(--u-gold,#f0c040);margin-bottom:12px;}' +
      '#ue-dlg.danger .ued-title{color:#ff8a7a;}' +
      '#ue-dlg .ued-msg{font:600 18px/1.45 var(--u-font-ui,Rajdhani,sans-serif);color:var(--u-ink,#eef3ff);white-space:pre-line;margin:0 4px 22px;}' +
      '#ue-dlg .ued-row{display:flex;gap:14px;justify-content:center;}' +
      '#ue-dlg .ued-btn{min-width:150px;padding:10px 18px;cursor:pointer;font:700 16px var(--u-font-ui,Rajdhani,sans-serif);letter-spacing:.14em;' +
        'color:var(--u-ink,#eef3ff);background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.18);transition:background .1s,border-color .1s,color .1s;}' +
      '#ue-dlg .ued-btn.cur{border-color:var(--u-gold,#f0c040);background:rgba(240,192,64,.16);color:#fff;box-shadow:0 0 14px rgba(240,192,64,.25);}' +
      '#ue-dlg.danger .ued-btn.ok.cur{border-color:#ff6a5a;background:rgba(255,90,70,.2);box-shadow:0 0 14px rgba(255,90,70,.3);}';
    document.head.appendChild(st);
  }
  function build() {
    if (root) return root;
    css();
    root = document.createElement('div'); root.id = 'ue-dlg';
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true');
    root.innerHTML = '<div class="ued-panel"><div class="ued-title"></div><div class="ued-msg"></div><div class="ued-row"></div></div>';
    // a click on the dimmed backdrop is a cancel, never a confirm
    root.addEventListener('click', function (e) { if (e.target === root) finish(false); });
    document.body.appendChild(root);
    return root;
  }
  function paint() { btns.forEach(function (b, i) { b.classList.toggle('cur', i === cur); }); }
  function show(o, resolve) {
    build();
    open = true; current = { resolve: resolve, cancelable: o.cancel != null };
    root.classList.toggle('danger', !!o.danger);
    root.querySelector('.ued-title').textContent = o.title;
    root.querySelector('.ued-msg').textContent = o.msg;
    var row = root.querySelector('.ued-row'); row.innerHTML = ''; btns = [];
    if (o.cancel != null) btns.push(mk(o.cancel, 'cancel', false));
    btns.push(mk(o.ok, 'ok', true));
    btns.forEach(function (b) { row.appendChild(b); });
    cur = (o.danger && btns.length > 1) ? 0 : btns.length - 1;      // danger: CANCEL first
    paint();
    root.classList.add('on');
  }
  function mk(label, cls, val) {
    var b = document.createElement('button'); b.type = 'button';
    b.className = 'ued-btn ' + cls; b.textContent = label;
    b.setAttribute('data-sfx', '');
    b.addEventListener('click', function (e) { e.stopPropagation(); finish(val); });
    b.addEventListener('pointerenter', function () { cur = btns.indexOf(b); paint(); });
    return b;
  }
  function finish(val) {
    if (!open) return;
    var c = current; open = false; current = null;
    root.classList.remove('on');
    if (c) c.resolve(c.cancelable ? !!val : undefined);
    setTimeout(next, 0);
  }
  function next() {
    if (open || !queue.length) return;
    var it = queue.shift(); show(it.o, it.resolve);
  }
  function enqueue(o) {
    return new Promise(function (resolve) {
      queue.push({ o: o, resolve: resolve });
      if (document.body) next(); else document.addEventListener('DOMContentLoaded', next, { once: true });
    });
  }

  var UEDialog = {
    ask: function (msg, o) {
      o = o || {};
      return enqueue({ title: o.title || 'CONFIRM', msg: String(msg), ok: o.ok || 'CONFIRM',
                       cancel: o.cancel || 'CANCEL', danger: !!o.danger });
    },
    tell: function (msg, o) {
      o = o || {};
      return enqueue({ title: o.title || 'NOTICE', msg: String(msg), ok: o.ok || 'OK', cancel: null, danger: false });
    },
    isOpen: function () { return open; },
    /* menu-owner interface for game.js navigation */
    owns: function () { return open; },
    step: function (d) { if (btns.length > 1) { cur = (cur + (d > 0 ? 1 : -1) + btns.length) % btns.length; paint(); } },
    confirm: function () { if (open && btns[cur]) btns[cur].click(); return true; },
    back: function () { if (open) finish(false); }
  };
  // Escape is PAUSE on the keyboard - while the dialog is up it means "cancel"
  window.addEventListener('keydown', function (e) {
    if (!open || e.key !== 'Escape') return;
    e.preventDefault(); e.stopPropagation(); finish(false);
  }, true);

  window.UEDialog = UEDialog;
  window.ueAsk = UEDialog.ask;
  window.ueTell = UEDialog.tell;
})();
