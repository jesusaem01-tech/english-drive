import { useEffect, useState } from 'react'
import Onboarding, { getStoredOnboarding, hasCompletedOnboarding } from './components/Onboarding.jsx'
import Phase2Speak from './components/Phase2Speak.jsx'
import Phase3Grammar from './components/Phase3Grammar.jsx'
import AIChat from './components/AIChat.jsx'
import DailyLifePhase1Prototype from './prototypes/DailyLifePhase1Prototype.jsx'
import InitialPhase1ListeningPrototype from './prototypes/InitialPhase1ListeningPrototype.jsx'
import LearningPoolPrototype from './prototypes/LearningPoolPrototype.jsx'
import MyPhrasesPrototype from './prototypes/MyPhrasesPrototype.jsx'
import HomeArchitecturePrototype from './prototypes/HomeArchitecturePrototype.jsx'
import Phase2PronunciationTutorPrototype from './prototypes/Phase2PronunciationTutorPrototype.jsx'
import Phase3VisualScenariosPrototype from './prototypes/Phase3VisualScenariosPrototype.jsx'

console.time('App Boot')

function isMobileRuntime() {
  if (typeof window === 'undefined') return false

  const userAgent = window.navigator?.userAgent || ''
  return window.innerWidth <= 768 || /android|iphone|ipad|ipod|mobile/i.test(userAgent)
}

function runAfterFirstRender(callback) {
  const scheduleIdle = window.requestIdleCallback || ((handler) => window.setTimeout(handler, 0))
  window.requestAnimationFrame(() => scheduleIdle(callback))
}

function hasStoredHomeCache() {
  return (
    hasCompletedOnboarding() ||
    Boolean(localStorage.getItem('habloo_onboarding_v1')) ||
    Boolean(localStorage.getItem('habloo_name')) ||
    Boolean(localStorage.getItem('habloo_target_language')) ||
    Boolean(localStorage.getItem('habloo_interests')) ||
    Boolean(localStorage.getItem('habloo_tutor_name'))
  )
}

const PROTOTYPE_HASH_ROUTES = {
  '#/prototype-initial-phase1': 'prototype-initial-phase1',
  '#/prototype-learning-pool': 'prototype-learning-pool',
  '#/prototype-my-phrases': 'prototype-my-phrases',
  '#/prototype-home-architecture': 'prototype-home-architecture',
  '#/prototype-phase2-pronunciation': 'prototype-phase2-pronunciation',
  '#/prototype-phase3-visual': 'prototype-phase3-visual',
  '#/prototype-ai-tutor': 'prototype-ai-tutor',
  '#/prototype-ai-immersion': 'prototype-ai-immersion',
  '#/prototype-daily-life-concept': 'prototype-daily-life-concept',
  '#/prototype-category-placeholder': 'prototype-category-placeholder',
  '#/prototype-tutors': 'prototype-tutors',
  '#/prototype-languages': 'prototype-languages',
  '#/prototype-plans': 'prototype-plans',
  '#/prototype-community': 'prototype-community',
  '#/prototype-settings': 'prototype-settings',
  '#/prototype-help': 'prototype-help',
  '#/prototype-profile': 'prototype-profile',
  '#/prototype-sign-out': 'prototype-sign-out',
}

const OFFICIAL_HOME_SCREEN = 'prototype-home-architecture'

