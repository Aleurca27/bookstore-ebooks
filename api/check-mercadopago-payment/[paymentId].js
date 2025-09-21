// API para verificar estado de pagos de MercadoPago (Vercel Function)
import { MercadoPagoConfig, Payment } from 'mercadopago'

// Configuración de MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-your-access-token'
})

const payment = new Payment(client)

export default async function handler(req, res) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { paymentId } = req.query

    if (!paymentId) {
      return res.status(400).json({ 
        error: 'Payment ID is required' 
      })
    }

    // Obtener información del pago desde MercadoPago
    const paymentInfo = await payment.get({ id: paymentId })

    // Log para debugging (remover en producción)
    console.log('MercadoPago Payment Status:', {
      id: paymentInfo.id,
      status: paymentInfo.status,
      status_detail: paymentInfo.status_detail,
      external_reference: paymentInfo.external_reference
    })

    // Retornar información del pago
    return res.status(200).json({
      id: paymentInfo.id,
      status: paymentInfo.status,
      status_detail: paymentInfo.status_detail,
      transaction_amount: paymentInfo.transaction_amount,
      currency_id: paymentInfo.currency_id,
      external_reference: paymentInfo.external_reference,
      payment_method_id: paymentInfo.payment_method_id,
      payment_type_id: paymentInfo.payment_type_id,
      date_created: paymentInfo.date_created,
      date_approved: paymentInfo.date_approved
    })

  } catch (error) {
    console.error('Error checking MercadoPago payment:', error)
    
    return res.status(500).json({
      error: 'Error al verificar el pago',
      details: process.env.NODE_ENV === 'production' ? 'Error interno' : error.message
    })
  }
}
