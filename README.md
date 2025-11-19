# OWT Chess Elo Tracker

Internal chess Elo scoring system for OWT Swiss. Track players, record matches, and visualize Elo ratings over time with a professional, corporate-styled dashboard.

## Features

- **Real-time Leaderboard** with top 3 player badges (King 👑, Queen 👸, Rook 🏰)
- **Match Recording** - Easy form to record chess matches and automatically calculate Elo changes
- **Match History** - Complete history of all matches with Elo changes
- **Player Profiles** - Detailed stats including win/loss record, Elo chart over time, and match history
- **Professional Design** - Clean, Swiss-inspired design using OWT brand colors

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS with OWT brand colors
- **Database**: Firebase Firestore
- **Charts**: Recharts
- **Deployment**: Vercel

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd ello-owt
npm install
```

### 2. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/u/0/project/ello-owt/overview)
2. Navigate to **Project Settings** > **General** > **Your apps**
3. Click **SDK setup and configuration**
4. Copy the Firebase configuration values

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Fill in the Firebase configuration values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ello-owt.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ello-owt
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ello-owt.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 5. Add Initial Players

Go to Firebase Console > Firestore Database and manually add your first players:

**Collection**: `players`

**Document structure**:
```json
{
  "name": "Player Name",
  "currentElo": 1200,
  "matchesPlayed": 0,
  "wins": 0,
  "losses": 0,
  "createdAt": <Timestamp>
}
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### Option 1: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

### Option 2: GitHub Integration

1. Push code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com)
3. Click **New Project**
4. Import your GitHub repository
5. Add environment variables from `.env.local`
6. Deploy

### Environment Variables on Vercel

Add the same environment variables from `.env.local` in:
**Project Settings** > **Environment Variables**

## Usage

### Recording a Match

1. Go to the Dashboard
2. Use the "Record Match" form
3. Select Player A and Player B
4. Choose the winner
5. Submit - Elo ratings are calculated and updated automatically

### Viewing Stats

- **Dashboard**: See leaderboard, top 3 players, and quick stats
- **Matches**: View complete match history with Elo changes
- **Player Profiles**: Click any player name to see detailed stats and Elo chart

## Elo Calculation

- **Starting Elo**: 1200
- **K-Factor**: 32 (moderate volatility)
- **Formula**: Standard Elo rating system

New Rating = Old Rating + K × (Actual Score - Expected Score)

## Color Scheme

Based on OWT Swiss brand colors:
- Primary: `#99211C` (OWT Red)
- Accent: `#2C7CF2` (Blue)
- Text: `#140406` (Almost Black)
- Backgrounds: `#FFFFFF`, `#F5F5F5`

## Project Structure

```
/app
  /page.tsx                  # Dashboard with leaderboard and match form
  /matches/page.tsx          # Match history
  /players/[id]/page.tsx     # Player profile
  /api
    /record-match/route.ts   # Server-side match recording API
    /add-player/route.ts     # Server-side player creation API
/components
  /LeaderboardCard.tsx       # Top 3 + rankings table
  /AddPlayerForm.tsx         # Player creation form
  /MatchHistoryTable.tsx     # Match history table
  /EloChart.tsx              # Elo rating chart
/lib
  /firebase.ts               # Firebase client SDK
  /firebase-admin.ts         # Firebase Admin SDK (server-side)
  /elo.ts                    # Elo constants
  /types.ts                  # TypeScript types
```

## License

MIT License - Copyright (c) 2025 Sven
