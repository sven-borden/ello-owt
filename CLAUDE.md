# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OWT Chess Elo Tracker - Internal chess Elo rating system for OWT Swiss. A Next.js application using Firebase Firestore for real-time player tracking, match recording, Elo rating visualization, and automated Elo decay system with activity bonuses.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS with custom OWT brand colors
- **Database**: Firebase Firestore
- **Charts**: Recharts
- **Deployment**: Vercel (with cron jobs)
- **Server Runtime**: Firebase Admin SDK for privileged operations

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Deploy Firestore rules and indexes
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes

# Run decay backfill script (dry run)
node scripts/backfill-decay-matches.js --dry-run

# Run decay backfill script (live)
node scripts/backfill-decay-matches.js
```

## Environment Setup

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Required environment variables:

**Client-side (Firebase Web SDK)**:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_APPCHECK_KEY` (optional)

**Server-side (Firebase Admin SDK)** - Required for match recording and cron jobs:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `CRON_SECRET` - Used to authenticate scheduled cron jobs from Vercel

See `SETUP_ADMIN_SDK.md` for detailed instructions on obtaining service account credentials.

## Architecture

### High-Level Architecture

This application uses a hybrid client-server architecture:

1. **Client-side**: React components fetch and display data from Firestore
2. **Server-side API routes**: Handle all state mutations (match recording, player creation, decay processing)
3. **Scheduled jobs**: Vercel cron jobs trigger decay processing automatically
4. **Security model**: Firebase Admin SDK on server-side prevents client manipulation

### Critical Architectural Decisions

**Server-Side Elo Calculations**
All Elo calculations happen server-side in API routes using Firebase Admin SDK. This is a fundamental security requirement - Elo calculations MUST NEVER be exposed to client-side code to prevent manipulation.

**Zero-Sum Decay System**
The decay system maintains a zero-sum Elo pool by redistributing points lost through decay to active players. When inactive players lose Elo, active players gain an activity bonus (max +5 per week).

**Atomic Transactions**
All database mutations use Firestore transactions to ensure data consistency. If any part of a match recording or decay event fails, all changes are rolled back.

### Data Flow

1. **Client-side state**: React components use `useState` and `useEffect` for local state
2. **Firestore reads**: Client-side reads from Firestore (players, matches, history)
3. **Match recording**: Server-side API route (`/api/record-match`) handles Elo calculations and writes
4. **Decay processing**: Server-side API route (`/api/apply-decay`) handles weekly decay and bonus distribution
5. **Real-time updates**: Manual refresh after mutations (calls `fetchPlayers()`)
6. **Elo calculations**: Server-side computation in API routes using Firebase Admin SDK

### Key Files and Their Responsibilities

**Core Library Files**:
- `lib/firebase.ts` - Firebase client SDK initialization and App Check setup
- `lib/firebase-admin.ts` - Firebase Admin SDK initialization (server-side only, lazy loading)
- `lib/elo.ts` - Elo rating constants (STARTING_ELO: 1200, K_FACTOR: 32)
- `lib/decay.ts` - Decay system configuration and calculation logic
- `lib/types.ts` - TypeScript interfaces for Player, Match, EloHistory

**API Routes (Server-Side Only)**:
- `app/api/record-match/route.ts` - Match recording with server-side Elo calculation, supports draws
- `app/api/add-player/route.ts` - Player creation endpoint
- `app/api/apply-decay/route.ts` - Decay processing endpoint (triggered by cron job or manually)

**Pages**:
- `app/page.tsx` - Dashboard with leaderboard and match recording form
- `app/matches/page.tsx` - Complete match history (includes decay/bonus events)
- `app/players/[id]/page.tsx` - Individual player profiles with stats and Elo chart

**Components**:
- `components/LeaderboardCard.tsx` - Top 3 badges (👑 👸 🏰) and rankings table
- `components/AddPlayerForm.tsx` - Player creation form
- `components/EloChart.tsx` - Recharts-based Elo history visualization
- `components/MatchHistoryTable.tsx` - Match history table component

**Scripts**:
- `scripts/backfill-decay-matches.js` - Utility to create visible match records for historical decay/bonus events

**Configuration**:
- `vercel.json` - Deployment config with cron job schedule (Fridays 6 PM UTC)
- `firestore.rules` - Database security rules (currently open for internal use)
- `firestore.indexes.json` - Composite indexes for efficient queries

### Firestore Collections

**players**
```typescript
{
  name: string
  currentElo: number
  matchesPlayed: number
  wins: number
  losses: number
  draws: number
  createdAt: Timestamp
  lastPlayed?: Timestamp  // Used for decay calculation
}
```

**matches**
```typescript
{
  playerAId: string
  playerBId: string
  playerAName: string
  playerBName: string
  winner: 'A' | 'B' | 'DRAW' | 'DECAY' | 'ACTIVITY_BONUS'
  playerAEloBefore: number
  playerBEloBefore: number
  playerAEloAfter: number
  playerBEloAfter: number
  timestamp: Timestamp
}
```

