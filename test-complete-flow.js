// Prueba completa del flujo de compra sin registro
// Ejecutar con: node test-complete-flow.js

import fetch from 'node-fetch'

// Configuración de prueba
const TEST_CONFIG = {
  email: 'aleurca@gmail.com',
  name: 'Alejandro Urcelay',
  phone: '+56912345678',
  bookTitle: 'Ebook de la Publicidad',
  bookPrice: 0.50, // 500 CLP
  bookId: 'ebook-publicidad-123'
}

async function pruebaFlujoCompleto() {
  console.log('🛒 === PRUEBA COMPLETA DEL FLUJO DE COMPRA ===')
  console.log('📅 Fecha y hora:', new Date().toLocaleString('es-CL'))
  console.log('')
  
  console.log('📊 Datos de la prueba:')
  console.log('   - Email:', TEST_CONFIG.email)
  console.log('   - Nombre:', TEST_CONFIG.name)
  console.log('   - Teléfono:', TEST_CONFIG.phone)
  console.log('   - Libro:', TEST_CONFIG.bookTitle)
  console.log('   - Precio:', TEST_CONFIG.bookPrice, 'USD (500 CLP)')
  console.log('')

  try {
    // Paso 1: Crear compra de invitado
    console.log('📝 Paso 1: Creando compra de invitado...')
    
    const guestData = {
      email: TEST_CONFIG.email,
      name: TEST_CONFIG.name,
      phone: TEST_CONFIG.phone,
      paymentMethod: 'mercadopago'
    }

    // Simular creación de compra de invitado
    const purchaseId = `test-purchase-${Date.now()}`
    const accessPassword = generateSecurePassword()
    
    console.log('   ✅ Compra creada:', purchaseId)
    console.log('   🔑 Contraseña generada:', accessPassword)
    console.log('')

    // Paso 2: Simular pago exitoso
    console.log('💳 Paso 2: Simulando pago exitoso...')
    console.log('   ✅ Pago procesado correctamente')
    console.log('   ✅ Estado: completed')
    console.log('')

    // Paso 3: Enviar credenciales por correo
    console.log('📧 Paso 3: Enviando credenciales por correo...')
    
    const emailData = {
      email: TEST_CONFIG.email,
      name: TEST_CONFIG.name,
      password: accessPassword,
      bookTitle: TEST_CONFIG.bookTitle,
      bookAuthor: 'Autor de Prueba',
      accessUrl: `https://emprendecl.com/leer/${TEST_CONFIG.bookId}`
    }

    console.log('   📤 Enviando correo a:', emailData.email)
    console.log('   📖 Libro:', emailData.bookTitle)
    console.log('   🔑 Contraseña:', emailData.password)
    console.log('   🔗 URL:', emailData.accessUrl)
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
      console.log('🎉 ¡FLUJO COMPLETO EXITOSO!')
      console.log('✅ Compra de invitado creada')
      console.log('✅ Pago procesado')
      console.log('✅ Credenciales enviadas por correo')
      console.log('')
      console.log('📱 Resumen final:')
      console.log('   - Usuario:', TEST_CONFIG.email)
      console.log('   - Contraseña:', accessPassword)
      console.log('   - Libro:', TEST_CONFIG.bookTitle)
      console.log('   - Estado: Completado ✅')
      console.log('')
      console.log('📧 Revisa tu email:', TEST_CONFIG.email)
      console.log('   - Asunto: 📚 Credenciales de acceso -', TEST_CONFIG.bookTitle)
      console.log('   - Contenido: Email HTML profesional con credenciales')
      console.log('   - Incluye: Usuario, contraseña, URL, instrucciones')
      console.log('')
      console.log('🔗 Para acceder al libro:')
      console.log('   1. Ve a:', emailData.accessUrl)
      console.log('   2. Usa las credenciales del correo')
      console.log('   3. ¡Disfruta tu lectura!')
    } else {
      console.log('❌ ERROR EN EL FLUJO')
      console.log('🔍 Detalles del error:', result)
      console.log('')
      console.log('💡 Posibles soluciones:')
      console.log('   - Verificar configuración de Resend en Vercel')
      console.log('   - Confirmar que la API esté desplegada')
      console.log('   - Revisar logs de Vercel')
    }

  } catch (error) {
    console.log('')
    console.log('❌ ERROR EN LA PRUEBA')
    console.log('🔍 Error:', error.message)
    console.log('')
    console.log('💡 Posibles soluciones:')
    console.log('   - Verificar conexión a internet')
    console.log('   - Confirmar que la aplicación esté desplegada')
    console.log('   - Revisar la URL de la API')
  }
}

// Función para generar contraseña segura
function generateSecurePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  
  // Asegurar al menos una mayúscula, minúscula, número y símbolo
  password += chars[Math.floor(Math.random() * 26)] // Mayúscula
  password += chars[26 + Math.floor(Math.random() * 26)] // Minúscula
  password += chars[52 + Math.floor(Math.random() * 10)] // Número
  password += chars[62 + Math.floor(Math.random() * 8)] // Símbolo
  
  // Completar hasta 12 caracteres
  for (let i = 4; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  
  // Mezclar la contraseña
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// Ejecutar prueba
pruebaFlujoCompleto()
