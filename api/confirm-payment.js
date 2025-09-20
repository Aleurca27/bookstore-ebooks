// API para confirmar transacciones WebPay (Vercel Function)
import { WebpayPlus, IntegrationApiKeys, IntegrationCommerceCodes } from 'transbank-sdk'
import { createClient } from '@supabase/supabase-js'

// Configurar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Service key para operaciones administrativas
)

// Configurar WebPay
const isProduction = process.env.NODE_ENV === 'production'

if (isProduction) {
  WebpayPlus.configureForProduction(
    process.env.WEBPAY_COMMERCE_CODE,
    process.env.WEBPAY_API_KEY
  )
} else {
  WebpayPlus.configureForTesting(
    IntegrationCommerceCodes.WEBPAY_PLUS,
    IntegrationApiKeys.WEBPAY
  )
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ error: 'Token requerido' })
    }

    // Confirmar transacción con WebPay
    const confirmation = await WebpayPlus.Transaction.commit(token)

    console.log('WebPay Confirmation:', confirmation)

    // Obtener detalles de la transacción pendiente
    const { data: transaction, error: fetchError } = await supabase
      .from('webpay_transactions')
      .select('*')
      .eq('token', token)
      .single()

    if (fetchError || !transaction) {
      throw new Error('Transacción no encontrada')
    }

    // Verificar si el pago fue exitoso
    const isSuccess = confirmation.response_code === 0 && confirmation.status === 'AUTHORIZED'

    if (isSuccess) {
      // Actualizar estado de la transacción
      await supabase
        .from('webpay_transactions')
        .update({
          status: 'completed',
          webpay_response: confirmation,
          authorization_code: confirmation.authorization_code,
          updated_at: new Date().toISOString()
        })
        .eq('token', token)

      // Crear registros de compra
      const purchases = transaction.cart_items.map(item => ({
        user_id: transaction.user_id,
        ebook_id: item.ebook_id,
        amount: item.price,
        webpay_token: token,
        webpay_buy_order: transaction.buy_order,
        webpay_authorization_code: confirmation.authorization_code,
        status: 'completed'
      }))

      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert(purchases)

      if (purchaseError) throw purchaseError

      // Limpiar carrito
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', transaction.user_id)

    } else {
      // Marcar como fallida
      await supabase
        .from('webpay_transactions')
        .update({
          status: 'failed',
          webpay_response: confirmation,
          updated_at: new Date().toISOString()
        })
        .eq('token', token)
    }

    return res.status(200).json(confirmation)

  } catch (error) {
    console.error('Error confirming payment:', error)
    
    return res.status(500).json({
      error: 'Error al confirmar el pago',
      details: isProduction ? 'Error interno' : error.message
    })
  }
}
