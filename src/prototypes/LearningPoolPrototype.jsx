import { useEffect, useRef, useState } from 'react'
import { getStoredOnboarding } from '../components/Onboarding.jsx'

const totalWords = 3000
const OWNER_MODE = true
const TARGET_PER_INTEREST = 20
const CUSTOM_PHRASES_KEY = 'habloo_custom_phrases'
const CUSTOM_PHRASES_CHANGED_EVENT = 'habloo_custom_phrases_changed'
const MASTERED_PHRASES_KEY = 'habloo_mastered_phrase_ids'
const CORE_UNITS_KEY = 'habloo_core_units_known'
const US_FLAG = '\u{1F1FA}\u{1F1F8}'
const acquiredWordsTooltip =
  'Las palabras adquiridas incluyen verbos, sustantivos, adjetivos, preposiciones, conectores, expresiones comunes y frases nativas que ya has adquirido y puedes usar con confianza. Meta Conversacional: 3000. Meta Avanzada: 5000+.'
const interestWordsTooltip = `¿Qué son las Palabras Adquiridas?

Habloo registra las palabras, expresiones, objetos y cosas que has adquirido dentro de cada interés.

Ejemplos:

Vida diaria:
casa, cocina, comida, familia, supermercado.

Trabajo:
reunión, cliente, horario, entrevista, proyecto.

Viajes:
hotel, aeropuerto, maleta, reservación, pasaporte.

Conversación:
preguntas comunes, respuestas, saludos y expresiones cotidianas.`
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
  'tecnologÃ­a': 'technology',
  'bienes raices': 'real_estate',
  'bienes raÃ­ces': 'real_estate',
  'real estate': 'real_estate',
}

const interestColors = [
  'from-[#B8FF2C] to-[#53E8B6]',
  'from-[#44D7FF] to-[#7C5CFF]',
  'from-[#F0B429] to-[#B8FF2C]',
  'from-[#A78BFA] to-[#44D7FF]',
  'from-[#14F195] to-[#44D7FF]',
]

const profileItems = [
  { label: 'Mi Perfil', route: 'prototype-profile' },
  { label: 'Comunidad', route: 'prototype-community' },
  { label: 'Configuración', route: 'prototype-settings' },
  { label: 'Ayuda', route: 'prototype-help' },
  { label: 'Cerrar sesión', route: 'prototype-sign-out' },
]

const tutorRoster = [
  { name: 'Sarah', personality: 'Comprensiva', group: 'Tutores comprensivos', initial: 'S', face: '👩🏽‍🏫', accent: 'from-[#B8FF2C] to-[#53E8B6]' },
  { name: 'Tommy', personality: 'Comprensivo', group: 'Tutores comprensivos', initial: 'T', face: '👨🏽‍🏫', accent: 'from-[#44D7FF] to-[#7C5CFF]' },
  { name: 'Marcus', personality: 'Directo', group: 'Tutores directos', initial: 'M', face: '👨🏻‍💼', accent: 'from-[#7DD3FC] to-[#64748B]' },
  { name: 'Dolly', personality: 'Directa', group: 'Tutores directos', initial: 'D', face: '👩🏻‍💼', accent: 'from-[#F0B429] to-[#D946EF]' },
  { name: 'Emma', personality: 'Conversacional', group: 'Tutores conversacionales', initial: 'E', face: '👩🏽‍💻', accent: 'from-[#44D7FF] to-[#B8FF2C]' },
  { name: 'Ethan', personality: 'Conversacional', group: 'Tutores conversacionales', initial: 'E', face: '👨🏼‍💻', accent: 'from-[#A78BFA] to-[#44D7FF]' },
  { name: 'Alex', personality: 'Retador', group: 'Tutores retadores', initial: 'A', face: '🧑🏽‍🏫', accent: 'from-[#FF7AB6] to-[#F0B429]' },
  { name: 'Victoria', personality: 'Retadora', group: 'Tutores retadores', initial: 'V', face: '👩🏼‍🏫', accent: 'from-[#B8FF2C] to-[#A78BFA]' },
]

