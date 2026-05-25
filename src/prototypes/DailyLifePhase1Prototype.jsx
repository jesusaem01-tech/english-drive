import { useEffect, useMemo, useState } from 'react'
import { fetchContentSentences } from '../utils/contentApi.js'

export default function DailyLifePhase1Prototype({ onBack }) {
  const [sentences, setSentences] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadSentences() {
      try {
        const items = await fetchContentSentences({
          category: 'daily_life',
          level: 1,
          limit: 20,
        })

        if (!ignore) setSentences(items)
      } catch (err) {
        if (!ignore) setError(err.message)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadSentences()

    return () => {
      ignore = true
    }
  }, [])

  const currentSentence = sentences[currentIndex]
  const progress = useMemo(() => {
    if (sentences.length === 0) return 0
    return ((currentIndex + 1) / sentences.length) * 100
  }, [currentIndex, sentences.length])

  const goPrevious = () => {
    setCurrentIndex((index) => Math.max(index - 1, 0))
  }

  const goNext = () => {
    setCurrentIndex((index) => Math.min(index + 1, sentences.length - 1))
  }

  return (
    <div className="min-h-screen bg-[#071321] px-4 py-5 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-[430px] flex-col rounded-[30px] border border-[#B8FF2C]/15 bg-[#0B1D2F] p-5 shadow-2xl shadow-black/25">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="rounded-full border border-[#B8FF2C]/25 bg-[#102B43] px-4 py-2 text-sm font-semibold text-[#B8FF2C] active:scale-95"
          >
            Volver
          </button>
          <span className="rounded-full bg-[#B8FF2C] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#071321]">
            Prototype
          </span>
        </div>

        <header className="mb-6">
          <p className="text-sm font-semibold text-[#B8FF2C]/75">Vida diaria · Fase 1</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight">Escuchar frases</h1>
        </header>

        <div className="mb-5 h-3 overflow-hidden rounded-full bg-[#16364E]">
          <div
            className="h-full rounded-full bg-[#B8FF2C] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {loading && (
          <div className="flex flex-1 items-center justify-center rounded-[26px] bg-[#102B43] p-6 text-center">
            <p className="font-semibold text-[#B8FF2C]">Cargando frases...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-1 flex-col items-center justify-center rounded-[26px] border border-red-400/30 bg-red-950/20 p-6 text-center">
            <p className="font-semibold text-red-300">No se pudo cargar el contenido.</p>
            <p className="mt-2 text-sm text-red-200/75">{error}</p>
          </div>
        )}

        {!loading && !error && !currentSentence && (
          <div className="flex flex-1 items-center justify-center rounded-[26px] bg-[#102B43] p-6 text-center">
            <p className="font-semibold text-[#B8FF2C]">No hay frases disponibles.</p>
          </div>
        )}

        {!loading && !error && currentSentence && (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="rounded-full bg-[#173952] px-4 py-2 text-xs font-semibold uppercase text-[#B8FF2C]">
                {currentSentence.scene || 'daily_life'}
              </span>
              <span className="rounded-full border border-[#B8FF2C]/25 px-4 py-2 text-xs font-semibold text-[#B8FF2C]">
                Nivel {currentSentence.level ?? 1}
              </span>
            </div>

            <div className="mb-4 rounded-[28px] bg-[#F6FFE8] p-6 text-[#071321] shadow-xl shadow-black/20">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#406014]">Frase</p>
              <p className="mt-4 text-3xl font-semibold leading-tight">
                {currentSentence.sentence_en}
              </p>
            </div>

            <div className="rounded-[24px] border border-[#B8FF2C]/15 bg-[#102B43] p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#B8FF2C]/70">
                Traducción
              </p>
              <p className="mt-3 text-xl font-semibold">
                {currentSentence.translation_es || currentSentence.sentence_es || 'Sin traducción disponible'}
              </p>
            </div>

            <div className="mt-5 rounded-[22px] border border-[#B8FF2C]/15 bg-[#0E263A] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#B8FF2C]/70">
                Repeticiones
              </p>
              <div className="mt-3 flex items-center gap-2">
                {[1, 2, 3].map((repeat) => (
                  <span
                    key={repeat}
                    className="h-2 flex-1 rounded-full bg-[#B8FF2C]/35"
                  />
                ))}
                <span className="ml-2 text-sm font-semibold text-[#B8FF2C]">0/3</span>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <p className="mb-3 text-center text-sm font-medium text-white/50">
                Frase {currentIndex + 1} de {sentences.length}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={goPrevious}
                  disabled={currentIndex === 0}
                  className="rounded-2xl border border-[#B8FF2C]/25 bg-[#102B43] py-4 font-semibold text-[#B8FF2C] disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
                >
                  Anterior
                </button>
                <button
                  onClick={goNext}
                  disabled={currentIndex === sentences.length - 1}
                  className="rounded-2xl bg-[#B8FF2C] py-4 font-semibold text-[#071321] disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
