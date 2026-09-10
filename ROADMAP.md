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
5. Keep `CHANGELOG_SESSION.md` current so a lost context window never costs us work.

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
- **B.2 · Kill the mouse** — `GO` and on-screen `PAUSE` buttons removed; `Enter` =
  confirm, `Tab` = pause, duel choices bound to keys/face buttons with visible prompts.
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
