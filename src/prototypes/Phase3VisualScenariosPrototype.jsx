import { useEffect, useRef, useState } from 'react'

const SCENARIOS = {
  coffee: {
    label: 'Coffee shop',
    icon: '☕',
    location: 'COFFEE SHOP · 09:20 AM',
    character: 'Emily',
    role: 'Barista',
    variant: 'barista',
    dialogue: ['Good morning.', 'What would you like to drink?'],
    dialoguePronunciation: 'Juat wud yu laik tu drink?',
    dialogueMeaning: '¿Qué te gustaría tomar?',
    response: [
      { text: "I'd" },
      { text: ' like a medium coffee, please.' },
    ],
    responsePronunciation: 'Aid laik a mídium cófi plis.',
    responseMeaning: 'Me gustaría un café mediano, por favor.',
    intro: "Today we'll practice common coffee shop situations.",
  },
  home: {
    label: 'Home',
    icon: '⌂',
    location: 'AT HOME · 07:15 AM',
    character: 'Alex',
    role: 'Roommate',
    variant: 'roommate',
    dialogue: ['Could you put the milk', 'in the refrigerator?'],
    dialoguePronunciation: 'Cud yu put de milk in de refríyereitor?',
    dialogueMeaning: '¿Podrías poner la leche en el refrigerador?',
    response: [
      { text: 'Sure, ' },
      { text: "I'll" },
      { text: ' do it right now.' },
    ],
    responsePronunciation: 'Shur, ail dú it rait náu.',
    responseMeaning: 'Claro, lo haré ahora mismo.',
    intro: "Today we'll practice common situations at home.",
  },
  worksite: {
    label: 'Worksite',
    icon: '▦',
    location: 'WORKSITE · 08:40 AM',
    character: 'Marcus',
    role: 'Supervisor',
    variant: 'supervisor',
    dialogue: ['Can you bring me', 'that ladder?'],
    dialoguePronunciation: 'Can yu bring mi dat láder?',
    dialogueMeaning: '¿Puedes traerme esa escalera?',
    response: [
      { text: 'Sure, ' },
      { text: "I'll" },
      { text: ' bring it right now.' },
    ],
    responsePronunciation: 'Shur, ail bring it rait náu.',
    responseMeaning: 'Claro, la traeré ahora mismo.',
    intro: "Today we'll practice common worksite situations.",
  },
}

const INACTIVITY_MESSAGES = [
  'Take your time.',
  'Try saying it out loud.',
  "Don't worry about mistakes.",
]

const ENCOURAGEMENT_MESSAGES = [
  'Nice. Say it once more when you are ready.',
  'Good. Keep the situation in your head.',
  'You are doing well. Keep going.',
]

const HELP_OPTIONS = [
  { key: 'meaning', label: 'Meaning' },
  { key: 'pronunciation', label: 'Pronunciation' },
]

const EXPRESSION_EXPANSIONS = {
  "I'd": 'I would',
  "I'll": 'I will',
  "I've": 'I have',
  gonna: 'going to',
  wanna: 'want to',
  gotta: 'got to / have to',
  lemme: 'let me',
}

const NPC_DIALOGUE_DELAY = 4000
const SARAH_HIDE_DELAY = 4000
const SARAH_TO_NPC_DELAY = 1000
const RESPONSE_REVEAL_DELAY = 700
const INACTIVITY_DELAY = 7500
const HELP_HIDE_DELAY = 10000
const EXPRESSION_HIDE_DELAY = 3200

function Person({ variant }) {
  const outfit = variant === 'barista' ? 'bg-[#244b48]' : variant === 'supervisor' ? 'bg-[#20394c]' : 'bg-[#315369]'

  return (
    <div className="absolute bottom-[11%] right-[7%] h-[46%] w-[28%] min-w-[126px] max-w-[210px] sm:right-[10%] lg:right-[calc(50%-390px)]">
      <div className="absolute left-1/2 top-0 h-20 w-20 -translate-x-1/2 rounded-full bg-[#c98b6c] shadow-xl sm:h-24 sm:w-24" />
      {variant === 'barista' && <div className="absolute left-1/2 top-[14%] h-5 w-24 -translate-x-1/2 rounded-t-full bg-[#182e32]" />}
      {variant === 'supervisor' && <div className="absolute left-1/2 top-[-5px] h-8 w-24 -translate-x-1/2 rounded-t-full bg-[#f6c542]" />}
      <div className={`absolute inset-x-[8%] bottom-0 top-[20%] rounded-t-[45%] shadow-2xl ${outfit}`} />
      {variant === 'barista' && <div className="absolute inset-x-[20%] bottom-0 top-[39%] rounded-t-2xl bg-[#e4d5ba]/85" />}
      {variant === 'supervisor' && <div className="absolute inset-x-[20%] bottom-0 top-[37%] bg-[#f6c542]/90" />}
      {variant === 'roommate' && <div className="absolute left-[24%] right-[24%] top-[51%] h-3 rounded-full bg-[#5BE7FF]/60" />}
    </div>
  )
}

