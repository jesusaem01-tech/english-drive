import { useState, useRef, useEffect } from 'react'
import { getStats } from '../utils/storage.js'
import { sentences } from '../data/sentences.js'

const DEV_MODE = true

// ── Reemplaza con URL o ruta de imagen para usar foto real en lugar del SVG ──
const AVATAR_IMAGE = ''

const CREDITS_INITIAL = 16
const CREDITS_KEY     = 'habloo_credits'
const NAME_KEY        = 'habloo_name'

const PRACTICE_SENTENCES = [
  'Hello my name is NAME and I am a real estate agent.',
  'This property has three bedrooms and two bathrooms.',
  'The asking price is negotiable.',
  'Would you like to schedule a showing.',
  'Let me walk you through the property.',
  'This neighborhood has great schools nearby.',
  'The seller is motivated and open to offers.',
  'We can close in 30 days if needed.',
  'This home has been recently renovated.',
  'Let me answer any questions you may have.',
]

function buildSystemPrompt(name, totalMastered, streak) {
  const firstSentence = PRACTICE_SENTENCES[0].replace('NAME', name)
  const sentenceList = PRACTICE_SENTENCES
    .map((s, i) => `${i + 1}. ${s.replace('NAME', name)}`)
    .join('\n')

  return `IMPORTANT: Always use exactly "Repeat after me:" before every sentence to practice. Never say "Repite" or "Repite conmigo". Always in English as a native American tutor.

IMPORTANT LANGUAGE RULE: Always explain and give feedback in Spanish. Only speak English when saying the sentence to repeat. When student makes a mistake explain in Spanish what went wrong then say only the missed English words. Example: Muy bien pero faltó decir real estate agent. Repeat after me: real estate agent. Celebrations in Spanish: Excelente! Lo hiciste muy bien!

You are Sarah, a warm bilingual tutor English and Spanish. Native language of student is Spanish. Interest is Real Estate.

STUDENT CONTEXT:
- Name: ${name}
- Sentences mastered: ${totalMastered}
- Day streak: ${streak}

LANGUAGE RULE: If student writes in Spanish respond in Spanish for instructions but always ask them to repeat in English. If student writes in English respond in English.

TEACHING FLOW: Practice one sentence at a time from the list below in order. Say "repeat after me:" then the sentence. If correct celebrate and move to next. If incorrect correct gently and ask to repeat. Max 2 sentences per response. Never use caps or bullet points.

SENTENCES TO PRACTICE IN ORDER:
${sentenceList}

FIRST MESSAGE: Greet ${name} by name in Spanish. Mention their progress (${totalMastered} sentences mastered, ${streak}-day streak). Ask them to repeat: ${firstSentence}`
}

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null

const cleanText = (text) => {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/[^\w\s.,!?áéíóúüñÁÉÍÓÚÜÑ¡¿'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const speak = (text) => {
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  const isSpanish = /[áéíóúüñ]/.test(text) || text.match(/\b(muy|bien|repite|excelente|vamos|hola|gracias)\b/i)

  const trySpeak = () => {
    const voices = window.speechSynthesis.getVoices()
    if (isSpanish) {
      const v = voices.find(v => v.name === 'Google español de Estados Unidos') ||
                voices.find(v => v.name === 'Google español') ||
                voices.find(v => v.lang.startsWith('es'))
      if (v) utter.voice = v
      utter.lang  = 'es-US'
      utter.rate  = 1.15
      utter.pitch = 1.1
    } else {
      const v = voices.find(v => v.name === 'Google UK English Female') ||
                voices.find(v => v.name === 'Google US English')
      if (v) utter.voice = v
      utter.lang  = 'en-US'
      utter.rate  = 1.05
      utter.pitch = 1.1
    }
    window.speechSynthesis.speak(utter)
  }

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = trySpeak
  } else {
    trySpeak()
  }
  return utter
}

