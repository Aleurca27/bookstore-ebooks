import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, Download, Mail, ArrowLeft, Star, BookOpen, User, CreditCard } from 'lucide-react'
import { Icon } from '@iconify/react'
import { supabase } from '../config/supabase'
import { MetaPixelEvents } from '../config/metaPixel'
import { MetaConversionService } from '../services/metaConversionService'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

interface Ebook {
  id: string
  title: string
  author: string
  description: string
  price: number
  cover_image: string
  file_url: string
  category: string
}

interface Purchase {
  id: string
  user_id: string
  ebook_id: string
  amount: number
  status: string
  mercadopago_payment_id?: string
  webpay_token?: string
  created_at: string
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [ebook, setEbook] = useState<Ebook | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Obtener parámetros de la URL
  const paymentId = searchParams.get('payment_id')
  const externalReference = searchParams.get('external_reference')
  const status = searchParams.get('status')

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (paymentId || externalReference) {
      // Agregar timeout para evitar carga infinita
      const timeoutId = setTimeout(() => {
        if (loading) {
          setError('El pago está siendo procesado. Si no aparece en unos minutos, contacta a soporte.')
          setLoading(false)
        }
      }, 10000) // 10 segundos timeout

      processPaymentSuccess()

      return () => clearTimeout(timeoutId)
    }
  }, [paymentId, externalReference, loading])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    } catch (error) {
      console.error('Error checking user:', error)
    }
  }

  const processPaymentSuccess = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Procesando pago exitoso:', { paymentId, externalReference, status })

      // Buscar la compra por payment_id o external_reference
      let purchaseData = null

      if (paymentId) {
        // Buscar en la tabla unificada de purchases
        const { data, error } = await supabase
          .from('purchases')
          .select('*')
          .eq('mercadopago_payment_id', paymentId)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error buscando compra:', error)
        } else if (data) {
          purchaseData = data
        }
      } else if (externalReference) {
        // Buscar por external_reference en la tabla unificada
        const { data, error } = await supabase
          .from('purchases')
          .select('*')
          .eq('webpay_token', externalReference)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error buscando compra por external_reference:', error)
        } else if (data) {
          purchaseData = data
        }
      }

      if (!purchaseData) {
        throw new Error('No se encontró la compra. Puede que el pago aún esté siendo procesado.')
      } else {
        // Configurar la compra encontrada
        setPurchase(purchaseData)
      }

      // Obtener información del ebook
      if (purchaseData && purchaseData.ebook_id) {
        const { data: ebookData, error: ebookError } = await supabase
          .from('ebooks')
          .select('*')
          .eq('id', purchaseData.ebook_id)
          .single()

        if (ebookError) throw ebookError
        setEbook(ebookData)

        // Eventos de Meta Pixel y Conversion API
        if (ebookData && user) {
          MetaPixelEvents.purchase(ebookData.title, ebookData.price * 1000, ebookData.id, paymentId)
          await MetaConversionService.trackPurchase(user, ebookData.title, ebookData.price, ebookData.id, paymentId)
        }
      }

    } catch (error) {
      console.error('Error processing payment success:', error)
      setError(error.message || 'Error al procesar el pago')
      toast.error('Error al verificar el pago')
    } finally {
      setLoading(false)
    }
  }

  const goToReader = () => {
    if (ebook) {
      navigate(`/leer/${ebook.id}`)
    }
  }

  const goHome = () => {
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Verificando pago...</h2>
          <p className="text-gray-600">Por favor espera un momento</p>
        </div>
      </div>
    )
  }

  if (error || !purchase || !ebook) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon icon="material-symbols:error-outline" className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error en el pago</h2>
          <p className="text-gray-600 mb-6">
            {error || 'No se pudo verificar el pago. Por favor contacta a soporte.'}
          </p>
          <button
            onClick={goHome}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">¡Pago Exitoso!</h1>
                <p className="text-sm text-gray-600">Tu compra se ha procesado correctamente</p>
              </div>
            </div>
            <button
              onClick={goHome}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Volver al inicio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ebook Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Libro Comprado</h2>
            
            <div className="flex items-start space-x-4 mb-6">
              <img
                src={ebook.cover_image}
                alt={ebook.title}
                className="w-20 h-28 object-cover rounded-lg shadow-sm"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{ebook.title}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{ebook.author}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{ebook.category}</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm line-clamp-3">{ebook.description}</p>
              </div>
            </div>

            <button
              onClick={goToReader}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Download className="h-5 w-5" />
              <span>Leer Ahora</span>
            </button>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Pago</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Estado del pago</span>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-semibold">Completado</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Monto pagado</span>
                <span className="font-semibold text-gray-900">
                  ${(purchase.amount * 1000).toLocaleString()} CLP
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Método de pago</span>
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">
                    {purchase.mercadopago_payment_id ? 'MercadoPago' : 'WebPay'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">ID de transacción</span>
                <span className="text-sm text-gray-500 font-mono">
                  {purchase.mercadopago_payment_id || purchase.webpay_token || purchase.id}
                </span>
              </div>

              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Fecha de compra</span>
                <span className="text-gray-900">
                  {new Date(purchase.created_at).toLocaleDateString('es-CL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            {/* Access Info */}
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">Acceso al libro</h3>
                  <p className="text-sm text-green-800">
                    {user ? 
                      'Ya tienes acceso completo al libro. Puedes leerlo desde tu perfil o haciendo clic en "Leer Ahora".' :
                      'Se ha enviado un email con las credenciales de acceso al libro.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={goToReader}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <BookOpen className="h-5 w-5" />
            <span>Leer el Libro</span>
          </button>
          
          <button
            onClick={() => navigate('/catalogo')}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Star className="h-5 w-5" />
            <span>Ver Más Libros</span>
          </button>
        </div>
      </div>
    </div>
  )
}