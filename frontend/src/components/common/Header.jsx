import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MonitorPlay, Layout, Image, Layers, HelpCircle, Youtube, Sun, Moon } from 'lucide-react'

// light or dark: the class on <html> (set before the first paint by index.html), remembered as obs-theme
function ThemeSwitch() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const toggle = () => {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.setItem('obs-theme', next ? 'dark' : 'light') } catch { /* private window: for this visit */ }
    setDark(next)
  }
  const label = dark ? 'Switch to light mode' : 'Switch to dark mode'
  return (
    <button type="button" onClick={toggle} title={label} aria-label={label}
      className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white">
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}

function Header() {
  const location = useLocation()

  const navItems = [
    { path: '/control', label: 'Control', icon: Layout },
    { path: '/scenes', label: 'Scenes', icon: Layers },
    { path: '/library', label: 'Library', icon: Image },
    { path: '/player', label: 'Player', icon: Youtube },
    { path: '/help', label: 'Help', icon: HelpCircle },
  ]

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <MonitorPlay className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            <span className="hidden md:inline font-bold text-xl text-gray-900 dark:text-gray-100">
              OBS Media Controller
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex space-x-1 ml-auto mr-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path || 
                             (location.pathname === '/' && item.path === '/control')
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
          </nav>
          <ThemeSwitch />
        </div>
      </div>
    </header>
  )
}

export default Header
