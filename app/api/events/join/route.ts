import { NextResponse } from "next/server";
import { adminDb } from "../../../../src/services/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,          // Event owner user ID
      eventId,         // Event ID (optional if groupingPurpose is provided)
      eventType,       // "role-based" | "secret-santa" | "random-positioning"
      participant,     // Participant data object (name, email, phone, etc.)
      groupKey,        // For role-based pairings
      slotId,          // For role-based slot ID
      groupingPurpose, // Event title/purpose for legacy lookup
      orgId,           // Optional organization ID
    } = body;

    let eventRef;
    let eventData: any = {};
    let remainingTokens = 50;

    try {
      if (eventId) {
        eventRef = adminDb.collection("Pairings").doc(eventId);
      } else if (groupingPurpose) {
        const q = await adminDb
          .collection("Pairings")
          .where("ownerId", "==", userId)
          .where("groupingPurpose", "==", groupingPurpose)
          .limit(1)
          .get();
        if (!q.empty) {
          eventRef = q.docs[0].ref;
        }
      }

      if (eventRef) {
        const eventDoc = await eventRef.get();
        if (eventDoc.exists) {
          eventData = eventDoc.data() || {};
          if (eventData.status === "locked") {
            return NextResponse.json(
              { error: "This event is closed. No further registrations are allowed." },
              { status: 400 }
            );
          }
        }
      }

      // Determine target TokenLedger from Event owner fields (Spec §6)
      const targetOwnerType: "personal" | "org" = eventData.ownerType || (orgId ? "org" : "personal");
      const targetOwnerId: string = eventData.ownerId || orgId || userId;
      const ledgerDocId = targetOwnerType === "personal" ? `ledger_user_${targetOwnerId}` : `ledger_org_${targetOwnerId}`;
      const ledgerRef = adminDb.collection("TokenLedgers").doc(ledgerDocId);

      // Check if event owner is Super Admin in Firestore
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

      // 2. Transaction to check token balance limit & deduct 1 token atomically from TokenLedgers
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
            if (isPaid && currentBalance <= -20) {
              throw new Error("DEPLETED_PAID_LIMIT");
            }
            if (!isPaid && currentBalance <= 0) {
              throw new Error("DEPLETED_FREE_LIMIT");
            }
          }

          remainingTokens = isSuperAdmin ? 999999 : currentBalance - 1;
          const now = Date.now();

          if (ledgerSnap.exists) {
            transaction.update(ledgerRef, {
              balance: FieldValue.increment(-1),
              updatedAt: now,
            });
          } else {
            transaction.set(ledgerRef, {
              id: ledgerDocId,
              ownerType: targetOwnerType,
              ownerId: targetOwnerId,
              balance: currentBalance - 1,
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
            type: "participant_join",
            amount: -1,
            eventId: eventId || groupingPurpose || "unknown",
            participantId: participant?.id || slotId || "unknown",
            createdAt: now,
          });

          const legacyAccountRef = targetOwnerType === "org"
            ? adminDb.collection("Organizations").doc(targetOwnerId)
            : adminDb.collection("Users").doc(targetOwnerId);
          transaction.set(legacyAccountRef, { tokenBalance: remainingTokens }, { merge: true });
        });
      } catch (txError: any) {
        if (
          txError.message === "DEPLETED_FREE_LIMIT" ||
          txError.message === "DEPLETED_PAID_LIMIT"
        ) {
          return NextResponse.json(
            {
              error: "This event cannot accept new participants. Contact the organizer.",
              code: "TOKEN_BALANCE_DEPLETED",
              isDepleted: true,
            },
            { status: 402 }
          );
        }
        throw txError;
      }

      // 3. Perform Participant Join update on Event document
      if (eventRef && eventData) {
        if (eventType === "role-based" && groupKey && slotId) {
          const groups = eventData.groups || {};
          if (groups[groupKey]) {
            const idx = groups[groupKey].findIndex((p: any) => p.id === slotId);
            if (idx !== -1) {
              groups[groupKey][idx] = {
                ...groups[groupKey][idx],
                ...participant,
              };
              await eventRef.update({ groups });
            }
          }
        } else {
          const existing = eventData.participants || [];
          await eventRef.update({
            participants: [...existing, participant],
          });
        }
      }
    } catch (adminDbError: any) {
      console.warn("[Admin DB Warning]: Admin Firestore bypassed:", adminDbError.message);
    }

    // 3. Dispatch WhatsApp Invitation if phone exists
    const recipientPhone = participant?.phone || participant?.contact;
    if (recipientPhone) {
      try {
        const { sendJoinInviteWhatsApp } = await import(
          "../../../../src/services/whatsappService"
        );
        const protocol = request.headers.get("x-forwarded-proto") || "http";
        const host = request.headers.get("host") || "localhost:3000";
        const origin = `${protocol}://${host}`;

        await sendJoinInviteWhatsApp({
          phone: recipientPhone,
          participantName: participant.name || "Participant",
          eventName: groupingPurpose || "PairForm Event",
          inviteUrl: `${origin}/event?id=${eventId || ""}`,
        });
      } catch (waErr) {
        console.error("Failed to send WhatsApp join invite:", waErr);
      }
    }

    return NextResponse.json({
      success: true,
      remainingTokens,
      message: "Participant joined successfully.",
    });
  } catch (error: any) {
    console.error("Error in POST /api/events/join:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process participant join" },
      { status: 500 }
    );
  }
}
