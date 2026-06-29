function getSpeechSynthesis() {
  if (typeof window === 'undefined') return null
  return window.speechSynthesis || null
}

function getUtteranceConstructor() {
  if (typeof window === 'undefined') return null
  return window.SpeechSynthesisUtterance || null
}

// TODO:
// Reemplazar speechSynthesis por ElevenLabs.
// El frontend NO deberá cambiar cuando eso ocurra.
export function speak(text, options = {}) {
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

export function stop() {
  const speechSynthesis = getSpeechSynthesis()

  if (
    speechSynthesis &&
    (speechSynthesis.speaking || speechSynthesis.pending || speechSynthesis.paused)
  ) {
    speechSynthesis.cancel()
  }
}

export function pause() {
  const speechSynthesis = getSpeechSynthesis()
  if (speechSynthesis?.speaking) speechSynthesis.pause()
}

export function resume() {
  const speechSynthesis = getSpeechSynthesis()
  if (speechSynthesis?.paused) speechSynthesis.resume()
}

export function isSpeaking() {
  const speechSynthesis = getSpeechSynthesis()

  return Boolean(
    speechSynthesis &&
      (speechSynthesis.speaking || speechSynthesis.pending || speechSynthesis.paused)
  )
}
