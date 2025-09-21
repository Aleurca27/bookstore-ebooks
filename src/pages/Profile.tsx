import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Mail, Calendar, BookOpen, Book, Clock, TrendingUp, Award } from 'lucide-react'
import { Icon } from '@iconify/react'
import { supabase, type Ebook } from '../config/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface Purchase {
  id: string
  amount: number
  created_at: string
  ebook: Ebook
}

interface ProfileProps {
  user: SupabaseUser | null
}

export default function Profile({ user }: ProfileProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchPurchases()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchPurchases = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id,
          amount,
          created_at,
          ebook:ebooks(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPurchases(data || [])
    } catch (error) {
      console.error('Error fetching purchases:', error)
    } finally {
      setLoading(false)
    }
  }

  const openReader = (book: Ebook) => {
    // Redirigir al lector del libro
    window.location.href = `/leer/${book.id}`
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon icon="material-symbols:person-outline" className="w-6 h-6 text-gray-400" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Inicia sesión para ver tu perfil
          </h2>
          <Link 
            to="/login" 
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header minimalista */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Icon icon="material-symbols:person" className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-gray-900">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </h1>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          
          {/* Estadísticas compactas */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center">
              <div className="text-lg font-medium text-gray-900">{purchases.length}</div>
              <div className="text-xs text-gray-500">Libros</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-medium text-gray-900">
                ${purchases.reduce((sum, p) => sum + p.amount, 0).toLocaleString('es-CL')}
              </div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-medium text-gray-900">
                {new Date(user.created_at).getFullYear()}
              </div>
              <div className="text-xs text-gray-500">Miembro desde</div>
            </div>
          </div>
        </div>

        {/* Biblioteca */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Mi Biblioteca</h2>
            <div className="flex items-center text-xs text-gray-500">
              <Icon icon="material-symbols:book-outline" className="w-4 h-4 mr-1" />
              <span>{purchases.length} {purchases.length === 1 ? 'libro' : 'libros'}</span>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="flex space-x-3 py-3">
                    <div className="bg-gray-100 h-16 w-12 rounded-sm"></div>
                    <div className="flex-1 space-y-2">
                      <div className="bg-gray-100 h-3 rounded w-3/4"></div>
                      <div className="bg-gray-100 h-2 rounded w-1/2"></div>
                      <div className="bg-gray-100 h-2 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon icon="material-symbols:book-outline" className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">
                Tu biblioteca está vacía
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Explora nuestro catálogo y encuentra tu próximo libro favorito
              </p>
              <Link 
                to="/catalogo" 
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Explorar catálogo
              </Link>
            </div>
          ) : (
            <div>
              {/* Primeros 4 libros */}
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {purchases.slice(0, 4).map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center space-x-3 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors group"
                  >
                    <img
                      src="/images/portala libro.png"
                      alt={purchase.ebook.title}
                      className="w-12 h-16 object-cover rounded-sm shadow-sm"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {purchase.ebook.title}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">por {purchase.ebook.author}</p>
                      <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
                        <span className="flex items-center">
                          <Icon icon="material-symbols:calendar-today" className="w-3 h-3 mr-1" />
                          {new Date(purchase.created_at).toLocaleDateString('es-ES')}
                        </span>
                        <span>${purchase.amount.toLocaleString('es-CL')}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openReader(purchase.ebook)}
                        className="flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Icon icon="material-symbols:book-outline" className="w-3 h-3 mr-1" />
                        Leer
                      </button>
                      <Link
                        to={`/libro/${purchase.ebook.id}`}
                        className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <Icon icon="material-symbols:visibility-outline" className="w-3 h-3 mr-1" />
                        Ver
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mostrar más libros si hay más de 4 */}
              {purchases.length > 4 && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      const accordion = document.getElementById('more-books-accordion')
                      const content = document.getElementById('more-books-content')
                      const icon = document.getElementById('accordion-icon')
                      
                      if (content && icon) {
                        if (content.style.display === 'none' || content.style.display === '') {
                          content.style.display = 'block'
                          icon.style.transform = 'rotate(180deg)'
                        } else {
                          content.style.display = 'none'
                          icon.style.transform = 'rotate(0deg)'
                        }
                      }
                    }}
                    className="w-full flex items-center justify-center py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <span className="mr-2">Ver más libros</span>
                    <Icon 
                      id="accordion-icon"
                      icon="material-symbols:keyboard-arrow-down" 
                      className="w-4 h-4 transition-transform duration-200"
                    />
                  </button>
                  
                  <div id="more-books-content" className="hidden mt-2 max-h-60 overflow-y-auto">
                    <div className="space-y-1">
                      {purchases.slice(4).map((purchase) => (
                        <div
                          key={purchase.id}
                          className="flex items-center space-x-3 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors group"
                        >
                          <img
                            src="/images/portala libro.png"
                            alt={purchase.ebook.title}
                            className="w-12 h-16 object-cover rounded-sm shadow-sm"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {purchase.ebook.title}
                            </h3>
                            <p className="text-xs text-gray-500 truncate">por {purchase.ebook.author}</p>
                            <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
                              <span className="flex items-center">
                                <Icon icon="material-symbols:calendar-today" className="w-3 h-3 mr-1" />
                                {new Date(purchase.created_at).toLocaleDateString('es-ES')}
                              </span>
                              <span>${purchase.amount.toLocaleString('es-CL')}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openReader(purchase.ebook)}
                              className="flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                            >
                              <Icon icon="material-symbols:book-outline" className="w-3 h-3 mr-1" />
                              Leer
                            </button>
                            <Link
                              to={`/libro/${purchase.ebook.id}`}
                              className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            >
                              <Icon icon="material-symbols:visibility-outline" className="w-3 h-3 mr-1" />
                              Ver
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
