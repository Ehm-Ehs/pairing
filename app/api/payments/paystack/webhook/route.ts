import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "../../../../../src/services/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature");
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (secretKey && signature) {
      const hash = crypto
        .createHmac("sha512", secretKey)
        .update(rawBody)
        .digest("hex");

      if (hash !== signature) {
        console.error("[Paystack Webhook] Invalid signature mismatch");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const { event, data } = payload;

    console.log(`[Paystack Webhook Event]: ${event}`);

    if (event === "charge.success") {
      const metadata = data.metadata || {};
      const accountId = metadata.accountId;
      const accountType = metadata.accountType || "user";
      const tokens = parseInt(metadata.tokens, 10) || 0;
      const packId = metadata.packId || "unknown_pack";
      const reference = data.reference;

      if (!accountId || tokens <= 0) {
        console.warn("[Paystack Webhook] Missing accountId or tokens in metadata");
        return NextResponse.json({ status: "ignored" });
      }

      const accountRef =
        accountType === "org"
          ? adminDb.collection("Organizations").doc(accountId)
          : adminDb.collection("Users").doc(accountId);

      // Perform atomic update & Free-to-Paid conversion
      await adminDb.runTransaction(async (transaction) => {
        const accountDoc = await transaction.get(accountRef);
        if (!accountDoc.exists) {
          console.error(`[Paystack Webhook] Target account ${accountId} not found`);
          return;
        }

        const accountData = accountDoc.data() || {};
        const currentTier = accountData.tier || "free";
        const newTier = currentTier === "free" ? (accountType === "org" ? "growth" : "pro") : currentTier;

        transaction.update(accountRef, {
          tokenBalance: FieldValue.increment(tokens),
          paidTokensPurchased: FieldValue.increment(tokens),
          hasEverPaid: true,
          tier: newTier,
          updatedAt: Date.now(),
        });

        // Sync TokenLedgers document
        const ledgerDocId = accountType === "org" ? `ledger_org_${accountId}` : `ledger_user_${accountId}`;
        const ledgerRef = adminDb.collection("TokenLedgers").doc(ledgerDocId);
        const ledgerSnap = await transaction.get(ledgerRef);

        if (ledgerSnap.exists) {
          transaction.update(ledgerRef, {
            balance: FieldValue.increment(tokens),
            hasEverPaid: true,
            tier: accountType === "org" ? "growth" : "pro",
            updatedAt: Date.now(),
          });
        } else {
          transaction.set(ledgerRef, {
            id: ledgerDocId,
            ownerType: accountType === "org" ? "org" : "personal",
            ownerId: accountId,
            balance: tokens,
            hasEverPaid: true,
            tier: accountType === "org" ? "growth" : "pro",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }

        // Record in TokenLedgerEntries
        const entryRef = adminDb.collection("TokenLedgerEntries").doc();
        transaction.set(entryRef, {
          id: entryRef.id,
          accountId,
          accountType,
          type: "pack_purchase",
          amount: tokens,
          packName: packId,
          reference,
          createdAt: Date.now(),
        });
      });

      console.log(
        `[Paystack Webhook Success] Account ${accountId} credited +${tokens} tokens. Reference: ${reference}`
      );
    }

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    console.error("Error processing Paystack webhook:", error);
    return NextResponse.json(
      { error: error.message || "Webhook handling error" },
      { status: 500 }
    );
  }
}
