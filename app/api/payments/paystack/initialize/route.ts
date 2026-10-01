import { NextResponse } from "next/server";
import { TOKEN_PACKS } from "../../../../../src/types/tokenTypes";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { packId, email, accountId, accountType = "user", redirectUrl } = body;

    if (!packId || !email || !accountId) {
      return NextResponse.json(
        { error: "Missing required fields: packId, email, accountId" },
        { status: 400 }
      );
    }

    const pack = TOKEN_PACKS.find((p) => p.id === packId);
    if (!pack) {
      return NextResponse.json({ error: "Invalid token pack selected" }, { status: 400 });
    }

    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:3000";
    const origin = `${protocol}://${host}`;

    const callbackUrl = redirectUrl || `${origin}/pricing?payment=success`;

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      console.log("[Paystack Test Mode]: Simulating Paystack checkout session (add PAYSTACK_SECRET_KEY in .env.local to use real Paystack Test Mode).");
      const testRef = `test_ref_${Date.now()}`;
      const simUrl = `${callbackUrl}${callbackUrl.includes("?") ? "&" : "?"}reference=${testRef}&tokens=${pack.tokens}&packId=${pack.id}`;
      
      return NextResponse.json({
        success: true,
        authorizationUrl: simUrl,
        accessCode: "mock_access_code",
        reference: testRef,
        simulated: true,
      });
    }

    // Paystack API v1 initialize
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: pack.priceNGN * 100, // Paystack requires amount in kobo
        callback_url: callbackUrl,
        metadata: {
          accountId,
          accountType,
          packId: pack.id,
          tokens: pack.tokens,
          custom_fields: [
            {
              display_name: "Token Pack",
              variable_name: "token_pack",
              value: pack.name,
            },
            {
              display_name: "Tokens Granted",
              variable_name: "tokens_granted",
              value: pack.tokens,
            },
          ],
        },
      }),
    });

    const data = await paystackRes.json();

    if (!paystackRes.ok || !data.status) {
      console.error("[Paystack Initialize Error]:", data);
      return NextResponse.json(
        { error: data.message || "Failed to initialize Paystack transaction" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    });
  } catch (error: any) {
    console.error("Error initializing Paystack payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
