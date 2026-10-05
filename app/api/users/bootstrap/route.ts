import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { adminDb } from "@/services/firebaseAdmin";
import { isAnonymous, requireUser } from "@/server/auth";
import { readJson, route, str } from "@/server/http";
import { ensureLedger, ensurePersonalGrant } from "@/server/ledger";
import { migrateLegacyPairings } from "@/server/events";
import { sendEmail } from "@/server/messaging";
import { getWelcomeEmail } from "@/services/emailTemplates";

/**
 * Called by the browser right after Firebase sign-up or sign-in.
 * Creates the profile and the free token grant on the server (so balances and roles
 * can never be set from the browser), moves any legacy events into the Pairings
 * collection, and sends the welcome email for new accounts.
 */
export const POST = route("users/bootstrap", async (request) => {
  const user = await requireUser(request);
  const body = await readJson<Record<string, unknown>>(request).catch(() => ({} as Record<string, unknown>));
  const anonymous = isAnonymous(user);

  const displayName = str(user.name, 200);
  const firstName = str(body.firstName, 80) || displayName.split(" ")[0] || "";
  const lastName = str(body.lastName, 80) || displayName.split(" ").slice(1).join(" ") || "";

  const ref = adminDb.collection("Users").doc(user.uid);
  const snap = await ref.get();
  let created = false;

  if (!snap.exists) {
    try {
      await ref.create({
        userId: uuidv4(),
        email: user.email || "",
        firstName,
        lastName,
        isAnonymous: anonymous,
        createdAt: Date.now(),
      });
      created = true;
    } catch (err) {
      if ((err as { code?: number }).code !== 6) throw err; // created by a parallel request
    }
  } else {
    const data = snap.data() || {};
    const patch: Record<string, unknown> = {};
    if (data.isAnonymous && !anonymous) {
      // A guest finished signing up: keep their data, fill in the real details.
      patch.isAnonymous = false;
      if (firstName) patch.firstName = firstName;
      if (lastName) patch.lastName = lastName;
      created = true;
    }
    if (user.email && !data.email) patch.email = user.email;
    if (Object.keys(patch).length > 0) await ref.update(patch);
  }

  if (anonymous) {
    await ensureLedger({ ownerType: "personal", ownerId: user.uid }, { grant: false });
  } else {
    await ensurePersonalGrant(user.uid);
  }

  const migratedEvents = await migrateLegacyPairings(user.uid);

  let welcomeEmailSent = false;
  if (created && !anonymous && user.email) {
    const mail = getWelcomeEmail(firstName || "there");
    welcomeEmailSent = (await sendEmail({ to: user.email, ...mail })).success;
  }

  return NextResponse.json({ success: true, created, migratedEvents, welcomeEmailSent });
});
