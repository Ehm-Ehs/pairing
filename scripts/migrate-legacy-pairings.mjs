#!/usr/bin/env node
/**
 * One-off migration: copies events stored in the legacy Users/{uid}.pairings array
 * into the top-level Pairings collection, then removes the array.
 *
 * The app also does this lazily for each user at sign-in, so running this script is
 * optional. Run it to finish the migration for users who have not signed in.
 *
 *   FIREBASE_SERVICE_ACCOUNT_KEY='{"...": "..."}' node scripts/migrate-legacy-pairings.mjs          # dry run
 *   FIREBASE_SERVICE_ACCOUNT_KEY='{"...": "..."}' node scripts/migrate-legacy-pairings.mjs --apply  # write
 *
 * Existing Pairings documents are never overwritten.
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";

const apply = process.argv.includes("--apply");
const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!raw) {
  console.error("Set FIREBASE_SERVICE_ACCOUNT_KEY to the service account JSON.");
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(raw)) });
const db = getFirestore();

const users = await db.collection("Users").get();
let usersWithLegacy = 0;
let copied = 0;
let skipped = 0;

for (const userDoc of users.docs) {
  const legacy = userDoc.data().pairings;
  if (!Array.isArray(legacy)) continue;
  usersWithLegacy++;

  const batch = db.batch();
  for (const item of legacy) {
    if (!item || typeof item !== "object" || item.ownerType === "org") {
      skipped++;
      continue;
    }
    const id = typeof item.id === "string" && item.id ? item.id : randomUUID();
    const ref = db.collection("Pairings").doc(id);
    if ((await ref.get()).exists) {
      skipped++;
      continue;
    }
    batch.set(ref, {
      ...JSON.parse(JSON.stringify(item)),
      id,
      ownerType: "personal",
      ownerId: userDoc.id,
      createdBy: item.createdBy || userDoc.id,
    });
    copied++;
  }
  batch.update(userDoc.ref, { pairings: FieldValue.delete(), legacyPairingsMigratedAt: Date.now() });
  if (apply) await batch.commit();
}

console.log(
  `${apply ? "Migrated" : "[dry run] Would migrate"}: ${copied} events from ${usersWithLegacy} users ` +
    `(${skipped} already present or skipped). ${apply ? "" : "Re-run with --apply to write."}`
);
