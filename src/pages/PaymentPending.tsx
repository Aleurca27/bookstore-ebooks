import { useNavigate } from 'react-router-dom'
import { Clock, Home } from 'lucide-react'

export default function PaymentPending() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Pago Pendiente
        </h1>
        <p className="text-gray-600 mb-8">
          Tu pago está siendo procesado. Te notificaremos cuando esté confirmado y podrás acceder a tu ebook.
        </p>
        <button
          onClick={() => navigate('/')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
        >
          <Home className="h-5 w-5" />
          <span>Ir al inicio</span>
        </button>
      </div>
    </div>
  )
}
