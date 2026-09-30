# Ultimate Eleven — Session Changelog

Handoff for a fresh Claude Code session. Everything below is already applied to
the files in this delivery.

## Current versions (in index.html, 2026-09-24)
- `game.js?v=206` · `style.css?v=99` · `tokens.css?v=8` · `ult11-kitrun.js?v=4`
- `ult11-pitch3d.js?v=136` · `ult11-cine3.js?v=8` · `ult11-stadium-classic.js?v=5`
- `ult11-penalty.js?v=3` · `ult11-input.js?v=9` · `ult11-gkqte.js?v=2` · `ult11-aerial.js?v=2` · `ult11-fx-flame.js?v=7` · `ult11-ribbon.js?v=2`
- NOTE: entries below v108 are older history. ROADMAP.md is the running handoff and has the full per-change records since then.

## 2026-09-25 — Author's night look + camera as defaults (pitch3d v136)
- The night lighting/post-FX values the author tuned in the Camera Lab next to the hero frame are now the night defaults; their broadcast camera values are the default camera.

## 2026-09-25 — Field mist removed (pitch3d v135, Claude)
- The flat grey mist layer on the pitch is gone; the stadium fog and dust stay.

## 2026-09-25 — Night look matched to the hero frame (pitch3d v134, Claude)
- Bloom only on the lamps (players no longer glow), depth of field blurs the crowd above the play, muted cooler turf, ground mist and drifting dust around the play.

## 2026-09-25 — Camera Lab scenarios (pitch3d v132, camlab v7, Claude)
- Camera Lab → SCENARIO: HERO FRAME / CORNER / GK THROW freezes the match (no clock, no AI), poses the players and holds a fixed camera for side-by-side look tuning with the lab hero frame. OFF resumes.

## 2026-09-25 — Hero-frame film grade available on key G (pitch3d v131, Claude)
- The lab's filmic grade is ported; at night press G on PC to switch between it and the game grade. The game grade stays the default.

## 2026-09-24 — Kickoff panorama, Cinematic camera, non-glowing goals (pitch3d v130, Claude)
- Before kickoff the camera slowly circles the stadium at pitch level until KICK-OFF is pressed.
- New Settings row CAMERA: BROADCAST / CINEMATIC (closer and lower).
- Goals and net stay white at night without glowing; the lens colour fringe is halved.

## 2026-09-24 — Night: white goals, softer stand lights (pitch3d v129, Claude)
- Goal posts and net read white under the floodlights at night; the far-stand floodlight flares are toned down.

## 2026-09-24 — Night light rig + kickoff hero camera (pitch3d v128, Claude)
- Night: floodlight banks on the roof edges with light beams onto the pitch, dust in the beams, LED boards spilling coloured light on the grass, phone lights twinkling in the crowd, photographers with flashes behind both goals.
- Before every kickoff a low hero camera looks at the goal end under the lights, then cuts to play.

## 2026-09-24 — Players cast real shadows (pitch3d v127, Claude)
- Every player, the referee, the ball and the goal frames now cast real shadows in the exact shape of their current sprite frame, in every time of day and weather (long at golden hour). They replace the old stretched fake shadows (`P3D.setRealShadows(false)` shows the old ones for comparison).

## 2026-09-24 — Look-dev hero frame (lab, Claude)
- New `lab/lab-heroframe.html`: one art-directed night frame near the box showing what HD-2D needs (lit sprites casting real shadows, backlight key, roof floodlights, practical lights, crowd with phone lights, shafts, fog, bloom, tilt-shift DOF, film grade), with a layers panel. Images in `lab/heroframe/`. Lab only; no game files changed.

## 2026-09-24 — Settings: Time (day/golden/night) + Weather (sunny/rain/snow) (pitch3d v126, Claude)
- Two new Settings rows that change the match look live: golden hour (low warm sun, long shadows), night (floodlight pools), rain (streaks, wet sheen at night), snow. Day + sunny is exactly the original look.
- Fixed: Settings and How to Play opened from the pause menu were invisible (the panels lived inside the home screen).

## 2026-09-24 — Night look: atmosphere, depth of field, film finish; pitch lines no longer glow (pitch3d v125, Claude)
- Night fog swallows the far stands, the floodlight heads glow, the corner beams read on the dark, a stronger HD-2D blur, subtle film grain and lens fringing. The painted lines stay matte. All only in the night look (key N).

## 2026-09-24 — NIGHT look (look-dev 1-2), switchable (pitch3d v124, Claude)
- A new night look: the pitch is lit by real floodlight pools over a dark blue base, players/referee/ball are lit by where they stand, the stands and sky go dark, the ad boards glow, and a night colour grade. Off by default: press N on PC (or ?look=night) to switch; it is remembered.

## 2026-09-24 — Super-shot trail: round head, cyan, player colours (pitch3d v123, cine3 v8, Claude)
- The comet now ends in a round glow around the ball at every angle (it used to end in a flat cut).
- Generic super shot = the mockup cyan. Signature colours: Mancuso blue, Vella green, Frisina red, Falkner flame, Margus yellow.

## 2026-09-24 — Playtest fixes: super-shot ball, keeper hands, shot camera (game v206, pitch3d v122, Claude)
- Super shot: the pixel ball now travels with the trail (it used to stay at the kick spot while the trail flew).
- Keeper: during a dive his reaching glove is placed on the ball's real arrival point (screen error 0-1 px, was 24-80 px).
- Camera: follows the ball from the strike through the keeper's dive, catch or goal, instead of swinging back to the shooter.

## 2026-09-24 — Corner lighting finished: camera-aware beams (pitch3d v121, Claude)
- Each light beam now fades out before the players when its foot sits over the middle of the view, and stays a full shaft when it enters from the side. Grass near play: forward L 55.5 (off 49, v119 63), reverse 42 (off 35, v119 51). Beams still visible; penalty and super shot unchanged. Images in `lab/lighting-v121/`.

## 2026-09-24 — Corner lighting v120 applied with a measured fade (pitch3d v120, Astra + Claude)
- Astra's v120 (narrower beams fading into the grass pool) validated in the real 3D game. Its fade removed the beams from the match camera entirely, so the fade range was tuned to 0-.16: near-ball grass L 57 (off 49, v119 63), beams still visible. Reverse view still somewhat pale: open for Astra. Images in `lab/lighting-tune-v120/`.

## 2026-09-24 — Corner lighting tune applied (pitch3d v119, Astra + Claude)
- Astra's v119 tune validated in the real 3D game and applied: beams and grass pools toned down, plus live switches `P3D.gfx.volRays/volPools/volDust`. It halves the washed-out look near play; what remains comes from the beams (measured), next step proposed to Astra. Comparison images in `lab/lighting-tune-v119/`.

## 2026-09-24 — Astra corner lighting applied (pitch3d v118)
- Applied Astra's `corner-lighting-v117-to-v118.patch` on top of the penalty renderer (base hashes matched, result identical to Astra's candidate): four corner lamps with broad light shafts, grass pools and drifting dust (dust off on the low tier). Visible in a headless high-tier check; it brightens the mid-pitch noticeably, tune if it washes out. Backups `*.pre-corner-lighting*.bak`.

## 2026-09-24 — Penalty in the real stadium (game v205, pitch3d v117, penalty v3, Claude)
- The penalty QTE now plays inside the match's own 3D stadium (team-coloured crowd, flags, boards, lights, real taker and keeper sprites, the match ball, the real net bulging) through a new `P3D.pen` camera/pose mode in pitch3d. Other players, the referee and the leftover match HUD are hidden while it runs. The lab scene stays only as the fallback when 3D is off.

