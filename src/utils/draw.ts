/**
 * Pure draw algorithms shared by the server and tests.
 * Randomness is injectable so the logic can be tested deterministically.
 */

export type Rng = () => number;

/** Cryptographically strong random number in [0, 1). Works in Node and browsers. */
export const secureRandom: Rng = () => {
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  return buffer[0] / 2 ** 32;
};

/** Unbiased Fisher-Yates shuffle. Returns a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng = secureRandom): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export interface SantaPair {
  santaId: string;
  receiverId: string;
}

export type Exclusion = [string, string];

function exclusionKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Draws Secret Santa pairs: everyone gives once and receives once, nobody draws
 * themselves, and no excluded pair draws each other in either direction.
 * Throws if the exclusions make a valid draw impossible.
 */
export function drawSecretSanta(
  ids: readonly string[],
  exclusions: readonly Exclusion[] = [],
  rng: Rng = secureRandom
): SantaPair[] {
  const unique = Array.from(new Set(ids));
  if (unique.length < 2) {
    throw new Error("Not enough participants to generate pairs");
  }

  const blocked = new Set(exclusions.map(([a, b]) => exclusionKey(a, b)));
  const allowed = (santa: string, receiver: string) =>
    santa !== receiver && !blocked.has(exclusionKey(santa, receiver));

  // Preferred: one random gift circle, which is uniform and avoids tiny closed loops.
  for (let attempt = 0; attempt < 200; attempt++) {
    const order = shuffle(unique, rng);
    const ok = order.every((santa, i) => allowed(santa, order[(i + 1) % order.length]));
    if (ok) {
      return order.map((santa, i) => ({ santaId: santa, receiverId: order[(i + 1) % order.length] }));
    }
  }

  // Fallback: randomized bipartite matching, which finds a valid draw whenever one exists.
  const santas = shuffle(unique, rng);
  const receiverOf = new Map<string, string>();
  const santaOf = new Map<string, string>();

  const tryAssign = (santa: string, visited: Set<string>): boolean => {
    for (const receiver of shuffle(unique, rng)) {
      if (!allowed(santa, receiver) || visited.has(receiver)) continue;
      visited.add(receiver);
      const current = santaOf.get(receiver);
      if (current === undefined || tryAssign(current, visited)) {
        santaOf.set(receiver, santa);
        receiverOf.set(santa, receiver);
        return true;
      }
    }
    return false;
  };

  for (const santa of santas) {
    if (!tryAssign(santa, new Set())) {
      throw new Error("The exclusion rules make a valid draw impossible. Remove an exclusion and try again.");
    }
  }

  return unique.map((santa) => ({ santaId: santa, receiverId: receiverOf.get(santa)! }));
}

/** Returns the numbers 1..count in random order. */
export function randomPositions(count: number, rng: Rng = secureRandom): number[] {
  return shuffle(
    Array.from({ length: count }, (_, i) => i + 1),
    rng
  );
}
