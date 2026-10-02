# Ultimate Eleven — debug checklist

Live list of reported bugs: what was found, what was changed, and how to check it in the real game.
Status: ✅ fixed + verified headless · 🟡 fixed, needs a live check by the author · ❌ open.

---

## 2026-10-02

### 1. Sometimes every sound is gone except the music — 🟡

**Cause found:**
- Effects and the crowd only switched on after a mouse click, touch or key press.
- A controller press is none of those.
- Chrome lets the music autoplay on a site you play often.
- Result: a controller-only session had music and nothing else.
- Second cause: a paused (suspended) browser audio engine queued effects silently instead of falling back.

**Fix** (`ult11-sfx-samples.js` v6):
- Effects now also unlock on any controller button.
- They also unlock as soon as the page music is playing.
- The audio engine is woken again when the tab comes back.
- Effects only go through Web Audio when the engine is running; otherwise they use the `<audio>` fallback.

**Verified headless:** locked before any input → unlocked by a (simulated) pad press, audio engine `running`.

**Check live:**
1. Reload, then use only the controller from the splash.
2. You should hear the menu cursor and confirm sounds, the whistle and the crowd.
3. Also try alt-tabbing away and back mid-match.
4. If it ever happens again, open the console and run `SFX._audio()`. It shows `unlocked`, `on`, `master` and the engine state. Send me that line.

### 2. FRIENDLY MATCH always blue, like it's selected — ✅

**Cause:** `index.html` hard-codes `active` on FRIENDLY MATCH and nothing ever moved it. The pad / keyboard cursor uses a separate highlight (`pad-focus`).

**Fix** (`game.js` v256): the blue bar follows the item you are on:
- mouse hover
- pad / keyboard cursor
- focus

On the top-bar icons no menu item is lit. Coming back to the home screen starts on the first item again.

**Verified headless:** cursor steps → blue on none (top bar) → item 1 → 2 → 3; hover → item 3; back home → item 1.

### 3. Super-save slash flash not centred on the keeper's fist — ✅

**Cause:** the flash was placed once, at the ball, on the save frame, and then stayed fixed on screen for its 1.4 s. The save camera keeps swinging in and the dive keeps going, so the glove drifted away from it.

**Fix** (`ult11-hitfx.js` v4 `track`, `ult11-pitch3d.js` v177): centred on the glove's measured fist point (`P3D.gkaGlove`) and re-projected every frame while it plays.

**Verified headless:** Steiner saves Mancuso's super shot; the flash centre is 0 px off the glove on every sampled frame.

### 4. Super dribbles were all "Falcon Dribble" — ✅

**Fix:** the dribble is named after the player's super-shot family (`P3D.dribbleName`, `superMeta()`):

| Player / family | Dribble name |
|---|---|
| Mancuso | Raijin Flash |
| Frisina | Ryujin Coil |
| Falkner | Phoenix Dash |
| Margus | Mjolnir Charge |
| Vella | Jade Slither |
| Rivao' | Solar Stride |
| Ferasao | Dark Nova Step |
| Carlito | Crimson Rush |
| flame | Inferno Dash |
| lightning | Storm Step |
| wind | Zephyr Glide |
| shadow | Abyss Shade |
| aura | Seraph Wings |
| tiger | Byakko Prowl |
| afterimage | Mirage Step |
| dragon | Seiryu Coil |
| drive | Meteor Rush |
| ice | Frost Slide |
| nature | Verdant Weave |
| galaxy | Astral Drift |
| plain | Super Dribble |

**Verified headless:** names resolve for Italy, Germany, Brazil and Japan players.

---

## Open / to watch

- ❌ Player names on other teams still from Captain Tsubasa or real players (brand sweep 0.3).
- ❌ Swoosh / double-diamond logos on the Brazil boots (the author is painting them out).
- 🟡 GK save direction (roadmap 0.2): one live super-shot sign-off still wanted.
