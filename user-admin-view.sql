-- ========================================
-- VISTA DE ADMINISTRACIÓN DE USUARIOS
-- Script corregido y simplificado
-- ========================================

-- 1. CREAR VISTA BÁSICA DE USUARIOS (sin RLS, solo para consultas directas)
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

-- 2. FUNCIÓN PARA ESTADÍSTICAS GENERALES
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
    SELECT 'Administradores'::TEXT, COUNT(*) FROM public.profiles WHERE is_admin = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FUNCIÓN PARA BUSCAR USUARIO POR EMAIL
CREATE OR REPLACE FUNCTION search_user(email_search TEXT)
RETURNS TABLE(
    id UUID,
    email TEXT,
    full_name VARCHAR,
    age INTEGER,
    status TEXT,
    registered_at TIMESTAMPTZ,
    last_login TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uci.id,
        uci.email,
        uci.full_name,
        uci.age,
        uci.status,
        uci.registered_at,
        uci.last_sign_in_at
    FROM user_complete_info uci
    WHERE uci.email ILIKE '%' || email_search || '%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- CONSULTAS ÚTILES PARA COPIAR Y PEGAR
-- ========================================

-- Ver todos los usuarios
-- SELECT * FROM user_complete_info;

-- Ver estadísticas
-- SELECT * FROM get_user_stats();

-- Buscar usuario por email
-- SELECT * FROM search_user('test');

-- Usuarios registrados hoy
-- SELECT email, full_name, age FROM user_complete_info WHERE DATE(registered_at) = CURRENT_DATE;

-- Usuarios con edad registrada
-- SELECT email, full_name, age, status FROM user_complete_info WHERE age IS NOT NULL;

-- Usuarios sin confirmar
-- SELECT email, full_name, days_registered FROM user_complete_info WHERE status = 'Sin confirmar';

-- Últimos 5 usuarios registrados
-- SELECT email, full_name, age, registered_at FROM user_complete_info LIMIT 5;
