import { useState, useEffect, useRef, useCallback } from 'react'
import { sentences } from '../data/sentences.js'

const REPEAT_COUNT = 3    // veces por oración
const PAUSE_MS     = 2000 // ms entre repeticiones

function getAmericanVoice() {
  const voices = window.speechSynthesis.getVoices()
  // Prefer Google US English, then any en-US
  return (
    voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('google')) ||
    voices.find(v => v.lang === 'en-US' && !v.localService) ||
    voices.find(v => v.lang === 'en-US') ||
    voices[0] ||
    null
  )
}

export default function Phase1Listen({ onBack }) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0)
  const [rep, setRep]                   = useState(1) // 1..REPEAT_COUNT
  const [isPlaying, setIsPlaying]       = useState(false)
  const [mode, setMode]                 = useState('auto') // 'auto' | 'manual'
  const [showTranslation, setShowTranslation] = useState(false)
  const [activeWordIndex, setActiveWordIndex] = useState(-1) // karaoke

  // ── Refs (don't trigger re-renders) ───────────────────────────────────────
  const playingRef     = useRef(false)
  const pausedRef      = useRef(false)
  const indexRef       = useRef(0)
  const repRef         = useRef(1)
  const timeoutRef         = useRef(null)
  const karaokeIntervalRef = useRef(null)

  const sentence = sentences[currentIndex]

  // ── Speech synthesis ───────────────────────────────────────────────────────
  const speak = useCallback((text, onEnd) => {
    window.speechSynthesis.cancel()
    if (karaokeIntervalRef.current) {
      clearInterval(karaokeIntervalRef.current)
      karaokeIntervalRef.current = null
    }
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang  = 'en-US'
    utter.rate  = 0.82
    utter.pitch = 1
    const voice = getAmericanVoice()
    if (voice) utter.voice = voice

    // ── Karaoke: resalta cada palabra por tiempo estimado ─────────────────
    setActiveWordIndex(-1)
    const words = text.split(/\s+/)
    const rate = 0.82
    let cumulative = 0
    const timings = words.map(word => {
      const duration = Math.max(180, word.length * 75) / rate
      const t = { start: cumulative }
      cumulative += duration + 40
      return t
    })

    utter.onstart = () => {
      const startTime = Date.now() - 600
      karaokeIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime
        let currentIdx = -1
        for (let i = 0; i < timings.length; i++) {
          if (elapsed >= timings[i].start) currentIdx = i
          else break
        }
        setActiveWordIndex(currentIdx)
      }, 100)
    }
    utter.onend = () => {
      if (karaokeIntervalRef.current) {
        clearInterval(karaokeIntervalRef.current)
        karaokeIntervalRef.current = null
      }
      setActiveWordIndex(-1)
      if (onEnd) onEnd()
    }
    utter.onerror = () => {
      if (karaokeIntervalRef.current) {
        clearInterval(karaokeIntervalRef.current)
        karaokeIntervalRef.current = null
      }
      setActiveWordIndex(-1)
      if (onEnd) onEnd()
    }
    window.speechSynthesis.speak(utter)
  }, [])

  // ── Auto-play engine ───────────────────────────────────────────────────────
  const scheduleNext = useCallback(() => {
    if (!playingRef.current || pausedRef.current) return

    const text = sentences[indexRef.current].english
    speak(text, () => {
      if (!playingRef.current || pausedRef.current) return

      timeoutRef.current = setTimeout(() => {
        if (!playingRef.current || pausedRef.current) return

        if (repRef.current < REPEAT_COUNT) {
          // next repetition
          repRef.current += 1
          setRep(repRef.current)
          scheduleNext()
        } else {
          // next sentence
          const nextIdx = (indexRef.current + 1) % sentences.length
          indexRef.current = nextIdx
          repRef.current   = 1
          setCurrentIndex(nextIdx)
          setRep(1)
          scheduleNext()
        }
      }, PAUSE_MS)
    })
  }, [speak])

  // Start auto-play
  const startPlay = useCallback(() => {
    playingRef.current  = true
    pausedRef.current   = false
    setIsPlaying(true)
    scheduleNext()
  }, [scheduleNext])

  // Pause
  const pause = useCallback(() => {
    pausedRef.current = true
    setIsPlaying(false)
    window.speechSynthesis.cancel()
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (karaokeIntervalRef.current) {
      clearInterval(karaokeIntervalRef.current)
      karaokeIntervalRef.current = null
    }
  }, [])

  // Resume
  const resume = useCallback(() => {
    pausedRef.current = false
    setIsPlaying(true)
    scheduleNext()
  }, [scheduleNext])

  // Stop all (emergency)
  const stopAll = useCallback(() => {
    playingRef.current  = false
    pausedRef.current   = true
    setIsPlaying(false)
    window.speechSynthesis.cancel()
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (karaokeIntervalRef.current) {
      clearInterval(karaokeIntervalRef.current)
      karaokeIntervalRef.current = null
    }
  }, [])

  // Navigate sentences (manual)
  const goTo = useCallback((idx) => {
    const safeIdx = (idx + sentences.length) % sentences.length
    indexRef.current = safeIdx
    repRef.current   = 1
    setCurrentIndex(safeIdx)
    setRep(1)
    if (playingRef.current && !pausedRef.current) {
      window.speechSynthesis.cancel()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      scheduleNext()
    }
  }, [scheduleNext])

  const playOnce = useCallback(() => {
    speak(sentences[indexRef.current].english, null)
  }, [speak])

  // Resetear karaoke al cambiar de oración
  useEffect(() => {
    setActiveWordIndex(-1)
  }, [currentIndex])

  // ── Effects ────────────────────────────────────────────────────────────────
  // Load voices (Chrome requires user interaction or waiting)
  useEffect(() => {
    if (typeof window.speechSynthesis === 'undefined') return
    const synth = window.speechSynthesis
    if (synth.getVoices().length === 0) {
      synth.addEventListener('voiceschanged', () => {}, { once: true })
    }
    return () => {
      stopAll()
    }
  }, [stopAll])

  // ── Helpers ────────────────────────────────────────────────────────────────
  const levelColor = {
    basic: 'text-green-400',
    intermediate: 'text-yellow-400',
    advanced: 'text-red-400',
  }

  const levelLabel = {
    basic: 'Básico',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-[#0A1628] text-[#F0B429] px-4 pb-6">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-5 pb-3">
        <button
          onClick={() => { stopAll(); onBack() }}
          className="w-12 h-12 rounded-2xl bg-[#0F2040] border border-[#F0B429]/20 flex items-center justify-center text-xl"
        >←</button>

        <div className="flex flex-col items-center">
          <span className="bg-blue-600 text-white text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider">
            FASE 1 — Solo Escucha
          </span>
          <span className="text-xs text-[#F0B429]/50 mt-1">
            {currentIndex + 1} / {sentences.length}
          </span>
        </div>

        {/* Mode toggle */}
        <button
          onClick={() => {
            stopAll()
            setMode(m => m === 'auto' ? 'manual' : 'auto')
          }}
          className="px-3 h-10 rounded-2xl bg-[#0F2040] border border-[#F0B429]/20 text-xs font-bold"
        >
          {mode === 'auto' ? '🚗 Auto' : '👆 Manual'}
        </button>
      </div>

      {/* ── Progress bar ────────────────────────────────────────────────────── */}
      <div className="h-1 rounded-full bg-[#0F2040] mb-4">
        <div
          className="h-full rounded-full bg-[#F0B429] transition-all duration-500"
          style={{ width: `${((currentIndex) / sentences.length) * 100}%` }}
        />
      </div>

      {/* ── Sentence card ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="bg-[#0F2040] rounded-3xl p-6 border border-[#F0B429]/10 mb-4">

          {/* Group & level */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[#F0B429]/50 font-bold uppercase">
              Grupo {sentence.group} · {sentence.groupName}
            </span>
            <span className={`text-xs font-bold ${levelColor[sentence.level]}`}>
              {levelLabel[sentence.level]}
            </span>
          </div>

          {/* Repeat indicator */}
          <div className="flex gap-2 mb-5 justify-center">
            {Array.from({ length: REPEAT_COUNT }).map((_, i) => (
              <div
                key={i}
                className={`w-10 h-2 rounded-full transition-all duration-300 ${
                  i < rep ? 'bg-[#F0B429]' : 'bg-[#152d4f]'
                }`}
              />
            ))}
            <span className="text-xs text-[#F0B429]/50 ml-1 self-center">
              {rep}/{REPEAT_COUNT}
            </span>
          </div>

          {/* Main sentence — karaoke en tiempo real */}
          <p className="sentence-text mb-6" style={{ textAlign: 'center', lineHeight: 1.6, wordBreak: 'break-word', width: '100%' }}>
            {sentence.english.split(/\s+/).map((word, i) => (
              <span
                key={`${currentIndex}-${i}`}
                style={{
                  color: activeWordIndex === -1
                    ? '#F0B429'            // sin reproducir → dorado normal
                    : i === activeWordIndex
                      ? '#F0B429'          // palabra actual → dorado
                      : i < activeWordIndex
                        ? '#FFFFFF'        // ya dicha → blanco
                        : '#4A5568',       // pendiente → gris oscuro
                  fontWeight: 'bold',
                  display: 'inline-block',
                  marginRight: '6px',
                  transition: 'color 0.1s ease',
                }}
              >
                {word}{' '}
              </span>
            ))}
          </p>

          {/* Pronunciación — karaoke sincronizado con inglés */}
          <p className="text-center text-xs text-[#A8C8FF]/60 font-medium mb-1">🔊 Pronunciación</p>
          <p className="text-center text-xl font-medium mb-3" style={{ lineHeight: 1.6, wordBreak: 'break-word' }}>
            {(() => {
              const phoneticWords = sentence.phonetic.split(/\s+/)
              const englishWords  = sentence.english.split(/\s+/)
              const phonActive = activeWordIndex === -1 ? -1
                : Math.round(activeWordIndex * phoneticWords.length / englishWords.length)
              return phoneticWords.map((word, i) => (
                <span
                  key={`ph-${currentIndex}-${i}`}
                  style={{
                    color: activeWordIndex === -1
                      ? '#F0B429'
                      : i === phonActive
                        ? '#F0B429'
                        : i < phonActive
                          ? '#FFFFFF'
                          : '#4A5568',
                    fontWeight: 'bold',
                    display: 'inline-block',
                    marginRight: '6px',
                    transition: 'color 0.1s ease',
                  }}
                >
                  {word}
                </span>
              ))
            })()}
          </p>

          {/* Traducción — oculta por defecto */}
          <button
            onClick={() => setShowTranslation(s => !s)}
            className="w-full text-center text-xs text-[#F0B429]/40 underline mb-2"
          >
            {showTranslation ? '🙈 Ocultar' : '👁 Ver traducción'}
          </button>
          {showTranslation && (
            <p className="text-center text-base text-[#C1F325] fade-in">
              {sentence.spanish}
            </p>
          )}
        </div>

        {/* Playing indicator */}
        {isPlaying && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1.5 bg-[#F0B429] rounded-full animate-bounce"
                  style={{
                    height: `${12 + i * 6}px`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
            <span className="text-sm text-[#F0B429]/70">Reproduciendo...</span>
          </div>
        )}
      </div>

      {/* ── Controls ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">

        {/* Previous / Play-Pause / Next */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => goTo(currentIndex - 1)}
            className="min-h-[80px] bg-[#0F2040] border border-[#F0B429]/20 rounded-2xl flex flex-col items-center justify-center gap-1 text-2xl active:scale-95 transition-transform"
          >
            ⏮
            <span className="text-xs text-[#F0B429]/60">Anterior</span>
          </button>

          <button
            onClick={() => {
              if (!isPlaying) {
                if (mode === 'auto') {
                  startPlay()
                } else {
                  playOnce()
                }
              } else {
                pause()
              }
            }}
            className="min-h-[80px] bg-[#F0B429] text-[#0A1628] rounded-2xl flex flex-col items-center justify-center gap-1 text-3xl font-black active:scale-95 transition-transform"
          >
            {isPlaying ? '⏸' : '▶'}
            <span className="text-xs font-bold">{isPlaying ? 'Pausar' : 'Play'}</span>
          </button>

          <button
            onClick={() => goTo(currentIndex + 1)}
            className="min-h-[80px] bg-[#0F2040] border border-[#F0B429]/20 rounded-2xl flex flex-col items-center justify-center gap-1 text-2xl active:scale-95 transition-transform"
          >
            ⏭
            <span className="text-xs text-[#F0B429]/60">Siguiente</span>
          </button>
        </div>

        {/* Resume (if paused mid-auto) */}
        {!isPlaying && mode === 'auto' && (
          <button
            onClick={resume}
            className="min-h-[60px] bg-[#0F2040] border-2 border-[#F0B429]/40 rounded-2xl font-bold text-sm active:scale-95 transition-transform"
          >
            ▶ Continuar auto-play
          </button>
        )}

        {/* Emergency stop */}
        <button
          onClick={() => { stopAll(); onBack() }}
          className="min-h-[80px] bg-red-700 rounded-2xl flex items-center justify-center gap-3 text-white font-black text-xl active:scale-95 transition-transform"
        >
          ⏹ PAUSAR TODO
        </button>
      </div>
    </div>
  )
}
