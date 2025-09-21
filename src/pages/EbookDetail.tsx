import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Star, ShoppingCart, Download, ArrowLeft, Heart, CheckCircle, Users, BookOpen, Award, Clock, Target, TrendingUp, Zap, ChevronDown, ChevronUp, PlayCircle } from 'lucide-react'
import { supabase, type Ebook } from '../config/supabase'
import { getBookCoverImageWithSize } from '../utils/imageOverrides'
import type { User } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

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
  // Force update timestamp: ${new Date().toISOString()}

  useEffect(() => {
    if (id) {
      fetchBook(id)
      if (user) {
        checkPurchaseStatus(id)
      }
    }
  }, [id, user])

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

  const checkPurchaseStatus = async (bookId: string) => {
    if (!user) return

    try {
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
        unit_price: Math.round(book.price * 800), // Convertir a CLP
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
        {/* Hero Section del libro */}
        <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-12 mt-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* Imagen del libro */}
              <div className="flex justify-center lg:justify-start">
                <div className="w-full max-w-md md:max-w-lg lg:max-w-xl bg-white border border-gray-200 rounded-xl overflow-hidden">
              <img
                    src={getBookCoverImageWithSize(book, 'large')}
                alt={book.title}
                    className="w-full h-full object-cover"
              />
            </div>
          </div>

              {/* Información principal */}
              <div className="space-y-4 text-center lg:text-left">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight">
                {book.title}
              </h1>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                    <span className="text-gray-700 ml-2 text-sm font-medium">(4.8)</span>
                    <span className="text-gray-600 text-sm ml-3">por {book.author}</span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <Users className="h-4 w-4 mr-1" />
                    <span>2,147 lectores</span>
                  </div>
            </div>

                <p className="text-base md:text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {book.description}
              </p>

            <div className="border-t border-gray-200 pt-6">
                  <div className="mb-6">
                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-2 sm:space-y-0 sm:space-x-3">
                      <span className="text-lg text-gray-500 line-through">$50.000 CLP</span>
                      <span className="text-3xl md:text-4xl font-black text-gray-900">$29.900 CLP</span>
                </div>
                    <p className="text-gray-500 text-center lg:text-left mt-2">Acceso de por vida • Descuento por tiempo limitado</p>
              </div>

              <div className="space-y-4">
                {isPurchased ? (
                      <div className="space-y-3">
                        <button
                          onClick={() => navigate(`/leer/${book.id}`)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center space-x-3 transition-all duration-300 shadow-lg"
                        >
                          <BookOpen className="h-6 w-6" />
                          <span className="text-lg">Leer ahora</span>
                        </button>
                  <button
                          onClick={goToReader}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center space-x-3 transition-all duration-300 shadow-lg"
                  >
                          <BookOpen className="h-6 w-6" />
                          <span className="text-lg">Abrir Lector</span>
                  </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <button
                          onClick={buyNow}
                          disabled={addingToCart || !user}
                          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center space-x-3 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <BookOpen className="h-6 w-6" />
                          <span className="text-lg">
                            {addingToCart ? 'Procesando...' : 'Comprar y leer ahora'}
                          </span>
                        </button>
                    <button
                      onClick={addToCart}
                      disabled={addingToCart || !user}
                          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-4 px-8 rounded-xl flex items-center justify-center space-x-3 transition-all duration-300 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ShoppingCart className="h-6 w-6" />
                          <span className="text-lg">Añadir al carrito</span>
                    </button>
                      </div>
                )}

                {!user && (
                  <p className="text-sm text-gray-600 text-center">
                        <Link to="/login" className="text-orange-600 hover:text-orange-700 font-medium">
                      Inicia sesión
                    </Link>{' '}
                    para comprar este libro
                  </p>
                )}
              </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Para quiénes está destinado */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Para quiénes está destinado
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Este libro es perfecto si te encuentras en alguna de estas situaciones
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Problema 1 */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  ¿Estancado en ventas?
                </h3>
                <p className="text-gray-600">
                  Tienes buenos productos pero las ventas no llegan.
                </p>
              </div>

              {/* Problema 2 */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  ¿No sabes por dónde empezar?
                </h3>
                <p className="text-gray-600">
                  Mucha información sobre marketing te abruma.
                </p>
              </div>

              {/* Problema 3 */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  ¿Tu mensaje no convence?
                </h3>
                <p className="text-gray-600">
                  Sabes que tienes valor pero no logras comunicarlo.
                </p>
              </div>
            </div>

            {/* CTA de transición */}
            <div className="mt-10 text-center">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
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
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
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
                    <span className="text-sm text-gray-600">Capítulo 1 de 8</span>
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
                        { title: "Fundamentos del Marketing Digital", active: true, time: "45 min" },
                        { title: "Investigación de Mercado 2.0", active: false, time: "38 min" },
                        { title: "Creación de Contenido Viral", active: false, time: "52 min" },
                        { title: "Funnels de Conversión", active: false, time: "65 min" }
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
                          Capítulo 1: Fundamentos del Marketing Digital
                        </h1>
                        <p className="text-gray-700 leading-relaxed mb-4 text-sm sm:text-base">
                          En el mundo actual, el marketing digital no es una opción, es una necesidad. 
                          Las empresas que no adoptan estrategias digitales efectivas se quedan atrás...
                        </p>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                          ¿Qué es realmente el Marketing Digital?
                        </h3>
                        <p className="text-gray-700 leading-relaxed mb-4 text-sm sm:text-base">
                          El marketing digital es mucho más que publicar en redes sociales o crear un sitio web. 
                          Es un ecosistema completo de estrategias interconectadas que trabajan juntas para:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 text-sm sm:text-base">
                          <li><strong>Atraer</strong> a tu audiencia ideal</li>
                          <li><strong>Convertir</strong> visitantes en clientes</li>
                          <li><strong>Retener</strong> y fidelizar a tus clientes</li>
                          <li><strong>Escalar</strong> tu negocio de forma sostenible</li>
                        </ul>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                          <h4 className="font-semibold text-blue-900 mb-2">💡 Tip del Experto</h4>
                          <p className="text-blue-800 text-sm">
                            La mayoría de empresas chilenas subestiman el tiempo necesario para ver resultados 
                            en marketing digital. Los primeros resultados significativos aparecen entre 60-90 días.
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

                  <span className="text-xs sm:text-sm text-gray-600">Página 1 de 327</span>

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

            {/* CTA para probar el lector */}
            <div className="text-center mt-8">
              <button
                onClick={() => navigate(`/leer/${book.id}`)}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <BookOpen className="h-6 w-6 mr-3" />
                <span className="text-lg">Explorar el lector ahora</span>
                <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
              </button>
              <p className="text-sm text-gray-500 mt-3">
                * Compra el libro para acceso completo
              </p>
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
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Contenido completo
            </h2>
            <p className="text-xl text-gray-600 mb-2">
              8 capítulos paso a paso + bonos exclusivos
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
              <PlayCircle className="w-4 h-4 mr-2" />
              327 páginas • 8 horas de contenido premium
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                title: "Fundamentos del Marketing Digital",
                time: "45 min",
                topics: ["Qué es Marketing Digital", "4 Pilares del éxito", "Caso TechStart (+280%)"]
              },
              {
                title: "Investigación de Mercado 2.0", 
                time: "38 min",
                topics: ["Framework C.I.R.C.L.E", "Customer Avatars", "Templates de entrevistas"]
              },
              {
                title: "Creación de Contenido Viral",
                time: "52 min",
                topics: ["Framework V.I.R.A.L", "5 fórmulas de ganchos", "Post de $2.3M en ventas"]
              },
              {
                title: "Funnels de Conversión Avanzados",
                time: "65 min", 
                topics: ["Funnels que convierten 15%+", "Psicología de conversión", "Templates listos"]
              },
              {
                title: "Email Marketing Automatizado",
                time: "48 min",
                topics: ["Secuencias que venden", "21 emails listos", "Automatización total"]
              },
              {
                title: "Publicidad Pagada Rentable",
                time: "72 min",
                topics: ["ROI de 400%+", "Ads que funcionan", "Casos $10K → $100K"]
              },
              {
                title: "Analytics y Optimización", 
                time: "41 min",
                topics: ["KPIs que importan", "Dashboard de CEO", "Optimización basada en datos"]
              },
              {
                title: "Escalamiento Estratégico",
                time: "55 min",
                topics: ["$10K → $1M", "Contratación de equipos", "Sistemas escalables"]
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
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Resumen total */}
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white text-center">
            <h3 className="text-2xl font-bold mb-2">Valor total del contenido</h3>
            <div className="flex items-center justify-center space-x-8 text-lg">
              <div className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                <span>327 páginas</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                <span>8+ horas</span>
              </div>
              <div className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                <span>+$200K en templates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bonos exclusivos optimizados */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Bonos exclusivos incluidos
            </h2>
            <p className="text-lg text-gray-600">
              Valorados en más de $89.000 CLP, gratis con tu compra
            </p>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bono 1 */}
            <div className="bg-white border border-gray-200 p-6 rounded-xl hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Templates de Campañas</h3>
                  <span className="text-sm text-blue-600 font-semibold">Valor: $29.000</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                15 plantillas listas para usar en Facebook Ads y Google Ads con ROI probado.
              </p>
            </div>

            {/* Bono 2 */}
            <div className="bg-white border border-gray-200 p-6 rounded-xl hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mr-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Calculadora de ROI</h3>
                  <span className="text-sm text-blue-600 font-semibold">Valor: $19.000</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Hoja de cálculo para medir el retorno de todas tus campañas digitales.
              </p>
            </div>

            {/* Bono 3 */}
            <div className="bg-white border border-gray-200 p-6 rounded-xl hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Checklist de Lanzamiento</h3>
                  <span className="text-sm text-blue-600 font-semibold">Valor: $41.000</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Guía paso a paso para lanzar tu primera campaña exitosa sin errores.
              </p>
            </div>
          </div>

          {/* Resumen de valor */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center bg-gray-900 text-white px-6 py-3 rounded-full">
              <span className="text-sm font-medium">Valor total de bonos:</span>
              <span className="text-lg font-bold ml-2">$89.000 CLP</span>
              <span className="text-sm ml-2 opacity-75">• Incluido gratis</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Lo que dicen nuestros lectores
            </h2>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {/* Avatar de la persona */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">CM</span>
              </div>
              <div className="text-center mt-3">
                <div className="font-semibold text-gray-900 text-sm">Carlos Mendoza</div>
                <div className="text-xs text-gray-500">CEO, TechStart</div>
              </div>
            </div>

            {/* Burbuja de comentario */}
            <div className="relative bg-white rounded-2xl p-6 shadow-lg max-w-md">
              {/* Flecha de la burbuja */}
              <div className="absolute left-0 top-1/2 transform -translate-x-2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-white"></div>
              
              <div className="flex items-center mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                "Increíble libro. Implementé las estrategias del capítulo 4 y aumenté mis ventas un 280% en solo 2 meses."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Detalles del libro */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Detalles del libro
            </h2>
            <p className="text-xl text-gray-600">
              Todo lo que necesitas saber sobre este ebook
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Información técnica */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Información técnica</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Páginas</span>
                    <span className="font-bold text-gray-900">327 páginas</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Formato</span>
                    <span className="font-bold text-gray-900">PDF & EPUB</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Idioma</span>
                    <span className="font-bold text-gray-900">Español</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Tiempo de lectura</span>
                    <span className="font-bold text-gray-900">8-10 horas</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Nivel</span>
                    <span className="font-bold text-gray-900">Principiante a Avanzado</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Última actualización</span>
                    <span className="font-bold text-gray-900">Diciembre 2024</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Descripción detallada */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Descripción completa</h3>
                <div className="prose prose-lg max-w-none text-gray-700">
                  <p className="mb-4">
                    <strong>El Arte de la Programación</strong> es una guía completa y actualizada que te llevará desde los conceptos básicos 
                    hasta las estrategias más avanzadas del marketing digital moderno.
                  </p>
                  <p className="mb-4">
                    Este libro ha sido creado específicamente para emprendedores chilenos y latinoamericanos que buscan escalar 
                    sus negocios en el entorno digital actual. Cada capítulo incluye casos de estudio reales, ejercicios prácticos 
                    y herramientas que podrás implementar inmediatamente.
                  </p>
                  <p className="mb-4">
                    Con <strong>327 páginas</strong> de contenido premium, aprenderás las mismas estrategias que utilizan las 
                    empresas más exitosas de la región para generar millones en ventas digitales.
                  </p>
                  <p className="mb-6">
                    El autor, <strong>Carlos López</strong>, combina más de 10 años de experiencia en marketing digital 
                    con casos de estudio documentados de empresas que han escalado de $0 a $1M+ utilizando estas metodologías.
                  </p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
                    <h4 className="font-bold text-blue-900 mb-3">💡 Lo que hace único a este libro:</h4>
                    <ul className="space-y-2 text-blue-800">
                      <li>• Casos de estudio exclusivos de empresas chilenas</li>
                      <li>• Templates y herramientas listas para usar</li>
                      <li>• Estrategias adaptadas al mercado latinoamericano</li>
                      <li>• Actualizaciones gratuitas de por vida</li>
                      <li>• Acceso a comunidad privada de lectores</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Sobre nosotros */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="text-4xl mb-4">❤️</div>
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
              <span className="text-xl mr-2">🇨🇱</span>
              <span>Hecho en Chile</span>
            </div>
            <div className="flex items-center">
              <span className="text-xl mr-2">🚀</span>
              <span>Startup tecnológica</span>
            </div>
            <div className="flex items-center">
              <span className="text-xl mr-2">👥</span>
              <span>Expertos colaboradores</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo y descripción */}
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold mb-4">Ebooks Chile</h3>
              <p className="text-gray-400 mb-4 leading-relaxed">
                La plataforma líder en ebooks de marketing digital para emprendedores latinoamericanos. 
                Contenido premium creado por expertos locales.
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>🇨🇱</span>
                <span>Hecho con ❤️ en Chile</span>
              </div>
            </div>

            {/* Enlaces rápidos */}
            <div>
              <h4 className="font-semibold mb-4">Enlaces rápidos</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/" className="hover:text-white transition-colors">Inicio</Link></li>
                <li><Link to="/catalogo" className="hover:text-white transition-colors">Catálogo</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Mi cuenta</Link></li>
                <li><Link to="/carrito" className="hover:text-white transition-colors">Carrito</Link></li>
              </ul>
            </div>

            {/* Soporte */}
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Centro de ayuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Términos y condiciones</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de privacidad</a></li>
              </ul>
            </div>
          </div>

          {/* Línea divisora y copyright */}
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Ebooks Chile. Todos los derechos reservados.
            </p>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <span className="text-gray-400 text-sm">Síguenos:</span>
              <div className="flex space-x-3">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="text-lg">📧</span>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="text-lg">📱</span>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="text-lg">💼</span>
                </a>
            </div>
          </div>
        </div>
      </div>
      </footer>
    </div>
  )
}