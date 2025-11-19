# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OWT Chess Elo Tracker - Internal chess Elo rating system for OWT Swiss. A Next.js application using Firebase Firestore for real-time player tracking, match recording, and Elo rating visualization.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS with custom OWT brand colors
- **Database**: Firebase Firestore
- **Charts**: Recharts
- **Deployment**: Vercel

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
- `NEXT_PUBLIC_FIREBASE_APPCHECK_KEY` (optional, for App Check)

**Server-side (Firebase Admin SDK)** - Required for match recording:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

See `SETUP_ADMIN_SDK.md` for detailed instructions on obtaining service account credentials.

## Architecture

### Data Flow

1. **Client-side state**: React components use `useState` and `useEffect` for local state
2. **Firestore reads**: Client-side reads from Firestore (players, matches, history)
3. **Match recording**: Server-side API route (`/api/record-match`) handles Elo calculations and writes
4. **Real-time updates**: Manual refresh after mutations (calls `fetchPlayers()`)
5. **Elo calculations**: **Server-side** computation in API route using Firebase Admin SDK

### Key Files

- `lib/firebase.ts` - Firebase client SDK initialization and App Check setup
- `lib/firebase-admin.ts` - Firebase Admin SDK initialization (server-side only)
- `lib/elo.ts` - Elo rating constants (STARTING_ELO: 1200, K_FACTOR: 32)
- `lib/types.ts` - TypeScript interfaces for Player, Match, EloHistory
- `app/api/record-match/route.ts` - **Server-side API route for match recording with Elo calculation**
- `app/api/add-player/route.ts` - Server-side API route for adding players
- `app/page.tsx` - Dashboard with leaderboard and match recording form
- `app/matches/page.tsx` - Complete match history
- `app/players/[id]/page.tsx` - Individual player profiles with stats and Elo chart
- `components/LeaderboardCard.tsx` - Top 3 badges and rankings table
- `components/AddPlayerForm.tsx` - Player creation form
- `components/EloChart.tsx` - Recharts-based Elo history visualization
- `components/MatchHistoryTable.tsx` - Match history table component

### Firestore Collections

**players**
```typescript
{
  name: string
  currentElo: number
  matchesPlayed: number
  wins: number
  losses: number
  createdAt: Timestamp
}
```

**matches**
```typescript
{
  playerAId: string
  playerBId: string
  playerAName: string
  playerBName: string
  winner: 'A' | 'B'
  playerAEloBefore: number
  playerBEloBefore: number
  playerAEloAfter: number
  playerBEloAfter: number
  timestamp: Timestamp
}
```

**eloHistory**
```typescript
{
  playerId: string
  elo: number
  timestamp: Timestamp
  matchId: string
}
```

### Match Recording Flow

When a match is recorded (in `app/page.tsx:52-107`):

**Client-side (app/page.tsx)**:
1. Validate inputs (both players selected, different players, winner selected)
2. Send POST request to `/api/record-match` with playerAId, playerBId, winner

**Server-side (app/api/record-match/route.ts)**:
3. Validate request data
4. Start Firestore transaction (ensures atomicity)
5. Fetch current player data from Firestore using Admin SDK
6. Calculate new Elo ratings (server-side - cannot be manipulated)
7. Create match record in `matches` collection
8. Update both player documents (Elo, stats)
9. Add entries to `eloHistory` collection for both players
10. Return success response

**Client-side (app/page.tsx)**:
11. Refresh player list to show updated Elo ratings

**IMPORTANT**: Elo calculations now happen **server-side** in the API route using Firebase Admin SDK. This prevents client-side manipulation and ensures data integrity through atomic Firestore transactions.

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

### Critical Issues

1. **Firestore Rules**: Currently allow unrestricted read/write (`if true`). Intended for internal use only.
2. ~~**Client-side business logic**~~: **FIXED** - Elo calculations now happen server-side via `/api/record-match`
3. **No authentication**: Anyone with Firebase config can access/modify data (or call API routes)
4. **API endpoints**: `/api/add-player` and `/api/record-match` have no authentication

### When Adding Features

- Input validation must happen server-side (not just client-side)
- Sanitize all user inputs (player names, etc.)
- Consider moving state-changing operations to server actions
- Add rate limiting for production deployments
- Implement authentication if making this public-facing

## Firebase Operations

### Reading Data

```typescript
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const playersQuery = query(collection(db, 'players'), orderBy('currentElo', 'desc'))
const querySnapshot = await getDocs(playersQuery)
```

### Writing Data

```typescript
import { addDoc, collection, Timestamp } from 'firebase/firestore'

await addDoc(collection(db, 'players'), {
  name: 'Player Name',
  currentElo: 1200,
  matchesPlayed: 0,
  wins: 0,
  losses: 0,
  createdAt: Timestamp.now(),
})
```

### Updating Documents

```typescript
import { updateDoc, doc } from 'firebase/firestore'

await updateDoc(doc(db, 'players', playerId), {
  currentElo: newElo,
  matchesPlayed: matchesPlayed + 1,
})
```

## Elo Rating System

- **Starting Elo**: 1200 (defined in `lib/elo.ts`)
- **K-Factor**: 32 (moderate volatility, defined in `lib/elo.ts`)
- **Formula**: Standard Elo rating system
- **Implementation**: Server-side in `app/api/record-match/route.ts`

The Elo calculation happens entirely server-side and uses:

Expected score calculation:
```
E = 1 / (1 + 10^((opponentElo - playerElo) / 400))
```

New rating:
```
newElo = oldElo + K × (actualScore - expectedScore)
```

**Note**: The calculation logic is implemented in the `/api/record-match` API route, not exposed to the client. Constants are exported from `lib/elo.ts` for use in other server-side code (like adding new players).

## Deployment

### Vercel

The project is configured for Vercel deployment (`vercel.json` exists).

```bash
npm install -g vercel
vercel login
vercel
```

Add environment variables in Vercel Dashboard → Project Settings → Environment Variables.

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
- Check Firebase rules are deployed

### Elo Calculation Bugs

- Verify both players exist before calculation
- Ensure winner is either 'A' or 'B'
- Check K_FACTOR and STARTING_ELO constants in `lib/elo.ts`
