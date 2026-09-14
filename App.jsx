import { Routes, Route } from 'react-router-dom'
import NavBar from './NavBar.jsx'
import Home from './Home.jsx'
import Register from './Register.jsx'
import Login from './Login.jsx'
import Academy from './Academy.jsx'
import Module from './Module.jsx'
import ProgressPage from './Progress.jsx'
import Glossary from './Glossary.jsx'
import Achievements from './Achievements.jsx'
import Profile from './Profile.jsx'
import ColorLabPage from './ColorLabPage.jsx'
import Portfolio from './Portfolio.jsx'
import Career from './Career.jsx'
import NotFound from './NotFound.jsx'

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
