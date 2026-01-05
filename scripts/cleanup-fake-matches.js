/**
 * Cleanup Script: Remove Fake Players and Matches
 *
 * This script removes fake players (Sinterklaas and Zwarte Piet) and all
 * matches involving them since December 22, 2025. It also removes all
 * decay/bonus system matches since that date and recalculates Elo ratings
 * for all affected players.
 *
 * Usage:
 *   node scripts/cleanup-fake-matches.js [--dry-run]
 *
 * Options:
 *   --dry-run: Preview changes without writing to database
 *
 * Prerequisites:
 *   1. Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable (base64 encoded)
 *   2. Or create a service-account-key.json file in the project root
 *   3. Run: npm install (to ensure firebase-admin is installed)
 */

const admin = require('firebase-admin')
const fs = require('fs')

// Constants
const K_FACTOR = 32
const STARTING_ELO = 1200
const FAKE_PLAYER_NAMES = ['Sinterklaas', 'Zwarte Piet']
const CUTOFF_DATE = new Date('2025-12-22T00:00:00.000Z')

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')

// Initialize Firebase Admin
let serviceAccount
try {
  // Try environment variable first (for production/Vercel)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const decoded = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      'base64'
    ).toString('utf-8')
    serviceAccount = JSON.parse(decoded)
  } else {
    // Fall back to local file
    serviceAccount = require('../service-account-key.json')
  }
} catch (error) {
  console.error('❌ Error loading service account credentials:')
  console.error(
    '   Make sure FIREBASE_SERVICE_ACCOUNT_KEY env var is set or service-account-key.json exists'
  )
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

/**
 * Calculate expected score for a player
 */
function calculateExpectedScore(playerElo, opponentElo) {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400))
}

/**
 * Calculate new Elo rating after a match
 */
function calculateNewElo(currentElo, opponentElo, actualScore) {
  const expectedScore = calculateExpectedScore(currentElo, opponentElo)
  const newElo = currentElo + K_FACTOR * (actualScore - expectedScore)
  return Math.round(newElo)
}

/**
 * Phase 1: Discovery - Find all contaminated data
 */
async function discoverContaminatedData() {
  console.log('🔍 Discovering contaminated data...')

  const contaminated = {
    fakePlayerIds: [],
    matches: [],
    eloHistoryIds: new Set(),
    affectedRealPlayerIds: new Set(),
  }

  // Step 1.1: Find fake player IDs
  console.log('   Finding fake players...')
  for (const name of FAKE_PLAYER_NAMES) {
    const snapshot = await db.collection('players').where('name', '==', name).get()

    snapshot.forEach((doc) => {
      contaminated.fakePlayerIds.push(doc.id)
      console.log(`   Found fake player: ${name} (ID: ${doc.id})`)
    })
  }

  if (contaminated.fakePlayerIds.length === 0) {
    throw new Error('No fake players found with the specified names')
  }

  // Step 1.2: Find all matches involving fake players since cutoff date
  console.log('   Finding matches involving fake players...')
  for (const fakeId of contaminated.fakePlayerIds) {
    // Matches where fake player is playerA (query all, filter by date in memory)
    const matchesAsA = await db
      .collection('matches')
      .where('playerAId', '==', fakeId)
      .get()

    // Matches where fake player is playerB (query all, filter by date in memory)
    const matchesAsB = await db
      .collection('matches')
      .where('playerBId', '==', fakeId)
      .get()

    // Process all matches and filter by cutoff date
    for (const doc of [...matchesAsA.docs, ...matchesAsB.docs]) {
      const match = { id: doc.id, ...doc.data() }

      // Filter by cutoff date (Firestore Timestamp to Date comparison)
      const matchDate = match.timestamp?.toDate?.() || new Date(match.timestamp)
      if (matchDate >= CUTOFF_DATE) {
        contaminated.matches.push(match)

        // Track affected real players
        if (
          match.playerAId !== fakeId &&
          !contaminated.fakePlayerIds.includes(match.playerAId) &&
          match.playerAId !== 'SYSTEM'
        ) {
          contaminated.affectedRealPlayerIds.add(match.playerAId)
        }
        if (
          match.playerBId !== fakeId &&
          !contaminated.fakePlayerIds.includes(match.playerBId) &&
          match.playerBId !== 'SYSTEM'
        ) {
          contaminated.affectedRealPlayerIds.add(match.playerBId)
        }

        // Find associated eloHistory entries
        const historySnapshot = await db
          .collection('eloHistory')
          .where('matchId', '==', doc.id)
          .get()

        historySnapshot.forEach((histDoc) => {
          contaminated.eloHistoryIds.add(histDoc.id)
        })
      }
    }
  }

  // Step 1.3: Find ALL decay/bonus system matches since cutoff date
  console.log('   Finding decay/bonus system matches since cutoff...')
  const systemMatches = await db
    .collection('matches')
    .where('playerBId', '==', 'SYSTEM')
    .get()

  for (const doc of systemMatches.docs) {
    const match = { id: doc.id, ...doc.data() }

    // Filter by cutoff date
    const matchDate = match.timestamp?.toDate?.() || new Date(match.timestamp)
    if (matchDate >= CUTOFF_DATE) {
      contaminated.matches.push(match)

      // Track affected player
      if (
        match.playerAId !== 'SYSTEM' &&
        !contaminated.fakePlayerIds.includes(match.playerAId)
      ) {
        contaminated.affectedRealPlayerIds.add(match.playerAId)
      }

      // Find associated eloHistory entries
      const historySnapshot = await db
        .collection('eloHistory')
        .where('matchId', '==', doc.id)
        .get()

      historySnapshot.forEach((histDoc) => {
        contaminated.eloHistoryIds.add(histDoc.id)
      })
    }
  }

  const stats = {
    fakePlayersFound: contaminated.fakePlayerIds.length,
    matchesToDelete: contaminated.matches.length,
    eloHistoryToDelete: contaminated.eloHistoryIds.size,
    realPlayersAffected: contaminated.affectedRealPlayerIds.size,
  }

  console.log('   Discovery complete:')
  console.log(`   - Fake players: ${stats.fakePlayersFound}`)
  console.log(`   - Matches to delete: ${stats.matchesToDelete}`)
  console.log(`   - EloHistory entries to delete: ${stats.eloHistoryToDelete}`)
  console.log(`   - Real players affected: ${stats.realPlayersAffected}`)
  console.log()

  return { contaminated, stats }
}

