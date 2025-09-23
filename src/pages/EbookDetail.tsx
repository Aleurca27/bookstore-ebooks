import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Star, ShoppingCart, Download, ArrowLeft, Heart, CheckCircle, Users, BookOpen, Award, Clock, Target, TrendingUp, Zap, ChevronDown, ChevronUp, PlayCircle } from 'lucide-react'
import { Icon } from '@iconify/react'
import { supabase, type Ebook } from '../config/supabase'
import { getBookCoverImageWithSize } from '../utils/imageOverrides'
import type { User } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import GuestCheckoutModal, { type GuestData } from '../components/GuestCheckoutModal'
import { GuestPurchaseService } from '../services/guestPurchaseService'
import { MetaPixelEvents } from '../config/metaPixel'
import { MetaConversionService } from '../services/metaConversionService'

interface EbookDetailProps {
  user: User | null
}

export default function EbookDetail({ user }: EbookDetailProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [book, setBook] = useState<Ebook | null>(null)
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [isPurchased, setIsPurchased] = useState(false)
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null)
  const [showFloatingButton, setShowFloatingButton] = useState(false)
  const [showGuestModal, setShowGuestModal] = useState(false)
  // Force update timestamp: ${new Date().toISOString()}

  useEffect(() => {
    if (id) {
      fetchBook(id)
      if (user) {
        checkPurchaseStatus(id)
      }
    }
  }, [id, user])

  // Evento de Meta Pixel cuando se carga la página del libro
  useEffect(() => {
    if (book) {
      MetaPixelEvents.viewContent(book.title, book.price * 1000, book.id)
    }
  }, [book])

  // Controlar visibilidad del botón flotante basado en scroll
  useEffect(() => {
    const handleScroll = () => {
      // Buscar el botón principal del producto
      const mainButton = document.querySelector('[data-main-button="true"]')
      if (mainButton) {
        const rect = mainButton.getBoundingClientRect()
        // Mostrar botón flotante cuando el botón principal no esté visible
        setShowFloatingButton(rect.bottom < 0)
      }
    }

    window.addEventListener('scroll', handleScroll)
    // Verificar estado inicial
    handleScroll()
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const fetchBook = async (bookId: string) => {
    try {
      const { data, error } = await supabase
        .from('ebooks')
        .select('*')
        .eq('id', bookId)
        .single()

      if (error) throw error
      setBook(data)
    } catch (error) {
      console.error('Error fetching book:', error)
      toast.error('Error al cargar el libro')
    } finally {
      setLoading(false)
    }
  }

  // Verificar si el usuario tiene acceso especial gratuito
  const hasSpecialAccess = (user: User | null): boolean => {
    if (!user || !book) {
      console.log('❌ No hay usuario o libro:', { user: !!user, book: !!book })
      return false
    }
    
    // Usuario aleurca tiene acceso gratuito al ebook de publicidad
    const specialUsers = ['aleurca@email.com', 'alejandro@email.com', 'aleurca'] // Agregar más emails si es necesario
    
    // Verificar por título del libro (más flexible que por ID)
    const isPublicidadBook = book.title?.toLowerCase().includes('publicidad') || 
                           book.title?.toLowerCase().includes('marketing') ||
                           book.title?.toLowerCase().includes('digital') ||
                           book.title?.toLowerCase().includes('programación') // Temporal para testing
    
    const userEmail = user.email || ''
    const hasAccess = specialUsers.includes(userEmail) || 
                     userEmail.includes('aleurca') || 
                     userEmail.includes('alejandro') || 
                     userEmail.toLowerCase().includes('aleurca') ||
                     userEmail.toLowerCase().includes('alejandro') && isPublicidadBook
    
    console.log('🔍 Debug acceso especial:', {
      userEmail: user.email,
      bookTitle: book.title,
      isSpecialUser: specialUsers.includes(user.email || ''),
      isPublicidadBook,
      hasAccess
    })
    
    return hasAccess
  }

  const checkPurchaseStatus = async (bookId: string) => {
    if (!user) return

    try {
      // Verificar acceso especial primero
      if (hasSpecialAccess(user)) {
        console.log('✅ Usuario con acceso especial detectado:', user.email)
        console.log('✅ Marcando libro como comprado para acceso especial')
        setIsPurchased(true)
        return
      }

      const { data, error } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('ebook_id', bookId)
        .eq('status', 'completed')
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error
      setIsPurchased(!!data)
    } catch (error) {
      console.error('Error checking purchase status:', error)
    }
  }

  const addToCart = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para añadir al carrito')
      return
    }

    if (!book) return

    setAddingToCart(true)
    try {
      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          ebook_id: book.id
        })

      if (error) {
        if (error.code === '23505') {
          toast.error('Este libro ya está en tu carrito')
        } else {
          throw error
        }
      } else {
        toast.success('Libro añadido al carrito')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Error al añadir al carrito')
    } finally {
      setAddingToCart(false)
    }
  }

  const buyNow = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para comprar')
      return
    }

    if (!book) {
      toast.error('Información del libro no disponible')
      return
    }

    setAddingToCart(true)
    
    try {
      console.log('=== INICIO DEBUG COMPRA ===')
      console.log('Usuario autenticado:', { 
        id: user.id, 
        email: user.email,
        user_metadata: user.user_metadata 
      })
      console.log('Información del libro:', { 
        id: book.id, 
        title: book.title, 
        price: book.price 
      })

      // Verificar acceso especial primero
      if (hasSpecialAccess(user)) {
        console.log('Usuario con acceso especial detectado, otorgando acceso gratuito...')
        toast.success('¡Acceso especial otorgado! Redirigiendo al lector...')
        setIsPurchased(true)
        setTimeout(() => {
          navigate(`/leer/${book.id}`)
        }, 1000)
        return
      }

      // Verificar si ya tiene el libro
      console.log('Verificando compras existentes...')
      const { data: existingPurchase, error: checkError } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('ebook_id', book.id)
        .eq('status', 'completed')
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error verificando compras:', checkError)
        throw checkError
      }

      if (existingPurchase) {
        console.log('Usuario ya tiene el libro')
        toast.success('¡Ya tienes este libro!')
        navigate(`/leer/${book.id}`)
        return
      }

      console.log('Usuario no tiene el libro, procediendo con MercadoPago...')

      // Integración real con MercadoPago
      console.log('Cargando servicio de MercadoPago...')
      const { MercadoPagoService } = await import('../services/mercadopagoService')
      
      // Crear datos del pago
      const paymentData = {
        title: book.title,
        quantity: 1,
        currency_id: 'CLP',
        unit_price: Math.round(book.price * 1000), // Convertir a CLP (USD a CLP)
        ebook_id: book.id,
        user_id: user.id
      }

      console.log('Datos del pago para MercadoPago:', paymentData)

      // Crear preferencia de pago en MercadoPago
      console.log('Creando preferencia en MercadoPago...')
      const preference = await MercadoPagoService.createPaymentPreference(paymentData)
      console.log('Preferencia de MercadoPago creada:', preference)
      
      // Determinar URL de pago (producción para pagos reales)
      const paymentUrl = preference.init_point || preference.sandbox_init_point
      console.log('URL de pago:', paymentUrl)

      if (!paymentUrl) {
        throw new Error('No se pudo obtener la URL de pago de MercadoPago')
      }

      toast.success('Redirigiendo a MercadoPago...')
      console.log('Redirigiendo a:', paymentUrl)
      
      // Redirigir a MercadoPago
      setTimeout(() => {
        window.location.href = paymentUrl
      }, 1000)

    } catch (error) {
      console.error('=== ERROR EN COMPRA ===')
      console.error('Tipo de error:', error.constructor.name)
      console.error('Mensaje:', error.message)
      console.error('Stack:', error.stack)
      console.error('Error completo:', error)
      
      toast.error(`Error: ${error.message || 'Error desconocido al procesar la compra'}`)
    } finally {
      setAddingToCart(false)
      console.log('=== FIN DEBUG COMPRA ===')
    }
  }

  const goToReader = async () => {
    if (!book) {
      toast.error('Información del libro no disponible')
      return
    }

    // Redirigir al lector del libro
    toast.success('Abriendo lector...')
    navigate(`/leer/${book.id}`)
  }

  const handleGuestPurchase = async (guestData: GuestData) => {
    if (!book) {
      toast.error('Información del libro no disponible')
      return
    }

    try {
      console.log('🛒 Iniciando compra de invitado:', guestData)
      
      // Procesar pago para invitado
      const { paymentUrl, purchaseId, accessPassword } = await GuestPurchaseService.processGuestPayment(
        guestData,
        book.id,
        book.price,
        book.title
      )

      console.log('✅ Pago procesado, enviando credenciales...')
      
      // Enviar email con credenciales
      await GuestPurchaseService.sendAccessCredentials(
        guestData,
        accessPassword,
        book.title
      )

      toast.success(`¡Pago procesado con ${guestData.paymentMethod === 'mercadopago' ? 'MercadoPago' : 'WebPay'}! Te enviamos las credenciales por email`)
      
      // Cerrar modal
      setShowGuestModal(false)
      
      // Redirigir al procesador de pago seleccionado
      setTimeout(() => {
        window.location.href = paymentUrl
      }, 1000)

    } catch (error) {
      console.error('Error en compra de invitado:', error)
      toast.error(`Error: ${error.message || 'Error al procesar la compra'}`)
    }
  }

  const handleBuyNowClick = async () => {
    if (!book) return

    // Eventos de Meta Pixel y Conversion API - InitiateCheckout
    MetaPixelEvents.initiateCheckout(book.title, book.price * 1000, book.id)
    
    if (user) {
      await MetaConversionService.trackInitiateCheckout(user, book.title, book.price, book.id)
    }

    if (!user) {
      // Mostrar modal de compra sin registro
      setShowGuestModal(true)
      return
    }

    // Usuario logueado, usar flujo normal
    buyNow()
  }

  const toggleChapter = (chapterIndex: number) => {
    setExpandedChapter(expandedChapter === chapterIndex ? null : chapterIndex)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="animate-pulse">
              <div className="bg-gray-300 h-96 rounded-lg"></div>
            </div>
            <div className="space-y-4 animate-pulse">
              <div className="bg-gray-300 h-8 rounded"></div>
              <div className="bg-gray-300 h-6 rounded w-3/4"></div>
              <div className="bg-gray-300 h-4 rounded"></div>
              <div className="bg-gray-300 h-4 rounded"></div>
              <div className="bg-gray-300 h-4 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Libro no encontrado</h2>
          <Link to="/catalogo" className="btn-primary">
            Volver al catálogo
          </Link>
        </div>
      </div>
    )
  }

  return (
      <div className="min-h-screen bg-white overflow-x-hidden">
        {/* Product Section - Ecommerce Style */}
        <section id="producto" className="bg-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              
              {/* Product Image */}
              <div>
                <div className="sticky top-8">
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <img
                      src="/images/portala libro.png"
                      alt="Ebook de la Publicidad"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-6">
                {/* Product Title */}
                <div>
                  <h1 className="text-3xl lg:text-4xl font-thin text-gray-900 mb-2">
                    Ebook de la Publicidad
                  </h1>
                  <p className="text-gray-600">por <span className="font-medium">AgenciaCL</span></p>
                  <div className="w-full h-px bg-gray-200 mt-4"></div>
                </div>

                {/* Rating & Stats */}
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                    <span className="ml-2 text-gray-700 font-medium">4.8</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-5 w-5 mr-1" />
                    <span>2,147 lectores</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {book.description}
                  </p>
                </div>

                {/* Benefits - Clean Design */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-black rounded-full mr-3"></div>
                    <span className="font-semibold text-gray-900">🚀 Aumenta 100% tus ventas en menos de un mes</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-black rounded-full mr-3"></div>
                    <span className="font-semibold text-gray-900">💰 ROAS mayor y ahorra en pérdidas</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-black rounded-full mr-3"></div>
                    <span className="font-semibold text-gray-900">⚡ Resultados en menos de 72 horas</span>
                  </div>
                </div>

                {/* Price */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-baseline space-x-3 mb-2">
                    <span className="text-xl text-gray-500 line-through">$50.000</span>
                    <span className="text-3xl font-light text-gray-900">$29.900</span>
                  </div>
                  <p className="text-gray-600 text-sm">Acceso de por vida • Descuento por tiempo limitado</p>
                </div>

                {/* Purchase Section */}
                <div className="space-y-4">
                  {/* Special Access Indicator */}
                  {user && hasSpecialAccess(user) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Icon icon="material-symbols:star" className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-semibold text-green-800">
                          ¡Acceso especial activado!
                        </span>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        Tienes acceso gratuito a este contenido
                      </p>
                    </div>
                  )}

                  {/* Purchase Buttons */}
                  {isPurchased ? (
                    <div className="space-y-3">
                      <button
                        onClick={() => navigate(`/leer/${book.id}`)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center space-x-3 transition-colors"
                      >
                        <BookOpen className="h-5 w-5" />
                        <span>Leer ahora</span>
                      </button>
                      <button
                        onClick={goToReader}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center space-x-3 transition-colors"
                      >
                        <BookOpen className="h-5 w-5" />
                        <span>Abrir Lector</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                        onClick={handleBuyNowClick}
                        disabled={addingToCart}
                        data-main-button="true"
                        className={`w-full font-semibold py-4 px-6 rounded-lg flex items-center justify-center space-x-3 transition-colors ${
                          hasSpecialAccess(user) 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {hasSpecialAccess(user) ? (
                          <>
                            <Icon icon="material-symbols:star" className="h-5 w-5" />
                            <span>Acceso Gratuito</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-5 w-5" />
                            <span>Comprar ahora</span>
                          </>
                        )}
                      </button>

                      <div className="text-center space-y-3">
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                          <Icon icon="material-symbols:shield-check" className="h-4 w-4 text-green-600" />
                          <span>Pago 100% seguro</span>
                          <Icon icon="material-symbols:credit-card" className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="flex items-center justify-center space-x-4">
                          <img src="/images/Mercado-pago-1024x267.png" alt="MercadoPago" className="h-6 opacity-70" />
                          <span className="text-gray-400">•</span>
                          <img src="/images/images.png" alt="WebPay" className="h-6 opacity-70" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Para quiénes está destinado */}
        <section id="destinado" className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extralight text-gray-900 mb-6">
                Para quiénes está destinado
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Este libro es perfecto si te encuentras en alguna de estas situaciones
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Emprendedoras */}
              <div className="text-center">
                <h3 className="text-xl font-light text-gray-900 mb-3">
                  Emprendedoras
                </h3>
                <p className="text-gray-600">
                  Que buscan hacer crecer su negocio online con estrategias probadas y sin complicaciones técnicas.
                </p>
              </div>

              {/* Tiendas sin crecimiento */}
              <div className="text-center">
                <h3 className="text-xl font-light text-gray-900 mb-3">
                  Tiendas sin crecimiento
                </h3>
                <p className="text-gray-600">
                  Que tienen productos pero necesitan llegar a más clientes y aumentar sus ventas de forma rentable.
                </p>
              </div>

              {/* Principiantes en publicidad */}
              <div className="text-center">
                <h3 className="text-xl font-light text-gray-900 mb-3">
                  Principiantes en publicidad
                </h3>
                <p className="text-gray-600">
                  Que quieren comenzar en el mundo de la publicidad digital sin perder dinero en el proceso.
                </p>
              </div>
            </div>

            {/* CTA de transición */}
            <div className="mt-10 text-center">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-xl font-light text-gray-900 mb-3">
                  Si alguna te suena familiar...
                </h3>
                <p className="text-gray-600 mb-4">
                  Este libro tiene las respuestas que buscas
                </p>
                <p className="text-lg font-semibold text-blue-600">
                  Ve lo que aprenderás ↓
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Lo que aprenderás */}
        <section className="py-12 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-light text-gray-900 mb-3">
                Lo que aprenderás
              </h2>
              <p className="text-lg text-gray-600">
                Estrategias probadas para escalar tu negocio digital
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "Dominarás las bases del marketing digital moderno",
                "Crearás funnels de conversión que venden 24/7",
                "Generarás +500% leads cualificados con growth hacking",
                "Optimizarás campañas de Meta Ads y Google Ads para 400% ROI",
                "Diseñarás contenido viral que se comparte automáticamente",
                "Implementarás email marketing automatizado que vende en piloto automático",
                "Analizarás métricas clave para tomar decisiones estratégicas",
                "Escalarás tu negocio de $10K a $1M+ de forma predecible"
              ].map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700 text-sm font-medium">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      {/* Vista previa del lector */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extralight text-gray-900 mb-4">
              Experiencia de lectura premium
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Un lector diseñado para el aprendizaje efectivo. Enfócate en el contenido, nosotros nos encargamos del resto.
            </p>
          </div>

          <div className="relative">
            {/* Mockup del lector */}
            <div className="relative mx-auto max-w-6xl">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 reader-preview hover:shadow-3xl transition-all duration-500">
                {/* Header del lector mockup */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">Capítulo 1 de 12</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full w-1/4"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-200 rounded-lg">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex">
                  {/* Sidebar del lector */}
                  <div className="w-80 bg-gray-50 border-r border-gray-200 p-4 sm:p-6 hidden md:block">
                    <h3 className="font-semibold text-gray-900 mb-4">Contenido</h3>
                    <div className="space-y-3">
                      {[
                        { title: "Mantén un ROAS x3 superior", active: true, time: "35 min" },
                        { title: "Llega a nuevos públicos", active: false, time: "42 min" },
                        { title: "Últimas tendencias en marketing", active: false, time: "38 min" },
                        { title: "Perfil de Instagram ganador", active: false, time: "28 min" },
                        { title: "Estructura e información", active: false, time: "45 min" },
                        { title: "Escala sin quemar la cuenta", active: false, time: "52 min" }
                      ].map((chapter, index) => (
                        <div 
                          key={index}
                          className={`p-3 rounded-lg transition-colors ${
                            chapter.active 
                              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <div className="text-sm font-medium">{chapter.title}</div>
                          <div className="text-xs text-gray-500 mt-1">{chapter.time} lectura</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contenido principal animado */}
                  <div className="flex-1 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
                    {/* Animación de contenido deslizante */}
                    <div className="animate-slide-content">
                      <div className="mb-6">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                          Capítulo 1: Mantén un ROAS x3 superior
                        </h1>
                        <p className="text-gray-700 leading-relaxed mb-4 text-sm sm:text-base">
                          ¿Te has preguntado por qué algunos anuncios generan ventas a $5 por cliente mientras otros necesitan $50? 
                          El secreto está en el marco Anti-CPA Alto™, una metodología probada que te permite bajar el costo 
                          por resultado en 24-72 horas...
                        </p>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                          Árbol de decisiones para bajar costo por resultado
                        </h3>
                        <p className="text-gray-700 leading-relaxed mb-4 text-sm sm:text-base">
                          La clave está en saber exactamente qué tocar primero cuando tu CPA se dispara. 
                          La secuencia correcta es crítica:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 text-sm sm:text-base">
                          <li><strong>1. Oferta</strong> - ¿Tu propuesta de valor es irresistible?</li>
                          <li><strong>2. Creativo</strong> - ¿Tu anuncio conecta emocionalmente?</li>
                          <li><strong>3. Audiencia</strong> - ¿Estás hablando con el público correcto?</li>
                          <li><strong>4. Puja</strong> - ¿Tu estrategia de puja maximiza el alcance?</li>
                        </ul>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                          <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                            <Icon icon="material-symbols:lightbulb-outline" className="w-5 h-5 mr-2 text-yellow-500" />
                            Tip del Experto
                          </h4>
                          <p className="text-blue-800 text-sm">
                            5 acciones rápidas que no rompen el aprendizaje: pausar creativos con CTR &lt; 1%, 
                            duplicar conjuntos exitosos, ajustar horarios de mayor conversión, optimizar 
                            audiencias lookalike y revisar frecuencia de anuncios.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Overlay gradient para efecto fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                  </div>
                </div>

                {/* Footer del lector */}
                <div className="bg-gray-50 px-4 sm:px-8 py-4 border-t border-gray-200 flex items-center justify-between">
                  <button className="flex items-center space-x-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    <span className="text-sm">Anterior</span>
                  </button>

                  <span className="text-xs sm:text-sm text-gray-600">Página 1 de 40</span>

                  <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    <span className="text-sm">Siguiente</span>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Elementos flotantes decorativos */}
              <div className="absolute -top-10 -left-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
            </div>


            {/* Features como chips modernos */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-8">
              <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-gray-200/50 hover:shadow-lg transition-all duration-300 group">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="text-gray-800 font-medium text-sm">Modo Oscuro</span>
              </div>

              <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-gray-200/50 hover:shadow-lg transition-all duration-300 group">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <span className="text-gray-800 font-medium text-sm">Marcadores</span>
              </div>

              <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-gray-200/50 hover:shadow-lg transition-all duration-300 group">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                  <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-gray-800 font-medium text-sm">Progreso Sincronizado</span>
              </div>

              <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-gray-200/50 hover:shadow-lg transition-all duration-300 group">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                  <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <span className="text-gray-800 font-medium text-sm">Personalizable</span>
              </div>

              <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-gray-200/50 hover:shadow-lg transition-all duration-300 group">
                <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                  <svg className="w-3 h-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-gray-800 font-medium text-sm">Imágenes HD</span>
              </div>

              <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-gray-200/50 hover:shadow-lg transition-all duration-300 group">
                <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                  <svg className="w-3 h-3 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <span className="text-gray-800 font-medium text-sm">Multi-dispositivo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contenido del libro - Acordeón optimizado */}
      <section id="contenido" className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extralight text-gray-900 mb-4">
              Contenido completo
            </h2>
            <p className="text-xl text-gray-600 mb-2">
              12 capítulos paso a paso + bonos exclusivos
            </p>
            
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
              <PlayCircle className="w-4 h-4 mr-2" />
              40 páginas • 2 horas de lectura y muchas horas de estudio!
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                title: "Mantén un ROAS x3 superior",
                time: "35 min",
                topics: ["Formula para bajar costos en 24-72 horas", "El orden exacto que debes seguir para optimizar", "Acciones que no rompen el algoritmo de Facebook"]
              },
              {
                title: "Llega a nuevos públicos", 
                time: "42 min",
                topics: ["El mensaje perfecto para cada ventana de remarketing", "Secuencias que convierten más que los cold ads", "Cómo mantener frescos tus anuncios sin gastar más"]
              },
              {
                title: "Últimas tendencias en marketing",
                time: "38 min",
                topics: ["Los 9 hooks que más venden en Reels y Stories", "La estructura de 3 frases que convierte", "Checklist para que cualquiera grabe como influencer"]
              },
              {
                title: "Perfil de Instagram ganador",
                time: "28 min", 
                topics: ["Setup express que funciona desde el día 1", "Cómo detectar cuando Facebook está perdiendo señales", "La nomenclatura que ahorra horas de trabajo"]
              },
              {
                title: "Estructura e información",
                time: "45 min",
                topics: ["Cuándo usar cada estructura para maximizar ROI", "Los errores que suben tu CPA automáticamente", "Presets listos para copiar y pegar"]
              },
              {
                title: "Escala sin quemar la cuenta",
                time: "52 min",
                topics: ["Formula para escalar sin quemar presupuesto", "Duplicación inteligente vs duplicación que mata", "Indicadores que te dicen cuándo parar de escalar"]
              }
            ].map((chapter, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300">
                <button
                  onClick={() => toggleChapter(index)}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold bg-blue-600 text-white mr-3">
                        {index + 1}
                      </span>
                      <span className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {chapter.time}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {chapter.title}
                    </h3>
                  </div>
                  <div className="ml-4">
                    {expandedChapter === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {expandedChapter === index && (
                  <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50 animate-fade-in-up">
                    <div className="pt-3">
                      <ul className="space-y-1">
                        {chapter.topics.map((topic, topicIndex) => (
                          <li key={topicIndex} className="flex items-center text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            <span className="text-gray-700">{topic}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {/* Caso de aplicación para "Escala sin quemar la cuenta" */}
                      {chapter.title === "Escala sin quemar la cuenta" && (
                        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Icon icon="mdi:chart-line" className="w-5 h-5 text-blue-600 mr-2" />
                            Caso de Aplicación Real
                          </h4>
                          <div className="mb-4">
                            <img 
                              src="/images/Captura de pantalla 2025-09-22 a la(s) 6.49.24 p.m..png" 
                              alt="Caso de aplicación - Resultados de campaña"
                              className="w-full max-w-4xl mx-auto rounded-lg shadow-md"
                              onError={(e) => {
                                console.log('Error cargando imagen de caso de aplicación, usando placeholder...')
                                e.currentTarget.src = 'https://via.placeholder.com/800x400/f3f4f6/9ca3af?text=Caso+de+Aplicación+Real'
                              }}
                            />
                          </div>
                          <div className="text-sm text-gray-700 space-y-2">
                            <p><strong>Resultados obtenidos:</strong></p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                              <li>ROAS promedio de 23.00 con picos de hasta 83.03</li>
                              <li>Costo por compra optimizado de $1.739</li>
                              <li>6 compras generadas con un valor total de $240.000</li>
                              <li>Alcance efectivo de 3.384 personas</li>
                            </ul>
                            <p className="mt-3 text-blue-700 font-medium">
                              ✅ Estrategia aplicada exitosamente sin quemar el presupuesto
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Casos de Éxito Chilenos */}
      <section id="casos-exito" className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extralight text-gray-900 mb-6">
            Casos de Éxito Chilenos
          </h2>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <img
              src="/images/imagennoticia.png"
              alt="Noticias de empresas chilenas sobre estrés en ventas"
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="max-w-3xl mx-auto">
            <h3 className="text-xl font-light text-gray-900 mb-4">
              El Estrés de No Llegar a las Ventas
            </h3>
            <p className="text-gray-700 leading-relaxed text-lg mb-4">
              Las empresas en Chile enfrentan cada día la presión de cumplir metas de ventas. 
              La ansiedad por no alcanzar los objetivos puede paralizar equipos enteros y afectar 
              la salud mental de emprendedores y vendedores.
            </p>
            <p className="text-gray-700 leading-relaxed text-lg mb-4">
              Este ebook te proporciona las herramientas exactas para transformar esa presión 
              en resultados concretos. Aprende las estrategias que han ayudado a cientos de 
              empresas chilenas a superar el estrés de las ventas y alcanzar el crecimiento sostenible.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <p className="text-blue-800 font-medium">
                "No más noches sin dormir pensando en las ventas del mes. 
                Con las estrategias correctas, los resultados llegan naturalmente."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Imagen de lectura con comentario */}
      <section id="regalos" className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Imagen de la chica */}
            <div className="mb-8">
              <img 
                src="/images/M.png" 
                alt="Chica leyendo mientras toma café"
                className="w-full max-w-2xl mx-auto rounded-2xl shadow-lg"
                onError={(e) => {
                  console.log('Error cargando imagen M.png, usando placeholder...')
                  e.currentTarget.src = 'https://via.placeholder.com/800x400/f3f4f6/9ca3af?text=Chica+leyendo+café'
                }}
              />
            </div>

            {/* Comentario de la chica */}
            <div className="max-w-2xl mx-auto">
              <div className="flex justify-center">
                {/* Burbuja de comentario */}
                <div className="relative bg-white rounded-2xl p-6 shadow-lg max-w-lg">
                  <div className="flex items-center mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    "Perfecto para leer con un café en la mañana. Las estrategias son súper prácticas y fáciles de implementar. ¡Mi negocio online nunca había crecido tanto!"
                  </p>
                </div>
              </div>
            </div>
            
            {/* Regalos incluidos */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center">
                <Icon icon="mdi:gift" className="w-6 h-6 text-pink-600 mr-2" />
                Regalos incluidos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
                  <div className="flex items-center mb-2">
                    <Icon icon="mdi:gift" className="w-5 h-5 text-pink-600 mr-2" />
                    <span className="font-semibold text-gray-900">Plantillas de anuncios ganadores</span>
                  </div>
                  <p className="text-sm text-gray-600">Templates listos para usar en tus campañas</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
                  <div className="flex items-center mb-2">
                    <Icon icon="mdi:gift" className="w-5 h-5 text-pink-600 mr-2" />
                    <span className="font-semibold text-gray-900">Actualizaciones de por vida</span>
                  </div>
                  <p className="text-sm text-gray-600">Cambios importantes de publicidad al correo con nuevas tendencias</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
                  <div className="flex items-center mb-2">
                    <Icon icon="mdi:gift" className="w-5 h-5 text-pink-600 mr-2" />
                    <span className="font-semibold text-gray-900">Potenciar valor marca</span>
                  </div>
                  <p className="text-sm text-gray-600">Tips para crecer rápido y fortalecer tu marca</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sobre nosotros */}
      <section id="nosotros" className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="text-4xl mb-4">
              <Icon icon="mdi:heart" className="w-16 h-16 text-red-500 mx-auto" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Sobre nosotros
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Somos una <span className="font-semibold text-blue-600">startup chilena</span> apasionada por democratizar el conocimiento en marketing digital. 
              En colaboración con <span className="font-semibold text-gray-900">expertos en la materia</span>, creamos contenido de calidad mundial 
              para emprendedores latinoamericanos.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <Icon icon="circle-flags:cl" className="w-6 h-6 mr-2" />
              <span>Hecho en Chile</span>
            </div>
            <div className="flex items-center">
              <Icon icon="material-symbols:rocket-launch" className="w-6 h-6 mr-2 text-blue-500" />
              <span>Startup tecnológica</span>
            </div>
            <div className="flex items-center">
              <Icon icon="material-symbols:groups" className="w-6 h-6 mr-2 text-green-500" />
              <span>Expertos colaboradores</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-gray-900 py-12 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Logo y descripción */}
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold mb-4">EmprendeCL</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                La plataforma líder en ebooks de marketing digital para emprendedores latinoamericanos. 
                Contenido premium creado por expertos locales.
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Icon icon="circle-flags:cl" className="w-5 h-5" />
                <span className="flex items-center">
                  Hecho con <Icon icon="mdi:heart" className="w-4 h-4 text-red-500 mx-1" /> en Chile
                </span>
              </div>
            </div>

            {/* Enlaces rápidos */}
            <div>
              <h4 className="font-semibold mb-4">Enlaces rápidos</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link to="/libro/7ddb3a38-9697-466b-8980-f945d4026b3b" className="hover:text-gray-900 transition-colors">Inicio</Link></li>
                <li><Link to="/login" className="hover:text-gray-900 transition-colors">Mi cuenta</Link></li>
              </ul>
            </div>
          </div>

          {/* Contacto */}
          <div className="border-t border-gray-200 mt-8 pt-8">
            <div className="text-center">
              <h4 className="font-semibold mb-2">Contacto</h4>
              <p className="text-gray-600">contacto@emprendecl.com</p>
            </div>
          </div>

          {/* Línea divisora y copyright */}
          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-gray-600 text-sm">
              © 2024 EmprendeCL. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Botón flotante fijo mejorado */}
      {showFloatingButton && (
        <div className="fixed bottom-6 right-6 z-50">
          {isPurchased ? (
            <button
              onClick={goToReader}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center space-x-3"
            >
              <BookOpen className="h-6 w-6" />
              <span className="text-lg">📖 Leer Ahora</span>
            </button>
          ) : (
            <button
              onClick={handleBuyNowClick}
              disabled={addingToCart}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="text-sm font-semibold">
                {addingToCart ? '⏳ Procesando...' : 'Comprar'}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Modal de compra sin registro */}
      {book && (
        <GuestCheckoutModal
          isOpen={showGuestModal}
          onClose={() => setShowGuestModal(false)}
          onProceed={handleGuestPurchase}
          bookTitle={book.title}
          bookPrice={book.price}
        />
      )}
    </div>
  )
}