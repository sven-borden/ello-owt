# OWT Chess Elo Tracker

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

An internal chess Elo rating system for OWT Swiss. Track players, record matches, and visualize Elo ratings over time with a clean, Swiss-inspired design.

![Dashboard Preview](https://via.placeholder.com/800x400/99211C/FFFFFF?text=OWT+Chess+Elo+Tracker)

## Features

- **Real-time Leaderboard** with top 3 player badges (King 👑, Queen 👸, Rook 🏰)
- **Secure Match Recording** - Server-side Elo calculation prevents manipulation
- **Match History** - Complete audit trail of all matches with Elo changes
- **Player Profiles** - Detailed statistics, win/loss records, and Elo progression charts
- **Professional Design** - Clean, Swiss-inspired aesthetic using OWT brand colors
- **Atomic Transactions** - Firebase transactions ensure data consistency

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS with custom OWT brand palette
- **Database**: Firebase Firestore (real-time NoSQL)
- **Charts**: Recharts for data visualization
- **Authentication**: Firebase Admin SDK (server-side)
- **Deployment**: Vercel (edge functions + static)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/sven-borden/ello-owt.git
cd ello-owt

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase credentials
# (OWT contributors: contact the owner for env values)

# Deploy Firestore rules (skip if using OWT Firebase project)
firebase login
firebase deploy --only firestore:rules,firestore:indexes

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app in action.

> **Note for OWT Swiss contributors**: Contact the project owner to receive Firebase environment variables and start contributing immediately without setting up your own Firebase project.

## Detailed Setup

For complete setup instructions including Firebase configuration and Firebase Admin SDK setup, see:

- [CONTRIBUTING.md](CONTRIBUTING.md) - Getting started guide for contributors
- [docs/SETUP_ADMIN_SDK.md](docs/SETUP_ADMIN_SDK.md) - Firebase Admin SDK configuration
- [docs/CLAUDE.md](docs/CLAUDE.md) - Complete technical documentation

## Architecture

### Server-Side Elo Calculation

This project implements server-side Elo calculations to prevent client-side manipulation:

- **API Route**: `/api/record-match` handles all match recording
- **Firebase Admin SDK**: Server-only privileged access to Firestore
- **Atomic Transactions**: All updates succeed or fail together
- **Input Validation**: Server-side validation prevents malicious data

See [docs/SECURITY_ANALYSIS.md](docs/SECURITY_ANALYSIS.md) for detailed security considerations.

### Elo Rating System

- **Starting Elo**: 1200
- **K-Factor**: 32 (moderate volatility)
- **Formula**: Standard Elo rating system

```
Expected Score = 1 / (1 + 10^((opponentElo - playerElo) / 400))
New Rating = Old Rating + K × (Actual Score - Expected Score)
```

## Project Structure

```
/app                        # Next.js App Router
  /page.tsx                 # Dashboard (leaderboard + match form)
  /matches/page.tsx         # Match history page
  /players/[id]/page.tsx    # Individual player profile
  /api                      # Server-side API routes
    /record-match/route.ts  # Match recording with Elo calculation
    /add-player/route.ts    # Player creation endpoint
/components                 # React components
  /LeaderboardCard.tsx      # Leaderboard display
  /AddPlayerForm.tsx        # Player creation form
  /MatchHistoryTable.tsx    # Match history table
  /EloChart.tsx             # Elo rating chart (Recharts)
/lib                        # Utilities and configuration
  /firebase.ts              # Firebase client SDK
  /firebase-admin.ts        # Firebase Admin SDK (server-side)
  /elo.ts                   # Elo rating constants
  /types.ts                 # TypeScript type definitions
/docs                       # Project documentation
  /BRANDING.md              # Design system and color palette
  /SECURITY_ANALYSIS.md     # Security audit and considerations
  /SETUP_ADMIN_SDK.md       # Firebase Admin SDK setup guide
  /CLAUDE.md                # Comprehensive technical documentation
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development workflow and branching strategy
- Coding standards and best practices
- Pull request process
- Security guidelines

## Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [docs/CLAUDE.md](docs/CLAUDE.md) - Complete technical documentation
- [docs/BRANDING.md](docs/BRANDING.md) - Design system and color palette
- [docs/SECURITY_ANALYSIS.md](docs/SECURITY_ANALYSIS.md) - Security considerations
- [docs/SETUP_ADMIN_SDK.md](docs/SETUP_ADMIN_SDK.md) - Firebase Admin setup

## License

MIT License - Copyright (c) 2025 Sven

See [LICENSE](LICENSE) for details.
