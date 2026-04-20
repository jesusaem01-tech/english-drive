import { useState, useEffect } from 'react'
import { getStats, getSettings, updateSettings, getAllCards, resetAllProgress } from '../utils/storage.js'
import { sentences } from '../data/sentences.js'
import { isDue, isMastered } from '../utils/sm2.js'

export default function HomeScreen({ onNavigate }) {
  const [stats, setStats] = useState(getStats())
  const [settings, setSettings] = useState(getSettings())
  const [showSettings, setShowSettings] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [dueCount, setDueCount] = useState(0)

  useEffect(() => {
    const freshStats = getStats()
    setStats(freshStats)
    const cards = getAllCards()
    const due = sentences.filter(s => {
      const card = cards[String(s.id)]
      return isDue(card)
    }).length
    setDueCount(due)
  }, [])

  const dailyProgress = Math.min(stats.todayCount / settings.dailyGoal, 1)
  const masteredPct = Math.round((stats.totalMastered / sentences.length) * 100)

  function handleGoalChange(val) {
    const goal = Math.max(5, Math.min(50, parseInt(val) || 15))
    updateSettings({ dailyGoal: goal })
    setSettings(s => ({ ...s, dailyGoal: goal }))
  }

  function handleReset() {
    resetAllProgress()
    setStats(getStats())
    setShowReset(false)
    setDueCount(sentences.length)
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0A1628] text-[#F0B429] px-4 pb-8">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-6 pb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">English Drive</h1>
          <p className="text-sm text-[#F0B429]/60">Aprende inglés mientras manejas</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(s => !s)}
            className="w-12 h-12 rounded-2xl bg-[#0F2040] border border-[#F0B429]/20 flex items-center justify-center text-xl"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* ── Settings Panel ────────────────────────────────────────────────────── */}
      {showSettings && (
        <div className="bg-[#0F2040] rounded-3xl p-5 mb-4 border border-[#F0B429]/20 fade-in">
          <h3 className="font-bold text-lg mb-4">Configuración</h3>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-[#F0B429]/80">Meta diaria de oraciones</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleGoalChange(settings.dailyGoal - 5)}
                className="w-10 h-10 rounded-xl bg-[#152d4f] flex items-center justify-center font-bold text-lg"
              >−</button>
              <span className="w-10 text-center font-bold text-xl">{settings.dailyGoal}</span>
              <button
                onClick={() => handleGoalChange(settings.dailyGoal + 5)}
                className="w-10 h-10 rounded-xl bg-[#152d4f] flex items-center justify-center font-bold text-lg"
              >+</button>
            </div>
          </div>
          <button
            onClick={() => setShowReset(true)}
            className="w-full py-3 rounded-2xl bg-red-900/40 border border-red-500/40 text-red-400 font-bold"
          >
            Reiniciar todo el progreso
          </button>
        </div>
      )}

      {/* ── Reset Confirm ─────────────────────────────────────────────────────── */}
      {showReset && (
        <div className="bg-red-900/30 rounded-3xl p-5 mb-4 border border-red-500/40 fade-in">
          <p className="font-bold text-white mb-4 text-center">¿Reiniciar todo el progreso?<br/><span className="text-red-400 font-normal text-sm">Esto no se puede deshacer.</span></p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setShowReset(false)} className="py-3 rounded-2xl bg-[#0F2040] font-bold">Cancelar</button>
            <button onClick={handleReset} className="py-3 rounded-2xl bg-red-600 text-white font-bold">Reiniciar</button>
          </div>
        </div>
      )}

      {/* ── Daily Progress ────────────────────────────────────────────────────── */}
      <div className="bg-[#0F2040] rounded-3xl p-5 mb-4 border border-[#F0B429]/10">
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold">Progreso de hoy</span>
          <span className="text-sm font-bold text-[#F0B429]/80">
            {stats.todayCount} / {settings.dailyGoal}
          </span>
        </div>
        <div className="h-4 rounded-full bg-[#152d4f] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#F0B429] transition-all duration-700"
            style={{ width: `${dailyProgress * 100}%` }}
          />
        </div>
        {stats.todayCount >= settings.dailyGoal && (
          <p className="text-center mt-2 text-green-400 font-bold text-sm">¡Meta diaria completada!</p>
        )}
      </div>

      {/* ── Stats Grid ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#0F2040] rounded-2xl p-4 flex flex-col items-center border border-[#F0B429]/10">
          <span className="text-3xl mb-1">🔥</span>
          <span className="text-2xl font-black">{stats.streak}</span>
          <span className="text-xs text-[#F0B429]/60 text-center">días<br/>seguidos</span>
        </div>
        <div className="bg-[#0F2040] rounded-2xl p-4 flex flex-col items-center border border-[#F0B429]/10">
          <span className="text-3xl mb-1">📚</span>
          <span className="text-2xl font-black">{stats.totalMastered}</span>
          <span className="text-xs text-[#F0B429]/60 text-center">oraciones<br/>dominadas</span>
        </div>
        <div className="bg-[#0F2040] rounded-2xl p-4 flex flex-col items-center border border-[#F0B429]/10">
          <span className="text-3xl mb-1">🎯</span>
          <span className="text-2xl font-black">{dueCount}</span>
          <span className="text-xs text-[#F0B429]/60 text-center">pendientes<br/>hoy</span>
        </div>
      </div>

      {/* ── Progress Bar Total ────────────────────────────────────────────────── */}
      <div className="bg-[#0F2040] rounded-3xl p-5 mb-6 border border-[#F0B429]/10">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold">Progreso total</span>
          <span className="text-sm text-[#F0B429]/70">{stats.totalMastered} / {sentences.length} dominadas</span>
        </div>
        <div className="h-3 rounded-full bg-[#152d4f] overflow-hidden mb-1">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#F0B429] to-green-400 transition-all duration-700"
            style={{ width: `${masteredPct}%` }}
          />
        </div>
        <p className="text-right text-xs text-[#F0B429]/50">{masteredPct}% completado</p>
      </div>

      {/* ── Phase Buttons ─────────────────────────────────────────────────────── */}
      <h2 className="text-lg font-bold mb-3 text-[#F0B429]/80">Elegir Fase</h2>

      <div className="flex flex-col gap-4">

        {/* Phase 1 */}
        <button
          onClick={() => onNavigate('phase1')}
          className="min-h-[90px] bg-gradient-to-r from-blue-700 to-blue-900 rounded-3xl p-5 flex items-center gap-4 border border-blue-500/30 active:scale-95 transition-transform"
        >
          <span className="text-5xl">🎧</span>
          <div className="text-left">
            <p className="text-white font-black text-xl leading-tight">FASE 1 — Solo Escucha</p>
            <p className="text-blue-300 text-sm mt-1">Modo manos libres · Auto-play · 3× repetición</p>
          </div>
          <span className="ml-auto text-blue-400 text-2xl">›</span>
        </button>

        {/* Phase 2 */}
        <button
          onClick={() => onNavigate('phase2')}
          className="min-h-[90px] bg-gradient-to-r from-green-700 to-green-900 rounded-3xl p-5 flex items-center gap-4 border border-green-500/30 active:scale-95 transition-transform"
        >
          <span className="text-5xl">🎤</span>
          <div className="text-left">
            <p className="text-white font-black text-xl leading-tight">FASE 2 — Repite Conmigo</p>
            <p className="text-green-300 text-sm mt-1">Pronunciación · Micrófono · SM-2</p>
          </div>
          <span className="ml-auto text-green-400 text-2xl">›</span>
        </button>

        {/* Phase 3 */}
        <button
          onClick={() => onNavigate('phase3')}
          className="min-h-[90px] bg-gradient-to-r from-purple-700 to-purple-900 rounded-3xl p-5 flex items-center gap-4 border border-purple-500/30 active:scale-95 transition-transform"
        >
          <span className="text-5xl">📝</span>
          <div className="text-left">
            <p className="text-white font-black text-xl leading-tight">FASE 3 — Lectura</p>
            <p className="text-purple-300 text-sm mt-1">Fill in the blank · Reglas explicadas</p>
          </div>
          <span className="ml-auto text-purple-400 text-2xl">›</span>
        </button>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <div className="mt-auto pt-8 text-center">
        <p className="text-xs text-[#F0B429]/30">
          {sentences.length} oraciones · Real Estate English · SM-2
        </p>
      </div>
    </div>
  )
}