// ── Genera el primer saludo personalizado ─────────────────────────────────────
const FIRST_QUESTIONS = [
  'how would you greet a new client when they walk in?',
  'how would you describe a property with a great view?',
  'what would you say when presenting a home for the first time?',
  'how do you ask about a client\'s budget politely?',
  'how would you explain what "closing costs" means to a buyer?',
  'what phrase would you use to schedule a property showing?',
]

function buildGreeting(name) {
  const stats   = getStats()
  const streak  = stats.streak       || 0
  const mastered = stats.totalMastered || 0
  const q = FIRST_QUESTIONS[Math.floor(Math.random() * FIRST_QUESTIONS.length)]

  let progress = ''
  if (streak > 1 && mastered > 0) {
    progress = `You've mastered ${mastered} sentence${mastered !== 1 ? 's' : ''} and you're on a ${streak}-day streak — impressive! `
  } else if (mastered > 0) {
    progress = `You've already mastered ${mastered} sentence${mastered !== 1 ? 's' : ''} — great start! `
  } else {
    progress = `Let's get your real estate English off the ground! `
  }

  return `Hey ${name}! Ready to practice your real estate English? ${progress}Tell me, ${q}`
}

// ── Avatar SVG animado ────────────────────────────────────────────────────────
function AvatarSVG({ state }) {
  const isThinking  = state === 'thinking'
  const isSpeaking  = state === 'speaking'
  const isListening = state === 'listening'
  const pupilY = isThinking ? 63 : 67
  const hlY    = isThinking ? 61 : 65

  return (
    <svg viewBox="0 0 120 148" xmlns="http://www.w3.org/2000/svg"
         style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <defs>
        <style>{`
          @keyframes mouthSpeak {
            0%, 100% { transform: scaleY(0.15); }
            50%       { transform: scaleY(1);    }
          }
          @keyframes audioRing {
            0%        { opacity: 0.6; transform: scale(1);    }
            70%       { opacity: 0;   transform: scale(1.35); }
            100%      { opacity: 0;   transform: scale(1.35); }
          }
          @keyframes breathe {
            0%, 100% { transform: scale(1);    }
            50%       { transform: scale(1.01); }
          }
          .sarah-idle  { animation: breathe 4s ease-in-out infinite; transform-origin: 60px 74px; }
          .mouth-speak {
            transform-box: fill-box;
            transform-origin: center bottom;
            animation: mouthSpeak 0.42s ease-in-out infinite;
          }
          .ring-1 { animation: audioRing 1.6s ease-out infinite 0s;    transform-origin: 60px 74px; }
          .ring-2 { animation: audioRing 1.6s ease-out infinite 0.45s; transform-origin: 60px 74px; }
          .ring-3 { animation: audioRing 1.6s ease-out infinite 0.9s;  transform-origin: 60px 74px; }
        `}</style>
        <radialGradient id="skinGrad" cx="45%" cy="40%" r="60%">
          <stop offset="0%"   stopColor="#FCDEC8"/>
          <stop offset="100%" stopColor="#F0B090"/>
        </radialGradient>
        <radialGradient id="hairGrad" cx="50%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#5C3D2E"/>
          <stop offset="100%" stopColor="#2E1C10"/>
        </radialGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.25"/>
        </filter>
      </defs>

      {isListening && (
        <>
          <circle cx="60" cy="74" r="58" fill="none" stroke="#F0B429" strokeWidth="2.5" className="ring-1"/>
          <circle cx="60" cy="74" r="68" fill="none" stroke="#F0B429" strokeWidth="1.5" className="ring-2"/>
          <circle cx="60" cy="74" r="78" fill="none" stroke="#F0B429" strokeWidth="1"   className="ring-3"/>
        </>
      )}

      <g className={state === 'idle' ? 'sarah-idle' : ''}>
        <path d="M 0,148 Q 18,118 44,114 Q 52,112 60,112 Q 68,112 76,114 Q 102,118 120,148 Z" fill="#1A3355"/>
        <rect x="50" y="106" width="20" height="18" rx="7" fill="url(#skinGrad)"/>
        <ellipse cx="60" cy="124" rx="11" ry="4" fill="#0A1628" opacity="0.18"/>
        <ellipse cx="14" cy="72" rx="6" ry="9" fill="url(#skinGrad)"/>
        <ellipse cx="16" cy="72" rx="3.5" ry="6" fill="#EAA07A" opacity="0.5"/>
        <ellipse cx="106" cy="72" rx="6" ry="9" fill="url(#skinGrad)"/>
        <ellipse cx="104" cy="72" rx="3.5" ry="6" fill="#EAA07A" opacity="0.5"/>
        <ellipse cx="60" cy="40" rx="47" ry="38" fill="url(#hairGrad)"/>
        <path d="M 14,68 Q 8,90 16,108" stroke="#2E1C10" strokeWidth="16" fill="none" strokeLinecap="round"/>
        <path d="M 106,68 Q 112,90 104,108" stroke="#2E1C10" strokeWidth="16" fill="none" strokeLinecap="round"/>
        <ellipse cx="60" cy="74" rx="46" ry="50" fill="url(#skinGrad)" filter="url(#softShadow)"/>
        <path d="M 14,60 Q 16,20 60,18 Q 104,20 106,60 Q 92,32 60,30 Q 28,32 14,60 Z" fill="url(#hairGrad)"/>
        <path d="M 28,42 Q 40,34 60,32 Q 80,34 92,42" fill="#3A2418" opacity="0.6"/>
        <ellipse cx="42" cy="70" rx="10" ry="10.5" fill="white"/>
        <ellipse cx="78" cy="70" rx="10" ry="10.5" fill="white"/>
        <circle cx="42" cy={pupilY} r="6.5" fill="#5C3820"/>
        <circle cx="78" cy={pupilY} r="6.5" fill="#5C3820"/>
        <circle cx="42" cy={pupilY} r="4"   fill="#1A0E08"/>
        <circle cx="78" cy={pupilY} r="4"   fill="#1A0E08"/>
        <circle cx="44.5" cy={hlY} r="1.8" fill="white"/>
        <circle cx="80.5" cy={hlY} r="1.8" fill="white"/>
        <path d="M 32,62 Q 36,58 42,59.5 Q 48,58 52,62" stroke="#2E1C10" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        <path d="M 68,62 Q 72,58 78,59.5 Q 84,58 88,62" stroke="#2E1C10" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        {!isThinking && (
          <>
            <path d="M 31,56 Q 42,50 53,53" stroke="#4A2E1A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d="M 67,53 Q 78,50 89,56" stroke="#4A2E1A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </>
        )}
        {isThinking && (
          <>
            <path d="M 31,53 Q 42,46 53,50" stroke="#4A2E1A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d="M 67,50 Q 78,46 89,53" stroke="#4A2E1A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </>
        )}
        <path d="M 60,74 Q 56,83 58,87 Q 60,89 62,87 Q 64,83 60,74"
              fill="none" stroke="#D4936A" strokeWidth="1.8" strokeLinecap="round"/>
        <ellipse cx="26" cy="82" rx="9" ry="5.5" fill="#FFB6A0" opacity="0.25"/>
        <ellipse cx="94" cy="82" rx="9" ry="5.5" fill="#FFB6A0" opacity="0.25"/>
        {!isSpeaking && (
          <>
            <path d="M 46,95 Q 60,107 74,95" stroke="#C0665A" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <circle cx="46" cy="95" r="1.5" fill="#C0665A"/>
            <circle cx="74" cy="95" r="1.5" fill="#C0665A"/>
          </>
        )}
        {isSpeaking && (
          <g className="mouth-speak">
            <path d="M 47,93 Q 54,90 60,91 Q 66,90 73,93"
                  stroke="#C0665A" strokeWidth="2.5" fill="#C0665A" strokeLinecap="round"/>
            <ellipse cx="60" cy="97" rx="10" ry="7" fill="#8B3A3A"/>
            <rect x="52" y="93" width="16" height="5" rx="2.5" fill="#F5EEE8"/>
            <path d="M 47,99 Q 60,107 73,99"
                  stroke="#C0665A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </g>
        )}
      </g>
    </svg>
  )
}

