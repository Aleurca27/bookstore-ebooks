// Servicio para integración con Grupo Aleurca Payment API
export interface PaymentItem {
  id: string;
  name: string;
  unit_price: number;
  quantity: number;
}

export interface PaymentCredentials {
  access_token?: string; // Para MercadoPago
  id?: string; // Para WebPay
  secretId?: string; // Para WebPay
}

export interface PaymentRequest {
  payment_type: 'MP' | 'WEBPAY';
  currency: 'CLP';
  items: PaymentItem[];
  back_urls: {
    success: string;
  };
  notification_url: string;
  external_id: string;
  commerce_name: string;
  credential: PaymentCredentials;
}

export interface MercadoPagoResponse {
  isValid: boolean;
  message: string;
  response: {
    id: string;
    init_point: string;
    sandbox_init_point: string;
    date_created: string;
    external_id: string;
  };
}

export interface WebPayResponse {
  isValid: boolean;
  message: string;
  response: {
    token: string;
    url: string;
  };
}

export type PaymentResponse = MercadoPagoResponse | WebPayResponse;

class PaymentService {
  private readonly API_BASE_URL = 'https://api.grupoaleurca.cl/v1/api/payments';
  
  // Credenciales para MercadoPago (PRODUCCIÓN)
  private readonly MP_CREDENTIALS = {
    access_token: 'APP_USR-7433295818776236-122911-5d0fc08dfe90fb448d1c224b18c0345b-1464289518'
  };
  
  // Credenciales para WebPay
  private readonly WEBPAY_CREDENTIALS = {
    id: '597045351881',
    secretId: '5cc16428d5acc0fd23b8884665cd20dd'
  };

  /**
   * Inicializa un pago con MercadoPago
   */
  async initializeMercadoPagoPayment(
    items: PaymentItem[],
    externalId: string,
    successUrl: string,
    notificationUrl: string
  ): Promise<MercadoPagoResponse> {
    const paymentRequest: PaymentRequest = {
      payment_type: 'MP',
      currency: 'CLP',
      items,
      back_urls: {
        success: successUrl
      },
      notification_url: notificationUrl,
      external_id: externalId,
      commerce_name: 'ALEURCA',
      credential: this.MP_CREDENTIALS
    };

    return this.makePaymentRequest<MercadoPagoResponse>(paymentRequest);
  }

  /**
   * Inicializa un pago con WebPay
   */
  async initializeWebPayPayment(
    items: PaymentItem[],
    externalId: string,
    successUrl: string,
    notificationUrl: string
  ): Promise<WebPayResponse> {
    const paymentRequest: PaymentRequest = {
      payment_type: 'WEBPAY',
      currency: 'CLP',
      items,
      back_urls: {
        success: successUrl
      },
      notification_url: notificationUrl,
      external_id: externalId,
      commerce_name: 'ALEURCA',
      credential: this.WEBPAY_CREDENTIALS
    };

    return this.makePaymentRequest<WebPayResponse>(paymentRequest);
  }

  /**
   * Realiza la petición HTTP a la API de pagos
   */
  private async makePaymentRequest<T extends PaymentResponse>(request: PaymentRequest): Promise<T> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Error en la API de pagos: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.isValid) {
        throw new Error(`Error en la inicialización del pago: ${data.message}`);
      }

      return data as T;
    } catch (error) {
      console.error('Error al inicializar el pago:', error);
      throw error;
    }
  }

  /**
   * Genera un ID externo único para la transacción
   */
  generateExternalId(): string {
    return `ebook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Redirige al usuario a la URL de pago
   */
  redirectToPayment(paymentUrl: string, paymentMethod: 'MP' | 'WEBPAY', token?: string): void {
    if (paymentMethod === 'WEBPAY' && token) {
      // Para WebPay, usar formulario HTML con POST
      this.redirectToWebPay(token);
    } else {
      // Para MercadoPago, redirección directa
      window.location.href = paymentUrl;
    }
  }

  /**
   * Redirige a WebPay usando formulario HTML
   */
  private redirectToWebPay(token: string): void {
    // Crear formulario dinámico
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://webpay3g.transbank.cl/webpayserver/initTransaction';
    form.style.display = 'none';

    // Crear input hidden para el token
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'token_ws';
    tokenInput.value = token;

    // Agregar input al formulario
    form.appendChild(tokenInput);

    // Agregar formulario al DOM y enviarlo
    document.body.appendChild(form);
    form.submit();
  }

  /**
   * Crea los items de pago para el ebook
   */
  createEbookPaymentItems(price: number): PaymentItem[] {
    return [
      {
        id: 'ebook_publicidad',
        name: 'Ebook de la Publicidad',
        unit_price: price,
        quantity: 1
      }
    ];
  }
}

export const paymentService = new PaymentService();

// Exportar también la clase para compatibilidad
export { PaymentService };
