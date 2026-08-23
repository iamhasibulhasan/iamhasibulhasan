import { useState } from "react"
import { SettingsProvider } from "./context/SettingsContext"
import CustomCursor from "./components/CustomCursor"
import NavDock from "./components/NavDock"
import SettingsPanel from "./components/SettingsPanel"
import Sidebar from "./components/Sidebar"
import Hero from "./components/Hero"
import TechMarquee from "./components/TechMarquee"
import About from "./components/About"
import Experience from "./components/Experience"
import Projects from "./components/Projects"
import Skills from "./components/Skills"
import Education from "./components/Education"
import Contact from "./components/Contact"
import Footer from "./components/Footer"

function PortfolioShell() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <CustomCursor />
      <NavDock onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Sidebar />
      <main className="lg:pl-[calc(3.5rem+(100vh-3rem)*0.73)] lg:pr-24">
        <Hero />
        <TechMarquee />
        <About />
        <Experience />
        <Projects />
        <Skills />
        <Education />
        <Contact />
        <Footer />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <PortfolioShell />
    </SettingsProvider>
  )
}
