import React, { useState, useEffect } from 'react'
import { CheckCircle, Download, Mail, ArrowLeft } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [purchaseData, setPurchaseData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const externalId = searchParams.get('external_id')

  useEffect(() => {
    if (externalId) {
      fetchPurchaseData(externalId)
    } else {
      setError('ID de transacción no encontrado')
      setLoading(false)
    }
  }, [externalId])

  const fetchPurchaseData = async (externalId: string) => {
    try {
      const response = await fetch(`/api/get-purchase-by-external-id?external_id=${externalId}`)
      if (response.ok) {
        const data = await response.json()
        setPurchaseData(data)
      } else {
        setError('No se pudo obtener la información de la compra')
      }
    } catch (err) {
      setError('Error al cargar los datos de la compra')
    } finally {
      setLoading(false)
    }
  }

  const handleGoToReader = () => {
    navigate('/leer')
  }

  const handleGoHome = () => {
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando tu compra...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleGoHome}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
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
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">EmprendeCL</h1>
            <button
              onClick={handleGoHome}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver al inicio
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Success Header */}
          <div className="bg-green-50 px-8 py-12 text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Pago Exitoso!
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Tu compra ha sido procesada correctamente
            </p>
            <p className="text-sm text-gray-500">
              ID de transacción: {externalId}
            </p>
          </div>

          {/* Purchase Details */}
          {purchaseData && (
            <div className="px-8 py-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Detalles de tu compra
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Product Info */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Producto</h3>
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <span className="font-medium">Título:</span> {purchaseData.book_title}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Precio:</span> ${Math.round(purchaseData.book_price * 1000).toLocaleString('es-CL')} CLP
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Método de pago:</span> {
                        purchaseData.payment_method === 'mercadopago' ? 'MercadoPago' : 'WebPay'
                      }
                    </p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Cliente</h3>
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <span className="font-medium">Nombre:</span> {purchaseData.customer_name}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Email:</span> {purchaseData.customer_email}
                    </p>
                    {purchaseData.customer_phone && (
                      <p className="text-gray-700">
                        <span className="font-medium">Teléfono:</span> {purchaseData.customer_phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Access Instructions */}
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Acceso a tu ebook
                </h3>
                <div className="text-blue-800 space-y-2">
                  <p>
                    Te hemos enviado un email con las credenciales de acceso a tu ebook.
                  </p>
                  <p>
                    <strong>Usuario:</strong> {purchaseData.customer_email}
                  </p>
                  <p>
                    <strong>Contraseña:</strong> (enviada por email)
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleGoToReader}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Leer Ebook Ahora
                </button>
                
                <button
                  onClick={handleGoHome}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Volver al Inicio
                </button>
              </div>

              {/* Help Section */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                  ¿Tienes problemas para acceder? Contacta a{' '}
                  <a 
                    href="mailto:contacto@emprendecl.com" 
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    contacto@emprendecl.com
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}