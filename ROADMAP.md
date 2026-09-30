# ULTIMATE ELEVEN — Roadmap v1
### Post-feedback rebuild plan · target look: Octopath Traveler / HD-2D · 2026-09

---

## 0. The real diagnosis

The loudest feedback was *"don't mix anime with pixel art, pick one."*
**That advice is wrong, and following it literally would cost you months.**

Octopath Traveler, Triangle Strategy, Live A Live, Sea of Stars — all of them mix
pixel sprites with hi-res illustrated portraits and hi-res backgrounds. That is
*literally what HD-2D means*. Mixing is not the bug.

The actual bug is what commenter #4 said, and only he said it precisely:

> "Everything — art style, hair style, hair color, skin color, even the team jersey
> changes completely, not to mention gaining facial hair. Literally nothing connects
> the pixel character with the cut-scene character."

So the failure is **inconsistency**, in three specific places:

| # | Problem | Fix |
|---|---------|-----|
| 1 | The portrait and the sprite are not the same person (hair, skin, kit, beard all differ) | One character = one palette = one silhouette, enforced by a spec |
| 2 | The UI is FIFA/EA language (glossy bars, gradients, gacha chips) bolted onto a JRPG | One UI language: dark translucent panel, thin gold rule, serif caps, pixel numerals |
| 3 | The portraits are rendered at a different *fidelity* than everything else (raw AI-illustration look) | Unified post-treatment: palette clamp + slight posterize + shared frame, so they read as authored, not generated |

Fix those three and the "it doesn't match" complaint disappears **without deleting a
single piece of art.** The pixel gameplay stays, the portraits stay, they just stop
looking like they came from two different games.

Second real bug, independent of art: **the gameplay reads as slow and choiceless.**
That is a systems problem (no evasion, no tempo, one input verb), fixed in Phase C.

---

## Rules of engagement

1. **One step at a time.** No step starts until the previous one is signed off.
2. **Every new mechanic gets a lab file first** — `lab/lab-<thing>.html`, standalone,
   no match engine, no menus. We only merge into `game.js` once it feels right in the
   lab. (Same method that made the duel redesign work, and `lab/lab-gk-dive.html`.)
3. **Every step has a "done when"** — written below. If we can't demo it, it isn't done.
4. Bump `?v=` on every touched file, and hard-refresh (`Ctrl+Shift+R`) — the HTML
   document itself caches, this has bitten us twice.
5. Read `ROADMAP.md` before changing/applying files. Update it after every delivered change with intent, files/cache versions, validation and remaining checks; keep `CHANGELOG_SESSION.md` current too. This is the shared Claude/Codex handoff (author requirement, 2026-09-19).

---

## PHASE 0 — Quick wins (hours, not days)

- **0.1 · Pitch resolution** — ✅ DONE (`pitchPx` 768 → 2048 + max anisotropy).
  *Directly answers "the ground texture is the biggest problem rn."*

- **0.2 · GK save direction** — 🟡 CODE DONE, awaiting one visual sign-off in a match.
  Was: `diveDir: Math.random()<0.5?1:2` — the dive was a coin flip, and a *save*
  always played the same centre-catch cell no matter where the ball went.
  Now: every shot carries an aim (`{s:-1|0|+1, h:0..1}` in camera space), which
  drives (a) the ball's actual corner and height, (b) the keeper's pose lane —
  lateral dive mirrored for a left-hand shot, high vertical catch, or low smother,
  (c) his lateral travel, (d) a lean angle so the one dive pose covers a ground shot
  (flat stretch) and a top-corner shot (upright) with no new art. On a goal he
  commits the correct way, stops short of full extension, then drops into the beaten
  pose. Both cinematic paths (v1 + v2) fixed.
  Files: `ult11-pitch3d.js` (v57) · lab: `lab/lab-gk-dive.html`.
  **Verified:** all 12 placement × outcome cases in the lab.
  **Still to check:** one super shot in a live match (the preview pane in that
  session ran hidden, which pauses `requestAnimationFrame`, so the 3D loop never
  ticked — nothing to do with the game; it needs a real visible browser).

- **0.3 · Brand sweep** — 🟡 CRESTS DONE, names/kits outstanding.
  Full findings in `BRAND-AUDIT.md`.
  - ✅ **Crests**: `BRAND_SAFE` + `emblemSrcs()` route every emblem lookup to a
    `fake/` folder, falling back to the flag emoji (nationals) or the generated
    shield (clubs). Verified across home → team select → match → cup:
    **zero real-crest requests**. Drop art into `assets/team/fake/{key}.png` and it
    appears with no code change.
  - 🟡 **Names**: 530 total. **Italy and Germany are done** (2026-09-08) —
    10 names replaced with originals in the user's own convention (Donati, Conti,
    Aldini, Bertoldi, Corsaro, Manzini, Sereni, Steiner, Reinhardt, Falkner);
    portraits copied to the new surnames, AI profiles / stat overrides / SPECIALS
    re-keyed alongside the old ones. Italy vs Germany is now the default
    exhibition match. **Still to do:** the other 22 nationals, All Stars, and the
    18 club rosters — still mostly real footballers and Captain Tsubasa / Blue
    Lock names. Old keys and portrait files stay until that pass.
  - ❌ **Kits**: Adidas three-stripe on sprite sheets and portraits. Highest single
    risk (a design mark needs no wordmark to infringe). Folded into Phase D, since
    the sprites are being redone there anyway.

- **0.4 · Dead code** — ✅ DONE. The 2v1/1v2 apparatus was only disabled behind
  `if(false&&…)` and still shipping in full. Removed the second-defender selection,
  `dk2`/`is2v1`/`ak2`, `renderSecondDefender`, the two-move attacker flow, the
  "PICK 2 MOVES" labels, the second defender's power/cooldown contribution, and the
  `dact-sel2` styling (JS + CSS).
  `game.js` 9076 → 8972 lines, `style.css` 3929 → 3852.
  **Verified:** field duel and GK shot duel both correct, no ghost nodes, no errors.

---

## FULL-WIDTH WORLD LAYER  ✅ done 2026-09-09 (css v87 / js v122 / pitch3d v59)

`fitViewport()` letterboxes the UI stage to 16:9; on a ~2.25:1 phone that left
~21% of the screen black. The pitch now renders edge-to-edge behind the stage
while the UI keeps its 16:9 safe area.

**The trap:** `#C` looks like the pitch canvas but is the **2D ENGINE surface**.
`rsz()` derives `W`/`H` from it, and every distance in the game (`CONTACT()`,
`IR()`, player coordinates) plus the 3D world mapping (`ex2wx` / `ey2wz`, which
read `CV.width`) is built on those numbers. Resizing `#C` to the window would
silently rescale the physics. It must not move.

The visible canvas is `#C3D`, created at runtime in `ult11-pitch3d.js`. That is
the one that moved, into a new `#worldwrap` full-window layer:
- `#worldwrap` is mounted by `game.js` **before** `ult11-pitch3d.js` runs (both
  `defer`, game.js listed first), so the canvas is created straight into it.
- the debug/HUD overlay canvases insert relative to `gl`, not `CV`, so they follow.
- the five `CV.clientWidth||CV.width` sizing reads now prefer `gl` — `CV.width`
  (engine space) is deliberately untouched.
- `showSc()` toggles `.on` / `.world-live`; the layer is `display:none` otherwise,
  because `#viewport` only covers the 16:9 stage and the letterbox strips would
  otherwise show the pitch behind a menu (this leaked on the first attempt).

**Verified** at 1000x445 (2.25:1): canvas 1000x445 = full window, UI stage still
104..896, engine backing store still 1280x695. At 1280x720: no letterbox, canvas
1280x720, engine unchanged. `#dpad` sits outside the stage — it was always
`position:fixed`, unchanged here.

---

## KNOWN ISSUE — viewport units inside a fixed stage  (found 2026-09-09)

`fitViewport()` (`game.js:8029`) pins `#viewport` to a fixed **1280x720** and adapts
to the device purely through `--vp-scale` on a CSS transform. So **any `vw`/`vh`
inside the stage is a bug**: those units measure the browser window, while the box
they live in is always 1280x720. On a short landscape phone window the duel's base
em collapsed 18px -> 10px while px-floored labels stayed put, which is what made the
action menu look colourless (headers rendered at 5.6px) and threw the panel
proportions out. Desktop at exactly 1280x720 hid it, because there vw/vh happen to
evaluate to the right numbers.

Fixed in `style.css v80`: `#duel-ov.duel-aaa`, `.mhud` height/font-size, and the two
duel-row type sizes now use the constants those expressions produced at design size,
so **desktop is pixel-identical and every other device now matches it**. Verified
byte-identical at 900x401 and 1280x720.

**~83 further `vw`/`vh` declarations remain in `style.css`** across other screens and
carry the same latent bug. They were left alone rather than swept blind — each needs
checking against its design-size value. Inside this stage, **px is the correct unit**.

---

## PHASE A — Art direction lock (the cheapest big win)

This is first because *everything downstream inherits it*. Changing a font once is
minutes; changing it after we've built five new screens is a day.

- **A.1 · Style bible + design tokens** — ✅ DONE (2026-09-08).
  `tokens.css` (loaded before style.css) + `STYLE.md`. Consolidated 178 distinct
  hex colours and 480 distinct `rgba()` values across 3 competing variable
  systems into one token set: surfaces, ink, a single gold accent, team colours,
  state, one hairline language, shadows, geometry, a relative type scale, motion.
  Gold/home/away are channel triplets so rules, borders and glows re-hue from
  one line (`color-mix()` avoided — it breaks html2canvas here). The global
  palette and the duel `--ff-*` block were moved out of style.css, so colour is
  declared in exactly one file.
  **A.1 was a refactor with zero visual change by design** — all 17 legacy
  variables verified resolving to their previous values, zero mismatches;
  divergences are marked `A.2:` rather than quietly applied.
  **Reskin proven:** injecting only `--u-gold-rgb` re-tinted `--gold`, `--gold-b`,
  `--bdr`, `--u-rule` and `--u-glow-gold` together.
  **Audit finding that reframes A.2:** Bebas Neue (139 declarations) + Orbitron
  (116) still outnumber Cinzel (12) + Rajdhani (29) — **255 of 311 font
  declarations are still the FIFA-ish faces.** Retiring those two is the single
  highest-value change left in Phase A.
  **Known gap:** `.ue-home` keeps a component-scoped palette, so the home menu
  is not yet reskinnable from tokens.css.

- **A.2 · Retrofit all screens to tokens** — 🟡 IN PROGRESS.
  Two jobs, not one: (a) sweep the inline `rgba()` literals onto tokens,
  (b) **the font migration** — retiring Bebas Neue and Orbitron in favour of
  Cinzel (display) and Rajdhani (UI). (b) is the bigger lever: it is why the UI
  still reads FIFA.

  **(b) ✅ DONE 2026-09-09 (css v88).** Bebas Neue and Orbitron: 0 primary
  declarations left in either file (Orbitron survives only as the `--u-font-num`
  fallback). Split by measured size — >=16px to Cinzel, the rest to Rajdhani —
  144 display / 199 UI. Also caught Anton, Barlow Condensed and Permanent Marker
  hiding in the home menu behind the `font:` shorthand. Font request trimmed from
  7 families to 4. Verified: no overflowing text on any of the nine screens.

  **(a) still open:** 915 inline `rgba()` literals in style.css. Cosmetic debt,
  not blocking anything.
  - ✅ **In-match HUD** (2026-09-08): scoreboard, on-pitch labels, commentary
    strip, d-pad, shot button. Zero Orbitron/Bebas left in the HUD; colours on
    tokens; score glows derive from the team triplets. Deliberate changes:
    scoreboard hairline cream→gold, shot button orange→gold, team names
    cream instead of pure white. **Superseded 2026-09-09 by the palette change:**
    hairlines are now accent blue and the cream ink went neutral white.
  - ✅ **Duel action buttons** (2026-09-08): 17 `assets/ui/btn-*.png` replaced
    with inline SVG drawn in `currentColor`, so selection retints the glyph
    itself (attack→home, defence→away, special→gold, super→special) instead
    of only stacking a drop-shadow on a fixed bitmap. 0 image requests left.
  - ✅ **Duel action menu → RPG command list** (2026-09-08): vertical rows
    `[icon] LABEL … cost`, NORMAL and SPECIAL as two side-by-side columns.
    Normal = blue, Special = purple (`--u-magic`). Labels restored to real DOM
    (they had been baked into the old PNGs). Selected row: deep fill + bright
    edge. **Note:** the original "gold is UI chrome" rule was reversed on
    2026-09-09 — blue is the chrome, gold is ratings/trim. See STYLE.md.
  - ⏳ Remaining screens: main menu (also needs `.ue-home`'s scoped palette
    folded in), team select, duel, GK, pause, results, career/cup/story.
  **Done when:** side-by-side screenshots of all 7 screens look like one product.

- **A.3 · Portrait unification pass** — ✅ DONE 2026-09-09 (js v125).

  The original plan (palette-clamp + posterize + rim light to reconcile
  illustrations against pixel sprites) became **obsolete**: the paired-sheet
  pipeline solved unification at the source. There is nothing to reconcile when
  the portrait and the duel hero are the same artwork.

  What actually shipped, per the author's call:
  - **Old full-body illustrations retired.** `assets/players/{lastname}.png` is
    no longer requested anywhere at runtime. Verified in a live match: 20 front-
    sheet loads, 0 old player portraits. Kept on purpose: `gk.png` (GK art stays
    until it is redone) and `assets/players/{teamkey}.png` (the captain card on
    team select). **The files are still on disk** — nothing was deleted.
  - **In-field bust portrait** (`.bust-img`, the bottom-corner chips) now shows a
    head crop taken from the player's own front sheet.
  - **Front only, mirrored — never the back sheet.** A tiny chip showing the back
    of someone's head is useless, so both sides use the face and it is flipped
    with `dirFor(side)` so it looks the way that team is attacking. Flips at half
    time with the sides. Verified in both halves.
  - **Head anchoring.** The old crop was centred (`sx=(iw-cropSize)/2`), which was
    fine for the old portraits but wrong for the new sheets: every one is drawn in
    the same right-leaning duel stance, so the head sits **8-19% right of centre**
    (measured across all seven). A centred crop clipped the face on every player.
    `headBox()` now finds it — topmost opaque row, then the horizontal centroid of
    the band below it — scanned on a ~128px aspect-correct proxy so it costs a few
    thousand reads per player, once, cached.
  - Same crop feeds the duel card mini portrait and the squad/formation cards, so
    every surface shows one consistent face.

  **Still old art:** the `_legacyPortrait()` branch inside `fCard` is dead code
  behind `DUEL_SPRITE_FALLBACK=false` and still names the old paths. Harmless, but
  it is where to look if those files are ever deleted from the repo.

---

- **A.4 · DUEL GLASS — ✅ DONE 2026-09-19** (round 2: tokens v8 / style v95 / js v175). From the author's
  mockup: during a duel the info boxes, special-skill boxes and action rows are
  soft, team-tinted glass with the match showing through, and every word has a
  black outline for readability.
  - **The rim had to be rebuilt.** It was never a border: `.info` was painted
    entirely in the team gradient under an opaque `.info-in` inset 1.7px. A
    see-through fill would have flooded the panel solid blue/red. The gradient
    now lives on `.info::before`, clipped to a RING (outer notch polygon + the
    same shape inset 1.7px, one `evenodd` path) - the rim sits where it was.
  - **Round 2 (author: "colours too strong - player grey-blue, CPU grey-red").**
    Round 1 washed the bright team colour over the glass, AND the panel's 7px
    team-coloured `drop-shadow` glow - harmless behind a solid box - now showed
    THROUGH the glass and flooded it. Fix: per-side glass colour `--tg`, set in
    `fCard` beside `--tc` (tokens `--u-glass-home-rgb` 18,38,78 /
    `--u-glass-away-rgb` 64,22,50, at .58 -> .72), no team wash, and the glow
    dropped (a dark drop-shadow only). The colours were FITTED to the mockup:
    measured scene-outside vs panel-inside with Pillow, solved pitch -> shadow ->
    glass; over green pitch the result lands within 1-5 (of 765) of the mockup
    on both sides. The CPU glass carries some blue on purpose - red over green
    grass goes olive. The blue/red rim is untouched, as asked. Empty bar
    tracks darkened so they do not vanish over a bright pitch. The SELECTED row
    keeps its solid fill (`:not(.dact-sel)`) so the choice still jumps out.
  - **Outline = new token `--u-text-outline`**: eight 1px shadows + a soft drop,
    NOT `-webkit-text-stroke` - a stroke eats into glyphs and closes the Bold
    Pixel counters (the faux-bold "solid squares" failure).
  - No backdrop blur: `.info` has a filter, which makes it the backdrop root (a
    blur inside cannot see the pitch), and it is the dearest thing on a phone.
  - **Verified** in a live duel: every background rule wins the cascade (rim
    clip is `evenodd` both sides, glass/tint/rows/tracks as specified), and all
    15 kinds of duel text resolve to the 9-layer outline incl. both Bold Pixel
    numerals; full-frame screenshot matches the mockup.

## PHASE B — Input system (pure code, no art dependency)

Self-contained, testable in a lab, and it *unblocks Phase C* — jump and dodge cannot
exist until there is an input layer to bind them to.

- **B.1 · Input abstraction layer** — 🟡 MODULE BUILT, MIGRATION PENDING.

  `ult11-input.js` (2026-09-10) exposes `UEInput` with 9 semantic actions, three
  backends (keyboard / Gamepad API / touch), edge detection, and bindings as
  DATA so a control change never touches match code.

  **Found on the way in:** game.js already had half of this, built for PvP —
  `INPUT_BIND`, `_bindStick`, `_bindDown`, slots named south/east/west/north/r1.
  It called a `GP` module for pad reads that **was never written**, so
  `typeof GP` was always undefined, `_padOK()` always returned false, and every
  pad binding silently fell back to the keyboard. This module is the missing
  backend, generalised past PvP.

  **Bindings** (author's spec, 2026-09-10) — one button, two meanings by phase:

  | Action | Attacking | Defending | Pad | Key |
  |---|---|---|---|---|
  | JUMP   | jump        | block         | A / ✕   | Space |
  | PASS   | short pass  | contain       | Y / △   | Q |
  | SHOOT  | shoot       | tackle        | X / □   | E |
  | CROSS  | cross       | slide tackle  | B / ○   | R |
  | SWITCH | —           | switch player | LB / L1 | F |
  | SPRINT | sprint      | sprint        | RB / R1 | Shift |
  | SUPER  | special     | —             | RT+X    | V |

  Keyboard is left-hand-only: there is no free camera in this game, so the mouse
  has no in-match job. Super is a chord on the pad but its own key on the
  keyboard — modifier chords fight WASD.

  **Verified:** all 8 bound actions resolve, edge detection fires once per press,
  diagonals normalise to magnitude 1, touch backend works, blur clears held keys.
  **The Gamepad backend is written but UNTESTED** — no pad available here.

  **✅ MIGRATION DONE (js v129).** Match code no longer reads a key code.
  - `startAnim()`'s loop polls once per frame and syncs `G_inputVec` / `G_sprint`
    from `UEInput`. One poll drives all three backends — the Gamepad API is
    state-only, so polling is the only way a key and a pad button can behave
    identically.
  - The old `G_keys` store and `_recomputeInputFromKeys()` are **deleted**, along
    with 30 lines of o/p/k/l branches.
  - Actions live in ONE place each (`actShoot` / `actCross` / `actPass` /
    `actSwitch` / `actSuper` / `actJump` / `actPause` / `actConfirm`). Keyboard,
    pad and the on-screen buttons all call the same function, so a control cannot
    grow two behaviours that drift apart.
  - Three `keydown` listeners remain in game.js and all three are correct: two
    belong to PvP (its own key-state store and the binding-setup overlay, which
    must read raw keys), and one does `preventDefault` only so Tab does not move
    focus and Space does not scroll.

  **Verified in a live match:** WASD steers (`inputVec.x` 1 → 0 on release),
  Shift sprints, duels still open and resolve on both attack and defence, no JS
  errors (all 404s are asset probes for players without sheets).

  `G_sprint` is deliberately zeroed while a duel is up — `_updateDpad(false)`
  does it, and you should not be able to sprint mid-duel. It cost a while to
  confirm that was correct rather than a clobber.

  **Gamepad VERIFIED 2026-09-10.** Author's pad reports
  `Xbox 360 Controller (XInput STANDARD GAMEPAD)`, `mapping:"standard"`, 17
  buttons, 4 axes — every index lines up with the bindings, no remap needed
  (`lab/lab-pad.html` is the diagnostic that established this). The chain was
  then proven end-to-end against a synthetic pad of the same shape: stick →
  `inputVec.x=1`, RB → sprint, X → `manualShot` once → `pass_anim`.

  **Why it seemed dead:** nothing on a MENU listened to the pad. Every action
  handler needs a live match, so pressing anything on the home screen was always
  going to do nothing. That was a missing feature, not a broken backend.

  **Not migrated on purpose:** the touch layout still has four face buttons for
  seven actions, so those three buttons keep today's meanings rather than the new
  binding table. Redesigning that is B.4.

- **B.1b · Touch Super button** — ✅ DONE (js v130). Purple, centre of the
  diamond, shown only while the carrier actually has a super available — the
  button existing IS the prompt. The four face buttons were also relabelled to
  match the new bindings and now follow possession
  (PASS/SHOOT/CROSS/JUMP → CONTAIN/TACKLE/SLIDE/BLOCK), with L1 SWITCH and
  R1 SPRINT as shoulder pills. Moving the busts to the screen edge in v127 had
  put them 99px into the d-pad; it now clears them via `--vp-scale`.

- **B.1e · CONTROLLER PARKED 2026-09-10 — not a game bug.**
  Final reading on the author's machine:
  `PAD standard · polls 2712 · everSeen [] · axisPeak 0.00 · last - · items 0`

  The pad enumerates (id, standard mapping, 17 buttons, 4 axes) and the game
  polled it 2712 times, but **not one button or axis ever reported a value**.
  The browser receives nothing from the device, so no amount of game code can
  reach it. The gamepad backend itself is proven working — verified end to end
  against a synthetic standard pad (stick → movement, RB → sprint, X → shot,
  d-pad → menu navigation, A → activate).

  Likely causes, in order: something holding the pad exclusively (Steam Input is
  the classic — it grabs XInput pads and hides them from other apps), or a
  third-party Bluetooth pad reporting a generic "Xbox 360 Controller" XInput
  name while not delivering HID input. Check with `joy.cpl` — if the buttons do
  not light up in Windows' own dialog, the browser was never going to see them.

  **Nothing to change when it is revisited.** The moment the OS delivers input,
  it works. The `everSeen`/`axisPeak` readout in the pad chip is the test.

- **B.1d · Two input-layer bugs found by building a diagnostic** (input v6 / js v133).
  Symptom: "PAD CONNECTED shows but nothing works". Both were mine.
  1. **The poll driver died permanently on a single throw.** `drive()` called
     `poll()` and only then `requestAnimationFrame(drive)` — so one exception
     anywhere in poll ended input for the whole session. Everything that reads
     state directly (`hasPad()`, the connected chip) kept looking healthy, which
     is why it presented as "connected but dead". The next frame is now
     scheduled BEFORE any work, and poll is wrapped. The same guard went on
     game.js's loop call so a poll throw cannot kill the frame loop either.
  2. **The 8ms poll guard was wrong on high-refresh displays.** A 144Hz monitor
     has ~6.94ms frames, so the guard silently skipped every other poll — and a
     press-and-release landing inside a skipped window was never seen at all.
     Replaced with a frame counter: exactly one poll per rAF, exact at any
     refresh rate.

  The chip is now a live readout — `polls / buttons down / last action fired /
  focus items / index` — so this class of failure reports itself instead of
  needing a guess. **Verified by sabotage:** forcing `getGamepads()` to throw no
  longer stops the driver (polls kept climbing 14 → 22 → 33) and navigation
  resumed the moment it recovered.

- **B.1c · Pad menu navigation** — ✅ DONE (input v3 / js v131 / css v91).
  A pad has to work before kick-off. Rather than hand-authoring a focus map per
  screen, `_navScan()` sweeps the active `.screen` for anything clickable, orders
  it row-major and walks it — **new screens get pad support for free**.
  - d-pad and left stick both navigate; the stick is converted to discrete
    pulses with a 420ms first delay then 140ms repeat, plus hysteresis, or an
    analog vector would race the whole list in one frame.
  - `CONFIRM` (A / ✕ / Enter) activates the focused item, and falls through to
    the duel confirm when no menu is up. `CANCEL` (B / ○) hits the screen's back
    button.
  - Disabled on `s-match`, where the same stick steers a player.
  - `.pad-focus` cursor is deliberately loud (accent ring + pulse) — subtle
    highlights are useless on a TV across the room.
  - A "PAD CONNECTED" chip shows on menus, because a connected-but-invisible pad
    feels broken.

  **Verified** with a synthetic standard pad: 11 candidates found on the home
  screen, d-pad down walks 0→1→2, A activates FRIENDLY MATCH and lands on team
  select.
- **B.1d · DUEL CONTROLLER INPUT — ✅ DONE 2026-09-15** (input v9 / js v164).
  Author: *"the controller is now working but not in duel — i need pass to be
  triangle, dribble to be x, shoot to be square and 1-2 to be circle, for the
  super same concept but it needs RT as extra, same as in game super shot is
  RT+square; in defense same concept, same 4 + 4 buttons."*

  **Why it was dead.** `bldA`/`bldD` build the duel rows with an `onclick` and
  nothing else, so in single player the duel was mouse-only — the one screen
  that exists purely to make you choose. The pad *was* being read: the four face
  buttons resolved to the in-match SHOOT/PASS/CROSS/JUMP actions, and every one
  of those is gated on `phase==='moving'`, so each press ran and did nothing.
  `_navScreenEl()` returns null on `s-match`, so d-pad menu nav was off too, and
  `CONFIRM` worked only *after* a pick existed — which nothing could make.
  (PvP already had pad picks in `pvpDuelInput`, on an older mapping where pass
  was □; that path is untouched and still runs for PvP.)

  **THE BUTTON RULE.** One physical button keeps one MEANING on both sides of
  the ball, mirroring the in-match action map, so the duel teaches nothing new:

  | button | meaning | attacking | defending | keeper |
  |---|---|---|---|---|
  | △ | read   | Pass    | Intercept | — |
  | ✕ | body   | Dribble | Block     | Punch |
  | □ | commit | Shoot   | Tackle    | Save |
  | ○ | combo  | One-two | —         | — |

  and **RT + that button is its super** — RT+△ Threading Pass, RT+✕ Falcon
  Dribble, RT+□ the special shot / Iron Tackle / SUPER SAVE, RT+○ Lightning 1-2
  — exactly like the in-match super shot on RT+□. Defence has no ○ because it
  has only three moves; the slot is left empty rather than given a fourth.

  **Where it lives.** The bindings are DATA in `ult11-input.js` beside every
  other binding, as eight new semantic actions (`DUEL_READ/BODY/COMMIT/COMBO`
  and `DUEL_S_*`) — named for the meaning, not the move, since one action serves
  two or three moves. Keyboard follows the same meanings on the in-match letters:
  **q** read, **x** body, **e** commit, **r** combo, **shift+** them for the
  supers. Body took `x` rather than the in-match jump key because space is also
  CONFIRM, and one key must not both pick a move and fire it.

  **It does not re-implement selection.** `duelPadInput()` maps the action to a
  row via a new `data-act` on each button and **clicks it**, so cost gating, the
  `dact-sel` styling, the pass-target sub-mode, `chkRdy` and the
  second-press-confirms rule all keep running down the one path the mouse
  already used. An unaffordable row has no `onclick`, so the press is inert
  exactly as a click on it would be — there is no second affordability check to
  fall out of step with `bldA`'s.

  **Three collisions that had to be solved, not ignored:**
  1. `RT+□` would fire SUPER *and* SHOOT. The old fix was one hardcoded line
     for that one pair; the duel adds four more chords, so suppression is now
     derived from the bindings — index every chord by its last part, suppress a
     plain binding whose chord is satisfied. Keyboard chords were added for the
     same reason and go through the same test.
  2. `✕` is CONFIRM everywhere else and a MOVE in a duel — the same button
     firing two actions in one frame. Inside a duel the move wins; you confirm
     by pressing the highlighted row's button **again** (or Enter / Start). The
     CONFIRM handler checks the new `UEInput.padDown('a')` raw hatch to tell a
     pad ✕ from an Enter, since Enter never has ✕ down.
  3. `○` is CANCEL *and* one-two. While aiming a one-two, lock is tested before
     cancel so ○ commits; aiming anything else, ○ is still the way back.

  **Pass and one-two need a target**, and picking one was a click on the pitch —
  so choosing Pass with a pad used to strand you in a mode the pad could not
  leave. Left/right (stick or d-pad) now walks the team-mates in pitch order
  with a gold ring + name over the chosen man, the move's own button or CONFIRM
  locks it, CANCEL backs out. The ring is parented to `document.body` in CLIENT
  coordinates: `#viewport` carries a CSS transform, and `position:fixed` inside
  a transformed ancestor resolves against that ancestor, not the window.
  (This is B.4's amended "pass-target selection stays a click" — still true for
  touch; the pad now has a way through it too.)

  **GLYPHS ARE A SEPARATE QUESTION FROM BINDINGS.** The author's own pad reports
  itself as `Xbox 360 Controller (XInput STANDARD GAMEPAD)` (two of them, index
  0 and 1), so `UEInput.scheme()` says xbox and the menu would print Y/A/X/B at
  someone looking down at △✕□○. The binding is identical either way — △ and Y
  are the same index — so only the label is in doubt, and only the label gets a
  preference: `padGlyphs('playstation'|'xbox'|'keyboard'|'auto')`, persisted,
  **defaulting to `playstation`** because that is the vocabulary this mapping was
  specified in. It rebuilds an open duel menu so the change shows at once.
  The badge itself is injected from JS like the selection pulse, not added to
  `style.css`: a stale cached stylesheet would hide the one thing that tells a
  pad player which button to press.

  **Verified.** 45/45 assertions on the binding table in a node harness
  (`lab/test-input.js`, run with `node lab/test-input.js`, browser stubbed, one poll per frame so `pressed()`
  edges are exact) — every face button to its duel action, every RT chord to its
  super *with the plain action suppressed*, RT+□ still driving the in-match
  SUPER while killing SHOOT, plain □ still driving both SHOOT and DUEL_COMMIT,
  keyboard shift-chords, and the index surviving `reset()`.
  Then in a live Italy-vs-Germany match: attacking △→pass ✕→dribble ○→one-two
  and all three RT supers; defending △→intercept ✕→block □→tackle and all three
  RT supers; keeper □→save ✕→punch RT+□→supersave; shot duel □→shoot; the same
  button twice = select then `confirmDuel()` (fired exactly once); pass aim
  defaulting to `bestTeammateFor`, cycling right/left through all 10 team-mates
  in pitch order with the ring tracking real screen coordinates, and locking to
  `G.D.pk` with the overlay back and `#dcfm.rdy` true. Glyph preference checked
  through playstation → xbox → auto → playstation with the binding still reading
  `tackle` on □ throughout, and the setting persisted.

  **Testing note that cost a run:** the open-duel watchdog closes the overlay
  after 12s, so a duel probed across two separate tool calls is already gone and
  every pick reads `null`. Force `G.paused=true` and keep `G._duelT` warm, or do
  the whole probe in one call.

  **Not done here:** two pads both report as index 0/1 Xbox 360 controllers on
  this machine — PvP addresses pads by slot 1/2, so a phantom second pad may
  make PvP think P2 is present. Not touched, flagged for whenever PvP is next
  looked at.

- **B.1e · FIRST OUTSIDE PLAYTEST — ✅ FIXED 2026-09-19** (js v170 / pitch3d v99).
  A tester on PC: *"the buttons sometimes don't respond. A counter keeps running
  in the background. When I get the option to 'select player', I click on
  players but nothing gets selected, then suddenly the players start running on
  their own taking the ball to the goal post."* Felt like auto-play. Also: picked
  the 3D stadium and never saw it.

  **One root cause drove most of it, and it was invisible on the author's
  machine.** `P3D.playerScreenPos` — used by the pass-target click, tap-to-pass
  and the pad aim ring — projected players onto `CV.width x CV.height` (the
  1280x695 letterboxed stage). But since the full-width world layer (09-09) the
  camera renders into `#C3D` in `#worldwrap`, the FULL WINDOW, with that
  canvas's aspect. The two only agree when the window is exactly the stage's
  shape. `lab/test-hit.js` clicks every point exactly where the player is drawn
  and applies game.js's own mapping and tolerance:

  | window | old: points outside tolerance | old: worst miss | fixed |
  |---|---|---|---|
  | 1280x720, exact 16:9 | **0 / 143** | 22.5 px | 0.0000 px |
  | 1920x969, 1080p browser window | **64 / 143** | 70 px | 0.0000 px |
  | 2560x1080, ultrawide | **110 / 143** | 193 px | 0.0000 px |

  That first row is why this never showed up in testing here. Now projected
  into `gl`'s real client rect and expressed in CV space, so every caller is
  correct unchanged; identical to the old result when the rects coincide. (The
  correctly-written `P3D.pickPlayerAt` already existed — and nothing called it.)

  **The chain the tester saw, step by step:**
  1. Pick Pass → `G.D.ak='pass'` at once; the target `G.D.pk` only on a click
     that hits — and the clicks missed.
  2. The 30s countdown ran on, **hidden** (pass mode hides the duel overlay).
  3. At 0 its fallback fills a target only `if(!G.D.ak)` — false — so the duel
     resolved a **pass to nobody**. `launchPass` returned early and nothing moved
     the phase on: **frozen in `duel_result`, every button dead** ("buttons don't
     respond") until a watchdog force-resumed, while the AI's off-ball movement
     carried on ("running on their own"). There is no autopilot — it was this.

  **Fixed at each link, not just the first:** `resDuel` fills a missing
  pass/one-two target (the one place every resolution path passes through);
  `afPass` falls back to the best team-mate and never hangs; the pass banner
  carries the countdown (`PASS MODE — CLICK A PLAYER · 27s`); the pad aim ring
  is cleared on resolve/close. And an **unaffordable row is no longer a dead
  button** — no onclick on attack, `disabled` on defence, no feedback at all; it
  now says *"Not enough stamina for Dribble — needs 80 SP, you have 10."*

  **3D stadium:** the fallback was already correct — a failed `.glb` keeps the
  classic bowl — but the only trace was a `console.warn`. It is now an on-screen
  banner + commentary line. The likely cause is the game opened by
  double-clicking `index.html` (`file://`), where browsers block the fetch of
  the 12MB `.glb`; the game now shows a red "opened as a file — use a local
  server" bar in that case. **Unconfirmed:** how the tester actually launched it.

  **Verified** in a live match at 1920x969: the exact reported state (Pass
  chosen, no target, countdown expiring) resolves to a real target and is back
  in play 1.4s later, not frozen; `afPass(null)` launches; unaffordable rows
  answer on both sides; `lab/test-hit.js` 3/3; `lab/test-input.js` still 45/45.
  **Not verified on screen:** the renderer does not run in a hidden Browser pane,
  so the corrected click was proven on the math against measured rects, not by
  clicking a rendered player. First real look is the next playtest.

  **GitHub (corrected same day):** GitHub IS current — the author publishes by web upload ("Add files via upload"), last on 2026-09-16 at js v169 / pitch3d v98. The LOCAL clone here just never fetched those, so its own history stopped in April; an earlier note said the repo was five months behind, which was wrong. Always `git fetch` before judging the remote. The real finding: two stadium files were never uploaded — `assets/stadium/GLTFLoader-r128.js` and `assets/stadium/classic-upgraded.glb`. Without the loader the stadium module rejects with "GLTFLoader is unavailable" and keeps the classic bowl, which is exactly the tester's report if they played the GitHub copy. Every other script/stylesheet index.html loads is on GitHub.

- **B.2 · Kill the mouse** — `GO` and on-screen `PAUSE` buttons removed; `Enter` =
  confirm, `Tab` = pause, duel choices bound to keys/face buttons with visible
  prompts — **the duel half is ✅ DONE, see B.1d.**
- **B.3 · Key binding settings screen** — remappable, persisted to `localStorage`,
  shows the correct glyph per detected device (WASD / Xbox / PlayStation / touch).
- **B.4 · Android touch layer** — virtual stick + 4 action buttons, safe-area aware.
  **Done when:** a full match is playable start-to-finish with keyboard only, with a
  controller only, and on a phone.
  **Amended 2026-09-10:** the original "zero mouse clicks" is dropped — the author
  is happy for pass-target selection to stay a click/tap, since on a phone that is
  a finger anyway. Instead, the camera must pull back while choosing a pass target
  so every teammate is on screen (see C.3).

---

## PHASE C — Gameplay feel (the thing they actually criticised)

- **C.0 · Animation rows — 🟡 ART IN, HOOKS PENDING** (pitch3d v61, 2026-09-10).
  New art packs **two 6-frame animations per row** across the 12 columns, so the
  super-shot cine stays on the same sheet instead of needing a second one:

  | row | cols 0-5 | cols 6-11 |
  |---|---|---|
  | 6 | standing tackle (`shoulder`) | **SUPER SHOT** |
  | 7 | slide tackle (`tackle`) | **JUMP** |

  `L12x8` ranges are `[startColumn, frameCount]`, so this needed no new rows and
  no sheet resize — 3492x3264 is unchanged. Frame counts went **3 → 6**, which is
  what finally gives the tackle a wind-up instead of one contact pose.

  Durations retimed for six frames (~10fps): tackle 430→**620ms**, shoulder
  480→**560ms**, jump **700ms**, super **950ms**. At the old 430ms six frames
  would run ~14fps and stay a blur.

  **Verified:** every cell resolves and every frame advances —
  tackle f0→r7c0 … f5→r7c5, jump f0→r7c6 … f5→r7c11,
  super f0→r6c6 … f5→r6c11, shoulder f0→r6c0 … f5→r6c5.

  **Still to hook up:**
  - `away.png` — ✅ re-baked by the author 2026-09-10 (3492x3264, 12x8, same
    291x408 cells as `home.png`). Placeholder art, not the final Germany kit,
    but the row layout is correct so rows 6/7 now play the right frames.
  - **JUMP — ✅ BUILT (js v135 / pitch3d v62).** See C.2a below.
  - **SUPER cine camera — ✅ DONE (pitch3d v63).** See C.2b below.
  - **SUPER row on screen — ✅ DONE (js v136 / pitch3d v65).** See C.2c below.


- **C.2a · JUMP + HURDLE — ✅ DONE 2026-09-10** (js v135 / pitch3d v62).

  `JUMP={dur:700, invulnFrom:0.20, invulnTo:0.68, landLock:220}`.
  Height is `sin(PI*t)`, so the player decelerates into the peak and accelerates
  out of it — that is what reads as weight rather than a linear bob.

  **The invulnerable window is deliberately narrower than the airborne time**
  (284ms inside a 700ms jump). Leaving the ground early or landing late still
  gets you tackled, so the timing has to be genuine rather than "press jump
  somewhere near the tackle".

  Renderer: `P3D.setJump(id, 0..1)` lifts the billboard by
  `t * spriteHeight * jumpPeak(0.55)`, while the **shadow stays on the grass and
  shrinks** (`scale *= 1-t*0.45`, opacity `*= 1-t*0.55`). In a billboard engine
  the shadow does more to sell height than the lift does.

  Hurdle rule lives in `stepLunge`'s contact test: an airborne carrier makes the
  challenge pass underneath, treated exactly like a whiff — **no duel**, and the
  tackler still pays the full recovery for committing.

  **Verified:** arc sampled 0→peak 0.98 at ~350ms→0 at 685ms, invulnerable only
  192–476ms. With `opDuel` instrumented: airborne at contact → **0 calls, phase
  stays `moving`**; no jump → **1 call, duel opens**. A mistimed jump could not
  be isolated in the harness because the live tick drifts the players apart
  during the wait, but it is the same single `isAirborne()` branch on the same
  contact test — if airborne hurdles and grounded duels, mistimed lands in the
  second by construction.

  **Not done here:** the AI never jumps (human only), and there is no aerial
  contest yet for crosses — that is C.4.

- **C.2b · SUPER SHOT CAMERA - DONE 2026-09-10** (pitch3d v63).

  The hold camera used to sit BEHIND the shooter looking down the
  shooter-to-goal line, so the wind-up played to the back of his head. It is now
  **frontal**: the camera sits between the shooter and the goal looking back at
  him, so you see the face and the plant while he loads the shot, with the goal
  behind him.

  `holdFront:true` in `P3D.cine` flips it; set false for the old
  over-the-shoulder framing. Only the sign of the dolly vector and the lookAt
  target change, so both paths share one code path.

  **The swing is the important half.** `fly()` now seeds `cine._cam` from the
  live camera position at the moment of the strike. Without that the chase
  branch snapped to its own position on its first frame and the frontal-to-
  behind move read as a hard cut; seeded, the existing `chaseLag` lerp carries
  the camera round the shooter as one continuous move.

  **Verified** by driving `superCine2.start()` directly: the hold frame shows
  the shooter front-on with the goal and hoardings behind him.

  **Follow-up:** the hold sprite was swapped to the new super row in C.2c.

- **C.2c · SUPER SHOT SPRITE - DONE 2026-09-10** (js v136 / pitch3d v65).

  The frontal camera in C.2b was pointing at the wrong sprite: a single-frame
  `striker_windup.png` drawn from BEHIND. Now the shooter plays his own team
  sheet's super row — **row 6, cols 6-11**: frames 0-2 charge, 3 contact,
  4-5 follow-through.

  **Split across the two shot phases.** The hold owns the charge (0-2), `fly()`
  owns the strike (3-5). The kick is therefore the continuation of the charge
  rather than a cut to the old back-view shoot row.

  **The charge is paced against the real hold.** `superShotCine()` now declares
  `SSC_HOLD` before `start()` and passes it as `holdMs`, so the 3D side spreads
  three frames across the hold it is actually going to get instead of snapping
  to full charge at ~0.4s and sitting there. One source of truth for the
  duration; change 2250 and the animation re-paces itself.

  **The mirror could not be read from world x.** Sheet art faces screen-right
  and `syncPlayers` picks the mirror from world x, but under the frontal camera
  the shot direction points straight AT the lens — the same world heading lands
  on either side of screen depending on which side `holdSide` put the camera.
  `cineShooterFlip()` projects the shooter's forward vector and reads the sign
  of its SCREEN motion, exactly as `syncPlayers` does for live players, sticky
  when the vector is near-parallel to the view. `start()` also seeds the hold
  camera, because `cineStep2` runs BEFORE `cineCamera2` and would otherwise
  test frame 1 against the previous (chase) camera and pop.

  **The strike frames lock the mirror** to whatever the charge ended on. Tested
  live it flipped mid-kick — the chase camera swings from in front of him to
  behind him during exactly those three frames, and the flip landed on the
  contact frame. He is off-frame long before a frozen mirror goes wrong.

  A per-team `{key}_windup.png` still wins if one exists; the shared
  `striker_windup.png` no longer does. `_chain()` reports which URL won so
  `cineLoadFor` can tell an override from the default.

  **Verified** in a live match (Italy vs Germany, `home.png` 12x8): hold walks
  r6c6 → c7 → c8 and holds on c8; `fly()` continues c9 → c10 → c11;
  `mirrored:false` across both phases with no flip at contact. Added
  `P3D.cineState()` — mode, t/ft, superRow, flip, sheet and the shooter's
  forced cell — because "is it on the right frame" is not answerable from a
  screenshot.

  **Harness note:** the Browser pane suspends `requestAnimationFrame` entirely
  while hidden, so the cinematic only advances one frame per screenshot, with
  `dt` clamped to 50ms. That skips frames on sampling and is NOT a game bug —
  the contact frame (c9) could only be caught by cranking `P3D.cine.slowMo`.
  Same class of artifact as the parked controller work in B.1.

  **C.5c · IMPACT / TIMING PASS - ✅ DONE 2026-09-11** (pitch3d v71).

  Author's verdict on the deployed build: *"our shoots are still so flat with
  nothing that gives 'super shot incoming', it's just a ball being shot with a
  colorful effect."* Correct, and an audit says the cause was not the shaders:

  | | before |
  |---|---|
  | hit-stop / freeze frame | **none anywhere** |
  | camera shake at contact | **none** - `shakeScreen` existed but the cine never called it |
  | ball deformation | none - `scale.setScalar()` in all 3 places |
  | defender reaction | **zero** |
  | net reaction | **none** |

  Everything drawn was either ON the ball or ON a screen overlay. Nothing
  happened TO the world, which is what reads as decoration rather than force.
  So the timing was fixed FIRST - better-looking decoration on the same flat
  beat would still have read flat.

  **1. Hit-stop** (`hitStopMs:110`). Zeroing the sim `dt` freezes everything
  downstream that integrates it - `c.t`, `c.ft`, the sprite frame, the ball
  lerp, the trail - while real time keeps running so the freeze self-terminates
  and the shake carries on through it. Consumes only as much `dt` as the freeze
  has left and passes the remainder through; zeroing the whole frame overshoots
  by up to one frame and puts a hitch on the frame the freeze ends.

  **2. Camera shake** (`shakeAmp:0.22`, `shakeMs:420`) on the 3D camera, not
  the DOM stage - during the cine the stage is a near-static frame, so
  `shakeScreen` would have done very little even if it had been called.
  Driven by REAL dt so it shakes THROUGH the hit-stop: freeze plus shake reads
  as impact, freeze alone reads as a dropped frame.

  **3. Staged charge.** Was `chg=min(1,_fxT/2)` with every layer scaling by
  that one value - one continuous swell. Now `chargeCurve()`:
  gather (0-0.45) -> tremble (0.45-0.82) -> **held breath, a DIP to 0.45**
  (0.82-0.92) -> release spike to 1.25. The dip is the point; the release only
  reads as a release because everything goes quiet first. Overshoot past 1 is
  deliberate - every layer is additively blended, so >1 reads as hotter.

  **4. Shooter tremble.** `chargeTremble()` physically vibrates the sprite,
  peaking in the tremble stage and going to **exactly zero** through the held
  breath. Intensity alone is not enough: a player standing perfectly still
  inside a growing glow still reads as a decal. Applied after syncPlayers has
  placed him, so it needs no cleanup.

  **5. Hold takes the TRAIL colour, not the kit colour** (`holdTrailCol`).
  See C.5b - the charge was `sideColor()`, so all twelve styles produced an
  identical hold, and the hold is the longest and largest part of the shot.

  **NOT done, by the author's explicit decision:** the anime Z-stretch smear on
  the ball. The ball is becoming a pixel billboard, and stretching it would
  shear the pixel grid. It stays round.

  **Verified in a live match.** Hit-stop: `ft` held at 0 for exactly 3 painted
  frames (110ms / 50ms clamped dt) before advancing, `hitStop` 0.11 -> spent.
  Charge: `chg=0.081` at `t=0.22` - correctly low, the gather stage eases in
  rather than ramping linearly. Trail tint: `#7fd8ff` (lightning cyan), not
  Italy blue.

  Shake: isolated in `out` mode, whose camera is a fixed `position.set(...,3.2,
  ...)` with no lerp. Reading y = **3.2575 / 3.1992** instead of exactly 3.2
  proved the shake was live - and since no shake had been fired by hand at that
  point, it proved the AUTOMATIC trigger in `fly()` fires. A manual
  `P3D.shake(0.5, 6000)` then moved y across 3.19 -> 2.87 -> 3.40. The
  frontal-to-chase swing moves the camera far more than the shake does, which
  is why `P3D.shake()` exists at all: the shake cannot be measured from camera
  positions while that swing is running.

  **Queued next:** the world still does not react. Turf pulled INTO the charge,
  a ground crack under the plant foot, defenders flinching, the net bulging -
  that is what `ParticleSystem` / `GroundDecals` / `BurstSphere` are for, and
  they now land on a sequence that already has a beat.

  Author's ball sheet saved to `assets/ps1/ball_spin_4x4.png` (1254x1254, 16
  frames). **Two gotchas before wiring:** cell is 313.5px, NOT an integer; and
  the background is white with no alpha, on a ball that is itself mostly white
  - a naive white key destroys it, so this needs the same border-flood keying
  as the Germany kit in D.0.

  **C.5d · SIGNATURE SHOTS - ✅ DONE 2026-09-11** (pitch3d v73).

  Author: *"they still look the same. Mancuso a drive shot with blue trail
  going up and descending, Vella green, Frisina the dragon shot."*

  **`SIGNATURES` table** (pitch3d), keyed on lowercase surname so 'T.Frisina' /
  'Frisina' / 'frisina' all match. A named player gets a fixed trail AND a
  fixed trajectory instead of the stat-and-hash roll:

  | player | trail | colour | arc |
  |---|---|---|---|
  | Mancuso | `drive` (new) | `#2f6dff` | **`drive`** |
  | Vella | `nature` | `#19e07a` | normal |
  | Frisina | `dragon` | `#ff3a2a` | normal |

  Everyone else still rolls on stats + name hash. `'frisina'` was removed from
  `DRAGON_NAMES` since SIGNATURES now covers him; xiao/michael still use it.

  **DRIVE arc** - `shotArc()`. The old height curve was one symmetric parabola
  for every shot. `drive` climbs hard, hangs, then knifes down under the bar:
  peak **33.0 at fe=0.40** vs normal's 20.3 at fe=0.50, ending at 1.6 instead
  of 4.0. Higher, earlier, and it actually descends - which is what makes it
  read as a drive rather than a lob. `curveAmt` is cut to 35% for it: a drive
  barely bends.

  **Bug caught by the arc harness:** `Math.pow(1-(fe-0.42)/0.58, 2.4)` returns
  **NaN at fe=1** - `(1-0.42)/0.58` evaluates to 1.0000000000000002, so the
  base lands on -2.2e-16 and a negative base with a fractional exponent is NaN.
  The ball would have blanked on the last frame of every drive shot. Clamped
  with `Math.max(0,...)`; re-verified finite across 1001 samples.

  **RIBS 3 -> 5.** A style caps itself with `ST.strands`, so nothing that used
  1-3 changes; it lifts the ceiling so signature shots can braid a real
  multi-layer tail. (This is the "4-6 differentiated trails" idea from the
  GPT architecture note, done cheaply.)

  **DRAGON rebuilt hotter**: 4 strands (was 2), `w` 1.25->1.45, `glow`
  2.7->3.4, `pR` 3->6, ring cadence 0 -> 0.10. The important one is
  **`pG:8 -> -1.8`**: particle integration is `p.vy -= p.g*dt` and the floor
  bounce only runs when `g>0`, so a NEGATIVE g accelerates debris UPWARD and
  skips the bounce. Falling orange sparks become rising embers, which is the
  single thing that separates fire from confetti.

  **FLIGHT SPEED LINES** (`drawFlyLines`). These existed only in
  `drawHoldFx` - only while the player was STANDING STILL - and `hideHoldFx()`
  killed them on the exact frame the ball started moving. Exactly inverted.
  Now camera-space lines radiate from the BALL's projected position during
  `fly`, fading in over the first 18% of the flight and out over the last 32%
  so they read as acceleration rather than as a permanent starburst filter.

  **PRE-IMPACT BURST.** Fires once at hold progress 0.845 - inside the
  held-breath dip from C.5c, a beat BEFORE contact. Anime energy explodes
  before the strike, not on it: the burst is the anticipation and the kick is
  the payoff. Two ground rings, 14 rising embers, and a 0.07 tremor (vs the
  0.22 impact shake) so the quiet frame is not actually empty.

  **Verified live:** Mancuso -> `drive / #2f6dff / arc=drive / 3 strands`,
  Vella -> `nature / #19e07a`, Frisina -> `dragon / #ff3a2a / 4 strands`,
  and a non-signature player (Falkner) still rolls the hash -> `flame`.
  3 ribbons visible in flight for drive, no console errors.

  **⚠ `?trail=` PINS EVERYTHING AND PERSISTS.** `u11.trail` in localStorage
  overrides every signature - if it is set, all twelve styles AND all three
  signatures collapse to one colour. `?trail=off` clears it. This is the first
  thing to check if shots ever look identical again.

  **NOT done - the "insane flame" is only half built.** Dragon is much hotter
  within the existing rig, but a genuinely volumetric flame needs the
  `BurstSphere` port plus a flame shader on the ported `RibbonGeometry`
  (`aDist`/`aSide`/`aRandom` exist for exactly this). Doing it inside additive
  `MeshBasicMaterial` strips would waste the idea. That is the next piece.

  **Labels are wired but NOT shown.** `SIGNATURES[].label` carries DRIVE SHOT /
  EMERALD SHOT / DRAGON SHOT, but game.js `getSpecial()` deliberately returns a
  generic 'SUPER SHOT' for everyone ("Named skills removed from screen").
  That was a decision, so it was left alone - one line in `getSpecial()` turns
  it back on.

  **C.5e · ENERGY SHADER - ✅ BUILT, NOT YET JUDGED 2026-09-11**
  (pitch3d v74, `ult11-fx-flame.js`, `lab/lab-flame.html`).

  This is the ceiling C.5a was ported for. Every trail rendered through an
  additive `MeshBasicMaterial` with a per-vertex colour, so "lightning" could
  only ever be a blue strip with fast wobble and "dragon" an orange strip with
  slow wobble - they differed by hue and jitter because hue and jitter were the
  only channels that material had.

  **`U11Flame.material()`** reads the attributes `ult11-ribbon.js` writes:
  - `aDist` - arc-length 0 at the TAIL, 1 at the BALL. Points are appended
    head-first and expired from the front, so this doubles as the AGE axis:
    taper, heat gradient and fade all come off one value instead of being
    baked on the CPU with per-point timestamps and vertex colours.
  - `aSide` - -1/+1 at the edge vertices, interpolating through 0 on the spine,
    so `1.0 - abs(vSide)` is a free "distance from the centre line".
  - `aRandom` - per-vertex seed, so strands do not boil in sync.

  The fragment shader erodes the silhouette with fbm noise scrolling BACKWARD
  along the ribbon (fire shed by the ball, not crawling toward it), and the
  tail erodes harder than the head so it frays as it dies. Without that
  erosion the strip keeps a clean parallel edge and instantly reads as a
  ribbon rather than as fire.

  Noise is a compact 2D value-noise fbm written for this file, NOT lifted -
  so `ult11-fx-flame.js` carries no third-party code. `ult11-ribbon.js`
  remains the MIT port and carries its own attribution.

  **13 presets** map onto TRAIL_STYLES names. Only uniforms change between
  them, so switching style mid-match cannot trigger a shader recompile.

  **Per-strand heat**: strand 0 runs at 1.0, outer strands 0.78 falling by
  0.14 each, so a 4-strand dragon reads as one body of fire with a white
  spine instead of four equal ribbons.

  **A/B built in**: `P3D.fxRibbon=false` restores the legacy vertex-colour
  ribbons live, `true` returns to the shader. If either module fails to load,
  `makeRibbon` degrades to the legacy path instead of throwing.

  **Verified in `lab/lab-flame.html`**, which drives the REAL modules on a
  synthetic point list - necessary because in-game the ribbon expires points
  by wall clock and the Browser pane suspends rAF, so a live trail never
  accumulates more than ~4 points between screenshots and cannot be
  photographed (see C.5b). 7 checks green on r128. Dragon renders as actual
  fire: white-hot core, frayed noise-eroded edges, deep red tail. Drive,
  lightning and nature read as genuinely different materials, not hue swaps.

  **NOT judged in a real match yet.** Two specific risks for tomorrow:
  1. The presets were tuned against the lab's near-black background. In-game
     there is UnrealBloom, god rays and a bright sunlit pitch - the GPT
     architecture note's warning about "everything emissive -> crank bloom ->
     blurry blue soup" applies directly here, and these may need pulling down.
  2. Fill-rate. Four additively-blended eroded strands with a 3-octave fbm in
     the fragment shader is far heavier than four flat strips. Needs a look on
     the phone, not just the desktop.

  **C.5f · FIRST IN-MATCH TUNE - 2026-09-11** (pitch3d v76, flame v2).

  Author's first look at C.5e on the phone: *"Mancuso drive shot descends too
  early. Colors are nice but nowhere near where we want them."*

  **One root cause for faint AND washed-out.** The lab ribbon was ~4.4x the
  ball's width at the head; in the match it was ~1.8x, because width comes off
  the ball diameter and the chase camera sits 16.5 units back. At a few pixels
  wide the noise erosion ate the frayed edge and the outer colours, leaving
  only the near-white core - which is why Vella's emerald read pale
  yellow-green. `P3D.trailFx = {scale:2.6, heat:1.3, lifeMul:1.5}` (shader
  trails only). Separately, the flame shader's white core spread across most of
  the strip (`pow(spine,0.65)` is nearly flat), so v2 splits it into three
  zones: saturated mid colour in the body, edge colour at the fringe and tail,
  white only on a thin spine just behind the ball.

  **Drive arc v2.** v1 peaked at 42% and was back near the grass by ~80% - the
  drop happened mid-pitch where nobody looks. v2 climbs to just under the bar
  by 62%, holds, then falls with k^2 so the drop lands in the final ~20%, and
  ends at exactly 4 (the `wait` hover) instead of 1.6, removing a snap.
  **Measured IN THE GAME**, not just in node: the ball climbs 0.41 -> 3.23 over
  the first third, peaks ~5.4, and the final stretch of the frozen trail reads
  5.10 4.76 4.38 3.88 3.36 2.72 2.08 1.37 0.75 0.35 - a genuine dip at the
  keeper. Tested against the real `shotArc` evaluated out of the source file,
  not a hand copy.

  **New debug tools - these finally unblock in-game visual checks:**
  - `P3D.trailFx.freeze = true` stops expiring trail points, so a trail
    accumulates across screenshots in the Browser pane (which paints once per
    screenshot). First time all session a real in-match trail could be seen.
    Note the ribbon still caps at `maxN` = 96 points, so a frozen trail holds
    roughly a third of a flight at a time.
  - `P3D.cineState().trailY` - ten heights sampled along the spine ribbon, tail
    to head. Reads the arc as rendered, no camera guesswork.

  **Still to judge by eye:** the final look at 60fps from the normal chase
  angle. Viewed from behind the ball a frozen trail foreshortens and all its
  layers stack additively, so colour cannot be judged from that angle. The lab
  shows each style carrying its own saturated colour through the body.
  Knobs if it is now too big or too bright: `P3D.trailFx.scale` / `.heat`.

  **C.5g · FIREBALL HEAD - 2026-09-11** (pitch3d v77, flame v3).
  Author: *"Mancuso drive is perfect now."* Frisina's dragon read as fire, but
  2-3 flat hard-edged orange triangles fanned out behind the ball: each of
  the four strands hit the ball at full width (~7x the ball for dragon) and
  stopped in a straight cut, and erosion is weakest at the head so those cut
  edges were the crispest thing on screen. New `headCap` on the fire presets
  (dragon 0.16, flame/tiger 0.22) closes the last ~22% of the trail onto the
  ball - widest a little behind, pointed at the ball, like a fireball.
  `U11Flame.trailProfile(preset,t)` is now the single width profile, shared by
  the match and the lab. **Drive has no headCap and is byte-for-byte the same
  profile** (verified: 1.000 at the head, as before) - it was signed off.

  **C.5h · DRAGON COIL + TURF SCORCH - 2026-09-11** (pitch3d v80, flame v7).

  **Coil.** Dragon strands 1-2 now wind a HELIX round the flight path instead of
  wobbling beside it: the angle advances with time while the ball advances
  along the path, so points laid frame by frame trace a spiral in space
  (`coil:{n:2, r:2.4, w:11, wid:0.24}`). First pass used r 1.7 at normal strand
  width and was INVISIBLE - each strand was ~4x the ball wide on a spiral only
  1.7 ball-widths out, so the helix was buried inside the flame. The coil
  strands are now thin ropes (`wid 0.24`) on a wider spiral, eroded at 0.42x
  the body's rate and run at heat 1.15 so they read as solid ropes of fire.

  **Scorch** (author: *"instead of those circles, the pitch almost gets burned
  underneath where the ball passes, only for the time of the shot"*). The path
  rings are gone for fire styles (dragon `ring` 0.10 -> 0, tiger 0.13 -> 0).
  In their place a FLAT RibbonGeometry laid on the turf under the ball, with
  TWO materials on one geometry - additive can only brighten, so it cannot
  char grass:
  - CHAR, normal-blended: scorched brown at the rim, near-black in the middle.
  - EMBER, additive: glows on the rim where char meets grass, hottest in the
    stretch just under the ball, flickering.
  Noise is keyed on WORLD xz, not `aDist`: `aDist` is re-normalised every frame
  as the path grows, so noise on it would slide - the burn would crawl after
  the ball. Width follows ball height (a skimming ball burns a wide strip, one
  at the bar barely singes it). Laid only while `shotBallFx` is feeding it; the
  moment the feed stops, char fades over 1.4s and embers over 0.7s, then the
  points are dropped. Cleared at every shot start.

  **Fire over grass was turning YELLOW** - found once the lab got a green
  floor, i.e. the match's real condition. Pure additive orange + pitch green =
  yellow, which is why Frisina read gold. The flame material is now
  premultiplied (ONE, ONE_MINUS_SRC_ALPHA) writing `col*a*a` with alpha
  `a*uOcclude`: at `uOcclude=0` that is EXACTLY the old additive result
  (SRC_ALPHA, ONE -> col*a*a + dst), so non-fire styles are unchanged pixel
  for pixel - **drive included**. Fire presets occlude 0.50-0.62 so they cover
  part of the grass and hold their hue. Alpha is clamped: `uHeat` 1.3 can push
  `a` past 1, and on a float render target that would make `1 - a*occ`
  negative and SUBTRACT the pitch.

  **`ownPalette`** on fire presets. Once the grass stopped dragging everything
  toward yellow, dragon's signature `#ff3a2a` (passed in as the mid tint)
  showed through as a pink-red blob. Fire now keeps its designed orange body;
  the signature colour still drives the charge, sparks and glow.

  **Verified.** In the match: `trail=dragon`, scorch laid (28-160 points,
  visible), coil strands orbiting at 1.5-1.8 units, no console errors; final
  frame is flame-orange with a coil rope over the ball. In the lab (now with a
  green floor): double helix clearly readable, fire orange not yellow, charred
  line with ember rim on the turf, drive unchanged, 7 checks green.

  **Harness note:** the Browser pane's capture for one tab went stale mid-run
  and returned a black frame with the HUD missing. Proved it was the capture,
  not the game, by injecting a z-index 99999 magenta box that did not appear in
  the screenshot while every DOM probe showed a healthy page. A fresh tab
  captured normally. If a screenshot goes black, test with a probe before
  debugging the game.

- **HOW TO PLAY guide - ✅ DONE 2026-09-11** (js v137).
  `#aeHelp` modal, two tabs. CONTROLS: keyboard / controller / touch side by
  side, grouped Moving / With the ball / Defending / Menus & duels, taken from
  the live binding tables (`ult11-input.js` DEFAULTS, `_updateDpad` LBL) rather
  than written from memory. GAMEPLAY: basics, duels, the counter triangle
  straight from `RPS` (intercept > pass/1-2, tackle > dribble, block > shoot,
  super shot usually still wins), spirit costs from `ATK_ACTIONS`, the 85+
  super rule from `SUPER_STAT_REQ`, keepers, jump/hurdle, tips.
  Opens from a new HOW TO PLAY home menu item AND from the pause menu, so it is
  mounted on the stage itself, not inside `#s-home` like Settings.
  Only the body scrolls - the base modal card scrolls as a whole and carried
  the tabs away with the text.
  **Pad/keyboard nav now stays inside an open pop-up** (`_navScreenEl` returns
  `.ae-modal.show` first). Before, the scan took the whole screen, so the cursor
  could land on menu items BEHIND the Settings modal. Settings' close button got
  `data-nav-back`, so Backspace / B closes it too. Esc closes the guide in the
  capture phase, so opened from the pause menu it closes the guide and the
  match STAYS paused.
  **Verified:** both tabs render; arrows move focus only inside the pop-up
  (focus went to the close button, then CONTROLS); Enter on GAMEPLAY switches
  tab; Backspace and Esc close; opened from pause it is the top layer
  (hit-tested) and Esc leaves `G.paused` true. No console errors.

- **`?export=settings` - ✅ DONE 2026-09-11.** Hidden dev page: shows this
  device's look-and-feel settings (`ue_p3d_cam`, `ue_ctrl`, `ue_stadium`,
  `ue_settings_v1`, `ue_uisize`) as JSON with a COPY button, so the author's
  own setup can be baked in as everyone's default. Exists because phones have
  no console and the touch layout is tuned ON the phone. Personal data
  (profile, career, cup, custom teams) deliberately excluded.

  **⚠ Tooling trap, hit twice this session:** backslashes in the Python edit
  scripts are being consumed on the way in, so `\n` became a real newline
  (broke three shader `join` calls) and `\b` became a literal BACKSPACE
  (char 8) inside a regex, which silently made the export guard never match.
  Use `chr(92)` or avoid backslashes entirely in edit scripts. All project
  files were scanned for stray control characters afterwards - none remain.

- **AUTHOR'S SETUP IS THE DEFAULT - ✅ DONE 2026-09-11** (pitch3d v81, js v138).
  From `?export=settings` on the author's phone (reports as X11/Linux because
  Chrome's desktop-site mode; `uisize:'phone'` identifies it). Baked in:
  - camera: height 6, dist 20, fov 30, followLerp 16.5, zFollow 1, inwardYaw 0,
    lift 0 (was 26 / 46 / 38 / 11 / 0.45 / 0.55 / 2)
  - bowl: gap 16, rake 64, tierH 29
  - light: azim 4.03, elev 0.93, key 3, warmth 0.97, shadow 0.9, shade 0.47,
    shadowLen 2, glow 0.58
  - fx: bloom 0.1, bloomRadius 0.26, bloomThresh 0.48, tilt 1, vignette 0.63,
    rayDecay 0.8, raySamples 120, contrast 1.17, lift 0.04, split 1
  - **spriteFrac 0.045 -> 0.02** (the big one - players under half the old
    size relative to the pitch). NB every super-shot size in the cine scales
    off this (ball, trail, aura, burn). The author has been judging all of C.5
    at 0.02 on the phone, so the default now matches what was signed off.
  - touch layout: joystick opacity 0.34 size 0.95, buttons opacity 0.42 size 0.82
  - PS1 retro filter OFF by default.

  **Deliberately NOT copied:** `vol:0` (the phone was muted - as a default every
  new player would start with no sound) and `uisize:'phone'` (forced LARGE; as a
  default PC players would get oversized buttons, and AUTO already picks large
  on phones). Defaults stay vol 70 / AUTO. `ue_stadium` was unset, so the stadium
  default is unchanged.

  Existing Camera Lab / Settings saves still win over these - this only changes
  what a NEW player (or anyone who resets) sees. The old values are left in the
  code comments next to each block.

  **Verified** as a fresh player (all five keys cleared from localStorage):
  every baked value reads back exactly, no saved keys present, Settings shows
  PS1 off / volume 70 / UI AUTO / music on, and a match starts with no errors.

- **C.1 · Tempo pass** — global speed +~30% (player run, ball travel, animation, and
  crucially *transition/cutscene length*). Expose every constant in a debug tuning
  panel so we tune by feel, not by guessing. Also dial back cutscene frequency — a
  duel every few seconds is what makes it drag.
  **Done when:** a 90s clip feels faster than the Reddit video, back to back.

- **C.2 · Jump + tackle timing window** — `lab/lab-jump.html`. Tackle gets a wind-up
  and a vulnerability window; a well-timed `JUMP` hurdles it and keeps possession —
  *no duel triggered*. Mistimed = duel, or lost ball. This is the single change that
  adds "skill" to the moment-to-moment.
  **Observed problems to fix here (user, 2026-09-08):**
  1. The tackle resolves *so fast it is barely visible* — no readable wind-up,
     contact, or recovery. It needs real frames and real time.
  2. The duel opens **before the sprites visibly connect**, so the duel feels
     unmotivated — cause and effect are inverted on screen. Contact must land first,
     then the duel.
  3. The slide tackle in particular must **show the player sliding along the grass**,
     the way every football game reads it — extended leg, low body, turf spray, a
     travel distance you can see. Right now it's a pose swap.
  Build it in the lab the same way `lab-gk-dive.html` works: scrub the whole tackle
  over time, all phases visible as discrete frames, before touching the match engine.
  **Done when:** in the lab a telegraphed tackle can be consistently hurdled and
  consistently failed when early/late, the slide visibly travels, and the duel only
  fires after visible contact. Then merged into the match.

### CUTSCENE MEDIA REMOVED (author, 2026-09-11) - js v146
"The supershot cut scene video, let's remove them and the png as well - it just
broke the whole pacing and the HD-2D feel."
- Super shot: charge (2.25s) -> the ball flies straight away. The ~5s video /
  PNG-face banner that sat between them is gone, and so is the ~2s keeper video
  before the goal/save result. Measured: `fly()` at 2336ms after the press,
  keeper duel at 5.1s; nothing requested from assets/cutscene/.
- Duel specials and keeper super saves: the 2.2s full-screen PNG face is gone;
  the call, screen shake and move name stay, then 450ms to the result.
- Removed code: showCineMedia, cineVidPlay, showGkCineMedia, the video prefetch,
  the #special-cutscene element. (The #special-cutscene / .sc-face CSS in
  style.css is now unused - harmless, can go in a CSS tidy.)
- assets/cutscene/ is no longer loaded by anything. Locally it holds only six
  PNG faces (frisina, hyuga, michael, ozora, schneider, wakabayashi, 2.7 MB);
  the .webm/.mp4 clips only exist in the GitHub repo. Both can be deleted there.

### WIDE-SCREEN EDGES (author, 2026-09-11) - js v147 / pitch3d v87 / css v93
"Get rid of this black shadow - it's still from framing the game on 16:9, and
the light and shadow never reach the rest during the super shot."
The pitch renders full-window (#worldwrap) but the UI stage is a clipped 16:9
box, and three pitch-covering layers still lived in the box, so on a wide
phone each stopped dead at the stage edge:
- **Super-shot charge overlay** (#cine-fx: focus vignette, speed lines, bolts).
  Measured at 1600x716: 57% dark navy just inside the stage edge, nothing just
  outside. It was also projected with the full-window camera into the narrower
  stage canvas, so the bolts and the vignette centre drifted off the shooter.
  Now mounted next to the GL canvas (like the HUD), 720 drawing units tall with
  the window's aspect: alpha 110 both sides of the old edge, clear zone on the
  shooter.
- **Duel dim** (#duel-ov veil): drawn on #worldwrap::after instead, toggled by
  a MutationObserver on #duel-ov (`_syncWorldDim`); the stage copy is
  transparent while the world layer is live, so it is never doubled.
- **Keeper duel backdrop** (assets/ui/duel_net.png, opaque): a full-window copy
  (#gkduel-world) on the world layer while a keeper duel is open, the stage copy
  hidden; the keeper art stays in the stage. Field duels get the dim only.
Not verified on the phone itself; checked in the pane at 1600x716 (20:9).
(The black strip at the far left of the screenshot, ~4% of the width, full
height, is likely the phone's camera cut-out area, which the browser does not
draw into - separate from this.)

### GAMEPLAY IN PARTS (author, 2026-09-11)
One part at a time, each finished and played before the next starts - "these are
going to be a massive part of the gameplay". Proposed order; the author sets it.

| part | scope | status |
|---|---|---|
| **1** | Standing tackle, slide tackle, jump-to-dodge timing (was C.2); 1b stun for the loser; 1c real contact | ✅ done, needs a playtest |
| **2** | AI balance under the new rules: AI passing under pressure, AI defensive jumping/blocking, Contain. **2a AI v2** (selection, pace, CPU passing, off-ball); **2b Block + kick wind-up** | 2a + 2b ✅ need a playtest; Contain open |
| **3** | Tempo pass (C.1) | open |
| **4** | Short pass (C.3) | open |
| **5** | Cross -> header (C.4) - depends on the jump from part 1 | **step 1 ✅ headers, step 2 ✅ corners**; step 3 CPU set-piece brain - open |

- **PART 1 · TACKLES + JUMP - ✅ DONE 2026-09-11** (js v141 / pitch3d v84).
  Supersedes C.2 above; its three observed problems and its "done when" are all met.

  **What was actually wrong (audit):**
  1. You never needed to tackle. The engager auto-chased, and a duel opened
     automatically whenever ANY defender got within ENGAGE() (~38 units), plus a
     600ms grace timer. The tackle's own hit range (CONTACT x reach, ~27-34) was
     SMALLER than that, so walking up always beat pressing the button.
  2. Landing a tackle gave nothing - `G._lungeKind` was written, never read.
  3. The AI never tackled and never jumped, so the jump did nothing in single
     player: there was never a tackle to dodge.
  4. Wind-up 70ms (slide) / 90ms (standing) - human reaction is ~200-250ms, and the
     jump is only safe from 140ms after the press. Dodging was pure guessing.
  5. Contact was tested on every tick of travel, so it could land on frame 1 before
     the leg was out; the slide animation (620ms) outran the lunge itself (500ms).

  **Author's decisions:** duels start ONLY from a landed tackle; a clean tackle
  opens the duel with the tackler ahead; spirit costs standing 50, slide 80, jump
  80, and a jump that clears a tackle costs 40 (40 refunded).

  **What changed** (all in the TACKLES + JUMP section of game.js):
  - `TACKLE_ONLY_DUELS` switches off all three proximity triggers (engager ENGAGE,
    any-defender ENGAGE, `checkDuelGrace`). Flip it to false to get the old game
    back in one line.
  - Tackles are wind / strike / tail, locked to the 6-frame animations via a new
    per-frame timeline in `P3D.action(...,{frames})`. Contact is tested ONLY during
    strike, and the hit frames are the impact-spark frames:
      standing  wind 330 (f0-1) | strike 200 (f2-3) | tail 180   = 710ms
      slide     wind 300 (f0-1) | strike 330 (f2-4) | tail 150   = 780ms
    The defender keeps closing at ~50% pace during the wind-up (a frozen defender
    is simply run past).
  - A whiff stalls the tackler on the floor (standing 180ms, slide 420ms) and
    locks re-tackling (480 / 850ms). The off-ball mover now respects the stall
    too - otherwise a whiffed slider who stopped being the engager glided back
    into shape.
  - Edge: `G.D.tackleEdge` x1.10 standing / x1.20 slide, applied in
    `calcDefencePower`, never to keepers. G.D is rebuilt per duel, so it cannot
    leak.
  - Spirit is spent on commit; nothing is spent if the target is out of range.
    Not enough spirit = the action does not happen (for the AI too).
  - AI tackles: reads the play for 220-520ms (shorter for better DEF), then a
    standing tackle close in (0.6-2.2 x CONTACT) or a slide further out (1.6-3.6),
    35% slide where the ranges overlap, standing if it cannot afford the slide.
  - AI carrier jumps: 8-45% of tackles depending on DRI, aiming for the safe
    window with +-~130ms error, so it can mistime it like a human.
  - Telegraph: a ring under the tackler for the whole wind-up (orange standing,
    red slide), contracting onto him, white flash on the strike. NORMAL blending
    - the first additive version washed out on the green pitch and hid under the
    possession ring. `P3D.teleState()` reads it for tests.

  **Verified with a fixed-step harness** (Date.now stubbed, `tick(1)` stepped at
  exactly 60fps from script - the Browser pane only paints on screenshots, so the
  real loop runs in bursts and would have mis-measured every dash):
  - No proximity duel: an AI defender reached 36.5-37.7 units (old auto range
    38.4) with no duel; the duel opened only when his tackle landed.
  - AI committed a standing tackle at 35 units, spirit 1500 -> 1450, wind-up
    283ms, duel opened on the first strike frame with edge x1.10; a clean slide
    opened with x1.20. Edge reaches the maths: defence power 164.7 -> 197.64.
  - **Jump windows** (press time relative to the wind-up start):
      standing  hit at 350ms, clears if pressed -110 .. +200ms  (window 310ms)
      slide     hit at 433ms, clears if pressed  -30 .. +280ms  (window 310ms)
    With the first standing wind-up (280) the window closed at +140ms, BEFORE a
    human can react - that is why it went to 330. Now a sharp player can react
    to the standing tackle and anyone can read the slide.
  - A hurdle nets ~40 spirit (80 paid, 40 back).
  - Spirit gates: no standing tackle at 40, standing OK at 60, no slide at 70, no
    jump at 70; a jump costs exactly 80.
  - Human tackles on an AI carrier (DRI 77), 60 each, fouls off: standing - AI
    jumped 26, cleared 9, ball won 51/60; slide - AI jumped 19, cleared 8, ball
    won 52/60.
  - Whiffed slide: tackler stood still 417ms (designed 420) and stayed engager.
  - Frame timeline, run with the renderer's own code against the real tables:
    wind-up shows frames 0-1, the hit window frames 2-3 (standing) / 2-4 (slide).
  - Live loop: an AI standing tackle opened a real duel in play.

  **Not verified:** the telegraph's LOOK on screen - the pane served stale frames
  through this whole run. Its state is confirmed (visible, colour, opacity,
  following the tackler); the first real look is the author's playtest.

  **⚠ Watch in the playtest (part 2 material, deliberately not touched):**
  the CPU carrier releases the ball as soon as its pressure passes 0.45, on a
  0.85-1.9s cooldown. With auto-duels gone, that is now the main thing standing
  between a human defender and a tackle - it may make tackling the AI feel too
  hard, or it may feel like good AI. Needs eyes on it before it is tuned.

  Tuning is live from the console, no reload: `LUNGE.shoulder.wind`,
  `LUNGE.tackle.cost`, `LUNGE.tackle.edge`, `JUMP.refund` etc. If a `wind` is
  changed, change its `frames[0]+frames[1]` to match.

- **PART 1b · STUN - ✅ DONE 2026-09-11** (js v144 / pitch3d v85). From the first
  playtest: "losing a tackle (or a duel) should leave the loser stunned for a few
  seconds, otherwise they keep coming at you until they get you" - the same for
  a carrier who loses a duel - and the stunned player drawn GREY.

  **Two stages** (`STUN` table, STUN block of game.js):
      | lost ...                      | stun (frozen) | slow   | pace while slow |
      | field duel, either side       | 2000ms        | 1800ms | x0.55           |
      | standing tackle (miss/jumped) | 1400ms        | 1200ms | x0.60           |
      | slide tackle (miss/jumped)    | 2000ms        | 1200ms | x0.60           |
  - Stun: no movement, no tackle, no jump. Slow: moves at the slow pace and
    still cannot tackle ("Still recovering..."), so he cannot come straight back.
  - The cooldown (`ocd`) is stretched across stun+slow, which already keeps a
    player out of the engager/cover roles: the team keeps defending with the
    next man, and a human's control switches to him (control-switch flash).
  - A lost duel's stun is QUEUED at resolution and starts on the first tick of
    live play. The old 2.5s loser cooldown began when the duel was decided, so
    most of it ran out behind the result banner. A goal and half-time clear the
    queue. Shots and keeper duels do not stun.
  - Grey: `uGray` injected into each player's SpriteMaterial after
    `map_fragment` (luma x0.82), fed every frame from `stunLevel()` - 1.0
    through the stun, fading 0.85 -> 0 across the slow. `P3D.grayOf('a:CB1')`
    reads it.

  **Bugs found on the way:**
  1. The queued stun was first keyed on `G.goalGen` to drop it after a restart,
     but `afTurn` bumps goalGen on every turnover - so it cancelled itself in
     exactly the case that matters, the carrier losing the ball. Now cleared
     explicitly by the goal and half-time instead.
  2. A "frozen" player still slid 53-128 units. A setter trap found
     `applyRepulsion`: teammates within ~109 units pushed him up to 1.4/tick.
     Stunned players are now pinned (the other man gets pushed instead).

  **Verified** (fixed-step harness, 60fps, Date.now stubbed):
  - Missed slide: 2000ms stun with 0 units of movement, teammate pushed 46.
    Grey 1.00 through the stun, then 0.85 / 0.50 / 0.14 / 0 across the slow;
    the chase handed off to the next defender; no tackle while slowed; pace
    x0.6 while slowed; tackling allowed again after recovery.
  - Carrier loses a duel: stun queued, started on the first live tick, lasted
    2000ms, recovered at 3800ms.
  - Defender loses a duel: play resumed after ~1.2s real time, the stun was
    still queued at resume, fired on the first live tick, 2000ms / 3800ms.
  - Four more real duels through `opDuel`/`resDuel`, both sides winning: the
    right loser was queued and stunned every time.
  - The grey shader compiles (no errors) and the injection point exists in
    r128's sprite shader. **Not verified:** the grey LOOK on screen - the pane
    was hidden and paints no frames. First look is the author's playtest.

  Tuning live: `STUN.duel.stun`, `STUN.duel.slowMult`, `STUN.slide.slow` etc.

- **PART 1c · REAL CONTACT - ✅ DONE 2026-09-11** (js v145 / pitch3d v86). From the
  playtest, with two screenshots: "sometimes the duel gets initiated even if the
  tackle doesn't really connect" - one caught mid-air, one with grass between
  the two players.

  **Why:** the hit was a plain centre-to-centre radius (1.5 / 1.9 x CONTACT =
  27 / 34 units). The dash crosses it on its first tick inside, so the duel
  opened at the very EDGE of the radius every time. With the sprites at
  spriteFrac 0.02 a body is 22 units tall, so that edge was 1.22 (standing) /
  1.55 (slide) body heights (BH) apart - measured: old slide hits averaged
  1.47 BH. And the jump's safe window was a slice of time (20-68%) on a sine
  that started rising in the crouch frame: at 68% he was still at 84% of his
  peak, so he could be caught clearly in the air.

  **Contact (game.js, next to LUNGE):**
  - The tackle is a capsule from the tackler's anchor to the tip of the art in
    the frame on screen (`LUNGE.*.tip`, per frame, in BH), radius = the
    carrier's half-width (`TACKLE_HIT.carrierHalf` 0.33). Tips were measured
    off home.png and away.png (forward extent of the opaque pixels from the
    median column the renderer plants the sprite on - same rule as
    measureSheet): standing f2 0.56 / f3 0.44; slide f2 0.52 / f3 0.72 / f4 0.66.
    Longest possible hit: standing 0.89 BH (19.6 u), slide 1.05 BH (23.1 u).
  - `BODY()` = one body height in engine units, from `P3D.bodyUnits()`
    (spriteFrac x CV.width x fbSx), so contact follows the sprite size. Note:
    a bigger spriteFrac therefore makes tackles reach further - visually
    honest, but it changes balance.
  - `G._lastTackle` records every hit (centre distance, body, frame) for tests.

  **Jump:** `JUMP.frames` [80,110,120,120,120,150] (crouch | take-off | rise |
  peak | fall | land) goes to the renderer as the jump's timeline; the height
  is 0 in the crouch and land frames and a sine across the four air frames.
  SAFE = at least half-way up (`JUMP.safeH` 0.5), i.e. 158-472ms after the
  press (314ms; the old window was 336). `jumpSafeFrom()` feeds the AI's jump.

  **AI tackling had to be rebuilt with it:** on the old distance bands, with
  real contact, AI slides connected 29% (26/90). `aiConsiderTackle` now reads
  the carrier's velocity (from his position, so it works on a human carrier)
  and commits only when `tackleCanLand` says the tackle would touch him at
  some point of the strike. Its judgment is off by up to +-30% x (1 - DEF
  quality), with a small bias toward diving in too early; when only the slide
  would reach, 45% of the time he slides and otherwise keeps closing in for a
  standing tackle. `TACKLE_AI` holds all of it.

  **Verified (fixed-step harness):**
  - Human tackles on a moving AI carrier, 8 directions x 10-70 units: every
    hit at <= 0.88 BH (standing) / <= 1.05 BH (slide), always on a strike frame.
    Harder from range than before (the old "hits" from 30-70 units were the
    fake ones): standing connects 8/8 at 10 u, 5/8 at 20-25 u, 3/8 at 30-45 u;
    slide 8/8 up to 30 u, 5/8 at 40 u, 3/8 at 45-65 u.
  - AI tackles on a moving carrier (150 each): DEF 55 connects 57%, DEF 82
    74%, DEF 85 83% (old rule 62%, with fake contacts). Max 1.05 BH.
  - Jump sweep, press -200..+500ms around the tackle, both kinds: caught while
    at least half-way up 0, hurdled while lower 0. Windows: standing -120..180,
    slide (close) -140..180ms after the tackle starts.
  - Live loop, 2 simulated minutes with the human carrier: no errors, 41 AI
    tackles, 39 connected, all within 0.76 BH.

  **Not verified on screen:** the pane was hidden. First look is the playtest.

  Tuning live: `LUNGE.tackle.tip`, `TACKLE_HIT.carrierHalf`, `JUMP.safeH`,
  `TACKLE_AI.errAmp`, `TACKLE_AI.slideFar` etc.

- **PART 2a · AI v2 - ✅ DONE 2026-09-11** (js v148). From the playtest: "my selected
  player is never the closest to the CPU carrier and rarely gets there before they
  pass... the non-selected defenders feel way faster than the selected... the other
  19 players are stiff, sometimes just hanging there waiting. The whole AI needs
  an upgrade." All in the AI v2 block of game.js (`AI2`, before moveOffBallV1);
  **`AI2.on=false` in the console restores every v1 path** for comparison.

  **Causes found (measured, not guessed):**
  1. The engager (= the man you control) was picked by a score with +0.6 for a
     midfielder and +0.6 for goal-side: a man ~90 units further away could win.
  2. `RECOVER_MAX` (x1.85) multiplied team-mates' tracking speed to ~2.1/tick vs
     the human's 1.25; the sprint button was 1.34 vs 1.30 (+3%).
  3. **The selected man FROZE during every pass flight** - tick() does not run in
     pass_anim and moveOffBall skipped the engager - while everyone else moved.
  4. The CPU carrier treated anyone within ~113 units (5 BH) as pressure and
     passed; a receiver could pass again the moment the ball arrived.
  5. applyRepulsion shoved team-mates up to 1.4/tick (sprint pace) whenever two
     were within ~109 units: 60% of frames had a team-mate over the pace cap,
     worst x1.97 - "faster" without anyone deciding to run.
  6. Off-ball players crept at a flat 0.26-0.33/tick to spots that slid with the
     ball (carrier 0.77): lag, then settle. No gait, no individual decisions.

  **What v2 does:**
  - Selection by time-to-reach (`defenderETA`: intercept of the moving carrier,
    +12% from behind). On a pass, control goes at once to the defender who
    reaches the LANDING SPOT first, and he keeps running during the flight (your
    stick, or AI to the spot). Mid-dribble auto-switch only if someone gets there
    in <80% of the time and >0.2s sooner; never mid-tackle; a manual switch
    sticks 1.5s.
  - Pace: `DEF_TOP` = the human's manual chase; sprint +12%; snappier accel/turn
    on the stick; AI players cap at 95% of top, and on your side capped against
    the pace of the man you steer. Repulsion capped at 0.35/tick per player.
  - CPU carrier: first touch 0.45-0.9s after receiving (technique), looks up every
    250-420ms, "pressed" = a defender within 2.6 BH, chooses among ALL team-mates
    by open lane, circulates occasionally when free, and can pass out of a
    telegraphed tackle (12-45% by passing) - the tackler then counts as a whiff.
  - Off-ball: `aiMoveTo` gait (runs when far from the spot, eases in near it,
    follows a sliding spot using the motion seen at its last re-read, so
    reaction lag stays). Attackers hold JOBS for 1-2.5s: support (two players
    pick an angle into space on a ring around the ball), run (hold the line,
    then go in behind), check (tightly marked: come short), width, overlap,
    hold, shape. Defence keeps v1's roles and shifts, reacts ~90ms after the
    attack, and your team-mates shepherd at 3 BH instead of stealing your tackle.

  **Verified (fixed-step match sim; fresh page per run - a second run in the same
  page inherits drained stamina/cooldowns and is not comparable):**
      human defending, scripted to steer at the carrier   before -> v2
        selected is the closest defender                   60%  -> 80-85%
        extra distance vs the closest                      18.5u -> 9.6-15u
        selected is the fastest to arrive (ETA)            ~75% -> 95-98%
        reached within 2 BH before the CPU passed          52%  -> 87-96%
        team-mate over the pace cap (frames)               60%  -> 18% (p90 x1.07)
      CPU vs CPU, v1 -> v2
        attack width / length                              506/476 -> 491-528/437-526
        open pass options                                  3.67 -> 2.6-2.75
        possession changes per minute                      0.4  -> 0.8-3
        off-ball average speed                             0.44 -> 0.64-0.80
    Attackers have a little less space (201u -> 125-147u): v1 defenders simply
    lagged. No errors in any run; live loop clean.

  **Watch in the playtest:** CPU passes when you arrive (18-21 per minute of its
  possession against a relentless presser) - `AI2.passMid`, `AI2.passFree`,
  `AI2.closeBH`, `AI2.touchMs` tune it. Speed feel: `AI2.mateCap`,
  `AI2.humanSprint`. Auto-switch: `AI2.switchRatio`. Everything is live in the
  console.

- **PART 2b · BLOCK + KICK WIND-UP - ✅ DONE 2026-09-11** (js v149 / pitch3d v88). The
  author's design answers: animation - 6 idle frames until the block row is drawn
  (pitch3d `L12x8.block` / `rowFor.block`); kick wind-up - yes; super shots - blown
  away and the shot weakened, but stat-based: "a super strong DF might block a super
  shot from a long distance - if I shoot from the centre and he blocks it almost at
  the GK he might stop it". Code: BLOCK + KICK section in game.js (after the STUN block).

  **The triangle:** tackle beats the dribble (loses to the jump); block beats the
  kick (loses to the dribble).
  - **Kick wind-up** for every normal pass and shot, human and CPU: pass 250ms,
    shot 300ms, escape pass out of a tackle 150ms. Ring under the kicker (pitch3d
    now has two ring slots, 'tackle' and 'kick'): warm white = shot, blue = pass.
    The carrier is planted; a tackle landing in the wind-up still wins the ball.
    Super shots keep their 2.25s charge as the tell.
  - **Block** (A / ✕ / Space while defending; touch BLOCK): 40 spirit, 450ms brace at
    30% pace, then 350ms before another. A kick counts as blocked if his brace
    overlaps the ball's journey to him and he is within 1.15 BH of its line:
    chance 55% + (DEF*0.75+PWR*0.25 - kick stat)*1.2% + how square he is (25-92%).
    Shots: 45% clean block / 55% deflection (loose). Passes: steal / deflection.
    +20 spirit back on a block. Dribbled past while braced (carrier within 1.6 BH)
    = wrong-footed 400ms (a stumble, not the grey stun). No tackling while braced.
  - **CPU defenders** read a kick near their line: DEF-based chance (10-70%) and
    reaction (260-110ms by awareness). **CPU passers** see a braced defender as a
    lane 2.5x more closed.
  - **Super shots:** at the start of the charge the defender nearest the flight line
    (within 3 BH, 12-97% of the way) is the candidate - the human gets him on the
    stick + "⚠ X is in the line — press BLOCK!"; a CPU defender commits by DEF. He
    dives into the line; the renderer fires the impact when the ball reaches him
    (`superCine2.fly(cb,{block:{fe,stop,onHit}})`, burst + hit-stop).
      power at the block = (SHO*0.6 + PWR*0.4) * 1.3 * (1 - 0.55 * min(1, travel / 0.55W))
      strength           = DEF*0.75 + PWR*0.25
      stop chance        = clamp(0.15 + (strength - power) / 25, 0, 0.85)
    Stopped: flight ends at him, cine aborts, ball drops loose at his feet, he is
    knocked down 600ms, +20 spirit. Not stopped: blown away (flung ~2 BH along the
    shot, grey-stunned) and the shot goes on at 55-85% power into the keeper duel
    (`G._ssWeaken` in calcAttackPower).

  **Verified:**
  - CPU shot, your man in its line (passive auto-block switched off to isolate it):
    blocked in ~80% when Block is pressed -100..+200ms around the ring appearing;
    too early or after the kick = no block. Same at 40% and 80% of the way.
  - Your pass with a CPU defender in the lane: 20/20 cut out with reads forced,
    37/40 with real DEF reads (a man in a lane also intercepts passively);
    control with the lane clear: 10/10 completed.
  - Dribbled past while braced: wrong-footed exactly at the end of the brace.
  - Super shot from the centre circle, real 3D flight: DEF-85 blocker near the
    shooter - power 102.9 vs 85, stop 0%, blown away, shot x0.64, stunned, keeper
    duel; near the keeper (466u of flight) - power 73.4, stop 62%; forced stop -
    "STOPS THE SUPER SHOT!", cine ends, ball loose 14u from him. CPU super shot at
    your goal: prompt, control switched to the man in the line, ✕ commits, blown
    away, x0.62.
  - Match sims: no errors; 38 of 39 kick wind-ups fired, 1 caught in the act.
  - Harness note: the super-shot cine runs on real frames, so a CPU super shot
    froze the fixed-clock sim (world held by _cineHold) - that, not the AI, was
    behind the stalled CPU-vs-CPU runs. Sims now stub cpuWantsSuperCine.

  **Not verified on screen:** the look of the kick rings and the idle-frame brace.

  Tuning live: `KICK.passWind/shotWind`, `BLOCK.brace/cost/reach`, `BLOCK.aiRead`,
  `BLOCK.superStop`, `BLOCK.superDecay`.

- **PART 2c · PLAYTEST FIXES - ✅ DONE 2026-09-12** (js v150 / pitch3d v89). Three
  bugs from the author's playtest.

  1. **The duel timer went to -150 and survived into the next match**, so every duel
     resolved the moment it opened. `startCD`'s tick wrote the number FIRST and then
     touched `#dta`; if that element was missing the tick threw before the "time is
     up" branch, so that interval never cleared - it ran on past zero forever, was
     never the `G.di` the next `clearInterval` targeted, and one of those orphans
     fired `resDuel()` on whatever duel was open. Now: all DOM work is null-safe and
     wrapped, the count clamps at 0, each countdown carries a token and kills itself
     when its duel is gone, and every timer is registered so `closeDuel` /
     `startCD` can stop all of them. Verified: with `#dta` deleted mid-count the
     duel still resolves at 0 (lowest number shown: 1, no timer left); a duel closed
     early leaves 0 timers; a normal duel still runs its 30s and resolves once.
  2. **Team-mates still outran the man you steer.** `aiMoveTo` capped each player's
     own step, but `applyRepulsion` shoved them again afterwards: measured 1.46 a
     tick against their 1.12 cap (cover and blocker). Added `enforcePace()` at the
     very end of tick - after every mover, push and clamp - which scales any
     off-ball player back to `aiTop()`. The man on the stick, a committed tackle and
     the carrier set their own pace and are exempt. Verified: 0 over-cap ticks in
     300 (fastest team-mate 1.14 vs your 1.42).
  3. **A fast CPU carrier could not be caught.** A slow defender (SPD 55) sprinting
     made 1.05 a tick against a fast carrier's (SPD 94) 1.04 - a dead heat. Sprint
     is now +20% (`AI2.humanSprint` 1.12 -> 1.20) and the CPU carrier's cap is 1.50
     (was 1.58, human carrier still 1.82). Verified: that same chase now closes
     61 -> 20 units over 5s with sprint held, and he escapes again without it.

  **Radar:** the man you are steering now gets a pulsing blue ring on the radar
  (`drawRadar3D`) - the carrier when attacking, the chaser when defending, the same
  player the 3D marker and the bust HUD follow. Verified by pixel count: 28 blue
  pixels around him vs 7 around a normal team-mate.

- **PART 2d · PLAYTEST FIXES 2 - ✅ DONE 2026-09-12** (js v151). Three reports.

  1. **"Got caught a few times mid air."** The safe window was the middle of the
     jump (h >= 0.5 of the peak), but the ART has him off the ground from the
     take-off frame to the landing frame - so frames that clearly show him
     airborne could still be tackled. `JUMP.safeH` is now 0.02: **off the ground
     = safe**. Window 80-550ms after the press (470ms, was 314). Verified by
     sweeping the press time: every catch now happens at height exactly 0, zero
     catches while airborne, both tackle kinds.
  2. **"Falkner shot a super shot and the old pre-duel match showed up."** A
     special resolved INSIDE a keeper duel (the CPU picking SUPER SHOT in a duel,
     or a duel won with one) never came from `superShotCine`, so `superCine2` was
     not active and resDuel fell to the v1 cine **plus `playDuelCutIn`** - the old
     portrait screen. New `superCineFromDuel()` runs the same v2 cinematic
     (charge -> flight, blockable -> finish) for those two branches; the old
     cut-in is no longer called from anywhere. Verified with a forced CPU duel
     special: v2 cine runs, no cut-in, no duel overlay, goal scored.
  3. **"Team-mate AI doesn't help - no proper defence, no attack."** Measured
     first, with the author's own complaint as the metric (a scripted human
     steering, then isolated position scenarios; "usable option" = a pass whose
     lane has no defender within 40u, ignoring the first 15% of it, as the engine's
     own interception test does):
         with the ball        old AI -> v2 before -> v2 now
           usable options      2.89  ->  0.65*   ->  3.77
           usable AHEAD        0.84  ->  0.02*   ->  0.81
           team-mates ahead    3.01  ->  1.65    ->  3.98
           nearest team-mate   171u  ->  123u    ->  89u
         defending
           defenders goal-side 1.02  ->  3.58    ->  2.78-3.4
           top threat marked   49%   ->  0%      ->  98%
           cover behind you    0%    ->  0%      ->  31%
           attackers unmarked  73%   ->  93%     ->  60%
         (* measured with the old strict "open" rule, which counted the man
          pressing the carrier as blocking every lane out of him.)
     Fixes: a get-open job (two MIDFIELDERS show for the ball when no forward
     option exists, into a sampled clear-lane spot; forwards stay high); the
     striker waits in the POCKET between the lines in the widest channel instead
     of on the last defender's shoulder; supporters ahead of the ball offer a
     forward angle; more runs in behind past halfway; **markers are assigned most
     dangerous man first, nearest free defender to him** (pair-ranking let a
     defender 400u away claim the striker); anyone the ball has gone past sprints
     back into the block; and `fixRoleOverlap()` - the chase can be handed to the
     man who was the COVER (auto-switch, a pass, your switch button) and nothing
     re-picked the roles until possession changed, so you pressed with no second
     man: cover === engager. Also `_laneClearFrom` ignores the first 15% of a
     candidate pass, so the AI can tell a good spot from a bad one at all.
     Live sim after: 18 duels, 13 passes, 15 kick wind-ups, no errors, no overlap.

- **PART 2e · PLAYTEST FIXES 3 - ✅ DONE 2026-09-12** (js v152).

  1. **Kick-offs had players standing in the centre circle.** iPos() only pushed
     everyone into their own half, so the formation left three or four bodies on
     the ball. New `kickoffShape(side,taker)` (match start, after a goal, second
     half): only the kicking side may be inside the circle - the taker on the ball
     plus one team-mate - everyone else is pushed out along the nearest radius and
     kept in his own half. Verified at the restart snapshot: kicking side = taker
     @0u + one mate @50u, opposition inside the circle = none.
  2. **Slide tackles fouled constantly and the restart was unplayable.** Measured:
     a connected slide fouled ~21% of the time (contact 22% + 14% if the attacker
     won the duel + 5% on the turnover), and each foul froze play for 3.7s - which
     is why it felt like 80%. Now contact 10%, duel-win 8%, turnover 3%, and the
     pause is 2.3s (PK 3.0s). The restart used to leave the fouler and the fouled
     man on the same blade of grass: the wall is now pushed to ~9.15m (W*0.085)
     and team-mates give the taker W*0.05. Verified: nearest opponent 110u
     (target 109u), nearest team-mate 64u.
  3. **CPU "melina" - endless square balls at the back, and your man never
     arrived.** Two causes. The pass chooser had no memory, so it could knock it
     sideways forever: `G._cpuBackChain` counts passes that gain no ground and
     after two the CPU must find a forward one. And on EVERY CPU pass the human's
     control jumped to whoever was nearest the landing spot, so no man ever
     closed the distance ("my man didn't advance... I was too distant") - the
     control now stays with the man you are running with unless another gets
     there in under 70% of his time. Verified over 150s of CPU keep-away:
     longest sideways run 2 passes (was unbounded), 45% of passes forward,
     control switches 15.9/min, your man's average distance to the carrier 66u.

- **PART 2f · WING DEFENCE + PIXEL BALL - ✅ DONE 2026-09-12** (js v153 / pitch3d v92).

  1. **The defence ignored the wings** (from the screenshot: a CPU man running the
     touchline had the whole flank to himself). The back four held a flat, almost
     static line near the middle of the pitch, so the ball could be 300 units wide
     of the nearest defender and nobody slid across. Measured before: with the ball
     on the left wing the defensive block's centre sat **191u infield** of it; on
     the right wing **303u**. New `DEF_SHIFT` {line .75, mid .62, fwd .30,
     compress .72, tuck .55} + `defShiftY(formY,ballY,shift)` slides the whole
     block toward the ball's lane and squeezes it (each line shifts less the
     further forward it plays, so the shape stays a shape). Markers tuck goal-side
     the wider the ball goes; the far-side defender stops man-chasing and holds a
     zone (`farBand = H*0.42`), only picking up a threat past 70% progress. And
     `aiMoveTo` now breaks into a run instead of a jog whenever the target is more
     than 0.085·W away, so the slide actually happens. After: left wing **87u**,
     right wing **82u**, half-space 59u, middle 12u; the ball carrier is pressured
     100% of the time in every lane. **Caveat:** from a cold start the slide still
     takes ~5.7-7.4s to arrive, so a fast switch of play will still find space -
     that is the next thing to tune, not a bug.
  2. **Kick-off circle, again.** 2e's fix used W*0.075 (96u) but the *painted*
     circle is 0.085 of the pitch width (109u), so players were pushed to a ring
     just inside the line and still looked like they were in it. `KICKOFF_R` is
     now `W*0.085` with allow = R+12, read off the same constant the pitch is
     drawn with.
  3. **Pixel ball** (author's `assets/ball-sprite.png`, 4x4 = 16 frames of one
     rotation). The ball stays 3D - position, arc, height, shadow and physics are
     untouched - and the sheet is billboarded on top, so it reads as pixel art
     from every camera angle. The frame advances with the distance actually
     rolled, so the spin matches the travel instead of ticking on a timer.
     `P3D.pixelBall=false` falls back to the shaded sphere.

     Hand-drawn cells are never perfectly aligned, and this sheet's four rows each
     sit a little higher in their cell than the last (0.517 → 0.419 of a cell),
     which would have made the ball **bob by 0.098 of its own diameter** once per
     rotation - a roll that looks like a bounce. So `measureBallSheet()` reads the
     sheet's alpha once at load, finds where the ball actually sits in each cell,
     and bakes the correction into that frame's UV offset. Verified frame by
     frame: worst off-centre **0.098 → 0.000** ball diameters. The same pass
     measures how much of a cell the ball fills (0.834) and sizes the sprite from
     it, `d / 0.834` - the hand-guessed 1.28 would have drawn it 6% too big.
     Redraw the sheet however you like: it re-measures itself.

     One more thing the maths caught: the ball is small, so it turns over once
     every ~17 engine units - past ~64 u/s the real spin outruns a 16-frame sheet.
     Measured uncapped during a fast move: the sheet advanced up to **493 frames
     between two rendered frames** (~30 rotations), i.e. the roll would have
     aliased into noise on every pass. `P3D.ballSpinMax` (0.75) caps how far the
     sheet may advance per rendered frame, so a fast ball reads as a fast, steady
     spin; slow rolls stay fully proportional (measured average 0.637, under the
     cap). Verified on screen: with the ball parked on the centre spot, 87% of the
     pixels that consistently change when the sprite is toggled on and off fall in
     one ~32x32 blob at the ball's position.

- **PART 2g · BLOCK ROW + ANIMATED FLAGS - ✅ DONE 2026-09-12** (js v154 / pitch3d v95).
  Two art drops from the author, both wired in.

  1. **The drawn BLOCK animation.** The author packed it into the back half of the
     run-north row to keep the sheet small: `home.png` row 5, cols 0-5 = run north,
     cols 6-11 = block (front-facing, impact sparks on the last three). `block` now
     points at `[6,6]` on row 5 for every facing. The catch was the run cycle:
     it steps `floor(phase) % R[1]` with `R = L.run` = 12, so capping only the
     lookup would have played frames 0-5 then **frozen on frame 5 for half the
     cycle**. New `rangeOf(L,anim,face)` lets one facing own a narrower slice of
     its row (`rangeFor:{run:{up:[0,6]}}`), and the cycle, `cellOf` and
     `forceAnimT` all read through it. Verified off the real table: block
     resolves `5,6 .. 5,11` for all facings, north cycles exactly `5,0 .. 5,5`
     and wraps, south/side keep all 12 frames, tackle/jump/super untouched.
     **Still to do: away.png and homcce.png have no block art** - those teams
     block with the back-view run until the same 6 cells are drawn.
     Row 4 (run south) is the next cheapest 6 cells if more space is ever needed.

  2. **Animated supporter flags.** `assets/flags/<teamkey>.png`, 4x2 = 8 frames of
     one wave on a pole; italy + germany shipped. Replaces the old banner, which
     drew the **country emoji at 120px into a canvas** - the single most un-HD-2D
     thing left in the stands. Falls back to that banner for any team without a
     sheet (probed once, then cached), so the rest of the roster keeps working.

     Same authoring drift as the ball sheet, and worse: the pole wandered 16px
     sideways between frames and the **whole bottom row sat 32px higher in its
     cell**, so a flag would have hopped halfway through every loop.
     `sliceFlagSheet()` measures each frame's POLE (shaft centre + foot) from the
     alpha, then re-anchors every frame on it into its own small canvas - one
     shared scale so no wave clips. Verified: pole drift **3.7% x / 7.4% y of a
     cell → 0.0000px**, all 8 frames fit, 0.82 MB of texture per team.
     Each of the 20 flags gets its own phase and a 0.85-1.2x speed so they never
     wave in lockstep (measured: all 8 frames on screen at once). Pole flags also
     stand up straight - they take 30% of the stand's rake lean, where a draped
     banner took all of it. `P3D.flagFps` (7) is the speed knob,
     `P3D.flagState()` the probe.

- **PART 2h · BLENDER STADIUM MERGED (Astra) - ✅ DONE 2026-09-12** (pitch3d v96
  + new `ult11-stadium-classic.js`). Delivered from a parallel workstream, built
  in Blender and handed over as a bowl-only GLB.

  **It met the brief.** Checked against the GLB itself, not the docs: no pitch,
  marking, goal or net geometry anywhere in it; `seats_home` / `seats_away` /
  `seats_neutral` materials so team colours still drive the stands; zero
  textures and no Principled BSDF, so it converts cleanly to Lambert under r128's
  pre-colour-management lighting; stock r128 `GLTFLoader` off the CDN we already
  pin, no build step; and 12 separable `front_NN` sectors for the camera-side
  problem `bowl2` solves with OPEN_FRONT. It is authored around **70 x 44.87**,
  which is exactly what `buildPitch` sets PWID to - so it lands at scale 1.0.

  **MERGED, NOT COPIED - this matters.** The delivery was built from a checkout
  at game.js v149 / pitch3d v89; live was v154 / v95. Dropping the folder in
  would have reverted the duel-timer fix, the selected-player pace fix, the
  kickoff circle, foul rates, the melina fix, the wing-defence slide, the pixel
  ball, the block row and the animated flags. The delivery is also **CRLF**
  where this project is LF. Astra's own handoff says to merge the hooks, and
  diffing its delivery against its own pre-integration backup isolated them to
  **37 lines in 8 hunks** - all ported by hand onto v95, JS re-normalised to LF.

  **The one real conflict was the flags.** Astra's hook calls
  `U11_CLASSIC.placeFlags(T,group,tex,...)`, which builds six planes off a single
  static texture - that would have frozen the animated pole flags added hours
  earlier (and passed `art` where a `tex` was expected, so they would have
  rendered untextured). Ported the **placement maths only**; the meshes are still
  built through `flagMesh()` so each flag keeps its own frame material and phase.
  `U11_CLASSIC.placeFlags` is left in the module unused, so the file stays
  byte-identical to Astra's and future drops re-sync cleanly.

  **Default deliberately NOT changed, and it is a SETTING, not a picker.**
  Astra set `classic-upgraded` as the default for everyone; the default here is
  still `classic`. Astra's picker was not re-added - it wraps `startGame` with a
  full-screen SELECT STADIUM interstitial before EVERY kickoff, which is the kind
  of pacing tax this roadmap keeps removing. Instead the choice lives in
  **main menu -> SETTINGS -> STADIUM** (CLASSIC / UPGRADED / OVAL), on the
  existing `.ae-uisize` segmented control so it needed no new CSS. Set once,
  change whenever. `window.setStadium(v)` writes `ue_stadium` - the same key
  `ult11-pitch3d.js` reads at boot, deliberately NOT mirrored into
  `ue_settings_v1`, so there is one source of truth - then calls
  `P3D._rebuildBowl()`, so it also applies live from the pause menu's OPTIONS.

  Verified by clicking the real buttons mid-match: classic -> `builtBowl=classic`
  (20 flags), oval -> `oval` (20), upgraded -> `classic-upgraded` (12, the GLB
  placement), each persisting to `ue_stadium` and re-highlighting correctly; then
  set to OVAL, reloaded with NO url flag, and it booted into OVAL with OVAL shown
  selected in Settings.

  **Measured A/B at the kickoff view** (composer off so `renderer.info` is
  meaningful): original CLASSIC **54 draw calls / 1,244 triangles**, upgraded
  **25 calls / 132,706 triangles**. Draw calls roughly halve because the GLB is
  merged by material; triangles go up ~107x. Calls are usually what bites first
  on mobile, so the trade leans the right way - but this was a desktop measure
  and **no phone GPU has seen it**. That is the open item before it becomes the
  default. The bowl also has physical empty seats; no animated crowd.

  Verified live: asset `ready`, bowl `classic-upgraded`, pitch [70, 44.87],
  `seats_home` #1e72dc / `seats_away` #c22020, 12 sectors registered and 12/12
  visible at kickoff (camera sits inside the bowl, so nothing needs opening),
  and 12 animated flags still waving across 7 distinct frames. Switching to
  `classic` and back rebuilds cleanly. A slow or missing GLB keeps the old
  procedural bowl on screen rather than showing an empty stadium.
  Probe: `P3D.stadiumState()`.

- **PART 2i · FORMATION-AWARE AI ROLES (Astra) - ✅ DONE 2026-09-12**
  (js v155 / pitch3d v97). Second delivery from the parallel workstream, merged
  hunk by hunk - 22 of 23 taken, **1 deliberately refused**.

  **What it fixes.** The AI decided a player's job from his ENGINE SLOT KEY
  (`zo(k)`, `k==='ST'||k==='LW'||k==='RW'`, `k==='LB'||k==='RB'`), but slot keys
  are fixed while formations relabel them. New `aiRole/aiZone/aiForward/
  aiWideBack` read the active formation's own labels instead. Measured against
  the real `FORMATIONS` table - **3 mis-zoned slots**:

  | Formation | slot | labelled | was zoned | truth |
  |---|---|---|---|---|
  | 4-3-3 | - | - | - | clean, 0 mismatches |
  | 4-4-2 | LW | RM | att | mid |
  | 4-1-3-2 | LW | RAM | att | mid |
  | **3-5-2** | **LW** | **RWB** | **att** | **def** |

  The 3-5-2 case is the bad one: a **wing-back was treated as a forward** -
  skipped by marking, skipped by outlet duty, and dropped entirely by the
  `zone==='att'` early-returns in the defensive assignment. A whole defender not
  defending. It never surfaced in playtests because the author plays 4-3-3,
  which the table shows is a **provable no-op** - so nothing about today's
  matches changes, and the win lands the moment another formation is used.
  Verified live: in 3-5-2 `LW=RWB->def` and `RB=LWB->def`; 4-4-2 `LW=RM->mid`.

  Also taken: `pl.spirit||maxSp` -> `pl.spirit!=null?pl.spirit:maxSp` (a spirit
  of **0** fell back to FULL stamina, so a totally drained player ran at top
  pace); the role cache key now includes both formations, so switching shape
  re-picks roles instead of serving a stale set; a `_pressers` guard so only an
  assigned presser abandons his marker; and a `wantsOutlet` guard on job
  refresh. Striker `hold` was retuned too (lane lerp .5->.15, stays available
  until the pass is released) - that one is FEEL tuning on top of measured work
  and has **not** been A/B'd; it is a three-line revert if it reads worse.

  `ult11-pitch3d.js`: chase-camera lag is now frame-rate independent
  (`k=1-(1-lag)^(rdt*60)`). The flat per-frame lerp made the camera trail about
  twice as far at 30fps as at 60.

  **REFUSED - `aiTop`.** Astra removed the side-cap with the comment *"a
  teammate's pace belongs to that player, not to the current selection"*.
  Principled in isolation, and wrong here: it is exactly the regression the
  author reported TWICE - *"the selected player still run way slower then any
  non selected teamate, its literally impossible to chase and catch a cpu
  carrier"*. It was measured at the time (team-mates over cap on 60% of frames,
  worst 1.97x) and fixed with the side-cap plus `enforcePace`, which reads its
  limit FROM `aiTop` - so taking that hunk would have silently un-fixed the
  limiter as well. Kept ours. Astra could not have known; it works from a base
  without that playtest history.

  **Process, again:** the delivery was CRLF (project is LF) and its base had no
  stadium merge, yet its `ult11-pitch3d.js` was ALSO labelled **v96** - a
  straight version collision with a different file. Merged by opcode diff with
  the one hunk filtered out, never by copying files. Verified after merge: side
  cap present, stadium merge intact (9 `U11_CLASSIC` refs), all four role
  helpers live, everything LF, and 12s of real CPU play (carry, CM2->CB1->LW
  passes) with **zero console errors**.

- **PART 2j · STAMINA ON THE MATCH CHIP - ✅ DONE 2026-09-13** (js v156).
  Author: *"when you have player and you jump few time you dont see how much
  stamina you consume, and you might end up not having any stamina cause you
  didnt noticed."*

  The carrier/chaser chips (`#bust-h` / `#bust-a`) now carry a **stamina bar
  under the name plate - bar only, no number**, on the duel's exact colour ramp.
  Jumping, blocking, tackling and sprinting all spend stamina and, until now,
  NONE of them showed it anywhere in open play: the only readout was the duel
  card, i.e. after the moment it mattered.

  The ramp is defined once, in `staminaFill(pct)`, and both the duel card and
  the match chip read it - so a colour cannot come to mean two different things
  on two screens. 0% red -> 50% green -> 100% cyan. Chip layout is 230px =
  200 portrait + 24 name plate + 6 bar; the 6px is ADDED to the wrapper, never
  taken out of the portrait, because the image area has to stay a full 200px or
  the chin clips. The bar fills from the same edge its name plate reads from, so
  the away chip mirrors.

  It is driven from `updBusts()` **before** the `_bustKey` early-return - that
  guard only moves when the PLAYER on the chip changes, and stamina changes
  constantly, so anything after it would have updated roughly never.

  **Two real bugs found while wiring it, both the falsy-zero pattern:**
  1. `if((pl.spirit||maxSp)<maxSp)` in the regen loop read a stamina of EXACTLY
     0 as FULL, so the gate was false and **a player who bottomed out never
     regenerated again for the rest of the match**. Now `spiritOf(pl)<maxSp`.
  2. The duel card's `Math.round(pl.spirit||maxSp2)` did the same, so a man on
     empty showed a **full cyan bar** - the display lying precisely when the
     warning matters. Now `spiritOf(pl)`.
  Same class as the `fat` fix taken from Astra in 2i; `spiritOf`/`spiritMax`
  already existed and handled it correctly, they just were not used here.

  Verified live with the sim held still: bar width tracked 100/75/50/30/15/0%
  exactly, colours `rgb(15,194,230)` cyan -> `(15,230,97)` green ->
  `(104,230,15)` -> `(230,219,15)` -> `(230,119,15)` -> `(230,15,15)` red,
  matching the duel hue ramp (190/143/95/57/29/0) at every step. Zero-stamina
  checks: old read 1500, new reads 0; old regen gate false, new true.

  Note for testing: the chip only updates during `moving`/`pass_anim`, so it
  freezes during a duel - that is existing behaviour, and it briefly looked like
  a broken bar until the phase was checked.

- **PART 2k · ASTRA DROP, 2026-09-19 — merged, NOT written up by Astra** (js v170 -> v173,
  pitch3d v99 -> v100). Recorded here from the diff so it is not lost. None of it
  touches the keeper duel, and the B.1e playtest fixes all survived it.
  - **Defence:** new `defensivePlan()` - one plan owns the block; markers keep
    their man until a real handover; the line eases toward the ball instead of
    snapping; centre-backs ALWAYS stay home (was: only past halfway). Replaces
    ~150 lines of the old defending-team block. The cover-press path is off when
    `AI2.on`.
  - **Spacing:** repulsion halved (`repelDist .075->.038`, `repelForce .8->.65`,
    `repelCap .35->.22`) and now scaled by frame time (`applyRepulsion(dt)`).
  - **Support play:** support pairs survive the carrier changing; outlets commit
    for 650ms; max 2 forward runners at once; no full-back overlap during an
    850ms turnover transition; pocket positions are chosen once, not re-rolled.
  - **Ball / kicks:** kick wind-up and pass physics tweaks in `launchPass` and
    the pass tick; 3D jump height and the super-shot cinematic's ball height.
  **Ask Astra to write up future drops** - reconstructing intent from a diff is
  guesswork about the *why*.

- **PART 2l · PIXEL CROWD + SUPPORTER FLAGS (Astra) — merged 2026-09-19, NOT written up by
  Astra** (`ult11-stadium-classic.js` v1 -> v2, 4.4 KB -> 12.7 KB; nothing else changed).
  Recorded here from the code.

  **What it is:** a seat-aligned crowd for the Blender stadium (`classic-upgraded`),
  built in `buildCrowd()` once the `.glb` has loaded.
  - **Spectators:** 16 pixel-art variants x 2 poses (seated / arms up) on one
    256x48 canvas atlas drawn in code - 4 skin tones, hair, some hats and scarves.
    Pure-green pixels are a key the shader repaints as the shirt colour: home,
    away, or neutral grey (28%). The stand splits by side of the pitch (home
    left of x=8, away right). Laid along 3 tiers / 28 rows of the bowl outline
    (coordinates mirror Blender's `build-runtime.py`), 77-93% occupancy, aisle
    gaps, a gap at the tunnel. `NearestFilter` keeps it crisp pixel art.
  - **Motion, all on the GPU:** the front 3 rows (+ ~8% elsewhere) bob and raise
    arms, only near the camera (fades out 24-48 units away), and near spectators
    turn toward the camera. **Goal cheer:** `api.update` watches `G.hG` / `G.aG` -
    verified these ARE the score variables (`G.hG++` on a goal) - and the scoring
    side's supporters celebrate for ~5s with bigger jumps.
  - **Flags:** 20 small supporter flags (10 per long side), team colours with a
    white stripe, cloth waving in the vertex shader; poles as one InstancedMesh.
  - **Plumbing done right:** batched by the existing camera sectors (`front_00..11`
    / `bowl_fixed`), so the near-stand hiding that keeps the low camera clear
    hides its crowd too; team colours follow `setTeamColors`; `dispose` frees the
    atlas; `U11_CLASSIC.inspect().crowd` reports the counts.

  **Cost, measured by running Astra's own placement code** (not estimated):
  **12,359 spectators** (1,559 animated), 20 flags, **~25,300 triangles in 27 draw
  calls** - one shader for the whole crowd. On top of the bowl's ~133,000
  triangles that is +19%.

  **Visibility:** it exists ONLY in `classic-upgraded`, which is still opt-in
  (default `classic`, ~1,800 triangles) "until it has been looked at on a real
  phone". Nobody sees the crowd unless they pick that stadium
  (`?stadium=classic-upgraded`, remembered after). **Decision for the author:**
  the phone test should cover the Blender stadium WITH the crowd; if it holds
  frame rate, make it the default.

  **Upload state:** GitHub has v1 of this file - v2 and its `index.html` bump
  still need uploading.

- **PART 5 · STEP 1 · HEADERS — ✅ DONE 2026-09-19** (aerial v2 / js v180 / pitch3d v102;
  rules `ult11-aerial.js`, tests `node lab/test-aerial.js` 31/31).
  **Why now (author):** free kicks form a wall but the CPU always just runs at it,
  and corners need aerial play. Traced: **the CPU cannot cross at all** (crossing
  exists only on the human's button; every CPU pass is `'ground'`) and **only
  shoots from inside the box** (`progress>.88 && centrality>.35`) - so from a free
  kick it can only dribble into the wall. Corners exist only as "nearest attacker
  takes it at the flag, play on". Order agreed: **1 headers, 2 corners, 3 the
  CPU's set-piece brain.** Author's calls: REAL-TIME jump timing (no pause); corners
  = pick a zone on phone, free aim on PC.

  **The model is physical.** A dropping ball can be played by anyone in reach
  sideways whose head - standing, or lifted by a jump - gets up to it:
  `reach = headBz + jumpBz * jumpHeight`; the highest wins it. A jump peaking as
  the ball arrives reaches highest, so timing decides it; the grade is how high the
  winner was (PERFECT / GOOD / STANDING). Heights come live from the renderer
  (`P3D.aerialHeights`): at the author's sprite size, head bz 14.3 and jump +17.1.
  Outcomes: attacker in the box + central -> **header at goal = the keeper duel**
  (new `header` action, x1.15, free; grade edge x1.20/1.00/0.85 via `G.D.headerEdge`;
  the GK QTE applies); attacker elsewhere -> knock-down to a team-mate; defender ->
  clearance; keeper in his area -> claim. A PERFECT header is aimed with the stick.
  AI jumps are timed from heading skill (power + finishing / defending / reflexes).

  **Everything below was found by MEASURING, and each fixed a real problem:**
  - Timing thresholds guessed at .85/.35 measured as a lopsided 166ms PERFECT;
    **.93/.55 = PERFECT -48..+63ms (111ms)** - the keeper's Save ring - stable across
    cross lengths and sprite sizes.
  - **Crosses were aimed at the FEET.** A cross is headed ~7% of the pitch before it
    lands, so the runner was never under it: a perfect jump won 0/12 and a sprinting
    defender headed it standing every time. Now the flight is stretched (solved,
    4 passes) so the ball is at jumping-head height ON the target and carries on to
    the far post if missed. Header point now ~8px from the striker (was ~90).
  - **Short crosses never rose above a jumping head** (peak bz 24 vs reach 31), so
    there was no moment to time - every AI jump silently never fired. Crosses are now
    lofted to >= 1.3x a full jump.
  - **AI too precise**: at 25-110ms timing error a good CB was PERFECT ~95% of the
    time. **70-160ms**: against TWO centre-backs marking him, a perfect human jump
    wins 13/30 (all PERFECT), late 3/20 (GOOD), early / no jump 0.
  - **The target man reacts at once** (`nextReact=0`): AI movement only re-reads its
    target when reaction allows, so he kept running his old route into the cross.
  - **Touch:** the pad and stick only showed in open play - during a cross the X
    button VANISHED. They now stay up while a cross is in the air.
  - **Jumps are drawn during passes** (`stepJumps` only ran in open play).
  - Side fix: a cross/pass can no longer target a team-mate on cooldown (he jogs
    back to shape and it flies past him).

  **Verified** with a fixed-step harness (Date.now stubbed, exactly 60fps) in a live
  Italy-Germany match - timer-driven runs in a background tab were throttled and
  desynced the wall-clock jump from the frame-based ball, which is also a note for
  anyone testing this later. End to end: Mancuso PERFECT header -> keeper duel vs
  Steiner, `HEADER - COMMITTED`, edge 1.20; the X pad visible during the cross.
  **Not verified: the feel under a real thumb** - the author's phone test.

  **PART 5 · STEP 2 · CORNERS — ✅ DONE 2026-09-19** (js v182 / pitch3d v103).
  Was: "nearest attacker takes it at the flag, play on". Now a set piece:
  - **Set-up** (phase `corner`, play frozen): the three best headers of the ball
    (power + finishing) on the penalty spot / far post / near post, one on the
    edge of the box, one SHORT option, the best crosser (pas + tec) takes it.
    Defenders: the best in the air mark them goal-side, one zonal at the near
    post, keeper on his line. Real geometry (1m ~ 0.0082W; spot 11m, box 16.5m).
  - **Delivery** (author's split): phone = tap a zone drawn ON the pitch (thumb-
    sized, on `document.body` like the match pad); PC/pad = aim a gold target with
    stick/WASD, O / R / Enter to cross (not the pad's X: that is the header jump a
    moment later). 10s untouched -> penalty spot. CPU after 1.4s: WEIGHTED pick,
    base 45/28/27 penalty/far/near scaled by header-vs-marker, 12% short - the
    first version took the best zone outright and chose the penalty spot 11/11.
  - **In the air** = the step-1 contest; no offside from a corner; the target man
    reacts at once. New `P3D.pitchScreenPos` projects any pitch point through the
    corrected full-window mapping (used to draw the zones).
  **Verified** (fixed-step harness, live match): a real loose ball out off a
  defender starts it; roles placed 8px off the spots, markers 18px goal-side,
  keeper on his line, taker at the flag. Human, PERFECT jump: 9/10 penalty spot,
  9/10 far, 10/10 near - all headers at goal (-> keeper duel); good/early/late
  jumps and no jump: the marker wins. CPU corner, you not jumping: 12/12 CPU
  headers at goal; you jumping perfectly: you clear 5/11. CPU picks over 300:
  penalty 61% / near 14% / far 13% / short 11%. Timeout 10.0s -> penalty spot;
  short = ground pass to the short man; PC aim moves, stays in the box, O delivers
  3px from the aim; phone tap on Far post delivers 3px from it; UI cleared.
  **Tuning note:** at a corner ONLY a perfect jump beats a marker (he is on the
  same spot, unlike open play). If it plays too harsh, relax `AERIAL.TUNE.goodH`
  or the markers' 18px spacing (`startCorner`).
  **Not verified:** the look/feel on a real screen (camera framing of the box
  during the set-up included) - the author's phone test.

  **Stadium:** the Blender bowl is now the DEFAULT and is named **ASTRA STADIUM**
  in Settings (author: tested on phone, works). Internal key stays
  `classic-upgraded` (saved settings / file names); `?stadium=astra` is an alias.

- **C.3 · Short pass** — distinct from the through pass: fast, low risk, low reward.
  Gives the player a real decision instead of one pass verb.
- **C.4 · Cross → header** — needs ball height (z) in the 2.5D sim, an aerial contest,
  and a header duel variant. Depends on C.2's jump. Biggest of the four.
  **Done when:** a cross from the wing can be met and scored with a header.
- **C.5 · Super shot payoff** — the special shots must *look* super: screen shake,
  speed lines, time compression, ball travelling visibly faster than any normal shot.
  Cheap, and it's the moment people screenshot.

  **C.5a · RIBBON GEOMETRY PORT - ✅ DONE 2026-09-10** (`ult11-ribbon.js`,
  `lab/lab-ribbon.html`).

  Source: `src/effects/RibbonGeometry.js` from
  **AvatarCastingAbilitiesThreeJS** (achrefelouafi), **MIT**. Code is MIT and
  reusable with attribution — the header in `ult11-ribbon.js` carries it. The
  repo's ASSETS (Mixamo `Standing Idle.fbx`, `spruit_sunrise.hdr`) are licensed
  SEPARATELY and were not taken.

  **Do NOT upgrade three to r185 to use that repo.** We pin r128 and load the
  composer from `examples/js`, which no longer exists after ~r148. r152 also
  rewrote colour management and r155 changed lighting units — upgrading would
  re-grade every colour set in A.2 and force a build step. Port DOWN instead,
  file by file. The GLSL is the portable part; the JS API is the gap.

  **Why this file and not our own `makeRibbon`.** The existing ribbon is fine
  geometrically (billboard, whip taper, age fade) but it writes a per-vertex
  `color` on a `MeshBasicMaterial`, so it can only ever be a tinted additive
  strip — "lightning" and "flame" differ by hue and wobble, nothing more. The
  ported builder writes the attributes an effect SHADER needs: `aDist`
  (arc-length ratio), `aSide` (-1/+1 edge), `aRandom`, `aNormal`, and opt-in
  `aCenter`/`aTangent` so a fragment shader can raymarch around the polyline
  and treat the ribbon as a proxy hull. That is the unlock; the geometry swap
  on its own is only a modest win, and TRAIL_STYLES stays exactly as it is.

  It also adds **UPRIGHT** — a vertical curtain whose lower edge sits on the
  polyline. Nothing we have does that; it is the mode for a ground crack or a
  standing flame wall.

  **Measured:** our index-ratio parameterisation is off by **11%** against true
  arc length on a normal curved-shot path (`i/(n-1)` vs distance), which is
  what stretches the texture and the taper unevenly on a fast ball.

  **r128 gotchas found while verifying** — both are real and will bite again:
  - `BufferAttribute.addUpdateRange()` / `clearUpdateRanges()` are r159+. On
    r128 it is the single `attribute.updateRange` object. The port
    feature-tests, so the file runs on both.
  - `attribute.needsUpdate` is a **write-only setter** on r128 (it only bumps
    `.version`). Reading it back returns `undefined` — assert `.version > 0`.
  - r128's `WebGLAttributes.updateBuffer()` **resets `updateRange.count` to -1**
    after uploading, so a live geometry reads -1 on every frame after the
    first. Assert the hint on a never-rendered probe.

  **Verified:** `lab/lab-ribbon.html` on r128, 8 checks green across all four
  modes (billboard / flat / upright / oriented), no console errors. Checks
  cover attribute presence, `aSide` alternation, arc-length correctness to
  2.9e-8, draw range, the upload hint, degenerate input (1 point and a
  zero-length span), and the bounding sphere.

  **C.5b · TRAIL STYLE OVERRIDE - ✅ DONE 2026-09-10** (pitch3d v67).

  `P3D.forceTrail('dragon')` pins every shot's comet to one of the 12
  TRAIL_STYLES; `P3D.forceTrail(null)` restores the per-player hash;
  `P3D.trailList()` names them. Until now the style was a hash of the
  shooter's name plus his stats, so in normal play you only ever saw the two
  or three your squad happened to roll and there was no way to compare them
  — twelve styles were shipped and effectively invisible.

  `P3D.cineState()` now also reports `trail`, `trailCol`, `trailForced` and
  `ribbonPts`.

  **`?trail=dragon` in the URL does the same with no console** — which is the
  only way to try these on a PHONE. Persisted to `localStorage` under
  `u11.trail` so it survives reloads; `?trail=off` clears it. Inert unless the
  param or the stored key is present, so nothing changes for a normal player
  and there is no debug chrome shipped in the build.

  **Verified:** `?trail=tiger` stores it, a plain reload keeps it, `?trail=off`
  clears it, and `?trail=water` (not a style) is rejected and NOT stored —
  which also proves the parse runs after TRAIL_STYLES exists.

  **Verified:** lightning -> #7fd8ff, galaxy -> #b07cff, an unknown name
  throws with the valid list, null clears back to the hash.

  **The comet cannot be captured through the Browser pane** — worth writing
  down so nobody wastes time retrying it. The pane suspends rAF while hidden
  (one painted frame per screenshot) and `ribbonUpdate` expires trail points
  by WALL CLOCK (`now - p.t > LIFE`, 430-1250ms). Roughly a second of real
  time passes between screenshots, so every point laid has already expired by
  the next paint and the ribbon is always empty. Only a real 60fps session
  shows the trail. Same family as the r128/pane artifacts in B.1 and C.2c.

  **Not wired into the match yet** — `makeRibbon`/`ribbonUpdate` in
  ult11-pitch3d.js are untouched, deliberately. Next: a ShaderMaterial that
  actually uses `aDist`/`aSide`/`aRandom`, then swap the comet over. After
  that `BurstSphere` on the contact frame (C.2c frame 3) is the big one.

---

## PHASE D — Duel sprite rework (largest, most asset work)

The user's plan; unchanged structurally, restated as steps:

- **D.0 · Paired-sheet pipeline — ✅ BUILT AND WIRED** — characters are
  generated as ONE image holding **front (left) and back (right)**, then split by
  `sheet-slicer.html` (project root, alongside `ps1-sprite-baker.html`).
  Generating both views in a single pass is what guarantees they match: same kit,
  same light, same build, same floor line. The slicer:
  - keys the background by flooding inward **from the border only**, so an enclosed
    white shirt survives — the white-Germany-kit case a naive white-key destroys;
  - auto-detects the split at the emptiest column between the two figures;
  - trims each half and writes both onto **one shared canvas size**, bottom-anchored.

  That last part is the entire point: identical output dimensions make
  `background-size:contain` scale both halves equally, so their feet resolve to the
  same screen line **with no per-character CSS**. Nothing is resampled, so a genuine
  height difference between the two views survives instead of being normalised away.
  Outputs `assets/players/front/{lastname}.png` + `back/{lastname}.png`, extending
  the existing `profile/` + `shoot/` subfolder convention in `fCard()`.

  **Verified** against a synthetic sheet (white bg, white-body-in-black-outline
  figure): enclosed white held at alpha 255, background at 0, split found dead centre
  of the gap, both canvases 136x316, feet on the same row, 20px height delta preserved.

  **WIRED (game.js v119 / style.css v81).** `fCard()` loads
  `front/{lastname}.png` for the LEFT slot and `back/{lastname}.png` for the RIGHT
  slot. **The view follows the slot, not the role.**

  A first pass bound it to attacker/defender instead, on the theory that the
  attacker faces the camera. That is wrong for this art: the sheets are a matched
  pair for a left-right confrontation — the front sprite is posed facing RIGHT and
  the back sprite facing LEFT. Binding to the role put the front view on the right
  in any duel where the away side attacked, so the two players faced away from each
  other. Author caught it. Slot binding is correct and is what shipped; size and
  lift live on `.left`/`.right` alongside the placement.

  Half time still does the interesting part: `homeLeft` (`G.half===1`) swaps which
  side each team occupies, so the human is seen from the front in the first half and
  from behind in the second. Verified in both the home-attacking and away-attacking
  cases — the views stay put while the players swap.

  **Fallback chain (v118)** mirrors the existing portrait convention:
  `front|back/{lastname}.png` -> `front|back/{teamkey}.png` -> nothing. The team card
  keeps an unnamed player correctly kitted instead of leaving a hole, and the
  front/back split is preserved at team level too. `teamkey` is the club key in
  career mode and the nation key in friendlies, so one directory serves both.
  Team cards still to be drawn: `italy`, `germany` (front + back each).

  `DUEL_SPRITE_FALLBACK = false` (near `BRAND_SAFE`): a player with neither his own
  sheet nor a team card renders nothing, per the author — missing art should be obvious, not papered over with the
  old full-body illustrations. This also blanks career/story duel portraits. Flip the
  one line to restore the previous chain.

  **Scope note:** bespoke sheets are affordable for the 22 Italy/Germany players
  (1 generation each). They do NOT scale to the 530-name roster — D.1/D.3/D.4 below
  (grayscale master + kit baker + head layer) remain the plan for everyone else.

- **D.1 · Sprite spec** — resolution, canvas, anchor points, palette (from A.1), and
  a locked **grayscale master body** so the kit baker can recolour it, exactly like
  the in-field sheet. Two poses: **front** (facing camera) and **back** (facing away).
- **D.2 · Idle animation** — 2–4 frame weight shift, left/right sway. This alone kills
  the "static, no atmosphere" problem.
- **D.3 · Kit baker extension** — extend `kit-baker.html` to bake duel sprites, so
  2 masters × N kits = unlimited teams with no new art.
- **D.4 · Head layer** — heads as a separate anchored layer over a shared body. One
  body, many faces. This is the multiplier that makes a full roster feasible.
- **D.5 · Duel wiring** — attacker front / defender back, swapping perspective on the
  counter-turn. Replaces the two-players-both-facing-camera problem *and* fixes the
  direction-of-travel nonsense.
- **D.6 · GK screen upscale** — keeper portrait + net background at higher res, new UI
  language applied. Layout stays exactly as it is (keeper-only, net behind) — that
  screen already works.

  **D.6a · KEEPER ART NO LONGER CROPPED — ✅ DONE 2026-09-16** (js v169).
  Author: *"the image of gk is changed in size compared to the previous one —
  make sure it is loaded correctly with its full size shown on screen, rather
  than being cut anywhere."*

  **The rule never changed; the art's ASPECT did.** `#gkduel-art` was
  `background: center top / auto 165%` — a deliberate waist-up zoom that scales
  the image to 165% of the BOX HEIGHT and lets the remainder overflow. That is
  fine for a tall portrait, which every keeper image used to be
  (`career/clubs/gk.png` 941x1672, aspect 0.56; the retired
  `players/steiner-alt.png` 1023x1537, 0.67).

  The current keeper art is **landscape** — `players/donati.png` 1086x737 and
  `players/steiner.png` 1536x1024, both ~1.47-1.50. Height-scaling those to 165%
  renders them ~243% of the box height WIDE, so the screen showed a cap and one
  glove: cropped top, bottom and both sides at once.

  **Fix: `background-size: contain`,** which is aspect-AGNOSTIC — whatever shape
  the next keeper image is, it is fitted whole. Nothing needs re-tuning when the
  art is re-baked, which is the entire point: a size rule keyed to one aspect
  ratio is a trap that springs silently on the next art swap.

  **BIG AND LOW, NOT TUCKED ABOVE THE UI** (author's correction, same day). A
  first pass shrank the art so it cleared the infobox and the action rows
  completely. That was the wrong call: it cost real size, and — the actual
  problem — it left the art's **hard horizontal bottom edge floating in
  mid-screen**, which reads as a cut-out hanging in the air. These keeper images
  are a landscape crop across the thighs, so that seam exists and has to be
  *hidden*, not framed. Author: *"the image has to end exactly where we see the
  blue bar with the commentary, so it should be bigger and lower, and i dont
  care if a little of the infobox covers it, its normal."* Correct — the panels
  are meant to sit over the scene, exactly as they do on the outfield duel.

  **`--gk-art-bottom` is `0`, and the reason is worth knowing:** `#duel-ov` is
  **1280x695, not 1280x720**, because `.mcomm` (the commentary bar) takes the
  last 25px out of `#s-match`'s flex flow. The overlay's own bottom edge already
  *is* the top of the bar, so `0` lands the art flush on it with no constant to
  re-derive if that bar ever changes height. An intermediate pass used `3.5%`
  (25/720) and left a 25px gap, because percentages in here resolve against 695
  — **any % measured off the 720 stage is wrong inside this overlay.**

  The width cap now exists only to keep the art on screen: the render is
  height-limited for a wide image, so at this height donati is 1009px wide and
  steiner 1028px; the cap sits just above that, so a wider source becomes
  width-limited and stops growing rather than running off the 1280 stage.

  **The keeper is not always on the left.** His infobox sits on whichever side he
  occupies and **half time swaps the sides**, so one fixed nudge leans the wrong
  way half the time. `gk-info-right` mirrors it, driven by reading the
  `.dside.gk-info` panel that `opDuel` has *just* placed rather than recomputing
  the side from `G.half`, so the two cannot disagree. It now only trims how much
  of him the panel covers — it is no longer load-bearing.

  Both keeper images have **zero transparent padding** (donati content spans
  x 0-1075 of 1086, steiner 0-1522 of 1536, alpha-scanned on a canvas), so an
  overlapping panel covers real drawing rather than empty margin. That is why
  the overlap is a deliberate, signed-off ~115px rather than an accident.

  Four vars are the whole tuning surface, same idea as `--duel-hero-h`:
  `--gk-art-top:1.4% / --gk-art-bottom:0 / --gk-art-w:min(84%,1075px) /
  --gk-art-x:55%` (45% mirrored).

  **Verified** at a true 1280x720 stage across all four cases (both keepers x
  both halves, i.e. infobox left and right), asserting on computed rects:
  FLUSH_WITH_BAR, NOT_CROPPED, INSIDE_SCREEN — 4/4 pass. Every case renders with
  its bottom edge at exactly y=695, the bar's top. donati -> 1009x685, steiner
  -> 1028x685 (was 786x534 and 800x534 in the too-timid pass: **+64% area**),
  infobox overlap 113px / 122px.

  **Testing note:** forcing a viewport size in the Browser pane fights
  `fitViewport()` and can render the stage into a corner of the screenshot, or
  produce an all-black frame — the numbers from `getBoundingClientRect` were
  still correct while the picture was not. Measure, do not eyeball.
- **D.6b · GOALKEEPER QUICK-TIME EVENT — ✅ IN THE MATCH 2026-09-19** (js v174, gkqte v2;
  `lab/lab-gk-qte.html` still drives the same file for tuning). Wired in at the author's
  request before a lab sign-off — **first feel test is the author's phone.**
  Author: after picking Save / Punch / Super Save, a quick-time event decides
  the outcome as bonus or penalty points.

  **Design (author's picks):** a different QTE per move, and the AI keeper rolls
  the same grades from REFLEX.

  | move | QTE | graded by | stat |
  |---|---|---|---|
  | Save □ | ring shrinks onto a gold target, ONE press of □ | ms from the target | REFLEX widens the window |
  | Punch ✕ | mash ✕ for 1.4s after a "get ready" beat | press count | POWER lowers the count |
  | Super Save R2+□ | 3 random buttons in order, draining timer each | wrong/late = MISS, all fast = PERFECT | REFLEX adds time |

  Result multiplies the keeper's defence power — the keeper's own
  `tackleEdge`, which keepers never got. Bigger gamble on harder moves:
  Save +20/+8/-15%, Punch +25/+10/-18%, Super Save +35/+12/-25%. The dice roll in
  `calcDefencePower` is only +-10%, so the keeper's hands now outweigh luck.
  All numbers in `GKQTE.TUNE`, editable live in the lab.

  **AI keeper** (you shooting): `GKQTE.simulate(move, reflex)` on the same table.
  At REFLEX 82 over 1000 rolls: Save 33/54/13%, Punch 29/56/16%, Super Save
  17/55/28% (PERFECT/GOOD/MISS), i.e. +9% / +10% / +6% on average.

  **Built so the lab IS the shipping code:** a pure core (`create/step/odds/
  simulate` — time and presses passed in, no DOM) under a thin UI (`run()`).
  Presses come from the game's own input layer as `DUEL_*` actions, so keyboard,
  pad and the on-screen diamond are one path; the `DUEL_S_*` chords count as the
  same buttons, because RT may still be held from choosing SUPER SAVE. Save
  takes ONE press (spam cannot find the window); in the lab, Enter/Start is dead
  while a QTE runs, since the pad's CONFIRM is ✕ = the Punch button.

  **Verified:** `node lab/test-gkqte.js` 52/52 — every window edge (+54 PERFECT,
  +56 GOOD, -141 MISS), early/no press, anti-spam, stat scaling, mash counts and
  the get-ready beat, sequence wrong/slow/fast, odds summing to 1 and improving
  with REFLEX. The lab loads clean (all assets 200), mounts the overlay with the
  touch diamond, and runs the AI simulator. **Not verified: the feel** — the
  animation needs a visible window; that is the author's sign-off in the lab.

  **Integration (done):** every road into `resDuel` for a keeper duel goes through
  `gkQteThen` — GO / second press, the attacker's super cutscene, and the countdown
  running out (the keeper still gets to react). Human keeper: countdown stopped,
  menus + GO + timer hidden, re-pick/confirm locked by `G.D._qte` (else the QTE's
  □ would press the Save row and start a second QTE). AI keeper: `simulate` from
  REFLEX. PvP: neutral for now (its devices are read separately). The result is
  `G.D.gkQte`, applied in `calcDefencePower` for save/punch/supersave only,
  beside `tackleEdge`; a pause mid-QTE holds the resolution until unpaused;
  `closeDuel` cancels a live QTE.

  **Touch = the match's own `#dpad`**, faces only, labelled for the move (Save →
  □ SAVE, Punch → ✕ PUNCH, Super Save → blank). It lives on `document.body`
  outside the stage, so it is real thumb size — a diamond inside the stage would
  be ~45% scale on a phone — and it keeps the Camera Lab layout. A capture-phase
  listener routes its presses to `GKQTE.press`; `_updateDpad` (runs every frame)
  is told to leave it alone while `G_dpadQte`.

  **Style pass:** px only (the lab's `max-width:70vmin` was the fixed-stage
  viewport-unit bug), Cinzel title case like the duel rows, Rajdhani caps
  captions on `--u-track-wide`, Bold Pixel on the NUMBER only (`+20%`), PS face
  colours identical to `#dpad`, Super Save in special purple.

  **Verified in a live match** (engine rAF run on a timer, since the pane is
  hidden): Punch → real `#dpad` ✕ mashed → PERFECT ×1.25, Donati wins; countdown
  stopped, menus hidden, pad in QTE mode, and a second GO / a Save-row click /
  the per-frame `_updateDpad(false)` all ignored. Save with no press → MISS ×0.85
  after 2.65s, duel resolves. Super Save wrong button → MISS ×0.75. AI keeper
  (Steiner REF 80) rolled with no overlay. Save power ×1.200 / ×0.850 exactly,
  outfield moves ×1.000. Engine rules 52/52. Screenshot confirmed the look.
  **Not verified:** real-thumb feel and timing on a phone.

- **D.7 · Kit de-branding** — replace the Adidas three-stripe with an original trim
  motif on the grayscale masters, then re-bake every team (rolls up 0.3's kit half).
  **Done when:** a duel plays with animated, correctly-facing, correctly-kitted
  sprites, and the same player is recognisable in-field, in-duel, and in-portrait.

---

## PHASE E — Untouched for now

Story mode, cup, tournament, online, audio replacement. Explicitly parked. Reason:
polishing the core loop is what decides whether this sells; content volume is what
decides how long people play *after* they've already decided to buy.

Audio note: the "every AI game has the same pling" comment is real — those are Web
Audio oscillator sounds. Replacing them with actual recorded/generated `.mp3`s is a
one-afternoon job whenever we want to kill that tell. Parked, not forgotten.

---

## Blender / Unreal via MCP — recommendation: **no, not now**

- **Unreal:** irrelevant to this project. It would mean rewriting the engine. Skip.
- **Blender:** there *is* a legitimate technique here — pose a low-poly mannequin,
  render front/back/three-quarter at fixed lighting, and pixelise those renders into
  a consistent sprite base. It guarantees the front and back sprites are the same body
  at the same proportions. **But** it's a whole pipeline to stand up, and only *two*
  poses are needed.
- **Verdict:** do D.1 by hand/AI first. If the front and back masters refuse to agree
  on proportions after a couple of attempts, *then* stand up the Blender pipeline — at
  that point it pays for itself. Not before.

---

## Suggested order of attack

```
0.2 ✅ → 0.3 🟡 → 0.4 ✅       (quick wins, clears cheap criticism)
A.1 → A.2 → A.3                (art direction locked before building anything new)
B.1 → B.2 → B.3 → B.4          (input layer, unblocks gameplay)
C.1 → C.2 → C.3 → C.5          (feel; C.4 cross/header after)
D.1 → D.2 → D.3 → D.4 → D.5 → D.6 → D.7
```

Phase A is deliberately before Phase D: if the palette isn't locked first, every
sprite baked in D has to be re-baked.

**Blocked on the user:** 0.3's name replacement — see `BRAND-AUDIT.md`.

---

## 2026-09-19 — ASTRA stadium atmosphere revision (Codex/Astra)

**Applied locally:** `ult11-stadium-classic.js?v=3`, `ult11-pitch3d.js?v=104`, and the corresponding `index.html` tags. No game.js change: current v182 and Claude's keeper/header/corner work are preserved. ASTRA STADIUM remains the default, internal key `classic-upgraded`; `astra` alias preserved. This supersedes the crowd-color and generic-flag details in Part 2l, not its historical record.

- **Team identity:** `SUPPORTER_PALETTES` defines primary/secondary/accent colors for every current national team (Italy azzurro, Holland orange, Germany white/black); clubs read existing `CR_CLUBS.colors`, unknown teams fall back safely. Team identity uses `homeKey` / `awayKey`, independent of hard-coded home/away UI blue/red. Each supporter has ~55% primary, 13% secondary, 8% accent, 24% varied everyday clothing. Home/away affiliation mixes gradually across the main stand and favors each end. Seats use subdued neutral stadium colors, not two bright team-colored blocks.
- **Original pixel flags restored:** removed the 20 procedural striped flags from the adapter. Renderer uses its existing eight-frame team PNG animation, now 8 flags per team, upright at front-row/end-stand positions rather than buried in the seating rake. Existing frame phases and wave speed remain authoritative.
- **Opaque structure:** `buildStandShell()` adds treads, risers, continuous under-decks, concourses and rear walls. Added 17,488 triangles in 13 sector batches; foreground pieces inherit the existing camera-clearance sectors. Existing GLB is unchanged. Structural vertex shading darkens undersides, with a foot-to-head brightness gradient for the crowd. This is inexpensive baked-style shading, NOT a new real-time shadow-map system.
- **Atmosphere:** the upgraded bowl now enters the renderer's existing effects pipeline: 440 seat-aligned possible camera-flash positions in one Points batch, 13 floodlight banks and 9 roof halos, honoring existing graphics switches. These are emissive fixtures/halos using existing scene lights, not 13 additional dynamic lights. No full-screen flash.
- **Crowd retained:** 12,359 spectators, 1,559 motion-eligible; distance fades animation. Crowd alone now 13 batches (generic flag batches removed). Goal cheers, recoloring, cancellation/disposal and camera-sector behavior retained. `U11_CLASSIC.inspect().crowd.flags` is zero because pixel flags belong to the renderer, not the adapter.

**Validation:** syntax checks on both JS files; actual r128 GLB integration tests passed for crowd bounds, palette samples, recoloring, camera sectors, goal reaction/expiry, texture disposal and cancelled load. Live Italy/Germany match visually inspected: mixed crowd, front-row pixel flags, solid stand backing, lamps; no browser errors reported. The latest renderer/index were re-read and the targeted stadium changes rebased over concurrent Claude edits before application.

**Still to verify:** phone frame time with added terracing/lighting, flags during both supershot camera paths, and live Netherlands/club palette appearance. No claim of target-device performance validation for this revision. No deployment performed.

**Evidence/backups:** Codex workspace `outputs/stadium-atmosphere/` contains `tests.json`, `in-game.png`, initial `before/`, and latest-original `pre-apply/`. Test script: `work/test-atmosphere.cjs`.


## 2026-09-20 — Free-kick decisions and corner controls (Codex/Astra)

**Files:** `game.js?v=183` (from v182) and its `index.html` script tag. Local implementation complete; phone/controller feel remains to verify. Existing stadium, keeper QTE, corners and aerial rules preserved.

**Cause:** `rollFoul()` placed a wall, then called `liveResume()`, returning the CPU to its normal carrier/dribbling AI. There was no dead-ball action state for human free kicks either.

**Change:** `freeKickBegin/Tick/Take` now own phase `freekick`. The taker and ball stay stationary until a kick is chosen. Existing restart-distance enforcement remains active through setup and kick wind-up; nearby kicks retain the four-player wall. Human action buttons stay visible: PASS (triangle/Q), CROSS (circle/R), SHOOT (square/E), and eligible super shots. Stick/direction input aims passes/crosses using the existing directional selection; shooting reuses existing shot physics and miss rules, not a new curve/power meter. No new UI layout: existing action diamond and commentary provide instructions. Jump/sprint/switch are dimmed during setup; jumping cannot consume a set piece.

**CPU:** decides after ~1.6s: central scoring-range kicks favor shooting (72% initial preference), wide attacking kicks favor crosses to eligible onside box targets (82%), deep kicks choose a passing lane. No dribble choice. Samples of 300 decisions per scripted situation: close central 219 shots / 43 crosses / 38 passes; wide 252 crosses / 48 passes; deep 300 passes. These are test distributions, not measured match frequencies.

**Corners:** PASS now executes the existing short-corner option; CROSS retains aimed delivery and touch zone targets; SHOOT allows a difficult direct attempt using normal shot rules. Corner passes/crosses preserve their no-offside exemption and existing header system. Existing CPU corner targeting and 10s human corner timeout are unchanged. Paused corner delivery is blocked.

**Validation:** `node --check` passes; jsdom tests execute current game code and the actual `rollFoul` delayed callback, stationary taker, four-man walls in both halves, all three free-kick releases, CPU choices/execution, corner short/cross/shot paths, offside exemption, pause guard, stale restart cleanup and visible PASS/CROSS/SHOOT controls. Existing `lab/test-aerial.js`: 31/31 passed. Evidence in Codex workspace `outputs/set-pieces/tests.json`; reproducible harness `work/ai-test/set-pieces.cjs`; original backups in `outputs/set-pieces/before/`.

**Next checks:** real phone and physical controller aiming/button feel, shot balance against walls and keeper, wide free-kick receiver positioning, and corner direct-shot difficulty. No live visual or hardware playtest claimed for this pass; no deployment. PvP set-piece device routing was not extended in this single-player patch.


## 2026-09-23 — SUPER SHOT CINE3: mockup port, catch-up entry (Claude)

**Why this entry exists:** `ult11-pitch3d.js` went v104 -> v110 and `ult11-cine3.js` reached v6 (last edited 2026-09-23 09:51) with no ROADMAP/CHANGELOG entry. This records the state found on disk; it was reconstructed from the code, not from a session log. No per-version breakdown of pitch3d v105-v110 is available.

**Approved mockup:** https://claude.ai/artifact/6XeJF1sCLn6ZgKK5ZeaZtD. A local copy is now at `lab/lab-supershot-mockup.html` (added 2026-09-23 as the reference; it has Replay / Super / Curve / Drive / half-speed / bloom / aura-colour controls, plus `window.__cine` for scrubbing).

**What is on disk now** (`index.html`: `ult11-cine3.js?v=6`, `ult11-pitch3d.js?v=110`, `game.js?v=183` unchanged):
- `ult11-cine3.js` (new module, `window.U11_CINE3`, kill switch `U11_CINE3.on=false` -> the old drawHoldFx path runs). Ported from the mockup in five drops: CHARGE (sprite-outline aura on the live sheet cell, energy pillar, ground seal, motes/embers/levitating pebbles, letterbox + vignette + speed lines + bolts + name slash, orbiting charge camera, held-breath desaturation), IMPACT (0.2s wind-through on super-row cols 7-8, contact + 0.17s hit-stop, invert/grey impact frame, manga burst, shockwaves, sparks, pebbles blown out), FLIGHT (comet ribbon + two spiral strands sampled along the real flight path, ball shell + glow, streaks, drive-apex beat), CAMERA (strike cut, per-shot chase: super / curve / drive, angled goal frame), ARRIVAL (net hit or save burst, goal flash). A full-screen "night veil" (`U11_CINE3.veil`, 0.6) darkens the lit world under the FX. All sizes are in mockup metres scaled by `S = bodyHeight/1.8`.
- `ult11-pitch3d.js` hooks: `_c3on()`, `_c3view()` (fov 42, tilt-shift off, key/fill lights x `P3D._c3dim`=0.5 for the shot), `cinePathW()` (flight path sampling for the comet), holdFrame/impact/flyFrame/flyCam/arrive calls from `cineCamera2` / `superCine2.fly` / `cineStep2`, bloom forced on for the length of a cine3 shot even when the quality monitor has switched the composer off, mockup drive arc in `shotArc` (line ~1630), line-grid net in `buildGoals` (line ~498).

**Measured against the mockup 2026-09-23** (local server, Japan v Germany, frames recorded every 100ms from the GL + FX canvases; mockup recorded the same way):
1. **Run-up missing.** The mockup opens with a 0.9s side-on run to the ball; the game starts on the charge.
2. **Charge framing.** Other players stay in the shot. In the test, a team-mate stood between the camera and the shooter for most of the charge. The mockup shows only the shooter.
3. **Flight too long, trail overexposed.** Impact -> keeper took ~2.4s in game (slow-mo ramp `P3D.cine.slowMo` + `dur=1.6/speed`) vs 1.35s in the mockup, and the comet reads as a white-hot blob instead of a thin coloured tail.
4. **Flow differs.** The game parks the ball in front of the keeper for the GK duel menu (`mode='wait'`); the mockup flies straight into the net with the keeper diving.
5. **Outcome barely shown.** Goal leg (`mode='out'`) is 0.85s before `onDone`; in one test the save/loose-ball path ended the cine from `wait` with no outcome shot at all.

**Status:** port wired and running without errors; NOT yet matching the mockup. Next: fix 1-5 one concern per edit, verify each with the same frame recording.


## 2026-09-23 — SUPER SHOT CINE3: now plays like the mockup (Claude)

**Files:** `game.js?v=184` (from 183), `ult11-pitch3d.js?v=111` (from 110), `ult11-cine3.js?v=7` (from 6), `index.html` tags. New reference: `lab/lab-supershot-mockup.html` (copy of the approved artifact).

**Author decision (2026-09-23): "decide first, then play".** Against an AI keeper, the save is rolled at the kick, so the flight plays straight through like the mockup. A human keeper (CPU super shot) still gets the duel menu + QTE with the ball parked in front of him. PvP is unchanged.

**Changes (fixes 1-5 from the entry above):**
1. **Run-up.** `U11_CINE3.runUp` 0.9s: side-on camera tracking the shooter as he runs ~6.8 mockup-m into the ball on the run row (`cine3 runUpFrame`, run frames forced in pitch3d `cineStep2`). The hold is now `superHoldMs()` = runUp + charge (0.9 + 2.4 = 3300ms) in both `superShotCine` and `superCineFromDuel`; 2250ms when cine3 is off. The charge holds super col 6 throughout, as in the mockup (cols 7-8 stay the strike).
2. **Two-hander.** `syncPlayers` hides every sprite except the shooter, the defending keeper and a committed super-block defender while a cine3 shot runs.
3. **Flight.** A decided flight (`fly(..,{decided:true})`) runs `U11_CINE3.flyDur` = 1.35s with the mockup ease (0.32f + 0.68f^2), with no slow-mo ramp; `cineEase()` is shared with `cinePathW` so the comet follows the same path. The keeper dives during the last 45% of the flight.
4. **Straight through.** `superCine2.finish()` arriving during hold/fly is held (`_pendOut`); on arrival the flight goes straight into `out`, with no `wait`. The out leg lasts as long as the arrival speed needs (`cineOutDur`, 0.06-0.4s), and a goal carries on 1.45 mockup-m into the back of the net.
5. **Outcome held.** A decided goal holds the goal shot 1.6s (`goalHold`) and a save 1.0s (`saveHold`) before game.js takes over; previously the handover came 0.85s after the out leg started. The goal camera is the mockup's: 7.5 m out and 5.4 m to the side of the net hit, drifting in, looking at the hit depth (`flyCam` out branch; needs the new `kwx/kwz` args).
- `silentShotDuel()` (was dead code) is now the decide-first resolver: AI keeper pick + the AI QTE roll via `gkQteThen(resDuel)`. A non-stopping super block's power loss (`G._ssWeaken`) is applied at the kick so it counts. It returns false if it can't run, and the flight then falls back to the duel menu on arrival (`G._ssPre`).
- **Scale fix:** cine3 sizes are mockup metres on a 4.3 m cell / 1.8 m body. pitch3d now hands cine3 `_c3hh()` = cell height x 1.8/4.3 instead of `PLEN*spriteFrac`, because the measured body share (`hRef`) is clamped at 0.5 and every effect came out ~19% too big for the shooter (S 0.78 -> 0.65 in the test).
- `P3D.cineState()` now also reports world `ball`, `goalW`, `keepW`, `shotW`, `decided`, `ot` (framing checks).

**Validation (local server, desktop Chromium, Japan v Germany; GL + FX canvases recorded every 100ms, same recorder as the mockup):** `node` syntax check on all three files. Decided **goal**: run-up -> charge -> held breath -> strike -> 1.35s flight -> into the net -> flash + waves + net burst -> 1.6s goal frame -> goal banner, kickoff, score 1-0. Decided **save**: finish held at 4.27s, out, `arrive save`, save banner, `afSave` at 7.8s, play resumes. **Human keeper** (CPU super shot): parks in `wait`, gk-mode duel menu shows, Save + timed-out QTE resolves (goal), no stuck `_cineHold`. No console errors (404s are the game's usual optional-asset probes). Test forcing used: `canSuper=()=>true` (the test carrier wasn't super-eligible, so resDuel downgraded it to a normal shot), `calcDefencePower` forced for the goal run, `cpuWantsSuperCine=()=>false`.

**Remaining risks / next checks:**
- **Phone:** run-up + charge at 3.3s; frame time with the hidden-sprite loop is trivial, but the whole cine is not yet measured on the author's phone.
- The aura / trail colour is the shooter's trail colour (gold for most players), not the mockup's default cyan. That's intentional per player, but it reads hotter/whiter under bloom than the mockup's cyan.
- The keeper stands ~1.4 world units off his line (`cineGkNudge`), so in the goal frame he's ~30% larger than in the mockup.
- A non-stopping super block resolves at the kick with the weakened power; its "blown away" beat still plays mid-flight.
- The human-keeper route still parks by design. A QTE-during-the-charge version would let it fly straight through too (not built).


## 2026-09-23 — MATCHDAY UI: integration finish and loading presentation (Codex/Astra)

**Intent:** preserve and finish today's reference-image remakes for Team Select, Team Management, the in-match pause menu and Full Time, while fixing the unfinished loading screen and ensuring the new management screen is the one the friendly flow actually opens.

**Catch-up state found on disk:** `game.js?v=188`, `style.css?v=98`, `index.html`, `loading-runner.jpg` and `loading-ball.jpg` had been edited at 21:36–21:39 without a ROADMAP or changelog entry. The code already contained the reference-based Team Select renderer, native `#s-team` management screen, three-column `#pause-overlay`, `#s-end` Full Time layout and staged loading progress. These edits were preserved. The current renderer/stadium tags (`ult11-pitch3d.js?v=112`, `ult11-cine3.js?v=7`, `ult11-stadium-classic.js?v=5`) were also preserved unchanged.

**Delivered files and cache versions:**
- `index.html`: `game.js?v=189`, `style.css?v=99`, `ult11-kitrun.js?v=4`. Removed the `ult11-team.js?v=5` script tag from the active page. The legacy file remains on disk.
- `game.js?v=189`: Team Select kit-preview canvas height is 90 instead of 52 so the pixel scene remains readable in the 16:9 layout. No match AI, physics, super-shot or set-piece logic changed.
- `ult11-kitrun.js?v=4`: removed the opaque green canvas fill and drifting stripe band; runners now sit transparently on the stadium/pitch artwork around a centre ball with contact shadows and a subtle light pool.
- `style.css?v=99`: loading uses `assets/wallpaper/teamselect.png` with readable stadium dimming and a glass content panel. The runner uses the actual side-run animation row and is positioned behind the rotating ball. Team Select's canvas is integrated into the pitch band without the green rectangle.
- New assets `loading-runner.png` and `loading-ball.png`: true-alpha conversions of today's JPEG sprite sheets. The JPG originals remain untouched as backups. The PNGs are necessary because the JPEG black background rendered as two black boxes in the live browser.

**Integration bug fixed:** `ult11-team.js?v=5` installed a delayed wrapper around `openTeamMenu()` and intercepted the Friendly confirm action. This made the older TEAM FORMATION overlay appear even though the new reference-based `#s-team` screen was complete underneath. Retiring that script tag restores the native `openTeamMenu()` flow and its existing formation, auto-pick, reset, starter/reserve swap, player-detail and kick-off wiring.

**Validation:**
- `node --check game.js` and `node --check ult11-kitrun.js` pass.
- Local-browser build stamp: `css v99`, `tok v8`, `js v189`, AI READY.
- Live route passed: title/disclaimer → home → Team Select → staged loading → native Team Management → loading → match kickoff → keyboard Escape pause.
- Visual checks passed for the transparent Team Select vignette, stadium-image loading screen with alpha runner/ball, reference-based Team Management board, and the two squads + central Match Menu pause layout. No new console failure was observed during this route.
- Full Time HTML, data IDs/actions and final CSS were source-checked. A full live 90-minute completion was not replayed during this pass.

**Remaining risks / next checks:**
- Verify Full Time after one naturally completed match, especially winner art fallbacks and the optional expanded MATCH DATA rows.
- Check Team Select and loading scale on the author's phone. The small runners are intentionally secondary to the hero art, but may need one phone-specific size adjustment.
- Test physical-controller navigation across the new Team Select, management, pause and Full Time buttons; gameplay controller mapping was not changed here.
- `ult11-team.js` is now an inactive legacy file. Delete it only after the author confirms no separate standalone use is needed.


## 2026-09-23 — TEAM SELECT rebuilt from the approved mockup (Claude)

**Files:** new `ult11-teamselect.js?v=1` (loaded after `ult11-kitrun.js`), `game.js?v=190` (from 189), `index.html`, new `assets/wallpaper/teamselect2.jpg` (author's background, saved from the chat paste; drop the original over it for full quality). Mockup: `lab/lab-teamselect.html`, signed off by the author ("this is golden").

**Screen:** stadium background lifted so the idle sprites stand on the grass; waving flags behind each side (two open wings, CSS-only animation, off under reduced-motion); captain art (`assets/team/captain-{key}.png`, hidden when missing) fading out where the sprites start; team name in Cinzel 900; OVR box + ATT/MID/DEF/SPD bars (Bold Pixel numerals, real `calcTeamOvr` / `calcOvr` / starter spd); 2 kit tiles, HOME drawn in the team palette (`U11_CLASSIC.supporterPalette` / `CR_CLUBS.colors`), AWAY = NOT AVAILABLE; idle sprite from the same sheet pitch3d uses (`assets/ps1/{key}.png`, else home/away), row 0 at 4 fps, no ball; centred NATIONALS / CLUBS / SPECIAL tabs; flag carousel (clubs + All Stars use `setTeamEmblem`); no taglines, no "Ultimate Eleven" logo.

**Wiring:** the module takes over `syncTeamSelections()` and the old `window.ts*` globals. The FIFA-style block at the end of game.js is now DEAD CODE (to be removed in a cleanup pass). game.js change is 3 lines: `_navStep` / `_navConfirm` / `_navBack` delegate to `window.TS2` while `#s-ts` is active. Pad: stick/d-pad moves the carousel, X confirms (home -> away -> Team Management), O back (away -> home -> `exitToMenu`), L1/R1 (SWITCH / SPRINT) category, square (SHOOT) random. Keyboard: arrows, Enter, Backspace, PageUp/PageDown. Touch/mouse: tabs, carousel, arrows, footer hints.

**Font rule (author, fixed):** only Cinzel / Rajdhani / Bold Pixel, anywhere, mockups included. Added to SKILL.md as hard rule 8.

**Validation:** node syntax check; live game on the local server: 23 nations render with real data, Italy OVR 82 / Germany 80; step, confirm home, away step, Clubs tab (Barcelona), back, confirm -> `s-team`; back from Team Management redraws the same pick; `startGame()` from there runs Argentina v FC Barcelona. No console errors.

**Next checks:** phone layout and touch (the stage is a 1920x1080 design scaled into `#s-ts`, 1280x720 here); pad on real hardware; most clubs have no captain art; clubs use the generic home/away idle sheet; PvP toggle (`_pvpInjectToggle`) had no anchor on the old screen either.


## 2026-09-24 — TEAM MANAGEMENT rebuilt from the approved mockup (Claude)

**Files:** new `ult11-teammanage.js?v=1` (after `ult11-teamselect.js`), `game.js?v=191` (from 190), `index.html`. Mockup: `lab/lab-teammanagement.html` (author-approved after 6 review rounds).

**Screen:** captain hero + team name (Cinzel), left ladder menu FORMATION / TACTICS / MARKING / AUTO-CHOOSE (selected row = slanted blue bar); tilted pitch board on a dark fading box, every player a HEAD-CROP card (same `headBox` crop as the in-match bust; keepers use their keeper art) framed in role colour: GK gold, DEF blue, MID green, FWD red; cards never overlap (nearer card steps down, verified 0 overlaps in all 4 formations); bench of 4 (1 GK + 3) directly under the pitch, head crops too; right player panel with cut diagonal corners, wide face crop, jersey, role, OVR, 6-stat radar (GK: SAV/REF), status + special skill; glowing KICK OFF bottom right.

**Behaviour:** reads/writes the engine's own `HOME_SLOT_ASSIGN`, `HOME_RESERVES` (normalised to [GK, 3 field]; extra reserves are left out), `activeHomeFormation` (+ career formation, `crSave`). Every swap asks for confirmation (CONFIRM SWAP / CONFIRM SUBSTITUTION); keeper seats only swap with keeper seats. AUTO-CHOOSE = engine `initHomeSlots(false)` + best spare GK + 3 best outfield. MARKING opens a board: pick your player, then the opponent he marks (one marker per opponent, CLEAR ALL, DONE). KICK OFF -> `startGame()`, or `pzCloseSquadEditor()` from the pause menu (label APPLY & RESUME). BACK -> `teamEditorBack()` (pause / career / story / cup / team select). The module overrides `buildFormationMenu()`; the old #s-team markup/helpers are dead (`openFormationPicker`, `buildReserves`, drag & drop) - cleanup pass later. game.js: the 3 nav hooks now delegate to TS2 or TM2.

**Pad:** stick/d-pad moves the focus; triangle (PASS) toggles MENU <-> PLAYERS; X selects / swaps / confirms; O cancels / back; L1/R1 formation; square auto-choose (in the marking board: clear that player's mark); Start = KICK OFF. KICK OFF is also the 5th stop in the menu column. Keyboard: arrows, Enter, Backspace, PageUp/PageDown, Q/E (the same actions).

**NOT YET IN THE MATCH:** TACTICS and MARKING are saved on `HT._tm = {tac, marks:{slot: opponentId}}` but the AI does not read them yet (the engine's stance is `teamStance()`, automatic). Wiring them into moveOffBall / marking is the next engine step.

**Validation:** node syntax checks; live game (local server): Team Select -> Team Management shows Italy XI + bench [Gino, Sereni, Impero, +]; pad-path swap Corsaro <-> Sereni with confirm -> `HOME_SLOT_ASSIGN.CM3` = Sereni, bench updated; R1 -> 3-5-2; marking CB2 -> Falkner saved (`HT._tm.marks = {CB2:109}`), menu shows "1 SET"; KICK OFF -> match starts with Sereni at CM3 in 3-5-2; pause -> SQUAD -> APPLY & RESUME returns to the paused match. No console errors.

**Known / next:** pre-existing: `openTeamMenu()` resets formation to `HT.formation` and the bench to `HT.reserves` every time it opens (also mid-match from pause). Players without duel front art use the team's front art (Sereni, Impero, Gino fallback chain). Phone layout / touch and a real pad still to test.


## 2026-09-24 — PAUSE MENU rebuilt from the approved mockup (Claude)

**Files:** new `ult11-pausemenu.js?v=2` (after `ult11-teammanage.js`), `ult11-teamselect.js?v=2` (exposes `TS2.flagSVG(key)` for the scoreboard flags), `game.js?v=192` (nav hooks now also delegate to PM2), `index.html`. Mockup: `lab/lab-pausemenu.html`.

**Screen:** both teams on the Team Management board (head-crop cards in role colours, collision-free, 4-man bench); the CPU side uses its own `activeAwayFormation` / `aSq` / `AT.reserves` and its faces are mirrored; captains (`captain-{key}.png`) fade behind the pitches; team names centred on each board's bar; scoreboard with flags (clubs: `setTeamEmblem`), score, `#htime` and half, "PAUSED". Header shows your formation + tactic (`HT._tm.tac`) and the CPU formation.

**Behaviour:** takes over `pzBuildAll()` (called by `togglePause()` and `pzCloseSquadEditor()`). Menu keeps every old action: SUBSTITUTIONS -> `pzShowSquad()` (Team Management, APPLY & RESUME), MATCH FACTS -> `pzShowMdata()` (panel ids kept), HOW TO PLAY, SETTINGS, RESTART, FORFEIT, RESUME -> `togglePause()`. The duplicate "Formation & Squad" row (same function as Substitutions) is gone. The old overlay had NO pad navigation (menu nav is off on s-match); now stick moves, X selects, O resumes / leaves Match Facts. While paused, the kick-off prompt (z 8200), `#hud-chips` and the busts are hidden (`body:has(#pause-overlay.show)`). Old `pzBuildHeader` / `pzBuildSide` / `pzLoadCardImg` are dead.

**Validation:** node syntax checks; live match (local server): pause renders 11 + 10 cards (Germany 3-5-2, bench Meyer), score / clock / half correct, kick-off prompt hidden; pad path: step to MATCH FACTS, X opens 6 stat rows, O back; SUBSTITUTIONS -> s-team with APPLY & RESUME -> back to the paused menu; RESUME MATCH unpauses. No console errors.

**Known:** the overlay covers the 16:9 stage only (as before) - on a non-16:9 window the 3D world shows above/below it. `:has()` needs Chrome 105+ / Safari 15.4+ (older browsers just keep the prompt visible). Phone + real pad still to test.


**Follow-up 2026-09-24 (`ult11-pausemenu.js?v=3`):** the kick-off prompt (#kickoff-prompt, on #viewport) stayed visible on the loading screen and in Team Management when opened from the pause menu before kick-off (author report). A style injected at load now hides it unless `#s-match` is the active screen and the game is not paused. Verified: live match visible, paused hidden, s-loading hidden, s-team hidden, visible again after APPLY & RESUME.


**Follow-up 2026-09-24 (`game.js?v=193`):** the kick-off button now just says KICK-OFF (was "TAP PASS TO KICK OFF"); the CPU's reads "{TEAM} KICK-OFF". Both use the UI font `var(--u-font-ui)` (Rajdhani); they had no font set and fell back to the browser default. Verified in a live match.


## 2026-09-24 — FULL-TIME SCREEN rebuilt + new match stats (Claude)

**Files:** new `ult11-fulltime.js?v=2` (after `ult11-pausemenu.js`), `game.js?v=194` (from 193), `index.html`. Mockup: `lab/lab-fulltime.html` (approved; author asked for passes / pass accuracy / tackles / corners and a MAIN MENU tile that shows the heads).

**Engine (game.js):** `makeG()` gains `st:{h,a}` (passA, passC, tkl, crn) and `goals:[]`, plus `_stat(side,k)`. Counted at: `launchPass` after the offside check (attempt), `tickPhysicalPass` clean first touch by a team-mate (completed), `startLunge` when a lunge starts + `resDuel` when the defender chose a tackle (tackles), `startCorner` (corners). `afGoal` logs `{s, name, min}` with the minute read off `#htime`. The pause menu's Match Facts PASSES row showed `G.hP` (possession spells) - now completed passes.

**Screen:** winner captain in full colour + WINNER (Cinzel) and team name, loser greyed/dimmed, a draw dims nobody; FULL TIME board with cut corners: flags (`TS2.flagSVG` / `setTeamEmblem`), score in Bold Pixel (winning number glows), scorers + minutes, 9 stat bars (possession, shots, passes, pass accuracy, tackles, duels won, corners, fouls, offsides); picture tiles REMATCH (`startGame`), CHANGE TEAMS (`showSc('s-ts')`), MAIN MENU (`showSc('s-home')`, art anchored at 12% so the heads show). The old MATCH DATA button is gone (stats are always visible). Wiring: wraps `showSc` and renders when `s-end` shows; hidden stand-ins keep the ids `goFull()` writes (fth, fta, wtag, ueEndStats...). Career / cup / story full-time routes are untouched (they return before `s-end`). Pad: stick moves the tiles, X confirms (FT2 in the game.js nav hooks). Touch pad / busts / chips / kick-off prompt hidden on s-end.

**Validation:** node syntax checks; live match: after ~30s of play `G.st` = h {tkl 2}, a {passA 4, passC 3, tkl 3}; goals through `afGoal` logged with minutes; `goFull()` -> 2-1 WINNER ITALY, Germany captain dimmed, scorers listed, all 9 rows filled; second run 1-1 draw: nobody dimmed, no WINNER; pad: step to MAIN MENU + X -> s-home. No console errors.

**Known:** pass counts only cover physical passes (launchPass); aerial/header touches and duel-resolved passes that don't go through launchPass are not counted. Minutes come from the on-screen clock text. Phone still to test.
## 2026-09-24 — Touchline throw-ins and selectable keeper distribution (Codex)

**Intent:** keep ball-out restarts and goalkeeper possession under player control instead of awarding a touchline ball straight to a carrier or forcing a keeper throw after 650 ms.

**Files/cache:** `game.js?v=195` (from v194), `index.html` cache tag v195. The pre-edit original is `game.js.pre-throwin-gk-v194.bak`. No Opus/Claude UI modules or stadium files were changed.

**Gameplay:** physical passes and loose balls already crossed the field bounds; touchline crossings now enter a `throwin` dead-ball phase with the taker at the correct line and opponents cleared away. PASS throws short; CROSS or SHOOT throws long; aim with stick/keys. Both choices now fly on a `throw` arc, can be intercepted or go out again, and correctly ignore offside from the throw. CPU throw-ins choose short/long after a brief pause; a human throw is released short after 20 seconds to avoid a stuck match. A keeper holding the ball no longer starts the 650 ms auto-throw: PASS rolls short, CROSS sends a long distribution, SHOOT punts, using physical ball flight. CPU keepers still distribute after reading play. Goal kicks exempt their receiver from offside; the keeper stays in his goal area. The touch action labels update for both restarts.

**Validation:** `node --check game.js` passed. A direct gameplay test covered throw-in state/release, keeper choices, goal-kick offside exemption, and a pass crossing the boundary. In a headless Chrome match, an away last touch over the top line awarded a home throw-in, PASS launched a `throw` flight with no offside, a human GK still held the ball beyond the previous auto-throw delay, and CROSS launched a long flight. The local file-based browser lacked the CDN-provided THREE global, so the full 3D stadium presentation was not verified in that run; the gameplay checks had no additional page errors.

**Remaining checks:** play several real matches with the normal 3D/CDN setup; judge throw range/arc, aim and reception under pressure, and keeper distribution feel on controller and phone. The renderer has no dedicated throw-in sprite action, so the taker currently uses its existing pass animation while the ball itself arcs through the air. The away-player controls in optional local PvP still need a dedicated check.

## 2026-09-24 — Keeper catch handoff fixed; CPU throw-in readable (Codex)

**Intent:** fix the player's report that the GK still released the ball automatically and the CPU throw-in was over before its setup could be seen.

**Files/cache:** `game.js?v=196` (from v195), `index.html` game cache tag v196. `game.js.pre-gk-catch-v195.bak` is the pre-fix copy. No UI modules, sprite sheets, or stadium files changed.

**Root cause and fix:** `afSave()` had a separate clean-catch branch that waited 900 ms, changed `G.ck` from GK to an outfielder, and resumed play. It bypassed the keeper-hold code added in v195. That handoff is removed; after the save result, the GK remains the carrier until a human presses PASS/CROSS/SHOOT. The catch ball is shown at chest height while held, and physical distribution starts from that height. A goal kick remains on the grass and uses short/long kick labels rather than a hand-throw label. The delayed catch completion checks the match generation and waits through pause. CPU throw-in preparation now lasts 3 seconds instead of 1, so the taker and restart can be seen before release.

**Validation:** `node --check game.js` passed. A headless Chrome match exercised a forced clean save: the home GK was still the carrier at 1.45 s and 2.35 s, ball height 13, then PASS launched a physical ground distribution. A CPU throw-in was still in `throwin` phase at 1.45 s and had released an airborne `throw` by 3.45 s. The earlier touchline/goal-kick mechanics test passed again. File-based Chrome could not load the CDN THREE script, so 3D sprite placement still needs visual inspection in the normal served game; no other page errors were observed.

**Next check:** play a real clean catch and goal kick with controller/touch; check that the ball appears by the GK's hands and that roll, throw and punt feel distinct. A dedicated GK throw and throw-in sprite animation remains a later art task; both use existing pass frames today.

## 2026-09-24 — Keeper glove attachment and live team movement (Codex)

**Intent:** fix the author's screenshot showing the held ball floating above Donati's glove and every outfield player frozen while the goalkeeper moved with possession.

**Files/cache:** `game.js?v=197` (from v196), `ult11-pitch3d.js?v=113` (from v112), `index.html` script tags. Pre-edit copies: `game.js.pre-gk-support-v196.bak` and `ult11-pitch3d.js.pre-gk-grip-v112.bak`. No stadium, sprite-sheet or Opus menu files changed.

**Root cause and fix:** `tick()` returned early for a keeper holding the ball, before `moveOffBall()` ran. The GK still suppresses open-play shots, duels and auto-distribution for the human, but teammates now run to support, opponents continue their marking shape, the isolated engager jogs back to shape, and pace/pitch bounds remain enforced. The ball's old fixed `bz=13` did not match the billboard goalkeeper's hand at this camera angle. The 3D renderer now uses glove coordinates for each idle/run frame of `gk_cine.png`, mirrors them with the sprite, and positions the held ball against the actual camera-facing sprite. Camera pose/matrix is updated before ordinary sprite and ball sync so the attachment uses the current frame. The first six flight frames blend from the glove to the physical distribution path to avoid a visible snap. A smaller `GK_HAND_BZ=8` is the 2D fallback and physical release height. Goal kicks still show the ball on the grass.

**Validation:** syntax checks passed for both edited JavaScript files. The restart/keeper mechanics test passed. A headless Chrome match forced a clean catch; after a 900 ms hold the goalkeeper still possessed the ball, while 10 home and 9 away outfielders had moved more than one engine unit. PASS then launched the physical distribution. A separate rendered sheet check placed all eight idle/run grip targets on the glove artwork. The local file-based Chrome run could not load the CDN THREE script, so final placement was not visually verified in the full 3D scene.

**Next check:** inspect a real 3D clean catch from both camera sides and while moving; if a specific animation frame still misses the glove, adjust only its normalized entry in `GK_GRIP_UV` in `ult11-pitch3d.js`. Check whether build-out runs are useful rather than overloading the penalty area, and test on a real controller/phone.

## 2026-09-24 — Keeper area reach and possession build-out (Codex)

**Intent:** address the author's screenshots showing defenders crowded inside their own penalty area while the keeper holds the ball, and the keeper stopping short of the outer penalty-area line.

**Files/cache:** `game.js?v=198` (from v197) and its `index.html` cache tag. No renderer, stadium, sprites or menu modules changed. This is a targeted edit on the current original game, preserving the existing v197 glove attachment and other concurrent changes.

**Cause and change:** all three keeper-carrier clamps in `tick()` used a 0.10W depth and 0.30–0.70H width, but the rendered penalty area is 0.16W deep and 0.22–0.78H wide. They now use one `clampKeeperToArea()` helper with a slight inset (0.158W, 0.224–0.776H) for both ends and either half. While a keeper holds possession, `keeperBuildOutTarget()` gives each outfielder a formation- and role-aware lane beyond the penalty area: centre backs 0.205W from their own goal line, full/wing backs at least 0.245W, holding/midfielders farther forward, forwards in their formation channels. Both AI v2 and fallback v1 use these targets; the normal opposing-team marking logic remains active. The players run into shape at normal AI pace and are not teleported.

**Validation:** `node --check game.js` passed. A headless Chrome match held the home keeper for five seconds with all four backs initially at x=0.14W inside the box; they moved to x=0.268–0.325W, beyond the x=0.23W penalty line, with separate lateral lanes. The goalkeeper remained in possession, and simulated forward input reached x=0.228W, near the drawn x=0.23W line. Direct clamp checks gave x=0.228W for the left goal and x=0.772W for the right goal, with y=0.776H at the lower sideline. The local file-based browser could not load CDN `THREE`, so full 3D visual review still relies on the user's normally served match.

**Next checks:** in the normal 3D game, walk a holding keeper to the outer line and side edges; watch both teams' build-out for several seconds in each half and try short/long distribution. Tune lane depths only if the outlets feel too high or too static under pressure. Controller and phone input still need a real-device check.

## 2026-09-24 — Sampled audio replaces placeholder sound synthesis (Codex)

**Intent:** use the author's new `assets/audio` recordings for match and menu events, retiring the temporary synthesized whistles, crowd noise, footsteps, impacts and UI blips.

**Files/cache:** new `ult11-sfx-samples.js?v=1` loaded by `index.html` in place of `ult11-sfx.js?v=5`; `game.js?v=199` (from v198); `index.html` game cache tag v199; audio assets under `assets/audio` are unchanged. Pre-edit copies: `ult11-sfx.js.pre-sampled-audio-v5.bak`, `game.js.pre-sampled-audio-v198.bak`, `index.html.pre-sampled-audio.bak`. The old sound module remains on disk but is no longer loaded.

**Mapping:** the four crowd clips rotate as match ambience; `running.mp3` follows the moving carrier; `Tackle.wav`, `ball_catch GK.wav`, `aerial_shoot.wav` and `Pre Special Move Sound.wav` cover tackles, clean catches, kicks/shots and super-shot charge/release. The start, foul, goal, halftime and final whistle files are triggered by their matching match events. `pause_open.wav`/`pause_closed.wav` follow pause state; `cursor.mp3`, `confim.mp3` and `Cancel.ogg` serve menu navigation/selection/back. The master-volume setting now controls SFX as well as music. `match1.mp3` is the only active match track; the picker no longer selects missing match2/3 files. Existing `menu.mp3` and `match1.mp3` remain because no new replacements were supplied for them. `cursor1.wav` is an unused alternate to `cursor.mp3`.

**Validation:** syntax checks passed for `game.js` and the new sample module. Headless Chrome invoked every mapped one-shot and logged the expected local file requests; a live match requested `match1.mp3`, the start whistle, `crowd1.mp3` and `running.mp3`. Changing Settings master volume to 35 updated `SFX.master` to 0.35. No page errors beyond the known file-based CDN `THREE` absence were observed in that test. Real listening balance and mobile autoplay behavior still require testing in the normally served game.

**Next checks:** listen on the target device and tune levels for crowd/music/shot overlap, especially whether `aerial_shoot.wav` is suitable for routine passes; confirm keyboard, pad and touch menu navigation sound coverage; test crowd clip transitions and pause/resume during live play.

## 2026-09-24 — Halftime now uses the pause menu and freezes play (Codex)

**Intent:** replace the obsolete crest/substitution halftime page from the author's screenshot with the current pause-menu layout, ending with SECOND HALF KICKOFF, and stop gameplay continuing behind halftime.

**Files/cache:** `game.js?v=200` (from v199), `ult11-pausemenu.js?v=4` (from v3), and their `index.html` cache tags. Pre-edit copies: `game.js.pre-halftime-v199.bak`, `ult11-pausemenu.js.pre-halftime-v3.bak`, `index.html.pre-halftime.bak`. Existing audio, stadium, team management and full-time files were not changed.

**Root cause/change:** `goHalf()` cleared the match-clock interval but left `G.mt` non-null, `G.paused=false`, and `G.kickoffUntil` stale. The idle watchdog could therefore call `resume()` and restart play behind the `s-half` screen. Halftime now clears and nulls the clock/cinematic timers, marks the match paused and `_halftime=true`, invalidates delayed goal/free-kick callbacks, hides the kick-off prompt, and opens the existing `#pause-overlay` on `s-match`. `PM2` renders its normal score, team boards, menu and navigation with HALF TIME labels and replaces RESUME MATCH with SECOND HALF KICKOFF. Touch action buttons and the match commentary strip hide under the overlay. `togglePause()` cannot dismiss halftime. Substitutions open Team Management with APPLY & RETURN, then come back to the still-frozen halftime menu. `secondHalf()` is the sole continuation path; it closes the overlay, starts the second-half clock/music and arms the away kick-off. The old `s-half` markup remains in the files for now but is no longer entered by the match flow.

**Validation:** syntax checks passed. In headless Chrome, natural clock expiry showed the PM2 overlay with the seven expected entries and no visible action pad. After 3.4 seconds, all home player coordinates, clock and idle phase were unchanged; `G.mt` remained null. Substitutions opened `s-team` with APPLY & RETURN, returning to the frozen overlay. Selecting SECOND HALF KICKOFF set `G.half=2`, removed the overlay, unpaused, restarted the clock and armed the away kick-off. No page errors beyond the known file-based CDN THREE absence. A full 3D visual/playtest in the normally served game remains to be done.

**Next checks:** real controller/touch navigation at halftime, edits from Team Management, and normal served-game visual framing; test a natural clock rollover during a duel or set piece and a second-half kick-off with the away CPU.

## 2026-09-24 — Separate short-pass and cross recordings (Codex)

**Intent:** stop using the aerial-shot recording for routine passing now that the author has supplied `short-pass.mp3` and `cross.mp3`.

**Files/cache:** `ult11-sfx-samples.js?v=2` (from v1) and its `index.html` cache tag. `game.js` stays at v200; the new audio files under `assets/audio` were not modified. Pre-edit copies: `ult11-sfx-samples.js.pre-pass-cross-v1.bak` and `index.html.pre-pass-cross.bak`.

**Change:** the sample watcher now reads `ballTravel.physicalPass` and `ballTravel.kind` when `pass_anim` begins: `ground` plays `short-pass.mp3`, `cross` plays `cross.mp3`, and `throw` plays no kick sound. An actual shot with `_shotTrail` still plays `aerial_shoot.wav`. It no longer uses the possibly stale `_shotZone` to classify an animation as a shot. The temporary `whoosh()` fallback that played `aerial_shoot.wav` on jumps/tackle windups is silent until a real whoosh recording exists.

**Validation:** `node --check ult11-sfx-samples.js` passed. Browser smoke test `smoke_pass_cross_audio.cjs` in the Codex workspace forced each actual watcher classification and observed exactly the intended file requests: short pass, cross, silent throw-in, aerial shot, and silent whoosh, with no unexpected page errors. The supplied `short-pass.mp3` and `cross.mp3` have distinct file hashes.

**Remaining risks/next checks:** listen in a normally served match to set pass/cross levels against crowd and music, including controller and touch actions. This test verified dispatch, not subjective loudness or synchronized kick contact. If a header or other shot path enters `pass_anim` without `_shotTrail`, it will now be silent rather than borrowing the aerial-shot clip; audit that path during play.

## 2026-09-24 — GK ROADMAP steps 1-2: audit + afSave double adjudication fixed (Claude)

**GK roadmap (author, this session):** 1 audit · 2 kill the dormant afSave bug · 3 sheet rows (set, dive L/R low+high, catch, punch, throw/kick) · 4 state machine idle → set → dive/catch → recover → distribute, driven by the real shot trajectory · 5 distribution after a catch · 6 penalty kick (lab mockup first, then engine + P3D.cine camera).

**Step 1 — audit.**
- Live sheet `assets/ps1/gk_cine.png`: 1167x1167, forced to `LGK4` (4x4). 1167/4 = 291.75 px cells, not integral, but every border falls inside an empty gutter (cols 235-355 / 517-646 / 803-937, rows 242-335 / 546-612 / 852-897), so no frame bleeds. Soft alpha (24k partial pixels). Feet padding drifts 0.08-0.23 of the cell between frames; `measureSheet` hides it by anchoring each cell at its lowest pixel.
- In play only rows 0-1 are used (idle, run; `LGK4.rowFor`). No save animation in open play. Rows 2-3 are cinematic only: `GK_POSE` (set / save / beaten) and `GK_DIVE` (side / high / low 4-frame ramps), played by `gkOutcome()`. Direction comes from `pickAim()`, and the lean (`gkTilt`) fakes the dive height.
- `gkCineCell()` hardcodes a 1/4 grid on `cineGkTex` (per-team `{team}_gk_cine.png` → `gk_cine.png`) and does not set the sprite anchor. `heldKeeperGrip()` (Codex, v113) uses `GK_GRIP_UV`, a glove point per idle/run frame of the 4x4 sheet. **Any new sheet has to re-map both of these.**
- Save path: `resDuel` (duel verdict) → lost shot duel with `G.D.isShot` → `afSave(ds)` → catch / parry / spill. A field duel's blocked shot already goes to `afTurn` (older BUG1 fix).
- **New author sheet** saved as `assets/ps1/gk_sheet6.png` (not wired yet): 1536x1680 = **6x6 of 256x280, integral**. Every border sits in a gutter, hard alpha, nothing touches a cell edge, feet pad 0.03-0.05. Rows: 0 set/idle (4) · 1 low dive → landing (6) · 2 high dive → landing (6) · 3 catch/gather (4) · 4 run (6) · 5 throw: ball low, overarm, release x2 (4). Dives face screen-right (mirror for left). Airborne frames (r2 c2-c3, pad 0.16/0.12) are sheet-high on purpose, so they need a **row baseline anchor**, not the per-cell lowest-pixel anchor, or a jump renders on the grass.

**Step 2 — bug.** `afSave()` re-adjudicated a save the duel had already decided. It called `calcDefencePower` again (fresh rng, stamina already drained) with ±9 noise, so a keeper-won duel could return **GOAL** (measured 4 in 9,195 keeper wins with the Italy/Germany squads, ~0.04%) and a clean win drifted into rebounds. It also **charged the keeper's stamina a second time** at full cost, cancelling resDuel's "long shots barely tire the keeper" discount.
**Fix:** `resDuel` stores `G.D.lastDefPow` (after the wall bonus); `afSave` reuses it (it still falls back to a fresh roll if it's missing), drops its own stamina charge, and maps any "goal" to a rebound (parry in the cine flow). The margin now only grades the save.
**Files/cache:** `game.js?v=201` (from v200) + index.html tag. Backups `game.js.pre-gk-save-v200.bak`, `index.html.pre-gk-save.bak`.
**Verified (local, v201 loaded):** syntax ok. 1,600 forced afSave calls: 0 goals queued, keeper stamina unchanged by afSave. 100 v 101 → parry 59% / rebound 41%; 100 v 112 → parry; 100 v 140 → catch. No new console errors (404s are the usual optional-asset probes).
**Next:** step 3. Wire `gk_sheet6.png` behind a layout (6x6, rowFor idle 0 / run 4), with a baseline anchor per row, re-mapped `GK_GRIP_UV`, and `gkCineCell` reading the layout instead of 1/4. Missing art: a **punch** frame (row 5 c2-c3 can stand in) and a **kick/punt** row.

## 2026-09-24 — GK ROADMAP step 3: the 6x6 keeper sheet is live (Claude)

**Author decisions:** no punch art, a **punch reuses the dives**. No catch/kick split for distribution: **every distribution, short or long, is the hand throw**. So the 6x6 sheet covers everything planned.

**Change (`ult11-pitch3d.js` v114):**
- The GK loads `assets/ps1/gk_sheet6.png` with a new `LGK6` layout (6x6). Fallback chain: gk_cine.png (LGK4) → gk.png.
- In play: idle = row 0 (4 frames, 3 fps), run = row 4 (6 frames), pass/shoot distribution = throw row 5 **release frames c2-c3 only**. Cols 0-1 draw a ball in the art while the real ball is already flying.
- `rowBase:[1,2]`: the two dive rows share one ground line and one x anchor. Airborne frames stay in the air, and the art's own sideways travel reads as the dive.
- Glove points per idle/run frame measured from the art (`LGK6.grip`). `heldKeeperGrip` reads the sheet's own table, and `GK_GRIP_UV` stays for the 4x4 sheet.
- Cinematic: `gkCineCell` poses the sprite's own texture on the 6x6 (the old 1/4-grid `cineGkTex` swap stays as fallback). Lanes `GK6_DIVE`:

  | Lane | Row | Cols | Beaten cell |
  |---|---|---|---|
  | side low (h<0.5) | 1 | 0-3 | c5, on the grass |
  | side high | 2 | 0-3 | c5, landed |
  | central high | 2 | 0,1,4,4 | c5 |
  | central low | 1 | 0,4,4,5 | c5 |

  Mirrored for shots to screen-left. The beaten frame is mirrored too. The lean hack (`gkTilt`) is off on the 6x6 because it has real low and high dives.
- Fixes found on the way:
  1. A sprite made before the GK sheet loaded rebound the image but kept the team grid (`o._L` now follows the sheet).
  2. For one frame at the flight→outcome handoff, the keeper snapped back to his set pose. The set pose is no longer re-applied once the dive has started (`c._diveP>0`), and `syncPlayers` holds the cinematic cell (`cine._gkCell`). The old sheet had the same flash.
  3. The v1 cine pre-shot used 'pass', which is now the throw row, so it uses idle.

**Verified (local, pitch3d v114 served):**
- Syntax ok. Both keepers bind `gk_sheet6.png` at 6x6, `hRef` 0.68 (same body size as before). Row-2 anchors all share padB 0.024.
- Forced clean catch: the GK holds the ball on his front glove (screenshot), idle frames 0-3 cycle.
- Super shots, keeper frames sampled every frame:
  - save, low side: 1,0F→1,1F→1,2F→1,3F, held
  - save, top corner: 2,0→2,1→2,2→2,3
  - goal: 1,0→1,1→1,2 → beaten 1,5
- **0 idle flashes** during the dive after the fix (was 1 frame per shot).
- Not visually recorded: the preview pane kept going hidden, which pauses rAF. A real-browser look at the dive is still to do.

**Files/cache:** `ult11-pitch3d.js?v=114` + index.html tag. `assets/ps1/gk_sheet6.png` (new). Backup `ult11-pitch3d.js.pre-gk6-v113.bak`.

**Next (step 4, state machine):**
- In open play the keeper still has no save animation, because the dive frames only play inside the super-shot cinematic.
- Step 4 should drive idle → set (row 0) → dive/punch (rows 1-2 by the shot's real trajectory) → recover (landing c4-c5, catch row 3 on a hold) → throw (row 5).

## 2026-09-24 — GK ROADMAP step 4: keeper state machine in open play (Claude)

**What:** a normal (non-super) shot now gets a real keeper animation, driven by the real ball. Before this, the open-play keeper only ever idled or ran; the dive frames existed only inside the super-shot cinematic.

**game.js (v202):**
- `launchShot` **places** the shot: it crosses the keeper's line beside him inside the goal mouth (half-mouth H*0.052), wider from a better finisher, or at him 1 time in 4. It used to fly at his chest every time. The duel still decides the outcome.
- `shotArrival()` runs the shot's own physics loop (a copy of `tickBallTravel`) ahead of time: arrival y, height (ball.bz) and time. `gkAnim(ds,'dive',{ty,bz,ms})`.
- Outcome hooks:
  - `afSave`: catch → `'catch'`; parry and spill → `'parry'` toward where the ball goes. Skipped after the super-shot cinematic, which already animated him.
  - resDuel's normal goal → `'beaten'`.
  - afGoal's kickoff clears both keepers.
- Helper `gkAnim()` is try-wrapped, so it's a no-op without P3D.

**ult11-pitch3d.js (v115), `GKA` state machine** (6x6 sheet only; the 4x4 fallback sheet keeps the old behaviour):

| State | What plays |
|---|---|
| set | row 0 c0 for the first 40% of the flight |
| dive | the lane from the real ball. Off-centre → low lateral dive (row 1) or, if it arrives above half his height, the high one (row 2). Central high → the straight-up reach. Central low → he stays set. Full stretch as it arrives. |
| catch | dove: on the grass with it (low c4 / high c5), then up. Central: the gather (row 3). The real ball is hidden while the art holds it. |
| parry | dove: landed c5, then up. Not dove: a **punch = the dive frames, fast** (author's rule). |
| beaten | landed c5, stays down until the kickoff clears it |

- Screen side is decided once by projecting keeper vs ball through the camera, so the dive is mirrored for the left in either half.
- Lateral travel: 70% of the offset, capped at 0.9 body.
- Distribution stays the throw row (the 'pass' action), and a throw ends any keeper state.
- Safety:
  - every state has a lifetime; a duel in progress keeps it alive
  - if play moves on with no duel, he gets up in 0.35 s
  - the cinematic keeper always wins
  - `P3D._gkaWhy` records why a state was dropped
  - `P3D.gkaState()` is for tests

**Verified:** syntax ok on both files. The preview pane kept going hidden, which pauses rAF, so the tests ran in **headless Chrome over CDP** with the full 3D scene (scratchpad `cdp.mjs`). Normal shots with the outcome forced:
- catch, off-centre: set → r1 c0-c3 (full stretch at arrival) → held through the duel → r1c4 with the ball hidden → up → holds the ball
- catch, central: set → gather r3 c0-c3 → up
- parry: dive held → parry landing
- goal: dive held through the duel → beaten r1c5 → cleared at the kickoff
- mirrored correctly both ways

Screenshot crops: `lab/gk-states-2026-09-24.png`.

**Found in testing:**
1. A keeper state was dropped by *any* sprite action. It is now dropped only by his own pass/throw.
2. When play moves on with no duel, he no longer lies stretched for ~3 s.

**Known limits:**
- **Open-play shots arrive low.** With the current ball physics (`BALLPHYS.shotLift` 1.05, gravity 0.075) the ball has come down by the time it reaches him (measured arrival height 0.01-0.04 of body height), so every open-play shot gets the low dive. The high dive plays in the super-shot cinematic, and will for anything that really arrives high. Giving some shots more loft is a gameplay/physics decision for the author.
- The match camera follows the shooter, so the keeper is at the edge of the frame during the dive.
- Headers at goal, direct free kicks and corner shots do not go through `launchShot`, so they get no dive yet (the landing still plays from afSave).

**Files/cache:** `game.js?v=202`, `ult11-pitch3d.js?v=115`, index.html. Backups: `game.js.pre-gkstate-v201.bak`, `ult11-pitch3d.js.pre-gkstate-v114.bak`, `index.html.pre-gkstate.bak`.

## 2026-09-24 — GK ROADMAP step 5: distribution is a real hand throw (Claude)

**Author rule:** every keeper distribution is by hand, the long one included (no kick art).

**Before:**
- PASS rolled, CROSS threw, SHOOT punted (a kick).
- The ball left instantly with no wind-up.
- The keeper's 2 release frames ran on the outfield 8-frame pass timeline, so they showed for ~45 ms.

**Now (`game.js` v203, `ult11-pitch3d.js` v116):**
- `keeperDistribute`:
  - PASS = underarm **roll**, CROSS = overarm **throw**, SHOOT = **long throw** (internal kind 'punt' kept; target search now includes it, wanted length 0.55W).
  - A real-time wind-up (roll 260 ms, throw 380, long 460), then `launchPass` fires.
  - Guarded by `G._gkThrow`: a double press is ignored. Pause holds the release. It's dropped if he lost the ball or the goal generation changed.
  - Goal kicks stay instant kicks off the grass.
- CPU keeper: roll 60% / throw 28% / long 12% (was roll 68 / throw 32), and it waits for its own wind-up.
- Labels: ROLL / THROW / **LONG** (was PUNT). The hint text is updated. Goal-kick labels are unchanged.
- pitch3d GKA `'throw'` state:
  - wind-up row 5 c0 (roll) / c1 (overhead) with the real ball hidden, since the art holds it
  - release c2 → c3 (roll: c3) as the ball leaves
  - faces the target (camera-projected)
  - the keeper's own pass action no longer ends the throw state, so the release frames are visible

**Verified (headless Chrome, full 3D):** syntax ok on both files.
- Clean catch → hold → each throw:
  - roll: c0 hidden → release as the ball flies
  - throw: c1 hidden → c3 flying
  - long: c1 → c2 → c3
- Double press ignored. Paused mid-wind-up: still pending, ball not released; after resume it releases.
- CPU keeper: catch → gather → auto throw (c1 → c3, mirrored toward its target).
- Release frame crop: `lab/gk-throw-2026-09-24.png`.
- The only page error came from the test clearing the DOM at the end.

**Files/cache:** `game.js?v=203`, `ult11-pitch3d.js?v=116`, index.html. Backups `*.pre-gkthrow-*.bak`.

**Limits:** a goal kick still shows the throw release frames, because there's no kick art (author's call for now).

## 2026-09-24 — GK ROADMAP step 6a: penalty kick lab mockup (Claude)

**Author picks:** camera **behind the shooter**; the kick is decided by a **quick-time event**.

**File:** `lab/lab-penalty.html` (standalone Three.js r128 from cdnjs; no engine; fonts Cinzel / Rajdhani / Bold Pixel only; no tagline text). Art: `assets/ps1/italy.png` (back idle r1c0, run r2c0-5, kick r2c6-11) and `assets/ps1/gk_sheet6.png`. Frame anchors are pre-measured and hardcoded, so it also works from file://. Every number is in `TUNE`. `window.PEN` is exposed for tests.

**YOU SHOOT**
1. Aim a reticle on the goal for 2.2 s: stick, d-pad, arrows/WASD, or drag. ✕ locks early. You may aim off target.
2. Automatic run-up. A timing ring closes on the reticle at the foot's contact (the kick frame is held until you press).
   - PERFECT ±60 ms: exact placement
   - GOOD ±140 ms: 0.38 m scatter
   - MISS (or no press): 1.05 m scatter, so it can go wide, over or off the post
3. The CPU keeper guesses 42% left / 42% right / 16% centre, 40% high, with reach 0.95-1.25 m. A PERFECT into the top corner cuts any reach to 55%.

**YOU SAVE**
1. The CPU taker aims mostly at the corners and rolls its own grade (35% PERFECT / 50% GOOD / 15% MISS).
2. You pick one of 6 zones during the run-up (arrows / d-pad / stick / tap the goal).
3. Press □ as the ring lands on the kick. Reach: PERFECT 1.45 m / GOOD 1.08 m / MISS 0.55 m; no dive 0.42 m (stays big in the middle).
4. Diving more than 0.25 s early **tells**: the taker switches to the other side.

**Outcome:** GOAL! / SAVED! / POST! / MISSED! in Cinzel, gold when it's good for you and red when it isn't. A wrong height costs reach (vertical distance weighted ×1.15). Keeper frames:
- low dive r1 / high dive r2 (mirrored for the left), reach r2 0,1,4 for a central high one
- catch on the grass r1c4 or gather r3; parry → landed c5; beaten → c5

The ball bulges the back of the net, flies off a parry, rebounds off the post, or sails past. The camera pushes in slightly during the run-up.

**Verified (headless Chrome):**
- aim phase
- ring closing on a top-corner reticle
- PERFECT top-corner goal past a wrong-way keeper
- PERFECT low-corner shot saved by a correct guess (low dive + parry, keeper visible)
- YOU SAVE: correct zone + PERFECT → high-dive parry of a top-corner shot

No page errors. Camera reframed twice so the taker never hides the keeper.

**Next (6b, after author sign-off):**
- engine: a foul in the box → the penalty flow (game.js penalty state + outcome into afGoal/afSave)
- `P3D.cine` penalty camera from this framing
- the same QTE for human and CPU sides

**6a fix (author's phone test, same day):** the mockup froze whenever the strike tap came late (after the GOOD window). The late-miss feedback had no screen position, so `drawHUD` threw and the rAF loop died. Early taps never hit that path.
- Fixes: the feedback always carries a position; `frame()` schedules the next frame first and wraps the HUD in try/catch; `press()` stamps the tap with `performance.now()` instead of the last frame's time (touch accuracy).
- Retested at -300/-120/-40/0/+40/+120/+300 ms: every kick resolves, no errors.
- Phone copy published privately at https://claude.ai/artifact/K9eqviqZY9swrRVUx7vNhx (assets shipped alongside; portrait shows a turn-sideways hint).

**6a balance (author's phone test):** a badly timed kick still scored most of the time. The CPU keeper committed to a blind guess, so a scuffed shot beat a wrong guess just like a perfect one.
- Now timing decides:
  - MISS is a weak shot: pulled 45% toward the middle and down, 0.8 s flight
  - the keeper **reads** the kick instead of guessing: MISS 85% / GOOD 30% / PERFECT 0%
  - reading = diving to where the ball is really going, 120 ms after the kick, with +0.25 m reach
  - all of it in `TUNE.read`, `readReach`, `readReactMs`, `missPull`
- Measured over 600 on-target kicks per grade: PERFECT 80% goals, GOOD 54%, MISS 15%. `PEN.resolve` is exposed for this test.

## 2026-09-24 — GK ROADMAP step 6b: penalty QTE wired into the match (Claude)

**What:** a foul in the box that `rollFoul()` turns into a penalty (unchanged: 40% of box fouls) now plays the approved mockup instead of the old keeper duel.

**New `ult11-penalty.js` (v2), `window.U11PEN`:**
- The lab scene and QTE, including the timing-decides balance.
- Built once and reused: its own Three.js renderer, DOM and CSS. A **full-window** overlay (z 9000); a wide screen just sees more stadium, since the vertical framing is fixed.
- The HUD and 3D view are sized to the window, and the DOM bits sit on the scaled 1280x720 stage.
- It's hidden while `#pause-overlay.show`, and its own clock stops while `G.paused`.
- Sprites: the taking team's 12x8 sheet straight from `P3D._dbg().SHEETS[side]` (anchors measured once per image; italy constants as fallback; home/away/italy file as last resort), and the 6x6 keeper sheet from `GK_SHEET`.
- The CPU half scales with the taker's SHO (PERFECT odds ×0.6–1.4, MISS the inverse) and the keeper's REF (reach ×0.88–1.12, read chance ×0.8–1.2).
- Names shown: TAKER / KEEPER.
- Input:
  - keys: Space/Enter/X/E/J/K press, arrows/WASD aim; captured and swallowed only while it runs
  - pad ✕ or □ press, d-pad/stick aim
  - touch: drag to aim, tap a zone, round action button
- It aborts itself if the match is quit or restarted underneath it (it watches the `G` object).
- Frames: the next frame is scheduled first, errors in a frame are caught, and time per frame is capped at 100 ms.

**game.js (v204):**
- `rollFoul` PK branch → `penaltyStart(atk,ak,ds,fk)`; the old `opDuel(true)` stays as the fallback (module missing, no THREE, or CPU vs CPU).
- `penaltyStart` sets `G._cineHold` (tick and clock frozen) and `G.phase='penalty'`, clears both keepers' GKA states, then runs `U11PEN.run({mode:'shoot'|'save',…})`.
- `penaltyResult` (checks `G._fkGen`): counts the shot, releases the hold, then:

  | Result | Engine outcome |
  |---|---|
  | goal | `afGoal` |
  | held save | keeper's ball, as after a clean catch |
  | parry / post | `goLoose` rebound in front of goal |
  | miss | `goalKickRestart` |

**index.html:** `ult11-penalty.js?v=2` after `ult11-fulltime.js`, `game.js?v=204`. Backups `game.js.pre-penalty-v203.bak`, `index.html.pre-penalty.bak`.

**Verified (headless Chrome, full match):**
- a real box foul with the rolls forced → the PENALTY overlay in shoot mode, engine frozen (phase 'penalty', `_cineHold`), clock not moving during the kick
- taken → goal → 1-0 → overlay gone → normal kickoff flow
- CPU penalty, human keeps: pausing mid run-up froze the penalty clock and hid it under the pause menu; resume → the result applied
- the four results fed directly: held → the keeper's ball and play on; parry and post → loose; miss → goal kick
- no page errors

Screenshot: `lab/penalty-4-ingame.png` (Germany's Margus vs G.Donati, zone picked).

**Not yet:** a real phone and a real controller. Penalty shootouts (cups/draws) are not part of this.

## 2026-09-24 — GK ROADMAP step 6b-2: the penalty plays in the REAL stadium (Claude)

**Author:** "Option 1 without doubt, cause the crowd is also team colored, flags etc." The v2 overlay drew its own lab stadium, which was wrong for the match.

**How:**
- `ult11-penalty.js` (v3) now only runs the QTE, HUD and buttons. Each frame it hands the poses to **`P3D.pen`** in `ult11-pitch3d.js` (v117): camera push, taker cell and position, keeper cell and position, ball, all in "penalty metres".
- Its own scene is kept only as the fallback when 3D is off (`#pen-ov.real` is transparent, no own renderer).
- `P3D.pen` maps penalty metres onto the real goal:
  - across = the mouth (`PWID*0.104` = 7.32 m)
  - up = the bar (`PWID*0.030` = 2.44 m)
  - depth: z=11 lands exactly on the engine's own spot; the run-up and camera behind it use the across scale
- While `PEN` is set, the pitch3d loop calls `penCamera()` instead of `updateCamera`, `penApply()` after `syncPlayers`, and `penBall()` instead of `syncBall`:
  - `penApply` shows only the taker (`atk:ak`) and the keeper (`ds:GK`), with `forceCell` + position (the super-shot rule), and moves shadows with them
  - `penBall` draws the match's pixel ball, with spin and shadow
  - `syncRef` hides the referee
  - a goal bulges the real net via `netHit`
- `project()` / `unproject()` give the QTE HUD and touch aiming the real camera.
- Camera is tunable live in `P3D.penCam` (penalty metres, [start, after push-in]): side 2.2→1.8, up 3.6→3.1, back 27→24, look 0.3/0.9→0.2/1.0, fov 24→22. Picked from three candidates captured in the real stadium.
- `game.js` (v205) passes `atk, ak, ds, gx:goalXFor(atk), spotX/spotY` (the ball on the spot).
- Hidden during the penalty: dpad, busts, chips, kick-off prompt, pass hint and banner, commentary ticker, minimap (`.mviews`, faded, since its children override visibility). The name plates moved below the scoreboard (top 84px).

**Verified (headless Chrome, real 3D stadium; mid-run screenshots via a CDP binding):**
- aim phase in the real ASTRA stadium: team-coloured crowd, Germany flag, ITALY/GERMANY boards, pixel ball, real Mancuso and Steiner sprites
- the ring at the plant; SAVED! with Steiner's low dive
- YOU SAVE: Margus vs Donati, zone overlay on the real goal; GOAL!
- control back to the match's goal celebration and kickoff; `P3D.pen` released, `_cineHold` cleared
- no page errors

Shots: `lab/penalty-5-real-stadium.png`, `lab/penalty-6-real-sequence.png`.

**Files/cache:** `game.js?v=205`, `ult11-pitch3d.js?v=117`, `ult11-penalty.js?v=3`, index.html. Backups `ult11-pitch3d.js.pre-penalty-v116.bak`, `ult11-penalty.js.pre-real-v2.bak`.

**Notes:** the stadium's big goal-end flag can overlap the near post from this angle; that's the real stadium's dressing. Real phone and controller still to test.

## 2026-09-24 — Astra corner lighting applied on top of the penalty renderer (Claude, from Astra's handoff)

**Source:** Astra's handoff `FOR_CLAUDE.md` + `corner-lighting-v117-to-v118.patch` (copies kept in `lab/`).

**Applied:**
- Base check: `ult11-pitch3d.js` and `index.html` SHA-256 matched the handoff's base exactly (5385B7EE…, 6A07E237…).
- `git apply --check -p2` clean, then applied. The result is byte-identical to Astra's `candidate/ult11-pitch3d.js` (E11A651A…).
- `node` syntax ok. The `P3D.pen` penalty mode is intact.
- Cache: `ult11-pitch3d.js?v=118`.
- Backups `ult11-pitch3d.js.pre-corner-lighting-v117.bak`, `index.html.pre-corner-lighting.bak`.

**What it does:**
- 4 corner lamps (±52, 17.5, ±40 world), each shaft aimed into its pitch quadrant (was 5 shafts along the +Z edge)
- wider, brighter shafts (alpha .12→.22) with grass pools
- 336 dust motes in one Points draw (hidden on the low tier)
- disposed on stadium rebuild
- shafts now need `gfx.volumetrics` AND `lamps` AND `floods`

**Visual check (headless Chrome, real served 3D, forced `P3D.quality='high'`):** the same frozen frame with volumetrics off/on, with the matched difference image in `lab/corner-lighting-off-on-diff.png`.
- The effect is clearly visible: a vertical shaft over the far stand and a broad warm-white pool across the pitch around the play.
- It also lifts the whole mid-pitch noticeably (mean pixel change 24.9/255), so the grass reads paler and lower-contrast near the ball. That's the "washing out" risk Astra flagged.
- On the auto tier the headless browser (software GL, ~5 fps) dropped itself to `low`, where the shafts are at 0.32 strength and there's no dust. Real frame time on the author's phone/PC is not measured.

**Next:** the author judges it in a real match. If it's too washed out, lower the pool opacity and/or the shaft alpha (the `.22` in the ray shader, `strength` per tier) before touching the geometry. Check both goal-end cameras and super-shot turns on the real device.

## 2026-09-24 — Corner lighting tune v119 (Astra candidate, validated + applied by Claude)

**Source:** Astra's `ready-for-claude-corner-lighting-tune` (FOR_CLAUDE.md, `corner-lighting-v118-to-v119.patch`).
- Live base hashes matched (pitch3d E11A651A…, index 9D663E6F…).
- Applied with `git apply -p2`; the result is byte-identical to Astra's candidate (D1B2218C…, C5A36187…). Syntax ok. `P3D.pen` and the GKA code are intact.
- Cache `ult11-pitch3d.js?v=119`. Backups `ult11-pitch3d.js.pre-lighting-tune-v118.bak`, `index.html.pre-lighting-tune.bak`.

**Change:**
- beam alpha .22 → .15
- pool opacity high/med/low 1/1/.5 → .45/.35/.25
- live switches `P3D.gfx.volRays / volPools / volDust`, which default to on

**Validation (headless Chrome, real served 3D, forced high tier, bloom on, the same frozen frame captured for v118 and v119):** images in `lab/lighting-tune-v119/` (`compare_main.png`, `compare_views.png` + raw frames). The grass-and-sprite box around the ball (luminance L and saturation S, HLS %; diff = mean |Δ| vs off):

| Frame | L | S | Frame diff | Near-ball diff | Far-stand diff |
|---|---|---|---|---|---|
| off | 49.2 | 47.4 | — | — | — |
| v118 all | 72.1 | 66.5 | 26.1 | 60.7 | 39.1 |
| v119 beams only | 62.0 | 55.4 | 13.9 | 35.2 | 23.2 |
| v119 pools only | 51.7 | 51.0 | 5.1 | 12.9 | 0.5 |
| v119 all | 62.8 | 57.5 | 17.4 | 40.5 | 22.5 |

- Reverse direction, near-ball L: off 35.5 → v118 57.4 → v119 50.6. Saturation drops from ~45 to ~36 in both versions (the wash desaturates there).
- **Finding:** v119 roughly halves the wash, so it's applied. **Most of what's left comes from the beams, not the pools.** From the broadcast camera the lower part of each shaft crosses the view over play and reads as haze. Pools alone add only +2.5 L.
- Penalty camera: clean. Super-shot turns: fine, with a lamp flare visible in the turn.

**Next (proposed to Astra):** fade each beam's lower third (near the grass, where it overlaps play) and/or narrow it (pow 1.8 → ~2.4), keeping the top bright so the source still reads. Consider fading beams with camera height. Keep pools as they are. Real-device fps is still unmeasured; headless software GL is not representative.

## 2026-09-24 — Corner lighting v120: beam fade at the grass end (Astra candidate + Claude fade tune)

**Source:** Astra's `ready-for-claude-corner-lighting-v120`.
- Base hashes matched (pitch3d D1B2218C…, index C5A36187…). Patch 97BAB60D… applied `-p2`, byte-identical to Astra's candidate (97F9503F…).
- Astra's correction, noted: the ray `vUv.y` is **0 at the grass, 1 at the lamp**. My v119 note had the direction backwards.

**Measured (headless Chrome, real served 3D, forced high tier, bloom on; the same frozen frame as v118/v119; the "off" frame reproduced at L 49.2–49.3 across runs):**

| Beam fade (`fall=smoothstep(a,b,vUv.y)`), pow 2.4 unless noted | Near-ball L / S (off 49.3 / 47.2) | Beams-only vs off: frame / near / far | Reverse, near L / S (off 35 / 45) |
|---|---|---|---|
| v119: 0–.08, pow 1.8 | 62.8 / 57.5 | 13.9 / 35.2 / 23.2 | 50.6 / 35.7 |
| **fB: 0–.16 (applied)** | **57.3 / 52.7** | **10.5 / 20.9 / 16.1** | **45.2 / 36.7** |
| fA: .02–.25 | 53.8 / 50.8 | 5.4 / 7.8 / 9.0 | 40.1 / 39.4 |
| Astra v120: .05–.45 | 52.1 / 50.7 | 1.9 / 2.3 / 2.7 | 37.3 / 42.1 |

- Astra's .05–.45 gives the cleanest grass, but **removes the beams from the broadcast view** (beams-only ≈ off). From that camera the lamps are above the frame, so the lower shaft is the only part ever visible.
- Per the handoff ("adjust only the fade range if it misses the target"), **fB 0–.16 is applied**. It's the only range that hits Astra's grass target (55–57) while keeping a visible shaft across the pitch.
- Penalty camera: v120 vs v119 differ by only 1.5 mean, no regression. Super-shot turns: no regression.
- Images: `lab/lighting-tune-v120/` (`compare_fades.png`, `compare_v120_main.png`, `compare_v120_views.png` + raw frames).

**Files/cache:** `ult11-pitch3d.js?v=120` (SHA-256 F679E4BA…: Astra's candidate with the fade range changed, plus a comment), `index.html` v120 tag from the patch. Backups `ult11-pitch3d.js.pre-lighting-v119.bak`, `index.html.pre-lighting-v120.bak`. `P3D.pen` and GKA are intact.

**Remaining risk:** the reverse attack direction still reads paler (L 45 vs 35 off, saturation 37 vs 45). Wherever the shafts are visible from the broadcast camera they overlap play. A fix beyond fade ranges probably needs camera-aware beam strength (full when the camera looks across a shaft from a distance, reduced when looking down it), or beam targets placed off the main play lanes. That's Astra's call. Real-device fps and look: the author still to check.

## 2026-09-24 — Corner lighting v121: camera-aware beam fade (Claude, author's go-ahead to finish it)

**Problem left by v120:** a single fade length fixes one end of the pitch or the other, never both. Wherever a beam's (10-unit-wide) foot lands in the middle of the broadcast view, it paints over play.

**Change (`ult11-pitch3d.js` v121):**
- A per-beam vertex attribute `cut` (0..1), updated every frame in `tickAstraVolumetrics`: each beam's grass point is projected through the camera; 1 when its foot sits over the centre of play (NDC distance from (0,-.15) under ~.6), 0 at the edges, .5 behind the camera.
- The fragment shader blends each beam's fade from the short `smoothstep(0,.16)` (a full visible shaft) to the long `smoothstep(.08,.55)` (it dies out above the players) by `vCut`.
- Unchanged: positions, width, alpha .15, pools, dust, tiers, `volRays/volPools/volDust`. `P3D.pen` and GKA are intact.

**Measured (same frozen frames, forced high, bloom on):**

| Version | Forward near L / S (off 49.3 / 47.2) | Beams vs off: frame / near / far / right edge | Reverse near L / S (off 35.1 / 45.1) |
|---|---|---|---|
| v119 | 62.8 / 57.5 | 13.9 / 35.2 / 23.2 / 23.5 | 50.6 / 35.7 |
| v120 fB | 57.3 / 52.7 | 10.5 / 20.9 / 16.1 / 23.9 | 45.2 / 36.7 |
| **v121** | **55.5 / 52.3** | **5.7 / 11.1 / 6.3 / 13.5** | **42.3 / 38.1** |

- Forward is now inside Astra's 55–57 target. Reverse is the closest to off so far.
- Beams stay visible where they come in from the side, and read strongly in super-shot camera turns.
- Penalty camera unchanged. Final regression: the full penalty flow (real foul → overlay → held save → keeper's ball; CPU penalty with pause → goal) passes, no page errors.
- Images: `lab/lighting-v121/` (`compare_v121.png` + raw frames).

**Files/cache:** `ult11-pitch3d.js?v=121`, index.html. Backups `ult11-pitch3d.js.pre-beamcut-v120.bak`, `index.html.pre-beamcut.bak`.

**For Astra:** this is inside your lighting code, done with the author's go-ahead to finish. The `cut` thresholds (the .8/.85 NDC ellipse, 1.15/.55 ramp, the long fade .08–.55) are the knobs.

**Real-device check still needed:** look from both ends, fps on high/med.

## 2026-09-24 — Author playtest fixes: super-shot ball, keeper hands, shot camera (Claude)

**Author's phone test:** (1) on Vella's super shot "the ball stays there, the trail flies on its own"; (2) "the GK dive is kind of random, his hands are never where the ball is"; (3) "when he catches or it's a goal, the camera follows the net rather than the ball".

**1 · Super-shot ball left behind (bug).**
- The match draws the ball as the pixel-art sprite with the mesh hidden (`P3D.pixelBall`). The cinematic moves `ballMesh`, and the main loop skips `syncBall` while a cine runs.
- So the sprite stayed frozen at the kick spot and the trail followed an invisible ball. Reproduced with Vella (`P3D.ballState().pixel` stayed true, sprite parked).
- Fix: a new `syncCineBall()` runs after every cine step; the pixel sprite, its spin and the ball shadow copy the cine ball's position and size.
- Verified: mid-flight frames show the ball at the head of the trail through to the keeper.

**2 · Keeper hands (open-play dives).**
- Cause: the match camera looks along the pitch, so the goal line runs *into* the screen while the dive art stretches *across* it. Moving him along the line never put the glove on the ball.
- Fix: `GKA_GLOVE` holds the reaching-glove UV measured off the art for every row 0–3 frame. `gkaAlign()` runs after `syncPlayers` and moves the diving keeper so the glove of the frame on screen lands on the ball's real arrival point (world x/z from `tx/ty`, height from the predicted `bz`), blended by the dive's `lat` and capped at 1.4 bodies. Shadow and silhouette move with him.
- `game.js` now passes `tx` to `gkAnim('dive')`.
- `P3D.gkAlign=false` is the A/B switch; `P3D.gkaGlove(side)` is for tests.
- Measured at full stretch, glove-to-arrival-point distance on screen: **0 / 1 / 1 px aligned vs 24 / 80 / 36 px before**, over 3 placements.

**3 · Shot camera.**
- Cause: `updateCamera` followed the ball only during `pass_anim` and lagged fast shots. When the keeper duel opened it switched back to the carrier (the shooter), so the dive, catch and goal happened at the frame edge.
- Fix: "shot focus" from the strike (`G._shotTrail`) through the keeper duel and result (`G.D.isShot`) and any keeper state except the throw. It follows the ball, leads it 45% toward its target during flight, and uses a 2.5× follow speed.
- Verified: ball on screen at 52% / 63% at arrival and 50% / 63% during the catch landing and the goal (centre = 50%).

**Files/cache:** `ult11-pitch3d.js?v=122`, `game.js?v=206`, index.html. Backups `ult11-pitch3d.js.pre-cineball-v121.bak`, `game.js.pre-gkalign-v205.bak`, `index.html.pre-cineball.bak`. Images: `lab/playtest-fixes-2026-09-24/`.

**Not changed:** the keeper inside the super-shot cinematic keeps its own pose and positioning (`gkOutcome`/`cineGkNudge`). If his hands miss there too, it's the same glove-alignment idea applied to the cine ball point. Volumetrics: the author wants them more evident; they will judge on PC.

## 2026-09-24 — Super-shot trail: round head + generic cyan + player colours (Claude)

**Author:** the comet "ends cut flat, while it should be a round glow surrounding the ball, no matter the shot or the angle"; the generic super shot should be "the same beautiful cyan of the mockup". Colours: Mancuso blue, Vella green, Frisina red, Falkner flaming, Margus yellow, the rest generic (the other team another time).

**Round head (`ult11-cine3.js` v8):**
- The ribbon was widest (2.15 ball radii) right at the ball and stopped there: a flat cut whenever the ball glow didn't cover it.
- It now narrows into a rounded cap (circle profile over the first 12% of the tail, min 0.18), so the head sits inside the glow.
- The ball glow grew 2.4→2.9 (×S) and its opacity .7→.8.
- The mockup's own width formula is unchanged behind the cap.

**Colour (`ult11-pitch3d.js` v123):**
- The cinematic used to take the per-player open-play trail colour, a pool picked from the name hash (orange/gold/pink…).
- `superCol()` now gives a signature shot, or a Camera-Lab forced trail, its own colour, and **everyone else `#3ec8ff`** (the mockup cyan).
- New `SIGNATURES`: `falkner` (flame, #ff6a1e, FLAME SHOT) and `margus` (lightning, #ffd21f, THUNDER SHOT).
- Existing: Mancuso drive #2f6dff, Vella nature #19e07a, Frisina dragon #ff3a2a.
- `P3D.superColFor(pl)` reports it. Checked all 19 Italy/Germany outfielders: the five named get their colours, the other 14 get cyan.
- Open-play (non-super) shot trails keep their per-player styles.

**Verified:** super shots by Conti (generic → cyan, round head) and Vella (green, round head) at two flight angles. Image: `lab/playtest-fixes-2026-09-24/supershot-round-head-cyan-vs-vella.png`.

**Files/cache:** `ult11-cine3.js?v=8`, `ult11-pitch3d.js?v=123`, index.html. Backups `ult11-cine3.js.pre-roundhead-v7.bak`, `ult11-pitch3d.js.pre-cyan-v122.bak`, `index.html.pre-roundhead.bak`.

## 2026-09-24 — LOOK-DEV steps 1-2: switchable NIGHT look (real light pools + night mood) (Claude)

**Author:** PC-first; wants the "wow" of HD-2D Three.js scenes. The plan: 1 real lighting, 2 night mood, 3 atmosphere, 4 HD-2D depth of field, 5 finishing grade, 6 weather. This entry covers steps 1-2, built as a **switchable look, off by default** so it can be A/B'd in the same match.

**Switch:** key **N** on PC (toast "NIGHT LOOK / CLASSIC LOOK"), `P3D.setLook('night'|'classic')`, or `?look=night`. The choice is remembered in localStorage `u11.look`. `P3D.look` reads the current look.

**What night does (`ult11-pitch3d.js` v124):**
- **Lit pitch:** a ShaderMaterial (same pitch texture, scene fog) replaces the unlit MeshBasic.
  - Light = `amb + lamp × Σ pool_i · exp(−d²/r²)`, capped at `max` (slightly overbright, so bloom catches the pools).
  - 7 pools: the 4 quadrant centres (±.46 L, ±.25 W, the same spots as Astra's corner-lamp beam targets), both goalmouths, the centre circle.
- **Lit sprites:** every visible player, the referee and the ball take the same light where they stand (CPU, per frame), floor .5, cap `spriteMax` 1.08, so they darken between pools and brighten under them.
- **Night preset:**
  - `P3D.light` ambient .16, key .62, warmth .16 (cool fog), shade .9 (darker stands and crowd), glow 0 (no fake sun pool)
  - `P3D.fx` bloom .42 / radius .45 / threshold .68, contrast 1.12, sat .94, split 1.35 with a cooler shadow tint and a near-neutral highlight tint, vignette .95
  - sky ×.3, apron darkened
  - the pitch look re-applies after `buildPitch`
- **Classic:** restores the saved light/fx/tints, the MeshBasic pitch and white sprite colours exactly.
- **Tune live:** edit `P3D.night` (pools `[x/halfLen, z/halfWid, r/70·PLEN, intensity]`, amb, lamp, max, spriteMax, light, fx, tints, sky, apron), then `P3D.lookRefresh()`, or toggle the look off and on to re-apply light/fx.

**Look-dev (headless Chrome, real served 3D, forced high, frozen frames):**
- 1st pass: too subtle; the grass went lurid green (grade saturation).
- A/B at two strengths: the pools read, but warm lamps looked yellow-green on grass and players blew out in the pools.
- Final: near-white LED lamps, a darker blue base, sprite cap, calmer grade.
- Checked forward, midfield, reverse, penalty and super shot: pools read, gaps go dark, the stands recede, the boards glow, the super-shot comet pops against the dark bowl.
- Images: `lab/lookdev-night/night_final.png` (+ first pass and A/B).

**Files/cache:** `ult11-pitch3d.js?v=124`, index.html. Backups `ult11-pitch3d.js.pre-night-v123.bak`, `index.html.pre-night.bak`.

**Next:**
- The author judges on PC with N.
- Step 3, atmosphere: a haze volume in the floodlight cones (the natural home for Astra's beams, now lit by real pools), lamp halos, distance fog on the far stand.
- Then step 4, DOF in cinematics.

**For Astra:** your volumetric pools sit on the same quadrant targets, so the beams now land in real light. Worth re-judging beam strength in NIGHT: they should read more there.

## 2026-09-24 — LOOK-DEV steps 3-5 in the NIGHT look + no-glow pitch lines (Claude)

**Author:** "the white stripes on the pitch glow and that's ugly, it's just painted grass". Go further with the plan.

**Lines:** the night pitch shader caps bright texels (texture luminance > .55) at `P3D.night.lineMax` .66, under the .68 bloom threshold. The lines read as matte paint, bright in the pools and dimmer between them, never glowing. Close-up before/after: `lab/lookdev-night/lines_before_after.png`.

**Step 3, atmosphere:**
- Night fog: `P3D.night.fog` = dark navy, near 55, far 230 (was 180/560), re-applied every frame because `applyLight` re-tints the fog. The far bowl sinks into the dark.
- Floodlight heads: the floodBank halo sprites get ×1.6 opacity, ×1.35 size.
- Astra's corner beams: strength ×1.9 at night; their additive grass pools ×.45, since the real pools light the grass now.

**Step 4, DOF:** HD-2D tilt-shift 1 → 1.45 at night.

**Step 5, finish:** a new `FinishShader` pass (appended to the composer, enabled only at night): film grain .035 and a faint radial colour fringe .01 toward the screen edges.

**Switching:** back to classic restores blur, bloom, fog range, halos and the finish pass. Checked: tilt 1 / bloom .1 after returning; 1.45 / .42 again at night.

**Verified (headless, real 3D, high):** forward, midfield, reverse, penalty and super shot. Images: `lab/lookdev-night/night_step3.png`.

**Files/cache:** `ult11-pitch3d.js?v=125`, index.html. Backup `ult11-pitch3d.js.pre-night2-v124.bak`.

**Left from the plan:** step 6, weather (rain + wet-pitch sheen with floodlight streaks). Optional: stronger DOF inside cinematics only. Author to judge on PC tonight (key N).

## 2026-09-24 — Settings: TIME (day / golden / night) and WEATHER (sunny / rain / snow) (Claude)

**Author:** "add something in the settings, Weather: rain, snow, sunny; Time: day, night, golden hour… so I can see what's actually working."

**Settings (index.html):** two new rows under STADIUM, TIME (DAY · GOLDEN · NIGHT) and WEATHER (SUNNY · RAIN · SNOW). They apply live, mid-match too. Like the stadium, they're kept in their own keys the renderer reads at boot (`u11.look`, `u11.weather`); `setMatchTime` / `setMatchWeather` call `P3D.setTime` / `P3D.setWeather`.

**Older bug fixed along the way:** `#aeSettings` and `#aeHelp` live inside `#s-home` (display:none during a match), so SETTINGS and HOW TO PLAY from the pause menu opened invisible panels. They're lifted to `<body>` on open. Verified: pause → SETTINGS shows over the match, NIGHT + RAIN picked and applied.

**Renderer (`ult11-pitch3d.js` v126), environment = TIME × WEATHER:**
- Every change is recomputed from `BASE` (the original day values, captured once). DAY + SUNNY restores exactly (checked bloom .1, tilt 1, sat 1, ambient .55, warmth .97).
- **GOLDEN HOUR** (`P3D.golden`): low sun (elev .24, long shadows ×3.2), warm amber grade (tuned down after the first pass read lurid yellow), warm sky and fog haze, warm sprite tint, light DOF and grain.
- **NIGHT:** as before (lit pools, lit sprites, fog, halos, beams, DOF, grain).
- **WEATHER** (`P3D.weatherFx`), on top of any time:
  - grade (sat, contrast, lift), ambient, sky, sprite dim
  - fog: day and golden mix toward the weather colour; night keeps its dark fog, only closer
  - rain darkens day grass; at night it adds a capped **wet sheen** (glossier pool centres, darker wet grass; the first uncapped version washed the pitch white)
- **Particles:** a camera-centred box where the view ray meets the pitch. Particles keep their world positions and wrap, and are culled within 12 units of the lens (a close flake bloomed into a blob).
  - rain: 7000 wind-slanted streaks
  - snow: 11000 swaying soft flakes
- Key **N** cycles DAY → GOLDEN → NIGHT. URL `?look=` / `?weather=`.

**Verified (headless, real 3D, high):** all 9 combinations in the same frozen frame; rain and snow visible in each time; settings in-match. Images: `lab/lookdev-env/` (`env_grid2.png`, `env_weather3.png`, `snow4.png`, `settings_flow.png`).

**Files/cache:** `index.html`, `ult11-pitch3d.js?v=126`. Backup `ult11-pitch3d.js.pre-env-v125.bak`.

**Next:** the author's PC test. Weather could later add splashes, puddle reflections and settling snow on the pitch edges.

## 2026-09-24 — LOOK-DEV: the HERO FRAME (lab) — what our game was missing (Claude)

**Author:** "I see people doing incredible 2D-HD games with way more simple approaches… something is missing" → "step 1, make me proud".

**Diagnosis:**
- the pitch is a flat plane under a few far lights, seen by a broadcast camera
- HD-2D needs geometry for light to land on, many small warm light sources, sprites that are lit and cast shadows, a diorama camera, atmosphere, and one authored look
- the game kept layering effects on top instead

**The frame:** `lab/lab-heroframe.html` (standalone Three.js r128 plus stock post passes from jsdelivr; serve over http). Also a private link for the author: https://claude.ai/artifact/T89ZFS3iutS8jkTHJopbkA. A night match, low 3/4 camera behind the Italian striker near the Germany box.
- **Lit sprite cards:** the real 12x8 / 6x6 sheets on MeshStandard planes, cylindrical billboards anchored at the measured feet, with a gentle emissive self-light so HD-2D sprites stay readable. They **cast real shadows** (customDepthMaterial with alphaTest).
- **Backlight key:** a spotlight from the roof edge behind the goal onto the play, so shadows fall toward the camera. Two floodlight banks on a cantilevered roof, in frame, both casting shadows. Soft front fill, dark hemisphere.
- **Practical lights:** a row of roof lamps with halos, warm lamps under the roof lighting the upper crowd, LED boards (emissive, animated) spilling coloured light on the grass, photographers with real flash lights, phone lights twinkling in the crowd.
- **Geometry with depth:** goal and net, tiered stand with an instanced crowd of 6k cards in team colours, roof and fascia, boards.
- **Atmosphere:** volumetric light cones from the banks, dust motes, night FogExp2, ground mist layers.
- **Post:** UnrealBloom → tilt-shift DOF (focus band follows the play) → filmic grade (ACES, split-tone, lift/gain, vignette, grain, lens fringe).
- **LAYERS panel** (H hides it) switches each layer off.

**Look-dev passes (headless screenshots):**
1. Blown out: the spot intensities were far too high.
2. The crowd was a flat wall and the lighting too even.
3. A lower camera, backlight key, darker crowd and warmer grade.
4. The light sources were out of frame, so they moved onto a cantilevered roof edge.
5. Readable sprites, stronger shafts, framing.

Final + progression: `lab/heroframe/hero_final.png`, `hero_progression.png` (raw → + shadows → + small lights → + shafts → + fog → + bloom → + DOF → + grade), `v5_none.png`.

**What to carry into the game (proposal):**
- lit and shadow-casting sprite cards
- a backlight key with real shadow maps
- a roof-edge floodlight rig
- practical lights (boards, roof lamps, flashes, phones)
- volumetric cones
- the tilt-shift + ACES grade chain

All of this fits best as a new renderer look for the close cameras (kickoff, set pieces, cinematics, replays), before touching the broadcast camera.

## 2026-09-24 — HERO-FRAME STEP 1 in the game: players cast REAL shadows (Claude)

**Why:** the author locked `lab/lab-heroframe.html` as the game's look. Its foundation is sprites that cast real shadows.

**How (`ult11-pitch3d.js` v127):**
- `renderer.shadowMap` on (PCFSoft). The sun is the shadow light: 4096 map, frustum ±0.72·PLEN.
- **Shadow twins:** every player and the referee get an invisible card (colorWrite/depthWrite off, so nothing on screen) rendered into the shadow map through a custom depth shader. It samples the sprite's own texture with **`texture.matrix`**, so the silhouette is the exact frame on screen, and discards alpha < .5. The ball and goal frames cast too.
- The twin **faces the sun, not the camera**, so it always throws the full silhouette.
- The pitch receives through a transparent `ShadowMaterial` catcher, so it works over the day pitch and the night pool shader. Opacity per time: day .55 / golden .62 / night .66, ×.65 in rain/snow.
- The old stretched silhouette hides while real shadows are on (both places that re-showed it are fixed: the sprite loop and penalty mode).
- Sun direction per time (`P3D.realShadows.dir`): day azim 4.03 / elev .3, golden 4.03 / .08, night 4.4 / .24. Real shadows are physical, so a low light gives the length; the fake ones were stretched ×3.2.
- `P3D.setRealShadows(false)` compares against the old fake shadows. `P3D._sh()` is for debugging.

**Found on the way (measured, images in `lab/realshadows/`):**
1. r128's shadow pass ignores the atlas crop on a `customDepthMaterial` map (MeshDepthMaterial + alphaTest), so every twin discarded. Hence the custom shader.
2. A hand-built offset/repeat sampled the wrong row; `texture.matrix` is exact (`cyan_crop.png`: the sampled silhouettes).
3. Camera-facing twins under a side sun threw slivers; rectangles vs silhouettes in `g_test.png`.
4. Real shadow lengths are physical (`zoom_g_crop.png`), hence the lower sun.

**Verified (headless, real 3D, high):** day / golden / night before-after (`shadows_final.png`), penalty at night, no page errors.

**Files/cache:** `ult11-pitch3d.js?v=127`, index.html. Backups `ult11-pitch3d.js.pre-shadows-v126.bak`, `index.html.pre-shadows.bak`.

**Next (step 2):** the hero-frame light rig in Astra's stadium (roof-edge floodlight banks, key light behind each goal, volumetric cones). With Astra.

## 2026-09-24 — HERO-FRAME STEP 2: the light rig + kickoff hero camera (Claude; the author hands the renderer look to Claude, Astra works elsewhere)

**Author:** "we are still way off from the mockup… trusting you and the process".

**Measured first:**
- Astra GLB roof inner edge y≈16.8, far z≈-38, goal ends x≈±51.5.
- The match camera (height 6, dist 20, fov 30, lookY 1) never sees the roof.
- Tilting it up to show the rig pushes the pitch off screen (`lab/lightrig/tilt_sheet.png`), so the match camera stays.
- The hero frame is delivered where the camera is free, and in play the rig reads through light on the grass.

**The rig (`ult11-pitch3d.js` v128, NIGHT only, `P3D.rig`):**
- **7 floodlight banks** (pixel lamp-grid heads + halos): 5 on the far roof edge, 1 on each goal-end roof.
- **Volumetric cones** from each bank to its light pool, a fresnel-edge shader readable along the whole length. `P3D.night.pools` are now the cones' footprints (`rigSyncPools`).
- **Dust** in the cones.
- Astra's corner beams are switched off while the rig is on, and restored after.
- **Practicals:**
  - LED board spill: 6 coloured pools along the far touchline cycling board colours, through a new spill array in the night pitch shader, partly additive (a multiplied colour vanishes on green grass, measured) and also applied to the sprite light.
  - 900 phone lights twinkling at the stand's seat spots, retried until the GLB has loaded.
  - 12 pixel photographers behind both goals, with camera flashes: a halo plus a flash spill pool on the grass.
- Rain/snow strengthen the cones ×1.35.

**Kickoff hero camera (`P3D.heroKick`, all times):**
- While a kickoff waits: a low camera inside the attacking half, looking at the goal the kicker attacks. Opponents, goalmouth, goal-end stand, roof banks and beams are in frame, with a slow 7 s push-in.
- It cuts to the match camera when the ball is played.

**Verified (headless, real 3D, high, night):** kickoff, play, midfield, penalty and super shot beside the lab target (`lab/lightrig/phase2_sheet.png`). Rig on/off switch. Phones 900. No page errors.

**Files/cache:** `ult11-pitch3d.js?v=128`, index.html. Backups `ult11-pitch3d.js.pre-rig-v127.bak`, `index.html.pre-rig.bak`.

**Still different from the target:**
1. Distance: the hero frame's players are big and close.
2. The frame-wide filmic finish (ACES tone mapping, the hero grade).
3. The crowd density/darkness.

Next: phase 3, the hero finish on the renderer, plus an optional closer "cinematic" match camera for PC.

## 2026-09-24 — Night fixes from the author's phone test (pitch3d v129, Claude)

**Author:** "extremely impressed… getting there". Two issues:
1. The goal and net disappear at night (dark grey Lambert posts, faint net).
2. Some lights near the north stand are too bright.

**Fix 1:** `nightGoals(on)` runs from `applyLookMaterials`, so it survives goal rebuilds. At night the posts get an emissive .62/.64/.68 (floodlit white paint) and the net lines go to opacity .78; both are restored in other looks.

**Fix 2:** the rig's bank halos shrink 15→9 (×k) and drop to opacity .5, and the night boost on the stadium's own floodBank halos goes from ×1.6 / ×1.35 to ×1.05 / ×1.0.

**Verified:** night kickoff + box views (`lab/lightrig/goal_night.png`).

**Files/cache:** `ult11-pitch3d.js?v=129`, index.html. Backups `*.pre-goalnight*`.

## 2026-09-24 — Phase 3: kickoff panorama, CINEMATIC camera, non-glowing goals, softer fringe (pitch3d v130, Claude)

**Author:** the kickoff camera pointed at the CPU goal → "a panoramic camera moving around until you click kick-off". The goal and net must be white and visible, **not glowing**.

**Changes:**
- **Kickoff panorama** (`heroKickCam`): a slow elliptical orbit inside the bowl (rx .52·PLEN, rz .62·PWID, ~45 s per lap), low (3.2k), looking across the pitch at the opposite stand and roof rig. It starts from the near touchline and cuts to the match camera on KICK-OFF. It works for either team.
- **Goals at night:** emissive .40 (was .62), net opacity .6 with a light grey colour, so they're white and visible but below the .68 bloom threshold.
- **Lens fringe halved:** night .005, golden .003.
- **CAMERA setting** (Settings: BROADCAST / CINEMATIC), `P3D.setCamMode`, saved in `u11.cam`. CINEMATIC is height 4.4, dist 14.5, fov 33, lookY 1.3 (closer and lower, the diorama feel). BROADCAST restores the saved camera.

**Verified:** three panorama moments plus a broadcast vs cinematic comparison at night (`lab/lightrig/phase3_panorama_cinematic.png`).

**Files/cache:** `ult11-pitch3d.js?v=130`, `index.html`. Backups `*.pre-p3*`.

**Note:** a true HDR/ACES tone pipeline was considered, but the composer's render targets are LDR, so a tone curve at the end would only lift the night shadows. Skipped deliberately.

## 2026-09-25 — Hero-frame grade ported, kept switchable (pitch3d v131, Claude)

**Author:** "the film grade is still not the hero frame".

**Change:** the lab's exact grade (ACES filmic, split tone, lift/gain, vignette) now lives in the finish pass (`FinishShader` amount/exposure/lift/gain/tints/vig, set from `P3D.night.hero`).

**Measured:** in the game it reads milky and flat (exposure 1.12 / 0.80 / 0.68, plus two hybrids with contrast and saturation restored). The game's own grade stays punchier. The lab frame's look comes mostly from its blue atmospheric haze, the desaturated turf and the large light glows, not from the tone curve. Images: `lab/lightrig/herograde_compare.png`.

**Decision:** the default stays on the game grade. Key **G** (PC, night) toggles the best hybrid (`P3D.night.heroGrade`) so the author can judge it in real play.

**Next candidate:** atmosphere (blue haze volume in the bowl, muted turf at night, larger soft light glows).

## 2026-09-25 — Camera Lab SCENARIOS: a frozen, posed match for look-dev (pitch3d v132, camlab v7, Claude)

**Author:** Camera Lab runs a whole match. It needs "an option where the game doesn't start (no timer, the CPU doesn't move) but gives different idle scenarios, like the exact hero-frame situation, a corner kick, or the GK throwing the ball back", to tune the look side by side with the lab frame.

**Change:**
- `P3D.setScenario('hero'|'corner'|'gkthrow'|null)` sets `G._cineHold` (clock and AI stop; verified: the clock is unchanged across the scenarios), poses the listed players and the ball, moves everyone else far up the pitch out of shot, and takes over the camera (`scnCam`, before the kickoff panorama and the match camera) with the lab's gentle drift.
- Positions and cameras are in the lab's metres (x across the goal, z out from the goal line), so `hero` uses the lab's exact camera and positions.
- Scenario data lives in `P3D.scenarios` and is editable live.
- The match HUD (KICK-OFF, busts, pad, chips, minimap, ticker) hides while a scenario is posed.
- Camera Lab: new section "SCENARIO — FROZEN MATCH" with the buttons OFF / HERO FRAME / CORNER / GK THROW. OFF resumes the match.

**Image:** `lab/lightrig/scenarios.png`.

**Files/cache:** `ult11-pitch3d.js?v=132`, `ult11-camlab.js?v=7`, index.html. Backups `*.pre-scn*`.

**Fix (pitch3d v133, camlab v8):** the scenario HUD rule also hid `.mviews`, and the Camera Lab panel lives inside `.mviews`, so the sliders vanished (author). Only the listed HUD elements hide now, and the panel and "⚙ LAB" button carry the class `u11-lab`, which is exempt. Verified: the panel is visible and usable in HERO FRAME. The minimap stays (author: "leave the minimap").

## 2026-09-25 — Marassi Square playable Road to Glory slice (Codex / Astra)

**Intent:** add a separate walkable 3D location for story-mode development and trailer capture while leaving current match-lighting work intact. This is a stylized Marassi-inspired practice square, not a geographic reconstruction.

**Files/cache:** new `marassi-square/index.html`, `style.css`, `scene.js`, `README.md`, `blender_scene.py` and local `assets/{marassi-square.glb,three.min.js,GLTFLoader-r128.js,italy.png,short-pass.mp3,block.wav}`. Main `index.html` has one home-menu entry to `marassi-square/index.html?v=1`; backup `index.html.pre-marassi-square.bak`. No edits to `game.js`, `ult11-pitch3d.js`, `ult11-camlab.js` or their cache tags. Source/development tests and screenshots: Codex workspace `marassi-square-prototype/`. Editable Blender/Higgsfield 3D Jutsu project: `6dcc17a2-00f5-49f2-a333-3cb73278c019`, revision 1.

**Behavior:** lit nearest-filtered Italy match sprite and alpha-tested shadow; walk/sprint/jump via keyboard, touch or standard gamepad; independent kickable ball with wall rebound and reset; chase and clean trailer cameras; author's short-pass/block audio. Escape opens the square menu; that menu links back to Ultimate Eleven. Buildings are non-enterable scenery. All runtime/scene assets load locally; no CDN is needed for the square.

**Validation:** `node --check scene.js` passed. Headless Chrome tested the actual GLB under both the standalone development server and the main-game HTTP root. Model loaded with no page errors; movement moved the player z=5 to ~0.34, jump reached y~1.38, and kicked ball reached the wall z=-11.95 and rebounded. Trailer frame was visually reviewed. The GLB is 1,039,356 bytes, SHA-256 `79C1F70D8ED5E9D105A33DA4E04192B361398F96FDBEC39DC92FD6BC4467BA20`.

**Remaining risks/next checks:** physical controller and touch need device playtest; phone frame time is unmeasured (the Blender source has 517 objects and may need mesh batching). Review collisions and rebound feel hands-on. Current character is the Italy sheet and lighting is warm afternoon; choose the story protagonist and final HD-2D art direction before adding NPCs/interactions. Capture trailer shots on the target device. Match renderer/lights remain Claude's parallel work.

## 2026-09-25 — Night matched to the hero frame from the author's side-by-side (pitch3d v134, Claude)

**Author (side-by-side with the lab, Camera Lab scenario):**
- the bloom is far too strong on the players
- the crowd has no DOF
- the field colour and "that pretty effect on the field" don't match
- no particles

**Changes:**
- **Bloom:** threshold .68 → .86 (only the lamps pass), strength .42 → .6, radius .6. Sprite light cap `spriteMax` 1.08 → .96. Stadium halos ×1.6 opacity / ×1.5 size and the rig halos 13k / .95, so the lamps bloom like the lab's.
- **DOF:** the tilt-shift sharp band now follows the carrier's feet on screen (the lab's method) instead of the screen centre, 1.25× stronger at night, 1.7× in a Camera Lab scenario. It is restored when leaving night.
- **Turf:** a night shader uniform `turf` gives 32% desaturation plus a cool tint (the lab's muted cool green). The night base is a little brighter (amb .19/.23/.35, lamp 1.08).
- **Field atmosphere:** additive ground mist at both goal ends and across the pitch (drifting), plus 2600 dust motes over the pitch, fading with distance so they read near the camera.

**Verified:** HERO FRAME scenario and play vs the lab frame (`lab/lightrig/match_lab.png`).

**Files/cache:** `ult11-pitch3d.js?v=134`, index.html. Backups `*.pre-match*`.

## 2026-09-25 — Field mist removed (pitch3d v135, Claude)
Author: "the fog is a sharp grey thing that cuts the players at chest height… keep the mist for the crowd, remove the fog on the field." The three additive ground-mist planes in `rigAtmos` are removed. The stadium fog (crowd depth) and the dust motes stay. Backup `ult11-pitch3d.js.pre-nomist-v134.bak`.

## 2026-09-25 — The author's own night look becomes the default (pitch3d v136)

The author tuned the night look in the Camera Lab HERO FRAME scenario, side by side with the lab frame, and sent the values.
- **Night preset (`P3D.night`):**
  - light: ambient .05, key .05, warmth .31, shade .47, glow .15, shadow .33, shadowLen 0
  - real-shadow sun: azim 2.07, elev .07 (`SH3.dir.night`)
  - fx: bloom .8, radius 1, threshold .86, contrast 1.07, sat .96, lift -.01, split 1.35, vignette .74, rays 0
  - tilt .44 (×1.25 in play and ×1.7 in scenarios, as tuned)
- **Broadcast camera defaults (all times):** dist 21, fov 26, phi .66, lookY .5, followLerp 9.
- **Not applied:** the `bowl` values, which only shape the procedural CLASSIC bowl and don't affect ASTRA.
- A browser that saved a camera with the lab's save button keeps it; `P3D.clearCam()` returns to the defaults.

Image: `lab/lightrig/author_night_defaults.png`. Backups `*.pre-authorvals*`.

## 2026-09-26 — Marassi north-facing map camera (Codex / Astra)

**Author correction:** the map must show buildings left and right and the stadium to the north. The initial diagonal chase view and west-facing stadium layout were wrong.

**Files/cache:** `marassi-square/scene.js?v=2`, its local `index.html` script tag; backups `scene.js.pre-north-map-v1.bak` and `index.html.pre-north-map-v1.bak`. Main menu, match renderer, gameplay and GLB are unchanged. Runtime rotates the loaded scenery (and procedural fallback) 90 degrees: stadium north, apartments east/west, practice wall east. Player/ball bounds and rebound axis match that rotation.

**Camera:** elevated north-facing map view, restrained player pan instead of orbit, with a wider portrait FOV. Trailer mode keeps the same orientation and only a small drift. Initial ball sits east of the player by the practice wall direction.

**Validation:** syntax and actual-GLB Chrome smoke passed; keyboard movement, jump and east-wall rebound reached x=11.95 then reversed without page errors. Visually reviewed `marassi-square-prototype/north-map-view.png` in the Codex workspace: stadium at top, buildings framing both sides. Main copy syntax checked. No physical pad/touch or phone frame-rate validation claimed.

**Next:** author review of this composition; target-device portrait/landscape framing and input feel. The stylized facade/art detail remains an initial blockout, separate from the corrected camera/layout.

## 2026-09-26 — Lower Marassi camera and closed architecture (Codex / Astra)

**Intent:** author requested a lower camera, no open gaps between stadium and apartment facades, and enclosed balcony sides.

**Files/cache:** `marassi-square/scene.js?v=3`, local `index.html` tag, and `blender_scene.py`. Backups: `scene.js.pre-closed-corners-v2.bak`, `index.html.pre-closed-corners-v2.bak`. Match files and main menu unchanged. GLB remains original revision 1: six stadium corner/return/cap meshes and two side panels per balcony are added at load time. Local Blender source includes equivalent geometry for future rebuild; cloud Blender revision has not been changed.

**Change:** north-facing camera height lowered 27 to 17 m, positioned z=32, looking at y=3/z=-4. Stadium extensions meet both apartment rows with solid returns; balcony sides connect facade to front rail. These are structural meshes with lighting/shadows, not image overlays.

**Validation:** JS syntax passed; actual-GLB Chrome smoke passed movement, jump and east-wall ball rebound without page errors. Visually reviewed lower-camera-closed-corners.png in the Codex workspace marassi-square-prototype folder: lower view, sealed stadium corners, visible balcony side panels. Main copy syntax checked.

**Next checks/risks:** author's visual approval and phone/controller playtest remain. Runtime geometry adds draw calls; phone frame time remains unmeasured. The procedural fallback still has simplified architecture; final Blender re-export should replace load-time repairs once composition is approved.


## Super-shot auras: who gets which (2026-09-26 · pitch3d v137, cine3 v10)

**Audit.** The six charge auras (base / thunder / flame / shadow / dragon / seraph, `ult11-cine3.js` AURA_P) were picked from the shot's hashed *trail* style. A super shot needs SHO 85+, and SHO 85+ is also the "strong striker" branch of `trailStyleFor()`, so every non-signature super shooter rolled tiger/flame, which gave them a cyan **flame** aura. Thunder, shadow and seraph only landed on players who can't super shot. In real play, then, nearly everyone showed flame, and the new auras never appeared.

**Change.**
- `SIGNATURES` now carries an explicit `aura`: Mancuso base, Vella base, Frisina dragon, Falkner flame, Margus thunder.
- New `auraKey()` in pitch3d: a signature plays its own aura, a forced trail (Camera Lab or `?debug=1&trail=`) plays that style's aura, and everyone else plays the plain **base** aura (the same rule as the generic cyan).
- cine3 `setAura()` accepts an aura id directly. It also exposes `U11_CINE3.aura` (the last charge's aura), and `P3D.cineState().aura` was added.
- The animation itself is unchanged: a profile only changes the charge extras.

**Verified in the game** (headless): Mancuso base, Vella base, Frisina dragon, Conti base, Manzini base, Falkner flame, Margus thunder (with canSuper forced). No errors.

**Open.**
- **Margus has no SHO stat, so he can never super shot** in real play, and the thunder aura is unreachable. The author needs to decide whether to give him SHO 85+.
- Shadow and seraph have no owner yet.

**Also fixed.** On 2026-09-26 index.html had been replaced by an older copy. It had lost the MARASSI SQUARE menu item and the CAMERA settings row (broadcast/cinematic), and carried stale `?v=` numbers (pitch3d 130, camlab 6). It is restored from the v135 index with pitch3d v137, cine3 v10 and camlab v8. Backups: `*.pre-aura*.bak`.

## 2026-09-26 — Author's Genova panorama integrated (Codex / Astra)

**Intent:** extend Marassi Square with the author's provided pixel-styled Genova hillside background, using the supplied JPEG now and permitting later replacement with original PNG artwork.

**Files/cache:** `marassi-square/assets/genova-background.jpg`, `marassi-square/scene.js?v=4`, local `index.html` cache tag. Backups `scene.js.pre-genova-background-v3.bak`, `index.html.pre-genova-background-v3.bak`. No main menu, match renderer or gameplay files edited; Claude's concurrent aura work preserved.

**Implementation:** a 210x105 m distant image plane at (0,-24.5,-65), preserving the image's 2:1 aspect. The 3D stadium/apartments occlude its foreground rooftops; hills and sky continue behind the north skyline. Nearest texture filtering, sRGB encoding, no mipmaps; image is unaltered JPEG, no false claim of restored pixel detail. Backdrop is unlit and excluded from foreground tone mapping/fog so the supplied colours remain stable. One extra draw call, no collision geometry.

**Validation:** syntax passed; Chrome loaded real GLB and background (`backgroundReady=true`), movement/jump/wall-rebound smoke passed with no page errors. Visually reviewed the lower-camera trailer screenshot; expanded the initial plane to remove visible side edges. Evidence: Codex workspace `marassi-square-prototype/genova-background-check.png`. Main scene syntax checked after copy.

**Next checks/risks:** target-device portrait/ultrawide framing; replace JPEG with original pixel PNG later if available. Current background is daylight only; night tint/window treatment and weathered foreground/pixel foliage are separate pending quality passes. Phone performance remains unmeasured.


## Germany's super shooters (2026-09-26 · game.js v207)

The author ruled that Margus, Shester and Goethe should have the super shot, with Falkner staying the top striker and the other two the more technical ones. None of the three had a SHO stat, so `canSuper` always failed for them. New `STAR_STAT_OVERRIDES`:

| Player | SPD | DRI | PAS | SHO | DEF | POW | Unlocks |
|---|---|---|---|---|---|---|---|
| Shester | 80 | 88 | 90 | 86 | 64 | 82 | super shot, super pass, super dribble |
| M.Goethe | 85 | 89 | 82 | 86 | 56 | 80 | super shot, super dribble |
| Margus | 85 | 86 | 80 | 88 | 54 | 83 | super shot, super dribble; thunder aura + yellow now reachable |

Falkner is unchanged at SHO 96. Shester and Goethe are not signatures, so they use the generic cyan and the base aura. Verified with `canSuper` on the Germany roster. Backup: `game.js.pre-gersuper-v206.bak`.

## 2026-09-26 — Marassi atmosphere: wear, pixel foliage, warm night (Codex / Astra)

**Intent:** author requested lived-in city surfaces, pixel plants and warm night lamps/windows with shadows.

**Files/cache:** new `marassi-square/atmosphere.js?v=1`; `marassi-square/scene.js?v=5`, local `index.html` controls and script tags. Backups `scene.js.pre-atmosphere-v4.bak`, `index.html.pre-atmosphere-v4.bak`. GLB, main menu, match renderer and gameplay remain unchanged. Runtime additions are isolated to the square; no remote Blender revision was altered.

**Changes:** seeded nearest-filtered plaster weathering; world-scale paving scuffs/cracks, drains, utility boxes and facade pipes. Replaced 12 faceted foliage clusters with 36 alpha-tested lit pixel cards and gently swaying sprite-shaped shadow casters; retained 3D trunks/planters. Four streetlamp pools, two facade lanterns with 512px shadow maps, 36 selectively lit windows with pixel curtain/frame silhouettes and four low-window point-light spills. Cool ambient night, warm practical lights and darkened Genova backdrop. DAY/NIGHT button or N changes look; trailer view hides button but N remains active.

**Validation:** JS syntax passed. Chrome actual-GLB test verified background/model ready, 12 pixel clusters, 36 lit windows and two configured shadow lanterns; day/night switch, movement, jump and ball rebound passed without page errors. Day/night screenshots visually reviewed; evidence `marassi-square-prototype/atmosphere-day.png` and `atmosphere-night.png` in Codex workspace. Main copied scripts syntax checked.

**Risks/next checks:** phone frame time and physical pad/touch remain unmeasured. Added materials, pixel cards and two shadow passes need target-device profiling. Current foliage/materials are procedural authored pixel assets, not image-generated production art. Lamp/window glow uses soft sprites and emissive materials rather than full-screen bloom. Night backdrop is a tint of daytime artwork (clouds remain), pending authored night artwork. Simplified GLB fallback does not receive this atmosphere pass. Author review of wear strength, night readability and foliage silhouette before a final Blender/material-batching pass.

## 2026-09-26 — Raised Genova buildings and home master character (Codex / Astra)

**Intent:** author could see only hilltops and requested the home.png master instead of the Italy character.

**Files/cache:** `marassi-square/scene.js?v=6`, local index tag, new `marassi-square/assets/home.png` copied unchanged from `assets/ps1/home.png`. Backups `scene.js.pre-home-background-v5.bak`, `index.html.pre-home-background-v5.bak`. Match files unchanged; atmosphere.js stays v1.

**Change:** panorama raised 19.5 m (y=-24.5 to -5), preserving size, aspect and north placement; hillside apartment rows now show above the stadium. Home master is 3492x3264 with matching 12x8 frames; nearest filtering, lit card and alpha-tested shadows retained. No sprite resampling/editing was performed; future story sprite can replace this copy.

**Validation:** syntax passed; actual-GLB Chrome smoke passed movement, jump, ball rebound and day/night without page errors. Visually reviewed raised panorama and grey-kit home character. Evidence: Codex workspace `marassi-square-prototype/raised-background-home.png`. Main script syntax checked after copy.

**Next checks:** author's composition review and target-device framing/performance. Source JPEG/night tint limitations from previous entries remain.

## 2026-09-26 — Balcony return direction fixed (Codex / Astra)

**Intent/cause:** author noticed backwards balcony enclosures. Runtime side panels used a reversed Z-axis sign, extending from the outer rail into the square instead of toward the facade.

**Files/cache:** `marassi-square/scene.js?v=7`, local index tag. Backups `scene.js.pre-balcony-direction-v6.bak`, `index.html.pre-balcony-direction-v6.bak`. No match, atmosphere or GLB edits. Local Blender source already had correct side placement.

**Fix:** each front rail is matched to its nearest actual balcony slab. Side-panel centre/depth derive from the slab bounds, retaining the original outer front rail and returning to the building rather than relying on a signed-axis guess.

**Validation:** syntax and actual-GLB Chrome gameplay/day-night smoke passed without page errors. Visually reviewed both apartment rows: enclosures now follow floor slabs, with front rail on the outer edge and sides toward facade. Evidence `marassi-square-prototype/corrected-balcony-rails.png` in Codex workspace. Main copied script syntax checked.

**Next checks:** author visual review; existing mobile/performance checks remain outstanding.

## 2026-09-26 — Building and stone paving material pass (Codex / Astra)

**Intent:** proper building/floor textures instead of flat facade colours and the red paving grid.

**Files/cache:** new `marassi-square/surface-textures.js?v=1`, `atmosphere.js?v=2`, `scene.js?v=8`, local index script tags. Backups `atmosphere.js.pre-surfaces.bak`, `scene.js.pre-surfaces.bak`, `index.html.pre-surfaces.bak`. Main menu, gameplay, match renderer, GLB and background unchanged.

**Change:** three deterministic 256px seamless texture tiles authored in canvas: rough cracked plaster, staggered brick/mortar, varied worn stone pavers. Diffuse and bump mapping with roughness; sRGB diffuse, nearest magnification and mipmapped anisotropic minification. Metre-scaled UV projection on 29 wall/brick meshes prevents whole-facade stretching. Original paving tile mesh hidden; one 40x31 textured floor replaces its red joints, with grime retained above it. Contact shadows raised to the new floor surface. Texture generators are local/reproducible; these are procedural authored materials, not downloaded photographic/AI assets.

**Validation:** JS syntax passed. Actual-GLB Chrome smoke reported 29 textured meshes/three textures, verified movement/jump/rebound/day-night, and no page errors. Day and night screenshots reviewed; colour-space corrected after first render to prevent washed-out paving. Main scripts syntax checked after targeted merge. Evidence: Codex workspace `marassi-square-prototype/textured-square-day.png` and `textured-square-night.png`.

**Remaining risks/next checks:** author texture scale/wear review and phone GPU/frame-time profiling. Floor is visually 5.5cm above original substrate; gameplay ball/actor vertical physics unchanged. UV edits and runtime floor should be baked into a future Blender export once art is approved. Existing night-background and fallback limitations remain.

## 2026-09-26 — Lived-in facades, varied windows, homes and shops (Codex / Astra)

**Intent:** author requested visible dirt/cracks, varied window colours and one identifiable residential entrance per building with other ground-floor bays as shops.

**Files/cache:** new `marassi-square/facade-details.js?v=1`, `atmosphere.js?v=3`, local index tags. Backups `atmosphere.js.pre-facades-v2.bak`, `index.html.pre-facades-v2.bak`. Scene stays v8, surfaces v1, main/match files and GLB unchanged.

**Changes:** seven facade-specific transparent texture layers with larger branching cracks, plaster patches, rain streaks and rising damp at the base, positioned behind window geometry. 115 window material variants use six glazing tones, different curtains and frame textures. Seven numbered residential doorways have panelled wood/green doors, handles and intercom boxes; their shop awnings are hidden. Remaining ten bays have distinct roller shutters/glazed storefronts and PANETTERIA/ALIMENTARI/BAR/EDICOLA/BOTTEGA signs. Buildings remain non-enterable. Existing 36 warm night windows remain selectively lit.

**Validation:** JS syntax and actual-GLB Chrome smoke passed with no page errors; runtime counts seven facades, 115 windows, seven entrances and ten shops. Movement/jump/rebound/day-night still passed. Day/night screenshots visually reviewed from gameplay framing, showing visible wear, varied glazing and entrance/shop distinction. Main scripts syntax checked. Evidence: Codex workspace `marassi-square-prototype/lived-in-facades-day.png` and `lived-in-facades-night.png`.

**Risks/next:** author review of wear strength/shop sign scale; phone frame-time profiling remains outstanding. Additional facade/window materials and shop signs add draw calls. Runtime detail is not baked into the remote Blender source/export; preserve these modules until a consolidated asset export is made. Current front doors are visual only, as requested for this prototype.

## 2026-09-26 — Plaza lamp moved; stadium-style light shafts and dust (Codex / Astra)

**Intent:** author's top-left lamp stood against the building; move it into the plaza for overhead light and adapt the current stadium volumetric/particle treatment.

**Files/cache:** new `marassi-square/light-vfx.js?v=1`, `atmosphere.js?v=4`, `scene.js?v=9`, local index tags and V control. Backups `atmosphere.js.pre-light-vfx.bak`, `scene.js.pre-light-vfx.bak`, `index.html.pre-light-vfx.bak`. Stadium renderer/source was read for its RIG cone/dust shaders but not edited; all match work preserved.

**Change:** original top-left streetlamp pole/head hidden; replacement at map-world (-7,7.3,-13), inside plaza, with 7.2m pole and downward warm spotlight. It now casts shadows; one facade lantern relinquishes its shadow pass so total shadow spotlights remains two. Six night-only tapered cone meshes and 660 GPU-drifting warm dust motes adapted from stadium RIG shader patterns, softened near ground/source to avoid hard mist slabs. Lamp halos and physical light pools retained. N selects night; V toggles shafts/dust for comparison, retaining physical lights/shadows. Trailer view stays clean.

**Validation:** syntax passed. Actual-GLB Chrome smoke reported six shafts/660 particles/two configured shadow lamps; model/background, movement/jump/rebound/day-night passed without page errors. Captured night VFX on/off and visually reviewed final framing/readability; intensity raised after initial effect proved too faint. Main copied scripts syntax checked. Evidence: Codex workspace `marassi-square-prototype/premium-plaza-night.png` and `premium-plaza-vfx-off.png`.

**Risks/next:** author review of the premium night treatment and target-device GPU profiling. Cone meshes approximate volumetric scattering (no ray-marched volumetric shadowing); physical spotlights produce real geometry shadows. Two shadow maps retained at 512px. Particles avoid CPU per-frame position updates. New lamp is runtime geometry, not baked in cloud Blender; existing furniture collision and night-background limitations remain.

## 2026-09-26 — Softer central spill, lamp-owned shadows, distant focus (Codex / Astra)

**Intent:** author found central window/facade light too strong, wanted ground shadows from lamps and background DOF.

**Files/cache:** `marassi-square/scene.js?v=10`, `atmosphere.js?v=5`, `light-vfx.js?v=2`, local index tags. Backups `scene.js.pre-shadow-focus.bak`, `atmosphere.js.pre-shadow-focus.bak`, `light-vfx.js.pre-shadow-focus.bak`, `index.html.pre-shadow-focus.bak`. Main match and source image unchanged.

**Changes:** window spill .9 to .3 with shorter reach; central facade lanterns and their cones/dust at 30% power. All four streetlamps now cast shadows, aimed slightly into plaza; tall lamp has 1024px shadow map, others 512px, with reduced bias/normal bias. Moon directional shadow disabled at night so warm practical lights own shadow direction; ambient .30 to .23. Added panorama-only 25-tap Gaussian focus blur in backdrop material shader, using linear sampling; nearby buildings, paving, character and foliage remain sharp. Source JPEG is untouched. Fixed separate cone time uniforms so source-specific shafts keep animating.

**Validation:** syntax and Chrome actual-GLB gameplay/day-night smoke passed without page/shader errors, four configured shadow lamps. Visually reviewed visible tree shadows, reduced central glow and smooth background separation. Replaced first sparse blur after visible ghosting. Main scripts syntax checked. Evidence: Codex workspace `marassi-square-prototype/shadow-focus-night.png` and `shadow-focus-day.png`.

**Risks/next:** phone GPU profiling required for four shadow maps plus background texture samples; final art review of blur amount and dark areas. Backdrop blur is authored distant-layer focus, not full-scene physical DOF. Current lamp shadows can shift from multiple sources; existing source-export/furniture-collision/night-background limitations remain.

## 2026-09-26 — Santa Fede playable 5 v 5 layout sample (Codex / Astra)

**Intent:** author requests small church campetto on Corso Sardegna. Public court references unavailable; author explicitly approves an approximate sample to correct together: north tall wall, west building, east church, south parking.

**Files/cache:** new `santa-fede/index.html?v=1`, `match.js?v=1`, `scene.js?v=1`, `style.css?v=1`, `README.md`, local `assets/{three.min.js,home.png,away.png,short-pass.mp3}`. Main index adds one SANTA FEDE menu link, backup `index.html.pre-santa-fede-20260926.bak`; existing cache tags kept as found. Main game.js, match renderer, stadium lighting and Marassi Square unchanged. Targeted fresh-index insertion checks hash for concurrent edits.

**Change:** independent sample simulation: four outfield plus keeper per side, 22x36 provisional court, three-minute match; movement/sprint/jump, pass/cross/shot, tackles/interceptions/deflections, goal crossing, keeper catches, selectable home keeper distribution, delayed CPU restarts, kick-ins/corners/goal kicks, pause/full-time/rematch. Keyboard/touch/standard pad input. North-up presentation; sealed church/residential volumes, balcony returns, fences/goals, worn procedural surface textures, pixel plants, south parking cars. Day/night physical shadow lights, soft cone shafts and dust; T hides HUD for trailer framing. Static architecture batched by material. Uses unchanged real home/away master sheets; keeper cards are tinted outfield placeholders.

**Validation:** node syntax, deterministic physics checks (10 players, pause freeze, sprint/jump with ball, nonmagnetic pass flight, goal crossing, CPU setup delay, human corner, keeper distribution, loose-pass interception, full match) and local Chrome actual-assets smoke passed. Browser movement/jump and frozen clock/positions on pause; day/night and 390x844 layout captured. No page/shader errors. Measured night frame approximately 138 draw calls / 7.6K triangles after batching, reduced from about 520 calls; not a device performance benchmark. Evidence in Codex workspace `santa-fede-prototype/santa-fede-{day,night,phone}.png`, `match.test.cjs`, `smoke.cjs`.

**Risks/next:** explicitly an approximate sample, not a surveyed replica. Author should correct court surface/dimensions, church/facade shape, camera and parking. Independent basic AI needs playtesting and balance; not a reduced version of the main 11v11 engine. Proper keeper sprites, character identity/action-frame refinement, phone GPU and physical controller/audio checks remain. No career/story progression or super-shot integration. Runtime geometry only, not a Blender export. Volumetrics are cone approximations. No paid generation used.

**Installed verification:** Chrome smoke also passed against the main-game server at /santa-fede/index.html?v=1 with real installed assets, 10 players, approximately 138 draw calls, no page/shader errors. Main script tags preserved: game.js?v=207 and ult11-pitch3d.js?v=137. Physical pad/audio and target phone performance remain unverified.

## 2026-09-26 — Santa Fede moved into the native stadium system (Codex / Astra)

**Intent:** author's correction: use the normal broadcast/low/cinematic cameras, worn slightly uneven asphalt and barely visible paint. Santa Fede is another playable stadium, not a new match engine. This entry supersedes the separate prototype above.

**Files/cache:** main `game.js?v=209`, `ult11-pitch3d.js?v=139`, new `ult11-stadium-santafede.js?v=2`, main `index.html`; `santa-fede/index.html` now redirects to `../index.html?stadium=santa-fede`, and its README documents retirement. Original backups: `game.js.pre-santa-native-20260926.bak`, `ult11-pitch3d.js.pre-santa-native-20260926.bak`, `index.html.pre-santa-native-20260926.bak`; later refinement backups retained. Legacy standalone scripts/assets remain archived but are no longer loaded by the menu. Targeted fresh-file edits preserved Claude's current lighting, audio and match work; Marassi Square untouched.

**Change:** main menu and Settings stadium row select the native Santa Fede variant. The existing match, input, AI, passing, keeper distribution, jumps, super shots, restarts, pause and camera paths are reused. Santa Fede starts five players per side using GK/CB1/CM1/CM3/ST in a 1-2-1 diamond; formation/pause squad coordinates and labels follow this layout, squad-editor rebuilds retain five, and offside is disabled for this mode. Normal stadiums use the original roster path on the next match. No camera implementation changed.

**Environment/surface:** approximate north wall, west residential building, east church and south parking surround the engine's authoritative 70 x 44.87 world-unit pitch. Native goals and markings are retained, avoiding duplicated paint or changed gameplay coordinates. Procedural asphalt has grain, cracks, repairs and sparse low-contrast paint derived from the original pitch mask. Its shallow visual height variation remains below the engine's zero-height decals (approximately -0.037 to -0.005 world units); gameplay collision stays flat. Day uses the native basic pitch/shadow-catcher path, night the existing pitch shader. Four local corner lamp banks and selective warm windows replace stadium-only extras; generic stands, flags/boards and the Astra roof rig are suppressed only for this variant. Static opaque architecture is batched by material. Switching away restores the selected native grass surface preference.

**Validation:** installed scripts pass `node --check`. Chrome actual-main-game smoke loaded the native module, started live play with five roster/position entries on each team, captured broadcast/low/night, switched to classic and back, and found no uncaught JS exceptions. Original squad construction restored on classic (Italy 11; Germany's existing available starter pool 10), then Santa Fede restored 5/5. Existing fallback portrait 404s remain; no shader errors observed. Evidence/tests: Codex workspace `work/santa-native/smoke.cjs`, `native-broadcast.png`, `native-low.png`, `native-night.png`. Earlier standalone draw-call measurements do not describe this native renderer; no reliable native frame-time benchmark taken.

**Risks/next checks:** approximate layout, not a surveyed Santa Fede replica. Pre-match team editing still displays the normal XI; this sample takes its five from the listed slots. Full-match five-player AI balance, substitutions, all set-piece paths and physical controller/phone performance need playtesting. Night is deliberately dark and requires author art review. Asphalt unevenness is visual, not new ball/character collision physics. Live stadium switching changes surroundings; match size is selected on the next match start. Do not revive the retired standalone engine or overwrite Claude's renderer with archived files.
## 2026-09-26 — Santa Fede facade materials and readable night lighting (Codex / Astra)

**Intent:** author judged the close-camera buildings unfinished and night lighting too dark. Improve materials and architecture visible in the existing Camera Lab hero/corner/keeper views.

**Files/cache:** `ult11-stadium-santafede.js?v=3`, main index module tag and `santa-fede/README.md`. Game stays v209, renderer v139; no gameplay/camera/Claude stadium renderer edits. Backups: `ult11-stadium-santafede.js.pre-material-light-v2.bak`, `index.html.pre-santa-material-v3.bak`. Targeted module/cache merge from fresh originals.

**Change:** deterministic 512px plaster, stone, brick, roof tile, wood and asphalt materials; world-scaled box UVs replace whole-wall texture stretching. Church has arched stone window surrounds, varied leaded panes, mullions/transoms and projecting sills, an eave course, downpipes and visible warm wall lanterns. Separate facade wear overlays add rain streaks, irregular plaster wear and rising damp. Neutral material palettes replace the overly yellow stone/doubly tinted walls. Church roof now has UVs and tile texture. Night-only cool fill and church facade wash preserve building visibility, with warm lantern point lights and selective emissive windows. Corner spotlights use wider cones and engine-appropriate distance attenuation; four existing 512px shadow maps retained. Local day fill helps shaded walls. These are authored runtime textures/geometry, not photogrammetry or newly generated photographic assets.

**Validation:** module syntax passes. Two actual native Camera Lab capture rounds visually reviewed fixed hero day/night plus corner and keeper angles; first night fill was still too dark, second raised it and softened overly rectangular wear patches. Installed main-game browser smoke passed live 5/5 play, night/cinematic views, regular-stadium restoration and Santa Fede restoration with no uncaught JS exceptions. Runtime has four corner lamps and 53 window materials; existing fallback portrait 404s remain. Evidence: Codex workspace `work/santa-native/material-hero-day.png`, `material-hero-night.png`, `capture-views.cjs`, `smoke.cjs`.

**Risks/next checks:** author must review this material/lighting pass; still approximate architecture, not a measured replica or final premium-art certification. Native pitch light shader is unchanged and remains cooler than facade lanterns. Point/wash/fill lights are scoped by the removable stadium group but affect all lit scene materials while Santa Fede is active; other variants retain their rig. Extra lights/materials need target-device GPU profiling; no frame-time benchmark. No bump/normal maps added; depth comes from modeled trims and light/shadow. Existing five-player menu/AI/set-piece limitations from the previous entry remain.
## 2026-09-26 — Santa Fede goal-end orientation corrected (Codex / Astra)

**Intent/cause:** author correctly identified church behind the hero-frame goal. The provisional environment used north along -Z, while native goals run along X; native integration had incorrectly left church/houses at goal ends.

**Files/cache:** `ult11-stadium-santafede.js?v=4`, main index module tag and `santa-fede/README.md`. Main game v209 and renderer v139 unchanged. Backups `ult11-stadium-santafede.js.pre-orientation-v3.bak`, `index.html.pre-santa-orientation-v4.bak`.

**Fix:** build the architecture using exchanged width/length, preserving the original metre scale, inside a removable child group rotated -90 degrees. Design north now corresponds to the native +X goal end: tall wall at X=39; south parking X=-48; east/right church Z=31.435; west/left housing Z=-31.435. Native pitch/goal positions, player physics and every camera remain unchanged. Parent bowl group is not rotated, so regular stadiums are unaffected. Local light fixtures/targets rotate with their buildings. Original full pitch extent remains 70 x 44.87.

**Validation:** module syntax passes. Native browser layout assertions confirm wall/parking beyond opposite goal lines and church/houses beyond opposite touchlines. Existing fixed hero capture visually confirms tall wall and fence behind goal, replacing church; day/night and keeper angles captured. Browser checks regular-stadium switch and return to Santa Fede. Evidence: Codex workspace `work/santa-native/capture-corrected.cjs`, `corrected-hero-day.png`, `corrected-hero-night.png`, `corrected-keeper-view.png`.

**Next checks/risks:** author review of the corrected arrangement and wall finish. Earlier approximate-replica, five-player balance and GPU-profile limitations remain. Design cardinal directions describe the neighborhood layout, not a camera compass; broadcast keeps the existing native match camera orientation.

## 2026-09-26 — Santa Fede HD-2D pixel material rebuild (Codex / Astra)

**Intent:** author judged the procedural buildings unfinished and approved the strongest pixel-art/3D material pass we could deliver. Replace placeholder architectural surfaces with dedicated bitmap art and modeled depth while retaining the native playable stadium.

**Files/cache:** new `ult11-santafede-art.js?v=1`, `ult11-stadium-santafede.js?v=5`, targeted main `index.html` script insertion, updated `santa-fede/README.md`; new `assets/stadiums/santa-fede/{material-atlas-v1.png,detail-atlas-v1.png,foliage-atlas-v1.png,README.md,generation-prompts.json}`. Backups `ult11-stadium-santafede.js.pre-pixel-art-v4.bak` and `index.html.pre-santa-pixel-art-v5.bak`. Fresh originals checked against staging before targeted install. Main game v209 and match renderer v139 hashes unchanged; all other script versions and Claude's lighting/audio/gameplay work preserved. Marassi Square untouched.

**Art/build:** three new built-in image_gen atlas masters (actual 1254 x 1254, originals retained unchanged; full prompts/provenance stored beside them). Runtime samples 256px material/detail tiles and 128px alpha foliage with smoothing disabled, nearest magnification and mipmapped minification. World-scaled plaster/limestone/terracotta/stucco UVs; fitted carved doors, leaded church glazing, shutters and curtained casements. Ivy, laurel, geraniums and weeds are lit alpha-tested cards. Geometry includes projecting stone arches/sills/piers, closed roof eaves and solid gable ends, tiled roof/ridge, campanile/rose tracery, numbered house entry plus separate shop shutters/signs/awnings, 12 balconies with closed returns, downpipes and stone-paved runoff. Four corner banks, eight warm lanterns and selective tinted night windows; lights moved clear of their own pole geometry and reduced after the colour fix. Static opaque geometry batches by material identity. Four 512px corner shadow maps retained.

**Colour/loader fix:** actual native r128 post-processing expects display-referred colour with LinearEncoding and no final gamma conversion. New sRGB textures are decoded for lighting, then ONLY Santa Fede art material outputs re-encode before the existing match grade. Global renderer is untouched. Window reflections use tinted BasicMaterial artwork; surrounding architecture receives real light/shadow, no claim of glass transmission. Initialize Texture.userData explicitly for r128 and mark disposed textures to prevent late async uploads to a removed stadium. All 13 atlas tiles and all three sources verified loaded.

**Layout/integration:** corrected goal-end orientation unchanged: north wall native X39, south parking X-48, church right Z31.435, houses left Z-31.435, authoritative native pitch 70 x 44.87. Existing worn asphalt, native goals/markings, five-player slot selection and main engine remain. No new simulation, Blender export, generated background panorama or match camera implementation. Camera Lab side/entrance/house review poses are temporary in the test browser; fixed hero preset captures use the original preset.

**Validation:** both installed modules pass node syntax checks. Actual installed main-game Chrome smoke passed live 5/5 roster and position entries with moving phase, broadcast/cinematic/night, classic switch and regular roster restoration (Italy 11; existing Germany available pool 10), then Santa Fede 5/5 restoration. No uncaught JS or WebGL/shader diagnostics; all required art assets/tiles loaded. Visual review corrected a roof opening, unreadable dark glass and excessive night wash. Final installed Camera Lab screenshot check is recorded in Codex workspace `work/santa-native/installed-art-validation.txt`; captures `pixel-hero-{day,night}.png`, `pixel-church-{day,night}.png`, `pixel-church-entrance.png`, `pixel-houses-day.png`. Existing missing legacy stadium/PS1 fallback assets, portrait paths and favicon warnings remain unrelated to the new art; their URLs are recorded in the capture report.

**Risks/next:** author art review and actual-device GPU/frame-time profiling still required; this is an approximate campetto, not a surveyed replica or AAA certification. Repeating atlas motifs can be broken up with future authored decals. Native grain/chromatic fringe and pitch night shader remain unchanged and need separate art review. Extra architecture/window materials/lights and ~6.8MB PNG masters add load/render cost; no reliable native performance benchmark. If the global renderer migrates to a fully linear post-processing pipeline, review/remove the local colour adapter (its guard currently checks only outputEncoding). Full-match five-player AI balance, substitutions, set pieces and physical pad/phone testing remain as before. Preserve the retired standalone sample as archive only.


## Ball ghosts on crosses and long passes (2026-09-26 · pitch3d v140)

The author asked for a cross or long pass to show 3 or 4 round ghost balls behind the ball, fading as they fall back. They should be real ball copies, not a glowing trail.

- `passGhostStep()` is called right after the open-play `ballMesh.position.set`. It draws `P3D.passGhostCfg.n` = 4 sprites. They are see-through copies of the pixel ball: `ballSpriteTex` cloned onto 6 different spin frames, tinted `#7fe8dc`, with opacity .55 / .38 / .24 / .12, each 6% smaller than the one before.
- Ghost i sits (i+1)×1.5 ball diameters back along the path the ball actually flew, so the spacing is the same at any frame rate. Blending is normal, so there is no bloom.
- A fallback draws plain discs when the pixel ball is off.
- It only runs during `pass_anim` when `ballTravel.physicalPass` is set, and only for `kind==='cross'` or a pass longer than 0.3 of the pitch width. It never runs on shots, super shots or cinematics.
- `P3D.passGhost=false` turns it off.

Tested headless on a cross by day and at night. Picture: `lab/passghost/cross_ghosts_zoom.png`. Backup: `ult11-pitch3d.js.pre-ghost-v137.bak`.


## GK upgrade: ball in hands on a catch, in the net on a goal, camera on both (2026-09-26 · pitch3d v141, game.js v210)

**Audit.** Tested at full speed on a GPU-backed headless Chrome (`cdp2.mjs`, 178 fps; the old SwiftShader runner managed 3 fps and cut every animation short), using the new `P3D.gkProbe(side)` debug probe (drawn ball, keeper and glove on screen, camera).

| Case | Before |
|---|---|
| Open-play catch | OK: the ball is hidden in the glove art during the dive, then held on the grip, carried out and thrown. |
| Parry and punch | OK: loose rebound; the camera follows the ball. |
| Open-play goal | **Broken.** afGoal never moved the ball: it stayed in front of the keeper. The GOAL card, referee card and banner all appeared at once, right over the goal, so the ball never went in the net and you never saw the keeper beaten. |
| Super-shot catch | The cinematic was fine, but the cut back to the match camera started from where the camera was before the cinematic and panned about 2 s across the pitch to the keeper. |
| Super-shot goal | After the cinematic the keeper stood straight back up. |

**Changes.**
- `P3D.goalBall(scorerSide)`, called from afGoal:
  - The drawn ball carries on over the line to where the shot was going (the keeper's dive read it: `GKA.bw`). It hits the net (`netHit`, the bulge), drops and bounces once inside.
  - It is render-only and ends when `_scoringGoal` clears.
  - A ball the cinematic already put in the net is left where it is.
- The match camera stays on that ball (`shotFocus` includes `GB.on`).
- afGoal (game.js):
  - The GOAL card (`#gfl`), `showReferee('GOAL!')` and `showGoalBanner` now wait 900 ms, and goalZoom + shake land at 330 ms, when the ball hits the net.
  - The kickoff reset moves back by the same 900 ms.
  - Everything is guarded by the goal generation.
- `cineEnd()`:
  - `_camSnap` makes the next match-camera frame jump straight to the keeper / ball.
  - After a cinematic goal, the new `gkAnim(ds,'down')` state leaves the keeper lying beaten (row 1 c5, 3.2 s) on the ball's side.

**Verified** (GPU headless): open-play goal, catch, parry and punch, plus super-shot goal and catch. Picture: `lab/gk-goal-catch/gk_goal_catch.png`. Backups: `ult11-pitch3d.js.pre-gkaudit-v140.bak`, `game.js.pre-goalball-v209.bak`.


## Super-shot catch in the hands · one new GOAL title · goal-net orbit camera (2026-09-26 · pitch3d v142, game.js v211, new ult11-goaltitle.js v2)

**Super-shot catch at hand height.** The author reported that the ball was never at the height of his hands: it sat at his stomach. On a save, the cinematic's `out` step aimed the ball at his spot at a guessed height (`2.2+gh*7`). It is now steered onto the reaching glove of the dive frame on screen (`P3D.gkaGlove`, the `GKA_GLOVE` art points), nudged a little toward the camera so it reads in the glove, and it stays there through SAVED!. Picture: `lab/gk-goal-catch/super_catch_hands.png`.

**One GOAL title.** The author said to remove the double goal title and make one ten times better. Until now `#gfl` "GOAL!", `#goal-banner` "GOAL!" and the referee card all stacked dead centre, right over the goal.

The new `ult11-goaltitle.js` (`U11GoalTitle.show`) replaces all three in afGoal; the old stack is only a fallback. It sits in the lower third, so the net stays visible above it. Fonts are Cinzel, Rajdhani and Bold Pixel only. Beats:
- Impact flash, plus a burst of rays in the scorer's team colour (`P3D.sideColor`).
- Team-colour and gold slashes whip across on a diagonal.
- "GOAL!" slams in letter by letter in gold Cinzel, then a light sweep runs through it.
- A canvas of sparks and embers.
- A scorer card: portrait (`_portraitChainFor`), name, minute, team and the new score in Bold Pixel.
- A wipe-out along the slash.

The layer is appended to `<body>` (the transformed `#viewport` clipped it) and runs 2.9 s.

**Goal-net orbit.** New `goalCam()` in pitch3d. Once the goal ball has hit the net, the camera blends (0.9 s) from the match camera into a slow, low arc round the front of the goal mouth, at fov 34, with net, ball and the beaten keeper in frame. It runs until the kickoff reset, where `gkAnim('clear')` now also ends the goal ball. That also fixes the goal ball lingering for 1 s into the kickoff. `P3D.goalOrbit=false` turns it off.
- The keeper stays down through it: 'beaten' is 4.0 s and 'down' is 4.2 s.
- afGoal's kickoff reset is 900 + 2900 ms with the goal ball (it was 900 + 2100).

**Verified** (GPU headless): open-play goal and super-shot goal each show exactly one title, the orbit, the keeper down and the ball in the net. Super-shot catch: ball in the reaching glove. Pictures: `lab/gk-goal-catch/goal_title_orbit.png` and `goal_sequence.png`. Backup: `ult11-pitch3d.js.pre-cineglove-v141.bak`.


## 2026-09-26 — Santa Fede houses, boundary and asphalt; daytime art target (Codex / Astra)

**Intent:** author clarified that the HD-2D upgrade must cover houses, wall and pitch, and that this venue should be judged in daytime. Night polish is no longer this venue's art priority. Author restored generation credits after the first atlas attempt hit a usage limit; the retry succeeded with built-in image_gen.

**Files/cache:** `ult11-santafede-art.js?v=2`, `ult11-stadium-santafede.js?v=6`, targeted main index tags, `santa-fede/README.md`; new `assets/stadiums/santa-fede/court-surfaces-v1.png` and `court-generation-prompt.json`, updated asset README. New atlas is 1254 x 1254, 3,748,181 bytes, kept unmodified. Backups: `ult11-santafede-art.js.pre-whole-court-v1.bak`, `ult11-stadium-santafede.js.pre-whole-court-v5.bak`, `index.html.pre-santa-whole-court-v6.bak`. Fresh main index and both stadium originals checked before installation. Concurrent Claude upgrades were detected and preserved: game v211, renderer v142, goal title v2 and their existing tags. No main gameplay/renderer source or other stadium was overwritten.

**Materials:** dedicated atlas quadrants for asphalt aggregate, repaired asphalt, faded salmon housing plaster, cool damp boundary render. Houses now use their own texture instead of sharing church artwork, with three neighboring muted paint finishes over the sealed volume. Existing doors/shops, shutter/window variants and closed balconies stay. A soft shadow-free daytime facade fill helps shaded houses. Boundary gets its own damp/moss/chipped-render texture and uneven low damp skirt; stone coping/piers and the sealed north-wall geometry remain. Sampling excludes atlas separator edges; the church material/architecture is retained.

**Court:** actual new asphalt artwork nearest-sampled into a 256px tile at eight-world-unit scale, mirrored across the authoritative pitch canvas. Runtime neutral grey remapping compresses the first render's gravel-like bright flecks. Fourteen irregular repair areas combine tar tone and repair artwork; 24 fine crack/seam paths and 38 low-opacity scuffs break uniformity. The existing native marking mask remains authoritative and faded, preserving kickoff/wall/goals/lines dimensions and all gameplay references. Day map uses display-ready LinearEncoding to fit the renderer's legacy colour pipeline; native night shader is not rewritten. Shallow visual mesh relief and flat player/ball collision remain as before. Async atlas repaint is guarded against disposed maps and reported via courtArtReady. Four required atlas sources, 14 environment tiles and court readiness verified.

**Validation:** installed modules pass node syntax. Main-game headless Chrome (without forced SwiftShader) captured daytime fixed hero/wall, house facade, church review angles and a native broadcast gameplay view; no uncaught JS or WebGL/shader diagnostics, all required sources/tiles loaded. Five-player native squads restore after switching to classic and back; classic restores Italy 11 and the existing Germany pool 10. The first regular-roster assertion ran before asynchronous startGame finished; the runner now waits for the actual roster state. Temporary Camera Lab poses, kickoff-gate extension and disabled heroKick in the screenshot runner are browser-only review controls, not shipping changes. Existing legacy asset/portrait/favicon 404s remain recorded. Evidence: Codex workspace `work/santa-native/day-court-installed-validation.txt`, `capture-day-court-gpu.cjs`, `court-{hero-day,houses-day,broadcast-day}.png`.

**Next checks/risks:** author should review daytime wear intensity, shade-side housing visibility and court-line readability during actual play. No native device/frame-time benchmark; the additional atlas adds ~3.75MB download and daytime facade fill adds a light. Source art contains continuous fine tones; nearest low-resolution mapping is an art treatment, not a claim that every generated source pixel was hand-drawn. Mirrored repeated texture motifs can be refined with bespoke decals later. Prior approximate-replica, five-player menu/AI/substitution/set-piece and physical controller/phone limitations remain. Global colour-pipeline changes still require reviewing local material encoding. Night controls remain available but no additional night tuning or final night capture was requested in this extension.

## 2026-09-26 — Marassi Square pixel materials and Blender trailer polish (Codex / Astra)

**Intent:** author asked to apply the Santa Fede texture principle to the RPG square and use Blender for a trailer-ready map. Existing approved layout remains houses left/right, Ferraris north, practice wall east; no interiors, entrances or new engine. This is an independent Marassi update, preserving concurrent Claude match lighting/gameplay work.

**Files/cache:** within `marassi-square/`: `scene.js?v=11`, `surface-textures.js?v=3`, new `pixel-materials.js?v=1`, targeted square `index.html`, updated `README.md`. New assets `assets/marassi-square-premium-v1.glb` (3,702,168 bytes), `assets/city-surfaces-v1.png` (unmodified built-in image_gen atlas), `assets/city-generation-prompt.json`; editable packed Blender source `authoring/marassi-square-premium-v1.blend`. Existing atmosphere v5, facade details v1, light VFX v2, home.png, user panorama and original GLB retained. Pre-change square scene/surface/index/README backups: `.pre-premium-20260926.bak`. Main game.js, ult11-pitch3d.js and main index were hash-checked unchanged during the targeted installation; fresh square originals were hash-checked against staging before copying. Main cache tags remain game v211, pitch3d v142, goal title v2 at verification.

**Actual Blender work:** imported original GLB into locally installed Blender 5.1.2. Replaced 51 opaque balcony panels with batched open ironwork, both side returns closed. Added 115 stone window surrounds, staggered slatted shutters, chamfered cornices, gutters/downpipes, pitched roofs with plaster gables, chimneys, pavement thresholds, bins and two empty planter troughs along the margins. Sealed structural shells and gameplay collision envelope remain. Nine added geometry families; final authoring geometry 461 meshes, 49,850 vertices, 60,142 triangles. Corrected initial window filter including sills and adjusted roof eaves/gable UV after screenshot review. Final overview review found GLTF split-material roof children without UVs; metre-scaled roof projection now also follows the terracotta material, and installed screenshots were recaptured after the fix. Blender saved successfully; Windows thumbnail-cache PNG write warning is unrelated to the saved .blend. Source has packed atlas plus overview camera/daylight rig; runtime still owns shop/curtain art, foliage, corner closures and night lamps/VFX. GLB export precedes authoring texture packing so the runtime's external atlas is not duplicated inside GLB.

**Art/runtime:** one dedicated four-quadrant city atlas: weathered plaster, red stadium brick, Ligurian paving, terracotta roof tile. Runtime crops each into 128px nearest-sampled tiles with mipmaps and mirrored repetition; plaster luminance is neutralised to retain existing paint hues. Bricks/paving/roofs use actual source artwork; diffuse maps are not reused as fake bump maps. The square retains proper sRGB/ACES colour handling; do NOT copy Santa Fede's legacy LinearEncoding workaround into it. Generated master contains continuous fine tones; this is a pixel-texture treatment, not a claim of exclusively hand-pixel source art. Existing varied windows, 7 residential doors, 10 shops, 12 pixel foliage clusters, 36 lit windows, 4 shadow lamps, 6 shafts and 660 dust particles remain.

**Trailer controls:** default overview camera retained. C cycles overview / lower street / close training; T hides HUD/controls for capture. WASD/arrows, Shift, Space, E/K, R, N, V and existing pad/touch bindings preserved. Camera poses use the same map and gameplay update, not a separate mockup scene.

**Validation:** actual installed main-folder square rendered in headless Chrome/WebGL at 1920x1080 without forced SwiftShader. Waited for GLB, atlas and all 9 material bindings before capture. Movement, jumping (~1.4m during test), physical kick/wall rebound, actual C keyboard binding, three camera shots, night lighting/VFX toggle and Escape/back-to-main link checked. Console/JS/WebGL errors: none. Runtime overview roughly 535 scene draw calls and 60,402 submitted triangles (not a device performance benchmark). Evidence in Codex workspace `work/marassi-premium/installed-runtime-validation.txt`, `capture.cjs`, `geometry-validation.json`, `model-audit.json`, `blender-build.log`, and actual `trailer-check.png`, `street-day.png`, `training-day.png`, `night-check.png`; source and prompt preserved.

**Next checks/risks:** author should review daytime wear/repeating brick motifs and the lower camera framing before recording the final trailer. Physical controller/phone play and actual device FPS remain unverified. Original many-object architecture still costs draw calls; future static-mesh batching can help if needed. New download payload is ~3.7MB GLB plus the atlas, old asset retained for rollback. Map remains a practice/exploration prototype, not completed Road to Glory story logic. Human art approval is pending; passing checks is not visual approval. Local integration was explicitly authorized; no external publishing performed.



## 2026-09-26 — Marassi building-edge asphalt correction (Codex / Astra)

**Intent:** author clarified the surface along/behind the building edges should be asphalt, not brick. Changed only `Collision__SquareFoundation` to a separate asphalt material; central square keeps stone paving, stadium/practice walls and practice-wall footing keep their masonry. Material is cloned before changing it because the foundation shares `brick_shadow` with wall recesses/footings. No geometry, collisions or camera changes.

**Files/cache:** `marassi-square/surface-textures.js?v=4`, `pixel-materials.js?v=2`, square index cache tags, square README. Asphalt uses the existing generated top-left quadrant of `../assets/stadiums/santa-fede/court-surfaces-v1.png`, nearest-sampled to 128px and mapped at 6m scale, compressed to dark neutral aggregate. This introduces a shared asset dependency, with readiness/error reported as `MarassiPixelArt.state.asphaltReady`; no new generation or duplicated atlas download asset. Saved packed editable Blender correction as `marassi-square/authoring/marassi-square-premium-v2.blend`, retaining v1. Runtime GLB is unchanged; runtime surfaces own the override. Fresh original hashes checked before install; backups of the three modified runtime files use `.pre-asphalt-20260926.bak`. Match/Claude files untouched.

**Validation:** actual installed square reloaded in headless Chrome/WebGL at 1920x1080; waited for asphalt, city atlas and 10 material bindings. Screenshot confirms dark asphalt beside both building rows, pale square paving preserved, brick walls preserved. Movement, jump, wall rebound, C camera cycling, night/VFX and Escape/main return pass, no console/JS/WebGL errors. Evidence: `work/marassi-premium/asphalt-runtime-validation.txt`, `capture-asphalt.cjs`, latest actual square screenshots; `asphalt-source.py` and source log. Blender source saved successfully despite the existing Windows thumbnail-cache warning.

**Risks/next checks:** keep the shared Santa Fede atlas path available when packaging the square independently, or copy it and adjust the loader. Author should judge asphalt tone/width in-game; unchanged device-performance/controller limitations from the previous entry remain.


## 2026-09-26 — Marassi reflective puddles, daytime atmosphere and lens finish (Codex / Astra)

**Intent:** author approved a grounded HD-2D / after-rain polish pass: actual reflective puddles, subtle daytime atmosphere and camera focus, without fantasy elements. Scope is Marassi Square only.

**Files/cache:** new `marassi-square/cinematic-finish.js?v=1` (11,860 bytes), `scene.js?v=12`, targeted square `index.html` plus README. Square scene/index backups `.pre-cinematic-20260926.bak`; fresh originals were SHA256-checked before copying. Main game.js, main pitch3d and main index hashes stayed unchanged during install, including Claude's game v211 / renderer v142 / goal title v2. Existing materials, asphalt, home.png, GLB/source Blender, panorama, night lamps and gameplay preserved. No extra asset downloads or new dependencies.

**Water:** three irregular shallow puddles at world x/z (-17,7), (16.6,-8), (-3,8), two on asphalt margins and one central low spot, with dark damp borders. One shared mirrored-camera render target serves all three coplanar surfaces; actual scene/buildings/sky/player geometry, not a reflection image. Uses reflected perspective camera and oblique clipping at y=.078, with Three r128 Reflector technique attribution in module. Ripples, angle-sensitive reflection strength and soft water edges; visual-only, no movement/collision changes. Shared target 512px desktop, 256px for canvas widths below 900px, updated on alternate frames and capped at 30Hz. Reflection render hides the new effects group, avoids recursion and restores shadow/XR/render-target state. Shadow maps are reused during reflection.

**Atmosphere/lens:** 180 sparse drifting sunlight dust points and two very faint roof-gap shafts, daytime only; existing 660 night dust particles and warm lamps remain. Scene color + actual depth texture feed depth-aware focus blur, gentle warm highlights/cool shadows and restrained bright-highlight glow. Focus tracks the player's 3D depth; blur samples are depth-weighted to reduce sprite-edge halos. Background/foreground softness is stronger in close views, lighter in overview. Added mild depth-gated edge smoothing outside the focal player region for offscreen-render edges. No moving film grain or general exposure boost. Existing distant-backdrop blur preserved. Depth blur falls back to zero when depth textures are unsupported.

**Controls/camera:** P toggles this entire finish for comparison; C selects existing overview/street/training, T hides HUD for the trailer. Movement tests revealed that the close training camera could crop a moving player; it now follows the player with the same low height/offset and gently interpolated camera position. Default overview and street framing unchanged. Existing jump, kick, free-ball rebound, controller/touch bindings and return navigation preserved.

**Validation:** staged then actual installed main-folder square in headless Chrome/WebGL at 1920x1080, without forced SwiftShader. Waited for GLB, city/asphalt atlas and 10 material bindings. Walking, jumping, wall rebound, real C/P keyboard toggles, finish off/on, three camera presets, moving through the central puddle, day/night, original VFX toggle and Escape/back-to-main link pass. Reflected building architecture is visible in actual water screenshots; reflection-frame counter advances. Resized to 540x960 and back; 256px reflection tier asserted. No console/JS/WebGL errors. Installed 60-rAF sample mean 6.025ms / max 11.2ms on this headless host, not a user-device FPS guarantee. Main scene ~544 draws / 60,834 triangles plus shared reflection and fullscreen post pass. Evidence: Codex workspace `work/marassi-finish/installed-runtime-validation.txt`, `capture.cjs`, `training-day.png`, `training-finish-off.png`, `puddle-player-{day,night}.png`, `trailer-check.png`, `night-check.png`, `phone-check.png`.

**Next checks/risks:** author should judge puddle visibility, blur strength and night readability in person before final trailer capture. Reflection adds an extra partial-rate scene render; postprocessing adds color/depth render targets and texture sampling. Low-resolution/half-rate reflection can shimmer at glancing angles or trail rapid movement. No physical phone/controller performance run. Water is visual; foot splash events and wet traction are not implemented. P bypasses the new effects for comparison/performance. Source .blend intentionally remains the architecture source; these procedural runtime effects are not baked into Blender. Global match postprocessing and stadium lighting were not changed.



## Real sky + outdoor daylight balance; Germany starts 11 (2026-09-26 · new ult11-sky.js v2, pitch3d v143, santafede-art v3, game.js v212, Marassi scene v14 / atmosphere v6) (Claude)

**Author:** "both maps miss a real sky, which makes the light in daytime kind of like an IKEA room." Also: "Germany needs to be fixed." The Santa Fede lines stay faded (intended). The author allowed Claude to edit Astra's files and will tell Astra.

**Diagnosis.**
- Marassi's sky was a flat `#8193a0` colour (also the fog), lit by a 0.85 all-round hemisphere fill.
- The match renderer showed its dusk-with-stars canvas dome at noon, with a warm-yellow hemisphere fill (`#ffe2a8`), so shadows were never blue.
- Santa Fede added two shadow-free day fills on top.
- Result: no sky, flat, neutral shadows.

**New `ult11-sky.js` (`window.U11Sky`)**, shared by both.
- A painted HD-2D sky dome:
  - zenith / mid / horizon gradient and a hazy horizon band
  - a sun disc + glow placed on the real key-light direction
  - a drifting cloud layer shaded from the sun side and cut into three painted tones
  - an angular pixel grid, plus a posterize + ordered-dither finish
- Presets: day, golden, and night (stars + moon); `overcast` for rain and snow.
- `encode` handles Marassi's sRGB/ACES output vs the match renderer's legacy linear pipeline. Tone mapping is skipped.
- **`?skylab=1`** opens a tuning panel: sky colours and shape plus map-owned DAYLIGHT sliders, per-mode values saved in this browser, and COPY FINAL VALUES.

**Match renderer (pitch3d v143).**
- Day and golden use the new dome in every stadium; night keeps the author's tuned old dome.
- The sky's sun follows the real-shadow light (`P3D.light` azim/elev from `SH3.dir`). Rain and snow turn the sky overcast.
- `P3D.skyTint` (0.6) pulls the hemisphere fill toward the sky's blue, so shadow sides read as outdoor light. It applies in every stadium's daytime.
- Fog takes the horizon colour in daytime. `P3D.skyV2=false` returns to the old dome.
- Santa Fede art v3: new `U11_SANTA_ART.setDayFill` / `dayFill` (default **0.45**) scales the two flat day fills (hemisphere 0.34, house spot 0.30); night is unchanged. It is on the panel as "Santa fill".

**Marassi.**
- `index.html` loads `../ult11-sky.js`.
- `scene.js`: sky dome following the camera; the panorama's painted-sky top edge fades into the dome; `window.MarassiDaylight = {hemi .38 (was .85), sun 2.7 (was 1.8), cool sky fill #9dbce6, warm ground bounce #b08a5c, exposure .98, haze .0035}`; panel sliders (fill, sun, sun angle and height, exposure, haze).
- `atmosphere.js` setNight reads those values for day, switches the sky to night/day, and sets the fog to the horizon colour (converted to linear). Night is unchanged.
- The square now depends on `ult11-sky.js` in the main folder, next to the Santa Fede asphalt atlas.

**Germany.** No player for CM3 in the 4-3-3, and Meyer (the only spare) was a reserve. The away builder skips reserves, so Germany played away with 10. Meyer now starts at **CM3** as the holding midfielder (def 82), and the reserves list is removed. Verified Italy vs Germany 11 v 11. A check of every team: Japan has no natural RW but still fields 11 (the away fallback puts Ozora there), so no change.

**Verified** (GPU headless): Santa Fede day/golden (hero, corner, pan), Astra stadium day/golden (clouds visible), Marassi overview, street and close camera; no JS errors; Marassi about 174 fps on this PC. Before/after: `lab/sky/sky_before_after.png`.

**Open.**
- Author tuning with `?skylab=1` in both, then bake the copied values in.
- In Santa Fede's broadcast view the sky is mostly out of frame and the low horizon band is haze (clouds sit higher).
- Marassi's cameras mostly see the Genova panorama, so there the change is mainly the light balance. The player sprite reads darker in shade with the lower fill; watch it when tuning.
- Backups: `*.pre-sky*.bak`, `game.js.pre-germany-xi-v211.bak`, `marassi-square/*.pre-sky*.bak`.


## Santa Fede: the neighbourhood around it, no more island (2026-09-26 · new ult11-santafede-city.js v4, pitch3d v144) (Claude)

**Author:** "Santa Fede needs a background, or it looks like it's on an island." Beyond Astra's wall, church and houses there was only sky and bare ground. In Santa Fede the kickoff panorama camera also started inside the church wall: its orbit is sized for the big stadium.

**New `ult11-santafede-city.js` (`U11_SANTA_CITY.build` / `setTime`)**, called right after `U11_SANTA.build` inside the same bowl group, so it goes away with a stadium switch. It measures the bounding box of Astra's environment and builds outside it:
- **Street apron:** a 760 wu asphalt ground plane.
- **Three rings of Genova apartment blocks:**
  - low near the court (7–14 wu), taller up the hill (up to 26 wu), with random gaps for side streets
  - 6 plaster palettes (ochre, salmon, pink, yellow, cream, sand) as 48 px pixel-art facade tiles: green shutters, sills, string courses, plaster wear
  - terracotta or slate roofs, cornice strips, baked face shading
  - merged per material (about 10 draw calls)
- **Distance haze:** the blocks' own fog override mixes them into the sky colour between 30 and 190 wu.
- **Genova hillside panorama** (the Marassi painting, copied to `assets/stadiums/santa-fede/genova-backdrop.jpg`, 176 KB):
  - a 330 wu cylinder with mirrored repeats, rising just over the ~21 m walls
  - 38% aerial-perspective haze
  - its painted sky fades into the U11Sky dome
- **Night:** blocks switch to a dusk facade with about a third of the windows lit and a night haze. **Golden:** warm tint.

pitch3d: the city build hook; `setTime` in both of Santa's look paths; the kickoff panorama orbit shrinks for Santa Fede (0.40/0.44 of length/width, was 0.52/0.62).

**Verified** (GPU headless, no errors): all four kickoff-pan angles, hero, corner, night hero, play. Before/after: `lab/sky/santafede_city_before_after.png`.

**Open:** author art review of block density and height; the night skyline is barely visible over the tall wall from the low hero camera. Backups: `ult11-pitch3d.js.pre-city-v143.bak`.


## Santa Fede: Corso Sardegna hillside, soft clouds, depth of field (2026-09-26 · city v6, sky v3, pitch3d v146) (Claude)

**Author:** "I liked that you could see high buildings. That stadium was in Corso Sardegna, which behind (the wall side) had a road going up, so the taller buildings behind were correct and the valley even more correct. If I don't see a lot of sky, OK. Plus we can add some soft clouds and depth of field; it will look premium."

**Changes.**
- **City.** Three extra rings only on the WALL side (+X, north) make a terraced city climbing the slope: every row is lifted (`h*1.12 + off*0.13`). The other sides stay street height. The valley panorama is back to its tall form (150 wu, painted sky fading from 70%), rising over the city.
- **Sky v3.** New `soft` param: cloud edges widen, the three-tone posterize blends to smooth, and clouds skip the pixel grid. It is on the Sky Lab panel as "Soft clouds". The match renderer sets `soft` 0.8 at Santa Fede (0 elsewhere) unless the panel saved a value.
- **Depth of field.** At Santa Fede in day and golden, `applyFx` drops the tilt-shift focus band onto the court (r 0.42) and multiplies the blur by `P3D.santaDof` (1.25). A first try at 1.7 / 0.36 turned the wall itself to mush, because the tilt-shift is screen-space. The night rig's own focus tracking is untouched.

**Verified:** four kickoff-pan angles, hero, night hero; no errors. Picture: `lab/sky/santafede_corso_sardegna.png`. Backups: `ult11-santafede-city.js.pre-hill-v4.bak`, `ult11-sky.js.pre-soft-v2.bak`, `ult11-pitch3d.js.pre-hill-v144.bak`.


## Santa Fede south end = Corso Sardegna + petrol station; parking emptied (2026-09-26 · city v8, santafede-art v4) (Claude)

**Author:** "There is actually Corso Sardegna, which is a double-lane, two-way road, and exactly in front of the campetto there is an IP petrol station. We don't need to go crazy, but since we shot there it's important it looks complete. The background can stay; make more depth, as there's a line of buildings also, then the street. Remove the cars from the parking lot."

**Changes.**
- **Santa Fede art v4:** the parked cars are gone; `window.U11_SANTA_CARS=true` brings them back. The empty lot and its faded bay lines stay.
- **City v8**, south = -X, from the parking's far edge (`-(PLEN/2+22k)`) outward:
  - **Pavement and kerbs.** A 3 wu pavement with a kerb, and another on the far side.
  - **Corso Sardegna.** A 10 wu avenue, two lanes each way, running 820 wu to the horizon both ways. It uses a 64 px pixel texture: edge lines, a solid double centre line, dashed lane lines, tyre-wear bands.
  - **Street lamps.** Staggered every 16 wu on both pavements (poles/arms and heads each merged into one mesh). Heads glow warm at night.
  - **Petrol station** directly across from the campetto:
    - forecourt; a canopy on four columns with a white fascia, blue band and yellow rule, and a bright underside and fascia at night
    - two pump islands with two pumps each
    - a kiosk with a glass front that lights up at night
    - a blue price totem ("CARBURANTI", three prices) facing the court
    - generic, not the IP brand (BRAND_SAFE / roadmap 0.3); the author was told
  - **Line of buildings** behind the station (11–19 wu), facing the avenue.
  - **The rest.** The south city rings are pushed behind all this, and blocks on the side rings that would sit on the road are skipped, so the avenue stays open to the horizon. The valley panorama is unchanged.
  - Everything is hazed and switches day/golden/night through `userData.dn` / `userData.maps`.

**Verified:** south-facing kickoff-pan views by day and at night; no errors. Pictures: `lab/sky/santafede_corso_south.png`, `santafede_station_zoom.png`. Backups: `ult11-santafede-city.js.pre-corso-v6.bak`, `ult11-santafede-art.js.pre-corso-v3.bak`.

**Open:** from the low angles the road surface itself reads as a thin band; a higher camera shows the lane markings.


## Santa Fede west side = the backs of TWO buildings (2026-09-26 · santafede-art v5) (Claude, edit on Astra's residence)

**Author, with Google Street View of Corso Sardegna / Via Ayroli:** the long west building was actually two buildings with space between them (spectator sprites could go there later, and at the windows). It is the BACK of those buildings, so no street doors or roller shutters at the bottom.

**Change** (`ult11-santafede-art.js`, west residence block):
- Two buildings (each `houseLength/2 - 4.6`), with their own backing box, paint frontage, stone base, string courses and tile gable. The gap is 9.2 design m, centred on z 0.
- Windows, shutters and balconies are skipped in the gap.
- Ground floor: the carved entry, doorstep, "12" sign, shop glazing, roller-shutter louvres, shop signs and awnings are removed. Now a plain plinth with small barred service windows on every other bay.
- In the gap: a low stone boundary wall with an iron railing, the spectator spot. The foliage card at z 0 is removed. The city ring shows through the gap.

**Reference notes from the author's Street View** (for later work):
- The church is a red brick + white-band facade with a green copper dome on a round body and a wide stair down to Corso Sardegna, with a gated passage and a bus stop beside it. Astra's church is currently a long nave along the east touchline.
- Via Ayroli is the higher street behind the wall: stone parapet, pink/salmon and cream Liberty blocks with green shutters, balustrade balconies and window pediments.
- The IP station has a blue canopy with an orange band, a palm tree, and plane trees along the Corso.

**Verified:** day and night kickoff-pan views of the west side; no errors. Picture: `lab/sky/santafede_two_buildings.png`. Backup: `ult11-santafede-art.js.pre-twohouses-v4.bak`.


## Santa Fede: balconies + lit windows that cast light; green fence behind the south goal with entrance and trees (2026-09-26 · santafede-art v6) (Claude, edits on Astra's file)

**Author:** "The two buildings need some balconies, and at night some windows need to cast light. Behind the goal, a high green metal fence that leaves some space near the church, like an entrance, and some trees, to give me a 3D feeling."

**Changes** (`ult11-santafede-art.js`):
- **Balconies.** On every other window bay (`(floor+n)%2`, all four floors); was `%4`, floors 0–2.
- **Lit windows.**
  - About 1 in 3 residence windows are lit at night (`(n*5+floor*3+1)%3`, flagged `res`). They go to over-bright warm (1.9, 1.4, 0.8), so the night bloom catches them.
  - Each lit window gets an additive warm radial spill card on the facade around it (group `winGlow`, night only).
  - Up to four of the lowest lit windows get real warm point lights (0.9, distance 16) that light the balconies and the court edge.
  - All of it is switched in `setTime`.
- **South fence** (design z `halfL+2.2`, between the goal line and the parking):
  - a 4.6 m tall green welded-mesh fence (alpha-tested pixel grid) on green posts every 2.6 m, with three rails
  - an opening beside the church (`halfA-7` to `halfA+3.2`): two brick gate pillars with stone caps and the two mesh gate leaves swung open
- **Trees.** Six trees on the parking side (bark trunks with crossed pixel-foliage cards, 1.1–1.35 scale), two of them flanking the entrance.

**Verified:** day south views from four angles, night west and south; no JS errors. Pictures: `lab/sky/santafede_fence_lights.png` and `_zoom.png`. Backup: `ult11-santafede-art.js.pre-fence-v5.bak`.

**Open (Astra):** a thin horizontal orange light smear crosses the west facade at night at about lamp height. It predates these changes (visible in earlier night captures). Not the god rays (`rays` 0 at night) and not the Claude city or window light; most likely the corner floodlight spots grazing the facade. Left for Astra.

## Santa Fede geometry / tree / lighting debug (2026-09-26, Codex, art v7)

Intent: debug the latest Claude campetto while preserving the city, two west houses, balconies, warm windows, south fence and entrance, Corso Sardegna and daytime art direction.

Delivered files: `ult11-santafede-art.js`; `index.html` changes ONLY its cache from `ult11-santafede-art.js?v=6` to `?v=7`. Existing `ult11-stadium-santafede.js?v=6`, city v8, sky v3, pitch3d v146 and game v212 remain intact. Backups: `ult11-santafede-art.js.pre-debug-v6.bak`, `index.html.pre-santa-debug-v6.bak`.

- North wall: old width `across+18` reached the CENTRES of the side buildings (about 5 design metres of penetration each). New width `across+8+.04` meets the inner facades with a concealed 2 cm plaster overlap. Coping now has only 1 cm concealed overlap; piers/caps are kept inside the join. World orientation stays north +X / church +Z / houses -Z / parking -X.
- Six parking trees now share a centred two-level crossed crown, retaining the existing height variation and pixel foliage. All 36 leaf cards cast shadows. IMPORTANT r128 detail: its stock WebGLShadowMap does not copy alpha maps into its default depth material, so simply enabling castShadow produces black RECTANGLES. The merged crowns have an explicit alpha-tested MeshDepthMaterial using the SAME foliage map and .60 threshold. It disposes with its geometry. Verified leafy silhouettes on the fence/parking. Static alpha-tested foliage is now batched too; tree crowns render in one mesh.
- Entrance gates have their own cloned texture/repeat (4.6/.55 by 2.2/.55). Previously they reused the long fence repeat, crushing the wire grid on the leaves.
- RESOLVED Claude's open orange facade streak: isolated all lights, then window points versus church lantern points. The lanterns reproduced the stripe; windows, beams, sun and spotlights were not its primary cause. Lantern decay was 0, which bypasses the nominal distance cutoff in the legacy light shader. Changed it to 2 so their 12*k range is respected. Window point lights also stay local (distance 7*k, intensity .22 at night; 0 otherwise); facade frontage uses a 1-design-metre geometry grid to interpolate Lambert lighting locally. Warm window bitmap/spill/bloom and original matte materials remain.
- `U11_SANTA.inspect()` now exposes join dimensions, lantern decay and current window light state, plus tree/crown counts, for reproducible checks.

Validation: Node syntax check; real-GPU headless Chrome at 1920x1080, all 14/14 texture tiles and all four Santa asset sources ready, no JS exceptions or shader/WebGL errors. Checked hero north wall, church, entrance, houses, south parking and native broadcast gameplay; night -> golden -> day switches verified (one environment root, one alpha-shadow crown mesh, correct light intensities). Native match runs 5v5; Santa -> classic restores 11v11 -> Santa restores 5v5. Pitch, gameplay bounds and cameras were not changed. Main renderer hash stayed `0954A7121B4E16F4EDD8BD6B70DA0DBC5E893E03B6B6281D6E8794A516652E74`.

Evidence: `lab/santafede-debug-v7/` holds before/after north join, parking trees, night facade, final broadcast, `validation.json`, and `final-verify.cjs` (expects local server on port 8762). Asset 404s in validation are pre-existing fallback player/portrait and classic corner PNG requests; none are Santa assets.

Remaining risks / next checks: judge daytime and night brightness on the user's own display and check frame time on their GPU during a live 5v5 match (not benchmarked here). Pixel trees remain crossed cards; they are consistent and cast correct leaf shadows but are not full 3D botanical models. The church still uses the provisional long-nave architecture described in Claude's Street View notes. Existing particles/post-processing are preserved; this debug does not replace the stadium VFX system.

## Santa Fede chibi neighbours (2026-09-26, Codex, art v8)

Intent: populate the user's four spectator locations with civilians matching the chibi player style, with physically grounded/elevated placements and real geometry occlusion.

Delivered: `ult11-santafede-art.js`; `index.html` cache ONLY `ult11-santafede-art.js?v=7` -> `?v=8`; new `assets/stadiums/santa-fede/spectators-chibi-v1.png` and `SPECTATORS-v1.md` with complete generation prompt/reference/import notes. Backups: `ult11-santafede-art.js.pre-spectators-v7.bak`, `index.html.pre-spectators-v7.bak`. Main originals were checked against staged input before applying; subsequent elevation fix checked current original text again. Stadium v6, city v8, sky v3, pitch3d v146, game v212 unchanged.

- 39 local neighbours: 10 leaning/look-down watchers behind the north wall, 9 on selected existing west balconies, 6 on the raised street between the TWO houses, 14 behind the south green fence. Varied ages/hair/casual clothing; no fixed home/away team-colour blocks. Empty balconies and groups of two retain a believable local scale. Gate opening remains clear.
- Gap street: solid 1.1-design-metre foundation, weathered asphalt deck top 1.15, level with the existing lower boundary wall. People face east into the court, feet on the deck, behind its railing. North observers stand on a hidden terrace at 9.65; wall/coping hides lower bodies while heads/upper bodies read above it. Balcony feet align to slab tops, bodies stay behind the outer railing. South people stand outside playing bounds and behind the physical wire mesh.
- Built-in image generation used `assets/ps1/home.png` as proportions/style reference. Transparent unmodified 16-pose master is 1254x1254 RGBA; actual-dimension 4x4 slicing, per-cell alpha bounds, nearest-filtered 128x192 runtime canvases and foot alignment avoid gutters/floating silhouettes. Twelve poses currently used; four back-facing poses reserved. This is a static pose atlas, not a walk/run/NPC animation system.
- 12 InstancedMesh batches for all 39 people, Lambert scene lighting, alphaTest .5, real receive/cast shadows and matching explicit alpha-tested customDepthMaterial for Three r128. Crowd is nested in its own group to avoid the existing foliage/static geometry merge. Async import respects disposed textures; shadow materials dispose with geometry. No per-person AI/update loop and no new global camera, lighting, post-processing or match code.
- `U11_SANTA.inspect()` exposes counts per zone, instance batch count, positions/elevations/poses and spectator asset readiness.

Validation: Node syntax checks; real-GPU Chrome at 1920x1080 loaded 27/27 runtime texture tiles and all five asset sources. No JavaScript exceptions, shader/WebGL errors or Santa asset failures. Inspected screenshots of north wall (raised terrace corrected after initial capture hid faces), west balconies/raised gap street, south fence, church and native broadcast 5v5. Verified placement constraints, day/night/golden transitions with one environment root and existing tree shadows, live gameplay, Santa -> classic 11v11 -> Santa 5v5 restoration. Existing missing portrait/player/classic-corner fallback assets remain listed in validation and are unrelated to this change. Renderer hash unchanged: `0954A7121B4E16F4EDD8BD6B70DA0DBC5E893E03B6B6281D6E8794A516652E74`.

Evidence: `lab/santafede-spectators-v8/` contains final screenshots, `validation.json`, and reproducible `verify.cjs` (local server port 8762). Main useful captures: `after-court-houses-day.png`, `after-north-neighbours.png`, `after-court-south-trees.png`, `after-court-broadcast-day.png`.

Remaining risks / next checks: spectators are fixed oriented cards with static waving/clapping/leaning poses, not animated citizens; extreme edge-on views can reveal card thinness. Existing hero-camera DOF heavily blurs people behind the north wall intentionally; the wider north capture demonstrates their faces/occlusion. Human heights are authored scenery scale, independent of player-size settings. User should judge density and scale on their usual cameras; GPU frame-time cost has not been benchmarked. Future cheering animations and story-mode NPC movement should build separately on this atlas. Preserve Claude's city/sky changes and this targeted art v8 work when merging.


## Road to Glory hero — idle/movement asset trial (2026-09-26, Codex)

User chose the first brown-spiky-haired civilian identity and asked to close its blue track jacket, then explicitly required home.png to remain the authoritative art style/palette rather than adopting the large concept's Pokemon-like proportions. New trial: compact closed-blue-jacket hero, dark trousers and white/blue trainers, idle and jog front/back/right; left mirrored. Created with built-in image generation using home.png FIRST and approved outfit concept SECOND. No existing sprites or game/render code replaced, no cache bumps.

Delivered in lab/hero-sprite-trial-v1/: hero-movement-idle-v1.png (1448x1086 RGBA, 48 frames), preview.html, anchors.js, grid-validation.json, inspect-grid.cjs, home-reference.png, preview-check.png and PROMPTS.md (complete initial/refinement prompts). Also saved in Codex workspace output/hero-sprites. Open preview.html from the local server; controls select idle/movement, four directions, FPS, pause and frame stepping, alongside home.png at matching displayed body height.

Validation: inspected both generated passes; refined bottom movement rows to introduce passing phases. PNG decoding checked six populated row strips, all 48 populated frames and side margins. IMPORTANT: generated row spacing is irregular, not a strict 181x181 grid. Use measured strips y/height: 47/133, 209/135, 377/146, 553/154, 729/147, 899/153; columns 181 wide. Preview uses row bounds and foot anchors, nearest-neighbour display; checked its actual browser screenshot. Transparent outer canvas preserved; low-alpha coloured fringe remains in raw master. No claim of exact palette quantization or production-perfect loops.

Next: user judges style and animation against home.png in preview; tighten remaining hair/limb drift and run phase spacing, normalize to the engine/story atlas format and exact palette before integration. This is an asset trial, NOT wired into Marassi or Santa Fede yet. Preserve Claude's current lighting/city/game changes. Last game caches stay art v8, stadium v6, city v8, sky v3, pitch3d v146, game v212.


## Hero style correction from user reference images (2026-09-26, Codex, asset trial v2)

User supplied 1000122217.jpg (16 running poses) and 1000118422.jpg (enlarged idle sprite), requesting the hero as close as possible to these. These references override the earlier large civilian concept as the style target. Only retain approved casual outfit: fully closed blue track jacket with white shoulder stripes, charcoal trousers, off-white/blue trainers. Aim for reference's sharper long brown spikes, small dark neutral eyes, longer athletic limbs, tan skin and restrained shaded palette; avoid rounded baby face/head and vibrant concept colours.

Delivered new lab/hero-sprite-trial-v2/: hero-movement-idle-v2.png, preview.html, home-reference.png, anchors.js, grid-validation.json, inspect-grid.cjs, preview-check.png, PROMPTS.md. Both reference images used directly in built-in image generation; a second edit corrected idle/run side rows to face RIGHT without changing front/back design. Forty-eight frames: front/back/right idle, front/back/right movement; left mirrored. Earlier v1 retained. Workspace mirror output/hero-sprites-v2. No game scripts or existing sprite replacements, no cache changes.

Validation: visual inspection of generated style and side directions; decoded PNG alpha and all 48 populated frames, with source column margins and six measured row bands, then browser-rendered the preview beside home.png at matching displayed height. Actual row rectangles y/height: 12/168, 188/170, 369/173, 553/168, 730/167, 904/172. Use generated grid-validation.json/anchors.js rather than equal-row assumptions. Output appearance is a closer visual trial, NOT a claim of exact reference pixels or exact palette quantization.

Risks/next: user review of likeness and loop quality; generated hair/limb drift, repeated/uneven phase spacing and semitransparent fringe/ghost outlines still require production cleanup. Before integrating, normalize grid and roots, match exact palette and verify animation transitions. Current home.png and all Claude game/lighting/city work preserved. Continue from v2 reference direction, not the rejected larger/rounder hero concept.


## Hero posture / camera-angle correction (2026-09-26, Codex, asset trial v3)

User correction: idle's head/shoulder silhouette looked hunched; walking and running must use the game's THREE-QUARTER angle, not perfect side profile. Built-in image edits/generation corrected idle toward upright head-over-torso posture with lower relaxed shoulders; movement uses front chest/zipper, visible face and near/far limbs in a diagonal view. Kept muted closed blue jacket, tan skin, brown spikes, small eyes, dark trousers and pale trainers. Earlier v1/v2 retained.

Delivered lab/hero-sprite-trial-v3/ (workspace mirror output/hero-sprites-v3): hero-idle-master-v3.png, hero-walk-run-v3.png, preview.html, anchors.js, grid-validation.json, inspect-grid.cjs, home-reference.png, preview-idle.png, preview-walk.png, preview-check.png, PROMPTS.md. 72 active frames: 24 idle from ONLY TOP THREE rows of the idle master; 24 WALK from top three rows of movement master; 24 RUN from bottom three movement rows. Idle master bottom three rows are unused development poses and must not be imported for movement. Each direction has 8 frames; left mirrors three-quarter right. Added actual separate walking cycles rather than slowing the running animation. Preview supports all three actions, four directions, FPS, pause/frame step and query parameters action=idle|walk|run and dir=down|up|right|left.

Validation: decoded PNG alpha, all 96 raw source frames populated with column margins (72 consumed); six measured row bands per master and anchored feet recorded, so imports need not guess the irregular generated row spacing. Browser screenshots inspected for upright three-quarter idle, three-quarter walking and running beside home.png. Assets have transparent outer areas; semitransparent edge fringe, small generated anatomy/hair drift and uneven phase spacing remain trial limitations. Exact palette remapping has not been performed. User should judge the posture/angle in motion, then normalize atlas and clean loops before integration. No game scripts replaced, no cache changes, original home.png and Claude work preserved. Complete prompts saved with assets.

## Marassi movement test — approved casual hero v3 integrated (2026-09-26, Codex)

User authorized using the upright idle / three-quarter movement v3 civilian hero NOW in Marassi Square. This supersedes the prior asset-only trial status for Marassi. Original home.png remains untouched and is a load-failure fallback; match players, Santa Fede, stadium lighting, main renderer and game logic were not edited.

Delivered: marassi-square/hero-sprite.js?v=1 (new importer); marassi-square/scene.js?v=15 (was v14); marassi-square/index.html loads importer before scene. New assets/hero-v3/hero-idle-master-v3.png, hero-walk-run-v3.png, layout-v3.json and PROMPTS.md inside marassi-square. Backups: scene.js.pre-hero-v3.bak, index.html.pre-hero-v3.bak. Fresh SHA256 checks matched staged original files before applying, preserving Claude's current atmosphere, cinematic finish, camera and map work. No other cache version changed.

Implementation: 72 active frames, eight per direction/action: upright idle plus independent walk/run, front/back/three-quarter right with mirrored left. Only top three rows of idle master are imported; all six movement rows supply walk then run. Measured irregular row bands and foot anchors pack a nearest-filtered 1024x2048 runtime atlas with fixed scale and foot baseline. Raw PNGs are preserved. Hero retains Lambert lighting, silhouette-correct alpha-tested depth/shadow material; alphaTest .5 trims soft fringes. Corrected old sideways mapping which used home shot/pass row, and diagonal facing normalization. WASD/arrows/left stick walk; Shift/RT sprint (existing speeds 4.8/7.8 unchanged); idle follows last facing, animation follows velocity through slowing. No dedicated jump art yet: freeze the current hero pose while airborne instead of flashing the football kit. Kick, jump, rebound physics and all existing map controls remain intact.

Validation: Node syntax checks for both changed JS files; real-GPU headless Chrome loaded the actual main Marassi map and all three hero runtime assets. No JavaScript, resource or shader errors. Checked idle/walk/run direction and left mirroring, all eight frames cycling, stable feet (.06 baseline), lit material and matching alpha shadow map. Equivalent manual movement interval: walk 2.06 units versus run 3.35; jump reached 1.45 units. Ball kicked against practice wall and rebounded. Day/night, overview/training cameras, Escape menu and re-entry retained working hero. Inspected day screenshots for posture, grounded feet and shadow. Evidence and reproducible CDP script: marassi-square/lab/hero-v3/validation.json, verify.cjs, hero-idle-in-map.png, hero-walk-in-map.png, hero-run-in-map.png, hero-overview-in-map.png, hero-night-in-map.png; script expects main-game server on port 8762.

Remaining risks / next checks: this is the user-approved movement trial, not final production animation. Source still has small hair/anatomy drift and uneven generated phase spacing; no exact palette remapping or authored jump/kick sprite yet. Human judgement of feel on the physical controller remains needed; browser checks used keyboard events and debug stepping. Future cleanup should keep current three-quarter angle, upright posture, foot anchors and closed casual jacket. Preserve this isolated Marassi integration when continuing Claude's lighting work.


## Modular player factory — Phase 0 inspection (2026-09-28, Codex)

Intent: establish actual game sprite/render conventions before modelling the roadmap's three-player Blender run proof.

Delivered: `art/player_factory/docs/render_spec.md`; `scripts/inspect_game.cjs`, `scripts/measure_assets.py`; previews with actual 1280x720 Santa Fede match capture, native player crops, reference strip, asset/runtime JSON and transparent Blender smoke render. No runtime cache versions changed; game code, existing player assets and other worktree changes preserved.

Validated: current field sheets 3492x3264, 12x8, 291x408; keeper 1536x1680, 6x6, 256x280. Fresh live Italy/Germany match uses italy.png and away.png fallback. Near/carrier/far body silhouettes approximately 109/94/57 screen pixels. Blender 5.1.2 / Python 3.13.9 headless bpy and EEVEE RGBA transparent render passed. Existing per-cell disconnected opaque pixels can contaminate alpha-bound grounding. Actual run setting 8-13 fps with 0.9 layout multiplier. Each existing field atlas decodes to 43.48 MiB.

Proposal for sign-off: 96x128 native frame, approximately 104px standing body, fixed (48,116) origin, provisional orthographic 12-degree elevation; eight shared frames in four true directions; three prescribed hair/kit variants; 800x528 atlas with 2px gutters, manifest authored anchors. About 1.61 MiB per run-only player atlas. Separate ball/shadows.

Remaining: Phase 0 sign-off per this roadmap's one-step-at-a-time rule, then shared rig and static style comparison, then run animation approval before bulk generation. No model/action/production exporter or runtime integration exists yet. Screen scale measured only in fresh Santa Fede defaults; classic 11v11 and user saved camera need later checks. Browser was network-enabled for existing CDN dependencies. Memory estimate excludes GPU/loader overhead; performance not benchmarked. Extensive prior git changes prevent treating this inspection as a clean overall repository state.


## Modular player factory — shared rig and static proof (2026-09-28, Codex)

User approved the measured Phase 0 specification. Delivered the next gated static style proof, without changing match runtime or existing sprites.

Files: `art/player_factory/player_template.blend`; `presets/players.json`; scripts `build_player_template.py`, `prepare_static_preview.py`, `validate_player_template.py`; `docs/static-proof.md`; twelve RGBA frames and raw sources under `previews/static-v1/`, manifest, static contact sheet, 57/94/109px comparison strip, offline pitch comparison and source/frame validation JSON. No runtime file/cache versions changed.

One editable 17-bone shared outfield rig, rigid bone-parented segments, three hair sets and three colour/kit presets. Fixed 96x128 frame, orthographic 12-degree elevation, 22-degree front / +/-75-degree side / 180-degree back views, root projects to (48,115.5), authored origin (48,116). All variants share body geometry and pose; left views render independently. Pixel preparation: fixed palette, no dithering, binary alpha and 1px external ink contour. Head broadened and body shortened after comparison with current chibi sprites.

Validation: all 12 frames RGBA 96x128, binary alpha, limited palette, no frame-edge clipping. Saved Blender source reopened; 17 bones and all mesh bone parents confirmed; shin rotation moves boot; root projection verified. Raw source re-render matches first raw render. Source Blender file saved despite thumbnail-cache write warnings under the sandbox account. Reproduction instructions included. Existing roadmap/changelog entries and concurrent game work preserved.

Remaining: user static-style approval before the shared eight-frame run cycle. Face/hair/kit detail is deliberately simpler and more geometric than current sprites. Rigid segments still need animation contact/silhouette evaluation; IK, smooth skin deformation and swappable face texture system are not implemented. Foot/toe silhouette extends 2-3px below the fixed ground-plane root in front/side views; use authored anchor rather than per-frame alpha bounds. The pitch comparison is a composited still, not live integration. No actions, packed run atlas, event timing or performance benchmark yet. Keep ball/shadows independent.

## Modular player factory — first style rejected; revised concept target (2026-09-28, Codex)

The user rejected the first static Blender prototype's style. Its rig/file/pixel checks do not imply visual approval or game readiness. Do not advance that model into run animation or roster exports.

Saved new reference-driven raster concept: art/player_factory/previews/style-target-v2/player-style-target-v2.png and docs/style-target-v2.md. Built-in image generation used the actual Italy sprite crop and native match crop as style references: layered anime hair, expressive eyes, compact athletic proportions, bent ready stance and richer clustered shading. The image is a concept target only, not a new Blender render, atlas or tested runtime sprite. The user has not approved this target yet.

Original rejected source and exports preserved; no game runtime/cache versions changed. Approved technical specification remains in force. Next step: settle visual direction, then rebuild one Blender player and compare its actual rendered result before animation. No claims of visual parity or completed pipeline.

## Modular player factory — home.png selected as master reference (2026-09-28, Codex)

User explicitly selected assets/ps1/home.png as the best-quality style reference. It now takes priority over the Italy crop, generated concept target and rejected Blender prototype. This is reference selection, not approval of either the concept or rejected source.

Inspected eight native home frames: front/back idle, side/front/back run and side action. Saved untouched cropped source references, a 2x nearest contact sheet and bounds/cell manifest under art/player_factory/previews/home-reference/. Instructions: docs/home-style-reference.md; extraction: scripts/extract_home_reference.py. Existing home.png and runtime/cache versions unchanged.

The rebuild must match home's layered hair, large shaded anime eyes, compact face, roughly half-height head/hair, athletic crouch, short limbs, garment folds and material shading. Do not use a repeated-cone hair cap, empty bean-shaped face or stiff doll stance. Do not treat a forced low colour count as quality proof. Native sampled bodies are 180-196px tall; verify the proposed lower-resolution output against the actual source at identical match-scale sizes before locking export resolution.

Next: faithfully rebuild one static source player against the home frames before animation. Required final three kit/hair variants remain unchanged. No new Blender render or accepted style claimed in this reference update.


## Modular player factory — flat 2.5D rendering alternative (2026-09-28, Codex)

User requires a clean flat pixel-art image, using home.png as the quality reference. Delivered an explicitly labelled 2.5D cutout proof to preserve that artwork instead of repeating the rejected faceted 3D style. This is an alternative source method for review, not silent completion of the original full-3D pipeline.

Files: art/player_factory/flat_proof_v2/player_flat_v2.blend; parts.json; sixteen texture layers packed into the source; home reference crop; flat_native.png (192x224, origin 96,200); flat_small.png (96x128, origin 48,116); flat-style-comparison.png; pixel-layers.png; arm_pose_probe.png; validation.json. Scripts: prepare_flat_parts.py, build_flat_proof.py, verify_flat_proof.py. Documentation: docs/flat-proof-v2.md. Original rejected source and game sheets remain preserved. No runtime/cache versions changed.

Validation: source separation reconstructs all visible original pixels without repainting; one orthographic camera, unlit emission textures, nearest sampling, zero scene lights; 17 bones and 16 distinct bone-parented meshes; all textures packed; source reopens and renders identically; binary-alpha exports have correct dimensions and no frame-edge clipping; both projected authored origins verified. An eight-degree in-plane arm bend is only a rig check, not a run animation.

Limits / next decision: still the original brown-haired grey-kit home art in one view, with its existing decorations. This is not a newly modelled 3D footballer. Camera turns require separately authored pixel views; large poses may expose seams/missing joint art. No new heads, hairstyle/kit variants, run cycle, packed atlas, event timing, gameplay integration or performance benchmark. Settle whether this 2.5D source method suits the intended factory before expanding animations; the original three-variant deliverables remain pending.


## Modular player factory - 3D volume direction and first front draft (2026-09-28, Codex)

User selected the recommended proper 3D rig plus pixel textures/flat sprite rendering direction after reviewing the cutout alternative. Delivered a first front-view volume draft against home.png. This supersedes cutouts as the selected production direction, without asserting that this draft completes the factory.

Files: art/player_factory/volume_proof_v3/player_volume_v3.blend, front/96x128 exports, arm pose probe, source/render comparison, untextured oblique geometry view, validation JSON; scripts/build_volume_proof.py and verify_volume_proof.py; docs/volume-proof-v3.md. Source uses 17 bones, 30 closed meshes with actual depth and 16 packed reference textures. Body/limb geometry uses curved cross-sections; hair has a volume core and 14 closed tapered locks. Fixed the active render UV choice that initially distorted sphere paint. Source front render uses nearest unlit textures and no lights; alpha-thresholded deliverables preserve source colour detail.

Validation: saved source reopened and repeated native render pixel-identically; all meshes manifold and bone-parented with real depth; render UVs and packed images verified; hand transform responds to modest arm pose changes; 192x224 and 96x128 exports have binary alpha and no frame clipping. Small authored origin verified (48,116). This is a rig pose check, not a run animation or gameplay test.

Remaining: front paint is projected home reference artwork. Full side/back UV painting, larger-pose joint/deformation cleanup, shared run action, hair/kit variants, atlas exporter and runtime integration remain pending. Hair alpha trims the frontal painted fringe. Do not treat a good front screenshot as proof that other views or full animation work. Original home.png, game runtime and concurrent project changes preserved; no cache changes.


## Shared chibi factory v4 (2026-09-28, Codex)

Intent: user authorized the move to one reusable volumetric chibi body with modular hairstyles and colour presets, using Captain Tsubasa's official visual presentation as guidance and home.png as the local quality reference. This prototype supersedes the projected reference-paint drafts as the development foundation; it does not establish final visual approval.

Files: art/player_factory/chibi_v4/shared_chibi_v4.blend, presets.json, textures/face.png, README.md, build-report.json, contacts.json, export-validation.json; scripts/paint_chibi_face.py, build_chibi_v4.py, export_chibi_v4.py, pack_chibi_v4.py; docs/chibi-v4.md. chibi_v4/export contains three preset folders (blue_black, white_blond, red_curly), run.png, idle.png, manifest.json and individual frames; preview.html, preview-data.json, validation.json, browser-checks.json, geometry_ready.png, geometry_rest.png, chibi-v4-variants.png, chibi-v4-run-frames.png, chibi-v4-run.gif, home-reference.png and match-scale-composite.png. Deliverables also copied to the current Codex task outputs/chibi-v4, outputs/shared_chibi_v4.blend and outputs/Ultimate_Eleven_Shared_Chibi_v4.zip. No runtime files, existing player assets or cache versions changed.

One connected manifold skinned body (3,092 vertices / 4,779 polygons), original common UV-painted head, 17 deform bones plus four foot/knee controls. Layered spikes, swept and curly hair are fitted geometric collections. Independently recolourable skin, hair, shirt, shorts, socks, boots and trim; shared Run8_Shared action. Three-band cel materials, fixed orthographic camera, binary-alpha palette export with external 1px contour. No home artwork projected onto this source, and no borrowed Captain Tsubasa model or texture.

Delivered 96 run frames (3 presets x 4 true directions x 8 phases) and 12 static ready frames. Native 96x128 with origin (48,116); 800x528 run and 400x132 ready atlases, 2px gutters. All six atlases decode to 5,702,400 bytes (5.438 MiB) before GPU/loader overhead. Frame 9 closes the action to frame 1; exported run phases 4 and 8 include flight.

Validated: source reopened; one manifold body component; normalized weights; identical body geometry hash across presets; actual deformed boot sole heights during stance and flight, IK targets, exact repeated raw render and closing key render; binary alpha, frame dimensions, clear margins and gutters. Corrected UV seam wrapping, internal union islands, inflated sock trim, misplaced foot weights and foot orientation constraints. Direction/phase sheets and native frames visually inspected. Local browser preview loaded all variants; direction, play/pause, stepping, scale, run/ready and FPS controls checked, including ready frame 1/1 with playback disabled. ZIP CRC check passes.

Remaining / next checks: improve face, hair, clothing folds and athletic motion against home.png; evaluate topology/weights for larger poses; add clothing UV/decal options, idle breathing and other actions. Calibrate stride/cadence against actual game speed before claiming no foot sliding. Runtime manifest adapter, live match/direction/ball tests, camera scale checks and performance measurements remain pending. Comparison pitch image is a composite. Preserve existing sprites and concurrent game work while reviewing this prototype.


## Meshy source review; chibi v4 style rejected (2026-09-28, Codex)

User explicitly rejected the shared chibi v4 appearance and supplied Meshy_AI_Ashen_Pixel_Hero_0928140856_generate.glb and Meshy_AI_Ashen_Pixel_Hero_0927211634_texture (1).glb from Downloads for evaluation. The v4 technical validation remains valid but does not mean visual approval. Do not expand v4 as accepted game art.

Imported and inspected both Meshy files in Blender 5.1.2; rendered front, three-quarter, side, back and texture-only front views. Delivered review, two 96x128 static pixel-scale comparisons, comparison sheet and model-audit.json under the current Codex task outputs/meshy-review; reproducible inspection scripts in work/inspect_meshy_models.py and work/finish_meshy_review.py. Original GLBs and all game assets unchanged; no runtime/cache changes.

Each has 714,422 triangles, one mesh object and one material; no armature, skin weights or actions. Generated source has no UV/images; textured source has one UV set and three 2048px maps. Raw indexed components of the textured import include UV seams; these are not proof of modular hair/body separation. The supplied art is closer to the requested anime chibi proportions, hair, face and garment detail than v4. Flat inspection removes added lighting but retains source-painted shading.

Next: use the Meshy art as a potential source, preserve appearance during mesh preparation, isolate hair, create a shared rig and colour masks, then validate actual animated sprite views. No mesh reduction, texture transfer, modular separation or rigging is completed yet; user has not approved the source as final game art. Static A-pose is not proof of run deformation or gameplay.


## Approved pixel-art appearance target (2026-09-28, Codex)

The user supplied ChatGPT Image Sep 28, 2026, 04_06_59 PM.png from Downloads and described it as basically perfect. This image is now the primary visual target, above the rejected v4 renders; home.png remains a game-scale quality reference. Unmodified copy verified byte-for-byte in current Codex task outputs/meshy-review/approved-style-target.png; updated outputs/meshy-review/REVIEW.md records the target.

Required qualities: layered dark hair and deliberate pixel highlights, large anime eyes, compact expressive face, athletic crouch, blue shirt/white shorts with visible folds and detailed clustered shading, short limbs and dark boots. Meshy is a much closer possible geometric source, but its current face paint, kit and A-pose are not a match yet. Prepare shared geometry/rig without discarding the art detail; validate one static game-size render against this target before expanding animations or variants. No model or texture edit, runtime change or cache update in this reference adoption.


## Meshy player v5 — rigged one-player style checkpoint (2026-09-28, Codex)

User authorized proceeding with the supplied textured Meshy character and approved pixel-art reference. Delivered one editable player as the next visual checkpoint; no claim of final appearance approval or exact reproduction. The rejected v4 artwork is not the source of this build.

Files: art/player_factory/meshy_v5/Meshy_Player_v5.blend; prepare-report.json, build-report.json, source-validation.json, validation.json, browser-checks.json, README.md, preview.html; original-size ready_front/straight/side/left/back/original_eyes and deformation_probe PNGs, verification_repeat.png; 192/ and 96/ native PNG sets, reference frames; unchanged approved-style-target.png, style-check.png, player-preview.png and resolution-check.png. Scripts: art/player_factory/scripts/prepare_meshy_v5.py, build_meshy_v5.py, validate_meshy_v5.py, pack_meshy_v5.py. Documentation: art/player_factory/docs/meshy-player-v5.md. User-facing source/previews also in the Codex task outputs/meshy-player-v5, with outputs/Ultimate_Eleven_Meshy_Player_v5.zip. Existing game sprites/code and cache versions are unchanged; original Downloads GLBs/reference preserved.

Preserves Meshy UVs, source paint, sculpted hair and garment folds. Welded duplicate UV vertices and UV-aware collapse reduces 714,422 to 71,442 source triangles (38,542 body; 32,900 extracted hair). This is reduction, not new quad retopology. Hair is a fitted separate object; replacement scalp and cut boundaries still require cleanup/closure. Six material regions permit recolouring while preserving source shading. Blue shirt/socks, white shorts, charcoal hair, broad cel lighting, 10% enlarged head, single-surface fitted anime eye shaders and a small mouth mark. Original eyes retained as an alternate view. Reversible Fist_Curl affects 922 hand vertices; original open hands remain in Basis.

Shared skeleton: 16 deform bones, nondeforming root plus four foot/knee controls (21 total). Automatic bone heat succeeds without unweighted vertices; weights normalized, upper head/hair bound to head and soles to each foot. Deeper ready crouch with pelvis lowering, torso lean and outward foot turn; one raised-leg/arm deformation probe. No shared run action, additional hairstyles, preset roster or run atlas has been delivered in this checkpoint.

Four independently rendered directions (front 20deg, right 75deg, left -75deg, back 180deg), plus straight front, original-eye front and probe; seven poses/views at both 192x256 and 96x128 = 14 native exports. Orthographic elevation 8deg/scale 2.30. Fixed ground origins (96,232) and (48,116), rather than per-frame alpha grounding. Nearest sampling, binary alpha, 1px external ink; original paint colours retained without a forced small palette. 192x256 is a proposed quality option, not a silently changed loader convention.

Validation: source reopens with packed images; vertex weight sums 0.999994–1.000001 and zero unweighted vertices; actual deformed stance sole world Z approximately 0.000071 / 0.000004, raised sole approximately 0.170004 while planted sole remains stationary. Skin response maximum vertex movement 0.279 units. Authored origin verified; 14 exports have binary alpha and clear margins. Reopened raw ready render pixel-identical to the original. All direction views and resolution comparison visually inspected. Local preview loads PNGs and its direction/pose, frame resolution, zoom and guide/reference toggles were checked. ZIP CRC passes. Source copies verified byte-for-byte. No gameplay or run-stride validation performed.

Remaining / next checks: compare the one-player art with the approved image before expanding animation/roster output. Face expression, hair highlight shapes, fist sculpt, shoulder/knee deformation and extracted scalp boundary still need refinement. Texture preservation does not establish visual parity. Then author shared run and additional modular hair/colour presets, manifests and a runtime adapter; calibrate stride, direction, ball/shadow and match scale, then performance. Preserve concurrent game changes and existing assets.


## Original Meshy eyes selected as default (2026-09-28, Codex)

User explicitly prefers the original Meshy eyes over the added eye treatment. Promoted the exact original-face comparison render to the default in all directions/probe exports, preview and editable Blender source. Removed authored eye/mouth decal objects and their construction code; source UV face paint is preserved. Do not repaint or replace these eyes during subsequent refinement without a new user request.

Updated art/player_factory/meshy_v5/Meshy_Player_v5.blend, ready/probe PNGs and both native export sets, preview.html, review sheets, README.md, build/source/export validation JSON; scripts/build_meshy_v5.py and pack_meshy_v5.py; docs/meshy-player-v5.md. Same source, previews and ZIP updated in the current Codex outputs. Previous source archived in task work/eyes-before. No game runtime/cache or original GLB changes.

Validation: new main front render matches the previously selected original-eye view pixel-for-pixel; saved source reopens and repeated render matches exactly; packed textures, skin weights, stance/lifted sole contact and export margins/binary alpha pass. Original eyes are now the default preview option; redundant custom-eye comparison option removed. Other art/rig checkpoints remain pending, with original eyes retained.


## Meshy shared eight-frame run with original eyes (2026-09-28, Codex)

User asked to continue after selecting the original Meshy eyes. Added UE_Shared_Run_8 to the preserved v5 body/hair/face, with ready frame 0, eight run samples 1-8 and closing key 9. Fixed root, alternating foot IK and arm swing, torso lean, pelvis bounce and swing-foot rotation. Original packed face paint is byte-identical to v5; no custom face geometry. The v5 ready-only checkpoint remains separate. This is a motion checkpoint, not final visual or gameplay approval.

Files: art/player_factory/meshy_run/Meshy_Player_Run.blend; raw/ contains four ready and 32 run PNGs at 384x512; 192/ and 96/ each contain run.png, ready.png, manifest.json and frames/ (36 native PNGs). Also README.md, preview.html, run-frames.png, run-front.gif, run-four-views.gif, contact-authoring.json, source-validation.json, validation.json, repeat-first.png, repeat-close.png, browser-checks.json, preview-check.png and unchanged approved-style-target.png. Scripts: art/player_factory/scripts/animate_meshy_run.py, verify_meshy_run.py, pack_meshy_run.py. Documentation: art/player_factory/docs/meshy-run.md. User-facing mirrors in the Codex task outputs/meshy-player-run and outputs/Ultimate_Eleven_Meshy_Run.zip. No existing player sprites, runtime code or cache versions changed; original GLBs unchanged.

Four views rendered independently at front 20deg, right 75deg, back 180deg and left -75deg, ortho elevation 8deg/scale 2.30. 32 run + four ready frames at each native resolution = 72 native exports, with binary alpha, preserved source colour detail, one-pixel contour and fixed origins (96,232)/(48,116). Two-pixel gutters. 192 run atlas 1568x1040 and ready 196x1040 decode to 7,338,240 RGBA bytes total; 96 run 800x528 and ready 100x528 decode to 1,900,800 bytes, before loader/GPU overhead. Manifest stores rectangles, origins, cadence and stance markers. Both sizes are delivered; game conventions have not been changed.

Validation: saved source reopens with original packed textures and normalized skin weights, zero unweighted vertices; original rest geometry and hand shape keys preserved. Actual deformed planted soles world Z about 0.000071/0.000004; flight samples 4 and 8 put both soles at least 0.06789 above ground. Max ankle IK target error about 0.0000613. Half-cycle vertex movement 0.42845; frame 9 equals frame 1 with zero vertex delta and pixel-identical raw renders. Reopened frame 1 render also pixel-identical. Fixed root/origin verified; all native margins, binary alpha, atlas rectangles and transparent gutters pass. All direction-phase renders visually inspected. Browser preview run/ready, four directions, pause, step, resolution/zoom, cadence and guide controls checked; ready disables playback; final front run left playing at 8fps. Source copies byte-identical; ZIP CRC passes.

Remaining: one hairstyle only; fist sculpt, shoulder/knee weighting and hair/scalp replacement boundary can still be refined. Add clean interchangeable hairstyles and colour roster presets, other football actions and runtime adapter. Calibrate in-place stance travel/cadence against actual movement speed, game scale, ball/shadow and direction behavior; measure runtime memory/performance. Sole-height checks do not prove no foot sliding in the game. Original Meshy eyes must remain unchanged unless the user requests otherwise. Preserve concurrent game changes.


## Revised Meshy athletic run; previous motion rejected (2026-09-28, Codex)

User rejected the previous Meshy run animation as ugly and the model appearance as awful, then explicitly asked to try a convincing run. Preserve this distinction: prior technical checks do not imply visual approval. This revision changes motion on the same rough Meshy model; it does not redesign the player or replace the original eyes.

Added UE_Athletic_Run_16: ready frame 0, run samples 1-16 at 24fps, closing key 17; full cycle 2/3 second. Authored separate heel strike, compression, toe push-off, heel recovery, knee drive and reach; replaced the symmetric foot sine with non-uniform Hermite trajectories. Elbows remain bent about 90deg throughout opposing arm swings. Added pelvis/chest counter-rotation and weight shift, timed pelvis height and head compensation. Actual soles determine stance height during heel/toe roll. Fixed root. Original packed face paint, rest body/hair geometry, material system and hand shape keys unchanged.

Files: art/player_factory/meshy-run-v2/Meshy_Player_Run.blend; raw/ (64 run + four ready 384x512 PNGs); 192/ and 96/ each have run.png, ready.png, manifest.json and frames/ (68 native PNGs). Both resolution folders also include previous-run.png for review. run-front.gif, run-four-views.gif, before-after-run.gif, side-pose-comparison.png, run-frames.png; README.md, preview.html, contact-authoring.json, source-validation.json, validation.json, delivery-validation.json, browser-checks.json, repeat-first.png, repeat-close.png, approved-style-target.png. Scripts: art/player_factory/scripts/animate_meshy_run_v2.py, verify_meshy_run_v2.py, pack_meshy_run_v2.py, compare_run_v2.py; docs/meshy-run-v2.md. User-facing mirrors in Codex task outputs/meshy-run-v2; outputs/Ultimate_Eleven_Revised_Run.zip includes source/helpers and previous review PNGs. Original v5 checkpoint and first run are preserved. No game runtime, existing sprite files or cache versions changed.

Four independent directions at 20/75/180/-75deg with fixed ortho scale/elevation and origins (96,232)/(48,116). 136 core native PNGs total. 16-column run atlas: 3136x1040 at 192, 1600x528 at 96; ready remains one-column/four-row. Core run+ready decoded RGBA: 13,861,120 bytes for 192 and 3,590,400 for 96, before loader overhead; previous review atlases excluded. run8 manifest alias uses alternate rectangles at 12fps without another atlas. GIFs quantize the 2/3-second cycle to 670ms due to GIF timing resolution. The before/after comparison uses equal cadence, old8 at 12fps vs new16 at 24fps; no claim of improvement based only on speed.

Validation: source reopens with packed images; original face bytes and rest body/hair/hand shape keys match v5; weights normalized with zero unweighted vertices. Actual stance sole Z within approximately 3e-8 of floor; airborne frames 7,8,15,16 have both soles at least 0.04375 above ground. Heel-to-toe lowest contact patch advances about 0.23549 source units. Elbow angles about 90.05deg; no hyperextended knees or stretched leg bones. Maximum ankle IK target error about 0.0000422. Frame17 equals frame1 with zero vertex delta and exact raw pixel match; saved source rerenders frame1 exactly. Fixed root/origin, all core frame margins, binary alpha, atlas rectangles/gutters pass. All direction-phase sheets inspected. Browser compare, directions, resolution, zoom, cadence, pause/step, 16-step wrap, ready-disabled controls and guide checked; final side view left playing at 24fps with matched previous motion at actual size. GIF frame count/duration and run8 mapping verified. Source factory copy byte-identical; ZIP CRC passes.

Remaining: user must judge the revised motion; no final art approval. Source mesh/hand/knee/shoulder deformation still limits larger poses. Body and hairstyle appearance remain unresolved. Game speed/stride calibration, live ball/shadow/direction/scale checks and performance are pending; sole-height/roll checks do not establish no gameplay sliding. Original eyes remain fixed unless user requests changes. Interchangeable hair/scalp cleanup and kit/roster work remain separate pending tasks.


## HIGH SCHOOL ground in the game (2026-09-28 · new ult11-highschool.js v1, pitch3d v147) (Claude, porting Astra's venue)

**Source.** Astra built it in `Desktop/u11 for astra/ultimate 11- for stadium` (an old copy of the game, renderer ~230 KB against ours at 368 KB), so only the module was ported, not their renderer or index.

**Ported:**
- `ult11-highschool.js` (Astra's venue): roofed school stand with blue seats and seated students, two classroom blocks, gym, changing rooms, a caretaker lodge, parking with cars, roads, bike racks, benches, lamps, chain-link perimeter with ball-stop nets, tree belts, and its own painted afternoon sky.
- `assets/stadium/highschool/afternoon-sky.png` and `materials-atlas.png` (4.7 MB).
- Three small edits to Astra's module: the sky and its two lights are named (`U11HS_sky`, `U11HS_amb`, `U11HS_fill`) so the renderer can drive them.

**Renderer hooks in our pitch3d, modelled on Santa Fede:**
- `'highschool'` added to the valid stadium keys, and a build branch.
- Its resources are released on a stadium switch (same as Santa Fede).
- No flags, banners, boards or camera flashes; corner flags stay.
- The stadium roof floodlight rig stays off at night.
- Time of day: the painted sky shows by day, is warm-tinted at golden hour and hidden at night (the U11Sky / night dome show instead); the module's lights dim for golden (.48/.55) and night (.14/.05).
- Astra's old-renderer overrides of sun and hemisphere strength were not ported: our time/weather presets drive those.

**index.html:** a HIGH SCHOOL button in Settings > Stadium; `curStadium` accepts it; script tag `ult11-highschool.js?v=1` before the renderer; pitch3d v147. Also `?stadium=highschool`.

**Verified** (GPU headless): 11 v 11 starts; kickoff pan, broadcast, hero, corner, golden, night; switching to Astra and back rebuilds cleanly; ~141 fps on this PC; no JS errors. Picture: `lab/highschool/highschool_ingame.png`. Backups: `ult11-pitch3d.js.pre-highschool-v146.bak`, `index.html.pre-highschool.bak`.

**Open:**
- At night the school has no floodlights of its own; only the court's night shading lights the pitch. Art review.
- The high-school entry is not in the main menu (Settings only).
- Not tied to story mode yet.


## Settings v2: four pages, DIFFICULTY and MATCH LENGTH (2026-09-28 · index.html, game.js v213) (Claude)

**Author:** "The settings menu needs a serious update, too many settings for one long column. Using our style, make a proper settings menu with more pages if necessary. We also need to add difficulty etc."

**Menu** (`#aeSettings` rebuilt; every old id and setter kept, so the pause menu and other callers still work):
- A 900×580 card (`min(…,95vw/92vh)`, since the modal is lifted to `<body>` outside the scaled stage).
- **Left rail**, four pages: GAMEPLAY (difficulty, match length, camera), MATCH VIEW (stadium, time, weather, PS1 filter), AUDIO (master volume with − / + steppers and a Bold Pixel readout, menu music, match music), SYSTEM (UI size, fullscreen, perf overlay, reset save data).
- Style: Cinzel page titles, Rajdhani labels and descriptions (raised from 7 px to 10 px), gold active rail item with a left rule.
- `openSettings(page)` opens on a page; the last page is remembered.
- **Pad:**
  - All toggles are now `<button>`s. They were `<div>`s the B.1 menu scan never reached, as was the volume slider.
  - The rail tabs are divs, so the pad cursor walks only the current page's controls; LB / RB (polled only while open) or Q / E / PageUp / PageDown turn the page.
- A compact layout below 720 px wide or 430 px tall (narrower rail, no sub-lines).
- Verified: every page fits without scrolling on 1280×720.

**Difficulty** (`ue_settings_v1.diff`, default `pro`; game.js `U11_DIFF` / `diffCfg()`). Only the CPU side ('a' when not PVP) changes:

| | CPU duel power | CPU super-shot chance | Cooldown | CPU keeper reflex (QTE sim) |
|---|---|---|---|---|
| ROOKIE | ×0.88 | ×0.55 | ×1.6 | −12 |
| PRO | ×1 | ×1 | ×1 | 0 |
| CHAMPION | ×1.08 | ×1.3 | ×0.8 | +6 |
| LEGEND | ×1.16 | ×1.6 | ×0.6 | +12 |

Duel power is applied in resDuel right after `calcAttackPower` / `calcDefencePower` (so afSave's reused `lastDefPow` includes it).

**Match length** (`ue_settings_v1.len`): the clock tick is 40 / 56 / 80 ms (a half is still 2400 ticks), about 1.5 / 2 / 3 minutes a half. It is read when the clock starts, so it applies from the next half or match. Verified 52 / 31 / 22 ticks per 3 s.

**Backups:** `index.html.pre-settings2.bak`, `game.js.pre-settings2-v212.bak`.

**Open:** difficulty does not yet touch CPU movement or decision speed (duels, supers and the keeper only); author playtest on the pad.


## Full debug pass (2026-09-28 · game.js v214, style.css v100, pitch3d v148, cine3 v11, highschool v2, index.html) (Claude)

**Method.**
- Static checks: all 30 local scripts exist and pass `node --check`; the 5 inline scripts pass; every `assets/…` path referenced in code was checked; every `onclick` / `oninput` handler was resolved at runtime.
- Five unattended full matches (GPU headless) in which a bot plays the human side through the real input functions (`actShoot` / `actPass` / `actCross`, keyboard movement, the real duel buttons, confirm). The bot is weak, so every match ends 0-3 to 0-5; the scores don't measure difficulty. Coverage:
  - Astra/day, Santa Fede/night/rain/Legend (Japan vs Brazil), Astra repeat, Santa Fede again, High School/golden/snow/Rookie (England vs Argentina)
  - throw-ins, free kicks, corners, goals, halftime, full time
- Targeted flows: pause menu, human and CPU penalty, human and CPU super shot (human keeper duel), restart, quit, second match with other teams, live stadium switch.
- UI walk through every screen.
- Phone emulation (844×390, touch).
- Per-scene frame-rate / draw-call profile (new `P3D.perfProbe(frames)`: whole-frame calls, triangles and live lights; `stadiumState().calls` only ever saw the composer's last pass).

**Fixed:**
1. **Idle watchdog restarted play during the goal celebration and at full time.** The stale `kickoffUntil` made "stranded idle — resuming play" fire on the first check after every goal. It called `resume()` under the GOAL title / net orbit, and after the final whistle behind the full-time screen. Now skipped while `_scoringGoal` / `_halftime`, and `goFull` nulls `G.mt` / `G.di`. Before: 7 watchdog rescues a match. After: 0.
2. **The same watchdog cut every keeper catch short.** The catch holds `idle` for ~1.1 s; the watchdog resumed play early and `finishCatch` resumed it a second time. The watchdog now only acts after 3.5 s of continuous idle (`G._idleAt`), and the catch sets its own grace. Generic fix for all 20 `phase='idle'` paths.
3. **Story Mode, Cup / Tournament and Customize opened as a blank dark screen.** They are full-window screens outside `#viewport`; `#viewport{z-index:1}` (added with the world layer) painted the stage's opaque background over them. `body>.screen{z-index:2}`. Verified all three render.
4. **Font rule.** Bebas Neue (not even loaded, so it fell back to a generic sans), Orbitron, Impact, Anton and Arial were replaced by Cinzel / Rajdhani in:
   - the SAVED! banner, impact text, the old score banner, the duel avatars and labels
   - the PvP setup screen and the career transfer market
   - club-crest SVG text
   - stadium ad boards / banners (they rendered in Impact)
   - the super-shot name slash (cine3, Anton)
   - the high-school banners (Arial)
   - the 2D-fallback HUD text

   Orbitron is dropped from the Google Fonts request.
5. **The developer "BUILD css … AI READY" tag** (marked TEMPORARY DIAGNOSTIC) showed to every player, over the away portrait on phones. Now only with `?debug=1` / `?build=1`; the console line stays.
6. **Settings on a phone:** a tighter compact layout, and the rail labels no longer wrap. At 844×390 only MATCH VIEW scrolls (56 px).

**Verified clean:** no JS exceptions in any run; memory flat (30–72 MB saw-tooth over 4+ minutes, no leak); frozen-scene fps 156–182 in all 12 stadium × time × weather combos; last two full matches min 87–100 fps; restart gives a true 0-0 / 2400 ticks with no leftover overlays; a second match fields 11 v 11; the touch stick and face buttons appear in live play on phones.

**Not fixed (for the author):**
- **Story Mode fonts:** Permanent Marker and Anton, a deliberate manga look, but outside the three-font rule. Needs a decision.
- **Phone layout:** the touch joystick overlaps the human player's portrait card bottom-left.
- **Phone performance:** night scenes are heavy (Santa Fede: 12 point lights + 4 shadowed spots, ~500 draw calls; High School night ~480–550 calls). Fine on this PC, unmeasured on a phone.
- **Dead code:**
  - the `#s-career-squad` markup calls three removed functions (`crSaveSquad`, `crSquadFormationChange`, `crSquadTab`); unreachable, since career "Squad" opens Team Management
  - `pause-menu.css`, `ult11-team.js` and `ult11-stadiumpick.js` aren't loaded
  - `ps1-mod.js` is commented out
- **404 noise:** 12 optional images missing (all have gradient / onerror fallbacks) plus many player portrait variants (`front/`, `back/`, `profile/`, `shoot/`), each a failed request per match.
- **Difficulty** still doesn't change CPU movement or decision speed.

**Backups:** `game.js.pre-debug-v213.bak`, `style.css.pre-debug.bak`, `ult11-pitch3d.js.pre-debug-v147.bak`, `*.pre-fonts.bak`.


## Author playtest fixes: match start, CPU finishing, scoreboard, keeper duels / saves / camera, pass sound (2026-09-28 · game.js v220, pitch3d v151, stadium-classic v6, sfx-samples v3, style.css v102, index.html) (Claude)

**Platform note:** the author releases on Steam (PC) first, mobile later; test and tune for PC.

1. **Black screen, then referee and a golden KICK OFF at match start.**
   - Cause: the loader only waited for `P3D.ready`, which is true from page load. On a first visit the match opened on the fallback bowl while the 12 MB Astra model downloaded (~10 s at 25 Mbps), with kits and shaders still loading, and the 3D view's first frames were black.
   - Fix: the loader now waits for:
     - `P3D.waitStadium` (GLB download progress, via the new `U11_CLASSIC.progress`, until the model is swapped in)
     - `P3D.waitSheets` (both kits + the keeper sheet)
     - `P3D.warmUp` (`renderer.compile`)
   - It then keeps the loading screen as a curtain (z 9000) over the match until the renderer has drawn 5 real frames (`P3D.frameCount`), and fades it off.
   - Verified throttled: no black frame, and the match appears complete.
2. **CPU passed back when through on goal.**
   - Cause: the only shot trigger was `progress>.88` (~6 m out; `centrality>.35` can never fail), so a striker at the edge of the box kept dribbling while the pass roll picked back-passes.
   - Fix: new `cpuClearChance`: progress ≥ .78, central band, no outfield defender within ~2.4 m of the ball-to-goal line → shoot (and the pass roll is skipped). In the final third with no pressure the CPU never passes backward.
   - Verified: 10/10 isolated through-on-goal cases shoot.
3. **Scoreboard cropped the score.** The clock and half moved into a tab hanging under the centre plate; the possession strip runs along the bar's bottom edge. The bar is now names + score only. Verified with a 2-10 score and long names.
4. **CPU keeper card never appeared** on super shots: the CPU keeper's save was decided silently at the kick. Now the ball holds short of him, his card shows while he picks, then the flight finishes. `U11_CINE3.decideAtKick=true` restores the old behaviour.
5. **Camera on the empty net during a CPU save; no save cinematic for the player's keeper.** New SAVE MOMENT (pitch3d `P3D.saveMoment`, driven from afSave) for normal shots, either keeper:
   - the duel card closes and the camera cuts low and close on the keeper
   - the ball flies from its hold point into the glove at his dive read (`GKA.bw`); catch / parry frames and a small shake on contact
   - it resolves at the contact, with the parry / spill flight starting from the glove
   - the camera stays with the ball
   - `P3D.saveMoments=false` turns it off
   - The broadcast shot-camera lead toward the goal is reduced .45 → .28 (it framed the net, not the keeper).
6. **Results shown before the action** (author, mid-fix): "COUNTERED" showed while the keeper duel card was still up. Keeper duels now show no result card. The duel card closes on the pick, and the outcome appears AT the contact as a small lower-third caption (CAUGHT! / PARRIED! / REBOUND! + keeper name, `showActionCaption`) or as the GOAL title. The super-shot route already deferred its result.
7. **Pass sound late.**
   - Cause: `short-pass.mp3` starts with 289 ms of silence and `cross.mp3` with 247 ms, on top of `<audio>` start latency.
   - Fix: all one-shots are decoded once and played through Web Audio with their measured leading silence skipped (pass 277 ms, cross 235 ms, pause-open 92 ms); fallback `<audio>` pool also skips it; crowd / run beds unchanged.
   - `SFX._audio()` reports the state.

**Verified:** targeted captures for each item; a full match (Germany vs Italy, Champion) with zero errors and save moments firing; memory flat. Backups: `*.pre-prepare*`, `*.pre-hudclock*`, `*.pre-webaudio*`, `*.pre-savemoment*`, `*.pre-cpushot*`, `*.pre-noresult*`, `ult11-stadium-classic.js.pre-loadprog.bak`.


## Super-shot SAVED! camera on the keeper; new referee sprite (2026-09-28 · cine3 v12, pitch3d v152) (Claude)

- **SAVED! showed an empty net.** cine3 `flyCam` 'out' always framed the goal hit point (1.45 m behind the line), and that camera stays up through the SAVED! banner. On a save the ball stops in the glove in front of the line, often wide, so the keeper was out of frame. For a save (`!c.isGoal`) the camera now sits ~5 m out and ~3.3 m to the shooter's side, low, looking at the ball in his gloves. The goal framing is unchanged.
- **New referee:** `assets/ps1/referee-new.png` (author, 717×717, 4×4, chibi style): row 0 run side, row 1 run toward camera, row 2 run away, row 3 idle facing camera (a 4-frame breath). Per-row measured foot anchors (.962 / .97 / .925 / .90), scale 1.03 to match the old height; the old 5×3 sheet is the fallback.
- Verified: wide super-shot save framed on the keeper under SAVED!; the referee renders in play. Backups: `ult11-cine3.js.pre-savecam-v11.bak`, `ult11-pitch3d.js.pre-referee-v151.bak`.


## Difficulty controls CPU speed; dead-code removal (2026-09-29 · game.js v222, pitch3d v153, story v7, index.html) (Claude)

**Difficulty tempo.** The author asked that difficulty also decide how fast the CPU plays. `U11_DIFF` gains `pace` (running speed) and `think` (reaction / decision time multiplier), CPU side only (`isCpuSide`):

| | pace | think |
|---|---|---|
| ROOKIE | 0.92 | 1.40 |
| PRO | 1 | 1 |
| CHAMPION | 1.04 | 0.80 |
| LEGEND | 1.08 | 0.65 |

Applied to:
- `aiTop` (every CPU off-ball runner and chaser)
- the CPU carrier's speed cap, and the CPU engager's chase step and cap
- `canReact` (how often CPU players re-read the play)
- `cpuTouchMs` (first touch)
- the carrier's look-up interval (`decideCarrierMs`)

Measured on the CPU striker: top pace 1.618 / 1.759 / 1.829 / 1.899; first touch 756 / 540 / 432 / 351 ms. The human team's AI mates are unchanged (1.717). Settings descriptions updated.

**Dead code** (the author asked; nothing deleted, everything moved or backed up):
- **17 unused files moved to `_archive/dead-code-2026-09-29/`:**
  - retired or replaced modules: `ps1-mod.js`, `ult11-sfx.js`, `ult11-stadium-classic-v2.js`, `ult11-stadiumpick.js`, `ult11-team.js`
  - an old stylesheet copy: `style-1.css`
  - old backups: `index.backup-pre-gfx.html`, `ult11-pitch3d.backup-pre-gfx.js`
  - old mockups: `pause-menu.html` / `.js` / `.css`, `duel-mockup.html`, `super-shot-customize-v3.html`, `ps1-anim-test.html`, `story-edit` / `-hub` / `-select.html`

  Docs, dev tools (sprite baker / slicer / builder), `backup/` folders and `.bak` files are kept.
- **28 never-called functions removed** (a reference scan over index.html + every loaded script, run twice for cascades), about 357 lines:
  - 25 in game.js (e.g. `togglePassMode`, `toggleMusic`, `animateBallVel`, `playDuelCutIn`, `crBuildSquad`, `crPortraitHtml`, …)
  - `nightFrame` (pitch3d)
  - `captainOf`, `preMatchLines` (story)

  Backups `*.pre-deadcode.bak`.
- **Unreachable `#s-career-squad` screen** removed (markup + CSS). It called three functions that no longer exist; career "Squad" opens Team Management.
- **Settings:** "PS1 RETRO FILTER" removed (its module was retired, so the toggle did nothing). "PERF OVERLAY" now drives the renderer's real debug overlay (`P3D.debug`) instead of the retired PS1 module.

**Verified:** all scripts and inline blocks parse; every onclick / oninput handler resolves; every screen opens; full Japan vs Germany match at Santa Fede on Legend with no errors.

**Open (minor):** one self-recovering "orphaned duel overlay while moving" watchdog in that 5 v 5 Legend match; not seen in the 11 v 11 runs.

## 3D players (Astra's Meshy factory) in the game, per-player hair, VRAM fix (2026-09-29 · pitch3d v155, cine3 v13, index.html; art/player_factory/scripts) (Claude)

The author asked to finish Astra's Meshy player work ("swap hairs, hair colours or kit without remaking hundreds of sprite sheets"), keeping Astra's baked-sprite approach.

**Pipeline** (`art/player_factory/scripts/`):
- `bake_game_sheet.py` (Blender 5.1) renders Astra's rigged model (`meshy-run-v2/Meshy_Player_Run.blend`) straight into the game's own 12x8 layout: 291x408 cells, feet on the cell bottom, ~180px body.
  - Rows: idle front/back, kick, run side/front/back, block, shoulder, super, slide, jump.
  - Look: aliased render, hard 3-band cel ramp, inverted-hull ink; `pack_game_sheet.py` adds the 1px external contour.
  - **Layers:**
    - `body`: the kit, no hair. The brown hair paint on the face mask is keyed back to skin.
    - `hair`: one hairstyle alone, neutral grey, with the body as a holdout.
  - **Scalp cap:** Astra's head is only a face mask (no skull under the spikes). A fitted ellipsoid on the head bone closes it.
  - **Styles:** `spiky` (Astra's LayeredSpikes) and `buzz` (the cap alone; with a skin tint it reads as a bald head). A new hairstyle is a `HAIR_<Name>` mesh on the rig plus a preset.
- `bake_all.py`: every preset → Blender → pack → `assets/ps1/3d/<name>.png` (~27 s a sheet).
- Presets: 24 national home kits (solid colours only; stripes and checks are not supported yet) and the 2 hair sheets.

**Game** (`ult11-pitch3d.js`):
- Opt-in beta: **Settings → Match View → PLAYERS: CLASSIC / 3D BETA** (live, remembered), or `?players3d=1`.
- **Hair layer:** a second sprite per outfield player uses the same frame as the body, is drawn a hair in front, and is tinted per player (stun grey applies too). It hides when a cinematic swaps the body texture.
  - Looks for the 17 players with front portraits were sampled from those portraits: Aldini / Goethe / Reinhardt / Meyer blond, Schmidt ginger, Bertoldi shaved, Feo bald, Mancuso / Ferlora buzz, …
  - Everyone else gets a stable per-nation palette (about 14% buzz).
  - `pl.hair={style,col}` in data overrides both.
  - `P3D.hairState()` lists every player's look.
- **Super shots:** cine3 hides the shooter's sprite and redraws him with its own rim-light / flash shader, which left 3D shooters bald for the charge and the strike. The hair layer is now composited in that shader (same cell, rim and flash included), and the aura silhouettes include it (cine3 v13).
- Keepers stay on the 2D keeper sheet.

**VRAM fix (all modes).** Every player sprite made its own `THREE.Texture` of the team sheet, and r128 uploads one GL texture per Texture object. So 22 copies of a 3492x3264 sheet used **~889 MB of VRAM**, measured.
- Each sprite keeps its own Texture (it carries the frame offset that the cinematics, aura silhouette and shadow casters read), but links to one uploaded GL texture per sheet image (`shareTex`).
- Unused masters are freed after a sheet swap.
- Now: **97 MB** classic, **184 MB** 3D with two hairstyles. `P3D.memState()` reports it; `P3D.shareSheetTex=false` gives the old path.

**Verified:**
- full Italy vs Germany matches in 3D, with and without the hair layer; no errors apart from the known self-recovering duel-overlay watchdog
- super-shot charge / flight / keeper and save moments render correctly on shared textures; 3D shooters keep their hair (Mancuso dark buzz, Aldini blond spikes)
- frame rate identical in both modes: 182 fps median, +10 draw calls for the hair (measured with no bake running)
- live CLASSIC ↔ 3D switching mid-match stays stable (the GL texture count stays flat)

**Open / next:**
- the keeper needs a 3D sheet with its own dive and catch set
- home kits only: some red nations look alike (Austria / Switzerland, China / Wales); away kits and clash checks next
- more hairstyles (Astra: Meshy hair meshes on the shared rig)
- skin tone is one tone for everyone (a skin layer would work the same way as hair)
- kit patterns (Germany / Argentina stripes, Croatia checks)
- first-pass kick, jump and slide poses
- hair is not in the cast shadow

## 2D nation kits on home.png, per-player hair; Japan kit (2026-09-29 · pitch3d v156, index.html; assets/ps1/2d; art/pixel_players/pipeline2d) (Claude)

After the 3D players and the hand-drawn bald heads were rejected, the author chose to keep `home.png` as the master and do exact colour work only: no redrawing, no image model.

**Pipeline** (`art/pixel_players/pipeline2d`, see its README):
- home.png is snapped to a 48-colour palette.
- Every pixel of all 96 frames is labelled: shirt / shorts / socks / boots / hair / skin / eye / fx, plus trims (sleeve stripes, V-neck, sock bands, shorts trim, shorts hem).
  - About 70% of frames label correctly automatically. The rest were checked frame by frame and fixed with 32 exact per-frame overrides (piece relabels plus shirt/shorts split lines).
  - Dust clouds and the super-shot bursts keep their colours. Eye whites never take kit colour.
- Each kit is a recolour by shade step (every outline, fold and pose identical), baked to `assets/ps1/2d/<team>.png` for all 24 nations.
- **Japan** is the author's reference kit (no number, no emblem): navy shirt, lighter-blue sleeve stripes, red V-neck, navy shorts with a red hem, navy socks with red bands, black hair.
- **Hair per player:** one shared grey hair layer (`hair_home.png`) drawn over the body and tinted per player. It reuses the 3D beta's hair system: portrait colours for the 17 portrait players, a per-nation palette for the rest, and super shots composite it too.

**Game:** the non-3D mode now loads `2d/<team>.png` first (old per-team sheets as fallback; `P3D.kits2d=false` turns it off). Player texture memory for a match is 140 MB (two kits + hair layer + keeper).

**Open:**
- skin tone per player (same layer technique as hair)
- hairstyle shapes and beards (need art from the author's source; see memory note)
- away kits and clash handling
- the red V-neck is only detected on front-facing frames

## Crosses and passing: box runs, pass power by hold, cross QTE (header / volley / clear / claim) (2026-09-29 · game.js v223, ult11-crossqte.js v1 NEW, pitch3d v157, index.html) (Claude)

The author asked for work on the pass and the cross, plus a QTE for a header or volley on a cross. Chosen options: pass power by hold; better runs into the box; slow motion + ring; and a defending version ("clear it").

**Box runs** (`boxRolesFor`, `attackTarget` case `'box'`):
- Roles are handed out from carrier progress .60 (was .66). Runners attack from .76 (was .84) and wait .045 short of their spot (was .075), arriving at a run.
- Before: runners were 9-36% of the pitch off their spots when the cross went in, and the cross aimed at where they stood.
- A cross now goes to the runner's **spot** (near post / penalty spot / far post), through `boxSpotFor(s,k)`, for both the human (`directionalPass('cross')`) and the CPU (`cpuCross`).
- A cross with no stick input aims into the box, not along the byline.
- Measured over 6 crosses from the wing: the meet point sat on the spot (≤0.2%), and the receiver was 0.1-1% from the ball at head height.

**Pass power by hold** (`PASS_HOLD {tap:120,max:650}`, `passHoldStart`/`passHoldTick`/`passMeter`):
- A tap on △/Q is the old short pass. Holding fills a small meter under the carrier.
- The pass fires on release, or by itself when the meter is full.
- Power 0..1:
  - The preferred distance goes from .13 to .30 of the pitch, and distance counts up to 4x more in target choice, so a full hold passes over the nearest man.
  - The ball is driven up to 1.4x faster (`launchPass(...,power)`).
- Touch uses the same hold on the PASS button.
- Measured: tap → 7-8% of the pitch at 0.6%/tick; full hold → 28-30% at ~1.0%/tick.
- CPU passes are unchanged.

**Cross QTE** (new `ult11-crossqte.js`: rules + ring UI; game.js: `crossQteSetup/PickCpu/Press/Glide/Step/End/Volley/Tick`):
- **When it triggers:** a cross (including corners and crossed free kicks, which all go through `launchPass('cross')`) whose header point lands in a box with a human at that end.
- **Slow motion:** play slows to 28% (`setSlowMo`), covering the ball, every player, jumps and sprite cadence.
  - Jumps run on a scalable clock (`jumpNow`), and the renderer has a scalable animation clock (`P3D.timeScale` / `animNow`), so a header rises and lands at the ball's pace.
  - It eases in and out over 140ms.
- **Ring:** a ring closes on your man with a mark for each button.
  - Attacking: ✕ HEADER (first) or □ VOLLEY (second).
  - Defending: □ keeper CLAIM (first, only if he is in his area) or ✕ defender CLEAR.
  - Glyphs follow the pad setting (✕/□, A/X, SPACE/E, touch JUMP/SHOOT).
- **The marks are physical:**
  - A header mark is the press that peaks the jump (apex 315ms) exactly when the ball is at a jumping head.
  - A volley mark is 300ms before the ball is at knee height (the kick animation's contact frame).
  - So the volley decision comes before the marker's header, and the volley can beat him.
- **Grading and the contest:**
  - One press per cross, graded in real ms: PERFECT ≤75, GOOD ≤180, MISS.
  - CPU men in reach at their own jump moment each roll a grade from heading skill (the aerial sigma 70-160ms). They must physically reach the ball: 2% of the pitch, the aerial rules' own reach.
  - Better grade wins. On equal grades the human wins: header .55, volley .45, clear .55, claim .65; against a CPU keeper, .20 less.
  - Both missing: the ball drops on.
- **Outcomes:**
  - Header, clear and claim go through the existing `aerialResolve` (header at goal → keeper duel, with the GK QTE).
  - Volley is a new duel action: `ATK_ACTIONS.volley {mult 1.25, cost 0}`, label ⚡ VOLLEY, with the ring grade applied as `G.D.volleyEdge` (PERFECT 1.35, GOOD 1.05).
- **While the ring is up:**
  - The physical aerial contest stands aside.
  - ✕/□ are routed to the ring (`actJump` / `actShoot`).
  - The committed men close the last stretch to the ball (`crossQteGlide`).
  - QTE jumps cost no spirit.
- **Off in PvP.** `G._cqOff=true` disables it.
- **Tests** (headless, Italy/Japan vs Germany):
  - PERFECT header won 7/9 → keeper duel with header edge 1.2.
  - PERFECT volley won 5/6 → keeper duel 'volley' edge 1.35.
  - Early press graded MISS (-200ms).
  - No press → CPU wins.
  - Defending clear / claim resolve.
  - Full-match soak with a bot: 0 errors, fps median 103, slow motion never stuck.
- **Verdict so far:** screenshots only. Nobody has played it in motion yet, so the 28% slow motion, the 720ms lead-in and the windows are the first things to tune (`CROSSQTE.TUNE`).

**Open:**
- Tune after the author plays it (slow factor, ring lead, windows, CPU grade strength: strong defenders roll PERFECT often).
- The volley swing uses the normal shoot animation; a dedicated volley/scissor frame set would read better.
- The human is idle during a CPU cross except for the ring (no stick-steered defender in the air).
- The match clock keeps running in real time during the ~2s slow motion.

## Tactics and man-marking now drive the match AI (2026-09-29 · game.js v224, ult11-teammanage.js v2 comment only, index.html) (Claude)

The Team Management screen (09-24) saved `HT._tm = {tac, marks:{mySlot: opponentId}}`, but the match never read it. The match now reads both live, every tick, so a change from the pause menu applies at once. It applies to YOUR side only; the CPU keeps BALANCED plus its automatic `teamStance()`.

**Tactics:** `TACTIC_PROFILES` / `tacticOf(side)` near `teamStance`.

| | line | rest-defence | press | runs | max runners | full-backs | short options | forwards when defending |
|---|---|---|---|---|---|---|---|---|
| BALANCED | 0 | 0 | - | x1 | 2 | as before | 2 | 0 |
| ATTACKING | +.05 | +.06 | yes (their half) | x1.35 | 3 | overlap x1.6 | 2 | +.04 |
| DEFENSIVE | -.06 | -.06 | - | x0.55 | 1 | both stay home | 2 | -.05 |
| COUNTER | -.04 | -.03 | - | x1.1 | 2 | overlap x0.6 | 2 | +.06, plus a break on winning the ball |
| POSSESSION | +.02 | +.02 | - | x0.7 | 2 | as before | 3 | 0 |

Where each column is applied:
- line: `defLineProg` in moveOffBallV2.
- rest-defence: `attackTarget` default case.
- press: the ATTACKING press in `defensivePlan` works like the PRESS toggle, including the engager's chase pace.
- runs, max runners, full-backs and the COUNTER break: `decideAttackJob`. `G._wonAt` is stamped on a turnover in `_aiJobsReset`; for 2.6s after winning the ball the forwards run in behind with no hold and no runner cap.
- short options: `supportersFor`.
- forwards when defending: the `att` zone anchor.

**Man-marking:** `manMarksFor(ds)` maps HT._tm.marks (player ids) to their slots. In `defensivePlan`:
- A chosen marker is taken out of the cover, guard and presser picks.
- His man is taken off anyone else.
- `legal()` always passes for him.

`defensiveTarget` keeps him goal-side of his man and a touch toward the ball, 2% of the pitch off, wherever he goes. He never follows past halfway. If his man has the ball, the engager handles it.

**Measured** (headless, Italy vs Germany, fixed carrier positions):
- Defending line from the plan: ATTACKING .50 > POSSESSION .47 > BALANCED .45 > COUNTER .43 > DEFENSIVE .42.
- Presser: ATTACKING 100% of the time, the others 0 (outside the automatic 3s counter-press after losing the ball).
- Runners in behind: ATTACKING 3, BALANCED 1.7, COUNTER 1.5, POSSESSION 1.3, DEFENSIVE 0.5.
- Short options: POSSESSION 3, the others 2.
- CB1 man-marking a wandering striker: distance mean 3.8% / max 5.6% of the pitch, against 8.1% / 14.5% zonal.
- Full-match soak with a bot (COUNTER, CB1 marking their ST): 0 errors, full time reached, fps median 144. The man-mark was active 71% of the time (the rest: we had the ball, or their ST did). COUNTER breaks fired after turnovers.

**Open:**
- Full-back overlaps never showed in the fixed test positions, with or without the tactic. The overlap multiplier is in, but the overlap trigger itself needs a look in live play.
- The tactic is not shown on the match HUD.
- The CPU has no tactic choice of its own.

## Duel timer 15 s, match clock slows in duels, added time + no whistle mid-attack, stamina gates + error sound (2026-09-29 · game.js v225, ult11-sfx-samples.js v4, index.html) (Claude)

The author's 30%-faster tempo target (C.1) is already met by the game as it plays now, so it's closed; no global speed change. Four changes:

**Duel timer.** `DUEL_SECS=15` (was 30): the countdown, arc and "CHOOSE ATTACK (15s)" texts; urgent colour from 5 s. While a duel is open the match clock runs at a steady 40% (`CLOCK.duelRate`, accumulator) instead of the old random 55% skip, which read as stop-start. Measured: 20 of 50 clock ticks in 2 s during a duel.

**Added time and the whistle** (`CLOCK`, `addedTimeTicks`, `whistleWait`, `showAddedBoard`, `addedTimeReset`):
- At 45:00 / 90:00 the added minutes are worked out from that half's stoppages: goals x0.8, fouls x0.35, offsides x0.25, substitutions x0.4, plus 35% of the time the ball was dead at corners / throw-ins / free kicks. Rounded and clamped to 1-4 (first half) or 1-6 (second).
- A fourth-official "+N" board appears beside the clock (Bold Pixel, accent blue), and the clock runs on past 45:00 / 90:00.
- When the added time is up, the whistle waits:
  - for any live action (duel, ball in the air, corner, free kick, penalty, shot): no cap;
  - for the ball in or around either shooting box: capped at 12 s so it cannot run forever.
- Resets at the second half (`addedTimeReset`).
- Measured: 3 fouls + 2 offsides gave +2; the clock ran 45:01 to 47:00; with the ball held in the box the half-time whistle waited, then blew at the 12 s cap.

**Stamina gates:**
- The root bug: 16 places read `pl.spirit||1500` (or `||2000`). A spirit of exactly 0 is falsy, so an exhausted player read as FULL. That gave super shots in duels and CPU super-shot cinematics at 0, and full-looking duel buttons. All now use `spiritOf()`. The one exception is a fresh substitute coming off the bench.
- The field super shot (`manualShot('special')`) now also needs its 400 SP; the CPU gate (`cpuWantsSuperCine`) is fixed by the same `spiritOf`.

**Error sound:**
- `staminaDenied(msg)` = message + `SFX.error()`. It is used by jump, standing and slide tackle, block, and the super shot on the field, and by `duelCantAfford` for greyed duel buttons (mouse and pad both go through it).
- `SFX.error` is the Cancel sample played lower (x0.74) and a little louder, with its own spacing; `play()` gained a playback-rate argument. For a real recording, change `error:` in the `files` map.
- Verified: super shot, jump and duel-button refusals each played it once; the CPU refused a super at 0.

## Full-back overlaps actually happen now (2026-09-29 · game.js v226, index.html) (Claude)

**Cause:** with the ball wide in their half, the ball-side full-back is always the nearest short option. `supportersFor` kept him as a supporter, and `decideAttackJob` returns 'support' before it reaches the full-back branch, so the overlap roll never ran. Measured before the fix: 0 overlaps in every test, with any tactic.

**Fix:**
- `decideAttackJob` rolls the overlap first, when all of these hold:
  - he is the ball-side full-back;
  - the carrier is wide (|y - mid| > .16H) in their half (prog > .45);
  - the tactic's overlap factor is at least .6, so never under DEFENSIVE;
  - he is not resting from his last overlap (2.5 s after it ends).
- An overlap in progress runs its course: `moveOffBallV2` no longer re-thinks it every frame.
- `supportersFor` skips a man who is overlapping.

**Measured** (winger on the ball, wide, 62% up the pitch; share of time a full-back is overlapping): BALANCED .80, ATTACKING .69, POSSESSION .35, COUNTER .19, DEFENSIVE .18. DEFENSIVE's .18 comes from the old path's occasional roll, which it keeps.

## A finished match is fully closed (2026-09-29 · game.js v227, index.html) (Claude)

**Author's report:** after finishing a match and going back to the menu, it was still running in the background, with sound and faces.

**Cause:** `goFull()` only cleared the clock. The frame loop (`startAnim`) and every pending timer stayed alive, so one stray `resume()` put the ball back in play behind the menus (a keeper throw, a restart, a cinematic finishing). The next CPU shot then opened a duel, with portraits and a whistle, over the menu. The full-time screen's MAIN MENU / CHANGE TEAMS only switch screens, so nothing stopped it.

**Fix:** one `matchShutdown()`, called by `goFull` (every branch: friendly, career, cup, story) and by `exitToMenu`. It:
- marks the match `G.over`;
- stops the loop and the clock and kills every duel countdown;
- bumps `goalGen` / `_fkGen`, so generation-guarded timers die;
- clears the kick, aborts a super-shot cinematic, closes the duel and hides the busts;
- clears the pass hold and meter, the cross QTE ring and slow motion, the ball in flight, the charge sound and the banners.

`resume`, `opDuel`, `startMT` and the frame loop refuse to run while `G.over`. `startGame()` builds a new G, which clears the flag. The stats on G stay for the full-time screen.

**Verified:** played to full time, then MAIN MENU, then called `resume`, `opDuel` and `startMT` by hand. For 6 s after: no movement, no sound, no duel or busts, clock stopped. A new match then started and ran normally.

## Forfeit / Restart without a browser box (2026-09-29 · game.js v228, index.html) (Claude)

**Author:** forfeiting a match popped a web box that threw the game out of full screen; closing a match should happen inside the game, and nothing else should change.

**Fix:** `pzForfeit` and `pzRestart` no longer call `confirm()`. Choosing them in the pause menu is the decision:
- FORFEIT → `exitToMenu()`, which now runs `matchShutdown()`.
- RESTART → `matchShutdown()` on the old match, then `startGame()`.

**Verified:**
- Restart mid-match gives a fresh 0-0 match that plays; the old match is marked over.
- Forfeit returns to the main menu with nothing running.
- 0 browser dialogs.

**Still native dialogs elsewhere (not in a match):**
- Career: transfer buy / sell / release confirms, several "not enough budget / squad full" alerts, "Delete saved career?".
- Cup: "Abandon this tournament?".
- Story: restart.
- Settings: "Reset ALL save data?".
- Custom names reset.
- Two "coming soon" alerts on the career management screen.

Each of these also leaves full screen. Replacing them with one in-game confirm panel is the follow-up.

## Loading screen: Italy runner, true-size game ball, loading not rushed (2026-09-29 · game.js v230, pitch3d v158, style.css v104, index.html; new assets/ps1/2d/loading_run_italy.png, assets/loading_ball_strip.png) (Claude)

**Runner:** Italy's own run cycle from the game sheet (`assets/ps1/2d/italy.png`, row 3, 12 frames). Cropped to the body, baked nearest-neighbour like the in-game sprites, 143x135 on screen at 1 s per cycle.

**Ball:** the game's own `assets/ball-sprite.png` (16 frames) at the in-game size. In the game the ball is 0.21 x the body height, so it is 28 px beside the 135 px runner; the old one was 48 px. It sits at his front foot.

**Not rushed:**
- `UELoader.run` stays at least 1.8 s (was 0.95 s).
- The bar fills smoothly and never shows more than is really done or than the time allows, so it cannot jump 0 → 100 and vanish.
- It waits for the fonts. "Ready to play" appears only when the bar reads 100%.
- The existing curtain still holds the screen until the 3D view has drawn real frames.
- `P3D.waitSheets` now also waits for the 2D hair layer (it was only requested at the first frame, so hair popped in after the screen) and the pixel ball sprite.

**Measured:** the loading screen is up ~3.4 s for a cached Italy vs Germany, and the bar fills 0-100% over ~1.9 s.

## Every browser box replaced by an in-game dialog (2026-09-29 · new ult11-dialog.js v1; game.js v231, pitch3d v159, cup v7, custom v7, story v8, camlab v9, sky v4, index.html) (Claude)

**Author:** "replace all browser boxes". A native confirm / alert / prompt throws the game out of full screen and looks like a web page.

**`ult11-dialog.js`:**
- API: `UEDialog.ask(msg,{title,ok,cancel,danger})` → Promise<boolean>; `UEDialog.tell(msg,{title,ok})` → Promise; short names `ueAsk` / `ueTell`.
- Look: one panel drawn inside the game. Cinzel title (red on a destructive question), Rajdhani message with line breaks, gold corner brackets, dimmed backdrop (a click on the backdrop cancels).
- Destructive questions open with CANCEL focused.
- Several calls queue and show one after another.
- It registers as the FIRST menu owner in game.js `_navStep` / `_navConfirm` / `_navBack` (the TS2 / TM2 / PM2 / FT2 shape), so d-pad / arrows move the focus, ✕ / Enter / Space choose, and ○ / Backspace cancel. Escape also cancels while it is open. `_navScreenEl` returns it while open.

**Converted (every one in the game):**
- Career:
  - NEW (delete save);
  - transfers: release / sign / buy confirms;
  - notices: player not found, squad too small / full, not enough budget, career required.
- Settings: Reset all save data.
- Career management: the COACH / TACTICS "coming soon" notices.
- Cup: abandon.
- Customize: reset names.
- Story: start over.
- Camera Lab: engine not ready.
- Renderer: the two debug-only OVAL messages (now console plus dialog).
- Sky tool: copy-values fallback (console plus dialog).
- The match forfeit / restart ones were removed earlier today (v228).

**Only left:** `sheet-slicer.html`, a standalone dev page outside the game.

**Verified:**
- Reset opened with CANCEL focused; Escape cancelled and nothing was wiped.
- Arrow → CONFIRM → Enter returned yes; Backspace returned no.
- Two notices queued in order; the COACH button opened its notice by mouse.
- 0 native boxes.

## Crosses in focus: depth of field and camera follow the action (2026-09-29 · pitch3d v161, game.js v232, index.html) (Claude)

**Author:** on a cross, the landing area was blurred like depth of field instead of in focus.

**Cause:** the tilt-shift keeps only one screen line sharp. In the night rig (the default look) that line sat on the CARRIER's feet, and while a pass is in the air the carrier is still the PASSER. So a cross landed in the blur. The day looks kept a fixed centre line, and the camera, which followed only the ball, lagged a cross, so the header point was often low or off-screen.

**Fix:**
- `actionFocusPoint()` / `tiltFocusY()`: the sharp line sits on the action and glides there:
  - a cross's header point;
  - the ball for any other ball in flight or a loose ball;
  - the carrier otherwise.
- The night rig uses it all the time; the day looks only during a cross, then ease back to their fixed line.
- `updateCamera`: during a cross the camera leads 60% toward the header point (1.6x catch-up), like a shot leads toward the goal.
- game.js `cqRingPos`: the ring centres on the BODY. `playerScreenPos` returns the middle of the whole sprite cell and the body fills its lower half, so the ring floated above the runner.
- Debug: `P3D.tiltFocus()`.

**Verified** (4 crosses):
- The runner is on screen and inside the ring every time.
- The focus line sits 0.29-0.60 of screen height, never pinned to an edge.
- The box and players at the header point are sharp; the foreground and crowd are soft.

## Team Select shows the 2D nation kits (2026-09-29 · ult11-teamselect.js v4, index.html) (Claude)

**Author:** Team Select did not show the new kit sheets, although the match did.

**Cause:** `sheetFor()` in the Team Select module loaded the old `assets/ps1/<team>.png`.

**Fix:**
- It now follows the match's own order: `assets/ps1/2d/<team>.png`, then the old sheet, then home / away (`P3D.kits2d===false` skips the 2D kits, like the match).
- The HOME shirt icon now wears the same kit: `KIT2D` (shirt / collar / sleeve cuffs for all 24 nations, exported from `art/pixel_players/pipeline2d/kits2d.json`). Before, it used the crowd's supporter palette, so Japan showed light blue with white trim. Clubs keep their own colours.
- If a kit is changed and re-baked, re-export `KIT2D` too (or read `kits2d.json` at runtime).

**Checked:**
- The penalty scene already takes the match's live sheet.
- `ult11-kitrun.js` (the old home / away run strip) draws into `#ts-run`, which the new Team Select no longer shows.

**Verified:** screenshot, Japan vs Germany. Navy Japan sprite and shirt icon (red collar, blue cuffs), white Germany.

### 2026-09-30 — Head-baked sheets (ult11-pitch3d.js v162)
- `P3D.headBaked = ['japan']`: sheets with their own drawn heads skip the shared hair layer (it caused black scribbles on faces).
- Side effect: every Japan player now has the sheet's single hair colour (no per-player tint). Per-player hair on hand-made heads would need a separate head layer.

### 2026-09-30 — Night beams v2 (ult11-pitch3d.js v163)
- Volumetric floodlight beams: ray-marched cones, soft core, lamp-hot, soft ceiling. They replace the 09-27 shader (brightness inverted, hollow-tube look).
- Tune with `P3D.rig.beam`; A/B with `P3D.rig.setConeStyle('classic'|'vol')`.
- Next toward the HD-2D look, not started: floodlights lighting the sprites (rim / normal light), lamp glare streaks, wet-grass sheen at night.

### 2026-09-30 — PRESS START / KICK-OFF prompt (style.css v105, game.js v233)
- `.ue-start` component (author reference): the splash's PRESS START and the match KICK-OFF prompt, with a softly pulsing blue light under the word.
- Start / A / Enter on the splash enters directly.

### 2026-09-30 night shift — look toward the targets (pitch3d v164, stadium-classic v7)
- Living grass layer (`P3D.grass`), golden sun shafts + crowd sun/shade (`P3D.sunShafts`), round-bulb lamp clusters + 10 secondary banks + tier lamps, lusher night turf, low-camera bokeh (`P3D.bokeh`), `P3D.camHook`.
- Targets in `art/look_targets/`.
- For the author to judge:
  - Whether golden hour should become the default day.
  - Shaft strength (`P3D.sunShafts.gain.golden`).
  - Night turf brightness.
- Pre-existing: Santa Fede golden is very dark.
