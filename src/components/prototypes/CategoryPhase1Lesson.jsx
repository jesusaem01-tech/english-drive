import { useEffect, useMemo, useState } from 'react'
import { sentences as realEstateSentences } from '../../data/sentences.js'
import { fetchContentSentences } from '../../utils/contentApi.js'

const CATEGORY_LABELS = {
  daily_life: 'Vida diaria',
  real_estate: 'Bienes raíces',
  gym: 'Gym / Fitness',
}

function normalizeBackendSentence(sentence) {
  return {
    id: sentence.id,
    sentence_en: sentence.sentence_en,
    sentence_es: sentence.translation_es || sentence.sentence_es,
    scene: sentence.scene,
    level: sentence.level,
  }
}

function getRealEstateFallback() {
  return realEstateSentences.slice(0, 20).map((sentence) => ({
    id: sentence.id,
    sentence_en: sentence.english,
    sentence_es: sentence.spanish,
    scene: sentence.groupName,
    level: 'inicial',
  }))
}

export default function CategoryPhase1Lesson({ category = 'daily_life', onBack }) {
  const [sentences, setSentences] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const categoryName = CATEGORY_LABELS[category] || 'Categoría'

  useEffect(() => {
    let ignore = false

    async function loadSentences() {
      setLoading(true)
      setError('')
      setCurrentIndex(0)

      try {
        const items = await fetchContentSentences({
          category,
          level: 1,
          limit: 20,
        })
        const normalizedItems = items.map(normalizeBackendSentence).filter((item) => item.sentence_en)

        if (!ignore) {
          if (normalizedItems.length > 0) {
            setSentences(normalizedItems)
          } else if (category === 'real_estate') {
            setSentences(getRealEstateFallback())
          } else {
            setSentences([])
          }
        }
      } catch (err) {
        if (!ignore) {
          if (category === 'real_estate') {
            setSentences(getRealEstateFallback())
          } else {
            setSentences([])
            setError(err.message)
          }
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadSentences()

    return () => {
      ignore = true
    }
  }, [category])

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

  const showComingSoon = !loading && !currentSentence && category === 'gym'
  const showEmpty = !loading && !currentSentence && category !== 'gym'

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
          <div className="rounded-full bg-[#B8FF2C] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#071321]">
            {categoryName}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm font-semibold text-[#B8FF2C]/75">Fase 1 · Nivel inicial</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-white">
            Escuchar frases
          </h1>
        </div>

        <div className="mb-5 h-3 overflow-hidden rounded-full bg-[#16364E]">
          <div
            className="h-full rounded-full bg-[#B8FF2C] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {loading && (
          <div className="flex flex-1 items-center justify-center rounded-[26px] border border-[#B8FF2C]/10 bg-[#102B43] p-6 text-center">
            <p className="text-lg font-semibold text-[#B8FF2C]">Cargando frases...</p>
          </div>
        )}

        {showComingSoon && (
          <div className="flex flex-1 flex-col items-center justify-center rounded-[26px] border border-[#B8FF2C]/10 bg-[#102B43] p-6 text-center">
            <p className="text-2xl font-semibold text-white">Próximamente</p>
            <p className="mt-3 text-sm font-medium text-[#B8FF2C]/70">
              Esta categoría ya está seleccionada para el demo. Las frases aparecerán cuando el contenido esté listo.
            </p>
          </div>
        )}

        {showEmpty && (
          <div className="flex flex-1 flex-col items-center justify-center rounded-[26px] border border-[#B8FF2C]/10 bg-[#102B43] p-6 text-center">
            <p className="text-lg font-semibold text-[#B8FF2C]">No hay frases disponibles.</p>
            {error && <p className="mt-2 text-sm text-white/50">{error}</p>}
          </div>
        )}

        {!loading && currentSentence && (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="rounded-full bg-[#173952] px-4 py-2 text-xs font-semibold uppercase text-[#B8FF2C]">
                {currentSentence.scene || 'Fase 1'}
              </span>
              <span className="rounded-full border border-[#B8FF2C]/25 px-4 py-2 text-xs font-semibold text-[#B8FF2C]">
                Nivel inicial
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
              <p className="mt-3 text-xl font-semibold text-white">
                {currentSentence.sentence_es || 'Sin traducción disponible'}
              </p>
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
