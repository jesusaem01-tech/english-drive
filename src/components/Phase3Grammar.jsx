import { useState, useCallback } from 'react'
import { grammarQuestions } from '../data/grammarQuestions.js'
import { getSentenceById } from '../data/sentences.js'
import { updatePhase3 } from '../utils/storage.js'

const OPTION_COLORS = [
  'from-blue-700 to-blue-900 border-blue-500/40',
  'from-purple-700 to-purple-900 border-purple-500/40',
  'from-teal-700 to-teal-900 border-teal-500/40',
  'from-indigo-700 to-indigo-900 border-indigo-500/40',
]

const OPTION_COLORS_CORRECT = 'from-green-600 to-green-800 border-green-400'
const OPTION_COLORS_WRONG   = 'from-red-800 to-red-900 border-red-500 opacity-60'
const OPTION_COLORS_NEUTRAL = 'from-[#152d4f] to-[#0F2040] border-[#F0B429]/10'

export default function Phase3Grammar({ onBack }) {
  // Shuffle questions once
  const [questions] = useState(() =>
    [...grammarQuestions].sort(() => Math.random() - 0.5)
  )

  const [qIndex,       setQIndex]       = useState(0)
  const [selected,     setSelected]     = useState(null)   // index of chosen option
  const [showExplain,  setShowExplain]  = useState(false)
  const [streak,       setStreak]       = useState(0)
  const [score,        setScore]        = useState({ correct: 0, total: 0 })
  const [finished,     setFinished]     = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)

  const q        = questions[qIndex]
  const sentence = getSentenceById(q.sentenceId)
  const answered = selected !== null
  const correct  = selected === q.correctIndex

  const handleSelect = useCallback((idx) => {
    if (answered) return
    setSelected(idx)
    setShowExplain(true)
    setShowTranslation(true)
    const isCorrect = idx === q.correctIndex
    updatePhase3(q.id, isCorrect)
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }))
    setStreak(s => isCorrect ? s + 1 : 0)
  }, [answered, q])

  const next = useCallback(() => {
    if (qIndex + 1 >= questions.length) {
      setFinished(true)
    } else {
      setQIndex(i => i + 1)
      setSelected(null)
      setShowExplain(false)
      setShowTranslation(false)
    }
  }, [qIndex, questions.length])

  const restart = () => {
    setQIndex(0)
    setSelected(null)
    setShowExplain(false)
    setScore({ correct: 0, total: 0 })
    setStreak(0)
    setFinished(false)
  }

  // ── Finished screen ───────────────────────────────────────────────────────
  if (finished) {
    const pct = Math.round((score.correct / score.total) * 100)
    return (
      <div className="flex flex-col min-h-screen bg-[#0A1628] text-[#F0B429] px-4 pb-8">
        <div className="flex items-center pt-5 pb-3">
          <button
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-[#0F2040] border border-[#F0B429]/20 flex items-center justify-center text-xl"
          >←</button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="text-8xl mb-6">
            {pct >= 80 ? '🏆' : pct >= 60 ? '⭐' : '💪'}
          </div>
          <h2 className="text-3xl font-black mb-2">
            {pct >= 80 ? '¡Excelente!' : pct >= 60 ? '¡Bien hecho!' : '¡Sigue practicando!'}
          </h2>
          <p className="text-[#F0B429]/60 mb-8">Terminaste la sesión de lectura</p>

          <div className="grid grid-cols-3 gap-4 w-full mb-8">
            <div className="bg-[#0F2040] rounded-2xl p-4">
              <p className="text-3xl font-black">{pct}%</p>
              <p className="text-xs text-[#F0B429]/60">correcto</p>
            </div>
            <div className="bg-[#0F2040] rounded-2xl p-4">
              <p className="text-3xl font-black">{score.correct}</p>
              <p className="text-xs text-[#F0B429]/60">correctas</p>
            </div>
            <div className="bg-[#0F2040] rounded-2xl p-4">
              <p className="text-3xl font-black">{score.total - score.correct}</p>
              <p className="text-xs text-[#F0B429]/60">incorrectas</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={restart}
              className="min-h-[80px] bg-[#F0B429] text-[#0A1628] rounded-2xl font-black text-xl active:scale-95 transition-transform"
            >
              🔄 Volver a intentar
            </button>
            <button
              onClick={onBack}
              className="min-h-[70px] bg-[#0F2040] border border-[#F0B429]/20 rounded-2xl font-bold active:scale-95 transition-transform"
            >
              ← Ir al inicio
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main screen ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-[#0A1628] text-[#F0B429] px-4 pb-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-5 pb-3">
        <button
          onClick={onBack}
          className="w-12 h-12 rounded-2xl bg-[#0F2040] border border-[#F0B429]/20 flex items-center justify-center text-xl"
        >←</button>

        <div className="flex flex-col items-center">
          <span className="bg-purple-600 text-white text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider">
            FASE 3 — Lectura
          </span>
          <span className="text-xs text-[#F0B429]/50 mt-1">
            {qIndex + 1} / {questions.length}
          </span>
        </div>

        {/* Streak */}
        <div className="w-14 h-12 rounded-2xl bg-[#0F2040] border border-[#F0B429]/20 flex flex-col items-center justify-center">
          <span className="text-lg">🔥</span>
          <span className="text-xs font-black leading-none">{streak}</span>
        </div>
      </div>

      {/* ── Progress ───────────────────────────────────────────────────────── */}
      <div className="h-1.5 rounded-full bg-[#0F2040] mb-4">
        <div
          className="h-full rounded-full bg-purple-500 transition-all duration-500"
          style={{ width: `${(qIndex / questions.length) * 100}%` }}
        />
      </div>

      {/* ── Score bar ──────────────────────────────────────────────────────── */}
      {score.total > 0 && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <span className="text-green-400 font-bold">✓ {score.correct}</span>
          <div className="flex-1 h-2 rounded-full bg-[#0F2040] overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-300"
              style={{ width: `${(score.correct / score.total) * 100}%` }}
            />
          </div>
          <span className="text-[#F0B429]/50">{score.total} total</span>
        </div>
      )}

      {/* ── Sentence info ──────────────────────────────────────────────────── */}
      <div className="bg-[#0F2040] rounded-3xl p-5 border border-[#F0B429]/10 mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-[#F0B429]/50">
            {sentence?.groupName || 'Real Estate'}
          </span>
          <span className="text-xs font-bold text-purple-400">
            📖 {q.rule}
          </span>
        </div>

        {/* Fill in the blank sentence */}
        <p className="text-center leading-relaxed mb-2" style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', fontWeight: 700 }}>
          {q.displaySentence.split('___').map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span
                  className={`inline-block min-w-[80px] border-b-4 mx-2 px-2 rounded text-center transition-all duration-300 ${
                    !answered
                      ? 'border-[#F0B429] text-[#F0B429]/30'
                      : correct
                        ? 'border-green-500 text-green-300 bg-green-900/30'
                        : 'border-red-500 text-red-300 bg-red-900/30'
                  }`}
                >
                  {answered ? q.blank : '___'}
                </span>
              )}
            </span>
          ))}
        </p>

        {/* Pronunciación — visible solo después de responder */}
        {sentence && answered && (
          <>
            <p className="text-center text-xs text-[#A8C8FF]/60 font-medium mt-3 mb-1">🔊 Pronunciación</p>
            <p className="text-center text-xl text-[#A8C8FF] font-medium mb-2">
              {sentence.phonetic}
            </p>
          </>
        )}

        {/* Traducción — visible automáticamente después de responder */}
        {sentence && answered && (
          <p className="text-center text-sm text-[#C1F325] fade-in mt-1">
            {sentence.spanish}
          </p>
        )}
      </div>

      {/* ── Options ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {q.options.map((option, idx) => {
          let colorClass
          if (!answered) {
            colorClass = `bg-gradient-to-br ${OPTION_COLORS[idx % OPTION_COLORS.length]} border`
          } else if (idx === q.correctIndex) {
            colorClass = `bg-gradient-to-br ${OPTION_COLORS_CORRECT} border-2`
          } else if (idx === selected) {
            colorClass = `bg-gradient-to-br ${OPTION_COLORS_WRONG} border`
          } else {
            colorClass = `bg-gradient-to-br ${OPTION_COLORS_NEUTRAL} border opacity-50`
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={answered}
              className={`min-h-[80px] rounded-2xl flex flex-col items-center justify-center px-4 py-3 font-bold text-lg text-white transition-all duration-200 active:scale-95 ${colorClass}`}
            >
              <span className="text-xs text-white/50 mb-1">{String.fromCharCode(65 + idx)}</span>
              {option}
              {answered && idx === q.correctIndex && (
                <span className="text-green-300 text-xl mt-1">✓</span>
              )}
              {answered && idx === selected && idx !== q.correctIndex && (
                <span className="text-red-300 text-xl mt-1">✗</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Explanation ────────────────────────────────────────────────────── */}
      {showExplain && (
        <div className={`rounded-3xl p-5 border mb-4 fade-in ${
          correct
            ? 'bg-green-900/30 border-green-500/40'
            : 'bg-orange-900/30 border-orange-500/40'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{correct ? '✅' : '📚'}</span>
            <span className={`font-black text-lg ${correct ? 'text-green-300' : 'text-orange-300'}`}>
              {correct ? '¡Correcto!' : `La respuesta es: "${q.blank}"`}
            </span>
          </div>
          <p className="font-bold text-sm text-[#F0B429]/80 mb-1">📌 {q.rule}</p>
          <p className="text-sm text-[#F0B429]/70 leading-relaxed">{q.explanation}</p>
        </div>
      )}

      {/* ── Next button ────────────────────────────────────────────────────── */}
      {answered && (
        <button
          onClick={next}
          className="min-h-[80px] bg-[#F0B429] text-[#0A1628] rounded-2xl font-black text-xl flex items-center justify-center gap-2 active:scale-95 transition-transform fade-in"
        >
          {qIndex + 1 >= questions.length ? '🏁 Ver resultados' : 'Siguiente →'}
        </button>
      )}

      {/* Back button when not answered */}
      {!answered && (
        <button
          onClick={onBack}
          className="min-h-[70px] bg-[#0F2040] border border-[#F0B429]/20 rounded-2xl font-bold active:scale-95 transition-transform"
        >
          ← Volver al inicio
        </button>
      )}
    </div>
  )
}
