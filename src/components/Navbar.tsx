import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, LogOut, BookOpen, Settings } from 'lucide-react'
import { supabase } from '../config/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
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
    { name: "Inicio", href: "/" },
    { name: "Catálogo", href: "/catalogo" },
  ]

  return (
    <HeroNavbar maxWidth="2xl" className="shadow-lg border-b">
      <NavbarContent>
        <NavbarMenuToggle className="sm:hidden" />
        <NavbarBrand>
          <Link to="/" className="flex items-center space-x-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              BookStore
            </span>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem>
          <Link 
            to="/" 
            className="text-foreground hover:text-primary font-medium transition-colors"
          >
            Inicio
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link 
            to="/catalogo" 
            className="text-foreground hover:text-primary font-medium transition-colors"
          >
            Catálogo
          </Link>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end">
        {user ? (
          <>
            <NavbarItem>
              <Button
                isIconOnly
                variant="light"
                as={Link}
                to="/carrito"
                className="text-foreground"
              >
                <Badge content="3" color="danger" size="sm">
                  <ShoppingCart className="h-5 w-5" />
                </Badge>
              </Button>
            </NavbarItem>
            <NavbarItem>
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Avatar
                    isBordered
                    as="button"
                    className="transition-transform"
                    color="primary"
                    name={user.email?.split('@')[0]}
                    size="sm"
                    src=""
                  />
                </DropdownTrigger>
                <DropdownMenu aria-label="Profile Actions" variant="flat">
                  <DropdownItem key="profile" className="h-14 gap-2">
                    <p className="font-semibold">Conectado como</p>
                    <p className="font-semibold">{user.email}</p>
                  </DropdownItem>
                  <DropdownItem 
                    key="settings" 
                    startContent={<User className="h-4 w-4" />}
                    as={Link}
                    href="/perfil"
                  >
                    Mi Perfil
                  </DropdownItem>
                  <DropdownItem 
                    key="admin" 
                    startContent={<Settings className="h-4 w-4" />}
                    as={Link}
                    href="/admin"
                  >
                    Administración
                  </DropdownItem>
                  <DropdownItem 
                    key="logout" 
                    color="danger" 
                    startContent={<LogOut className="h-4 w-4" />}
                    onClick={handleLogout}
                  >
                    Cerrar Sesión
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
          </>
        ) : (
          <NavbarItem>
            <Button 
              as={Link} 
              to="/login" 
              color="default" 
              variant="solid"
              className="font-medium bg-black text-white hover:bg-gray-800"
            >
              Iniciar Sesión
            </Button>
          </NavbarItem>
        )}
      </NavbarContent>

      <NavbarMenu>
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item.name}-${index}`}>
            <Link
              to={item.href}
              className="w-full text-foreground hover:text-primary transition-colors"
            >
              {item.name}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </HeroNavbar>
  )
}
