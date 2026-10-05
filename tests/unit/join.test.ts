import { describe, it, expect, vi } from "vitest";

vi.mock("../../src/services/firebaseAdmin", () => ({ adminDb: {}, adminAuth: {} }));

import { placeParticipant, JoinRequest } from "../../src/server/join";

const person = (over: Partial<JoinRequest> = {}): JoinRequest => ({
  name: "Ada Lovelace",
  email: "ada@example.com",
  isManager: false,
  ...over,
});

const roleEvent = () => ({
  type: "role-based",
  status: "open",
  groups: {
    group_1: [
      { id: "s1", number: 1, role: "Dev", name: "", email: "" },
      { id: "s2", number: 2, role: "PM", name: "Ben", email: "ben@example.com" },
    ],
    group_2: [
      { id: "s3", number: 1, role: "Dev", name: "Cy", email: "cy@example.com" },
      { id: "s4", number: 2, role: "PM", name: "", email: "" },
    ],
  },
});

const santaEvent = (count = 0, capacity = 3) => ({
  type: "secret-santa",
  status: "open",
  config: { allowWishlist: true, expectedParticipants: capacity },
  participants: Array.from({ length: count }, (_, i) => ({ id: `p${i}`, name: `P${i}`, email: `p${i}@example.com` })),
});

const pairEvent = (participants: object[] = []) => ({
  type: "secret-santa",
  status: "open",
  config: { allowWishlist: false, expectedParticipants: 4 },
  participants,
});

const positions = (mode: string, participants: object[] = [], capacity = 3) => ({
  type: "random-positioning",
  status: "open",
  assignmentMode: mode,
  expectedParticipants: capacity,
  participants,
});

describe("joining any event", () => {
  it("refuses a closed event", () => {
    expect(() => placeParticipant({ ...santaEvent(), status: "locked" }, person())).toThrow(/closed/i);
  });

  it("refuses an email that is already registered, whatever its letter case", () => {
    const event = santaEvent(1);
    expect(() => placeParticipant(event, person({ email: "p0@example.com" }))).toThrowError(
      expect.objectContaining({ code: "DUPLICATE" })
    );
  });

  it("gives every participant a private access token", () => {
    const { participant } = placeParticipant(santaEvent(), person());
    expect(participant.accessToken).toMatch(/^[0-9a-f]{36}$/);
  });
});

describe("role-based events", () => {
  it("places the person in a free slot for the role they chose", () => {
    const placement = placeParticipant(roleEvent(), person({ track: "dev" }));
    expect(placement.groupKey).toBe("group_1");
    expect(placement.participant.id).toBe("s1");
    expect(placement.isFull).toBe(true); // group_1 is now complete
  });

  it("says so when the chosen role has no free slot", () => {
    const event = roleEvent();
    event.groups.group_1[0].name = "Taken";
    expect(() => placeParticipant(event, person({ track: "Dev" }))).toThrowError(
      expect.objectContaining({ code: "EVENT_FULL", message: "No slots are left for that role." })
    );
  });

  it("does not let two people take the same slot", () => {
    const event = roleEvent();
    placeParticipant(event, person({ track: "Dev" }));
    expect(() => placeParticipant(event, person({ email: "other@example.com", track: "Dev" }))).toThrowError(
      expect.objectContaining({ code: "EVENT_FULL" })
    );
  });

  it("refuses a duplicate email across groups", () => {
    expect(() => placeParticipant(roleEvent(), person({ email: "CY@example.com".toLowerCase() }))).toThrowError(
      expect.objectContaining({ code: "DUPLICATE" })
    );
  });
});

describe("Secret Santa and pair events", () => {
  it("stops at the event's capacity", () => {
    expect(() => placeParticipant(santaEvent(3, 3), person())).toThrowError(expect.objectContaining({ code: "EVENT_FULL" }));
  });

  it("reports the event as full when the last place is taken", () => {
    expect(placeParticipant(santaEvent(2, 3), person()).isFull).toBe(true);
    expect(placeParticipant(santaEvent(1, 3), person()).isFull).toBe(false);
  });

  it("keeps the wishlist only for real Secret Santa events", () => {
    expect(placeParticipant(santaEvent(), person({ wishlist: "Books" })).participant.wishlist).toBe("Books");
    const pair = placeParticipant(pairEvent(), person({ wishlist: "Books", pairIndex: 0, positionLetter: "a" }));
    expect(pair.participant).toMatchObject({ wishlist: "", pairIndex: 0, positionLetter: "A" });
  });

  it("requires participants to pick a pair slot, and rejects a taken or invalid one", () => {
    const taken = [{ id: "x", name: "X", email: "x@example.com", pairIndex: 0, positionLetter: "A" }];
    expect(() => placeParticipant(pairEvent(), person())).toThrow(/choose a slot/i);
    expect(() => placeParticipant(pairEvent(taken), person({ pairIndex: 0, positionLetter: "A" }))).toThrowError(
      expect.objectContaining({ code: "SLOT_TAKEN" })
    );
    expect(() => placeParticipant(pairEvent(), person({ pairIndex: 9, positionLetter: "A" }))).toThrow(/does not exist/);
  });

  it("gives an organizer import the first free pair slot", () => {
    const taken = [{ id: "x", name: "X", email: "x@example.com", pairIndex: 0, positionLetter: "A" }];
    const { participant } = placeParticipant(pairEvent(taken), person({ isManager: true }));
    expect(participant).toMatchObject({ pairIndex: 0, positionLetter: "B" });
  });
});

describe("random positioning", () => {
  const one = [{ id: "x", name: "X", email: "x@example.com", assignedNumber: 1 }];

  it("accepts the number a participant picks, unless it is taken or out of range", () => {
    expect(placeParticipant(positions("participants-pick", one), person({ assignedNumber: 2 })).participant.assignedNumber).toBe(2);
    expect(() => placeParticipant(positions("participants-pick", one), person({ assignedNumber: 1 }))).toThrowError(
      expect.objectContaining({ code: "SLOT_TAKEN" })
    );
    expect(() => placeParticipant(positions("participants-pick"), person({ assignedNumber: 7 }))).toThrow(/choose a position/i);
    expect(() => placeParticipant(positions("participants-pick"), person())).toThrow(/choose a position/i);
  });

  it("gives the lowest free number in first-come mode", () => {
    expect(placeParticipant(positions("fcfs", one), person()).participant.assignedNumber).toBe(2);
  });

  it("gives some free number in random mode", () => {
    const n = placeParticipant(positions("random", one), person()).participant.assignedNumber;
    expect([2, 3]).toContain(n);
  });

  it("leaves organizer imports unassigned until positions are generated", () => {
    expect(placeParticipant(positions("participants-pick"), person({ isManager: true })).participant.assignedNumber).toBeUndefined();
  });

  it("stops at the event's capacity", () => {
    const fullList = [1, 2, 3].map((n) => ({ id: `p${n}`, name: `P${n}`, email: `p${n}@example.com`, assignedNumber: n }));
    expect(() => placeParticipant(positions("fcfs", fullList), person())).toThrowError(expect.objectContaining({ code: "EVENT_FULL" }));
  });
});