const PROTOTYPE_PLACEHOLDERS = {
  'prototype-phase3-visual': {
    icon: '👁️',
    title: 'Fase 3 · Visual',
    subtitle: 'Prácticas visuales para fijar vocabulario por imagen y contexto.',
  },
  'prototype-ai-tutor': {
    icon: '🤖',
    title: 'Tutor IA',
    subtitle: 'Una guía conversacional para practicar con feedback personalizado.',
  },
  'prototype-ai-immersion': {
    icon: '🌎',
    title: 'Inmersión IA',
    subtitle: 'Escenas reales para entrenar tu inglés en situaciones vivas.',
  },
  'prototype-daily-life-concept': {
    icon: '☕',
    title: 'Vida diaria',
    subtitle: 'Frases cotidianas organizadas para escucha, habla y memoria.',
  },
  'prototype-category-placeholder': {
    icon: '✦',
    title: 'Categoría',
    subtitle: 'Este espacio conectará nuevas prácticas por tema.',
  },
  'prototype-tutors': {
    icon: '◌',
    title: 'Tutores',
    subtitle: 'Este espacio conectará la administración de tutores.',
  },
  'prototype-languages': {
    icon: '◌',
    title: 'Idiomas',
    subtitle: 'Este espacio conectará la administración de idiomas.',
  },
  'prototype-plans': {
    icon: '◌',
    title: 'Planes',
    subtitle: 'Este espacio conectará la administración de planes.',
  },
  'prototype-community': {
    icon: '◌',
    title: 'Comunidad',
    subtitle: 'Este espacio conectará la comunidad de Habloo.',
  },
  'prototype-settings': {
    icon: '◌',
    title: 'Configuración',
    subtitle: 'Este espacio conectará la configuración de la cuenta.',
  },
  'prototype-help': {
    icon: '◌',
    title: 'Ayuda',
    subtitle: 'Este espacio conectará ayuda y soporte.',
  },
  'prototype-profile': {
    icon: '◌',
    title: 'Mi Perfil',
    subtitle: 'Este espacio conectará la información del perfil.',
  },
  'prototype-sign-out': {
    icon: '◌',
    title: 'Cerrar sesión',
    subtitle: 'Este espacio conectará el cierre de sesión.',
  },
}

