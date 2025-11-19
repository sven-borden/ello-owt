/**
 * Elo rating constants
 *
 * NOTE: Elo calculation logic has been moved to the server-side API route
 * at app/api/record-match/route.ts to prevent client-side manipulation.
 * This file now only exports constants used by other parts of the application.
 */

/**
 * Starting Elo rating for new players
 */
export const STARTING_ELO = 1200

/**
 * K-factor determines rating volatility (higher = more volatile)
 * 32 is standard for moderate volatility
 */
export const K_FACTOR = 32
