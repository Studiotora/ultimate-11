# Brand / IP audit — roadmap 0.3
### 2026-09-08 · what actually has to change before this can be sold

Reddit, twice: *"you gotta gut the brands, you're not licensed to use them"* and
*"You most likely cannot use Adidas or Nike's logos without explicit authorisation.
I think the same applies to the logos of the real football federations."*

They were right, and the exposure is wider than the logos.

---

## 1. Crests — FIXED IN CODE ✅

`assets/team/italy.png` is the **actual FIGC crest** (the real 2017 redesign),
not a lookalike. The other nationals and every club file are the same story.

**Fix shipped** (`game.js`): a `BRAND_SAFE` constant now routes every emblem
lookup away from the real files:

| | lookup order under `BRAND_SAFE` |
|---|---|
| National | `assets/team/fake/{key}.png` → national **flag emoji** |
| Club | `assets/team/fake/{key}.png` → `assets/career/clubs/fake/club{key}.png` → generated `crBadgeSvg` shield |

Nothing loads a real crest any more. A flag is not a trademark; a federation
crest is — so falling back to 🇮🇹 is safe, falling back to the FIGC badge is not.
Folders `assets/team/fake/` and `assets/career/clubs/fake/` are created and
empty: **drop your fake crests in with the same key names and they light up with
no code change.** `BRAND_SAFE=false` restores the old behaviour for local
reference only — never ship it that way.

The real files are left on disk untouched (not deleted) so nothing breaks and
you keep them for reference. They must not ship in a public build.

---

## 2. Names — NOT FIXED. This is the big one.

Extracted from `game.js`: **530 unique player names**, across 24 national squads
and 18 career clubs.

I tried to classify these automatically and the matcher was too crude to trust,
so this is an eyeball pass over the full list — treat the proportions as a
strong estimate, not a count:

**The overwhelming majority are real, living footballers.** A partial list of
what is in there right now: Messi, C.Ronaldo, Buffon, Zidane, Beckham, Seaman,
Batistuta, Figo, Gerrard, Hazard, Mbappé, Neymar, Bale, Weah, Thuram, Desailly,
Riquelme, Simeone, Stam, Overmars, Van Nistelrooy, Seedorf, Sterling, Maguire,
Xhaka, Shaqiri, Ziyech, Hakimi, Pulisic, McKennie, Del Piero, Totti, Baggio,
Pirlo, Cannavaro, Ibrahimović, Drogba, Klose, Robben, Kuyt, Torres, Cantona,
De Bruyne, Suárez, Xavi, Iniesta, Piqué, Puyol, Casillas, Ramos, Kroos, Alaba,
Modrić, Benzema… essentially all 324 names in `CR_NAMES` plus much of the
national squads.

**Second layer: anime IP.** Captain Tsubasa characters throughout — Ozora,
Hyuga, Wakabayashi, Wakashimazu, Misaki, Ishizaki, Aoi, Schneider, Natureza,
Levi, Tachibana, Jito, Sawada, Matsuyama, Soda, Misugi, Nitta, Akai, Santana,
Victorino, Pierre, Napoleon, Hino, Kaltz, Goethe, von Bronck, Carolus — plus
**Isagi** from Blue Lock. This is Shueisha/Takahashi property and, given the
game's whole visual pitch is Tsubasa-adjacent, it is arguably the *more*
dangerous half. Two commenters already said "So Bluelock?" unprompted.

**Third layer: your own.** A genuinely original set already exists — Frisina,
Mancuso, Feo, Ferlora, Vella, Impero, Gino, Haine, Leo, Senardo, Shester.

**Fourth layer: deliberate near-misses.** Zedane, Rivaul, Makelolo, Radunga,
Fergusson, Trezaga. Worth flagging: a near-miss of a *living person's* name is
much weaker protection than a clean original — it demonstrates intent to evoke
the real person, which is the thing publicity-rights claims turn on. These
should be treated as needing replacement too, not as already-solved.

### What this means
This is not a sweep, it is a **full replacement of the name database** — roughly
500 names. That is a creative decision about your world, not a mechanical edit,
so it is not something to auto-generate and bolt on without your call. See the
options put to you in chat.

---

## 3. Kits and portraits — NOT FIXED, needs art

- Sprite sheets and portraits carry **Adidas three-stripe** and Nike marks, plus
  recognisable real kit designs (the Italy '90s blue, the Germany white/black).
- `assets/career/clubs/` holds ~40 portrait files named after real players in
  real club kits (`messibarcelona.png`, `delpierojuventus.png`,
  `ronaldomadrid.png`, `buffonjuventus.png`…).
- The three-stripe is the highest-risk single mark because it is a *design*
  trademark — it does not need a wordmark to infringe.

Fix path: the kit baker already recolours zones. Extend the master sheets to
carry an **original stripe/trim motif** instead of three stripes, then re-bake
every team. That folds naturally into Phase D (sprite rework) rather than being
separate work — the duel sprites are getting redone anyway.

---

## 4. Club and competition names — NOT FIXED

`CR_CLUBS` ships FC Barcelona, Real Madrid, Man United, Man City, Juventus,
Inter Milan, Chelsea FC, Napoli, Paris SG, Bayern Munich, Ajax, Feyenoord,
Atlético Madrid, Genoa CFC, SV Hamburg, FC Tokyo, Olympique Marseille, Werder
Bremen. All real, all trademarked. 18 names — small enough to fix in one sitting
once the naming convention is decided.

Nationals are lower risk: country *names* are not trademarks. "Italy" and
"Deutschland" are fine; the crest and the kit are not.

---

## Priority order

| Risk | Item | Status |
|---|---|---|
| 🔴 Highest | Adidas three-stripe on kits | needs art (fold into Phase D) |
| 🔴 Highest | Real federation + club crests | ✅ fixed in code |
| 🔴 High | Captain Tsubasa / Blue Lock character names | needs decision |
| 🟠 High | ~500 real footballer names | needs decision |
| 🟠 Medium | 18 real club names | needs decision (quick once decided) |
| 🟢 Low | Country names | fine as-is |