function PrototypePlaceholder({ icon, title, subtitle, onBack }) {
  return (
    <div
      className="min-h-screen overflow-hidden px-4 py-4 text-white"
      style={{
        background:
          'radial-gradient(circle at 50% -12%, rgba(68, 215, 255, 0.2), transparent 34%), radial-gradient(circle at 12% 18%, rgba(10, 34, 64, 0.9), transparent 36%), linear-gradient(160deg, #04162b 0%, #071c36 48%, #0a2240 100%)',
      }}
    >
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-150px] h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-[#44D7FF]/14 blur-[90px]" />
        <div className="absolute bottom-[-180px] right-[-120px] h-[320px] w-[320px] rounded-full bg-[#B8FF2C]/8 blur-[96px]" />
      </div>

      <main className="relative mx-auto flex min-h-[calc(100vh-32px)] w-full max-w-[430px] flex-col overflow-hidden rounded-[34px] border border-white/10 bg-[#071321]/92 p-5 shadow-[0_28px_90px_rgba(0,0,0,.55)] backdrop-blur-2xl">
        <button
          type="button"
          onClick={onBack}
          className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.055] text-xl text-white/80 shadow-lg shadow-black/20 transition duration-300 hover:border-[#B8FF2C]/35 hover:bg-[#B8FF2C]/10 active:scale-95"
          aria-label="Volver"
        >
          ‹
        </button>

        <section className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-6 grid h-24 w-24 place-items-center rounded-[32px] border border-[#B8FF2C]/20 bg-[linear-gradient(145deg,rgba(184,255,44,.16),rgba(68,215,255,.1))] text-5xl shadow-[0_0_50px_rgba(68,215,255,.16)]">
            {icon}
          </div>
          <p className="mb-3 rounded-full bg-[#B8FF2C] px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#071321]">
            Próximamente
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-white">{title}</h1>
          <p className="mt-3 max-w-[280px] text-sm font-medium leading-6 text-white/58">
            {subtitle}
          </p>
        </section>
      </main>
    </div>
  )
}

function getInitialScreen() {
  const hashScreen = PROTOTYPE_HASH_ROUTES[window.location.hash]
  if (hashScreen) return hashScreen

  const params = new URLSearchParams(window.location.search)
  const queryScreen = params.get('screen')
  if (queryScreen) return normalizeScreen(queryScreen)

  if (isMobileRuntime()) return OFFICIAL_HOME_SCREEN

  return hasStoredHomeCache() ? OFFICIAL_HOME_SCREEN : 'onboarding'
}

function normalizeScreen(screen) {
  return screen === 'home' ? OFFICIAL_HOME_SCREEN : screen
}

export default function App() {
  const isMobile = isMobileRuntime()
  const [screen, setScreen] = useState(getInitialScreen)
  const [guestId, setGuestId] = useState(null)
  const [onboarding, setOnboarding] = useState(null)

  useEffect(() => {
    console.log('[Habloo performance] mobile runtime:', isMobile)
    window.requestAnimationFrame(() => console.timeEnd('App Boot'))

    runAfterFirstRender(() => {
      setGuestId(localStorage.getItem('habloo_guest_id'))
      setOnboarding(getStoredOnboarding())
    })
  }, [isMobile])

  const navigate = (to) => {
    const nextScreen = normalizeScreen(to)
    console.time('route-change')
    setScreen(nextScreen)
    window.requestAnimationFrame(() => console.timeEnd('route-change'))

    window.setTimeout(() => {
      if (
        window.speechSynthesis &&
        (window.speechSynthesis.speaking || window.speechSynthesis.pending || window.speechSynthesis.paused)
      ) {
        window.speechSynthesis.cancel()
      }
    }, 0)
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }))
  }

  const prototypeBackHome = () => navigate(OFFICIAL_HOME_SCREEN)
  const placeholder = PROTOTYPE_PLACEHOLDERS[screen]
  const completeOnboarding = (data) => {
    setOnboarding(data)
    setGuestId(localStorage.getItem('habloo_guest_id'))
    navigate(OFFICIAL_HOME_SCREEN)
  }

  return (
    <div className={`min-h-screen bg-[#0A1628] text-[#F0B429] flex flex-col ${isMobile ? 'mobile-runtime-performance' : ''}`}>
      {screen === 'onboarding' && <Onboarding onComplete={completeOnboarding} />}
      {screen === 'phase1' && (
        <InitialPhase1ListeningPrototype
          onBack={() => navigate('home')}
          onContinuePhase2={() => navigate('phase2')}
          guestId={guestId}
        />
      )}
      {screen === 'phase2' && <Phase2Speak onBack={() => navigate('home')} guestId={guestId} />}
      {screen === 'phase3' && <Phase3Grammar onBack={() => navigate('home')} guestId={guestId} />}
      {screen === 'aichat' && <AIChat onBack={() => navigate('home')} guestId={guestId} />}
      {screen === 'prototype-daily-life-phase1' && (
        <DailyLifePhase1Prototype onBack={prototypeBackHome} guestId={guestId} />
      )}
      {screen === 'prototype-initial-phase1' && (
        <InitialPhase1ListeningPrototype
          onBack={prototypeBackHome}
          onContinuePhase2={() => navigate('prototype-phase2-pronunciation')}
          guestId={guestId}
          isPrototype
        />
      )}
      {screen === 'prototype-learning-pool' && (
        <LearningPoolPrototype onBack={prototypeBackHome} onNavigate={navigate} guestId={guestId} />
      )}
      {screen === 'prototype-my-phrases' && (
        <MyPhrasesPrototype onBack={prototypeBackHome} guestId={guestId} />
      )}
      {screen === 'prototype-home-architecture' && (
        <HomeArchitecturePrototype
          onBack={prototypeBackHome}
          onNavigate={navigate}
          guestId={guestId}
          onboarding={onboarding}
        />
      )}
      {screen === 'prototype-phase2-pronunciation' && (
        <Phase2PronunciationTutorPrototype onBack={prototypeBackHome} guestId={guestId} />
      )}
      {screen === 'prototype-phase3-visual' && (
        <Phase3VisualScenariosPrototype onBack={prototypeBackHome} />
      )}
      {placeholder && screen !== 'prototype-phase3-visual' && (
        <PrototypePlaceholder
          icon={placeholder.icon}
          title={placeholder.title}
          subtitle={placeholder.subtitle}
          onBack={prototypeBackHome}
        />
      )}
    </div>
  )
}
