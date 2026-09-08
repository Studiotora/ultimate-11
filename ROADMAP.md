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
   no match engine, no menus. We only merge into `game.js` once it feels right in the lab.
   (Same method that made the duel redesign work.)
3. **Every step has a "done when"** — written below. If we can't demo it, it isn't done.
4. Bump `?v=` on every touched file, and hard-refresh (`Ctrl+Shift+R`) — the HTML
   document itself caches, this has bitten us twice.
5. Keep `CHANGELOG_SESSION.md` current so a lost context window never costs us work.

---

## PHASE 0 — Quick wins (hours, not days)

Small, isolated, no dependencies. Clears the cheap complaints immediately.

- **0.1 · Pitch resolution** — ✅ DONE (`pitchPx` 768 → 2048 + max anisotropy).
  *Directly answers "the ground texture is the biggest problem rn."*
- **0.2 · GK save direction** — 🟡 CODE DONE, awaiting one visual sign-off in a match.
  Was: `diveDir: Math.random()<0.5?1:2` — the dive was a coin flip, and a *save*
  always played the same centre-catch cell no matter where the ball went.
  Now: every shot carries an aim (`{s:-1|0|+1, h:0..1}` in camera space), which
  drives (a) the ball's actual corner and height, (b) the keeper's pose lane —
  lateral dive mirrored for a left-hand shot, high vertical catch, or low
  smother, (c) his lateral travel, (d) a lean angle so the one dive pose covers
  a ground shot (flat stretch) and a top-corner shot (upright) with no new art.
  On a goal he commits the correct way, stops short of full extension, then
  drops into the beaten pose. Both cinematic paths (v1 + v2) fixed.
  Files: `ult11-pitch3d.js` (v57) · lab: `lab/lab-gk-dive.html`.
  **Verified:** all 12 placement × outcome cases in the lab.
  **Still to check:** one super shot in a live match (the preview pane here runs
  hidden, which pauses `requestAnimationFrame`, so the 3D loop never ticks —
  nothing to do with the game; it needs a real visible browser).
- **0.3 · Brand sweep** — strip Adidas/Nike marks, real federation crests, real kit
  designs from *all* assets (menu art included, not just team select). Legal risk is
  small now and existential later. Replace with the fake set you already made.
  **Done when:** grep + visual pass finds zero real marks in `assets/`.
- **0.4 · Dead code** — remove the 2v1 / 1v2 branches entirely (currently only
  disabled via `if(false && ...)`). 1v1 is the only duel shape now.
  **Done when:** no reference to multi-attacker duels remains in `game.js`.

---

## PHASE A — Art direction lock (the cheapest big win)

This is first because *everything downstream inherits it*. Changing a font once is
minutes; changing it after we've built five new screens is a day.

- **A.1 · Style bible + design tokens** — `STYLE.md` + a `tokens.css` holding the
  single source of truth: palette (≤16 UI colours, sampled to match the pitch/sprite
  palette), type scale, panel geometry, border rule, corner notch angle, glow rules.
  Octopath reference: near-black translucent panels, 1px warm-gold rule, generous
  letter-spacing, serif smallcaps, *numbers in pixel font only*.
  **Done when:** every colour and font size in the game comes from a token, and I can
  reskin the whole UI by editing one file.
- **A.2 · Retrofit all screens to tokens** — menu, team select, in-field HUD, duel,
  GK, pause, results. Mostly deletion: the FIFA-isms (gradient bars, glossy chips,
  gacha row) come out.
  **Done when:** side-by-side screenshots of all 7 screens look like one product.
