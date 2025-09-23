import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, ArrowLeft, Mail } from 'lucide-react'
import { Icon } from '@iconify/react'

export default function PaymentPending() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="h-8 w-8 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Pago Pendiente</h2>
        <p className="text-gray-600 mb-6">
          Tu pago está siendo procesado. Recibirás una confirmación por email una vez que se complete el proceso.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Volver al inicio</span>
          </button>
          <div className="text-sm text-gray-500">
            <p>¿No recibes el email de confirmación?</p>
            <p>Revisa tu carpeta de spam o contacta a soporte.</p>
          </div>
        </div>
      </div>
    </div>
  )
}