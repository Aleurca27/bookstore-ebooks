// Configuración de WebPay Plus para el frontend
// NOTA: El SDK de Transbank es para servidor, no para navegador
// Por eso creamos la configuración sin importar el SDK

const isProduction = import.meta.env.PROD

// Configuración de WebPay (solo URLs y configuración)
export const webpayConfig = {
  // URLs para la integración
  integrationBaseUrl: 'https://webpay3gint.transbank.cl',
  productionBaseUrl: 'https://webpay3g.transbank.cl',
  
  // Credenciales de integración (PRUEBA)
  integration: {
    commerceCode: '597055555532',
    apiKey: '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C'
  },
  
  // URLs de retorno
  returnUrl: typeof window !== 'undefined' ? `${window.location.origin}/payment/confirmation` : '',
  finalUrl: typeof window !== 'undefined' ? `${window.location.origin}/payment/success` : '',
  
  isProduction,
  
  // Configuración del entorno actual
  getCurrentConfig() {
    return this.integration; // Siempre usar integración por ahora
  },
  
  getCurrentBaseUrl() {
    return this.integrationBaseUrl; // Siempre usar integración por ahora
  }
}

// Tipos para TypeScript
export interface WebPayTransaction {
  token: string
  url: string
}

export interface WebPayConfirmation {
  vci: string
  amount: number
  status: string
  buy_order: string
  session_id: string
  card_detail: {
    card_number: string
  }
  accounting_date: string
  transaction_date: string
  authorization_code: string
  payment_type_code: string
  response_code: number
  installments_amount?: number
  installments_number?: number
  balance?: number
}

export default webpayPlus
