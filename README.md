# PairForm - Intelligent Team Formation & Pairing Platform

PairForm is an enterprise-ready, high-performance web application built for creating balanced teams, role-capped project groups, breakout rooms, speed networking schedules, and Secret Santa gift exchanges.

---

## 💡 Overview of What We Have Built

### 1. Authentication & Role-Based Access Control
* **Firebase Authentication**: Email and password signup, login, and password reset flows (`/login`, `/sign-up`, `/forgot-password`).
* **Dynamic Super Admin System**: Super admins are dynamically assigned via Firestore (`Users` collection with `role: "super_admin"` or `isSuperAdmin: true`). Configured with fallback defaults in `src/config/admin.ts`.
* **Guest Flow & Interactive Auth Guard**: Guest users can configure events directly on the landing page form. Clicking "Create Event" prompts sign-in/sign-up and automatically restores their event payload from `sessionStorage` post-auth.
* **Guest Adaptive Header**: Context-aware navigation bar hiding "Create Org" and disabling account settings for guest users.

### 2. Event & Pairing Engine (`src/utils/pairing.ts`)
* **Secret Santa Exchange**:
  * 100% secret random partner draws.
  * Custom exclusion rules (e.g. spouses/couples cannot draw each other).
  * Wishlist creation and private budget tracking.
* **Role-Based & Skill-Balanced Pairing**:
  * Strict role caps per team (e.g. maximum 2 Developers, 1 Designer, 1 PM).
  * Skill distribution algorithm equalizing experience levels across competing teams.
* **Random Positioning & Breakout Rooms**:
  * Instant group division for speed networking rounds or Zoom/Teams workshops.
* **Participant Results & Share Links**:
  * Unique share links (`/event/[id]`, `/your-pairing/[id]`) for participants to view their assignments securely.

### 3. Monetization & Token Ledger System
* **Paystack Payment Integration**:
  * Payment initialization and verification via `/api/payments/paystack/verify` and `/api/payments/paystack/webhook`.
* **Token Ledger Architecture**:
  * Credit balance tracking recorded in Firestore collections (`TokenLedgers` & `TokenLedgerEntries`).
* **Pricing Plans**:
  * Interactive subscription and credit top-up page (`/pricing`).

### 4. Automated Notifications
* **Email Dispatch**: Resend integration via `/api/send-email` for match notifications, invites, and wishlists.
* **WhatsApp Dispatch**: WhatsApp notification endpoint (`/api/send-whatsapp`) for instant mobile delivery.

### 5. Security & Testing
* **Firestore Security Rules (`firestore.rules`)**:
  * Locked down collection rules enforcing authentication, organization boundaries, token ledger security, and default deny policies.
* **Automated Vitest Security Suite (`tests/firestore-rules.test.ts`)**:
  * 11 automated security unit tests covering rule syntax, auth checks, and data isolation.
* **TypeScript Integrity**:
  * Strict compilation check with 0 type errors (`npx tsc --noEmit`).

### 6. SEO & Modern UI Architecture
* **Single-Page Landing**: Clean navigation targeting smooth scroll sections (`#how-it-works`, `#features`, `#use-cases`).
* **Structured JSON-LD Schema**: Embedded `SoftwareApplication` metadata in `app/layout.tsx` for optimal organic search visibility without thin content sub-pages.
* **Responsive Stack**: Next.js App Router, Tailwind CSS, Framer Motion, and React Icons.

---

## 🛠️ What Is Missing & Future Enhancements

1. **Production Webhook Signature Verification**
   * Ensure `PAYSTACK_SECRET_KEY` is set in production environment variables (Vercel/Netlify) to sign and verify incoming payment webhooks securely.

2. **Full WhatsApp Business API Integration**
   * Connect `/api/send-whatsapp` to an active Twilio or Meta WhatsApp Business account for automated production delivery.

3. **CSV / Excel Export for Workshop Hosts**
   * Add a 1-click **Export to CSV / Excel** button formatted for Zoom & MS Teams pre-assigned breakout room imports.

4. **Multi-Round Speed Networking Matrix**
   * Visual schedule matrix generator ensuring zero duplicate pairings across multiple continuous networking rounds.

5. **Advanced Organization Analytics Dashboard**
   * Enhanced admin panel in `/settings` for tracking organization credits, historical team formations, and bulk member CSV uploads.

---

## 🧪 Running Tests & Checks

```bash
# Run TypeScript type check
npx tsc --noEmit

# Run Security & Firestore Rules Tests
npx vitest run tests/firestore-rules.test.ts

# Start Development Server
npm run dev
```
