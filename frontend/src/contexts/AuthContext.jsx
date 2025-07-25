import { createContext, useContext, useState, useEffect } from 'react'
import { demoAuthService } from '../services/demoAuth'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Verificar token al cargar la aplicación (modo demo)
  useEffect(() => {
    if (demoAuthService.isAuthenticated()) {
      const currentUser = demoAuthService.getCurrentUser()
      setUser(currentUser)
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const { user } = await demoAuthService.login(email, password)
      setUser(user)
      return { success: true }
    } catch (error) {
      console.error('Error en login:', error)
      return {
        success: false,
        message: error.message || 'Error al iniciar sesión'
      }
    }
  }

  const register = async (name, email, password) => {
    // En modo demo, redirigir al login
    return {
      success: false,
      message: 'Registro deshabilitado en modo demo. Usa: demo@finanzasdash.com / demo123'
    }
  }

  const logout = () => {
    demoAuthService.logout()
    setUser(null)
  }

  const updateUser = (userData) => {
    setUser(userData)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 