import { useState } from 'react'
import HomeScreen from './components/HomeScreen.jsx'
import Phase1Listen from './components/Phase1Listen.jsx'
import Phase2Speak from './components/Phase2Speak.jsx'
import Phase3Grammar from './components/Phase3Grammar.jsx'

export default function App() {
  const [screen, setScreen] = useState('home') // 'home' | 'phase1' | 'phase2' | 'phase3'

  const navigate = (to) => {
    // Cancel any speech when navigating
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    setScreen(to)
  }

  return (
    <div className="min-h-screen bg-[#0A1628] text-[#F0B429] flex flex-col">
      {screen === 'home' && <HomeScreen onNavigate={navigate} />}
      {screen === 'phase1' && <Phase1Listen onBack={() => navigate('home')} />}
      {screen === 'phase2' && <Phase2Speak onBack={() => navigate('home')} />}
      {screen === 'phase3' && <Phase3Grammar onBack={() => navigate('home')} />}
    </div>
  )
}
