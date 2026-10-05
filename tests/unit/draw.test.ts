import { describe, it, expect } from "vitest";
import { drawSecretSanta, randomPositions, shuffle, Exclusion } from "../../src/utils/draw";

/** Deterministic pseudo-random generator so failures are reproducible. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
}

const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);

describe("shuffle", () => {
  it("keeps every item exactly once and does not mutate the input", () => {
    const input = ids(50);
    const copy = [...input];
    const result = shuffle(input, seeded(1));
    expect(input).toEqual(copy);
    expect([...result].sort()).toEqual([...input].sort());
  });

  it("is roughly uniform: each item lands in each position about equally often", () => {
    const rng = seeded(42);
    const counts = [0, 0, 0];
    const runs = 6000;
    for (let i = 0; i < runs; i++) counts[shuffle(["a", "b", "c"], rng).indexOf("a")]++;
    for (const c of counts) expect(Math.abs(c - runs / 3)).toBeLessThan(runs * 0.05);
  });
});

describe("drawSecretSanta", () => {
  it("gives everyone exactly one receiver and nobody draws themselves", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const people = ids(7);
      const pairs = drawSecretSanta(people, [], seeded(seed));
      expect(pairs).toHaveLength(people.length);
      expect(new Set(pairs.map((p) => p.santaId)).size).toBe(people.length);
      expect(new Set(pairs.map((p) => p.receiverId)).size).toBe(people.length);
      for (const p of pairs) expect(p.santaId).not.toBe(p.receiverId);
    }
  });

  it("never pairs excluded people in either direction", () => {
    const people = ids(6);
    const exclusions: Exclusion[] = [
      ["p0", "p1"],
      ["p2", "p3"],
      ["p4", "p5"],
    ];
    for (let seed = 1; seed <= 100; seed++) {
      const pairs = drawSecretSanta(people, exclusions, seeded(seed));
      for (const [a, b] of exclusions) {
        expect(pairs).not.toContainEqual({ santaId: a, receiverId: b });
        expect(pairs).not.toContainEqual({ santaId: b, receiverId: a });
      }
    }
  });

  it("still finds a draw when exclusions leave very few options", () => {
    // p0 may only draw p3; the single-circle attempt often fails, the matching fallback must succeed.
    const people = ids(4);
    const exclusions: Exclusion[] = [
      ["p0", "p1"],
      ["p0", "p2"],
    ];
    const pairs = drawSecretSanta(people, exclusions, seeded(7));
    expect(pairs.find((p) => p.santaId === "p0")?.receiverId).toBe("p3");
    expect(new Set(pairs.map((p) => p.receiverId)).size).toBe(4);
  });

  it("fails clearly when the exclusions make a draw impossible", () => {
    expect(() => drawSecretSanta(["a", "b"], [["a", "b"]], seeded(1))).toThrow(/impossible/i);
  });

  it("needs at least two participants", () => {
    expect(() => drawSecretSanta(["a"])).toThrow(/Not enough participants/);
  });
});

describe("randomPositions", () => {
  it("returns each number from 1 to n once", () => {
    expect(randomPositions(10, seeded(3)).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});
