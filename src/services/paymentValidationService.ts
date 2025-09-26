// Servicio para validación de pagos con APIs REST de MercadoPago y WebPay
export interface PaymentValidationResult {
  isValid: boolean;
  status: 'approved' | 'pending' | 'rejected' | 'cancelled' | 'failed';
  paymentId: string;
  amount: number;
  externalReference?: string;
  buyOrder?: string;
  error?: string;
}

export interface MercadoPagoPaymentData {
  id: number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  external_reference: string;
  date_created: string;
  date_approved?: string;
}

export interface WebPayTransactionData {
  buy_order: string;
  session_id: string;
  amount: number;
  status: string;
  authorization_code?: string;
  payment_type_code: string;
  response_code: number;
  installments_number: number;
  transaction_date: string;
}

class PaymentValidationService {
  // Credenciales MercadoPago
  private readonly MP_ACCESS_TOKEN = 'APP_USR-7433295818776236-122911-5d0fc08dfe90fb448d1c224b18c0345b-1464289518';
  private readonly MP_API_BASE = 'https://api.mercadopago.com/v1';
  
  // Credenciales WebPay
  private readonly WEBPAY_API_KEY_ID = '597045351881';
  private readonly WEBPAY_API_KEY_SECRET = '5cc16428d5acc0fd23b8884665cd20dd';
  private readonly WEBPAY_API_BASE = 'https://webpay3g.transbank.cl';

  /**
   * Valida un pago de MercadoPago consultando su API
   */
  async validateMercadoPagoPayment(paymentId: string): Promise<PaymentValidationResult> {
    try {
      const response = await fetch(`${this.MP_API_BASE}/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error consultando pago MP: ${response.status}`);
      }

      const paymentData: MercadoPagoPaymentData = await response.json();
      
      // Mapear estados de MercadoPago a nuestros estados
      let status: PaymentValidationResult['status'];
      switch (paymentData.status) {
        case 'approved':
          status = 'approved';
          break;
        case 'pending':
        case 'in_process':
          status = 'pending';
          break;
        case 'rejected':
        case 'cancelled':
          status = 'rejected';
          break;
        default:
          status = 'failed';
      }

      return {
        isValid: status === 'approved',
        status,
        paymentId: paymentData.id.toString(),
        amount: paymentData.transaction_amount,
        externalReference: paymentData.external_reference
      };

    } catch (error) {
      console.error('Error validando pago MercadoPago:', error);
      return {
        isValid: false,
        status: 'failed',
        paymentId,
        amount: 0,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Valida un pago de WebPay confirmando la transacción
   */
  async validateWebPayPayment(token: string): Promise<PaymentValidationResult> {
    try {
      // Confirmar transacción en WebPay
      const response = await fetch(`${this.WEBPAY_API_BASE}/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`, {
        method: 'PUT',
        headers: {
          'Tbk-Api-Key-Id': this.WEBPAY_API_KEY_ID,
          'Tbk-Api-Key-Secret': this.WEBPAY_API_KEY_SECRET,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error confirmando transacción WebPay: ${response.status}`);
      }

      const transactionData: WebPayTransactionData = await response.json();
      
      // Mapear estados de WebPay a nuestros estados
      let status: PaymentValidationResult['status'];
      switch (transactionData.status) {
        case 'AUTHORIZED':
          status = 'approved';
          break;
        case 'FAILED':
          status = 'rejected';
          break;
        default:
          status = 'pending';
      }

      return {
        isValid: status === 'approved',
        status,
        paymentId: transactionData.buy_order,
        amount: transactionData.amount,
        buyOrder: transactionData.buy_order
      };

    } catch (error) {
      console.error('Error validando pago WebPay:', error);
      return {
        isValid: false,
        status: 'failed',
        paymentId: token,
        amount: 0,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Valida la firma del webhook de MercadoPago
   */
  validateMercadoPagoWebhookSignature(
    body: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      // Implementar validación de firma HMAC-SHA256
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Error validando firma webhook MP:', error);
      return false;
    }
  }

  /**
   * Obtiene el estado de un pago desde la base de datos
   */
  async getPaymentStatusFromDB(paymentId: string): Promise<PaymentValidationResult | null> {
    try {
      const response = await fetch(`/api/payment-status/${paymentId}`);
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error obteniendo estado de pago desde DB:', error);
      return null;
    }
  }
}

export const paymentValidationService = new PaymentValidationService();
