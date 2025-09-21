-- ========================================
-- AGREGAR CAMPO GÉNERO AL REGISTRO
-- ========================================

-- 1. AGREGAR COLUMNA GÉNERO (solo si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'gender'
    ) THEN
        ALTER TABLE profiles ADD COLUMN gender VARCHAR(20);
    END IF;
END $$;

-- 2. ACTUALIZAR FUNCIÓN handle_new_user para incluir género
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, age, gender)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'avatar_url',
    CASE 
      WHEN NEW.raw_user_meta_data->>'age' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'age')::INTEGER 
      ELSE NULL 
    END,
    NEW.raw_user_meta_data->>'gender'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ACTUALIZAR VISTA DE USUARIOS COMPLETA
CREATE OR REPLACE VIEW user_complete_info AS
SELECT 
    -- Datos básicos
    au.id,
    au.email,
    au.created_at as registered_at,
    au.last_sign_in_at,
    au.email_confirmed_at,
    
    -- Datos del perfil
    p.full_name,
    p.age,
    p.gender,
    p.is_admin,
    
    -- Estado
    CASE 
        WHEN au.email_confirmed_at IS NOT NULL THEN 'Confirmado'
        WHEN au.confirmation_sent_at IS NOT NULL THEN 'Pendiente'
        ELSE 'Sin confirmar'
    END as status,
    
    -- Días desde registro
    EXTRACT(DAYS FROM NOW() - au.created_at)::INTEGER as days_registered

FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

-- 4. ACTUALIZAR FUNCIÓN DE ESTADÍSTICAS
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE(
    metric TEXT,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'Total usuarios'::TEXT, COUNT(*) FROM auth.users
    UNION ALL
    SELECT 'Confirmados'::TEXT, COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL
    UNION ALL
    SELECT 'Con edad'::TEXT, COUNT(*) FROM public.profiles WHERE age IS NOT NULL
    UNION ALL
    SELECT 'Con género'::TEXT, COUNT(*) FROM public.profiles WHERE gender IS NOT NULL
    UNION ALL
    SELECT 'Masculino'::TEXT, COUNT(*) FROM public.profiles WHERE gender = 'masculino'
    UNION ALL
    SELECT 'Femenino'::TEXT, COUNT(*) FROM public.profiles WHERE gender = 'femenino'
    UNION ALL
    SELECT 'Otro/Prefiero no decir'::TEXT, COUNT(*) FROM public.profiles WHERE gender IN ('otro', 'no_decir')
    UNION ALL
    SELECT 'Administradores'::TEXT, COUNT(*) FROM public.profiles WHERE is_admin = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- CONSULTAS ÚTILES
-- ========================================

-- Ver usuarios con género
-- SELECT email, full_name, age, gender FROM user_complete_info WHERE gender IS NOT NULL;

-- Estadísticas por género
-- SELECT gender, COUNT(*) as total FROM profiles WHERE gender IS NOT NULL GROUP BY gender;
