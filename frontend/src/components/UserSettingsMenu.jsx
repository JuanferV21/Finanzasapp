import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  User, 
  Settings, 
  Lock, 
  Bell, 
  Moon, 
  Sun, 
  Download, 
  Info, 
  LogOut, 
  ChevronDown,
  Edit,
  Shield,
  Palette,
  Database,
  X,
  Check,
  AlertCircle,
  HelpCircle,
  Mail,
  BarChart3
} from 'lucide-react'

const UserSettingsMenu = () => {
  const { user, logout, updateUser } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const menuRef = useRef(null)
  const settingsRef = useRef(null)
  const helpRef = useRef(null)
  
  // Estados para formularios
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || ''
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [preferences, setPreferences] = useState({
    emailNotifications: user?.preferences?.emailNotifications ?? true,
    pushNotifications: user?.preferences?.pushNotifications ?? false,
    goalReminders: user?.preferences?.goalReminders ?? true,
    darkMode: (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')) || false,
  })
  
  // Estados para feedback
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [errors, setErrors] = useState({})

  // Cerrar menús al hacer clic fuera o presionar ESC
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false)
      }
      if (helpRef.current && !helpRef.current.contains(event.target)) {
        setShowHelp(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (showHelp) {
          setShowHelp(false)
        } else if (showSettings) {
          setShowSettings(false)
        } else if (isOpen) {
          setIsOpen(false)
        }
      }
    }

    if (isOpen || showSettings || showHelp) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [isOpen, showSettings, showHelp])

  // Actualizar formularios cuando cambie el usuario
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || ''
      })
      setPreferences({
        emailNotifications: user.preferences?.emailNotifications ?? true,
        pushNotifications: user.preferences?.pushNotifications ?? false,
        goalReminders: user.preferences?.goalReminders ?? true,
        darkMode: (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')) || false,
      })
    }
  }, [user])

  const handleLogout = () => {
    logout()
    setIsOpen(false)
    setShowSettings(false)
    setShowHelp(false)
  }

  const openSettings = () => {
    setIsOpen(false)
    setShowSettings(true)
    setShowHelp(false)
  }

  const openHelp = () => {
    setIsOpen(false)
    setShowSettings(false)
    setShowHelp(true)
  }

  const closeAllMenus = () => {
    setIsOpen(false)
    setShowSettings(false)
    setShowHelp(false)
  }

  // Función para mostrar mensajes
  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  // Función para limpiar errores
  const clearErrors = () => {
    setErrors({})
  }

  // Actualizar perfil
  const handleUpdateProfile = async () => {
    setLoading(true)
    clearErrors()
    
    try {
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profileForm)
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors) {
          const errorObj = {}
          data.errors.forEach(error => {
            errorObj[error.path] = error.msg
          })
          setErrors(errorObj)
        } else {
          showMessage('error', data.message || 'Error al actualizar perfil')
        }
        return
      }

      showMessage('success', 'Perfil actualizado exitosamente')
      if (updateUser) {
        updateUser(data.user)
      }
    } catch (error) {
      showMessage('error', 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  // Cambiar contraseña
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrors({ confirmPassword: 'Las contraseñas no coinciden' })
      return
    }

    setLoading(true)
    clearErrors()
    
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors) {
          const errorObj = {}
          data.errors.forEach(error => {
            errorObj[error.path] = error.msg
          })
          setErrors(errorObj)
        } else {
          showMessage('error', data.message || 'Error al cambiar contraseña')
        }
        return
      }

      showMessage('success', 'Contraseña cambiada exitosamente')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      // Cerrar sesión después de cambiar contraseña
      setTimeout(() => {
        logout()
      }, 2000)
    } catch (error) {
      showMessage('error', 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  // Actualizar preferencias
  const handleUpdatePreferences = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          emailNotifications: preferences.emailNotifications,
          pushNotifications: preferences.pushNotifications,
          goalReminders: preferences.goalReminders,
        })
      })

      const data = await response.json()

      if (!response.ok) {
        showMessage('error', data.message || 'Error al actualizar preferencias')
        return
      }

      showMessage('success', 'Preferencias actualizadas exitosamente')
      if (updateUser) {
        updateUser({ ...user, preferences: data.preferences })
      }
      
    } catch (error) {
      showMessage('error', 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  // Toggle dark mode (solo cliente)
  const toggleDarkMode = (enabled) => {
    if (enabled) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
    setPreferences(prev => ({ ...prev, darkMode: enabled }))
  }

  // Cargar preferencia de tema al montar
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const isDark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    if (isDark) {
      document.documentElement.classList.add('dark')
      setPreferences(prev => ({ ...prev, darkMode: true }))
    }
  }, [])

  // Exportar datos
  const handleExportData = async (type) => {
    try {
      let url = ''
      let filename = ''
      
      switch (type) {
        case 'transactions':
          url = '/api/transactions/export'
          filename = `transacciones_${new Date().toISOString().split('T')[0]}.csv`
          break
        case 'reports':
          url = '/api/stats/export?type=summary'
          filename = `reporte_resumen_${new Date().toISOString().split('T')[0]}.csv`
          break
        case 'all':
          // Exportar múltiples archivos
          await Promise.all([
            handleExportData('transactions'),
            handleExportData('reports')
          ])
          return
        default:
          return
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        showMessage('error', 'Error al exportar datos')
        return
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      showMessage('success', 'Datos exportados exitosamente')
    } catch (error) {
      showMessage('error', 'Error al exportar datos')
    }
  }

  const menuItems = [
    {
      id: 'profile',
      label: 'Perfil',
      icon: User,
      description: 'Editar información personal'
    },
    {
      id: 'security',
      label: 'Seguridad',
      icon: Lock,
      description: 'Cambiar contraseña y configuración de seguridad'
    },
    {
      id: 'notifications',
      label: 'Notificaciones',
      icon: Bell,
      description: 'Configurar alertas y recordatorios'
    },
    {
      id: 'data',
      label: 'Datos',
      icon: Database,
      description: 'Exportar y gestionar tus datos'
    },
    {
      id: 'about',
      label: 'Acerca de',
      icon: Info,
      description: 'Información de la aplicación'
    }
  ]

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* Botón del perfil */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
        >
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
              <User className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-gray-700 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <ChevronDown 
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {/* Menú dropdown pequeño */}
        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-64 glass-dropdown overflow-hidden z-dropdown animate-fade-in">
            {/* Header del menú pequeño */}
            <div className="p-3 border-b border-white/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{user?.name}</h3>
                  <p className="text-xs text-gray-600">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Opciones del menú */}
            <div className="p-2">
              <button
                onClick={openSettings}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-white/30 rounded-lg transition-colors duration-200"
              >
                <Settings className="h-4 w-4" />
                Configuración
              </button>
              
              <button
                onClick={openHelp}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-white/30 rounded-lg transition-colors duration-200"
              >
                <HelpCircle className="h-4 w-4" />
                Ayuda
              </button>
              
              <div className="border-t border-white/30 mt-2 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50/50 rounded-lg transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ventana flotante de configuraciones usando Portal */}
      {showSettings && createPortal(
        <div className="fixed inset-0 z-dropdown flex items-center justify-center p-4">
          {/* Overlay de fondo */}
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm" 
            onClick={() => setShowSettings(false)}
          />
          
          {/* Ventana del menú */}
          <div 
            ref={settingsRef} 
            className="relative w-full max-w-lg max-h-[90vh] overflow-hidden glass-modal animate-fade-in"
          >
            {/* Header del menú */}
            <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 p-4 border-b border-white/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Configuración</h3>
                    <p className="text-sm text-gray-600">Administra tu cuenta y preferencias</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Contenido con scroll */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Navegación por pestañas */}
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                        activeTab === item.id
                          ? 'bg-blue-50/50 text-blue-700 border border-blue-200/50 shadow-sm'
                          : 'text-gray-600 hover:bg-white/30 hover:text-gray-900 hover:shadow-sm'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-center">{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Mensaje de feedback */}
                {message.text && (
                  <div className={`p-3 rounded-lg text-sm flex items-center gap-2 mb-4 ${
                    message.type === 'success' 
                      ? 'bg-green-50/50 text-green-700 border border-green-200/50' 
                      : 'bg-red-50/50 text-red-700 border border-red-200/50'
                  }`}>
                    {message.type === 'success' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    {message.text}
                  </div>
                )}

                {/* Contenido de las pestañas */}
                <div className="space-y-6">
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-base font-semibold text-gray-800 mb-4">
                    <Edit className="h-5 w-5" />
                    Información personal
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className={`w-full px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Ingresa tu nombre completo"
                      />
                      {errors.name && (
                        <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Correo electrónico</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className={`w-full px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="tu@email.com"
                      />
                      {errors.email && (
                        <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                      )}
                    </div>
                    <button 
                      onClick={handleUpdateProfile}
                      disabled={loading}
                      className="w-full btn-primary text-sm py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-base font-semibold text-gray-800 mb-4">
                    <Shield className="h-5 w-5" />
                    Configuración de seguridad
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña actual</label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className={`w-full px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.currentPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Ingresa tu contraseña actual"
                      />
                      {errors.currentPassword && (
                        <p className="text-xs text-red-600 mt-1">{errors.currentPassword}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nueva contraseña</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className={`w-full px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.newPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Ingresa tu nueva contraseña"
                      />
                      {errors.newPassword && (
                        <p className="text-xs text-red-600 mt-1">{errors.newPassword}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar nueva contraseña</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className={`w-full px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Confirma tu nueva contraseña"
                      />
                      {errors.confirmPassword && (
                        <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>
                      )}
                    </div>
                    <button 
                      onClick={handleChangePassword}
                      disabled={loading}
                      className="w-full btn-primary text-sm py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Cambiando...' : 'Cambiar contraseña'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-base font-semibold text-gray-800 mb-4">
                    <Bell className="h-5 w-5" />
                    Preferencias de notificaciones
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Notificaciones por email</p>
                        <p className="text-xs text-gray-500">Recibir alertas por correo electrónico</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={preferences.emailNotifications}
                          onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Notificaciones push</p>
                        <p className="text-xs text-gray-500">Alertas en el navegador</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={preferences.pushNotifications}
                          onChange={(e) => setPreferences({ ...preferences, pushNotifications: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Recordatorios de metas</p>
                        <p className="text-xs text-gray-500">Alertas de metas próximas a vencer</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={preferences.goalReminders}
                          onChange={(e) => setPreferences({ ...preferences, goalReminders: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Modo oscuro</p>
                        <p className="text-xs text-gray-500">Interfaz optimizada para ambientes con poca luz</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={preferences.darkMode}
                          onChange={(e) => toggleDarkMode(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <button 
                      onClick={handleUpdatePreferences}
                      disabled={loading}
                      className="w-full btn-primary text-sm py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Guardando...' : 'Guardar preferencias'}
                    </button>
                  </div>
                </div>
              )}


              {activeTab === 'data' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-base font-semibold text-gray-800 mb-4">
                    <Database className="h-5 w-5" />
                    Gestión de datos
                  </div>
                  <div className="space-y-3">
                    <button 
                      onClick={() => handleExportData('all')}
                      className="w-full flex items-center justify-center gap-3 btn-secondary text-sm py-3 hover:bg-gray-100 transition-colors"
                    >
                      <Download className="h-5 w-5" />
                      Exportar todos mis datos
                    </button>
                    <button 
                      onClick={() => handleExportData('transactions')}
                      className="w-full flex items-center justify-center gap-3 btn-secondary text-sm py-3 hover:bg-gray-100 transition-colors"
                    >
                      <Download className="h-5 w-5" />
                      Exportar transacciones
                    </button>
                    <button 
                      onClick={() => handleExportData('reports')}
                      className="w-full flex items-center justify-center gap-3 btn-secondary text-sm py-3 hover:bg-gray-100 transition-colors"
                    >
                      <Download className="h-5 w-5" />
                      Exportar reportes
                    </button>
                    <div className="pt-3 px-3 py-2 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700">
                        💡 Tus datos se exportarán en formato CSV compatible con Excel
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-base font-semibold text-gray-800 mb-4">
                    <Info className="h-5 w-5" />
                    Información de la aplicación
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                      <h4 className="text-base font-semibold text-gray-900 mb-2">Finanzas Personales</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Versión 1.0.0
                      </p>
                      <p className="text-sm text-gray-600">
                        Aplicación para el control y gestión de finanzas personales
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-3">Estadísticas de tu cuenta</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Cuenta creada:</span>
                          <span className="text-gray-900 font-medium">Hace 30 días</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Último acceso:</span>
                          <span className="text-gray-900 font-medium">Hoy</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Transacciones:</span>
                          <span className="text-gray-900 font-medium">127</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
                </div>
              </div>
            </div>
            
            {/* Footer con cerrar sesión */}
            <div className="border-t border-white/30 p-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50/50 py-3 px-4 rounded-lg transition-colors duration-200"
              >
                <LogOut className="h-5 w-5" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Ventana flotante de ayuda usando Portal */}
      {showHelp && createPortal(
        <div className="fixed inset-0 z-dropdown flex items-center justify-center p-4">
          {/* Overlay de fondo */}
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm" 
            onClick={() => setShowHelp(false)}
          />
          
          {/* Ventana de ayuda */}
          <div 
            ref={helpRef} 
            className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden glass-modal animate-fade-in"
          >
            {/* Header de ayuda */}
            <div className="bg-gradient-to-r from-green-50/50 to-blue-50/50 p-4 border-b border-white/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <HelpCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Centro de Ayuda</h3>
                    <p className="text-sm text-gray-600">Guías y respuestas frecuentes</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Contenido de ayuda con scroll */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
              <div className="space-y-6">
                
                {/* Inicio rápido */}
                <div className="glass-card bg-blue-50/30 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    Como usar la aplicacion
                  </h4>
                  <div className="space-y-3 text-sm text-gray-700">
                    <p><strong>Dashboard:</strong> Visualiza el resumen de tus finanzas</p>
                    <p><strong>Transacciones:</strong> Usa el boton + para agregar ingresos y gastos</p>
                    <p><strong>Presupuestos:</strong> Establece limites de gasto mensuales</p>
                    <p><strong>Metas:</strong> Crea objetivos de ahorro</p>
                    <p><strong>Reportes:</strong> Analiza tus patrones de gasto</p>
                  </div>
                </div>

                {/* Preguntas frecuentes */}
                <div className="glass-card bg-green-50/30 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-green-600" />
                    Preguntas Frecuentes
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-2">Como agrego una transaccion?</h5>
                      <p className="text-sm text-gray-600">
                        Haz clic en el boton + en cualquier pagina para abrir el formulario de nueva transaccion.
                      </p>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-2">Puedo editar transacciones?</h5>
                      <p className="text-sm text-gray-600">
                        Si, en la pagina de Transacciones puedes hacer clic en cualquier transaccion para editarla.
                      </p>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-2">Como funcionan los presupuestos?</h5>
                      <p className="text-sm text-gray-600">
                        Los presupuestos te permiten establecer limites de gasto por categoria cada mes.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contacto */}
                <div className="glass-card bg-gray-50/30 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-gray-600" />
                    Necesitas mas ayuda?
                  </h4>
                  <p className="text-sm text-gray-600">
                    Si tienes preguntas adicionales o necesitas soporte, puedes contactarnos a traves de la configuracion de tu cuenta.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default UserSettingsMenu 