- **A.3 · Portrait unification pass** — `lab/lab-portrait.html`: load a portrait,
  apply palette-clamp + light posterize + shared frame + rim light, compare against
  the pixel sprite of the same player. Bake the winning treatment into the asset
  pipeline (offline, so there's no runtime cost).
  **Done when:** the portrait and the sprite of the same player are recognisably the
  same man — same hair colour, same skin tone, same kit, no phantom beard.

---

## PHASE B — Input system (pure code, no art dependency)

Self-contained, testable in a lab, and it *unblocks Phase C* — jump and dodge cannot
exist until there is an input layer to bind them to.

- **B.1 · Input abstraction layer** — one module mapping physical input →
  semantic actions (`MOVE`, `SPRINT`, `JUMP`, `PASS_SHORT`, `PASS_THROUGH`, `CROSS`,
  `SHOOT`, `TACKLE`, `CONFIRM`, `CANCEL`, `PAUSE`). Three backends: keyboard,
  Gamepad API, touch. Nothing in the game reads `keydown` directly ever again.
- **B.2 · Kill the mouse** — `GO` and on-screen `PAUSE` buttons removed; `Enter` =
  confirm, `Tab` = pause, duel choices bound to keys/face buttons with visible prompts.
- **B.3 · Key binding settings screen** — remappable, persisted to `localStorage`,
  shows the correct glyph per detected device (WASD / Xbox / PlayStation / touch).
- **B.4 · Android touch layer** — virtual stick + 4 action buttons, safe-area aware.
  **Done when:** a full match is playable start-to-finish with keyboard only, with a
  controller only, and on a phone — with zero mouse clicks.

---

## PHASE C — Gameplay feel (the thing they actually criticised)

- **C.1 · Tempo pass** — global speed +~30% (player run, ball travel, animation, and
  crucially *transition/cutscene length*). Expose every constant in a debug tuning
  panel so we tune by feel, not by guessing.
  Also: dial back cutscene frequency — a duel every few seconds is what makes it drag.
  **Done when:** a 90s clip feels faster than the Reddit video, back to back.
- **C.2 · Jump + tackle timing window** — `lab/lab-jump.html`. Tackle gets a wind-up
  and a vulnerability window; a well-timed `JUMP` hurdles it and keeps possession —
  *no duel triggered*. Mistimed = duel, or lost ball. This is the single change that
  adds "skill" to the moment-to-moment.
  **Observed problems to fix here (user, 2026-09-08):**
  1. The tackle resolves *so fast it is barely visible* — no readable wind-up,
     contact, or recovery. It needs real frames and real time.
  2. The duel opens **before the sprites visibly connect**, so the duel feels
     unmotivated — cause and effect are inverted on screen. Contact must land
     first, then the duel.
  3. The slide tackle in particular must **show the player sliding along the
     grass**, the way every football game reads it — extended leg, low body,
     turf spray, a travel distance you can see. Right now it's a pose swap.
  Build it in the lab the same way `lab-gk-dive.html` works: scrub the whole
  tackle over time, all phases visible as discrete frames, before touching the
  match engine.
  **Done when:** in the lab I can consistently hurdle a telegraphed tackle and
  consistently fail when early/late, the slide visibly travels, and the duel
  only fires after visible contact. Then merged into the match.
- **C.3 · Short pass** — distinct from the through pass: fast, low risk, low reward.
  Gives the player a real decision instead of one pass verb.
- **C.4 · Cross → header** — needs ball height (z) in the 2.5D sim, an aerial contest,
  and a header duel variant. Depends on C.2's jump. Biggest of the four.
  **Done when:** a cross from the wing can be met and scored with a header.
- **C.5 · Super shot payoff** — the special shots must *look* super: screen shake,
  speed lines, time compression, ball travelling visibly faster than any normal shot.
  Cheap, and it's the moment people screenshot.

---

## PHASE D — Duel sprite rework (largest, most asset work)

Your plan here is correct and I'd change nothing structurally. Restating it as steps:

- **D.1 · Sprite spec** — decide resolution, canvas, anchor points, palette (from A.1),
  and lock a **grayscale master body** so the kit baker can recolour it, exactly like
  the in-field sheet. Two poses: **front** (facing camera) and **back** (facing away).
- **D.2 · Idle animation** — 2–4 frame weight shift, left/right sway. This alone kills
  the "static, no atmosphere" problem.
- **D.3 · Kit baker extension** — extend `kit-baker.html` to bake duel sprites, so
  2 masters × N kits = unlimited teams with no new art.
- **D.4 · Head layer** — heads as a separate anchored layer over a shared body.
  One body, many faces. This is the multiplier that makes a full roster feasible.
- **D.5 · Duel wiring** — attacker front / defender back, then swapping perspective on
  the counter-turn. Replaces the current two-players-both-facing-camera problem *and*
  fixes the direction-of-travel nonsense.
- **D.6 · GK screen upscale** — keeper portrait + net background at higher res, new
  UI language applied. Layout stays exactly as it is (keeper-only, net behind) —
  that screen already works.
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
  a consistent sprite base. It guarantees the front and back sprites are the same
  body at the same proportions. **But** it's a whole pipeline to stand up, and you
  only need *two* poses.
- **Verdict:** do D.1 by hand/AI first. If the front and back masters refuse to agree
  on proportions after a couple of attempts, *then* we stand up the Blender pipeline —
  at that point it pays for itself. Not before.

---

## Suggested order of attack

```
0.2 → 0.3 → 0.4        (quick wins, clears cheap criticism)
A.1 → A.2 → A.3        (art direction locked before we build anything new)
B.1 → B.2 → B.3 → B.4  (input layer, unblocks gameplay)
C.1 → C.2 → C.3 → C.5  (feel; C.4 cross/header after)
D.1 → D.2 → D.3 → D.4 → D.5 → D.6
```

Phase A is deliberately before Phase D: if the palette isn't locked first, every
sprite we bake in D has to be re-baked.
