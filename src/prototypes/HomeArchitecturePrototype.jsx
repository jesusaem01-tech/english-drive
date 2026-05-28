const commonWords = 412
const totalWords = 3000
const progress = (commonWords / totalWords) * 100

const activities = [
  { icon: '○', label: '18 frases hoy', glow: 'shadow-[#B8FF2C]/15' },
  { icon: '○', label: '12 palabras nuevas', glow: 'shadow-[#44D7FF]/15' },
  { icon: '○', label: '3 repasos mañana', glow: 'shadow-[#F0B429]/15' },
]

const learningCards = [
  {
    icon: '🎧',
    title: 'Fase 1 · Escuchar',
    subtitle: 'Ritmo, oído y contexto',
    accent: 'from-[#B8FF2C]/24 to-[#44D7FF]/10',
  },
  {
    icon: '🎙️',
    title: 'Fase 2 · Pronunciación',
    subtitle: 'Habla con feedback',
    accent: 'from-[#44D7FF]/22 to-[#B8FF2C]/8',
  },
  {
    icon: '👁️',
    title: 'Fase 3 · Visual',
    subtitle: 'Memoria por imagen',
    accent: 'from-[#F0B429]/20 to-[#B8FF2C]/8',
  },
  {
    icon: '🤖',
    title: 'Tutor IA',
    subtitle: 'Practica guiada',
    accent: 'from-[#A78BFA]/24 to-[#44D7FF]/8',
  },
  {
    icon: '🌎',
    title: 'Inmersion IA',
    subtitle: 'Escenas reales',
    accent: 'from-[#14F195]/18 to-[#44D7FF]/10',
  },
]

const categories = [
  { name: 'Mis frases', count: '128 palabras', badge: 'Activo', state: 'ready' },
  { name: 'Vida diaria', count: '340 palabras', badge: 'Recomendado', state: 'recommended' },
  { name: 'Bienes raíces', count: '220 palabras', state: 'ready' },
  { name: 'Gym', count: '96 palabras', state: 'ready' },
  { name: 'Trabajo', count: '310 palabras', state: 'ready' },
  { name: 'Viajes', count: '280 palabras', state: 'locked' },
  { name: 'Tecnología', count: '190 palabras', state: 'locked' },
]

const categoryStyles = {
  ready: 'border-white/10 bg-white/[0.055] text-white shadow-black/20',
  recommended:
    'border-[#B8FF2C]/30 bg-[#B8FF2C]/10 text-white shadow-[#B8FF2C]/10',
  locked: 'border-white/8 bg-white/[0.035] text-white/45 shadow-black/10',
}

export default function HomeArchitecturePrototype({ onBack }) {
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
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.055] text-white/90 shadow-lg shadow-black/20 transition duration-300 hover:border-[#B8FF2C]/35 hover:bg-[#B8FF2C]/10 active:scale-95"
          >
            <span className="flex w-4 flex-col gap-1">
              <span className="h-0.5 rounded-full bg-current" />
              <span className="h-0.5 rounded-full bg-current" />
              <span className="h-0.5 rounded-full bg-current" />
            </span>
          </button>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-2xl bg-[#B8FF2C] text-sm font-black text-[#071321] shadow-[0_0_24px_rgba(184,255,44,.35)]">
              H
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold leading-tight text-white">
                Habloo
              </p>
              <p className="truncate text-[11px] font-medium text-white/45">
                Hola, Andres
              </p>
            </div>
          </div>

          <div className="h-11 w-11 shrink-0 rounded-full border border-[#B8FF2C]/18 bg-[#B8FF2C]/8 shadow-[0_0_28px_rgba(184,255,44,.08)]" />
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
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#B8FF2C]/70">
              Palabras comunes
            </p>

            <div className="flex items-end gap-2">
              <p className="text-5xl font-semibold leading-none tracking-normal text-white">
                {commonWords}
              </p>
              <p className="pb-1 text-lg font-semibold text-white/35">/ {totalWords}</p>
            </div>

            <div className="mt-6 overflow-hidden rounded-full border border-white/10 bg-[#02070D]/70 p-1 shadow-inner shadow-black/60">
              <div className="relative h-3 rounded-full bg-white/8">
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden rounded-full bg-gradient-to-r from-[#B8FF2C] via-[#44D7FF] to-[#B8FF2C] shadow-[0_0_28px_rgba(184,255,44,.45)] transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                >
                  <span
                    className="absolute inset-y-[-6px] w-16 rotate-12 bg-white/35 blur-sm"
                    style={{ animation: 'hablooShimmer 3.5s ease-in-out infinite' }}
                  />
                </div>
              </div>
            </div>

            <p className="mt-4 max-w-[290px] text-sm font-medium leading-6 text-white/64">
              Te faltan 188 palabras para desbloquear nuevas prácticas.
            </p>
          </div>
        </section>

        <section className="mb-6">
          <div className="grid grid-cols-3 gap-2.5">
            {activities.map((activity) => (
              <div
                key={activity.label}
                className={`min-h-[76px] rounded-[22px] border border-white/10 bg-white/[0.055] p-3 shadow-lg ${activity.glow} backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-[#B8FF2C]/22 hover:bg-white/[0.075]`}
              >
                <p className="text-lg leading-none text-[#B8FF2C]">{activity.icon}</p>
                <p className="mt-2 text-[12px] font-semibold leading-snug text-white/82">
                  {activity.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-white">Continuar</h2>
            <span className="text-xs font-semibold text-[#B8FF2C]/75">Hoy</span>
          </div>

          <div className="space-y-3">
            {learningCards.map((card, index) => (
              <button
                key={card.title}
                type="button"
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
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.055] text-sm text-white/45 transition duration-300 group-hover:bg-[#B8FF2C] group-hover:text-[#071321]">
                  {index === 0 ? '▶' : '›'}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="pb-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-white">Categorías</h2>
            <span className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-[11px] font-semibold text-white/45">
              7
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {categories.map((category) => (
              <article
                key={category.name}
                className={`relative min-h-[106px] overflow-hidden rounded-[24px] border p-3.5 shadow-lg transition duration-300 hover:-translate-y-0.5 hover:border-[#B8FF2C]/26 ${categoryStyles[category.state]}`}
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/5 blur-2xl" />
                {category.badge ? (
                  <span
                    className={`mb-4 inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      category.state === 'recommended'
                        ? 'bg-[#B8FF2C] text-[#071321]'
                        : 'bg-white/10 text-white/62'
                    }`}
                  >
                    {category.badge}
                  </span>
                ) : (
                  <div className="mb-4 h-5" />
                )}

                <p className="relative text-sm font-semibold leading-tight text-white">
                  {category.name}
                </p>
                <p className="relative mt-2 text-xs font-medium text-white/45">
                  {category.state === 'locked' ? 'Bloqueado' : category.count}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
