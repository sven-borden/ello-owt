# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

OWT Chess Elo Tracker — internal chess Elo rating system for OWT Swiss. Next.js 16 (App Router) + React 19 + TypeScript, backed by Firebase Firestore. Players, matches, and per-player Elo history are stored in Firestore; all rating mutations happen server-side.

## Commands

```bash
npm run dev          # Dev server at http://localhost:3000
npm run build        # Production build (run before deploy to catch type errors)
npm start            # Serve production build
npm run lint         # ESLint (next lint)

# Firestore (open rules — internal use only)
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

**Tests:** `lib/decay.test.ts` is written for Jest, but Jest is **not** installed and there is no `test` script. To run it, add `jest`/`ts-jest` (or `vitest`) and a `test` script first. `decay.ts` is pure/deterministic (`currentDate` is injectable) — that is the unit-testable seam.

## Architecture

### Trust boundary — Elo is computed server-side only
Clients never calculate ratings. They POST match intent (`playerAId`, `playerBId`, `winner`) and the server does the math inside a Firestore transaction. This is the core design constraint: **never move Elo/decay calculation to the client**, and keep all writes inside transactions so player doc, match doc, and `eloHistory` stay consistent.

- `app/api/record-match/route.ts` — records a match. Validates input, runs a transaction that reads both players, computes new Elo (K-factor 32; win=1 / draw=0.5 / loss=0), writes the `matches` doc, updates both `players` docs (Elo, wins/losses/draws, `matchesPlayed`, `lastPlayed`), and appends two `eloHistory` rows. Note the K-factor is hardcoded here (`= 32`), separate from `lib/elo.ts`.
- `app/api/add-player/route.ts` — creates a player at `STARTING_ELO` (1200).
- `app/api/apply-decay/route.ts` — see below.

### Two SDKs, two roles
- `lib/firebase.ts` — client Web SDK + App Check. Used by pages for **reads** (`players`, `matches`, `eloHistory`).
- `lib/firebase-admin.ts` — Admin SDK, **server-only**, privileged. Lazy-initialized so missing creds don't break the build — credentials are only required at runtime when an API route actually touches Firestore. Used exclusively by API routes for **writes**.

Pages fetch on mount with `useState`/`useEffect` and re-fetch after a mutation (no real-time listeners).

### Elo decay + activity bonus (zero-sum pool)
`lib/decay.ts` (pure logic) + `app/api/apply-decay/route.ts` (orchestration). Runs weekly via Vercel cron — `vercel.json`: `GET /api/apply-decay?cron=true`, schedule `0 18 * * 5` (Fri 18:00 UTC), authorized by `Bearer ${CRON_SECRET}`.

Mechanism: inactive players (no match in `INACTIVITY_THRESHOLD_DAYS` = 7) lose `DECAY_POINTS_PER_PERIOD` (5) per period, floored at the lowest player's Elo (or `ABSOLUTE_MINIMUM_ELO` 1000). Total decayed points are redistributed to active players as an "activity bonus" (capped `MAX_WEEKLY_ACTIVITY_BONUS` = 5 each). If **no** active players exist, decay is skipped entirely (system pauses). Supports `?dryRun=true` to simulate.

Decay and bonus events are written as real `matches` rows with synthetic opponent `playerBId: 'SYSTEM'` and `winner: 'DECAY'` / `'ACTIVITY_BONUS'`, and `matchId` prefixed `DECAY-` / `ACTIVITY_BONUS-` (see `isDecayEvent`/`isActivityBonusEvent`). So the `Match.winner` union is `'A' | 'B' | 'DRAW' | 'DECAY' | 'ACTIVITY_BONUS'` — match-history UI must handle the system kinds.

### Firestore collections
`players` (name, currentElo, matchesPlayed, wins, losses, draws, createdAt, lastPlayed?), `matches`, `eloHistory` (playerId, elo, timestamp, matchId). Types in `lib/types.ts`. Schemas detailed in `docs/CLAUDE.md`.

### Pages
`app/page.tsx` (dashboard: leaderboard + record-match form), `app/matches/page.tsx` (history), `app/players/[id]/page.tsx` (profile + `EloChart` via Recharts), `app/how-it-works/page.tsx`.

## Maintenance scripts
`node scripts/<name>.js [--dry-run]` — standalone Admin-SDK scripts, **not** part of the Next app. Need `FIREBASE_SERVICE_ACCOUNT_KEY` (base64) or a `service-account-key.json` in the repo root.
- `scripts/cleanup-fake-matches.js` — removes fake players/matches and recalculates affected Elo.
- `scripts/backfill-decay-matches.js` — backfills decay match records.

## Environment
Copy `.env.example` → `.env.local`. Client: `NEXT_PUBLIC_FIREBASE_*` (+ optional `NEXT_PUBLIC_FIREBASE_APPCHECK_KEY`). Server: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (escaped `\n` is un-escaped at init). Cron: `CRON_SECRET`. See `docs/SETUP_ADMIN_SDK.md`.

## Security context
Firestore rules are open (`allow read, write: if true`) and API routes (`record-match`, `add-player`) are **unauthenticated** by design — intended for an internal, trusted network only. `apply-decay` is the only protected route (`CRON_SECRET`). Keep server-side input validation on any new mutation; do not assume client checks suffice. Details in `docs/SECURITY_ANALYSIS.md`.

## Branding
Swiss/International style. Brand tokens in `tailwind.config.ts`: `brand-red` #99211C (primary/CTA), `brand-blue` #2C7CF2 (secondary), `almost-black` #140406 (text). Full palette in `docs/BRANDING.md`.

## Further docs
`docs/CLAUDE.md` holds the long-form reference (schemas, Firebase snippets, troubleshooting). Keep it and this file in sync when data shapes or flows change.
