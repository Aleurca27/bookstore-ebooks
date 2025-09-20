// API para crear transacciones WebPay (Vercel Function)
import { WebpayPlus, Options, IntegrationApiKeys, IntegrationCommerceCodes, Environment } from 'transbank-sdk'

// Configuración de WebPay
const isProduction = process.env.NODE_ENV === 'production'

// Configurar WebPay según ambiente
if (isProduction) {
  // PRODUCCIÓN - Usar tus credenciales reales
  WebpayPlus.configureForProduction(
    process.env.WEBPAY_COMMERCE_CODE, // Tu código de comercio real
    process.env.WEBPAY_API_KEY        // Tu API key real
  )
} else {
  // DESARROLLO - Credenciales de integración
  WebpayPlus.configureForTesting(
    IntegrationCommerceCodes.WEBPAY_PLUS,
    IntegrationApiKeys.WEBPAY
  )
}

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { buyOrder, sessionId, amount, returnUrl } = req.body

    // Validar datos requeridos
    if (!buyOrder || !sessionId || !amount || !returnUrl) {
      return res.status(400).json({ 
        error: 'Faltan parámetros requeridos: buyOrder, sessionId, amount, returnUrl' 
      })
    }

    // Crear transacción en WebPay
    const response = await WebpayPlus.Transaction.create(
      buyOrder,
      sessionId,
      amount,
      returnUrl
    )

    // Log para debugging (remover en producción)
    console.log('WebPay Transaction Created:', {
      buyOrder,
      sessionId,
      amount,
      token: response.token
    })

    // Retornar respuesta exitosa
    return res.status(200).json({
      token: response.token,
      url: response.url
    })

  } catch (error) {
    console.error('Error creating WebPay transaction:', error)
    
    return res.status(500).json({
      error: 'Error al crear la transacción',
      details: isProduction ? 'Error interno' : error.message
    })
  }
}
