// Meta Conversion API - Vercel Function
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      event_name,
      event_time,
      action_source = 'website',
      event_source_url,
      user_data,
      custom_data,
      event_id,
    } = req.body

    // Validar datos requeridos
    if (!event_name || !event_time || !user_data) {
      return res.status(400).json({ 
        error: 'Faltan datos requeridos: event_name, event_time, user_data' 
      })
    }

    // Configuración de Meta Conversion API
    const pixelId = process.env.META_PIXEL_ID
    const accessToken = process.env.META_ACCESS_TOKEN

    if (!pixelId || !accessToken) {
      return res.status(500).json({ 
        error: 'Meta Pixel ID o Access Token no configurados' 
      })
    }

    // Preparar datos para la API de Meta
    const conversionData = {
      data: [
        {
          event_name,
          event_time: Math.floor(event_time / 1000), // Convertir a timestamp Unix
          action_source,
          event_source_url: event_source_url || `${process.env.VITE_SITE_URL}/`,
          user_data: {
            ...user_data,
            client_ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            client_user_agent: req.headers['user-agent'],
          },
          custom_data,
          event_id,
        }
      ],
      test_event_code: process.env.META_TEST_EVENT_CODE, // Solo para testing
    }

    console.log('📊 Enviando evento a Meta Conversion API:', {
      event_name,
      pixel_id: pixelId,
      user_data: user_data ? 'presente' : 'ausente',
      custom_data: custom_data ? 'presente' : 'ausente',
    })

    // Enviar evento a Meta Conversion API
    const response = await fetch(`https://graph.facebook.com/v18.0/${pixelId}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(conversionData),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Error en Meta Conversion API:', result)
      return res.status(500).json({ 
        error: 'Error al enviar evento a Meta Conversion API',
        details: result 
      })
    }

    console.log('✅ Evento enviado exitosamente a Meta:', result)

    res.status(200).json({
      success: true,
      events_received: result.events_received,
      messages: result.messages,
    })

  } catch (error) {
    console.error('❌ Error en Meta Conversion API:', error)
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    })
  }
}