Special match types:
- Regular matches: `winner` is 'A', 'B', or 'DRAW'
- Decay events: `playerBId: 'SYSTEM'`, `playerBName: 'Decay System'`, `winner: 'DECAY'`
- Activity bonuses: `playerBId: 'SYSTEM'`, `playerBName: 'Activity Bonus'`, `winner: 'ACTIVITY_BONUS'`

**eloHistory**
```typescript
{
  playerId: string
  elo: number
  timestamp: Timestamp
  matchId: string  // Can be regular match ID or DECAY-/ACTIVITY_BONUS- prefixed
}
```

### Match Recording Flow

When a match is recorded (in `app/page.tsx:52-107`):

**Client-side (app/page.tsx)**:
1. Validate inputs (both players selected, different players, winner selected)
2. Send POST request to `/api/record-match` with playerAId, playerBId, winner ('A', 'B', or 'DRAW')

**Server-side (app/api/record-match/route.ts)**:
3. Validate request data
4. Start Firestore transaction (ensures atomicity)
5. Fetch current player data from Firestore using Admin SDK
6. Calculate new Elo ratings using standard Elo formula (server-side - cannot be manipulated)
7. Create match record in `matches` collection
8. Update both player documents (Elo, stats, lastPlayed timestamp)
9. Add entries to `eloHistory` collection for both players
10. Return success response

**Client-side (app/page.tsx)**:
11. Refresh player list to show updated Elo ratings

**IMPORTANT**: Elo calculations happen server-side in the API route using Firebase Admin SDK. This prevents client-side manipulation and ensures data integrity through atomic Firestore transactions.

### Elo Decay System

The application implements an automated Elo decay system to prevent rating hoarding and encourage active play.

**Decay Configuration** (lib/decay.ts):
- Inactivity threshold: 7 days
- Decay amount: 5 points per 7-day period
- Minimum Elo floor: Lowest rated player in system (absolute minimum: 1000)
- Activity bonus: Max +5 points per week for active players
- Active player definition: Played within last 7 days

**Decay Processing Flow** (app/api/apply-decay/route.ts):

