# PairForm

PairForm is a Next.js web app for forming balanced teams, role-capped project groups, breakout rooms, speed-networking schedules and Secret Santa exchanges.

## What it does

- **Events.** Three event types: role-based groups, Secret Santa (or simple pairs), and random positioning. Optional multi-round speed-networking schedule with CSV export.
- **Joining.** Participants join from a share link. They do not need an account.
- **Private results.** Each participant gets a private link to their own assignment. Secret Santa matches are never shown publicly; they are delivered by email or WhatsApp according to the event's notification channel.
- **Exclusion rules.** Organizers can mark pairs of people who must not draw each other in a Secret Santa.
- **Workspaces.** Personal space plus organizations with admin and member roles and email invites.
- **Tokens.** One token per participant who joins. Free grant on sign-up, token packs bought through Paystack.
- **Notifications.** Email through Resend, WhatsApp through the Meta Cloud API, in-app notifications, and Web Push.

## Stack

Next.js (App Router), React, TypeScript, Tailwind CSS, Firebase Auth, Firestore, Firebase Admin SDK, Paystack, Resend, Vitest. Deployed on Netlify.

## How it is put together

```
app/                 Pages and API routes
  api/               Server routes (the only code that can change sensitive data)
src/
  server/            Server-only modules used by the API routes
    auth.ts          Verifies the Firebase ID token on a request
    ledger.ts        The single place token balances change
    events.ts        Loading events, permissions, public sanitizing, private assignments
    paystack.ts      Validates and credits a Paystack transaction
    messaging.ts     Email and WhatsApp delivery
    rateLimit.ts     Firestore-backed rate limiter
    deletion.ts      Account and organization deletion
    retention.ts     Daily cleanup of dormant events and organizations due for deletion
  services/          Browser data access (Firestore reads, calls to /api)
  hooks/             React hooks (auth, token ledger, checkout, public event loading)
  components/
    join/            Shared participant screens: card frame, closed/full, reveal, success
    events/          Shared event form parts: image upload, speed networking, private link
    ui/              Generic UI: buttons, modals, CSV buttons, confirmation toast
  utils/             Pure helpers shared by browser and server (draw, csv, tokens, links, time)
  types/
firestore.rules      What the browser may read and write
tests/unit/          Unit tests (no emulator needed)
tests/rules/         Firestore rules tests (need the emulator)
scripts/             One-off scripts
```

### Security model

The browser is not trusted with anything that involves money, roles, membership, participants or draw results.

