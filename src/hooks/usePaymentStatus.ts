// Hook para consultar el estado de pagos desde el frontend
import { useState, useEffect } from 'react'

export interface PaymentStatus {
  isValid: boolean;
  status: 'approved' | 'pending' | 'rejected' | 'cancelled' | 'failed';
  paymentId: string;
  amount: number;
  externalReference?: string;
  buyOrder?: string;
  lastUpdated?: string;
  error?: string;
}

export function usePaymentStatus(paymentId: string | null) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!paymentId) {
      setPaymentStatus(null)
      return
    }

    const checkPaymentStatus = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/payment-status/${paymentId}`)
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setPaymentStatus(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
        setError(errorMessage)
        console.error('Error consultando estado de pago:', err)
      } finally {
        setLoading(false)
      }
    }

    checkPaymentStatus()

    // Consultar cada 5 segundos si el pago está pendiente
    const interval = setInterval(() => {
      if (paymentStatus?.status === 'pending') {
        checkPaymentStatus()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [paymentId, paymentStatus?.status])

  return {
    paymentStatus,
    loading,
    error,
    refetch: () => {
      if (paymentId) {
        setLoading(true)
        setError(null)
        fetch(`/api/payment-status/${paymentId}`)
          .then(res => res.json())
          .then(data => setPaymentStatus(data))
          .catch(err => setError(err.message))
          .finally(() => setLoading(false))
      }
    }
  }
}
