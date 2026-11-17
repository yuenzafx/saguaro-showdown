// Factories and per-frame movement for everything that moves: the cactus
// gunslinger, its water-droplet bullets, the enemy kinds (including the
// Dusty Goliath's scripted duel of stalk, telegraph, charge and stomp),
// particles and pickups. Drawing lives in render.js; rules and collisions
// in game.js.

import { ENEMY_KINDS, VENOM, WORLD } from './config.js';
import { range } from './random.js';

export function createPlayer() {
  return {
    x: WORLD.width / 2,
    y: WORLD.height / 2 + 60,
    vx: 0,
    vy: 0,
    radius: 20,
    hp: 6,
    maxHp: 6,
    aimAngle: -Math.PI / 2,
    fireCooldown: 0,
    projectiles: 1,
    pierce: 0,
    bulletDamage: 1,
    fireRate: 4.2,
    speed: 295,
    magnetRadius: 74,
    dashCooldownMax: 2.4,
    dashCooldown: 0,
    dashTime: 0,
    invulnTime: 0,
    walkPhase: 0,
  };
}

export function createBullet(x, y, angle, pierce, damage) {
  const speed = 640;
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 7,
    pierce,
    damage,
    life: 1.1,
    dead: false,
  };
}

// A rattlesnake's venom glob: slower than a water droplet, aimed once at
// the gunslinger's position when spat, and gone after a short flight.
export function createVenom(x, y, angle) {
  return {
    x,
    y,
    vx: Math.cos(angle) * VENOM.speed,
    vy: Math.sin(angle) * VENOM.speed,
    radius: VENOM.radius,
    damage: VENOM.damage,
    life: VENOM.lifeSeconds,
    dead: false,
  };
}

export function updateVenom(venom, dt) {
  venom.x += venom.vx * dt;
  venom.y += venom.vy * dt;
  venom.life -= dt;
  if (venom.life <= 0 || venom.x < -24 || venom.x > WORLD.width + 24 || venom.y < -24 || venom.y > WORLD.height + 24) {
    venom.dead = true;
  }
}

const SPAWN_MARGIN = 46;

export function spawnPosition(rng) {
  // Enemies ride in from just outside one of the four fence lines.
  const side = Math.floor(rng() * 4);
  if (side === 0) return { x: range(rng, 40, WORLD.width - 40), y: -SPAWN_MARGIN };
  if (side === 1) return { x: WORLD.width + SPAWN_MARGIN, y: range(rng, 60, WORLD.height - 40) };
  if (side === 2) return { x: range(rng, 40, WORLD.width - 40), y: WORLD.height + SPAWN_MARGIN };
  return { x: -SPAWN_MARGIN, y: range(rng, 60, WORLD.height - 40) };
}

export function createEnemy(kind, x, y, scaling, rng) {
  const base = ENEMY_KINDS[kind];
  const hp = Math.max(1, Math.round(base.hp * scaling.hp));
  return {
    kind,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: base.radius,
    hp,
    maxHp: hp,
    speed: base.speed * scaling.speed * range(rng, 0.88, 1.12),
    damage: base.damage,
    score: base.score,
    contactKnock: base.contactKnock,
    wobbleSeed: rng() * Math.PI * 2,
    age: 0,
    flashTime: 0,
    knockX: 0,
    knockY: 0,
    diveState: 'enter', // buzzards: enter, circle, dive
    diveTime: range(rng, 0.8, 1.8),
    // Rattlesnakes: the spit timer and the flag game.js answers by
    // launching a venom glob (see createVenom below).
    spitTime: range(rng, 1.2, 2.2),
    spitReady: false,
    // The Dusty Goliath's duel script (goliaths only): it stalks, winds
    // up with a trembling telegraph, charges in a locked line, then
    // stomps — and under half health its second phase runs the whole
    // cycle faster and meaner. game.js reads the roarReady/stompReady
    // flags to fire the sound, shake and tumbleweed spawns.
    goliathState: 'stalk', // stalk, windup, charge, stomp, recover
    stateTime: 1.6,
    chargeX: 0,
    chargeY: 0,
    phase2: false,
    roarReady: false,
    stompReady: false,
    dead: false,
  };
}

