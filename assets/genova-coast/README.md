# Borgo del Mare — Ultimate Eleven coastal story map

## Current revision — one big map: the canal district and the night lamps (v6)

**The map is now more than twice as long (42 m to about 96 m).** East of the old promenade the town carries on (`canal.js`, loaded before `water.js`/`world.js`): a second piazza with a fountain on the bridge's axis and a row of eight new shopfronts, a 6 m stone canal that leaves the harbour beside the east pier, a hump-backed brick bridge you walk over (the hero rises up to 0.85 m on the arch, `world.heightAt`), bunting across the canal, three boats, a quiet south bank with market stalls and planters, and a low water gate where the canal runs into the town. Everything uses the Borgo's own materials and helpers (`CoastArt` world-space tiles, `building()`, `lamp()`, `planter()`…) so it reads as the same town. The rock islets moved east of the district; the hillside backdrop was extended with its own random stream, so the original layout is unchanged. The standalone "Borgo · Canale" lab scene it came from is kept at `lab/astra-borgo-canal.html`.

- **Shared footprints.** `CoastCanal.quays` (land rectangles) feeds the water shore mask, `CoastCanal.walkable` feeds `canWalk`, `CoastCanal.buildings` joins the shop list (so `details.js` dresses them too), `CoastCanal.occluders` lets the camera pull-in see the water gate. The water mask grew to 300 × 180 m (still 0.25 m per pixel).
- **Walking.** The promenade, both banks and the bridge are joined by overlapping rectangles (overlap ≥ the actor diameter), curbs have a gap only at the bridge, parapets keep the hero on the deck. Checked by simulated key presses: crossing the bridge both ways, curbs on both banks, all four rims, plaza → promenade.
- **Camera.** Follow camera and pull-in are unchanged; the overview camera now slides along the long map (`clamp(player.x,-10,60)*.8`) and the follow focus tracks the hero's bridge height.
- **Lamps.** The map has 19 lamps, more than a forward renderer should light. Seven real point lights follow the lamps nearest the camera focus (`assignLights`, fade in/out so they never pop); every lamp keeps its additive ground pool and bulb halo.

**Night look** (reference: the "Borgo · Canale" scene): dark navy sky/fog and hemisphere, a faint moon instead of a sun, lamps as the real light sources, about 40 % of the windows lit orange (`CoastArt.windowGlass` picks lit/unlit glass by a position hash, so the seeded layout is untouched), a stronger lamp bloom (`finish.js` uniforms `glowAmount/glowThreshold/glowWide`, defaults unchanged for the other maps), darker water grade. Day and golden hour are unchanged (measured mean brightness .368 / .261 before and after; night .37 → .235).

Not verified: real fullscreen on other GPUs/browsers, gamepad, performance on low-end hardware (a follow frame is now about 530 draw calls / 187k triangles, up from about 450 / 184k).

## Current revision — Test the World integration (v5)

The Borgo is now one of the four maps of the overworld (`world/index.html`, main menu > TEST THE WORLD). Both cameras (overview and follow) are **frontal**: square-on to the façades, camera x always equal to the focus x, and movement is screen-aligned. The map is **walk-only** by default: no teammate, no story stops, no quest card. `index.html?story=1` brings the old three-stop interlude back. The top-right link and Esc return to the world map at the Borgo point (`../world/index.html?at=borgo`). `finish.js?v=4` reads near/far from the camera and uses a 24/32-bit depth texture so other maps can share it.

## Revision — HD-2D water (v4)

The sea is now the Studio Tora Lab `hd2d-water.js` module (copied unmodified from the lab), driven by a small adapter in `water.js?v=7`. The module renders pixel-snapped water (1/16 m cells, 4-step palette with Bayer dither) with a shore-distance field for the depth gradient and shoreline foam, caustic webs in the shallows, wave crest lines, sun glints, a planar reflection, and ripple rings. The adapter supplies everything map-specific:

- **Shore mask.** The land footprint is the three quay rectangles in `world.js`, everything north of z = −16 (the hill front) and the 28 rock islets. Water covers 200 × 180 m at 0.25 m per mask pixel, so every quay edge lands exactly on a pixel border and foam sits on the real wall line. The mask agrees with `canWalk`: no walkable point is water.
- **r128 handling.** The bundled three r128 has no colour management, so the palette is converted to linear; the water is not tone-mapped (same display-referred pipeline as v3) and it **writes depth**, which `finish.js` needs for depth-of-field (otherwise the whole sea blurs). The reflection target uses the same output encoding as the main pass so materials share compiled programs, and the water shader decodes it.
- **Reflection budget.** Captured every second frame at about 720 px on desktop (the module scale is fixed at creation from the window size), without re-rendering shadow maps.
- **Day / night.** Golden hour and blue hour use the same palette with a blue grade; glints and sheen fade out at night.
- **Boats.** Each moored boat emits a ripple ring every ~3 s.

