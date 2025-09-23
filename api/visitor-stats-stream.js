// API para stream de estadísticas de visitantes en tiempo real usando SSE
export default async function handler(req, res) {
  // Configurar headers para Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  })

  const { createClient } = await import('@supabase/supabase-js')
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    res.write(`data: ${JSON.stringify({ error: 'Configuración de Supabase no encontrada' })}\n\n`)
    res.end()
    return
  }

  const supabaseClient = createClient(supabaseUrl, supabaseKey)

  // Función para obtener estadísticas actualizadas
  const getUpdatedStats = async () => {
    try {
      // Obtener estadísticas básicas
      const [
        { count: totalVisits },
        { count: visitsToday },
        { count: activeVisitors },
        { data: recentSessions }
      ] = await Promise.all([
        supabaseClient.from('page_visits').select('*', { count: 'exact', head: true }),
        supabaseClient.from('page_visits').select('*', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
        supabaseClient.from('active_sessions').select('*', { count: 'exact', head: true }).gte('last_activity', new Date(Date.now() - 5 * 60 * 1000).toISOString()),
        supabaseClient.from('active_sessions').select('*').gte('last_activity', new Date(Date.now() - 30 * 60 * 1000).toISOString()).order('last_activity', { ascending: false }).limit(10)
      ])

      // Obtener páginas más visitadas
      const { data: popularPages } = await supabaseClient
        .from('page_visits')
        .select('page_url')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      // Procesar páginas populares
      const pageCounts = {}
      if (popularPages) {
        popularPages.forEach(visit => {
          pageCounts[visit.page_url] = (pageCounts[visit.page_url] || 0) + 1
        })
      }

      const topPages = Object.entries(pageCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([url, count]) => ({ url, visits: count }))

      return {
        overview: {
          total_visits: totalVisits || 0,
          unique_visitors: 0, // Calculado por sesiones únicas
          active_visitors: activeVisitors || 0,
          visits_today: visitsToday || 0,
          visits_this_week: totalVisits || 0,
          visits_this_month: totalVisits || 0
        },
        recentSessions: recentSessions || [],
        topPages: topPages
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
      return null
    }
  }

  // Enviar estadísticas iniciales
  const initialStats = await getUpdatedStats()
  if (initialStats) {
    res.write(`data: ${JSON.stringify({ success: true, data: initialStats, timestamp: new Date().toISOString() })}\n\n`)
  }

  // Enviar actualizaciones cada 5 segundos
  const interval = setInterval(async () => {
    try {
      const stats = await getUpdatedStats()
      if (stats) {
        res.write(`data: ${JSON.stringify({ success: true, data: stats, timestamp: new Date().toISOString() })}\n\n`)
      }
    } catch (error) {
      console.error('Error en stream:', error)
      res.write(`data: ${JSON.stringify({ error: 'Error obteniendo estadísticas' })}\n\n`)
    }
  }, 5000) // Actualizar cada 5 segundos

  // Limpiar cuando se cierra la conexión
  req.on('close', () => {
    clearInterval(interval)
    console.log('🔌 Conexión SSE cerrada')
  })

  req.on('aborted', () => {
    clearInterval(interval)
    console.log('🔌 Conexión SSE abortada')
  })

  // Mantener la conexión viva
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n')
  }, 30000) // Ping cada 30 segundos

  req.on('close', () => {
    clearInterval(keepAlive)
  })
}
