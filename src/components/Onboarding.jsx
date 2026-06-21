import { useState } from 'react'
import { resetAllProgress } from '../utils/storage.js'

export const HABLOO_ONBOARDING_KEY = 'habloo_onboarding_v1'
export const HABLOO_NAME_KEY = 'habloo_name'
export const HABLOO_ONBOARDING_COMPLETED_KEY = 'onboardingCompleted'

const OWNER_MODE = true

const languages = ['Inglés', 'Francés', 'Italiano', 'Portugués']

const levels = [
  'No sé nada',
  'Básico',
  'Intermedio',
  'Avanzado',
  'No estoy seguro',
]

const interests = [
  'Vida diaria',
  'Viajes',
  'Trabajo',
  'Bienes raíces',
  'Conversación',
  'Familia',
  'Negocios',
  'Fitness',
]

const tutorOptions = [
  { id: 'sarah', name: 'Sarah', gender: 'femenino' },
  { id: 'tommy', name: 'Tommy', gender: 'masculino' },
]

function SarahAvatar() {
  return (
    <div
      className="relative mx-auto aspect-square"
      style={{ width: 'clamp(8rem, min(42vw, 28dvh), 12.25rem)' }}
    >
      <div className="absolute inset-x-3 bottom-0 h-24 rounded-full bg-[#44D7FF]/10 blur-3xl" />
      <div className="relative h-full w-full overflow-hidden rounded-[40px] border border-white/10 bg-[linear-gradient(180deg,rgba(68,215,255,.11),rgba(184,255,44,.04)_58%,rgba(7,19,33,.28))] shadow-[0_28px_80px_rgba(0,0,0,.28)]">
        <svg viewBox="0 0 260 280" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="sarahCardGlow" x1="60" x2="200" y1="0" y2="260">
              <stop offset="0%" stopColor="#44D7FF" stopOpacity=".28" />
              <stop offset="100%" stopColor="#B8FF2C" stopOpacity=".08" />
            </linearGradient>
            <linearGradient id="sarahSkin" x1="95" x2="165" y1="64" y2="162">
              <stop offset="0%" stopColor="#F6D2BC" />
              <stop offset="100%" stopColor="#D99B80" />
            </linearGradient>
            <linearGradient id="sarahHair" x1="86" x2="174" y1="32" y2="165">
              <stop offset="0%" stopColor="#704532" />
              <stop offset="100%" stopColor="#291A13" />
            </linearGradient>
            <linearGradient id="sarahBlazer" x1="55" x2="205" y1="172" y2="278">
              <stop offset="0%" stopColor="#123B55" />
              <stop offset="100%" stopColor="#071C31" />
            </linearGradient>
            <filter id="sarahSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="14" stdDeviation="16" floodColor="#000000" floodOpacity=".26" />
            </filter>
          </defs>
          <circle cx="130" cy="125" r="102" fill="url(#sarahCardGlow)" opacity=".5" />
          <g filter="url(#sarahSoftShadow)">
            <path d="M51 274 C58 210 84 176 130 176 C176 176 202 210 209 274 Z" fill="url(#sarahBlazer)" />
            <path d="M101 186 L130 248 L159 186 C150 180 140 177 130 177 C120 177 110 180 101 186 Z" fill="#F5EEE5" />
            <path d="M106 184 C112 203 120 224 130 247 C140 224 148 203 154 184" fill="none" stroke="#DDE7E9" strokeWidth="3" strokeLinecap="round" />
            <rect x="111" y="150" width="38" height="44" rx="18" fill="url(#sarahSkin)" />
            <path d="M82 113 C73 68 93 34 130 34 C167 34 187 68 178 113 C174 152 160 178 130 178 C100 178 86 152 82 113 Z" fill="url(#sarahHair)" />
            <path d="M91 97 C92 62 107 43 130 43 C153 43 168 62 169 97 C170 137 155 165 130 165 C105 165 90 137 91 97 Z" fill="url(#sarahSkin)" />
            <path d="M88 105 C82 103 77 108 78 117 C79 126 84 132 91 130" fill="#D99B80" />
            <path d="M172 105 C178 103 183 108 182 117 C181 126 176 132 169 130" fill="#D99B80" />
            <path d="M92 93 C98 57 113 42 130 42 C151 42 166 59 170 91 C151 84 126 73 107 54 C101 63 96 76 92 93 Z" fill="url(#sarahHair)" />
            <path d="M86 113 C82 83 90 58 108 45 C99 76 101 103 106 129 C99 128 92 122 86 113 Z" fill="#2E1C14" opacity=".82" />
            <path d="M174 113 C178 83 170 58 152 45 C161 76 159 103 154 129 C161 128 168 122 174 113 Z" fill="#2E1C14" opacity=".82" />
            <path d="M109 105 C114 100 121 100 126 105" stroke="#382217" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M134 105 C139 100 146 100 151 105" stroke="#382217" strokeWidth="4" strokeLinecap="round" fill="none" />
            <circle cx="118" cy="118" r="4.5" fill="#2A1810" />
            <circle cx="142" cy="118" r="4.5" fill="#2A1810" />
            <path d="M128 119 C125 130 124 135 131 136" stroke="#B97462" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M116 147 C125 154 136 154 145 147" stroke="#9D454D" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M97 92 C107 88 119 88 128 93" stroke="#5C3728" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".55" />
            <path d="M132 93 C141 88 153 88 163 92" stroke="#5C3728" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".55" />
          </g>
        </svg>
      </div>
    </div>
  )
}

