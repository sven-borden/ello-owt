# Scripts

This directory contains utility scripts for managing the Elo rating system.

## Backfill Decay Matches

**Script:** `backfill-decay-matches.js`

Creates visible match records for historical decay and activity bonus events that were logged to `eloHistory` but didn't create `matches` records.

### When to Use

Use this script if:
- You deployed the decay transparency changes after decay events already occurred
- You want historical decay/bonus events to be visible in the match history UI
- You notice that `eloHistory` has DECAY or ACTIVITY_BONUS entries but they don't show in `/matches`

### Prerequisites

1. **Firebase Admin Credentials**: You need one of the following:
   - `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable (base64 encoded JSON)
   - `service-account-key.json` file in the project root

2. **Dependencies**: Run `npm install` to ensure `firebase-admin` is installed

### Usage

#### Dry Run (Preview Changes)

Always run a dry run first to see what will be created:

```bash
node scripts/backfill-decay-matches.js --dry-run
```

This will show you:
- How many decay events were found
- How many activity bonus events were found
- Which match records will be created
- Preview of each event (player, Elo change, matchId)

#### Live Run (Apply Changes)

After reviewing the dry run output, execute the backfill:

```bash
node scripts/backfill-decay-matches.js
```

**Warning:** This writes to your Firebase database. Make sure you've reviewed the dry run output first!

### What It Does

1. **Queries** `eloHistory` collection for records with matchId starting with:
   - `DECAY-` (inactivity decay events)
   - `ACTIVITY_BONUS-` (activity bonus events)

2. **Checks** if corresponding `matches` records already exist

3. **Creates** missing match records with:
   - Player information from `players` collection
   - Calculated "before" Elo by looking at previous `eloHistory` entries
   - Proper system event formatting (SYSTEM player, DECAY/ACTIVITY_BONUS winner)

4. **Logs** detailed progress and summary

### Example Output

```
🔄 Starting backfill process...
📋 Mode: DRY RUN (no changes will be made)

📊 Fetching historical decay and activity bonus events from eloHistory...
   Found 3 decay events
   Found 2 activity bonus events

📦 Processing 5 unique match IDs...

   0 match records already exist
   5 match records need to be created

🔍  Decay: Alice (-5) - DECAY-1733040000000
🔍  Decay: Bob (-5) - DECAY-1733040000001
🔍  Bonus: Charlie (+3) - ACTIVITY_BONUS-1733040000002
🔍  Decay: Alice (-5) - DECAY-1733126400000
🔍  Bonus: Charlie (+2) - ACTIVITY_BONUS-1733126400001

📈 Backfill Summary:
   ✅ Created: 5 match records
   ⏭️  Skipped: 0 (already exist)
   ❌ Errors: 0

💡 This was a dry run. Run without --dry-run to apply changes.
🏁 Script finished
```

### Safety Features

- **Dry run mode**: Preview all changes before applying
- **Duplicate detection**: Skips match records that already exist
- **Error handling**: Continues processing if individual events fail
- **Detailed logging**: Shows exactly what's being created
- **Reversible**: Match records can be deleted if needed

### Troubleshooting

**"Player not found" warnings**

If a player was deleted from the database, the script will skip that event with a warning. This is normal and safe.

**"Cannot find module 'firebase-admin'"**

Run `npm install` to install dependencies.

**"Error loading service account credentials"**

Make sure you have either:
- `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable set, or
- `service-account-key.json` file in the project root

To get your service account key:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save as `service-account-key.json` in project root (don't commit it!)

### Notes

- The script is idempotent: running it multiple times won't create duplicates
- Match records use the same matchId as the eloHistory entries
- Created matches will appear in the match history UI immediately
- The script preserves the original timestamp from eloHistory
