import { getStoredOnboarding } from './Onboarding.jsx'

const categories = [
  {
    id: 'daily_life',
    name: 'Vida diaria',
    status: 'Integración pendiente',
    disabled: true,
  },
  {
    id: 'real_estate',
    name: 'Bienes raíces',
    status: 'Fase 1 disponible',
    disabled: false,
  },
  {
    id: 'gym',
    name: 'Gym / Fitness',
    status: 'Integración pendiente',
    disabled: true,
  },
]

const modules = [
  {
    id: 'phase1',
    title: 'Fase 1',
    subtitle: 'Escuchar',
    detail: 'Auto-play · 3 repeticiones',
    route: 'phase1',
    accent: 'from-blue-700 to-blue-900 border-blue-500/30 text-blue-200',
  },
  {
    id: 'phase2',
    title: 'Fase 2',
    subtitle: 'Pronunciación',
    detail: 'Repite y califica tu habla',
    route: 'phase2',
    accent: 'from-green-700 to-green-900 border-green-500/30 text-green-200',
  },
  {
    id: 'phase3',
    title: 'Fase 3',
    subtitle: 'Lectura',
    detail: 'Completa frases y reglas',
    route: 'phase3',
    accent: 'from-purple-700 to-purple-900 border-purple-500/30 text-purple-200',
  },
  {
    id: 'aichat',
    title: 'Tutor IA',
    subtitle: 'Sarah',
    detail: 'Práctica guiada con tutora',
    route: 'aichat',
    accent: 'from-amber-600 to-orange-800 border-amber-500/30 text-amber-100',
  },
  {
    id: 'drive',
    title: 'Drive Mode',
    subtitle: 'Próximamente',
    detail: 'Modo manos libres para manejar',
    disabled: true,
    accent: 'from-slate-700 to-slate-900 border-white/10 text-white/50',
  },
]

function getHomeProfile(onboarding) {
  const saved = onboarding || getStoredOnboarding()
  return {
    name: saved?.name || localStorage.getItem('habloo_name') || 'Invitado',
    tutor: saved?.tutor || 'Sarah',
    interests: saved?.interests?.length ? saved.interests : ['Bienes raíces'],
    targetLanguage: saved?.targetLanguage || 'Inglés',
    level: saved?.level || 'No estoy seguro',
  }
}

export default function HomeScreen({ onNavigate, onboarding }) {
  const profile = getHomeProfile(onboarding)

  const openCategory = (item) => {
    if (item.disabled) return
    onNavigate('phase1')
  }

  const openModule = (item) => {
    if (item.disabled) return
    onNavigate(item.route)
  }

  return (
    <div className="min-h-[100dvh] bg-[#071321] px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-6 text-white">
      <div className="mx-auto flex min-h-[calc(100dvh-48px)] w-full max-w-[430px] flex-col rounded-[30px] border border-[#B8FF2C]/10 bg-[#0B1D2F] p-5 shadow-2xl shadow-black/25">
        <header className="mb-6">
          <p className="text-sm font-medium uppercase tracking-wide text-[#B8FF2C]/65">
            Habloo
          </p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight text-white">
            Hola, {profile.name}
          </h1>
          <div className="mt-4 rounded-[24px] border border-[#44D7FF]/15 bg-[#102B43] p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#B8FF2C] text-lg font-black text-[#071321]">
                S
              </div>
              <div>
                <p className="text-sm font-semibold text-white/55">Tutor actual</p>
                <p className="text-xl font-semibold text-white">{profile.tutor}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full border border-[#44D7FF]/25 bg-[#44D7FF]/10 px-3 py-1 text-xs font-semibold text-[#9CEFFF]"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </header>

        <section className="mb-6">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onNavigate('prototype-my-phrases')}
              className="min-h-[128px] rounded-[24px] border border-[#B8FF2C]/20 bg-[#102B43] p-4 text-left shadow-xl shadow-black/10 transition active:scale-95"
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-[#B8FF2C]/70">
                Mis Frases
              </p>
              <p className="mt-3 text-2xl font-semibold leading-tight text-white">0 guardadas</p>
              <p className="mt-2 text-xs font-medium text-white/50">Tu banco personal</p>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('phase1')}
              className="min-h-[128px] rounded-[24px] border border-[#44D7FF]/20 bg-[#102B43] p-4 text-left shadow-xl shadow-black/10 transition active:scale-95"
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-[#44D7FF]/75">
                Progreso
              </p>
              <p className="mt-3 text-2xl font-semibold leading-tight text-white">Inicio</p>
              <p className="mt-2 text-xs font-medium text-white/50">{profile.level}</p>
            </button>
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-3xl font-semibold leading-tight text-white">Módulos de estudio</h2>
            <p className="mt-1 text-sm font-medium text-[#B8FF2C]/60">
              {profile.targetLanguage} con {profile.tutor}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {modules.map((item) => (
              <button
                key={item.id}
                onClick={() => openModule(item)}
                disabled={item.disabled}
                className={`min-h-[92px] rounded-[26px] border bg-gradient-to-r p-5 text-left shadow-xl shadow-black/10 transition-transform ${
                  item.accent
                } ${item.disabled ? 'cursor-not-allowed opacity-60' : 'active:scale-95'}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide opacity-75">
                      {item.title}
                    </p>
                    <p className="mt-1 text-2xl font-semibold leading-tight text-white">
                      {item.subtitle}
                    </p>
                    <p className="mt-1 text-sm font-medium opacity-85">{item.detail}</p>
                  </div>
                  <span className="text-3xl font-semibold text-white">
                    {item.disabled ? '·' : '›'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold leading-tight text-white">Mis categorías</h2>
              <p className="mt-1 text-sm font-medium text-[#B8FF2C]/60">
                Elige una biblioteca para empezar Fase 1
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[#B8FF2C] px-3 py-1 text-xs font-semibold text-[#071321]">
              3
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {categories.map((item) => (
              <button
                key={item.id}
                onClick={() => openCategory(item)}
                disabled={item.disabled}
                className={`rounded-[28px] border p-5 text-left shadow-xl shadow-black/10 transition-transform ${
                  item.disabled
                    ? 'cursor-not-allowed border-white/10 bg-[#102B43]/55 opacity-70'
                    : 'border-[#B8FF2C]/20 bg-[#102B43] active:scale-95'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-2xl font-semibold leading-tight text-white">{item.name}</p>
                    <p className="mt-2 text-sm font-medium text-[#B8FF2C]/70">
                      20 frases iniciales
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.disabled
                          ? 'bg-white/10 text-white/60'
                          : 'bg-[#B8FF2C] text-[#071321]'
                      }`}>
                        {item.status}
                      </span>
                      <span className="rounded-full border border-[#B8FF2C]/20 px-3 py-1 text-xs font-medium text-[#B8FF2C]">
                        Nivel inicial
                      </span>
                    </div>
                  </div>
                  <span className="text-3xl font-semibold text-[#B8FF2C]">
                    {item.disabled ? '·' : '›'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
