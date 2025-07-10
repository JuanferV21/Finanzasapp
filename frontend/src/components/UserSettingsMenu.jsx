import { useState, useRef, useEffect } from 'react'
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
  AlertCircle
} from 'lucide-react'

const UserSettingsMenu = () => {
  const { user, logout, updateUser } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const menuRef = useRef(null)
  
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
    theme: user?.preferences?.theme ?? 'light'
  })
  
  // Estados para feedback
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [errors, setErrors] = useState({})

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
        theme: user.preferences?.theme ?? 'light'
      })
    }
  }, [user])

  const handleLogout = () => {
    logout()
    setIsOpen(false)
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
        body: JSON.stringify(preferences)
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
      
      // Aplicar tema inmediatamente
      if (preferences.theme) {
        document.documentElement.classList.toggle('dark', preferences.theme === 'dark')
        localStorage.setItem('theme', preferences.theme)
      }
    } catch (error) {
      showMessage('error', 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

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
      id: 'appearance',
      label: 'Apariencia',
      icon: Palette,
      description: 'Personalizar tema y colores'
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

      {/* Menú desplegable */}
      {isOpen && (
        <div ref={menuRef} className="absolute bottom-full left-0 mb-2 w-full max-w-xs sm:max-w-sm md:max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-fade-in">
          {/* Header del menú */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 sm:p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 truncate max-w-[120px] sm:max-w-[180px]">{user?.name}</h3>
                  <p className="text-xs text-gray-600 truncate max-w-[120px] sm:max-w-[180px]">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Navegación por pestañas */}
          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-2 gap-2 mb-4">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 p-2 sm:p-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>

            {/* Mensaje de feedback */}
            {message.text && (
              <div className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm flex items-center gap-2 ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.type === 'success' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {message.text}
              </div>
            )}

            {/* Contenido de las pestañas: asegúrate de que los formularios usen flex-col, w-full y paddings adaptativos */}
            <div className="space-y-4">
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Edit className="h-4 w-4" />
                    Información personal
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Tu nombre"
                      />
                      {errors.name && (
                        <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
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
                      className="w-full btn-primary text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Shield className="h-4 w-4" />
                    Configuración de seguridad
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña actual</label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.currentPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="••••••••"
                      />
                      {errors.currentPassword && (
                        <p className="text-xs text-red-600 mt-1">{errors.currentPassword}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nueva contraseña</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.newPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="••••••••"
                      />
                      {errors.newPassword && (
                        <p className="text-xs text-red-600 mt-1">{errors.newPassword}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar nueva contraseña</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="••••••••"
                      />
                      {errors.confirmPassword && (
                        <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>
                      )}
                    </div>
                    <button 
                      onClick={handleChangePassword}
                      disabled={loading}
                      className="w-full btn-primary text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Cambiando...' : 'Cambiar contraseña'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Bell className="h-4 w-4" />
                    Preferencias de notificaciones
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Notificaciones por email</p>
                        <p className="text-xs text-gray-500">Recibir alertas por correo</p>
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
                    <div className="flex items-center justify-between">
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
                    <div className="flex items-center justify-between">
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
                    <button 
                      onClick={handleUpdatePreferences}
                      disabled={loading}
                      className="w-full btn-primary text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Guardando...' : 'Guardar preferencias'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Palette className="h-4 w-4" />
                    Personalización
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Tema claro</span>
                      </div>
                      <input 
                        type="radio" 
                        name="theme" 
                        value="light" 
                        checked={preferences.theme === 'light'}
                        onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                        className="text-blue-600" 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Tema oscuro</span>
                      </div>
                      <input 
                        type="radio" 
                        name="theme" 
                        value="dark" 
                        checked={preferences.theme === 'dark'}
                        onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                        className="text-blue-600" 
                      />
                    </div>
                    <button 
                      onClick={handleUpdatePreferences}
                      disabled={loading}
                      className="w-full btn-primary text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Aplicando...' : 'Aplicar tema'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Database className="h-4 w-4" />
                    Gestión de datos
                  </div>
                  <div className="space-y-3">
                    <button 
                      onClick={() => handleExportData('all')}
                      className="w-full flex items-center justify-center gap-2 btn-secondary text-sm py-2 hover:bg-gray-100 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Exportar todos mis datos
                    </button>
                    <button 
                      onClick={() => handleExportData('transactions')}
                      className="w-full flex items-center justify-center gap-2 btn-secondary text-sm py-2 hover:bg-gray-100 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Exportar transacciones
                    </button>
                    <button 
                      onClick={() => handleExportData('reports')}
                      className="w-full flex items-center justify-center gap-2 btn-secondary text-sm py-2 hover:bg-gray-100 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Exportar reportes
                    </button>
                    <div className="pt-2">
                      <p className="text-xs text-gray-500">
                        Tus datos se exportarán en formato CSV
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Info className="h-4 w-4" />
                    Información de la aplicación
                  </div>
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Finanzas Personales</h4>
                      <p className="text-xs text-gray-600 mb-2">
                        Versión 1.0.0
                      </p>
                      <p className="text-xs text-gray-600">
                        Aplicación para el control y gestión de finanzas personales
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Cuenta creada:</span>
                        <span className="text-gray-900">Hace 30 días</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Último acceso:</span>
                        <span className="text-gray-900">Hoy</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Transacciones:</span>
                        <span className="text-gray-900">127</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer con cerrar sesión */}
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 py-2 px-3 rounded-lg transition-colors duration-200"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserSettingsMenu 