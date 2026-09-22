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
