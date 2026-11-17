// A small seeded random generator so screenshot scenes and wave layouts can
// be reproduced exactly, plus the range/pick helpers every system shares.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function range(rng, min, max) {
  return min + rng() * (max - min);
}

export function rangeInt(rng, min, max) {
  return Math.floor(range(rng, min, max + 1));
}

export function pick(rng, items) {
  return items[Math.floor(rng() * items.length) % items.length];
}

export function chance(rng, probability) {
  return rng() < probability;
}

// The live game runs on Math.random; scenes swap in a seeded source.
export const liveRng = () => Math.random();
