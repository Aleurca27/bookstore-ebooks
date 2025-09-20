import { webpayConfig, type WebPayTransaction, type WebPayConfirmation } from '../config/webpay'
import { supabase } from '../config/supabase'
import type { User } from '@supabase/supabase-js'

export interface PaymentIntent {
  buyOrder: string
  sessionId: string
  amount: number
  userId: string
  cartItems: Array<{
    ebook_id: string
    price: number
    title: string
  }>
}

export class PaymentService {
  
  /**
   * Crear transacción en WebPay (usando API real)
   */
  static async createTransaction(paymentIntent: PaymentIntent): Promise<WebPayTransaction> {
    try {
      // Guardar la transacción pendiente primero
      await this.savePendingTransaction(paymentIntent, 'temp_token')
      
      // Llamar a la API para crear la transacción real
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          buyOrder: paymentIntent.buyOrder,
          sessionId: paymentIntent.sessionId,
          amount: paymentIntent.amount,
          returnUrl: `${window.location.origin}/payment/confirmation`
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear la transacción')
      }

      const data = await response.json()
      
      // Actualizar la transacción con el token real
      await this.updateTransactionToken('temp_token', data.token, paymentIntent.userId)

      return {
        token: data.token,
        url: data.url
      }
    } catch (error) {
      console.error('Error creating WebPay transaction:', error)
      throw new Error('Error al crear la transacción de pago')
    }
  }

  /**
   * Confirmar transacción después del pago (usando API real)
   */
  static async confirmTransaction(token: string): Promise<WebPayConfirmation> {
    try {
      // Llamar a la API para confirmar la transacción real
      const response = await fetch('/api/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al confirmar la transacción')
      }

      const confirmation = await response.json()
      return confirmation
      
    } catch (error) {
      console.error('Error confirming WebPay transaction:', error)
      throw new Error('Error al confirmar la transacción')
    }
  }

  /**
   * Generar número de orden único
   */
  static generateBuyOrder(): string {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    return `EB-${timestamp}-${random}`
  }

  /**
   * Generar ID de sesión único
   */
  static generateSessionId(userId: string): string {
    const timestamp = Date.now()
    return `${userId}-${timestamp}`
  }

  /**
   * Actualizar token de transacción temporal
   */
  private static async updateTransactionToken(tempToken: string, realToken: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('webpay_transactions')
        .update({ token: realToken })
        .eq('token', tempToken)
        .eq('user_id', userId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating transaction token:', error)
      throw error
    }
  }

  /**
   * Guardar transacción pendiente
   */
  private static async savePendingTransaction(
    paymentIntent: PaymentIntent, 
    token: string
  ): Promise<void> {
    try {
      // Guardar la transacción principal
      const { error: transactionError } = await supabase
        .from('webpay_transactions')
        .insert({
          token,
          buy_order: paymentIntent.buyOrder,
          session_id: paymentIntent.sessionId,
          amount: paymentIntent.amount,
          user_id: paymentIntent.userId,
          status: 'pending',
          cart_items: paymentIntent.cartItems
        })

      if (transactionError) throw transactionError

    } catch (error) {
      console.error('Error saving pending transaction:', error)
      throw error
    }
  }

  /**
   * Procesar confirmación del pago
   */
  private static async processPaymentConfirmation(
    token: string, 
    confirmation: WebPayConfirmation
  ): Promise<void> {
    try {
      // Obtener los detalles de la transacción pendiente
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

        // Crear registros de compra para cada item
        const purchases = transaction.cart_items.map((item: any) => ({
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

        // Limpiar carrito del usuario
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', transaction.user_id)

      } else {
        // Marcar transacción como fallida
        await supabase
          .from('webpay_transactions')
          .update({
            status: 'failed',
            webpay_response: confirmation,
            updated_at: new Date().toISOString()
          })
          .eq('token', token)
      }

    } catch (error) {
      console.error('Error processing payment confirmation:', error)
      throw error
    }
  }

  /**
   * Obtener estado de una transacción
   */
  static async getTransactionStatus(token: string) {
    try {
      const { data, error } = await supabase
        .from('webpay_transactions')
        .select('*')
        .eq('token', token)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting transaction status:', error)
      throw error
    }
  }
}