function CoffeeScene() {
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(145deg,#315b56,#17353b_58%,#0b1c29)]" />
      <div className="absolute left-[5%] top-[15%] h-[25%] w-[51%] max-w-[560px] rounded-2xl border border-[#FFCC70]/25 bg-[#10282c]/90 p-4 shadow-2xl sm:left-[8%]">
        <div className="flex items-center justify-between">
          <div className="h-2 w-[38%] rounded-full bg-[#FFCC70]/75" />
          <div className="text-[8px] font-black tracking-[0.2em] text-[#FFCC70]/70">MENU</div>
        </div>
        {[76, 62, 70].map((width) => <div key={width} className="mt-3 h-1.5 rounded-full bg-white/15" style={{ width: `${width}%` }} />)}
      </div>
      <div className="absolute bottom-[23%] left-[57%] h-[19%] w-[18%] max-w-[210px] rounded-t-xl border border-white/15 bg-[#263438] shadow-2xl">
        <div className="absolute left-[12%] right-[12%] top-[16%] h-[36%] rounded-md bg-[#111d22]">
          <div className="absolute left-[14%] top-[18%] h-2 w-2 rounded-full bg-[#B8FF2C]/70" />
          <div className="absolute right-[14%] top-[18%] h-2 w-2 rounded-full bg-[#FFCC70]/80" />
        </div>
        <div className="absolute bottom-[10%] left-[20%] h-[31%] w-[18%] rounded-b-md bg-[#151f22]" />
        <div className="absolute bottom-[10%] right-[20%] h-[31%] w-[18%] rounded-b-md bg-[#151f22]" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[25%] bg-[linear-gradient(180deg,#b98762,#704a36)] shadow-2xl" />
      {[13, 25, 37].map((left) => (
        <div key={left} className="absolute bottom-[24%] h-14 w-10 rounded-b-xl bg-[#f6f0e4]/90 shadow-lg" style={{ left: `${left}%` }}>
          <div className="absolute inset-x-0 top-0 h-3 bg-[#44342e]" />
          <div className="absolute -right-3 top-5 h-5 w-4 rounded-r-full border-2 border-l-0 border-[#f6f0e4]/90" />
        </div>
      ))}
      <div className="absolute bottom-[24%] left-[48%] h-16 w-5 rounded-t-full bg-[#d4b186]/75 shadow-lg" />
      <div className="absolute bottom-[36%] left-[46%] h-2 w-14 rounded-full bg-[#eff7f0]/85" />
    </>
  )
}

function HomeScene() {
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(145deg,#375a70,#1c3045_58%,#0c1b2d)]" />
      <div className="absolute inset-x-0 bottom-0 h-[25%] bg-[#665449]" />
      <div className="absolute bottom-[18%] left-[7%] h-[20%] w-[53%] rounded-t-xl bg-[#ad805d] shadow-xl" />
      <div className="absolute bottom-[18%] right-[8%] h-[66%] w-[31%] rounded-2xl border border-white/15 bg-[linear-gradient(135deg,#c9d5d7,#789198)] shadow-2xl">
        <div className="absolute inset-x-0 top-[43%] h-px bg-[#43565d]/60" />
      </div>
      <div className="absolute bottom-[38%] left-[28%] h-16 w-9 rounded-b-lg rounded-t-md bg-[#eff7f0]">
        <div className="absolute inset-x-0 top-0 h-3 rounded-t-md bg-[#5BE7FF]/80" />
      </div>
    </>
  )
}

function WorksiteScene() {
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#54778a,#233b4a_52%,#172a31)]" />
      <div className="absolute inset-x-0 bottom-0 h-[28%] bg-[linear-gradient(160deg,#5b554c,#303638)]" />
      <div className="absolute bottom-[18%] left-[29%] h-[70%] w-[17%] -rotate-[9deg]">
        <div className="absolute inset-y-0 left-0 w-2 rounded-full bg-[#dce7e3]" />
        <div className="absolute inset-y-0 right-0 w-2 rounded-full bg-[#dce7e3]" />
        {[10, 23, 36, 49, 62, 75, 88].map((top) => <div key={top} className="absolute left-1 right-1 h-2 rounded-full bg-[#dce7e3]" style={{ top: `${top}%` }} />)}
      </div>
    </>
  )
}

function SceneVisual({ scenario }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {scenario === 'coffee' && <CoffeeScene />}
      {scenario === 'home' && <HomeScene />}
      {scenario === 'worksite' && <WorksiteScene />}
      <Person variant={SCENARIOS[scenario].variant} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,12,22,.06),transparent_43%,rgba(3,12,22,.78))]" />
    </div>
  )
}

