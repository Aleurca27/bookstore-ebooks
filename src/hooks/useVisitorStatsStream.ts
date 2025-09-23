import { useEffect, useState, useRef } from 'react'

interface VisitorStats {
  overview: {
    total_visits: number
    unique_visitors: number
    active_visitors: number
    visits_today: number
    visits_this_week: number
    visits_this_month: number
  }
  recentSessions: any[]
  topPages: { url: string; visits: number }[]
}

export const useVisitorStatsStream = () => {
  const [stats, setStats] = useState<VisitorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const connectToStream = () => {
      try {
        setLoading(true)
        setError(null)

        // Crear conexión SSE
        const eventSource = new EventSource('/api/visitor-stats-stream')
        eventSourceRef.current = eventSource

        eventSource.onopen = () => {
          console.log('🔌 Conectado al stream de estadísticas')
          setIsConnected(true)
          setLoading(false)
        }

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            if (data.success && data.data) {
              setStats(data.data)
              setError(null)
            } else if (data.error) {
              setError(data.error)
            }
          } catch (parseError) {
            console.error('Error parsing SSE data:', parseError)
          }
        }

        eventSource.onerror = (error) => {
          console.error('Error en SSE:', error)
          setError('Error de conexión')
          setIsConnected(false)
          setLoading(false)
          
          // Intentar reconectar después de 5 segundos
          setTimeout(() => {
            if (eventSourceRef.current) {
              eventSourceRef.current.close()
            }
            connectToStream()
          }, 5000)
        }

      } catch (error) {
        console.error('Error conectando al stream:', error)
        setError('Error de conexión')
        setLoading(false)
        setIsConnected(false)
      }
    }

    connectToStream()

    // Cleanup al desmontar
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [])

  const reconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    setError(null)
    setLoading(true)
    setIsConnected(false)
  }

  return {
    stats,
    loading,
    error,
    isConnected,
    reconnect
  }
}
