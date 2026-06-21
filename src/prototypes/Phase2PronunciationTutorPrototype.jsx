import { useEffect, useRef, useState } from 'react'
import { QUALITY, sm2Review } from '../utils/sm2.js'

const phrases = [
  {
    english: "I'm going to the gym today.",
    spanish: 'Voy al gimnasio hoy.',
    phonetic: 'aim góuin tu de yim tudéi',
    wordPhonetics: { gym: 'yim' },
    difficultWord: 'gym',
  },
  {
    english: 'I need to warm up first.',
    spanish: 'Necesito calentar primero.',
    phonetic: 'ai nid tu uórm op ferst',
    wordPhonetics: { warm: 'uórm' },
    difficultWord: 'warm',
  },
  {
    english: 'Can you spot me?',
    spanish: '¿Puedes ayudarme con este ejercicio?',
    phonetic: 'kan iu spat mi',
    wordPhonetics: { spot: 'spat' },
    difficultWord: 'spot',
  },
]

const difficultyOptions = [
  { label: 'Fácil', quality: QUALITY.EASY, state: 'easy' },
  { label: 'Difícil', quality: QUALITY.HARD, state: 'hard' },
  { label: 'Muy difícil', quality: QUALITY.AGAIN, state: 'again' },
]

const SIMULATED_LISTENING_MS = 5000
const simulatedSarahFeedback = [
  'Muy bien, Jesús. Sonó natural.',
  'Casi, Jesús. Vamos a practicar esta palabra.',
  'Tranquilo. Esta frase la repasaremos mañana.',
]

function splitWords(sentence) {
  return sentence.trim().split(/\s+/).filter(Boolean)
}

function selectSarahVoice(voices) {
  const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith('en'))
  return englishVoices.find((voice) => voice.default) || englishVoices[0] || voices[0] || null
}

function getSarahFeedback(difficulty) {
  if (difficulty === 'easy') {
    return 'Muy bien, Jesús. Sonó natural.'
  }
  if (difficulty === 'hard') {
    return 'Casi, Jesús. Vamos a practicar esta palabra.'
  }
  if (difficulty === 'again') {
    return 'Tranquilo. Esta frase la repasaremos mañana.'
  }
  return ''
}

