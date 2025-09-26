// API endpoint para recibir notificaciones de pago de Grupo Aleurca
import { createClient } from '@supabase/supabase-js'

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
    const notificationData = req.body
    console.log('Notificación de pago recibida:', notificationData)

    // Extraer información relevante de la notificación
    const {
      external_id,
      status,
      payment_id,
      transaction_id,
      amount,
      currency,
      payment_method
    } = notificationData

    if (!external_id) {
      return res.status(400).json({ 
        message: 'external_id es requerido' 
      })
    }

    // Buscar la compra por external_id
    const { data: purchase, error: fetchError } = await supabase
      .from('guest_purchases')
      .select('*')
      .eq('external_id', external_id)
      .single()

    if (fetchError || !purchase) {
      console.error('Compra no encontrada:', external_id)
      return res.status(404).json({ 
        message: 'Compra no encontrada' 
      })
    }

    // Determinar el estado final basado en la notificación
    let finalStatus = 'pending'
    if (status === 'approved' || status === 'success') {
      finalStatus = 'completed'
    } else if (status === 'rejected' || status === 'failed') {
      finalStatus = 'failed'
    } else if (status === 'cancelled') {
      finalStatus = 'cancelled'
    }

    // Actualizar el estado de la compra
    const updateData = {
      status: finalStatus,
      payment_id: payment_id || null,
      transaction_id: transaction_id || null,
      notification_data: notificationData,
      updated_at: new Date().toISOString()
    }

    const { data: updatedPurchase, error: updateError } = await supabase
      .from('guest_purchases')
      .update(updateData)
      .eq('external_id', external_id)
      .select()

    if (updateError) {
      console.error('Error al actualizar compra:', updateError)
      return res.status(500).json({ 
        message: 'Error al actualizar la compra' 
      })
    }

    // Si el pago fue exitoso, enviar credenciales por email
    if (finalStatus === 'completed') {
      try {
        await sendCredentialsEmail(purchase)
        console.log('Credenciales enviadas por email para:', purchase.customer_email)
      } catch (emailError) {
        console.error('Error al enviar email:', emailError)
        // No fallar la notificación por error de email
      }
    }

    console.log('Compra actualizada exitosamente:', updatedPurchase[0])

    return res.status(200).json({
      success: true,
      message: 'Notificación procesada exitosamente',
      status: finalStatus
    })

  } catch (error) {
    console.error('Error en payment-notification:', error)
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
            <li><strong>Método de pago:</strong> ${purchase.payment_method === 'mercadopago' ? 'MercadoPago' : 'WebPay'}</li>
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
