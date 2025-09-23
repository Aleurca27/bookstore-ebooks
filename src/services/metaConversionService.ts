import { getUserData } from '../config/metaPixel'

export interface ConversionEvent {
  event_name: string
  event_time: number
  event_source_url: string
  user_data: any
  custom_data?: any
  event_id?: string
}

export class MetaConversionService {
  
  /**
   * Enviar evento a Meta Conversion API
   */
  static async sendEvent(event: ConversionEvent): Promise<void> {
    try {
      const response = await fetch('/api/meta-conversion-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al enviar evento a Meta')
      }

      const result = await response.json()
      console.log('✅ Meta Conversion API - Evento enviado:', result)
      console.log('📊 Conversion API - Response status:', response.status)
      console.log('📊 Conversion API - Event details:', JSON.stringify(event, null, 2))

    } catch (error) {
      console.error('❌ Error en Meta Conversion API:', error)
      // No lanzar error para no interrumpir el flujo de compra
    }
  }

  /**
   * Evento de compra completada
   */
  static async trackPurchase(
    user: any,
    bookTitle: string,
    bookPrice: number,
    bookId: string,
    transactionId?: string
  ): Promise<void> {
    const event: ConversionEvent = {
      event_name: 'Purchase',
      event_time: Date.now(),
      event_source_url: window.location.href,
      user_data: getUserData(user),
      custom_data: {
        content_name: bookTitle,
        content_category: 'ebook',
        content_type: 'product',
        content_ids: [bookId],
        value: bookPrice * 1000, // Convertir a CLP
        currency: 'CLP',
        num_items: 1, // Siempre 1 para ebooks
        transaction_id: transactionId,
      },
      event_id: transactionId || `${Date.now()}-${bookId}`,
    }

    await this.sendEvent(event)
  }

  /**
   * Evento de inicio de checkout
   */
  static async trackInitiateCheckout(
    user: any,
    bookTitle: string,
    bookPrice: number,
    bookId: string
  ): Promise<void> {
    const event: ConversionEvent = {
      event_name: 'InitiateCheckout',
      event_time: Date.now(),
      event_source_url: window.location.href,
      user_data: getUserData(user),
      custom_data: {
        content_name: bookTitle,
        content_category: 'ebook',
        content_type: 'product',
        content_ids: [bookId],
        value: bookPrice * 1000, // Convertir a CLP
        currency: 'CLP',
        num_items: 1,
      },
      event_id: `checkout-${Date.now()}-${bookId}`,
    }

    await this.sendEvent(event)
  }

  /**
   * Evento de registro completado
   */
  static async trackCompleteRegistration(user: any): Promise<void> {
    const event: ConversionEvent = {
      event_name: 'CompleteRegistration',
      event_time: Date.now(),
      event_source_url: window.location.href,
      user_data: getUserData(user),
      custom_data: {
        content_name: 'User Registration',
        content_category: 'registration',
      },
      event_id: `registration-${Date.now()}-${user.id}`,
    }

    await this.sendEvent(event)
  }

  /**
   * Evento de login
   */
  static async trackLogin(user: any): Promise<void> {
    const event: ConversionEvent = {
      event_name: 'Login',
      event_time: Date.now(),
      event_source_url: window.location.href,
      user_data: getUserData(user),
      custom_data: {
        content_name: 'User Login',
        content_category: 'authentication',
      },
      event_id: `login-${Date.now()}-${user.id}`,
    }

    await this.sendEvent(event)
  }
}
