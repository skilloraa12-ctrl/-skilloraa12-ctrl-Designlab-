import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import Home from './pages/Home.jsx'
import Register from './pages/Register.jsx'
import Login from './pages/Login.jsx'
import Academy from './pages/Academy.jsx'
import Module from './pages/Module.jsx'
import ProgressPage from './pages/Progress.jsx'
import Glossary from './pages/Glossary.jsx'
import Achievements from './pages/Achievements.jsx'
import Profile from './pages/Profile.jsx'
import ColorLabPage from './pages/ColorLabPage.jsx'
import Portfolio from './pages/Portfolio.jsx'
import Career from './pages/Career.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <div className="app">
      <NavBar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/module/:id" element={<Module />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/glossary" element={<Glossary />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/color-lab" element={<ColorLabPage />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/career" element={<Career />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}
