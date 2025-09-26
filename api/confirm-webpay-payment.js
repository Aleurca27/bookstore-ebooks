// API endpoint para confirmar pagos de WebPay
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
    const { token_ws, external_id } = req.body

    if (!token_ws) {
      return res.status(400).json({ 
        message: 'token_ws es requerido' 
      })
    }

    console.log('Confirmando pago WebPay:', { token_ws, external_id })

    // Validar el pago consultando la API de WebPay
    const validationResult = await paymentValidationService.validateWebPayPayment(token_ws)
    
    if (!validationResult) {
      console.error('Error validando pago WebPay:', token_ws)
      return res.status(500).json({ message: 'Error validando pago' })
    }

    // Buscar la compra en la base de datos
    let purchase
    if (external_id) {
      // Buscar por external_id
      const { data: purchaseData, error: findError } = await supabase
        .from('guest_purchases')
        .select('*')
        .eq('external_id', external_id)
        .single()

      if (findError || !purchaseData) {
        console.error('Compra no encontrada para external_id:', external_id)
        return res.status(404).json({ message: 'Compra no encontrada' })
      }
      purchase = purchaseData
    } else {
      // Buscar por token (buy_order)
      const { data: purchaseData, error: findError } = await supabase
        .from('guest_purchases')
        .select('*')
        .eq('payment_id', validationResult.paymentId)
        .single()

      if (findError || !purchaseData) {
        console.error('Compra no encontrada para buy_order:', validationResult.paymentId)
        return res.status(404).json({ message: 'Compra no encontrada' })
      }
      purchase = purchaseData
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
      payment_id: validationResult.paymentId,
      payment_data: validationResult,
      updated_at: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('guest_purchases')
      .update(updateData)
      .eq('id', purchase.id)

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
        // No fallar la confirmación por error de email
      }
    }

    console.log('Pago WebPay confirmado exitosamente:', {
      token_ws,
      status: newStatus,
      externalId: purchase.external_id
    })

    // Redirigir según el resultado
    const redirectUrl = newStatus === 'completed' 
      ? `https://emprendecl.com/pago-exitoso?external_id=${purchase.external_id}`
      : `https://emprendecl.com/payment/failure?external_id=${purchase.external_id}`

    return res.status(200).json({
      success: true,
      message: 'Pago confirmado exitosamente',
      status: newStatus,
      redirectUrl
    })

  } catch (error) {
    console.error('Error en confirm-webpay-payment:', error)
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
            <li><strong>Método de pago:</strong> WebPay</li>
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
