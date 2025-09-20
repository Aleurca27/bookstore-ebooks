import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader, CreditCard } from 'lucide-react'
import { PaymentService } from '../services/paymentService'
import type { WebPayConfirmation } from '../config/webpay'
import toast from 'react-hot-toast'

export default function PaymentConfirmation() {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [confirmation, setConfirmation] = useState<WebPayConfirmation | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token_ws')
    
    if (!token) {
      setError('Token de transacción no encontrado')
      setLoading(false)
      return
    }

    confirmPayment(token)
  }, [searchParams])

  const confirmPayment = async (token: string) => {
    try {
      const result = await PaymentService.confirmTransaction(token)
      setConfirmation(result)
      
      if (result.response_code === 0) {
        toast.success('¡Pago procesado exitosamente!')
      } else {
        toast.error('El pago no pudo ser procesado')
      }
    } catch (error) {
      console.error('Error confirming payment:', error)
      setError('Error al confirmar el pago')
      toast.error('Error al confirmar el pago')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Confirmando tu pago...
          </h2>
          <p className="text-gray-600">
            Por favor espera mientras procesamos tu transacción
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error en el Pago</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Link to="/carrito" className="btn-primary block">
              Volver al carrito
            </Link>
            <Link to="/catalogo" className="btn-secondary block">
              Continuar comprando
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isSuccess = confirmation?.response_code === 0 && confirmation?.status === 'AUTHORIZED'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            {isSuccess ? (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  ¡Pago Exitoso!
                </h1>
                <p className="text-lg text-gray-600">
                  Tu compra ha sido procesada correctamente
                </p>
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Pago Rechazado
                </h1>
                <p className="text-lg text-gray-600">
                  Tu pago no pudo ser procesado
                </p>
              </>
            )}
          </div>

          {confirmation && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Detalles de la Transacción
              </h3>
              
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Orden de Compra</dt>
                  <dd className="text-sm text-gray-900 font-mono">{confirmation.buy_order}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Monto</dt>
                  <dd className="text-sm text-gray-900 font-semibold">
                    ${confirmation.amount.toLocaleString('es-CL')} CLP
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Fecha</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(confirmation.transaction_date).toLocaleDateString('es-CL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Código de Autorización</dt>
                  <dd className="text-sm text-gray-900 font-mono">{confirmation.authorization_code}</dd>
                </div>
                
                {confirmation.card_detail && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Tarjeta</dt>
                    <dd className="text-sm text-gray-900">****{confirmation.card_detail.card_number}</dd>
                  </div>
                )}
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Estado</dt>
                  <dd className="text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      isSuccess 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {isSuccess ? 'Aprobado' : 'Rechazado'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isSuccess ? (
              <>
                <Link to="/perfil" className="btn-primary">
                  Ver mis libros
                </Link>
                <Link to="/catalogo" className="btn-secondary">
                  Seguir comprando
                </Link>
              </>
            ) : (
              <>
                <Link to="/carrito" className="btn-primary">
                  Intentar de nuevo
                </Link>
                <Link to="/catalogo" className="btn-secondary">
                  Continuar comprando
                </Link>
              </>
            )}
          </div>

          {isSuccess && (
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>¡Importante!</strong> Recibirás un correo de confirmación con los enlaces de descarga de tus ebooks.
                También puedes acceder a ellos desde tu perfil en cualquier momento.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
