'use client'

import { useState } from 'react'
import { Player } from '@/lib/types'
import Modal from './Modal'
import WinnerSelector from './WinnerSelector'

interface RecordMatchModalProps {
  isOpen: boolean
  onClose: () => void
  players: Player[]
  onMatchRecorded: () => void
}

export default function RecordMatchModal({
  isOpen,
  onClose,
  players,
  onMatchRecorded,
}: RecordMatchModalProps) {
  const [playerAId, setPlayerAId] = useState('')
  const [playerBId, setPlayerBId] = useState('')
  const [winner, setWinner] = useState<'A' | 'B' | 'DRAW' | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
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

      // Success! Reset form and close modal
      setPlayerAId('')
      setPlayerBId('')
      setWinner('')
      onMatchRecorded()
      onClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit match. Please try again.'
      setError(errorMessage)
      console.error('Error submitting match:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setPlayerAId('')
      setPlayerBId('')
      setWinner('')
      setError('')
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Record Match">
      <form onSubmit={handleSubmit} className="space-y-4">
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
            {players
              .filter((player) => player.id !== playerBId)
              .map((player) => (
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
            {players
              .filter((player) => player.id !== playerAId)
              .map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} ({player.currentElo})
                </option>
              ))}
          </select>
        </div>

        <WinnerSelector
          winner={winner}
          onWinnerChange={(w) => setWinner(w)}
          playerAName={players.find((p) => p.id === playerAId)?.name}
          playerBName={players.find((p) => p.id === playerBId)?.name}
          disabled={isSubmitting}
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 bg-gray-custom-200 text-gray-custom-700 font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-custom-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-brand-red text-white font-semibold py-2.5 px-4 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isSubmitting ? 'Recording...' : 'Record Match'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
