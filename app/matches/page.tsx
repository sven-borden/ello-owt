'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Match } from '@/lib/types'
import MatchHistoryTable from '@/components/MatchHistoryTable'

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const matchesQuery = query(
          collection(db, 'matches'),
          orderBy('timestamp', 'desc')
        )
        const querySnapshot = await getDocs(matchesQuery)
        const matchesData: Match[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          matchesData.push({
            id: doc.id,
            playerAId: data.playerAId,
            playerBId: data.playerBId,
            playerAName: data.playerAName,
            playerBName: data.playerBName,
            winner: data.winner,
            playerAEloBefore: data.playerAEloBefore,
            playerBEloBefore: data.playerBEloBefore,
            playerAEloAfter: data.playerAEloAfter,
            playerBEloAfter: data.playerBEloAfter,
            timestamp: data.timestamp?.toDate() || new Date(),
          })
        })

        setMatches(matchesData)
      } catch (error) {
        console.error('Error fetching matches:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-custom-600 text-lg">Loading matches...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-almost-black mb-2">
          Match History
        </h1>
        <p className="text-gray-custom-600">
          Complete history of all chess matches and Elo changes
        </p>
      </div>

      <MatchHistoryTable matches={matches} />
    </div>
  )
}
