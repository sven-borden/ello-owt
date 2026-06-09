'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Player, Match, EloHistory } from '@/lib/types'
import MatchHistoryTable from '@/components/MatchHistoryTable'
import ErrorState from '@/components/ErrorState'

// recharts is heavy and only used here; keep it out of the initial bundle.
const EloChart = dynamic(() => import('@/components/EloChart'), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-label="Loading chart"
      className="bg-white rounded-lg shadow-md border border-gray-custom-300 p-6 h-[372px] animate-pulse"
    >
      <div className="h-5 w-48 bg-gray-custom-100 rounded mb-6" />
      <div className="h-[300px] bg-gray-custom-50 rounded" />
    </div>
  ),
})

export default function PlayerPage() {
  const params = useParams()
  const playerId = params?.id as string

  const [player, setPlayer] = useState<Player | null>(null)
  const [eloHistory, setEloHistory] = useState<EloHistory[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlayerData = async () => {
    if (!playerId) return

    setLoading(true)
    setError(null)
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
            draws: data.draws || 0,
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
    } catch (err) {
      console.error('Error fetching player data:', err)
      setError('Could not load this player. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlayerData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId])

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-center min-h-[400px]"
      >
        <div className="text-gray-custom-600 text-lg">Loading player data...</div>
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchPlayerData} />
  }

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="text-4xl mb-4" aria-hidden="true">♟️</div>
        <p className="text-gray-custom-700 text-lg font-semibold mb-2">Player not found</p>
        <p className="text-sm text-gray-custom-600 mb-6">
          This player may have been removed.
        </p>
        <Link
          href="/"
          className="bg-brand-red text-white font-semibold py-2.5 px-6 rounded-lg hover:shadow-lg transition-all text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2"
        >
          Back to leaderboard
        </Link>
      </div>
    )
  }

  const winRate = player.matchesPlayed > 0 ? (player.wins / player.matchesPlayed) * 100 : 0

  return (
    <div className="space-y-8">
      {/* Player Header */}
      <div className="bg-white rounded-lg shadow-md border border-gray-custom-300 p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-4xl font-bold text-almost-black mb-2 break-words">
              {player.name}
            </h1>
            <p className="text-gray-custom-600">
              Member since {player.createdAt.toLocaleDateString()}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-5xl font-bold text-brand-red">
              {player.currentElo}
            </div>
            <div className="text-sm text-gray-custom-600 mt-1">Current Elo</div>
          </div>
        </div>
      </div>

      {/* Performance: win rate leads, record breaks it down */}
      <div className="bg-white rounded-lg shadow-md border border-gray-custom-300 p-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-extrabold tabular-nums text-brand-red leading-none">
                {winRate.toFixed(0)}
              </span>
              <span className="text-2xl font-bold text-brand-red">%</span>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-custom-700">
              Win rate over {player.matchesPlayed}{' '}
              {player.matchesPlayed === 1 ? 'match' : 'matches'}
            </p>
          </div>

          <dl className="flex gap-6 text-center">
            <div>
              <dd className="text-3xl font-bold tabular-nums text-green-700 leading-none">
                {player.wins}
              </dd>
              <dt className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-custom-600">
                Won
              </dt>
            </div>
            <div>
              <dd className="text-3xl font-bold tabular-nums text-red-700 leading-none">
                {player.losses}
              </dd>
              <dt className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-custom-600">
                Lost
              </dt>
            </div>
            <div>
              <dd className="text-3xl font-bold tabular-nums text-gray-custom-700 leading-none">
                {player.draws}
              </dd>
              <dt className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-custom-600">
                Drawn
              </dt>
            </div>
          </dl>
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
