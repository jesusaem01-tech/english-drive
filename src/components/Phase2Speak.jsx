import { useState, useEffect, useRef, useCallback } from 'react'
import { sentences } from '../data/sentences.js'
import { sm2Review, isDue, getMasteryLabel, QUALITY } from '../utils/sm2.js'
import { getCard, updateCard } from '../utils/storage.js'

// ── Speech helpers ─────────────────────────────────────────────────────────────

function getAmericanVoice() {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('google')) ||
    voices.find(v => v.lang === 'en-US' && !v.localService) ||
    voices.find(v => v.lang === 'en-US') ||
    voices[0] ||
    null
  )
}

function speakText(text, rate = 0.82, onEnd = null, onStart = null) {
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang  = 'en-US'
  utter.rate  = rate
  utter.pitch = 1
  const voice = getAmericanVoice()
  if (voice) utter.voice = voice
  if (onStart) utter.onstart = onStart
  if (onEnd) utter.onend = onEnd
  window.speechSynthesis.speak(utter)
}

// ── Word comparison ────────────────────────────────────────────────────────────

function levenshtein(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function normalizeStr(str) {
  return str.toLowerCase().replace(/[^a-z\s']/g, '').trim()
}

function compareSpoken(original, spoken) {
  const origWordsDisplay = original.trim().split(/\s+/)          // casing original para display
  const origWordsNorm    = normalizeStr(original).split(/\s+/)   // lowercase para comparar
  const spokenWords      = normalizeStr(spoken).split(/\s+/)     // lowercase para comparar

  const result = origWordsDisplay.map((word, idx) => {
    const normWord = origWordsNorm[idx] || normalizeStr(word)
    const maxDist = normWord.length <= 4 ? 1 : 2
    const found = spokenWords.some(sw =>
      sw === normWord || levenshtein(sw, normWord) <= maxDist
    )
    return { word, correct: found }  // word mantiene mayúsculas originales
  })

  const score = result.filter(r => r.correct).length / Math.max(result.length, 1)
  return { result, score }
}

function scoreToFeedback(score) {
  if (score >= 0.85) return { label: '¡Excelente!',   color: 'green',  emoji: '🟢', quality: QUALITY.GOOD }
  if (score >= 0.60) return { label: '¡Casi!',        color: 'yellow', emoji: '🟡', quality: QUALITY.HARD }
  return                    { label: 'Intenta de nuevo', color: 'red', emoji: '🔴', quality: QUALITY.AGAIN }
}

// ── States of the speaking machine ────────────────────────────────────────────
const STATE = {
  IDLE: 'idle',
  SPEAKING: 'speaking',    // app is saying the sentence
  WAITING: 'waiting',      // countdown before mic opens
  LISTENING: 'listening',  // recording user
  RESULT: 'result',        // showing comparison result
}

// ── Recognition support check ─────────────────────────────────────────────────
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null

// ── Component ─────────────────────────────────────────────────────────────────

export default function Phase2Speak({ onBack }) {
  // Filter to due sentences
  const [queue] = useState(() => {
    const all = sentences.map(s => ({ ...s, card: getCard(s.id) }))
    const due  = all.filter(s => isDue(s.card))
    return due.length > 0 ? due : all
  })

  const [qIndex,       setQIndex]       = useState(0)
  const [machineState, setMachineState] = useState(STATE.IDLE)
  const [spokenText,   setSpokenText]   = useState('')
  const [comparison,   setComparison]   = useState(null)   // { result, score }
  const [feedback,     setFeedback]     = useState(null)   // { label, color, emoji, quality }
  const [showTranslation, setShowTranslation] = useState(false)
  const [activeWordIndex, setActiveWordIndex] = useState(-1) // karaoke
  const [noRecognition] = useState(!SpeechRecognition)

  const recognitionRef     = useRef(null)
  const karaokeIntervalRef = useRef(null)

  const sentence = queue[qIndex]

  // Resetear karaoke y traducción al cambiar de oración
  useEffect(() => {
    setActiveWordIndex(-1)
    setShowTranslation(false)
  }, [qIndex])

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
      if (karaokeIntervalRef.current) clearInterval(karaokeIntervalRef.current)
    }
  }, [])

  // ── Speak sentence ─────────────────────────────────────────────────────────
  const doSpeak = useCallback(() => {
    setMachineState(STATE.SPEAKING)
    setComparison(null)
    setFeedback(null)
    setSpokenText('')
    setShowTranslation(false)
    setActiveWordIndex(-1)

    if (karaokeIntervalRef.current) {
      clearInterval(karaokeIntervalRef.current)
      karaokeIntervalRef.current = null
    }

    const text = sentence.english
    const words = text.split(/\s+/)
    const rate = 0.82
    let cumulative = 0
    const timings = words.map(word => {
      const duration = Math.max(180, word.length * 75) / rate
      const t = { start: cumulative }
      cumulative += duration + 40
      return t
    })

    speakText(text, rate,
      // onEnd
      () => {
        if (karaokeIntervalRef.current) {
          clearInterval(karaokeIntervalRef.current)
          karaokeIntervalRef.current = null
        }
        setActiveWordIndex(-1)
        startListening()
      },
      // onStart — karaoke en tiempo real
      () => {
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
    )
  }, [sentence])

  // ── Listen with microphone ─────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!SpeechRecognition) return

    setMachineState(STATE.LISTENING)

    const recognition = new SpeechRecognition()
    recognition.lang             = 'en-US'
    recognition.continuous       = false
    recognition.interimResults   = false
    recognition.maxAlternatives  = 3

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setSpokenText(transcript)

      const comp = compareSpoken(sentence.english, transcript)
      setComparison(comp)
      setFeedback(scoreToFeedback(comp.score))
      setMachineState(STATE.RESULT)
    }

    recognition.onerror = () => {
      setSpokenText('(No se detectó voz)')
      setComparison({ result: [], score: 0 })
      setFeedback(scoreToFeedback(0))
      setMachineState(STATE.RESULT)
    }

    recognition.onend = () => {
      if (machineState === STATE.LISTENING) {
        // Timeout — no result
        setSpokenText('(Tiempo agotado)')
        setComparison({ result: [], score: 0 })
        setFeedback(scoreToFeedback(0))
        setMachineState(STATE.RESULT)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [sentence])

  // ── SM-2 rating ───────────────────────────────────────────────────────────
  const rate = useCallback((quality) => {
    const card   = sentence.card || {}
    const result = sm2Review(card, quality)
    updateCard(sentence.id, result)

    // Advance to next sentence
    const nextIdx = (qIndex + 1) % queue.length
    setQIndex(nextIdx)
    setMachineState(STATE.IDLE)
    setComparison(null)
    setFeedback(null)
    setSpokenText('')
  }, [sentence, qIndex, queue])

  const stopAll = () => {
    window.speechSynthesis.cancel()
    if (recognitionRef.current) { try { recognitionRef.current.stop() } catch {} }
    if (karaokeIntervalRef.current) { clearInterval(karaokeIntervalRef.current); karaokeIntervalRef.current = null }
    onBack()
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const colorMap = {
    green:  { bg: 'bg-green-900/40',  border: 'border-green-500/50',  text: 'text-green-300'  },
    yellow: { bg: 'bg-yellow-900/40', border: 'border-yellow-500/50', text: 'text-yellow-300' },
    red:    { bg: 'bg-red-900/40',    border: 'border-red-500/50',    text: 'text-red-300'    },
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0A1628] text-[#F0B429] px-4 pb-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-5 pb-3">
        <button
          onClick={stopAll}
          className="w-12 h-12 rounded-2xl bg-[#0F2040] border border-[#F0B429]/20 flex items-center justify-center text-xl"
        >←</button>

        <div className="flex flex-col items-center">
          <span className="bg-green-600 text-white text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider">
            FASE 2 — Repite Conmigo
          </span>
          <span className="text-xs text-[#F0B429]/50 mt-1">
            {qIndex + 1} / {queue.length}
          </span>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#0F2040] border border-[#F0B429]/20 flex items-center justify-center text-xs font-bold text-center leading-tight px-1">
          {getMasteryLabel(sentence.card)}
        </div>
      </div>

      {/* ── Progress ───────────────────────────────────────────────────────── */}
      <div className="h-1 rounded-full bg-[#0F2040] mb-4">
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-500"
          style={{ width: `${(qIndex / queue.length) * 100}%` }}
        />
      </div>

      {/* ── Sentence card ──────────────────────────────────────────────────── */}
      <div className="bg-[#0F2040] rounded-3xl p-6 border border-[#F0B429]/10 mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-[#F0B429]/50">Grupo {sentence.group} · {sentence.groupName}</span>
          <span className="text-xs text-[#F0B429]/50">{sentence.level}</span>
        </div>

        {/* Instrucción fija */}
        <p style={{ fontSize: '13px', color: '#8899BB', textAlign: 'center', marginBottom: '12px' }}>
          1. Escucha &nbsp;→&nbsp; 2. ¡HABLA AHORA! &nbsp;→&nbsp; 3. Ve tu resultado
        </p>

        {/* Main sentence — karaoke mientras habla, diff tras resultado */}
        <div className="sentence-text mb-4" style={{ textAlign: 'center', lineHeight: 1.6, wordBreak: 'break-word', width: '100%' }}>
          {machineState === STATE.RESULT && comparison && comparison.result.length > 0 ? (
            <span>
              {comparison.result.map((w, i) => (
                <span key={i} className={w.correct ? 'word-correct' : 'word-incorrect'}>
                  {w.word}{' '}
                </span>
              ))}
            </span>
          ) : (
            sentence.english.split(/\s+/).map((word, i) => (
              <span
                key={`${qIndex}-${i}`}
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
            ))
          )}
        </div>

        {/* Pronunciación — karaoke sincronizado con inglés */}
        <p className="text-center text-xs text-[#A8C8FF]/60 font-medium mt-3 mb-1">🔊 Pronunciación</p>
        <p className="text-center text-xl font-medium mb-2" style={{ lineHeight: 1.6, wordBreak: 'break-word' }}>
          {(() => {
            const phoneticWords = sentence.phonetic.split(/\s+/)
            const englishWords  = sentence.english.split(/\s+/)
            const phonActive = activeWordIndex === -1 ? -1
              : Math.round(activeWordIndex * phoneticWords.length / englishWords.length)
            return phoneticWords.map((word, i) => (
              <span
                key={`ph-${qIndex}-${i}`}
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
          className="w-full text-center text-xs text-[#F0B429]/40 underline mb-1"
        >
          {showTranslation ? '🙈 Ocultar' : '👁 Ver traducción'}
        </button>
        {showTranslation && (
          <p className="text-center text-sm text-[#C1F325] fade-in">
            {sentence.spanish}
          </p>
        )}
      </div>

      {/* ── State display ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center">

        {/* IDLE */}
        {machineState === STATE.IDLE && (
          <div className="text-center">
            <p className="text-[#F0B429]/60 text-base mb-2">Presiona el botón para escuchar</p>
            <p className="text-[#F0B429]/40 text-sm">Luego repite lo que escuches</p>
          </div>
        )}

        {/* SPEAKING */}
        {machineState === STATE.SPEAKING && (
          <div className="text-center fade-in">
            <div className="text-6xl mb-3 animate-pulse">🔊</div>
            <p className="text-[#F0B429]/80 font-bold text-lg">Escuchando...</p>
            <p className="text-[#F0B429]/40 text-sm mt-1">Presta atención a la pronunciación</p>
          </div>
        )}

        {/* LISTENING */}
        {machineState === STATE.LISTENING && (
          <div className="text-center fade-in">
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#F0B429', marginBottom: '16px' }}>
              🎤 ¡HABLA AHORA!
            </p>
            <div className="relative flex items-center justify-center w-32 h-32 mx-auto mb-4">
              <div className="absolute w-32 h-32 rounded-full bg-red-500/20 listening-ring" />
              <div className="absolute w-24 h-24 rounded-full bg-red-500/20 listening-ring" style={{ animationDelay: '0.5s' }} />
              <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-4xl z-10">
                🎤
              </div>
            </div>
            <p className="text-red-300 font-bold text-base">🎙️ Escuchando...</p>
          </div>
        )}

        {/* NO RECOGNITION */}
        {noRecognition && machineState === STATE.IDLE && (
          <div className="bg-yellow-900/30 border border-yellow-500/40 rounded-2xl p-4 text-center mt-4">
            <p className="text-yellow-300 text-sm font-bold">⚠️ Tu navegador no soporta reconocimiento de voz</p>
            <p className="text-yellow-300/70 text-xs mt-1">Usa Google Chrome para esta función</p>
          </div>
        )}

        {/* RESULT */}
        {machineState === STATE.RESULT && feedback && (
          <div className={`w-full rounded-3xl p-5 border mb-4 fade-in ${colorMap[feedback.color].bg} ${colorMap[feedback.color].border}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{feedback.emoji}</span>
              <div>
                <p className={`font-black text-xl ${colorMap[feedback.color].text}`}>{feedback.label}</p>
                <p className="text-[#F0B429]/60 text-sm">
                  {Math.round((comparison?.score || 0) * 100)}% de palabras correctas
                </p>
              </div>
            </div>
            {spokenText && (
              <div className="bg-black/20 rounded-2xl p-3">
                <p className="text-xs text-[#F0B429]/50 mb-1">Lo que dijiste:</p>
                <p className="text-[#F0B429]/80 text-base italic">"{spokenText}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Controls ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">

        {/* Main action button */}
        {machineState === STATE.IDLE && (
          <button
            onClick={doSpeak}
            className="min-h-[90px] bg-[#F0B429] text-[#0A1628] rounded-2xl flex flex-col items-center justify-center gap-1 font-black text-xl active:scale-95 transition-transform"
          >
            🔊 Escuchar oración
            <span className="text-sm font-bold opacity-70">La app habla → tú repites</span>
          </button>
        )}

        {machineState === STATE.LISTENING && !SpeechRecognition && (
          <button
            onClick={() => {
              setSpokenText('(manual)')
              setComparison({ result: [], score: 0.5 })
              setFeedback(scoreToFeedback(0.5))
              setMachineState(STATE.RESULT)
            }}
            className="min-h-[80px] bg-yellow-600 text-white rounded-2xl flex items-center justify-center font-bold text-lg active:scale-95 transition-transform"
          >
            Continuar (sin micrófono)
          </button>
        )}

        {/* SM-2 Rating buttons — only after result */}
        {machineState === STATE.RESULT && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => rate(QUALITY.AGAIN)}
              className="min-h-[80px] bg-red-700 rounded-2xl flex flex-col items-center justify-center text-white font-bold active:scale-95 transition-transform"
            >
              <span className="text-2xl">🔁</span>
              Otra vez
            </button>
            <button
              onClick={() => rate(QUALITY.HARD)}
              className="min-h-[80px] bg-orange-600 rounded-2xl flex flex-col items-center justify-center text-white font-bold active:scale-95 transition-transform"
            >
              <span className="text-2xl">😓</span>
              Difícil
            </button>
            <button
              onClick={() => rate(QUALITY.GOOD)}
              className="min-h-[80px] bg-green-600 rounded-2xl flex flex-col items-center justify-center text-white font-bold active:scale-95 transition-transform"
            >
              <span className="text-2xl">👍</span>
              Bien
            </button>
            <button
              onClick={() => rate(QUALITY.EASY)}
              className="min-h-[80px] bg-blue-600 rounded-2xl flex flex-col items-center justify-center text-white font-bold active:scale-95 transition-transform"
            >
              <span className="text-2xl">⭐</span>
              Fácil
            </button>
          </div>
        )}

        {/* Try again from result */}
        {machineState === STATE.RESULT && (
          <button
            onClick={doSpeak}
            className="min-h-[60px] bg-[#0F2040] border border-[#F0B429]/30 rounded-2xl font-bold active:scale-95 transition-transform"
          >
            🔄 Intentar de nuevo
          </button>
        )}

        {/* Emergency stop */}
        <button
          onClick={stopAll}
          className="min-h-[80px] bg-red-700 rounded-2xl flex items-center justify-center gap-3 text-white font-black text-xl active:scale-95 transition-transform"
        >
          ⏹ PAUSAR TODO
        </button>
      </div>
    </div>
  )
}
