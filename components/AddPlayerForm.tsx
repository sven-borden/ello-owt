'use client'

import { useState } from 'react'

interface AddPlayerFormProps {
  onPlayerAdded: () => void
}

export default function AddPlayerForm({ onPlayerAdded }: AddPlayerFormProps) {
  const [playerName, setPlayerName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

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
      setShowForm(false)
      onPlayerAdded()
    } catch (err) {
      setError('Failed to add player. Please try again.')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full bg-brand-blue text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-brand-blue-dark transition-all hover:shadow-md text-sm"
      >
        + Add Player
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Player name"
          className="w-full px-3 py-2 text-sm border border-gray-custom-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          disabled={isSubmitting}
          autoFocus
        />
      </div>

      {error && (
        <div className="p-2 bg-red-50 border border-red-300 rounded text-red-700 text-xs">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-brand-blue text-white font-semibold py-2 px-3 rounded-lg hover:bg-brand-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isSubmitting ? 'Adding...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowForm(false)
            setPlayerName('')
            setError('')
          }}
          disabled={isSubmitting}
          className="px-3 py-2 text-gray-custom-600 hover:text-gray-custom-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
