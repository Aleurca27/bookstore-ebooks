// API para enviar correos con credenciales de acceso usando Nodemailer
import nodemailer from 'nodemailer'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, name, password, bookTitle, bookAuthor, accessUrl } = req.body

    // Validar datos requeridos
    if (!email || !name || !password || !bookTitle) {
      return res.status(400).json({ 
        error: 'Faltan datos requeridos: email, name, password, bookTitle' 
      })
    }

    // Configurar Nodemailer
    console.log('🔧 Configurando Nodemailer...')
    
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'mail.emprendecl.com',
      port: parseInt(process.env.EMAIL_PORT) || 465,
      secure: true, // true para 465, false para otros puertos
      auth: {
        user: process.env.EMAIL_USER || "contacto@emprendecl.com",
        pass: process.env.EMAIL_PASS || "Aleurca3322"
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
      logger: true,
      debug: true
    })

    // HTML del correo
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Credenciales de Acceso - ${bookTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials { background: #e8f4fd; border-left: 4px solid #2196F3; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .button:hover { background: #45a049; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 ¡Tu ebook está listo!</h1>
            <p>EmprendeCL - Tu tienda de ebooks</p>
          </div>
          
          <div class="content">
            <h2>Hola ${name},</h2>
            
            <p>¡Gracias por tu compra! Tu ebook <strong>"${bookTitle}"</strong> está listo para ser descargado.</p>
            
            <div class="credentials">
              <h3>🔑 Tus credenciales de acceso:</h3>
              <ul>
                <li><strong>Usuario:</strong> ${email}</li>
                <li><strong>Contraseña:</strong> ${password}</li>
              </ul>
            </div>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong> Guarda estas credenciales en un lugar seguro. Las necesitarás para acceder a tu ebook.
            </div>
            
            <h3>📖 ¿Cómo acceder a tu ebook?</h3>
            <ol>
              <li>Ve a: <a href="${accessUrl}">${accessUrl}</a></li>
              <li>Haz clic en "Leer ahora"</li>
              <li>Ingresa tus credenciales cuando te las soliciten</li>
              <li>¡Disfruta tu lectura!</li>
            </ol>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${accessUrl}" class="button">📖 Leer mi ebook ahora</a>
            </div>
            
            <p>Si tienes alguna pregunta o problema, no dudes en contactarnos.</p>
            
            <div class="footer">
              <p>¡Gracias por elegirnos!</p>
              <p><strong>EmprendeCL</strong> - Tu tienda de ebooks</p>
              <p>Este correo fue enviado automáticamente, por favor no respondas.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    // Texto plano del correo
    const textContent = `
¡Tu ebook está listo!

Hola ${name},

¡Gracias por tu compra! Tu ebook "${bookTitle}" está listo para ser descargado.

📖 Información del libro:
- Título: ${bookTitle}
- Autor: ${bookAuthor || 'No especificado'}

🔑 Tus credenciales de acceso:
- Usuario: ${email}
- Contraseña: ${password}

⚠️ Importante: Guarda estas credenciales en un lugar seguro.

¿Cómo acceder a tu ebook?
1. Ve a: ${accessUrl}
2. Haz clic en "Leer ahora"
3. Ingresa tus credenciales
4. ¡Disfruta tu lectura!

Si tienes alguna pregunta, no dudes en contactarnos.

¡Gracias por elegirnos!
EmprendeCL - Tu tienda de ebooks
    `

    console.log('Enviando correo a:', email)
    console.log('Libro:', bookTitle)

    // Enviar correo con Nodemailer
    const mailOptions = {
      from: 'EmprendeCL <contacto@emprendecl.com>',
      to: email,
      subject: `📚 Credenciales de acceso - ${bookTitle}`,
      html: htmlContent,
      text: textContent,
    }

    const info = await transporter.sendMail(mailOptions)

    console.log('✅ Correo enviado exitosamente con Nodemailer:', info.messageId)

    res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: 'Credenciales enviadas por correo exitosamente'
    })

  } catch (error) {
    console.error('❌ Error enviando correo:', error)
    res.status(500).json({ 
      error: 'Error al enviar el correo',
      details: error.message 
    })
  }
}