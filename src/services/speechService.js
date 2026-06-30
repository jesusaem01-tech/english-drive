import { API_BASE_URL } from '../utils/apiConfig.js'

let currentAudio = null
let currentAudioUrl = null
let playbackToken = 0

function getSpeechSynthesis() {
  if (typeof window === 'undefined') return null
  return window.speechSynthesis || null
}

function getUtteranceConstructor() {
  if (typeof window === 'undefined') return null
  return window.SpeechSynthesisUtterance || null
}

function revokeCurrentAudioUrl() {
  if (currentAudioUrl && typeof URL !== 'undefined') {
    URL.revokeObjectURL(currentAudioUrl)
  }
  currentAudioUrl = null
}

function clearCurrentAudio() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.removeAttribute('src')
    currentAudio.load()
    currentAudio = null
  }
  revokeCurrentAudioUrl()
}

function speakWithSpeechSynthesis(text, options = {}) {
  const speechSynthesis = getSpeechSynthesis()
  const SpeechSynthesisUtterance = getUtteranceConstructor()

  if (!speechSynthesis || !SpeechSynthesisUtterance || !text) return null

  const utterance = new SpeechSynthesisUtterance(text)

  utterance.lang = options.lang || 'en-US'
  if (Number.isFinite(options.rate)) utterance.rate = options.rate
  if (Number.isFinite(options.pitch)) utterance.pitch = options.pitch
  if (Number.isFinite(options.volume)) utterance.volume = options.volume

  const voices = speechSynthesis.getVoices()
  const selectedVoice = options.selectVoice?.(voices) || null
  if (selectedVoice) {
    utterance.voice = selectedVoice
    utterance.lang = selectedVoice.lang || utterance.lang
  }

  utterance.onstart = options.onstart || null
  utterance.onboundary = options.onboundary || null
  utterance.onend = options.onend || null
  utterance.onerror = options.onerror || null

  options.onReady?.(utterance)
  speechSynthesis.speak(utterance)

  return utterance
}

async function speakWithTutorAudio(text, options, token, playback) {
  try {
    options.onstart?.()

    const response = await fetch(`${API_BASE_URL}/tutors/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tutor_id: 'sarah_default',
        text,
      }),
    })

    if (!response.ok) {
      throw new Error(`Tutor audio request failed with ${response.status}`)
    }

    const audioBlob = await response.blob()
    if (token !== playbackToken) return null

    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)

    if (Number.isFinite(options.rate)) audio.playbackRate = options.rate
    if (Number.isFinite(options.volume)) audio.volume = options.volume

    playback.audio = audio
    currentAudio = audio
    currentAudioUrl = audioUrl

    audio.onended = (event) => {
      if (currentAudio === audio) {
        currentAudio = null
        revokeCurrentAudioUrl()
      }
      options.onend?.(event)
    }

    audio.onerror = (event) => {
      if (currentAudio === audio) {
        currentAudio = null
        revokeCurrentAudioUrl()
      }
      options.onerror?.(event)
    }

    await audio.play()
    return audio
  } catch {
    if (token !== playbackToken) return null
    clearCurrentAudio()
    return speakWithSpeechSynthesis(text, options)
  }
}

export function speak(text, options = {}) {
  const normalizedOptions = options && typeof options === 'object' ? options : {}

  if (!text) return null

  stop()

  const token = ++playbackToken
  const playback = { audio: null }
  normalizedOptions.onReady?.(playback)
  speakWithTutorAudio(text, normalizedOptions, token, playback)

  return playback
}

export function stop() {
  playbackToken += 1
  clearCurrentAudio()

  const speechSynthesis = getSpeechSynthesis()

  if (
    speechSynthesis &&
    (speechSynthesis.speaking || speechSynthesis.pending || speechSynthesis.paused)
  ) {
    speechSynthesis.cancel()
  }
}

export function pause() {
  if (currentAudio && !currentAudio.paused && !currentAudio.ended) {
    currentAudio.pause()
    return
  }

  const speechSynthesis = getSpeechSynthesis()
  if (speechSynthesis?.speaking) speechSynthesis.pause()
}

export function resume() {
  if (currentAudio?.paused && !currentAudio.ended) {
    currentAudio.play().catch(() => {
      currentAudio = null
      revokeCurrentAudioUrl()
    })
    return
  }

  const speechSynthesis = getSpeechSynthesis()
  if (speechSynthesis?.paused) speechSynthesis.resume()
}

export function isSpeaking() {
  const speechSynthesis = getSpeechSynthesis()
  const audioIsActive = Boolean(currentAudio && !currentAudio.ended)

  return Boolean(
    audioIsActive ||
      speechSynthesis &&
        (speechSynthesis.speaking || speechSynthesis.pending || speechSynthesis.paused)
  )
}
