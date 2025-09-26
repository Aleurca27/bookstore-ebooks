import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { supabase } from './config/supabase'
import { initMetaPixel } from './config/metaPixel'
import { useVisitorTracking } from './hooks/useVisitorTracking'
import type { User } from '@supabase/supabase-js'

// Componentes
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import EbookDetail from './pages/EbookDetail'
import EbookReader from './pages/EbookReader'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import Cart from './pages/Cart'
import PaymentConfirmation from './pages/PaymentConfirmation'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentFailure from './pages/PaymentFailure'
import PaymentPending from './pages/PaymentPending'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Tracking de visitantes - se actualiza cuando cambia la ruta
  useVisitorTracking({
    pageUrl: window.location.pathname,
    userId: user?.id,
    enabled: true
  })

  useEffect(() => {
    // Inicializar Meta Pixel
    initMetaPixel()

    // En desarrollo local, forzar que no haya sesión iniciada
    if (import.meta.env.DEV) {
      console.log('🔧 Modo desarrollo: Forzando cierre de sesión')
      supabase.auth.signOut()
      setUser(null)
      setLoading(false)
      return
    }

    // Obtener sesión actual (solo en producción)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

      return (
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar user={user} />
            <main className="pt-16 pb-16">
              <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalogo" element={<Catalog />} />
            <Route path="/libro/:id" element={<EbookDetail user={user} />} />
            <Route path="/leer/:id" element={<EbookReader user={user} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/perfil" element={<Profile user={user} />} />
                <Route path="/carrito" element={<Cart user={user} />} />
              <Route path="/admin" element={<Admin user={user} />} />
              <Route path="/payment/confirmation" element={<PaymentConfirmation />} />
              <Route path="/pago-exitoso" element={<PaymentSuccess />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/failure" element={<PaymentFailure />} />
              <Route path="/payment/pending" element={<PaymentPending />} />
          </Routes>
        </main>
        <Toaster position="top-right" />
      </div>
    </Router>
  )
}

export default App
