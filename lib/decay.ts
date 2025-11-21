/**
 * Elo Decay System
 *
 * This module handles Elo rating decay for inactive players to prevent
 * users from sitting on high ratings without playing.
 */

// Decay configuration constants
export const DECAY_CONFIG = {
  // Number of days before decay starts (7 days = 1 week)
  INACTIVITY_THRESHOLD_DAYS: 7,

  // Elo points lost per decay period (7 days)
  DECAY_POINTS_PER_PERIOD: 5,

  // Length of each decay period in days
  DECAY_PERIOD_DAYS: 7,

  // Minimum Elo rating (decay stops here)
  MINIMUM_ELO: 1000,

  // Match ID prefix for decay events in eloHistory
  DECAY_MATCH_ID_PREFIX: 'DECAY',
}

/**
 * Calculate how much Elo should be decayed based on inactivity
 *
 * @param currentElo - The player's current Elo rating
 * @param lastPlayedDate - Date when the player last played (or null if never played)
 * @param currentDate - Current date (defaults to now, can be overridden for testing)
 * @returns Object containing the new Elo rating and decay amount applied
 */
export function calculateDecay(
  currentElo: number,
  lastPlayedDate: Date | null,
  currentDate: Date = new Date()
): {
  newElo: number
  decayAmount: number
  shouldDecay: boolean
  inactiveDays: number
} {
  // If player has never played, no decay
  if (!lastPlayedDate) {
    return {
      newElo: currentElo,
      decayAmount: 0,
      shouldDecay: false,
      inactiveDays: 0,
    }
  }

  // Calculate days of inactivity
  const millisecondsPerDay = 1000 * 60 * 60 * 24
  const inactiveDays = Math.floor(
    (currentDate.getTime() - lastPlayedDate.getTime()) / millisecondsPerDay
  )

  // If player is still within the inactivity threshold, no decay
  if (inactiveDays < DECAY_CONFIG.INACTIVITY_THRESHOLD_DAYS) {
    return {
      newElo: currentElo,
      decayAmount: 0,
      shouldDecay: false,
      inactiveDays,
    }
  }

  // If player is already at or below minimum Elo, no decay
  if (currentElo <= DECAY_CONFIG.MINIMUM_ELO) {
    return {
      newElo: currentElo,
      decayAmount: 0,
      shouldDecay: false,
      inactiveDays,
    }
  }

  // Calculate decay amount based on inactive periods
  const inactivePeriods = Math.floor(
    (inactiveDays - DECAY_CONFIG.INACTIVITY_THRESHOLD_DAYS) / DECAY_CONFIG.DECAY_PERIOD_DAYS
  )

  // Each complete period after threshold causes decay
  const totalDecay = (inactivePeriods + 1) * DECAY_CONFIG.DECAY_POINTS_PER_PERIOD

  // Apply decay but don't go below minimum
  const newElo = Math.max(
    DECAY_CONFIG.MINIMUM_ELO,
    currentElo - totalDecay
  )

  const actualDecay = currentElo - newElo

  return {
    newElo,
    decayAmount: actualDecay,
    shouldDecay: actualDecay > 0,
    inactiveDays,
  }
}

/**
 * Generate a decay match ID for eloHistory tracking
 */
export function generateDecayMatchId(): string {
  return `${DECAY_CONFIG.DECAY_MATCH_ID_PREFIX}-${Date.now()}`
}

/**
 * Check if a match ID represents a decay event
 */
export function isDecayEvent(matchId: string): boolean {
  return matchId.startsWith(DECAY_CONFIG.DECAY_MATCH_ID_PREFIX)
}
