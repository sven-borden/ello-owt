'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Player, Match, EloHistory } from '@/lib/types'
import EloChart from '@/components/EloChart'
import MatchHistoryTable from '@/components/MatchHistoryTable'

export default function PlayerPage() {
  const params = useParams()
  const playerId = params?.id as string

  const [player, setPlayer] = useState<Player | null>(null)
  const [eloHistory, setEloHistory] = useState<EloHistory[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!playerId) return

      try {
        // Fetch player data
        const playerDoc = await getDoc(doc(db, 'players', playerId))
        if (playerDoc.exists()) {
          const data = playerDoc.data()
          setPlayer({
            id: playerDoc.id,
            name: data.name,
            currentElo: data.currentElo,
            matchesPlayed: data.matchesPlayed,
            wins: data.wins,
            losses: data.losses,
            createdAt: data.createdAt?.toDate() || new Date(),
          })
        }

        // Fetch Elo history
        const historyQuery = query(
          collection(db, 'eloHistory'),
          where('playerId', '==', playerId),
          orderBy('timestamp', 'asc')
        )
        const historySnapshot = await getDocs(historyQuery)
        const historyData: EloHistory[] = []
        historySnapshot.forEach((doc) => {
          const data = doc.data()
          historyData.push({
            id: doc.id,
            playerId: data.playerId,
            elo: data.elo,
            timestamp: data.timestamp?.toDate() || new Date(),
            matchId: data.matchId,
          })
        })
        setEloHistory(historyData)

        // Fetch player matches
        const matchesQueryA = query(
          collection(db, 'matches'),
          where('playerAId', '==', playerId),
          orderBy('timestamp', 'desc')
        )
        const matchesQueryB = query(
          collection(db, 'matches'),
          where('playerBId', '==', playerId),
          orderBy('timestamp', 'desc')
        )

        const [matchesASnapshot, matchesBSnapshot] = await Promise.all([
          getDocs(matchesQueryA),
          getDocs(matchesQueryB),
        ])

        const matchesData: Match[] = []
        matchesASnapshot.forEach((doc) => {
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
        matchesBSnapshot.forEach((doc) => {
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

        // Sort matches by timestamp
        matchesData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        setMatches(matchesData)
      } catch (error) {
        console.error('Error fetching player data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlayerData()
  }, [playerId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-custom-600 text-lg">Loading player data...</div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-custom-600 text-lg">Player not found</div>
      </div>
    )
  }

  const winRate = player.matchesPlayed > 0 ? (player.wins / player.matchesPlayed) * 100 : 0

  return (
    <div className="space-y-8">
      {/* Player Header */}
      <div className="bg-white rounded-lg shadow-md border border-gray-custom-300 p-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-almost-black mb-2">
              {player.name}
            </h1>
            <p className="text-gray-custom-600">
              Member since {player.createdAt.toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-brand-red">
              {player.currentElo}
            </div>
            <div className="text-sm text-gray-custom-600 mt-1">Current Elo</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md border border-gray-custom-300 p-6">
          <h3 className="text-sm font-semibold text-gray-custom-600 mb-2">
            Matches Played
          </h3>
          <p className="text-3xl font-bold text-brand-red">{player.matchesPlayed}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-custom-300 p-6">
          <h3 className="text-sm font-semibold text-gray-custom-600 mb-2">
            Wins
          </h3>
          <p className="text-3xl font-bold text-green-600">{player.wins}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-custom-300 p-6">
          <h3 className="text-sm font-semibold text-gray-custom-600 mb-2">
            Losses
          </h3>
          <p className="text-3xl font-bold text-red-600">{player.losses}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-custom-300 p-6">
          <h3 className="text-sm font-semibold text-gray-custom-600 mb-2">
            Win Rate
          </h3>
          <p className="text-3xl font-bold text-brand-red">{winRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Elo Chart */}
      <EloChart history={eloHistory} />

      {/* Match History */}
      <div>
        <h2 className="text-2xl font-bold text-almost-black mb-4">
          Recent Matches
        </h2>
        <MatchHistoryTable matches={matches} />
      </div>
    </div>
  )
}