1. **Triggered by**: Vercel cron job (Fridays 6 PM UTC) or manual POST request
2. **Authentication**: Requires `Authorization: Bearer <CRON_SECRET>` header
3. **Process**:
   - Fetch all players from Firestore
   - Determine minimum Elo floor (lowest rated player)
   - Identify active players (played within 7 days)
   - If no active players exist, skip decay entirely (system pauses)
   - Calculate decay for each inactive player:
     - Days inactive = days since lastPlayed
     - Periods elapsed = (daysInactive - 7) / 7
     - Decay amount = (periods + 1) × 5 points
     - Floor at minimum Elo (won't decay below lowest player)
   - Sum total decay applied
   - Calculate activity bonus = min(5, total_decay / active_players)
   - Distribute bonus to active players
   - Create visible match records for decay/bonus events (playerBId: 'SYSTEM')
   - Update player documents atomically
   - Log events to eloHistory
4. **Dry run mode**: Add `?dryRun=true` to preview changes without applying

**Cron Job Configuration** (vercel.json):
```json
{
  "crons": [
    {
      "path": "/api/apply-decay?cron=true",
      "schedule": "0 18 * * 5"
    }
  ]
}
```

**Manual Execution**:
```bash
# Test with dry run
curl -X POST "http://localhost:3000/api/apply-decay?dryRun=true" \
  -H "Authorization: Bearer <CRON_SECRET>"

# Apply decay
curl -X POST "http://localhost:3000/api/apply-decay" \
  -H "Authorization: Bearer <CRON_SECRET>"
```

**Backfill Script** (scripts/backfill-decay-matches.js):
- Creates visible match records for historical decay/bonus events
- Useful if decay system was updated to create match records after events occurred
- Always run with `--dry-run` first to preview changes
- See `scripts/README.md` for detailed usage

## Branding and Design

### OWT Swiss Color Palette

The application uses a Swiss/International design style with specific brand colors defined in `tailwind.config.ts`:

**Primary Colors**
- `brand-red` (#99211C) - Main brand color, CTAs, important elements
- `brand-blue` (#2C7CF2) - Secondary accents
- `almost-black` (#140406) - Primary text color

**Backgrounds**
- `off-white`/`warm-white` (#F5F5F5)
- `ice-blue` (#F3F8FA)
- `cream-pink` (#FDF0ED)

See `BRANDING.md` for complete color palette with RGB values and usage guidance.

### Design Principles

- Clean, minimal Swiss design aesthetic
- High contrast for readability
- Generous whitespace
- Red for primary actions, blue for secondary
- Top 3 players receive badges: King 👑, Queen 👸, Rook 🏰

## Security Considerations

**IMPORTANT**: Review `SECURITY_ANALYSIS.md` for detailed security audit.

### Current Security Model

1. **Firestore Rules**: Currently allow unrestricted read/write (`if true`). Intended for internal use only.
2. **Server-side Elo calculations**: ✅ FIXED - Elo calculations happen server-side via `/api/record-match`
3. **No authentication**: Anyone with Firebase config can access/modify data or call API routes
4. **API endpoints**: `/api/add-player`, `/api/record-match`, and `/api/apply-decay` have no user authentication
5. **Cron job security**: `/api/apply-decay` requires `CRON_SECRET` to prevent unauthorized execution

### When Adding Features

- Input validation must happen server-side (not just client-side)
- Sanitize all user inputs (player names, etc.)
- Keep state-changing operations in server-side API routes
- Never expose Elo calculation logic to client-side code
- Add rate limiting for production deployments
- Implement authentication if making this public-facing
- All cron endpoints must verify CRON_SECRET

## Firebase Operations

### Reading Data

```typescript
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const playersQuery = query(collection(db, 'players'), orderBy('currentElo', 'desc'))
const querySnapshot = await getDocs(playersQuery)
```

### Writing Data (Use Server-Side API Routes)

Always use server-side API routes for mutations. Never write directly from client-side code.

```typescript
// Client-side: Call API route
const response = await fetch('/api/record-match', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ playerAId, playerBId, winner })
})
```

### Server-Side Transactions

```typescript
import { getAdminDb, getAdmin } from '@/lib/firebase-admin'

const adminDb = getAdminDb()
const admin = getAdmin()

await adminDb.runTransaction(async (transaction) => {
  const playerRef = adminDb.collection('players').doc(playerId)
  const playerDoc = await transaction.get(playerRef)

  transaction.update(playerRef, {
    currentElo: newElo,
    matchesPlayed: playerDoc.data()!.matchesPlayed + 1,
  })
})
```

## Elo Rating System

- **Starting Elo**: 1200 (defined in `lib/elo.ts`)
- **K-Factor**: 32 (moderate volatility, defined in `lib/elo.ts`)
- **Formula**: Standard Elo rating system
- **Implementation**: Server-side in `app/api/record-match/route.ts`
- **Draws**: Supported - both players get 0.5 score

The Elo calculation happens entirely server-side:

Expected score calculation:
```
E = 1 / (1 + 10^((opponentElo - playerElo) / 400))
```

New rating:
```
newElo = oldElo + K × (actualScore - expectedScore)
```

Where actualScore is:
- 1.0 for a win
- 0.5 for a draw
- 0.0 for a loss

## Deployment

### Vercel

The project is configured for Vercel deployment (`vercel.json` with cron jobs).

```bash
npm install -g vercel
vercel login
vercel
```

Add environment variables in Vercel Dashboard → Project Settings → Environment Variables.

**Required environment variables for Vercel**:
- All `NEXT_PUBLIC_FIREBASE_*` variables
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `CRON_SECRET` - Generate a secure random string for cron job authentication

### Firebase

Deploy Firestore rules and indexes before first use:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## Common Patterns

### Component State Management

Components use local state with `useState` and fetch data on mount:

```typescript
const [players, setPlayers] = useState<Player[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetchPlayers()
}, [])
```

### Error Handling

- Client errors: Display in UI with error state
- Console errors: Log to browser console (not production-ready)
- Server errors: Return appropriate HTTP status codes and error messages
- No centralized error tracking (consider Sentry for production)

### TypeScript

All components and utilities are fully typed. Import types from `lib/types.ts`.

## Troubleshooting

### Firebase Connection Issues

- Verify all `NEXT_PUBLIC_FIREBASE_*` env vars are set
- Check Firebase project exists and is active
- Ensure Firestore database is created (not RTDB)

### Deployment Failures

- Run `npm run build` locally to check for TypeScript errors
- Verify environment variables are set in Vercel
- Check Firebase rules and indexes are deployed
- Ensure CRON_SECRET is set in Vercel environment variables

### Elo Calculation Bugs

- Verify both players exist before calculation
- Ensure winner is 'A', 'B', or 'DRAW'
- Check K_FACTOR and STARTING_ELO constants in `lib/elo.ts`
- All calculations happen server-side in API routes

### Decay System Issues

- Check CRON_SECRET is set correctly in Vercel
- Verify cron job is enabled in Vercel dashboard
- Test with dry run: `/api/apply-decay?dryRun=true`
- Check Vercel logs for execution details
- Ensure all players have `lastPlayed` field (set during match recording)
- Review `lib/decay.ts` for configuration constants

### Backfill Script Issues

- Run with `--dry-run` first to preview changes
- Ensure `FIREBASE_SERVICE_ACCOUNT_KEY` env var is set or `service-account-key.json` exists
- Check that npm dependencies are installed
- See `scripts/README.md` for detailed troubleshooting
