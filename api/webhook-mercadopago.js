// API para recibir webhooks de MercadoPago con validación de seguridad
import { MercadoPagoConfig, Payment } from 'mercadopago'
import crypto from 'crypto'

// Configuración de MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
})

const payment = new Payment(client)

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Validar webhook usando el secret
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET
    const signature = req.headers['x-signature']
    const body = JSON.stringify(req.body)
    
    if (webhookSecret && signature) {
      const isValid = validateWebhookSignature(body, signature, webhookSecret)
      if (!isValid) {
        console.log('❌ Webhook signature validation failed')
        return res.status(401).json({ error: 'Invalid signature' })
      }
    }

    const { type, data } = req.body

    console.log('📨 Webhook recibido:', { type, data })

    if (type === 'payment' && data?.id) {
      const paymentId = data.id
      console.log('💳 Procesando pago:', paymentId)

      // Obtener información del pago
      const paymentInfo = await payment.get({ id: paymentId })

      if (paymentInfo.status === 'approved') {
        // Procesar pago exitoso
        await processSuccessfulPayment(paymentInfo)
        console.log('✅ Pago procesado exitosamente:', paymentId)
      } else {
        console.log('⚠️ Pago no aprobado:', paymentInfo.status)
      }
    }

    return res.status(200).json({ received: true })

  } catch (error) {
    console.error('❌ Error procesando webhook:', error)
    return res.status(500).json({ error: 'Error processing webhook' })
  }
}

/**
 * Validar firma del webhook
 */
function validateWebhookSignature(body, signature, secret) {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')

    const receivedSignature = signature.replace('sha256=', '')
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    )
  } catch (error) {
    console.error('Error validating webhook signature:', error)
    return false
  }
}

/**
 * Procesar pago exitoso (misma lógica que confirm-mercadopago-payment.js)
 */
async function processSuccessfulPayment(paymentInfo) {
  // Esta función debería contener la misma lógica que en confirm-mercadopago-payment.js
  // para procesar pagos exitosos de usuarios e invitados
  console.log('Procesando pago exitoso:', paymentInfo.id)
  // TODO: Implementar lógica de procesamiento aquí
}
