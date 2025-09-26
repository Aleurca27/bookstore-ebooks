// API endpoint para obtener datos de compra por external_id
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
    const { external_id } = req.query

    if (!external_id) {
      return res.status(400).json({ 
        message: 'external_id es requerido' 
      })
    }

    // Buscar en guest_purchases primero
    let { data: purchase, error } = await supabase
      .from('guest_purchases')
      .select('*')
      .eq('external_id', external_id)
      .single()

    // Si no se encuentra en guest_purchases, buscar en purchases
    if (error && error.code === 'PGRST116') {
      const { data: registeredPurchase, error: registeredError } = await supabase
        .from('purchases')
        .select('*')
        .eq('external_id', external_id)
        .single()

      if (registeredError) {
        console.error('Error al buscar compra:', registeredError)
        return res.status(404).json({ 
          message: 'Compra no encontrada' 
        })
      }

      purchase = registeredPurchase
    } else if (error) {
      console.error('Error al buscar compra:', error)
      return res.status(500).json({ 
        message: 'Error al buscar la compra',
        error: error.message 
      })
    }

    if (!purchase) {
      return res.status(404).json({ 
        message: 'Compra no encontrada' 
      })
    }

    // Limpiar datos sensibles antes de enviar
    const safePurchaseData = {
      id: purchase.id,
      customer_name: purchase.customer_name,
      customer_email: purchase.customer_email,
      customer_phone: purchase.customer_phone,
      payment_method: purchase.payment_method,
      external_id: purchase.external_id,
      book_title: purchase.book_title,
      book_price: purchase.book_price,
      status: purchase.status,
      created_at: purchase.created_at,
      updated_at: purchase.updated_at
    }

    console.log('Compra encontrada:', safePurchaseData)

    return res.status(200).json(safePurchaseData)

  } catch (error) {
    console.error('Error en get-purchase-by-external-id:', error)
    return res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    })
  }
}
