import { useEffect, useState } from 'react'

interface VisitorTrackingOptions {
  pageUrl?: string
  userId?: string
  enabled?: boolean
}

export const useVisitorTracking = (options: VisitorTrackingOptions = {}) => {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(false)

  useEffect(() => {
    const trackVisitor = async () => {
      if (!options.enabled) return

      try {
        // Obtener session_id del localStorage o generar uno nuevo
        let currentSessionId = localStorage.getItem('visitor_session_id')
        
        if (!currentSessionId) {
          currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          localStorage.setItem('visitor_session_id', currentSessionId)
        }

        setSessionId(currentSessionId)

        // Enviar evento de tracking
        const response = await fetch('/api/track-visitor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page_url: options.pageUrl || window.location.pathname,
            session_id: currentSessionId,
            user_id: options.userId || null,
            referrer: document.referrer || null
          })
        })

        if (response.ok) {
          setIsTracking(true)
          console.log('✅ Visitor tracked successfully')
        }
      } catch (error) {
        console.error('Error tracking visitor:', error)
      }
    }

    // Track inmediatamente
    trackVisitor()

    // Track cada 30 segundos para mantener la sesión activa y ser más visible
    const interval = setInterval(trackVisitor, 30 * 1000)

    return () => clearInterval(interval)
  }, [options.pageUrl, options.userId, options.enabled])

  return {
    sessionId,
    isTracking
  }
}

