import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdmin } from '@/lib/firebase-admin'
import { isValidDocId, readJsonBody } from '@/lib/api-guards'

// Elo calculation constants
const K_FACTOR = 32

/** Expected failure whose message is safe to return to the client. */
class MatchRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

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
  winner: 'A' | 'B' | 'DRAW'
): {
  playerAEloAfter: number
  playerBEloAfter: number
  playerAChange: number
  playerBChange: number
} {
  const playerAScore = winner === 'A' ? 1 : winner === 'DRAW' ? 0.5 : 0
  const playerBScore = winner === 'B' ? 1 : winner === 'DRAW' ? 0.5 : 0

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
    const parsedBody = await readJsonBody(request)
    if (!parsedBody.ok) {
      return parsedBody.response
    }
    const { playerAId, playerBId, winner } = parsedBody.body

    // Validation
    if (!isValidDocId(playerAId) || !isValidDocId(playerBId)) {
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

    if (winner !== 'A' && winner !== 'B' && winner !== 'DRAW') {
      return NextResponse.json(
        { error: 'Winner must be either "A", "B", or "DRAW"' },
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
        throw new MatchRequestError('One or both players not found', 404)
      }

      const playerA = playerADoc.data()!
      const playerB = playerBDoc.data()!

      // Refuse to propagate corrupted ratings (NaN would poison every future match)
      if (!Number.isFinite(playerA.currentElo) || !Number.isFinite(playerB.currentElo)) {
        throw new Error(`Invalid currentElo on player ${playerAId} or ${playerBId}`)
      }

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
        draws: winner === 'DRAW' ? (playerA.draws || 0) + 1 : (playerA.draws || 0),
        lastPlayed: admin.firestore.FieldValue.serverTimestamp(),
      })

      // Update player B
      transaction.update(playerBRef, {
        currentElo: playerBEloAfter,
        matchesPlayed: playerB.matchesPlayed + 1,
        wins: winner === 'B' ? playerB.wins + 1 : playerB.wins,
        losses: winner === 'A' ? playerB.losses + 1 : playerB.losses,
        draws: winner === 'DRAW' ? (playerB.draws || 0) + 1 : (playerB.draws || 0),
        lastPlayed: admin.firestore.FieldValue.serverTimestamp(),
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
    if (error instanceof MatchRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    // Unexpected failure: log details server-side, don't leak internals to the client
    console.error('Error recording match:', error)
    return NextResponse.json(
      { error: 'Failed to record match' },
      { status: 500 }
    )
  }
}
