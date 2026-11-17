// Game rules and state: the state machine (title, playing, upgrade choice,
// paused, game over, and victory when the tenth wave falls), player
// movement and shooting, collisions, combo scoring, drops, and wave flow.
// Rendering is delegated to render.js.

import { CAMPAIGN_WAVES, COMBO, PLAYER_BASE, WORLD, isFinaleWave, paletteForWave } from './config.js';
import { liveRng } from './random.js';
import {
  createBullet,
  createEnemy,
  createParticles,
  createPickup,
  createPlayer,
  createVenom,
  spawnPosition,
  updateEnemy,
  updateParticle,
  updatePickup,
  updateVenom,
} from './entities.js';
import { WaveDirector, waveIntroText } from './waves.js';
import { drawOffers } from './upgrades.js';
import { upgradeCardRect } from './render.js';

const BEST_KEY = 'saguaro-showdown-best';

export class Game {
  constructor(input, sfx) {
    this.input = input;
    this.sfx = sfx;
    this.rng = liveRng;
    this.state = 'title';
    this.time = 0;
    this.player = createPlayer();
    this.bullets = [];
    this.venom = [];
    this.enemies = [];
    this.particles = [];
    this.pickups = [];
    this.director = new WaveDirector();
    this.wave = 0;
    this.bossWave = false;
    this.finaleWave = false;
    this.palette = paletteForWave(1);
    // Campaign bookkeeping: a run is ten waves long (see CAMPAIGN_WAVES),
    // timed and tallied for the victory screen; endless is the post-win
    // free ride, where the campaign no longer ends.
    this.endless = false;
    this.runTime = 0;
    this.kills = 0;
    this.maxCombo = 0;
    this.score = 0;
    this.best = readBest();
    this.combo = 0;
    this.comboTime = 0;
    this.offers = [];
    this.hoveredOffer = -1;
    this.bannerText = '';
    this.bannerTime = 0;
    // Feedback layer (game-feel): trauma drives the screen shake, hit-stop
    // freezes the simulation for a breath, texts and rings are the pops.
    this.trauma = 0;
    this.hitStop = 0;
    this.texts = [];
    this.rings = [];
    this.hurtFlash = 0;
    this.wasPauseDown = false;
    this.wasMuteDown = false;
  }

  get enemiesLeft() {
    return this.enemies.length + this.director.pending;
  }

  startRun() {
    this.player = createPlayer();
    Object.assign(this.player, {
      fireRate: PLAYER_BASE.fireRate,
      bulletDamage: PLAYER_BASE.bulletDamage,
      speed: PLAYER_BASE.speed,
      magnetRadius: PLAYER_BASE.magnetRadius,
      dashCooldownMax: PLAYER_BASE.dashCooldown,
    });
    this.bullets = [];
    this.venom = [];
    this.enemies = [];
    this.particles = [];
    this.pickups = [];
    this.texts = [];
    this.rings = [];
    this.trauma = 0;
    this.hitStop = 0;
    this.hurtFlash = 0;
    this.score = 0;
    this.combo = 0;
    this.comboTime = 0;
    this.wave = 0;
    this.endless = false;
    this.runTime = 0;
    this.kills = 0;
    this.maxCombo = 0;
    this.nextWave();
    this.state = 'playing';
  }

  nextWave() {
    this.wave += 1;
    this.bossWave = this.director.startWave(this.wave, this.rng);
    this.finaleWave = isFinaleWave(this.wave);
    this.palette = paletteForWave(this.wave);
    this.bannerText = this.bossWave ? `WAVE ${this.wave} — ${waveIntroText(this.wave)}` : `WAVE ${this.wave}`;
    this.bannerTime = 1.9;
    if (this.bossWave) this.sfx.bossRoar();
    else this.sfx.waveStart();
  }

  update(dt) {
    this.time += dt;
    this.bannerTime = Math.max(0, this.bannerTime - dt);
    // The feedback layer ticks on real time, so a hit-stop freeze decays and
    // ends crisply instead of freezing the shake mid-frame with it.
    this.trauma = Math.max(0, this.trauma - dt * 1.7);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt * 1.9);
    this.updateTexts(dt);
    this.updateRings(dt);
    // Hit-stop: while the stop timer runs, the simulation crawls at 6%.
    let simDt = dt;
    if (this.hitStop > 0) {
      this.hitStop -= dt;
      simDt = dt * 0.06;
    }
    this.updateParticles(simDt);
    this.handleGlobalKeys();

