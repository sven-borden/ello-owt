'use client'

import { useState } from 'react'
import Modal from './Modal'

interface AddPlayerModalProps {
  isOpen: boolean
  onClose: () => void
  onPlayerAdded: () => void
}

export default function AddPlayerModal({
  isOpen,
  onClose,
  onPlayerAdded,
}: AddPlayerModalProps) {
  const [playerName, setPlayerName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!playerName.trim()) {
      setError('Player name is required')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/add-player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: playerName.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to add player')
      }

      setPlayerName('')
      onPlayerAdded()
      onClose()
    } catch (err) {
      setError('Failed to add player. Please try again.')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setPlayerName('')
      setError('')
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Player">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-custom-600 uppercase tracking-wide mb-2">
            Player Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter player name"
            className="w-full px-3 py-2 text-sm border border-gray-custom-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            disabled={isSubmitting}
            autoFocus
          />
          <p className="mt-2 text-xs text-gray-custom-500">
            New players start with an Elo rating of 1200
          </p>
        </div>

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
            className="flex-1 bg-brand-blue text-white font-semibold py-2.5 px-4 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isSubmitting ? 'Adding...' : 'Add Player'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
