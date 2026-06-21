import { API_BASE_URL } from './apiConfig.js'

function getSentenceList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.sentences)) return payload.sentences
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

export async function fetchContentSentences({
  category = 'daily_life',
  level = 1,
  limit = 10,
} = {}) {
  const params = new URLSearchParams({
    category,
    level: String(level),
    limit: String(limit),
  })

  const response = await fetch(`${API_BASE_URL}/content/sentences?${params}`)

  if (!response.ok) {
    throw new Error(`Content request failed with status ${response.status}`)
  }

  const payload = await response.json()
  return getSentenceList(payload)
}
