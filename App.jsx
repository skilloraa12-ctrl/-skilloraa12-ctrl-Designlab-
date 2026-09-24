import { Routes, Route } from 'react-router-dom'
import NavBar from './NavBar.jsx'
import Home from './Home.jsx'
import Register from './Register.jsx'
import Login from './Login.jsx'
import Academy from './Academy.jsx'
import AcademySubcategory from './AcademySubcategory.jsx'
import Module from './Module.jsx'
import ProgressPage from './Progress.jsx'
import Glossary from './Glossary.jsx'
import Achievements from './Achievements.jsx'
import Profile from './Profile.jsx'
import ColorLabPage from './ColorLabPage.jsx'
import Portfolio from './Portfolio.jsx'
import Career from './Career.jsx'
import NotFound from './NotFound.jsx'
import RequireAuth from './RequireAuth.jsx'
import Welcome from './Welcome.jsx'
import LabsHome from './LabsHome.jsx'
import DictionaryHome from './DictionaryHome.jsx'
import DictionaryCategory from './DictionaryCategory.jsx'
import DictionaryTerm from './DictionaryTerm.jsx'
import GuideHome from './GuideHome.jsx'
import GuideCategory from './GuideCategory.jsx'
import GuideLesson from './GuideLesson.jsx'
import ToolsHome from './ToolsHome.jsx'
import ToolsCategory from './ToolsCategory.jsx'
import ToolsDetail from './ToolsDetail.jsx'
import CheatsheetsPage from './CheatsheetsPage.jsx'

export default function App() {
  return (
    <div className="app">
      <NavBar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/academy" element={<RequireAuth><Academy /></RequireAuth>} />
          <Route path="/academy/:subcategory" element={<RequireAuth><AcademySubcategory /></RequireAuth>} />
          <Route path="/module/:id" element={<RequireAuth><Module /></RequireAuth>} />
          <Route path="/progress" element={<RequireAuth><ProgressPage /></RequireAuth>} />
          <Route path="/glossary" element={<Glossary />} />
          <Route path="/dictionary" element={<DictionaryHome />} />
          <Route path="/dictionary/:category" element={<DictionaryCategory />} />
          <Route path="/dictionary/:category/:term" element={<DictionaryTerm />} />
          <Route path="/guide" element={<GuideHome />} />
          <Route path="/guide/:category" element={<GuideCategory />} />
          <Route path="/guide/:category/:lesson" element={<GuideLesson />} />
          <Route path="/tools" element={<ToolsHome />} />
          <Route path="/tools/:category" element={<ToolsCategory />} />
          <Route path="/tools/:category/:tool" element={<ToolsDetail />} />
          <Route path="/cheatsheets" element={<CheatsheetsPage />} />
          <Route path="/achievements" element={<RequireAuth><Achievements /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/color-lab" element={<RequireAuth><ColorLabPage /></RequireAuth>} />
          <Route path="/labs" element={<RequireAuth><LabsHome /></RequireAuth>} />
          <Route path="/labs/color" element={<RequireAuth><ColorLabPage /></RequireAuth>} />
          <Route path="/portfolio" element={<RequireAuth><Portfolio /></RequireAuth>} />
          <Route path="/career" element={<Career />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}
