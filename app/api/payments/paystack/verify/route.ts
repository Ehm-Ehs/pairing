import { NextResponse } from "next/server";
import { adminDb } from "../../../../../src/services/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");
    const accountId = searchParams.get("accountId");

    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

    if (paystackSecretKey && paystackSecretKey.startsWith("sk_")) {
      const verifyRes = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
          },
        }
      );
      const data = await verifyRes.json();

      if (!verifyRes.ok || !data.status || data.data.status !== "success") {
        return NextResponse.json(
          { error: data.message || "Transaction verification failed" },
          { status: 400 }
        );
      }

      const metadata = data.data.metadata || {};
      const targetAccountId = accountId || metadata.accountId;
      const accountType = metadata.accountType || "user";
      const tokens = parseInt(metadata.tokens, 10) || 0;

      if (targetAccountId && tokens > 0) {
        try {
          const accountRef =
            accountType === "org"
              ? adminDb.collection("Organizations").doc(targetAccountId)
              : adminDb.collection("Users").doc(targetAccountId);

          const ledgerDocId = accountType === "org" ? `ledger_org_${targetAccountId}` : `ledger_user_${targetAccountId}`;
          const ledgerRef = adminDb.collection("TokenLedgers").doc(ledgerDocId);
          const entryRef = adminDb.collection("TokenLedgerEntries").doc();

          await adminDb.runTransaction(async (transaction) => {
            const docSnap = await transaction.get(accountRef);
            if (docSnap.exists) {
              const currentTier = docSnap.data()?.tier || "free";
              const newTier =
                currentTier === "free" ? (accountType === "org" ? "growth" : "pro") : currentTier;

              transaction.update(accountRef, {
                tokenBalance: FieldValue.increment(tokens),
                paidTokensPurchased: FieldValue.increment(tokens),
                hasEverPaid: true,
                tier: newTier,
                updatedAt: Date.now(),
              });
            }

            // Sync TokenLedgers document
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
                ownerId: targetAccountId,
                balance: tokens,
                hasEverPaid: true,
                tier: accountType === "org" ? "growth" : "pro",
                createdAt: Date.now(),
                updatedAt: Date.now(),
              });
            }

            // Record entry in TokenLedgerEntries
            transaction.set(entryRef, {
              id: entryRef.id,
              accountId: targetAccountId,
              accountType,
              type: "pack_purchase",
              amount: tokens,
              reference,
              createdAt: Date.now(),
            });
          });
        } catch (dbErr: any) {
          console.warn("[Paystack Verify DB Warning]:", dbErr.message);
        }
      }

      return NextResponse.json({
        success: true,
        data: data.data,
      });
    }

    // Test Simulator fallback mode if key is not set
    return NextResponse.json({
      success: true,
      simulated: true,
      message: "Test transaction verified in simulation mode.",
    });
  } catch (error: any) {
    console.error("Error verifying Paystack payment:", error);
    return NextResponse.json(
      { error: error.message || "Verification error" },
      { status: 500 }
    );
  }
}
