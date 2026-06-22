import { useEffect, useRef, useState } from 'react'
import { getStoredOnboarding } from '../components/Onboarding.jsx'

const totalWords = 3000
const TARGET_PER_INTEREST = 20
const CUSTOM_PHRASES_KEY = 'habloo_custom_phrases'
const CUSTOM_PHRASES_CHANGED_EVENT = 'habloo_custom_phrases_changed'
const MASTERED_PHRASES_KEY = 'habloo_mastered_phrase_ids'
const CORE_UNITS_KEY = 'habloo_core_units_known'
const US_FLAG = '\u{1F1FA}\u{1F1F8}'
const acquiredWordsTooltip =
  'Las palabras adquiridas incluyen verbos, sustantivos, adjetivos, preposiciones, conectores, expresiones comunes y frases nativas que ya has adquirido y puedes usar con confianza. Meta Conversacional: 3000. Meta Avanzada: 5000+.'

const learningCards = [
  {
    icon: '🎧',
    title: 'Fase 1 · Escuchar',
    subtitle: 'Ritmo, oído y contexto',
    accent: 'from-[#B8FF2C]/24 to-[#44D7FF]/10',
    route: 'prototype-initial-phase1',
  },
  {
    icon: '🎙️',
    title: 'Fase 2 · Pronunciación',
    subtitle: 'Habla con feedback',
    accent: 'from-[#44D7FF]/22 to-[#B8FF2C]/8',
    route: 'prototype-phase2-pronunciation',
  },
  {
    icon: '👁️',
    title: 'Fase 3 · Visual',
    subtitle: 'Memoria por imagen',
    accent: 'from-[#F0B429]/20 to-[#B8FF2C]/8',
    route: 'prototype-phase3-visual',
  },
  {
    icon: '🤖',
    title: 'Tutor IA',
    subtitle: 'Practica guiada',
    accent: 'from-[#A78BFA]/24 to-[#44D7FF]/8',
    route: 'prototype-ai-tutor',
  },
  {
    icon: '🌎',
    title: 'Inmersion IA',
    subtitle: 'Escenas reales',
    accent: 'from-[#14F195]/18 to-[#44D7FF]/10',
    route: 'prototype-ai-immersion',
  },
]

const menuItems = [
  { label: 'Home', route: 'prototype-home-architecture' },
  { label: 'Habloo', route: 'prototype-learning-pool' },
  { label: 'Mis Frases', route: 'prototype-my-phrases' },
  { label: 'Planes', route: 'prototype-plans' },
]

const profileItems = [
  { label: 'Mi Perfil', route: 'prototype-profile' },
  { label: 'Comunidad', route: 'prototype-community' },
  { label: 'Configuración', route: 'prototype-settings' },
  { label: 'Ayuda', route: 'prototype-help' },
  { label: 'Cerrar sesión', route: 'prototype-sign-out' },
]

const fallbackInterests = ['Vida diaria', 'Trabajo', 'Viajes']

const interestCategoryMap = {
  'vida diaria': 'daily_life',
  trabajo: 'work',
  viajes: 'travel',
  familia: 'family',
  fitness: 'fitness',
  gym: 'fitness',
  restaurante: 'restaurant',
  pareja: 'relationship',
  tecnologia: 'technology',
  tecnología: 'technology',
  'bienes raices': 'real_estate',
  'bienes raíces': 'real_estate',
  'real estate': 'real_estate',
}

function normalizeInterestKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function slugifyInterest(value) {
  return normalizeInterestKey(value)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'custom'
}

