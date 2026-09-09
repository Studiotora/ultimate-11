# ULTIMATE ELEVEN — Style bible
### Roadmap A.1 · the one place the look is decided · 2026-09-08

The target is **Square Enix sports-anime / HD-2D**: pixel sprites on a real pitch, with
UI that looks *authored* — dark translucent panels sitting on the art, one warm
gold hairline, serif small-caps, and numerals in a pixel face.

The thing we are moving away from is **FIFA/EA UI language**: glossy gradient
bars, chunky borders, neon sci-fi type, gacha chips. That mismatch — not the
mixing of pixel art with illustration — is what made the gameplay video read as
two different games stitched together.

---

## 1. Where things live

| File | Role |
|---|---|
| `tokens.css` | **The single source of truth.** Colour, type, geometry, motion. Loaded *before* `style.css`. |
| `style.css` | Components. Consumes tokens. Must contain **no raw colour literals**. |
| `STYLE.md` | This document — the reasoning and the rules. |

### The four rules
1. **No raw colour in `style.css`.** If a colour isn't in `tokens.css`, it isn't in the game.
2. **No new font family** without editing `tokens.css`. Three faces ship. That is the whole set.
3. **Never add new uses of the legacy variable names** (`--gold`, `--ue-*`, `--ff-*`). They exist only to keep ~200 old rules alive; use the `--u-*` tokens.
4. **Re-hue from one line.** `--u-gold-rgb`, `--u-home-rgb` and `--u-away-rgb` are channel triplets; the hairline rules, borders and glows all derive from them. Changing `--u-gold-rgb` re-tints the entire accent system, alpha variants included.

---

## 2. Colour

### Surfaces — deep NAVY, not charcoal
Panels sit **on** the art, so they are see-through, not opaque grey slabs — and
they are blue, not neutral. Measured off the reference mockups, panel surfaces
run `#000818`–`#040818`: the red channel is at or near **zero** while blue sits
around 24. The old `8,12,20` was only 2.5:1 blue-to-red, which reads as charcoal.

`--u-bg` `#030a18` ground · `--u-bg-raise` `#071634` tiles · `--u-panel`
`rgba(2,10,26,.88)` standard fill · `--u-panel-deep` modals · `--u-scrim` to dim
art behind UI.

### Ink — neutral white
`--u-ink` `#fbfbfc` is the primary. The old cream `#f2efe6` existed for one
reason: to sit warm next to gold. With gold demoted, that reason is gone, and the
references measure a flat neutral `#fcfcfc` as the dominant text colour.
`--u-ink-dim` for labels, `--u-ink-mute` for disabled/captions.

### Blue is the accent — gold is trim  ⚠ CHANGED 2026-09-09

This rule used to read *"Gold — the only accent. Every rule, frame, marker and
highlight is this family."* That came from Octopath Traveler. The reference
mockups the project is now aiming at are **not** Octopath — they are modern
Square Enix sports-anime: navy chrome, blue accent, clean white type.

Counting **UI chrome pixels only** across the nine references (artwork, pitch and
sky filtered out):

| Role | Share of chrome |
|---|---|
| Navy panel surface | **87.5%** |
| Accent blue | **10.9%** |
| Gold | **1.7%** |

Blue is used about **six times** more than gold, and the gold that appears is
muted trim (~`#786038`) on star ratings and banner edges — never a frame.

`--u-accent` `#267ee2` now carries every rule, frame, marker and selection.
`--u-gold` is kept for **ratings, awards and trim only**.

**Selection follows the reference pattern: deep interior, bright edge.** The bar
fill is `--u-sel-fill` `#04275f` with a `--u-accent-bright` edge — not a bright
flood, which is what made ours read as a sports app rather than a JRPG.

`--u-accent-rgb` is deliberately **separate from `--u-home-rgb`** even though both
start blue: the references always feature Italy, so they never expose the clash.
A red home team must not re-hue the UI chrome.

### Team colour
Home blue / away red, applied per-element as `--tc` / `--tf` by `fCard()`.
Team colour identifies a *side*; it is never UI chrome.

