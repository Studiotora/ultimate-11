# Ultra Shot — Roadmap

Reference: `art/ultra_src/` (the author's standalone mockup `ultra-shot-mockup.html` + the 54 keyed VFX frames in `vfx/`, packed for the game into `assets/vfx/ultra_frames.webp` by `art/ultra_pack.py`).
Rules: captain only · special meter full · once per match · unstoppable · burn mark fades.

(The author's roadmap as pasted 2026-10-02; the status of each phase is in the **Status** section at the bottom.)

## 1. Meter rules (design)
- **One meter per team**, filled by successful actions by any player on that team; only the captain can fire it.
- **Gain table (starting values, tune after telemetry):**

| Action | Points |
|---|---|
| Completed pass | 1 |
| Interception | 2 |
| Dribble won | 3 |
| Tackle won | 3 |
| Shot on target | 3 |
| Save (GK) | 4 |
| Lost ball / failed duel | −1 |

- **Target:** `ULTRA_MAX = 100` (placeholder). The meter never drains on its own, and losing the ball subtracts.
- **Calibration rule:** set `ULTRA_MAX` at ~1.3× the points an *average* match produces. A good match fills it in the second half; a bad one never does.
- **After firing:** the meter locks (`used = true`) and its bar shows "USED" for the rest of the match.
- **Open question:** should the AI's captain have it too? Symmetric is fairer and makes the meter feel high-stakes. → built symmetric.

## 2. Phases

**Phase 0 — Measure first.** `?debug=1` telemetry: per-match counts of each action type. Play 3–5 matches and record the totals. Set `ULTRA_MAX` from real numbers, not guesses.

**Phase 1 — Meter state** (`ult11-ultra.js`): `window.U11_ULTRA`; gain table and `ULTRA_MAX` at the top as tunables; `reset()` from `exitToMenu()` and on match start.

**Phase 2 — Hooks in game.js.** One `U11_ULTRA.add()` per live success branch. ⚠ Fix or guard the dormant `afSave` bug first.

**Phase 3 — HUD meter** (mockup-first).

**Phase 4 — Trigger and resolution.** Meter full + captain has the ball within shooting range → shoot command offers ULTRA. Bypass GK adjudication (always a goal); queue the goal under the `goalGen` guard; `consume(team)` at commit, not at goal.

**Phase 5 — Cinematic** (`ult11-pitch3d.js` / `ult11-cine3.js` / `ult11-ultrafx.js`). Approved mockup values: `chaseDist 1.95`, `chaseHeight 0.07`, `chaseFov 22`, `slowMo 0.2`, `netFov 6`, `bloom 1.1`. Shots: charge 1.5 s with the VFX clip at 24 fps locked to the ball · chase · slow-mo before the GK · 4-frame impact · side net shot with steam · aftermath. Burn mark: ember → char → green over ~60 s of game time. Bloom selective.

**Phase 6 — SFX.** Thunder crack + rising charge; bass drop + crack on the kick; chase rumble/whoosh + crackle; slow-mo near silence; impact crack + boom, net swish; crowd roar + steam hiss.

**Phase 7 — Tune and ship.** Use telemetry; bump `?v=N`.

## Known risks
- VFX clip licence: confirm it covers use in the game.
- The 54-frame overlay costs memory (here: one half-size sheet, ~28 MB decoded, one colour tinted at a time).
- Mockup sprite loading was unreliable in the artifact viewer, so use the in-game assets instead.

## Status
2026-10-03 playtest follow-up: provisional `U11_ULTRA.MAX = 60` after four matches; the special-shot input now fires a ready captain's Ultra before checking ordinary super-shot stamina. Opening, net and aftermath cameras and HUD spacing were revised. A visible match check and exact `U11_ULTRA.tele()` totals remain for final tuning.

Further 2026-10-03 playtest correction: the Ultra camera is wider/farther, layered ball effects are reduced, and the overlay remains active for the net smoke. `U11_ULTRA.TEST_FRISINA=true` temporarily makes home Frisina's Ultra immediately available, range-free and unlimited for repeated visual tests. Remove this after approval; see the latest `CHANGELOG_SESSION.md` entry.

Latest 2026-10-03 screenshot follow-up: center the captain in the charge, enlarge and brighten the silhouette aura, show the net from a three-quarter field view, and hold the ball against a sustained bulge in the back mesh. Implemented in cine3 v19 / pitch3d v184; author visual review still pending.

See CHANGELOG_SESSION.md, "2026-10-02 — ULTRA SHOT" (what is built, what is left, how to test).
