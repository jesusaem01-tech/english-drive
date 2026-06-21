import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { sentences as realEstateLocalSentences } from '../data/sentences.js'
import { fetchContentSentences } from '../utils/contentApi.js'

const TARGET_PER_CATEGORY = 20
const OWNER_MODE = true
const DEFAULT_REPEAT_TARGET = 3
const MIN_REPEAT_TARGET = 1
const MAX_REPEAT_TARGET = 10
const DEFAULT_SPEECH_SPEED = 'normal'
const SPEED_OPTIONS = [
  { id: 'superSlow', label: '0.5x', rate: 0.5, status: 'Súper lento' },
  { id: 'slow', label: '0.75x', rate: 0.75, status: 'Lento' },
  { id: 'normal', label: '1.0x', rate: 1.0, status: 'Normal' },
  { id: 'fast', label: '1.25x', rate: 1.25, status: 'Rápido' },
]
const DEFAULT_SPEECH_RATE = SPEED_OPTIONS.find((option) => option.id === DEFAULT_SPEECH_SPEED).rate
const CATEGORY_LABELS = {
  daily_life: 'Vida diaria',
  real_estate: 'Bienes raíces',
  gym: 'Gym / Fitness',
  work: 'Trabajo',
  travel: 'Viajes',
  family: 'Familia',
  restaurant: 'Restaurante',
  relationship: 'Pareja',
  technology: 'Tecnología',
  fitness: 'Fitness',
}
// TODO: Later these stats should come from Supabase/backend:
// categories selected, base phrases count, custom phrases count,
// unique common words count, and mastered words count.
const fallbackInterestLabels = ['Vida diaria', 'Trabajo', 'Viajes']
const CUSTOM_PHRASES_KEY = 'habloo_custom_phrases'
const CUSTOM_PHRASES_CHANGED_EVENT = 'habloo_custom_phrases_changed'
const MASTERED_PHRASES_KEY = 'habloo_mastered_phrase_ids'
const CORE_UNITS_KEY = 'habloo_core_units_known'

function getStoredLevel() {
  return localStorage.getItem('habloo_level') || 'No estoy seguro'
}

function getStoredTutorName() {
  return localStorage.getItem('habloo_tutor_name') || 'Sarah'
}

function getStoredTutorProfile() {
  const id = (localStorage.getItem('habloo_tutor_id') || '').trim().toLowerCase()
  const name = (localStorage.getItem('habloo_tutor_name') || '').trim()
  const storedGender = (localStorage.getItem('habloo_tutor_gender') || '').trim().toLowerCase()
  const normalizedName = name.toLowerCase()

  let gender = storedGender
  if (!gender) {
    if (id === 'sarah' || normalizedName === 'sarah') gender = 'femenino'
    if (id === 'tommy' || normalizedName === 'tommy') gender = 'masculino'
  }

  return {
    id,
    name: name || 'Sarah',
    gender,
  }
}

function getContentLevel() {
  const level = getStoredLevel()
  if (level === 'Intermedio') return 2
  if (level === 'Avanzado') return 3

  // TODO: Expand backend/content level mapping when the content model has explicit
  // tracks for "No sé nada", "Básico" and "No estoy seguro".
  return 1
}

const INTEREST_CATEGORY_CONFIG = {
  'vida diaria': { category: 'daily_life', label: 'Vida diaria' },
  trabajo: { category: 'work', label: 'Trabajo' },
  viajes: { category: 'travel', label: 'Viajes' },
  familia: { category: 'family', label: 'Familia' },
  fitness: { category: 'fitness', label: 'Fitness', fallbackCategory: 'gym' },
  gym: { category: 'fitness', label: 'Fitness', fallbackCategory: 'gym' },
  restaurante: { category: 'restaurant', label: 'Restaurante' },
  pareja: { category: 'relationship', label: 'Pareja' },
  tecnologia: { category: 'technology', label: 'Tecnología' },
  tecnología: { category: 'technology', label: 'Tecnología' },
  'bienes raices': { category: 'real_estate', label: 'Bienes raíces', fallbackCategory: 'real_estate' },
  'bienes raíces': { category: 'real_estate', label: 'Bienes raíces', fallbackCategory: 'real_estate' },
  'real estate': { category: 'real_estate', label: 'Real Estate', fallbackCategory: 'real_estate' },
}

const gymFallbackSentences = [
  ["I'm going to the gym today.", 'Voy al gimnasio hoy.', 'aim góuin tu de yim tudéi'],
  ['I need to warm up first.', 'Necesito calentar primero.', 'ai nid tu uórm op ferst'],
  ['Can you spot me?', '¿Puedes ayudarme con este ejercicio?', 'kan iu spat mi'],
  ["I'm working on my legs today.", 'Hoy estoy entrenando piernas.', 'aim uérkin on mai legs tudéi'],
  ['This machine is available.', 'Esta máquina está disponible.', 'dis mashín is avéilabol'],
  ['How many sets do you have left?', '¿Cuántas series te faltan?', 'jau méni sets du iu jav left'],
  ['I drink water between sets.', 'Tomo agua entre series.', 'ai drink uóder bituín sets'],
  ['My trainer made a new routine.', 'Mi entrenador hizo una rutina nueva.', 'mai tréiner meid a niu rutín'],
  ['I want to improve my strength.', 'Quiero mejorar mi fuerza.', 'ai want tu imprúv mai strenkz'],
  ['This workout is difficult.', 'Este entrenamiento es difícil.', 'dis uérkaut is dífikolt'],
  ["I'm stretching after training.", 'Estoy estirando después de entrenar.', 'aim stréchin áfter tréinin'],
  ['The treadmill is too fast.', 'La caminadora está demasiado rápida.', 'de trédmel is tu fast'],
  ['I forgot my towel.', 'Olvidé mi toalla.', 'ai forgát mai táuel'],
  ['I need a lighter weight.', 'Necesito un peso más ligero.', 'ai nid a láider weit'],
  ['My muscles are sore today.', 'Hoy me duelen los músculos.', 'mai músels ar sor tudéi'],
  ['The class starts in ten minutes.', 'La clase empieza en diez minutos.', 'de klas starts in ten mínets'],
  ["I'm practicing good form.", 'Estoy practicando buena técnica.', 'aim práktisin gud form'],
  ['This exercise works the shoulders.', 'Este ejercicio trabaja los hombros.', 'dis éksersais uerks de shóulders'],
  ['I finished my workout.', 'Terminé mi entrenamiento.', 'ai fínisht mai uérkaut'],
  ['See you at the gym tomorrow.', 'Nos vemos en el gimnasio mañana.', 'si iu at de yim tumórou'],
]

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