function buildTutors(activeNames) {
  return tutorRoster.map((tutor) => ({
    ...tutor,
    status: OWNER_MODE || activeNames.includes(tutor.name) ? 'active' : 'locked',
  }))
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

function getStoredInterests(saved) {
  try {
    const raw = localStorage.getItem('habloo_interests')
    const parsed = raw ? JSON.parse(raw) : null
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.filter(Boolean)
  } catch {
    return fallbackInterests
  }

  if (Array.isArray(saved?.interests) && saved.interests.length > 0) return saved.interests.filter(Boolean)
  return fallbackInterests
}

function formatLanguage(value) {
  const rawLanguage = String(value || 'Inglés')
  const key = rawLanguage
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (key.includes('ingl') || key === 'english') {
    return {
      flag: US_FLAG,
      name: 'Inglés',
      label: `${US_FLAG} Inglés`,
    }
  }

  return {
    flag: '',
    name: rawLanguage,
    label: rawLanguage,
  }
}

function getLearningPoolBag() {
  const saved = getStoredOnboarding()
  const interests = getStoredInterests(saved)
  const customPhrasesCount = getStoredCustomPhrasesCount()
  const masteredIds = getStoredArray(MASTERED_PHRASES_KEY)
  const coreUnitsKnown = getStoredArray(CORE_UNITS_KEY).length
  const tutorName = localStorage.getItem('habloo_tutor_name') || saved?.tutor || 'Sarah'
  const targetLanguage = saved?.targetLanguage || localStorage.getItem('habloo_target_language') || 'InglÃ©s'
  const language = formatLanguage(targetLanguage)
  const masteredForCategory = (category) =>
    masteredIds.filter((id) => String(id).startsWith(`${category}-`)).length

  const activeInterests = interests.map((interest, index) => {
    const category = interestCategoryMap[normalizeInterestKey(interest)] || slugifyInterest(interest)
    return {
      name: interest,
      current: masteredForCategory(category),
      acquiredWords: masteredForCategory(category),
      total: TARGET_PER_INTEREST,
      color: interestColors[index % interestColors.length],
      route: 'prototype-initial-phase1',
    }
  })

  return {
    name: language.name,
    flag: language.flag,
    label: language.label,
    state: 'Activo',
    coreUnits: coreUnitsKnown,
    phrases: customPhrasesCount,
    tutors: buildTutors([tutorName]),
    tutorName,
    interests: activeInterests,
    lockedInterests: [],
    customProgress: {
      name: 'Mis Frases',
      current: masteredIds.filter((id) => String(id).startsWith('custom-phrase-')).length,
      acquiredWords: masteredIds.filter((id) => String(id).startsWith('custom-phrase-')).length,
      total: customPhrasesCount,
      color: 'from-[#F0B429] to-[#D946EF]',
      route: 'prototype-my-phrases',
    },
    summary: `${interests.length} intereses · ${interests.length * TARGET_PER_INTEREST} frases + Mis Frases ${customPhrasesCount}`,
    stats: [
      { value: String(interests.length), label: 'intereses activos' },
      { value: String(coreUnitsKnown), label: 'palabras adquiridas' },
      { value: String(customPhrasesCount), label: 'Mis Frases' },
      { value: tutorName, label: 'tutor activo' },
    ],
  }
}

const languageContexts = [
  {
    id: 'english',
    name: 'Inglés',
    flag: '🇺🇸',
    state: 'Activo',
    coreUnits: 412,
    phrases: 5,
    tutors: buildTutors(['Sarah', 'Emilio']),
    interests: [
      { name: 'Vida diaria', current: 120, total: 300, color: 'from-[#B8FF2C] to-[#53E8B6]', route: 'prototype-initial-phase1' },
      { name: 'Trabajo', current: 86, total: 300, color: 'from-[#44D7FF] to-[#7C5CFF]', route: 'prototype-initial-phase1' },
      { name: 'Familia', current: 64, total: 300, color: 'from-[#F0B429] to-[#B8FF2C]', route: 'prototype-initial-phase1' },
    ],
    lockedInterests: ['Gym', 'Viajes', 'Tecnología', 'Negocios', 'Entrevistas', 'Restaurantes', 'Construcción', 'Driving'],
    stats: [
      { value: '7', label: 'días seguidos' },
      { value: '0', label: 'palabras adquiridas' },
      { value: '12', label: 'conversaciones completadas' },
      { value: '4', label: 'inmersiones completadas' },
    ],
  },
  {
    id: 'portuguese',
    name: 'Portugués',
    flag: '🇧🇷',
    state: 'Próximamente',
    coreUnits: 0,
    phrases: 0,
    tutors: buildTutors([]),
    interests: [
      { name: 'Vida diaria', current: 0, total: 300, color: 'from-[#B8FF2C] to-[#53E8B6]', route: 'prototype-initial-phase1' },
      { name: 'Trabajo', current: 0, total: 300, color: 'from-[#44D7FF] to-[#7C5CFF]', route: 'prototype-initial-phase1' },
    ],
    lockedInterests: ['Familia', 'Gym', 'Viajes', 'Tecnología', 'Negocios', 'Restaurantes'],
    stats: [
      { value: '0', label: 'días seguidos' },
      { value: '0', label: 'palabras adquiridas' },
      { value: '0', label: 'conversaciones completadas' },
      { value: '0', label: 'inmersiones completadas' },
    ],
  },
  {
    id: 'italian',
    name: 'Italiano',
    flag: '🇮🇹',
    state: 'Próximamente',
    coreUnits: 0,
    phrases: 0,
    tutors: buildTutors([]),
    interests: [
      { name: 'Vida diaria', current: 0, total: 300, color: 'from-[#B8FF2C] to-[#53E8B6]', route: 'prototype-initial-phase1' },
      { name: 'Familia', current: 0, total: 300, color: 'from-[#F0B429] to-[#B8FF2C]', route: 'prototype-initial-phase1' },
    ],
    lockedInterests: ['Trabajo', 'Gym', 'Viajes', 'Tecnología', 'Negocios', 'Restaurantes'],
    stats: [
      { value: '0', label: 'días seguidos' },
      { value: '0', label: 'palabras adquiridas' },
      { value: '0', label: 'conversaciones completadas' },
      { value: '0', label: 'inmersiones completadas' },
    ],
  },
  {
    id: 'russian',
    name: 'Ruso',
    flag: '🇷🇺',
    state: 'Próximamente',
    coreUnits: 0,
    phrases: 0,
    tutors: buildTutors([]),
    interests: [
      { name: 'Vida diaria', current: 0, total: 300, color: 'from-[#B8FF2C] to-[#53E8B6]', route: 'prototype-initial-phase1' },
    ],
    lockedInterests: ['Trabajo', 'Familia', 'Gym', 'Viajes', 'Tecnología', 'Negocios'],
    stats: [
      { value: '0', label: 'días seguidos' },
      { value: '0', label: 'palabras adquiridas' },
      { value: '0', label: 'conversaciones completadas' },
      { value: '0', label: 'inmersiones completadas' },
    ],
  },
  {
    id: 'mandarin',
    name: 'Mandarín',
    flag: '🇨🇳',
    state: 'Próximamente',
    coreUnits: 0,
    phrases: 0,
    tutors: buildTutors([]),
    interests: [
      { name: 'Vida diaria', current: 0, total: 300, color: 'from-[#B8FF2C] to-[#53E8B6]', route: 'prototype-initial-phase1' },
    ],
    lockedInterests: ['Trabajo', 'Familia', 'Gym', 'Viajes', 'Tecnología', 'Negocios'],
    stats: [
      { value: '0', label: 'días seguidos' },
      { value: '0', label: 'palabras adquiridas' },
      { value: '0', label: 'conversaciones completadas' },
      { value: '0', label: 'inmersiones completadas' },
    ],
  },
]

function getProfile() {
  const saved = getStoredOnboarding()
  const name = saved?.name || localStorage.getItem('habloo_name') || 'Andres'

  return {
    initial: name.charAt(0).toUpperCase(),
  }
}

export default function LearningPoolPrototype({ onBack, onNavigate }) {
  const profile = getProfile()
  const [selectedLanguageId, setSelectedLanguageId] = useState('english')
  const [lockedInterest, setLockedInterest] = useState(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [, setTutorRefresh] = useState(0)
  const [, setCustomPhrasesRefresh] = useState(0)
  const profileRef = useRef(null)
  const hablooBag = getLearningPoolBag()
  const selectedLanguage =
    selectedLanguageId === 'english'
      ? { ...languageContexts[0], ...hablooBag }
      : languageContexts.find((language) => language.id === selectedLanguageId) || languageContexts[0]
  const otherLanguages = languageContexts.filter((language) => language.id !== selectedLanguage.id)
  const selectedTutorName = selectedLanguage.tutorName || localStorage.getItem('habloo_tutor_name') || 'Sarah'
  const customProgress = selectedLanguage.customProgress || {
    name: 'Mis Frases',
    current: 0,
    acquiredWords: 0,
    total: 0,
    color: 'from-[#F0B429] to-[#D946EF]',
    route: 'prototype-my-phrases',
  }
  const languageSummary = selectedLanguage.summary || `${selectedLanguage.interests.length} intereses · ${selectedLanguage.interests.length * TARGET_PER_INTEREST} frases + Mis Frases ${customProgress.total}`
  const activeLanguageLabel = selectedLanguage.label || formatLanguage(selectedLanguage.name).label
  const tutorGroups = ['Tutores comprensivos', 'Tutores directos', 'Tutores conversacionales', 'Tutores retadores'].map((group) => ({
    group,
    tutors: selectedLanguage.tutors.filter((tutor) => tutor.group === group),
  }))

  const openPlans = () => {
    setLockedInterest(null)
    onNavigate?.('prototype-plans')
  }

  const openProfileRoute = (route) => {
    setIsProfileOpen(false)
    onNavigate?.(route)
  }

  const chooseTutor = (tutor) => {
    if (!OWNER_MODE && tutor.status !== 'active') return

    localStorage.setItem('habloo_tutor_name', tutor.name)
    localStorage.setItem('habloo_tutor_gender', tutor.name === 'Sarah' ? 'femenino' : 'masculino')
    localStorage.setItem('habloo_tutor_id', tutor.name.toLowerCase())

    const saved = getStoredOnboarding()
    if (saved) {
      localStorage.setItem(
        'habloo_onboarding_v1',
        JSON.stringify({
          ...saved,
          tutor: tutor.name,
          tutorId: tutor.name.toLowerCase(),
          tutorGender: tutor.name === 'Sarah' ? 'femenino' : 'masculino',
        })
      )
    }

    setTutorRefresh((value) => value + 1)
  }

  useEffect(() => {
    const refreshCustomPhraseCounts = () => setCustomPhrasesRefresh((value) => value + 1)
    window.addEventListener(CUSTOM_PHRASES_CHANGED_EVENT, refreshCustomPhraseCounts)
    window.addEventListener('storage', refreshCustomPhraseCounts)
    return () => {
      window.removeEventListener(CUSTOM_PHRASES_CHANGED_EVENT, refreshCustomPhraseCounts)
      window.removeEventListener('storage', refreshCustomPhraseCounts)
    }
  }, [])

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
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#06111F] px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-5 text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute left-[-90px] top-[-80px] h-64 w-64 rounded-full bg-[#B8FF2C]/10 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-110px] h-72 w-72 rounded-full bg-[#44D7FF]/10 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-[calc(100dvh-40px)] w-full max-w-[440px] flex-col rounded-[30px] border border-[#B8FF2C]/15 bg-[#091A2C]/95 p-5 shadow-2xl shadow-black/35">
        <div className="relative mb-3 flex h-11 items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="z-10 rounded-full border border-[#B8FF2C]/25 bg-[#102B43] px-3 py-2 text-xs font-semibold text-[#B8FF2C] active:scale-95"
          >
            Volver
          </button>

          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-2xl bg-[#B8FF2C] text-sm font-black text-[#071321] shadow-[0_0_24px_rgba(184,255,44,.35)]">
              H
            </div>
            <p className="whitespace-nowrap text-[15px] font-semibold leading-tight text-white">Habloo</p>
          </div>

          <div ref={profileRef} className="relative z-20">
            <button
              type="button"
              onClick={() => setIsProfileOpen((current) => !current)}
              aria-label="Abrir perfil"
              aria-expanded={isProfileOpen}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#B8FF2C]/18 bg-[#B8FF2C]/8 text-sm font-black text-[#B8FF2C] shadow-[0_0_28px_rgba(184,255,44,.08)] transition active:scale-95"
            >
              {profile.initial}
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-[52px] w-56 divide-y divide-[#B8FF2C]/[0.08] overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(7,19,33,0.94)] p-2 shadow-[0_24px_70px_rgba(0,0,0,.55)] backdrop-blur-xl">
                {profileItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => openProfileRoute(item.route)}
                    className="flex w-full items-center justify-between rounded-[18px] px-3 py-2.5 text-left text-sm font-semibold text-white/78 transition duration-300 hover:bg-white/[0.065] hover:text-white active:scale-[0.99]"
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-[#B8FF2C]/58">›</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <header className="mb-4 text-center">
          <h1 className="text-3xl font-semibold leading-tight text-white">Habloo</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/58">
            Tu centro de adquisición
          </p>
        </header>

        <section className="relative mb-5 overflow-visible rounded-[26px] border border-white/10 bg-[#0E263A] p-4">
          <h2 className="text-[15px] font-semibold text-white">Idiomas</h2>
          <div className="mt-3 rounded-[24px] border border-[#B8FF2C]/24 bg-[#B8FF2C]/8 p-4 shadow-lg shadow-[#B8FF2C]/5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B8FF2C]/70">
              Idioma activo
            </p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xl font-semibold leading-tight text-white">
                  {activeLanguageLabel}
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-white/70">
                  <span>{selectedLanguage.coreUnits} / {totalWords} Palabras adquiridas</span>
                  <span className="group relative inline-grid h-4 w-4 cursor-help place-items-center rounded-full border border-white/20 text-[9px] text-[#B8FF2C]" tabIndex={0}>
                    ?
                    <span className="pointer-events-none fixed left-1/2 top-24 z-50 hidden w-[min(85vw,320px)] max-w-[min(85vw,320px)] -translate-x-1/2 whitespace-normal rounded-2xl border border-white/10 bg-[#071321] p-3 text-left text-[11px] font-semibold leading-relaxed text-white/78 shadow-2xl shadow-black/40 [word-break:normal] group-hover:block group-focus:block sm:absolute sm:left-auto sm:right-0 sm:top-6 sm:translate-x-0">
                      {acquiredWordsTooltip}
                    </span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.(selectedLanguage.interests[0]?.route || 'prototype-initial-phase1')}
                className="shrink-0 rounded-full bg-[#B8FF2C] px-4 py-2 text-xs font-bold text-[#06111F] active:scale-95"
              >
                Continuar
              </button>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/42">
              Otros idiomas
            </p>
            <div className="mt-3 space-y-2">
              {otherLanguages.map((language) => (
                <button
                  key={language.id}
                  type="button"
                  onClick={() => setSelectedLanguageId(language.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/8 bg-[#071827] px-3 py-3 text-left transition active:scale-[0.99]"
                >
                  <p className="text-sm font-semibold text-white">
                    {formatLanguage(language.name).name}
                  </p>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/45">
                    {language.state}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <p className="mt-3 text-sm font-medium leading-relaxed text-white/58">
            Cada idioma tendrá progreso, tutores, intereses y frases independientes.
          </p>
        </section>

        <section className="mb-5">
          <button
            type="button"
            onClick={() => onNavigate?.('prototype-my-phrases')}
            className="w-full rounded-[24px] border border-[#F0B429]/22 bg-[#F0B429]/10 p-4 text-left shadow-lg shadow-[#F0B429]/8 transition active:scale-[0.99]"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#F0B429]/75">
                  Mis Frases
                </p>
                <p className="mt-2 text-lg font-semibold leading-tight text-white">
                  {selectedLanguage.phrases} frases activas
                </p>
                <p className="mt-1 text-xs font-medium text-white/48">
                  Tus frases personales alimentan tu práctica en {selectedLanguage.name}.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[#F0B429] px-3 py-1 text-xs font-bold text-[#06111F]">
                Administrar
              </span>
            </div>
          </button>
        </section>

        <section className="relative mb-5 overflow-visible rounded-[26px] border border-white/10 bg-[#0E263A] p-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[15px] font-semibold text-white">Intereses Activos</h2>
            <span className="group relative inline-flex cursor-help items-center gap-1 text-right text-[11px] font-bold text-[#B8FF2C]" tabIndex={0}>
              Palabras Adquiridas <span className="text-[12px]">?</span>
              <span className="pointer-events-none fixed left-1/2 top-24 z-50 hidden w-[min(85vw,320px)] max-w-[min(85vw,320px)] -translate-x-1/2 whitespace-normal rounded-2xl border border-white/10 bg-[#071321] p-3 text-left text-[11px] font-semibold leading-relaxed text-white/78 shadow-2xl shadow-black/40 [word-break:normal] group-hover:block group-focus:block sm:absolute sm:left-auto sm:right-0 sm:top-6 sm:translate-x-0">
                {interestWordsTooltip}
              </span>
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-[#B8FF2C]/70">
            {languageSummary}
          </p>
          <div className="mt-3 space-y-3">
            {selectedLanguage.interests.map((interest) => (
              <button
                key={interest.name}
                type="button"
                onClick={() => onNavigate?.(interest.route)}
                className="grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-white/8 bg-[#071827] p-3 text-left transition active:scale-[0.99]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${interest.color}`} />
                    <p className="truncate text-sm font-medium text-white">{interest.name}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-[#B8FF2C]">
                  {interest.acquiredWords}
                </p>
              </button>
            ))}
          </div>
        </section>

        {selectedLanguage.lockedInterests.length > 0 && (
        <section className="mb-5 rounded-[26px] border border-white/10 bg-[#0E263A] p-4">
          <h2 className="text-[15px] font-semibold text-white">Desbloquea más intereses</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {selectedLanguage.lockedInterests.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => setLockedInterest(interest)}
                className="rounded-2xl border border-white/8 bg-[#071827] px-3 py-3 text-left text-sm font-semibold text-white/58 transition active:scale-[0.99]"
              >
                {interest} 🔒
              </button>
            ))}
          </div>
        </section>
        )}

        <section className="mb-5 rounded-[24px] border border-[#44D7FF]/15 bg-[#44D7FF]/8 p-4">
          <h2 className="text-[15px] font-semibold text-white">Tutores</h2>
          <div className="mt-3 space-y-4">
            {tutorGroups.map(({ group, tutors }) => (
              <div key={group}>
                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white/42">
                  {group}
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {tutors.map((tutor) => {
                    const isActive = tutor.status === 'active'
                    const isSelected = selectedTutorName === tutor.name

                    return (
                      <button
                        key={tutor.name}
                        type="button"
                        onClick={() => chooseTutor(tutor)}
                        className={`relative min-h-[158px] rounded-[20px] border p-3 text-center shadow-lg shadow-black/12 ${
                          isSelected
                            ? 'border-[#B8FF2C] bg-[#B8FF2C]/10'
                            : isActive
                            ? 'border-[#B8FF2C]/26 bg-[#071827]'
                            : 'border-white/10 bg-[#071827]/76'
                        }`}
                      >
                        {!isActive && (
                          <span className="absolute right-2.5 top-2.5 rounded-full border border-white/10 bg-white/8 px-1.5 py-1 text-[10px] leading-none text-white/62">
                            🔒
                          </span>
                        )}
                        <div
                          className={`mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br ${tutor.accent} text-3xl shadow-[0_0_26px_rgba(68,215,255,.14)] ${
                            isActive ? '' : 'saturate-50'
                          }`}
                        >
                          {tutor.face}
                        </div>
                        <p className={`mt-3 text-sm font-semibold ${isActive ? 'text-white' : 'text-white/68'}`}>
                          {tutor.name}
                        </p>
                        <p className={`mt-0.5 text-xs font-medium ${isActive ? 'text-white/50' : 'text-white/38'}`}>
                          {tutor.personality}
                        </p>
                        <span
                          className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            isActive
                              ? 'bg-[#B8FF2C] text-[#06111F]'
                              : 'border border-white/10 bg-white/5 text-white/45'
                          }`}
                        >
                          {isSelected ? 'Actual' : isActive ? 'Disponible' : 'Plan superior'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm font-medium leading-relaxed text-white/58">
            Puedes cambiar de tutor sin perder tu progreso en {selectedLanguage.name}.
          </p>
        </section>

        <section className="mb-5 grid grid-cols-2 gap-2.5">
          {selectedLanguage.stats.map((item) => (
            <div
              key={item.label}
              className="rounded-[20px] border border-white/10 bg-white/[0.045] p-3 shadow-lg shadow-black/15"
            >
              <p className="text-2xl font-semibold leading-none text-[#B8FF2C]">{item.value}</p>
              <p className="mt-2 text-xs font-semibold leading-snug text-white/62">{item.label}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[28px] border border-[#B8FF2C]/24 bg-[#B8FF2C]/8 p-5 shadow-xl shadow-[#B8FF2C]/5">
          <h2 className="text-xl font-semibold leading-tight text-white">Tu próxima expansión</h2>
          <p className="mt-3 text-sm font-medium leading-relaxed text-white/64">
            Desbloquea más intereses, tutores, frases personalizadas e inmersiones avanzadas para {selectedLanguage.name}.
          </p>
          <button
            type="button"
            onClick={openPlans}
            className="mt-4 w-full rounded-2xl bg-[#B8FF2C] py-3 text-sm font-black text-[#06111F] active:scale-95"
          >
            Ver planes
          </button>
        </section>
      </main>

      {lockedInterest && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#02070D]/72 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[360px] rounded-[28px] border border-[#B8FF2C]/20 bg-[#091A2C] p-5 text-center shadow-[0_28px_90px_rgba(0,0,0,.62)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B8FF2C]/70">
              {lockedInterest}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Interés bloqueado</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-white/62">
              Desbloquea este interés para adquirir {selectedLanguage.name} con más situaciones reales.
            </p>
            <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
              <button
                type="button"
                onClick={openPlans}
                className="rounded-2xl bg-[#B8FF2C] py-3 text-sm font-black text-[#06111F] active:scale-95"
              >
                Ver planes
              </button>
              <button
                type="button"
                onClick={() => setLockedInterest(null)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/70 active:scale-95"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
