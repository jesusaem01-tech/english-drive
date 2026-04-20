/**
 * LocalStorage persistence layer for English Drive
 */

const STORAGE_KEY = 'english-drive-v1'

function getDefaultStorage() {
  return {
    cards: {},       // sentenceId (string) → SM-2 card data
    phase3: {},      // questionId (string) → { attempts, lastCorrect }
    stats: {
      streak: 0,
      lastStudyDate: null,
      todayCount: 0,
      todayDate: null,
      totalMastered: 0,
      totalReviewed: 0,
    },
    settings: {
      dailyGoal: 15,
      autoPlay: true,
      speed: 0.85,    // TTS rate
    },
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultStorage()
    const parsed = JSON.parse(raw)
    // Merge with defaults in case new fields were added
    const defaults = getDefaultStorage()
    return {
      ...defaults,
      ...parsed,
      stats: { ...defaults.stats, ...(parsed.stats || {}) },
      settings: { ...defaults.settings, ...(parsed.settings || {}) },
    }
  } catch {
    return getDefaultStorage()
  }
}

function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('English Drive: Could not save to localStorage', e)
  }
}

// ── Card (SM-2) Operations ────────────────────────────────────────────────────

export function getCard(sentenceId) {
  const data = load()
  return data.cards[String(sentenceId)] || null
}

export function updateCard(sentenceId, sm2Result) {
  const data = load()
  const key = String(sentenceId)
  data.cards[key] = { ...sm2Result }

  // Update daily count
  const todayStr = new Date().toISOString().split('T')[0]
  if (data.stats.todayDate !== todayStr) {
    data.stats.todayDate = todayStr
    data.stats.todayCount = 0
  }
  data.stats.todayCount += 1
  data.stats.totalReviewed += 1

  // Update streak
  if (data.stats.lastStudyDate !== todayStr) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    if (data.stats.lastStudyDate === yesterdayStr) {
      data.stats.streak += 1
    } else {
      data.stats.streak = 1
    }
    data.stats.lastStudyDate = todayStr
  }

  // Recalculate mastered count
  let mastered = 0
  Object.values(data.cards).forEach(card => {
    if (card.interval >= 21) mastered++
  })
  data.stats.totalMastered = mastered

  save(data)
}

// ── Phase 3 progress ──────────────────────────────────────────────────────────

export function getPhase3(questionId) {
  const data = load()
  return data.phase3[String(questionId)] || { attempts: 0, lastCorrect: false }
}

export function updatePhase3(questionId, correct) {
  const data = load()
  const key = String(questionId)
  const prev = data.phase3[key] || { attempts: 0, lastCorrect: false }
  data.phase3[key] = {
    attempts: prev.attempts + 1,
    lastCorrect: correct,
  }
  save(data)
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function getStats() {
  const data = load()
  const todayStr = new Date().toISOString().split('T')[0]

  // Reset today count if it's a new day
  if (data.stats.todayDate !== todayStr) {
    data.stats.todayCount = 0
    data.stats.todayDate = todayStr
    save(data)
  }

  return { ...data.stats }
}

export function getAllCards() {
  const data = load()
  return data.cards
}

// ── Settings ──────────────────────────────────────────────────────────────────

export function getSettings() {
  const data = load()
  return { ...data.settings }
}

export function updateSettings(partial) {
  const data = load()
  data.settings = { ...data.settings, ...partial }
  save(data)
  return data.settings
}

// ── Reset ─────────────────────────────────────────────────────────────────────

export function resetAllProgress() {
  save(getDefaultStorage())
}
