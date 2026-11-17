// Deterministic screenshot scenes. Opening the game with ?shot=boss,
// ?shot=title, ?shot=upgrade or ?shot=victory stages a frozen,
// representative frame (seeded, no randomness between captures) so the
// entry's screenshots are real renders of the real game, identical on
// every run. The set leads with the wave-10 boss duel — the spectacle
// frame — then the title, an upgrade draft and the victory screen: the
// whole campaign loop in four pictures.

import { mulberry32 } from './random.js';
import { paletteForWave } from './config.js';
import { createEnemy, createParticles, createPickup } from './entities.js';
import { UPGRADES } from './upgrades.js';

export function shotModeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('shot');
}

export function stageShotScene(game, mode) {
  const rng = mulberry32(20261116);
  game.rng = rng;
  game.player.x = 470;
  game.player.y = 470;
  game.player.aimAngle = -0.5;
  game.best = 12450;

  if (mode === 'title') {
    game.state = 'title';
    game.enemies.push(createEnemy('tumbleweed', 1080, 640, { hp: 1, speed: 1 }, rng));
    game.enemies.push(createEnemy('buzzard', 250, 210, { hp: 1, speed: 1 }, rng));
    return;
  }

  if (mode === 'boss') {
    // The cover: wave 10 at sundown, the Dusty Goliath mid-charge in its
    // second phase — ember crystals, dust boiling behind it — while the
    // gunslinger's droplet stream meets it and the trickle closes in.
    game.state = 'playing';
    game.wave = 10;
    game.bossWave = true;
    game.finaleWave = true;
    game.palette = paletteForWave(10);
    game.score = 21480;
    game.best = 24890;
    game.combo = 14;
    game.comboTime = 2.4;
    game.runTime = 486;
    game.kills = 131;
    game.maxCombo = 21;
    game.player.x = 400;
    game.player.y = 545;
    game.player.hp = 4;
    game.player.aimAngle = -0.06;
    game.bannerText = '';
    game.bannerTime = 0;
    const goliath = createEnemy('goliath', 830, 520, { hp: 2.44, speed: 1.44 }, rng);
    goliath.hp = 64; // wounded past half: the second phase is on show
    goliath.phase2 = true;
    goliath.goliathState = 'charge';
    goliath.chargeX = -0.998;
    goliath.chargeY = 0.058;
    goliath.stateTime = 0.3;
    goliath.age = 6.2;
    game.enemies.push(goliath);
    const cast = [
      ['scorpion', 1060, 645],
      ['scorpion', 615, 690],
      ['tumbleweed', 235, 520],
      ['tumbleweed', 1090, 470],
      ['buzzard', 1030, 235],
    ];
    for (const [kind, x, y] of cast) {
      const enemy = createEnemy(kind, x, y, { hp: 2.44, speed: 1.27 }, rng);
      enemy.age = 3.1;
      game.enemies.push(enemy);
    }
    game.director.queue = ['tumbleweed', 'scorpion', 'tumbleweed'];
    // The droplet stream, mid-flight from the pistol to the Goliath.
    for (let i = 0; i < 4; i += 1) {
      game.bullets.push({
        x: 460 + i * 62,
        y: 542 - i * 4,
        vx: 638,
        vy: -37,
        radius: 7,
        pierce: 0,
        damage: 1,
        life: 1,
        dead: false,
      });
    }
    game.pickups.push(createPickup('water', 545, 640));
    game.pickups.push(createPickup('star', 985, 690));
    // Impact sparks where the stream lands, dust at the Goliath's feet,
    // a score pop over the scorpion, a breath of trauma in the camera.
    game.particles.push(...createParticles(762, 512, '#57c7e3', 10, rng));
    game.particles.push(...createParticles(830, 566, '#c98d54', 12, rng));
    game.texts.push({ x: 1060, y: 598, text: '+90', color: '#ffeedd', age: 0.3, life: 0.95 });
    game.trauma = 0.35;
    game.input.mouse.x = 830;
    game.input.mouse.y = 520;
    return;
  }

  if (mode === 'victory') {
    // The last frame of the campaign: the field is clear, the tally is
    // up, and the gunslinger stands in the sundown light he won.
    game.state = 'victory';
    game.wave = 10;
    game.palette = paletteForWave(10);
    game.score = 23640;
    game.best = 23640;
    game.runTime = 527;
    game.kills = 148;
    game.maxCombo = 23;
    game.player.x = 640;
    game.player.y = 486;
    game.player.hp = 3;
    game.player.aimAngle = -0.4;
    game.pickups.push(createPickup('star', 520, 560));
    game.pickups.push(createPickup('star', 768, 545));
    game.pickups.push(createPickup('water', 700, 610));
    game.particles.push(...createParticles(640, 430, '#ffd166', 14, rng));
    return;
  }

  game.wave = 3;
  game.score = 4860;
  game.combo = 9;
  game.comboTime = 2.1;
  game.player.hp = 5;

  if (mode === 'play') {
    game.state = 'playing';
    game.bannerText = 'WAVE 3';
    game.bannerTime = 0; // banner hidden; the HUD carries the wave number
    const cast = [
      ['tumbleweed', 760, 330],
      ['tumbleweed', 900, 560],
      ['scorpion', 830, 430],
      ['scorpion', 300, 620],
      ['buzzard', 640, 240],
      ['buzzard', 980, 260],
      // The golem stands clear of the prop cactus at (1120, 470) now —
      // it used to share the spot and read as growing out of its head.
      ['golem', 1010, 520],
      // Two more varmints low in the frame, where the sand used to sit empty.
      ['tumbleweed', 660, 695],
      ['scorpion', 1120, 650],
    ];
    for (const [kind, x, y] of cast) {
      const enemy = createEnemy(kind, x, y, { hp: 1.4, speed: 1 }, rng);
      enemy.age = 2.4;
      game.enemies.push(enemy);
    }
    game.enemies[6].hp = 6; // golem visibly wounded: health pips show
    game.director.queue = ['scorpion', 'buzzard'];
    // A short stream of droplets mid-flight toward the scorpion.
    for (let i = 0; i < 4; i += 1) {
      game.bullets.push({
        x: 500 + i * 62,
        y: 452 - i * 9,
        vx: 640,
        vy: -90,
        radius: 7,
        pierce: 0,
        damage: 1,
        life: 1,
        dead: false,
      });
    }
    game.pickups.push(createPickup('water', 585, 585));
    game.pickups.push(createPickup('star', 690, 610));
    game.particles.push(...createParticles(905, 555, '#c98d54', 10, rng));
    // Feedback mid-flight: a score pop over the dying weed, a shockwave
    // ring around the wounded golem, a breath of trauma in the camera.
    game.texts.push({ x: 905, y: 512, text: '+40', color: '#ffeedd', age: 0.3, life: 0.95 });
    game.rings.push({ x: 1010, y: 520, color: '#c77dff', maxRadius: 58, age: 0.22, life: 0.45 });
    game.trauma = 0.3;
    // Aim rests on the scorpion the droplet stream is flying at, so the
    // crosshair shows in the shot where a player's would be.
    game.input.mouse.x = 830;
    game.input.mouse.y = 430;
    return;
  }

  if (mode === 'upgrade') {
    game.state = 'upgrade';
    game.score = 3120;
    game.offers = [UPGRADES[1], UPGRADES[0], UPGRADES[6]];
    game.hoveredOffer = 0;
    return;
  }

  game.state = 'title';
}
