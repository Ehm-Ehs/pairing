import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { adminDb } from "@/services/firebaseAdmin";
import { isAnonymous, requireUser } from "@/server/auth";
import { HttpError, readJson, route, str } from "@/server/http";
import { ensureLedger } from "@/server/ledger";
import { cleanBranding, memberRecord, shortId } from "@/server/orgs";

/** Creates an organization with the caller as its founding admin. */
export const POST = route("orgs/create", async (request) => {
  const user = await requireUser(request);
  if (isAnonymous(user)) throw new HttpError(403, "Please create an account first.", "ACCOUNT_REQUIRED");

  const body = await readJson(request);
  const name = str(body.name, 120);
  if (!name) throw new HttpError(400, "Organization name is required.");

  const orgId = shortId("org", uuidv4());
  const now = Date.now();
  const org = {
    id: orgId,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    branding: cleanBranding(body.branding),
    integrations: {},
    status: "active",
    createdBy: user.uid,
    createdAt: now,
    updatedAt: now,
  };
  const member = memberRecord({
    orgId,
    uid: user.uid,
    email: user.email || "",
    name: str(body.userName, 120) || str(user.name, 120),
    role: "admin",
  });

  const batch = adminDb.batch();
  batch.create(adminDb.collection("Organizations").doc(orgId), org);
  batch.create(adminDb.collection("OrgMembers").doc(member.id), member);
  await batch.commit();

  // The 75-token grant is only issued for the first org a user creates.
  await ensureLedger({ ownerType: "org", ownerId: orgId });

  return NextResponse.json({ success: true, org });
});
