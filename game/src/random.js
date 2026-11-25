// Sizzle Station — seeded random numbers.
//
// A tiny deterministic RNG (mulberry32) so screenshot stages and the
// kitchen's order flow can be reproduced from a single seed. Gameplay
// uses a seed taken from the clock; screenshot mode passes a fixed one.

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

// A small helper object that wraps a generator with the helpers the
// kitchen uses: integers in a range, picking from a list, chance rolls.
export function makeRng(seed) {
  const next = mulberry32(seed);
  return {
    next,
    int(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    pick(list) {
      return list[Math.floor(next() * list.length)];
    },
    chance(p) {
      return next() < p;
    },
  };
}

// Pick several distinct entries from a list, in random order.
export function pickDistinct(rng, list, count) {
  const copy = list.slice();
  const out = [];
  while (copy.length > 0 && out.length < count) {
    const at = Math.floor(rng.next() * copy.length);
    out.push(copy.splice(at, 1)[0]);
  }
  return out;
}

// Fisher-Yates shuffle that returns a new array, leaving the input alone.
export function shuffled(rng, list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}
