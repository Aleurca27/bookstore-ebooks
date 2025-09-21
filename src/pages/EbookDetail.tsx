import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Star, ShoppingCart, Download, ArrowLeft, Heart } from 'lucide-react'
import { supabase, type Ebook } from '../config/supabase'
import { getBookCoverImageWithSize } from '../utils/imageOverrides'
import type { User } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

interface EbookDetailProps {
  user: User | null
}

export default function EbookDetail({ user }: EbookDetailProps) {
  const { id } = useParams<{ id: string }>()
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navegación */}
        <div className="mb-8">
          <Link 
            to="/catalogo" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver al catálogo
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Imagen del libro */}
          <div className="flex justify-center">
            <div className="max-w-md">
              <img
                src={getBookCoverImageWithSize(book, 'large')}
                alt={book.title}
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>

          {/* Información del libro */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {book.title}
              </h1>
              <p className="text-xl text-gray-600 mb-4">por {book.author}</p>
              
              {book.category && (
                <span className="inline-block bg-primary-100 text-primary-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
                  {book.category}
                </span>
              )}

              <div className="flex items-center mb-6">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="text-gray-600 ml-2">(4.8) • 234 reseñas</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Descripción</h3>
              <p className="text-gray-700 leading-relaxed">
                {book.description}
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-3xl font-bold text-primary-600">€{book.price}</span>
                  <span className="text-gray-500 ml-2">Precio único</span>
                </div>
              </div>

              <div className="space-y-4">
                {isPurchased ? (
                  <button
                    onClick={downloadBook}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Download className="h-5 w-5" />
                    <span>Descargar libro</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={addToCart}
                      disabled={addingToCart || !user}
                      className="w-full btn-primary py-3 text-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      <span>
                        {addingToCart ? 'Añadiendo...' : 'Añadir al carrito'}
                      </span>
                    </button>

                    <button className="w-full btn-secondary py-3 text-lg flex items-center justify-center space-x-2">
                      <Heart className="h-5 w-5" />
                      <span>Añadir a favoritos</span>
                    </button>
                  </>
                )}

                {!user && (
                  <p className="text-sm text-gray-600 text-center">
                    <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                      Inicia sesión
                    </Link>{' '}
                    para comprar este libro
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Detalles del libro</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Categoría</dt>
                  <dd className="text-sm text-gray-900">{book.category}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Formato</dt>
                  <dd className="text-sm text-gray-900">PDF, EPUB</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Idioma</dt>
                  <dd className="text-sm text-gray-900">Español</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Páginas</dt>
                  <dd className="text-sm text-gray-900">~250 páginas</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
