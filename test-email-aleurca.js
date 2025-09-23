// Script para probar envío de correo a aleurca@gmail.com
// Ejecutar con: node test-email-aleurca.js

const TEST_CONFIG = {
  email: 'aleurca@gmail.com',
  name: 'Alejandro (Prueba)',
  phone: '+56912345678',
  bookTitle: 'Ebook de la Publicidad',
  bookAuthor: 'AgenciaCL',
  bookId: '7ddb3a38-9697-466b-8980-f945d4026b3b',
  accessPassword: 'test123456'
}

async function testEmailToAleurca() {
  console.log('📧 === PRUEBA DE ENVÍO CON NODEMAILER DESDE CONTACTO@EMPRENDECL.COM ===')
  console.log('')

  try {
    // Paso 1: Probar envío directo de credenciales
    console.log('📤 Enviando correo de prueba a:', TEST_CONFIG.email)
    console.log('')
    
    const emailData = {
      email: TEST_CONFIG.email,
      name: TEST_CONFIG.name,
      password: TEST_CONFIG.accessPassword,
      bookTitle: TEST_CONFIG.bookTitle,
      bookAuthor: TEST_CONFIG.bookAuthor,
      accessUrl: `https://emprendecl.com/leer/${TEST_CONFIG.bookId}`
    }

    console.log('📧 Datos del correo:')
    console.log('   - Email:', emailData.email)
    console.log('   - Nombre:', emailData.name)
    console.log('   - Libro:', emailData.bookTitle)
    console.log('   - Autor:', emailData.bookAuthor)
    console.log('   - Contraseña:', emailData.password)
    console.log('   - URL:', emailData.accessUrl)
    console.log('')

    // Llamar a la API de envío de correos
    const response = await fetch('https://emprendecl.com/api/send-credentials-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    const result = await response.json()

    console.log('📊 Respuesta del correo:')
    console.log('   - Status:', response.status)
    console.log('   - Response:', JSON.stringify(result, null, 2))
    console.log('')

    if (response.ok) {
      console.log('✅ ¡Correo enviado exitosamente a aleurca@gmail.com!')
      console.log('   - Message ID:', result.messageId)
      console.log('   - Mensaje:', result.message)
      console.log('')
      console.log('📬 Revisa tu bandeja de entrada en aleurca@gmail.com')
      console.log('   - También revisa la carpeta de spam/correo no deseado')
      console.log('   - El asunto será: "📚 Credenciales de acceso - Ebook de la Publicidad"')
    } else {
      console.log('❌ Error enviando correo:')
      console.log('   - Error:', result.error || 'Error desconocido')
      console.log('   - Details:', result.details || 'Sin detalles')
      console.log('')
      console.log('🔧 Posibles causas:')
      console.log('   1. Variables de entorno no configuradas en Vercel')
      console.log('   2. API key de Resend inválida o expirada')
      console.log('   3. Dominio no verificado en Resend')
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message)
    console.log('')
    console.log('🔧 Posibles soluciones:')
    console.log('   1. Verificar conexión a internet')
    console.log('   2. Verificar que el dominio esté funcionando')
    console.log('   3. Revisar logs de Vercel para más detalles')
  }

  console.log('')
  console.log('🔗 URLs para verificar:')
  console.log('   - Panel de Resend: https://resend.com/emails')
  console.log('   - Vercel Dashboard: https://vercel.com/dashboard')
  console.log('   - Logs de Vercel: https://vercel.com/aleurca-1096s-projects/bookstore-alejandro')
  console.log('')
  console.log('📝 Para configurar variables de entorno en Vercel:')
  console.log('   1. Ve a https://vercel.com/aleurca-1096s-projects/bookstore-alejandro')
  console.log('   2. Settings > Environment Variables')
  console.log('   3. Agrega SMTP_USER: contacto@emprendecl.com')
  console.log('   4. Agrega SMTP_PASS: tu contraseña de aplicación de Gmail')
  console.log('   5. Redeploy el proyecto')
}

// Ejecutar la prueba
testEmailToAleurca().catch(console.error)
