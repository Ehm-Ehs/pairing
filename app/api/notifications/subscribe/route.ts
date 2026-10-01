import { NextResponse } from "next/server";
import { db } from "../../../../src/services/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subscription, userId, userAgent } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Invalid push subscription object" },
        { status: 400 }
      );
    }

    // Check if subscription endpoint already exists in Firestore
    const subsRef = collection(db, "push_subscriptions");
    const q = query(subsRef, where("endpoint", "==", subscription.endpoint));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      await addDoc(subsRef, {
        endpoint: subscription.endpoint,
        keys: subscription.keys || {},
        userId: userId || null,
        userAgent: userAgent || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true, message: "Push subscription saved." });
  } catch (error: any) {
    console.error("Error saving push subscription:", error);
    return NextResponse.json(
      { error: "Failed to save push subscription", details: error.message },
      { status: 500 }
    );
  }
}
