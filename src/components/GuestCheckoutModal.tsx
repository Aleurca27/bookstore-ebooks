import React, { useState } from 'react'
import { X, Mail, User, Phone, Lock, Eye, EyeOff, CreditCard, Smartphone } from 'lucide-react'
import { Icon } from '@iconify/react'
import './GuestCheckoutModal.css'

interface GuestCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onProceed: (guestData: GuestData) => void
  bookTitle: string
  bookPrice: number
}

export type PaymentMethod = 'mercadopago' | 'webpay'

export interface GuestData {
  email: string
  name: string
  phone: string
  paymentMethod: PaymentMethod
}

export default function GuestCheckoutModal({ 
  isOpen, 
  onClose, 
  onProceed, 
  bookTitle, 
  bookPrice 
}: GuestCheckoutModalProps) {
  const [formData, setFormData] = useState<GuestData>({
    email: '',
    name: '',
    phone: '',
    paymentMethod: 'mercadopago'
  })
  const [errors, setErrors] = useState<Partial<GuestData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Partial<GuestData> = {}

    if (!formData.email) {
      newErrors.email = 'El email es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido'
    } else {
      // Validar teléfono chileno: máximo 9 dígitos, mínimo 8
      const phoneDigits = formData.phone.replace(/\D/g, '')
      if (phoneDigits.length < 8 || phoneDigits.length > 9) {
        newErrors.phone = 'El teléfono debe tener entre 8 y 9 dígitos'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await onProceed(formData)
    } catch (error) {
      console.error('Error en checkout:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof GuestData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Bloquear scroll del body cuando el modal está abierto
  React.useEffect(() => {
    if (isOpen) {
      // Guardar la posición actual del scroll
      const scrollY = window.scrollY
      
      // Bloquear scroll y mantener posición
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
      
      // Cleanup: restaurar scroll y posición
      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 checkout-modal-overlay">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full h-full sm:max-w-md sm:w-full sm:max-h-[95vh] overflow-y-auto checkout-modal checkout-modal-scroll" style={{ height: '100vh', maxHeight: '100vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-4 border-b border-gray-200 checkout-modal-header">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Finalizar compra</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors checkout-close-button"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-4 checkout-modal-content">
          {/* Book Info */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">{bookTitle}</h3>
            <div className="flex items-center justify-between">
              <span className="text-xl font-light text-gray-900">$29.900</span>
              <div className="flex items-center text-green-600 text-sm">
                <Lock className="h-4 w-4 mr-1" />
                <span>Pago seguro</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-2" />
                Correo electrónico *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-3 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors checkout-input ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="tu@email.com"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-2" />
                Nombre completo *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-3 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors checkout-input ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Tu nombre completo"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="h-4 w-4 inline mr-2" />
                Teléfono *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full px-3 py-3 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors checkout-input ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="9 1234 5678"
                disabled={isSubmitting}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Payment Method Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <CreditCard className="h-4 w-4 inline mr-2" />
                Método de pago *
              </label>
                <div className="flex justify-center">
                  {/* Solo MercadoPago */}
                  <button
                    type="button"
                    onClick={() => handleInputChange('paymentMethod', 'mercadopago')}
                    disabled={isSubmitting}
                    className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                      formData.paymentMethod === 'mercadopago'
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-300 hover:border-gray-400'
                    } disabled:opacity-50`}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-10 flex items-center justify-center">
                        <img 
                          src="/images/Mercado-pago-1024x267.png"
                          alt="MercadoPago" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  </button>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Icon icon="material-symbols:info-outline" className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-blue-800 font-medium mb-1">¿Cómo funciona?</p>
                  <ul className="text-blue-700 space-y-1">
                    <li>• Procesamos tu pago de forma segura</li>
                    <li>• Te enviamos las credenciales por email</li>
                    <li>• Accedes al lector inmediatamente</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="checkout-button-container">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  <span>
                    Comprar con {formData.paymentMethod === 'mercadopago' ? 'MercadoPago' : 'WebPay'}
                  </span>
                </>
              )}
            </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
