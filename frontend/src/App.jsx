import { Routes, Route, useLocation } from 'react-router-dom'
import Display from './pages/Display'
import Control from './pages/Control'
import Scenes from './pages/Scenes'
import Library from './pages/Library'
import Help from './pages/Help'
import Player from './pages/Player'
import ToastContainer from './components/common/ToastContainer'
import AuthGate from './components/common/AuthGate'
import PlayerOverlay from './components/player/PlayerOverlay'

function App() {
  // OBS display pages stay clean; every control page gets the shared player
  const isDisplay = useLocation().pathname.startsWith('/display')

  return (
    <>
      <Routes>
        <Route path="/display" element={<Display />} />
        <Route path="/control" element={<AuthGate><Control /></AuthGate>} />
        <Route path="/scenes" element={<AuthGate><Scenes /></AuthGate>} />
        <Route path="/library" element={<AuthGate><Library /></AuthGate>} />
        <Route path="/help" element={<AuthGate><Help /></AuthGate>} />
        <Route path="/player" element={<AuthGate><Player /></AuthGate>} />
        <Route path="/" element={<AuthGate><Control /></AuthGate>} />
      </Routes>
      {!isDisplay && (
        <AuthGate fallback={null}>
          <PlayerOverlay />
        </AuthGate>
      )}
      <ToastContainer />
    </>
  )
}

export default App