function getStoredInterestLabels() {
  try {
    const rawInterests = localStorage.getItem('habloo_interests')
    const interests = rawInterests ? JSON.parse(rawInterests) : null
    if (Array.isArray(interests) && interests.length > 0) return interests.filter(Boolean)
  } catch {
    return []
  }

  return []
}

function getInterestCategoryConfig(label) {
  const key = normalizeInterestKey(label)
  const config = INTEREST_CATEGORY_CONFIG[key]
  if (config) return config

  return {
    category: slugifyInterest(label),
    label,
  }
}

function createInterestFallback(label, category) {
  const cleanLabel = label || 'tu interés'
  const templates = [
    ['I want to practice English.', 'Quiero practicar inglés.', 'ai want tu práktis ínglish'],
    [`This topic is important to me.`, 'Este tema es importante para mí.', 'dis tópik is impórtant tu mi'],
    ['I can learn useful words.', 'Puedo aprender palabras útiles.', 'ai kan lern iúsful uerds'],
    [`I want to speak with confidence.`, 'Quiero hablar con confianza.', 'ai want tu spik wid kánfidens'],
    [`Let's practice one sentence at a time.`, 'Practiquemos una frase a la vez.', 'lets práktis uan séntens at a taim'],
  ]

  templates.splice(
    0,
    5,
    [`I want to practice English for ${cleanLabel}.`, `Quiero practicar ingles para ${cleanLabel}.`, `ai want tu praktis inglish for ${cleanLabel}`],
    [`This ${cleanLabel} topic is important to me.`, `Este tema de ${cleanLabel} es importante para mi.`, `dis ${cleanLabel} topik is important tu mi`],
    [`I can learn useful ${cleanLabel} words.`, `Puedo aprender palabras utiles de ${cleanLabel}.`, `ai kan lern iusful ${cleanLabel} uerds`],
    [`I want to speak about ${cleanLabel} with confidence.`, `Quiero hablar sobre ${cleanLabel} con confianza.`, `ai want tu spik abaut ${cleanLabel} wid kanfidens`],
    [`Let's practice one ${cleanLabel} sentence at a time.`, `Practiquemos una frase de ${cleanLabel} a la vez.`, `lets praktis uan ${cleanLabel} sentens at a taim`],
  )

  while (templates.length < TARGET_PER_CATEGORY) {
    const nextNumber = templates.length + 1
    templates.push([
      `I can practice ${cleanLabel} phrase ${nextNumber}.`,
      `Puedo practicar la frase ${nextNumber} de ${cleanLabel}.`,
      `ai kan praktis ${cleanLabel} freiz ${nextNumber}`,
    ])
  }

  return templates.map(([english, spanish, phonetic], index) => ({
    id: `${category}-fallback-${index + 1}`,
    category,
    category_label: cleanLabel,
    sentence_en: english,
    translation_es: spanish,
    phonetic_es: phonetic,
    pronunciation: '',
    ipa: '',
    scene: cleanLabel,
  }))
}

function normalizeWords(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'\s]/gu, ' ')
    .split(/\s+/)
    .map((word) => word.trim().replace(/^'+|'+$/g, ''))
    .filter(Boolean)
}

function normalizeSentenceKey(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}'\s]/gu, ' ')
    .replace(/\s+/g, ' ')
}

