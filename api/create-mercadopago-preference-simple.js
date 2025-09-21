// Versión simplificada para desarrollo local
export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('API called with:', req.body)
    console.log('Environment variables available:', {
      hasAccessToken: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
      accessTokenStart: process.env.MERCADOPAGO_ACCESS_TOKEN?.substring(0, 20) + '...'
    })

    const { items, back_urls, auto_return, external_reference } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Se requiere al menos un item para crear la preferencia' 
      })
    }

    // Verificar que tenemos el access token
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken || accessToken === 'TEST-your-access-token') {
      return res.status(500).json({ 
        error: 'Access token de MercadoPago no configurado',
        details: 'Verifica que MERCADOPAGO_ACCESS_TOKEN esté configurado'
      })
    }

    // Llamar directamente a la API de MercadoPago usando fetch
    const mercadoPagoResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: items.map(item => ({
          title: item.title,
          quantity: item.quantity || 1,
          currency_id: item.currency_id || 'CLP',
          unit_price: parseFloat(item.unit_price)
        })),
        back_urls: back_urls || {
          success: 'http://localhost:3000/payment/success',
          failure: 'http://localhost:3000/payment/failure',
          pending: 'http://localhost:3000/payment/pending'
        },
        auto_return: auto_return || 'approved',
        external_reference: external_reference,
        payment_methods: {
          excluded_payment_types: [],
          excluded_payment_methods: [],
          installments: 12
        }
      })
    })

    const responseText = await mercadoPagoResponse.text()
    console.log('MercadoPago response status:', mercadoPagoResponse.status)
    console.log('MercadoPago response:', responseText)

    if (!mercadoPagoResponse.ok) {
      return res.status(500).json({
        error: 'Error de MercadoPago',
        details: responseText,
        status: mercadoPagoResponse.status
      })
    }

    const preference = JSON.parse(responseText)
    console.log('Preference created successfully:', preference.id)

    return res.status(200).json({
      id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point
    })

  } catch (error) {
    console.error('Error creating MercadoPago preference:', error)
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    })
  }
}
