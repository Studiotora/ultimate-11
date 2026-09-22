# Ultimate Eleven — Dev Skill

Work on Ultimate Eleven (studiotora.github.io/ultimate-eleven), a browser anime
football game: vanilla JS + Canvas engine with a permanently-on Three.js layer.

## Repo file map
- `index.html` — shell; every script tag carries a `?v=N` cache-bust param
- `game.js` — 2D engine, ~8,600 lines. Match state, AI, career, story hooks
- `ult11-pitch3d.js` — **the live renderer** (~3,000 lines): stadium, sprites,
  shot FX, super-shot cinematic, camera. Most visual work happens HERE
- `ult11-bowl2.js` — elliptical oval stadium; exports `window.U11_OVAL`
- `ult11-camlab.js` — dev-only tuning UI, gated behind `?debug=1`
- `ult11-team.js`, `ult11-custom.js`, `ult11-cup.js`, `ult11-sfx.js`,
  `ult11-story.js`, `story-script.js`
- `style.css`

## Hard rules
1. **Disk is truth.** Read the actual current file before editing. Never patch
   from memory of an earlier session.
2. **Syntax check before delivery.** `node -e "new Function(require('fs').readFileSync('FILE','utf8'))"`
   on every edited JS file. Never deliver unvalidated JS.
3. **Verify which function is LIVE.** The repo contains dead 2D twins of live 3D
   functions. `drawRadar()` in game.js is dead; `drawRadar3D()` in pitch3d is
   live. Grep for the caller before editing.
4. **One concern per edit.** Targeted `str_replace`/Python patches. Never
   full-file rewrites of game.js or pitch3d.
5. **No console-gated features.** Testing is on Android with no devtools. Gate
   dev tools behind `?debug=1`; use `U11DBG()` for on-screen logging.
6. **Mockup-first.** New UI = standalone HTML prototype approved before touching
   game files.
7. **Measure, don't guess.** Every real bug here was found by computing actual
   values — speeds, pixel offsets, cell divisions — not by inspection.

## Cache busting
Bump `?v=N` in index.html for every edited JS/CSS file. List them in the delivery.
Inline styles are more reliable than stylesheet edits on GitHub Pages.

## Delivery format (mandatory, terse)
- **Changed:** file list with new `?v=` numbers
- **Verify:** one-line phone test
No deployment instructions — the user handles GitHub Pages. No explanation of
what the code does unless asked.

## Known gotchas
### Three.js
- `Object3D.lookAt()` aims **+Z** at the target. Only cameras and lights use −Z.
  Geometry meant to face the target belongs on the +Z face.
- `mesh.scale.set(d,d,1)` on a SphereGeometry makes an **ellipsoid**. Use
  `setScalar(d)`. This caused the "banana ball" during super shots.
- `T.Sprite` ignores negative `scale.x`. Mirror via `texture.repeat.x=-1` and
  shift `offset.x` by one cell.
- Don't use `transparent:true` + `alphaTest` on solid photo textures; use opaque
  `MeshBasicMaterial` for crowd/stadium panels.

### Sprite sheets
- Player sheets are **12×6**, not 7×6. `layoutFor()` picks by aspect ratio:
  ~1.43 → 12 columns. Rows: 0 idle-down, 1 idle-up, 2 act, 3 run-side,
  4 run-down, 5 run-up.
- Sheet dimensions must divide evenly by the grid or cell boundaries drift
  sub-pixel and accumulate across the row.
- `measureSheet()` anchors on the **median opaque column**, not the bounding-box
  centre — dust puffs and outflung limbs drag a bbox centre by 15px+.

### Cinematic / camera
- The chase camera must `lookAt` the **ball**, not the goal. Aiming at the goal
  pushes the ball to the frame edge and crops the trail out.
- Flight arc `bz` must blend to a non-zero landing height, or flat shots sink to
  the turf in front of the keeper.
- `P3D.cine` holds all camera tunables: `chaseDist`, `chaseSide`, `chaseHeight`,
  `chaseLag`, `slowMo`.

### Engine
- game.js top-level `let` does NOT attach to `window`. Use explicit
  `window.X`, or read `CV.width`/`CV.height` cross-file.
- `goalGen` guard: all delayed restart callbacks must check the generation
  counter to invalidate stale queued `afGoal` calls.
- `exitToMenu()` is canonical teardown for match state.
- Player IDs are numeric in game.js but strings in `dataset.*` — coerce before `===`.
- Stamina double-charge risk on committed shots — respect `alreadyPaid` through `opDuel`.
- Known dormant bug: `afSave` fires for field duels via a `shoot && !win` branch,
  re-adjudicating blocked shots against the GK.

### AI positioning
- Defensive shape is driven by `defLineProg` (own-frame, 0 = own goal). The line
  must RETREAT as `carrierProg` rises; an earlier formula moved it the wrong way.
- Its lower clamp must stay outside the box (~0.155). At 0.085 the whole back
  line collapses onto the keeper.
- Defenders need a **per-slot depth offset** from their formation x, or every
  defender is sent to the same `tx` and the back line renders as one flat row.

## Testing
- `node -e "new Function(src)"` is a syntax check only, NOT an integration test.
- For real coverage, load game.js into jsdom and execute the actual code path.
- Python `ast.parse()` catches stray non-ASCII characters in CSS/JS.
- Replicate a formula standalone in node and print values before claiming a fix.

## Shared roadmap handoff (author requirement, 2026-09-19)
Before editing or applying game files, read ROADMAP.md and relevant recent CHANGELOG_SESSION.md entries. After each delivered change, update ROADMAP.md with the reason, exact files/cache versions, validation, remaining risks and next checks; update CHANGELOG_SESSION.md too. Preserve concurrent Claude/Codex edits by re-reading originals before application.
