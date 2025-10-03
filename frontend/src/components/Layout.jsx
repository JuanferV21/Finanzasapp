import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  BarChart3, 
  CreditCard, 
  Menu,
  X,
  Search,
  Plus,
  Moon,
  Sun
} from 'lucide-react'
import { useMemo, useState } from 'react'
import UserSettingsMenu from './UserSettingsMenu'
import Button from './ui/Button'
import Input from './ui/Input'
import { useTheme } from '../contexts/ThemeContext'

const Layout = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Transacciones', href: '/transactions', icon: CreditCard },
    { name: 'Reportes', href: '/reports', icon: BarChart3 },
    { name: 'Presupuestos', href: '/budgets', icon: BarChart3 },
    { name: 'Metas', href: '/goals', icon: BarChart3 }, // Nueva pestaña
  ]

  const current = useMemo(() => {
    const item = navigation.find(n => location.pathname.startsWith(n.href))
    return item?.name || 'Dashboard'
  }, [location.pathname])

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen theme-gradient-bg">
      {/* Sidebar móvil */}
      <div className={`fixed inset-0 z-sidebar-mobile lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-4/5 max-w-xs min-w-0 flex-col glass-sidebar transition-all duration-300 sm:w-72 md:w-80">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Finanzas</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <UserSettingsMenu />
          </div>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-60 xl:w-64 lg:min-w-0 lg:max-w-full lg:flex-col">
        <div className="flex flex-col flex-grow glass-sidebar min-w-0 max-w-full">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-lg xl:text-xl font-bold text-gray-900 tracking-tight">Finanzas</h1>
          </div>
          <nav className="flex-1 space-y-4 px-2 py-4 overflow-y-auto">
            <div>
              <p className="px-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">General</p>
              {navigation.slice(0,3).map((item) => {
                const isActive = location.pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 ${
                        isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </div>
            <div>
              <p className="px-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Planeación</p>
              {navigation.slice(3).map((item) => {
                const isActive = location.pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 ${
                        isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </nav>
          <div className="border-t border-gray-200 p-4">
            <UserSettingsMenu />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="lg:pl-60 xl:pl-64 min-w-0 w-full">
        {/* Header móvil */}
        <div className="sticky top-0 z-navbar flex h-14 sm:h-16 shrink-0 items-center gap-x-4 glass-navbar px-2 sm:px-4 shadow-sm lg:hidden">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 text-base sm:text-lg font-semibold leading-6 text-gray-900 truncate">
            Dashboard de Finanzas
          </div>
        </div>

        {/* Topbar desktop */}
        <div className="hidden lg:block sticky top-0 z-navbar glass-navbar h-16 shadow-sm">
          <div className="mx-auto h-full flex items-center gap-4 px-4 md:px-6 lg:px-8">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500">Finanzas / <span className="text-gray-700">{current}</span></div>
              <div className="text-lg font-semibold text-gray-900 truncate">{current}</div>
            </div>
            <div className="hidden xl:flex items-center gap-3">
              <div className="w-64">
                <Input placeholder="Buscar..." aria-label="Buscar" />
              </div>
              <Button variant="secondary" onClick={toggleTheme} aria-label="Cambiar tema">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
            <div className="xl:hidden">
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={toggleTheme} aria-label="Cambiar tema">
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido de la página */}
        <main className="py-4 sm:py-6 w-full min-w-0">
          <div className="mx-auto w-full max-w-full px-2 sm:px-4 md:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout 
