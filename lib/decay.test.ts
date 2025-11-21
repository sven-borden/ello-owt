/**
 * Tests for Elo decay functionality
 */

import { calculateDecay, DECAY_CONFIG } from './decay'

describe('Elo Decay System', () => {
  const CURRENT_DATE = new Date('2024-06-01T00:00:00Z')

  describe('calculateDecay', () => {
    it('should not decay if player has never played', () => {
      const result = calculateDecay(1500, null, CURRENT_DATE)
      expect(result).toEqual({
        newElo: 1500,
        decayAmount: 0,
        shouldDecay: false,
        inactiveDays: 0,
      })
    })

    it('should not decay if player played within threshold', () => {
      // Player played 15 days ago (within 30 day threshold)
      const lastPlayed = new Date('2024-05-17T00:00:00Z')
      const result = calculateDecay(1500, lastPlayed, CURRENT_DATE)

      expect(result.shouldDecay).toBe(false)
      expect(result.decayAmount).toBe(0)
      expect(result.newElo).toBe(1500)
      expect(result.inactiveDays).toBe(15)
    })

    it('should decay after 30 days of inactivity (first period)', () => {
      // Player played 45 days ago (15 days past threshold)
      const lastPlayed = new Date('2024-04-17T00:00:00Z')
      const result = calculateDecay(1500, lastPlayed, CURRENT_DATE)

      expect(result.shouldDecay).toBe(true)
      expect(result.decayAmount).toBe(5) // 1 period = 5 points
      expect(result.newElo).toBe(1495)
      expect(result.inactiveDays).toBe(45)
    })

    it('should apply multiple decay periods correctly', () => {
      // Player played 90 days ago (60 days past threshold = 2 periods)
      const lastPlayed = new Date('2024-03-03T00:00:00Z')
      const result = calculateDecay(1500, lastPlayed, CURRENT_DATE)

      expect(result.shouldDecay).toBe(true)
      expect(result.decayAmount).toBe(10) // 2 periods = 10 points
      expect(result.newElo).toBe(1490)
      expect(result.inactiveDays).toBe(90)
    })

    it('should not decay below minimum Elo', () => {
      // Player at 1002 Elo, inactive for 90 days
      const lastPlayed = new Date('2024-03-03T00:00:00Z')
      const result = calculateDecay(1002, lastPlayed, CURRENT_DATE)

      expect(result.newElo).toBe(DECAY_CONFIG.MINIMUM_ELO)
      expect(result.decayAmount).toBe(2) // Only 2 points to reach minimum
    })

    it('should not decay if already at minimum Elo', () => {
      // Player at minimum, inactive for 90 days
      const lastPlayed = new Date('2024-03-03T00:00:00Z')
      const result = calculateDecay(DECAY_CONFIG.MINIMUM_ELO, lastPlayed, CURRENT_DATE)

      expect(result.shouldDecay).toBe(false)
      expect(result.decayAmount).toBe(0)
      expect(result.newElo).toBe(DECAY_CONFIG.MINIMUM_ELO)
    })

    it('should calculate exact threshold boundary correctly', () => {
      // Player played exactly 30 days ago (at threshold)
      const lastPlayed = new Date('2024-05-02T00:00:00Z')
      const result = calculateDecay(1500, lastPlayed, CURRENT_DATE)

      // At exactly 30 days, still within threshold (no decay yet)
      expect(result.shouldDecay).toBe(false)
      expect(result.decayAmount).toBe(0)
      expect(result.inactiveDays).toBe(30)
    })

    it('should decay on day 31 (just past threshold)', () => {
      // Player played 31 days ago
      const lastPlayed = new Date('2024-05-01T00:00:00Z')
      const result = calculateDecay(1500, lastPlayed, CURRENT_DATE)

      expect(result.shouldDecay).toBe(true)
      expect(result.decayAmount).toBe(5)
      expect(result.newElo).toBe(1495)
      expect(result.inactiveDays).toBe(31)
    })

    it('should handle extreme inactivity', () => {
      // Player played 365 days ago (1 year)
      const lastPlayed = new Date('2023-06-02T00:00:00Z')
      const result = calculateDecay(2000, lastPlayed, CURRENT_DATE)

      // 365 - 30 = 335 days past threshold
      // 335 / 30 = 11.16 periods (11 complete periods)
      // (11 + 1) * 5 = 60 points decay
      expect(result.shouldDecay).toBe(true)
      expect(result.decayAmount).toBe(60)
      expect(result.newElo).toBe(1940)
      expect(result.inactiveDays).toBe(365)
    })

    it('should handle very high Elo correctly', () => {
      // Top player at 2500 Elo, inactive for 60 days
      const lastPlayed = new Date('2024-04-02T00:00:00Z')
      const result = calculateDecay(2500, lastPlayed, CURRENT_DATE)

      expect(result.shouldDecay).toBe(true)
      expect(result.decayAmount).toBe(10) // 2 periods
      expect(result.newElo).toBe(2490)
    })
  })
})
