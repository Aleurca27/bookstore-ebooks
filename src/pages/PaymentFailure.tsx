import { useNavigate } from 'react-router-dom'
import { XCircle, ArrowLeft } from 'lucide-react'

export default function PaymentFailure() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Pago Cancelado
        </h1>
        <p className="text-gray-600 mb-8">
          Tu pago no pudo ser procesado. Puedes intentarlo de nuevo cuando quieras.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Intentar de nuevo
          </button>
          <button
            onClick={() => navigate('/catalogo')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Volver al catálogo</span>
          </button>
        </div>
      </div>
    </div>
  )
}
