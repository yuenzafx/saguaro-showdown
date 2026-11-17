// The wave director: builds each wave's spawn queue from its number, so
// early waves teach one enemy at a time and later waves mix everything.
// Boss waves trade the crowd for one goliath plus a trickle of weeds.
// The campaign runs ten waves (see CAMPAIGN_WAVES in config.js); past
// wave 10 the same director keeps dealing endless waves for riders who
// choose to keep going after the victory screen.

import { isBossWave, isFinaleWave, waveScaling } from './config.js';

export function buildWaveQueue(wave, rng) {
  const scaling = waveScaling(wave);
  const queue = [];
  const push = (kind, count) => {
    for (let i = 0; i < count; i += 1) queue.push(kind);
  };

  if (isBossWave(wave)) {
    push('goliath', 1);
    push('tumbleweed', 4 + wave / 5);
    push('scorpion', wave / 5);
    return { queue: shuffle(queue, rng), scaling, boss: true };
  }

  push('tumbleweed', Math.min(4 + wave * 2, 16));
  if (wave >= 2) push('scorpion', Math.min(2 + wave, 12));
  if (wave >= 3) push('buzzard', Math.min(wave, 10));
  if (wave >= 4) push('golem', Math.min(Math.floor(wave / 2), 5));
  if (wave >= 6) push('rattlesnake', Math.min(wave - 4, 6));
  return { queue: shuffle(queue, rng), scaling, boss: false };
}

function shuffle(items, rng) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export class WaveDirector {
  constructor() {
    this.queue = [];
    this.scaling = { hp: 1, speed: 1 };
    this.spawnTimer = 0;
    this.boss = false;
  }

  startWave(wave, rng) {
    const built = buildWaveQueue(wave, rng);
    this.queue = built.queue;
    this.scaling = built.scaling;
    this.boss = built.boss;
    this.spawnTimer = 0.4;
    return this.boss;
  }

  // Returns how many enemies to spawn this frame (0, 1 or 2).
  tick(dt, aliveCount) {
    if (this.queue.length === 0) return 0;
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return 0;
    const crowded = aliveCount >= 14;
    this.spawnTimer = crowded ? 1.1 : 0.55;
    return this.queue.length > 6 && !crowded ? 2 : 1;
  }

  nextKind() {
    return this.queue.shift();
  }

  get pending() {
    return this.queue.length;
  }

  get doneSpawning() {
    return this.queue.length === 0;
  }
}

export function waveIntroText(wave) {
  if (isFinaleWave(wave)) return 'The Dusty Goliath rides in for the last duel!';
  if (isBossWave(wave)) return 'The Dusty Goliath rides in!';
  const lines = {
    1: 'Tumbleweeds rolling in...',
    2: 'Scorpions skitter from the rocks!',
    3: 'Buzzards circle overhead!',
    4: 'Something big shakes the ground...',
    6: 'The herd stampedes at high noon!',
    7: 'Buzzards blot out the sun!',
    8: 'Sundown — the desert turns red...',
    9: 'One more wave before the duel!',
  };
  return lines[wave] || `Wave ${wave} — the desert gets meaner`;
}