Tuning lives at the top of `water.js` (`day` palette, `SHEEN`, `GLINTS`, `pixelSize`, `deepDistance`, `reflectivity`). `window.GenovaCoast.world.sea.water` is the module instance (`ripple`, `splash`, `isWater`, `distanceAt`, `uniforms`) for gameplay hooks. The v3 files are kept in `_pre-hd2d-water/`.

Verification (headless Chromium, 7 + 10 October 2026): no page or console errors; 2,469 walkable sample points checked, none in water; boats float 2–2.4 m from the shore; day, night, overview and follow cameras inspected; programs 23 (v3: 22); a follow-camera frame was 460 draw calls / 99.8k triangles, with a reflection refresh adding about 230–290 calls every other frame. The water fragment shader is heavier than v3's (voronoi caustics, ripple loop, layered noise): device FPS on low-end GPUs and phones is unmeasured.

## Revision — pixel art and water, v3

The v3 build replaced the first pass's flat materials with a generated pixel-art atlas, world-space texture mapping that survives instancing, pixel foliage, detailed façades and street dressing. The default camera now follows the player. The low-resolution scene pass adds depth-based focus and restrained glow while keeping the UI crisp. Texture magnification is nearest-neighbour; distant surfaces use mipmaps to avoid shimmering.

New files: `art.js?v=2`, `details.js?v=2`, `finish.js?v=2`, `water.js`, and `assets/liguria-materials-v2.png`. See [art provenance](ART-PROVENANCE.md) for the generated asset's exact prompt and processing. The v3 water (single-file analytic shore shader, 640 px reflection every second frame) is superseded by v4 above.

The original v1 notes follow for layout and integration context. Their procedural-only texture description and rendering measurements are superseded by this revision.

A compact fictional Genoese neighbourhood inspired by Boccadasse, built for the existing Ultimate Eleven Three.js r128 environment. Approximately 42 × 34 world units of playable land, with eight detailed Ligurian buildings, a waterfront piazza, two small quays, grass terrace, café, fishing boats and an uphill town backdrop. Generated geometry and textures are deterministic.

## Play

From the Ultimate Eleven local server, open `/genova-coast/index.html`.

Keyboard: WASD/arrows to walk, Shift to run, E to interact, C to switch overview/follow camera, N for golden/blue hour, T to hide the HUD, Escape to close dialogue. Touch joystick and interact button are included. Gamepad left stick, A interact and RT sprint are implemented but have not been tested with physical hardware.

The test interlude has three stops: teammate → café → sea terrace. Dialogue is placeholder writing for this map, not an alteration of the established story. Progress lasts only for the current page session. Existing campaign saves and match code are untouched.

The Exit link returns to the main game. This map has no main-menu entry yet. An existing menu action can later navigate to `genova-coast/index.html?v=1` once the scene is approved for the story.

## Files / integration

- `index.html`: standalone exploration page; world, scene and CSS cache versions are `v=1`.
- `world.js`: procedural scenery, walkable surfaces, collision boxes, water animation, light slots and object instancing.
- `scene.js`: existing approved player sprites, camera-relative controls, dialogue, touch input and test hooks.
- `coast.css`: responsive map HUD using the parent game's design tokens and font families.

Keep this directory directly beside `marassi-square` in the game project. Shared dependencies are `../tokens.css`, `../marassi-square/assets/three.min.js`, `../marassi-square/hero-sprite.js` and that script's `assets/hero-v3` images/layout. No installation, CDN, package download or new rendering engine is required. Serve via HTTP; the existing sprite loader fetches JSON and therefore needs a local server.

`window.GenovaCoast` exposes `state()`, `reset()`, `teleport(x,z)`, `world.canWalk(x,z)` and the scene/camera for future integration. Teleport rejects blocked positions. Story stage remains local to this page; connect it deliberately to the main story manager when a canon scene is chosen.

## Validation — 7 October 2026

Headless Chromium WebGL: zero page/console errors or failed asset requests during verification. A 0.25-unit flood fill reached all three story interaction locations and both quays. Keyboard motion, all dialogue stages, blocking of buildings/water, camera switching, HUD hiding, shader-count stability through a time toggle, and the 390 × 844 touch layout passed. Overview measured approximately 252 draw calls including shadows and 39,549 triangles; 12 shader programs. These are observations, not a device FPS guarantee. Physical phone/gamepad play remains unverified.

Limitations: decorative buildings have no interiors; doors, scooters and boats are scenery; NPC uses the existing hero sheet as a placeholder; there is no football match on this map. The terrain is intentionally flat for straightforward story exploration. Overview can crop the outer scenery in portrait; follow camera keeps the walking character in view.

## Sources and provenance

Original procedural geometry, textures, water shader and map adapter authored for this request. Reuses the user's existing Ultimate Eleven engine, tokens and character assets. Lumina was studied for its seeded generation, fixed light counts, shared collision data and verification approach; no Lumina source was copied, and this is not a port of its full post-processing engine.

Visual place reference: [Visit Genoa — Boccadasse](https://www.visitgenoa.it/en/node/21375), especially its colourful waterfront houses, stone paving and fishing boats. The layout and name are fictional; this is not a geographic reconstruction.
