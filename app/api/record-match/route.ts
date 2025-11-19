import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdmin } from '@/lib/firebase-admin'

// Elo calculation constants
const K_FACTOR = 32

/**
 * Calculate expected score for a player
 */
function calculateExpectedScore(playerElo: number, opponentElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400))
}

/**
 * Calculate new Elo rating after a match
 */
function calculateNewElo(
  currentElo: number,
  opponentElo: number,
  actualScore: number
): number {
  const expectedScore = calculateExpectedScore(currentElo, opponentElo)
  const newElo = currentElo + K_FACTOR * (actualScore - expectedScore)
  return Math.round(newElo)
}

/**
 * Calculate Elo changes for both players after a match
 */
function calculateMatchEloChanges(
  playerAElo: number,
  playerBElo: number,
  winner: 'A' | 'B'
): {
  playerAEloAfter: number
  playerBEloAfter: number
  playerAChange: number
  playerBChange: number
} {
  const playerAScore = winner === 'A' ? 1 : 0
  const playerBScore = winner === 'B' ? 1 : 0

  const playerAEloAfter = calculateNewElo(playerAElo, playerBElo, playerAScore)
  const playerBEloAfter = calculateNewElo(playerBElo, playerAElo, playerBScore)

  return {
    playerAEloAfter,
    playerBEloAfter,
    playerAChange: playerAEloAfter - playerAElo,
    playerBChange: playerBEloAfter - playerBElo,
  }
}

/**
 * API Route to record a match and update Elo ratings
 * This runs server-side to prevent client-side manipulation
 */
export async function POST(request: NextRequest) {
  try {
    const { playerAId, playerBId, winner } = await request.json()

    // Validation
    if (!playerAId || !playerBId) {
      return NextResponse.json(
        { error: 'Both playerAId and playerBId are required' },
        { status: 400 }
      )
    }

    if (playerAId === playerBId) {
      return NextResponse.json(
        { error: 'Players must be different' },
        { status: 400 }
      )
    }

    if (winner !== 'A' && winner !== 'B') {
      return NextResponse.json(
        { error: 'Winner must be either "A" or "B"' },
        { status: 400 }
      )
    }

    // Initialize Firebase Admin (lazy initialization)
    const adminDb = getAdminDb()
    const admin = getAdmin()

    // Use a Firestore transaction to ensure data consistency
    const result = await adminDb.runTransaction(async (transaction) => {
      // Get player documents
      const playerARef = adminDb.collection('players').doc(playerAId)
      const playerBRef = adminDb.collection('players').doc(playerBId)

      const playerADoc = await transaction.get(playerARef)
      const playerBDoc = await transaction.get(playerBRef)

      if (!playerADoc.exists || !playerBDoc.exists) {
        throw new Error('One or both players not found')
      }

      const playerA = playerADoc.data()!
      const playerB = playerBDoc.data()!

      // Calculate new Elo ratings (server-side - cannot be manipulated)
      const { playerAEloAfter, playerBEloAfter, playerAChange, playerBChange } =
        calculateMatchEloChanges(playerA.currentElo, playerB.currentElo, winner)

      // Create match record
      const matchRef = adminDb.collection('matches').doc()
      const matchData = {
        playerAId,
        playerBId,
        playerAName: playerA.name,
        playerBName: playerB.name,
        winner,
        playerAEloBefore: playerA.currentElo,
        playerBEloBefore: playerB.currentElo,
        playerAEloAfter,
        playerBEloAfter,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      }
      transaction.set(matchRef, matchData)

      // Update player A
      transaction.update(playerARef, {
        currentElo: playerAEloAfter,
        matchesPlayed: playerA.matchesPlayed + 1,
        wins: winner === 'A' ? playerA.wins + 1 : playerA.wins,
        losses: winner === 'B' ? playerA.losses + 1 : playerA.losses,
      })

      // Update player B
      transaction.update(playerBRef, {
        currentElo: playerBEloAfter,
        matchesPlayed: playerB.matchesPlayed + 1,
        wins: winner === 'B' ? playerB.wins + 1 : playerB.wins,
        losses: winner === 'A' ? playerB.losses + 1 : playerB.losses,
      })

      // Add Elo history for player A
      const historyARef = adminDb.collection('eloHistory').doc()
      transaction.set(historyARef, {
        playerId: playerAId,
        elo: playerAEloAfter,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        matchId: matchRef.id,
      })

      // Add Elo history for player B
      const historyBRef = adminDb.collection('eloHistory').doc()
      transaction.set(historyBRef, {
        playerId: playerBId,
        elo: playerBEloAfter,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        matchId: matchRef.id,
      })

      return {
        matchId: matchRef.id,
        playerAName: playerA.name,
        playerBName: playerB.name,
        playerAEloChange: playerAChange,
        playerBEloChange: playerBChange,
        playerAEloAfter,
        playerBEloAfter,
      }
    })

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error recording match:', error)

    // Return appropriate error message
    const message = error instanceof Error ? error.message : 'Failed to record match'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
