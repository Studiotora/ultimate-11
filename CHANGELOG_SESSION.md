# Ultimate Eleven — Session Changelog

Handoff for a fresh Claude Code session. Everything below is already applied to
the files in this delivery.

## Final versions (in index.html)
- `game.js?v=108`
- `style.css?v=57`

## v108 / css v57 — duel fixes round 2
- **Action buttons**: removed the big `.duelbar` box behind them — buttons now
  float (no secondary panel).
- **GO button**: now a clear button at the end of the action row — grey when
  idle, gold + pulsing when armed (was faint/hidden before).
- **GK reverted to the RIGHT approach**: undid the striker-vs-GK dual duel.
  `gkShotLayout` restored (goal backdrop + central keeper art, ONLY the keeper
  visible); the NEW infobox is layered on via `.gk-info` (keeper's side kept,
  attacker's `.atk-info` + both `.dhero`/ball hidden in `gk-mode`). Verified:
  keeper-only screen with GK stats/SUPER SAVE infobox, SHOOT/GO, running clock.
- Note: earlier duel screenshots showed a kickoff button because duels were
  force-triggered before kickoff in the test harness — artifact of testing, not
  the game; re-tested with the match clock actually running.

## v105 / css v54 — duel polish + GK + one scoreboard + 1v1-only
- **1v1 only**: 2v1/1v2 detection disabled in `opDuel` (`if(false&&…)`); every
  tackle now opens a straight 1v1. (Full code removal can follow; behaviour is
  1v1 everywhere now — verified "CHOOSE ATTACK", no "PICK 2 MOVES".)
- **GK uses the new infobox**: legacy full-screen `gkShotLayout` overlay retired;
  the keeper now renders the same notched infobox (GK stats SAVE/REFLEX/HANDS,
  SUPER SAVE gem) with a **goal-net backdrop** behind the portrait
  (`.dhero.gk::before`; class toggled in opDuel for the keeper's side).
- **One scoreboard**: the old PNG match HUD (`assets/ui/scoreboard.png`) removed;
  `.mhud` restyled into the compact CSS scoreboard pill (top-centre) used in the
  duel — frees pitch space in-field. Match HUD also hidden during the duel
  (`#s-match.duel-live .mhud{display:none}`) so only one scoreboard shows.
- **Duel background = real pitch**: duel veil lightened + `.da-bg` made mostly
  transparent so the live (frozen) pitch shows behind the panels.
- **Skill box**: removed the rim/secondary box — now a single clean bordered box.
- Info boxes dropped the `.dpc` class (was inheriting ~11 legacy !important
  rules); engine still targets them by id, so fCard fills unchanged.
- Verified in-browser (proper startGame flow): populated duel (Aoi vs Messi),
  GK shot (Muller, net backdrop), human pick→GO→resolve→close, no JS exceptions.

## v103 / css v51 — NEW DUEL WIRED INTO THE LIVE GAME (FF/Square-Enix)
- Rebuilt `#duel-ov` (index.html) to the mockup: CSS scoreboard (top, behind
  portraits, mirrors sc-h/sc-a/htime/hhalf + team emblems), zoomed portraits
  (reuse dpa-av/dpd-av on a dedicated `.dhero` layer), notched L-shape info
  boxes (diagonal clip-path, team-coloured rim via `--tc/--tf`), 6 stat BARS,
  stamina, and an ATTACHED special-skill panel (no icon, A/A+/S/S+ gem).
  Only the top block is mirrored on the CPU side; stats read L→R on both.
- Kept every engine hook: fCard still writes dpa-nm/ps/ovr/stars/ev/emax/ef/
  sp-name/sp-desc/sp-grade + the avatar; legacy nodes (tab/r/st/skills/mini/
  sp-port/role) kept hidden so no JS breaks. bldA/bldD/abtns/dbtns/dcfm/dzone/
  dtn/di unchanged (action bar restyled as a premium bottom-centre panel).
- fCard: removed old inline card border/bg/emblem; sets `--tc/--tf` on the
  side; new fills for flag (setTeamEmblem), nation code, jersey number, role
  name (pos→role map), 6 stat bars, gem colour.
- opDuel: scoreboard mirror + ball placed at the CARRIER's feet
  (`.dp-ball.ball-left/right`, z = portrait layer, below info/buttons; may be
  clipped by the lower edge — intended, just shows who has the ball).
- 2v1 second-defender chip hidden in the new skin for now.
- Verified in-browser: renders with real data (Aoi vs Messi), no JS exceptions;
  portraits show for players with art (e.g. Aoi), silhouette fallback otherwise.
- NOTE: GK-shot mode keeps its own legacy `gk-mode` overlay for now.

## v49 — menu tiles → Cinzel
- Bottom tile titles `.ue-tile-txt h4` (ULTIMATE LEAGUE / MASTER LEAGUE /
  STORY MODE) → Cinzel serif, completing the menu type system (logo + items +
  tiles all Cinzel). Sub-labels stay clean/small.

## v48 — main-menu Cinzel + brighter faces
- **Menu logo `.ue-logo-in b`** and **menu items `.ue-item-l`** switched from
  Barlow-Condensed italic to **Cinzel serif** (logo 900, items 700) — the
  premium Square-Enix/FF header look now carries into the menu itself. The
  gold second word (ELEVEN) is kept via `.ue-logo-in b+b`.
- **Faces no longer dark**: `.ue-vig` right-side stops lightened
  (was `rgba(5,13,28,.82) 88%`→bg 100%; now `.04 84%`→`.34 100%`) so the
  character art on the right reads clearly; left darkening kept for menu-text
  legibility, bottom fade eased slightly.

## v46 — de-mobile the main menu (Square-Enix direction)
- Removed the **top-right gacha HUD** (`.ue-top-right`: coins `hmCoins`, level/XP
  `hmLevel`/`hmXpText`/`hmXpFill`, profile `.ue-me`/`hmProfileName`). No JS
  references those IDs — safe. Top bar now holds only the left settings/inbox.
- Removed the **"EVERY MATCH. EVERY DREAM." script tagline** (`.ue-script`).
- Re-fit the hero: `.ue-art` bg → `center center`, `inset:-4%`→`-1.5%`, and a
  gentler ken-burns (`ueKen` scale 1.03→1.055, pan −9px) so the full 16:9 art
  fits with only a whisper of bleed — players' heads no longer cropped.

## css v44 — new main-menu background ("Play Beyond Borders", Square-Enix splash)
- `.ue-art` first layer → `assets/home/menu-hero2.png` (1672×941).
  Previous hero backed up as `assets/home/menu-hero.prev.png`.

## v102 / css v43 — Cinzel in Team Select + FF HD-2D PREMIUM DUEL
- IMPORTANT cache note: bumping the `?v=` on style/js does nothing if the browser
  serves a cached **index.html** (it then keeps requesting the old versions).
  Hard-refresh (Ctrl+Shift+R) after edits, or the changes look like "nothing
  changed". This was the cause of the team-select change not showing.
- **Team Select** (game.js ensureCss): Cinzel serif now on `.tsf-ct`
  (country-category header), `.tsf-vs` (cream-gold VS, dropped italic) and
  `.tsf-tile-nm` (grid country names) — on top of the title + team names already
  moved to Cinzel in v101.
- **Duel — FF HD-2D pass** (style.css, appended block scoped to `.duel-aaa`):
  * Cinzel serif for `.dpnm`/`.dpd2-nm` (names), `.dside-h` (STATS / SPECIAL
    SKILL — gold), `.dss-name` (skill names), `.dact3d-l` (command labels),
    `.duelzone`. Stat/OVR numbers stay Bold Pixel/Orbitron.
  * Cards: deep glass + cream/gold double frame, gold hairline top banner
    (`.dpc::before`) and ornamental **corner brackets** (`.dpc::after`,
    SVG border-image). Team blue/red kept as a tint.
  * Section headers get a gold ◆ marker + gradient rule; zone becomes a
    gold-framed plaque; VS glyph gets a warm gold drop-shadow.
  - Added tokens `--ff-gold / --ff-gold-lo / --ff-cream`.
- Verified in-browser after a cache-busted load: v43 sheet active, Cinzel loads,
  computed fonts correct on duel names/headers/labels, corner-bracket
  border-image applied; team-select grid names render serif.

## v101 / css v42 — HYBRID HD-2D font system (FF / Dragon Quest inspired)
- Removed the all-pixel global override `*{font-family:'Bold Pixel' !important}`.
  The UI is now a hybrid: clean modern UI + retro numeric accents, not all-pixel.
- Added **Cinzel** (Google Fonts, index.html line 15) for headers / titles /
  team names:
  * `.htn` (in-match team names) → Cinzel serif (was Bold Pixel).
  * Team Select `#s-ts .tsf-title h1` and `.tsf-tname` → Cinzel serif (was italic
    Barlow-ish); dropped italic, weight 900 / 700.
- **Bold Pixel kept on the numeric HUD only**: `.hsc` / `.hsc-sep` / `.htime`
  (score + clock), `.dtn` (duel countdown), `.rbadge` / `.ract` (duel result).
- Body / menus / labels fall back to the `html,body` default (**Rajdhani** sans)
  and each screen's own display fonts (Barlow logo, Bebas headings) — unchanged.
- Helper classes `.font-serif` / `.font-pixel` added for future use.
- Verified in-browser: Cinzel + Bold Pixel both load; computed fonts correct on
  title/team-name (Cinzel) vs score/timer (Bold Pixel); no font 404s.

## v100 — restart bug fixes (+ pixel-everywhere, may change)
- **Free kick** no longer opens a contested/GK duel: it resumes IN-FIELD via
  `liveResume(attSide)` with a grace window (taker dribbles/passes/shoots). PKs
  still use the GK duel. (game.js ~7080)
- **Post-goal kickoff**: `doKickoff` now clears stale duel/loose state and uses a
  longer grace (900→1600ms) so it can't drop straight into a duel. Verified: CPU
  kickoff after a goal = clean 'moving', no duel overlay.
- Re-verified loose ball / corners / throw-ins / goal kicks / shot block / punch.
- Bold Pixel applied globally (`*{font-family !important}`, style.css). NOTE:
  user then referenced HD-2D (FF/DQ) UIs — likely pivot to a HYBRID (clean UI
  font + pixel accents) rather than all-pixel. Pending direction.

## v99 — ball out of play + corners/throw-ins/goal-kicks + PUNCH rebound
- Loose ball now tracks **last touch** (`goLoose(...,touch)`), and `tickLoose`
  no longer clamps the ball in — it can go OUT:
  * sideline → **throw-in** to the other side,
  * byline + defender's last touch → **corner** to the attackers,
  * byline + attacker's last touch → **goal kick** to the keeper.
  New `looseRestart(side,x,y,label,isGoalKick)` places the ball + nearest taker,
  shows a referee call, resumes. Verified all four in-browser (corner both ends,
  throw-in, goal kick — correct possession each time).
- **GK PUNCH now rebounds:** a punch can't cleanly catch (`catch→spill`), and
  spills/parry-spills go through the real loose scramble (`goLoose`, keeper's
  touch → can roll out for a corner) instead of instant closest-assign.
- Touch wired on all triggers: deflection→ds, shot block→defending side,
  spill→ds.

## v98 — outfield shot BLOCK (geometry + stats + reaction) → loose ball
- `shotOutfieldBlock(fx,fy,gx,gy,side,pw)`: a defender genuinely in the shot lane
  can block/deflect a NORMAL shot before the keeper. Score = (DEFENCE − power) +
  lane-position + reaction(travel/ballSpeed), ×spirit → prob (cap 0.7). Outcome:
  clean block (35%) or deflect (65% → goLoose scramble); else through to GK.
- `launchShot(fx,fy,gx,gy,side,ak,dur)` wraps every NORMAL shot (manualShot, CPU
  open-play ~1809, duel-shoot resolution ~6253) — runs the block check then the
  GK duel. **Super shots bypass it** (they use superShotCine) so they stay
  exciting; only the GK super save stops them.
- Verified (400 rolls): elite DF dead-in-lane blocks/deflects ~52% of a normal
  shot (mostly deflect→loose), ~31% of a power-95 shot; out-of-lane = 0. Tunable
  via the `bestPts/60` scale + `0.7` cap.
- NOTE other shot paths not yet routed through launchShot (free kick ~6905, PK)
  — can add if blocks should apply there too.

## v97 — LOOSE BALL, increment 1 (Option A)
- New free-ball system so the ball isn't always glued to a carrier:
  * `goLoose(x,y,vx,vy)` → phase `'loose'`, clears possession/engager.
  * `tickLoose(dt)` (hooked in the main loop) rolls the ball with friction +
    a little hop; the nearest 2 outfielders PER SIDE chase it in real time;
    first within `CONTACT()*1.5` wins it (`_assignLoose` → possession, asnC,
    phase 'moving'); failsafe on stall/timeout gives it to the nearest.
  * Camera focuses the ball during 'loose'.
- First trigger wired: **pass deflections** (`iPas` deflect branch) now ricochet
  the ball FREE and both sides scramble — was an instant closest-player assign.
- Verified in-browser: forced `goLoose` → "X wins the loose ball!" → natural
  duel when pressured. No JS errors.
- NEXT increments: more triggers (blocked-shot rebounds, missed tackle/whiffed
  lunge, 50/50s), in-flight pass interception feel, optional scramble duel when
  two players arrive together.

## v96 — duels over the live field + no pre-duel split-screen
- **Duel now plays over the LIVE (frozen) pitch.** Removed the `assets/wallpaper/
  duel.png` stadium image from the duel overlay; it's a dim veil only now, so the
  field (2D/3D canvas, z=2) shows through behind the duel UI. NOTE: the winning
  rule was an INLINE `<style>` in index.html (~line 287, `#duel-ov.duel-aaa … !
  important`) — not just style.css (which also had it, now both fixed). Verified
  in-browser: computed bg has no duel.png; pixel players visible behind the dim.
- `openDuel` no longer calls `playDuelCutIn()` for field duels — every duel goes
  straight into the action overlay (was a full-screen attacker-vs-defender cut-in
  that broke pace). `playDuelCutIn`/`killCutIn` kept (still used as a flash inside
  the □ super-shot cinematic at ~6131/6177 — can remove those too if wanted).
- OPEN design directions from player feedback (NOT done — need direction):
  * Ball has no free/loose state — it's always "attached" to a player and
    teleports mid-air to the receiver; wants real loose-ball physics.
  * Duels render on their own stadium background (`#duel-ov .da-bg`) instead of
    over the live field.
  * Overall pace/excitement + build-up difficulty (duels interrupt flow).
- `ult11-pitch3d.js?v=53`
- `ult11-bowl2.js?v=5`
- `style.css?v=39`
- `ult11-kitrun.js?v=3` (NEW)

NOTE: the LIVE team-select is the JS-built "FIFA-style" screen (game.js ~8652,
rebuilds #s-ts innerHTML). Kit preview = ONE full-width pitch strip `#ts-run`
(canvas 1720x52, CSS position:absolute left/right:0 top:56.5%, z-index:0 so it's
behind the tab buttons) injected as a `.tsf-root` child. ult11-kitrun.js draws
both sprites on it: home at 22% (faces right), away at 78% (mirrored). Uses
home.png/away.png; per-team kits (assets/ps1/<key>.png keyed on selHome/selAway)
is the future upgrade. Verified in-browser Sep 6.

## v95 — team OVR = best XI
- `calcTeamOvr()` now averages the **best 11 by rating** instead of "all
  non-reserves". Prevents a deep/weak bench or an under-marked `reserves` list
  from dragging the number down, and reflects the strongest fieldable XI.
  (Effect is small — e.g. Japan 78→79, Italy 81→82 — and OVR is a DISPLAY value:
  match outcomes are driven by the individual players inside each duel, not by
  team OVR.)

## v94 — playtest fixes (Japan vs China & vs All Stars)
- **Kick-off prompt leaked onto Half-Time / Full-Time screens.** `goHalf()` and
  `goFull()` didn't clear an armed kick-off, so "▶ TAP PASS TO KICK OFF" (a
  fixed-position overlay) stayed visible over the s-half/s-end screens — sitting
  over the "Second Half" button, where a mis-tap scrambled the restart. Fix:
  both now `G.awaitKickoff=null; hideKickoffPrompt()` (and hide the goal banner).
  This likely also fixes the messy 2nd-half start observed in testing.
- Playtest notes (NOT bugs / need design calls, left open):
  * Defensive relief: winning a defensive duel doesn't clear the danger — CPU
    "gets it back from teammate — through on goal" and attacks again immediately.
    Tuning/AI decision.
  * Balance: human lost 0-1 to BOTH China (76) and All Stars (86) and struggled
    to keep the ball (38% possession in game 1). Worth reviewing whether team OVR
    weighs enough in duels.
  * Pink player sprites = intentional placeholder (official kits not baked yet) —
    NOT a bug.
  * (Clock "01:52 in 2nd half" was a misread of 81:52 — clock math is fine.)

## v39 — main-menu art + Team Select kit preview
- **New main-menu background**: `assets/home/menu-hero.png` (the pixel-art match
  scene) is now the top layer of `.ue-art` in `#s-home`. (menu-bg.png kept as
  fallback; the inline home script only sets a bg when `.ue-home` is absent, so
  it doesn't override this.)
- **Team Select kit preview** (`ult11-kitrun.js`, NEW): under each selection card
  (`#h-sel-strip`/`#a-sel-strip`) a `<canvas>` shows the in-game sprite jogging on
  a strip of pitch, so you see the kit before picking. Uses `home.png` (home,
  faces right) & `away.png` (away, MIRRORED, faces left) — run row 3 of the 12x8
  sheet, 12 frames. Auto-crops the run row to the sprite bounds so the tall cell
  padding doesn't shrink it; scrolling mow-stripes sell the motion. Only draws
  while `#s-ts` is visible. CSS `.ts-run` added. To swap to per-team kits later,
  point the loader at `assets/ps1/<teamkey>.png` keyed on selHome/selAway.

## v89/v38 — Bold Pixel on badge/names + goal double-text fix
- Bold Pixel also on the duel result badge (`.rbadge`) and HUD team names
  (`.htn`).
- **Double "GOAL" text fixed.** `afGoal` fired BOTH `impactText('⚽ GOAL!!!')`
  (top:38%) AND `showGoalBanner()` (centered `.gb-title` "GOAL!") — two big goal
  texts overlapping for ~1s. Removed the `impactText` one; the goal banner (net
  art + GOAL! + scorer/team) is the keeper. showReferee('GOAL!') is a separate
  corner popup, left as-is.

Bump these on any further edit.

## v88 — repulsion "magnetic field" + ball-float + challenge range + HUD font
- **"Opposed magnetic field" when defending — root cause.** `applyRepulsion`
  used `REPEL_FORCE=3.2` (≈1.7px/tick shove) vs a ~1px/tick chase step, so
  converging defenders flung EACH OTHER away from the ball; the man you steered
  couldn't reach the carrier and switching players briefly gave you one not yet
  in the cluster. Now `REPEL_FORCE=1.4` and the current **engager is exempt**
  (like the carrier/GK/lungers), so your press is never fought. Tunable.
- **Bold Pixel HUD font.** `@font-face 'Bold Pixel'` added (style.css); the score
  (`.hsc`/`.hsc-sep`) and clock (`.htime`) use it, falling back to Orbitron.
  Font INSTALLED: `assets/fonts/boldpixels.{woff2,woff,ttf}` (from the itch.io
  webfont kit; @font-face family `'Bold Pixel'`). Applied to HUD score/clock and
  the DUEL timer (`.dtn`) + shot-vs-GK line (`.ract`). Attribution required:
  "BoldPixels by YukiPixels" (CC BY-SA 4.0) — add to a credits screen. License
  copy at `assets/fonts/BoldPixels-license.txt`.
- **Ball floated over a player's head** after a save (esp. a clean CATCH): the
  save paths reposition the ball directly without `animateBallTo`, so `ball.bz`
  (height) kept its in-flight value and nothing grounded it until the next pass.
  Fix: the main loop now eases `ball.bz→0` while the ball is at a carrier's foot
  in normal play (game.js, tick ball-follow branch).
- **"Nobody stops you" / weak defending (partial fix).** The tackle refactor
  collapsed EVERY duel trigger to `CONTACT()` (~18px), so an AI defender had to
  get pixel-close — a faster carrier just ran around everyone. Added `ENGAGE()`
  (~38px, between the old ~51px and CONTACT) for the PASSIVE auto-challenge on the
  engager (line ~1864), the any-defender catch loop (~1893), and the duel-grace
  resolve (~4501). Deliberate human tackle still uses CONTACT() — unchanged.
  NOTE: this restores challenge RANGE, not off-ball pressing. See OPEN #1 — the
  other defenders still hold a static reactive shape (only the engager presses),
  and a sprinting carrier (~1.06 px/tick) still edges a lone chaser (~0.97), so
  a proper pressing/2nd-man pass is still needed to fully fix "teammates do
  nothing". Not attempted blind — needs a design pass.

## v87/v53 — tackle fixes + single 4-row GK sheet
- **Tackle now dashes.** The defensive-AI function `return`ed early whenever the
  engager was lunging (game.js ~1856), which SKIPPED `stepLunge()` at the tail —
  so the lunge never moved the player or ran hit-detection (played in place,
  impossible to connect). Now it skips only the normal chase steering and falls
  through to `stepLunge()`.
- **Tackle/shoulder art was swapped.** In-game, row 6 is the SHOULDER art and row
  7 is the TACKLE art, so `L12x8.rowFor` now maps tackle→row7, shoulder→row6.
- **`away.png` padded** 3101→3264 (clean 12×8) — it was rebuilt with tackle rows
  too. Backup: `away.pre8row.bak.png`.
- **Single 4x4 GK sheet.** `gk.png` was removed and `gk_cine.png` rebuilt as a
  4x4 (1167²): row0 idle, row1 run, rows2-3 cinematic. In-play `GK_SHEET` now
  loads `gk_cine.png` forced to new layout `LGK4` (its 1:1 aspect would mis-detect;
  falls back to `gk.png` if present). This fixes the keeper rendering on the field
  player sheet. `gkCineCell` reslices 4x4 and the 3 cinematic poses are a tunable
  table `GK_POSE` = { set:[0,3], save:[3,2], beaten:[2,3] } ([col,gridRow]).
  **VERIFY the 3 poses in-game and tell me any cell to change.**

## v86/v52 — TACKLE & SHOULDER SPRITES WIRED
- New art added to `assets/ps1/home.png`: **row 6 = tackle** (3 frames: reach →
  lunge → slide), **row 7 = shoulder** (3 frames: lean → charge → follow-through),
  cols 0–2 each. Backup of the pre-tackle sheet: `assets/ps1/home.pre8row.bak.png`.
- The sheet is now **12×8** (was 12×6). It MUST be a clean 8×408px grid:
  home.png was exported 3492×3101 and **padded to 3492×3264** (transparent
  bottom) so cells align. Any future team sheet with tackle rows needs the same.
- pitch3d: added `L12x8` layout (rows 6/7 = tackle/shoulder), `layoutFor()`
  detects it by aspect ~1.03–1.22 (or a `12x8` filename tag); `gk.png` (1.00) and
  the 12×6 sheets (1.43) are unaffected. The one-shot `ACT` animation now plays
  `tackle`/`shoulder` (durations `P3D.anim.tackleMs/shoulderMs`). Added
  `P3D.clearAction(s,k)`.
- game.js: `startLunge` fires `P3D.action(side,dk,'tackle'|'shoulder')` (was the
  borrowed shoot frame); `stepLunge` no longer tilts the sprite (frames convey
  the pose), keeps the dust, and clears the action on contact/whiff.
- Sheets WITHOUT the rows (away/japan/italy, still 12×6) fall back to a run frame
  during a lunge — no crash. Add the two rows + re-pad to 3264 to give them art.

---

## Files changed
`game.js`, `ult11-pitch3d.js`, `ult11-bowl2.js`, `style.css`, `index.html`,
`SKILL.md` (replace the copy in the project).

## Standalone tools produced (not wired into the game)
- `super-shot-customize-v3.html` — the approved Super Shot customise mock: 12
  trail styles, colour palette + rainbow, intensity slider, LONG/CLOSE range,
  live thumbnails. This is the visual source of truth for the trail styles.
- `shot-fx-bench.html` — earlier 10-effect bench (superseded by v3).
- `sheet-guide-maker.html` — sprite-sheet alignment guide generator.
- `void-demo.html`, `ink-void-demo.html` — menu/background experiments, parked.

---

## Stadium / rendering (ult11-bowl2.js, ult11-pitch3d.js)

- **Oval stadium was silently falling back to Classic.** `addRS` recursed into
  itself instead of `ringStrip` (stack overflow → build threw). Fixed. Also
  `window.U11_OVAL._last` was never exported, which pitch3d needs for oval
  flags/boards/flashes — now returned and assigned. Removed dead
  `ult11-stadiumpick.js` script tag (404 every load).
- **Floodlight banks** on Classic + Oval, on the tier-1/tier-2 riser. Orientation
  fix: `Object3D.lookAt` aims **+Z** at target, so lamp cells were on the wrong
  face (shining into the crowd). Toggle `P3D.gfx.floods`.
- **Static brand banners** on tiers 2–3, canvas-drawn (no PNGs). Eight fictional
  brands. Toggle `P3D.gfx.banners`.
- **LED scoreboard crests**: dropped the HD-2D ARENA panel; the two duplicate
  name panels became home/away crest panels. Async crest load re-bakes the board
  texture, keyed on the source chain so it only re-bakes on a real team change.
  Fallback chain: emblem PNG → emoji flag → team name.

## Sprites (ult11-pitch3d.js)

- Sheets are **12×6**, not 7×6. Real sheet is 3491×2444 which does NOT divide
  evenly (290.9×407.3) → cell drift. Guide provided at 3492×2448 (291×408 exact);
  canvas-resize (pad, don't scale) to that.
- **measureSheet anchors on the median opaque column**, not bbox centre — dust
  puffs / outflung limbs dragged the bbox by ~17px and made side runs wobble.
- **Idle players now face the ball.** Facing was only computed in the moving
  branch, so at kickoff everyone sat on the default right-facing pose. Uses the
  same camera-space projection as the moving branch (correct under any camera).
- **Procedural dust puff removed** — the new sheet draws its own. This orphaned
  `spawnTrail`, which was then reused by the tackle FX (see below).

## Super Shot — trail + cinematic (ult11-pitch3d.js, game.js)

- **Comet ribbon upgraded**: soft cross-section gradient texture, distance-based
  interpolation (fills gaps on fast shots, up to 6 pts/frame), whip taper, life
  430ms.
- **Ball "banana" fixed.** `ballMesh.scale.set(d,d,1)` on a SphereGeometry makes
  an ellipsoid; both super-shot occurrences → `setScalar(d)`.
- **Trail length**: buffer 40→96, per-ribbon lifetime that scales with ball speed
  (430–1250ms, eased).
- **12 trail styles implemented** (Standard, Flame, Lightning, Wind, Shadow, Aura,
  Tiger, Afterimage, Dragon, Ice, Nature, Galaxy), driven by one rig (strand
  count, wobble, glow, particle rate, ring cadence). Assigned per player via
  `trailStyleFor()`:
  - Frisina / Xiao / Michael (+ "micheal") → **dragon**
  - pwr≥tec+6 or sho≥85 → **tiger/flame** (signature colours)
  - tec≥pwr+6 → one of lightning/wind/ice/galaxy/aura/nature/after/shadow (tinted)
  - else → any of the 12
  - Name-hashed so it's stable per player. Applied on both open-play shots and
    super shots; `?debug=1` prints `trail <style> (<player>)`.
- **Chase camera fixed.** It aimed `lookAt` at the **goal**, pushing the ball to
  frame edge and cropping the trail. Now aims ahead of the **ball**; pulled back
  (dist 7.5→16.5, height 2.4→4.2) with a side offset (5.5) and positional lag.
- **Slow motion** through flight, tuned to 1.6× (`P3D.cine.slowMo`).
- Ball no longer sinks to the turf before the keeper (arc blends to a landing
  height); hold point moved from ~4.7m to ~1.6m short of the GK.
- **Super shot from a WON FIELD DUEL** now plays the full cinematic. Previously
  only reachable from `manualShot()`; the field-duel branch ran a flat 2D tween
  straight into the GK menu.

## Duel / cinematic ordering (game.js)

- **Result text no longer spoils the cinematic.** SUCCESS/COUNTER + ticker line
  were shown immediately, then outcome routing (with the cinematic) ran ~950ms
  later. On cinematic routes the badge/line are now deferred and flushed from the
  cinematic's `onDone`.
- **GK save banner** added to the older `superCine` fallback path (only
  `superCine2` had it). Ordered: banner → result line → outcome.
- **Free kick** now opens the action menu (pass/shoot choice) instead of
  auto-resuming play.

## AI positioning (game.js) — the big one

Root causes found by computing real values, not inspection:

- **Marking assigned in arbitrary key order** with no range cap → defenders
  marked far men while nearby men ran free, AND forwards got marking jobs and all
  10 outfielders dropped behind the ball. Now: all pairs sorted by distance,
  assigned closest-first, capped at 34% pitch width; **forwards excluded** from
  marking and secondary press.
- **Defensive line floor was 0.085** (inside the six-yard box) → whole back line
  collapsed onto the keeper. Raised to 0.155.
- **Markers ignored the line floor** (they return early, compute own target) →
  clamped to a 0.135 floor.
- **Attacking side's OWN back line** had floor 0.06 and gap 0.35 → any backward
  pass pinned the whole back four on the keeper. Floor 0.165, gap 0.26. This was
  a SEPARATE branch from the defending-line fix and is the "play backwards, all
  my defence goes to the GK" bug.
- **Per-slot depth stagger** added to both defending and attacking back lines —
  they were all sent to one `tx` and rendered as one flat "American-football"
  row.
- **Separation was 45× too weak.** `applyRepulsion` pushed 0.28px/tick vs 4–13px
  of ball attraction → everyone stacked on the ball (simulated: 0px mean spacing).
  `REPEL_FORCE` 0.28→3.2, `REPEL_DIST` 70→109px, keepers exempted. This is why
  earlier shape fixes "did nothing": targets were right, repulsion failed to
  hold the gaps.
- Supporting runners both aimed at the carrier's lane → converged. Now hold their
  lane with opposite side offsets.

## Tackle / shoulder charge (game.js, ult11-pitch3d.js) — NEW, needs sprites

- **Contact trigger fixed.** Duels fired at `IR()*1.8` = ~4.16m apart (IR is an
  *interception* radius). New `CONTACT()` ≈1.7m; all four duel triggers use it.
- **Committed lunge state machine**: wind-up → travel (mostly locked, small
  `track` re-aim in first 45%) → contact or whiff → recovery lockout.
  - tackle: reach 2.79m, travel 4.26m, recover 850ms, foul 22%
  - shoulder: reach 2.21m, travel 3.47m, recover 480ms, foul 7%
  - Only the controlled defender may lunge (no triple-commit). Exempt from
    repulsion and normal AI steering while lunging. `goalGen`-guarded, cleared on
    `resetPhysics`.
- **Visual without new art (placeholder):** `P3D.lunge()` tilts the sprite
  (`SpriteMaterial.rotation`) into the challenge and sprays turf via the revived
  `spawnTrail`. Borrows the shoot/act frame.
- **STILL TODO — the 4 sprites.** 2 tackle frames + 2 shoulder frames. Once made,
  point `P3D.forceAnim(side:key,'side','act',...)` at the real cells and set up
  `layoutFor()` for wherever they live (act row is full: pass 0–7, shoot 0–11 —
  likely needs a 12×7 sheet).
- **Buttons**: △ SHOULDER / □ TACKLE when defending (super shot has no defensive
  equivalent, so those slots are free). Keyboard added: **O △ · P □ · K ○ sprint
  · L ✕**. Mouse/touch still work.

## UI (game.js, style.css)

- Duel action buttons enlarged ~30% on phone. NOTE: inline styles could NOT
  override — four `.dact3d-img` rules all use `!important`; the winner on phone is
  `html.ue-phone .dact3d-img`. Bumped all four in `style.css`. (Amend the skill:
  "inline is more reliable" only holds for NEW styles, not overriding `!important`.)

## Latest-session fixes (v85)

- **Kickoff:** opponents drifted onto your half because `tick()` kept running
  during the kick-off prompt. Now frozen while `G.awaitKickoff` is set.
- **Portrait carry-over across matches:** `hideBusts()` never cleared
  `.bust-img` backgroundImage; if the next match's portrait chain 404s, the old
  face persists. Cleared on hide and on player change.

---

## OPEN / NOT DONE — start here next session

1. **Off-ball AI is reactive-only.** Teammates' targets are all derived from
   `carrierProg` (the carrier's position). Stand still → every target is constant
   → nobody moves; you can't build play. Defenders idle while a man runs through
   because there's no urgency term for an opponent breaking the line. This is a
   design gap (no concept of a run made independent of the ball, no threat
   response), not a broken formula. Diagnose properly before patching.
2. ~~The tackle/shoulder sprites + wiring~~ **DONE (v86/v52)** on home.png — see
   the v86/v52 section. Remaining: draw the same rows on away/japan/italy sheets
   (re-pad each to a clean 8×408 grid) so both teams get real tackle art.
3. **Dead code, verified unreferenced (NOT yet deleted):** in game.js —
   `_fieldTag, _setImgChain, _updateHudChipsLegacy, animateBallVel,
   buildReserveRosterList, buildSlotPriorityMap, cdf, chkInt, clearDim,
   crBuildSquad, crLoadPortrait, crMoraleEmoji, crPortraitHtml, handleDrop,
   moveTowards, pzPatchTeamMenuButtons, teamEditorBack, toggleMusic,
   updateMusicBtn, zoneForX`; in pitch3d — `spawnTrail` was dead then reused by
   tackle FX (now live). CAUTION: `silentShotDuel` and `superToggleInner` are
   unreferenced but may indicate a wiring bug, not dead weight. `drawRadar()` in
   game.js is NOT dead (called at ~line 2568) — the skill file is wrong about it.
4. **Commentary system** (ElevenLabs two-part stitching) — still on the horizon,
   untouched.

---

## 2026-09-08 · Roadmap 0.2 — keeper dives where the ball actually goes

**Files:** `ult11-pitch3d.js` (index tag → `?v=57`), new `lab/lab-gk-dive.html`,
new `ROADMAP.md`.

**The bug (Reddit: "if the shot is going to the far right corner, it doesn't make
sense to have the animation show the GK saving in the middle of the goal"):**
`superCine` set `diveDir:(Math.random()<0.5?1:2)` — a coin flip — and the outcome
step forced `GK_POSE.save` (a single centre-catch cell) on every save regardless
of the shot. The ball's goal point was also `gp.y`, i.e. aimed straight at the
keeper even when it was a goal.

**The fix — shots now have a placement, and everything reads from it:**
- `pickAim(o)` → `{s:-1|0|+1, h:0..1}` in *camera* space (behind the shooter).
  `game.js` may pass an explicit `aim`; otherwise one is generated, favouring
  corners. Screen-side → engine-y conversion is `dy = s * dir * H*0.052*0.78`
  (goal half-mouth is `PWID*0.052`), so it stays correct when halves swap.
- Ball: `gy`/`ty` offset by the aim, and the outcome height now comes from
  `aim.h` — a goal visibly goes into the corner it was aimed at.
- `gkOutcome(c,p)` replaces the fixed save/beaten cells. Lane by aim:
  `side` (row 2, mirrored when `s<0`) · `high` (row 3 cols 1→3) ·
  `low` (row 3 cols 0→1). Frames ramp across the 0.55s outcome beat.
- Keeper travels: `c.gkLat` feeds `cineGkNudge` — a dive that doesn't move
  isn't a dive.
- Keeper leans: `c.gkTilt` rotates the sprite toward the ball, so ONE dive pose
  covers a flat ground stretch and an upright top-corner reach. No new art.
- On a goal he commits the right way, caps short of full extension, then snaps
  to `beaten`. `cineEnd` always resets `material.rotation` so he never stays
  tilted into open play.
- Legacy v1 cinematic patched the same way (`diveDir` now from the aim, and the
  no-dive-sheet fallback routes through `gkOutcome`). Gated the optional
  `gk_dive.png` branch on a new `c._dive` flag — it used to key off `gkRestore`,
  which `gkOutcome` also sets, so the two would have fought.
- Debug hook: `P3D.cineAim()` → aim, dy, lat, mode, timers.

**Verified:** `lab/lab-gk-dive.html` — all 6 placements × save/goal. Left shots
mirror, right shots don't, central high → both-arms catch, central low →
smother, goals → beaten, lean ±23° flips correctly with shot height.

**NOT yet verified in a live match.** The preview pane in this session runs with
`document.visibilityState === 'hidden'`, which pauses `requestAnimationFrame`
entirely (measured: 0 rAF ticks in 500ms), so `loop3d` never runs and the 3D
cinematic can't be driven here. Game logic is `setInterval`, which is why the
match clock still advanced and masked this for a while. Needs one super shot
watched in a real browser window.

**Manual check (console, during a match):**
```js
P3D.superCine2.start({as:G.poss, sk:G.ck, ds:(G.poss==='h'?'a':'h'),
  dir:dirFor(G.poss), gx:goalXFor(G.poss), aim:{s:1,h:0.9}});
P3D.superCine2.fly(()=>setTimeout(()=>
  P3D.superCine2.finish({isGoal:false,onDone:function(){}}),200));
```
Swap `aim.s` to `-1` and `aim.h` to `0.1` to check the mirrored low dive.

---

## 2026-09-08 · Roadmap 0.3 (crests) + 0.4 (1v1 only)

### 0.3 — brand safety, crest half ✅
`game.js` v112, `ult11-cup.js`/`ult11-custom.js`/`ult11-story.js` v6.

`assets/team/italy.png` is the **real FIGC crest**, not a lookalike — same for the
rest. Added `BRAND_SAFE` (default on) + `emblemSrcs(key,isClub)`; every emblem
lookup now resolves to a `fake/` subfolder and falls back to art we generate:

- National → `assets/team/fake/{k}.png` → **flag emoji** (a flag isn't a trademark)
- Club → `assets/team/fake/{k}.png` → `assets/career/clubs/fake/club{k}.png` →
  generated `crBadgeSvg` shield

Five call sites were loading crests directly and all now route through it:
`setTeamEmblem`, `teamEmblemPath`, the 2.5D supporter-flag chain in `startGame`,
and the `badge()`/`badgeHtml()` builders in cup/custom/story (including their
`data-n` secondary source).

**Verified:** fresh tab, home → team select → match → cup, network filtered to
`assets/team/` — every request goes to `fake/`, **zero real-crest loads**.
Fallbacks confirmed live: nationals render 🇯🇵/⭐, clubs render the generated SVG
shield. No holes, no broken images.

Folders `assets/team/fake/` and `assets/career/clubs/fake/` created empty —
drop crests in with matching key names and they appear with no code change.
Real files left on disk for reference; they must not ship.

### 0.3 — names half: NOT DONE, needs a decision
Full findings in `BRAND-AUDIT.md`. Short version: 530 unique player names, and
the large majority are real living footballers (Messi, Zidane, Buffon, Mbappé,
Beckham…) or Captain Tsubasa / Blue Lock characters (Ozora, Hyuga, Wakabayashi,
Schneider, Natureza, Isagi…). Plus 18 real club names. This is a full
replacement of the name database, not a sweep — a creative call, so it is parked
on the user.

### 0.4 — 2v1 / 1v2 removed entirely ✅
Was only disabled behind `if(false&&…)`; the whole apparatus was still shipping.
Removed: the second-defender selection block, `dk2`/`is2v1`/`ak2` from `G.D`,
the `renderSecondDefender` mini-card (44 lines), the two-move attacker flow in
`selA`/`chkRdy`, the "PICK 2 MOVES" / "ATTACK (vs 1ST/2ND)" labels, the second
defender's power contribution and cooldown in duel resolution, `_pending2v1`
cleanup, and the `dact-sel2` orange-glow styling (JS + CSS).

`game.js` 9076 → 8972 lines · `style.css` 3929 → 3852 lines.

**Verified:** field duel opens with "CHOOSE ATTACK (30s)" / label "ATTACK"
(no 2v1 wording), card populates (Aoi, OVR 76), 3 action buttons, no ghost
second-defender node. GK shot duel still correct — keeper-only net layout,
new infobox (Muller, GK, OVR 85, 6 bars, SUPER SAVE / S). No JS errors; the only
404s are the expected `fake/` crest misses.

Note: files are CRLF throughout (checked against a pre-edit copy) — the edits
preserved that, no line-ending churn.

---

## 2026-09-08 · Italy + Germany de-named, and set as the default match

Scope per user: *"at this very moment im going to focus only on 2 teams, Italy and
Germany, everything else will be done later, also make it the two team already
selected when you start fresh exhibition match."*

### Names
Followed the convention already visible in the user's own concept art — **Donati**
(Italy GK #1), **Conti** (Italy #10) — plausible national surnames, not famous
players. Their existing originals were kept untouched: Feo, Ferlora, Frisina,
Mancuso, Vella, Impero, Gino, Teigerbran, Haine, Shester, Margus, Meyer, Goethe,
and the two Schmidts (Schmidt is the German "Smith" — generic, not a footballer).

| Team | Was | Now | Why it had to go |
|---|---|---|---|
| ITA | G.Buffon | **G.Donati** | real player |
| ITA | S.Gentile | **S.Aldini** | Captain Tsubasa |
| ITA | F.Cannavaro | **F.Bertoldi** | real player |
| ITA | F.Totti | **F.Conti** | real player |
| ITA | A.Delpiero | **A.Corsaro** | real player |
| ITA | R.Baggio | **R.Manzini** | real player |
| ITA | A.Pirlo | **A.Sereni** | real player |
| GER | K.Muller | **K.Steiner** | real player |
| GER | H.Kaltz | **H.Reinhardt** | Captain Tsubasa |
| GER | K.H.Schneider | **K.H.Falkner** | Captain Tsubasa |

Three coupled systems had to move with the names:
- **Portraits** are looked up as `assets/players/{lastname}.png` — each file was
  **copied** (not moved) to the new surname. Copied because the club rosters
  (juventus, bayern) and All Stars still use the old names; delete the originals
  when those get their pass.
- **AI behaviour profiles + stat overrides** are keyed by full name. New keys were
  **added** alongside the old ones for the same reason.
- **SPECIALS** is matched by surname substring: added `Falkner` (Fire Shot),
  `Steiner` (Iron Wall), `Donati` (Colossus), keeping the old keys live.

Known, accepted within this scope: club-mode players still called Pirlo/Totti/
Del Piero/Gentile no longer resolve stats from the Italy squad via
`_NATIONAL_PLAYER_INDEX`, so they fall back to generated stats. The null path is
handled — no crash — and those rosters are due for renaming anyway.

### Default match
A fresh exhibition now opens **Italy (home) vs Germany (away)** instead of
Japan vs All Stars — both the `homeIdx`/`awayIdx` defaults and the team-select
fallback.

### Verified live
`selHome=italy`, `selAway=germany`; both squads read back fully renamed; a duel
opened showing **Conti (ITA, OVR 82)** vs **Shester (GER, OVR 80)** with portraits,
stat bars and specials intact; `K.H.Falkner` correctly resolves his Fire Shot.
(`getGKSuper` returns a generic "SUPER SAVE" for every keeper by an earlier design
decision, so the GK entries are inert on that screen — not a regression.)

### Line-ending correction
An earlier note in this changelog said the files were CRLF — that was wrong, based
on a bad `grep` test. Byte-level check: **the project is LF throughout**, and one of
my Python writes had silently converted `style.css` to CRLF. Converted back; all
`.js`/`.css`/`.html` files verified LF again.

---

## 2026-09-08 (later) · Fixes from the user's full playtest

**Correction first:** I was wrong about the crests. I claimed
`assets/team/italy.png` was "the actual FIGC crest". It is the author's own
copyright-free lookalike — deliberately close, not the real mark. `BRAND_SAFE`
is now **false**, all emblem lookups are back on `assets/team/{key}.png` and
`assets/career/clubs/club{key}.png`, and the module badge builders
(cup/custom/story, including their `data-n` fallback) are restored too.
Verified: `italy.png` and `germany.png` load again. The switch and the empty
`fake/` folders are kept, documented honestly, in case a crest ever needs
swapping without touching five call sites. `BRAND-AUDIT.md` section 1 is
superseded by this.

**Scoreboard sat on a flat grey band (image 2).** `.mhud` was in the flex flow
of `#s-match`, so it pushed `.mviews` — and the pitch canvas inside it — down,
and the strip behind the scoreboard was just screen background. Made `.mhud`
an absolute overlay so the 3D view is full-bleed behind it.
Gotcha hit on the way: the rule already had `position:relative` *later in the
same block*, which silently beat the `position:absolute` I added at the top —
removed the duplicate.

**PAUSE and GO removed (image 3, roadmap B.2 brought forward).** Both hidden in
CSS (kept in the DOM so the engine can still toggle `.rdy`, and so a touch build
can re-show them). New keys in the existing keydown handler:
`Esc` or `Tab` = pause · `Enter` = confirm the duel (only when it is ready) and
= kick off when the kickoff prompt is up.

**God rays off by default (image 8).** `P3D.fx.rays` 0.55 → **0.0**. They were
blowing the frame out white in any session that didn't load the author's saved
preset. Everything else in `fx` untouched.

**Pitch reads too small against the sprites (image 7).** The Camera Lab
"Sprite size" slider bottomed out at 0.02 and the author was already there.
Range extended to **0.010–0.10, step 0.0005**. Deliberately did NOT touch pitch
dimensions or camera defaults, so existing saved presets stay valid.

**GK dive/positioning (images 4 & 5): confirmed good by the author** — that is
roadmap 0.2 signed off on the visual side.

### Not fixed — needs eyes on a live 3D view
**Ball vs GK gloves on the catch (image 6).** The ball settles at the wrong
height for the pose that plays, so it reads as held at the belly instead of in
the gloves. This is frame-by-frame tuning against the sprite, and the preview
pane in this session runs hidden — `requestAnimationFrame` is paused, so the 3D
loop never ticks and nothing can be judged. (Also worth noting: computed styles
and element rects are all zero/garbage in a hidden pane — two "failures" I
chased this session were measurement artifacts, not real.)
Suggested next step: a `lab/lab-gk-catch.html` in the same style as
`lab-gk-dive.html` — scrub ball height/offset against each catch pose — rather
than guessing at constants blind.

---

## 2026-09-08 · Scoreboard digits rendering as solid blocks

`style.css` v63.

**Cause:** `@font-face` for BoldPixels declared `font-weight:normal` — it ships a
single weight — while `.hsc` (and `.dsb-score`, `.i-num`, `.i-ovr b` …) ask for
`font-weight:900`. The browser then *synthesises* bold by smearing the glyph,
which closes the ~6px counter inside the pixel zero and turns the score into a
white square.

**Fix (one change, covers all 12 usages):** the face is now declared
`font-weight:100 900`, so any weight request resolves to the real file with no
synthesis. Added `font-synthesis:none` on every Bold Pixel selector as a guard.
Verified: the face reports `weight=100 900`, and canvas advance widths for '0'
are identical at weight 400 and 900 — i.e. no smear.

**Ruled out along the way** (worth not re-checking): the font files are present
and all three formats load; the TTF cmap carries all ten digits; the DOM content
of `#sc-h`/`#sc-a` is `"0"`; rasterising the glyph shows a correct hollow zero;
and the coloured `text-shadow` glow does *not* fill the counter at HUD size.

**Honest caveat:** I could not reproduce the solid-block rendering in a canvas
harness, so this is the best-supported cause rather than a confirmed repro — the
preview pane runs hidden here, so the real HUD can't be looked at. The fix is
correct regardless (a pixel font must never be faux-bolded) and costs nothing if
something else is also at play. One refresh on the author's screen settles it.

---

## 2026-09-08 · Roadmap A.1 — design tokens + style bible ✅

New: `tokens.css` (loaded before style.css) and `STYLE.md`.
`index.html`: `tokens.css?v=2`, `style.css?v=64`.

**Audit first.** style.css held **178 distinct hex colours**, **480 distinct
`rgba()` values**, and three competing variable systems (`--gold*`, `--ue-*`,
`--ff-*`). Font declarations: Bebas Neue 139, Orbitron 116, Rajdhani 29,
Bold Pixel 15, Cinzel 12 — i.e. **255 of 311 declarations are still on the two
faces the redesign is trying to leave.** That, more than anything, is why the UI
still reads FIFA rather than Octopath. Recorded in STYLE.md §3 as the highest-
value A.2 target.

**Built:** one token set — surfaces, ink, a single gold accent, team colours,
state, one hairline language, shadows/glows, geometry, a relative type scale,
motion. Gold and team colours are **channel triplets** (`--u-gold-rgb`,
`--u-home-rgb`, `--u-away-rgb`) so the hairline rules, borders and glows derive
from them; `color-mix()` was deliberately avoided because it breaks html2canvas
in this project.

**Moved out of style.css:** the global `:root` palette and the duel `--ff-*`
`:root`. Colour variables are now declared in exactly one file.

**A.1 is a refactor — zero visual change by design.** Every legacy alias
reproduces its previous value exactly, so the ~200 rules already using
`var(--gold)` etc. keep rendering identically while becoming token-driven.
Verified in-browser: all 17 legacy variables (`--gold --gold2 --red --rf --rl
--blue --bf --bl --sp --green --bg --panel --bdr --dim --w --ff-gold
--ff-cream`) resolve to their previous values, **zero mismatches**.
Where a legacy value differs from the token it *should* use, it is marked
`A.2:` in tokens.css rather than being quietly changed.

**Reskin proven:** injecting only `--u-gold-rgb:127,212,255` re-tinted `--gold`,
`--gold-b`, `--bdr`, `--u-rule` and `--u-glow-gold` together.

**Known gap:** the home menu still carries a component-scoped palette on
`.ue-home`, so that one screen is not yet reskinnable from tokens.css — folding
it in changes its appearance, which is an A.2 decision. Listed in STYLE.md.

---

## 2026-09-08 · Roadmap A.2 (first screen) — in-match HUD on tokens

`tokens.css?v=3`, `style.css?v=66`.

**Scope:** the in-match HUD only — scoreboard pill, on-pitch labels, commentary
strip, d-pad, shot button. 39 rules audited, 89 raw colour literals, 8
declarations on the two faces being retired.

**Type migration (the visible part).**
- `.hhalf` "FIRST HALF": Orbitron → Rajdhani caps, wide tracking, .42→.46em
  (Rajdhani sets smaller than Orbitron at the same size).
- `#passhint`, `.mcomm::before` (LIVE badge), `#dpad .db` labels: Orbitron /
  Bebas Neue → Rajdhani.
- `#pass-banner`, `.shot-btn`: Bebas Neue → **Cinzel** — these are moment
  markers and actions, which is where the serif belongs.
- `.htn` team names already Cinzel; `.hsc`/`.htime` stay Bold Pixel (numerals).
**Result: zero Orbitron and zero Bebas Neue left anywhere in the HUD.**

**Colour → tokens.** Scoreboard shell now `linear-gradient(var(--u-panel),
var(--u-panel-deep))` with a `var(--u-rule)` hairline (was a cream
`rgba(244,236,212,.38)` border — now the one gold hairline language). Score
glows derive from `--u-home-rgb` / `--u-away-rgb`, so they re-hue with the team
tokens. Everything else on `--u-ink*`, `--u-inset`, `--u-edge*`, shadow/glow
tokens.

**Deliberate look changes to judge:**
1. Scoreboard border cream → gold hairline.
2. Shot button orange (`#e86a00`) → gold gradient with dark ink. The orange was
   the last off-palette accent in the HUD.
3. Team names cream (`--u-ink`) instead of pure white; pure white is now
   reserved for numerals per STYLE.md.

**Two tokens added** as the retrofit revealed real surfaces: `--u-inset`
(recessed plate inside a panel) and a panel triplet `--u-panel-rgb` →
`--u-panel` / `--u-panel-thin` (translucent overlay control, e.g. the d-pad),
mirroring the accent-triplet approach.

**Left as raw colour on purpose:** the d-pad's △ □ ○ ✕ glyph colours. Those are
console-convention glyphs carrying meaning, not UI chrome.

**Verified:** all 8 sampled HUD rules resolve through tokens; 6 stylesheets
parse with 2036 rules and no errors; no undefined variables referenced
(`--cc`/`--vp-scale` are set from JS at runtime, not missing).
**Not verified visually** — preview pane still hidden here, so the typography
change needs the author's eyes.

---

## 2026-09-08 · Stale-build trap closed

The author's playtest showed PAUSE + GO still visible and the score still
rendering as boxes. All three fixes were verified present in the files — the
browser was serving a **cached index.html**, so it kept requesting the old
`?v=` numbers. The symptoms fingerprinted the exact stale build: renames present
(`game.js?v=113`) but no hide rules (landed `style.css?v=61`), no font fix
(`v63`), no tokens (`v64+`) — and 113/60 were bumped in the same edit.

Two structural fixes so this stops costing debugging rounds:
1. **`index.html` is now no-cache** (`Cache-Control: no-cache, no-store,
   must-revalidate` + `Pragma` + `Expires`). Asset `?v=` busting only works if
   the document itself is re-fetched.
2. **Build stamp**: on DOMContentLoaded the page logs every loaded asset and its
   `?v=` to the console — `[UE build] tokens.css?v=3 | style.css?v=66 |
   game.js?v=114 | …`. A stale build is now visible at a glance instead of being
   inferred from symptoms.

Verified on a fresh load: stamp prints, `#pauseBtn`/`.dcfm` hide rules present,
`@font-face` for Bold Pixel reports `font-weight:100 900`.

NOTE: one hard refresh is still needed to pick up the no-cache document itself.
Also note the author runs VS Code Live Server on `127.0.0.1:5500`, not the
`:8123` test server used here — same folder, so file edits apply to both.

---

## 2026-09-08 · PAUSE/GO finally fixed — it was specificity, not cache

**I was wrong twice before getting this.** The on-screen build badge proved the
author was running the current build (`css v67 tok v3 js v114`), which killed the
stale-cache theory I had asserted.

**Real cause:** both buttons were already targeted by `!important` rules with
higher specificity further up the file:
```
#s-match .pause-btn.aaa-pause { display:flex !important }        (1,2,0)
#duel-ov .dcfm                { display:inline-flex !important }  (1,1,0)
```
My hide rules used `#pauseBtn` / `#dcfm` — specificity (1,0,0). **When two
declarations are both `!important`, specificity decides**, so mine lost. They
were present in the CSSOM the whole time, which is why "is the rule there?"
checks kept coming back true and misled me.

**Fix:** hide rules now match that specificity and sit later in the file:
`#s-match .pause-btn.aaa-pause, #pauseBtn, .pause-btn.aaa-pause` and
`#duel-ov .dcfm, #dcfm, .dcfm`. A JS `setProperty(...,'important')` workaround
was added mid-diagnosis and then **removed** once the real cause was known.

**Verified properly this time** by resolving the cascade in-page — collecting
every rule that `el.matches()`, sorting by (importance, specificity, order).
This needs no layout, so it works in a hidden pane where `getComputedStyle`
returns garbage. Winners are now `display:none` for both.

### Score digits — synthesis theory disproved, glow is the new suspect
The same cascade dump showed **no rule sets `font-weight` on `.hsc` any more**
(the `900` was dropped during the A.2 token pass), so there is no synthetic bold
— yet v67 still rendered boxes. That kills the font-synthesis explanation.

Remaining suspect: `.hsc.sh/.sa` carried `text-shadow:0 0 10px rgba(team,.9)` —
a 10px blur at .9 alpha wrapped around a pixel zero whose counter is only ~6px,
wide enough to flood it solid. Consistent with the clock (`.htime`, .3 alpha)
staying legible and the `·` separator (no counter) being fine.

Changed as a **bisect, not a claimed fix**: numerals `--u-fs-num` 1.35em →
1.58em, and the team glow 10px/.9 → 18px/.45. If the zeros read correctly now it
was the glow; if they are still solid the font itself is wrong for numerals and
the score moves to a different face.

### Tooling note
`index.html` now carries no-cache meta plus an on-screen build badge
(`BUILD css vNN tok vN js vNNN`, bottom-right). The badge is temporary and comes
out once things are stable — but it is what disproved the cache theory in one
screenshot instead of another round of speculation.

---

## 2026-09-08 · A.2 — duel action buttons: PNG → drawn UI

`game.js?v=115`, `style.css?v=70`.

Author's observation: the action buttons are PNGs, and in the reference they are
part of the UI — "once a button is highlighted it looks better". Correct, and
this is A.2 work, not a detour: the duel is on the retrofit list.

**The real limitation.** Each button was `assets/ui/btn-*.png` (17 files) with
its glow and colour baked into the pixels. The selected state could therefore
only stack `drop-shadow()` filters around a fixed bitmap — the glyph itself
could never change colour. That is the ceiling the author noticed.

**Replaced with inline SVG** drawn with `currentColor`: `ACT_SVG` +
`actIconSvg()` in game.js; `actBtnInner`/`superToggleInner` now emit
`<span class="dact3d-ico"><svg viewBox="0 0 24 24">…`. Glyphs: pass, dribble,
shoot, one-two, tackle, intercept, block, save, punch, and a sparkle for
special/super (super-*/special-* reuse the base glyph, the panel already colours
those families).

**Selection now retints the glyph**, per family:
attack → `--u-home`, defence → `--u-away`, special → `--u-gold`,
super → `--u-special`, each with a matching glow; disabled dims to
`--u-ink-mute`. All from tokens, so a re-hue carries through.

Scoped under `#duel-ov` / `.duel-aaa` deliberately — the old `.dact3d-img` rules
used `!important`, and after the PAUSE/GO episode these are written to sit above
them by specificity rather than fight it. Stale `.dact3d-img` tags are also
hard-hidden so a cached one can never render.

**Verified:** 6 buttons → 6 inline SVGs, **0 leftover `<img>` tags**, **0
`btn-*.png` network requests** (17 image loads removed), and the cascade
resolver confirms a selected attack button's icon colour resolves to
`var(--u-home)` via `#duel-ov .dact-atk.dact-sel .dact3d-ico`.

The 17 PNGs are left on disk unused — safe to delete once the look is signed off.

---

## 2026-09-08 · Duel actions → RPG command list

`tokens.css?v=5`, `style.css?v=71`, `game.js?v=116`.

**What I broke and why.** Swapping the PNGs for SVG left the buttons wordless —
the label text had been *inside the bitmap*, and `actBtnInner` only ever emitted
an icon and a cost. Hence "almost unreadable". Labels are now real DOM:
`actBtnInner(actionId, costTxt, label)` + `actLabelFor()` (falls back to a
derived name), with `lbl` passed through from both `mkBtn` builders.

**Layout — now the reference's command list.** `.dmenu-btns` is a vertical
column and each `.dact3d` is a row: `[icon] LABEL ......... cost`. NORMAL and
SPECIAL sit side by side as two columns, so specials appear next to the normal
list rather than inline with it.

**Colour.** Normal = blue (`--u-home`), Special = purple (new `--u-magic`
token, `--u-magic-rgb: 150,96,255`). **Gold is deliberately not used on
actions** — it stays reserved for UI chrome (rules, frames), per the author's
"skip the yellow".

Selected row: soft left-to-right gradient in the family colour, brightened
border with a solid 2px left edge, outer + inset glow, label to
`--u-ink-strong`, and the SVG glyph retints and glows. Hover nudges the row 2px
right (RPG cursor feel). Unaffordable rows drop to 42% with muted text.

Written at `#duel-ov` specificity throughout so it sits above the old
`!important` PNG-era rules instead of fighting them.

**Verified** with the in-page cascade resolver: `.dmenu-btns` flex-direction
resolves to `column`, `.dact3d` display to `flex`, and a selected special's
background to the purple gradient via `#duel-ov .dact-sp.dact-sel`. All six rows
carry a label, a cost and an inline SVG.

Open follow-ups: the icon glyphs are still my functional set rather than the
reference's console-style ⚽ △ □ ★ — a one-map edit in `ACT_SVG` now that they
are vectors.

---

## 2026-09-08 · Duel menu matched to the reference (style.css v73)

Author, fairly: the first pass "looked like the cheapest way to remove the box",
still ALL CAPS, wrong font, oversized caption, bad framing.

**Fixed against the mockup:**
- **No container.** The panel came from `index.html`'s inline
  `.duel-aaa .dmenu{border;background;backdrop-filter:blur(9px)}`. Killed at
  `#duel-ov` specificity (border shorthand *and* longhands — see below).
- **Title Case**, `text-transform:none`. Labels read "Pass", "Threading Pass".
- **Cinzel** — the same face as the SUPER SHOT skill name (`.dss-name`), which is
  what the author asked for.
- **Caption shrunk** from a 12px padded pill to `clamp(8px,.62vw,10px)`, no
  padding, muted.
- **Framing:** rows sit directly on the art, 2.2em between the two columns, and
  the selected row is the only filled element on screen.
- Selected = gradient bar bright at the left fading right, thin border, outer
  glow + inner top highlight. Blue for normal, purple for special. No gold.

**Process note — two misses the cascade resolver caught before the author did.**
After writing the rules I re-ran the in-page resolver and found three properties
still being won by other rules:
- `border` on the panel: my shorthand `border:none!important` did not surface as
  the winner; adding `border-width:0!important; border-style:none!important` did.
- `font-size` on the label and the cost: `.duel-aaa .dact3d-l/-c` set these with
  `!important` at `clamp(17px,29.44px,26px)` / `clamp(9px,13.44px,12px)`, so my
  non-important declarations lost despite higher specificity.

This is the third time this file's `!important` layer has bitten. The resolver
(collect every rule where `el.matches()`, sort by importance → specificity →
order) is now the standard check before claiming a style change works, because
`getComputedStyle` is unusable in a hidden preview pane.

**Verified winners:** panel `border-width:0` / `background:none` /
`backdrop-filter:none`; label `var(--u-font-display)`,
`clamp(15px,1.15vw,20px)`, `text-transform:none`; cost
`clamp(8px,.62vw,10px)` with `padding:0`; selected special = purple gradient.

---

## 2026-09-08 · New duel sprites wired + duel lighting stripped (style.css v76)

Author supplied `assets/players/conti.png` (338×499, front) and `shester.png`
(400×477, back) — the first two Phase-D duel sprites: attacker faces camera,
defender faces away.

**Sizing is defined once, so every future player inherits it.** Two variables on
`#duel-ov`:
```
--duel-hero-h:      74%   /* attacker — front, further from camera */
--duel-hero-h-cpu:  86%   /* defender — back, closer, so bigger */
```
The CPU sprite is deliberately larger per the author's note that it sits closer
to camera. Retuning every player is now two numbers.

**Pixel-art pipeline.** The new art is low-res with *different aspect ratios*
(0.677 vs 0.839), so the old fixed 1023×1537 frame could not be reused:
`background-size:contain`, bottom-anchored, each sprite keeps its own ratio, and
`image-rendering:pixelated/crisp-edges` so upscaling stays crisp instead of
blurring. Positioning rebuilt: attacker `left:5%`, defender `right:4%`, both
bottom-anchored at `bottom:0`.

**Lighting removed** (author: "remove the red and blue light effect… and the
weird sort of lights and the colored circle"):
- `.daura.blue` / `.daura.red` — the big side glows — hidden.
- `.dp-card-wrap::before` (team-coloured spotlight) and `::after` (the coloured
  ring) — hidden.
- The red rim on the CPU sprite (`#duel-ov .dhero.right .dpav` had
  `drop-shadow(0 0 26px rgba(255,80,80,.45))`) reduced to a single grounded
  dark shadow, matching the attacker.

**Kept:** `dpavRunBob` shake, as requested — the author is animating a proper
idle in the coming days.

**Verified:** both sprites request and load; `image-rendering` resolves to
`crisp-edges`; CPU filter is the plain dark shadow with no red; `.daura`
resolves to `display:none`; heights resolve to 74% / 86%.

Probe note: `el.style.backgroundImage` reads empty here because `fCard` sets the
`background` *shorthand* — the art was loading fine. Second time this session a
shorthand made a check look like a failure (the panel `border` was the first).
When probing, read the shorthand or the computed value, not the longhand.

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
