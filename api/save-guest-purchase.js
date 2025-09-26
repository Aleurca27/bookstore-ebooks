// API endpoint para guardar compras de invitados con nueva integración de pagos
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      payment_method,
      external_id,
      payment_data,
      book_title,
      book_price
    } = req.body

    // Validar datos requeridos
    if (!customer_name || !customer_email || !payment_method || !external_id) {
      return res.status(400).json({ 
        message: 'Faltan datos requeridos' 
      })
    }

    // Preparar datos para insertar
    const guestPurchaseData = {
      customer_name,
      customer_email,
      customer_phone: customer_phone || null,
      payment_method,
      external_id,
      book_title: book_title || 'Ebook de la Publicidad',
      book_price: book_price || 25.0,
      payment_data: payment_data || null,
      status: 'pending', // Estado inicial
      created_at: new Date().toISOString()
    }

    // Insertar en la tabla guest_purchases
    const { data, error } = await supabase
      .from('guest_purchases')
      .insert([guestPurchaseData])
      .select()

    if (error) {
      console.error('Error al insertar compra de invitado:', error)
      return res.status(500).json({ 
        message: 'Error al guardar la compra',
        error: error.message 
      })
    }

    console.log('Compra de invitado guardada exitosamente:', data[0])

    return res.status(200).json({
      success: true,
      message: 'Compra guardada exitosamente',
      data: data[0]
    })

  } catch (error) {
    console.error('Error en save-guest-purchase:', error)
    return res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    })
  }
}
