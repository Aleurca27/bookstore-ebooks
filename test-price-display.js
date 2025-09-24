// Script para probar que el precio se muestra correctamente
// Ejecutar con: node test-price-display.js

const TEST_CONFIG = {
  bookId: '7ddb3a38-9697-466b-8980-f945d4026b3b',
  expectedPriceUSD: 25.0,
  expectedPriceCLP: 25000
}

async function testPriceDisplay() {
  console.log('💰 === PRUEBA DE PRECIO DEL LIBRO ===')
  console.log('')

  try {
    // Paso 1: Verificar precio en la base de datos
    console.log('📊 Paso 1: Verificando precio en la base de datos...')
    
    const response = await fetch(`https://emprendecl.com/api/test-book-price?id=${TEST_CONFIG.bookId}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('   ✅ Precio en base de datos:', data.price, 'USD')
      console.log('   ✅ Precio convertido a CLP:', Math.round(data.price * 1000), 'CLP')
      
      if (data.price === TEST_CONFIG.expectedPriceUSD) {
        console.log('   ✅ ¡Precio correcto en la base de datos!')
      } else {
        console.log('   ❌ Precio incorrecto. Esperado:', TEST_CONFIG.expectedPriceUSD, 'USD')
      }
    } else {
      console.log('   ❌ Error obteniendo precio de la base de datos')
    }

    console.log('')

    // Paso 2: Verificar precio en la página del producto
    console.log('🌐 Paso 2: Verificando precio en la página del producto...')
    console.log('   URL: https://emprendecl.com/libro/' + TEST_CONFIG.bookId)
    console.log('   El precio debería mostrarse como: $25.000')
    console.log('')

    // Paso 3: Verificar precio en el formulario de compra
    console.log('📝 Paso 3: Verificando precio en el formulario de compra...')
    console.log('   Al abrir el modal de compra, el precio debería mostrarse como: $25.000')
    console.log('')

    // Paso 4: Verificar precio en MercadoPago
    console.log('💳 Paso 4: Verificando precio en MercadoPago...')
    console.log('   Al proceder al pago, MercadoPago debería mostrar: $25.000 CLP')
    console.log('')

    console.log('📋 === INSTRUCCIONES PARA VERIFICAR ===')
    console.log('')
    console.log('1. Ve a: https://emprendecl.com/libro/' + TEST_CONFIG.bookId)
    console.log('2. Verifica que el precio se muestre como: $25.000')
    console.log('3. Haz clic en "Comprar ahora"')
    console.log('4. Verifica que en el modal aparezca: $25.000')
    console.log('5. Completa el formulario y procede al pago')
    console.log('6. Verifica que MercadoPago muestre: $25.000 CLP')
    console.log('')

    console.log('✅ Si todos los pasos muestran $25.000, el precio está configurado correctamente')
    console.log('❌ Si algún paso muestra un precio diferente, hay un problema de configuración')

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message)
  }
}

// Ejecutar la prueba
testPriceDisplay().catch(console.error)