/**
 * Phase 2: Backup - Export contaminated data to JSON file
 */
async function backupData(discoveredData) {
  console.log('💾 Creating backup...')

  const backup = {
    timestamp: new Date().toISOString(),
    cutoffDate: CUTOFF_DATE.toISOString(),
    fakePlayerNames: FAKE_PLAYER_NAMES,
    fakePlayers: [],
    matches: discoveredData.contaminated.matches,
    eloHistory: [],
    stats: discoveredData.stats,
  }

  // Backup fake player documents
  for (const fakeId of discoveredData.contaminated.fakePlayerIds) {
    const doc = await db.collection('players').doc(fakeId).get()
    if (doc.exists) {
      backup.fakePlayers.push({ id: doc.id, ...doc.data() })
    }
  }

  // Backup eloHistory entries
  for (const histId of discoveredData.contaminated.eloHistoryIds) {
    const doc = await db.collection('eloHistory').doc(histId).get()
    if (doc.exists) {
      const data = doc.data()
      // Convert Firestore timestamps to ISO strings for JSON serialization
      backup.eloHistory.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
      })
    }
  }

  // Convert Firestore timestamps in matches
  backup.matches = backup.matches.map((match) => ({
    ...match,
    timestamp: match.timestamp?.toDate?.()?.toISOString() || match.timestamp,
  }))

  // Write to file
  const backupJson = JSON.stringify(backup, null, 2)
  const filename = `cleanup-backup-${Date.now()}.json`
  fs.writeFileSync(filename, backupJson)

  console.log(`   Backup saved to: ${filename}`)
  console.log(`   Backup size: ${(backupJson.length / 1024).toFixed(2)} KB`)
  console.log()

  return backup
}

/**
 * Batch delete documents from a collection
 */
async function batchDelete(collectionName, docIds) {
  const batchSize = 500

  for (let i = 0; i < docIds.length; i += batchSize) {
    const batch = db.batch()
    const batchIds = docIds.slice(i, i + batchSize)

    batchIds.forEach((id) => {
      const docRef = db.collection(collectionName).doc(id)
      batch.delete(docRef)
    })

    await batch.commit()
    console.log(
      `   Deleted ${batchIds.length} documents from ${collectionName} (${i + batchIds.length}/${docIds.length})`
    )
  }
}

/**
 * Phase 3: Deletion - Remove contaminated data
 */
async function deleteContaminatedData(discoveredData, dryRun) {
  console.log('🗑️  Deleting contaminated data...')

  if (dryRun) {
    console.log('   [DRY RUN] Would delete:')
    console.log(`   - ${discoveredData.contaminated.fakePlayerIds.length} fake players`)
    console.log(`   - ${discoveredData.contaminated.matches.length} matches`)
    console.log(
      `   - ${discoveredData.contaminated.eloHistoryIds.size} eloHistory entries`
    )
    console.log()
    return
  }

  // Delete matches
  const matchIds = discoveredData.contaminated.matches.map((m) => m.id)
  if (matchIds.length > 0) {
    await batchDelete('matches', matchIds)
  }

  // Delete eloHistory entries
  const eloHistoryIds = Array.from(discoveredData.contaminated.eloHistoryIds)
  if (eloHistoryIds.length > 0) {
    await batchDelete('eloHistory', eloHistoryIds)
  }

  // Delete fake player documents
  if (discoveredData.contaminated.fakePlayerIds.length > 0) {
    await batchDelete('players', discoveredData.contaminated.fakePlayerIds)
  }

  console.log('   Deletion complete')
  console.log()
}

