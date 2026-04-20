/**
 * SM-2 Spaced Repetition Algorithm
 * Based on the original SuperMemo 2 algorithm by Piotr Wozniak
 *
 * Quality scale (0-5):
 *   0 — Complete blackout / "Otra vez"
 *   1 — Incorrect, very hard
 *   2 — Incorrect, hard / "Difícil" (fail)
 *   3 — Correct but hard
 *   4 — Correct with hesitation / "Bien"
 *   5 — Perfect recall / "Fácil"
 */

export const QUALITY = {
  AGAIN: 0,   // Otra vez
  HARD: 2,    // Difícil
  GOOD: 4,    // Bien
  EASY: 5,    // Fácil
}

/**
 * Apply SM-2 algorithm to a card after a review
 * @param {Object} card - Current card state { easeFactor, interval, repetitions }
 * @param {number} quality - Review quality (0-5)
 * @returns {Object} - Updated card state with nextReview date
 */
export function sm2Review(card, quality) {
  let {
    easeFactor = 2.5,
    interval = 0,
    repetitions = 0,
  } = card

  // Calculate new interval
  if (quality >= 3) {
    // Successful review
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1
  } else {
    // Failed review — reset
    repetitions = 0
    interval = 1
  }

  // Update ease factor (minimum 1.3)
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  easeFactor = Math.max(1.3, Math.round(easeFactor * 100) / 100)

  // Calculate next review date
  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + interval)

  return {
    easeFactor,
    interval,
    repetitions,
    nextReview: nextReviewDate.toISOString().split('T')[0],
    lastReviewed: today(),
  }
}

/**
 * Check if a card is due for review today
 */
export function isDue(card) {
  if (!card || !card.nextReview) return true
  return card.nextReview <= today()
}

/**
 * Check if a card is "mastered" (interval >= 21 days)
 */
export function isMastered(card) {
  return card && card.interval >= 21
}

/**
 * Get the mastery level label for a card
 */
export function getMasteryLabel(card) {
  if (!card || card.repetitions === 0) return 'Nueva'
  if (card.interval < 3) return 'Aprendiendo'
  if (card.interval < 7) return 'Familiar'
  if (card.interval < 21) return 'Avanzando'
  return 'Dominada'
}

/**
 * Get today's date string (YYYY-MM-DD)
 */
export function today() {
  return new Date().toISOString().split('T')[0]
}
