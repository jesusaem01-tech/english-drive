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
  const requestPayload = {
    category,
    level,
    limit,
  }
  const params = new URLSearchParams({
    category: requestPayload.category,
    level: String(requestPayload.level),
    limit: String(requestPayload.limit),
  })
  const endpoint = `${API_BASE_URL}/content/sentences?${params}`

  const response = await fetch(endpoint)

  if (!response.ok) {
    const error = new Error(`Content request failed with status ${response.status}`)
    error.endpoint = endpoint
    error.payload = requestPayload
    error.status = response.status
    throw error
  }

  const payload = await response.json()
  return getSentenceList(payload)
}
