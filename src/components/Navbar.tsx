import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, User, LogOut, BookOpen, Settings, Menu, X } from 'lucide-react'
import { supabase } from '../config/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'
import {
  Navbar as HeroNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Badge
} from "@heroui/react"

interface NavbarProps {
  user: SupabaseUser | null
}

export default function Navbar({ user }: NavbarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Detectar scroll para aplicar efectos de glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Sesión cerrada correctamente')
      navigate('/')
    } catch (error) {
      toast.error('Error al cerrar sesión')
    }
  }

  const menuItems = [
    { name: "Inicio", href: "/", icon: BookOpen },
    { name: "Catálogo", href: "/catalogo", icon: BookOpen },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                <div className="relative p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
              </div>
              <span className="text-xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Ebooks
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                  isActive(item.href)
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {/* Cart Button */}
                <Button
                  isIconOnly
                  variant="light"
                  as={Link}
                  to="/carrito"
                  className="relative text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <Badge content="3" color="danger" size="sm" className="z-10">
                    <ShoppingCart className="h-5 w-5" />
                  </Badge>
                </Button>

                {/* User Dropdown */}
                <Dropdown placement="bottom-end">
                  <DropdownTrigger>
                    <div className="flex items-center space-x-2 cursor-pointer p-2 rounded-full hover:bg-gray-100 transition-colors">
                      <Avatar
                        isBordered
                        className="transition-transform hover:scale-105"
                        color="primary"
                        name={user.email?.split('@')[0]}
                        size="sm"
                        src=""
                      />
                      <span className="hidden sm:block text-sm font-medium text-gray-700">
                        {user.email?.split('@')[0]}
                      </span>
                    </div>
                  </DropdownTrigger>
                  <DropdownMenu 
                    aria-label="Profile Actions" 
                    variant="flat"
                    className="w-56"
                  >
                    <DropdownItem key="profile" className="h-14 gap-2" textValue="profile">
                      <div>
                        <p className="font-semibold text-gray-900">Conectado como</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </DropdownItem>
                    <DropdownItem 
                      key="settings" 
                      startContent={<User className="h-4 w-4" />}
                      as={Link}
                      href="/perfil"
                      className="text-gray-700"
                    >
                      Mi Perfil
                    </DropdownItem>
                    <DropdownItem 
                      key="admin" 
                      startContent={<Settings className="h-4 w-4" />}
                      as={Link}
                      href="/admin"
                      className="text-gray-700"
                    >
                      Administración
                    </DropdownItem>
                    <DropdownItem 
                      key="logout" 
                      color="danger" 
                      startContent={<LogOut className="h-4 w-4" />}
                      onClick={handleLogout}
                      className="text-red-600"
                    >
                      Cerrar Sesión
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </>
            ) : (
              <Button 
                as={Link} 
                to="/login" 
                className="bg-gray-900 text-white font-semibold px-6 py-2 rounded-full hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                size="sm"
              >
                Iniciar Sesión
              </Button>
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
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200">
            <div className="px-4 py-6 space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                    isActive(item.href)
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {!user && (
                <div className="pt-4 border-t border-gray-200">
                  <Button 
                    as={Link} 
                    to="/login" 
                    className="w-full bg-gray-900 text-white font-semibold py-3 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Iniciar Sesión
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
