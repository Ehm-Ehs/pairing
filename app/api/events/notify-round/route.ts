import { NextResponse } from "next/server";
import { adminDb } from "../../../../src/services/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { getRoundNotificationEmail } from "../../../../src/services/emailTemplates";
import { formatWhatsAppPhone } from "../../../../src/services/whatsappService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      eventId,
      roundNumber,
      eventName = "Speed Networking Event",
      notifications = [],
      channel = "email", // "email" | "whatsapp" | "both"
    } = body;

    if (!userId || !notifications || notifications.length === 0) {
      return NextResponse.json(
        { error: "Invalid parameters. Missing userId or notifications list." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pair-form.com";
    const groupLink = eventId ? `${appUrl}/your-pairing?id=${eventId}` : appUrl;

    const participantCount = notifications.length;
    const requiredTokens = participantCount * 0.5; // 0.5 tokens per participant notified per round

    // 1. Fetch event data to check owner / org
    let eventRef = adminDb.collection("Pairings").doc(eventId);
    let eventDoc = await eventRef.get();
    let eventData: any = eventDoc.exists ? eventDoc.data() : {};

    const targetOwnerType: "personal" | "org" = eventData.ownerType || (eventData.orgId ? "org" : "personal");
    const targetOwnerId: string = eventData.ownerId || eventData.orgId || userId;
    const ledgerDocId = targetOwnerType === "personal" ? `ledger_user_${targetOwnerId}` : `ledger_org_${targetOwnerId}`;
    const ledgerRef = adminDb.collection("TokenLedgers").doc(ledgerDocId);

    // Super admin check
    let isSuperAdmin = false;
    if (targetOwnerType === "personal" && targetOwnerId) {
      const ownerSnap = await adminDb.collection("Users").doc(targetOwnerId).get();
      if (ownerSnap.exists) {
        const ownerData = ownerSnap.data() || {};
        if (ownerData.role === "super_admin" || ownerData.isSuperAdmin === true) {
          isSuperAdmin = true;
        }
      }
    }

    let remainingTokens = 50;

    // 2. Transaction to deduct tokens
    try {
      await adminDb.runTransaction(async (transaction) => {
        const ledgerSnap = await transaction.get(ledgerRef);

        let currentBalance = targetOwnerType === "personal" ? 50 : 75;
        let isPaid = false;

        if (ledgerSnap.exists) {
          const ledgerData = ledgerSnap.data() || {};
          currentBalance = typeof ledgerData.balance === "number" ? ledgerData.balance : currentBalance;
          isPaid = ledgerData.hasEverPaid === true || ledgerData.tier === "paid";
        }

        if (!isSuperAdmin) {
          if (isPaid && (currentBalance - requiredTokens) < -20) {
            throw new Error("DEPLETED_PAID_LIMIT");
          }
          if (!isPaid && (currentBalance - requiredTokens) < 0) {
            throw new Error("DEPLETED_FREE_LIMIT");
          }
        }

        remainingTokens = isSuperAdmin ? 999999 : currentBalance - requiredTokens;
        const now = Date.now();

        if (ledgerSnap.exists) {
          transaction.update(ledgerRef, {
            balance: FieldValue.increment(-requiredTokens),
            updatedAt: now,
          });
        } else {
          transaction.set(ledgerRef, {
            id: ledgerDocId,
            ownerType: targetOwnerType,
            ownerId: targetOwnerId,
            balance: currentBalance - requiredTokens,
            freeGrantAmount: currentBalance,
            freeGrantUsed: true,
            hasEverPaid: false,
            tier: "free",
            createdAt: now,
            updatedAt: now,
          });
        }

        const entryRef = adminDb.collection("TokenLedgerEntries").doc();
        transaction.set(entryRef, {
          id: entryRef.id,
          accountId: targetOwnerId,
          accountType: targetOwnerType === "org" ? "org" : "user",
          type: "round_notification",
          amount: -requiredTokens,
          eventId: eventId || "unknown",
          roundNumber: roundNumber,
          participantCount: participantCount,
          createdAt: now,
        });

        const legacyAccountRef = targetOwnerType === "org"
          ? adminDb.collection("Organizations").doc(targetOwnerId)
          : adminDb.collection("Users").doc(targetOwnerId);
        transaction.set(legacyAccountRef, { tokenBalance: remainingTokens }, { merge: true });
      });
    } catch (txError: any) {
      if (txError.message === "DEPLETED_FREE_LIMIT" || txError.message === "DEPLETED_PAID_LIMIT") {
        return NextResponse.json(
          {
            error: `Insufficient token balance! Notifying ${participantCount} participants for Round ${roundNumber} requires ${requiredTokens} tokens (0.5 tokens/attendee). Please top up your token balance.`,
            requiredTokens,
          },
          { status: 402 }
        );
      }
      throw txError;
    }

    const whatsAppPayloads: any[] = [];

    // 3. Dispatch Emails / Generate WhatsApp payloads
    for (const item of notifications) {
      const tableText = item.tableNumber === 0 ? "Solo / Floating Facilitator" : `Table ${item.tableNumber}`;
      const msgText = `Hi ${item.name},\n\nRound ${roundNumber} for *${eventName}* has started! 🚀\n\n📍 *Assigned Location:* ${tableText}\n👥 *Partner(s):* ${item.partners || "Floating Facilitator"}\n\n🔗 View your group & table schedule:\n${groupLink}\n\n- The PairForm Team`;
      
      const phoneDigits = formatWhatsAppPhone(item.phone || "");
      const waLink = phoneDigits
        ? `https://api.whatsapp.com/send?phone=${phoneDigits}&text=${encodeURIComponent(msgText)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(msgText)}`;

      whatsAppPayloads.push({
        participantName: item.name,
        phone: item.phone || "",
        whatsAppLink: waLink,
        formattedText: msgText,
      });

      if ((channel === "email" || channel === "both") && item.email) {
        try {
          const emailContent = getRoundNotificationEmail(
            eventName,
            item.name,
            roundNumber,
            item.tableNumber,
            item.partners || "",
            groupLink
          );
          await fetch(`${appUrl}/api/send-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: item.email,
              subject: emailContent.subject,
              html: emailContent.html,
              from: emailContent.from,
            }),
          });
        } catch (e) {
          console.error(`Failed sending email to ${item.email}:`, e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      deductedTokens: requiredTokens,
      remainingTokens,
      notifiedCount: participantCount,
      roundNumber,
      groupLink,
      whatsAppPayloads,
    });
  } catch (error: any) {
    console.error("Error in notify-round API:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred while notifying participants." },
      { status: 500 }
    );
  }
}
