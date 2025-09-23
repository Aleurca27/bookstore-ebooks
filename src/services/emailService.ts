// Servicio para envío de correos con credenciales de acceso
export interface EmailCredentials {
  email: string
  name: string
  password: string
  bookTitle: string
  bookAuthor: string
  accessUrl: string
}

export class EmailService {
  
  /**
   * Enviar credenciales de acceso por correo
   */
  static async sendAccessCredentials(credentials: EmailCredentials): Promise<void> {
    try {
      const response = await fetch('/api/send-credentials-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al enviar el correo')
      }

      const result = await response.json()
      console.log('✅ Credenciales enviadas por correo:', result)
      
    } catch (error) {
      console.error('❌ Error enviando credenciales por correo:', error)
      // No lanzar error para no interrumpir el flujo de compra
    }
  }

  /**
   * Generar contraseña segura
   */
  static generateSecurePassword(): string {
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
}
