/**
 * Backfill Script: Create Match Records for Historical Decay Events
 *
 * This script creates visible match records for historical decay and activity bonus
 * events that were logged to eloHistory but didn't create matches records.
 *
 * Usage:
 *   node scripts/backfill-decay-matches.js [--dry-run]
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

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')

// Initialize Firebase Admin
let serviceAccount
try {
  // Try environment variable first (for production/Vercel)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8')
    serviceAccount = JSON.parse(decoded)
  } else {
    // Fall back to local file
    serviceAccount = require('../service-account-key.json')
  }
} catch (error) {
  console.error('❌ Error loading service account credentials:')
  console.error('   Make sure FIREBASE_SERVICE_ACCOUNT_KEY env var is set or service-account-key.json exists')
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

/**
 * Main backfill function
 */
async function backfillDecayMatches() {
  console.log('🔄 Starting backfill process...')
  console.log(`📋 Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (will write to database)'}`)
  console.log()

  try {
    // Step 1: Get all eloHistory records with DECAY or ACTIVITY_BONUS matchIds
    console.log('📊 Fetching historical decay and activity bonus events from eloHistory...')
    const eloHistorySnapshot = await db.collection('eloHistory').get()

    const decayEvents = []
    const activityBonusEvents = []

    for (const doc of eloHistorySnapshot.docs) {
      const data = doc.data()
      if (data.matchId && data.matchId.startsWith('DECAY-')) {
        decayEvents.push({ id: doc.id, ...data })
      } else if (data.matchId && data.matchId.startsWith('ACTIVITY_BONUS-')) {
        activityBonusEvents.push({ id: doc.id, ...data })
      }
    }

    console.log(`   Found ${decayEvents.length} decay events`)
    console.log(`   Found ${activityBonusEvents.length} activity bonus events`)
    console.log()

    if (decayEvents.length === 0 && activityBonusEvents.length === 0) {
      console.log('✅ No historical events found. Nothing to backfill.')
      return
    }

    // Step 2: Group events by matchId to avoid duplicates
    const allEvents = [...decayEvents, ...activityBonusEvents]
    const eventsByMatchId = new Map()

    for (const event of allEvents) {
      if (!eventsByMatchId.has(event.matchId)) {
        eventsByMatchId.set(event.matchId, [])
      }
      eventsByMatchId.get(event.matchId).push(event)
    }

    console.log(`📦 Processing ${eventsByMatchId.size} unique match IDs...`)
    console.log()

    // Step 3: Check which match records already exist
    const existingMatches = new Set()
    for (const matchId of eventsByMatchId.keys()) {
      const matchDoc = await db.collection('matches').doc(matchId).get()
      if (matchDoc.exists) {
        existingMatches.add(matchId)
      }
    }

    console.log(`   ${existingMatches.size} match records already exist`)
    console.log(`   ${eventsByMatchId.size - existingMatches.size} match records need to be created`)
    console.log()

    // Step 4: Create missing match records
    let created = 0
    let skipped = 0
    let errors = 0

    for (const [matchId, events] of eventsByMatchId.entries()) {
      if (existingMatches.has(matchId)) {
        skipped++
        continue
      }

      // Get the first event to extract match details
      const event = events[0]
      const isDecay = matchId.startsWith('DECAY-')
      const isActivityBonus = matchId.startsWith('ACTIVITY_BONUS-')

      try {
        // Fetch player information
        const playerDoc = await db.collection('players').doc(event.playerId).get()

        if (!playerDoc.exists) {
          console.warn(`⚠️  Player ${event.playerId} not found for ${matchId}, skipping...`)
          errors++
          continue
        }

        const player = playerDoc.data()

        // Calculate Elo before (reverse calculate from the event)
        // We need to find the previous eloHistory entry to get the "before" value
        const previousEloQuery = await db.collection('eloHistory')
          .where('playerId', '==', event.playerId)
          .where('timestamp', '<', event.timestamp)
          .orderBy('timestamp', 'desc')
          .limit(1)
          .get()

        let playerEloBefore = event.elo // Default to current if we can't find previous
        if (!previousEloQuery.empty) {
          playerEloBefore = previousEloQuery.docs[0].data().elo
        }

        const matchData = {
          playerAId: event.playerId,
          playerBId: 'SYSTEM',
          playerAName: player.name,
          playerBName: isDecay ? 'Decay System' : 'Activity Bonus',
          winner: isDecay ? 'DECAY' : 'ACTIVITY_BONUS',
          playerAEloBefore: playerEloBefore,
          playerBEloBefore: 0,
          playerAEloAfter: event.elo,
          playerBEloAfter: 0,
          timestamp: event.timestamp,
        }

        const eloChange = matchData.playerAEloAfter - matchData.playerAEloBefore

        console.log(`${isDryRun ? '🔍' : '✏️'}  ${isDecay ? 'Decay' : 'Bonus'}: ${player.name} (${eloChange > 0 ? '+' : ''}${eloChange}) - ${matchId}`)

        if (!isDryRun) {
          await db.collection('matches').doc(matchId).set(matchData)
        }

        created++
      } catch (error) {
        console.error(`❌ Error processing ${matchId}:`, error.message)
        errors++
      }
    }

    console.log()
    console.log('📈 Backfill Summary:')
    console.log(`   ✅ Created: ${created} match records`)
    console.log(`   ⏭️  Skipped: ${skipped} (already exist)`)
    console.log(`   ❌ Errors: ${errors}`)
    console.log()

    if (isDryRun) {
      console.log('💡 This was a dry run. Run without --dry-run to apply changes.')
    } else {
      console.log('✅ Backfill complete! All historical decay events are now visible in match history.')
    }

  } catch (error) {
    console.error('❌ Fatal error during backfill:', error)
    process.exit(1)
  }
}

// Run the backfill
backfillDecayMatches()
  .then(() => {
    console.log('🏁 Script finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Unhandled error:', error)
    process.exit(1)
  })