## 2026-09-24 — GK roadmap 6b: penalties play the QTE (game v204, ult11-penalty.js v2, Claude)
- A penalty in a match now plays the approved penalty mockup full-screen: you take it (aim + timing ring) or you keep (pick a zone + timing ring); the CPU half scales with the taker's shooting and the keeper's reflexes. The result goes back into the match (goal, keeper's ball, rebound, goal kick). Engine and clock frozen meanwhile; pause works. Old keeper duel kept as a fallback.

## 2026-09-24 — GK roadmap 6a: penalty lab mockup (Claude)
- New `lab/lab-penalty.html`: behind-the-shooter camera, QTE penalty (YOU SHOOT: aim + timing ring; YOU SAVE: pick a zone + timing ring, early dive tells), real taker and keeper sprites, GOAL / SAVED / POST / MISSED. Lab only; no game files changed.

## 2026-09-24 — GK roadmap 5: hand-throw distribution (game v203, pitch3d v116, Claude)
- Keeper distribution is all by hand: PASS roll, CROSS throw, SHOOT long throw (was a punt). Real wind-up with the ball in his hands, then the release frames as it leaves; CPU keeper the same. Pause-safe, double press ignored. Goal kicks unchanged. Backups `*.pre-gkthrow-*.bak`.

## 2026-09-24 — GK roadmap 4: keeper state machine (game v202, pitch3d v115, Claude)
- Normal shots are placed beside or at the keeper, and he reads the real flight: set → low/high dive or reach, full stretch as the ball arrives → catch on the grass / gather / parry landing / beaten → up → throw. Punch = the dive frames. Mirrored per camera side.
- Verified in headless Chrome with the 3D scene (the preview pane was hidden). Open-play shots arrive low with today's ball physics, so they get the low dive; the high dive is used by super shots. Backups `*.pre-gkstate-*.bak`.

## 2026-09-24 — GK roadmap 3: new 6x6 keeper sheet live (pitch3d v114, Claude)
- Keeper uses `assets/ps1/gk_sheet6.png`: idle row 0, run row 4, throw release frames for every distribution, real low and high dives in the super-shot cinematic (mirrored for the left; landed frame when beaten). Punch reuses the dives (author).
- Held ball placed on the new sheet's glove; airborne dive frames no longer pinned to the grass; one-frame idle flash at the save handoff removed; sheet-rebind grid bug fixed. Backup `ult11-pitch3d.js.pre-gk6-v113.bak`.

## 2026-09-24 — GK roadmap 1-2: audit + afSave fix (game v201, Claude)
- Audit of the GK sheet, render and save path (ROADMAP entry). The author's new 6x6 keeper sheet saved as `assets/ps1/gk_sheet6.png`; it divides cleanly (256x280 cells) and is not wired yet.
- `afSave()` no longer re-rolls a save the keeper duel already won: it reuses `G.D.lastDefPow` from `resDuel`, can't produce a goal, and no longer charges keeper stamina twice. Backup `game.js.pre-gk-save-v200.bak`.

## 2026-09-24 — GK glove attachment + moving teams (game v197, pitch3d v113, Codex)
- Fixed the keeper-hold early return that froze both teams: support/marking movement and bounds now update while the goalkeeper carries the ball.
- Held 3D ball follows the active keeper sprite's glove across idle/run frames and mirrored facing; release blends into the real ball flight. Lower 2D fallback height; goal kicks stay on the grass.
- `index.html` loads the new cache versions. v196/v112 backups saved. Syntax and mechanics tests passed; a headless match measured 10 home and 9 away outfielders moving during a clean catch. Full 3D grip alignment remains to check in the normal CDN-served game. ROADMAP.md has the exact files, risks and next checks.

## 2026-09-24 — GK catch handoff + CPU throw timing (game v196, Codex)
- Fixed the separate `afSave()` clean-catch path that still auto-transferred the GK's ball to an outfielder. The keeper now holds it visibly at chest height until a distribution button is pressed; its release starts from that height. Goal kicks remain on the grass with short/long kick labels.
- CPU throw-in setup extended from 1 to 3 seconds. `index.html` loads game v196; v195 backup saved as `game.js.pre-gk-catch-v195.bak`.
- Headless match verified a clean catch remains with GK beyond 2 seconds, PASS then releases; CPU throw-in remains staged after 1.45 seconds and releases after 3. Node syntax passed. Details and remaining 3D/controller check: ROADMAP.md.

## 2026-09-24 — Throw-ins + goalkeeper choice (game v195, Codex)
- Touchline out-of-play now starts a proper dead-ball throw-in: PASS short, CROSS/SHOOT long, directional aim, airborne physical flight, CPU choice and offside exemption. The taker waits at the touchline rather than receiving automatic possession.
- Human keeper possession waits for PASS short roll, CROSS long distribution or SHOOT punt. The former 650 ms forced throw is removed; CPU keeper still distributes automatically after a short read. Goal kicks ignore offside.
- `index.html` loads game v195; `game.js.pre-throwin-gk-v194.bak` preserves the original. Roadmap entry has details, validation and open checks. Node syntax and targeted mechanics tests passed; a local headless Chrome match confirmed throw-in and keeper transitions (CDN THREE unavailable under file URL, so 3D view remains to check).

## 2026-09-23 — matchday UI integration finish (game v189 / css v99 / kitrun v4)
- Preserved today's reference-based Team Select, Team Management, Match Menu and Full Time work already present in `game.js?v=188`, `style.css?v=98` and `index.html`; added a catch-up record in ROADMAP.md because those edits had not been logged.
- Retired the `ult11-team.js?v=5` script tag from the friendly flow. Its legacy `openTeamMenu()` interception was hiding the new native `#s-team` screen behind the older TEAM FORMATION overlay. The file remains on disk as history/fallback.
- Loading now uses the stadium artwork instead of a black/gradient-only field. `loading-runner.png` and `loading-ball.png` are true-alpha versions of today's JPG sheets, removing the black boxes around both animations; the runner uses the side-run row and stays behind the rolling ball.
- Team Select's kit preview is now transparent over the pitch art, with both runners grouped around a centre ball rather than an opaque bright-green strip. Canvas height increased to 90 for readability.
- Validation: syntax checks passed for `game.js` and `ult11-kitrun.js`. Live local-browser flow passed title → home → team select → loading → native team management → match → pause. Loading art/alpha, the native management board and the three-column pause screen were visually inspected; build stamp showed css v99 / js v189. Full Time markup/data wiring was source-checked but a 90-minute live completion was not replayed.

## 2026-09-24 — Full-time screen rebuilt (game v194 + ult11-fulltime.js v2)
- Winner / loser captains, FULL TIME board with flags, score, scorers + minutes and 9 stats; tiles REMATCH / CHANGE TEAMS / MAIN MENU.
- New engine counters: passes attempted/completed (-> pass accuracy), tackles, corners, goal log (scorer + minute). Pause Match Facts PASSES fixed.
- Details: ROADMAP.md "2026-09-24 — FULL-TIME SCREEN rebuilt".

## 2026-09-24 — Pause menu rebuilt (game v192 + ult11-pausemenu.js v2, teamselect v2)
- Both teams on the Team Management board (CPU formation, mirrored faces), captains behind, scoreboard + stopped clock, ladder menu with every old action + RESUME MATCH.
- Pad navigation now works in the pause menu (it had none). Kick-off prompt / bust HUD hidden while paused.
- v3: kick-off prompt no longer shows on the loading screen or in Team Management before kick-off.
- game v193: kick-off button text is just KICK-OFF, in Rajdhani.
- Details: ROADMAP.md "2026-09-24 — PAUSE MENU rebuilt".

## 2026-09-24 — Team Management rebuilt (game v191 + ult11-teammanage.js v1)
- New screen from the approved `lab/lab-teammanagement.html`: head-crop cards with role colours, 4-man bench, player panel with face + radar, ladder menu (formation / tactics / marking / auto-choose), confirm on every swap, marking board, glowing KICK OFF.
- Uses the engine's own lineup globals; KICK OFF / APPLY & RESUME and BACK keep every route (friendly, pause, career, story, cup).
- Tactics + marking are saved (HT._tm) but not yet read by the match AI.
- Details: ROADMAP.md "2026-09-24 — TEAM MANAGEMENT rebuilt".

## 2026-09-23 — Team Select rebuilt (game v190 + ult11-teamselect.js v1)
- New screen from the approved `lab/lab-teamselect.html`: stadium bg (`assets/wallpaper/teamselect2.jpg`), waving flags, captain art, Cinzel names, OVR + ATT/MID/DEF/SPD, 2 kits (away N/A), idle sprites, Nationals/Clubs/Special tabs, flag carousel.
- game.js: 3 nav hooks only; the old FIFA-style team select block is now dead code.
- Details: ROADMAP.md "2026-09-23 — TEAM SELECT rebuilt".

## 2026-09-23 — super shot plays like the mockup (game v184 / pitch3d v111 / cine3 v7)
- Decide first (author's choice): vs an AI keeper the save is rolled at the kick; the flight goes straight into the net / gloves. A human keeper keeps the duel menu + QTE.
- Added the 0.9s run-up (hold now 3.3s = run-up + 2.4s charge), shooter + keeper only on screen, 1.35s accelerating flight, keeper dives in flight, ball carries into the back of the net, goal shot held 1.6s (save 1.0s) with the mockup's goal camera.
- cine3 scale now comes from the sprite cell height (effects were ~19% too big).
- Details, validation and open risks: ROADMAP.md "2026-09-23 — SUPER SHOT CINE3: now plays like the mockup".

## 2026-09-23 — super shot cine3 (catch-up entry)
- `ult11-cine3.js?v=6` + `ult11-pitch3d.js?v=110` were changed without a log entry. Documented in ROADMAP.md, "2026-09-23 — SUPER SHOT CINE3".
- Approved mockup copied to `lab/lab-supershot-mockup.html` as the reference.
- Measured gaps vs the mockup: no run-up; other players block the charge; flight ~2.4s vs 1.35s with an overexposed trail; ball parks for the GK duel; outcome barely shown.

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

## 2026-09-24 — Keeper boundary and build-out shape (Codex)

**Intent/files:** fix the author's new keeper-hold screenshots. `game.js?v=198`, `index.html` cache tag v198; no renderer or art changes. The current original v197 game was edited in place so the glove and simultaneous work remain intact.

**Change:** the keeper's three repeated movement caps (0.10W deep, 0.30–0.70H wide) are now one `clampKeeperToArea()` matching the pitch's 0.16W, 0.22–0.78H penalty box with a slight inset. Keeper-possession AI now gives outfielders formation- and role-based build-out targets outside the box instead of treating the GK as a generic carrier and clustering near him. Applied in both AI v2 and fallback v1; defenders of the other team still mark normally.

**Validation:** syntax check passed. In a five-second headless match, all four initially box-bound home backs moved beyond the x=0.23W penalty-area line (x=0.268–0.325W) while spreading across four lateral lanes. Simulated keeper input stopped at x=0.228W near the drawn line. Both left/right keeper-area clamps returned their matching boundary. The file-based browser still reports missing CDN `THREE`, so these were gameplay checks, not full 3D visual checks.

**Next:** real served-game visual check in both halves, short/long passing from the new shape, controller/phone movement feel. Reproducible smoke harness: Codex workspace `smoke_keeper_buildout.cjs`.

## 2026-09-24 — Real audio assets wired (Codex)

**Intent/files:** replace the active WebAudio placeholder synthesis with the author's `assets/audio` clips. New `ult11-sfx-samples.js?v=1`, `game.js?v=199`, `index.html` script/cache tags. `ult11-sfx.js?v=5` is no longer loaded; its pre-edit copy and pre-edit game/index backups are `ult11-sfx.js.pre-sampled-audio-v5.bak`, `game.js.pre-sampled-audio-v198.bak`, `index.html.pre-sampled-audio.bak`.

**Behavior:** crowd1–4 rotate during matches, running loops only while the carrier moves, and sampled tackle/catch/kick/special-charge, all five referee whistles, pause open/close and cursor/confirm/cancel play on their matching events. `afSave` plays the keeper-catch recording only for a clean catch. The existing master-volume slider now also sets `SFX.master`. The active music remains `menu.mp3` and `match1.mp3`; match2/3 were moved to `old` and are no longer selected or referenced. The alternative `cursor1.wav` remains unused.

**Validation:** JS syntax checks passed. Browser smoke test `smoke_audio.cjs` in the Codex workspace recorded all mapped sound file requests and, in a live match, `match1.mp3`, start whistle, crowd1 and running. Volume slider 35 -> sample master 0.35. No unexpected page errors; file-based test still cannot load CDN THREE. Auditory balance, mobile autoplay and controller-specific navigation remain to be checked on the target device.

## 2026-09-24 — Halftime uses PM2; gameplay stays frozen (Codex)

**Files/cache:** `game.js?v=200`, `ult11-pausemenu.js?v=4`, `index.html` tags. Backups: `game.js.pre-halftime-v199.bak`, `ult11-pausemenu.js.pre-halftime-v3.bak`, `index.html.pre-halftime.bak`.

**Fix:** old `goHalf()` sent the game to `s-half` after clearing, but not nulling, `G.mt`; with `G.paused=false` and stale `kickoffUntil`, the idle watchdog could resume gameplay behind that old UI. Halftime now becomes a locked pause using the same PM2 pause-menu layout. PM2 changes the heading/clock to HALF TIME and the final action to SECOND HALF KICKOFF; the virtual controls and commentary strip are hidden. Team Management returns to halftime with APPLY & RETURN. The second-half action alone clears the lock, restores the match clock/music and arms kick-off. The old `s-half` markup is inactive, retained for later cleanup.

**Validation:** syntax checks and `smoke_halftime.cjs` passed. Natural clock expiry opened halftime; browser held positions and clock unchanged for 3.4 seconds; menu, substitutions round-trip and second-half transition/away kick-off arm all worked. Local file-based browser could not load CDN THREE, so normal served-game 3D framing and physical pad/touch feel still need checking. ROADMAP.md has the full intent, exact behavior and next checks.

## 2026-09-24 — Short pass and cross audio corrected (Codex)

**Files/cache:** `ult11-sfx-samples.js?v=2` and `index.html` audio cache tag; `game.js` remains v200. Backups: `ult11-sfx-samples.js.pre-pass-cross-v1.bak`, `index.html.pre-pass-cross.bak`. Supplied audio was not edited.

**Change:** `pass_anim` audio dispatch now follows the physical ball's `ground`/`cross`/`throw` kind. Ground passes use `assets/audio/short-pass.mp3`; crosses use `assets/audio/cross.mp3`; throw-ins play no kick. Actual `_shotTrail` shots retain `aerial_shoot.wav`. A stale `_shotZone` no longer makes a pass sound like a shot, and jump/tackle `whoosh()` no longer reuses the aerial-shot recording.

**Validation/next:** JS syntax passed; browser smoke test `smoke_pass_cross_audio.cjs` observed the correct five cases (ground, cross, throw, shot, whoosh) without unexpected page errors. Listen and tune levels/timing in the normal served game on keyboard, pad and touch. Header-shot audio without `_shotTrail` may need a later explicit event. ROADMAP.md contains the full handoff.

## 2026-09-25 — Marassi Square added to main menu (Codex / Astra)

- Added `marassi-square/` as an isolated playable 3D Road to Glory/trailer slice and one home-menu link in `index.html` to `marassi-square/index.html?v=1`. Backed up the prior index as `index.html.pre-marassi-square.bak`; no match gameplay or renderer files changed.
- Bundled the 1,039,356-byte Blender GLB, local Three.js r128/GLTFLoader, Italy sprite, and author's short-pass/block audio. The square supports walk, sprint, jump, kick, ball rebound, touch/gamepad input and trailer camera.
- Chrome smoke test from the main-game HTTP root loaded the real GLB and verified movement, jump, kick/rebound and trailer mode with no page errors. Physical controller/touch and phone performance still need target-device checks.
- Full intent, exact files/cache, validation and next checks are in the new ROADMAP.md entry; development source/screenshots are in the Codex workspace `marassi-square-prototype/`.

## 2026-09-26 — Marassi north-facing map camera (Codex / Astra)

**Author correction:** the map must show buildings left and right and the stadium to the north. The initial diagonal chase view and west-facing stadium layout were wrong.

**Files/cache:** `marassi-square/scene.js?v=2`, its local `index.html` script tag; backups `scene.js.pre-north-map-v1.bak` and `index.html.pre-north-map-v1.bak`. Main menu, match renderer, gameplay and GLB are unchanged. Runtime rotates the loaded scenery (and procedural fallback) 90 degrees: stadium north, apartments east/west, practice wall east. Player/ball bounds and rebound axis match that rotation.

**Camera:** elevated north-facing map view, restrained player pan instead of orbit, with a wider portrait FOV. Trailer mode keeps the same orientation and only a small drift. Initial ball sits east of the player by the practice wall direction.

**Validation:** syntax and actual-GLB Chrome smoke passed; keyboard movement, jump and east-wall rebound reached x=11.95 then reversed without page errors. Visually reviewed `marassi-square-prototype/north-map-view.png` in the Codex workspace: stadium at top, buildings framing both sides. Main copy syntax checked. No physical pad/touch or phone frame-rate validation claimed.

**Next:** author review of this composition; target-device portrait/landscape framing and input feel. The stylized facade/art detail remains an initial blockout, separate from the corrected camera/layout.

## 2026-09-26 — Lower Marassi camera and closed architecture (Codex / Astra)

**Intent:** author requested a lower camera, no open gaps between stadium and apartment facades, and enclosed balcony sides.

**Files/cache:** `marassi-square/scene.js?v=3`, local `index.html` tag, and `blender_scene.py`. Backups: `scene.js.pre-closed-corners-v2.bak`, `index.html.pre-closed-corners-v2.bak`. Match files and main menu unchanged. GLB remains original revision 1: six stadium corner/return/cap meshes and two side panels per balcony are added at load time. Local Blender source includes equivalent geometry for future rebuild; cloud Blender revision has not been changed.

**Change:** north-facing camera height lowered 27 to 17 m, positioned z=32, looking at y=3/z=-4. Stadium extensions meet both apartment rows with solid returns; balcony sides connect facade to front rail. These are structural meshes with lighting/shadows, not image overlays.

**Validation:** JS syntax passed; actual-GLB Chrome smoke passed movement, jump and east-wall ball rebound without page errors. Visually reviewed lower-camera-closed-corners.png in the Codex workspace marassi-square-prototype folder: lower view, sealed stadium corners, visible balcony side panels. Main copy syntax checked.

**Next checks/risks:** author's visual approval and phone/controller playtest remain. Runtime geometry adds draw calls; phone frame time remains unmeasured. The procedural fallback still has simplified architecture; final Blender re-export should replace load-time repairs once composition is approved.


## Super-shot auras: who gets which (2026-09-26 · pitch3d v137, cine3 v10)

**Audit.** The six charge auras (base / thunder / flame / shadow / dragon / seraph, `ult11-cine3.js` AURA_P) were picked from the shot's hashed *trail* style. A super shot needs SHO 85+, and SHO 85+ is also the "strong striker" branch of `trailStyleFor()`, so every non-signature super shooter rolled tiger/flame, which gave them a cyan **flame** aura. Thunder, shadow and seraph only landed on players who can't super shot. In real play, then, nearly everyone showed flame, and the new auras never appeared.

**Change.**
- `SIGNATURES` now carries an explicit `aura`: Mancuso base, Vella base, Frisina dragon, Falkner flame, Margus thunder.
- New `auraKey()` in pitch3d: a signature plays its own aura, a forced trail (Camera Lab or `?debug=1&trail=`) plays that style's aura, and everyone else plays the plain **base** aura (the same rule as the generic cyan).
- cine3 `setAura()` accepts an aura id directly. It also exposes `U11_CINE3.aura` (the last charge's aura), and `P3D.cineState().aura` was added.
- The animation itself is unchanged: a profile only changes the charge extras.

**Verified in the game** (headless): Mancuso base, Vella base, Frisina dragon, Conti base, Manzini base, Falkner flame, Margus thunder (with canSuper forced). No errors.

**Open.**
- **Margus has no SHO stat, so he can never super shot** in real play, and the thunder aura is unreachable. The author needs to decide whether to give him SHO 85+.
- Shadow and seraph have no owner yet.

**Also fixed.** On 2026-09-26 index.html had been replaced by an older copy. It had lost the MARASSI SQUARE menu item and the CAMERA settings row (broadcast/cinematic), and carried stale `?v=` numbers (pitch3d 130, camlab 6). It is restored from the v135 index with pitch3d v137, cine3 v10 and camlab v8. Backups: `*.pre-aura*.bak`.

## 2026-09-26 — Author's Genova panorama integrated (Codex / Astra)

**Intent:** extend Marassi Square with the author's provided pixel-styled Genova hillside background, using the supplied JPEG now and permitting later replacement with original PNG artwork.

**Files/cache:** `marassi-square/assets/genova-background.jpg`, `marassi-square/scene.js?v=4`, local `index.html` cache tag. Backups `scene.js.pre-genova-background-v3.bak`, `index.html.pre-genova-background-v3.bak`. No main menu, match renderer or gameplay files edited; Claude's concurrent aura work preserved.

**Implementation:** a 210x105 m distant image plane at (0,-24.5,-65), preserving the image's 2:1 aspect. The 3D stadium/apartments occlude its foreground rooftops; hills and sky continue behind the north skyline. Nearest texture filtering, sRGB encoding, no mipmaps; image is unaltered JPEG, no false claim of restored pixel detail. Backdrop is unlit and excluded from foreground tone mapping/fog so the supplied colours remain stable. One extra draw call, no collision geometry.

**Validation:** syntax passed; Chrome loaded real GLB and background (`backgroundReady=true`), movement/jump/wall-rebound smoke passed with no page errors. Visually reviewed the lower-camera trailer screenshot; expanded the initial plane to remove visible side edges. Evidence: Codex workspace `marassi-square-prototype/genova-background-check.png`. Main scene syntax checked after copy.

**Next checks/risks:** target-device portrait/ultrawide framing; replace JPEG with original pixel PNG later if available. Current background is daylight only; night tint/window treatment and weathered foreground/pixel foliage are separate pending quality passes. Phone performance remains unmeasured.


## Germany's super shooters (2026-09-26 · game.js v207)

The author ruled that Margus, Shester and Goethe should have the super shot, with Falkner staying the top striker and the other two the more technical ones. None of the three had a SHO stat, so `canSuper` always failed for them. New `STAR_STAT_OVERRIDES`:

| Player | SPD | DRI | PAS | SHO | DEF | POW | Unlocks |
|---|---|---|---|---|---|---|---|
| Shester | 80 | 88 | 90 | 86 | 64 | 82 | super shot, super pass, super dribble |
| M.Goethe | 85 | 89 | 82 | 86 | 56 | 80 | super shot, super dribble |
| Margus | 85 | 86 | 80 | 88 | 54 | 83 | super shot, super dribble; thunder aura + yellow now reachable |

Falkner is unchanged at SHO 96. Shester and Goethe are not signatures, so they use the generic cyan and the base aura. Verified with `canSuper` on the Germany roster. Backup: `game.js.pre-gersuper-v206.bak`.

## 2026-09-26 — Marassi atmosphere: wear, pixel foliage, warm night (Codex / Astra)

**Intent:** author requested lived-in city surfaces, pixel plants and warm night lamps/windows with shadows.

**Files/cache:** new `marassi-square/atmosphere.js?v=1`; `marassi-square/scene.js?v=5`, local `index.html` controls and script tags. Backups `scene.js.pre-atmosphere-v4.bak`, `index.html.pre-atmosphere-v4.bak`. GLB, main menu, match renderer and gameplay remain unchanged. Runtime additions are isolated to the square; no remote Blender revision was altered.

**Changes:** seeded nearest-filtered plaster weathering; world-scale paving scuffs/cracks, drains, utility boxes and facade pipes. Replaced 12 faceted foliage clusters with 36 alpha-tested lit pixel cards and gently swaying sprite-shaped shadow casters; retained 3D trunks/planters. Four streetlamp pools, two facade lanterns with 512px shadow maps, 36 selectively lit windows with pixel curtain/frame silhouettes and four low-window point-light spills. Cool ambient night, warm practical lights and darkened Genova backdrop. DAY/NIGHT button or N changes look; trailer view hides button but N remains active.

**Validation:** JS syntax passed. Chrome actual-GLB test verified background/model ready, 12 pixel clusters, 36 lit windows and two configured shadow lanterns; day/night switch, movement, jump and ball rebound passed without page errors. Day/night screenshots visually reviewed; evidence `marassi-square-prototype/atmosphere-day.png` and `atmosphere-night.png` in Codex workspace. Main copied scripts syntax checked.

**Risks/next checks:** phone frame time and physical pad/touch remain unmeasured. Added materials, pixel cards and two shadow passes need target-device profiling. Current foliage/materials are procedural authored pixel assets, not image-generated production art. Lamp/window glow uses soft sprites and emissive materials rather than full-screen bloom. Night backdrop is a tint of daytime artwork (clouds remain), pending authored night artwork. Simplified GLB fallback does not receive this atmosphere pass. Author review of wear strength, night readability and foliage silhouette before a final Blender/material-batching pass.

## 2026-09-26 — Raised Genova buildings and home master character (Codex / Astra)

**Intent:** author could see only hilltops and requested the home.png master instead of the Italy character.

**Files/cache:** `marassi-square/scene.js?v=6`, local index tag, new `marassi-square/assets/home.png` copied unchanged from `assets/ps1/home.png`. Backups `scene.js.pre-home-background-v5.bak`, `index.html.pre-home-background-v5.bak`. Match files unchanged; atmosphere.js stays v1.

**Change:** panorama raised 19.5 m (y=-24.5 to -5), preserving size, aspect and north placement; hillside apartment rows now show above the stadium. Home master is 3492x3264 with matching 12x8 frames; nearest filtering, lit card and alpha-tested shadows retained. No sprite resampling/editing was performed; future story sprite can replace this copy.

**Validation:** syntax passed; actual-GLB Chrome smoke passed movement, jump, ball rebound and day/night without page errors. Visually reviewed raised panorama and grey-kit home character. Evidence: Codex workspace `marassi-square-prototype/raised-background-home.png`. Main script syntax checked after copy.

**Next checks:** author's composition review and target-device framing/performance. Source JPEG/night tint limitations from previous entries remain.

## 2026-09-26 — Balcony return direction fixed (Codex / Astra)

**Intent/cause:** author noticed backwards balcony enclosures. Runtime side panels used a reversed Z-axis sign, extending from the outer rail into the square instead of toward the facade.

**Files/cache:** `marassi-square/scene.js?v=7`, local index tag. Backups `scene.js.pre-balcony-direction-v6.bak`, `index.html.pre-balcony-direction-v6.bak`. No match, atmosphere or GLB edits. Local Blender source already had correct side placement.

**Fix:** each front rail is matched to its nearest actual balcony slab. Side-panel centre/depth derive from the slab bounds, retaining the original outer front rail and returning to the building rather than relying on a signed-axis guess.

**Validation:** syntax and actual-GLB Chrome gameplay/day-night smoke passed without page errors. Visually reviewed both apartment rows: enclosures now follow floor slabs, with front rail on the outer edge and sides toward facade. Evidence `marassi-square-prototype/corrected-balcony-rails.png` in Codex workspace. Main copied script syntax checked.

**Next checks:** author visual review; existing mobile/performance checks remain outstanding.

## 2026-09-26 — Building and stone paving material pass (Codex / Astra)

**Intent:** proper building/floor textures instead of flat facade colours and the red paving grid.

**Files/cache:** new `marassi-square/surface-textures.js?v=1`, `atmosphere.js?v=2`, `scene.js?v=8`, local index script tags. Backups `atmosphere.js.pre-surfaces.bak`, `scene.js.pre-surfaces.bak`, `index.html.pre-surfaces.bak`. Main menu, gameplay, match renderer, GLB and background unchanged.

**Change:** three deterministic 256px seamless texture tiles authored in canvas: rough cracked plaster, staggered brick/mortar, varied worn stone pavers. Diffuse and bump mapping with roughness; sRGB diffuse, nearest magnification and mipmapped anisotropic minification. Metre-scaled UV projection on 29 wall/brick meshes prevents whole-facade stretching. Original paving tile mesh hidden; one 40x31 textured floor replaces its red joints, with grime retained above it. Contact shadows raised to the new floor surface. Texture generators are local/reproducible; these are procedural authored materials, not downloaded photographic/AI assets.

**Validation:** JS syntax passed. Actual-GLB Chrome smoke reported 29 textured meshes/three textures, verified movement/jump/rebound/day-night, and no page errors. Day and night screenshots reviewed; colour-space corrected after first render to prevent washed-out paving. Main scripts syntax checked after targeted merge. Evidence: Codex workspace `marassi-square-prototype/textured-square-day.png` and `textured-square-night.png`.

**Remaining risks/next checks:** author texture scale/wear review and phone GPU/frame-time profiling. Floor is visually 5.5cm above original substrate; gameplay ball/actor vertical physics unchanged. UV edits and runtime floor should be baked into a future Blender export once art is approved. Existing night-background and fallback limitations remain.

## 2026-09-26 — Lived-in facades, varied windows, homes and shops (Codex / Astra)

**Intent:** author requested visible dirt/cracks, varied window colours and one identifiable residential entrance per building with other ground-floor bays as shops.

**Files/cache:** new `marassi-square/facade-details.js?v=1`, `atmosphere.js?v=3`, local index tags. Backups `atmosphere.js.pre-facades-v2.bak`, `index.html.pre-facades-v2.bak`. Scene stays v8, surfaces v1, main/match files and GLB unchanged.

**Changes:** seven facade-specific transparent texture layers with larger branching cracks, plaster patches, rain streaks and rising damp at the base, positioned behind window geometry. 115 window material variants use six glazing tones, different curtains and frame textures. Seven numbered residential doorways have panelled wood/green doors, handles and intercom boxes; their shop awnings are hidden. Remaining ten bays have distinct roller shutters/glazed storefronts and PANETTERIA/ALIMENTARI/BAR/EDICOLA/BOTTEGA signs. Buildings remain non-enterable. Existing 36 warm night windows remain selectively lit.

**Validation:** JS syntax and actual-GLB Chrome smoke passed with no page errors; runtime counts seven facades, 115 windows, seven entrances and ten shops. Movement/jump/rebound/day-night still passed. Day/night screenshots visually reviewed from gameplay framing, showing visible wear, varied glazing and entrance/shop distinction. Main scripts syntax checked. Evidence: Codex workspace `marassi-square-prototype/lived-in-facades-day.png` and `lived-in-facades-night.png`.

**Risks/next:** author review of wear strength/shop sign scale; phone frame-time profiling remains outstanding. Additional facade/window materials and shop signs add draw calls. Runtime detail is not baked into the remote Blender source/export; preserve these modules until a consolidated asset export is made. Current front doors are visual only, as requested for this prototype.

## 2026-09-26 — Plaza lamp moved; stadium-style light shafts and dust (Codex / Astra)

**Intent:** author's top-left lamp stood against the building; move it into the plaza for overhead light and adapt the current stadium volumetric/particle treatment.

**Files/cache:** new `marassi-square/light-vfx.js?v=1`, `atmosphere.js?v=4`, `scene.js?v=9`, local index tags and V control. Backups `atmosphere.js.pre-light-vfx.bak`, `scene.js.pre-light-vfx.bak`, `index.html.pre-light-vfx.bak`. Stadium renderer/source was read for its RIG cone/dust shaders but not edited; all match work preserved.

**Change:** original top-left streetlamp pole/head hidden; replacement at map-world (-7,7.3,-13), inside plaza, with 7.2m pole and downward warm spotlight. It now casts shadows; one facade lantern relinquishes its shadow pass so total shadow spotlights remains two. Six night-only tapered cone meshes and 660 GPU-drifting warm dust motes adapted from stadium RIG shader patterns, softened near ground/source to avoid hard mist slabs. Lamp halos and physical light pools retained. N selects night; V toggles shafts/dust for comparison, retaining physical lights/shadows. Trailer view stays clean.

**Validation:** syntax passed. Actual-GLB Chrome smoke reported six shafts/660 particles/two configured shadow lamps; model/background, movement/jump/rebound/day-night passed without page errors. Captured night VFX on/off and visually reviewed final framing/readability; intensity raised after initial effect proved too faint. Main copied scripts syntax checked. Evidence: Codex workspace `marassi-square-prototype/premium-plaza-night.png` and `premium-plaza-vfx-off.png`.

**Risks/next:** author review of the premium night treatment and target-device GPU profiling. Cone meshes approximate volumetric scattering (no ray-marched volumetric shadowing); physical spotlights produce real geometry shadows. Two shadow maps retained at 512px. Particles avoid CPU per-frame position updates. New lamp is runtime geometry, not baked in cloud Blender; existing furniture collision and night-background limitations remain.

## 2026-09-26 — Softer central spill, lamp-owned shadows, distant focus (Codex / Astra)

**Intent:** author found central window/facade light too strong, wanted ground shadows from lamps and background DOF.

**Files/cache:** `marassi-square/scene.js?v=10`, `atmosphere.js?v=5`, `light-vfx.js?v=2`, local index tags. Backups `scene.js.pre-shadow-focus.bak`, `atmosphere.js.pre-shadow-focus.bak`, `light-vfx.js.pre-shadow-focus.bak`, `index.html.pre-shadow-focus.bak`. Main match and source image unchanged.

**Changes:** window spill .9 to .3 with shorter reach; central facade lanterns and their cones/dust at 30% power. All four streetlamps now cast shadows, aimed slightly into plaza; tall lamp has 1024px shadow map, others 512px, with reduced bias/normal bias. Moon directional shadow disabled at night so warm practical lights own shadow direction; ambient .30 to .23. Added panorama-only 25-tap Gaussian focus blur in backdrop material shader, using linear sampling; nearby buildings, paving, character and foliage remain sharp. Source JPEG is untouched. Fixed separate cone time uniforms so source-specific shafts keep animating.

**Validation:** syntax and Chrome actual-GLB gameplay/day-night smoke passed without page/shader errors, four configured shadow lamps. Visually reviewed visible tree shadows, reduced central glow and smooth background separation. Replaced first sparse blur after visible ghosting. Main scripts syntax checked. Evidence: Codex workspace `marassi-square-prototype/shadow-focus-night.png` and `shadow-focus-day.png`.

**Risks/next:** phone GPU profiling required for four shadow maps plus background texture samples; final art review of blur amount and dark areas. Backdrop blur is authored distant-layer focus, not full-scene physical DOF. Current lamp shadows can shift from multiple sources; existing source-export/furniture-collision/night-background limitations remain.

## 2026-09-26 — Santa Fede playable 5 v 5 layout sample (Codex / Astra)

**Intent:** author requests small church campetto on Corso Sardegna. Public court references unavailable; author explicitly approves an approximate sample to correct together: north tall wall, west building, east church, south parking.

**Files/cache:** new `santa-fede/index.html?v=1`, `match.js?v=1`, `scene.js?v=1`, `style.css?v=1`, `README.md`, local `assets/{three.min.js,home.png,away.png,short-pass.mp3}`. Main index adds one SANTA FEDE menu link, backup `index.html.pre-santa-fede-20260926.bak`; existing cache tags kept as found. Main game.js, match renderer, stadium lighting and Marassi Square unchanged. Targeted fresh-index insertion checks hash for concurrent edits.

**Change:** independent sample simulation: four outfield plus keeper per side, 22x36 provisional court, three-minute match; movement/sprint/jump, pass/cross/shot, tackles/interceptions/deflections, goal crossing, keeper catches, selectable home keeper distribution, delayed CPU restarts, kick-ins/corners/goal kicks, pause/full-time/rematch. Keyboard/touch/standard pad input. North-up presentation; sealed church/residential volumes, balcony returns, fences/goals, worn procedural surface textures, pixel plants, south parking cars. Day/night physical shadow lights, soft cone shafts and dust; T hides HUD for trailer framing. Static architecture batched by material. Uses unchanged real home/away master sheets; keeper cards are tinted outfield placeholders.

**Validation:** node syntax, deterministic physics checks (10 players, pause freeze, sprint/jump with ball, nonmagnetic pass flight, goal crossing, CPU setup delay, human corner, keeper distribution, loose-pass interception, full match) and local Chrome actual-assets smoke passed. Browser movement/jump and frozen clock/positions on pause; day/night and 390x844 layout captured. No page/shader errors. Measured night frame approximately 138 draw calls / 7.6K triangles after batching, reduced from about 520 calls; not a device performance benchmark. Evidence in Codex workspace `santa-fede-prototype/santa-fede-{day,night,phone}.png`, `match.test.cjs`, `smoke.cjs`.

**Risks/next:** explicitly an approximate sample, not a surveyed replica. Author should correct court surface/dimensions, church/facade shape, camera and parking. Independent basic AI needs playtesting and balance; not a reduced version of the main 11v11 engine. Proper keeper sprites, character identity/action-frame refinement, phone GPU and physical controller/audio checks remain. No career/story progression or super-shot integration. Runtime geometry only, not a Blender export. Volumetrics are cone approximations. No paid generation used.

**Installed verification:** Chrome smoke also passed against the main-game server at /santa-fede/index.html?v=1 with real installed assets, 10 players, approximately 138 draw calls, no page/shader errors. Main script tags preserved: game.js?v=207 and ult11-pitch3d.js?v=137. Physical pad/audio and target phone performance remain unverified.

## 2026-09-26 — Santa Fede moved into the native stadium system (Codex / Astra)

**Intent:** author's correction: use the normal broadcast/low/cinematic cameras, worn slightly uneven asphalt and barely visible paint. Santa Fede is another playable stadium, not a new match engine. This entry supersedes the separate prototype above.

**Files/cache:** main `game.js?v=209`, `ult11-pitch3d.js?v=139`, new `ult11-stadium-santafede.js?v=2`, main `index.html`; `santa-fede/index.html` now redirects to `../index.html?stadium=santa-fede`, and its README documents retirement. Original backups: `game.js.pre-santa-native-20260926.bak`, `ult11-pitch3d.js.pre-santa-native-20260926.bak`, `index.html.pre-santa-native-20260926.bak`; later refinement backups retained. Legacy standalone scripts/assets remain archived but are no longer loaded by the menu. Targeted fresh-file edits preserved Claude's current lighting, audio and match work; Marassi Square untouched.

**Change:** main menu and Settings stadium row select the native Santa Fede variant. The existing match, input, AI, passing, keeper distribution, jumps, super shots, restarts, pause and camera paths are reused. Santa Fede starts five players per side using GK/CB1/CM1/CM3/ST in a 1-2-1 diamond; formation/pause squad coordinates and labels follow this layout, squad-editor rebuilds retain five, and offside is disabled for this mode. Normal stadiums use the original roster path on the next match. No camera implementation changed.

**Environment/surface:** approximate north wall, west residential building, east church and south parking surround the engine's authoritative 70 x 44.87 world-unit pitch. Native goals and markings are retained, avoiding duplicated paint or changed gameplay coordinates. Procedural asphalt has grain, cracks, repairs and sparse low-contrast paint derived from the original pitch mask. Its shallow visual height variation remains below the engine's zero-height decals (approximately -0.037 to -0.005 world units); gameplay collision stays flat. Day uses the native basic pitch/shadow-catcher path, night the existing pitch shader. Four local corner lamp banks and selective warm windows replace stadium-only extras; generic stands, flags/boards and the Astra roof rig are suppressed only for this variant. Static opaque architecture is batched by material. Switching away restores the selected native grass surface preference.

**Validation:** installed scripts pass `node --check`. Chrome actual-main-game smoke loaded the native module, started live play with five roster/position entries on each team, captured broadcast/low/night, switched to classic and back, and found no uncaught JS exceptions. Original squad construction restored on classic (Italy 11; Germany's existing available starter pool 10), then Santa Fede restored 5/5. Existing fallback portrait 404s remain; no shader errors observed. Evidence/tests: Codex workspace `work/santa-native/smoke.cjs`, `native-broadcast.png`, `native-low.png`, `native-night.png`. Earlier standalone draw-call measurements do not describe this native renderer; no reliable native frame-time benchmark taken.

**Risks/next checks:** approximate layout, not a surveyed Santa Fede replica. Pre-match team editing still displays the normal XI; this sample takes its five from the listed slots. Full-match five-player AI balance, substitutions, all set-piece paths and physical controller/phone performance need playtesting. Night is deliberately dark and requires author art review. Asphalt unevenness is visual, not new ball/character collision physics. Live stadium switching changes surroundings; match size is selected on the next match start. Do not revive the retired standalone engine or overwrite Claude's renderer with archived files.
## 2026-09-26 — Santa Fede facade materials and readable night lighting (Codex / Astra)

**Intent:** author judged the close-camera buildings unfinished and night lighting too dark. Improve materials and architecture visible in the existing Camera Lab hero/corner/keeper views.

**Files/cache:** `ult11-stadium-santafede.js?v=3`, main index module tag and `santa-fede/README.md`. Game stays v209, renderer v139; no gameplay/camera/Claude stadium renderer edits. Backups: `ult11-stadium-santafede.js.pre-material-light-v2.bak`, `index.html.pre-santa-material-v3.bak`. Targeted module/cache merge from fresh originals.

**Change:** deterministic 512px plaster, stone, brick, roof tile, wood and asphalt materials; world-scaled box UVs replace whole-wall texture stretching. Church has arched stone window surrounds, varied leaded panes, mullions/transoms and projecting sills, an eave course, downpipes and visible warm wall lanterns. Separate facade wear overlays add rain streaks, irregular plaster wear and rising damp. Neutral material palettes replace the overly yellow stone/doubly tinted walls. Church roof now has UVs and tile texture. Night-only cool fill and church facade wash preserve building visibility, with warm lantern point lights and selective emissive windows. Corner spotlights use wider cones and engine-appropriate distance attenuation; four existing 512px shadow maps retained. Local day fill helps shaded walls. These are authored runtime textures/geometry, not photogrammetry or newly generated photographic assets.

**Validation:** module syntax passes. Two actual native Camera Lab capture rounds visually reviewed fixed hero day/night plus corner and keeper angles; first night fill was still too dark, second raised it and softened overly rectangular wear patches. Installed main-game browser smoke passed live 5/5 play, night/cinematic views, regular-stadium restoration and Santa Fede restoration with no uncaught JS exceptions. Runtime has four corner lamps and 53 window materials; existing fallback portrait 404s remain. Evidence: Codex workspace `work/santa-native/material-hero-day.png`, `material-hero-night.png`, `capture-views.cjs`, `smoke.cjs`.

**Risks/next checks:** author must review this material/lighting pass; still approximate architecture, not a measured replica or final premium-art certification. Native pitch light shader is unchanged and remains cooler than facade lanterns. Point/wash/fill lights are scoped by the removable stadium group but affect all lit scene materials while Santa Fede is active; other variants retain their rig. Extra lights/materials need target-device GPU profiling; no frame-time benchmark. No bump/normal maps added; depth comes from modeled trims and light/shadow. Existing five-player menu/AI/set-piece limitations from the previous entry remain.
## 2026-09-26 — Santa Fede goal-end orientation corrected (Codex / Astra)

**Intent/cause:** author correctly identified church behind the hero-frame goal. The provisional environment used north along -Z, while native goals run along X; native integration had incorrectly left church/houses at goal ends.

**Files/cache:** `ult11-stadium-santafede.js?v=4`, main index module tag and `santa-fede/README.md`. Main game v209 and renderer v139 unchanged. Backups `ult11-stadium-santafede.js.pre-orientation-v3.bak`, `index.html.pre-santa-orientation-v4.bak`.

**Fix:** build the architecture using exchanged width/length, preserving the original metre scale, inside a removable child group rotated -90 degrees. Design north now corresponds to the native +X goal end: tall wall at X=39; south parking X=-48; east/right church Z=31.435; west/left housing Z=-31.435. Native pitch/goal positions, player physics and every camera remain unchanged. Parent bowl group is not rotated, so regular stadiums are unaffected. Local light fixtures/targets rotate with their buildings. Original full pitch extent remains 70 x 44.87.

**Validation:** module syntax passes. Native browser layout assertions confirm wall/parking beyond opposite goal lines and church/houses beyond opposite touchlines. Existing fixed hero capture visually confirms tall wall and fence behind goal, replacing church; day/night and keeper angles captured. Browser checks regular-stadium switch and return to Santa Fede. Evidence: Codex workspace `work/santa-native/capture-corrected.cjs`, `corrected-hero-day.png`, `corrected-hero-night.png`, `corrected-keeper-view.png`.

**Next checks/risks:** author review of the corrected arrangement and wall finish. Earlier approximate-replica, five-player balance and GPU-profile limitations remain. Design cardinal directions describe the neighborhood layout, not a camera compass; broadcast keeps the existing native match camera orientation.

## 2026-09-26 — Santa Fede HD-2D pixel material rebuild (Codex / Astra)

**Intent:** author judged the procedural buildings unfinished and approved the strongest pixel-art/3D material pass we could deliver. Replace placeholder architectural surfaces with dedicated bitmap art and modeled depth while retaining the native playable stadium.

**Files/cache:** new `ult11-santafede-art.js?v=1`, `ult11-stadium-santafede.js?v=5`, targeted main `index.html` script insertion, updated `santa-fede/README.md`; new `assets/stadiums/santa-fede/{material-atlas-v1.png,detail-atlas-v1.png,foliage-atlas-v1.png,README.md,generation-prompts.json}`. Backups `ult11-stadium-santafede.js.pre-pixel-art-v4.bak` and `index.html.pre-santa-pixel-art-v5.bak`. Fresh originals checked against staging before targeted install. Main game v209 and match renderer v139 hashes unchanged; all other script versions and Claude's lighting/audio/gameplay work preserved. Marassi Square untouched.

**Art/build:** three new built-in image_gen atlas masters (actual 1254 x 1254, originals retained unchanged; full prompts/provenance stored beside them). Runtime samples 256px material/detail tiles and 128px alpha foliage with smoothing disabled, nearest magnification and mipmapped minification. World-scaled plaster/limestone/terracotta/stucco UVs; fitted carved doors, leaded church glazing, shutters and curtained casements. Ivy, laurel, geraniums and weeds are lit alpha-tested cards. Geometry includes projecting stone arches/sills/piers, closed roof eaves and solid gable ends, tiled roof/ridge, campanile/rose tracery, numbered house entry plus separate shop shutters/signs/awnings, 12 balconies with closed returns, downpipes and stone-paved runoff. Four corner banks, eight warm lanterns and selective tinted night windows; lights moved clear of their own pole geometry and reduced after the colour fix. Static opaque geometry batches by material identity. Four 512px corner shadow maps retained.

**Colour/loader fix:** actual native r128 post-processing expects display-referred colour with LinearEncoding and no final gamma conversion. New sRGB textures are decoded for lighting, then ONLY Santa Fede art material outputs re-encode before the existing match grade. Global renderer is untouched. Window reflections use tinted BasicMaterial artwork; surrounding architecture receives real light/shadow, no claim of glass transmission. Initialize Texture.userData explicitly for r128 and mark disposed textures to prevent late async uploads to a removed stadium. All 13 atlas tiles and all three sources verified loaded.

**Layout/integration:** corrected goal-end orientation unchanged: north wall native X39, south parking X-48, church right Z31.435, houses left Z-31.435, authoritative native pitch 70 x 44.87. Existing worn asphalt, native goals/markings, five-player slot selection and main engine remain. No new simulation, Blender export, generated background panorama or match camera implementation. Camera Lab side/entrance/house review poses are temporary in the test browser; fixed hero preset captures use the original preset.

**Validation:** both installed modules pass node syntax checks. Actual installed main-game Chrome smoke passed live 5/5 roster and position entries with moving phase, broadcast/cinematic/night, classic switch and regular roster restoration (Italy 11; existing Germany available pool 10), then Santa Fede 5/5 restoration. No uncaught JS or WebGL/shader diagnostics; all required art assets/tiles loaded. Visual review corrected a roof opening, unreadable dark glass and excessive night wash. Final installed Camera Lab screenshot check is recorded in Codex workspace `work/santa-native/installed-art-validation.txt`; captures `pixel-hero-{day,night}.png`, `pixel-church-{day,night}.png`, `pixel-church-entrance.png`, `pixel-houses-day.png`. Existing missing legacy stadium/PS1 fallback assets, portrait paths and favicon warnings remain unrelated to the new art; their URLs are recorded in the capture report.

**Risks/next:** author art review and actual-device GPU/frame-time profiling still required; this is an approximate campetto, not a surveyed replica or AAA certification. Repeating atlas motifs can be broken up with future authored decals. Native grain/chromatic fringe and pitch night shader remain unchanged and need separate art review. Extra architecture/window materials/lights and ~6.8MB PNG masters add load/render cost; no reliable native performance benchmark. If the global renderer migrates to a fully linear post-processing pipeline, review/remove the local colour adapter (its guard currently checks only outputEncoding). Full-match five-player AI balance, substitutions, set pieces and physical pad/phone testing remain as before. Preserve the retired standalone sample as archive only.


## Ball ghosts on crosses and long passes (2026-09-26 · pitch3d v140)

The author asked for a cross or long pass to show 3 or 4 round ghost balls behind the ball, fading as they fall back. They should be real ball copies, not a glowing trail.

- `passGhostStep()` is called right after the open-play `ballMesh.position.set`. It draws `P3D.passGhostCfg.n` = 4 sprites. They are see-through copies of the pixel ball: `ballSpriteTex` cloned onto 6 different spin frames, tinted `#7fe8dc`, with opacity .55 / .38 / .24 / .12, each 6% smaller than the one before.
- Ghost i sits (i+1)×1.5 ball diameters back along the path the ball actually flew, so the spacing is the same at any frame rate. Blending is normal, so there is no bloom.
- A fallback draws plain discs when the pixel ball is off.
- It only runs during `pass_anim` when `ballTravel.physicalPass` is set, and only for `kind==='cross'` or a pass longer than 0.3 of the pitch width. It never runs on shots, super shots or cinematics.
- `P3D.passGhost=false` turns it off.

Tested headless on a cross by day and at night. Picture: `lab/passghost/cross_ghosts_zoom.png`. Backup: `ult11-pitch3d.js.pre-ghost-v137.bak`.


## GK upgrade: ball in hands on a catch, in the net on a goal, camera on both (2026-09-26 · pitch3d v141, game.js v210)

**Audit.** Tested at full speed on a GPU-backed headless Chrome (`cdp2.mjs`, 178 fps; the old SwiftShader runner managed 3 fps and cut every animation short), using the new `P3D.gkProbe(side)` debug probe (drawn ball, keeper and glove on screen, camera).

| Case | Before |
|---|---|
| Open-play catch | OK: the ball is hidden in the glove art during the dive, then held on the grip, carried out and thrown. |
| Parry and punch | OK: loose rebound; the camera follows the ball. |
| Open-play goal | **Broken.** afGoal never moved the ball: it stayed in front of the keeper. The GOAL card, referee card and banner all appeared at once, right over the goal, so the ball never went in the net and you never saw the keeper beaten. |
| Super-shot catch | The cinematic was fine, but the cut back to the match camera started from where the camera was before the cinematic and panned about 2 s across the pitch to the keeper. |
| Super-shot goal | After the cinematic the keeper stood straight back up. |

**Changes.**
- `P3D.goalBall(scorerSide)`, called from afGoal:
  - The drawn ball carries on over the line to where the shot was going (the keeper's dive read it: `GKA.bw`). It hits the net (`netHit`, the bulge), drops and bounces once inside.
  - It is render-only and ends when `_scoringGoal` clears.
  - A ball the cinematic already put in the net is left where it is.
- The match camera stays on that ball (`shotFocus` includes `GB.on`).
- afGoal (game.js):
  - The GOAL card (`#gfl`), `showReferee('GOAL!')` and `showGoalBanner` now wait 900 ms, and goalZoom + shake land at 330 ms, when the ball hits the net.
  - The kickoff reset moves back by the same 900 ms.
  - Everything is guarded by the goal generation.
- `cineEnd()`:
  - `_camSnap` makes the next match-camera frame jump straight to the keeper / ball.
  - After a cinematic goal, the new `gkAnim(ds,'down')` state leaves the keeper lying beaten (row 1 c5, 3.2 s) on the ball's side.

**Verified** (GPU headless): open-play goal, catch, parry and punch, plus super-shot goal and catch. Picture: `lab/gk-goal-catch/gk_goal_catch.png`. Backups: `ult11-pitch3d.js.pre-gkaudit-v140.bak`, `game.js.pre-goalball-v209.bak`.


## Super-shot catch in the hands · one new GOAL title · goal-net orbit camera (2026-09-26 · pitch3d v142, game.js v211, new ult11-goaltitle.js v2)

**Super-shot catch at hand height.** The author reported that the ball was never at the height of his hands: it sat at his stomach. On a save, the cinematic's `out` step aimed the ball at his spot at a guessed height (`2.2+gh*7`). It is now steered onto the reaching glove of the dive frame on screen (`P3D.gkaGlove`, the `GKA_GLOVE` art points), nudged a little toward the camera so it reads in the glove, and it stays there through SAVED!. Picture: `lab/gk-goal-catch/super_catch_hands.png`.

**One GOAL title.** The author said to remove the double goal title and make one ten times better. Until now `#gfl` "GOAL!", `#goal-banner` "GOAL!" and the referee card all stacked dead centre, right over the goal.

The new `ult11-goaltitle.js` (`U11GoalTitle.show`) replaces all three in afGoal; the old stack is only a fallback. It sits in the lower third, so the net stays visible above it. Fonts are Cinzel, Rajdhani and Bold Pixel only. Beats:
- Impact flash, plus a burst of rays in the scorer's team colour (`P3D.sideColor`).
- Team-colour and gold slashes whip across on a diagonal.
- "GOAL!" slams in letter by letter in gold Cinzel, then a light sweep runs through it.
- A canvas of sparks and embers.
- A scorer card: portrait (`_portraitChainFor`), name, minute, team and the new score in Bold Pixel.
- A wipe-out along the slash.

The layer is appended to `<body>` (the transformed `#viewport` clipped it) and runs 2.9 s.

**Goal-net orbit.** New `goalCam()` in pitch3d. Once the goal ball has hit the net, the camera blends (0.9 s) from the match camera into a slow, low arc round the front of the goal mouth, at fov 34, with net, ball and the beaten keeper in frame. It runs until the kickoff reset, where `gkAnim('clear')` now also ends the goal ball. That also fixes the goal ball lingering for 1 s into the kickoff. `P3D.goalOrbit=false` turns it off.
- The keeper stays down through it: 'beaten' is 4.0 s and 'down' is 4.2 s.
- afGoal's kickoff reset is 900 + 2900 ms with the goal ball (it was 900 + 2100).

**Verified** (GPU headless): open-play goal and super-shot goal each show exactly one title, the orbit, the keeper down and the ball in the net. Super-shot catch: ball in the reaching glove. Pictures: `lab/gk-goal-catch/goal_title_orbit.png` and `goal_sequence.png`. Backup: `ult11-pitch3d.js.pre-cineglove-v141.bak`.


## 2026-09-26 — Santa Fede houses, boundary and asphalt; daytime art target (Codex / Astra)

**Intent:** author clarified that the HD-2D upgrade must cover houses, wall and pitch, and that this venue should be judged in daytime. Night polish is no longer this venue's art priority. Author restored generation credits after the first atlas attempt hit a usage limit; the retry succeeded with built-in image_gen.

**Files/cache:** `ult11-santafede-art.js?v=2`, `ult11-stadium-santafede.js?v=6`, targeted main index tags, `santa-fede/README.md`; new `assets/stadiums/santa-fede/court-surfaces-v1.png` and `court-generation-prompt.json`, updated asset README. New atlas is 1254 x 1254, 3,748,181 bytes, kept unmodified. Backups: `ult11-santafede-art.js.pre-whole-court-v1.bak`, `ult11-stadium-santafede.js.pre-whole-court-v5.bak`, `index.html.pre-santa-whole-court-v6.bak`. Fresh main index and both stadium originals checked before installation. Concurrent Claude upgrades were detected and preserved: game v211, renderer v142, goal title v2 and their existing tags. No main gameplay/renderer source or other stadium was overwritten.

**Materials:** dedicated atlas quadrants for asphalt aggregate, repaired asphalt, faded salmon housing plaster, cool damp boundary render. Houses now use their own texture instead of sharing church artwork, with three neighboring muted paint finishes over the sealed volume. Existing doors/shops, shutter/window variants and closed balconies stay. A soft shadow-free daytime facade fill helps shaded houses. Boundary gets its own damp/moss/chipped-render texture and uneven low damp skirt; stone coping/piers and the sealed north-wall geometry remain. Sampling excludes atlas separator edges; the church material/architecture is retained.

**Court:** actual new asphalt artwork nearest-sampled into a 256px tile at eight-world-unit scale, mirrored across the authoritative pitch canvas. Runtime neutral grey remapping compresses the first render's gravel-like bright flecks. Fourteen irregular repair areas combine tar tone and repair artwork; 24 fine crack/seam paths and 38 low-opacity scuffs break uniformity. The existing native marking mask remains authoritative and faded, preserving kickoff/wall/goals/lines dimensions and all gameplay references. Day map uses display-ready LinearEncoding to fit the renderer's legacy colour pipeline; native night shader is not rewritten. Shallow visual mesh relief and flat player/ball collision remain as before. Async atlas repaint is guarded against disposed maps and reported via courtArtReady. Four required atlas sources, 14 environment tiles and court readiness verified.

**Validation:** installed modules pass node syntax. Main-game headless Chrome (without forced SwiftShader) captured daytime fixed hero/wall, house facade, church review angles and a native broadcast gameplay view; no uncaught JS or WebGL/shader diagnostics, all required sources/tiles loaded. Five-player native squads restore after switching to classic and back; classic restores Italy 11 and the existing Germany pool 10. The first regular-roster assertion ran before asynchronous startGame finished; the runner now waits for the actual roster state. Temporary Camera Lab poses, kickoff-gate extension and disabled heroKick in the screenshot runner are browser-only review controls, not shipping changes. Existing legacy asset/portrait/favicon 404s remain recorded. Evidence: Codex workspace `work/santa-native/day-court-installed-validation.txt`, `capture-day-court-gpu.cjs`, `court-{hero-day,houses-day,broadcast-day}.png`.

**Next checks/risks:** author should review daytime wear intensity, shade-side housing visibility and court-line readability during actual play. No native device/frame-time benchmark; the additional atlas adds ~3.75MB download and daytime facade fill adds a light. Source art contains continuous fine tones; nearest low-resolution mapping is an art treatment, not a claim that every generated source pixel was hand-drawn. Mirrored repeated texture motifs can be refined with bespoke decals later. Prior approximate-replica, five-player menu/AI/substitution/set-piece and physical controller/phone limitations remain. Global colour-pipeline changes still require reviewing local material encoding. Night controls remain available but no additional night tuning or final night capture was requested in this extension.

## 2026-09-26 — Marassi Square pixel materials and Blender trailer polish (Codex / Astra)

**Intent:** author asked to apply the Santa Fede texture principle to the RPG square and use Blender for a trailer-ready map. Existing approved layout remains houses left/right, Ferraris north, practice wall east; no interiors, entrances or new engine. This is an independent Marassi update, preserving concurrent Claude match lighting/gameplay work.

**Files/cache:** within `marassi-square/`: `scene.js?v=11`, `surface-textures.js?v=3`, new `pixel-materials.js?v=1`, targeted square `index.html`, updated `README.md`. New assets `assets/marassi-square-premium-v1.glb` (3,702,168 bytes), `assets/city-surfaces-v1.png` (unmodified built-in image_gen atlas), `assets/city-generation-prompt.json`; editable packed Blender source `authoring/marassi-square-premium-v1.blend`. Existing atmosphere v5, facade details v1, light VFX v2, home.png, user panorama and original GLB retained. Pre-change square scene/surface/index/README backups: `.pre-premium-20260926.bak`. Main game.js, ult11-pitch3d.js and main index were hash-checked unchanged during the targeted installation; fresh square originals were hash-checked against staging before copying. Main cache tags remain game v211, pitch3d v142, goal title v2 at verification.

**Actual Blender work:** imported original GLB into locally installed Blender 5.1.2. Replaced 51 opaque balcony panels with batched open ironwork, both side returns closed. Added 115 stone window surrounds, staggered slatted shutters, chamfered cornices, gutters/downpipes, pitched roofs with plaster gables, chimneys, pavement thresholds, bins and two empty planter troughs along the margins. Sealed structural shells and gameplay collision envelope remain. Nine added geometry families; final authoring geometry 461 meshes, 49,850 vertices, 60,142 triangles. Corrected initial window filter including sills and adjusted roof eaves/gable UV after screenshot review. Final overview review found GLTF split-material roof children without UVs; metre-scaled roof projection now also follows the terracotta material, and installed screenshots were recaptured after the fix. Blender saved successfully; Windows thumbnail-cache PNG write warning is unrelated to the saved .blend. Source has packed atlas plus overview camera/daylight rig; runtime still owns shop/curtain art, foliage, corner closures and night lamps/VFX. GLB export precedes authoring texture packing so the runtime's external atlas is not duplicated inside GLB.

**Art/runtime:** one dedicated four-quadrant city atlas: weathered plaster, red stadium brick, Ligurian paving, terracotta roof tile. Runtime crops each into 128px nearest-sampled tiles with mipmaps and mirrored repetition; plaster luminance is neutralised to retain existing paint hues. Bricks/paving/roofs use actual source artwork; diffuse maps are not reused as fake bump maps. The square retains proper sRGB/ACES colour handling; do NOT copy Santa Fede's legacy LinearEncoding workaround into it. Generated master contains continuous fine tones; this is a pixel-texture treatment, not a claim of exclusively hand-pixel source art. Existing varied windows, 7 residential doors, 10 shops, 12 pixel foliage clusters, 36 lit windows, 4 shadow lamps, 6 shafts and 660 dust particles remain.

**Trailer controls:** default overview camera retained. C cycles overview / lower street / close training; T hides HUD/controls for capture. WASD/arrows, Shift, Space, E/K, R, N, V and existing pad/touch bindings preserved. Camera poses use the same map and gameplay update, not a separate mockup scene.

**Validation:** actual installed main-folder square rendered in headless Chrome/WebGL at 1920x1080 without forced SwiftShader. Waited for GLB, atlas and all 9 material bindings before capture. Movement, jumping (~1.4m during test), physical kick/wall rebound, actual C keyboard binding, three camera shots, night lighting/VFX toggle and Escape/back-to-main link checked. Console/JS/WebGL errors: none. Runtime overview roughly 535 scene draw calls and 60,402 submitted triangles (not a device performance benchmark). Evidence in Codex workspace `work/marassi-premium/installed-runtime-validation.txt`, `capture.cjs`, `geometry-validation.json`, `model-audit.json`, `blender-build.log`, and actual `trailer-check.png`, `street-day.png`, `training-day.png`, `night-check.png`; source and prompt preserved.

**Next checks/risks:** author should review daytime wear/repeating brick motifs and the lower camera framing before recording the final trailer. Physical controller/phone play and actual device FPS remain unverified. Original many-object architecture still costs draw calls; future static-mesh batching can help if needed. New download payload is ~3.7MB GLB plus the atlas, old asset retained for rollback. Map remains a practice/exploration prototype, not completed Road to Glory story logic. Human art approval is pending; passing checks is not visual approval. Local integration was explicitly authorized; no external publishing performed.



## 2026-09-26 — Marassi building-edge asphalt correction (Codex / Astra)

**Intent:** author clarified the surface along/behind the building edges should be asphalt, not brick. Changed only `Collision__SquareFoundation` to a separate asphalt material; central square keeps stone paving, stadium/practice walls and practice-wall footing keep their masonry. Material is cloned before changing it because the foundation shares `brick_shadow` with wall recesses/footings. No geometry, collisions or camera changes.

**Files/cache:** `marassi-square/surface-textures.js?v=4`, `pixel-materials.js?v=2`, square index cache tags, square README. Asphalt uses the existing generated top-left quadrant of `../assets/stadiums/santa-fede/court-surfaces-v1.png`, nearest-sampled to 128px and mapped at 6m scale, compressed to dark neutral aggregate. This introduces a shared asset dependency, with readiness/error reported as `MarassiPixelArt.state.asphaltReady`; no new generation or duplicated atlas download asset. Saved packed editable Blender correction as `marassi-square/authoring/marassi-square-premium-v2.blend`, retaining v1. Runtime GLB is unchanged; runtime surfaces own the override. Fresh original hashes checked before install; backups of the three modified runtime files use `.pre-asphalt-20260926.bak`. Match/Claude files untouched.

**Validation:** actual installed square reloaded in headless Chrome/WebGL at 1920x1080; waited for asphalt, city atlas and 10 material bindings. Screenshot confirms dark asphalt beside both building rows, pale square paving preserved, brick walls preserved. Movement, jump, wall rebound, C camera cycling, night/VFX and Escape/main return pass, no console/JS/WebGL errors. Evidence: `work/marassi-premium/asphalt-runtime-validation.txt`, `capture-asphalt.cjs`, latest actual square screenshots; `asphalt-source.py` and source log. Blender source saved successfully despite the existing Windows thumbnail-cache warning.

**Risks/next checks:** keep the shared Santa Fede atlas path available when packaging the square independently, or copy it and adjust the loader. Author should judge asphalt tone/width in-game; unchanged device-performance/controller limitations from the previous entry remain.


## 2026-09-26 — Marassi reflective puddles, daytime atmosphere and lens finish (Codex / Astra)

**Intent:** author approved a grounded HD-2D / after-rain polish pass: actual reflective puddles, subtle daytime atmosphere and camera focus, without fantasy elements. Scope is Marassi Square only.

**Files/cache:** new `marassi-square/cinematic-finish.js?v=1` (11,860 bytes), `scene.js?v=12`, targeted square `index.html` plus README. Square scene/index backups `.pre-cinematic-20260926.bak`; fresh originals were SHA256-checked before copying. Main game.js, main pitch3d and main index hashes stayed unchanged during install, including Claude's game v211 / renderer v142 / goal title v2. Existing materials, asphalt, home.png, GLB/source Blender, panorama, night lamps and gameplay preserved. No extra asset downloads or new dependencies.

**Water:** three irregular shallow puddles at world x/z (-17,7), (16.6,-8), (-3,8), two on asphalt margins and one central low spot, with dark damp borders. One shared mirrored-camera render target serves all three coplanar surfaces; actual scene/buildings/sky/player geometry, not a reflection image. Uses reflected perspective camera and oblique clipping at y=.078, with Three r128 Reflector technique attribution in module. Ripples, angle-sensitive reflection strength and soft water edges; visual-only, no movement/collision changes. Shared target 512px desktop, 256px for canvas widths below 900px, updated on alternate frames and capped at 30Hz. Reflection render hides the new effects group, avoids recursion and restores shadow/XR/render-target state. Shadow maps are reused during reflection.

**Atmosphere/lens:** 180 sparse drifting sunlight dust points and two very faint roof-gap shafts, daytime only; existing 660 night dust particles and warm lamps remain. Scene color + actual depth texture feed depth-aware focus blur, gentle warm highlights/cool shadows and restrained bright-highlight glow. Focus tracks the player's 3D depth; blur samples are depth-weighted to reduce sprite-edge halos. Background/foreground softness is stronger in close views, lighter in overview. Added mild depth-gated edge smoothing outside the focal player region for offscreen-render edges. No moving film grain or general exposure boost. Existing distant-backdrop blur preserved. Depth blur falls back to zero when depth textures are unsupported.

**Controls/camera:** P toggles this entire finish for comparison; C selects existing overview/street/training, T hides HUD for the trailer. Movement tests revealed that the close training camera could crop a moving player; it now follows the player with the same low height/offset and gently interpolated camera position. Default overview and street framing unchanged. Existing jump, kick, free-ball rebound, controller/touch bindings and return navigation preserved.

**Validation:** staged then actual installed main-folder square in headless Chrome/WebGL at 1920x1080, without forced SwiftShader. Waited for GLB, city/asphalt atlas and 10 material bindings. Walking, jumping, wall rebound, real C/P keyboard toggles, finish off/on, three camera presets, moving through the central puddle, day/night, original VFX toggle and Escape/back-to-main link pass. Reflected building architecture is visible in actual water screenshots; reflection-frame counter advances. Resized to 540x960 and back; 256px reflection tier asserted. No console/JS/WebGL errors. Installed 60-rAF sample mean 6.025ms / max 11.2ms on this headless host, not a user-device FPS guarantee. Main scene ~544 draws / 60,834 triangles plus shared reflection and fullscreen post pass. Evidence: Codex workspace `work/marassi-finish/installed-runtime-validation.txt`, `capture.cjs`, `training-day.png`, `training-finish-off.png`, `puddle-player-{day,night}.png`, `trailer-check.png`, `night-check.png`, `phone-check.png`.

**Next checks/risks:** author should judge puddle visibility, blur strength and night readability in person before final trailer capture. Reflection adds an extra partial-rate scene render; postprocessing adds color/depth render targets and texture sampling. Low-resolution/half-rate reflection can shimmer at glancing angles or trail rapid movement. No physical phone/controller performance run. Water is visual; foot splash events and wet traction are not implemented. P bypasses the new effects for comparison/performance. Source .blend intentionally remains the architecture source; these procedural runtime effects are not baked into Blender. Global match postprocessing and stadium lighting were not changed.



## Real sky + outdoor daylight balance; Germany starts 11 (2026-09-26 · new ult11-sky.js v2, pitch3d v143, santafede-art v3, game.js v212, Marassi scene v14 / atmosphere v6) (Claude)

**Author:** "both maps miss a real sky, which makes the light in daytime kind of like an IKEA room." Also: "Germany needs to be fixed." The Santa Fede lines stay faded (intended). The author allowed Claude to edit Astra's files and will tell Astra.

**Diagnosis.**
- Marassi's sky was a flat `#8193a0` colour (also the fog), lit by a 0.85 all-round hemisphere fill.
- The match renderer showed its dusk-with-stars canvas dome at noon, with a warm-yellow hemisphere fill (`#ffe2a8`), so shadows were never blue.
- Santa Fede added two shadow-free day fills on top.
- Result: no sky, flat, neutral shadows.

**New `ult11-sky.js` (`window.U11Sky`)**, shared by both.
- A painted HD-2D sky dome:
  - zenith / mid / horizon gradient and a hazy horizon band
  - a sun disc + glow placed on the real key-light direction
  - a drifting cloud layer shaded from the sun side and cut into three painted tones
  - an angular pixel grid, plus a posterize + ordered-dither finish
- Presets: day, golden, and night (stars + moon); `overcast` for rain and snow.
- `encode` handles Marassi's sRGB/ACES output vs the match renderer's legacy linear pipeline. Tone mapping is skipped.
- **`?skylab=1`** opens a tuning panel: sky colours and shape plus map-owned DAYLIGHT sliders, per-mode values saved in this browser, and COPY FINAL VALUES.

**Match renderer (pitch3d v143).**
- Day and golden use the new dome in every stadium; night keeps the author's tuned old dome.
- The sky's sun follows the real-shadow light (`P3D.light` azim/elev from `SH3.dir`). Rain and snow turn the sky overcast.
- `P3D.skyTint` (0.6) pulls the hemisphere fill toward the sky's blue, so shadow sides read as outdoor light. It applies in every stadium's daytime.
- Fog takes the horizon colour in daytime. `P3D.skyV2=false` returns to the old dome.
- Santa Fede art v3: new `U11_SANTA_ART.setDayFill` / `dayFill` (default **0.45**) scales the two flat day fills (hemisphere 0.34, house spot 0.30); night is unchanged. It is on the panel as "Santa fill".

**Marassi.**
- `index.html` loads `../ult11-sky.js`.
- `scene.js`: sky dome following the camera; the panorama's painted-sky top edge fades into the dome; `window.MarassiDaylight = {hemi .38 (was .85), sun 2.7 (was 1.8), cool sky fill #9dbce6, warm ground bounce #b08a5c, exposure .98, haze .0035}`; panel sliders (fill, sun, sun angle and height, exposure, haze).
- `atmosphere.js` setNight reads those values for day, switches the sky to night/day, and sets the fog to the horizon colour (converted to linear). Night is unchanged.
- The square now depends on `ult11-sky.js` in the main folder, next to the Santa Fede asphalt atlas.

**Germany.** No player for CM3 in the 4-3-3, and Meyer (the only spare) was a reserve. The away builder skips reserves, so Germany played away with 10. Meyer now starts at **CM3** as the holding midfielder (def 82), and the reserves list is removed. Verified Italy vs Germany 11 v 11. A check of every team: Japan has no natural RW but still fields 11 (the away fallback puts Ozora there), so no change.

**Verified** (GPU headless): Santa Fede day/golden (hero, corner, pan), Astra stadium day/golden (clouds visible), Marassi overview, street and close camera; no JS errors; Marassi about 174 fps on this PC. Before/after: `lab/sky/sky_before_after.png`.

**Open.**
- Author tuning with `?skylab=1` in both, then bake the copied values in.
- In Santa Fede's broadcast view the sky is mostly out of frame and the low horizon band is haze (clouds sit higher).
- Marassi's cameras mostly see the Genova panorama, so there the change is mainly the light balance. The player sprite reads darker in shade with the lower fill; watch it when tuning.
- Backups: `*.pre-sky*.bak`, `game.js.pre-germany-xi-v211.bak`, `marassi-square/*.pre-sky*.bak`.


## Santa Fede: the neighbourhood around it, no more island (2026-09-26 · new ult11-santafede-city.js v4, pitch3d v144) (Claude)

**Author:** "Santa Fede needs a background, or it looks like it's on an island." Beyond Astra's wall, church and houses there was only sky and bare ground. In Santa Fede the kickoff panorama camera also started inside the church wall: its orbit is sized for the big stadium.

**New `ult11-santafede-city.js` (`U11_SANTA_CITY.build` / `setTime`)**, called right after `U11_SANTA.build` inside the same bowl group, so it goes away with a stadium switch. It measures the bounding box of Astra's environment and builds outside it:
- **Street apron:** a 760 wu asphalt ground plane.
- **Three rings of Genova apartment blocks:**
  - low near the court (7–14 wu), taller up the hill (up to 26 wu), with random gaps for side streets
  - 6 plaster palettes (ochre, salmon, pink, yellow, cream, sand) as 48 px pixel-art facade tiles: green shutters, sills, string courses, plaster wear
  - terracotta or slate roofs, cornice strips, baked face shading
  - merged per material (about 10 draw calls)
- **Distance haze:** the blocks' own fog override mixes them into the sky colour between 30 and 190 wu.
- **Genova hillside panorama** (the Marassi painting, copied to `assets/stadiums/santa-fede/genova-backdrop.jpg`, 176 KB):
  - a 330 wu cylinder with mirrored repeats, rising just over the ~21 m walls
  - 38% aerial-perspective haze
  - its painted sky fades into the U11Sky dome
- **Night:** blocks switch to a dusk facade with about a third of the windows lit and a night haze. **Golden:** warm tint.

pitch3d: the city build hook; `setTime` in both of Santa's look paths; the kickoff panorama orbit shrinks for Santa Fede (0.40/0.44 of length/width, was 0.52/0.62).

**Verified** (GPU headless, no errors): all four kickoff-pan angles, hero, corner, night hero, play. Before/after: `lab/sky/santafede_city_before_after.png`.

**Open:** author art review of block density and height; the night skyline is barely visible over the tall wall from the low hero camera. Backups: `ult11-pitch3d.js.pre-city-v143.bak`.


## Santa Fede: Corso Sardegna hillside, soft clouds, depth of field (2026-09-26 · city v6, sky v3, pitch3d v146) (Claude)

**Author:** "I liked that you could see high buildings. That stadium was in Corso Sardegna, which behind (the wall side) had a road going up, so the taller buildings behind were correct and the valley even more correct. If I don't see a lot of sky, OK. Plus we can add some soft clouds and depth of field; it will look premium."

**Changes.**
- **City.** Three extra rings only on the WALL side (+X, north) make a terraced city climbing the slope: every row is lifted (`h*1.12 + off*0.13`). The other sides stay street height. The valley panorama is back to its tall form (150 wu, painted sky fading from 70%), rising over the city.
- **Sky v3.** New `soft` param: cloud edges widen, the three-tone posterize blends to smooth, and clouds skip the pixel grid. It is on the Sky Lab panel as "Soft clouds". The match renderer sets `soft` 0.8 at Santa Fede (0 elsewhere) unless the panel saved a value.
- **Depth of field.** At Santa Fede in day and golden, `applyFx` drops the tilt-shift focus band onto the court (r 0.42) and multiplies the blur by `P3D.santaDof` (1.25). A first try at 1.7 / 0.36 turned the wall itself to mush, because the tilt-shift is screen-space. The night rig's own focus tracking is untouched.

**Verified:** four kickoff-pan angles, hero, night hero; no errors. Picture: `lab/sky/santafede_corso_sardegna.png`. Backups: `ult11-santafede-city.js.pre-hill-v4.bak`, `ult11-sky.js.pre-soft-v2.bak`, `ult11-pitch3d.js.pre-hill-v144.bak`.


## Santa Fede south end = Corso Sardegna + petrol station; parking emptied (2026-09-26 · city v8, santafede-art v4) (Claude)

**Author:** "There is actually Corso Sardegna, which is a double-lane, two-way road, and exactly in front of the campetto there is an IP petrol station. We don't need to go crazy, but since we shot there it's important it looks complete. The background can stay; make more depth, as there's a line of buildings also, then the street. Remove the cars from the parking lot."

**Changes.**
- **Santa Fede art v4:** the parked cars are gone; `window.U11_SANTA_CARS=true` brings them back. The empty lot and its faded bay lines stay.
- **City v8**, south = -X, from the parking's far edge (`-(PLEN/2+22k)`) outward:
  - **Pavement and kerbs.** A 3 wu pavement with a kerb, and another on the far side.
  - **Corso Sardegna.** A 10 wu avenue, two lanes each way, running 820 wu to the horizon both ways. It uses a 64 px pixel texture: edge lines, a solid double centre line, dashed lane lines, tyre-wear bands.
  - **Street lamps.** Staggered every 16 wu on both pavements (poles/arms and heads each merged into one mesh). Heads glow warm at night.
  - **Petrol station** directly across from the campetto:
    - forecourt; a canopy on four columns with a white fascia, blue band and yellow rule, and a bright underside and fascia at night
    - two pump islands with two pumps each
    - a kiosk with a glass front that lights up at night
    - a blue price totem ("CARBURANTI", three prices) facing the court
    - generic, not the IP brand (BRAND_SAFE / roadmap 0.3); the author was told
  - **Line of buildings** behind the station (11–19 wu), facing the avenue.
  - **The rest.** The south city rings are pushed behind all this, and blocks on the side rings that would sit on the road are skipped, so the avenue stays open to the horizon. The valley panorama is unchanged.
  - Everything is hazed and switches day/golden/night through `userData.dn` / `userData.maps`.

**Verified:** south-facing kickoff-pan views by day and at night; no errors. Pictures: `lab/sky/santafede_corso_south.png`, `santafede_station_zoom.png`. Backups: `ult11-santafede-city.js.pre-corso-v6.bak`, `ult11-santafede-art.js.pre-corso-v3.bak`.

**Open:** from the low angles the road surface itself reads as a thin band; a higher camera shows the lane markings.


## Santa Fede west side = the backs of TWO buildings (2026-09-26 · santafede-art v5) (Claude, edit on Astra's residence)

**Author, with Google Street View of Corso Sardegna / Via Ayroli:** the long west building was actually two buildings with space between them (spectator sprites could go there later, and at the windows). It is the BACK of those buildings, so no street doors or roller shutters at the bottom.

**Change** (`ult11-santafede-art.js`, west residence block):
- Two buildings (each `houseLength/2 - 4.6`), with their own backing box, paint frontage, stone base, string courses and tile gable. The gap is 9.2 design m, centred on z 0.
- Windows, shutters and balconies are skipped in the gap.
- Ground floor: the carved entry, doorstep, "12" sign, shop glazing, roller-shutter louvres, shop signs and awnings are removed. Now a plain plinth with small barred service windows on every other bay.
- In the gap: a low stone boundary wall with an iron railing, the spectator spot. The foliage card at z 0 is removed. The city ring shows through the gap.

**Reference notes from the author's Street View** (for later work):
- The church is a red brick + white-band facade with a green copper dome on a round body and a wide stair down to Corso Sardegna, with a gated passage and a bus stop beside it. Astra's church is currently a long nave along the east touchline.
- Via Ayroli is the higher street behind the wall: stone parapet, pink/salmon and cream Liberty blocks with green shutters, balustrade balconies and window pediments.
- The IP station has a blue canopy with an orange band, a palm tree, and plane trees along the Corso.

**Verified:** day and night kickoff-pan views of the west side; no errors. Picture: `lab/sky/santafede_two_buildings.png`. Backup: `ult11-santafede-art.js.pre-twohouses-v4.bak`.


## Santa Fede: balconies + lit windows that cast light; green fence behind the south goal with entrance and trees (2026-09-26 · santafede-art v6) (Claude, edits on Astra's file)

**Author:** "The two buildings need some balconies, and at night some windows need to cast light. Behind the goal, a high green metal fence that leaves some space near the church, like an entrance, and some trees, to give me a 3D feeling."

**Changes** (`ult11-santafede-art.js`):
- **Balconies.** On every other window bay (`(floor+n)%2`, all four floors); was `%4`, floors 0–2.
- **Lit windows.**
  - About 1 in 3 residence windows are lit at night (`(n*5+floor*3+1)%3`, flagged `res`). They go to over-bright warm (1.9, 1.4, 0.8), so the night bloom catches them.
  - Each lit window gets an additive warm radial spill card on the facade around it (group `winGlow`, night only).
  - Up to four of the lowest lit windows get real warm point lights (0.9, distance 16) that light the balconies and the court edge.
  - All of it is switched in `setTime`.
- **South fence** (design z `halfL+2.2`, between the goal line and the parking):
  - a 4.6 m tall green welded-mesh fence (alpha-tested pixel grid) on green posts every 2.6 m, with three rails
  - an opening beside the church (`halfA-7` to `halfA+3.2`): two brick gate pillars with stone caps and the two mesh gate leaves swung open
- **Trees.** Six trees on the parking side (bark trunks with crossed pixel-foliage cards, 1.1–1.35 scale), two of them flanking the entrance.

**Verified:** day south views from four angles, night west and south; no JS errors. Pictures: `lab/sky/santafede_fence_lights.png` and `_zoom.png`. Backup: `ult11-santafede-art.js.pre-fence-v5.bak`.

**Open (Astra):** a thin horizontal orange light smear crosses the west facade at night at about lamp height. It predates these changes (visible in earlier night captures). Not the god rays (`rays` 0 at night) and not the Claude city or window light; most likely the corner floodlight spots grazing the facade. Left for Astra.

## Santa Fede geometry / tree / lighting debug (2026-09-26, Codex, art v7)

Intent: debug the latest Claude campetto while preserving the city, two west houses, balconies, warm windows, south fence and entrance, Corso Sardegna and daytime art direction.

Delivered files: `ult11-santafede-art.js`; `index.html` changes ONLY its cache from `ult11-santafede-art.js?v=6` to `?v=7`. Existing `ult11-stadium-santafede.js?v=6`, city v8, sky v3, pitch3d v146 and game v212 remain intact. Backups: `ult11-santafede-art.js.pre-debug-v6.bak`, `index.html.pre-santa-debug-v6.bak`.

- North wall: old width `across+18` reached the CENTRES of the side buildings (about 5 design metres of penetration each). New width `across+8+.04` meets the inner facades with a concealed 2 cm plaster overlap. Coping now has only 1 cm concealed overlap; piers/caps are kept inside the join. World orientation stays north +X / church +Z / houses -Z / parking -X.
- Six parking trees now share a centred two-level crossed crown, retaining the existing height variation and pixel foliage. All 36 leaf cards cast shadows. IMPORTANT r128 detail: its stock WebGLShadowMap does not copy alpha maps into its default depth material, so simply enabling castShadow produces black RECTANGLES. The merged crowns have an explicit alpha-tested MeshDepthMaterial using the SAME foliage map and .60 threshold. It disposes with its geometry. Verified leafy silhouettes on the fence/parking. Static alpha-tested foliage is now batched too; tree crowns render in one mesh.
- Entrance gates have their own cloned texture/repeat (4.6/.55 by 2.2/.55). Previously they reused the long fence repeat, crushing the wire grid on the leaves.
- RESOLVED Claude's open orange facade streak: isolated all lights, then window points versus church lantern points. The lanterns reproduced the stripe; windows, beams, sun and spotlights were not its primary cause. Lantern decay was 0, which bypasses the nominal distance cutoff in the legacy light shader. Changed it to 2 so their 12*k range is respected. Window point lights also stay local (distance 7*k, intensity .22 at night; 0 otherwise); facade frontage uses a 1-design-metre geometry grid to interpolate Lambert lighting locally. Warm window bitmap/spill/bloom and original matte materials remain.
- `U11_SANTA.inspect()` now exposes join dimensions, lantern decay and current window light state, plus tree/crown counts, for reproducible checks.

Validation: Node syntax check; real-GPU headless Chrome at 1920x1080, all 14/14 texture tiles and all four Santa asset sources ready, no JS exceptions or shader/WebGL errors. Checked hero north wall, church, entrance, houses, south parking and native broadcast gameplay; night -> golden -> day switches verified (one environment root, one alpha-shadow crown mesh, correct light intensities). Native match runs 5v5; Santa -> classic restores 11v11 -> Santa restores 5v5. Pitch, gameplay bounds and cameras were not changed. Main renderer hash stayed `0954A7121B4E16F4EDD8BD6B70DA0DBC5E893E03B6B6281D6E8794A516652E74`.

Evidence: `lab/santafede-debug-v7/` holds before/after north join, parking trees, night facade, final broadcast, `validation.json`, and `final-verify.cjs` (expects local server on port 8762). Asset 404s in validation are pre-existing fallback player/portrait and classic corner PNG requests; none are Santa assets.

Remaining risks / next checks: judge daytime and night brightness on the user's own display and check frame time on their GPU during a live 5v5 match (not benchmarked here). Pixel trees remain crossed cards; they are consistent and cast correct leaf shadows but are not full 3D botanical models. The church still uses the provisional long-nave architecture described in Claude's Street View notes. Existing particles/post-processing are preserved; this debug does not replace the stadium VFX system.

## Santa Fede chibi neighbours (2026-09-26, Codex, art v8)

Intent: populate the user's four spectator locations with civilians matching the chibi player style, with physically grounded/elevated placements and real geometry occlusion.

Delivered: `ult11-santafede-art.js`; `index.html` cache ONLY `ult11-santafede-art.js?v=7` -> `?v=8`; new `assets/stadiums/santa-fede/spectators-chibi-v1.png` and `SPECTATORS-v1.md` with complete generation prompt/reference/import notes. Backups: `ult11-santafede-art.js.pre-spectators-v7.bak`, `index.html.pre-spectators-v7.bak`. Main originals were checked against staged input before applying; subsequent elevation fix checked current original text again. Stadium v6, city v8, sky v3, pitch3d v146, game v212 unchanged.

- 39 local neighbours: 10 leaning/look-down watchers behind the north wall, 9 on selected existing west balconies, 6 on the raised street between the TWO houses, 14 behind the south green fence. Varied ages/hair/casual clothing; no fixed home/away team-colour blocks. Empty balconies and groups of two retain a believable local scale. Gate opening remains clear.
- Gap street: solid 1.1-design-metre foundation, weathered asphalt deck top 1.15, level with the existing lower boundary wall. People face east into the court, feet on the deck, behind its railing. North observers stand on a hidden terrace at 9.65; wall/coping hides lower bodies while heads/upper bodies read above it. Balcony feet align to slab tops, bodies stay behind the outer railing. South people stand outside playing bounds and behind the physical wire mesh.
- Built-in image generation used `assets/ps1/home.png` as proportions/style reference. Transparent unmodified 16-pose master is 1254x1254 RGBA; actual-dimension 4x4 slicing, per-cell alpha bounds, nearest-filtered 128x192 runtime canvases and foot alignment avoid gutters/floating silhouettes. Twelve poses currently used; four back-facing poses reserved. This is a static pose atlas, not a walk/run/NPC animation system.
- 12 InstancedMesh batches for all 39 people, Lambert scene lighting, alphaTest .5, real receive/cast shadows and matching explicit alpha-tested customDepthMaterial for Three r128. Crowd is nested in its own group to avoid the existing foliage/static geometry merge. Async import respects disposed textures; shadow materials dispose with geometry. No per-person AI/update loop and no new global camera, lighting, post-processing or match code.
- `U11_SANTA.inspect()` exposes counts per zone, instance batch count, positions/elevations/poses and spectator asset readiness.

Validation: Node syntax checks; real-GPU Chrome at 1920x1080 loaded 27/27 runtime texture tiles and all five asset sources. No JavaScript exceptions, shader/WebGL errors or Santa asset failures. Inspected screenshots of north wall (raised terrace corrected after initial capture hid faces), west balconies/raised gap street, south fence, church and native broadcast 5v5. Verified placement constraints, day/night/golden transitions with one environment root and existing tree shadows, live gameplay, Santa -> classic 11v11 -> Santa 5v5 restoration. Existing missing portrait/player/classic-corner fallback assets remain listed in validation and are unrelated to this change. Renderer hash unchanged: `0954A7121B4E16F4EDD8BD6B70DA0DBC5E893E03B6B6281D6E8794A516652E74`.

Evidence: `lab/santafede-spectators-v8/` contains final screenshots, `validation.json`, and reproducible `verify.cjs` (local server port 8762). Main useful captures: `after-court-houses-day.png`, `after-north-neighbours.png`, `after-court-south-trees.png`, `after-court-broadcast-day.png`.

Remaining risks / next checks: spectators are fixed oriented cards with static waving/clapping/leaning poses, not animated citizens; extreme edge-on views can reveal card thinness. Existing hero-camera DOF heavily blurs people behind the north wall intentionally; the wider north capture demonstrates their faces/occlusion. Human heights are authored scenery scale, independent of player-size settings. User should judge density and scale on their usual cameras; GPU frame-time cost has not been benchmarked. Future cheering animations and story-mode NPC movement should build separately on this atlas. Preserve Claude's city/sky changes and this targeted art v8 work when merging.


## Road to Glory hero — idle/movement asset trial (2026-09-26, Codex)

User chose the first brown-spiky-haired civilian identity and asked to close its blue track jacket, then explicitly required home.png to remain the authoritative art style/palette rather than adopting the large concept's Pokemon-like proportions. New trial: compact closed-blue-jacket hero, dark trousers and white/blue trainers, idle and jog front/back/right; left mirrored. Created with built-in image generation using home.png FIRST and approved outfit concept SECOND. No existing sprites or game/render code replaced, no cache bumps.

Delivered in lab/hero-sprite-trial-v1/: hero-movement-idle-v1.png (1448x1086 RGBA, 48 frames), preview.html, anchors.js, grid-validation.json, inspect-grid.cjs, home-reference.png, preview-check.png and PROMPTS.md (complete initial/refinement prompts). Also saved in Codex workspace output/hero-sprites. Open preview.html from the local server; controls select idle/movement, four directions, FPS, pause and frame stepping, alongside home.png at matching displayed body height.

Validation: inspected both generated passes; refined bottom movement rows to introduce passing phases. PNG decoding checked six populated row strips, all 48 populated frames and side margins. IMPORTANT: generated row spacing is irregular, not a strict 181x181 grid. Use measured strips y/height: 47/133, 209/135, 377/146, 553/154, 729/147, 899/153; columns 181 wide. Preview uses row bounds and foot anchors, nearest-neighbour display; checked its actual browser screenshot. Transparent outer canvas preserved; low-alpha coloured fringe remains in raw master. No claim of exact palette quantization or production-perfect loops.

Next: user judges style and animation against home.png in preview; tighten remaining hair/limb drift and run phase spacing, normalize to the engine/story atlas format and exact palette before integration. This is an asset trial, NOT wired into Marassi or Santa Fede yet. Preserve Claude's current lighting/city/game changes. Last game caches stay art v8, stadium v6, city v8, sky v3, pitch3d v146, game v212.


## Hero style correction from user reference images (2026-09-26, Codex, asset trial v2)

User supplied 1000122217.jpg (16 running poses) and 1000118422.jpg (enlarged idle sprite), requesting the hero as close as possible to these. These references override the earlier large civilian concept as the style target. Only retain approved casual outfit: fully closed blue track jacket with white shoulder stripes, charcoal trousers, off-white/blue trainers. Aim for reference's sharper long brown spikes, small dark neutral eyes, longer athletic limbs, tan skin and restrained shaded palette; avoid rounded baby face/head and vibrant concept colours.

Delivered new lab/hero-sprite-trial-v2/: hero-movement-idle-v2.png, preview.html, home-reference.png, anchors.js, grid-validation.json, inspect-grid.cjs, preview-check.png, PROMPTS.md. Both reference images used directly in built-in image generation; a second edit corrected idle/run side rows to face RIGHT without changing front/back design. Forty-eight frames: front/back/right idle, front/back/right movement; left mirrored. Earlier v1 retained. Workspace mirror output/hero-sprites-v2. No game scripts or existing sprite replacements, no cache changes.

Validation: visual inspection of generated style and side directions; decoded PNG alpha and all 48 populated frames, with source column margins and six measured row bands, then browser-rendered the preview beside home.png at matching displayed height. Actual row rectangles y/height: 12/168, 188/170, 369/173, 553/168, 730/167, 904/172. Use generated grid-validation.json/anchors.js rather than equal-row assumptions. Output appearance is a closer visual trial, NOT a claim of exact reference pixels or exact palette quantization.

Risks/next: user review of likeness and loop quality; generated hair/limb drift, repeated/uneven phase spacing and semitransparent fringe/ghost outlines still require production cleanup. Before integrating, normalize grid and roots, match exact palette and verify animation transitions. Current home.png and all Claude game/lighting/city work preserved. Continue from v2 reference direction, not the rejected larger/rounder hero concept.


## Hero posture / camera-angle correction (2026-09-26, Codex, asset trial v3)

User correction: idle's head/shoulder silhouette looked hunched; walking and running must use the game's THREE-QUARTER angle, not perfect side profile. Built-in image edits/generation corrected idle toward upright head-over-torso posture with lower relaxed shoulders; movement uses front chest/zipper, visible face and near/far limbs in a diagonal view. Kept muted closed blue jacket, tan skin, brown spikes, small eyes, dark trousers and pale trainers. Earlier v1/v2 retained.

Delivered lab/hero-sprite-trial-v3/ (workspace mirror output/hero-sprites-v3): hero-idle-master-v3.png, hero-walk-run-v3.png, preview.html, anchors.js, grid-validation.json, inspect-grid.cjs, home-reference.png, preview-idle.png, preview-walk.png, preview-check.png, PROMPTS.md. 72 active frames: 24 idle from ONLY TOP THREE rows of the idle master; 24 WALK from top three rows of movement master; 24 RUN from bottom three movement rows. Idle master bottom three rows are unused development poses and must not be imported for movement. Each direction has 8 frames; left mirrors three-quarter right. Added actual separate walking cycles rather than slowing the running animation. Preview supports all three actions, four directions, FPS, pause/frame step and query parameters action=idle|walk|run and dir=down|up|right|left.

Validation: decoded PNG alpha, all 96 raw source frames populated with column margins (72 consumed); six measured row bands per master and anchored feet recorded, so imports need not guess the irregular generated row spacing. Browser screenshots inspected for upright three-quarter idle, three-quarter walking and running beside home.png. Assets have transparent outer areas; semitransparent edge fringe, small generated anatomy/hair drift and uneven phase spacing remain trial limitations. Exact palette remapping has not been performed. User should judge the posture/angle in motion, then normalize atlas and clean loops before integration. No game scripts replaced, no cache changes, original home.png and Claude work preserved. Complete prompts saved with assets.

## Marassi movement test — approved casual hero v3 integrated (2026-09-26, Codex)

User authorized using the upright idle / three-quarter movement v3 civilian hero NOW in Marassi Square. This supersedes the prior asset-only trial status for Marassi. Original home.png remains untouched and is a load-failure fallback; match players, Santa Fede, stadium lighting, main renderer and game logic were not edited.

Delivered: marassi-square/hero-sprite.js?v=1 (new importer); marassi-square/scene.js?v=15 (was v14); marassi-square/index.html loads importer before scene. New assets/hero-v3/hero-idle-master-v3.png, hero-walk-run-v3.png, layout-v3.json and PROMPTS.md inside marassi-square. Backups: scene.js.pre-hero-v3.bak, index.html.pre-hero-v3.bak. Fresh SHA256 checks matched staged original files before applying, preserving Claude's current atmosphere, cinematic finish, camera and map work. No other cache version changed.

Implementation: 72 active frames, eight per direction/action: upright idle plus independent walk/run, front/back/three-quarter right with mirrored left. Only top three rows of idle master are imported; all six movement rows supply walk then run. Measured irregular row bands and foot anchors pack a nearest-filtered 1024x2048 runtime atlas with fixed scale and foot baseline. Raw PNGs are preserved. Hero retains Lambert lighting, silhouette-correct alpha-tested depth/shadow material; alphaTest .5 trims soft fringes. Corrected old sideways mapping which used home shot/pass row, and diagonal facing normalization. WASD/arrows/left stick walk; Shift/RT sprint (existing speeds 4.8/7.8 unchanged); idle follows last facing, animation follows velocity through slowing. No dedicated jump art yet: freeze the current hero pose while airborne instead of flashing the football kit. Kick, jump, rebound physics and all existing map controls remain intact.

Validation: Node syntax checks for both changed JS files; real-GPU headless Chrome loaded the actual main Marassi map and all three hero runtime assets. No JavaScript, resource or shader errors. Checked idle/walk/run direction and left mirroring, all eight frames cycling, stable feet (.06 baseline), lit material and matching alpha shadow map. Equivalent manual movement interval: walk 2.06 units versus run 3.35; jump reached 1.45 units. Ball kicked against practice wall and rebounded. Day/night, overview/training cameras, Escape menu and re-entry retained working hero. Inspected day screenshots for posture, grounded feet and shadow. Evidence and reproducible CDP script: marassi-square/lab/hero-v3/validation.json, verify.cjs, hero-idle-in-map.png, hero-walk-in-map.png, hero-run-in-map.png, hero-overview-in-map.png, hero-night-in-map.png; script expects main-game server on port 8762.

Remaining risks / next checks: this is the user-approved movement trial, not final production animation. Source still has small hair/anatomy drift and uneven generated phase spacing; no exact palette remapping or authored jump/kick sprite yet. Human judgement of feel on the physical controller remains needed; browser checks used keyboard events and debug stepping. Future cleanup should keep current three-quarter angle, upright posture, foot anchors and closed casual jacket. Preserve this isolated Marassi integration when continuing Claude's lighting work.


## Modular player factory — Phase 0 inspection (2026-09-28, Codex)

Intent: establish actual game sprite/render conventions before modelling the roadmap's three-player Blender run proof.

Delivered: `art/player_factory/docs/render_spec.md`; `scripts/inspect_game.cjs`, `scripts/measure_assets.py`; previews with actual 1280x720 Santa Fede match capture, native player crops, reference strip, asset/runtime JSON and transparent Blender smoke render. No runtime cache versions changed; game code, existing player assets and other worktree changes preserved.

Validated: current field sheets 3492x3264, 12x8, 291x408; keeper 1536x1680, 6x6, 256x280. Fresh live Italy/Germany match uses italy.png and away.png fallback. Near/carrier/far body silhouettes approximately 109/94/57 screen pixels. Blender 5.1.2 / Python 3.13.9 headless bpy and EEVEE RGBA transparent render passed. Existing per-cell disconnected opaque pixels can contaminate alpha-bound grounding. Actual run setting 8-13 fps with 0.9 layout multiplier. Each existing field atlas decodes to 43.48 MiB.

Proposal for sign-off: 96x128 native frame, approximately 104px standing body, fixed (48,116) origin, provisional orthographic 12-degree elevation; eight shared frames in four true directions; three prescribed hair/kit variants; 800x528 atlas with 2px gutters, manifest authored anchors. About 1.61 MiB per run-only player atlas. Separate ball/shadows.

Remaining: Phase 0 sign-off per this roadmap's one-step-at-a-time rule, then shared rig and static style comparison, then run animation approval before bulk generation. No model/action/production exporter or runtime integration exists yet. Screen scale measured only in fresh Santa Fede defaults; classic 11v11 and user saved camera need later checks. Browser was network-enabled for existing CDN dependencies. Memory estimate excludes GPU/loader overhead; performance not benchmarked. Extensive prior git changes prevent treating this inspection as a clean overall repository state.


## Modular player factory — shared rig and static proof (2026-09-28, Codex)

User approved the measured Phase 0 specification. Delivered the next gated static style proof, without changing match runtime or existing sprites.

Files: `art/player_factory/player_template.blend`; `presets/players.json`; scripts `build_player_template.py`, `prepare_static_preview.py`, `validate_player_template.py`; `docs/static-proof.md`; twelve RGBA frames and raw sources under `previews/static-v1/`, manifest, static contact sheet, 57/94/109px comparison strip, offline pitch comparison and source/frame validation JSON. No runtime file/cache versions changed.

One editable 17-bone shared outfield rig, rigid bone-parented segments, three hair sets and three colour/kit presets. Fixed 96x128 frame, orthographic 12-degree elevation, 22-degree front / +/-75-degree side / 180-degree back views, root projects to (48,115.5), authored origin (48,116). All variants share body geometry and pose; left views render independently. Pixel preparation: fixed palette, no dithering, binary alpha and 1px external ink contour. Head broadened and body shortened after comparison with current chibi sprites.

Validation: all 12 frames RGBA 96x128, binary alpha, limited palette, no frame-edge clipping. Saved Blender source reopened; 17 bones and all mesh bone parents confirmed; shin rotation moves boot; root projection verified. Raw source re-render matches first raw render. Source Blender file saved despite thumbnail-cache write warnings under the sandbox account. Reproduction instructions included. Existing roadmap/changelog entries and concurrent game work preserved.

Remaining: user static-style approval before the shared eight-frame run cycle. Face/hair/kit detail is deliberately simpler and more geometric than current sprites. Rigid segments still need animation contact/silhouette evaluation; IK, smooth skin deformation and swappable face texture system are not implemented. Foot/toe silhouette extends 2-3px below the fixed ground-plane root in front/side views; use authored anchor rather than per-frame alpha bounds. The pitch comparison is a composited still, not live integration. No actions, packed run atlas, event timing or performance benchmark yet. Keep ball/shadows independent.

## Modular player factory — first style rejected; revised concept target (2026-09-28, Codex)

The user rejected the first static Blender prototype's style. Its rig/file/pixel checks do not imply visual approval or game readiness. Do not advance that model into run animation or roster exports.

Saved new reference-driven raster concept: art/player_factory/previews/style-target-v2/player-style-target-v2.png and docs/style-target-v2.md. Built-in image generation used the actual Italy sprite crop and native match crop as style references: layered anime hair, expressive eyes, compact athletic proportions, bent ready stance and richer clustered shading. The image is a concept target only, not a new Blender render, atlas or tested runtime sprite. The user has not approved this target yet.

Original rejected source and exports preserved; no game runtime/cache versions changed. Approved technical specification remains in force. Next step: settle visual direction, then rebuild one Blender player and compare its actual rendered result before animation. No claims of visual parity or completed pipeline.

## Modular player factory — home.png selected as master reference (2026-09-28, Codex)

User explicitly selected assets/ps1/home.png as the best-quality style reference. It now takes priority over the Italy crop, generated concept target and rejected Blender prototype. This is reference selection, not approval of either the concept or rejected source.

Inspected eight native home frames: front/back idle, side/front/back run and side action. Saved untouched cropped source references, a 2x nearest contact sheet and bounds/cell manifest under art/player_factory/previews/home-reference/. Instructions: docs/home-style-reference.md; extraction: scripts/extract_home_reference.py. Existing home.png and runtime/cache versions unchanged.

The rebuild must match home's layered hair, large shaded anime eyes, compact face, roughly half-height head/hair, athletic crouch, short limbs, garment folds and material shading. Do not use a repeated-cone hair cap, empty bean-shaped face or stiff doll stance. Do not treat a forced low colour count as quality proof. Native sampled bodies are 180-196px tall; verify the proposed lower-resolution output against the actual source at identical match-scale sizes before locking export resolution.

Next: faithfully rebuild one static source player against the home frames before animation. Required final three kit/hair variants remain unchanged. No new Blender render or accepted style claimed in this reference update.


## Modular player factory — flat 2.5D rendering alternative (2026-09-28, Codex)

User requires a clean flat pixel-art image, using home.png as the quality reference. Delivered an explicitly labelled 2.5D cutout proof to preserve that artwork instead of repeating the rejected faceted 3D style. This is an alternative source method for review, not silent completion of the original full-3D pipeline.

Files: art/player_factory/flat_proof_v2/player_flat_v2.blend; parts.json; sixteen texture layers packed into the source; home reference crop; flat_native.png (192x224, origin 96,200); flat_small.png (96x128, origin 48,116); flat-style-comparison.png; pixel-layers.png; arm_pose_probe.png; validation.json. Scripts: prepare_flat_parts.py, build_flat_proof.py, verify_flat_proof.py. Documentation: docs/flat-proof-v2.md. Original rejected source and game sheets remain preserved. No runtime/cache versions changed.

Validation: source separation reconstructs all visible original pixels without repainting; one orthographic camera, unlit emission textures, nearest sampling, zero scene lights; 17 bones and 16 distinct bone-parented meshes; all textures packed; source reopens and renders identically; binary-alpha exports have correct dimensions and no frame-edge clipping; both projected authored origins verified. An eight-degree in-plane arm bend is only a rig check, not a run animation.

Limits / next decision: still the original brown-haired grey-kit home art in one view, with its existing decorations. This is not a newly modelled 3D footballer. Camera turns require separately authored pixel views; large poses may expose seams/missing joint art. No new heads, hairstyle/kit variants, run cycle, packed atlas, event timing, gameplay integration or performance benchmark. Settle whether this 2.5D source method suits the intended factory before expanding animations; the original three-variant deliverables remain pending.


## Modular player factory - 3D volume direction and first front draft (2026-09-28, Codex)

User selected the recommended proper 3D rig plus pixel textures/flat sprite rendering direction after reviewing the cutout alternative. Delivered a first front-view volume draft against home.png. This supersedes cutouts as the selected production direction, without asserting that this draft completes the factory.

Files: art/player_factory/volume_proof_v3/player_volume_v3.blend, front/96x128 exports, arm pose probe, source/render comparison, untextured oblique geometry view, validation JSON; scripts/build_volume_proof.py and verify_volume_proof.py; docs/volume-proof-v3.md. Source uses 17 bones, 30 closed meshes with actual depth and 16 packed reference textures. Body/limb geometry uses curved cross-sections; hair has a volume core and 14 closed tapered locks. Fixed the active render UV choice that initially distorted sphere paint. Source front render uses nearest unlit textures and no lights; alpha-thresholded deliverables preserve source colour detail.

Validation: saved source reopened and repeated native render pixel-identically; all meshes manifold and bone-parented with real depth; render UVs and packed images verified; hand transform responds to modest arm pose changes; 192x224 and 96x128 exports have binary alpha and no frame clipping. Small authored origin verified (48,116). This is a rig pose check, not a run animation or gameplay test.

Remaining: front paint is projected home reference artwork. Full side/back UV painting, larger-pose joint/deformation cleanup, shared run action, hair/kit variants, atlas exporter and runtime integration remain pending. Hair alpha trims the frontal painted fringe. Do not treat a good front screenshot as proof that other views or full animation work. Original home.png, game runtime and concurrent project changes preserved; no cache changes.


## Shared chibi factory v4 (2026-09-28, Codex)

Intent: user authorized the move to one reusable volumetric chibi body with modular hairstyles and colour presets, using Captain Tsubasa's official visual presentation as guidance and home.png as the local quality reference. This prototype supersedes the projected reference-paint drafts as the development foundation; it does not establish final visual approval.

Files: art/player_factory/chibi_v4/shared_chibi_v4.blend, presets.json, textures/face.png, README.md, build-report.json, contacts.json, export-validation.json; scripts/paint_chibi_face.py, build_chibi_v4.py, export_chibi_v4.py, pack_chibi_v4.py; docs/chibi-v4.md. chibi_v4/export contains three preset folders (blue_black, white_blond, red_curly), run.png, idle.png, manifest.json and individual frames; preview.html, preview-data.json, validation.json, browser-checks.json, geometry_ready.png, geometry_rest.png, chibi-v4-variants.png, chibi-v4-run-frames.png, chibi-v4-run.gif, home-reference.png and match-scale-composite.png. Deliverables also copied to the current Codex task outputs/chibi-v4, outputs/shared_chibi_v4.blend and outputs/Ultimate_Eleven_Shared_Chibi_v4.zip. No runtime files, existing player assets or cache versions changed.

One connected manifold skinned body (3,092 vertices / 4,779 polygons), original common UV-painted head, 17 deform bones plus four foot/knee controls. Layered spikes, swept and curly hair are fitted geometric collections. Independently recolourable skin, hair, shirt, shorts, socks, boots and trim; shared Run8_Shared action. Three-band cel materials, fixed orthographic camera, binary-alpha palette export with external 1px contour. No home artwork projected onto this source, and no borrowed Captain Tsubasa model or texture.

Delivered 96 run frames (3 presets x 4 true directions x 8 phases) and 12 static ready frames. Native 96x128 with origin (48,116); 800x528 run and 400x132 ready atlases, 2px gutters. All six atlases decode to 5,702,400 bytes (5.438 MiB) before GPU/loader overhead. Frame 9 closes the action to frame 1; exported run phases 4 and 8 include flight.

Validated: source reopened; one manifold body component; normalized weights; identical body geometry hash across presets; actual deformed boot sole heights during stance and flight, IK targets, exact repeated raw render and closing key render; binary alpha, frame dimensions, clear margins and gutters. Corrected UV seam wrapping, internal union islands, inflated sock trim, misplaced foot weights and foot orientation constraints. Direction/phase sheets and native frames visually inspected. Local browser preview loaded all variants; direction, play/pause, stepping, scale, run/ready and FPS controls checked, including ready frame 1/1 with playback disabled. ZIP CRC check passes.

Remaining / next checks: improve face, hair, clothing folds and athletic motion against home.png; evaluate topology/weights for larger poses; add clothing UV/decal options, idle breathing and other actions. Calibrate stride/cadence against actual game speed before claiming no foot sliding. Runtime manifest adapter, live match/direction/ball tests, camera scale checks and performance measurements remain pending. Comparison pitch image is a composite. Preserve existing sprites and concurrent game work while reviewing this prototype.


## Meshy source review; chibi v4 style rejected (2026-09-28, Codex)

User explicitly rejected the shared chibi v4 appearance and supplied Meshy_AI_Ashen_Pixel_Hero_0928140856_generate.glb and Meshy_AI_Ashen_Pixel_Hero_0927211634_texture (1).glb from Downloads for evaluation. The v4 technical validation remains valid but does not mean visual approval. Do not expand v4 as accepted game art.

Imported and inspected both Meshy files in Blender 5.1.2; rendered front, three-quarter, side, back and texture-only front views. Delivered review, two 96x128 static pixel-scale comparisons, comparison sheet and model-audit.json under the current Codex task outputs/meshy-review; reproducible inspection scripts in work/inspect_meshy_models.py and work/finish_meshy_review.py. Original GLBs and all game assets unchanged; no runtime/cache changes.

Each has 714,422 triangles, one mesh object and one material; no armature, skin weights or actions. Generated source has no UV/images; textured source has one UV set and three 2048px maps. Raw indexed components of the textured import include UV seams; these are not proof of modular hair/body separation. The supplied art is closer to the requested anime chibi proportions, hair, face and garment detail than v4. Flat inspection removes added lighting but retains source-painted shading.

Next: use the Meshy art as a potential source, preserve appearance during mesh preparation, isolate hair, create a shared rig and colour masks, then validate actual animated sprite views. No mesh reduction, texture transfer, modular separation or rigging is completed yet; user has not approved the source as final game art. Static A-pose is not proof of run deformation or gameplay.


## Approved pixel-art appearance target (2026-09-28, Codex)

The user supplied ChatGPT Image Sep 28, 2026, 04_06_59 PM.png from Downloads and described it as basically perfect. This image is now the primary visual target, above the rejected v4 renders; home.png remains a game-scale quality reference. Unmodified copy verified byte-for-byte in current Codex task outputs/meshy-review/approved-style-target.png; updated outputs/meshy-review/REVIEW.md records the target.

Required qualities: layered dark hair and deliberate pixel highlights, large anime eyes, compact expressive face, athletic crouch, blue shirt/white shorts with visible folds and detailed clustered shading, short limbs and dark boots. Meshy is a much closer possible geometric source, but its current face paint, kit and A-pose are not a match yet. Prepare shared geometry/rig without discarding the art detail; validate one static game-size render against this target before expanding animations or variants. No model or texture edit, runtime change or cache update in this reference adoption.


## Meshy player v5 — rigged one-player style checkpoint (2026-09-28, Codex)

User authorized proceeding with the supplied textured Meshy character and approved pixel-art reference. Delivered one editable player as the next visual checkpoint; no claim of final appearance approval or exact reproduction. The rejected v4 artwork is not the source of this build.

Files: art/player_factory/meshy_v5/Meshy_Player_v5.blend; prepare-report.json, build-report.json, source-validation.json, validation.json, browser-checks.json, README.md, preview.html; original-size ready_front/straight/side/left/back/original_eyes and deformation_probe PNGs, verification_repeat.png; 192/ and 96/ native PNG sets, reference frames; unchanged approved-style-target.png, style-check.png, player-preview.png and resolution-check.png. Scripts: art/player_factory/scripts/prepare_meshy_v5.py, build_meshy_v5.py, validate_meshy_v5.py, pack_meshy_v5.py. Documentation: art/player_factory/docs/meshy-player-v5.md. User-facing source/previews also in the Codex task outputs/meshy-player-v5, with outputs/Ultimate_Eleven_Meshy_Player_v5.zip. Existing game sprites/code and cache versions are unchanged; original Downloads GLBs/reference preserved.

Preserves Meshy UVs, source paint, sculpted hair and garment folds. Welded duplicate UV vertices and UV-aware collapse reduces 714,422 to 71,442 source triangles (38,542 body; 32,900 extracted hair). This is reduction, not new quad retopology. Hair is a fitted separate object; replacement scalp and cut boundaries still require cleanup/closure. Six material regions permit recolouring while preserving source shading. Blue shirt/socks, white shorts, charcoal hair, broad cel lighting, 10% enlarged head, single-surface fitted anime eye shaders and a small mouth mark. Original eyes retained as an alternate view. Reversible Fist_Curl affects 922 hand vertices; original open hands remain in Basis.

Shared skeleton: 16 deform bones, nondeforming root plus four foot/knee controls (21 total). Automatic bone heat succeeds without unweighted vertices; weights normalized, upper head/hair bound to head and soles to each foot. Deeper ready crouch with pelvis lowering, torso lean and outward foot turn; one raised-leg/arm deformation probe. No shared run action, additional hairstyles, preset roster or run atlas has been delivered in this checkpoint.

Four independently rendered directions (front 20deg, right 75deg, left -75deg, back 180deg), plus straight front, original-eye front and probe; seven poses/views at both 192x256 and 96x128 = 14 native exports. Orthographic elevation 8deg/scale 2.30. Fixed ground origins (96,232) and (48,116), rather than per-frame alpha grounding. Nearest sampling, binary alpha, 1px external ink; original paint colours retained without a forced small palette. 192x256 is a proposed quality option, not a silently changed loader convention.

Validation: source reopens with packed images; vertex weight sums 0.999994–1.000001 and zero unweighted vertices; actual deformed stance sole world Z approximately 0.000071 / 0.000004, raised sole approximately 0.170004 while planted sole remains stationary. Skin response maximum vertex movement 0.279 units. Authored origin verified; 14 exports have binary alpha and clear margins. Reopened raw ready render pixel-identical to the original. All direction views and resolution comparison visually inspected. Local preview loads PNGs and its direction/pose, frame resolution, zoom and guide/reference toggles were checked. ZIP CRC passes. Source copies verified byte-for-byte. No gameplay or run-stride validation performed.

Remaining / next checks: compare the one-player art with the approved image before expanding animation/roster output. Face expression, hair highlight shapes, fist sculpt, shoulder/knee deformation and extracted scalp boundary still need refinement. Texture preservation does not establish visual parity. Then author shared run and additional modular hair/colour presets, manifests and a runtime adapter; calibrate stride, direction, ball/shadow and match scale, then performance. Preserve concurrent game changes and existing assets.


## Original Meshy eyes selected as default (2026-09-28, Codex)

User explicitly prefers the original Meshy eyes over the added eye treatment. Promoted the exact original-face comparison render to the default in all directions/probe exports, preview and editable Blender source. Removed authored eye/mouth decal objects and their construction code; source UV face paint is preserved. Do not repaint or replace these eyes during subsequent refinement without a new user request.

Updated art/player_factory/meshy_v5/Meshy_Player_v5.blend, ready/probe PNGs and both native export sets, preview.html, review sheets, README.md, build/source/export validation JSON; scripts/build_meshy_v5.py and pack_meshy_v5.py; docs/meshy-player-v5.md. Same source, previews and ZIP updated in the current Codex outputs. Previous source archived in task work/eyes-before. No game runtime/cache or original GLB changes.

Validation: new main front render matches the previously selected original-eye view pixel-for-pixel; saved source reopens and repeated render matches exactly; packed textures, skin weights, stance/lifted sole contact and export margins/binary alpha pass. Original eyes are now the default preview option; redundant custom-eye comparison option removed. Other art/rig checkpoints remain pending, with original eyes retained.


## Meshy shared eight-frame run with original eyes (2026-09-28, Codex)

User asked to continue after selecting the original Meshy eyes. Added UE_Shared_Run_8 to the preserved v5 body/hair/face, with ready frame 0, eight run samples 1-8 and closing key 9. Fixed root, alternating foot IK and arm swing, torso lean, pelvis bounce and swing-foot rotation. Original packed face paint is byte-identical to v5; no custom face geometry. The v5 ready-only checkpoint remains separate. This is a motion checkpoint, not final visual or gameplay approval.

Files: art/player_factory/meshy_run/Meshy_Player_Run.blend; raw/ contains four ready and 32 run PNGs at 384x512; 192/ and 96/ each contain run.png, ready.png, manifest.json and frames/ (36 native PNGs). Also README.md, preview.html, run-frames.png, run-front.gif, run-four-views.gif, contact-authoring.json, source-validation.json, validation.json, repeat-first.png, repeat-close.png, browser-checks.json, preview-check.png and unchanged approved-style-target.png. Scripts: art/player_factory/scripts/animate_meshy_run.py, verify_meshy_run.py, pack_meshy_run.py. Documentation: art/player_factory/docs/meshy-run.md. User-facing mirrors in the Codex task outputs/meshy-player-run and outputs/Ultimate_Eleven_Meshy_Run.zip. No existing player sprites, runtime code or cache versions changed; original GLBs unchanged.

Four views rendered independently at front 20deg, right 75deg, back 180deg and left -75deg, ortho elevation 8deg/scale 2.30. 32 run + four ready frames at each native resolution = 72 native exports, with binary alpha, preserved source colour detail, one-pixel contour and fixed origins (96,232)/(48,116). Two-pixel gutters. 192 run atlas 1568x1040 and ready 196x1040 decode to 7,338,240 RGBA bytes total; 96 run 800x528 and ready 100x528 decode to 1,900,800 bytes, before loader/GPU overhead. Manifest stores rectangles, origins, cadence and stance markers. Both sizes are delivered; game conventions have not been changed.

Validation: saved source reopens with original packed textures and normalized skin weights, zero unweighted vertices; original rest geometry and hand shape keys preserved. Actual deformed planted soles world Z about 0.000071/0.000004; flight samples 4 and 8 put both soles at least 0.06789 above ground. Max ankle IK target error about 0.0000613. Half-cycle vertex movement 0.42845; frame 9 equals frame 1 with zero vertex delta and pixel-identical raw renders. Reopened frame 1 render also pixel-identical. Fixed root/origin verified; all native margins, binary alpha, atlas rectangles and transparent gutters pass. All direction-phase renders visually inspected. Browser preview run/ready, four directions, pause, step, resolution/zoom, cadence and guide controls checked; ready disables playback; final front run left playing at 8fps. Source copies byte-identical; ZIP CRC passes.

Remaining: one hairstyle only; fist sculpt, shoulder/knee weighting and hair/scalp replacement boundary can still be refined. Add clean interchangeable hairstyles and colour roster presets, other football actions and runtime adapter. Calibrate in-place stance travel/cadence against actual movement speed, game scale, ball/shadow and direction behavior; measure runtime memory/performance. Sole-height checks do not prove no foot sliding in the game. Original Meshy eyes must remain unchanged unless the user requests otherwise. Preserve concurrent game changes.


## Revised Meshy athletic run; previous motion rejected (2026-09-28, Codex)

User rejected the previous Meshy run animation as ugly and the model appearance as awful, then explicitly asked to try a convincing run. Preserve this distinction: prior technical checks do not imply visual approval. This revision changes motion on the same rough Meshy model; it does not redesign the player or replace the original eyes.

Added UE_Athletic_Run_16: ready frame 0, run samples 1-16 at 24fps, closing key 17; full cycle 2/3 second. Authored separate heel strike, compression, toe push-off, heel recovery, knee drive and reach; replaced the symmetric foot sine with non-uniform Hermite trajectories. Elbows remain bent about 90deg throughout opposing arm swings. Added pelvis/chest counter-rotation and weight shift, timed pelvis height and head compensation. Actual soles determine stance height during heel/toe roll. Fixed root. Original packed face paint, rest body/hair geometry, material system and hand shape keys unchanged.

Files: art/player_factory/meshy-run-v2/Meshy_Player_Run.blend; raw/ (64 run + four ready 384x512 PNGs); 192/ and 96/ each have run.png, ready.png, manifest.json and frames/ (68 native PNGs). Both resolution folders also include previous-run.png for review. run-front.gif, run-four-views.gif, before-after-run.gif, side-pose-comparison.png, run-frames.png; README.md, preview.html, contact-authoring.json, source-validation.json, validation.json, delivery-validation.json, browser-checks.json, repeat-first.png, repeat-close.png, approved-style-target.png. Scripts: art/player_factory/scripts/animate_meshy_run_v2.py, verify_meshy_run_v2.py, pack_meshy_run_v2.py, compare_run_v2.py; docs/meshy-run-v2.md. User-facing mirrors in Codex task outputs/meshy-run-v2; outputs/Ultimate_Eleven_Revised_Run.zip includes source/helpers and previous review PNGs. Original v5 checkpoint and first run are preserved. No game runtime, existing sprite files or cache versions changed.

Four independent directions at 20/75/180/-75deg with fixed ortho scale/elevation and origins (96,232)/(48,116). 136 core native PNGs total. 16-column run atlas: 3136x1040 at 192, 1600x528 at 96; ready remains one-column/four-row. Core run+ready decoded RGBA: 13,861,120 bytes for 192 and 3,590,400 for 96, before loader overhead; previous review atlases excluded. run8 manifest alias uses alternate rectangles at 12fps without another atlas. GIFs quantize the 2/3-second cycle to 670ms due to GIF timing resolution. The before/after comparison uses equal cadence, old8 at 12fps vs new16 at 24fps; no claim of improvement based only on speed.

Validation: source reopens with packed images; original face bytes and rest body/hair/hand shape keys match v5; weights normalized with zero unweighted vertices. Actual stance sole Z within approximately 3e-8 of floor; airborne frames 7,8,15,16 have both soles at least 0.04375 above ground. Heel-to-toe lowest contact patch advances about 0.23549 source units. Elbow angles about 90.05deg; no hyperextended knees or stretched leg bones. Maximum ankle IK target error about 0.0000422. Frame17 equals frame1 with zero vertex delta and exact raw pixel match; saved source rerenders frame1 exactly. Fixed root/origin, all core frame margins, binary alpha, atlas rectangles/gutters pass. All direction-phase sheets inspected. Browser compare, directions, resolution, zoom, cadence, pause/step, 16-step wrap, ready-disabled controls and guide checked; final side view left playing at 24fps with matched previous motion at actual size. GIF frame count/duration and run8 mapping verified. Source factory copy byte-identical; ZIP CRC passes.

Remaining: user must judge the revised motion; no final art approval. Source mesh/hand/knee/shoulder deformation still limits larger poses. Body and hairstyle appearance remain unresolved. Game speed/stride calibration, live ball/shadow/direction/scale checks and performance are pending; sole-height/roll checks do not establish no gameplay sliding. Original eyes remain fixed unless user requests changes. Interchangeable hair/scalp cleanup and kit/roster work remain separate pending tasks.


## HIGH SCHOOL ground in the game (2026-09-28 · new ult11-highschool.js v1, pitch3d v147) (Claude, porting Astra's venue)

**Source.** Astra built it in `Desktop/u11 for astra/ultimate 11- for stadium` (an old copy of the game, renderer ~230 KB against ours at 368 KB), so only the module was ported, not their renderer or index.

**Ported:**
- `ult11-highschool.js` (Astra's venue): roofed school stand with blue seats and seated students, two classroom blocks, gym, changing rooms, a caretaker lodge, parking with cars, roads, bike racks, benches, lamps, chain-link perimeter with ball-stop nets, tree belts, and its own painted afternoon sky.
- `assets/stadium/highschool/afternoon-sky.png` and `materials-atlas.png` (4.7 MB).
- Three small edits to Astra's module: the sky and its two lights are named (`U11HS_sky`, `U11HS_amb`, `U11HS_fill`) so the renderer can drive them.

**Renderer hooks in our pitch3d, modelled on Santa Fede:**
- `'highschool'` added to the valid stadium keys, and a build branch.
- Its resources are released on a stadium switch (same as Santa Fede).
- No flags, banners, boards or camera flashes; corner flags stay.
- The stadium roof floodlight rig stays off at night.
- Time of day: the painted sky shows by day, is warm-tinted at golden hour and hidden at night (the U11Sky / night dome show instead); the module's lights dim for golden (.48/.55) and night (.14/.05).
- Astra's old-renderer overrides of sun and hemisphere strength were not ported: our time/weather presets drive those.

**index.html:** a HIGH SCHOOL button in Settings > Stadium; `curStadium` accepts it; script tag `ult11-highschool.js?v=1` before the renderer; pitch3d v147. Also `?stadium=highschool`.

**Verified** (GPU headless): 11 v 11 starts; kickoff pan, broadcast, hero, corner, golden, night; switching to Astra and back rebuilds cleanly; ~141 fps on this PC; no JS errors. Picture: `lab/highschool/highschool_ingame.png`. Backups: `ult11-pitch3d.js.pre-highschool-v146.bak`, `index.html.pre-highschool.bak`.

**Open:**
- At night the school has no floodlights of its own; only the court's night shading lights the pitch. Art review.
- The high-school entry is not in the main menu (Settings only).
- Not tied to story mode yet.


## Settings v2: four pages, DIFFICULTY and MATCH LENGTH (2026-09-28 · index.html, game.js v213) (Claude)

**Author:** "The settings menu needs a serious update, too many settings for one long column. Using our style, make a proper settings menu with more pages if necessary. We also need to add difficulty etc."

**Menu** (`#aeSettings` rebuilt; every old id and setter kept, so the pause menu and other callers still work):
- A 900×580 card (`min(…,95vw/92vh)`, since the modal is lifted to `<body>` outside the scaled stage).
- **Left rail**, four pages: GAMEPLAY (difficulty, match length, camera), MATCH VIEW (stadium, time, weather, PS1 filter), AUDIO (master volume with − / + steppers and a Bold Pixel readout, menu music, match music), SYSTEM (UI size, fullscreen, perf overlay, reset save data).
- Style: Cinzel page titles, Rajdhani labels and descriptions (raised from 7 px to 10 px), gold active rail item with a left rule.
- `openSettings(page)` opens on a page; the last page is remembered.
- **Pad:**
  - All toggles are now `<button>`s. They were `<div>`s the B.1 menu scan never reached, as was the volume slider.
  - The rail tabs are divs, so the pad cursor walks only the current page's controls; LB / RB (polled only while open) or Q / E / PageUp / PageDown turn the page.
- A compact layout below 720 px wide or 430 px tall (narrower rail, no sub-lines).
- Verified: every page fits without scrolling on 1280×720.

**Difficulty** (`ue_settings_v1.diff`, default `pro`; game.js `U11_DIFF` / `diffCfg()`). Only the CPU side ('a' when not PVP) changes:

| | CPU duel power | CPU super-shot chance | Cooldown | CPU keeper reflex (QTE sim) |
|---|---|---|---|---|
| ROOKIE | ×0.88 | ×0.55 | ×1.6 | −12 |
| PRO | ×1 | ×1 | ×1 | 0 |
| CHAMPION | ×1.08 | ×1.3 | ×0.8 | +6 |
| LEGEND | ×1.16 | ×1.6 | ×0.6 | +12 |

Duel power is applied in resDuel right after `calcAttackPower` / `calcDefencePower` (so afSave's reused `lastDefPow` includes it).

**Match length** (`ue_settings_v1.len`): the clock tick is 40 / 56 / 80 ms (a half is still 2400 ticks), about 1.5 / 2 / 3 minutes a half. It is read when the clock starts, so it applies from the next half or match. Verified 52 / 31 / 22 ticks per 3 s.

**Backups:** `index.html.pre-settings2.bak`, `game.js.pre-settings2-v212.bak`.

**Open:** difficulty does not yet touch CPU movement or decision speed (duels, supers and the keeper only); author playtest on the pad.


## Full debug pass (2026-09-28 · game.js v214, style.css v100, pitch3d v148, cine3 v11, highschool v2, index.html) (Claude)

**Method.**
- Static checks: all 30 local scripts exist and pass `node --check`; the 5 inline scripts pass; every `assets/…` path referenced in code was checked; every `onclick` / `oninput` handler was resolved at runtime.
- Five unattended full matches (GPU headless) in which a bot plays the human side through the real input functions (`actShoot` / `actPass` / `actCross`, keyboard movement, the real duel buttons, confirm). The bot is weak, so every match ends 0-3 to 0-5; the scores don't measure difficulty. Coverage:
  - Astra/day, Santa Fede/night/rain/Legend (Japan vs Brazil), Astra repeat, Santa Fede again, High School/golden/snow/Rookie (England vs Argentina)
  - throw-ins, free kicks, corners, goals, halftime, full time
- Targeted flows: pause menu, human and CPU penalty, human and CPU super shot (human keeper duel), restart, quit, second match with other teams, live stadium switch.
- UI walk through every screen.
- Phone emulation (844×390, touch).
- Per-scene frame-rate / draw-call profile (new `P3D.perfProbe(frames)`: whole-frame calls, triangles and live lights; `stadiumState().calls` only ever saw the composer's last pass).

**Fixed:**
1. **Idle watchdog restarted play during the goal celebration and at full time.** The stale `kickoffUntil` made "stranded idle — resuming play" fire on the first check after every goal. It called `resume()` under the GOAL title / net orbit, and after the final whistle behind the full-time screen. Now skipped while `_scoringGoal` / `_halftime`, and `goFull` nulls `G.mt` / `G.di`. Before: 7 watchdog rescues a match. After: 0.
2. **The same watchdog cut every keeper catch short.** The catch holds `idle` for ~1.1 s; the watchdog resumed play early and `finishCatch` resumed it a second time. The watchdog now only acts after 3.5 s of continuous idle (`G._idleAt`), and the catch sets its own grace. Generic fix for all 20 `phase='idle'` paths.
3. **Story Mode, Cup / Tournament and Customize opened as a blank dark screen.** They are full-window screens outside `#viewport`; `#viewport{z-index:1}` (added with the world layer) painted the stage's opaque background over them. `body>.screen{z-index:2}`. Verified all three render.
4. **Font rule.** Bebas Neue (not even loaded, so it fell back to a generic sans), Orbitron, Impact, Anton and Arial were replaced by Cinzel / Rajdhani in:
   - the SAVED! banner, impact text, the old score banner, the duel avatars and labels
   - the PvP setup screen and the career transfer market
   - club-crest SVG text
   - stadium ad boards / banners (they rendered in Impact)
   - the super-shot name slash (cine3, Anton)
   - the high-school banners (Arial)
   - the 2D-fallback HUD text

   Orbitron is dropped from the Google Fonts request.
5. **The developer "BUILD css … AI READY" tag** (marked TEMPORARY DIAGNOSTIC) showed to every player, over the away portrait on phones. Now only with `?debug=1` / `?build=1`; the console line stays.
6. **Settings on a phone:** a tighter compact layout, and the rail labels no longer wrap. At 844×390 only MATCH VIEW scrolls (56 px).

**Verified clean:** no JS exceptions in any run; memory flat (30–72 MB saw-tooth over 4+ minutes, no leak); frozen-scene fps 156–182 in all 12 stadium × time × weather combos; last two full matches min 87–100 fps; restart gives a true 0-0 / 2400 ticks with no leftover overlays; a second match fields 11 v 11; the touch stick and face buttons appear in live play on phones.

**Not fixed (for the author):**
- **Story Mode fonts:** Permanent Marker and Anton, a deliberate manga look, but outside the three-font rule. Needs a decision.
- **Phone layout:** the touch joystick overlaps the human player's portrait card bottom-left.
- **Phone performance:** night scenes are heavy (Santa Fede: 12 point lights + 4 shadowed spots, ~500 draw calls; High School night ~480–550 calls). Fine on this PC, unmeasured on a phone.
- **Dead code:**
  - the `#s-career-squad` markup calls three removed functions (`crSaveSquad`, `crSquadFormationChange`, `crSquadTab`); unreachable, since career "Squad" opens Team Management
  - `pause-menu.css`, `ult11-team.js` and `ult11-stadiumpick.js` aren't loaded
  - `ps1-mod.js` is commented out
- **404 noise:** 12 optional images missing (all have gradient / onerror fallbacks) plus many player portrait variants (`front/`, `back/`, `profile/`, `shoot/`), each a failed request per match.
- **Difficulty** still doesn't change CPU movement or decision speed.

**Backups:** `game.js.pre-debug-v213.bak`, `style.css.pre-debug.bak`, `ult11-pitch3d.js.pre-debug-v147.bak`, `*.pre-fonts.bak`.


## Author playtest fixes: match start, CPU finishing, scoreboard, keeper duels / saves / camera, pass sound (2026-09-28 · game.js v220, pitch3d v151, stadium-classic v6, sfx-samples v3, style.css v102, index.html) (Claude)

**Platform note:** the author releases on Steam (PC) first, mobile later; test and tune for PC.

1. **Black screen, then referee and a golden KICK OFF at match start.**
   - Cause: the loader only waited for `P3D.ready`, which is true from page load. On a first visit the match opened on the fallback bowl while the 12 MB Astra model downloaded (~10 s at 25 Mbps), with kits and shaders still loading, and the 3D view's first frames were black.
   - Fix: the loader now waits for:
     - `P3D.waitStadium` (GLB download progress, via the new `U11_CLASSIC.progress`, until the model is swapped in)
     - `P3D.waitSheets` (both kits + the keeper sheet)
     - `P3D.warmUp` (`renderer.compile`)
   - It then keeps the loading screen as a curtain (z 9000) over the match until the renderer has drawn 5 real frames (`P3D.frameCount`), and fades it off.
   - Verified throttled: no black frame, and the match appears complete.
2. **CPU passed back when through on goal.**
   - Cause: the only shot trigger was `progress>.88` (~6 m out; `centrality>.35` can never fail), so a striker at the edge of the box kept dribbling while the pass roll picked back-passes.
   - Fix: new `cpuClearChance`: progress ≥ .78, central band, no outfield defender within ~2.4 m of the ball-to-goal line → shoot (and the pass roll is skipped). In the final third with no pressure the CPU never passes backward.
   - Verified: 10/10 isolated through-on-goal cases shoot.
3. **Scoreboard cropped the score.** The clock and half moved into a tab hanging under the centre plate; the possession strip runs along the bar's bottom edge. The bar is now names + score only. Verified with a 2-10 score and long names.
4. **CPU keeper card never appeared** on super shots: the CPU keeper's save was decided silently at the kick. Now the ball holds short of him, his card shows while he picks, then the flight finishes. `U11_CINE3.decideAtKick=true` restores the old behaviour.
5. **Camera on the empty net during a CPU save; no save cinematic for the player's keeper.** New SAVE MOMENT (pitch3d `P3D.saveMoment`, driven from afSave) for normal shots, either keeper:
   - the duel card closes and the camera cuts low and close on the keeper
   - the ball flies from its hold point into the glove at his dive read (`GKA.bw`); catch / parry frames and a small shake on contact
   - it resolves at the contact, with the parry / spill flight starting from the glove
   - the camera stays with the ball
   - `P3D.saveMoments=false` turns it off
   - The broadcast shot-camera lead toward the goal is reduced .45 → .28 (it framed the net, not the keeper).
6. **Results shown before the action** (author, mid-fix): "COUNTERED" showed while the keeper duel card was still up. Keeper duels now show no result card. The duel card closes on the pick, and the outcome appears AT the contact as a small lower-third caption (CAUGHT! / PARRIED! / REBOUND! + keeper name, `showActionCaption`) or as the GOAL title. The super-shot route already deferred its result.
7. **Pass sound late.**
   - Cause: `short-pass.mp3` starts with 289 ms of silence and `cross.mp3` with 247 ms, on top of `<audio>` start latency.
   - Fix: all one-shots are decoded once and played through Web Audio with their measured leading silence skipped (pass 277 ms, cross 235 ms, pause-open 92 ms); fallback `<audio>` pool also skips it; crowd / run beds unchanged.
   - `SFX._audio()` reports the state.

**Verified:** targeted captures for each item; a full match (Germany vs Italy, Champion) with zero errors and save moments firing; memory flat. Backups: `*.pre-prepare*`, `*.pre-hudclock*`, `*.pre-webaudio*`, `*.pre-savemoment*`, `*.pre-cpushot*`, `*.pre-noresult*`, `ult11-stadium-classic.js.pre-loadprog.bak`.


## Super-shot SAVED! camera on the keeper; new referee sprite (2026-09-28 · cine3 v12, pitch3d v152) (Claude)

- **SAVED! showed an empty net.** cine3 `flyCam` 'out' always framed the goal hit point (1.45 m behind the line), and that camera stays up through the SAVED! banner. On a save the ball stops in the glove in front of the line, often wide, so the keeper was out of frame. For a save (`!c.isGoal`) the camera now sits ~5 m out and ~3.3 m to the shooter's side, low, looking at the ball in his gloves. The goal framing is unchanged.
- **New referee:** `assets/ps1/referee-new.png` (author, 717×717, 4×4, chibi style): row 0 run side, row 1 run toward camera, row 2 run away, row 3 idle facing camera (a 4-frame breath). Per-row measured foot anchors (.962 / .97 / .925 / .90), scale 1.03 to match the old height; the old 5×3 sheet is the fallback.
- Verified: wide super-shot save framed on the keeper under SAVED!; the referee renders in play. Backups: `ult11-cine3.js.pre-savecam-v11.bak`, `ult11-pitch3d.js.pre-referee-v151.bak`.


## Difficulty controls CPU speed; dead-code removal (2026-09-29 · game.js v222, pitch3d v153, story v7, index.html) (Claude)

**Difficulty tempo.** The author asked that difficulty also decide how fast the CPU plays. `U11_DIFF` gains `pace` (running speed) and `think` (reaction / decision time multiplier), CPU side only (`isCpuSide`):

| | pace | think |
|---|---|---|
| ROOKIE | 0.92 | 1.40 |
| PRO | 1 | 1 |
| CHAMPION | 1.04 | 0.80 |
| LEGEND | 1.08 | 0.65 |

Applied to:
- `aiTop` (every CPU off-ball runner and chaser)
- the CPU carrier's speed cap, and the CPU engager's chase step and cap
- `canReact` (how often CPU players re-read the play)
- `cpuTouchMs` (first touch)
- the carrier's look-up interval (`decideCarrierMs`)

Measured on the CPU striker: top pace 1.618 / 1.759 / 1.829 / 1.899; first touch 756 / 540 / 432 / 351 ms. The human team's AI mates are unchanged (1.717). Settings descriptions updated.

**Dead code** (the author asked; nothing deleted, everything moved or backed up):
- **17 unused files moved to `_archive/dead-code-2026-09-29/`:**
  - retired or replaced modules: `ps1-mod.js`, `ult11-sfx.js`, `ult11-stadium-classic-v2.js`, `ult11-stadiumpick.js`, `ult11-team.js`
  - an old stylesheet copy: `style-1.css`
  - old backups: `index.backup-pre-gfx.html`, `ult11-pitch3d.backup-pre-gfx.js`
  - old mockups: `pause-menu.html` / `.js` / `.css`, `duel-mockup.html`, `super-shot-customize-v3.html`, `ps1-anim-test.html`, `story-edit` / `-hub` / `-select.html`

  Docs, dev tools (sprite baker / slicer / builder), `backup/` folders and `.bak` files are kept.
- **28 never-called functions removed** (a reference scan over index.html + every loaded script, run twice for cascades), about 357 lines:
  - 25 in game.js (e.g. `togglePassMode`, `toggleMusic`, `animateBallVel`, `playDuelCutIn`, `crBuildSquad`, `crPortraitHtml`, …)
  - `nightFrame` (pitch3d)
  - `captainOf`, `preMatchLines` (story)

  Backups `*.pre-deadcode.bak`.
- **Unreachable `#s-career-squad` screen** removed (markup + CSS). It called three functions that no longer exist; career "Squad" opens Team Management.
- **Settings:** "PS1 RETRO FILTER" removed (its module was retired, so the toggle did nothing). "PERF OVERLAY" now drives the renderer's real debug overlay (`P3D.debug`) instead of the retired PS1 module.

**Verified:** all scripts and inline blocks parse; every onclick / oninput handler resolves; every screen opens; full Japan vs Germany match at Santa Fede on Legend with no errors.

**Open (minor):** one self-recovering "orphaned duel overlay while moving" watchdog in that 5 v 5 Legend match; not seen in the 11 v 11 runs.

## 2026-09-29 — 3D players with per-player hair; player texture VRAM fix (pitch3d v155, cine3 v13, index.html)

**3D players (beta).** Astra's Meshy player now bakes straight into the game's sprite layout. Turn it on under **Settings → Match View → PLAYERS → 3D BETA**; it switches live.
- All 24 nations have their own kit sheet.
- Hair is a separate layer tinted per player, so one kit sheet covers blond, dark, ginger, shaved and bald players.
- Portrait players match their portraits (Goethe platinum, Schmidt ginger, Feo bald, …).
- Two hairstyles so far: spiky and buzz/bald. Keepers stay 2D for now.
- Super shots keep the shooter's hair through the charge and strike, with the aura around it.
- Tools: `art/player_factory/scripts/bake_game_sheet.py`, `pack_game_sheet.py`, `bake_all.py`.

**VRAM fix (everyone, classic too).** Each of the 22 player sprites uploaded its own copy of the team sheet, about 889 MB of video memory. Players now share one copy per sheet: 97 MB classic, 184 MB 3D.

**Verified:** full matches in both modes, super shots, saves, and live switching; no errors. Same frame rate in both modes (182 fps median).

## 2026-09-29 — 2D nation kits on home.png + Japan kit (pitch3d v156, index.html)

**Every nation now has its own kit on the original home.png art,** by exact recolouring: every pixel, outline, fold and pose stays; only colours change.
- All 24 nations are baked into `assets/ps1/2d/`.
- **Japan** uses the reference kit: navy with red V-neck, lighter-blue stripes, red shorts hem, red sock bands, black hair; no number or emblem.
- **Hair colour is per player:** portrait players match their portraits, the rest vary by nation.
- The game loads these sheets automatically in the normal (non-3D) mode.
- The tools and exact per-frame label corrections are in `art/pixel_players/pipeline2d` (see its README) for adding or changing kits.

## 2026-09-29 — Crosses and passing: box runs, hold-to-pass, cross QTE (game.js v223, ult11-crossqte.js v1 NEW, pitch3d v157, index.html)

- **Box runs:**
  - Team-mates attack the near post, penalty spot and far post earlier and from closer.
  - Crosses (yours and the CPU's) are aimed at the spot a runner is attacking.
  - A cross with no stick direction goes into the box.
- **Pass power by hold:** tap △/Q for the usual short pass. Hold it and a meter fills under your man; the pass goes further and firmer on release, or by itself when full.
- **Cross QTE:**
  - When a cross drops into a box, time slows and a ring closes on your man. This includes corners and crossed free kicks.
    - Your cross: ✕ on the first mark = header, □ on the second = volley.
    - CPU cross into your box: □ = keeper claims, ✕ = defender heads it clear.
  - Graded PERFECT / GOOD / MISS against the CPU men in reach.
  - Headers and volleys at goal go into the keeper duel. ⚡ VOLLEY is a new duel action, stronger than a header.
- **Slow motion:** sprites and jumps slow down with the ball (pitch3d animation clock).
- **New file:** `ult11-crossqte.js`. Backups: `game.js.pre-crossqte-v222.bak`, `ult11-pitch3d.js.pre-slowmo-v156.bak`, `index.html.pre-crossqte.bak`.
- **Verified in headless tests and a full-match soak:** no errors. Not yet played by hand; tuning values are in `CROSSQTE.TUNE`.

## 2026-09-29 — Tactics and man-marking work in the match (game.js v224, ult11-teammanage.js v2, index.html)

- **The TACTICS choice in Team Management now changes how your team plays:**
  - ATTACKING: higher line, presses, three runners in behind.
  - DEFENSIVE: deep line, few runners, full-backs stay home.
  - COUNTER: deep block, forwards stay high and break the moment you win it.
  - POSSESSION: three short options around the ball.
  - BALANCED: as before.
- **MARKING:** a player you assign sticks to his man, goal-side, anywhere in your half.
- Changes from the pause menu apply at once. The CPU is unchanged.
- Backup: `game.js.pre-tactics-v223.bak`.

## 2026-09-29 — Duel 15 s, added time, stamina fixes (game.js v225, ult11-sfx-samples.js v4, index.html)

- **Duel timer:** 15 seconds to choose (was 30). The match clock keeps running during a duel in a steady slow motion instead of stop-start.
- **Added time:** worked out from the half's goals, fouls, offsides, substitutions and dead-ball time. A "+N" board shows beside the clock, and the clock runs on past 45:00 / 90:00.
- **Whistle:** the referee won't blow during a duel, a ball in the air, a corner, a free kick or with the ball in a shooting box. He waits for it to finish, with a 12 s limit when the ball just sits in the box.
- **Stamina:**
  - A player on 0 stamina used to count as full, which allowed super shots when exhausted. Fixed everywhere.
  - Super shots need their 400 SP on the field too.
  - Every move refused for stamina, field or duel, now plays an error sound.
- Backups: `game.js.pre-clock-v224.bak`, `index.html.pre-clock.bak`.

## 2026-09-29 — Full-backs overlap (game.js v226)

- **Overlaps:** full-backs now overlap a winger on the ball in the attacking half. Before, it never happened: the full-back was always kept as the short option.
- **By tactic:** ATTACKING and BALANCED overlap most; COUNTER and POSSESSION less; DEFENSIVE rarely.
- **Rest:** a full-back takes a breather of about 2.5 s after each overlap.

## 2026-09-29 — Finished matches are fully closed (game.js v227)

- After full time and back to the menu, the match no longer keeps running in the background: no sounds, no duel faces. The pause-menu quit uses the same shutdown.

## 2026-09-29 — Forfeit / Restart stay in full screen (game.js v228)

- **FORFEIT MATCH and RESTART MATCH** in the pause menu act straight away, inside the game. No browser box, so the game stays full screen.
- **Other browser boxes:** a few menus outside matches still use them (career transfers, cup abandon, save reset). They are listed in ROADMAP as the next small job.

## 2026-09-29 — Loading screen (game.js v230, pitch3d v158, style.css v104)

- The loading runner is now Italy's in-game player, with the game's own ball at its true in-game size (it was far too big).
- The screen stays up for about 2 seconds or more so you actually see it; the bar fills smoothly.
- It now also waits for the hair layer and the ball graphics, so nothing pops in after it closes.

## 2026-09-29 — No more browser boxes (new ult11-dialog.js; game.js v231 and others)

- **Every pop-up is now an in-game panel,** so the game stays full screen. That covers career transfers, new career, save reset, cup abandon, story restart, name reset and the "coming soon" notes.
- **Pad and keyboard work:** d-pad / arrows to choose, ✕ / Enter to confirm, ○ / Backspace / Esc to cancel.
- **Safe default:** anything that deletes data starts on CANCEL.
- New file to upload: `ult11-dialog.js`.

## 2026-09-29 — Crosses in focus (pitch3d v161, game.js v232)

- **Focus:** on a cross, the depth of field now focuses where the ball is going. Before, the landing spot was blurred.
- **Camera:** it leads toward the runner in the box.
- **Ring:** the QTE ring now sits around the runner's body instead of above his head.

## 2026-09-29 — Team Select shows the new kits (ult11-teamselect.js v4)

- **Sprites:** the players on Team Select now wear the new nation kits, the same as in the match.
- **Shirt icon:** the little HOME shirt matches too, e.g. navy Japan with the red collar.

## 2026-09-30 — No hair layer on sheets with their own heads (ult11-pitch3d.js v162)

- **Bug:** black scribbles on the Japan faces in a match (Team Select looked fine).
- **Cause:** in a match every 2D kit sheet also gets `hair_home.png` drawn on top (home's OLD hair, tinted per player). The new hand-made `japan.png` already has its heads, so that old outline landed on the new faces.
- **Fix:** `P3D.headBaked` (now `['japan']`): a 2D sheet on that list skips the hair layer. Add a team key there when its sheet carries its own heads.
- **Verified:** headless Japan vs Italy: 0 hair sprites on Japan, Italy's hair layer still shown.

## 2026-09-30 — Night floodlight beams rebuilt as real light volumes (ult11-pitch3d.js v163)

- **Author:** the beams looked better before the 09-27 rewrite.
- **Why the 09-27 version looked worse (measured):**
  - It put the brightness at the grass end: ConeGeometry's uv.y is 1 at the lamp, and `1/(1+vy*7)` treated it the other way round.
  - It lit the cone's edges (`1-|N.V|`), so each beam read as a hollow glass tube.
- **New:** each beam is ray-marched through its analytic cone.
  - Thick in the core, zero at the edge, from any camera.
  - Hot at the lamp, with a soft tail onto the pitch.
  - Streaks radiate from the lamp and drift slowly.
  - A soft brightness ceiling, so a beam seen down its axis glows instead of blowing out.
- **Closed cone base:** the low kickoff camera looked into the open end and saw a hard dark arc.
- **Camera inside a beam:** that cone switches to its back faces.
- **Tuning:** `P3D.rig.beam = {gain:.9, cap:.42, streak:.55, steps:12}`, live.
- **A/B:** `P3D.rig.setConeStyle('classic')` brings back the pre-09-27 shader; `'vol'` returns to the new one.
- **Verified headless:** frozen-frame comparisons (pre-09-27 / 09-27 / new) on the kickoff hero camera; broadcast camera during play shows no artifacts; 180 fps either way.
- **Backup:** `bak file/ult11-pitch3d.js.pre-volbeam-v162.bak`.

## 2026-09-30 — PRESS START / KICK-OFF prompt in the author's style (style.css v105, game.js v233, index.html)

- **New component `.ue-start` (style.css).**
  - Wide-spaced white caps in Rajdhani 500, between two thin rules with a small pip at the word.
  - A dark band behind the text.
  - A blue horizontal light under the word (glow, streak, hot centre) that softly pulses (2.8 s).
  - Hover / controller focus stretches the rules; no box or outline.
- **Splash:** the old PLAY button is now **PRESS START**. Start, A or Enter on the splash goes straight in (`_splashStart` in `_navConfirm` and on PAUSE), with no cursor step first.
- **Match:** the kick-off prompt uses the same look ("KICK-OFF"). The CPU's "ITALY KICK-OFF" is the quiet `.is-info` variant: smaller, static light, not clickable.
- **Fonts:** Rajdhani weight 500 added to the Google Fonts link (same family).
- **Verified headless:** splash → Enter → home; KICK-OFF click starts the match; zoomed crops at both pulse phases.
- **Backups:** `bak file/{style.css.pre-pressstart-v104, game.js.pre-pressstart-v232, index.html.pre-pressstart}.bak`.

## 2026-09-30 (night shift) — Stadium look toward the author's two targets (ult11-pitch3d.js v164, ult11-stadium-classic.js v7, index.html)

Targets saved in `art/look_targets/`: `target_day_golden.webp` (sun shafts on the crowd) and `target_night.webp` (lamp clusters, one-point beams, living grass). Players are never lit by any of this (author rule).

- **Living grass (all times, all grass pitches):** one GLSL layer over the existing turf; the pixel texture and markings are unchanged.
  - Fine blade grain that fades out where a pixel already covers it (no distant shimmer).
  - Slow wind gusts rolling across the pitch, paler where blades bend.
  - Warm backlight on the far grass toward the low sun.
  - Dew glints that twinkle as the camera moves (under the pools at night).
  - Tune: `P3D.grass = {on, classic|golden|night: [blade, wind, sheen, dew]}`.
- **Sun shafts (golden hour, Astra stadium):**
  - Ten slanted light slabs along the real sun direction, ray-marched with soft edges and drifting dust, fading in from the roof.
  - The same slabs go to the crowd, seat, terrace and concrete shaders (`U11_CLASSIC.shaftUniforms`): the bowl sits in cool shade and is sunlit exactly where a shaft lands.
  - Golden sun moved to the right, slightly behind the camera (`realShadows.dir.golden` azim 4.03→1.2, elev .08→.2), so the shafts land on the far stand's crowd as in the target.
  - Tune: `P3D.sunShafts` (gain / dark / lit / tint, `spots`); `.on=false` for A/B.
- **Golden grade:** turf deep green under the warm grade (`P3D.golden.pitch`), contrast 1.08→1.13, sat 1.04→1.06, vignette .8→.85, pitch glow .5→.18 (its pool sat opposite the moved sun).
- **Night lamps:**
  - Round-bulb heads (7×4 bulbs whose hot centres just cross the bloom knee).
  - One wide soft glow per bank, so each cluster reads as one source.
  - Ten secondary banks (far roof between the five, corners, both ends) with head, glow and a lighter beam (`uAmp`). No pitch pools from them; none on the near side.
  - Warm lamps under every tier edge (`U11_CLASSIC.tierLights`, 667 lamps).
- **Night turf:** lusher (`turf` 1→.55, amb .19/.23/.35→.20/.25/.35, lamp 1.08/1.04/.96→1.12/1.08/.98).
- **Foreground bokeh:** soft discs in the out-of-focus grass in front of a LOW camera (kick-off orbit, lab shots) at golden and night; never in the match camera. `P3D.bokeh`.
- **Camera hook:** `P3D.camHook(camera,dt)` (return true) lets a test/lab camera take over.
- **Verified headless:**
  - Fixed views (broadcast-high A, grass-level B, close-up C, match camera G) × day/golden/night.
  - No shader errors (WebGL2).
  - 180 fps cap with or without the night rig.
  - Santa Fede / High School × 3 times load clean.
  - Santa Fede golden is very dark, but it was darker still with the old sun, so this is pre-existing, not caused by this change.
- **Backups:** `bak file/{ult11-pitch3d.js.pre-look-v163, ult11-stadium-classic.js.pre-look, index.html.pre-look-v163}.bak`.

**Same night, later additions (still pitch3d v164 / stadium-classic v7, not yet deployed):**
- **Golden light leak:** a warm screen-blend glow at the frame edge toward the sun, which sits just out of frame (`P3D.golden.leak {amt .48, r .78, col}`); fades when the sun is behind the camera. Golden turf is warm sunlit (`P3D.golden.pitch` .94/.95/.76).
- **Night flares:** four red flares in the crowd (two on the far stand, one per end) with smoke plumes, red-lit at the foot and drifting up grey (`rigFlares` / `flaresFrame`); night rig only.
- **Night haze:** a faint warm glow above each primary bank (atmosphere haze on the roof line).
- **Night bowl tint:** stands, crowd, terraces and concrete are warm under the floodlights (`P3D.night.bowl` [1.2,1.08,.9] via `U11_CLASSIC` `shTint`; neutral by day).
- **Soaks (full short matches, bot-played):**
  - Golden: 0 errors, fps median 135 / min 88 (headless).
  - Night: fps median 138. One `orphaned duel overlay` WARN, which is game.js self-healing and unrelated.

## 2026-09-30 — HD turf: real grass in the classic mow bands (ult11-pitch3d.js v165)

- **Author:** "square chunks, repeating, with 2 kinds of colour, so we still have the classic lines."
- **Pitch texture:** it now carries only a flat base, soft wear (centre circle, goalmouths) and the unchanged pixel markings.
- **Turf, drawn in the grass shader (day MeshBasic and night pool shader alike):**
  - The same 14 light/dark bands in the same colours.
  - Each band is filled with a repeating square tile of procedural grass: 512 px per 5 units, blades laid along the mowing direction, clumps, pale tips, normalised to mid-grey so it only adds texture.
  - Band contrast follows the camera like a real mowed pitch: strong from the broadcast side, flipped from the far side.
  - The texture's wear is kept (`c / flat base`).
- **Tune:** `P3D.turf = {tile, contrast, swing, detail}`. `P3D.turfHD=false` (before the pitch builds) brings back the old pixel turf.
- **Verified headless:** match camera and wide view at day/golden/night, close-ups, no shader errors.
- **Backup:** `bak file/ult11-pitch3d.js.pre-turfhd-v164.bak`.

## 2026-09-30 — 3D grass for low cameras (ult11-pitch3d.js v166)

- **What:** 14 stacked shells over the turf cut blade cross-sections out of a fine cell grid.
  - Blades are thinner toward the tip, sway with the gust wind, and are darker at the roots.
  - Colour is the turf underneath: bands, grass tile, painted lines turn the blades white.
  - They receive player shadows, and follow the floodlight pools plus the night turf tint at night.
- **When:** only for low cameras (y < 4.2: kick-off orbit, goal camera, lab shots), in a patch in front of the camera that thins out by 9 units. The match camera never draws it.
- **Tune:** `P3D.grass3d = {on, layers, height, reach}`.
- **Fixes found on the way:**
  - r128 Lambert has no `output_fragment` chunk, so the colour hooks in before `tonemapping_fragment`.
  - The shells need normals (shadow normal-bias).
  - Texture LOD is explicit on the shells (cut-out 2x2 quads have garbage derivatives).
  - The additive sun pool (`pitchGlow`) lifts above the blade tips while shells show, otherwise the blades read darker than the turf.
- **Verified:** brightness matches bare turf within ~4%, no shader errors, fps unchanged (headless 180 cap).
- **Honest note:** subtle at our low cameras (~4–5 m up). It shows most in true grass-level shots.
- **Backup:** `bak file/ult11-pitch3d.js.pre-grass3d-v165.bak`.

## 2026-09-30 — Duel pass / super pass pick: broadcast camera per team-mate (ult11-pitch3d.js v167, game.js v234)

- **Author:** the pass pick was a bird's-eye view. Keep the broadcast camera, keep the yellow outline, and move the camera to each player as you switch, like choosing a player's view in a replay.
- **Renderer:** the overhead pass-pick camera is gone.
  - While picking, the normal broadcast camera glides quickly onto the aimed team-mate (`duelPickTarget`, reads game.js `_dpAim`).
  - It frames a touch wider so you see who is around him; it doesn't widen near the south touchline, where the boards would fill the frame.
  - The depth-of-field focus sits on him too.
- **Banner:** "PASS MODE — ◀ ▶ OR CLICK A PLAYER" (and the one-two / super variants), so the arrows are discoverable.
- **Unchanged:** the yellow aim ring + name, pad / keyboard stepping, lock with the move button / CONFIRM, CANCEL back to the menu, mouse click.
- **Verified headless:** a real duel → PASS → ArrowRight ×3 (LW → RW → GK → CB2); the camera cuts to each with the ring on him; 0 errors.
- **Backups:** `bak file/ult11-pitch3d.js.pre-grass3d-v165.bak` covers v166 minus 3D grass; the exact pre-change game.js is `bak file/game.js.pre-passcam-v233.bak`.

## 2026-09-30 — Stamina rebalance + half-time refill (game.js v235)

- **Author:** "a few dribbles and one super shot and Frisina was basically out", "is recovery working?", half-time refill, a won dribble costs 40.
- **Measured before** (per frame × 60 = per second):
  - Carrying the ball cost 11/s, 33/s with a defender close, +24/s sprinting: up to 57/s, a full 1500 bar in 26 s.
  - Off the ball, the running cost beat the 7/s regen, so recovery never showed: team average 99% → 70%, net −1.2/s. Regen also only ran in open play.
- **Now** (`STAMINA` in game.js, one place to tune):
  - Carrying 4/s, 12/s pressed, +12/s sprinting.
  - Human defender sprint chase 30 → 18/s.
  - Regen 8.4/s outfield, 7.2/s keepers, also while the ball travels or is loose; the carrier still doesn't regen.
  - A dribble you WIN costs 40 (lost: 80).
  - Other duel costs unchanged (super shot 400).
- **Half-time** (`staminaHalfTime`): outfield back to 80%; fully exhausted (<5%) only to 50%; keepers to 100%. Nobody is lowered (95% stays 95%). Unit-tested: 0→50, 4→50, 6→80, 50→80, 95→95, GK 30→100.
- **Soak** (bot, short match, 0 errors): the attacking CPU side ends tired (most ~60%, one winger 12%); the side standing in shape stays ~90–98%; the half-time refill applied as specified.
- **Backup:** `bak file/game.js.pre-stamina-v234.bak`.

## 2026-09-30 — Stamina cost numbers on your player (game.js v236, style.css v106)

- **Author:** a small red "−80" / "−40" / "−400" next to the carrier, and on your own defending moves.
- **`staminaPop(pl, delta)`** is fired from `spendSpirit` (block, super block, jump, tackle / slide), the duel's attacker and defender costs, and the block / jump refunds (green "+20" / "+40").
- **Human players only:** the CPU's spending isn't shown (both sides in PvP).
- **Timing:** a duel's number waits until the duel screens, any cinematic and the post-duel reposition are over, then pops on the player. It follows him as it floats up and fades (1.3 s); two on one player stagger.
- **Position:** measured, the drawn body fills only the bottom ~37% of the sprite box, so the anchor is just above the head, to the right.
- **Style:** Rajdhani 700, red with a dark outline (`.st-pop`), green for refunds.
- **Verified headless:** a won dribble shows −40 at the carrier's head, a lost one −80 on the loser, a jump −80; 0 errors.
- **Backups:** `bak file/{game.js.pre-stampop-v235, style.css.pre-stampop-v105}.bak`.

## 2026-09-30 — Foul / penalty / offside title in the house style (new ult11-whistletitle.js v1, game.js v237, index.html)

- **Author:** make the foul banner consistent with our style and fonts.
- **Before:** a foul stacked four things: the "🟨 FOUL — FREE KICK" event banner, the referee card, a wobbling red FREE KICK box dead centre, and the yellow-card popup landing on top of that box's text.
- **Now `U11WhistleTitle`:** one title, a sibling of the GOAL title. Same lower-third diagonal band, a Cinzel word, and the player card (portrait, name in Rajdhani, "FOUL · minute · team").
  - Calmer than a goal: silver word lit by a tone colour, no burst, no sparks.
  - Tones: amber FREE KICK, red PENALTY, blue OFFSIDE.
  - The booking is inside the title: a yellow/red card flips in beside the name ("YELLOW CARD · BOOKED", "RED CARD · SECOND YELLOW · SENT OFF").
- **game.js:**
  - `rollFoul` reads the fouler's portrait and colours before the booking (a red removes him), then shows the title.
  - `bookPlayer(…, quiet)` skips its own card flash and referee card and reports `bookPlayer.last`.
  - Offside uses the same title.
  - The old overlays stay only as a fallback if the module is missing.
- **Verified headless:** a real foul through `rollFoul` (old box / card flash / event banner not shown), plus FREE KICK + yellow, PENALTY + red (second yellow), OFFSIDE; 0 errors.
- **Backups:** `bak file/{game.js.pre-whistle-v236, index.html.pre-whistle}.bak`.

## 2026-09-30 — Foul system fixes (game.js v238)

- **Author's test:** Mancuso (ITA, attacking) vs Shester (GER). The game said "foul", named Feo (ITA, not in the duel), and then Italy got the free kick: "3 mistakes in 1".
- **Cause 1, wrong fouler:** when the DEFENDER won with a tackle/block, `afTurn` called `rollFoul(ns===attSide?G.D.ds:attSide, …)`. `ns` is the defending side, so it always passed the ATTACKER's side. Shester's slot key (CB1) was looked up in Italy's squad → Feo. Feo could be booked, the foul was counted to Italy, the penalty-box test ran against the wrong goal, and the free kick was placed at Feo's position.
- **Cause 2, overturned result:** that foul was rolled AFTER the result screen had already said "COUNTERED — Shester wins it!". So "you lost the ball", then a foul, then your free kick. With your own player named, it read as a foul BY you.
- **Fix:**
  - The foul is decided at the duel verdict (same rates: attacker beats a tackle 8%, defender wins with a tackle/block 3%; never in a keeper shot duel).
  - The result screen itself shows an amber **FOUL** — "Shester fouls Mancuso!" — followed by the FREE KICK title with the right fouler.
  - The routing call passes the defending side; the afTurn roll is removed.
  - A fouled attacker is not stunned/cooled down, pays the won-dribble price, and gets the duel stat.
- **The fouled player takes the free kick** (`rollFoul(…, fouledKey)`, also for field tackle fouls); the nearest team-mate only if he's gone.
- **Verified headless** (forced fouls):
  - Defender-wins foul → FOUL / Shester / Italy's FK taken by Mancuso.
  - Attacker-beats-tackle foul → the same.
  - Human block foul vs CPU → FOUL / Feo / Germany's FK taken by Shester, counted to Italy.
  - 0 errors.
- **Backups:** `bak file/game.js.pre-foulfix-v237.bak` (+ `pre-whistle-v236`).

## 2026-09-30 — Referee art in the foul title (ult11-whistletitle.js v2, new assets/ui/referee_whistle.png, index.html)

- **Author:** use the referee art for fouls, with the diagonal banner on top. Layers: game → referee → banner.
- **Asset:** `assets/ui/referee_whistle.png` (898×555), cut from the author's image (source kept in `art/look_targets/referee_whistle_src.jpg`).
  - The white background is flood-filled from the edges; the enclosed pocket between fist and collar is removed too.
  - Soft un-premultiplied edge, so there's no white halo.
- **Title:** `.wt-ref` sits between the vignette and the band.
  - Rises in from the lower left (0.5 s), exits with the band.
  - `height min(66vh,46vw)`, arm pointing into the frame; the band, word and player card cover his lower body.
  - Shown for FREE KICK and PENALTY. OFFSIDE (the linesman's call) goes without him; `ref:false/true` overrides.
  - Preloaded when the module loads.
- **Verified headless:** real foul + FK/yellow + penalty/red + offside; art loaded; 0 errors.

- **Follow-up (whistletitle v3):** referee 18% bigger (`height min(78vh,54vw)`), still anchored left so his elbow sits on the left edge of the screen.

## 2026-09-30 — Goal celebration cinematic (new ult11-celebrate.js v1, game.js v239, ult11-pitch3d.js v168, index.html)

- **Author:** after a goal, the scorer runs toward his team, team-mates run to him, he jumps, small pixel symbols around him; skippable; the diagonal banner with name + minute; his profile appears and says a line (20 random lines); Square Enix style, house fonts.
- **Timeline** (from the goal):
  - 0–0.9 s: ball into the net.
  - 0.9 s: the existing GOAL title (name, minute, score).
  - ~2.2 s: cut to the celebration camera. The scorer runs a third of the way to his 4 nearest outfield team-mates, who run to him and gather round; he jumps on arrival and hops every 0.9 s, and arrived team-mates hop now and then.
  - Pixel symbols (star, sparkle, note, heart, "!", 1-px dark outline, gold / white / team colour / pink / cyan) burst on each jump and trickle around him, rising and fading.
  - ~3.9 s: the dialogue box: deep-blue window with a silver double frame and scanlines, gold-framed portrait, Cinzel name-plate tab, the line typed out in Rajdhani, blinking ▼.
  - Then ~1.9 s hold and the kick-off restart. Total ≈ 7 s + the usual 1 s kick-off.
- **Skip:** ✕ / A / Enter / Start / click / tap, plus a SKIP chip with the right glyph. It goes straight to the kick-off restart.
- **Lines:** 20 in `U11Celebrate.lines`, never the same twice in a row; `{team}` = the scorer's team.
- **game.js:** afGoal's restart became `_restart` (called by the celebration's end or its skip); `actConfirm` / `actPause` skip while it runs. Fallback: without the module, or with no scorer on the pitch, the old timing.
- **Renderer:** `P3D.celebrate(side,key)` — a low, close camera on the near side of the scorer, following with a lag and drifting slowly round him; the DOF focus is on him.
- **Clock:** stopped throughout (phase idle).
- **Verified headless:**
  - Home goal: full sequence, kick-off after 8.0 s, line typed.
  - CPU goal: celebrates too; Enter at 3 s → kick-off 1.4 s later, no pause toggled, score right.
  - 0 errors.
- **Backups:** `bak file/{game.js.pre-celeb-v238, ult11-pitch3d.js.pre-celeb-v167, index.html.pre-celeb}.bak`.

## 2026-09-30 — Celebration polish: real face crops, open portrait, team-colour window, centred camera (game.js v240, pitch3d v169, celebrate v2, goaltitle v3, whistletitle v4)

- **Faces:** the GOAL / FOUL / OFFSIDE cards and the dialogue loaded the whole front image with a guessed CSS crop. The head sits in a different place on each sheet, so some (Mancuso) were cut wrong.
  - New `faceCropURL(pl)`: the in-game bust's own head crop (`getFaceCrop` / `headBox`). The cards put it first, with class `crop` filling the card.
  - New `bustCropURL(pl)`: head and shoulders, transparent background kept.
  - Keepers keep their chain. The scorer's front image starts loading at the goal.
- **Dialogue portrait:** open, no square and no background. The bust stands at the left of the window and rises over its top edge; the old sheet crop is only a fallback (clipped).
- **Dialogue window:** translucent (backdrop blur) in the HOME / AWAY colour: blue when you score, red when the CPU scores. The name plate matches.
- **Camera:** centred on the scorer like the goal cinematic: faster follow (lerp 6/s), closer and lower, only a slow drift. Measured: scorer 0.00–0.02 from screen centre horizontally, 0.08 above centre (clear of the window), for home and CPU goals.
- **Verified headless:** 0 errors.
- **Backups:** `bak file/{game.js.pre-portraits-v239, ult11-celebrate.js.v1, ult11-goaltitle.js.v2, ult11-whistletitle.js.v3}.bak`.

## 2026-09-30 — Goal fanfare (new ult11-fanfare.js v2, ult11-celebrate.js v3, index.html)

- **Author:** a small song for the goal, like the classic FF7 victory fanfare.
- **What:** an ORIGINAL fanfare in that spirit (the FF7 melody is copyrighted, so this is our own tune).
  - A rising pickup into a held chord, a little march phrase, a climb to a big final chord with a cymbal.
  - Bb major, 132 bpm, ~5 s + reverb tail.
- **Synthesised with Web Audio (no file):**
  - Brass lead + harmony: detuned saws + sub square, a filter that opens per note, vibrato on long notes.
  - Low-brass chords, timpani, snare rolls, crash.
  - Generated hall reverb, gentle compressor.
- **Playback:** plays from the celebration's cut to the scorer. Follows `SFX.on` / `SFX.master`; ducks the match music (to 0.06) and restores it. A skip fades it out in 0.3 s; a natural end lets the last chord ring into the kick-off.
- **Verified:**
  - Offline render (OfflineAudioContext): no clipping, peak ~0.5 at game level.
  - In game: active at the cut, music ducked, skip → stopped and music restored, 0 errors.
- **Preview:** `art/look_targets/goal_fanfare_preview.wav`.

## 2026-09-30 — CPU-goal theme (ult11-fanfare.js v3, ult11-celebrate.js v4, game.js v241)

- **Author:** a more serious one for CPU goals — "not like we lost, but it should shift the mood".
- **`'rival'` theme, original:**
  - G minor, 96 bpm, a timpani roll into the first chord.
  - Horns in a lower, darker register (harmony a third below) over a slow string pad + low brass.
  - A rising, determined phrase (Gm, Eb, Gm, Cm) ending on the dominant D major with a soft tam-tam swell: the tension is left hanging, the match isn't over.
  - ~5 s + tail, the same level as the hero fanfare (peak matched offline).
- **Selection:** `afGoal` passes `theme: isCpuSide(s) ? 'rival' : 'hero'` (PvP: both hero). `U11Fanfare.play(theme)`, `.render(ctx,dest,t0,theme)`, `.durationOf(theme)`.
- **Verified:** CPU goal → rival, home goal → hero, 0 errors.
- **Preview:** `art/look_targets/goal_rival_preview.wav`.

## 2026-09-30 — Captains before kick-off + full-time scene + one shared dialogue box (new ult11-talk.js v2; ult11-celebrate.js v5, game.js v242, ult11-pitch3d.js v170, index.html)

- **Author:**
  - An end-match cinematic: winners jump, losers on the ground (the jump's last 2 frames), the winning captain says a line.
  - The two captains talk before kick-off (Frisina = Italy, Falkner = Germany).
  - All talking banners in the goal-celebration style, showing the profile exactly like the in-game bust.
- **`ult11-talk.js` — one dialogue box for every scene:**
  - Translucent window in the home/away colour, silver double frame, Cinzel name plate, typed Rajdhani line, blinking ▼.
  - The speaker is the in-game bust's head crop (`faceCropURL`), open and unframed: home on the left, away on the right, mirrored to face him.
  - Owns the SKIP chip and scene skipping (✕ / A / Enter / Start / click / tap).
  - Captains: `U11Talk.CAPTAINS {italy:'frisina', germany:'falkner'}`, otherwise the best-rated outfield player.
  - Line pools: `goal` (20), `preOpen` (10), `preReply` (10), `win` (10), `drawHome` (4), `drawAway` (4); `{team}` / `{opp}`; no repeat in a row.
- **Pre-match** (`preMatchTalk`, before the first kick-off): home captain opens, away captain answers, the camera on each speaker (`P3D.celebrate`), then the kick-off is armed. ~6 s, skippable.
- **Full time** (`goFull` → `endMatchScene` → `goFullScreen`, the old flow):
  - Winners gather round their captain (10 outfield, meet 30% of the way), hop, pixel symbols; fanfare 'hero' if you won, 'rival' if the CPU did.
  - Losers drop one by one via `P3D.holdPose(side, key, [[7,10,140],[7,11,0]])`, i.e. jump frames 10 → 11 held; keepers stay up (their sheet has another layout).
  - The winning captain's line.
  - Draw: no celebration, the home captain then the away captain.
  - Then the usual full time (story / cup / career / end screen).
- **Goal celebration:** now speaks through `U11Talk`; its symbol emitter and "gather" are shared (`U11Celebrate.sparkle` / `.burst` / `.gather`).
- **Renderer:** `P3D.holdPose` / `P3D.clearPoses` — a per-player frame override (the facing flip kept).
- **Fixes found in testing:**
  - A finished line resolved as 'skipped' (hide() ran first), so sequences stopped after one line.
  - The stranded-idle watchdog could resume play under a scene; it now respects `U11Talk.sceneActive()`.
- **Verified headless:**
  - Pre-match: FRISINA (left, blue) → FALKNER (right, red) → kick-off armed after 5.9 s.
  - Goal: talk via the shared box.
  - Italy win: end screen after 5.7 s. CPU win skipped with Enter → end screen. Draw: both captains → end screen.
  - Pre-match skip → kick-off armed.
  - 0 errors.
- **Backups:** `bak file/{game.js.pre-scenes-v241, ult11-pitch3d.js.pre-scenes-v169, ult11-celebrate.js.v4, index.html.pre-scenes}.bak`.
