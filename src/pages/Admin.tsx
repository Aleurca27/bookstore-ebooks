import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  ShoppingCart, 
  Eye, 
  TrendingUp, 
  DollarSign, 
  BookOpen, 
  Calendar,
  Download,
  UserCheck,
  CreditCard,
  BarChart3,
  Activity,
  RefreshCw,
  Globe,
  Clock,
  Monitor
} from 'lucide-react'
import { Icon } from '@iconify/react'
import { supabase } from '../config/supabase'
import type { User } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { useVisitorTracking } from '../hooks/useVisitorTracking'
import { useVisitorStatsStream } from '../hooks/useVisitorStatsStream'

interface AdminStats {
  totalUsers: number
  totalPurchases: number
  totalGuestPurchases: number
  totalRevenue: number
  totalPageViews: number
  recentUsers: any[]
  recentPurchases: any[]
  monthlyStats: {
    month: string
    users: number
    sales: number
    revenue: number
  }[]
  popularBooks: {
    title: string
    sales: number
    revenue: number
  }[]
  conversionRate?: number
  averageOrderValue?: number
  salesGrowth?: number
  revenueGrowth?: number
}

interface AdminProps {
  user: User | null
}

export default function Admin({ user }: AdminProps) {
  const navigate = useNavigate()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Hook para estadísticas de visitantes en tiempo real
  const { stats: visitorStats, loading: visitorLoading, error: visitorError, isConnected, reconnect } = useVisitorStatsStream()

  // Tracking específico para la página de admin
  useVisitorTracking({
    pageUrl: '/admin',
    userId: user?.id,
    enabled: true
  })

  // Verificar si el usuario es admin
  const isAdmin = user?.email === 'aleurca@gmail.com' || user?.email === 'contacto@emprendecl.com'

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!isAdmin) {
      toast.error('No tienes permisos para acceder a esta página')
      navigate('/')
      return
    }

    fetchStats()
  }, [user, navigate, isAdmin])

  const fetchStats = async () => {
    try {
      setRefreshing(true)
      
      // Usar el API endpoint simplificado
      const response = await fetch('/api/admin-stats-simple')
      
      if (!response.ok) {
        throw new Error('Error al obtener estadísticas')
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido')
      }
      
      const apiStats = result.data
      
      setStats({
        totalUsers: apiStats.overview.totalUsers,
        totalPurchases: apiStats.overview.totalPurchases,
        totalGuestPurchases: apiStats.overview.totalGuestPurchases,
        totalRevenue: apiStats.overview.totalRevenue,
        totalPageViews: apiStats.overview.totalUsers + apiStats.overview.totalSales,
        recentUsers: apiStats.recentUsers,
        recentPurchases: apiStats.recentPurchases,
        monthlyStats: apiStats.monthlyStats,
        popularBooks: apiStats.popularBooks,
        // Métricas adicionales del API
        conversionRate: apiStats.overview.conversionRate,
        averageOrderValue: apiStats.overview.averageOrderValue,
        salesGrowth: apiStats.overview.salesGrowth,
        revenueGrowth: apiStats.overview.revenueGrowth
      })

    } catch (error) {
      console.error('Error fetching admin stats:', error)
      toast.error('Error al cargar las estadísticas')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount * 1000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error al cargar las estadísticas</p>
          <button 
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Icon icon="material-symbols:admin-panel-settings" className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Indicador de conexión en tiempo real */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Tiempo Real' : 'Desconectado'}
                </span>
              </div>
              
              <button
                onClick={fetchStats}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
              
              {!isConnected && (
                <button
                  onClick={reconnect}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Reconectar
                </button>
              )}
              
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Volver al sitio
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Ventas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPurchases + stats.totalGuestPurchases}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Visitas Estimadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPageViews}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas de Visitantes en Tiempo Real */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Globe className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Visitantes Activos</p>
                <p className="text-2xl font-bold text-green-600">
                  {visitorLoading ? '...' : (visitorStats?.overview?.active_visitors || 0)}
                </p>
                <p className="text-xs text-gray-500">Últimos 5 minutos</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Monitor className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Visitas Hoy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {visitorLoading ? '...' : (visitorStats?.overview?.visits_today || 0)}
                </p>
                <p className="text-xs text-gray-500">Últimas 24 horas</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Visitantes Únicos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {visitorLoading ? '...' : (visitorStats?.overview?.unique_visitors || 0)}
                </p>
                <p className="text-xs text-gray-500">Últimas 24 horas</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Visitas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {visitorLoading ? '...' : (visitorStats?.overview?.total_visits || 0)}
                </p>
                <p className="text-xs text-gray-500">Desde siempre</p>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tasa de Conversión</p>
                <p className="text-2xl font-bold text-gray-900">{stats.conversionRate?.toFixed(1) || 0}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Valor Promedio</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageOrderValue || 0)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Crecimiento Ventas</p>
                <p className={`text-2xl font-bold ${(stats.salesGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(stats.salesGrowth || 0) >= 0 ? '+' : ''}{stats.salesGrowth?.toFixed(1) || 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Calendar className="h-6 w-6 text-pink-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Crecimiento Ingresos</p>
                <p className={`text-2xl font-bold ${(stats.revenueGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(stats.revenueGrowth || 0) >= 0 ? '+' : ''}{stats.revenueGrowth?.toFixed(1) || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Usuarios recientes */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Usuarios Recientes</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.recentUsers.map((user, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <UserCheck className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{user.full_name || 'Sin nombre'}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Compras recientes */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Compras Recientes</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.recentPurchases.map((purchase, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-green-100 rounded-full">
                      <CreditCard className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {purchase.ebooks?.title || 'Sin título'}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {purchase.type === 'registered' 
                          ? `👤 ${purchase.customer_name || 'Usuario'} (${purchase.customer_email || 'Sin email'})`
                          : `👤 ${purchase.name} (${purchase.email})`
                        }
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        📞 {purchase.type === 'registered' 
                          ? (purchase.customer_phone || 'Sin teléfono')
                          : purchase.phone
                        }
                      </p>
                      <p className="text-xs text-blue-600">
                        💳 {purchase.type === 'registered' 
                          ? (purchase.payment_method || 'MercadoPago')
                          : (purchase.payment_method || 'MercadoPago')
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(purchase.ebooks?.price || 0)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(purchase.created_at)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {purchase.type === 'registered' ? 'Registrado' : 'Invitado'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas mensuales */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Estadísticas Mensuales</h3>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ventas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ingresos
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.monthlyStats.map((stat, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {stat.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {stat.sales}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(stat.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Libros más populares */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Libros Más Populares</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.popularBooks.map((book, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{book.title}</p>
                        <p className="text-sm text-gray-600">{book.sales} ventas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(book.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Páginas más visitadas */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Páginas Más Visitadas</h3>
              <p className="text-sm text-gray-600 mt-1">Últimas 24 horas</p>
            </div>
            <div className="p-6">
              {visitorLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Cargando...</span>
                </div>
              ) : visitorError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-2">Error al cargar datos</p>
                  <button
                    onClick={reconnect}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Reconectar
                  </button>
                </div>
              ) : visitorStats?.topPages?.length > 0 ? (
                <div className="space-y-3">
                  {visitorStats.topPages.map((page, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          <Globe className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {page.url === '/' ? 'Página Principal' : page.url}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {page.visits} visitas
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay datos de visitas disponibles</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}