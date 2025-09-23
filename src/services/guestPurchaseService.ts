import { supabase } from '../config/supabase'
import { MercadoPagoService } from './mercadopagoService'
import { PaymentService } from './paymentService'
import { EmailService } from './emailService'
import type { GuestData, PaymentMethod } from '../components/GuestCheckoutModal'

export interface GuestPurchase {
  id: string
  email: string
  name: string
  phone: string
  ebook_id: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
  access_password: string
  created_at: string
  updated_at: string
}

export class GuestPurchaseService {
  
  /**
   * Generar contraseña de acceso temporal
   */
  private static generateAccessPassword(): string {
    return EmailService.generateSecurePassword()
  }

  /**
   * Crear compra de invitado
   */
  static async createGuestPurchase(
    guestData: GuestData, 
    ebookId: string, 
    amount: number
  ): Promise<{ purchaseId: string; accessPassword: string }> {
    try {
      const accessPassword = this.generateAccessPassword()
      
      // Crear registro de compra de invitado
      const { data, error } = await supabase
        .from('guest_purchases')
        .insert({
          email: guestData.email,
          name: guestData.name,
          phone: guestData.phone,
          ebook_id: ebookId,
          amount: amount,
          status: 'pending',
          payment_method: guestData.paymentMethod || 'mercadopago',
          access_password: accessPassword
        })
        .select('id')
        .single()

      if (error) throw error

      return {
        purchaseId: data.id,
        accessPassword
      }
    } catch (error) {
      console.error('Error creating guest purchase:', error)
      throw new Error('Error al crear la compra de invitado')
    }
  }

  /**
   * Procesar pago para invitado
   */
  static async processGuestPayment(
    guestData: GuestData,
    ebookId: string,
    amount: number,
    bookTitle: string
  ): Promise<{ paymentUrl: string; purchaseId: string; accessPassword: string }> {
    try {
      // Crear compra de invitado
      const { purchaseId, accessPassword } = await this.createGuestPurchase(
        guestData,
        ebookId,
        amount
      )

      let paymentUrl: string

      if (guestData.paymentMethod === 'mercadopago') {
        // Crear preferencia de pago en MercadoPago
        const paymentData = {
          title: bookTitle,
          quantity: 1,
          currency_id: 'CLP',
          unit_price: Math.round(amount * 1000), // Convertir a CLP (USD a CLP)
          ebook_id: ebookId,
          user_id: `GUEST-${purchaseId}` // Usar formato GUEST- para identificar compras de invitado
        }

        console.log('Creando preferencia de MercadoPago para invitado:', paymentData)
        console.log('Datos individuales:', {
          ebookId,
          purchaseId,
          user_id: `GUEST-${purchaseId}`,
          ebook_id: ebookId
        })

        const preference = await MercadoPagoService.createPaymentPreference(paymentData)
        paymentUrl = preference.init_point || preference.sandbox_init_point

        if (!paymentUrl) {
          throw new Error('No se pudo obtener la URL de pago de MercadoPago')
        }
      } else {
        // Crear transacción en WebPay
        const buyOrder = `GUEST-${purchaseId}`
        const sessionId = `guest-${guestData.email}-${Date.now()}`
        const amountInCents = Math.round(amount * 100) // WebPay requiere centavos

        console.log('Creando transacción de WebPay para invitado:', {
          buyOrder,
          sessionId,
          amount: amountInCents
        })

        const paymentIntent = {
          buyOrder,
          sessionId,
          amount: amountInCents,
          userId: `guest-${guestData.email}`,
          cartItems: [{
            ebook_id: ebookId,
            price: amount,
            title: bookTitle
          }]
        }

        console.log('Llamando a PaymentService.createTransaction con:', paymentIntent)
        
        let transaction
        try {
          transaction = await PaymentService.createTransaction(paymentIntent)
          console.log('Transacción WebPay creada exitosamente:', transaction)
        } catch (webpayError) {
          console.error('Error específico en WebPay:', webpayError)
          throw webpayError
        }
        
        paymentUrl = `${transaction.url}?token_ws=${transaction.token}`

        // Actualizar la compra de invitado con el token de WebPay
        await supabase
          .from('guest_purchases')
          .update({ mercado_pago_payment_id: transaction.token })
          .eq('id', purchaseId)
      }

      return {
        paymentUrl,
        purchaseId,
        accessPassword
      }
    } catch (error) {
      console.error('Error processing guest payment:', error)
      throw error
    }
  }

  /**
   * Enviar credenciales por correo después de compra exitosa
   */
  static async sendAccessCredentials(
    guestData: GuestData,
    ebookId: string,
    accessPassword: string
  ): Promise<void> {
    try {
      // Obtener información del libro
      const { data: book, error: bookError } = await supabase
        .from('ebooks')
        .select('title, author')
        .eq('id', ebookId)
        .single()

      if (bookError) throw bookError

      // Generar URL de acceso
      const accessUrl = `${window.location.origin}/leer/${ebookId}`

      // Enviar correo con credenciales
      await EmailService.sendAccessCredentials({
        email: guestData.email,
        name: guestData.name,
        password: accessPassword,
        bookTitle: book.title,
        bookAuthor: book.author,
        accessUrl: accessUrl
      })

      console.log('✅ Credenciales enviadas por correo a:', guestData.email)
    } catch (error) {
      console.error('❌ Error enviando credenciales por correo:', error)
      // No lanzar error para no interrumpir el flujo
    }
  }

  /**
   * Verificar acceso de invitado
   */
  static async verifyGuestAccess(
    ebookId: string, 
    accessPassword: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('guest_purchases')
        .select('id, status')
        .eq('ebook_id', ebookId)
        .eq('access_password', accessPassword)
        .eq('status', 'completed')
        .maybeSingle()

      if (error) throw error
      return !!data
    } catch (error) {
      console.error('Error verifying guest access:', error)
      return false
    }
  }

  /**
   * Obtener datos de compra de invitado
   */
  static async getGuestPurchase(
    ebookId: string, 
    accessPassword: string
  ): Promise<GuestPurchase | null> {
    try {
      const { data, error } = await supabase
        .from('guest_purchases')
        .select('*')
        .eq('ebook_id', ebookId)
        .eq('access_password', accessPassword)
        .eq('status', 'completed')
        .maybeSingle()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting guest purchase:', error)
      return null
    }
  }

  /**
   * Actualizar estado de compra de invitado
   */
  static async updateGuestPurchaseStatus(
    purchaseId: string, 
    status: 'completed' | 'failed'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('guest_purchases')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', purchaseId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating guest purchase status:', error)
      throw error
    }
  }

}
