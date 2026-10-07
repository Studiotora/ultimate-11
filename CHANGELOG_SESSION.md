

## 2026-10-07 — Goal + net, LED boards, stadium surface detail (ult11-pitch3d.js v208, ult11-stadium-classic.js v9, index.html)

- **Author:** "Conclude this session with some upgrade using three.js at its highest potential: the goal and net more realistic, detailed and polished; the LED banners as well; and texture details of the stadium."
- **Net v2:**
  - Textured cord panels replace the 1-px line grid: a knotted diamond mesh (`netCordTex`), mip-mapped + 16× anisotropic, on the roof, back and both side panels.
  - The roof sags, the back billows out, and the sides hang slightly inward.
  - A dark copy of the cord pattern lies on the grass under the goal as the net's shadow.
  - The back panel keeps a displaceable grid, so the goal bulge (`P3D.netHit`, incl. the Ultra push) still works; the opacity it animates now uses the panel's own base (`op0`).
  - Unlit near-white like the approved look. Cells are ~21 cm on screen scale: the first try at real 12 cm read as a grey screen at play distance.
- **Posts:** painted-aluminium `MeshStandardMaterial` (soft sheen, a little self-light so they stay white at night), 28-segment tubes, rounded joints where crossbar meets post, a dark anchor collar at each foot.
- **LED boards:**
  - The board texture is now 4096×256 (drawn in the old units ×2; the baked fake LED grid lines are gone).
  - Shown through a shader (`ledMaterial`): round emitters with a dark gap, a slow refresh band, a matte black bezel with a thin lit rim, slightly over-bright for the bloom.
  - The dot grid fades out with distance (screen-space derivatives); the first version made moiré rings on the far boards, which is fixed.
  - The scroll is unchanged.
- **Stadium surface detail:**
  - The GLB has no UVs, so detail is projected in world space from three sides (triplanar) inside the existing bowl shader hook.
  - One procedural 512 texture: R poured-concrete grit + stains, G corrugated roof sheeting, B panel / expansion-joint seams.
  - Per material: concrete + terracing (grit + seams), roof (corrugation), painted steel (fine grit), glass none. Seats and crowd are untouched.
- **Honest result:**
  - The net and posts are a clear step up; the boards are cleaner, and their LED dots show close up (cinematics).
  - The stadium detail is technically in, but is hardly visible in normal play: the stand surfaces are lit very dark (night and day), the crowd covers most of the bowl, and the depth blur softens the stands.
  - Making it read would need a relight of the stands (lighter terrace / concrete base colours or ambient) - a look change for the author to decide.
- **Verified headless:** before/after shots from fixed cameras (goal, net, boards, stands, concrete, roof; night + day); 0 errors.
- **Backups:** `bak file/{ult11-pitch3d.js.pre-polish-v206, ult11-stadium-classic.js.pre-polish-v7, index.html.pre-polish}.bak`.

## 2026-10-07 — Players' tunnel cleared, dugouts + team coaches (ult11-pitch3d.js v209, ult11-stadium-classic.js v10, assets/coaches/, index.html)

- Tunnel (far side, model x +-1.93, z -26..-36.7, height 3.02): the model's seat triangles, the code terracing and the spectators inside the opening are removed (inTunnel); rows above its roof stay. The far LED boards open in front of the tunnel and both dugouts. Verified: open dark mouth with its amber lights, nothing crossing it.
- Coaches: art/coaches_src/slice_coaches.py re-packs the author's 3x3 sheets with feet on one line -> assets/coaches/coach_tracksuit.png (home, left) / coach_suit.png (away, right). Unlit sprites just outside the white line in front of each bench. Poses by match state: idle / arms crossed / thinking, pointing the way when attacking, shout / stop hand under pressure, clap after duels, fist pump on a goal (the other coach thinks / crosses arms). Hidden in cinematics. P3D.coaches / P3D.coachState(). Verified visible, 0 errors.
- OPEN: the benches (benchMesh: base, team-colour seats, back wall, glass canopy) are placed behind the board gaps but read almost black at night, only the coloured stripe shows. Next: lighter materials / a bench light, and check the canopy ribs.
- Backups: bak file/{ult11-pitch3d.js.pre-dugout-v208, ult11-stadium-classic.js.pre-tunnel-v9, index.html.pre-dugout}.bak.