function dedupeSentences(items) {
  const seen = new Set()
  return items.filter((item) => {
    const key = normalizeSentenceKey(item?.sentence_en)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
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

function getCustomPhraseSet() {
  return getStoredArray(CUSTOM_PHRASES_KEY)
    .filter((phrase) => phrase?.english)
    .map((phrase, index) => ({
      id: `custom-phrase-${phrase.id || index + 1}`,
      category: 'custom_phrases',
      category_label: 'Mis Frases',
      sentence_en: phrase.english,
      translation_es: phrase.spanish || '',
      phonetic_es: phrase.pronunciation || '',
      pronunciation: '',
      ipa: '',
      scene: 'Mis Frases',
    }))
}

function calculateKnownCoreUnits(availableSentences = []) {
  const masteredIds = new Set(getStoredArray(MASTERED_PHRASES_KEY))

  if (masteredIds.size === 0) {
    localStorage.setItem(CORE_UNITS_KEY, JSON.stringify([]))
    return 0
  }

  const availableById = new Map()
  availableSentences.forEach((sentence) => {
    if (sentence?.id) availableById.set(sentence.id, sentence)
  })
  getCustomPhraseSet().forEach((sentence) => {
    if (sentence?.id && !availableById.has(sentence.id)) availableById.set(sentence.id, sentence)
  })

  const knownWords = new Set()
  masteredIds.forEach((phraseId) => {
    const sentence = availableById.get(phraseId)
    if (!sentence) return
    normalizeWords(sentence.sentence_en).forEach((word) => knownWords.add(word))
  })

  const uniqueWords = [...knownWords]
  localStorage.setItem(CORE_UNITS_KEY, JSON.stringify(uniqueWords))
  return uniqueWords.length
}

function updateLearningProgress(sentence, availableSentences = []) {
  if (!sentence?.id) return calculateKnownCoreUnits(availableSentences)

  const masteredIds = new Set(getStoredArray(MASTERED_PHRASES_KEY))
  masteredIds.add(sentence.id)
  localStorage.setItem(MASTERED_PHRASES_KEY, JSON.stringify([...masteredIds]))

  return calculateKnownCoreUnits(availableSentences)
}

const PROTOTYPE_FALLBACK_CONTRACTIONS = [
  { formalParts: ['I', 'am'], spoken: "I'm", formalPronunciation: 'ai am', spokenPronunciation: 'aim' },
  { formalParts: ['You', 'are'], spoken: "you're", formalPronunciation: 'iu ar', spokenPronunciation: 'iur' },
  { formalParts: ['We', 'are'], spoken: "we're", formalPronunciation: 'ui ar', spokenPronunciation: 'uir' },
  { formalParts: ['They', 'are'], spoken: "they're", formalPronunciation: 'dei ar', spokenPronunciation: 'deir' },
  { formalParts: ['It', 'is'], spoken: "it's", formalPronunciation: 'it is', spokenPronunciation: 'its' },
  { formalParts: ['Do', 'not'], spoken: "don't", formalPronunciation: 'du not', spokenPronunciation: 'dount' },
  { formalParts: ['Can', 'not'], formalJoiner: '', spoken: "can't", formalPronunciation: 'kanot', spokenPronunciation: 'kant' },
  { formalParts: ['I', 'will'], spoken: "I'll", formalPronunciation: 'ai uil', spokenPronunciation: 'ail' },
]

function applyPrototypeFallbackContractions(sentence) {
  return PROTOTYPE_FALLBACK_CONTRACTIONS.reduce(
    (result, contraction) => ({
      english: result.english.replaceAll(
        contraction.formalParts.join(contraction.formalJoiner ?? ' '),
        contraction.spoken
      ),
      phonetic: result.phonetic.replaceAll(contraction.formalPronunciation, contraction.spokenPronunciation),
    }),
    {
      english: sentence.english,
      phonetic: sentence.phonetic,
    }
  )
}

function normalizeBackendSentence(sentence, category, label = CATEGORY_LABELS[category]) {
  return {
    id: `${category}-${sentence.id || sentence.sentence_en}`,
    category,
    category_label: label || CATEGORY_LABELS[category] || category,
    sentence_en: sentence.sentence_en,
    translation_es: sentence.translation_es || sentence.sentence_es || '',
    phonetic_es: sentence.phonetic_es || '',
    pronunciation: sentence.pronunciation || '',
    ipa: sentence.ipa || '',
    scene: sentence.scene || sentence.phase || category,
  }
}

function normalizeRealEstateFallback() {
  return realEstateLocalSentences.slice(0, TARGET_PER_CATEGORY).map((sentence) => {
    const spokenFallback = applyPrototypeFallbackContractions(sentence)

    return {
      id: `real-estate-local-${sentence.id}`,
      category: 'real_estate',
      category_label: CATEGORY_LABELS.real_estate,
      sentence_en: spokenFallback.english,
      translation_es: sentence.spanish,
      phonetic_es: spokenFallback.phonetic,
      pronunciation: '',
      ipa: '',
      scene: sentence.groupName,
    }
  })
}

function normalizeGymFallback(category = 'fitness', label = 'Fitness') {
  return gymFallbackSentences.map(([english, spanish, phonetic], index) => ({
    id: `${category}-demo-${index + 1}`,
    category,
    category_label: label,
    sentence_en: english,
    translation_es: spanish,
    phonetic_es: phonetic,
    pronunciation: '',
    ipa: '',
    scene: label,
  }))
}

async function loadCategorySet(category, fallbackItems = [], label = CATEGORY_LABELS[category]) {
  try {
    const items = await fetchContentSentences({
      category,
      level: getContentLevel(),
      limit: TARGET_PER_CATEGORY,
    })
    const normalized = items
      .map((sentence) => normalizeBackendSentence(sentence, category, label))
      .filter((sentence) => sentence.sentence_en)

    return ensureTargetSentenceCount(
      normalized.length > 0 ? normalized : fallbackItems,
      category,
      label
    )
  } catch {
    return ensureTargetSentenceCount(fallbackItems, category, label)
  }
}

function ensureTargetSentenceCount(items, category, label) {
  const cleanItems = dedupeSentences(items.filter((item) => item?.sentence_en))
  if (!OWNER_MODE) return cleanItems.slice(0, TARGET_PER_CATEGORY)
  const fallbackItems = createInterestFallback(label, category)
  const sourceItems = dedupeSentences([...cleanItems, ...fallbackItems])

  const result = []
  for (let index = 0; index < TARGET_PER_CATEGORY; index += 1) {
    const source = sourceItems[index] || fallbackItems[index % fallbackItems.length]
    result.push({
      ...source,
      id: `${source.id || category}-${index + 1}`,
      category,
      category_label: label || source.category_label || CATEGORY_LABELS[category] || category,
    })
  }

  return result
}

function interleaveSets(sets) {
  const result = []

  for (let index = 0; index < TARGET_PER_CATEGORY; index += 1) {
    sets.forEach((set) => {
      if (set[index]) result.push(set[index])
    })
  }

  return result
}

function splitWords(sentence) {
  return sentence.trim().split(/\s+/).filter(Boolean)
}

function getPronunciationDisplay(sentence) {
  if (!sentence) return ''

  return [sentence.phonetic_es, sentence.pronunciation, sentence.ipa]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .find(Boolean) || ''
}

function warnMissingPrototypePronunciations(sentences) {
  if (!import.meta.env.DEV) return

  sentences.forEach((sentence) => {
    if (!getPronunciationDisplay(sentence)) {
      console.warn('[InitialPhase1ListeningPrototype] Missing pronunciation:', sentence.sentence_en)
    }
  })
}

function getBoundaryWordIndex(words, charIndex) {
  let cursor = 0

  for (let index = 0; index < words.length; index += 1) {
    const start = cursor
    const end = start + words[index].length
    if (charIndex >= start && charIndex <= end) return index
    cursor = end + 1
  }

  return words.length - 1
}

function getSentenceFontSize(sentence) {
  const length = sentence.length
  if (length > 95) return 'text-[clamp(1.15rem,5.2vw,1.55rem)] leading-[1.32]'
  if (length > 58) return 'text-[clamp(1.3rem,6vw,1.75rem)] leading-[1.28]'
  return 'text-[clamp(1.55rem,7vw,2.1rem)] leading-[1.22]'
}

function createNormalOrder(length) {
  return Array.from({ length }, (_, index) => index)
}

function getNextUnplayedIndex({ length, currentIndex, playedIndices, isShuffleOn }) {
  const playedSet = new Set(playedIndices)
  playedSet.add(currentIndex)
  const unplayed = createNormalOrder(length).filter((index) => !playedSet.has(index))

  if (unplayed.length === 0) return null

  if (isShuffleOn) {
    return unplayed[Math.floor(Math.random() * unplayed.length)]
  }

  return unplayed.find((index) => index > currentIndex) ?? unplayed[0]
}

function selectTutorVoice(voices, tutorProfile) {
  const englishVoices = voices.filter((voice) => voice.lang?.toLowerCase().startsWith('en'))
  const candidates = englishVoices.length > 0 ? englishVoices : voices
  const tutorName = `${tutorProfile.name} ${tutorProfile.id}`.toLowerCase()
  const gender = tutorName.includes('sarah')
    ? 'femenino'
    : tutorName.includes('tommy')
      ? 'masculino'
      : tutorProfile.gender
  const femaleHints = ['female', 'woman', 'samantha', 'susan', 'karen', 'zira', 'jenny', 'aria', 'sara', 'sarah', 'victoria', 'allison', 'ava', 'emma']
  const maleHints = ['male', 'man', 'tom', 'tommy', 'david', 'mark', 'alex', 'daniel', 'fred', 'george', 'guy', 'ryan']
  const hints = gender?.startsWith('f') ? femaleHints : gender?.startsWith('m') ? maleHints : []

  return candidates.find((voice) => {
    const haystack = `${voice.name} ${voice.voiceURI}`.toLowerCase()
    return hints.some((hint) => haystack.includes(hint))
  }) || englishVoices[0] || voices[0] || null
}

// Prototype note: Phase 2 should reuse this same combined 60-sentence learning set
// for pronunciation practice after the Phase 1 listening flow is approved.
export default function InitialPhase1ListeningPrototype({ onBack, isPrototype = false }) {
  const [sentences, setSentences] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [repeat, setRepeat] = useState(1)
  // TODO: Later this should come from user profile/settings.
  const [repeatTarget, setRepeatTarget] = useState(DEFAULT_REPEAT_TARGET)
  const [speechSpeed, setSpeechSpeed] = useState(DEFAULT_SPEECH_SPEED)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isAutoPlayOn, setIsAutoPlayOn] = useState(false)
  const [isShuffleOn, setIsShuffleOn] = useState(false)
  const [playedIndices, setPlayedIndices] = useState([])
  const [navigationHistory, setNavigationHistory] = useState([])
  const [isBagCompleted, setIsBagCompleted] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const [activeWordIndex, setActiveWordIndex] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sourceNotes, setSourceNotes] = useState([])
  const [customPhraseTotal, setCustomPhraseTotal] = useState(0)
  const [selectedInterestTotal, setSelectedInterestTotal] = useState(0)
  const [coreUnitsKnown, setCoreUnitsKnown] = useState(() => getStoredArray(CORE_UNITS_KEY).length)
  const [tutorName] = useState(getStoredTutorName)

  const isPlayingRef = useRef(false)
  const currentIndexRef = useRef(0)
  const isShuffleOnRef = useRef(false)
  const playedIndicesRef = useRef([])
  const navigationHistoryRef = useRef([])
  const repeatRef = useRef(1)
  const repeatTargetRef = useRef(DEFAULT_REPEAT_TARGET)
  const speechRateRef = useRef(DEFAULT_SPEECH_RATE)
  const utteranceRef = useRef(null)
  const timeoutRef = useRef(null)
  const translationTimeoutRef = useRef(null)
  const wordTimerRef = useRef(null)

  const loadInitialSet = useCallback(async ({ resetSession = false } = {}) => {
      const interestLabels = getStoredInterestLabels()
      const categoryConfigs = interestLabels.map(getInterestCategoryConfig)
      const categorySets = await Promise.all(
        categoryConfigs.map((config) => {
          let fallback = createInterestFallback(config.label, config.category)

          if (config.fallbackCategory === 'real_estate') {
            fallback = normalizeRealEstateFallback()
          }

          if (config.fallbackCategory === 'gym') {
            fallback = normalizeGymFallback(config.category, config.label)
          }

          return loadCategorySet(config.category, fallback, config.label)
        })
      )

      const initialSentences = interleaveSets(categorySets)
      const customPhraseSet = getCustomPhraseSet()
      const learningSet = dedupeSentences([...initialSentences, ...customPhraseSet])
      warnMissingPrototypePronunciations(learningSet)
      setSentences(learningSet)
      setCustomPhraseTotal(customPhraseSet.length)
      setSelectedInterestTotal(categoryConfigs.length)
      setCoreUnitsKnown(calculateKnownCoreUnits(learningSet))
      if (resetSession) {
        currentIndexRef.current = 0
        repeatRef.current = 1
        setCurrentIndex(0)
        setRepeat(1)
        setPlayedIndices([])
        playedIndicesRef.current = []
        setNavigationHistory([])
        navigationHistoryRef.current = []
        setIsBagCompleted(false)
      } else if (currentIndexRef.current >= learningSet.length) {
        currentIndexRef.current = Math.max(0, learningSet.length - 1)
        setCurrentIndex(currentIndexRef.current)
      }
      setSourceNotes(
        [
          ...categoryConfigs.map((config, index) => `${config.label}: ${categorySets[index]?.length || 0} frases`),
          ...(customPhraseSet.length > 0 ? [`Mis Frases: ${customPhraseSet.length} frases`] : []),
        ]
      )
      setLoading(false)
  }, [])

  useEffect(() => {
    let ignore = false

    async function loadAndApply() {
      if (ignore) return
      await loadInitialSet({ resetSession: true })
    }

    loadAndApply()

    const reloadCustomPhrases = () => {
      loadInitialSet()
    }

    window.addEventListener(CUSTOM_PHRASES_CHANGED_EVENT, reloadCustomPhrases)
    window.addEventListener('storage', reloadCustomPhrases)

    return () => {
      ignore = true
      window.removeEventListener(CUSTOM_PHRASES_CHANGED_EVENT, reloadCustomPhrases)
      window.removeEventListener('storage', reloadCustomPhrases)
    }
  }, [loadInitialSet])

  const currentSentence = sentences[currentIndex]
  const selectedCategoriesCount = selectedInterestTotal
  const basePhraseCount = Math.max(0, sentences.length - customPhraseTotal)
  const totalActivePhraseCount = basePhraseCount + customPhraseTotal
  const currentWords = useMemo(
    () => splitWords(currentSentence?.sentence_en || ''),
    [currentSentence?.sentence_en]
  )
  const pronunciationDisplay = useMemo(
    () => getPronunciationDisplay(currentSentence),
    [currentSentence]
  )
  const selectedSpeedOption = useMemo(
    () => SPEED_OPTIONS.find((option) => option.id === speechSpeed) || SPEED_OPTIONS[2],
    [speechSpeed]
  )
  const pronunciationSegments = useMemo(
    () => splitWords(pronunciationDisplay),
    [pronunciationDisplay]
  )
  const progress = useMemo(() => {
    if (sentences.length === 0) return 0
    return (playedIndices.length / sentences.length) * 100
  }, [playedIndices.length, sentences.length])

  const nextUnplayedIndex = useMemo(
    () =>
      getNextUnplayedIndex({
        length: sentences.length,
        currentIndex,
        playedIndices,
        isShuffleOn,
      }),
    [currentIndex, isShuffleOn, playedIndices, sentences.length]
  )

  const hideTranslation = useCallback(() => {
    if (translationTimeoutRef.current) {
      clearTimeout(translationTimeoutRef.current)
      translationTimeoutRef.current = null
    }
    setShowTranslation(false)
  }, [])

  const showTranslationTemporarily = useCallback(() => {
    if (translationTimeoutRef.current) clearTimeout(translationTimeoutRef.current)
    setShowTranslation(true)
    translationTimeoutRef.current = setTimeout(() => {
      setShowTranslation(false)
      translationTimeoutRef.current = null
    }, 5000)
  }, [])

  const toggleTranslation = () => {
    if (showTranslation) {
      hideTranslation()
      return
    }

    showTranslationTemporarily()
  }

  const markPlayed = (index) => {
    if (!Number.isInteger(index)) return
    setCoreUnitsKnown(updateLearningProgress(sentences[index], sentences))
    const nextPlayed = Array.from(new Set([...playedIndicesRef.current, index]))
    playedIndicesRef.current = nextPlayed
    setPlayedIndices(nextPlayed)
    setIsBagCompleted(nextPlayed.length >= sentences.length)
  }

  const moveToPhrase = (nextIndex, { addToHistory = true } = {}) => {
    if (!Number.isInteger(nextIndex)) return

    if (addToHistory) {
      const nextHistory = [...navigationHistoryRef.current, currentIndexRef.current]
      navigationHistoryRef.current = nextHistory
      setNavigationHistory(nextHistory)
    }

    currentIndexRef.current = nextIndex
    repeatRef.current = 1
    setCurrentIndex(nextIndex)
    setRepeat(1)
    hideTranslation()
    setActiveWordIndex(null)
  }

  const updateRepeatTarget = (nextTarget) => {
    const safeTarget = Math.max(MIN_REPEAT_TARGET, Math.min(MAX_REPEAT_TARGET, nextTarget))
    repeatTargetRef.current = safeTarget
    setRepeatTarget(safeTarget)

    if (repeatRef.current > safeTarget) {
      repeatRef.current = safeTarget
      setRepeat(safeTarget)
    }
  }

  const updateSpeechSpeed = (nextSpeed) => {
    const nextOption = SPEED_OPTIONS.find((option) => option.id === nextSpeed)
    if (!nextOption) return

    speechRateRef.current = nextOption.rate
    setSpeechSpeed(nextSpeed)
  }

  const stopSpeech = useCallback(() => {
    isPlayingRef.current = false
    setIsPlaying(false)
    setIsPaused(false)
    setIsAutoPlayOn(false)
    setActiveWordIndex(null)
    hideTranslation()
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (wordTimerRef.current) clearInterval(wordTimerRef.current)
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    utteranceRef.current = null
  }, [hideTranslation])

  const pauseSpeech = useCallback(() => {
    isPlayingRef.current = false
    setIsPlaying(false)
    setIsPaused(true)
    setIsAutoPlayOn(false)
    setActiveWordIndex(null)
    hideTranslation()
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (wordTimerRef.current) clearInterval(wordTimerRef.current)
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    utteranceRef.current = null
  }, [hideTranslation])

  const startEstimatedWordTimer = useCallback((words, speechRate) => {
    if (wordTimerRef.current) clearInterval(wordTimerRef.current)
    setActiveWordIndex(0)

    if (words.length <= 1) return

    // Temporary fallback until ElevenLabs word timestamps are available.
    // Estimates word timing from sentence length for browsers with unreliable boundary events.
    const rateMultiplier = DEFAULT_SPEECH_RATE / speechRate
    const estimatedMs = Math.max(220, Math.min(620, (words.join(' ').length / words.length) * 65 * rateMultiplier))
    let index = 0

    wordTimerRef.current = setInterval(() => {
      index += 1
      if (index >= words.length) {
        clearInterval(wordTimerRef.current)
        wordTimerRef.current = null
        return
      }
      setActiveWordIndex(index)
    }, estimatedMs)
  }, [])

  const speakCurrent = useCallback((indexOverride = currentIndexRef.current) => {
    if (!window.speechSynthesis || sentences.length === 0) {
      setIsPlaying(false)
      isPlayingRef.current = false
      return
    }

    currentIndexRef.current = indexOverride
    const sentence = sentences[indexOverride]
    if (!sentence) return
    const words = splitWords(sentence.sentence_en)
    const speechRate = speechRateRef.current

    // TODO: Final production voice will use ElevenLabs based on selected tutor voice.
    // Current Web Speech API is fallback prototype only.
    // TODO: Future ElevenLabs integration should use generated audio playbackRate or separate voice speed settings.
    // TODO: Future ElevenLabs integration should use real word-level timestamps if available.
    window.speechSynthesis.cancel()
    if (wordTimerRef.current) clearInterval(wordTimerRef.current)
    startEstimatedWordTimer(words, speechRate)
    const utterance = new SpeechSynthesisUtterance(sentence.sentence_en)
    utterance.lang = 'en-US'
    utterance.rate = speechRate
    const tutorVoice = selectTutorVoice(window.speechSynthesis.getVoices(), getStoredTutorProfile())
    if (tutorVoice) {
      utterance.voice = tutorVoice
      utterance.lang = tutorVoice.lang || utterance.lang
    }
    utteranceRef.current = utterance

    utterance.onboundary = (event) => {
      if (event.name !== 'word' || !Number.isFinite(event.charIndex)) return
      if (wordTimerRef.current) {
        clearInterval(wordTimerRef.current)
        wordTimerRef.current = null
      }
      setActiveWordIndex(getBoundaryWordIndex(words, event.charIndex))
    }

    utterance.onend = () => {
      if (!isPlayingRef.current) return
      setActiveWordIndex(null)
      if (wordTimerRef.current) {
        clearInterval(wordTimerRef.current)
        wordTimerRef.current = null
      }

      timeoutRef.current = setTimeout(() => {
        if (!isPlayingRef.current) return

        if (repeatRef.current < repeatTargetRef.current) {
          repeatRef.current += 1
          setRepeat(repeatRef.current)
          speakCurrent()
          return
        }

        hideTranslation()

        markPlayed(currentIndexRef.current)
        const nextIndex = getNextUnplayedIndex({
          length: sentences.length,
          currentIndex: currentIndexRef.current,
          playedIndices: playedIndicesRef.current,
          isShuffleOn: isShuffleOnRef.current,
        })

        if (nextIndex === null) {
          isPlayingRef.current = false
          setIsPlaying(false)
          setIsAutoPlayOn(false)
          setIsBagCompleted(true)
          return
        }

        moveToPhrase(nextIndex)

        speakCurrent(nextIndex)
      }, 900)
    }

    window.speechSynthesis.speak(utterance)
  }, [hideTranslation, sentences, startEstimatedWordTimer])

  const startAutoPlay = () => {
    if (!currentSentence) return
    isPlayingRef.current = true
    currentIndexRef.current = currentIndex
    repeatRef.current = 1
    setRepeat(1)
    setIsPlaying(true)
    setIsPaused(false)
    setIsAutoPlayOn(true)
    speakCurrent()
  }

  const stopAutoPlay = () => {
    stopSpeech()
  }

  const toggleAutoPlay = () => {
    if (isAutoPlayOn || isPlaying) {
      stopAutoPlay()
      return
    }

    startAutoPlay()
  }

  const toggleShuffle = () => {
    stopSpeech()
    const nextShuffleState = !isShuffleOn

    setIsShuffleOn(nextShuffleState)
    isShuffleOnRef.current = nextShuffleState
    repeatRef.current = 1
    setRepeat(1)
  }

  const pauseListening = () => {
    pauseSpeech()
  }

  const goToPrevious = () => {
    const previousIndex = navigationHistoryRef.current.at(-1)
    if (!Number.isInteger(previousIndex)) return

    const nextHistory = navigationHistoryRef.current.slice(0, -1)
    navigationHistoryRef.current = nextHistory
    setNavigationHistory(nextHistory)

    stopSpeech()
    currentIndexRef.current = previousIndex
    repeatRef.current = 1
    setCurrentIndex(previousIndex)
    setRepeat(1)
    hideTranslation()
    setActiveWordIndex(null)
  }

  const goToNext = () => {
    markPlayed(currentIndex)
    const nextIndex = getNextUnplayedIndex({
      length: sentences.length,
      currentIndex,
      playedIndices: playedIndicesRef.current,
      isShuffleOn,
    })

    if (nextIndex === null) {
      setIsBagCompleted(true)
      stopSpeech()
      return
    }

    stopSpeech()
    moveToPhrase(nextIndex)
  }

  useEffect(() => {
    return () => stopSpeech()
  }, [stopSpeech])

  useEffect(() => {
    return () => {
      if (translationTimeoutRef.current) clearTimeout(translationTimeoutRef.current)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#071321] px-4 py-5 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-[430px] flex-col rounded-[30px] border border-[#B8FF2C]/15 bg-[#0B1D2F] p-5 shadow-2xl shadow-black/25">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => {
              stopSpeech()
              onBack()
            }}
            className="rounded-full border border-[#B8FF2C]/25 bg-[#102B43] px-4 py-2 text-sm font-semibold text-[#B8FF2C] active:scale-95"
          >
            Volver
          </button>
          <span className="rounded-full bg-[#B8FF2C] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#071321]">
            {isPrototype ? 'Prototype' : 'Fase 1 V1'}
          </span>
        </div>

        <header className="mb-5">
          <p className="text-sm font-semibold text-[#B8FF2C]/75">Fase 1 · Escuchar</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight">Set inicial Habloo</h1>
          <p className="mt-2 text-sm text-white/55">
            {selectedCategoriesCount} intereses · {basePhraseCount} frases + Mis Frases {customPhraseTotal}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#B8FF2C]/65">
            {coreUnitsKnown} / 3000 Palabras adquiridas
          </p>
          <p className="mt-1 text-xs font-semibold text-white/45">
            Tutor: {tutorName}
          </p>
        </header>

        <div className="mb-5 h-3 overflow-hidden rounded-full bg-[#16364E]">
          <div
            className="h-full rounded-full bg-[#B8FF2C] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {loading && (
          <div className="flex flex-1 items-center justify-center rounded-[26px] bg-[#102B43] p-6 text-center">
            <p className="font-semibold text-[#B8FF2C]">Construyendo set inicial...</p>
          </div>
        )}

        {!loading && currentSentence && (
          <>
            <div className="mb-4 flex justify-end">
              <span className="rounded-full border border-[#B8FF2C]/25 px-4 py-2 text-xs font-semibold text-[#B8FF2C]">
                Frase {currentIndex + 1} de {totalActivePhraseCount}
              </span>
            </div>

            {isBagCompleted && (
              <div className="mb-4 rounded-2xl border border-[#B8FF2C]/20 bg-[#B8FF2C]/8 p-4">
                <p className="text-sm font-semibold text-[#B8FF2C]">Bolsa completada</p>
                <p className="mt-1 text-xs leading-relaxed text-white/55">
                  Todas las frases de esta bolsa ya fueron recorridas en esta sesión.
                </p>
              </div>
            )}

            {/* Future correction mode can reuse this board for full sentence, difficult-word focus, word highlights, and phonetic help. */}
            <div
              onClick={toggleTranslation}
              className="mb-3 flex min-h-[270px] max-w-full flex-col justify-center overflow-hidden rounded-[30px] border border-white/45 bg-[#F6FFE8] px-5 py-8 text-center text-[#071321] shadow-[0_24px_70px_rgba(0,0,0,.24)] sm:px-6 sm:py-9"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#406014]/70">Inglés</p>
              <p
                className={`mx-auto mt-6 max-w-[340px] whitespace-normal font-semibold tracking-normal [hyphens:none] [overflow-wrap:normal] [word-break:keep-all] ${getSentenceFontSize(currentSentence.sentence_en)}`}
              >
                {currentWords.map((word, index) => (
                  <span
                    key={`${word}-${index}`}
                    className={`inline-block whitespace-nowrap [hyphens:none] [overflow-wrap:normal] [word-break:keep-all] transition-all duration-150 ${
                      activeWordIndex === index
                        ? 'underline decoration-[#80D910] decoration-4 underline-offset-4'
                        : ''
                    }`}
                  >
                    {word}
                    {index < currentWords.length - 1 ? '\u00A0' : ''}
                  </span>
                ))}
              </p>
              {pronunciationDisplay && (
                <div className="mx-auto mt-6 max-w-[330px] rounded-2xl border border-[#071321]/8 bg-[#071321]/7 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#406014]/55">
                    Pronunciación
                  </p>
                  <p className="mt-1.5 max-w-full whitespace-normal text-[clamp(0.78rem,3.2vw,0.95rem)] font-semibold leading-snug text-[#071321]/58 [hyphens:none] [overflow-wrap:normal] [word-break:keep-all]">
                    {pronunciationSegments.map((segment, index) => (
                      <span
                        key={`${segment}-${index}`}
                        className={`inline-block whitespace-nowrap [hyphens:none] [overflow-wrap:normal] [word-break:keep-all] transition-all duration-150 ${
                          activeWordIndex === index
                            ? 'underline decoration-[#80D910] decoration-2 underline-offset-4'
                            : ''
                        }`}
                      >
                        {segment}
                        {index < pronunciationSegments.length - 1 ? '\u00A0' : ''}
                      </span>
                    ))}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-[22px] border border-[#B8FF2C]/10 bg-[#102B43]/60 p-3">
              <button
                onClick={toggleTranslation}
                className="w-full rounded-2xl border border-[#B8FF2C]/12 bg-[#0E263A]/55 py-2.5 text-xs font-semibold text-[#B8FF2C]/70 transition-colors hover:border-[#B8FF2C]/22 hover:text-[#B8FF2C] active:scale-95"
              >
                {showTranslation ? 'Ocultar traducción' : 'Ver traducción'}
              </button>
              <div className={showTranslation ? 'mt-4 block px-1 pb-1' : 'hidden'}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#B8FF2C]/55">
                Traducción
              </p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-white/72">
                {currentSentence.translation_es || 'Sin traducción disponible'}
              </p>
              </div>
            </div>

            <div className="mt-5 rounded-[22px] border border-[#B8FF2C]/15 bg-[#0E263A] p-4">
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#B8FF2C]/60">
                    Velocidad
                  </p>
                  <div className="grid grid-cols-4 overflow-hidden rounded-xl border border-[#B8FF2C]/20">
                    {SPEED_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => updateSpeechSpeed(option.id)}
                        aria-pressed={speechSpeed === option.id}
                        className={`px-1.5 py-2 text-[11px] font-semibold leading-tight transition-colors ${
                          speechSpeed === option.id
                            ? 'bg-[#B8FF2C] text-[#071321] shadow-[0_0_16px_rgba(184,255,44,0.4)]'
                            : 'bg-[#102B43] text-[#B8FF2C]'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-semibold">
                    <span className="text-white/55">Velocidad: {selectedSpeedOption.status}</span>
                    <span className="text-[#B8FF2C]/65">Recomendada: 1.0x</span>
                  </div>
                </div>

                <div className="col-span-2">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#B8FF2C]/60">
                    Repeticiones
                  </p>
                  <div className="grid grid-cols-[34px_1fr_34px] overflow-hidden rounded-xl border border-[#B8FF2C]/20 bg-[#102B43]">
                    <button
                      type="button"
                      onClick={() => updateRepeatTarget(repeatTarget - 1)}
                      disabled={repeatTarget === MIN_REPEAT_TARGET}
                      className="px-2 py-2 text-sm font-bold text-[#B8FF2C] disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      -
                    </button>
                    <span className="flex items-center justify-center text-sm font-bold text-white">
                      {repeatTarget}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateRepeatTarget(repeatTarget + 1)}
                      disabled={repeatTarget === MAX_REPEAT_TARGET}
                      className="px-2 py-2 text-sm font-bold text-[#B8FF2C] disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      +
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] font-semibold text-white/55">
                    Progreso: {repeat} / {repeatTarget}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {Array.from({ length: repeatTarget }).map((_, index) => {
                  const step = index + 1
                  return (
                  <span
                    key={step}
                    className={`h-2 flex-1 rounded-full ${
                      step <= repeat ? 'bg-[#B8FF2C]' : 'bg-[#B8FF2C]/20'
                    }`}
                  />
                  )
                })}
              </div>
            </div>

            <div className="mt-auto pt-6">
              <div className="mb-5 grid grid-cols-3 items-center py-2">
                <button
                  type="button"
                  onClick={toggleShuffle}
                  disabled={sentences.length < 2}
                  aria-pressed={isShuffleOn}
                  aria-label={isShuffleOn ? 'Desactivar shuffle' : 'Activar shuffle'}
                  className={`flex h-16 w-full items-center justify-center bg-transparent text-[30px] font-semibold leading-none transition-all disabled:cursor-not-allowed disabled:opacity-35 active:scale-95 ${
                    isShuffleOn
                      ? 'text-[#B8FF2C] drop-shadow-[0_0_6px_rgba(184,255,44,0.24)]'
                      : 'text-white/34'
                  }`}
                >
                  🔀
                </button>
                <button
                  type="button"
                  onClick={toggleAutoPlay}
                  aria-pressed={isAutoPlayOn}
                  aria-label={isAutoPlayOn ? 'Desactivar auto play' : 'Activar auto play'}
                  className={`flex h-16 w-full items-center justify-center bg-transparent text-[32px] font-black leading-none transition-all active:scale-95 ${
                    isAutoPlayOn
                      ? 'text-[#B8FF2C] drop-shadow-[0_0_6px_rgba(184,255,44,0.24)]'
                      : 'text-white/34'
                  }`}
                >
                  ▶
                </button>
                <button
                  type="button"
                  onClick={pauseListening}
                  disabled={!isPlaying}
                  aria-label="Pausar"
                  className={`flex h-16 w-full items-center justify-center bg-transparent text-[30px] font-semibold leading-none transition-all disabled:cursor-not-allowed active:scale-95 ${
                    isPlaying
                      ? 'text-[#B8FF2C] drop-shadow-[0_0_6px_rgba(184,255,44,0.24)]'
                      : 'text-white/34'
                  }`}
                >
                  ⏸
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={goToPrevious}
                  disabled={navigationHistory.length === 0}
                  className="rounded-2xl border border-[#B8FF2C]/25 bg-[#102B43] py-4 font-semibold text-[#B8FF2C] disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={goToNext}
                  disabled={isBagCompleted && nextUnplayedIndex === null}
                  className="rounded-2xl border border-[#B8FF2C]/25 bg-[#102B43] py-4 font-semibold text-[#B8FF2C] disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
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
