'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Player } from '@/lib/types'
import LeaderboardCard from '@/components/LeaderboardCard'
import AddPlayerForm from '@/components/AddPlayerForm'

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [playerAId, setPlayerAId] = useState('')
  const [playerBId, setPlayerBId] = useState('')
  const [winner, setWinner] = useState<'A' | 'B' | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Fetch players from Firestore
  const fetchPlayers = async () => {
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
          createdAt: data.createdAt?.toDate() || new Date(),
        })
      })

      setPlayers(playersData)
    } catch (error) {
      console.error('Error fetching players:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlayers()
  }, [])

  // Handle match submission using server-side API route
  const handleMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!playerAId || !playerBId) {
      setError('Please select both players')
      return
    }

    if (playerAId === playerBId) {
      setError('Players must be different')
      return
    }

    if (!winner) {
      setError('Please select a winner')
      return
    }

    setIsSubmitting(true)
    try {
      // Call the API route - Elo calculation happens server-side
      const response = await fetch('/api/record-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerAId,
          playerBId,
          winner,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record match')
      }

      // Success! Refresh player list to show updated Elo ratings
      await fetchPlayers()

      // Reset form
      setPlayerAId('')
      setPlayerBId('')
      setWinner('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit match. Please try again.'
      setError(errorMessage)
      console.error('Error submitting match:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-custom-600 text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-custom-300 p-6">
          <h3 className="text-xs font-semibold text-gray-custom-600 uppercase tracking-wide mb-1">
            Total Players
          </h3>
          <p className="text-3xl font-bold text-brand-red">{players.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-custom-300 p-6">
          <h3 className="text-xs font-semibold text-gray-custom-600 uppercase tracking-wide mb-1">
            Total Matches
          </h3>
          <p className="text-3xl font-bold text-brand-red">
            {players.reduce((sum, p) => sum + p.matchesPlayed, 0) / 2}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-custom-300 p-6">
          <h3 className="text-xs font-semibold text-gray-custom-600 uppercase tracking-wide mb-1">
            Average Elo
          </h3>
          <p className="text-3xl font-bold text-brand-red">
            {players.length > 0
              ? Math.round(
                  players.reduce((sum, p) => sum + p.currentElo, 0) /
                    players.length
                )
              : 0}
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content (Leaderboard) */}
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
                <p className="text-sm text-gray-custom-500">
                  Add your first player using the form on the right to get started.
                  Players start with an Elo rating of 1200.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-custom-300 p-6 sticky top-6">
            <h2 className="text-xl font-bold text-almost-black mb-6">
              Quick Actions
            </h2>
            <div className="space-y-6">
              {/* Record Match */}
              {players.length >= 2 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-custom-700 mb-3">
                    Record Match
                  </h3>
                  <form onSubmit={handleMatchSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-custom-600 uppercase tracking-wide mb-2">
                        Player A
                      </label>
                      <select
                        value={playerAId}
                        onChange={(e) => setPlayerAId(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-custom-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent bg-white"
                        disabled={isSubmitting}
                      >
                        <option value="">Select Player A</option>
                        {players.map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.name} ({player.currentElo})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-custom-600 uppercase tracking-wide mb-2">
                        Player B
                      </label>
                      <select
                        value={playerBId}
                        onChange={(e) => setPlayerBId(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-custom-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent bg-white"
                        disabled={isSubmitting}
                      >
                        <option value="">Select Player B</option>
                        {players.map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.name} ({player.currentElo})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-custom-600 uppercase tracking-wide mb-2">
                        Winner
                      </label>
                      <select
                        value={winner}
                        onChange={(e) => setWinner(e.target.value as 'A' | 'B' | '')}
                        className="w-full px-3 py-2 text-sm border border-gray-custom-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent bg-white"
                        disabled={isSubmitting}
                      >
                        <option value="">Select Winner</option>
                        <option value="A">Player A Wins</option>
                        <option value="B">Player B Wins</option>
                      </select>
                    </div>

                    {error && (
                      <div className="p-2 bg-red-50 border border-red-300 rounded text-red-700 text-xs">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-brand-red text-white font-semibold py-2.5 px-4 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isSubmitting ? 'Recording...' : 'Record Match'}
                    </button>
                  </form>
                </div>
              )}

              {/* Add Player */}
              <div className={players.length >= 2 ? "pt-6 border-t border-gray-custom-200" : ""}>
                <h3 className="text-sm font-semibold text-gray-custom-700 mb-3">
                  Add New Player
                </h3>
                <AddPlayerForm onPlayerAdded={fetchPlayers} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
