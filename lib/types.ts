// Player types
export interface Player {
  id: string
  name: string
  currentElo: number
  matchesPlayed: number
  wins: number
  losses: number
  createdAt: Date
}

// Match types
export interface Match {
  id: string
  playerAId: string
  playerBId: string
  playerAName: string
  playerBName: string
  winner: 'A' | 'B'
  playerAEloBefore: number
  playerBEloBefore: number
  playerAEloAfter: number
  playerBEloAfter: number
  timestamp: Date
}

// Elo History types
export interface EloHistory {
  id: string
  playerId: string
  elo: number
  timestamp: Date
  matchId: string
}

// Computed stats for display
export interface PlayerStats extends Player {
  winRate: number
  currentRank: number
  eloChange?: number
  recentMatches?: Match[]
}