export function getStoredOnboarding() {
  try {
    const raw = localStorage.getItem(HABLOO_ONBOARDING_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function hasCompletedOnboarding() {
  return localStorage.getItem(HABLOO_ONBOARDING_COMPLETED_KEY) === 'true'
}

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('Inglés')
  const [level, setLevel] = useState('No estoy seguro')
  const [selectedInterests, setSelectedInterests] = useState([])
  const [selectedTutorId, setSelectedTutorId] = useState('sarah')

  const trimmedName = name.trim()
  const canStartStepOne = trimmedName.length >= 2
  const canFinish = targetLanguage && level && selectedInterests.length > 0
  const selectedTutor = tutorOptions.find((tutor) => tutor.id === selectedTutorId) || tutorOptions[0]

  const toggleInterest = (interest) => {
    setSelectedInterests((current) => {
      if (current.includes(interest)) {
        return current.filter((item) => item !== interest)
      }
      if (!OWNER_MODE && current.length === 3) return current
      return [...current, interest]
    })
  }

  const resetPracticeProgress = () => {
    resetAllProgress()
    localStorage.removeItem('habloo_stats')
    localStorage.removeItem('habloo_phrase_progress')
    localStorage.removeItem('habloo_recognized_phrases')
    localStorage.removeItem('habloo_recognized_words')
    localStorage.removeItem('habloo_mastered_phrases')
    localStorage.removeItem('habloo_mastered_words')
    localStorage.removeItem('habloo_core_units')
    localStorage.removeItem('habloo_core_units_known')
    localStorage.removeItem('habloo_mastered_phrase_ids')
    localStorage.removeItem('habloo_phase1_progress')
    localStorage.removeItem('habloo_phase2_progress')
    localStorage.removeItem('habloo_phase3_progress')
    localStorage.removeItem('habloo_credits')
  }

  const finish = () => {
    if (!canFinish) return

    const onboarding = {
      name: trimmedName,
      tutor: selectedTutor.name,
      tutorId: selectedTutor.id,
      tutorGender: selectedTutor.gender,
      targetLanguage,
      level,
      interests: selectedInterests,
      completed: true,
      completedAt: new Date().toISOString(),
    }

    resetPracticeProgress()

    localStorage.setItem(HABLOO_ONBOARDING_KEY, JSON.stringify(onboarding))
    localStorage.setItem(HABLOO_NAME_KEY, trimmedName)
    localStorage.setItem('habloo_target_language', targetLanguage)
    localStorage.setItem('habloo_level', level)
    localStorage.setItem('habloo_interests', JSON.stringify(selectedInterests))
    localStorage.setItem('habloo_tutor_name', selectedTutor.name)
    localStorage.setItem('habloo_tutor_gender', selectedTutor.gender)
    localStorage.setItem('habloo_tutor_id', selectedTutor.id)
    localStorage.setItem(HABLOO_ONBOARDING_COMPLETED_KEY, 'true')
    localStorage.setItem('habloo_guest_id', `local-${Date.now()}`)
    localStorage.setItem(
      'habloo_progress',
      JSON.stringify({
        level: 1,
        categories: selectedInterests,
        tutor: selectedTutor.id,
        phrases_seen: [],
        custom_sentences_count: 0,
      })
    )

    onComplete(onboarding)
  }

  return (
    <main
      className="grid min-h-dvh place-items-center overflow-y-auto bg-[radial-gradient(circle_at_50%_-18%,rgba(68,215,255,.16),transparent_34%),linear-gradient(180deg,#071321_0%,#05101E_100%)] px-[clamp(0.75rem,3vw,1.5rem)] py-[clamp(0.75rem,3dvh,2rem)] text-white"
      style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      <div className="flex max-h-[calc(100dvh-clamp(1.5rem,6dvh,4rem))] min-h-[calc(100dvh-clamp(1.5rem,6dvh,4rem))] w-[min(100%,34rem)] flex-col overflow-y-auto rounded-[clamp(1.25rem,5vw,2rem)] border border-white/[0.08] bg-[#0B1D2F]/82 p-[clamp(1rem,4vw,2rem)] shadow-[0_32px_100px_rgba(0,0,0,.34)] backdrop-blur-xl md:min-h-0">
        <header className="mb-[clamp(0.75rem,2.5dvh,1.5rem)] flex items-center justify-between">
          <p className="text-[12px] font-medium uppercase tracking-[0.32em] text-[#B8FF2C]/75">Habloo</p>
          {step !== 1 && (
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-white/55">{step}/3</span>
          )}
        </header>

        {step === 1 && (
          <section
            className="grid flex-1 content-center"
            style={{ gap: 'clamp(1rem, 3.2dvh, 2rem)' }}
          >
            <div
              className="grid justify-items-center text-center"
              style={{ gap: 'clamp(1rem, 3dvh, 1.75rem)' }}
            >
              <SarahAvatar />
              <h1 className="max-w-[22ch] text-[clamp(1.65rem,6vw,2.45rem)] font-medium leading-[1.14] tracking-normal text-white">
                Hola. Soy Sarah. Te ayudaré a adquirir un idioma de forma natural.
              </h1>
            </div>

            <div className="w-full">
              <label htmlFor="student-name" className="mb-2 block text-sm font-medium text-[#B8FF2C]/78">Nombre</label>
              <input
                id="student-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                className="h-[clamp(3rem,7dvh,3.5rem)] w-full rounded-[18px] border border-white/[0.08] bg-[#06111F]/88 px-4 text-[clamp(0.95rem,2.5vw,1rem)] font-medium text-white outline-none transition placeholder:text-white/38 focus:border-[#B8FF2C]/55 focus:bg-[#071321]"
                placeholder="Tu nombre"
              />
              <button
                type="button"
                onClick={() => canStartStepOne && setStep(2)}
                disabled={!canStartStepOne}
                className="mt-[clamp(0.75rem,2dvh,1rem)] h-[clamp(3rem,7dvh,3.5rem)] w-full rounded-[18px] bg-[#B8FF2C] text-[clamp(0.95rem,2.5vw,1rem)] font-semibold text-[#071321] shadow-[0_16px_38px_rgba(184,255,44,.18)] transition hover:bg-[#C7FF4D] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Continuar
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="flex flex-1 flex-col">
            <div>
              <h1 className="text-3xl font-semibold leading-tight text-white">Personaliza tu práctica</h1>
              <p className="mt-2 text-sm font-medium text-white/55">Sarah ajustará el inicio a tu objetivo.</p>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <label htmlFor="target-language" className="mb-2 block text-sm font-semibold text-[#B8FF2C]/75">Idioma objetivo</label>
                <select
                  id="target-language"
                  value={targetLanguage}
                  onChange={(event) => setTargetLanguage(event.target.value)}
                  className="h-14 w-full rounded-2xl border border-white/10 bg-[#071321] px-4 text-base font-semibold text-white outline-none transition focus:border-[#B8FF2C]/60"
                >
                  {languages.map((language) => (
                    <option key={language} value={language}>{language}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-[#B8FF2C]/75">Nivel</p>
                <div className="grid grid-cols-1 gap-2">
                  {levels.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setLevel(item)}
                      className={`min-h-12 rounded-2xl border px-4 text-left text-sm font-semibold transition active:scale-[0.99] ${
                        level === item ? 'border-[#B8FF2C] bg-[#B8FF2C] text-[#071321]' : 'border-white/10 bg-[#102B43] text-white/75'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#B8FF2C]/75">Intereses</p>
                  <p className="text-xs font-semibold text-white/45">
                    {OWNER_MODE ? `${selectedInterests.length} seleccionados` : `${selectedInterests.length}/3`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => {
                    const isSelected = selectedInterests.includes(interest)
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition active:scale-95 ${
                          isSelected ? 'border-[#44D7FF] bg-[#44D7FF] text-[#071321]' : 'border-white/10 bg-[#102B43] text-white/72'
                        }`}
                      >
                        {interest}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <button
                type="button"
                onClick={() => canFinish && setStep(3)}
                disabled={!canFinish}
                className="h-14 w-full rounded-2xl bg-[#B8FF2C] text-base font-black text-[#071321] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Continuar
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="flex flex-1 flex-col">
            <div>
              <h1 className="text-3xl font-semibold leading-tight text-white">Escoge tu tutor inicial</h1>
              <p className="mt-2 text-sm font-medium text-white/55">Podrás cambiarlo dentro de Habloo.</p>
            </div>

            <div className="mt-6 grid gap-3">
              {tutorOptions.map((tutor) => {
                const isSelected = selectedTutorId === tutor.id
                return (
                  <button
                    key={tutor.id}
                    type="button"
                    onClick={() => setSelectedTutorId(tutor.id)}
                    className={`rounded-[24px] border p-4 text-left transition active:scale-[0.99] ${
                      isSelected ? 'border-[#B8FF2C] bg-[#B8FF2C] text-[#071321]' : 'border-white/10 bg-[#102B43] text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-black">{tutor.name}</p>
                        <p className={`mt-1 text-sm font-semibold ${isSelected ? 'text-[#071321]/70' : 'text-white/55'}`}>
                          {tutor.gender}
                        </p>
                      </div>
                      <span className={`grid h-10 w-10 place-items-center rounded-full text-sm font-black ${
                        isSelected ? 'bg-[#071321] text-[#B8FF2C]' : 'bg-white/8 text-[#B8FF2C]'
                      }`}>
                        {tutor.name.charAt(0)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-auto pt-6">
              <button
                type="button"
                onClick={finish}
                className="h-14 w-full rounded-2xl bg-[#B8FF2C] text-base font-black text-[#071321] transition active:scale-95"
              >
                Empezar con mi tutor
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
