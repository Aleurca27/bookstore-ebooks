// API para confirmar pagos de MercadoPago (Vercel Function)
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

// Configuración de MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-your-access-token'
})

const payment = new Payment(client)

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { payment_id, external_reference } = req.body

    // Validar datos requeridos
    if (!payment_id) {
      return res.status(400).json({ 
        error: 'Payment ID requerido' 
      })
    }

    console.log('Confirmando pago MercadoPago:', { payment_id, external_reference })

    // Obtener información del pago desde MercadoPago
    const paymentInfo = await payment.get({ id: payment_id })

    console.log('Información del pago:', {
      id: paymentInfo.id,
      status: paymentInfo.status,
      status_detail: paymentInfo.status_detail,
      external_reference: paymentInfo.external_reference
    })

    // Verificar si el pago fue exitoso
    const isSuccess = paymentInfo.status === 'approved'

    if (isSuccess) {
      // Procesar pago exitoso
      await processSuccessfulPayment(paymentInfo, supabase)
      
      console.log('✅ Pago procesado exitosamente')
      
      return res.status(200).json({
        success: true,
        status: 'approved',
        message: 'Pago procesado exitosamente',
        payment_id: paymentInfo.id,
        external_reference: paymentInfo.external_reference
      })
    } else {
      // Pago no exitoso
      console.log('❌ Pago no exitoso:', paymentInfo.status)
      
      return res.status(400).json({
        success: false,
        status: paymentInfo.status,
        message: 'Pago no exitoso',
        payment_id: paymentInfo.id
      })
    }

  } catch (error) {
    console.error('❌ Error confirmando pago MercadoPago:', error)
    
    return res.status(500).json({
      error: 'Error al confirmar el pago',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    })
  }
}

/**
 * Procesar pago exitoso
 */
async function processSuccessfulPayment(paymentInfo, supabase) {
  try {
    // Extraer información del external_reference
    const externalRef = paymentInfo.external_reference || ''
    
    // Buscar si es una compra de invitado
    if (externalRef.includes('GUEST-')) {
      await processGuestPurchase(paymentInfo, supabase)
    } else {
      await processUserPurchase(paymentInfo, supabase)
    }

  } catch (error) {
    console.error('Error procesando pago exitoso:', error)
    throw error
  }
}

/**
 * Procesar compra de usuario registrado
 */
async function processUserPurchase(paymentInfo, supabase) {
  const [userId, ebookId] = paymentInfo.external_reference.split('-')
  
  // Verificar que el pago no haya sido procesado antes
  const { data: existingPurchase } = await supabase
    .from('purchases')
    .select('id')
    .eq('mercadopago_payment_id', paymentInfo.id)
    .maybeSingle()

  if (existingPurchase) {
    console.log('Payment already processed')
    return
  }

  // Obtener datos del usuario para incluir en la compra
  const { data: userData } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single()

  // Crear el registro de compra con datos completos
  const { error } = await supabase
    .from('purchases')
    .insert({
      user_id: userId,
      ebook_id: ebookId,
      amount: paymentInfo.transaction_amount / 1000, // Convertir de centavos a USD
      status: 'completed',
      customer_name: userData?.full_name || 'Usuario Registrado',
      customer_email: paymentInfo.payer?.email || 'No disponible',
      payment_method: 'mercadopago',
      mercadopago_payment_id: paymentInfo.id,
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

  console.log('✅ Compra de usuario procesada exitosamente')
}

/**
 * Procesar compra de invitado
 */
async function processGuestPurchase(paymentInfo, supabase) {
  // Extraer el purchase_id del external_reference (formato: GUEST-{purchaseId}-{ebookId})
  const externalRef = paymentInfo.external_reference || ''
  const parts = externalRef.split('-')
  
  let guestPurchase = null
  
  if (parts.length >= 2 && parts[0] === 'GUEST') {
    const purchaseId = parts[1]
    
    // Buscar la compra de invitado por ID
    const { data, error: fetchError } = await supabase
      .from('guest_purchases')
      .select('*')
      .eq('id', purchaseId)
      .single()
    
    guestPurchase = data
    if (fetchError) {
      console.log('Guest purchase not found for ID:', purchaseId)
      return
    }
  } else {
    // Fallback: buscar por payment_id
    const { data, error: fetchError } = await supabase
      .from('guest_purchases')
      .select('*')
      .eq('mercado_pago_payment_id', paymentInfo.id)
      .single()

    guestPurchase = data
    if (fetchError || !guestPurchase) {
      console.log('Guest purchase not found for payment:', paymentInfo.id)
      return
    }
  }

  // Actualizar estado de la compra de invitado con método de pago
  const { error: updateError } = await supabase
    .from('guest_purchases')
    .update({
      status: 'completed',
      payment_method: 'mercadopago',
      mercado_pago_payment_id: paymentInfo.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', guestPurchase.id)

  if (updateError) throw updateError

  // Enviar correo con credenciales
  await sendGuestCredentials(guestPurchase, supabase)

  console.log('✅ Compra de invitado procesada exitosamente')
}

/**
 * Enviar credenciales por correo al invitado
 */
async function sendGuestCredentials(guestPurchase, supabase) {
  try {
    // Obtener información del libro
    const { data: book, error: bookError } = await supabase
      .from('ebooks')
      .select('title, author')
      .eq('id', guestPurchase.ebook_id)
      .single()

    if (bookError) throw bookError

    // Generar URL de acceso
    const accessUrl = `${process.env.VITE_SITE_URL || 'https://emprendecl.com'}/leer/${guestPurchase.ebook_id}`

    // Enviar correo con credenciales
    const emailResponse = await fetch(`${process.env.VITE_SITE_URL || 'https://emprendecl.com'}/api/send-credentials-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: guestPurchase.email,
        name: guestPurchase.name,
        password: guestPurchase.access_password,
        bookTitle: book.title,
        bookAuthor: book.author,
        accessUrl: accessUrl
      }),
    })

    if (emailResponse.ok) {
      console.log('✅ Credenciales enviadas por correo a:', guestPurchase.email)
    } else {
      console.error('❌ Error enviando credenciales por correo')
    }

  } catch (error) {
    console.error('❌ Error enviando credenciales:', error)
    // No lanzar error para no interrumpir el flujo
  }
}
