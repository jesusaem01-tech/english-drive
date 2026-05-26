import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { sentences as realEstateLocalSentences } from '../data/sentences.js'
import { fetchContentSentences } from '../utils/contentApi.js'

const TARGET_PER_CATEGORY = 20
const DEFAULT_REPEAT_TARGET = 3
const CATEGORY_LABELS = {
  daily_life: 'Vida diaria',
  real_estate: 'Bienes raíces',
  gym: 'Gym / Fitness',
}

const gymFallbackSentences = [
  ['I am going to the gym today.', 'Voy al gimnasio hoy.'],
  ['I need to warm up first.', 'Necesito calentar primero.'],
  ['Can you spot me?', '¿Puedes ayudarme con este ejercicio?'],
  ['I am working on my legs today.', 'Hoy estoy entrenando piernas.'],
  ['This machine is available.', 'Esta máquina está disponible.'],
  ['How many sets do you have left?', '¿Cuántas series te faltan?'],
  ['I drink water between sets.', 'Tomo agua entre series.'],
  ['My trainer made a new routine.', 'Mi entrenador hizo una rutina nueva.'],
  ['I want to improve my strength.', 'Quiero mejorar mi fuerza.'],
  ['This workout is difficult.', 'Este entrenamiento es difícil.'],
  ['I am stretching after training.', 'Estoy estirando después de entrenar.'],
  ['The treadmill is too fast.', 'La caminadora está demasiado rápida.'],
  ['I forgot my towel.', 'Olvidé mi toalla.'],
  ['I need a lighter weight.', 'Necesito un peso más ligero.'],
  ['My muscles are sore today.', 'Hoy me duelen los músculos.'],
  ['The class starts in ten minutes.', 'La clase empieza en diez minutos.'],
  ['I am practicing good form.', 'Estoy practicando buena técnica.'],
  ['This exercise works the shoulders.', 'Este ejercicio trabaja los hombros.'],
  ['I finished my workout.', 'Terminé mi entrenamiento.'],
  ['See you at the gym tomorrow.', 'Nos vemos en el gimnasio mañana.'],
]

function normalizeBackendSentence(sentence, category) {
  return {
    id: `${category}-${sentence.id || sentence.sentence_en}`,
    category,
    sentence_en: sentence.sentence_en,
    translation_es: sentence.translation_es || sentence.sentence_es || '',
    phonetic_es: sentence.phonetic_es || '',
    pronunciation: sentence.pronunciation || '',
    ipa: sentence.ipa || '',
    scene: sentence.scene || sentence.phase || category,
  }
}

function normalizeRealEstateFallback() {
  return realEstateLocalSentences.slice(0, TARGET_PER_CATEGORY).map((sentence) => ({
    id: `real-estate-local-${sentence.id}`,
    category: 'real_estate',
    sentence_en: sentence.english,
    translation_es: sentence.spanish,
    phonetic_es: sentence.phonetic,
    pronunciation: '',
    ipa: '',
    scene: sentence.groupName,
  }))
}

function normalizeGymFallback() {
  return gymFallbackSentences.map(([english, spanish], index) => ({
    id: `gym-demo-${index + 1}`,
    category: 'gym',
    sentence_en: english,
    translation_es: spanish,
    phonetic_es: '',
    pronunciation: '',
    ipa: '',
    scene: 'gym_demo',
  }))
}

async function loadCategorySet(category, fallbackItems = []) {
  try {
    const items = await fetchContentSentences({
      category,
      level: 1,
      limit: TARGET_PER_CATEGORY,
    })
    const normalized = items
      .map((sentence) => normalizeBackendSentence(sentence, category))
      .filter((sentence) => sentence.sentence_en)

    return normalized.length > 0 ? normalized.slice(0, TARGET_PER_CATEGORY) : fallbackItems
  } catch {
    return fallbackItems
  }
}

function interleaveSets(sets) {
  const result = []

  for (let index = 0; index < TARGET_PER_CATEGORY; index += 1) {
    sets.forEach((set) => {
      if (set[index]) result.push(set[index])
    })
  }

  return result
}

function splitWords(sentence) {
  return sentence.trim().split(/\s+/).filter(Boolean)
}

function getPronunciationDisplay(sentence) {
  if (!sentence) return ''

  return [sentence.phonetic_es, sentence.pronunciation, sentence.ipa]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .find(Boolean) || ''
}

function getBoundaryWordIndex(words, charIndex) {
  let cursor = 0

  for (let index = 0; index < words.length; index += 1) {
    const start = cursor
    const end = start + words[index].length
    if (charIndex >= start && charIndex <= end) return index
    cursor = end + 1
  }

  return words.length - 1
}

