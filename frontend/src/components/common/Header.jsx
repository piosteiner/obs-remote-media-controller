import { Link, useLocation } from 'react-router-dom'
import { MonitorPlay, Layout, Image, Layers, HelpCircle } from 'lucide-react'

function Header() {
  const location = useLocation()

  const navItems = [
    { path: '/control', label: 'Control', icon: Layout },
    { path: '/scenes', label: 'Scenes', icon: Layers },
    { path: '/library', label: 'Library', icon: Image },
    { path: '/help', label: 'Help', icon: HelpCircle },
  ]

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <MonitorPlay className="w-8 h-8 text-primary-600" />
            <span className="font-bold text-xl text-gray-900">
              OBS Media Controller
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path || 
                             (location.pathname === '/' && item.path === '/control')
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header