### Lines — one hairline language
`--u-rule` (gold, .38) is the frame. `--u-edge` (white, .08) is an inner seam.
**Never a thick border.** HD-2D panels are defined by contrast against the art,
not by chrome around them. `--u-hair` is `1px` and there is no second width.

---

## 3. Type — three faces, three jobs

| Token | Face | Used for |
|---|---|---|
| `--u-font-display` | **Cinzel** serif | Titles, team names, section headers — in caps, generous tracking |
| `--u-font-ui` | **Rajdhani** | Everything you read: labels, buttons, body |
| `--u-font-num` | **Bold Pixel** | Score, clock, OVR, stat values, shirt numbers — **numerals only** |

Scale: `--u-fs-xs` → `--u-fs-xl`, all relative (`em`), so a panel sets its own
size with a `min()/clamp()` and children follow. Tracking: `--u-track` for caps,
`--u-track-wide` for micro labels.

### ⚠ The pixel font is single-weight
BoldPixels ships one weight. Asking for `font-weight:900` makes the browser
*synthesise* bold by smearing the glyph, which closes the ~6px counter inside
the zero and turns the score into a solid white block. Fixed by declaring the
face `font-weight:100 900` plus `font-synthesis:none`. **Never faux-bold a pixel
font.**

### The font migration — the biggest remaining lever
The audit that produced this system counted every `font-family` in `style.css`:

| Face | Declarations | Verdict |
|---|---|---|
| Bebas Neue | 139 | ❌ sports-broadcast condensed — retire |
| Orbitron | 116 | ❌ sci-fi/techy — the single most "wrong" face for HD-2D |
| Rajdhani | 29 | ✅ keep |
| Bold Pixel | 15 | ✅ keep (numerals only) |
| Cinzel | 12 | ✅ keep (expand) |

**255 of 311 declarations are still on the two faces we are trying to leave.**
That is the real reason the UI still reads FIFA. Retiring Orbitron and Bebas
Neue in favour of Cinzel (display) and Rajdhani (UI) is the highest-value single
change left in Phase A, and it is **A.2** work — not smuggled into A.1.

---

## 4. Geometry & motion

Small radii only (`--u-r-sm/md/lg`, 3/6/10px). Octopath frames are near-square.
The one signature shape is the **duel infobox notch** — an L-shape with a
*diagonal* cut, `--u-notch` — built with `clip-path`, never a vertical step.

Motion: `--u-fast` for state flips, `--u-base` for panels, `--u-slow` for
cinematic beats, all on `--u-ease`.

---

## 5. What A.1 actually did — and did not

**Did:** extracted the real palette (178 distinct hex values and 480 distinct
`rgba()` across three competing variable systems), consolidated it into one token
file, moved every global colour variable out of `style.css`, and made the gold
and team families derive from single channel triplets.

**Deliberately did not change anything visually.** Every legacy alias reproduces
its previous value exactly — verified in-browser: all 17 legacy variables
resolve to their old values, zero mismatches. A.1 is a refactor. A.2 is where
the look actually changes, as a set of decisions made on purpose.

**Verified:** editing `--u-gold-rgb` alone re-tints `--gold`, `--gold-b`,
`--bdr`, `--u-rule` and `--u-glow-gold` together.

### Known gaps (→ A.2)
- **The home menu is not yet reskinnable from `tokens.css`.** It carries its own
  component-scoped palette on `.ue-home` (`--ue-accent` `#2f8dff`, `--ue-gold`
  `#e0b040`, `--ue-bg` `#050d1c`). Folding it in changes how that screen looks,
  which is an A.2 decision.
- Values marked `A.2:` in `tokens.css` are legacy colours that differ slightly
  from the token they should eventually use (`--w` → `--u-ink`, `--panel` →
  `--u-panel-deep`, `--blue` → `--u-home`, `--ff-gold` → `--u-gold-pale`).
- `style.css` still contains ~478 inline `rgba()` literals in component rules.
  These get swept onto `--u-edge` / `--u-scrim` / shadow tokens during A.2.
- Orbitron and Bebas Neue still carry 255 declarations (see §3).
