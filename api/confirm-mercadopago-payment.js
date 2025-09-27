// API para confirmar pagos de MercadoPago (Vercel Function)
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

// Configuración de MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
})

const payment = new Payment(client)

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://fdxmbeijgmlgefesnhnd.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

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
 * Procesar pago exitoso (unificado para usuarios e invitados)
 */
async function processSuccessfulPayment(paymentInfo, supabase) {
  try {
    console.log('💳 Procesando pago exitoso:', paymentInfo.id)
    
    // Verificar que el pago no haya sido procesado antes
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('mercadopago_payment_id', paymentInfo.id)
      .maybeSingle()

    if (existingPurchase) {
      console.log('✅ Pago ya procesado anteriormente')
      return
    }

    // Extraer información del external_reference
    const externalRef = paymentInfo.external_reference || ''
    
    // Crear el registro de compra unificado
    const purchaseData = {
      mercadopago_payment_id: paymentInfo.id,
      amount: paymentInfo.transaction_amount / 1000, // Convertir de centavos a USD
      status: 'completed',
      payment_method: 'mercadopago',
      mercadopago_status: paymentInfo.status,
      mercadopago_status_detail: paymentInfo.status_detail,
      customer_email: paymentInfo.payer?.email || 'No disponible'
    }

    // Si el external_reference tiene formato de usuario registrado
    if (externalRef && !externalRef.includes('GUEST-')) {
      const [userId, ebookId] = externalRef.split('-')
      
      // Obtener datos del usuario si existe
      const { data: userData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single()

      Object.assign(purchaseData, {
        user_id: userId,
        ebook_id: ebookId,
        customer_name: userData?.full_name || 'Usuario Registrado',
        customer_email: paymentInfo.payer?.email || 'No disponible'
      })
    } else {
      // Para invitados, buscar en guest_purchases para obtener los datos
      const purchaseId = externalRef.replace('GUEST-', '').split('-')[0]
      
      const { data: guestData } = await supabase
        .from('guest_purchases')
        .select('*')
        .eq('id', purchaseId)
        .single()

      if (guestData) {
        Object.assign(purchaseData, {
          ebook_id: guestData.ebook_id,
          customer_name: guestData.name,
          customer_phone: guestData.phone,
          access_password: guestData.access_password
        })

        // Actualizar el estado de la compra de invitado
        await supabase
          .from('guest_purchases')
          .update({ 
            status: 'completed',
            mercado_pago_payment_id: paymentInfo.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', guestData.id)
      }
    }

    // Crear el registro de compra
    const { error: purchaseError } = await supabase
      .from('purchases')
      .insert(purchaseData)

    if (purchaseError) throw purchaseError

    // Limpiar el item del carrito si existe (solo para usuarios registrados)
    if (purchaseData.user_id) {
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', purchaseData.user_id)
        .eq('ebook_id', purchaseData.ebook_id)
    }

    // Enviar email con credenciales si es invitado
    if (!purchaseData.user_id && purchaseData.access_password) {
      await sendGuestCredentials(purchaseData, supabase)
    }

    console.log('✅ Compra procesada exitosamente:', purchaseData.mercadopago_payment_id)

  } catch (error) {
    console.error('❌ Error procesando pago exitoso:', error)
    throw error
  }
}


/**
 * Enviar credenciales por correo al invitado
 */
async function sendGuestCredentials(purchaseData, supabase) {
  try {
    // Obtener información del libro
    const { data: book, error: bookError } = await supabase
      .from('ebooks')
      .select('title, author')
      .eq('id', purchaseData.ebook_id)
      .single()

    if (bookError) throw bookError

    // Generar URL de acceso
    const accessUrl = `${process.env.VITE_SITE_URL || 'https://emprendecl.com'}/leer/${purchaseData.ebook_id}`

    // Enviar correo con credenciales
    const emailResponse = await fetch(`${process.env.VITE_SITE_URL || 'https://emprendecl.com'}/api/send-credentials-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: purchaseData.customer_email,
        name: purchaseData.customer_name,
        password: purchaseData.access_password,
        bookTitle: book.title,
        bookAuthor: book.author,
        accessUrl: accessUrl
      }),
    })

    if (emailResponse.ok) {
      console.log('✅ Credenciales enviadas por correo a:', purchaseData.customer_email)
    } else {
      console.error('❌ Error enviando credenciales por correo')
    }

  } catch (error) {
    console.error('❌ Error enviando credenciales:', error)
    // No lanzar error para no interrumpir el flujo
  }
}
