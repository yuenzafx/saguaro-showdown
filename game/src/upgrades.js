// Between-wave upgrades. Clearing a wave offers three of these, drawn at
// random; the player picks with the mouse or keys 1-3 and the run gets a
// little stronger — or a little stranger — every wave.

export const UPGRADES = [
  {
    id: 'rapid',
    name: 'Rapid Canteen',
    desc: 'Fire 25% faster. The desert respects a quick trigger.',
    color: '#57c7e3',
    apply(player) {
      player.fireRate *= 1.25;
    },
  },
  {
    id: 'twin',
    name: 'Twin Barrels',
    desc: '+1 droplet per shot, fanned out side by side.',
    color: '#ffd166',
    apply(player) {
      player.projectiles += 1;
    },
  },
  {
    id: 'calibre',
    name: 'Big Calibre Drops',
    desc: 'Droplets hit 40% harder and fly bigger.',
    color: '#ef476f',
    apply(player) {
      player.bulletDamage *= 1.4;
    },
  },
  {
    id: 'pierce',
    name: 'Through-and-Through',
    desc: 'Droplets pierce +1 enemy instead of popping.',
    color: '#c77dff',
    apply(player) {
      player.pierce += 1;
    },
  },
  {
    id: 'boots',
    name: 'Swift Boots',
    desc: 'Move 15% faster. Outrun the buzzards.',
    color: '#63c172',
    apply(player) {
      player.speed *= 1.15;
    },
  },
  {
    id: 'spurs',
    name: 'Silver Spurs',
    desc: 'Dash recharges 35% faster and feels snappier.',
    color: '#f4ead8',
    apply(player) {
      player.dashCooldownMax *= 0.65;
    },
  },
  {
    id: 'agave',
    name: 'Heart Agave',
    desc: '+1 max heart, and patch up 2 hearts right now.',
    color: '#ef476f',
    apply(player) {
      player.maxHp += 1;
      player.hp = Math.min(player.maxHp, player.hp + 2);
    },
  },
  {
    id: 'magnet',
    name: 'Lucky Horseshoe',
    desc: 'Pickups drift to you from 70% farther away.',
    color: '#e8b04b',
    apply(player) {
      player.magnetRadius *= 1.7;
    },
  },
];

export function drawOffers(rng, count = 3) {
  const pool = [...UPGRADES];
  const offers = [];
  while (offers.length < count && pool.length > 0) {
    const index = Math.floor(rng() * pool.length);
    offers.push(pool.splice(index, 1)[0]);
  }
  return offers;
}
