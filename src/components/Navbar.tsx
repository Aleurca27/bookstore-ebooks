import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { supabase } from '../config/supabase'
import { useCartCount } from '../hooks/useCartCount'
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
  const [isScrolled, setIsScrolled] = useState(false)
  const cartCount = useCartCount(user)

  // Detectar scroll para efectos visuales
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
    { name: "Información del Libro", href: "#producto", icon: "material-symbols:book-outline" },
    { name: "Contenido", href: "#contenido", icon: "material-symbols:library-books" },
    { name: "Casos de Éxito", href: "#casos-exito", icon: "material-symbols:trending-up" },
    { name: "Para Quién", href: "#destinado", icon: "material-symbols:people-outline" },
    { name: "Regalos", href: "#regalos", icon: "material-symbols:gift-outline" },
    { name: "Sobre Nosotros", href: "#nosotros", icon: "material-symbols:info-outline" },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-200/50' 
        : 'bg-white/90 backdrop-blur-md border-b border-gray-200/30'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Menú hamburguesa a la izquierda */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Icon 
                icon={isMobileMenuOpen ? "material-symbols:close" : "material-symbols:menu"} 
                className="h-6 w-6 text-gray-900"
              />
            </button>
          </div>

          {/* Logo EmprendeCL centrado */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <span className="text-xl font-thin text-gray-900">
              EmprendeCL
            </span>
          </div>

          {/* Enlaces de navegación para desktop (lado derecho) */}
          <div className="hidden md:flex items-center space-x-2">
            {menuItems.map((item) => (
              <a 
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-800 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon icon={item.icon} className="h-5 w-5" />
                <span>{item.name}</span>
              </a>
            ))}
          </div>

          {/* Espaciador para móvil */}
          <div className="md:hidden w-10"></div>

          {/* Acciones del usuario mejoradas */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {/* Carrito oculto para landing page */}
                
                {/* Menú de usuario */}
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDropdown(!showDropdown)
                    }}
                    className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
                  >
                        <img 
                          src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48Y2lyY2xlIGN4PSIxMiIgY3k9IjYiIHI9IjQiIGZpbGw9ImN1cnJlbnRDb2xvciIvPjxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0iTTE4LjA5NSAxNS4wMzFDMTcuNjcgMTUgMTcuMTQ5IDE1IDE2LjUgMTVjLTEuNjUgMC0yLjQ3NSAwLTIuOTg3LjUxM0MxMyAxNi4wMjUgMTMgMTYuODUgMTMgMTguNWMwIDEuMTY2IDAgMS45Mi4xODEgMi40NDNRMTIuNjA1IDIxIDEyIDIxYy0zLjg2NiAwLTctMS43OS03LTRzMy4xMzQtNCA3LTRjMi42MTMgMCA0Ljg5Mi44MTggNi4wOTUgMi4wMzEiIG9wYWNpdHk9IjAuNSIvPjxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTMuNTEzIDIxLjQ4N0MxNC4wMjUgMjIgMTQuODUgMjIgMTYuNSAyMnMyLjQ3NSAwIDIuOTg3LS41MTNDMjAgMjAuOTc1IDIwIDIwLjE1IDIwIDE4LjVzMC0yLjQ3NS0uNTEzLTIuOTg3QzE4Ljk3NSAxNSAxOC4xNSAxNSAxNi41IDE1cy0yLjQ3NSAwLTIuOTg3LjUxM0MxMyAxNi4wMjUgMTMgMTYuODUgMTMgMTguNXMwIDIuNDc1LjUxMyAyLjk4N20yLjAxNC0xLjUxQzE0LjgyNSAxOS40NzQgMTQgMTguODgzIDE0IDE3Ljg2YzAtMS4xMyAxLjM3NS0xLjkzMSAyLjUtLjg0NWMxLjEyNS0xLjA4NyAyLjUtLjI4NSAyLjUuODQ1YzAgMS4wMjMtLjgyNSAxLjYxNC0xLjUyNyAyLjExN2wtLjIxMy4xNTRjLS4yNi4xOS0uNTEuMzY5LS43Ni4zNjlzLS41LS4xOC0uNzYtLjM3eiIgY2xpcC1ydWxlPSJldmVub2RkIi8+PC9zdmc+" 
                          alt="Usuario" 
                          className="h-6 w-6"
                        />
                    <span className="hidden md:block text-sm font-semibold text-gray-800 group-hover:text-gray-900">
                      {user.email?.split('@')[0]}
                    </span>
                    <Icon 
                      icon="material-symbols:keyboard-arrow-down" 
                      className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                        showDropdown ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  
                  {/* Dropdown menu mejorado */}
                  {showDropdown && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-gray-200/50 z-20 overflow-hidden"
                    >
                      <div className="py-2">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">
                            {user.email?.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>
                        
                        <Link 
                          to="/perfil" 
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <img 
                            src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48Y2lyY2xlIGN4PSIxMiIgY3k9IjYiIHI9IjQiIGZpbGw9ImN1cnJlbnRDb2xvciIvPjxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0iTTE4LjA5NSAxNS4wMzFDMTcuNjcgMTUgMTcuMTQ5IDE1IDE2LjUgMTVjLTEuNjUgMC0yLjQ3NSAwLTIuOTg3LjUxM0MxMyAxNi4wMjUgMTMgMTYuODUgMTMgMTguNWMwIDEuMTY2IDAgMS45Mi4xODEgMi40NDNRMTIuNjA1IDIxIDEyIDIxYy0zLjg2NiAwLTctMS43OS03LTRzMy4xMzQtNCA3LTRjMi42MTMgMCA0Ljg5Mi44MTggNi4wOTUgMi4wMzEiIG9wYWNpdHk9IjAuNSIvPjxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTMuNTEzIDIxLjQ4N0MxNC4wMjUgMjIgMTQuODUgMjIgMTYuNSAyMnMyLjQ3NSAwIDIuOTg3LS41MTNDMjAgMjAuOTc1IDIwIDIwLjE1IDIwIDE4LjVzMC0yLjQ3NS0uNTEzLTIuOTg3QzE4Ljk3NSAxNSAxOC4xNSAxNSAxNi41IDE1cy0yLjQ3NSAwLTIuOTg3LjUxM0MxMyAxNi4wMjUgMTMgMTYuODUgMTMgMTguNXMwIDIuNDc1LjUxMyAyLjk4N20yLjAxNC0xLjUxQzE0LjgyNSAxOS40NzQgMTQgMTguODgzIDE0IDE3Ljg2YzAtMS4xMyAxLjM3NS0xLjkzMSAyLjUtLjg0NWMxLjEyNS0xLjA4NyAyLjUtLjI4NSAyLjUuODQ1YzAgMS4wMjMtLjgyNSAxLjYxNC0xLjUyNyAyLjExN2wtLjIxMy4xNTRjLS4yNi4xOS0uNTEuMzY5LS43Ni4zNjlzLS41LS4xOC0uNzYtLjM3eiIgY2xpcC1ydWxlPSJldmVub2RkIi8+PC9zdmc+" 
                            alt="Usuario" 
                            className="h-5 w-5 mr-3"
                          />
                          Mi Perfil
                        </Link>
                        {(user.email === 'aleurca@gmail.com' || user.email === 'contacto@emprendecl.com') && (
                          <Link 
                            to="/admin" 
                            onClick={() => setShowDropdown(false)}
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Icon icon="material-symbols:admin-panel-settings-outline" className="h-5 w-5 mr-3" />
                            Administración
                          </Link>
                        )}
                        <div className="border-t border-gray-100 mt-1">
                          <button 
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Icon icon="material-symbols:logout" className="h-5 w-5 mr-3" />
                            Cerrar Sesión
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link 
                to="/login" 
                className="flex items-center justify-center w-10 h-10 border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group"
                title="Iniciar Sesión"
              >
                <Icon icon="material-symbols:person-outline" className="h-5 w-5 group-hover:scale-110 transition-transform" />
              </Link>
            )}

            {/* Menú móvil oculto para landing page */}
          </div>
        </div>

        {/* Menú móvil desplegable */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-4 space-y-2">
              {menuItems.map((item) => (
                <a 
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-800 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon icon={item.icon} className="h-5 w-5" />
                  <span>{item.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
// FORCE UPDATE Sun Sep 21 02:00:43 -03 2025
