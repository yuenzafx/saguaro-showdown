// Central tuning for Saguaro Showdown: world size, palette, player stats and
// the numbers that make each wave harder than the one before.

export const WORLD = {
  width: 1280,
  height: 800,
  wall: 26, // playfield inset; the fence line enemies may not cross visually
};

export const PALETTE = {
  skyTop: '#2e1a47',
  skyMid: '#8a3b5e',
  skyLow: '#e2703a',
  sun: '#ffd98a',
  sunCore: '#fff3c4',
  mesaFar: '#6e3350',
  mesaNear: '#4c2340',
  ground: '#c97b4a',
  groundDark: '#a85f36',
  groundLight: '#e09a5f',
  fence: '#5d3a26',
  cactus: '#3f9e4d',
  cactusDark: '#2f7a3c',
  cactusLight: '#63c172',
  hat: '#e8b04b',
  hatBand: '#a03d2d',
  water: '#57c7e3',
  waterDark: '#2e86a8',
  heart: '#ef476f',
  star: '#ffd166',
  bone: '#f4ead8',
  ink: '#241019',
  cream: '#ffeedd',
};

export const PLAYER_BASE = {
  radius: 20,
  speed: 295,
  maxHp: 6,
  fireRate: 4.2, // shots per second
  bulletDamage: 1,
  bulletSpeed: 640,
  projectiles: 1,
  pierce: 0,
  dashCooldown: 2.4,
  dashTime: 0.16,
  dashSpeed: 980,
  magnetRadius: 74,
};

export const COMBO = {
  windowSeconds: 3.2,
  maxMultiplier: 8,
};

// Enemy blueprints. hp and speed are multiplied by the wave scaling below.
export const ENEMY_KINDS = {
  tumbleweed: { radius: 17, hp: 1, speed: 118, damage: 1, score: 40, contactKnock: 190 },
  scorpion: { radius: 19, hp: 3, speed: 92, damage: 1, score: 90, contactKnock: 230 },
  buzzard: { radius: 18, hp: 2, speed: 150, damage: 1, score: 120, contactKnock: 210 },
  golem: { radius: 34, hp: 14, speed: 46, damage: 2, score: 400, contactKnock: 330 },
  rattlesnake: { radius: 18, hp: 4, speed: 78, damage: 1, score: 160, contactKnock: 200 },
  goliath: { radius: 52, hp: 60, speed: 34, damage: 2, score: 2000, contactKnock: 420 },
};

// The rattlesnake's venom: the game's first ranged attack. The snake
// holds its distance, and inside VENOM.range it spits a glob that flies
// straight at where the gunslinger stands.
export const VENOM = {
  speed: 300,
  radius: 6,
  damage: 1,
  range: 430,
  keepDistance: 300,
  cooldownSeconds: 2.3,
  lifeSeconds: 1.8,
};

// The campaign: a finite stand of ten waves. Clear wave 10 — the Dusty
// Goliath's last duel — and the run is won; after the victory screen the
// player may keep riding into endless waves, but the story ends at ten.
export const CAMPAIGN_WAVES = 10;

// The light changes as the stand goes on: waves 1-3 are dawn, 4-7 full
// day, 8-10 the deep sundown the finale is fought under. Each stretch is a
// full backdrop palette; render.js draws whichever the current wave uses.
export const STRETCHES = [
  {
    name: 'dawn',
    throughWave: 3,
    skyTop: '#2e1a47',
    skyMid: '#8a3b5e',
    skyLow: '#e2703a',
    sun: '#ffd98a',
    mesaFar: '#6e3350',
    mesaNear: '#4c2340',
    ground: '#c97b4a',
    groundDark: '#a85f36',
    groundLight: '#e09a5f',
  },
  {
    name: 'day',
    throughWave: 7,
    skyTop: '#2b5f8f',
    skyMid: '#6fa8c8',
    skyLow: '#f2c078',
    sun: '#ffe9a8',
    mesaFar: '#7a5a68',
    mesaNear: '#5a4258',
    ground: '#d9905a',
    groundDark: '#b96f3e',
    groundLight: '#eda96c',
  },
  {
    name: 'sundown',
    throughWave: Infinity,
    skyTop: '#1c1038',
    skyMid: '#6e2547',
    skyLow: '#ff5a2a',
    sun: '#ffb35c',
    mesaFar: '#4a2140',
    mesaNear: '#33162e',
    ground: '#b06238',
    groundDark: '#8c4c2a',
    groundLight: '#cc8049',
  },
];

// The backdrop palette for a wave: the shared PALETTE with the stretch's
// sky, sun, mesa and ground colours laid over it.
export function paletteForWave(wave) {
  const stretch = STRETCHES.find((s) => wave <= s.throughWave) || STRETCHES[STRETCHES.length - 1];
  return { ...PALETTE, ...stretch };
}

export function waveScaling(wave) {
  return {
    hp: 1 + (wave - 1) * 0.16,
    speed: 1 + Math.min(0.5, (wave - 1) * 0.03),
  };
}

export function isBossWave(wave) {
  return wave % 5 === 0;
}

export function isFinaleWave(wave) {
  return wave === CAMPAIGN_WAVES;
}
