import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Star, ShoppingCart, Download, ArrowLeft, Heart, CheckCircle, Users, BookOpen, Award, Clock, Target, TrendingUp, Zap } from 'lucide-react'
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

    if (!book) return

    setAddingToCart(true)
    try {
      // Simular compra exitosa creando un registro en purchases
      const { error } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          ebook_id: book.id,
          amount: book.price,
          status: 'completed'
        })

      if (error) {
        if (error.code === '23505') {
          toast.success('¡Ya tienes este libro!')
          navigate(`/leer/${book.id}`)
        } else {
          throw error
        }
      } else {
        toast.success('¡Compra exitosa! Comenzando lectura...')
        setTimeout(() => {
          navigate(`/leer/${book.id}`)
        }, 1500)
      }
    } catch (error) {
      console.error('Error processing purchase:', error)
      toast.error('Error al procesar la compra')
    } finally {
      setAddingToCart(false)
    }
  }

  const downloadBook = async () => {
    if (!book?.file_url) {
      toast.error('Archivo no disponible')
      return
    }

    // Simular descarga del archivo
    toast.success('Iniciando descarga...')
    // En una implementación real, aquí descargarías el archivo desde Supabase Storage
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
    <div className="min-h-screen bg-white">
      {/* Hero Section del libro */}
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Navegación */}
          <div className="mb-8">
            <Link 
              to="/catalogo" 
              className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver al catálogo
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Imagen del libro */}
            <div className="flex justify-center lg:justify-start">
              <div className="max-w-sm">
                <img
                  src={getBookCoverImageWithSize(book, 'large')}
                  alt={book.title}
                  className="w-full h-auto rounded-2xl shadow-2xl"
                />
              </div>
            </div>

            {/* Información principal */}
            <div className="space-y-6">
              {book.category && (
                <span className="inline-block bg-orange-100 text-orange-800 text-sm font-semibold px-4 py-2 rounded-full">
                  {book.category}
                </span>
              )}

              <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                {book.title}
              </h1>
              
              <p className="text-2xl text-gray-600 font-light">por {book.author}</p>

              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-6 w-6 text-yellow-400 fill-current" />
                  ))}
                  <span className="text-gray-700 ml-2 font-medium">(4.8)</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="h-5 w-5 mr-2" />
                  <span>2,147 lectores</span>
                </div>
              </div>

              <p className="text-lg text-gray-700 leading-relaxed">
                {book.description}
              </p>

              <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                <div>
                  <span className="text-4xl font-black text-gray-900">${Math.round(book.price * 800).toLocaleString('es-CL')} CLP</span>
                  <p className="text-gray-500">Acceso de por vida</p>
                </div>
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
                      onClick={downloadBook}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center space-x-3 transition-all duration-300 shadow-lg"
                    >
                      <Download className="h-6 w-6" />
                      <span className="text-lg">Descargar PDF</span>
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
      </section>

      {/* Lo que aprenderás */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Lo que aprenderás
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Este ebook te enseñará estrategias probadas que han generado millones en ventas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              "Cómo crear funnels de venta que convierten al 15%+",
              "Estrategias de copywriting que multiplican las ventas",
              "Técnicas de automatización para escalar sin límites",
              "Psicología del consumidor para persuadir éticamente",
              "Casos de estudio reales de empresas chilenas exitosas",
              "Templates y herramientas listas para usar",
              "Métricas clave y cómo optimizar cada paso",
              "Estrategias de retargeting y remarketing avanzado"
            ].map((benefit, index) => (
              <div key={index} className="flex items-start space-x-4">
                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                <span className="text-gray-700 text-lg">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contenido del libro */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Contenido completo
            </h2>
            <p className="text-xl text-gray-600">
              8 capítulos paso a paso + bonos exclusivos
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Capítulo 1: Fundamentos del Marketing Digital
                </h3>
                <p className="text-gray-600 mb-4">
                  Estableciendo las bases sólidas para tu estrategia digital
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>45 minutos de lectura</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Capítulo 2: Investigación de Mercado 2.0
                </h3>
                <p className="text-gray-600 mb-4">
                  Herramientas modernas para entender a tu audiencia
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>38 minutos de lectura</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Capítulo 3: Creación de Contenido Viral
                </h3>
                <p className="text-gray-600 mb-4">
                  Fórmulas probadas para contenido que se comparte solo
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>52 minutos de lectura</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Capítulo 4: Funnels de Conversión Avanzados
                </h3>
                <p className="text-gray-600 mb-4">
                  Diseño y optimización de embudos que convierten
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>65 minutos de lectura</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Capítulo 5: Email Marketing Automatizado
                </h3>
                <p className="text-gray-600 mb-4">
                  Secuencias que venden mientras duermes
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>48 minutos de lectura</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Capítulo 6: Publicidad Pagada Rentable
                </h3>
                <p className="text-gray-600 mb-4">
                  Facebook Ads y Google Ads que generan ROI positivo
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>72 minutos de lectura</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Capítulo 7: Analytics y Optimización
                </h3>
                <p className="text-gray-600 mb-4">
                  Métricas que importan y cómo mejorar constantemente
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>41 minutos de lectura</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Capítulo 8: Escalamiento Estratégico
                </h3>
                <p className="text-gray-600 mb-4">
                  Cómo hacer crecer tu negocio de forma sostenible
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>55 minutos de lectura</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bonos incluidos */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Bonos exclusivos incluidos
            </h2>
            <p className="text-xl text-gray-600">
              Valor adicional de $89.000 CLP - ¡Gratis con tu compra!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Templates de Campañas
              </h3>
              <p className="text-gray-600 mb-4">
                15 plantillas listas para usar en Facebook Ads y Google Ads
              </p>
              <div className="text-sm font-semibold text-blue-600">
                Valor: $29.000 CLP
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Calculadora de ROI
              </h3>
              <p className="text-gray-600 mb-4">
                Hoja de cálculo para medir el retorno de todas tus campañas
              </p>
              <div className="text-sm font-semibold text-green-600">
                Valor: $19.000 CLP
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Checklist de Lanzamiento
              </h3>
              <p className="text-gray-600 mb-4">
                Guía paso a paso para lanzar tu primera campaña exitosa
              </p>
              <div className="text-sm font-semibold text-purple-600">
                Valor: $41.000 CLP
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Lo que dicen nuestros lectores
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Increíble libro. Implementé las estrategias del capítulo 4 y aumenté mis ventas un 280% en solo 2 meses."
              </p>
              <div className="font-semibold text-gray-900">Carlos Mendoza</div>
              <div className="text-sm text-gray-500">CEO, TechStart Chile</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Los templates incluidos me ahorraron meses de trabajo. Mi ROAS pasó de 2.1 a 4.8 usando sus fórmulas."
              </p>
              <div className="font-semibold text-gray-900">María González</div>
              <div className="text-sm text-gray-500">CMO, Fashion Store</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "El capítulo de email marketing es oro puro. Mis secuencias automatizadas generan $500K+ al mes."
              </p>
              <div className="font-semibold text-gray-900">Rodrigo Silva</div>
              <div className="text-sm text-gray-500">Fundador, Digital Agency</div>
            </div>
          </div>
        </div>
      </section>

      {/* Detalles técnicos */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Detalles del libro
              </h2>
              <dl className="space-y-6">
                <div className="flex items-center space-x-4">
                  <BookOpen className="h-6 w-6 text-gray-400" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Páginas</dt>
                    <dd className="text-lg text-gray-900">327 páginas</dd>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Clock className="h-6 w-6 text-gray-400" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Tiempo de lectura</dt>
                    <dd className="text-lg text-gray-900">~8 horas</dd>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Award className="h-6 w-6 text-gray-400" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nivel</dt>
                    <dd className="text-lg text-gray-900">Intermedio a Avanzado</dd>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Users className="h-6 w-6 text-gray-400" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Idioma</dt>
                    <dd className="text-lg text-gray-900">Español (Chile)</dd>
                  </div>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Garantía de satisfacción
              </h2>
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 mb-2">
                      30 días de garantía
                    </h3>
                    <p className="text-green-700 leading-relaxed">
                      Si no aumentas tus ventas en 30 días aplicando nuestras estrategias, 
                      te devolvemos el 100% de tu dinero. Sin preguntas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Acceso inmediato tras la compra</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Actualizaciones gratuitas de por vida</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Compatible con todos los dispositivos</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Formatos PDF y EPUB incluidos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            ¿Listo para transformar tu negocio?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Únete a los 2,147 emprendedores que ya están aplicando estas estrategias
          </p>
          
          <div className="bg-white/10 rounded-xl p-6 mb-8 inline-block">
            <div className="text-2xl font-bold mb-2">Oferta por tiempo limitado</div>
            <div className="text-4xl font-black text-orange-400">${Math.round(book.price * 800).toLocaleString('es-CL')} CLP</div>
            <div className="text-sm text-gray-300">Precio normal: $79.990 CLP</div>
          </div>

          <div className="space-y-4">
            {isPurchased ? (
              <button
                onClick={() => navigate(`/leer/${book.id}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 shadow-xl"
              >
                Leer tu libro ahora
              </button>
            ) : (
              <button
                onClick={buyNow}
                disabled={addingToCart || !user}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 shadow-xl disabled:opacity-50"
              >
                {addingToCart ? 'Procesando...' : 'Comprar y leer ahora'}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}