export default function Phase2PronunciationTutorPrototype({ onBack }) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [activeWordIndex, setActiveWordIndex] = useState(null)
  const [isSarahSpeaking, setIsSarahSpeaking] = useState(false)
  const [isUserTurn, setIsUserTurn] = useState(false)
  const [isSimulatingListening, setIsSimulatingListening] = useState(false)
  const [difficulty, setDifficulty] = useState(null)
  const [sarahFeedback, setSarahFeedback] = useState('')
  const [cards, setCards] = useState({})
  const [showDifficultyQuestion, setShowDifficultyQuestion] = useState(false)
  const [boardMode, setBoardMode] = useState('full')
  const [isSlowPlayback, setIsSlowPlayback] = useState(false)
  const wordTimerRef = useRef(null)
  const advanceTimerRef = useRef(null)
  const responseTimerRef = useRef(null)
  const speechFallbackTimerRef = useRef(null)
  const speechSessionRef = useRef(0)
  const sarahVoiceRef = useRef(null)
  const simulatedFeedbackIndexRef = useRef(0)

  const phrase = phrases[phraseIndex]
  const words = splitWords(phrase.english)
  const card = cards[phrase.english] || { easeFactor: 2.5, interval: 0, repetitions: 0 }
  const difficultWordIndex = words.findIndex((word) =>
    word.toLowerCase().replace(/[^a-z]/g, '') === phrase.difficultWord
  )
  const isWordMode = boardMode === 'word'
  const boardTarget = isWordMode ? phrase.difficultWord : phrase.english
  const phoneticHelp = isWordMode
    ? phrase.wordPhonetics[phrase.difficultWord] || `sonido de ${phrase.difficultWord}`
    : phrase.phonetic

  useEffect(() => {
    return () => {
      if (wordTimerRef.current) clearInterval(wordTimerRef.current)
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
      if (responseTimerRef.current) clearTimeout(responseTimerRef.current)
      if (speechFallbackTimerRef.current) clearTimeout(speechFallbackTimerRef.current)
      if (window.speechSynthesis) window.speechSynthesis.cancel()
    }
  }, [])

  const clearTimers = () => {
    if (wordTimerRef.current) clearInterval(wordTimerRef.current)
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    if (speechFallbackTimerRef.current) clearTimeout(speechFallbackTimerRef.current)
    wordTimerRef.current = null
    advanceTimerRef.current = null
    speechFallbackTimerRef.current = null
  }

  const clearListeningTimers = () => {
    if (responseTimerRef.current) clearTimeout(responseTimerRef.current)
    responseTimerRef.current = null
  }

  const startBoardPlayback = (playbackWords = words) => {
    if (wordTimerRef.current) clearInterval(wordTimerRef.current)
    setActiveWordIndex(isWordMode ? difficultWordIndex : 0)

    if (playbackWords.length <= 1) return

    let index = 0
    wordTimerRef.current = setInterval(() => {
      index += 1
      if (index >= playbackWords.length) {
        clearInterval(wordTimerRef.current)
        wordTimerRef.current = null
        return
      }
      setActiveWordIndex(index)
    }, isSlowPlayback ? 820 : 520)
  }

  const finishSarahPlayback = (speechSession) => {
    if (speechSession !== speechSessionRef.current) return
    if (wordTimerRef.current) clearInterval(wordTimerRef.current)
    wordTimerRef.current = null
    setIsSarahSpeaking(false)
    setIsUserTurn(true)
    setActiveWordIndex(null)
    if (speechFallbackTimerRef.current) clearTimeout(speechFallbackTimerRef.current)
    speechFallbackTimerRef.current = null
  }

  const scheduleReview = (quality) => {
    const nextCard = sm2Review(card, quality)
    setCards((current) => ({ ...current, [phrase.english]: nextCard }))
  }

  const goToNextPhrase = () => {
    clearTimers()
    clearListeningTimers()
    speechSessionRef.current += 1
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    setPhraseIndex((index) => (index + 1) % phrases.length)
    setActiveWordIndex(null)
    setIsSarahSpeaking(false)
    setIsUserTurn(false)
    setIsSimulatingListening(false)
    setDifficulty(null)
    setSarahFeedback('')
    setShowDifficultyQuestion(false)
    setBoardMode('full')
    setIsSlowPlayback(false)
  }

  const listenToSarah = () => {
    clearTimers()
    const speechSession = speechSessionRef.current + 1
    speechSessionRef.current = speechSession
    setShowDifficultyQuestion(false)
    setIsSarahSpeaking(true)
    setIsUserTurn(false)
    setIsSimulatingListening(false)
    setSarahFeedback('')
    setActiveWordIndex(null)

    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      console.warn('[Phase2PronunciationTutorPrototype] speechSynthesis is not supported.')
      setIsSarahSpeaking(false)
      return
    }

    window.speechSynthesis.cancel()
    const voices = window.speechSynthesis.getVoices()
    const sarahVoice = sarahVoiceRef.current || selectSarahVoice(voices)
    const practiceText = isWordMode ? phrase.difficultWord : phrase.english
    const phraseUtterance = new window.SpeechSynthesisUtterance(practiceText)

    // TODO: Replace with backend ElevenLabs Sarah voice.
    // Never expose an ElevenLabs API key in the frontend.
    sarahVoiceRef.current = sarahVoice
    phraseUtterance.lang = sarahVoice?.lang || 'en-US'
    phraseUtterance.rate = isSlowPlayback ? 0.62 : 0.9
    if (sarahVoice) {
      phraseUtterance.voice = sarahVoice
    }

    phraseUtterance.onend = () => finishSarahPlayback(speechSession)
    phraseUtterance.onerror = () => finishSarahPlayback(speechSession)

    startBoardPlayback(isWordMode ? [phrase.difficultWord] : words)
    window.speechSynthesis.speak(phraseUtterance)
    speechFallbackTimerRef.current = setTimeout(
      () => finishSarahPlayback(speechSession),
      isWordMode ? 2200 : words.length * (isSlowPlayback ? 900 : 620) + 1200
    )
  }

  const speak = () => {
    clearTimers()
    clearListeningTimers()
    speechSessionRef.current += 1
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    setIsUserTurn(false)
    setIsSimulatingListening(true)
    setDifficulty(null)
    setSarahFeedback('')
    setActiveWordIndex(null)
    setShowDifficultyQuestion(false)

    // TODO: Later connect real microphone + Whisper/OpenAI pronunciation analysis.
    responseTimerRef.current = setTimeout(() => {
      const nextFeedback =
        simulatedSarahFeedback[simulatedFeedbackIndexRef.current % simulatedSarahFeedback.length]
      simulatedFeedbackIndexRef.current += 1
      setIsSimulatingListening(false)
      setSarahFeedback(nextFeedback)
      setShowDifficultyQuestion(true)
      responseTimerRef.current = null
    }, SIMULATED_LISTENING_MS)
  }

  const tryAgain = () => {
    clearTimers()
    clearListeningTimers()
    speechSessionRef.current += 1
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    setDifficulty(null)
    setSarahFeedback('')
    setIsSimulatingListening(false)
    setActiveWordIndex(null)
    setShowDifficultyQuestion(false)
    setBoardMode(isSlowPlayback ? 'word' : boardMode === 'word' ? 'full-highlight' : 'full')
    setIsUserTurn(true)
  }

  const answerDifficulty = ({ quality, state }) => {
    clearTimers()
    scheduleReview(quality)
    setDifficulty(state)
    setSarahFeedback(getSarahFeedback(state))
    setShowDifficultyQuestion(false)

    if (state === 'easy') {
      setBoardMode('full')
      setIsSlowPlayback(false)
      advanceTimerRef.current = setTimeout(goToNextPhrase, 2200)
      return
    }

    setBoardMode('word')
    setActiveWordIndex(difficultWordIndex)
    setIsSlowPlayback(state === 'again')
    setIsUserTurn(true)

    if (state === 'hard') {
      advanceTimerRef.current = setTimeout(() => {
        setBoardMode('full-highlight')
        setActiveWordIndex(difficultWordIndex)
        advanceTimerRef.current = null
      }, 1800)
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#071321] px-4 py-5 text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute left-[-90px] top-[-80px] h-64 w-64 rounded-full bg-[#B8FF2C]/10 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-110px] h-72 w-72 rounded-full bg-[#44D7FF]/10 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-[430px] flex-col rounded-[30px] border border-[#B8FF2C]/15 bg-[#0B1D2F] p-5 shadow-2xl shadow-black/25">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="rounded-full border border-[#B8FF2C]/25 bg-[#102B43] px-4 py-2 text-sm font-semibold text-[#B8FF2C] active:scale-95"
          >
            Volver
          </button>
          <span className="rounded-full bg-[#B8FF2C] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#071321]">
            BETA
          </span>
        </div>

        <header className="mb-5">
          <p className="text-sm font-semibold text-[#B8FF2C]/75">Fase 2 · Pronunciación</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-white">
            Practica con Sarah
          </h1>
        </header>

        <section className="mb-5 rounded-[26px] border border-[#44D7FF]/15 bg-[#102B43] p-5">
          <div className="flex flex-col items-center text-center">
            <div className={`grid h-28 w-28 place-items-center rounded-full border border-[#44D7FF]/30 bg-[#44D7FF]/10 text-4xl font-semibold text-[#44D7FF] shadow-[0_0_34px_rgba(68,215,255,0.14)] ${
              isSarahSpeaking ? 'scale-105 shadow-[0_0_42px_rgba(68,215,255,0.28)]' : ''
            } transition`}>
              S
            </div>
            <p className="mt-4 text-sm font-semibold text-[#44D7FF]">Sarah · Tutor IA</p>
            <p className="mt-1 text-sm font-medium leading-relaxed text-white/62">
              Lista para practicar contigo
            </p>
            <button
              onClick={listenToSarah}
              disabled={isSarahSpeaking || isSimulatingListening}
              className="mt-5 w-full rounded-2xl bg-[#B8FF2C] py-4 text-sm font-semibold text-[#071321] disabled:opacity-60 active:scale-95"
            >
              Escuchar a Sarah
            </button>
          </div>
        </section>

        <section className="mb-5 flex min-h-[260px] max-w-full flex-col justify-center overflow-hidden rounded-[30px] border border-white/45 bg-[#F6FFE8] px-5 py-7 text-center text-[#071321] shadow-[0_24px_70px_rgba(0,0,0,.24)] sm:px-6 sm:py-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#406014]/70">
            Tablero de práctica
          </p>
          {isWordMode ? (
            <p className="mx-auto mt-6 max-w-[340px] text-center text-[clamp(2.5rem,12vw,3.8rem)] font-semibold leading-tight text-[#071321]">
              {boardTarget}
            </p>
          ) : (
            <p className="mx-auto mt-6 max-w-[340px] whitespace-normal text-[clamp(1.55rem,7vw,2.1rem)] font-semibold leading-[1.22] tracking-normal [hyphens:none] [overflow-wrap:normal] [word-break:keep-all]">
              {words.map((word, index) => {
                const isDifficult =
                  word.toLowerCase().replace(/[^a-z]/g, '') === phrase.difficultWord
                const shouldHighlight =
                  activeWordIndex === index || (boardMode === 'full-highlight' && isDifficult)

                return (
                  <span
                    key={`${word}-${index}`}
                    className={`inline-block whitespace-nowrap transition-all duration-150 ${
                      shouldHighlight
                        ? 'underline decoration-[#80D910] decoration-4 underline-offset-4'
                        : ''
                    }`}
                  >
                    {word}
                    {index < words.length - 1 ? '\u00A0' : ''}
                  </span>
                )
              })}
            </p>
          )}
          <div className="mx-auto mt-6 max-w-[330px] rounded-2xl border border-[#071321]/8 bg-[#071321]/7 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#406014]/55">
              Pronunciación
            </p>
            <p className="mt-2 max-w-full whitespace-normal text-[clamp(0.98rem,4vw,1.12rem)] font-medium leading-[1.55] tracking-[0.01em] text-[#071321]/72 [hyphens:none] [overflow-wrap:normal] [word-break:keep-all]">
              {phoneticHelp}
            </p>
          </div>
        </section>

        <section className="mb-5 grid grid-cols-1 gap-3">
          <button
            onClick={speak}
            disabled={isSarahSpeaking || isSimulatingListening}
            className={`mx-auto grid h-24 w-24 place-items-center rounded-full text-center text-sm font-semibold leading-tight active:scale-95 ${
              isSimulatingListening
                ? 'scale-105 border border-[#FF8A7A]/70 bg-[#FF725E] text-white shadow-[0_0_32px_rgba(255,114,94,0.42)]'
                : 'bg-[#B8FF2C] text-[#071321] shadow-[0_0_24px_rgba(184,255,44,0.28)]'
            } ${
              isUserTurn ? 'animate-pulse' : ''
            } disabled:cursor-not-allowed disabled:opacity-55`}
          >
            {isSimulatingListening ? '🎙️ Escuchando...' : '🎙️ Hablar ahora'}
          </button>
          <button
            onClick={tryAgain}
            disabled={isSimulatingListening}
            className="mx-auto rounded-full border border-[#44D7FF]/20 bg-[#0E263A] px-4 py-2 text-xs font-semibold text-[#44D7FF] disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
          >
            Intentar otra vez
          </button>
        </section>

        {(sarahFeedback || difficulty) && (
        <section className="mb-5 rounded-[24px] border border-[#B8FF2C]/15 bg-[#102B43] p-4">
          <p className="text-sm font-medium leading-relaxed text-white/78">
            {sarahFeedback || getSarahFeedback(difficulty)}
          </p>
        </section>
        )}

        {showDifficultyQuestion && (
          <section className="mb-5 rounded-2xl border border-[#F0B429]/20 bg-[#F0B429]/8 p-4">
            <p className="text-sm font-medium text-white/78">
              ¿Esta frase se te hizo fácil o difícil?
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {difficultyOptions.map((option) => (
                <button
                  key={option.state}
                  onClick={() => answerDifficulty(option)}
                  className="rounded-2xl border border-[#B8FF2C]/25 bg-[#102B43] py-3 text-sm font-semibold text-[#B8FF2C] active:scale-95"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="mt-auto rounded-2xl border border-[#B8FF2C]/15 bg-[#B8FF2C]/8 p-4">
          <p className="text-sm font-medium leading-relaxed text-white/76">
            Fase 2 usa las mismas frases de tu bolsa activa.
          </p>
        </section>
      </main>
    </div>
  )
}