// ── Pantalla de nombre (onboarding) ───────────────────────────────────────────
function NameScreen({ onConfirm }) {
  const [name, setName] = useState('')

  function handleConfirm() {
    const trimmed = name.trim()
    if (!trimmed) return
    localStorage.setItem(NAME_KEY, trimmed)
    onConfirm(trimmed)
  }

  return (
    <div className="flex flex-col h-screen bg-[#0A1628] text-white px-6">
      <div className="flex-1 flex flex-col items-center justify-center gap-6">

        {/* Avatar */}
        <div className="w-32 h-32">
          {AVATAR_IMAGE
            ? <img src={AVATAR_IMAGE} alt="Sarah"
                   className="w-full h-full rounded-full object-cover border-2 border-[#F0B429]/30"/>
            : <AvatarSVG state="idle"/>
          }
        </div>

        {/* Presentación */}
        <div className="text-center">
          <p className="text-[#F0B429] font-black text-2xl">Hi! I'm Sarah 👋</p>
          <p className="text-white/60 text-base mt-1">Tu tutora de Real Estate English</p>
          <span className="mt-2 inline-block text-xs bg-[#0F2040] border border-[#F0B429]/20
                           rounded-full px-3 py-1 text-[#F0B429]/70">
            🇺🇸 American English
          </span>
        </div>

        {/* Pregunta */}
        <div className="w-full bg-[#0F2040] rounded-3xl p-6 border border-[#F0B429]/10">
          <p className="text-[#F0B429] font-bold text-lg text-center mb-4">
            ¿Cuál es tu nombre?
          </p>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            placeholder="Escribe tu nombre..."
            autoFocus
            className="w-full min-h-[60px] rounded-2xl bg-[#152d4f] border border-[#F0B429]/20
                       px-4 text-white placeholder-white/30 text-lg outline-none
                       focus:border-[#F0B429]/50 text-center"
          />
        </div>

        {/* Botón confirmar */}
        <button
          onClick={handleConfirm}
          disabled={!name.trim()}
          className="w-full min-h-[70px] bg-[#F0B429] text-[#0A1628] rounded-2xl
                     font-black text-xl active:scale-95 transition-transform
                     disabled:opacity-40"
        >
          ¡Empezar! →
        </button>

        <p className="text-white/20 text-xs text-center">
          Solo usamos tu nombre para personalizar la experiencia
        </p>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function AIChat({ onBack }) {
  // ── Nombre del usuario ──────────────────────────────────────────────────────
  const storedName     = localStorage.getItem(NAME_KEY)
  const [showOnboarding, setShowOnboarding] = useState(!storedName)
  const [userName,       setUserName]       = useState(storedName || '')

  const [messages, setMessages] = useState([])

  const [input,       setInput]       = useState('')
  const [isLoading,   setIsLoading]   = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking,  setIsSpeaking]  = useState(false)
  const [micError,    setMicError]    = useState('')
  const [showMicHint,   setShowMicHint]   = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [repeatPhrase,  setRepeatPhrase]  = useState(null)
  const [showBoard,     setShowBoard]     = useState(false)

  const [credits, setCredits] = useState(() => {
    localStorage.setItem(CREDITS_KEY, String(CREDITS_INITIAL))
    return CREDITS_INITIAL
  })

  const isProcessing       = useRef(false)
  const currentSentenceRef = useRef('')
  const shouldShowBoardRef = useRef(false)
  const bottomRef      = useRef(null)
  const recognitionRef = useRef(null)
  const speakTimerRef  = useRef(null)
  const messagesRef    = useRef(messages)
  const creditsRef     = useRef(credits)

  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { creditsRef.current  = credits  }, [credits])

  useEffect(() => {
    const showVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      voices.forEach(v => console.log(v.name, '-', v.lang))
    }
    window.speechSynthesis.onvoiceschanged = showVoices
    showVoices()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    return () => {
      try { recognitionRef.current?.stop() } catch {}
      if (speakTimerRef.current) clearTimeout(speakTimerRef.current)
    }
  }, [])

  const limitReached = !DEV_MODE && credits <= 0

  const avatarState = isListening ? 'listening'
                    : isLoading   ? 'thinking'
                    : isSpeaking  ? 'speaking'
                    : 'idle'

  // ── Confirmar nombre desde onboarding ──────────────────────────────────────
  function handleNameConfirm(name) {
    setUserName(name)
    setShowOnboarding(false)
    setMessages([])
  }

  // ── Función central de envío ────────────────────────────────────────────────
  async function sendMessage(text) {
    if (!text || !text.trim()) return
    if (isProcessing.current) return
    isProcessing.current = true
    setShowBoard(false)
    const trimmed = text.trim()
    if (isLoading || (!DEV_MODE && creditsRef.current <= 0)) { isProcessing.current = false; return }

    const currentMessages = messagesRef.current
    const userMsg         = { role: 'user', content: trimmed }
    const updatedMessages = [...currentMessages, userMsg]

    setMessages(updatedMessages)
    setIsLoading(true)
    setIsSpeaking(false)

    try {
      const apiMessages = updatedMessages.filter((_, i) =>
        !(i === 0 && updatedMessages[0].role === 'assistant')
      )

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 150,
          system: buildSystemPrompt(
            localStorage.getItem(NAME_KEY) || 'estudiante',
            getStats().totalMastered || 0,
            getStats().streak || 0
          ),
          messages: apiMessages,
        }),
      })

      console.log('Status:', res.status)
      console.log('OK:', res.ok)
      const data = await res.json()
      console.log('Data completa:', JSON.stringify(data))

      if (!res.ok) {
        console.error('Error API:', data)
        throw new Error(data.error?.message || `HTTP ${res.status}`)
      }

      const aiText = data.content[0].text
      setMessages(prev => [...prev, { role: 'assistant', content: aiText }])

      if (/perfecto|excelente|perfect|excellent/i.test(aiText)) {
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 2000)
      }

      const hasRepeatMarker = aiText.includes('Repeat after me:') ||
        aiText.includes('Repite:') ||
        aiText.includes('Repite conmigo:') ||
        aiText.includes('Try again:')
      console.log('showBoard: true, hasRepeatMarker:', hasRepeatMarker)
      shouldShowBoardRef.current = true

      const extractPhrase = (text) => {
        const markers = ['Repeat after me:', 'Repite conmigo:', 'Repite:', 'Try again:']
        for (const marker of markers) {
          const idx = text.indexOf(marker)
          if (idx !== -1) {
            const after = text.substring(idx + marker.length).trim()
            const clean = after.replace(/\*\*/g, '').replace(/["""]/g, '')
            const line  = clean.split('\n')[0].trim()
            const match = line.match(/^(.+?[.!?])\s*/)
            return match ? match[1].trim() : line
          }
        }
        return ''
      }

      if (hasRepeatMarker) {
        const phrase = extractPhrase(aiText)
        if (phrase) {
          const isFullSentence = phrase.split(' ').length >= 5
          if (isFullSentence) {
            currentSentenceRef.current = phrase
          }
          setRepeatPhrase(currentSentenceRef.current || phrase)
        }
      } else {
        setRepeatPhrase(currentSentenceRef.current || aiText.replace(/\*\*/g, '').replace(/\*/g, '').trim())
      }

      const newCredits = creditsRef.current - 1
      setCredits(newCredits)
      localStorage.setItem(CREDITS_KEY, String(newCredits))

      const utter = speak(cleanText(aiText))
      utter.onend = () => {
        setShowMicHint(true)
        if (shouldShowBoardRef.current) setShowBoard(true)
      }

      setIsSpeaking(true)
      speakTimerRef.current = setTimeout(() => setIsSpeaking(false), 3000)
    } catch (err) {
      console.error('Error completo:', err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Error: ${err.message || 'Error de conexión. Verifica tu internet e intenta de nuevo.'}`
      }])
    } finally {
      setIsLoading(false)
      isProcessing.current = false
    }
  }

  // ── Envío manual desde botón ────────────────────────────────────────────────
  function handleButtonSend() {
    const text = input.trim()
    if (!text) return
    setInput('')
    sendMessage(text)
  }

  // ── Micrófono — auto-envía al terminar de hablar ───────────────────────────
  function startListening() {
    if (!SpeechRecognition) {
      setMicError('Tu navegador no soporta micrófono. Usa Chrome.')
      return
    }
    if (isListening) {
      try { recognitionRef.current?.stop() } catch {}
      return
    }

    setMicError('')
    setShowMicHint(false)
    setIsListening(true)

    const recognition = new SpeechRecognition()
    recognition.lang            = 'en-US'
    recognition.continuous      = true
    recognition.interimResults  = true
    recognition.maxAlternatives = 1

    let silenceTimer = null
    let finalTranscript = ''

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        }
      }
      clearTimeout(silenceTimer)
      silenceTimer = setTimeout(() => {
        recognition.stop()
        if (finalTranscript.trim()) {
          setIsListening(false)
          sendMessage(finalTranscript.trim())
        }
      }, 2000)
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      if (event.error === 'not-allowed')  setMicError('Permiso de micrófono denegado.')
      else if (event.error === 'no-speech') setMicError('No se detectó voz. Intenta de nuevo.')
      else setMicError('Error de micrófono. Intenta de nuevo.')
    }

    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
  }

  // ── Onboarding: pedir nombre ────────────────────────────────────────────────
  if (showOnboarding) {
    return <NameScreen onConfirm={handleNameConfirm} />
  }

  // ── Chat principal ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#0A1628] text-white">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-[#F0B429]/10 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-12 h-12 rounded-2xl bg-[#0F2040] border border-[#F0B429]/20 flex items-center justify-center text-xl"
        >←</button>

        <div className="flex flex-col items-center">
          <span className="text-[#F0B429] font-black text-lg">🤖 Tutor IA</span>
          <span className="text-xs text-[#F0B429]/40">
            {userName ? `Hola, ${userName}` : 'Real Estate English'}
          </span>
        </div>

        <div className="w-14 h-12 rounded-2xl bg-[#0F2040] border border-[#F0B429]/20 flex flex-col items-center justify-center">
          <span className="text-[10px] text-[#F0B429]/50 leading-none">gratis</span>
          <span className={`text-base font-black leading-tight ${limitReached ? 'text-red-400' : 'text-[#F0B429]'}`}>
            {credits}/{CREDITS_INITIAL}
          </span>
        </div>
      </div>

      {/* ── Avatar (solo cuando hay mensajes) ──────────────────────────────── */}
      {messages.length > 0 && (
        <div className="flex flex-col items-center pt-4 pb-2 flex-shrink-0">
          <div className="w-28 h-28 relative">
            {AVATAR_IMAGE
              ? <img src={AVATAR_IMAGE} alt="Sarah"
                     className="w-full h-full rounded-full object-cover border-2 border-[#F0B429]/30"/>
              : <AvatarSVG state={avatarState}/>
            }
          </div>
          <p className="text-[#F0B429] font-bold text-sm mt-1">Sarah — Tu tutora de inglés</p>
          <span className="mt-1 text-xs bg-[#0F2040] border border-[#F0B429]/20 rounded-full px-3 py-0.5 text-[#F0B429]/70">
            🇺🇸 American English
          </span>
          <p className="text-xs text-[#F0B429]/40 mt-1 h-4">
            {avatarState === 'thinking'  && 'Pensando...'}
            {avatarState === 'speaking'  && 'Hablando...'}
            {avatarState === 'listening' && '🎤 Escuchando...'}
          </p>
        </div>
      )}

      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-3">

        {/* Estado vacío: avatar centrado */}
        {messages.length === 0 && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center h-full gap-4 py-16">
            <div className="w-36 h-36">
              {AVATAR_IMAGE
                ? <img src={AVATAR_IMAGE} alt="Sarah"
                       className="w-full h-full rounded-full object-cover border-2 border-[#F0B429]/30"/>
                : <AvatarSVG state={avatarState}/>
              }
            </div>
            <p className="text-[#F0B429] font-bold text-lg">Sarah — Tu tutora de inglés</p>
            <span className="text-xs bg-[#0F2040] border border-[#F0B429]/20 rounded-full px-3 py-1 text-[#F0B429]/70">
              🇺🇸 American English
            </span>
            <p className="text-white/40 text-sm mt-2">Escribe o habla para comenzar tu clase 🎤</p>
          </div>
        )}

        {messages.slice(-2).map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-base leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#F0B429] text-[#0A1628] font-bold rounded-br-none'
                : 'bg-[#0F2040] text-[#F0B429] border border-[#F0B429]/20 rounded-bl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#0F2040] border border-[#F0B429]/20 rounded-2xl rounded-bl-none px-5 py-3">
              <span className="text-[#F0B429]/60 text-sm animate-pulse">IA escribiendo...</span>
            </div>
          </div>
        )}

        {limitReached && !isLoading && (
          <div className="bg-gradient-to-br from-purple-900/60 to-[#0F2040] rounded-3xl p-6 border border-purple-500/40 text-center mt-2 fade-in">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-[#F0B429] font-black text-2xl mb-2">¡Enganchado?</h3>
            <p className="text-white/70 text-base mb-6">
              Activa tu plan Pro para continuar
            </p>
            <div className="bg-[#F0B429] text-[#0A1628] rounded-2xl py-4 font-black text-lg active:scale-95 transition-transform cursor-pointer">
              Activar Plan Pro →
            </div>
            <p className="text-white/30 text-xs mt-4">Mensajes ilimitados con el tutor IA</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ──────────────────────────────────────────────────────────── */}
      {!limitReached && (
        <div className="px-4 pb-6 pt-3 border-t border-[#F0B429]/10 flex-shrink-0">
          {showMicHint && (
            <p className="text-[#F0B429] text-sm font-bold text-center mb-2 animate-pulse">
              🎤 ¡Tu turno! Toca el micrófono y habla
            </p>
          )}
          {micError && (
            <p className="text-red-400 text-xs text-center mb-2">{micError}</p>
          )}
          {isListening && (
            <p className="text-center text-sm text-red-300 font-bold mb-2 animate-pulse">
              🎤 Escuchando... habla ahora
            </p>
          )}

          <div className="flex gap-3">
            {SpeechRecognition && (
              <button
                onClick={startListening}
                disabled={isLoading}
                className={`w-16 min-h-[64px] rounded-2xl flex items-center justify-center text-2xl
                            flex-shrink-0 active:scale-95 transition-all disabled:opacity-40 ${
                  isListening
                    ? 'bg-red-600 border-2 border-red-400 animate-pulse'
                    : 'bg-[#0F2040] border border-[#F0B429]/30'
                }`}
              >🎤</button>
            )}

            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              disabled={isLoading}
              className="flex-1 min-h-[64px] rounded-2xl bg-[#0F2040] border border-[#F0B429]/20
                         px-4 text-white placeholder-white/30 text-base outline-none
                         focus:border-[#F0B429]/50 disabled:opacity-50"
            />

            <button
              onClick={handleButtonSend}
              disabled={isLoading || !input.trim()}
              className="w-16 min-h-[64px] rounded-2xl bg-[#F0B429] text-[#0A1628] font-black
                         text-2xl disabled:opacity-40 active:scale-95 transition-transform flex-shrink-0"
            >→</button>
          </div>

          <p className="text-center text-xs text-[#F0B429]/30 mt-2">
            {credits} {credits === 1 ? 'mensaje gratuito restante' : 'mensajes gratuitos restantes'}
          </p>
        </div>
      )}

      {/* ── Celebración ────────────────────────────────────────────────────── */}
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="relative w-full h-full overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: '-10px',
                width: '10px',
                height: '14px',
                borderRadius: '2px',
                backgroundColor: ['#F0B429','#FF6B6B','#4ECDC4','#45B7D1','#96CEB4'][i % 5],
                animation: `confettiFall ${0.8 + Math.random() * 1.2}s linear forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}/>
            ))}
          </div>
          <div className="absolute text-[#F0B429] font-black text-5xl drop-shadow-lg animate-bounce">
            ¡Excelente! 🎉
          </div>
        </div>
      )}

      {/* ── Tablero de corrección ──────────────────────────────────────────── */}
      {showBoard && repeatPhrase && (() => {
        const lower = repeatPhrase.toLowerCase()
        const match = sentences.find(s => s.english.toLowerCase() === lower)
                   || sentences.find(s => s.english.toLowerCase().includes(lower))
                   || sentences.find(s => lower.includes(s.english.toLowerCase()))
        const displayText = match?.phonetic || repeatPhrase
        return (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60">
            <div className="bg-[#0A1628] border-2 border-[#F0B429] rounded-3xl px-8 py-8 mx-6 text-center relative w-full max-w-sm">
              <button
                onClick={() => setShowBoard(false)}
                style={{ position: 'absolute', top: '8px', right: '8px', color: '#888', fontSize: '20px', cursor: 'pointer', background: 'none', border: 'none', lineHeight: 1 }}
              >×</button>
              <p className="text-[#F0B429] font-bold text-lg mb-4">🔊 Pronuncia así:</p>
              <p className="font-bold leading-snug mb-2" style={{ color: '#F0B429', fontSize: '20px' }}>
                {repeatPhrase}
              </p>
              {match?.phonetic && (
                <p className="leading-relaxed mb-6" style={{ color: '#A8C8FF', fontSize: '16px' }}>
                  {match.phonetic}
                </p>
              )}
              {SpeechRecognition && (
                <button
                  onClick={() => {
                    setShowMicHint(false)
                    setIsListening(true)
                    const recognition = new SpeechRecognition()
                    recognition.lang           = 'en-US'
                    recognition.continuous     = true
                    recognition.interimResults = true
                    let silenceTimer = null
                    let finalTranscript = ''
                    recognition.onresult = (event) => {
                      for (let i = event.resultIndex; i < event.results.length; i++) {
                        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript
                      }
                      clearTimeout(silenceTimer)
                      silenceTimer = setTimeout(() => {
                        recognition.stop()
                        if (finalTranscript.trim()) {
                          setIsListening(false)
                          sendMessage(finalTranscript.trim())
                        }
                      }, 2000)
                    }
                    recognition.onerror = () => setIsListening(false)
                    recognition.onend   = () => setIsListening(false)
                    recognition.start()
                  }}
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto
                    active:scale-95 transition-all ${
                    isListening
                      ? 'bg-red-600 border-2 border-red-400 animate-pulse'
                      : 'bg-[#F0B429] text-[#0A1628]'
                  }`}
                >🎤</button>
              )}
              <p className="text-white/30 text-xs mt-3">
                {isListening ? '🔴 Escuchando...' : 'Toca para hablar'}
              </p>
            </div>
          </div>
        )
      })()}

      <style>{`
        @keyframes confettiFall {
          to { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
