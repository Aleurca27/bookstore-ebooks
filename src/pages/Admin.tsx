import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Upload, DollarSign, Users, BookOpen } from 'lucide-react'
import { supabase, type Ebook } from '../config/supabase'
import type { User } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

interface AdminProps {
  user: User | null
}

interface EbookForm {
  title: string
  author: string
  description: string
  price: number
  category: string
  cover_image: string
  featured: boolean
}

export default function Admin({ user }: AdminProps) {
  const [books, setBooks] = useState<Ebook[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBook, setEditingBook] = useState<Ebook | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalSales: 0,
    totalRevenue: 0
  })

  const [form, setForm] = useState<EbookForm>({
    title: '',
    author: '',
    description: '',
    price: 0,
    category: '',
    cover_image: '',
    featured: false
  })

  useEffect(() => {
    if (user) {
      checkAdminStatus()
      fetchBooks()
      fetchStats()
    }
  }, [user])

  const checkAdminStatus = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setIsAdmin(data?.is_admin || false)
    } catch (error) {
      console.error('Error checking admin status:', error)
      setIsAdmin(false)
    }
  }

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('ebooks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBooks(data || [])
    } catch (error) {
      console.error('Error fetching books:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Total de libros
      const { count: booksCount } = await supabase
        .from('ebooks')
        .select('*', { count: 'exact', head: true })

      // Total de ventas y ingresos
      const { data: salesData, error: salesError } = await supabase
        .from('purchases')
        .select('amount')
        .eq('status', 'completed')

      if (salesError) throw salesError

      const totalSales = salesData?.length || 0
      const totalRevenue = salesData?.reduce((sum, sale) => sum + sale.amount, 0) || 0

      setStats({
        totalBooks: booksCount || 0,
        totalSales,
        totalRevenue
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingBook) {
        // Actualizar libro existente
        const { error } = await supabase
          .from('ebooks')
          .update({
            title: form.title,
            author: form.author,
            description: form.description,
            price: form.price,
            category: form.category,
            cover_image: form.cover_image,
            featured: form.featured
          })
          .eq('id', editingBook.id)

        if (error) throw error
        toast.success('Libro actualizado correctamente')
      } else {
        // Crear nuevo libro
        const { error } = await supabase
          .from('ebooks')
          .insert([{
            title: form.title,
            author: form.author,
            description: form.description,
            price: form.price,
            category: form.category,
            cover_image: form.cover_image,
            featured: form.featured
          }])

        if (error) throw error
        toast.success('Libro creado correctamente')
      }

      resetForm()
      fetchBooks()
      fetchStats()
    } catch (error) {
      console.error('Error saving book:', error)
      toast.error('Error al guardar el libro')
    }
  }

  const handleEdit = (book: Ebook) => {
    setEditingBook(book)
    setForm({
      title: book.title,
      author: book.author,
      description: book.description || '',
      price: book.price,
      category: book.category || '',
      cover_image: book.cover_image || '',
      featured: book.featured || false
    })
    setShowForm(true)
  }

  const handleDelete = async (bookId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este libro?')) return

    try {
      const { error } = await supabase
        .from('ebooks')
        .delete()
        .eq('id', bookId)

      if (error) throw error
      
      setBooks(prev => prev.filter(book => book.id !== bookId))
      toast.success('Libro eliminado correctamente')
      fetchStats()
    } catch (error) {
      console.error('Error deleting book:', error)
      toast.error('Error al eliminar el libro')
    }
  }

  const resetForm = () => {
    setForm({
      title: '',
      author: '',
      description: '',
      price: 0,
      category: '',
      cover_image: '',
      featured: false
    })
    setEditingBook(null)
    setShowForm(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Acceso restringido
          </h2>
          <p className="text-gray-600 mb-4">
            Debes iniciar sesión para acceder al panel de administración
          </p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Acceso denegado
          </h2>
          <p className="text-gray-600 mb-4">
            No tienes permisos de administrador para acceder a esta página
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Panel de Administración</h1>
          
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-primary-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Libros</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBooks}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ventas Totales</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-gray-900">€{stats.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botón para añadir libro */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Añadir Nuevo Libro</span>
          </button>
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingBook ? 'Editar Libro' : 'Nuevo Libro'}
            </h2>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
                  Autor
                </label>
                <input
                  type="text"
                  id="author"
                  value={form.author}
                  onChange={(e) => setForm(prev => ({ ...prev, author: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Precio (€)
                </label>
                <input
                  type="number"
                  id="price"
                  value={form.price}
                  onChange={(e) => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  step="0.01"
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <input
                  type="text"
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="cover_image" className="block text-sm font-medium text-gray-700 mb-2">
                  URL de la portada
                </label>
                <input
                  type="url"
                  id="cover_image"
                  value={form.cover_image}
                  onChange={(e) => setForm(prev => ({ ...prev, cover_image: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm(prev => ({ ...prev, featured: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Libro destacado</span>
                </label>
              </div>

              <div className="md:col-span-2 flex space-x-4">
                <button type="submit" className="btn-primary">
                  {editingBook ? 'Actualizar' : 'Crear'} Libro
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de libros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Gestión de Libros</h2>
          </div>

          {loading ? (
            <div className="p-6">
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex space-x-4">
                    <div className="bg-gray-300 h-16 w-12 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="bg-gray-300 h-4 rounded w-3/4"></div>
                      <div className="bg-gray-300 h-4 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Libro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Autor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Destacado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {books.map((book) => (
                    <tr key={book.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            className="h-12 w-8 object-cover rounded"
                            src={book.cover_image || 'https://via.placeholder.com/60x80'}
                            alt={book.title}
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{book.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {book.author}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {book.category || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{book.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          book.featured 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {book.featured ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2 justify-end">
                          <button
                            onClick={() => handleEdit(book)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(book.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