function getSentenceFontSize(sentence) {
  const length = sentence.length
  if (length > 95) return 'text-[clamp(1.15rem,5.2vw,1.55rem)] leading-[1.32]'
  if (length > 58) return 'text-[clamp(1.3rem,6vw,1.75rem)] leading-[1.28]'
  return 'text-[clamp(1.55rem,7vw,2.1rem)] leading-[1.22]'
}

// Prototype note: Phase 2 should reuse this same combined 60-sentence learning set
// for pronunciation practice after the Phase 1 listening flow is approved.
export default function InitialPhase1ListeningPrototype({ onBack }) {
  // TODO: Future user profile setting: minimum 3 repetitions.
  // TODO: Future user profile setting: maximum 10 repetitions.
  const repeatTarget = DEFAULT_REPEAT_TARGET

  const [sentences, setSentences] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [repeat, setRepeat] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [hasListened, setHasListened] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const [activeWordIndex, setActiveWordIndex] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sourceNotes, setSourceNotes] = useState([])

  const isPlayingRef = useRef(false)
  const currentIndexRef = useRef(0)
  const repeatRef = useRef(1)
  const utteranceRef = useRef(null)
  const timeoutRef = useRef(null)
  const wordTimerRef = useRef(null)

  useEffect(() => {
    let ignore = false

    async function loadInitialSet() {
      const realEstateFallback = normalizeRealEstateFallback()
      const gymFallback = normalizeGymFallback()

      const [dailyLifeSet, realEstateSet, gymSet] = await Promise.all([
        loadCategorySet('daily_life'),
        loadCategorySet('real_estate', realEstateFallback),
        loadCategorySet('gym', gymFallback),
      ])

      if (ignore) return

      setSentences(interleaveSets([dailyLifeSet, realEstateSet, gymSet]))
      setSourceNotes([
        `Vida diaria: ${dailyLifeSet.length} backend`,
        realEstateSet === realEstateFallback
          ? 'Bienes raíces: fallback local'
          : `Bienes raíces: ${realEstateSet.length} backend`,
        gymSet === gymFallback ? 'Gym / Fitness: fallback demo' : `Gym / Fitness: ${gymSet.length} backend`,
      ])
      setLoading(false)
    }

    loadInitialSet()

    return () => {
      ignore = true
    }
  }, [])

  const currentSentence = sentences[currentIndex]
  const currentWords = useMemo(
    () => splitWords(currentSentence?.sentence_en || ''),
    [currentSentence?.sentence_en]
  )
  const pronunciationDisplay = useMemo(
    () => getPronunciationDisplay(currentSentence),
    [currentSentence]
  )
  const pronunciationSegments = useMemo(
    () => splitWords(pronunciationDisplay),
    [pronunciationDisplay]
  )
  const progress = useMemo(() => {
    if (sentences.length === 0) return 0
    return ((currentIndex + 1) / sentences.length) * 100
  }, [currentIndex, sentences.length])

  const stopSpeech = useCallback(() => {
    isPlayingRef.current = false
    setIsPlaying(false)
    setIsPaused(false)
    setActiveWordIndex(null)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (wordTimerRef.current) clearInterval(wordTimerRef.current)
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    utteranceRef.current = null
  }, [])

  const pauseSpeech = useCallback(() => {
    isPlayingRef.current = false
    setIsPlaying(false)
    setIsPaused(true)
    setActiveWordIndex(null)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (wordTimerRef.current) clearInterval(wordTimerRef.current)
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    utteranceRef.current = null
  }, [])

  const startEstimatedWordTimer = useCallback((words) => {
    if (wordTimerRef.current) clearInterval(wordTimerRef.current)
    setActiveWordIndex(0)

    if (words.length <= 1) return

    // Temporary fallback until ElevenLabs word timestamps are available.
    // Estimates word timing from sentence length for browsers with unreliable boundary events.
    const estimatedMs = Math.max(220, Math.min(520, (words.join(' ').length / words.length) * 65))
    let index = 0

    wordTimerRef.current = setInterval(() => {
      index += 1
      if (index >= words.length) {
        clearInterval(wordTimerRef.current)
        wordTimerRef.current = null
        return
      }
      setActiveWordIndex(index)
    }, estimatedMs)
  }, [])

  const speakCurrent = useCallback(() => {
    if (!window.speechSynthesis || sentences.length === 0) {
      setIsPlaying(false)
      isPlayingRef.current = false
      return
    }

    const sentence = sentences[currentIndexRef.current]
    if (!sentence) return
    const words = splitWords(sentence.sentence_en)

    // TODO: Replace Web Speech API with tutor-selected ElevenLabs voice.
    // TODO: Future ElevenLabs integration should use real word-level timestamps if available.
    window.speechSynthesis.cancel()
    if (wordTimerRef.current) clearInterval(wordTimerRef.current)
    startEstimatedWordTimer(words)
    const utterance = new SpeechSynthesisUtterance(sentence.sentence_en)
    utterance.lang = 'en-US'
    utterance.rate = 0.85
    utteranceRef.current = utterance

    utterance.onboundary = (event) => {
      if (event.name !== 'word' || !Number.isFinite(event.charIndex)) return
      if (wordTimerRef.current) {
        clearInterval(wordTimerRef.current)
        wordTimerRef.current = null
      }
      setActiveWordIndex(getBoundaryWordIndex(words, event.charIndex))
    }

    utterance.onend = () => {
      if (!isPlayingRef.current) return
      setActiveWordIndex(null)
      if (wordTimerRef.current) {
        clearInterval(wordTimerRef.current)
        wordTimerRef.current = null
      }

      timeoutRef.current = setTimeout(() => {
        if (!isPlayingRef.current) return

        if (repeatRef.current < repeatTarget) {
          repeatRef.current += 1
          setRepeat(repeatRef.current)
          speakCurrent()
          return
        }

        setShowTranslation(false)

        if (currentIndexRef.current === sentences.length - 1) {
          isPlayingRef.current = false
          setIsPlaying(false)
          return
        }

        const nextIndex = currentIndexRef.current + 1
        currentIndexRef.current = nextIndex
        repeatRef.current = 1
        setCurrentIndex(nextIndex)
        setRepeat(1)
        setHasListened(false)
        setShowTranslation(false)
        setActiveWordIndex(null)

        speakCurrent()
      }, 900)
    }

    window.speechSynthesis.speak(utterance)
  }, [repeatTarget, sentences, startEstimatedWordTimer])

  const startListening = () => {
    if (!currentSentence) return
    isPlayingRef.current = true
    currentIndexRef.current = currentIndex
    repeatRef.current = repeat
    setIsPlaying(true)
    setIsPaused(false)
    setHasListened(true)
    speakCurrent()
  }

  const replayCurrent = () => {
    if (!currentSentence) return
    stopSpeech()
    currentIndexRef.current = currentIndex
    repeatRef.current = 1
    setRepeat(1)
    setTimeout(() => {
      isPlayingRef.current = true
      setIsPlaying(true)
      setIsPaused(false)
      setHasListened(true)
      speakCurrent()
    }, 0)
  }

  const pauseListening = () => {
    pauseSpeech()
  }

  const goTo = (nextIndex) => {
    const safeIndex = Math.max(0, Math.min(nextIndex, sentences.length - 1))
    stopSpeech()
    currentIndexRef.current = safeIndex
    repeatRef.current = 1
    setCurrentIndex(safeIndex)
    setRepeat(1)
    setHasListened(false)
    setShowTranslation(false)
    setActiveWordIndex(null)
  }

  useEffect(() => {
    return () => stopSpeech()
  }, [stopSpeech])

  return (
    <div className="min-h-screen bg-[#071321] px-4 py-5 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-[430px] flex-col rounded-[30px] border border-[#B8FF2C]/15 bg-[#0B1D2F] p-5 shadow-2xl shadow-black/25">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => {
              stopSpeech()
              onBack()
            }}
            className="rounded-full border border-[#B8FF2C]/25 bg-[#102B43] px-4 py-2 text-sm font-semibold text-[#B8FF2C] active:scale-95"
          >
            Volver
          </button>
          <span className="rounded-full bg-[#B8FF2C] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#071321]">
            Prototype
          </span>
        </div>

        <header className="mb-5">
          <p className="text-sm font-semibold text-[#B8FF2C]/75">Fase 1 · Escuchar</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight">Set inicial Habloo</h1>
          <p className="mt-2 text-sm text-white/55">3 categorías · 60 frases combinadas</p>
        </header>

        <div className="mb-5 h-3 overflow-hidden rounded-full bg-[#16364E]">
          <div
            className="h-full rounded-full bg-[#B8FF2C] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {loading && (
          <div className="flex flex-1 items-center justify-center rounded-[26px] bg-[#102B43] p-6 text-center">
            <p className="font-semibold text-[#B8FF2C]">Construyendo set inicial...</p>
          </div>
        )}

        {!loading && currentSentence && (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="rounded-full bg-[#B8FF2C] px-4 py-2 text-xs font-bold text-[#071321]">
                {CATEGORY_LABELS[currentSentence.category]}
              </span>
              <span className="rounded-full border border-[#B8FF2C]/25 px-4 py-2 text-xs font-semibold text-[#B8FF2C]">
                Frase {currentIndex + 1} de {sentences.length}
              </span>
            </div>

            <div className="mb-4 max-w-full overflow-hidden rounded-[28px] bg-[#F6FFE8] p-5 text-[#071321] shadow-xl shadow-black/20 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#406014]">Inglés</p>
              <p
                className={`mt-4 max-w-full whitespace-normal font-semibold [hyphens:none] [overflow-wrap:normal] [word-break:keep-all] ${getSentenceFontSize(currentSentence.sentence_en)}`}
              >
                {currentWords.map((word, index) => (
                  <span
                    key={`${word}-${index}`}
                    className={`inline-block whitespace-nowrap [hyphens:none] [overflow-wrap:normal] [word-break:keep-all] transition-all duration-150 ${
                      activeWordIndex === index
                        ? 'underline decoration-[#80D910] decoration-4 underline-offset-4'
                        : ''
                    }`}
                  >
                    {word}
                    {index < currentWords.length - 1 ? '\u00A0' : ''}
                  </span>
                ))}
              </p>
              {pronunciationDisplay && (
                <div className="mt-5 rounded-2xl bg-[#071321]/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#406014]/70">
                    Pronunciación
                  </p>
                  <p className="mt-2 max-w-full whitespace-normal text-[clamp(0.92rem,4vw,1.1rem)] font-medium leading-relaxed text-[#071321]/75 [hyphens:none] [overflow-wrap:normal] [word-break:keep-all]">
                    {pronunciationSegments.map((segment, index) => (
                      <span
                        key={`${segment}-${index}`}
                        className={`inline-block whitespace-nowrap [hyphens:none] [overflow-wrap:normal] [word-break:keep-all] transition-all duration-150 ${
                          activeWordIndex === index
                            ? 'underline decoration-[#80D910] decoration-2 underline-offset-4'
                            : ''
                        }`}
                      >
                        {segment}
                        {index < pronunciationSegments.length - 1 ? '\u00A0' : ''}
                      </span>
                    ))}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-[#B8FF2C]/15 bg-[#102B43] p-5">
              <button
                onClick={() => setShowTranslation((value) => !value)}
                className="mb-4 w-full rounded-2xl border border-[#B8FF2C]/20 bg-[#0E263A] py-3 text-sm font-semibold text-[#B8FF2C] active:scale-95"
              >
                {showTranslation ? 'Ocultar traducción' : 'Ver traducción'}
              </button>
              <div className={showTranslation ? 'block' : 'hidden'}>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#B8FF2C]/70">
                Traducción
              </p>
              <p className="mt-2 text-lg font-medium text-white/80">
                {currentSentence.translation_es || 'Sin traducción disponible'}
              </p>
              </div>
            </div>

            <div className="mt-5 rounded-[22px] border border-[#B8FF2C]/15 bg-[#0E263A] p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#B8FF2C]/70">
                  Repetición
                </p>
                <span className="text-sm font-semibold text-[#B8FF2C]">
                  Repeat {repeat} / {repeatTarget}
                </span>
              </div>
              <div className="flex gap-2">
                {Array.from({ length: repeatTarget }).map((_, index) => {
                  const step = index + 1
                  return (
                  <span
                    key={step}
                    className={`h-2 flex-1 rounded-full ${
                      step <= repeat ? 'bg-[#B8FF2C]' : 'bg-[#B8FF2C]/20'
                    }`}
                  />
                  )
                })}
              </div>
            </div>

            <div className="mt-auto pt-6">
              <div className="mb-3 grid grid-cols-2 gap-3">
                <button
                  onClick={hasListened ? replayCurrent : startListening}
                  disabled={isPlaying}
                  className="rounded-2xl bg-[#B8FF2C] py-4 font-semibold text-[#071321] disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
                >
                  {hasListened ? 'Replay' : 'Escuchar'}
                </button>
                <button
                  onClick={pauseListening}
                  disabled={!isPlaying}
                  className="rounded-2xl border border-[#B8FF2C]/25 bg-[#102B43] py-4 font-semibold text-[#B8FF2C] disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
                >
                  Pausar
                </button>
              </div>

              <button
                onClick={startListening}
                disabled={!isPaused || isPlaying}
                className="mb-3 w-full rounded-2xl border border-[#B8FF2C]/25 bg-[#102B43] py-4 font-semibold text-[#B8FF2C] disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
              >
                Continue auto-play
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => goTo(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="rounded-2xl border border-[#B8FF2C]/25 bg-[#102B43] py-4 font-semibold text-[#B8FF2C] disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
                >
                  Anterior
                </button>
                <button
                  onClick={() => goTo(currentIndex + 1)}
                  disabled={currentIndex === sentences.length - 1}
                  className="rounded-2xl border border-[#B8FF2C]/25 bg-[#102B43] py-4 font-semibold text-[#B8FF2C] disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
                >
                  Siguiente
                </button>
              </div>

              <button
                onClick={stopSpeech}
                className="mt-3 w-full rounded-2xl bg-red-700 py-4 font-semibold text-white active:scale-95"
              >
                Pausar todo
              </button>
            </div>

            <div className="mt-4 text-[11px] leading-relaxed text-white/35">
              {sourceNotes.join(' · ')}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
