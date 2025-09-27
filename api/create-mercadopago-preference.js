// API para crear preferencias de pago en MercadoPago (Vercel Function)
import { MercadoPagoConfig, Preference } from 'mercadopago'

// Configuración de MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
})

const preference = new Preference(client)

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { items, back_urls, auto_return, external_reference, notification_url } = req.body

    // Validar datos requeridos
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Se requiere al menos un item para crear la preferencia' 
      })
    }

    // Crear la preferencia en MercadoPago
    const preferenceData = {
      items: items.map(item => ({
        title: item.title,
        quantity: item.quantity || 1,
        currency_id: item.currency_id || 'CLP',
        unit_price: parseFloat(item.unit_price)
      })),
      back_urls: back_urls || {
        success: process.env.MERCADOPAGO_SUCCESS_URL || `${process.env.VITE_SITE_URL || 'http://localhost:5173'}/payment/success`,
        failure: process.env.MERCADOPAGO_FAILURE_URL || `${process.env.VITE_SITE_URL || 'http://localhost:5173'}/payment/failure`,
        pending: `${process.env.VITE_SITE_URL || 'http://localhost:5173'}/payment/pending`
      },
      auto_return: auto_return || 'approved',
      external_reference: external_reference,
      notification_url: notification_url,
      payment_methods: {
        excluded_payment_types: [],
        excluded_payment_methods: [],
        installments: 12
      },
      shipments: {
        mode: 'not_specified'
      },
      payer: {
        name: 'Cliente',
        surname: 'Ebooks',
        email: 'cliente@ebooks.cl'
      }
    }

    const response = await preference.create({ body: preferenceData })

    // Log para debugging (remover en producción)
    console.log('MercadoPago Preference Created:', {
      id: response.id,
      external_reference: external_reference,
      total_amount: items.reduce((sum, item) => sum + (item.unit_price * (item.quantity || 1)), 0)
    })

    // Retornar respuesta exitosa
    return res.status(200).json({
      id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point
    })

  } catch (error) {
    console.error('Error creating MercadoPago preference:', error)
    
    return res.status(500).json({
      error: 'Error al crear la preferencia de pago',
      details: process.env.NODE_ENV === 'production' ? 'Error interno' : error.message
    })
  }
}
