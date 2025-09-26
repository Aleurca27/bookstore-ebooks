// API endpoint para consultar el estado de un pago desde la base de datos
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { id } = req.query

    if (!id) {
      return res.status(400).json({ 
        message: 'Payment ID es requerido' 
      })
    }

    // Buscar en guest_purchases primero
    let { data: purchase, error } = await supabase
      .from('guest_purchases')
      .select('*')
      .or(`external_id.eq.${id},payment_id.eq.${id}`)
      .single()

    // Si no se encuentra en guest_purchases, buscar en purchases
    if (error && error.code === 'PGRST116') {
      const { data: registeredPurchase, error: registeredError } = await supabase
        .from('purchases')
        .select('*')
        .or(`external_id.eq.${id},payment_id.eq.${id}`)
        .single()

      if (registeredError) {
        console.error('Error al buscar pago:', registeredError)
        return res.status(404).json({ 
          message: 'Pago no encontrado' 
        })
      }

      purchase = registeredPurchase
    } else if (error) {
      console.error('Error al buscar pago:', error)
      return res.status(500).json({ 
        message: 'Error al buscar el pago',
        error: error.message 
      })
    }

    if (!purchase) {
      return res.status(404).json({ 
        message: 'Pago no encontrado' 
      })
    }

    // Mapear estado de la base de datos a formato estándar
    let status;
    switch (purchase.status) {
      case 'completed':
        status = 'approved';
        break;
      case 'pending':
        status = 'pending';
        break;
      case 'failed':
      case 'cancelled':
        status = 'rejected';
        break;
      default:
        status = 'pending';
    }

    const paymentStatus = {
      isValid: status === 'approved',
      status,
      paymentId: purchase.payment_id || purchase.external_id,
      amount: purchase.book_price || 0,
      externalReference: purchase.external_id,
      buyOrder: purchase.payment_method === 'webpay' ? purchase.payment_id : undefined,
      lastUpdated: purchase.updated_at || purchase.created_at
    }

    console.log('Estado de pago consultado:', paymentStatus)

    return res.status(200).json(paymentStatus)

  } catch (error) {
    console.error('Error en payment-status:', error)
    return res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    })
  }
}