/**
 * Phase 4: Recalculation - Replay matches and recalculate Elo
 */
async function recalculatePlayerElo(affectedPlayerIds, dryRun) {
  console.log('🔄 Recalculating Elo for affected players...')

  if (dryRun) {
    console.log(
      `   [DRY RUN] Would recalculate Elo for ${affectedPlayerIds.size} players`
    )
    console.log()
    return
  }

  let processedCount = 0
  const totalPlayers = affectedPlayerIds.size

  for (const playerId of affectedPlayerIds) {
    processedCount++
    await recalculateSinglePlayer(playerId, processedCount, totalPlayers)
  }

  console.log('   Recalculation complete')
  console.log()
}

/**
 * Recalculate Elo for a single player
 */
async function recalculateSinglePlayer(playerId, index, total) {
  // Get player document
  const playerDoc = await db.collection('players').doc(playerId).get()
  if (!playerDoc.exists) {
    console.warn(`   ⚠️  Player ${playerId} not found, skipping (${index}/${total})`)
    return
  }

  const player = playerDoc.data()

  // Get ALL remaining matches for this player, sorted chronologically
  const matchesAsASnapshot = await db
    .collection('matches')
    .where('playerAId', '==', playerId)
    .orderBy('timestamp', 'asc')
    .get()

  const matchesAsBSnapshot = await db
    .collection('matches')
    .where('playerBId', '==', playerId)
    .orderBy('timestamp', 'asc')
    .get()

  // Combine and sort all matches
  const allMatches = [
    ...matchesAsASnapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
    ...matchesAsBSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
  ].sort((a, b) => {
    const aTime = a.timestamp?.toMillis?.() || 0
    const bTime = b.timestamp?.toMillis?.() || 0
    return aTime - bTime
  })

  // Filter out system matches (DECAY/ACTIVITY_BONUS) - they'll be regenerated
  const regularMatches = allMatches.filter(
    (m) => m.winner !== 'DECAY' && m.winner !== 'ACTIVITY_BONUS'
  )

  // If no regular matches remain, reset to starting values
  if (regularMatches.length === 0) {
    await db.collection('players').doc(playerId).update({
      currentElo: STARTING_ELO,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      lastPlayed: null,
    })
    console.log(
      `   ${player.name}: Reset to starting values (no valid matches) (${index}/${total})`
    )
    return
  }

  // Replay matches to recalculate Elo
  let currentElo = STARTING_ELO
  let wins = 0
  let losses = 0
  let draws = 0
  let lastPlayed = null

  for (const match of regularMatches) {
    const isPlayerA = match.playerAId === playerId
    const opponentElo = isPlayerA ? match.playerBEloBefore : match.playerAEloBefore

    // Determine match outcome for this player
    let score
    if (match.winner === 'DRAW') {
      score = 0.5
      draws++
    } else if (
      (match.winner === 'A' && isPlayerA) ||
      (match.winner === 'B' && !isPlayerA)
    ) {
      score = 1
      wins++
    } else {
      score = 0
      losses++
    }

    // Calculate new Elo
    currentElo = calculateNewElo(currentElo, opponentElo, score)
    lastPlayed = match.timestamp
  }

  // Update player document
  const oldElo = player.currentElo
  await db.collection('players').doc(playerId).update({
    currentElo: currentElo,
    matchesPlayed: regularMatches.length,
    wins: wins,
    losses: losses,
    draws: draws,
    lastPlayed: lastPlayed,
  })

  const eloChange = currentElo - oldElo
  console.log(
    `   ${player.name}: ${oldElo} → ${currentElo} (${eloChange > 0 ? '+' : ''}${eloChange}) [${wins}W ${losses}L ${draws}D] (${index}/${total})`
  )
}

/**
 * Phase 5: Validation - Verify cleanup was successful
 */
