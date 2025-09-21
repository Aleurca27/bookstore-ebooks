import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../config/supabase'
import { BookOpen } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    age: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Verificar si el usuario ya está autenticado
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/')
      }
    })

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  const handleCustomSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            age: formData.age
          }
        }
      })

      if (error) {
        alert('Error: ' + error.message)
      } else {
        alert('¡Cuenta creada! Revisa tu correo para confirmar tu cuenta.')
        setShowCustomForm(false)
      }
    } catch (error) {
      alert('Error inesperado: ' + error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <BookOpen className="h-12 w-12 text-primary-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Accede a tu cuenta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          O{' '}
          <span className="font-medium text-primary-600">
            crea una cuenta nueva para comenzar
          </span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {!showCustomForm ? (
            <>
              <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#2563eb',
                        brandAccent: '#1d4ed8',
                      },
                    },
                  },
                }}
                localization={{
                  variables: {
                    sign_in: {
                      email_label: 'Correo electrónico',
                      password_label: 'Contraseña',
                      email_input_placeholder: 'Tu correo electrónico',
                      password_input_placeholder: 'Tu contraseña',
                      button_label: 'Iniciar sesión',
                      loading_button_label: 'Iniciando sesión...',
                      social_provider_text: 'Continuar con {{provider}}',
                      link_text: '¿Ya tienes una cuenta? Inicia sesión',
                    },
                    sign_up: {
                      email_label: 'Correo electrónico',
                      password_label: 'Contraseña',
                      email_input_placeholder: 'Tu correo electrónico',
                      password_input_placeholder: 'Tu contraseña',
                      button_label: 'Crear cuenta',
                      loading_button_label: 'Creando cuenta...',
                      social_provider_text: 'Continuar con {{provider}}',
                      link_text: '¿No tienes una cuenta? Regístrate',
                      confirmation_text: 'Revisa tu correo para confirmar tu cuenta',
                    },
                    forgotten_password: {
                      email_label: 'Correo electrónico',
                      password_label: 'Contraseña',
                      email_input_placeholder: 'Tu correo electrónico',
                      button_label: 'Enviar instrucciones',
                      loading_button_label: 'Enviando instrucciones...',
                      link_text: '¿Olvidaste tu contraseña?',
                      confirmation_text: 'Revisa tu correo para restablecer tu contraseña',
                    },
                    update_password: {
                      password_label: 'Nueva contraseña',
                      password_input_placeholder: 'Tu nueva contraseña',
                      button_label: 'Actualizar contraseña',
                      loading_button_label: 'Actualizando contraseña...',
                      confirmation_text: 'Tu contraseña ha sido actualizada',
                    },
                  },
                }}
                providers={['google', 'github']}
                redirectTo={`${window.location.origin}/`}
              />
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowCustomForm(true)}
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  📝 Registro completo con edad
                </button>
              </div>
            </>
          ) : (
            <>
              <form onSubmit={handleCustomSignUp} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="tu@email.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                    Nombre completo
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Juan Pérez"
                  />
                </div>

                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                    Edad ⭐
                  </label>
                  <input
                    id="age"
                    type="number"
                    required
                    min="13"
                    max="120"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ej: 25"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {loading ? 'Creando cuenta...' : 'Crear cuenta con edad'}
                </button>
              </form>
              
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowCustomForm(false)}
                  className="text-sm font-medium text-gray-600 hover:text-gray-500"
                >
                  ← Volver al formulario normal
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Al crear una cuenta, aceptas nuestros{' '}
          <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
            Términos de Servicio
          </a>{' '}
          y{' '}
          <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
            Política de Privacidad
          </a>
        </p>
      </div>
    </div>
  )
}
