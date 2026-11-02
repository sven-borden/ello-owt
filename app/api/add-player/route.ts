import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdmin } from '@/lib/firebase-admin'
import { STARTING_ELO } from '@/lib/elo'
import { parsePlayerName, readJsonBody } from '@/lib/api-guards'

export async function POST(request: NextRequest) {
  try {
    const parsedBody = await readJsonBody(request)
    if (!parsedBody.ok) {
      return parsedBody.response
    }

    const parsedName = parsePlayerName(parsedBody.body.name)
    if (!parsedName.ok) {
      return NextResponse.json({ error: parsedName.error }, { status: 400 })
    }
    const { name } = parsedName

    // Initialize Firebase Admin (lazy initialization)
    const adminDb = getAdminDb()
    const admin = getAdmin()

    // Calculate average ELO from all existing players
    const playersSnapshot = await adminDb.collection('players').get()
    let startingElo = STARTING_ELO // Default to 1200 if no players exist

    if (!playersSnapshot.empty) {
      const totalElo = playersSnapshot.docs.reduce((sum, doc) => {
        const playerData = doc.data()
        return sum + (playerData.currentElo || 0)
      }, 0)
      startingElo = Math.round(totalElo / playersSnapshot.size)
    }

    // Create new player document
    const playerData = {
      name,
      currentElo: startingElo,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastPlayed: null, // New players haven't played yet
    }

    const docRef = await adminDb.collection('players').add(playerData)

    return NextResponse.json(
      {
        success: true,
        playerId: docRef.id,
        message: `Player ${name} added successfully with starting Elo of ${startingElo}`
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding player:', error)
    return NextResponse.json(
      { error: 'Failed to add player' },
      { status: 500 }
    )
  }
}
