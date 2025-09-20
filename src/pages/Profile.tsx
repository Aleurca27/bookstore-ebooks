import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Mail, Calendar, Download, Book } from 'lucide-react'
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

  const downloadBook = (book: Ebook) => {
    // Simular descarga
    console.log(`Downloading ${book.title}`)
    // En una implementación real, aquí descargarías el archivo desde Supabase Storage
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Inicia sesión para ver tu perfil
          </h2>
          <Link to="/login" className="btn-primary">
            Iniciar sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información del perfil */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-12 w-12 text-primary-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </h2>
                <div className="flex items-center justify-center text-gray-600 mb-4">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center justify-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    Miembro desde {new Date(user.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Libros comprados</span>
                    <span className="font-semibold text-gray-900">{purchases.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total gastado</span>
                    <span className="font-semibold text-gray-900">
                      €{purchases.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Biblioteca personal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Mi Biblioteca</h2>
                <div className="flex items-center text-gray-600">
                  <Book className="h-5 w-5 mr-2" />
                  <span>{purchases.length} {purchases.length === 1 ? 'libro' : 'libros'}</span>
                </div>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="flex space-x-4">
                        <div className="bg-gray-300 h-20 w-14 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="bg-gray-300 h-4 rounded w-3/4"></div>
                          <div className="bg-gray-300 h-4 rounded w-1/2"></div>
                          <div className="bg-gray-300 h-4 rounded w-1/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : purchases.length === 0 ? (
                <div className="text-center py-12">
                  <Book className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aún no has comprado ningún libro
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Explora nuestro catálogo y encuentra tu próximo libro favorito
                  </p>
                  <Link to="/catalogo" className="btn-primary">
                    Explorar catálogo
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <img
                        src={purchase.ebook.cover_image || 'https://via.placeholder.com/80x120'}
                        alt={purchase.ebook.title}
                        className="w-14 h-20 object-cover rounded"
                      />
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {purchase.ebook.title}
                        </h3>
                        <p className="text-gray-600 mb-1">por {purchase.ebook.author}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>
                            Comprado el {new Date(purchase.created_at).toLocaleDateString('es-ES')}
                          </span>
                          <span>€{purchase.amount}</span>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => downloadBook(purchase.ebook)}
                          className="btn-primary text-sm flex items-center space-x-2"
                        >
                          <Download className="h-4 w-4" />
                          <span>Descargar</span>
                        </button>
                        <Link
                          to={`/libro/${purchase.ebook.id}`}
                          className="btn-secondary text-sm text-center"
                        >
                          Ver detalles
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
