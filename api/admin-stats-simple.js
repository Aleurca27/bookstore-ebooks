// API simplificado para obtener estadísticas de administración
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    
    // Usar variables de entorno de Vercel
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Configuración de Supabase faltante')
      return res.status(500).json({ 
        error: 'Configuración de Supabase no encontrada',
        details: 'Variables de entorno faltantes'
      })
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    // Intentar obtener estadísticas básicas con manejo de errores
    let totalUsers = 0
    let totalPurchases = 0
    let totalGuestPurchases = 0
    let totalRevenue = 0
    let recentUsers = []
    let recentPurchases = []
    let popularBooks = []
    let monthlyStats = []

    try {
      // Obtener usuarios
      const { data: users, error: usersError } = await supabaseClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (!usersError && users) {
        totalUsers = users.length
        recentUsers = users.slice(0, 5)
      }
    } catch (error) {
      console.log('Error obteniendo usuarios:', error.message)
    }

    try {
      // Obtener compras registradas con datos completos
      const { data: purchases, error: purchasesError } = await supabaseClient
        .from('purchases')
        .select(`
          *,
          ebooks (
            title,
            price,
            author
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!purchasesError && purchases) {
        totalPurchases = purchases.length
        totalRevenue += purchases.reduce((sum, p) => sum + (p.ebooks?.price || 0), 0)
        recentPurchases = purchases.map(p => ({ ...p, type: 'registered' }))
      }
    } catch (error) {
      console.log('Error obteniendo compras:', error.message)
    }

    try {
      // Obtener compras de invitados con datos completos
      const { data: guestPurchases, error: guestPurchasesError } = await supabaseClient
        .from('guest_purchases')
        .select(`
          *,
          ebooks (
            title,
            price,
            author
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!guestPurchasesError && guestPurchases) {
        totalGuestPurchases = guestPurchases.length
        totalRevenue += guestPurchases.reduce((sum, p) => sum + (p.ebooks?.price || 0), 0)
        recentPurchases = [
          ...recentPurchases,
          ...guestPurchases.map(p => ({ ...p, type: 'guest' }))
        ]
      }
    } catch (error) {
      console.log('Error obteniendo compras de invitados:', error.message)
    }

    // Ordenar compras recientes por fecha
    recentPurchases.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    recentPurchases = recentPurchases.slice(0, 10)

    // Generar estadísticas básicas
    const totalSales = totalPurchases + totalGuestPurchases
    const conversionRate = totalUsers > 0 ? ((totalSales / totalUsers) * 100) : 0
    const averageOrderValue = totalSales > 0 ? (totalRevenue / totalSales) : 0

    // Estadísticas mensuales básicas
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
      
      monthlyStats.push({
        month: monthName,
        users: 0,
        sales: 0,
        revenue: 0
      })
    }

    const stats = {
      overview: {
        totalUsers,
        totalPurchases,
        totalGuestPurchases,
        totalSales,
        totalRevenue,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
        salesGrowth: 0,
        revenueGrowth: 0
      },
      monthlyStats,
      popularBooks,
      recentUsers,
      recentPurchases
    }

    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error en admin-stats-simple:', error)
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    })
  }
}
