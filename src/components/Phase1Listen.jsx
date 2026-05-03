import { useState, useEffect, useRef, useCallback } from 'react'
import { sentences } from '../data/sentences.js'
import { speakWithElevenLabs } from '../utils/elevenlabs.js'

const REPEAT_COUNT = 3
const PAUSE_MS     = 2000

export default function Phase1Listen({ onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [rep, setRep]                   = useState(1)
  const [isPlaying, setIsPlaying]       = useState(false)
  const [mode, setMode]                 = useState('auto')
  const [showTranslation, setShowTranslation] = useState(false)
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)

  const playingRef   = useRef(false)
  const pausedRef    = useRef(false)
  const indexRef     = useRef(0)
  const repRef       = useRef(1)
  const timeoutRef   = useRef(null)
  const currentAudioRef = useRef(null)

  const sentence = sentences[currentIndex]

  const stopAll = useCallback(() => {
    playingRef.current = false
    pausedRef.current  = true
    setIsPlaying(false)
    setIsLoadingAudio(false)
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  const speak = useCallback(async (text, onEnd) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    setIsLoadingAudio(true)
    try {
      const audio = await speakWithElevenLabs(text)
      setIsLoadingAudio(false)
      if (audio) {
        currentAudioRef.current = audio
        audio.onended = () => {
          currentAudioRef.current = null
          if (onEnd) onEnd()
        }
      } else {
        if (onEnd) onEnd()
      }
    } catch (error) {
      setIsLoadingAudio(false)
      console.error('speak error:', error)
      if (onEnd) onEnd()
    }
  }, [])

  const scheduleNext = useCallback(() => {
    if (!playingRef.current || pausedRef.current) return
    const text = sentences[indexRef.current].english
    speak(text, () => {
      if (!playingRef.current || pausedRef.current) return
      timeoutRef.current = setTimeout(() => {
        if (!playingRef.current || pausedRef.current) return
        if (repRef.current < REPEAT_COUNT) {
          repRef.current += 1
          setRep(repRef.current)
          scheduleNext()
        } else {
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

  const startPlay = useCallback(() => {
    playingRef.current = true
    pausedRef.current  = false
    setIsPlaying(true)
    scheduleNext()
  }, [scheduleNext])

  const pause = useCallback(() => {
    pausedRef.current = true
    setIsPlaying(false)
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  const resume = useCallback(() => {
    pausedRef.current = false
    setIsPlaying(true)
    scheduleNext()
  }, [scheduleNext])

  const goTo = useCallback((idx) => {
    const safeIdx = (idx + sentences.length) % sentences.length
    indexRef.current = safeIdx
    repRef.current   = 1
    setCurrentIndex(safeIdx)
    setRep(1)
    if (playingRef.current && !pausedRef.current) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      scheduleNext()
    }
  }, [scheduleNext])

  const playOnce = useCallback(() => {
    speak(sentences[indexRef.current].english, null)
  }, [speak])

  useEffect(() => {
    return () => { stopAll() }
  }, [stopAll])

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

  return (
    <div className="flex flex-col min-h-screen bg-[#0A1628] text-[#F0B429] px-4 pb-6">

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

        <button
          onClick={() => { stopAll(); setMode(m => m === 'auto' ? 'manual' : 'auto') }}
          className="px-3 h-10 rounded-2xl bg-[#0F2040] border border-[#F0B429]/20 text-xs font-bold"
        >
          {mode === 'auto' ? '🚗 Auto' : '👆 Manual'}
        </button>
      </div>

      <div className="h-1 rounded-full bg-[#0F2040] mb-4">
        <div
          className="h-full rounded-full bg-[#F0B429] transition-all duration-500"
          style={{ width: `${((currentIndex) / sentences.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="bg-[#0F2040] rounded-3xl p-6 border border-[#F0B429]/10 mb-4">

          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[#F0B429]/50 font-bold uppercase">
              Grupo {sentence.group} · {sentence.groupName}
            </span>
            <span className={`text-xs font-bold ${levelColor[sentence.level]}`}>
              {levelLabel[sentence.level]}
            </span>
          </div>

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

          <p className="text-center text-2xl font-bold text-[#F0B429] mb-4" style={{ lineHeight: 1.6 }}>
            {sentence.english}
          </p>

          <p className="text-center text-xs text-[#A8C8FF]/60 font-medium mb-1">🔊 Pronunciación</p>
          <p className="text-center text-xl font-medium mb-3 text-[#F0B429]">
            {sentence.phonetic}
          </p>

          <button
            onClick={() => setShowTranslation(s => !s)}
            className="w-full text-center text-xs text-[#F0B429]/40 underline mb-2"
          >
            {showTranslation ? '🙈 Ocultar' : '👁 Ver traducción'}
          </button>
          {showTranslation && (
            <p className="text-center text-base text-[#C1F325]">
              {sentence.spanish}
            </p>
          )}
        </div>

        {isLoadingAudio && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-sm text-[#F0B429]/70">⏳ Cargando voz...</span>
          </div>
        )}

        {isPlaying && !isLoadingAudio && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1.5 bg-[#F0B429] rounded-full animate-bounce"
                  style={{ height: `${12 + i * 6}px`, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <span className="text-sm text-[#F0B429]/70">Reproduciendo...</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => goTo(currentIndex - 1)}
            className="min-h-[80px] bg-[#0F2040] border border-[#F0B429]/20 rounded-2xl flex flex-col items-center justify-center gap-1 text-2xl active:scale-95 transition-transform"
          >
            ⮮
            <span className="text-xs text-[#F0B429]/60">Anterior</span>
          </button>

          <button
            onClick={() => {
              if (!isPlaying) {
                mode === 'auto' ? startPlay() : playOnce()
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
            ⭭
            <span className="text-xs text-[#F0B429]/60">Siguiente</span>
          </button>
        </div>

        {!isPlaying && mode === 'auto' && (
          <button
            onClick={resume}
            className="min-h-[60px] bg-[#0F2040] border-2 border-[#F0B429]/40 rounded-2xl font-bold text-sm active:scale-95 transition-transform"
          >
            ▶ Continuar auto-play
          </button>
        )}

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