import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../utils/apiConfig.js'

const sampleInput = 'Necesito llamar al cliente mañana.'
const OWNER_MODE = true
const CUSTOM_PHRASES_KEY = 'habloo_custom_phrases'
const CUSTOM_PHRASES_CHANGED_EVENT = 'habloo_custom_phrases_changed'
const PHASE1_PHRASE_POOL_CACHE_KEY = 'habloo_phase1_phrase_pool'
let customPhrasesMemoryCache = null

function getStoredCustomPhrases() {
  if (Array.isArray(customPhrasesMemoryCache)) return customPhrasesMemoryCache

  try {
    const raw = localStorage.getItem(CUSTOM_PHRASES_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    customPhrasesMemoryCache = Array.isArray(parsed) ? parsed : []
    return customPhrasesMemoryCache
  } catch {
    return []
  }
}

function saveCustomPhrases(phrases) {
  customPhrasesMemoryCache = phrases
  localStorage.setItem(CUSTOM_PHRASES_KEY, JSON.stringify(phrases))
  localStorage.removeItem(PHASE1_PHRASE_POOL_CACHE_KEY)
  let progress = {}
  try {
    progress = JSON.parse(localStorage.getItem('habloo_progress') || '{}')
  } catch {
    progress = {}
  }
  localStorage.setItem(
    'habloo_progress',
    JSON.stringify({
      ...progress,
      custom_sentences_count: phrases.length,
    })
  )
  window.dispatchEvent(new CustomEvent(CUSTOM_PHRASES_CHANGED_EVENT, { detail: { total: phrases.length } }))
}

function normalizePhraseText(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

async function transformPhrase(spanish) {
  // TODO: Later connect to backend/Supabase custom sentences.
  // TODO: Later consume credits based on plan.
  // TODO: Later generate ipa, phonetic_es and audio with selected tutor voice.
  if (spanish.trim().toLowerCase() === sampleInput.toLowerCase()) {
    return {
      english: 'I need to call the client tomorrow.',
      pronunciation: 'ai nid tu col de cláient tumórou',
    }
  }

  return {
    english: '',
    pronunciation: '',
  }
}

async function transformPhraseWithBackend(spanish) {
  const response = await fetch(`${API_BASE_URL}/custom-phrases/transform`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      spanish,
      target_language: 'en-US',
      level: 'basic',
    }),
  })

  if (!response.ok) {
    throw new Error(`Transform failed with status ${response.status}`)
  }

  const data = await response.json()
  if (!data?.success) {
    throw new Error('Transform response was not successful')
  }

  return {
    spanish: data.spanish || spanish,
    english: data.english || '',
    pronunciation: data.pronunciation || '',
    pronunciation_simple: data.pronunciation_simple || '',
    pronunciation_slow: data.pronunciation_slow || '',
    pronunciation_focus: data.pronunciation_focus || '',
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
    source: 'openai',
  }
}

function createPendingPhrase(spanish) {
  return {
    spanish,
    english: '',
    pronunciation: '',
    pronunciation_simple: '',
    pronunciation_slow: '',
    pronunciation_focus: '',
    notes: '',
    createdAt: new Date().toISOString(),
    status: 'pending_transform',
  }
}

