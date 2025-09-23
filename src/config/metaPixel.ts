import ReactPixel from 'react-facebook-pixel'
import CryptoJS from 'crypto-js'

// Configuración de Meta Pixel
export const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '1852642962343833'

// Función para hashear datos con SHA256 (requerido por Meta)
export const hashData = (data: string): string => {
  if (!data) return ''
  return CryptoJS.SHA256(data.toLowerCase().trim()).toString()
}

// Inicializar Meta Pixel
export const initMetaPixel = () => {
  if (typeof window !== 'undefined' && META_PIXEL_ID) {
    ReactPixel.init(META_PIXEL_ID, {
      autoConfig: true,
      debug: import.meta.env.DEV, // Debug solo en desarrollo
    })
    
    console.log('📊 Meta Pixel inicializado:', META_PIXEL_ID)
  }
}

// Eventos personalizados para ebooks
export const MetaPixelEvents = {
  // Evento cuando alguien ve un ebook
  viewContent: (bookTitle: string, bookPrice: number, bookId: string) => {
    ReactPixel.track('ViewContent', {
      content_name: bookTitle,
      content_category: 'ebook',
      content_type: 'product',
      content_ids: [bookId],
      value: bookPrice,
      currency: 'CLP',
    })
    console.log('📊 Meta Pixel - ViewContent:', bookTitle)
  },

  // Evento cuando alguien inicia el proceso de compra
  initiateCheckout: (bookTitle: string, bookPrice: number, bookId: string) => {
    ReactPixel.track('InitiateCheckout', {
      content_name: bookTitle,
      content_category: 'ebook',
      content_type: 'product',
      content_ids: [bookId],
      value: bookPrice,
      currency: 'CLP',
      num_items: 1,
    })
    console.log('📊 Meta Pixel - InitiateCheckout:', bookTitle)
  },

  // Evento cuando se completa una compra
  purchase: (bookTitle: string, bookPrice: number, bookId: string, transactionId?: string) => {
    ReactPixel.track('Purchase', {
      content_name: bookTitle,
      content_category: 'ebook',
      content_type: 'product',
      content_ids: [bookId],
      value: bookPrice,
      currency: 'CLP',
      num_items: 1, // Siempre 1 para ebooks
      transaction_id: transactionId,
    })
    console.log('📊 Meta Pixel - Purchase:', bookTitle, 'ID:', transactionId)
  },

  // Evento cuando alguien agrega al carrito
  addToCart: (bookTitle: string, bookPrice: number, bookId: string) => {
    ReactPixel.track('AddToCart', {
      content_name: bookTitle,
      content_category: 'ebook',
      content_type: 'product',
      content_ids: [bookId],
      value: bookPrice,
      currency: 'CLP',
      num_items: 1, // Siempre 1 para ebooks
    })
    console.log('📊 Meta Pixel - AddToCart:', bookTitle)
  },

  // Evento cuando alguien se registra
  completeRegistration: (email: string) => {
    ReactPixel.track('CompleteRegistration', {
      content_name: 'User Registration',
      content_category: 'registration',
    })
    console.log('📊 Meta Pixel - CompleteRegistration:', email)
  },

  // Evento cuando alguien inicia sesión
  login: (email: string) => {
    ReactPixel.track('Login', {
      content_name: 'User Login',
      content_category: 'authentication',
    })
    console.log('📊 Meta Pixel - Login:', email)
  },
}

// Función para obtener datos del usuario para Conversion API
export const getUserData = (user: any) => {
  if (!user) return {}

  const userData: any = {
    external_id: [hashData(user.id)], // External ID hasheado
    client_ip_address: '', // Se llenará en el servidor
    client_user_agent: '', // Se llenará en el servidor
  }

  // Solo agregar email si existe
  if (user.email) {
    userData.em = [hashData(user.email)]
  }

  // Solo agregar nombres si existen
  if (user.full_name) {
    const nameParts = user.full_name.split(' ')
    if (nameParts[0]) {
      userData.fn = [hashData(nameParts[0])]
    }
    if (nameParts.length > 1) {
      userData.ln = [hashData(nameParts.slice(1).join(' '))]
    }
  }

  // Solo agregar teléfono si existe
  if (user.phone) {
    userData.ph = [hashData(user.phone)]
  }

  return userData
}
