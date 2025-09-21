import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../config/supabase'
import { BookOpen } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()

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
            additionalData={[
              {
                key: 'age',
                label: 'Edad',
                placeholder: 'Ingresa tu edad',
                type: 'number'
              },
              {
                key: 'full_name',
                label: 'Nombre completo',
                placeholder: 'Tu nombre completo'
              }
            ]}
            providers={['google', 'github']}
            redirectTo={`${window.location.origin}/`}
          />
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
