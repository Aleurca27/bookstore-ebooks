// Script para probar el envío automático de correos
// Ejecutar con: node test-email-automation.js

const TEST_CONFIG = {
  email: 'test@emprendecl.com',
  name: 'Usuario de Prueba',
  phone: '+56912345678',
  bookTitle: 'Ebook de la Publicidad',
  bookAuthor: 'AgenciaCL',
  bookId: '7ddb3a38-9697-466b-8980-f945d4026b3b',
  accessPassword: 'test123456'
}

async function testEmailAutomation() {
  console.log('📧 === PRUEBA DE ENVÍO AUTOMÁTICO DE CORREOS ===')
  console.log('')

  try {
    // Paso 1: Probar envío directo de credenciales
    console.log('📤 Paso 1: Probando envío directo de credenciales...')
    
    const emailData = {
      email: TEST_CONFIG.email,
      name: TEST_CONFIG.name,
      password: TEST_CONFIG.accessPassword,
      bookTitle: TEST_CONFIG.bookTitle,
      bookAuthor: TEST_CONFIG.bookAuthor,
      accessUrl: `https://emprendecl.com/leer/${TEST_CONFIG.bookId}`
    }

    console.log('   📧 Datos del correo:')
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
      console.log('✅ ¡Correo enviado exitosamente!')
      console.log('   - Message ID:', result.messageId)
      console.log('   - Mensaje:', result.message)
    } else {
      console.log('❌ Error enviando correo:')
      console.log('   - Error:', result.error || 'Error desconocido')
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message)
  }

  console.log('')
  console.log('🔍 === VERIFICACIÓN DE CONFIGURACIÓN ===')
  console.log('')

  // Verificar variables de entorno necesarias
  const requiredEnvVars = [
    'RESEND_API_KEY',
    'VITE_SITE_URL'
  ]

  console.log('📋 Variables de entorno requeridas:')
  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar]
    if (value) {
      console.log(`   ✅ ${envVar}: Configurada`)
    } else {
      console.log(`   ❌ ${envVar}: No configurada`)
    }
  })

  console.log('')
  console.log('📝 === INSTRUCCIONES PARA CONFIGURAR ===')
  console.log('')
  console.log('1. En Vercel, ve a tu proyecto')
  console.log('2. Ve a Settings > Environment Variables')
  console.log('3. Agrega las siguientes variables:')
  console.log('   - RESEND_API_KEY: Tu clave de API de Resend')
  console.log('   - VITE_SITE_URL: https://emprendecl.com')
  console.log('')
  console.log('4. Redeploy el proyecto para que los cambios tomen efecto')
  console.log('')
  console.log('🔗 URLs importantes:')
  console.log('   - Panel de Resend: https://resend.com/emails')
  console.log('   - Vercel Dashboard: https://vercel.com/dashboard')
  console.log('   - Supabase Dashboard: https://supabase.com/dashboard')
}

// Ejecutar la prueba
testEmailAutomation().catch(console.error)
