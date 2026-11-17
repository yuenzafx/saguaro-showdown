# Saguaro Showdown — Ten Waves to Sundown

**Hold Cactus Gulch for ten waves — then outduel the Dusty Goliath at
sundown.**

You are the last gunslinger cactus in Cactus Gulch, armed with a water
pistol and a fence line to defend. Tumbleweeds roll in at dawn, scorpions
skitter and buzzards dive through the long day, rock golems stomp, and
rattlesnakes coil in the rocks and spit venom from range — and
twice the Dusty Goliath rides in: a warm-up duel on wave 5, and the last
duel on wave 10, under a red sundown sky. Clear a wave, draft one of
three upgrades, and build the cactus that can finish the stand. Clear
wave 10 and the day is won: a victory screen tallies your score, time,
varmints down and best combo — then offers the endless night to riders
who want to keep going.

The Goliath fight is a real duel, not a health bar. It stalks you, plants
its feet and trembles through a telegraphed windup while its charge line
burns into the dust, then charges — and slams to a stop with a stomp
that shakes tumbleweeds loose from the rocks. Below half health it turns
its second phase: ember crystals, a faster temper, a meaner charge.
Dodge the line, punish the recovery, and do not get stomped on.

## Play it

```
node serve.ts
```

then open http://localhost:8080 in desktop Chrome. Everything runs
offline; there is no build step.

- **Move:** WASD or arrow keys
- **Aim / shoot:** mouse, hold click (or J / Space to fire at the mouse)
- **Dash:** Shift — brief invulnerability, recharges over time
- **Upgrades:** click a card or press 1–3 between waves
- **Victory screen:** click to keep riding endless waves, R for a fresh run
- **Pause:** P · **Mute:** M

Score grows with your combo multiplier; water drops heal one heart, star
badges pay bonus points, and both drift toward you when you get close.
The light tells you how deep into the stand you are: dawn for waves 1–3,
full day for 4–7, and the deep sundown from wave 8 to the duel.

## Layout

- `game/` — the game itself: `index.html` plus ES modules under `src/`,
  one job per file. `config.js` holds the tuning, the ten-wave campaign
  shape and the three backdrop palettes (dawn, day, sundown);
  `waves.js` directs each wave's spawn queue; `entities.js` moves
  everything, including the Goliath's scripted duel (`updateGoliath`,
  `goliathCharge`, `goliathStomp`); `game.js` runs the state machine —
  title, playing, upgrade draft, paused, game over, and the victory
  state that ends the campaign; `render.js` draws the desert, the duel's
  telegraph and charge dust, and every screen including the victory
  tally; `shots.js` stages the screenshot scenes.
- `screenshots/` — four real renders of the game, in the order the
  campaign reads: the wave-10 boss duel, the title, an upgrade draft,
  and the victory screen, captured from the `?shot=` scenes in
  `game/src/shots.js`.
- `main.ts` — the hand-in script: copies `game/` and `screenshots/` to
  the output directory and writes `dossier.json` with the vendored
  library in `vendor/makefun-game.ts` (make.fun's, unchanged).
- `serve.ts` — the local play-test server above.
