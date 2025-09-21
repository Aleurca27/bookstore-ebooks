import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, User, LogOut, BookOpen, Settings, Menu, X } from 'lucide-react'
import { supabase } from '../config/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'

interface NavbarProps {
  user: SupabaseUser | null
}

export default function Navbar({ user }: NavbarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [showDropdown, setShowDropdown] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setShowDropdown(false)
    }
    
    if (showDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showDropdown])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Sesión cerrada correctamente')
      navigate('/')
    } catch (error) {
      toast.error('Error al cerrar sesión')
    }
    setShowDropdown(false)
  }

  const menuItems = [
    { name: "Inicio", href: "/" },
    { name: "Catálogo", href: "/catalogo" },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">BookStore</span>
          </Link>

          {/* Enlaces de navegación */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link 
                key={item.name}
                to={item.href}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Acciones del usuario */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link 
                  to="/carrito" 
                  className="relative text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ShoppingCart className="h-6 w-6 text-red-500" />
                  {/* Badge opcional para número de items */}
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    3
                  </span>
                </Link>
                
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDropdown(!showDropdown)
                    }}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                    <span className="hidden md:block text-sm font-medium">
                      {user.email?.split('@')[0]}
                    </span>
                  </button>
                  
                  {/* Dropdown menu */}
                  {showDropdown && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                    >
                      <div className="py-1">
                        <Link 
                          to="/perfil" 
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Mi Perfil
                        </Link>
                        <Link 
                          to="/admin" 
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Administración
                        </Link>
                        <button 
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link 
                to="/login" 
                className="btn-primary"
              >
                Iniciar Sesión
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-4 py-4 space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {!user && (
                <div className="pt-4 border-t border-gray-200">
                  <Link 
                    to="/login" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full bg-primary-600 text-white font-semibold py-3 text-center rounded-lg"
                  >
                    Iniciar Sesión
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
// FORCE UPDATE Sun Sep 21 02:00:43 -03 2025
