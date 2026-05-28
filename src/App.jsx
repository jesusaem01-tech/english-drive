import { useEffect, useState } from 'react'
import HomeScreen from './components/HomeScreen.jsx'
import Phase1Listen from './components/Phase1Listen.jsx'
import Phase2Speak from './components/Phase2Speak.jsx'
import Phase3Grammar from './components/Phase3Grammar.jsx'
import AIChat from './components/AIChat.jsx'
import DailyLifePhase1Prototype from './prototypes/DailyLifePhase1Prototype.jsx'
import InitialPhase1ListeningPrototype from './prototypes/InitialPhase1ListeningPrototype.jsx'
import LearningPoolPrototype from './prototypes/LearningPoolPrototype.jsx'
import MyPhrasesPrototype from './prototypes/MyPhrasesPrototype.jsx'
import HomeArchitecturePrototype from './prototypes/HomeArchitecturePrototype.jsx'
import Phase2PronunciationTutorPrototype from './prototypes/Phase2PronunciationTutorPrototype.jsx'

const PROTOTYPE_HASH_ROUTES = {
  '#/prototype-initial-phase1': 'prototype-initial-phase1',
  '#/prototype-learning-pool': 'prototype-learning-pool',
  '#/prototype-my-phrases': 'prototype-my-phrases',
  '#/prototype-home-architecture': 'prototype-home-architecture',
  '#/prototype-phase2-pronunciation': 'prototype-phase2-pronunciation',
}

function getInitialScreen() {
  const hashScreen = PROTOTYPE_HASH_ROUTES[window.location.hash]
  if (hashScreen) return hashScreen

  const params = new URLSearchParams(window.location.search)
  return params.get('screen') || 'home'
}

export default function App() {
  const [screen, setScreen] = useState(getInitialScreen)
  const [guestId, setGuestId] = useState(null)

  useEffect(() => {
    async function startGuest() {
      const savedGuestId = localStorage.getItem('habloo_guest_id')

      if (savedGuestId) {
        setGuestId(savedGuestId)
        return
      }

      try {
        const response = await fetch('http://localhost:3000/guest/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        })

        const data = await response.json()

        if (data.success && data.guest_id) {
          localStorage.setItem('habloo_guest_id', data.guest_id)

          localStorage.setItem(
            'habloo_progress',
            JSON.stringify({
              level: 1,
              categories: ['real_estate'],
              tutor: 'sarah',
              phrases_seen: [],
              custom_sentences_count: 0
            })
          )

          setGuestId(data.guest_id)
          console.log('Guest creado:', data.guest_id)
        }
      } catch (error) {
        console.error('Error creando guest:', error)
      }
    }

    startGuest()
  }, [])

  const navigate = (to) => {
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    setScreen(to)
  }

  return (
    <div className="min-h-screen bg-[#0A1628] text-[#F0B429] flex flex-col">
      {screen === 'home' && <HomeScreen onNavigate={navigate} guestId={guestId} />}
      {screen === 'phase1' && <Phase1Listen onBack={() => navigate('home')} guestId={guestId} />}
      {screen === 'phase2' && <Phase2Speak onBack={() => navigate('home')} guestId={guestId} />}
      {screen === 'phase3' && <Phase3Grammar onBack={() => navigate('home')} guestId={guestId} />}
      {screen === 'aichat' && <AIChat onBack={() => navigate('home')} guestId={guestId} />}
      {screen === 'prototype-daily-life-phase1' && (
        <DailyLifePhase1Prototype onBack={() => navigate('home')} guestId={guestId} />
      )}
      {screen === 'prototype-initial-phase1' && (
        <InitialPhase1ListeningPrototype onBack={() => navigate('home')} guestId={guestId} />
      )}
      {screen === 'prototype-learning-pool' && (
        <LearningPoolPrototype onBack={() => navigate('home')} guestId={guestId} />
      )}
      {screen === 'prototype-my-phrases' && (
        <MyPhrasesPrototype onBack={() => navigate('home')} guestId={guestId} />
      )}
      {screen === 'prototype-home-architecture' && (
        <HomeArchitecturePrototype onBack={() => navigate('home')} guestId={guestId} />
      )}
      {screen === 'prototype-phase2-pronunciation' && (
        <Phase2PronunciationTutorPrototype onBack={() => navigate('home')} guestId={guestId} />
      )}
    </div>
  )
}
