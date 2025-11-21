import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdmin } from '@/lib/firebase-admin'
import { calculateDecay, generateDecayMatchId, DECAY_CONFIG } from '@/lib/decay'

/**
 * API Route to apply Elo decay to inactive players
 *
 * This endpoint:
 * 1. Fetches all players from the database
 * 2. Finds the lowest Elo among all players (this becomes the decay floor)
 * 3. Calculates decay for each player based on their lastPlayed date
 * 4. Updates players who need decay
 * 5. Logs decay events in eloHistory
 *
 * Can be called manually or scheduled to run periodically (e.g., weekly via cron)
 *
 * Optional query parameters:
 * - dryRun: If "true", only simulates decay without applying changes
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dryRun = searchParams.get('dryRun') === 'true'

    const adminDb = getAdminDb()
    const admin = getAdmin()

    // Fetch all players
    const playersSnapshot = await adminDb.collection('players').get()

    if (playersSnapshot.empty) {
      return NextResponse.json(
        {
          success: true,
          message: 'No players found',
          playersProcessed: 0,
          playersDecayed: 0,
          totalDecayApplied: 0,
        },
        { status: 200 }
      )
    }

    // Find the lowest Elo among all players - this becomes the minimum decay floor
    // Players won't decay below the lowest rated player in the system
    let minimumElo = DECAY_CONFIG.ABSOLUTE_MINIMUM_ELO
    for (const doc of playersSnapshot.docs) {
      const player = doc.data()
      if (player.currentElo < minimumElo) {
        minimumElo = player.currentElo
      }
    }

    const currentDate = new Date()
    const results: Array<{
      playerId: string
      playerName: string
      oldElo: number
      newElo: number
      decayAmount: number
      inactiveDays: number
    }> = []

    // Process each player
    for (const doc of playersSnapshot.docs) {
      const player = doc.data()
      const playerId = doc.id

      // Convert Firestore Timestamp to Date
      let lastPlayedDate: Date | null = null
      if (player.lastPlayed) {
        // Handle both Firestore Timestamp and Date objects
        lastPlayedDate = player.lastPlayed.toDate
          ? player.lastPlayed.toDate()
          : new Date(player.lastPlayed)
      }

      // Calculate decay with dynamic minimum Elo floor
      const decayResult = calculateDecay(
        player.currentElo,
        lastPlayedDate,
        currentDate,
        minimumElo
      )

      // If decay should be applied
      if (decayResult.shouldDecay && decayResult.decayAmount > 0) {
        results.push({
          playerId,
          playerName: player.name,
          oldElo: player.currentElo,
          newElo: decayResult.newElo,
          decayAmount: decayResult.decayAmount,
          inactiveDays: decayResult.inactiveDays,
        })

        // Apply decay if not in dry run mode
        if (!dryRun) {
          await adminDb.runTransaction(async (transaction) => {
            const playerRef = adminDb.collection('players').doc(playerId)

            // Update player's Elo
            transaction.update(playerRef, {
              currentElo: decayResult.newElo,
            })

            // Log decay event in eloHistory
            const historyRef = adminDb.collection('eloHistory').doc()
            transaction.set(historyRef, {
              playerId,
              elo: decayResult.newElo,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              matchId: generateDecayMatchId(),
            })
          })
        }
      }
    }

    const totalDecayApplied = results.reduce((sum, r) => sum + r.decayAmount, 0)

    return NextResponse.json(
      {
        success: true,
        dryRun,
        config: {
          inactivityThresholdDays: DECAY_CONFIG.INACTIVITY_THRESHOLD_DAYS,
          decayPointsPerPeriod: DECAY_CONFIG.DECAY_POINTS_PER_PERIOD,
          decayPeriodDays: DECAY_CONFIG.DECAY_PERIOD_DAYS,
          minimumEloUsed: minimumElo,
          absoluteMinimumElo: DECAY_CONFIG.ABSOLUTE_MINIMUM_ELO,
        },
        summary: {
          playersProcessed: playersSnapshot.size,
          playersDecayed: results.length,
          totalDecayApplied,
        },
        details: results,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error applying decay:', error)

    const message = error instanceof Error ? error.message : 'Failed to apply decay'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
