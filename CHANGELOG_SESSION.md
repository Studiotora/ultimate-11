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
