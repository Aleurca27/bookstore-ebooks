import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import type { User } from '@supabase/supabase-js'

export const useCartCount = (user: User | null) => {
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    if (!user) {
      setCartCount(0)
      return
    }

    const fetchCartCount = async () => {
      try {
        const { count, error } = await supabase
          .from('cart_items')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        if (error) throw error
        setCartCount(count || 0)
      } catch (error) {
        console.error('Error fetching cart count:', error)
      }
    }

    fetchCartCount()

    // Suscribirse a cambios en el carrito
    const subscription = supabase
      .channel('cart_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchCartCount()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  return cartCount
}
