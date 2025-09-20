import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, ShoppingBag, CreditCard } from 'lucide-react'
import { supabase, type Ebook } from '../config/supabase'
import { PaymentService } from '../services/paymentService'
import type { User } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

interface CartItem {
  id: string
  ebook_id: string
  ebook: Ebook
}

interface CartProps {
  user: User | null
}

export default function Cart({ user }: CartProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (user) {
      fetchCartItems()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchCartItems = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          ebook_id,
          ebook:ebooks(*)
        `)
        .eq('user_id', user.id)

      if (error) throw error
      setCartItems(data || [])
    } catch (error) {
      console.error('Error fetching cart items:', error)
      toast.error('Error al cargar el carrito')
    } finally {
      setLoading(false)
    }
  }

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      setCartItems(prev => prev.filter(item => item.id !== itemId))
      toast.success('Libro eliminado del carrito')
    } catch (error) {
      console.error('Error removing from cart:', error)
      toast.error('Error al eliminar del carrito')
    }
  }

  const clearCart = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error

      setCartItems([])
      toast.success('Carrito vaciado')
    } catch (error) {
      console.error('Error clearing cart:', error)
      toast.error('Error al vaciar el carrito')
    }
  }

  const processPayment = async () => {
    if (!user || cartItems.length === 0) return

    setProcessing(true)
    try {
      // Preparar datos para WebPay
      const buyOrder = PaymentService.generateBuyOrder()
      const sessionId = PaymentService.generateSessionId(user.id)
      const amount = Math.round(total * 100) // WebPay requiere centavos
      
      const paymentIntent = {
        buyOrder,
        sessionId,
        amount,
        userId: user.id,
        cartItems: cartItems.map(item => ({
          ebook_id: item.ebook_id,
          price: item.ebook.price,
          title: item.ebook.title
        }))
      }

      // Crear transacción en WebPay
      const transaction = await PaymentService.createTransaction(paymentIntent)
      
      toast.success('Redirigiendo a WebPay...')
      
      // Redirigir a WebPay real
      window.location.href = `${transaction.url}?token_ws=${transaction.token}`
      
    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error('Error al procesar el pago')
      setProcessing(false)
    }
  }

  const total = cartItems.reduce((sum, item) => sum + item.ebook.price, 0)

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Inicia sesión para ver tu carrito
          </h2>
          <Link to="/login" className="btn-primary">
            Iniciar sesión
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg p-6">
                <div className="flex space-x-4">
                  <div className="bg-gray-300 h-24 w-16 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="bg-gray-300 h-4 rounded w-3/4"></div>
                    <div className="bg-gray-300 h-4 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Carrito de Compras</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Tu carrito está vacío
            </h2>
            <p className="text-gray-600 mb-8">
              Descubre nuestros ebooks y añade algunos a tu carrito
            </p>
            <Link to="/catalogo" className="btn-primary">
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de productos */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {cartItems.length} {cartItems.length === 1 ? 'libro' : 'libros'}
                </h2>
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Vaciar carrito
                </button>
              </div>

              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex space-x-4">
                    <img
                      src={item.ebook.cover_image || 'https://via.placeholder.com/100x140'}
                      alt={item.ebook.title}
                      className="w-16 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {item.ebook.title}
                      </h3>
                      <p className="text-gray-600 mb-2">por {item.ebook.author}</p>
                      {item.ebook.category && (
                        <span className="inline-block bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full mb-2">
                          {item.ebook.category}
                        </span>
                      )}
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {item.ebook.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <span className="text-xl font-bold text-primary-600">
                        €{item.ebook.price}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen de compra */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Resumen de compra
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">€{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Descuentos</span>
                    <span className="text-green-600">-€0.00</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-primary-600">
                        €{total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={processPayment}
                  disabled={processing}
                  className="w-full btn-primary py-3 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>
                    {processing ? 'Redirigiendo a WebPay...' : 'Pagar con WebPay'}
                  </span>
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Pago seguro con encriptación SSL
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
