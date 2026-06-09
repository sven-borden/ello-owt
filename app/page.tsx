'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Player } from '@/lib/types'
import LeaderboardCard from '@/components/LeaderboardCard'
import RecordMatchModal from '@/components/RecordMatchModal'
import AddPlayerModal from '@/components/AddPlayerModal'
import WelcomeMessage from '@/components/WelcomeMessage'
import ErrorState from '@/components/ErrorState'

export default function Home() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRecordMatchModalOpen, setIsRecordMatchModalOpen] = useState(false)
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false)

  // Fetch players from Firestore
  const fetchPlayers = async () => {
    setLoading(true)
    setError(null)
    try {
      const playersQuery = query(collection(db, 'players'), orderBy('currentElo', 'desc'))
      const querySnapshot = await getDocs(playersQuery)
      const playersData: Player[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        playersData.push({
          id: doc.id,
          name: data.name,
          currentElo: data.currentElo,
          matchesPlayed: data.matchesPlayed,
          wins: data.wins,
          losses: data.losses,
          draws: data.draws || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
        })
      })

      setPlayers(playersData)
    } catch (err) {
      console.error('Error fetching players:', err)
      setError('Could not load the leaderboard. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlayers()
  }, [])

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-center min-h-[400px]"
      >
        <div className="text-gray-custom-600 text-lg">Loading leaderboard...</div>
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchPlayers} />
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <WelcomeMessage />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Sidebar with Quick Actions and Stats */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-custom-300 p-6 sticky top-6">
            <h2 className="text-xl font-bold text-almost-black mb-6">
              Quick Actions
            </h2>
            <div className="space-y-3 mb-6">
              {/* Record Match Button */}
              {players.length >= 2 && (
                <button
                  onClick={() => setIsRecordMatchModalOpen(true)}
                  className="w-full bg-brand-red text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Record Match
                </button>
              )}

              {/* Add Player Button */}
              <button
                onClick={() => setIsAddPlayerModalOpen(true)}
                className="w-full bg-brand-blue text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Add New Player
              </button>

              {/* How It Works Button */}
              <button
                onClick={() => router.push('/how-it-works')}
                className="w-full bg-brand-gold text-white font-semibold py-3 px-4 rounded-lg hover:bg-brand-gold-light hover:text-almost-black transition-all text-sm flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How It Works
              </button>
            </div>

            {/* Stats: one emphasized hero, two secondary readouts */}
            <div className="border-t border-gray-custom-200 pt-6">
              <Link
                href="/matches"
                className="group block -mx-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-gray-custom-50 focus:outline-none focus:ring-2 focus:ring-brand-red"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold tabular-nums text-brand-red leading-none">
                    {players.reduce((sum, p) => sum + p.matchesPlayed, 0) / 2}
                  </span>
                  <span className="text-sm font-medium text-gray-custom-700">
                    matches played
                  </span>
                </div>
                <span className="text-xs text-gray-custom-600 group-hover:text-brand-red transition-colors">
                  View full history →
                </span>
              </Link>

              <dl className="mt-5 flex gap-8 text-gray-custom-700">
                <div>
                  <dd className="text-2xl font-bold tabular-nums text-almost-black leading-none">
                    {players.length}
                  </dd>
                  <dt className="mt-1 text-xs text-gray-custom-600">Players</dt>
                </div>
                <div>
                  <dd className="text-2xl font-bold tabular-nums text-almost-black leading-none">
                    {players.length > 0
                      ? Math.round(
                          players.reduce((sum, p) => sum + p.currentElo, 0) /
                            players.length
                        )
                      : 0}
                  </dd>
                  <dt className="mt-1 text-xs text-gray-custom-600">Avg Elo</dt>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Right Column - Main Content (Leaderboard) */}
        <div className="lg:col-span-2">
          {players.length > 0 ? (
            <LeaderboardCard players={players} />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-custom-300 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="text-5xl mb-4">♟️</div>
                <p className="text-gray-custom-700 text-lg font-semibold mb-2">
                  No players yet
                </p>
                <p className="text-sm text-gray-custom-600">
                  Add your first player using the quick actions to get started.
                  Players start with an Elo rating of 1200.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <RecordMatchModal
        isOpen={isRecordMatchModalOpen}
        onClose={() => setIsRecordMatchModalOpen(false)}
        players={players}
        onMatchRecorded={fetchPlayers}
      />
      <AddPlayerModal
        isOpen={isAddPlayerModalOpen}
        onClose={() => setIsAddPlayerModalOpen(false)}
        onPlayerAdded={fetchPlayers}
      />
    </div>
  )
}