function NpcDialogue({ active, isOpen, isRecall, onClose, onListen, onMeaning, onReopen }) {
  return (
    <div className="absolute bottom-[43%] right-[20%] z-20 flex items-end gap-2 sm:bottom-[45%] sm:right-[22%] lg:right-[calc(50%-265px)]">
      <div className={`origin-bottom-right transition-all duration-500 ${isOpen ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-2 scale-95 opacity-0'}`}>
        <div className="relative w-[min(78vw,390px)] rounded-[24px] rounded-br-md border border-white/15 bg-[#071725]/92 px-5 py-4 shadow-2xl backdrop-blur-xl sm:px-6 sm:py-5">
          <span className="absolute -bottom-2 right-4 h-4 w-4 rotate-45 border-b border-r border-white/15 bg-[#071725]/92" />
          <p className="text-xs font-semibold uppercase leading-5 tracking-[0.14em] text-[#B8FF2C]/90">{active.character} <span className="font-medium text-white/50">· {active.role}</span></p>
          <p className="mt-2.5 text-xl font-semibold leading-snug sm:text-2xl">{active.dialogue.map((line) => <span key={line} className="block">{line}</span>)}</p>
          {isRecall && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3">
              <button type="button" onClick={onListen} className="rounded-full border border-[#5BE7FF]/30 bg-[#5BE7FF]/10 px-3.5 py-2 text-xs font-semibold leading-5 tracking-[0.01em] text-[#5BE7FF] transition hover:bg-[#5BE7FF]/20 active:scale-95 sm:text-[13px]">🔊 Listen Again</button>
              <button type="button" onClick={onMeaning} className="rounded-full border border-white/15 bg-white/[0.05] px-3.5 py-2 text-xs font-semibold leading-5 tracking-[0.01em] text-white/75 transition hover:bg-white/[0.1] active:scale-95 sm:text-[13px]">ⓘ Meaning</button>
            </div>
          )}
          <button type="button" onClick={onClose} className="sr-only">Close dialogue</button>
        </div>
      </div>
      <button type="button" onClick={onReopen} aria-label={`Reopen ${active.character} dialogue`} className={`mb-[-18px] grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#B8FF2C]/35 bg-[#102a32]/95 text-base shadow-[0_0_22px_rgba(184,255,44,.15)] backdrop-blur-xl transition hover:border-[#B8FF2C]/70 hover:bg-[#B8FF2C]/15 active:scale-95 ${isOpen ? 'pointer-events-none scale-75 opacity-0' : 'scale-100 opacity-100'}`}>💬</button>
    </div>
  )
}

