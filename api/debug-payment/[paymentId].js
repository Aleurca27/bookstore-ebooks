// API para debug de pagos - verificar estado de pagos en la base de datos
import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://fdxmbeijgmlgefesnhnd.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

    console.log('🔍 Debug: Buscando pago:', paymentId)

    // Buscar en purchases
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('mercadopago_payment_id', paymentId)
      .single()

    // Buscar en guest_purchases
    const { data: guestPurchase, error: guestError } = await supabase
      .from('guest_purchases')
      .select('*')
      .eq('mercado_pago_payment_id', paymentId)
      .single()

    // Buscar en mercadopago_transactions
    const { data: transaction, error: transactionError } = await supabase
      .from('mercadopago_transactions')
      .select('*')
      .eq('payment_id', paymentId)
      .single()

    const debugInfo = {
      paymentId,
      timestamp: new Date().toISOString(),
      searches: {
        purchases: {
          data: purchase,
          error: purchaseError,
          found: !!purchase
        },
        guest_purchases: {
          data: guestPurchase,
          error: guestError,
          found: !!guestPurchase
        },
        mercadopago_transactions: {
          data: transaction,
          error: transactionError,
          found: !!transaction
        }
      },
      summary: {
        totalFound: [purchase, guestPurchase, transaction].filter(Boolean).length,
        locations: []
      }
    }

    if (purchase) debugInfo.summary.locations.push('purchases')
    if (guestPurchase) debugInfo.summary.locations.push('guest_purchases')
    if (transaction) debugInfo.summary.locations.push('mercadopago_transactions')

    console.log('📊 Debug info:', debugInfo)

    return res.status(200).json(debugInfo)

  } catch (error) {
    console.error('❌ Error en debug de pago:', error)
    
    return res.status(500).json({
      error: 'Error al buscar información del pago',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    })
  }
}