- **Sign-in** happens between the browser and Firebase Auth. After it, the browser calls `/api/users/bootstrap`, and the server creates the profile and free token grant.
- **API routes** read the Firebase ID token from the `Authorization` header and verify it. Organizer actions check that the caller owns the event or has the right role in its organization.
- **Joining an event** is public, but runs in one server transaction: closed check, capacity, duplicate email, slot choice, token charge and write. Joins are rate limited per network.
- **Token balances** live only in `TokenLedgers`. Every change goes through `src/server/ledger.ts` together with a `TokenLedgerEntries` record.
- **Payments** are credited by `settleTransaction`. The token count comes from the pack table and the amount Paystack reports, and the transaction reference is an idempotency key, so the webhook and the return-page verification can both run without double crediting. The webhook requires a valid signature.
- **Public pages** get a sanitized copy of an event from `/api/events/public`: names and slots, no emails, phone numbers, wishlists, tokens or draw results.
- **Firestore rules** deny everything by default. See the comments in `firestore.rules`.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev
```

### Environment variables

Every setting has one name. Its value depends on where the app runs: your machine and the develop site use the staging Firebase project, production uses the production project. The code never chooses between projects.

| Where | Public settings | Firebase API key and secrets |
|---|---|---|
| Your machine | `.env.local` (staging values) | `.env.local` |
| Develop site and previews | `netlify.toml` | Netlify dashboard, non-production value |
| Production | `netlify.toml` | Netlify dashboard, Production value |

Values in `netlify.toml` win over values with the same name in the Netlify dashboard. The repository is public, so the Firebase API key and all secrets stay out of it.

Secrets must not use the `NEXT_PUBLIC_` prefix. That prefix ships a variable to the browser.

### Firebase service account

A Firebase service account is required. Every API route uses the Admin SDK, so sign-up, joining events, organizations and payments all fail without it (routes answer `503 SERVER_NOT_CONFIGURED`).

1. In the Firebase console open Project settings, Service accounts, and click "Generate new private key".
2. Save the file in the project folder as `service-account.json` (this name is git-ignored).
3. Add `FIREBASE_SERVICE_ACCOUNT_KEY=./service-account.json` to `.env.local` and restart `npm run dev`.

The key must come from the same project as `NEXT_PUBLIC_FIREBASE_PROJECT_ID`. If it does not, the server refuses to use it and says which two projects disagree. On Netlify the value is the JSON content (base64 is accepted), with a different value for Production and for the other deploy contexts.

## Checks

```bash
npm run typecheck    # TypeScript
npm run lint         # ESLint
npm test             # unit tests
npm run test:rules   # Firestore rules tests; needs Java for the Firestore emulator
npm run check        # typecheck + lint + unit tests
```

CI (`.github/workflows/ci.yml`) runs all of these on every push and pull request.

Lint treats unused imports, unused variables and `any` as errors. `npm run lint -- --fix` removes unused imports.

### Conventions

- One source for each rule. Token rules live in `src/utils/tokens.ts`, share links in `src/utils/eventLinks.ts`, CSV output in `src/utils/csv.ts`, dates in `src/utils/timeUtils.ts`.
- Read caught errors with `errorMessage`, `errorCode` and `errorStatus` from `src/utils/errors.ts` instead of typing them as `any`.
- Log through `src/utils/logger.ts`, not `console`.
- Import from `src` with the `@/` alias.

## Deploying

1. Set the environment variables from `.env.example` in Netlify, including `FIREBASE_SERVICE_ACCOUNT_KEY` (staging key for the develop context, production key for production).
2. Deploy the app.
3. Then deploy the rules: `npx firebase-tools deploy --only firestore:rules --project <project-id>`.

Deploy the app before the rules. Older versions of the app wrote to Firestore directly from the browser, and the new rules reject those writes.

Recommended once: enable Firestore TTL policies on `RateLimits.expiresAt` and `PasswordResets.expireTime` so old rate-limit windows and used reset codes are deleted automatically.

### Data deletion and retention

The Privacy Policy (`/privacy`) and Terms (`/terms`) are written in `src/content/legal/`. The numbers they quote are constants in `src/content/legal/index.ts`, and the server uses the same constants.

- **Delete account** (`/api/users/delete`) removes the profile, sign-in, personal events and notifications. Events created inside an organization stay with it and pass to an admin. Token and payment records are kept.
- **Delete organization** starts a 21 working day wait. An admin can cancel during the wait.
- **Daily cleanup** (`/api/maintenance/cleanup`) deletes events with no activity for 24 months and organizations whose wait has ended. It is called by the scheduled function `netlify/functions/retention-cleanup.mjs`, which Netlify runs on the production site only. No extra environment variable is needed.

### Legacy events

Events used to be stored in an array on the user document. They are moved to the `Pairings` collection automatically when the organizer signs in or when someone opens one of their share links. To move everything at once:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY='...' npm run migrate:legacy-pairings            # dry run
FIREBASE_SERVICE_ACCOUNT_KEY='...' npm run migrate:legacy-pairings -- --apply
```

## Webhooks

| Service | URL | Requirement |
|---|---|---|
| Paystack | `/api/payments/paystack/webhook` | `PAYSTACK_SECRET_KEY` |
| WhatsApp | `/api/webhook/whatsapp` | `WHATSAPP_VERIFY_TOKEN` and `WHATSAPP_APP_SECRET` |