function Sarah({ message, isInactive, onRecall }) {
  return (
    <div className="absolute bottom-[9%] left-4 z-30 flex max-w-[calc(100%-2rem)] items-end gap-2 sm:left-[8%] lg:left-[calc(50%-430px)]">
      <button type="button" onClick={onRecall} disabled={isInactive} aria-label="Open Sarah mentor message" className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border bg-[#102a3c]/95 text-sm font-semibold text-[#5BE7FF] shadow-lg backdrop-blur-xl transition active:scale-95 ${isInactive ? 'cursor-default border-white/15 opacity-35' : 'border-[#5BE7FF]/45 hover:border-[#5BE7FF]/75 hover:bg-[#5BE7FF]/15'}`}>S</button>
      <div className={`max-w-[300px] rounded-2xl rounded-bl-sm border border-[#5BE7FF]/20 bg-[#0b2030]/95 px-4 py-3 text-sm font-semibold leading-5 text-white/90 shadow-xl backdrop-blur-xl transition-all duration-500 ${message ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}>
        <span className="mr-1.5 font-semibold text-[#5BE7FF]">Sarah</span>{message}
      </div>
    </div>
  )
}

function ConversationCard({ active, cardRef, onMouseEnter, onMouseLeave }) {
  return (
    <div ref={cardRef} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} className="absolute bottom-[calc(100%+12px)] left-1/2 z-30 max-h-[min(52svh,430px)] w-[min(calc(100%-2rem),680px)] -translate-x-1/2 overflow-y-auto rounded-2xl border border-white/15 bg-[#0a1c2b]/98 p-5 text-left shadow-2xl backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#FFCC70]">☕ {active.character}</p>
      <p className="mt-2 text-base font-semibold leading-6 text-white/90">{active.dialogue.join(' ')}</p>
      <p className="text-sm leading-6 text-[#5BE7FF]/90">{active.dialoguePronunciation}</p>
      <p className="mt-1 text-sm leading-6 text-white/70">{active.dialogueMeaning}</p>
      <div className="my-4 h-px bg-white/10" />
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5BE7FF]">👤 You</p>
      <p className="mt-2 text-base font-semibold leading-6 text-white/90">{active.response.map((part) => part.text).join('')}</p>
      <p className="text-sm leading-6 text-[#5BE7FF]/90">{active.responsePronunciation}</p>
      <p className="mt-1 text-sm leading-6 text-white/70">{active.responseMeaning}</p>
    </div>
  )
}

export default function Phase3VisualScenariosPrototype({ onBack }) {
  const [scenario, setScenario] = useState('coffee')
  const [showDialogue, setShowDialogue] = useState(false)
  const [showResponse, setShowResponse] = useState(false)
  const [isDialogueRecall, setIsDialogueRecall] = useState(false)
  const [dialoguePulse, setDialoguePulse] = useState(0)
  const [activeHelp, setActiveHelp] = useState(null)
  const [isHelpHovered, setIsHelpHovered] = useState(false)
  const [expandedExpression, setExpandedExpression] = useState(null)
  const [sarahMessage, setSarahMessage] = useState(null)
  const [activityPulse, setActivityPulse] = useState(0)
  const [activeAction, setActiveAction] = useState(null)
  const reminderIndex = useRef(0)
  const encouragementIndex = useRef(0)
  const lastSarahMessage = useRef('Take your time.')
  const helpCardRef = useRef(null)
  const showDialogueRef = useRef(false)
  const active = SCENARIOS[scenario]

  const registerActivity = () => {
    setActivityPulse((current) => current + 1)
    setSarahMessage(null)
  }

  useEffect(() => {
    lastSarahMessage.current = active.intro
    setShowDialogue(false)
    setShowResponse(false)
    setSarahMessage(active.intro)
    const hideSarahTimer = setTimeout(() => setSarahMessage(null), SARAH_HIDE_DELAY)
    const showDialogueTimer = setTimeout(() => {
      setSarahMessage(null)
      setShowDialogue(true)
    }, SARAH_HIDE_DELAY + SARAH_TO_NPC_DELAY)
    const showResponseTimer = setTimeout(() => setShowResponse(true), SARAH_HIDE_DELAY + SARAH_TO_NPC_DELAY + RESPONSE_REVEAL_DELAY)
    const hideDialogueTimer = setTimeout(() => setShowDialogue(false), SARAH_HIDE_DELAY + SARAH_TO_NPC_DELAY + NPC_DIALOGUE_DELAY)
    return () => {
      clearTimeout(hideSarahTimer)
      clearTimeout(showDialogueTimer)
      clearTimeout(showResponseTimer)
      clearTimeout(hideDialogueTimer)
    }
  }, [active.intro, scenario])

  useEffect(() => {
    if (showDialogue) return undefined
    let hideTimer
    const timer = setTimeout(() => {
      const message = INACTIVITY_MESSAGES[reminderIndex.current % INACTIVITY_MESSAGES.length]
      lastSarahMessage.current = message
      setSarahMessage(message)
      reminderIndex.current += 1
      hideTimer = setTimeout(() => setSarahMessage(null), SARAH_HIDE_DELAY)
    }, INACTIVITY_DELAY)
    return () => {
      clearTimeout(timer)
      clearTimeout(hideTimer)
    }
  }, [activityPulse, scenario, showDialogue])

  useEffect(() => {
    if (!dialoguePulse) return undefined
    setSarahMessage(null)
    setShowDialogue(true)
    const timer = setTimeout(() => setShowDialogue(false), NPC_DIALOGUE_DELAY)
    return () => clearTimeout(timer)
  }, [dialoguePulse])

  useEffect(() => {
    showDialogueRef.current = showDialogue
    if (showDialogue) setSarahMessage(null)
  }, [showDialogue])

  useEffect(() => {
    if (!activeHelp || isHelpHovered) return undefined
    const timer = setTimeout(() => setActiveHelp(null), HELP_HIDE_DELAY)
    return () => clearTimeout(timer)
  }, [activeHelp, isHelpHovered])

  useEffect(() => {
    if (activeHelp !== 'meaning') return undefined
    const trackHelpHover = (event) => setIsHelpHovered(helpCardRef.current?.contains(event.target) ?? false)
    window.addEventListener('mousemove', trackHelpHover)
    return () => window.removeEventListener('mousemove', trackHelpHover)
  }, [activeHelp])

  useEffect(() => {
    if (!expandedExpression) return undefined
    const timer = setTimeout(() => setExpandedExpression(null), EXPRESSION_HIDE_DELAY)
    return () => clearTimeout(timer)
  }, [expandedExpression])

  const chooseScenario = (nextScenario) => {
    setScenario(nextScenario)
    setIsDialogueRecall(false)
    setActiveHelp(null)
    setIsHelpHovered(false)
    setExpandedExpression(null)
    setActiveAction(null)
    setActivityPulse((current) => current + 1)
  }

  const triggerAction = (action) => {
    setActiveAction(action)
    registerActivity()
    setTimeout(() => setActiveAction(null), 1500)
    if (action === 'repeat' && !showDialogue) {
      const message = ENCOURAGEMENT_MESSAGES[encouragementIndex.current % ENCOURAGEMENT_MESSAGES.length]
      encouragementIndex.current += 1
      lastSarahMessage.current = message
      setTimeout(() => {
        if (!showDialogueRef.current) setSarahMessage(message)
      }, 350)
      setTimeout(() => setSarahMessage(null), SARAH_HIDE_DELAY + 350)
    }
  }

  const toggleHelp = (key) => {
    setActiveHelp((current) => current === key ? null : key)
    setIsHelpHovered(false)
    registerActivity()
  }

  const reopenDialogue = () => {
    setIsDialogueRecall(true)
    setDialoguePulse((current) => current + 1)
    registerActivity()
  }

  const showSarahRecall = () => {
    setSarahMessage(lastSarahMessage.current)
    setTimeout(() => setSarahMessage(null), SARAH_HIDE_DELAY)
  }

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#030c18] font-sans text-white">
      <section className="relative h-[66svh] min-h-[430px] overflow-hidden sm:h-[69svh]">
        <SceneVisual scenario={scenario} />
        <NpcDialogue
          active={active}
          isOpen={showDialogue}
          isRecall={isDialogueRecall}
          onClose={() => setShowDialogue(false)}
          onListen={() => triggerAction('listen')}
          onMeaning={() => toggleHelp('meaning')}
          onReopen={reopenDialogue}
        />
        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1480px] flex-col px-4 pb-5 pt-4 sm:px-6 lg:px-10">
          <header className="flex items-center justify-between">
            <button type="button" onClick={onBack} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-[#071725]/70 text-xl text-white/85 backdrop-blur-xl transition hover:border-white/35 active:scale-95" aria-label="Back">‹</button>
            <p className="rounded-full border border-white/10 bg-[#071725]/60 px-3 py-2 text-[11px] font-semibold leading-4 tracking-[0.14em] text-white/70 backdrop-blur-xl sm:text-xs">{active.location}</p>
            <div className="h-11 w-11" />
          </header>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {Object.entries(SCENARIOS).map(([key, option]) => (
              <button key={key} type="button" onClick={() => chooseScenario(key)} className={`rounded-full border px-3.5 py-2.5 text-[13px] font-semibold leading-5 tracking-[0.01em] backdrop-blur-xl transition active:scale-95 sm:px-4 sm:text-sm ${scenario === key ? 'border-[#B8FF2C]/70 bg-[#B8FF2C] text-[#071321]' : 'border-white/15 bg-[#071725]/70 text-white/80 hover:border-white/30'}`}>
                <span className="mr-1.5">{option.icon}</span>{option.label}
              </button>
            ))}
          </div>

        </div>
        <Sarah message={sarahMessage} isInactive={showDialogue} onRecall={showSarahRecall} />
      </section>

      <section className="relative z-20 -mt-14 rounded-t-[32px] border-t border-white/15 bg-[#061321]/96 px-4 pb-6 pt-6 shadow-[0_-22px_70px_rgba(0,0,0,.38)] backdrop-blur-xl sm:px-6">
        <div className={`mx-auto w-full max-w-3xl transition-all duration-500 ${showResponse ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}>
          <p className={`mx-auto max-w-2xl text-center text-[28px] font-semibold leading-snug text-white transition-opacity duration-700 sm:text-4xl ${showDialogue ? 'opacity-40' : 'opacity-100'}`}>
            {active.response.map((part) => EXPRESSION_EXPANSIONS[part.text] ? (
              <button key={part.text} type="button" onClick={() => { setExpandedExpression(part.text); registerActivity() }} className="rounded-md border-b border-dashed border-[#B8FF2C]/70 px-0.5 text-[#B8FF2C] transition hover:bg-[#B8FF2C]/10 active:scale-95">
                {expandedExpression === part.text ? EXPRESSION_EXPANSIONS[part.text] : part.text}
              </button>
            ) : <span key={part.text}>{part.text}</span>)}
          </p>

          <div className="mx-auto mt-5 flex w-full max-w-xl justify-center gap-4 sm:gap-5">
            <button type="button" onClick={() => triggerAction('listen')} className={`min-h-14 flex-1 rounded-full border px-6 py-4 text-base font-semibold leading-6 tracking-[0.015em] shadow-[0_8px_24px_rgba(0,0,0,.22)] transition duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[.98] sm:min-h-16 sm:px-9 sm:text-lg ${activeAction === 'listen' ? 'border-[#5BE7FF]/90 bg-[#5BE7FF]/20 text-[#5BE7FF] shadow-[0_0_28px_rgba(91,231,255,.2)]' : 'border-[#5BE7FF]/35 bg-[#0b2130]/90 text-white shadow-[0_0_20px_rgba(91,231,255,.08)] hover:border-[#5BE7FF]/65 hover:bg-[#5BE7FF]/12'}`}>🔊 Listen</button>
            <button type="button" onClick={() => triggerAction('repeat')} className={`min-h-14 flex-1 rounded-full border px-6 py-4 text-base font-semibold leading-6 tracking-[0.015em] shadow-[0_8px_24px_rgba(0,0,0,.22)] transition duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[.98] sm:min-h-16 sm:px-9 sm:text-lg ${activeAction === 'repeat' ? 'border-[#B8FF2C]/90 bg-[#B8FF2C]/20 text-[#B8FF2C] shadow-[0_0_28px_rgba(184,255,44,.18)]' : 'border-[#B8FF2C]/30 bg-[#122319]/80 text-white shadow-[0_0_20px_rgba(184,255,44,.06)] hover:border-[#B8FF2C]/60 hover:bg-[#B8FF2C]/10'}`}>🎤 Repeat</button>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {HELP_OPTIONS.map((option) => (
              <button key={option.key} type="button" onClick={() => toggleHelp(option.key)} className={`min-h-11 rounded-full border px-5 py-2.5 text-sm font-semibold leading-5 tracking-[0.01em] transition duration-300 active:scale-[.98] sm:min-h-12 sm:px-6 sm:text-[15px] ${activeHelp === option.key ? 'border-[#5BE7FF]/65 bg-[#5BE7FF]/14 text-[#5BE7FF] shadow-[0_0_18px_rgba(91,231,255,.1)]' : 'border-white/15 bg-white/[0.055] text-white/80 hover:border-white/30 hover:bg-white/[0.09] hover:text-white'}`}>
                ⓘ {option.label}
              </button>
            ))}
          </div>

          {activeHelp === 'meaning' && <ConversationCard active={active} cardRef={helpCardRef} onMouseEnter={() => setIsHelpHovered(true)} onMouseLeave={() => setIsHelpHovered(false)} />}
          {activeHelp === 'pronunciation' && <p className="mx-auto mt-4 max-w-lg rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-center text-base font-semibold leading-6 text-[#5BE7FF]">{active.responsePronunciation}</p>}
        </div>
      </section>
    </main>
  )
}
