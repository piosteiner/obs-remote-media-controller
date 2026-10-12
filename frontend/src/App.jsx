import { Routes, Route } from 'react-router-dom'
import Display from './pages/Display'
import Control from './pages/Control'
import Scenes from './pages/Scenes'
import Library from './pages/Library'
import Help from './pages/Help'
import ToastContainer from './components/common/ToastContainer'
import AuthGate from './components/common/AuthGate'

function App() {
  return (
    <>
      <Routes>
        <Route path="/display" element={<Display />} />
        <Route path="/control" element={<AuthGate><Control /></AuthGate>} />
        <Route path="/scenes" element={<AuthGate><Scenes /></AuthGate>} />
        <Route path="/library" element={<AuthGate><Library /></AuthGate>} />
        <Route path="/help" element={<AuthGate><Help /></AuthGate>} />
        <Route path="/" element={<AuthGate><Control /></AuthGate>} />
      </Routes>
      <ToastContainer />
    </>
  )
}

export default App
