

## 2026-10-02 — Super dribble names + debug pass: audio lock, home menu highlight, save-flash centring (game.js v256, ult11-pitch3d.js v177, ult11-sfx-samples.js v6, ult11-hitfx.js v4, index.html, new DEBUG-CHECKLIST.md)

- **Author:**
  - Dribbles are all "Falcon Dribble"; they need a name, connected to the super shot.
  - Make a debug checklist: audio sometimes all gone except the music; FRIENDLY stays blue; the super-save effect is not centred on the keeper's fist.
- **Super dribble names:**
  - `P3D.dribbleName(pl)`: a signature's own name (Raijin Flash, Ryujin Coil, Phoenix Dash, Mjolnir Charge, Jade Slither, Solar Stride, Dark Nova Step, Crimson Rush), otherwise the trail family's (Inferno Dash, Byakko Prowl, Storm Step...). A plain shooter's is Super Dribble.
  - `superMeta(id, pl)` in game.js feeds the duel menu button, the committed label and the cutscene.
  - `SUPER_NAMES['super-dribble']` is now plain "Super Dribble".
- **Audio lock:**
  - Effects and the crowd now also unlock on any gamepad button, on page music that is already playing, and when the tab returns.
  - Web Audio is only used when the context is running; otherwise the `<audio>` fallback plays.
  - `SFX._audio()` now reports unlocked / on / master.
- **Home menu:**
  - `ueNavActive()`: the blue `.active` bar follows hover, focus and the pad cursor.
  - It clears while the cursor is on the top-bar icons and resets to the first item on returning home.
  - It was hard-coded on FRIENDLY MATCH.
- **Save flash:** centred on `P3D.gkaGlove()` and re-projected every frame (`U11HitFX.play(..., {track})`). Before, it was placed once at the ball and drifted as the camera and the dive moved.
- **Verified headless:**
  - Pad unlocks audio (context running).
  - Menu blue bar: none → 1 → 2 → 3; hover 3; home → 1.
  - Flash 0 px off the glove on every frame; dribble names resolve.
  - 0 errors.
- **Checklist:** `DEBUG-CHECKLIST.md` (status, cause, fix and the live check for each item).
- **Backups:** `bak file/{game.js.pre-dribnames-v255, ult11-pitch3d.js.pre-dribnames-v175, ult11-pitch3d.js.pre-fxtrack-v176, ult11-sfx-samples.js.pre-unlock, ult11-hitfx.js.pre-track, index.html.pre-dribnames}.bak`.