async function validateCleanup(discoveredData, dryRun) {
  console.log('✅ Validating cleanup...')

  if (dryRun) {
    console.log('   [DRY RUN] Skipping validation')
    console.log()
    return true
  }

  const issues = []

  // Check 1: Verify fake players are deleted
  for (const fakeId of discoveredData.contaminated.fakePlayerIds) {
    const doc = await db.collection('players').doc(fakeId).get()
    if (doc.exists) {
      issues.push(`Fake player ${fakeId} still exists`)
    }
  }

  // Check 2: Verify contaminated matches are deleted
  for (const match of discoveredData.contaminated.matches) {
    const doc = await db.collection('matches').doc(match.id).get()
    if (doc.exists) {
      issues.push(`Contaminated match ${match.id} still exists`)
    }
  }

  // Check 3: Verify eloHistory entries are deleted
  for (const histId of discoveredData.contaminated.eloHistoryIds) {
    const doc = await db.collection('eloHistory').doc(histId).get()
    if (doc.exists) {
      issues.push(`Contaminated eloHistory ${histId} still exists`)
    }
  }

  // Check 4: Verify affected players have valid data
  for (const playerId of discoveredData.contaminated.affectedRealPlayerIds) {
    const doc = await db.collection('players').doc(playerId).get()
    if (doc.exists) {
      const player = doc.data()

      // Validate Elo range
      if (player.currentElo < 1000 || player.currentElo > 3000) {
        issues.push(
          `Player ${playerId} (${player.name}) has suspicious Elo: ${player.currentElo}`
        )
      }

      // Validate matchesPlayed is non-negative
      if (player.matchesPlayed < 0) {
        issues.push(
          `Player ${playerId} (${player.name}) has negative matchesPlayed: ${player.matchesPlayed}`
        )
      }

      // Validate win/loss/draw sum
      const totalMatches = player.wins + player.losses + (player.draws || 0)
      if (totalMatches !== player.matchesPlayed) {
        issues.push(
          `Player ${playerId} (${player.name}) has mismatched counts: ${player.wins}W + ${player.losses}L + ${player.draws || 0}D = ${totalMatches}, but matchesPlayed = ${player.matchesPlayed}`
        )
      }
    }
  }

  if (issues.length > 0) {
    console.log('   ❌ Validation failed with the following issues:')
    issues.forEach((issue) => console.error(`      - ${issue}`))
    console.log()
    return false
  }

  console.log('   ✅ All validation checks passed')
  console.log()
  return true
}

/**
 * Main execution function
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  Fake Player Cleanup Script')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (preview only)' : '⚠️  LIVE (will modify database)'}`)
  console.log(`Cutoff Date: ${CUTOFF_DATE.toISOString()}`)
  console.log(`Fake Players: ${FAKE_PLAYER_NAMES.join(', ')}`)
  console.log('═══════════════════════════════════════════════════════')
  console.log()

  try {
    // Phase 1: Discovery
    console.log('[1/5] DISCOVERY PHASE')
    console.log('───────────────────────────────────────────────────────')
    const discoveredData = await discoverContaminatedData()

    // Phase 2: Backup
    console.log('[2/5] BACKUP PHASE')
    console.log('───────────────────────────────────────────────────────')
    const backup = await backupData(discoveredData)

    // Phase 3: Deletion
    console.log('[3/5] DELETION PHASE')
    console.log('───────────────────────────────────────────────────────')
    await deleteContaminatedData(discoveredData, isDryRun)

    // Phase 4: Recalculation
    console.log('[4/5] RECALCULATION PHASE')
    console.log('───────────────────────────────────────────────────────')
    await recalculatePlayerElo(
      discoveredData.contaminated.affectedRealPlayerIds,
      isDryRun
    )

    // Phase 5: Validation
    console.log('[5/5] VALIDATION PHASE')
    console.log('───────────────────────────────────────────────────────')
    const isValid = await validateCleanup(discoveredData, isDryRun)

    // Summary
    console.log('═══════════════════════════════════════════════════════')
    if (isDryRun) {
      console.log('✅ DRY RUN COMPLETE')
      console.log()
      console.log('This was a preview. Run without --dry-run to apply changes:')
      console.log('  node scripts/cleanup-fake-matches.js')
    } else {
      if (isValid) {
        console.log('✅ CLEANUP COMPLETE')
        console.log()
        console.log('Next steps:')
        console.log('  1. Manually trigger decay recalculation:')
        console.log('     POST /api/apply-decay with CRON_SECRET')
        console.log('  2. Verify leaderboard rankings on the website')
        console.log('  3. Check match history for affected players')
      } else {
        console.log('⚠️  CLEANUP COMPLETED WITH VALIDATION ERRORS')
        console.log()
        console.log('Please review the backup file and investigate issues.')
      }
    }
    console.log('═══════════════════════════════════════════════════════')
  } catch (error) {
    console.error()
    console.error('═══════════════════════════════════════════════════════')
    console.error('❌ FATAL ERROR')
    console.error('═══════════════════════════════════════════════════════')
    console.error(error)
    console.error('═══════════════════════════════════════════════════════')
    process.exit(1)
  }
}

// Execute
main()
  .then(() => {
    console.log()
    console.log('🏁 Script finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error()
    console.error('💥 Unhandled error:', error)
    process.exit(1)
  })
