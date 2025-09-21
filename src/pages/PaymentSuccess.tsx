import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Loader2, BookOpen } from 'lucide-react'
import { MercadoPagoService } from '../services/mercadopagoService'
import toast from 'react-hot-toast'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [ebookId, setEbookId] = useState<string | null>(null)

  useEffect(() => {
    processPayment()
  }, [])

  const processPayment = async () => {
    try {
      const paymentId = searchParams.get('payment_id')
      const externalReference = searchParams.get('external_reference')
      
      if (!paymentId || !externalReference) {
        throw new Error('Información de pago incompleta')
      }

      // Extraer ebook_id del external_reference
      const [userId, bookId] = externalReference.split('-')
      setEbookId(bookId)

      // Procesar el pago exitoso
      await MercadoPagoService.processSuccessfulPayment(paymentId, externalReference)
      
      setSuccess(true)
      toast.success('¡Pago procesado exitosamente!')
      
    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error('Error al procesar el pago')
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  const goToEbook = () => {
    if (ebookId) {
      navigate(`/leer/${ebookId}`)
    } else {
      navigate('/catalogo')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Procesando tu pago...
          </h2>
          <p className="text-gray-600">
            Por favor espera mientras confirmamos tu compra
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        {success ? (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Pago Exitoso!
            </h1>
            <p className="text-gray-600 mb-8">
              Tu compra ha sido procesada correctamente. Ya puedes acceder a tu ebook.
            </p>
            <button
              onClick={goToEbook}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <BookOpen className="h-5 w-5" />
              <span>Leer mi ebook</span>
            </button>
          </>
        ) : (
          <>
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-red-600 text-2xl">×</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Error en el pago
            </h1>
            <p className="text-gray-600 mb-8">
              Hubo un problema al procesar tu pago. Por favor, inténtalo de nuevo.
            </p>
            <button
              onClick={() => navigate('/catalogo')}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Volver al catálogo
            </button>
          </>
        )}
      </div>
    </div>
  )
}