export function updateEnemy(enemy, player, dt) {
  enemy.age += dt;
  enemy.flashTime = Math.max(0, enemy.flashTime - dt);
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;
  let moveX = nx;
  let moveY = ny;
  let speed = enemy.speed;

  if (enemy.kind === 'tumbleweed') {
    // Rolls straight at the player, bobbing as it goes.
    moveY += Math.sin(enemy.age * 6 + enemy.wobbleSeed) * 0.18;
  } else if (enemy.kind === 'scorpion') {
    // Skitters side to side while it closes in.
    const side = Math.sin(enemy.age * 3.4 + enemy.wobbleSeed);
    moveX += -ny * side * 0.55;
    moveY += nx * side * 0.55;
  } else if (enemy.kind === 'buzzard') {
    enemy.diveTime -= dt;
    if (enemy.diveState === 'enter' && dist < 330) enemy.diveState = 'circle';
    if (enemy.diveState === 'circle') {
      moveX += -ny * 0.9;
      moveY += nx * 0.9;
      speed *= 0.8;
      if (enemy.diveTime <= 0) {
        enemy.diveState = 'dive';
        enemy.diveTime = 0.55;
      }
    } else if (enemy.diveState === 'dive') {
      speed *= 2.15;
      if (enemy.diveTime <= 0) {
        enemy.diveState = 'circle';
        enemy.diveTime = 1 + Math.random() * 1.2;
      }
    }
  } else if (enemy.kind === 'rattlesnake') {
    // Holds its striking distance: closes in from afar, backs off when
    // crowded, and otherwise slides sideways along its arc, spitting
    // whenever its timer runs out inside venom range.
    enemy.spitTime -= dt;
    if (enemy.spitTime <= 0 && dist < VENOM.range) {
      enemy.spitReady = true;
      enemy.spitTime = VENOM.cooldownSeconds * (0.85 + Math.random() * 0.3);
    }
    const band = 34;
    let radial = 0;
    if (dist > VENOM.keepDistance + band) radial = 1;
    else if (dist < VENOM.keepDistance - band) radial = -1;
    const side = Math.sin(enemy.age * 1.7 + enemy.wobbleSeed) > 0 ? 1 : -1;
    moveX = nx * radial + -ny * side * (radial === 0 ? 0.55 : 0.15);
    moveY = ny * radial + nx * side * (radial === 0 ? 0.55 : 0.15);
  } else if (enemy.kind === 'golem') {
    // Slow and relentless; every few seconds it stamps and lurches forward.
    const cycle = enemy.age % 3.4;
    if (cycle > 2.9) speed *= 2.5;
  } else if (enemy.kind === 'goliath') {
    const duel = updateGoliath(enemy, player, dt, dist);
    moveX = duel.x;
    moveY = duel.y;
    speed = duel.speed;
  }

  const len = Math.hypot(moveX, moveY) || 1;
  enemy.vx = (moveX / len) * speed + enemy.knockX;
  enemy.vy = (moveY / len) * speed + enemy.knockY;
  enemy.knockX *= Math.pow(0.0001, dt);
  enemy.knockY *= Math.pow(0.0001, dt);
  enemy.x += enemy.vx * dt;
  enemy.y += enemy.vy * dt;
}