export default function MyPhrasesPrototype({ onBack }) {
  const [phrases, setPhrases] = useState(getStoredCustomPhrases)
  const [isCreating, setIsCreating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [draft, setDraft] = useState('')
  const [importDraft, setImportDraft] = useState('')
  const [createMessage, setCreateMessage] = useState('')

  const isEditing = editingId !== null
  const canSaveDraft = draft.trim().length > 0
  const canImportDraft = importDraft.split('\n').some((line) => line.trim())
  const customPhrasesUsed = phrases.length

  useEffect(() => {
    if (expandedId === null) return undefined

    const timeoutId = window.setTimeout(() => {
      setExpandedId(null)
    }, 5000)

    return () => window.clearTimeout(timeoutId)
  }, [expandedId])

  const openCreate = () => {
    setEditingId(null)
    setDraft('')
    setCreateMessage('')
    setIsImporting(false)
    setIsCreating(true)
  }

  const openImport = () => {
    setEditingId(null)
    setDraft('')
    setCreateMessage('')
    setImportDraft('')
    setIsCreating(false)
    setIsImporting(true)
  }

  const savePhrase = async () => {
    const spanish = draft.trim()
    if (!spanish || isCreating === 'saving') return

    setIsCreating('saving')
    setCreateMessage('Creando con Sarah...')

    let processed
    let fallbackMessage = ''

    try {
      processed = await transformPhraseWithBackend(spanish)
    } catch (error) {
      console.warn('[Mis Frases] No se pudo transformar la frase', error)
      processed = createPendingPhrase(spanish)
      fallbackMessage = 'No pude crear la versión natural todavía. La guardé como pendiente.'
    }

    if (isEditing) {
      setPhrases((current) => {
        const nextPhrases = current.map((phrase) =>
          phrase.id === editingId
            ? {
                ...phrase,
                spanish,
                original_es: spanish,
                text: spanish,
                ...processed,
              }
            : phrase
        )
        saveCustomPhrases(nextPhrases)
        return nextPhrases
      })
      setExpandedId(editingId)
    } else {
      const nextId = Date.now()
      setPhrases((current) => {
        const nextPhrases = [
          {
            id: nextId,
            spanish,
            original_es: spanish,
            text: spanish,
            ...processed,
          },
          ...current,
        ]
        saveCustomPhrases(nextPhrases)
        return nextPhrases
      })
      setExpandedId(nextId)
    }

    setIsCreating(false)
    setEditingId(null)
    setDraft('')
    setCreateMessage(fallbackMessage)
  }

  const importPhrases = () => {
    const lines = importDraft
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    if (lines.length === 0) return

    const seen = new Set(phrases.map((phrase) => normalizePhraseText(phrase.spanish)))
    const nextItems = []

    lines.forEach((spanish, index) => {
      const key = normalizePhraseText(spanish)
      if (!key || seen.has(key)) return
      seen.add(key)
      nextItems.push({
        id: Date.now() + index,
        spanish,
        original_es: spanish,
        text: spanish,
        ...createPendingPhrase(spanish),
      })
    })

    if (nextItems.length === 0) return

    setPhrases((current) => {
      const nextPhrases = [...nextItems, ...current]
      saveCustomPhrases(nextPhrases)
      setExpandedId(nextItems[0].id)
      return nextPhrases
    })

    setImportDraft('')
    setIsImporting(false)
  }

  const editPhrase = (event, phrase) => {
    event.stopPropagation()
    setDraft(phrase.spanish)
    setEditingId(phrase.id)
    setCreateMessage('')
    setIsImporting(false)
    setIsCreating(true)
  }

  const deletePhrase = (event, id) => {
    event.stopPropagation()
    setPhrases((current) => {
      const nextPhrases = current.filter((phrase) => phrase.id !== id)
      saveCustomPhrases(nextPhrases)
      return nextPhrases
    })
    if (editingId === id) {
      setIsCreating(false)
      setEditingId(null)
      setCreateMessage('')
    }
    if (expandedId === id) setExpandedId(null)
  }

  const toggleDetails = (id) => {
    setExpandedId((current) => (current === id ? null : id))
  }

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#06111F] px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-5 text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute right-[-100px] top-[-90px] h-72 w-72 rounded-full bg-[#B8FF2C]/10 blur-3xl" />
        <div className="absolute bottom-[-130px] left-[-120px] h-80 w-80 rounded-full bg-[#FF7AB6]/10 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-[calc(100dvh-40px)] w-full max-w-[440px] flex-col rounded-[30px] border border-[#B8FF2C]/15 bg-[#091A2C]/95 p-5 shadow-2xl shadow-black/35">
        <div className="mb-5 flex items-center justify-between">
          <button
            onClick={onBack}
            className="rounded-full border border-[#B8FF2C]/25 bg-[#102B43] px-4 py-2 text-sm font-semibold text-[#B8FF2C] active:scale-95"
          >
            Volver
          </button>
          <span className="rounded-full bg-[#B8FF2C] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#06111F]">
            BETA
          </span>
        </div>

        <header className="mb-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold leading-tight text-white">Mis frases</h1>
              <p className="mt-2 text-sm font-semibold text-[#B8FF2C]/75">
                {OWNER_MODE ? `${customPhrasesUsed} frases guardadas` : `${customPhrasesUsed} / 5 frases usadas`}
              </p>
            </div>
            <span className="mt-1 shrink-0 rounded-full border border-[#44D7FF]/20 bg-[#44D7FF]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#44D7FF]">
              Creador: ilimitadas
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={openCreate}
              className="rounded-2xl bg-[#B8FF2C] py-4 text-base font-semibold text-[#06111F] shadow-lg shadow-[#B8FF2C]/15 active:scale-95"
            >
              + Crear frase
            </button>
            <button
              onClick={openImport}
              className="rounded-2xl border border-[#B8FF2C]/25 bg-[#102B43] py-4 text-base font-semibold text-[#B8FF2C] active:scale-95"
            >
              Importar lista
            </button>
          </div>
        </header>

        {isCreating && (
          <section className="mb-4 rounded-[22px] border border-[#B8FF2C]/20 bg-[#102B43] p-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#B8FF2C]/70">
              Frase en español
            </label>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={isCreating === 'saving'}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-[#071827] px-4 py-4 text-base font-medium text-white outline-none placeholder:text-white/30 focus:border-[#B8FF2C]/50"
              placeholder="Escribe una frase que quieras practicar"
            />
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
              <button
                onClick={savePhrase}
                disabled={!canSaveDraft || isCreating === 'saving'}
                className="rounded-2xl bg-[#B8FF2C] py-3 text-sm font-semibold text-[#06111F] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isCreating === 'saving' ? 'Creando con Sarah...' : isEditing ? 'Guardar' : 'Crear'}
              </button>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setEditingId(null)
                  setDraft('')
                  setCreateMessage('')
                }}
                disabled={isCreating === 'saving'}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/70 active:scale-95"
              >
                Cancelar
              </button>
            </div>
            {createMessage && (
              <p className="mt-3 rounded-2xl border border-[#F0B429]/20 bg-[#F0B429]/10 px-4 py-3 text-sm font-semibold leading-snug text-[#F0B429]">
                {createMessage}
              </p>
            )}
          </section>
        )}

        {!isCreating && createMessage && (
          <p className="mb-4 rounded-2xl border border-[#F0B429]/20 bg-[#F0B429]/10 px-4 py-3 text-sm font-semibold leading-snug text-[#F0B429]">
            {createMessage}
          </p>
        )}

        {isImporting && (
          <section className="mb-4 rounded-[22px] border border-[#B8FF2C]/20 bg-[#102B43] p-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#B8FF2C]/70">
              Una frase por linea
            </label>
            <textarea
              value={importDraft}
              onChange={(event) => setImportDraft(event.target.value)}
              className="mt-3 min-h-36 w-full resize-none rounded-2xl border border-white/10 bg-[#071827] px-4 py-4 text-base font-medium text-white outline-none placeholder:text-white/30 focus:border-[#B8FF2C]/50"
              placeholder="Pega varias frases, una por linea"
            />
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
              <button
                onClick={importPhrases}
                disabled={!canImportDraft}
                className="rounded-2xl bg-[#B8FF2C] py-3 text-sm font-semibold text-[#06111F] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Importar
              </button>
              <button
                onClick={() => {
                  setIsImporting(false)
                  setImportDraft('')
                }}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/70 active:scale-95"
              >
                Cancelar
              </button>
            </div>
          </section>
        )}

        <section className="space-y-2">
          {phrases.map((phrase) => {
            const isExpanded = expandedId === phrase.id

            return (
              <article
                key={phrase.id}
                onClick={() => toggleDetails(phrase.id)}
                className={`rounded-[20px] border bg-[#071827] p-3 shadow-lg shadow-black/10 transition ${
                  isExpanded ? 'border-[#B8FF2C]/30 shadow-[#B8FF2C]/10' : 'border-white/8'
                }`}
              >
                <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-white">{phrase.spanish}</p>
                    <p className="mt-1 text-xs font-semibold text-[#B8FF2C]/75">✓ En bolsa</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={(event) => editPhrase(event, phrase)}
                      aria-label="Editar frase"
                      title="Editar"
                      className="grid h-9 w-9 place-items-center rounded-full border border-[#B8FF2C]/18 bg-[#B8FF2C]/8 text-sm font-bold text-[#B8FF2C] transition hover:border-[#B8FF2C]/35 hover:bg-[#B8FF2C]/14 active:scale-95"
                    >
                      ✎
                    </button>
                    <button
                      onClick={(event) => deletePhrase(event, phrase.id)}
                      aria-label="Borrar frase"
                      title="Borrar"
                      className="grid h-9 w-9 place-items-center rounded-full border border-[#FF7A7A]/18 bg-[#FF7A7A]/8 text-base font-bold leading-none text-[#FF9A9A] transition hover:border-[#FF7A7A]/35 hover:bg-[#FF7A7A]/14 active:scale-95"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 border-t border-white/8 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/35">
                      Espanol original
                    </p>
                    <p className="mt-1 text-sm font-medium leading-snug text-white/70">
                      {phrase.spanish || phrase.original_es || phrase.text}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/35">
                      English natural version
                    </p>
                    <p className="mt-1 text-sm font-medium leading-snug text-[#B8FF2C]">
                      {phrase.english || 'Frase pendiente de generar'}
                    </p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-white/35">
                      Pronunciación
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-snug text-white/65">
                      {phrase.english ? phrase.pronunciation_simple || phrase.pronunciation : 'Pendiente'}
                    </p>
                    {phrase.notes && (
                      <>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-white/35">
                          Nota de Sarah
                        </p>
                        <p className="mt-1 text-sm font-medium leading-snug text-white/65">
                          {phrase.notes}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </section>
      </main>
    </div>
  )
}