## 2026-10-07 — Benches finished, tunnel closed by the boards (ult11-pitch3d.js v210, index.html)

- Author: finish the bench; the LED panel next to the tunnel looks cropped; the entrance does not need to stay open (in reality it is closed after the teams walk out).
- Boards: no gap at the tunnel any more (the seats inside it stay removed, so it reads as a closed-off entrance behind the boards). Gaps only in front of the two dugouts.
- Cropped panels: a short wall piece used to squeeze one whole 8-panel tile into its length. Far-side pieces now show a whole number of 2-unit panels (rep = panels/8), at normal width. Scrolling still slides content past the piece ends, as on every board.
- Benches: self-lit materials (seats in team colour with an emissive share, lighter base/back wall, emissive steel), glass canopy more visible, and its arc corrected - it curved BACK behind the wall; now it rises from the back wall top and arches forward over the seats. Ribs rebuilt on the same arc (the rotation chain was wrong), a front edge tube and a light strip under it.
- Verified headless: bench close-ups and wide shots, coaches in front, tunnel closed with whole panels; 0 errors.
- Backup: bak file/ult11-pitch3d.js.pre-bench2-v209.bak.

## 2026-10-07 — Supporter flags on every tier (ult11-pitch3d.js v211, index.html)

- Author: the flags were all in one row on the lower tier; they should be on every tier, at different heights, so the stadium feels alive.
- Classic stadium: per team 16 flags on the far stand (own half: 6 lower, 5 middle, 5 upper tier) + 6 on its own end stand (2 per tier), each on a random row of its tier (from the stand's own tier layout), held above the fans' heads, kept apart from each other (min spacing) and clear of the tunnel. Upper-tier flags 1.35x so they read from the match camera. Each keeps its own waving phase.
- Verified headless from four angles; 0 errors. Backup: bak file/ult11-pitch3d.js.pre-flags-v210.bak.

## 2026-10-07 — Real depth of field + film curve (ult11-pitch3d.js v214, index.html)

- Author: after reviewing the Lumina HD-2D demo (three.js, depth-based bokeh, AgX), try its look in U11 - one sample first.
- Depth of field v2: the composer's two targets carry a DepthTexture; a DOF pass right after the scene render (before bloom) blurs every pixel by its circle of confusion from the FOCUS distance (gather on a 40-sample golden-angle disc, samples weighted by their own CoC so sharp players are not smeared, highlights boosted into round bokeh discs). Replaces the screen-band tilt-shift (which is switched off while P3D.dof.on; P3D.dof.on=false restores it).
- Focus = the point the camera is aimed at (camera.lookAt is wrapped to record it - match camera, hooks, celebrations); in a cinematic, the ball. Tunables P3D.dof {maxR 9 (px at 720p, x1.25 in cinematics), near 0.16, ramp 0.5, bokeh 1.8, bokehThresh 0.72, fgMul 1.25}.
- Film curve in the grade pass (P3D.fx.film 0.6): gentle toe/shoulder S-curve + highlight desaturation roll-off (AgX-like), on top of the existing sat / contrast / split-tone.
- Verified headless before/after on the match camera, a low goal-mouth view and a super-shot charge: players / keeper / shooter sharp, stands and boards soft, stadium lights as bokeh; 0 errors. Low quality tier (no composer) has no DOF, as before.
- Backups: bak file/{ult11-pitch3d.js.pre-dof-v211, index.html.pre-dof}.bak.

## 2026-10-07 — Even pixel density: pixel grass + pixel LED boards (ult11-pitch3d.js v216, index.html)

- Next step after the Lumina review: the environment at the players' pixel size (the players are crisp pixel art; the turf was soft photo-like noise).
- Pixel grass (grassify shader): the turf is sampled on a WORLD texel grid (snapped world position; the texture uv moved by the same amount through the uv/world Jacobian from derivatives), then its brightness is cut to a few tones with a 4x4 Bayer dither on that grid. Painted lines keep full tone. P3D.pixelGrass {on, texel 0.06, levels 5, dither 1} - texel tested at 0.024 (invisible, slightly softer), 0.05, 0.08 (clear blocks); 0.06 ~ the players' pixel chunk. Shell grass (low cameras only) unchanged.
- Pixel LED boards: one LED ~0.05 world (leds 384x24 per tile); the content is sampled at the LED cell centre so text and crests read as chunky pixels; it goes back to smooth only when a LED is smaller than a screen pixel (no shimmer far away).
- Crowd: already pixel art (16-px figures, nearest filter) at a similar density - unchanged.
- Verified headless: close crops of the turf at all settings, board close-up, match camera with DOF; 0 errors / shader warnings. Backup: bak file/ult11-pitch3d.js.pre-pixgrass-v214.bak.

## 2026-10-07 — Tunnel + benches + tier LED rings from the author's reference images (ult11-pitch3d.js v218, ult11-stadium-classic.js v12, index.html)

- Author (2 reference images): "the tunnel should look very well established, the LED banners are not in front of it, the LED banner should also have 2 extra tiers in the middle ring and upper ring, the pitch-side ring should sit behind the bench".
- Pitch-side boards: pushed back (hw = PWID/2+3.0) so they run BEHIND the two dugouts; split only at the tunnel mouth (no boards in front of it any more).
- Dugouts sit in front of the board line (bz = -(PWID/2+1.95k)), coaches in front of them before the touchline.
- Tunnel portal: light concrete side walls with a blue light trim, roof slab, lit header panel with OUR crest ("11" shield + ULTIMATE ELEVEN, Cinzel) - the starball of the reference replaced by our own crest - and a lit lintel strip.
- Corridor: self-lit light concrete walls (panel joints, blue dado band, skirting, lamp wash) fading darker with depth, ceiling + floor the same way, bright ceiling lamps every 1.3 units with soft additive glows, warm wall light strips, a lit doorway at the far end; blue carpet with white edges out to the touchline.
- The stand model no longer pokes into the corridor: the tunnel cut now covers every stand mesh (not only seats), and every stand material clips the tunnel box with 6 clip planes (clipIntersection) - big step/riser triangles that survived the triangle cut left black blocks inside (U11_CLASSIC.tunnelClip).
- Two new LED rings on the middle and upper tier fronts (U11_CLASSIC.buildLedRings, outline offsets 11.5 / 20.6), same LED-matrix shader and content as the boards, scrolling; content direction fixed (it read mirrored).
- Verified headless: tunnel close-up, reference angle, bench angle, tier rings, match camera with DOF; 0 errors.
- Backups: bak file/{ult11-pitch3d.js.pre-tunnel2-v216, ult11-pitch3d.js.pre-tunnel3-v217, ult11-stadium-classic.js.pre-rings-v10, ult11-stadium-classic.js.pre-ringflip-v11}.bak.

## 2026-10-07 — Tunnel toned down, follows the time of day (ult11-pitch3d.js v219, index.html)

- Author: "do not make the tunnel extremely bright, it should look darker, or it takes too much attention, especially at night; during the day the lights are off anyway".
- Day (classic): tunnel lamps OFF - dim unlit corridor, no glow, no wall strips, soft far doorway. Golden / night: lamps on but subdued (faint glow, low strips, dark walls). Applied on build and on every look change (applyLookMaterials -> tunnelLook). Tunables: P3D.tunnelLight {classic, golden, night} x {surf, lamp, strip, glow, end}.
- Far doorway texture made soft (no hot spot); portal concrete self-light lowered (it read glowing white).
- Verified headless: tunnel + match camera in day, golden and night; 0 errors. Backup: bak file/ult11-pitch3d.js.pre-tunneldim-v218.bak.
