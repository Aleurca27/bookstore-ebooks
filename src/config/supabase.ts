import { createClient } from '@supabase/supabase-js'

// Credenciales de Supabase (usando variables de entorno en producción)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fdxmbeijgmlgefesnhnd.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkeG1iZWlqZ21sZ2VmZXNuaG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDY1MzYsImV4cCI6MjA3Mzk4MjUzNn0.HZ-7CADEMgd53MtJo-ryxVh2Qh9u8mVZfksOmRe5YUU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos de datos para TypeScript
export interface Ebook {
  id: string
  title: string
  author: string
  description: string
  price: number
  cover_image: string
  file_url: string
  category: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  age?: number
  gender?: string
  created_at: string
}

export interface Purchase {
  id: string
  user_id: string
  ebook_id: string
  amount: number
  stripe_payment_intent_id: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
}
