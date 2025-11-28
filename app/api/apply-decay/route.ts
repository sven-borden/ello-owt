import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdmin } from '@/lib/firebase-admin'
import { calculateDecay, generateDecayMatchId, generateActivityBonusMatchId, DECAY_CONFIG } from '@/lib/decay'

/**
 * API Route to apply Elo decay to inactive players and redistribute as activity bonus
 *
 * This endpoint implements a zero-sum Elo system:
 * 1. Fetches all players from the database
 * 2. Finds the lowest Elo among all players (this becomes the decay floor)
 * 3. Identifies active players (played within 7 days)
 * 4. If no active players exist, skips decay entirely (system pauses)
 * 5. Calculates decay for inactive players based on their lastPlayed date
 * 6. Redistributes total decay as activity bonus to active players (max +5 per player)
 * 7. Updates players and logs events in eloHistory
 *
 * Can be called manually or scheduled to run periodically (e.g., weekly via cron)
 *
 * Optional query parameters:
 * - dryRun: If "true", only simulates decay without applying changes
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('Authorization')
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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
    const millisecondsPerDay = 1000 * 60 * 60 * 24

    // Identify active players (played within the last 7 days)
    const activePlayers: Array<{
      playerId: string
      playerName: string
      currentElo: number
    }> = []

    for (const doc of playersSnapshot.docs) {
      const player = doc.data()
      const playerId = doc.id

      // Convert Firestore Timestamp to Date
      let lastPlayedDate: Date | null = null
      if (player.lastPlayed) {
        lastPlayedDate = player.lastPlayed.toDate
          ? player.lastPlayed.toDate()
          : new Date(player.lastPlayed)
      }

      // Check if player is active (played within INACTIVITY_THRESHOLD_DAYS)
      if (lastPlayedDate) {
        const inactiveDays = Math.floor(
          (currentDate.getTime() - lastPlayedDate.getTime()) / millisecondsPerDay
        )

        if (inactiveDays < DECAY_CONFIG.INACTIVITY_THRESHOLD_DAYS) {
          activePlayers.push({
            playerId,
            playerName: player.name,
            currentElo: player.currentElo,
          })
        }
      }
    }

    // If no active players, skip decay entirely (system pauses)
    if (activePlayers.length === 0) {
      return NextResponse.json(
        {
          success: true,
          dryRun,
          message: 'No active players found. Decay paused.',
          config: {
            inactivityThresholdDays: DECAY_CONFIG.INACTIVITY_THRESHOLD_DAYS,
            decayPointsPerPeriod: DECAY_CONFIG.DECAY_POINTS_PER_PERIOD,
            decayPeriodDays: DECAY_CONFIG.DECAY_PERIOD_DAYS,
            minimumEloUsed: minimumElo,
            absoluteMinimumElo: DECAY_CONFIG.ABSOLUTE_MINIMUM_ELO,
            maxWeeklyActivityBonus: DECAY_CONFIG.MAX_WEEKLY_ACTIVITY_BONUS,
          },
          summary: {
            playersProcessed: playersSnapshot.size,
            activePlayers: 0,
            playersDecayed: 0,
            totalDecayApplied: 0,
            activityBonusPerPlayer: 0,
            playersBonused: 0,
          },
          details: [],
        },
        { status: 200 }
      )
    }

    const decayResults: Array<{
      playerId: string
      playerName: string
      oldElo: number
      newElo: number
      decayAmount: number
      inactiveDays: number
    }> = []

    // Calculate decay for inactive players
    for (const doc of playersSnapshot.docs) {
      const player = doc.data()
      const playerId = doc.id

      // Convert Firestore Timestamp to Date
      let lastPlayedDate: Date | null = null
      if (player.lastPlayed) {
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
        decayResults.push({
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

    const totalDecayApplied = decayResults.reduce((sum, r) => sum + r.decayAmount, 0)

    // Calculate activity bonus to redistribute to active players
    const activityBonusPerPlayer = totalDecayApplied > 0
      ? Math.min(
          DECAY_CONFIG.MAX_WEEKLY_ACTIVITY_BONUS,
          Math.floor(totalDecayApplied / activePlayers.length)
        )
      : 0

    const bonusResults: Array<{
      playerId: string
      playerName: string
      oldElo: number
      newElo: number
      bonusAmount: number
    }> = []

    // Apply activity bonus to active players
    if (activityBonusPerPlayer > 0 && !dryRun) {
      for (const activePlayer of activePlayers) {
        const newElo = activePlayer.currentElo + activityBonusPerPlayer

        bonusResults.push({
          playerId: activePlayer.playerId,
          playerName: activePlayer.playerName,
          oldElo: activePlayer.currentElo,
          newElo,
          bonusAmount: activityBonusPerPlayer,
        })

        await adminDb.runTransaction(async (transaction) => {
          const playerRef = adminDb.collection('players').doc(activePlayer.playerId)

          // Update player's Elo
          transaction.update(playerRef, {
            currentElo: newElo,
          })

          // Log activity bonus event in eloHistory
          const historyRef = adminDb.collection('eloHistory').doc()
          transaction.set(historyRef, {
            playerId: activePlayer.playerId,
            elo: newElo,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            matchId: generateActivityBonusMatchId(),
          })
        })
      }
    } else if (activityBonusPerPlayer > 0 && dryRun) {
      // In dry run, just populate results without applying
      for (const activePlayer of activePlayers) {
        bonusResults.push({
          playerId: activePlayer.playerId,
          playerName: activePlayer.playerName,
          oldElo: activePlayer.currentElo,
          newElo: activePlayer.currentElo + activityBonusPerPlayer,
          bonusAmount: activityBonusPerPlayer,
        })
      }
    }

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
          maxWeeklyActivityBonus: DECAY_CONFIG.MAX_WEEKLY_ACTIVITY_BONUS,
        },
        summary: {
          playersProcessed: playersSnapshot.size,
          activePlayers: activePlayers.length,
          playersDecayed: decayResults.length,
          totalDecayApplied,
          activityBonusPerPlayer,
          playersBonused: bonusResults.length,
        },
        decayDetails: decayResults,
        bonusDetails: bonusResults,
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
