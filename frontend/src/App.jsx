import { Routes, Route } from 'react-router-dom'
import Display from './pages/Display'
import Control from './pages/Control'
import Scenes from './pages/Scenes'
import Library from './pages/Library'
import ToastContainer from './components/common/ToastContainer'

function App() {
  return (
    <>
      <Routes>
        <Route path="/display" element={<Display />} />
        <Route path="/control" element={<Control />} />
        <Route path="/scenes" element={<Scenes />} />
        <Route path="/library" element={<Library />} />
        <Route path="/" element={<Control />} />
      </Routes>
      <ToastContainer />
    </>
  )
}

export default App
