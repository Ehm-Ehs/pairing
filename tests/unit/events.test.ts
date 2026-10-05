import { describe, it, expect, vi } from "vitest";

vi.mock("../../src/services/firebaseAdmin", () => ({ adminDb: {}, adminAuth: {} }));

import { describeAssignment, findByEmail, findByToken, isSecretDraw, sanitizeEvent } from "../../src/server/events";

const santaEvent = {
  id: "e1",
  type: "secret-santa",
  title: "Office Santa",
  status: "locked",
  ownerId: "owner",
  config: { allowWishlist: true, expectedParticipants: 3, exclusions: [{ a: "1", b: "2" }] },
  participants: [
    { id: "1", name: "Ada", email: "ada@example.com", phone: "0801", wishlist: "Books", accessToken: "tok-ada" },
    { id: "2", name: "Ben", email: "ben@example.com", wishlist: "Socks", accessToken: "tok-ben" },
    { id: "3", name: "Cy", email: "cy@example.com", wishlist: "Tea", accessToken: "tok-cy" },
  ],
  pairs: [
    { santaId: "1", receiverId: "3" },
    { santaId: "3", receiverId: "2" },
    { santaId: "2", receiverId: "1" },
  ],
};

const roleEvent = {
  id: "e2",
  type: "role-based",
  title: "Hackathon",
  groups: {
    group_1: [
      { id: "s1", number: 1, role: "Dev", name: "Ada", email: "ada@example.com", accessToken: "tok-ada" },
      { id: "s2", number: 2, role: "PM", name: "", email: "" },
    ],
  },
};

describe("sanitizeEvent (what the public can see)", () => {
  it("removes contact details, wishlists, tokens, exclusions and the draw", () => {
    const text = JSON.stringify(sanitizeEvent(santaEvent));
    for (const secret of ["ada@example.com", "0801", "Books", "tok-ada", "exclusions", "santaId", "receiverId"]) {
      expect(text).not.toContain(secret);
    }
  });

  it("keeps names and slot layout so join pages still work", () => {
    const pub = sanitizeEvent(santaEvent);
    expect(pub.participants.map((p: any) => p.name)).toEqual(["Ada", "Ben", "Cy"]);
    expect(pub.hasDraw).toBe(true);
    expect(pub.config.expectedParticipants).toBe(3);

    const pubRole = sanitizeEvent(roleEvent);
    expect(pubRole.groups.group_1).toEqual([
      { id: "s1", number: 1, role: "Dev", name: "Ada" },
      { id: "s2", number: 2, role: "PM", name: "" },
    ]);
  });
});

describe("describeAssignment (what one participant can see)", () => {
  it("shows a Secret Santa only their own receiver", () => {
    const ada = findByToken(santaEvent, "tok-ada")!;
    const view = describeAssignment(santaEvent, ada);
    expect(view).toMatchObject({ kind: "secret-santa", drawn: true, receiver: { name: "Cy", wishlist: "Tea" } });
    expect(JSON.stringify(view)).not.toContain("Ben");
  });

  it("reports an undrawn event as not drawn", () => {
    const open = { ...santaEvent, status: "open", pairs: undefined };
    const view = describeAssignment(open, findByToken(open, "tok-ben")!);
    expect(view).toMatchObject({ kind: "secret-santa", drawn: false, receiver: null });
  });

  it("shows a group member their group without contact details", () => {
    const view = describeAssignment(roleEvent, findByEmail(roleEvent, "ADA@example.com")!);
    expect(view).toMatchObject({ kind: "group", groupKey: "group_1", role: "Dev", members: [{ name: "Ada", role: "Dev" }] });
    expect(JSON.stringify(view)).not.toContain("example.com");
  });
});

describe("participant lookup", () => {
  it("rejects unknown or empty tokens", () => {
    expect(findByToken(santaEvent, "nope")).toBeNull();
    expect(findByToken(santaEvent, "")).toBeNull();
  });

  it("does not treat empty role-based slots as participants", () => {
    expect(findByEmail(roleEvent, "")).toBeNull();
  });

  it("treats only wishlist events as secret draws", () => {
    expect(isSecretDraw(santaEvent)).toBe(true);
    expect(isSecretDraw({ type: "secret-santa", config: { allowWishlist: false } })).toBe(false);
    expect(isSecretDraw(roleEvent)).toBe(false);
  });
});
