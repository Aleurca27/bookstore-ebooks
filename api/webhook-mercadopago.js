// Webhook para recibir notificaciones de MercadoPago
import { createClient } from '@supabase/supabase-js'
import { paymentValidationService } from '../src/services/paymentValidationService'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const body = JSON.stringify(req.body)
    const signature = req.headers['x-signature'] || req.headers['x-signature-256']
    
    // Validar firma del webhook (opcional pero recomendado)
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET
    if (webhookSecret && signature) {
      const isValidSignature = paymentValidationService.validateMercadoPagoWebhookSignature(
        body,
        signature,
        webhookSecret
      )
      
      if (!isValidSignature) {
        console.error('Firma de webhook inválida')
        return res.status(401).json({ message: 'Firma inválida' })
      }
    }

    const { type, data } = req.body

    // Solo procesar notificaciones de pagos
    if (type !== 'payment') {
      return res.status(200).json({ message: 'Tipo de notificación no procesado' })
    }

    const paymentId = data.id
    console.log('Webhook MercadoPago recibido para pago:', paymentId)

    // Validar el pago consultando la API de MercadoPago
    const validationResult = await paymentValidationService.validateMercadoPagoPayment(paymentId)
    
    if (!validationResult) {
      console.error('Error validando pago:', paymentId)
      return res.status(500).json({ message: 'Error validando pago' })
    }

    // Buscar la compra en la base de datos por payment_id o external_id
    let { data: purchase, error: findError } = await supabase
      .from('guest_purchases')
      .select('*')
      .eq('payment_id', paymentId)
      .single()

    // Si no se encuentra por payment_id, buscar por external_id
    if (findError && validationResult.externalReference) {
      const { data: purchaseByExternal, error: externalError } = await supabase
        .from('guest_purchases')
        .select('*')
        .eq('external_id', validationResult.externalReference)
        .single()
      
      if (!externalError && purchaseByExternal) {
        purchase = purchaseByExternal
        findError = null
      }
    }

    if (findError || !purchase) {
      console.error('Compra no encontrada para pago:', paymentId)
      return res.status(404).json({ message: 'Compra no encontrada' })
    }

    // Actualizar estado de la compra
    let newStatus = 'pending'
    switch (validationResult.status) {
      case 'approved':
        newStatus = 'completed'
        break
      case 'rejected':
      case 'cancelled':
        newStatus = 'failed'
        break
      default:
        newStatus = 'pending'
    }

    const updateData = {
      status: newStatus,
      payment_data: validationResult,
      external_id: validationResult.externalReference, // Asegurar que se guarde el external_id
      updated_at: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('guest_purchases')
      .update(updateData)
      .eq('payment_id', paymentId)

    if (updateError) {
      console.error('Error actualizando compra:', updateError)
      return res.status(500).json({ message: 'Error actualizando compra' })
    }

    // Si el pago fue aprobado, enviar credenciales por email
    if (newStatus === 'completed') {
      try {
        await sendCredentialsEmail(purchase)
        console.log('Credenciales enviadas por email para:', purchase.customer_email)
      } catch (emailError) {
        console.error('Error al enviar email:', emailError)
        // No fallar el webhook por error de email
      }
    }

    console.log('Webhook procesado exitosamente:', {
      paymentId,
      status: newStatus,
      externalId: purchase.external_id
    })

    return res.status(200).json({
      success: true,
      message: 'Webhook procesado exitosamente',
      status: newStatus
    })

  } catch (error) {
    console.error('Error en webhook-mercadopago:', error)
    return res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    })
  }
}

// Función para enviar credenciales por email
async function sendCredentialsEmail(purchase) {
  const emailData = {
    to: purchase.customer_email,
    subject: '¡Tu Ebook de la Publicidad está listo! - EmprendeCL',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">¡Hola ${purchase.customer_name}!</h2>
        
        <p>¡Gracias por tu compra! Tu pago ha sido procesado exitosamente.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Detalles de tu compra:</h3>
          <ul style="color: #374151;">
            <li><strong>Producto:</strong> ${purchase.book_title}</li>
            <li><strong>Precio:</strong> $${Math.round(purchase.book_price * 1000).toLocaleString('es-CL')} CLP</li>
            <li><strong>Método de pago:</strong> MercadoPago</li>
            <li><strong>ID de transacción:</strong> ${purchase.external_id}</li>
          </ul>
        </div>
        
        <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">📚 Acceso a tu ebook:</h3>
          <p style="color: #1e40af; margin-bottom: 15px;">
            <strong>Usuario:</strong> ${purchase.customer_email}<br>
            <strong>Contraseña:</strong> ${generatePassword()}
          </p>
          <a href="https://emprendecl.com/leer" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Leer Ebook Ahora
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Si tienes alguna pregunta, no dudes en contactarnos en contacto@emprendecl.com
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          © 2024 EmprendeCL. Todos los derechos reservados.
        </p>
      </div>
    `
  }

  // Enviar email usando el endpoint existente
  const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/send-credentials-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData),
  })

  if (!response.ok) {
    throw new Error('Error al enviar email')
  }
}

// Función para generar contraseña temporal
function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
