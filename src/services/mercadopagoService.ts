import { supabase } from '../config/supabase'
import type { User } from '@supabase/supabase-js'

export interface MercadoPagoPreference {
  id: string
  init_point: string
  sandbox_init_point: string
}

export interface PaymentData {
  title: string
  quantity: number
  currency_id: string
  unit_price: number
  ebook_id: string
  user_id: string
}

export class MercadoPagoService {
  
  /**
   * Crear preferencia de pago en MercadoPago
   */
  static async createPaymentPreference(paymentData: PaymentData): Promise<MercadoPagoPreference> {
    try {
      console.log('Creating MercadoPago preference with data:', paymentData)
      console.log('External reference will be:', `${paymentData.user_id}-${paymentData.ebook_id}-${Date.now()}`)
      
      // Llamar a la API para crear la preferencia
      const response = await fetch('/api/create-mercadopago-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [{
            title: paymentData.title,
            quantity: paymentData.quantity,
            currency_id: paymentData.currency_id,
            unit_price: paymentData.unit_price
          }],
          back_urls: {
            success: `${window.location.origin}/payment/confirmation`,
            failure: `${window.location.origin}/payment/failure`,
            pending: `${window.location.origin}/payment/pending`
          },
          auto_return: 'approved',
          external_reference: `${paymentData.user_id}-${paymentData.ebook_id}-${Date.now()}`,
          notification_url: `${window.location.origin}/api/mercadopago-webhook`
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear la preferencia de pago')
      }

      const preference = await response.json()
      console.log('MercadoPago preference created successfully:', preference)
      
      // TODO: Guardar en Supabase después de confirmar que la redirección funciona
      // await this.savePendingPayment(paymentData, preference.id)
      
      return preference
      
    } catch (error) {
      console.error('Error creating MercadoPago preference:', error)
      throw new Error('Error al crear la preferencia de pago')
    }
  }

  /**
   * Verificar estado del pago
   */
  static async checkPaymentStatus(paymentId: string) {
    try {
      const response = await fetch(`/api/check-mercadopago-payment/${paymentId}`)
      
      if (!response.ok) {
        throw new Error('Error al verificar el pago')
      }

      const paymentInfo = await response.json()
      return paymentInfo
      
    } catch (error) {
      console.error('Error checking payment status:', error)
      throw error
    }
  }

  /**
   * Procesar pago exitoso
   */
  static async processSuccessfulPayment(
    paymentId: string, 
    externalReference: string
  ): Promise<void> {
    try {
      // Extraer user_id y ebook_id del external_reference
      const [userId, ebookId] = externalReference.split('-')
      
      // Verificar que el pago no haya sido procesado antes
      const { data: existingPurchase } = await supabase
        .from('purchases')
        .select('id')
        .eq('mercadopago_payment_id', paymentId)
        .maybeSingle()

      if (existingPurchase) {
        console.log('Payment already processed')
        return
      }

      // Obtener información del pago desde la API
      const paymentInfo = await this.checkPaymentStatus(paymentId)
      
      if (paymentInfo.status === 'approved') {
        // Crear el registro de compra
        const { error } = await supabase
          .from('purchases')
          .insert({
            user_id: userId,
            ebook_id: ebookId,
            amount: paymentInfo.transaction_amount,
            status: 'completed',
            mercadopago_payment_id: paymentId,
            mercadopago_status: paymentInfo.status,
            mercadopago_status_detail: paymentInfo.status_detail
          })

        if (error) throw error

        // Limpiar el item del carrito si existe
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', userId)
          .eq('ebook_id', ebookId)

        console.log('Purchase completed successfully')
      }
      
    } catch (error) {
      console.error('Error processing successful payment:', error)
      throw error
    }
  }

  /**
   * Guardar pago pendiente en la base de datos
   */
  private static async savePendingPayment(paymentData: PaymentData, preferenceId?: string): Promise<void> {
    try {
      const externalReference = `${paymentData.user_id}-${paymentData.ebook_id}-${Date.now()}`
      
      console.log('Saving pending payment to Supabase:', { 
        user_id: paymentData.user_id, 
        ebook_id: paymentData.ebook_id,
        preference_id: preferenceId 
      })
      
      const { error } = await supabase
        .from('mercadopago_transactions')
        .insert({
          user_id: paymentData.user_id,
          ebook_id: paymentData.ebook_id,
          preference_id: preferenceId,
          external_reference: externalReference,
          amount: paymentData.unit_price,
          currency_id: paymentData.currency_id,
          status: 'pending'
        })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Payment saved successfully to Supabase')
    } catch (error) {
      console.error('Error saving pending payment:', error)
      throw error
    }
  }

  /**
   * Obtener transacciones del usuario
   */
  static async getUserTransactions(userId: string) {
    try {
      const { data, error } = await supabase
        .from('mercadopago_transaction_details')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting user transactions:', error)
      throw error
    }
  }
}