    if (this.state === 'title') {
      if (this.input.clicked || this.input.confirmPressed) {
        this.sfx.unlock();
        this.startRun();
      }
      return;
    }
    if (this.state === 'gameover') {
      if (this.input.clicked || this.input.confirmPressed) {
        this.sfx.unlock();
        this.startRun();
      }
      return;
    }
    if (this.state === 'victory') {
      // Two ways on from the victory screen: R starts a fresh campaign,
      // a click (or Enter) keeps riding into endless waves.
      if (this.input.keys.has('KeyR')) {
        this.sfx.unlock();
        this.startRun();
      } else if (this.input.clicked || this.input.confirmPressed) {
        this.sfx.unlock();
        this.endless = true;
        this.nextWave();
        this.state = 'playing';
      }
      return;
    }
    if (this.state === 'upgrade') {
      this.updateUpgradeChoice();
      return;
    }
    if (this.state !== 'playing') return;

    this.runTime += dt;
    this.updatePlayer(simDt);
    this.updateSpawning(simDt);
    this.updateBullets(simDt);
    this.updateVenom(simDt);
    this.updateEnemies(simDt);
    this.updatePickups(simDt);
    this.updateCombo(simDt);

    if (this.director.doneSpawning && this.enemies.length === 0 && this.state === 'playing') {
      if (this.finaleWave && !this.endless) {
        // The tenth wave is cleared and the Goliath is down: the stand
        // is won. No upgrade draft — the victory screen is the reward.
        this.winRun();
      } else {
        this.offers = drawOffers(this.rng);
        this.state = 'upgrade';
        this.sfx.upgrade();
      }
    }
  }

  handleGlobalKeys() {
    const pauseDown = this.input.pausePressed;
    if (pauseDown && !this.wasPauseDown) {
      if (this.state === 'playing') this.state = 'paused';
      else if (this.state === 'paused') this.state = 'playing';
    }
    this.wasPauseDown = pauseDown;
    const muteDown = this.input.keys.has('KeyM');
    if (muteDown && !this.wasMuteDown) this.sfx.toggleMute();
    this.wasMuteDown = muteDown;
  }

  updatePlayer(dt) {
    const p = this.player;
    const axis = this.input.axis();
    p.moving = axis.x !== 0 || axis.y !== 0;
    if (p.moving) p.walkPhase += dt * 11;

    // Dash: a burst in the movement direction (or aim direction standing still).
    p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    p.dashTime = Math.max(0, p.dashTime - dt);
    if (this.input.dashHeld && p.dashCooldown <= 0 && p.dashTime <= 0) {
      const dx = p.moving ? axis.x : Math.cos(p.aimAngle);
      const dy = p.moving ? axis.y : Math.sin(p.aimAngle);
      p.dashX = dx;
      p.dashY = dy;
      p.dashTime = PLAYER_BASE.dashTime;
      p.dashCooldown = p.dashCooldownMax;
      p.invulnTime = Math.max(p.invulnTime, PLAYER_BASE.dashTime + 0.05);
      this.sfx.dash();
    }
    if (p.dashTime > 0) {
      p.vx = p.dashX * PLAYER_BASE.dashSpeed;
      p.vy = p.dashY * PLAYER_BASE.dashSpeed;
    } else {
      p.vx = axis.x * p.speed;
      p.vy = axis.y * p.speed;
    }
    p.x = clamp(p.x + p.vx * dt, WORLD.wall + p.radius, WORLD.width - WORLD.wall - p.radius);
    p.y = clamp(p.y + p.vy * dt, WORLD.wall + 40 + p.radius, WORLD.height - WORLD.wall - p.radius);
    p.invulnTime = Math.max(0, p.invulnTime - dt);

    // Aim at the mouse; keyboard-only players aim along their last move.
    const aimDx = this.input.mouse.x - p.x;
    const aimDy = this.input.mouse.y - p.y;
    if (Math.hypot(aimDx, aimDy) > 8) p.aimAngle = Math.atan2(aimDy, aimDx);

    // Shooting.
    p.fireCooldown = Math.max(0, p.fireCooldown - dt);
    if (this.input.firing && p.fireCooldown <= 0) {
      p.fireCooldown = 1 / p.fireRate;
      this.fireBullets();
      this.sfx.shoot();
    }
  }

  fireBullets() {
    const p = this.player;
    const spreadStep = 0.13;
    const start = p.aimAngle - spreadStep * ((p.projectiles - 1) / 2);
    for (let i = 0; i < p.projectiles; i += 1) {
      const angle = start + i * spreadStep;
      this.bullets.push(
        createBullet(p.x + Math.cos(angle) * 30, p.y + Math.sin(angle) * 30, angle, p.pierce, p.bulletDamage),
      );
    }
    // A one-particle muzzle spark: the smallest feedback tier, every shot.
    this.burst(p.x + Math.cos(p.aimAngle) * 40, p.y + Math.sin(p.aimAngle) * 40, '#fff3c4', 1, 90);
  }

  // --- Feedback helpers (game-feel): one place that fires each pop, so ---
  // --- every event in the game stays proportional to its importance.   ---

  addTrauma(amount) {
    // Hits add trauma; they never reset it, and it is capped at 1.
    this.trauma = Math.min(1, this.trauma + amount);
  }

  requestHitStop(seconds) {
    // Only the longest stop owns the restore; a newer small stop never
    // shortens a big one already running.
    if (seconds > this.hitStop) this.hitStop = seconds;
  }

  spawnText(x, y, text, color) {
    this.texts.push({ x, y, text, color, age: 0, life: 0.95 });
    if (this.texts.length > 14) this.texts.shift();
  }

  spawnRing(x, y, color, maxRadius) {
    this.rings.push({ x, y, color, maxRadius, age: 0, life: 0.45 });
  }

  updateTexts(dt) {
    for (const t of this.texts) {
      t.age += dt;
      t.y -= 46 * dt;
    }
    this.texts = this.texts.filter((t) => t.age < t.life);
  }

  updateRings(dt) {
    for (const ring of this.rings) ring.age += dt;
    this.rings = this.rings.filter((r) => r.age < r.life);
  }

  updateSpawning(dt) {
    const count = this.director.tick(dt, this.enemies.length);
    for (let i = 0; i < count; i += 1) {
      const kind = this.director.nextKind();
      if (!kind) break;
      const pos = spawnPosition(this.rng);
      this.enemies.push(createEnemy(kind, pos.x, pos.y, this.director.scaling, this.rng));
    }
  }

  updateBullets(dt) {
    for (const bullet of this.bullets) {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
      if (bullet.life <= 0 || bullet.x < -20 || bullet.x > WORLD.width + 20 || bullet.y < -20 || bullet.y > WORLD.height + 20) {
        bullet.dead = true;
        continue;
      }
      for (const enemy of this.enemies) {
        if (enemy.dead) continue;
        const dist = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
        if (dist > enemy.radius + bullet.radius) continue;
        enemy.hp -= bullet.damage;
        enemy.flashTime = 0.09;
        const knock = 130;
        enemy.knockX += (bullet.vx / 640) * knock;
        enemy.knockY += (bullet.vy / 640) * knock;
        this.burst(bullet.x, bullet.y, '#57c7e3', 3);
        if (enemy.hp <= 0) this.killEnemy(enemy);
        else this.sfx.enemyHit();
        if (bullet.pierce > 0) bullet.pierce -= 1;
        else bullet.dead = true;
        break;
      }
    }
    this.bullets = this.bullets.filter((b) => !b.dead);
  }

  // Venom globs fly straight; one that reaches the gunslinger bites like
  // a touch does — unless he is dashing or still reeling from the last hit.
  updateVenom(dt) {
    for (const venom of this.venom) {
      updateVenom(venom, dt);
      if (venom.dead) continue;
      const dist = Math.hypot(venom.x - this.player.x, venom.y - this.player.y);
      if (dist < venom.radius + this.player.radius - 2) {
        venom.dead = true;
        this.venomTouchesPlayer(venom);
      }
    }
    this.venom = this.venom.filter((v) => !v.dead);
  }

  venomTouchesPlayer(venom) {
    const p = this.player;
    this.burst(venom.x, venom.y, '#7fb069', 8);
    if (p.invulnTime > 0) return;
    p.hp -= venom.damage;
    p.invulnTime = 1.1;
    this.combo = 0;
    this.comboTime = 0;
    this.addTrauma(0.4);
    this.hurtFlash = 0.6;
    this.burst(p.x, p.y, '#7fb069', 12);
    this.sfx.playerHurt();
    if (p.hp <= 0) this.gameOver();
  }

  updateEnemies(dt) {
    const shakenLoose = [];
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      updateEnemy(enemy, this.player, dt);
      if (enemy.kind === 'goliath') this.updateGoliathEvents(enemy, shakenLoose);
      if (enemy.kind === 'rattlesnake') this.updateRattlesnakeEvents(enemy);
      const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
      if (dist < enemy.radius + this.player.radius - 4) {
        this.enemyTouchesPlayer(enemy);
      }
    }
    this.enemies.push(...shakenLoose);
    this.enemies = this.enemies.filter((e) => !e.dead);
  }

  // The rattlesnake raises spitReady (entities.js); the game answers by
  // launching the glob from the snake's head, aimed at the gunslinger.
  updateRattlesnakeEvents(enemy) {
    if (!enemy.spitReady) return;
    enemy.spitReady = false;
    const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
    this.venom.push(createVenom(enemy.x + Math.cos(angle) * 20, enemy.y + Math.sin(angle) * 20, angle));
    this.sfx.spit();
  }

  // The Goliath's script (entities.js) raises flags; the game answers
  // them here, where the sound, shake and spawner live: a roar and a
  // shudder when the telegraph starts (and again when phase 2 turns),
  // and for the stomp a dust ring, a heavier shake and two tumbleweeds
  // shaken loose beside the boss.
  updateGoliathEvents(enemy, shakenLoose) {
    if (enemy.roarReady) {
      enemy.roarReady = false;
      this.sfx.bossRoar();
      this.addTrauma(0.22);
      this.burst(enemy.x, enemy.y - enemy.radius, '#c98d54', 10, 170);
    }
    if (enemy.stompReady) {
      enemy.stompReady = false;
      this.sfx.stomp();
      this.addTrauma(0.38);
      this.spawnRing(enemy.x, enemy.y, '#c98d54', 110);
      this.burst(enemy.x, enemy.y + enemy.radius * 0.6, '#c98d54', 16, 300);
      for (const side of [-1, 1]) {
        shakenLoose.push(
          createEnemy(
            'tumbleweed',
            enemy.x + side * (enemy.radius + 26),
            enemy.y + 12,
            this.director.scaling,
            this.rng,
          ),
        );
      }
    }
  }

  enemyTouchesPlayer(enemy) {
    const p = this.player;
    // A dashing or freshly-hit player passes through unharmed.
    const angle = Math.atan2(p.y - enemy.y, p.x - enemy.x);
    enemy.knockX -= Math.cos(angle) * enemy.contactKnock;
    enemy.knockY -= Math.sin(angle) * enemy.contactKnock;
    if (p.invulnTime > 0) return;
    p.hp -= enemy.damage;
    p.invulnTime = 1.1;
    this.combo = 0;
    this.comboTime = 0;
    this.addTrauma(0.55);
    this.hurtFlash = 0.6;
    this.burst(p.x, p.y, '#ef476f', 14);
    this.sfx.playerHurt();
    if (p.hp <= 0) this.gameOver();
  }

  killEnemy(enemy) {
    enemy.dead = true;
    this.kills += 1;
    this.combo += 1;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    this.comboTime = COMBO.windowSeconds;
    const multiplier = Math.min(COMBO.maxMultiplier, 1 + Math.floor(this.combo / 6));
    this.score += enemy.score * multiplier;
    const colors = {
      tumbleweed: '#c98d54',
      scorpion: '#a4503f',
      buzzard: '#6b5b95',
      golem: '#9b7bc0',
      rattlesnake: '#7fb069',
      goliath: '#c77dff',
    };
    this.burst(enemy.x, enemy.y, colors[enemy.kind] || '#ffffff', enemy.kind === 'goliath' ? 46 : 13);
    // Feedback tier by enemy size: small kills pop lightly and often, the
    // golem thuds, the goliath stops the world for a breath.
    const big = enemy.kind === 'golem';
    const boss = enemy.kind === 'goliath';
    this.addTrauma(boss ? 0.85 : big ? 0.42 : 0.16);
    if (boss) this.requestHitStop(0.13);
    else if (big) this.requestHitStop(0.07);
    else if (this.hitStop <= 0) this.hitStop = 0.035;
    if (big || boss) this.spawnRing(enemy.x, enemy.y, colors[enemy.kind], boss ? 96 : 58);
    this.spawnText(enemy.x, enemy.y - 16, `+${enemy.score * multiplier}`, big || boss ? '#ffd166' : '#ffeedd');
    this.sfx.enemyDown();
    // Drops: water heals, stars pay. Goliaths always drop both.
    const roll = this.rng();
    if (enemy.kind === 'goliath' || roll < 0.1) this.pickups.push(createPickup('water', enemy.x, enemy.y));
    else if (roll < 0.3) this.pickups.push(createPickup('star', enemy.x, enemy.y));
  }

  updatePickups(dt) {
    for (const pickup of this.pickups) {
      updatePickup(pickup, this.player, dt);
      const dist = Math.hypot(pickup.x - this.player.x, pickup.y - this.player.y);
      if (dist < pickup.radius + this.player.radius) {
        pickup.dead = true;
        if (pickup.kind === 'water') {
          const healed = this.player.hp < this.player.maxHp;
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
          if (healed) this.spawnText(pickup.x, pickup.y - 14, '+1 HP', '#8ce99a');
        } else {
          this.score += 150;
          this.spawnText(pickup.x, pickup.y - 14, '+150', '#ffd166');
        }
        this.burst(pickup.x, pickup.y, pickup.kind === 'water' ? '#57c7e3' : '#ffd166', 7);
        this.sfx.pickup();
      }
    }
    this.pickups = this.pickups.filter((p) => !p.dead);
  }

  updateCombo(dt) {
    if (this.comboTime > 0) {
      this.comboTime -= dt;
      if (this.comboTime <= 0) this.combo = 0;
    }
  }

  updateParticles(dt) {
    for (const particle of this.particles) updateParticle(particle, dt);
    this.particles = this.particles.filter((p) => !p.dead);
  }

  burst(x, y, color, count, speedMax = 260) {
    this.particles.push(...createParticles(x, y, color, count, this.rng, speedMax));
    if (this.particles.length > 420) this.particles.splice(0, this.particles.length - 420);
  }

  updateUpgradeChoice() {
    const { mouse } = this.input;
    this.hoveredOffer = -1;
    this.offers.forEach((offer, i) => {
      const rect = upgradeCardRect(i);
      if (mouse.x >= rect.x && mouse.x <= rect.x + rect.w && mouse.y >= rect.y && mouse.y <= rect.y + rect.h) {
        this.hoveredOffer = i;
      }
    });
    let chosen = -1;
    if (this.input.clicked && this.hoveredOffer >= 0) chosen = this.hoveredOffer;
    if (this.input.keys.has('Digit1')) chosen = 0;
    if (this.input.keys.has('Digit2')) chosen = 1;
    if (this.input.keys.has('Digit3')) chosen = 2;
    if (chosen >= 0 && this.offers[chosen]) {
      this.offers[chosen].apply(this.player);
      this.offers = [];
      this.sfx.upgrade();
      this.nextWave();
      this.state = 'playing';
    }
  }

  winRun() {
    this.state = 'victory';
    if (this.score > this.best) {
      this.best = this.score;
      try {
        localStorage.setItem(BEST_KEY, String(this.best));
      } catch {
        // Storage may be unavailable; the win still counts.
      }
    }
    this.addTrauma(0.3);
    this.spawnRing(this.player.x, this.player.y, '#ffd166', 120);
    this.burst(this.player.x, this.player.y - 20, '#ffd166', 30, 320);
    this.sfx.victory();
  }

  gameOver() {
    this.state = 'gameover';
    if (this.score > this.best) {
      this.best = this.score;
      try {
        localStorage.setItem(BEST_KEY, String(this.best));
      } catch {
        // Storage may be unavailable; the run still counts.
      }
    }
    this.sfx.gameOver();
  }
}

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
