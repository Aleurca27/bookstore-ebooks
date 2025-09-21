import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../config/supabase'
import { BookOpen } from 'lucide-react'
import { Icon } from '@iconify/react'

export default function Login() {
  const navigate = useNavigate()
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    age: '',
    gender: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
    setError('')
    setSuccess('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            age: formData.age,
            gender: formData.gender
          }
        }
      })

      if (error) {
        // Manejo específico de errores comunes
        if (error.message.includes('User already registered')) {
          setError('Este correo ya está registrado. Intenta iniciar sesión o usa otro correo.')
        } else if (error.message.includes('Invalid email')) {
          setError('📧 Por favor ingresa un correo electrónico válido.')
        } else if (error.message.includes('Password should be at least')) {
          setError('🔒 La contraseña debe tener al menos 6 caracteres.')
        } else if (error.message.includes('Signup is disabled')) {
          setError('🚫 El registro está temporalmente deshabilitado.')
        } else {
          setError('❌ Error: ' + error.message)
        }
      } else {
        setSuccess('¡Cuenta creada exitosamente! Revisa tu correo para confirmar tu cuenta.')
        // Limpiar formulario después de éxito
        setFormData({
          email: '',
          password: '',
          fullName: '',
          age: '',
          gender: ''
        })
        // Opcional: volver al formulario normal después de 3 segundos
        setTimeout(() => {
          setShowCustomForm(false)
          setSuccess('')
        }, 3000)
      }
    } catch (error) {
      setError('💥 Error inesperado. Por favor intenta nuevamente.')
      console.error('Error de registro:', error)
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
                {/* Mensajes de error y éxito */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                    {success}
                  </div>
                )}
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({...formData, email: e.target.value})
                      if (error) setError('') // Limpiar error al escribir
                    }}
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
                    <span className="flex items-center">
                      Edad <Icon icon="material-symbols:star" className="w-4 h-4 ml-1 text-yellow-500" />
                    </span>
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

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                    Género 👤
                  </label>
                  <select
                    id="gender"
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Selecciona tu género</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                    <option value="no_decir">Prefiero no decir</option>
                  </select>
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