// --- The Dusty Goliath's duel -------------------------------------------
// One cycle: stalk the gunslinger, wind up (the telegraph: it plants its
// feet, trembles and roars while the charge line is drawn on the dust),
// charge in that locked line, stomp hard enough to shake two tumbleweeds
// loose, then recover and stalk again. The second phase, below half
// health, shortens every beat and charges faster. Returns the movement
// vector and speed updateEnemy should apply this frame.
export function updateGoliath(enemy, player, dt, dist) {
  if (!enemy.phase2 && enemy.hp <= enemy.maxHp / 2) {
    enemy.phase2 = true;
    enemy.roarReady = true; // the phase turn gets the full roar
  }
  enemy.stateTime -= dt;
  const stalkSeconds = enemy.phase2 ? 1.7 : 2.6;

  if (enemy.goliathState === 'stalk') {
    if (enemy.stateTime <= 0 && dist < 560) {
      // Lock the charge line on the player and start the telegraph.
      const len = dist || 1;
      enemy.chargeX = (player.x - enemy.x) / len;
      enemy.chargeY = (player.y - enemy.y) / len;
      enemy.goliathState = 'windup';
      enemy.stateTime = enemy.phase2 ? 0.45 : 0.6;
      enemy.roarReady = true;
    }
    return { x: (player.x - enemy.x) / (dist || 1), y: (player.y - enemy.y) / (dist || 1), speed: enemy.speed };
  }

  if (enemy.goliathState === 'windup') {
    // Planted and trembling; render.js shakes it and draws the dust lane.
    if (enemy.stateTime <= 0) {
      enemy.goliathState = 'charge';
      enemy.stateTime = 0.55;
    }
    return { x: 0, y: 0, speed: 0 };
  }

  if (enemy.goliathState === 'charge') {
    const charge = goliathCharge(enemy);
    if (enemy.stateTime <= 0) goliathStomp(enemy);
    return charge;
  }

  if (enemy.goliathState === 'stomp') {
    if (enemy.stateTime <= 0) {
      enemy.goliathState = 'recover';
      enemy.stateTime = 0.7;
    }
    return { x: 0, y: 0, speed: 0 };
  }

  // recover: a slow, dazed drift before the next stalk.
  if (enemy.stateTime <= 0) {
    enemy.goliathState = 'stalk';
    enemy.stateTime = stalkSeconds;
  }
  return {
    x: (player.x - enemy.x) / (dist || 1),
    y: (player.y - enemy.y) / (dist || 1),
    speed: enemy.speed * 0.4,
  };
}

// The charge itself: full speed along the line locked at the windup,
// 3.2x the stalk pace — 3.8x in the second phase.
export function goliathCharge(enemy) {
  const multiplier = enemy.phase2 ? 3.8 : 3.2;
  return { x: enemy.chargeX, y: enemy.chargeY, speed: enemy.speed * multiplier };
}

// The stomp that ends each charge: the Goliath stops dead and slams the
// ground. game.js sees stompReady and answers with the dust ring, the
// screen shake and two tumbleweeds shaken loose from the rocks.
export function goliathStomp(enemy) {
  enemy.goliathState = 'stomp';
  enemy.stateTime = 0.45;
  enemy.stompReady = true;
}

export function createParticles(x, y, color, count, rng, speedMax = 260) {
  const particles = [];
  for (let i = 0; i < count; i += 1) {
    const angle = rng() * Math.PI * 2;
    const speed = 40 + rng() * speedMax;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 30,
      radius: 2 + rng() * 4,
      color,
      life: 0.35 + rng() * 0.45,
      maxLife: 0.8,
      dead: false,
    });
  }
  return particles;
}

export function updateParticle(particle, dt) {
  particle.life -= dt;
  if (particle.life <= 0) {
    particle.dead = true;
    return;
  }
  particle.vy += 320 * dt;
  particle.x += particle.vx * dt;
  particle.y += particle.vy * dt;
}

// Pickups: water drops patch the player up, star badges are pure score and
// both drift toward the player inside the magnet radius.
export function createPickup(kind, x, y) {
  return { kind, x, y, vx: 0, vy: 0, radius: kind === 'water' ? 13 : 11, age: 0, dead: false };
}

export function updatePickup(pickup, player, dt) {
  pickup.age += dt;
  const dx = player.x - pickup.x;
  const dy = player.y - pickup.y;
  const dist = Math.hypot(dx, dy) || 1;
  if (dist < player.magnetRadius) {
    const pull = 340 * (1 - dist / player.magnetRadius) + 60;
    pickup.vx = (dx / dist) * pull;
    pickup.vy = (dy / dist) * pull;
  } else {
    pickup.vx *= 0.8;
    pickup.vy *= 0.8;
  }
  pickup.x += pickup.vx * dt;
  pickup.y += pickup.vy * dt;
}
