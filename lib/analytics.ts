import { logEvent, setUserProperties } from 'firebase/analytics'
import { analytics } from './firebase'

/**
 * Analytics utility functions for tracking user behavior and app usage
 * Uses Firebase Analytics (Google Analytics)
 */

// Track page views
export const trackPageView = (pageName: string, pageTitle?: string) => {
  if (!analytics) return

  logEvent(analytics, 'page_view', {
    page_title: pageTitle || pageName,
    page_location: window.location.href,
    page_path: window.location.pathname,
  })
}

// Track match recording
export const trackMatchRecorded = (
  playerAName: string,
  playerBName: string,
  winner: 'A' | 'B',
  eloChange: number
) => {
  if (!analytics) return

  logEvent(analytics, 'match_recorded', {
    player_a: playerAName,
    player_b: playerBName,
    winner: winner,
    elo_change: eloChange,
  })
}

// Track player creation
export const trackPlayerAdded = (playerName: string) => {
  if (!analytics) return

  logEvent(analytics, 'player_added', {
    player_name: playerName,
  })
}

// Track player profile views
export const trackPlayerProfileView = (playerId: string, playerName: string) => {
  if (!analytics) return

  logEvent(analytics, 'player_profile_view', {
    player_id: playerId,
    player_name: playerName,
  })
}

// Track match history views
export const trackMatchHistoryView = (filterType?: string) => {
  if (!analytics) return

  logEvent(analytics, 'match_history_view', {
    filter_type: filterType || 'all',
  })
}

// Track errors
export const trackError = (errorType: string, errorMessage: string) => {
  if (!analytics) return

  logEvent(analytics, 'error', {
    error_type: errorType,
    error_message: errorMessage,
  })
}

// Track search/filter actions
export const trackSearch = (searchTerm: string, resultCount: number) => {
  if (!analytics) return

  logEvent(analytics, 'search', {
    search_term: searchTerm,
    result_count: resultCount,
  })
}

// Set user properties (optional - for segmentation)
export const setAnalyticsUserProperties = (properties: {
  user_type?: 'admin' | 'player' | 'viewer'
  preferred_language?: string
}) => {
  if (!analytics) return

  setUserProperties(analytics, properties)
}

// Track custom events
export const trackCustomEvent = (
  eventName: string,
  eventParams?: Record<string, string | number | boolean>
) => {
  if (!analytics) return

  logEvent(analytics, eventName, eventParams)
}
