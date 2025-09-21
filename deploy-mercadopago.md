# Configuración de MercadoPago para Vercel

## Pasos para configurar MercadoPago en producción:

### 1. Ejecutar el script SQL en Supabase

1. Ve al Dashboard de Supabase
2. Navega a "SQL Editor"
3. Ejecuta el contenido del archivo `mercadopago-schema.sql`

### 2. Configurar variables de entorno en Vercel

Ve a tu dashboard de Vercel → Settings → Environment Variables y agrega:

```
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_aqui
MERCADOPAGO_PUBLIC_KEY=APP_USR-c2104a09-00e7-4e07-8475-8bf44ed7a4a0
MERCADOPAGO_CLIENT_ID=7433295818776236
MERCADOPAGO_CLIENT_SECRET=bqx1R0XRJbe1qgYJoeXCF3lh3dcFu39j
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
```

### 3. Variables de entorno locales

Crea un archivo `.env.local` en la raíz del proyecto con:

```
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_aqui
MERCADOPAGO_PUBLIC_KEY=APP_USR-c2104a09-00e7-4e07-8475-8bf44ed7a4a0
MERCADOPAGO_CLIENT_ID=7433295818776236
MERCADOPAGO_CLIENT_SECRET=bqx1R0XRJbe1qgYJoeXCF3lh3dcFu39j
```

### 4. Obtener el Access Token

Para obtener tu Access Token de MercadoPago:

1. Ve a https://www.mercadopago.cl/developers/
2. Inicia sesión con tu cuenta de MercadoPago
3. Ve a "Mis aplicaciones" → "Credenciales"
4. Copia el "Access Token" (para pruebas usa el de TEST, para producción el de PROD)

### 5. Webhooks (Opcional)

Para recibir notificaciones automáticas de MercadoPago:

1. En el dashboard de MercadoPago, configura un webhook apuntando a:
   `https://tu-dominio.vercel.app/api/mercadopago-webhook`

## Flujo de pago:

1. Usuario hace clic en "Comprar y leer ahora"
2. Se crea una preferencia de pago en MercadoPago
3. Usuario es redirigido a MercadoPago para pagar
4. MercadoPago redirige de vuelta con el resultado:
   - `/payment/success` - Pago exitoso
   - `/payment/failure` - Pago fallido
   - `/payment/pending` - Pago pendiente
5. La aplicación procesa el resultado y actualiza la base de datos
6. Usuario puede acceder al ebook si el pago fue exitoso

## Testing

Para probar localmente:
1. Usa las credenciales de TEST de MercadoPago
2. Inicia el servidor de desarrollo: `npm run dev`
3. Las APIs de MercadoPago estarán disponibles en `/api/create-mercadopago-preference`

## Notas importantes:

- El sistema maneja tanto pagos de prueba como de producción
- Los external_reference siguen el formato: `{user_id}-{ebook_id}-{timestamp}`
- Se crean registros en `mercadopago_transactions` para tracking
- Los pagos exitosos se registran en la tabla `purchases`
