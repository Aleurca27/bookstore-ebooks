// API para tracking de visitantes en tiempo real
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Configuración de Supabase no encontrada' })
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    const {
      page_url,
      session_id,
      user_id,
      referrer
    } = req.body

    // Obtener información del cliente
    const client_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    const user_agent = req.headers['user-agent']

    // Generar session_id si no existe
    const finalSessionId = session_id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Registrar la visita
    const { error: visitError } = await supabaseClient
      .from('page_visits')
      .insert({
        page_url: page_url || '/',
        visitor_ip: client_ip,
        user_agent: user_agent,
        referrer: referrer,
        session_id: finalSessionId,
        user_id: user_id || null
      })

    if (visitError) {
      console.error('Error registrando visita:', visitError)
    }

    // Primero verificar si la sesión ya existe
    const { data: existingSession } = await supabaseClient
      .from('active_sessions')
      .select('*')
      .eq('session_id', finalSessionId)
      .single()

    if (existingSession) {
      // Actualizar sesión existente
      const { error: updateError } = await supabaseClient
        .from('active_sessions')
        .update({
          last_activity: new Date().toISOString(),
          page_views: existingSession.page_views + 1,
          visitor_ip: client_ip,
          user_agent: user_agent
        })
        .eq('session_id', finalSessionId)

      if (updateError) {
        console.error('Error actualizando sesión existente:', updateError)
      }
    } else {
      // Crear nueva sesión
      const { error: insertError } = await supabaseClient
        .from('active_sessions')
        .insert({
          session_id: finalSessionId,
          visitor_ip: client_ip,
          user_agent: user_agent,
          last_activity: new Date().toISOString(),
          page_views: 1,
          user_id: user_id || null
        })

      if (insertError) {
        console.error('Error creando nueva sesión:', insertError)
      }
    }

    res.status(200).json({
      success: true,
      session_id: finalSessionId,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error en track-visitor:', error)
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    })
  }
}
