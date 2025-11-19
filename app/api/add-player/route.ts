import { NextRequest, NextResponse } from 'next/server'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { STARTING_ELO } from '@/lib/elo'

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      )
    }

    // Create new player document
    const playerData = {
      name: name.trim(),
      currentElo: STARTING_ELO,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      createdAt: Timestamp.now(),
    }

    const docRef = await addDoc(collection(db, 'players'), playerData)

    return NextResponse.json(
      {
        success: true,
        playerId: docRef.id,
        message: `Player ${name} added successfully with starting Elo of ${STARTING_ELO}`
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