function getStoredArray(key) {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function getStoredCustomPhrasesCount() {
  return getStoredArray(CUSTOM_PHRASES_KEY).length
}

function getStoredInterests() {
  try {
    const raw = localStorage.getItem('habloo_interests')
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return []
  }
}

function formatTargetLanguage(value) {
  const language = String(value || 'Inglés')
  const key = language
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (key.includes('ingl') || key === 'english') return `${US_FLAG} Inglés`
  return language
}

function getHomeProfile(onboarding) {
  const saved = onboarding || getStoredOnboarding()
  const name = saved?.name || localStorage.getItem('habloo_name') || 'Andres'
  const tutor = localStorage.getItem('habloo_tutor_name') || saved?.tutor || 'Sarah'
  const storedInterests = getStoredInterests()
  const interests = storedInterests.length ? storedInterests : saved?.interests?.length ? saved.interests : fallbackInterests
  const customPhrasesCount = getStoredCustomPhrasesCount()
  const masteredIds = getStoredArray(MASTERED_PHRASES_KEY)
  const coreUnitsKnown = getStoredArray(CORE_UNITS_KEY)
  const getMasteredCount = (category) =>
    masteredIds.filter((id) => String(id).startsWith(`${category}-`)).length

  return {
    name,
    initial: name.charAt(0).toUpperCase(),
    targetLanguage: formatTargetLanguage(saved?.targetLanguage || localStorage.getItem('habloo_target_language') || 'Inglés'),
    level: saved?.level || localStorage.getItem('habloo_level') || 'No estoy seguro',
    tutor,
    activeTutors: saved?.activeTutors?.length ? saved.activeTutors : [tutor, 'Tutor IA'],
    interests,
    interestProgress: interests.map((interest) => {
      const category = interestCategoryMap[normalizeInterestKey(interest)] || slugifyInterest(interest)
      return {
        label: interest,
        mastered: getMasteredCount(category),
        acquiredWords: getMasteredCount(category),
        available: TARGET_PER_INTEREST,
      }
    }),
    customProgress: {
      label: 'Mis Frases',
      mastered: masteredIds.filter((id) => String(id).startsWith('custom-phrase-')).length,
      acquiredWords: masteredIds.filter((id) => String(id).startsWith('custom-phrase-')).length,
      available: customPhrasesCount,
    },
    coreUnitsKnown: coreUnitsKnown.length,
    customPhrasesCount,
    activePhrasesCount: interests.length * TARGET_PER_INTEREST + customPhrasesCount,
  }
}

function getInterestPhaseRoute(interest) {
  return interest.toLowerCase() === 'vida diaria'
    ? 'prototype-daily-life-phase1'
    : 'prototype-initial-phase1'
}

export default function HomeArchitecturePrototype({ onBack, onNavigate, onboarding }) {
  const [customPhrasesVersion, setCustomPhrasesVersion] = useState(0)
  const profile = getHomeProfile(onboarding)
  const coreProgress = (profile.coreUnitsKnown / totalWords) * 100
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const menuRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    const refreshCustomPhraseCounts = () => setCustomPhrasesVersion((version) => version + 1)
    window.addEventListener(CUSTOM_PHRASES_CHANGED_EVENT, refreshCustomPhraseCounts)
    window.addEventListener('storage', refreshCustomPhraseCounts)
    return () => {
      window.removeEventListener(CUSTOM_PHRASES_CHANGED_EVENT, refreshCustomPhraseCounts)
      window.removeEventListener('storage', refreshCustomPhraseCounts)
    }
  }, [])

  const openMenuRoute = (route) => {
    setIsMenuOpen(false)
    setIsProfileOpen(false)
    onNavigate?.(route)
  }

  useEffect(() => {
    if (!isMenuOpen) return undefined

    const closeOnOutsidePointer = (event) => {
      if (menuRef.current?.contains(event.target)) return
      setIsMenuOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [isMenuOpen])

  useEffect(() => {
    if (!isProfileOpen) return undefined

    const closeOnOutsidePointer = (event) => {
      if (profileRef.current?.contains(event.target)) return
      setIsProfileOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [isProfileOpen])

  return (
    <div
      className="min-h-screen overflow-hidden px-4 py-4 text-white selection:bg-[#B8FF2C] selection:text-[#071321]"
      style={{
        background:
          'radial-gradient(circle at 50% -12%, rgba(68, 215, 255, 0.2), transparent 34%), radial-gradient(circle at 12% 18%, rgba(10, 34, 64, 0.9), transparent 36%), linear-gradient(160deg, #04162b 0%, #071c36 48%, #0a2240 100%)',
      }}
    >
      <style>{`
        @keyframes hablooFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        @keyframes hablooShimmer {
          0% { transform: translateX(-38%); opacity: .35; }
          50% { opacity: .9; }
          100% { transform: translateX(118%); opacity: .35; }
        }

        @keyframes hablooPulse {
          0%, 100% { box-shadow: 0 0 28px rgba(184, 255, 44, .16); }
          50% { box-shadow: 0 0 42px rgba(68, 215, 255, .2); }
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-160px] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-[#44D7FF]/14 blur-[92px]" />
        <div className="absolute bottom-[-180px] left-[-140px] h-[320px] w-[320px] rounded-full bg-[#0A86FF]/12 blur-[90px]" />
        <div className="absolute bottom-[16%] right-[-170px] h-[300px] w-[300px] rounded-full bg-[#B8FF2C]/7 blur-[95px]" />
      </div>

      <main className="relative mx-auto flex min-h-[calc(100vh-32px)] w-full max-w-[430px] flex-col overflow-hidden rounded-[34px] border border-white/10 bg-[#071321]/92 p-4 shadow-[0_28px_90px_rgba(0,0,0,.55)] backdrop-blur-2xl sm:p-5">
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#B8FF2C]/45 to-transparent" />

        <header className="mb-6 flex items-center justify-between gap-3">
          <div ref={menuRef} className="relative z-20 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen(false)
                setIsMenuOpen((current) => !current)
              }}
              aria-label="Abrir menú"
              aria-expanded={isMenuOpen}
              className={`grid h-11 w-11 place-items-center rounded-full border bg-white/[0.055] shadow-lg transition duration-300 hover:border-[#B8FF2C]/35 hover:bg-[#B8FF2C]/10 active:scale-95 ${
                isMenuOpen
                  ? 'border-[#B8FF2C]/38 text-[#B8FF2C] shadow-[0_0_28px_rgba(184,255,44,.16)]'
                  : 'border-white/10 text-white/90 shadow-black/20'
              }`}
            >
              {isMenuOpen ? (
                <span className="text-xl font-semibold leading-none">×</span>
              ) : (
                <span className="flex w-4 flex-col gap-1">
                  <span className="h-0.5 rounded-full bg-current" />
                  <span className="h-0.5 rounded-full bg-current" />
                  <span className="h-0.5 rounded-full bg-current" />
                </span>
              )}
            </button>

            {isMenuOpen && (
              <div className="absolute left-0 top-[52px] w-56 divide-y divide-[#B8FF2C]/[0.08] overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(7,19,33,0.94)] p-2 shadow-[0_24px_70px_rgba(0,0,0,.55)] backdrop-blur-xl">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => openMenuRoute(item.route)}
                    className="flex w-full items-center justify-between rounded-[18px] px-3 py-2.5 text-left text-sm font-semibold text-white/78 transition duration-300 hover:bg-white/[0.065] hover:text-white active:scale-[0.99]"
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-[#B8FF2C]/58">›</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-2xl bg-[#B8FF2C] text-sm font-black text-[#071321] shadow-[0_0_24px_rgba(184,255,44,.35)]">
              H
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold leading-tight text-white">
                Habloo
              </p>
              <p className="truncate text-[11px] font-medium text-white/45">
                Hola, {profile.name}
              </p>
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-[#44D7FF]/70">
                {profile.targetLanguage}
              </p>
              <p className="truncate text-[10px] font-semibold text-white/42">
                Nivel: {profile.level}
              </p>
              <p className="truncate text-[10px] font-semibold text-[#B8FF2C]/55">
                Tutor: {profile.tutor}
              </p>
            </div>
          </div>

          <div ref={profileRef} className="relative z-20 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false)
                setIsProfileOpen((current) => !current)
              }}
              aria-label="Abrir perfil"
              aria-expanded={isProfileOpen}
              className="grid h-11 w-11 place-items-center rounded-full border border-[#B8FF2C]/18 bg-[#B8FF2C]/8 text-sm font-black text-[#B8FF2C] shadow-[0_0_28px_rgba(184,255,44,.08)] transition active:scale-95"
            >
              {profile.initial}
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-[52px] w-56 divide-y divide-[#B8FF2C]/[0.08] overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(7,19,33,0.94)] p-2 shadow-[0_24px_70px_rgba(0,0,0,.55)] backdrop-blur-xl">
                {profileItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => openMenuRoute(item.route)}
                    className="flex w-full items-center justify-between rounded-[18px] px-3 py-2.5 text-left text-sm font-semibold text-white/78 transition duration-300 hover:bg-white/[0.065] hover:text-white active:scale-[0.99]"
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-[#B8FF2C]/58">›</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <section
          className="relative mb-5 overflow-hidden rounded-[30px] border border-[#B8FF2C]/18 bg-[linear-gradient(145deg,rgba(16,43,67,.96),rgba(6,18,32,.98)_58%,rgba(184,255,44,.09))] p-5 shadow-2xl shadow-black/35"
          style={{
            animation: 'hablooFloat 7s ease-in-out infinite, hablooPulse 5s ease-in-out infinite',
          }}
        >
          <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[#B8FF2C]/18 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-8 h-44 w-44 rounded-full bg-[#44D7FF]/12 blur-3xl" />

          <div className="relative">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#B8FF2C]/70">
              <span>Progreso</span>
              <span className="group relative inline-grid h-5 w-5 cursor-help place-items-center rounded-full border border-[#B8FF2C]/35 text-[10px] tracking-normal" tabIndex={0}>
                ?
                <span className="pointer-events-none absolute left-0 top-7 z-20 hidden w-64 rounded-2xl border border-white/10 bg-[#071321] p-3 text-left text-[11px] font-semibold leading-relaxed tracking-normal text-white/78 shadow-2xl shadow-black/40 group-hover:block group-focus:block">
                  {acquiredWordsTooltip}
                </span>
              </span>
            </div>
            <p className="mb-3 inline-flex rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-[11px] font-semibold text-white/62">
              Nivel: {profile.level}
            </p>

            <div className="flex items-end gap-2">
              <p className="text-5xl font-semibold leading-none tracking-normal text-white">
                {profile.coreUnitsKnown}
              </p>
              <p className="pb-1 text-lg font-semibold text-white/35">/ {totalWords} Palabras adquiridas</p>
            </div>

            <div className="mt-6 overflow-hidden rounded-full border border-white/10 bg-[#02070D]/70 p-1 shadow-inner shadow-black/60">
              <div className="relative h-3 rounded-full bg-white/8">
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden rounded-full bg-gradient-to-r from-[#B8FF2C] via-[#44D7FF] to-[#B8FF2C] shadow-[0_0_28px_rgba(184,255,44,.45)] transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(coreProgress, 100)}%` }}
                >
                  <span
                    className="absolute inset-y-[-6px] w-16 rotate-12 bg-white/35 blur-sm"
                    style={{ animation: 'hablooShimmer 3.5s ease-in-out infinite' }}
                  />
                </div>
              </div>
            </div>

            <p className="mt-4 max-w-[290px] text-sm font-medium leading-6 text-white/64">
              Palabras únicas reconocidas temporalmente en tus prácticas.
            </p>
          </div>
        </section>

        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-white">Centro de aprendizaje</h2>
            <span className="text-xs font-semibold text-[#B8FF2C]/75">Practicar</span>
          </div>

          <div className="space-y-3">
            {learningCards.map((card, index) => (
              <button
                key={card.title}
                type="button"
                onClick={() => onNavigate?.(card.route)}
                className="group flex w-full items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.055] p-3.5 text-left shadow-lg shadow-black/18 transition duration-300 hover:-translate-y-0.5 hover:border-[#B8FF2C]/28 hover:bg-white/[0.075] hover:shadow-[#B8FF2C]/10 active:scale-[0.99]"
              >
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-gradient-to-br ${card.accent} text-xl shadow-inner shadow-white/5 transition duration-300 group-hover:scale-105`}
                >
                  {card.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-white">
                    {card.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-medium text-white/45">
                    {card.subtitle}
                  </span>
                </span>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#B8FF2C]/38 bg-[#B8FF2C]/18 text-[22px] font-black leading-none text-[#B8FF2C] shadow-[0_0_24px_rgba(184,255,44,.18)] transition duration-300 group-hover:scale-105 group-hover:border-[#B8FF2C]/70 group-hover:bg-[#B8FF2C]/92 group-hover:text-[#071321] group-hover:shadow-[0_0_34px_rgba(184,255,44,.34)]">
                  {index === 0 ? '▶' : '▶'}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-5">
          <button
            type="button"
            onClick={() => onNavigate?.('prototype-my-phrases')}
            className="group relative w-full overflow-hidden rounded-[24px] border border-[#F0B429]/22 bg-[#F0B429]/10 p-4 text-left shadow-lg shadow-[#F0B429]/8 transition duration-300 hover:-translate-y-0.5 hover:border-[#F0B429]/38 hover:bg-[#F0B429]/14 active:scale-[0.99]"
          >
            <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-[#F0B429]/14 blur-2xl" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#F0B429]/75">
                  Mis Frases
                </p>
                <p className="mt-2 text-lg font-semibold leading-tight text-white">
                  {profile.customPhrasesCount} frases personales
                </p>
                <p className="mt-1 text-xs font-medium text-white/48">
                  Estado activo · Acceso rápido
                </p>
              </div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] border border-[#F0B429]/28 bg-[#F0B429]/12 text-xl transition group-hover:scale-105">
                ⭐
              </span>
            </div>
          </button>
        </section>

        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-white">Intereses activos</h2>
            <span className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-[11px] font-semibold text-white/45">
              {profile.interests.length}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {profile.interestProgress.map((interest) => (
              <button
                key={interest.label}
                type="button"
                onClick={() => onNavigate?.(getInterestPhaseRoute(interest.label))}
                className="relative min-h-[92px] overflow-hidden rounded-[24px] border border-[#44D7FF]/18 bg-[#44D7FF]/8 p-3.5 text-left shadow-lg shadow-[#44D7FF]/5 transition duration-300 hover:-translate-y-0.5 hover:border-[#44D7FF]/34 hover:bg-[#44D7FF]/12 active:scale-[0.99]"
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#44D7FF]/10 blur-2xl" />
                <p className="relative text-[11px] font-bold uppercase tracking-[0.18em] text-[#44D7FF]/68">
                  🎯 Fase 1
                </p>
                <p className="relative mt-3 text-sm font-semibold leading-tight text-white">
                  {interest.label}
                </p>
                <p className="relative mt-2 text-xs font-medium text-white/45">
                  {interest.acquiredWords} palabras adquiridas
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="pb-2">
          <button
            type="button"
            onClick={() => onNavigate?.('prototype-learning-pool')}
            className="w-full rounded-[24px] border border-white/10 bg-white/[0.055] px-4 py-3 text-center text-sm font-semibold text-[#B8FF2C]/78 shadow-lg shadow-black/15 transition duration-300 hover:-translate-y-0.5 hover:border-[#B8FF2C]/28 hover:bg-[#B8FF2C]/10 active:scale-[0.99]"
          >
            Ver más → Habloo
          </button>
        </section>
      </main>
    </div>
  )
}
