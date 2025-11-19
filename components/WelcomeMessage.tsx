'use client'

import { useEffect, useState } from 'react'

const WELCOME_MESSAGES = [
  // Chess Puns & Wordplay
  "Welcome back! Ready to make your move?",
  "Check in, check out... just don't get checkmated!",
  "Time to castle your way to the top!",
  "Pawn to be here? More like BORN to be here!",
  "Knight to see you again!",
  "Let's get this game started! Your move.",

  // Competitive & Motivational
  "The leaderboard awaits. Will you rise or fall today?",
  "Every grandmaster was once a beginner. Your journey continues here.",
  "Today's rating is tomorrow's history. Make it count!",
  "Champions aren't born on the board—they're forged one move at a time.",
  "The King's throne is waiting. Will you claim it?",

  // Casual & Friendly
  "Welcome to the OWT Chess Arena!",
  "Another day, another chance to dominate the board!",
  "Ready to record some epic battles?",
  "The pieces are set. The clock is ticking. Let's play!",
  "Back for more chess glory? You're in the right place!",

  // Swiss/OWT Themed
  "Welcome to OWT Swiss Chess—where precision meets competition!",
  "Swiss style: Clean. Minimal. Competitive. Let's play.",
  "The OWT Chess Arena: Where office legends are made!",
]

export default function WelcomeMessage() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Select a random message on component mount
    const randomIndex = Math.floor(Math.random() * WELCOME_MESSAGES.length)
    setMessage(WELCOME_MESSAGES[randomIndex])
  }, [])

  if (!message) return null

  return (
    <div className="bg-gradient-to-r from-brand-red to-brand-blue rounded-lg shadow-sm p-6 mb-6">
      <p className="text-white text-lg md:text-xl font-semibold text-center">
        {message}
      </p>
    </div>
  )
}
