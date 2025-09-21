-- ========================================
-- VISTA COMPLETA DE USUARIOS
-- Combina datos de auth.users y public.profiles
-- ========================================

-- 1. CREAR VISTA DE USUARIOS COMPLETA
CREATE OR REPLACE VIEW user_complete_info AS
SELECT 
    -- Datos de autenticación
    au.id,
    au.email,
    au.email_confirmed_at,
    au.created_at as registered_at,
    au.last_sign_in_at,
    au.confirmation_sent_at,
    
    -- Datos del perfil
    p.full_name,
    p.age,
    p.avatar_url,
    p.is_admin,
    p.created_at as profile_created_at,
    p.updated_at as profile_updated_at,
    
    -- Metadatos adicionales
    au.raw_user_meta_data,
    au.raw_app_meta_data,
    
    -- Estado del usuario
    CASE 
        WHEN au.email_confirmed_at IS NOT NULL THEN 'Confirmado'
        WHEN au.confirmation_sent_at IS NOT NULL THEN 'Pendiente confirmación'
        ELSE 'Sin confirmar'
    END as status,
    
    -- Tiempo desde registro
    EXTRACT(DAYS FROM NOW() - au.created_at) as days_since_registration,
    
    -- Información de actividad
    CASE 
        WHEN au.last_sign_in_at IS NOT NULL THEN 
            EXTRACT(DAYS FROM NOW() - au.last_sign_in_at)
        ELSE NULL
    END as days_since_last_login

FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

-- 2. CREAR FUNCIÓN PARA ESTADÍSTICAS DE USUARIOS
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS TABLE(
    metric VARCHAR,
    value BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'Total de usuarios'::VARCHAR, COUNT(*)::BIGINT FROM auth.users
    UNION ALL
    SELECT 'Usuarios confirmados'::VARCHAR, COUNT(*)::BIGINT FROM auth.users WHERE email_confirmed_at IS NOT NULL
    UNION ALL
    SELECT 'Usuarios con perfil completo'::VARCHAR, COUNT(*)::BIGINT FROM public.profiles WHERE full_name IS NOT NULL
    UNION ALL
    SELECT 'Usuarios con edad registrada'::VARCHAR, COUNT(*)::BIGINT FROM public.profiles WHERE age IS NOT NULL
    UNION ALL
    SELECT 'Administradores'::VARCHAR, COUNT(*)::BIGINT FROM public.profiles WHERE is_admin = true
    UNION ALL
    SELECT 'Usuarios activos (últimos 30 días)'::VARCHAR, COUNT(*)::BIGINT FROM auth.users WHERE last_sign_in_at > NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CREAR FUNCIÓN PARA OBTENER DETALLES DE UN USUARIO
CREATE OR REPLACE FUNCTION get_user_details(user_email TEXT)
RETURNS TABLE(
    id UUID,
    email TEXT,
    full_name VARCHAR,
    age INTEGER,
    is_admin BOOLEAN,
    status TEXT,
    registered_at TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    total_purchases BIGINT,
    cart_items BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uci.id,
        uci.email,
        uci.full_name,
        uci.age,
        uci.is_admin,
        uci.status,
        uci.registered_at,
        uci.last_sign_in_at,
        COALESCE(purchase_count.total, 0) as total_purchases,
        COALESCE(cart_count.total, 0) as cart_items
    FROM user_complete_info uci
    LEFT JOIN (
        SELECT user_id, COUNT(*) as total 
        FROM purchases 
        WHERE status = 'completed' 
        GROUP BY user_id
    ) purchase_count ON uci.id = purchase_count.user_id
    LEFT JOIN (
        SELECT user_id, COUNT(*) as total 
        FROM cart_items 
        GROUP BY user_id
    ) cart_count ON uci.id = cart_count.user_id
    WHERE uci.email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CREAR VISTA CON SEGURIDAD INCORPORADA (solo admins o el propio usuario)
CREATE OR REPLACE VIEW user_complete_info_secure AS
SELECT 
    uci.*
FROM user_complete_info uci
WHERE 
    -- Solo admins pueden ver todos los usuarios
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_admin = true
    )
    -- O el usuario puede ver solo su propia información
    OR auth.uid()::TEXT = uci.id::TEXT;

-- 5. CONSULTAS ÚTILES PARA ADMINISTRADORES

-- Ver todos los usuarios con información completa
-- SELECT * FROM user_complete_info;

-- Ver estadísticas generales
-- SELECT * FROM get_user_statistics();

-- Ver detalles de un usuario específico
-- SELECT * FROM get_user_details('usuario@ejemplo.com');

-- Ver usuarios registrados hoy
-- SELECT email, full_name, age, status FROM user_complete_info WHERE DATE(registered_at) = CURRENT_DATE;

-- Ver usuarios que nunca han iniciado sesión
-- SELECT email, full_name, days_since_registration FROM user_complete_info WHERE last_sign_in_at IS NULL;

-- Ver usuarios más activos
-- SELECT email, full_name, last_sign_in_at FROM user_complete_info WHERE last_sign_in_at IS NOT NULL ORDER BY last_sign_in_at DESC LIMIT 10;
